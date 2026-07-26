'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { compressImage } from '@/utils/compressImage'

const DB_NAME = 'GMAssistant_Maps'
const STORE_NAME = 'backgrounds'

/** Сырой файл, который ГМ выбирает в проводнике для кастомного боевого фона — проверяется
 *  ДО сжатия/чтения в base64 (Задача 3). Это офлайн-хранилище одного браузера, поэтому
 *  порог заметно выше, чем для облачных картинок Архива (30МБ, uploadEntityImage.ts) — но
 *  всё равно нужна защита от случайного выбора видео/огромного скана на несколько сотен МБ,
 *  которые забьют IndexedDB и будут долго кодироваться в base64 на главном потоке. */
export const MAX_LOCAL_BACKGROUND_BYTES = 50 * 1024 * 1024 // 50 МБ
const ALLOWED_LOCAL_BACKGROUND_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const COMPRESSIBLE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

export class MapBackgroundError extends Error {}

function openBackgroundsDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function getStoredBackground(locationId: string): Promise<string | null> {
  try {
    const db = await openBackgroundsDB()
    return await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(locationId)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null // IndexedDB недоступен (приватный режим и т.п.) — не роняем интерфейс
  }
}

async function putStoredBackground(locationId: string, base64: string): Promise<void> {
  try {
    const db = await openBackgroundsDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(base64, locationId)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // Не удалось сохранить в IndexedDB — фон останется только на время текущей сессии
  }
}

async function deleteStoredBackground(locationId: string): Promise<void> {
  try {
    const db = await openBackgroundsDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(locationId)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // ignore
  }
}

/**
 * Единственный источник правды для тяжёлых (base64) фонов тактических карт.
 *
 * КРИТИЧЕСКОЕ ПРАВИЛО: base64-байты фона никогда не попадают в Zustand-стор — они
 * держатся только в локальном состоянии этого хука и в IndexedDB. Стор (createMapSlice,
 * localMaps[locationId]) хранит только лёгкие метаданные карты (gridSize, offset, tokens,
 * ...) и никогда не видит сами байты изображения — поэтому partialize (localStorage) и
 * buildCampaignSnapshot (Supabase JSONB) физически не могут случайно утащить их с собой.
 *
 * Приоритет фона (требование Блока 3, п.1):
 * 1. Кастомный фон, загруженный ГМом именно для этой боевой карты — IndexedDB.
 * 2. Автофон — изображение карточки локации из Архива (`location.mapImage`, лёгкий
 *    публичный URL в Supabase Storage, см. Блок 2) — рендерится сам по себе, без единого
 *    действия ГМа, как только у локации появляется картинка.
 * 3. Ничего.
 *
 * Почему IndexedDB, а не облако (Задача 3 — это фича, а не костыль): кастомный боевой фон
 * нужен ГМу мгновенно, за столом, без сетевого запроса — и не должен раздувать общий JSON-
 * снапшот кампании, который целиком уходит в Supabase при каждом автосохранении. Расплата
 * за скорость — кастомный фон не путешествует на другое устройство ГМа (в отличие от
 * автофона из Архива, который живёт в облаке и есть везде). Это осознанный компромисс, а
 * не пропущенная синхронизация.
 *
 * Перед записью в IndexedDB сжимаемые типы (PNG/JPEG/WebP) прогоняются через тот же
 * `compressImage`, что и облачные картинки Архива (Задача 2/3) — с более щедрым лимитом
 * разрешения (2560px), так как боевые карты часто нужны с бо́льшей детализацией, чем
 * иконки сущностей. Это не про экономию трафика (файл никуда не уходит по сети), а про
 * то, чтобы IndexedDB и рендеринг `<img>` оставались быстрыми даже для сканов на 20-30МБ.
 */
export function useMapBackground(locationId: string | null) {
  const archiveImage =
    useWorkspaceStore((s) => (locationId ? s.locations[locationId]?.mapImage : null)) || null

  const [customBackground, setCustomBackground] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const requestIdRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    const requestId = ++requestIdRef.current

    Promise.resolve().then(async () => {
      if (cancelled) return
      if (!locationId) {
        setCustomBackground(null)
        return
      }
      setIsLoading(true)
      const stored = await getStoredBackground(locationId)
      if (cancelled || requestIdRef.current !== requestId) return // локацию сменили, пока грузили — отбрасываем
      setCustomBackground(stored)
      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [locationId])

  const uploadBackground = useCallback(
    async (file: File) => {
      if (!locationId) return

      if (!ALLOWED_LOCAL_BACKGROUND_TYPES.includes(file.type)) {
        throw new MapBackgroundError(`Недопустимый тип файла: ${file.type}`)
      }
      if (file.size > MAX_LOCAL_BACKGROUND_BYTES) {
        const limitMb = Math.round(MAX_LOCAL_BACKGROUND_BYTES / (1024 * 1024))
        const fileMb = (file.size / (1024 * 1024)).toFixed(1)
        throw new MapBackgroundError(`Файл превышает максимальный размер ${limitMb}МБ: ${fileMb}МБ`)
      }

      setIsUploading(true)
      try {
        let fileToStore: File = file
        if (COMPRESSIBLE_TYPES.has(file.type)) {
          try {
            fileToStore = await compressImage(file, { maxDimension: 2560, quality: 0.85 })
          } catch (error) {
            // Best-effort, как и в uploadEntityImage.ts — не блокируем загрузку боевого
            // фона, если Canvas недоступен/файл нестандартный, просто берём оригинал.
            console.warn('Не удалось сжать боевой фон на клиенте, сохраняем оригинал:', error)
            fileToStore = file
          }
        }

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(fileToStore)
        })
        setCustomBackground(base64) // мгновенный визуальный фидбек, ещё до записи в IndexedDB
        await putStoredBackground(locationId, base64)
      } finally {
        setIsUploading(false)
      }
    },
    [locationId]
  )

  const resetToArchiveImage = useCallback(async () => {
    if (!locationId) return
    setCustomBackground(null)
    await deleteStoredBackground(locationId)
  }, [locationId])

  return {
    /** То, что реально нужно рендерить как фон боевой карты прямо сейчас. */
    backgroundImage: customBackground || archiveImage,
    /** true, если это загруженный ГМом кастомный фон, а не автофон из Архива. */
    hasCustomBackground: !!customBackground,
    /** Фон карточки локации из Архива, если есть — для UI-подсказок ("вернуться к фону из Архива"). */
    archiveImage,
    isLoading,
    /** true во время сжатия+записи кастомного фона в IndexedDB (Задача 3) — для спиннера/
     *  дизейбла кнопки на тулбаре, чтобы повторный клик не запустил параллельную загрузку. */
    isUploading,
    uploadBackground,
    resetToArchiveImage,
  }
}
