import { createClient } from '@/utils/supabase/client'
import { generateId } from '@/utils/id'
import { compressImage } from '@/utils/compressImage'

/**
 * Верхняя граница на СЫРОЙ файл, который ГМ выбирает в проводнике — проверяется в UI ДО
 * попытки сжатия/загрузки (Задача 2). Раньше это было 5МБ и совпадало с реальным лимитом
 * Supabase Storage, из-за чего интерфейс блокировал загрузку качественных артов больше
 * 5МБ. Реальный лимит "что реально долетает до Supabase" теперь закрывает клиентское
 * сжатие ниже (обычно на выходе — сотни килобайт, а не мегабайты) — этот порог остался
 * только как защита от откровенно случайных файлов (видео, выбранное по ошибке, и т.п.),
 * а не как практическое ограничение на качество арта.
 */
export const MAX_IMAGE_UPLOAD_BYTES = 30 * 1024 * 1024 // 30 МБ
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

/**
 * Типы, которые проходят через клиентское сжатие Canvas → WebP. GIF сознательно исключён —
 * canvas сплющивает анимацию в один кадр (см. compressImage.ts) — грузится как есть.
 */
const COMPRESSIBLE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

export type ImageUploadStage = 'compressing' | 'uploading'

/** Приводит имя файла к безопасному для storage-ключа виду (без слэшей и спецсимволов). */
function sanitizeFileName(name: string): string {
  const lastDot = name.lastIndexOf('.')
  const ext = lastDot >= 0 ? name.slice(lastDot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : ''
  const base = (lastDot >= 0 ? name.slice(0, lastDot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .slice(0, 60)
  return ext ? `${base || 'file'}.${ext}` : base || 'file'
}

export class ImageUploadError extends Error {}

/**
 * Загружает изображение в бакет Supabase Storage `maps` и возвращает публичный URL.
 * Общий путь и для фонов локаций на мировой карте (MapNode.tsx), и для универсальных
 * аватаров/иллюстраций любой сущности Архива (Блок 5, InspectorPanel + EntityImageUploader) —
 * один и тот же бакет, одни и те же правила размера/типов/сжатия, чтобы не дублировать их
 * в двух местах (Задача 2: "Унификация загрузки изображений").
 *
 * Перед отправкой в облако сжимаемые типы (PNG/JPEG/WebP) автоматически прогоняются через
 * `compressImage` — ограничение по максимальному разрешению (1920×1920) и перекодирование
 * в WebP с качеством ~0.8. ГМ может закинуть файл на 15-20МБ, а в Supabase Storage реально
 * улетит уже порядка сотен килобайт без заметной потери визуального качества.
 *
 * @param onStageChange необязательный колбэк для UI ("Сжатие..." → "Загрузка...").
 */
export async function uploadEntityImage(
  file: File,
  keyPrefix: string,
  onStageChange?: (stage: ImageUploadStage) => void
): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new ImageUploadError(`Недопустимый тип файла: ${file.type}`)
  }
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    const limitMb = Math.round(MAX_IMAGE_UPLOAD_BYTES / (1024 * 1024))
    const fileMb = (file.size / (1024 * 1024)).toFixed(1)
    throw new ImageUploadError(`Файл превышает максимальный размер ${limitMb}МБ: ${fileMb}МБ`)
  }

  let fileToUpload: File = file
  if (COMPRESSIBLE_TYPES.has(file.type)) {
    onStageChange?.('compressing')
    try {
      fileToUpload = await compressImage(file)
    } catch (error) {
      // Сжатие — best-effort. Если Canvas недоступен или файл повреждён — не блокируем
      // загрузку целиком, просто отправляем оригинал (старое поведение).
      console.warn('Не удалось сжать изображение на клиенте, загружаем оригинал:', error)
      fileToUpload = file
    }
  }

  onStageChange?.('uploading')

  const supabase = createClient()
  const fileName = `${generateId(keyPrefix)}-${sanitizeFileName(fileToUpload.name)}`

  const { error } = await supabase.storage.from('maps').upload(fileName, fileToUpload)
  if (error) throw new ImageUploadError(error.message)

  const { data } = supabase.storage.from('maps').getPublicUrl(fileName)
  if (!data?.publicUrl) throw new ImageUploadError('Supabase не вернул публичный URL после загрузки')
  return data.publicUrl
}
