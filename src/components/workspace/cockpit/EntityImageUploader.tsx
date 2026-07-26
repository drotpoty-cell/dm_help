'use client'

import { useRef, useState } from 'react'
import { ImageIcon, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { uploadEntityImage, ImageUploadError } from '@/utils/uploadEntityImage'

/**
 * Универсальный загрузчик изображения для карточки любой категории Архива — герой, NPC,
 * враг, лут, квест и т.д. Рендерится один раз в `InspectorPanel`, а не в каждой из 13 форм
 * `archive/*Form.tsx` по отдельности (тот же принцип единой точки, что и `<fieldset
 * disabled>` для режима игрока в Блоке 4).
 *
 * Для категории `locations` вызывающий код должен передавать/писать `mapImage` (то же
 * поле, что уже используют мировая карта и автофон тактической карты, см.
 * `hooks/useMapBackground.ts`) — здесь это просто "картинка", откуда именно она берётся,
 * этому компоненту не важно.
 */
export function EntityImageUploader({
  imageUrl,
  onChange,
  entityId,
  disabled,
}: {
  imageUrl?: string | null
  onChange: (url: string | null) => void
  entityId: string
  disabled?: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadStage, setUploadStage] = useState<'compressing' | 'uploading' | null>(null)
  const isUploading = uploadStage !== null

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await uploadEntityImage(file, entityId, setUploadStage)
      onChange(url)
    } catch (error) {
      const message = error instanceof ImageUploadError ? error.message : 'Не удалось загрузить изображение'
      console.error('Ошибка загрузки изображения сущности:', error)
      toast.error(message)
    } finally {
      setUploadStage(null)
      e.target.value = ''
    }
  }

  const uploadingLabel = uploadStage === 'compressing' ? 'Сжатие...' : 'Загрузка...'

  return (
    <div className="mb-4">
      {imageUrl ? (
        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 group">
          {/* eslint-disable-next-line @next/next/no-img-element -- динамические внешние URL из Supabase Storage */}
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || disabled}
              className="flex items-center gap-1.5 bg-zinc-900/90 hover:bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-3 h-3" /> Заменить
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={disabled}
              className="flex items-center gap-1.5 bg-zinc-900/90 hover:bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" /> Удалить
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || disabled}
          className="w-full h-28 rounded-xl border-2 border-dashed border-zinc-800 hover:border-indigo-500 flex flex-col items-center justify-center gap-2 text-zinc-600 hover:text-indigo-400 transition-colors disabled:opacity-50"
        >
          <ImageIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {isUploading ? uploadingLabel : 'Добавить изображение'}
          </span>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={isUploading || disabled}
        onChange={handleUpload}
      />
    </div>
  )
}
