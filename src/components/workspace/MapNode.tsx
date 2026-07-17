'use client'

import { memo, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { ImageIcon } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { createClient } from '@/utils/supabase/client'

export type MapNodeData = {
  title?: string
  mapImage?: string | null
  entityId?: string
  /** @deprecated fallback for legacy nodes */
  label?: string
}

type TokenType = 'hero' | 'npc' | 'poi' | 'check' | 'enemies' | 'crowd' | 'loot'

function parseDragPayload(dataTransfer: DataTransfer): { id: string; type: string } | null {
  const tryParse = (raw: string) => {
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      return parsed?.id && parsed?.type ? parsed : null
    } catch {
      return null
    }
  }
  return tryParse(dataTransfer.getData('application/json')) ?? tryParse(dataTransfer.getData('text/plain'))
}

function resolveEntity(payload: { id: string; type: string }) {
  const state = useWorkspaceStore.getState() as any
  const categoryMap: Record<string, string> = {
    hero: 'heroes',
    heroes: 'heroes',
    npc: 'npcs',
    npcs: 'npcs',
    enemies: 'enemies',
    crowd: 'crowd',
    loot: 'loot',
    poi: 'interactive',
    check: 'interactive',
    interactive: 'interactive',
  }
  const category = categoryMap[payload.type] || payload.type
  const entity = state[category]?.[payload.id]
  if (!entity) return null

  let tokenType: TokenType
  if (payload.type === 'heroes' || payload.type === 'hero') tokenType = 'hero'
  else if (payload.type === 'npcs' || payload.type === 'npc') tokenType = 'npc'
  else if (payload.type === 'interactive') tokenType = entity.type || 'poi'
  else tokenType = payload.type as TokenType

  return { entity, tokenType }
}

function MapNode({ id, data }: NodeProps<MapNodeData>) {
  console.log('MapNode рендерится')
  const title = data.title || data.label || 'Без названия'
  const mapImage = data.mapImage
  const locationKey = data.entityId || id
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isUploading, setIsUploading] = useState(false)

  const tokensMap = useWorkspaceStore((state) => state.localMaps[locationKey]?.tokens)
  const tokens = Object.values(tokensMap || {})
  const spawnEntityToMap = useWorkspaceStore((state) => state.spawnEntityToMap)
  const updateNodeData = useWorkspaceStore((state) => state.updateNodeData)

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    console.log('--- 1. Функция вызвана ---')

    const file = e.target.files?.[0]
    if (!file) {
      console.log('--- 2. Файл не выбран ---')
      return
    }

    console.log('--- 3. Файл найден, начинаем загрузку ---', file.name)

    try {
      setIsUploading(true)
      const supabase = createClient()
      const fileName = `${id}-${Date.now()}-${file.name}`

      const { error } = await supabase.storage.from('maps').upload(fileName, file)
      if (error) throw error

      const { data: publicUrlData } = supabase.storage.from('maps').getPublicUrl(fileName)
      updateNodeData(id, 'mapImage', publicUrlData.publicUrl)
    } catch (error) {
      console.error('--- 4. ОШИБКА в блоке try-catch ---', error)
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    const payload = parseDragPayload(e.dataTransfer)
    if (!payload) return

    const resolved = resolveEntity(payload)
    if (!resolved) return

    const rect = e.currentTarget.getBoundingClientRect()
    const localX = ((e.clientX - rect.left) / rect.width) * e.currentTarget.offsetWidth
    const localY = ((e.clientY - rect.top) / rect.height) * e.currentTarget.offsetHeight

    spawnEntityToMap(locationKey, resolved.entity, resolved.tokenType, localX, localY)
  }

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-zinc-500 !w-2.5 !h-2.5 !border-2 !border-zinc-800"
      />

      {mapImage ? (
        <div
          className="relative overflow-hidden rounded-xl border border-zinc-700/80 shadow-2xl shadow-black/60 nodrag nopan"
          style={{ width: 600, height: 400 }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-zinc-950 pointer-events-none"
            style={{ backgroundImage: `url(${mapImage})` }}
          />
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.55) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.55) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <div className="absolute top-3 left-3 z-10 max-w-[85%] pointer-events-none">
            <span className="inline-block px-2.5 py-1 rounded-md bg-zinc-950/85 border border-zinc-700/80 text-zinc-100 text-xs font-bold tracking-wide shadow-lg backdrop-blur-sm truncate">
              {title}
            </span>
          </div>

          {tokens.map((token) => (
            <div
              key={token.id}
              className="absolute z-20 w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500 border-2 border-white shadow-lg flex items-center justify-center pointer-events-none"
              style={{ left: token.x, top: token.y }}
              title={token.entityId}
            >
              <span className="text-[9px] font-black text-white uppercase leading-none">
                {(token.type || '?').slice(0, 2)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="group relative min-w-[160px] max-w-[240px] px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700/80 shadow-xl shadow-black/40">
          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400/80 mb-1.5">
            Локация
          </div>
          <div className="text-sm font-bold text-zinc-100 leading-snug truncate pr-6">
            {title}
          </div>

          <button
            type="button"
            title="Загрузить фон"
            disabled={isUploading}
            className="nodrag nopan pointer-events-auto absolute top-1.5 right-1.5 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-100 disabled:pointer-events-none disabled:text-zinc-400"
            onPointerDown={(e) => {
              console.log('Кнопка загрузки нажата')
              console.log('Ref current:', fileInputRef.current)
              e.stopPropagation()
              if (!isUploading) fileInputRef.current?.click()
            }}
          >
            {isUploading ? (
              <span className="text-[9px] font-bold whitespace-nowrap">Загрузка...</span>
            ) : (
              <ImageIcon className="w-3.5 h-3.5" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isUploading}
            onChange={handleImageUpload}
          />
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-zinc-500 !w-2.5 !h-2.5 !border-2 !border-zinc-800"
      />
    </>
  )
}

export default memo(MapNode)
