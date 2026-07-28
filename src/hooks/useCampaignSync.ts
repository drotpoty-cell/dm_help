'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { createClient } from '@/utils/supabase/client'
import { hasLegacyLibraryData } from '@/utils/migrateLegacyLibrary'
import { sanitizeCampaignSnapshot } from '@/utils/sanitizeCampaignSnapshot'

export type CampaignSyncStatus = 'loading' | 'idle' | 'saving' | 'saved' | 'error'

const AUTOSAVE_DEBOUNCE_MS = 2000

/**
 * Поля кампании, которые реально нужно сохранять в облако (Supabase, колонка campaigns.map_data).
 * Специально исключены чисто локальные/UI-поля (activeView, viewedEntityId, scratchpad,
 * savedWorlds, activeWorldId) — они не имеют смысла на другом устройстве/сессии.
 */
function buildCampaignSnapshot(state: ReturnType<typeof useWorkspaceStore.getState>) {
  // Фоны тактических карт кэшируются в IndexedDB на конкретном устройстве (см. LocalMapBoard),
  // а в самом Zustand-состоянии могут лежать как тяжёлые base64-строки — их не нужно (и вредно)
  // гонять в облако при каждом автосохранении.
  const lightLocalMaps = Object.entries(state.localMaps).reduce((acc, [key, val]) => {
    acc[key] = { ...val, backgroundImage: null }
    return acc
  }, {} as Record<string, unknown>)

  return {
    nodes: state.nodes,
    edges: state.edges,
    story: state.story,
    plotNodes: state.plotNodes,
    heroes: state.heroes,
    enemies: state.enemies,
    quests: state.quests,
    locations: state.locations,
    secrets: state.secrets,
    loot: state.loot,
    events: state.events,
    factions: state.factions,
    characters: state.characters,
    extras: state.extras,
    bestiary: state.bestiary,
    interactive: state.interactive,
    currentDay: state.currentDay,
    currentHour: state.currentHour,
    weather: state.weather,
    worldSystemPrompt: state.worldSystemPrompt,
    partyLocationId: state.partyLocationId,
    localMaps: lightLocalMaps,
    combat: state.combat,
  }
}

/**
 * Синхронизация текущей кампании с Supabase:
 * 1. При первом открытии кампании на этом устройстве (когда локально ещё нет
 *    сохранённого слепка в savedWorlds) — подтягивает map_data из облака,
 *    чтобы прогресс был виден на любом устройстве, а не только там, где он создавался.
 * 2. После этого — дебаунс-автосохранение: любое реальное изменение данных кампании
 *    (не UI-состояния) с задержкой ~2с пишется обратно в Supabase.
 *
 * Важно: это last-write-wins синхронизация, без учёта конфликтов и без реального
 * времени — двух ГМов, редактирующих одну кампанию одновременно с разных вкладок,
 * она не поддерживает. Для одиночного использования (один ГМ, несколько устройств
 * поочерёдно) этого достаточно.
 */
