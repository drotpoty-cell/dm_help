'use client'

export interface CompressImageOptions {
  /** Максимальная ширина/высота результата в px — большая сторона ужимается до этого значения,
   *  пропорции сохраняются. */
  maxDimension?: number
  /** Качество кодирования 0..1 (актуально для WebP/JPEG, игнорируется для PNG). */
  quality?: number
  /** MIME-тип результата. */
  mimeType?: 'image/webp' | 'image/jpeg'
}

const DEFAULT_OPTIONS: Required<CompressImageOptions> = {
  maxDimension: 1920,
  quality: 0.8,
  mimeType: 'image/webp',
}

/**
 * Сжимает изображение на клиенте перед отправкой в Supabase Storage / IndexedDB (Задача 2).
 * Ограничивает максимальное разрешение и перекодирует в WebP через Canvas API — ГМ может
 * закинуть исходный файл на 10-20МБ (например, полноразмерный арт), а по факту "улетает"
 * уже пара сотен килобайт без заметной потери качества для отображения в интерфейсе
 * (карточки сущностей, узлы карты, фоны боевых карт).
 *
 * Намеренно НЕ применяется к GIF на уровне вызывающего кода (см. uploadEntityImage.ts) —
 * canvas сплющивает анимацию в один кадр, что для анимированных иллюстраций является
 * потерей данных, а не сжатием.
 *
 * Best-effort: при любой ошибке (повреждённый файл, недоступный Canvas/2D-контекст и т.п.)
 * бросает исключение — вызывающий код сам решает, откатываться ли на оригинальный файл.
 */
export async function compressImage(file: File, options: CompressImageOptions = {}): Promise<File> {
  const { maxDimension, quality, mimeType } = { ...DEFAULT_OPTIONS, ...options }

  const bitmap = await createImageBitmap(file)
  try {
    const { width, height } = fitWithinBounds(bitmap.width, bitmap.height, maxDimension)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D-контекст недоступен в этом браузере')
    ctx.drawImage(bitmap, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mimeType, quality))
    if (!blob) throw new Error('Canvas.toBlob() не вернул данные')

    // Если пережатая версия неожиданно оказалась тяжелее оригинала (бывает с уже сильно
    // сжатыми JPEG маленького разрешения) — отдаём оригинал, сжатие того не стоило.
    if (blob.size >= file.size) return file

    return new File([blob], replaceExtension(file.name, mimeType), {
      type: mimeType,
      lastModified: Date.now(),
    })
  } finally {
    bitmap.close()
  }
}

function fitWithinBounds(width: number, height: number, maxDimension: number): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) return { width, height }
  const scale = maxDimension / Math.max(width, height)
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

function replaceExtension(name: string, mimeType: string): string {
  const ext = mimeType === 'image/webp' ? 'webp' : 'jpg'
  const lastDot = name.lastIndexOf('.')
  const base = lastDot >= 0 ? name.slice(0, lastDot) : name
  return `${base}.${ext}`
}