export function useCampaignSync(campaignId: string | null, hydrated: boolean) {
  const [status, setStatus] = useState<CampaignSyncStatus>('loading')
  // true, если у кампании остались несмигрированные данные под старыми ключами npcs/crowd
  // (кампания создана до слияния категорий). UI может показать кнопку «Мигрировать данные».
  const [hasLegacyData, setHasLegacyData] = useState(false)
  const [campaignName, setCampaignName] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabaseRef = useRef(createClient())
  const lastSavedJsonRef = useRef<string | null>(null)
  const readyRef = useRef(false)

  // Шаг 1: первичная загрузка из облака (один раз на смену кампании)
  useEffect(() => {
    readyRef.current = false
    lastSavedJsonRef.current = null
    let cancelled = false
    // setState откладываем в микротаску, чтобы не звать его синхронно прямо в теле эффекта
    Promise.resolve().then(() => {
      if (!cancelled) setStatus('loading')
    })

    if (!campaignId || !hydrated) return () => { cancelled = true }

    const load = async () => {
      const alreadyHasLocalCopy = Boolean(useWorkspaceStore.getState().savedWorlds[campaignId])

      // Название кампании — лёгкий отдельный запрос, нужен при КАЖДОМ визите (не только
      // при первой загрузке map_data), иначе на повторных визитах индикатор молчал бы.
      const { data: nameData, error: nameError } = await supabaseRef.current
        .from('campaigns')
        .select('name')
        .eq('id', campaignId)
        .single()
      if (!cancelled && !nameError && nameData?.name) setCampaignName(nameData.name)

      if (!alreadyHasLocalCopy) {
        const { data, error } = await supabaseRef.current
          .from('campaigns')
          .select('map_data')
          .eq('id', campaignId)
          .single()

        if (cancelled) return

        if (error) {
          console.error('Не удалось загрузить кампанию из облака:', error)
        } else if (data?.map_data && Object.keys(data.map_data).length > 0) {
          useWorkspaceStore.setState(sanitizeCampaignSnapshot(data.map_data))
        }
      }

      if (cancelled) return
      const loadedState = useWorkspaceStore.getState()
      setHasLegacyData(hasLegacyLibraryData(loadedState as unknown as Record<string, unknown>))
      lastSavedJsonRef.current = JSON.stringify(buildCampaignSnapshot(loadedState))
      readyRef.current = true
      setStatus('idle')
    }

    load()

    return () => {
      cancelled = true
    }
  }, [campaignId, hydrated])

  // Шаг 2: дебаунс-автосохранение при последующих изменениях
  const performSave = useCallback(async (id: string, snapshot: ReturnType<typeof buildCampaignSnapshot>) => {
    const json = JSON.stringify(snapshot)
    if (json === lastSavedJsonRef.current) return true // содержимое не поменялось — нечего сохранять

    setStatus('saving')
    const { error } = await supabaseRef.current
      .from('campaigns')
      .update({ map_data: snapshot })
      .eq('id', id)

    if (error) {
      console.error('Ошибка сохранения кампании:', error)
      setStatus('error')
      return false
    }
    lastSavedJsonRef.current = json
    setStatus('saved')
    return true
  }, [])

  useEffect(() => {
    if (!campaignId || !hydrated) return

    const unsub = useWorkspaceStore.subscribe((state) => {
      if (!readyRef.current || state.activeWorldId !== campaignId) return

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        performSave(campaignId, buildCampaignSnapshot(useWorkspaceStore.getState()))
      }, AUTOSAVE_DEBOUNCE_MS)
    })

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      unsub()
    }
  }, [campaignId, hydrated, performSave])

  /**
   * Принудительная синхронизация "прямо сейчас" (Блок 5 — клик по индикатору открытого
   * мира). Отменяет отложенный debounce-таймер и сохраняет немедленно, вместо ожидания
   * следующего изменения. Это ПУШ локального состояния в облако (та же модель
   * last-write-wins, что и у автосохранения) — не перезатирает локальные данные версией
   * из облака, чтобы не потерять несохранённые правки без явного подтверждения ГМа.
   */
  const forceSync = useCallback(async () => {
    if (!campaignId || !readyRef.current) return
    if (timerRef.current) clearTimeout(timerRef.current)
    await performSave(campaignId, buildCampaignSnapshot(useWorkspaceStore.getState()))
  }, [campaignId, performSave])

  /**
   * Переименование кампании прямо со страницы hub/[id] (Блок 5). Пишем сразу в Supabase
   * (это метаданные — колонка campaigns.name, отдельная от map_data) и обновляем локальный
   * стейт индикатора оптимистично, без ожидания ответа сервера.
   */
  const renameCampaign = useCallback(async (newName: string) => {
    const trimmed = newName.trim()
    if (!campaignId || !trimmed) return false
    setCampaignName(trimmed) // оптимистичное обновление UI
    const { error } = await supabaseRef.current
      .from('campaigns')
      .update({ name: trimmed })
      .eq('id', campaignId)
    if (error) {
      console.error('Не удалось переименовать кампанию:', error)
      return false
    }
    return true
  }, [campaignId])

  return { status, hasLegacyData, forceSync, campaignName, renameCampaign }
}
