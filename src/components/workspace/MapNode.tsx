'use client'

import { memo, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Handle, Position, useReactFlow, type NodeProps } from 'reactflow'
import { ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { uploadEntityImage, ImageUploadError } from '@/utils/uploadEntityImage'
import { useMapBackground, MapBackgroundError } from '@/hooks/useMapBackground'

export type MapNodeData = {
  title?: string
  mapImage?: string | null
  entityId?: string
  /** Режим/статус локации (Блок «Сменить статус» в ContextMenu) — раньше это был отдельный
   *  reactflow-тип узла (safe/tense/hostile/mystery, см. CustomNodes.tsx) со своей полностью
   *  самостоятельной версткой; теперь это просто бейдж поверх единой карточки MapNode, чтобы
   *  смена статуса не выбрасывала локацию из тактильного дизайна и семантического зума. */
  mode?: 'safe' | 'tense' | 'hostile' | 'mystery'
  /** @deprecated fallback for legacy nodes */
  label?: string
}

/** Размеры тактической доски в единицах канваса (не px экрана — реальный масштаб даёт zoom). */
export const TACTICAL_WIDTH = 960
export const TACTICAL_HEIGHT = 680
/** Размеры компактной карточки локации на глобальной карте. */
const COMPACT_WIDTH = 220

/**
 * Прелоадит фон локации в фоновом Image() и говорит, когда он реально готов к показу.
 * Используется для blur-up перехода — избавляет от "моргания" при первом появлении узла
 * или при возврате к уже открытой локации, когда картинка ещё не закэширована браузером.
 */
function useImagePreload(src: string | null | undefined): boolean {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!src) return
    let cancelled = false
    const img = new window.Image()
    const markLoaded = () => {
      if (!cancelled) setLoadedSrc(src)
    }
    img.onload = markLoaded
    img.onerror = markLoaded
    img.src = src
    if (img.complete && img.naturalWidth > 0) {
      Promise.resolve().then(markLoaded)
    }
    return () => {
      cancelled = true
    }
  }, [src])

  return src != null && loadedSrc === src
}

type TokenType = 'hero' | 'npc' | 'poi' | 'check' | 'enemies' | 'extra' | 'loot'

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
    hero: 'heroes', heroes: 'heroes',
    npc: 'characters', characters: 'characters',
    enemies: 'enemies',
    extra: 'extras', extras: 'extras',
    loot: 'loot',
    poi: 'interactive', check: 'interactive', interactive: 'interactive',
  }
  const category = categoryMap[payload.type] || payload.type
  const entity = state[category]?.[payload.id]
  if (!entity) return null

  let tokenType: TokenType
  if (payload.type === 'heroes' || payload.type === 'hero') tokenType = 'hero'
  else if (payload.type === 'characters' || payload.type === 'npc') tokenType = 'npc'
  else if (payload.type === 'extras' || payload.type === 'extra') tokenType = 'extra'
  else if (payload.type === 'interactive') tokenType = entity.type || 'poi'
  else tokenType = payload.type as TokenType

  return { entity, tokenType }
}

function MapNode({ id, data }: NodeProps<MapNodeData>) {
  const title = data.title || data.label || 'Без названия'
  const locationKey = data.entityId || id

  // Bug 1 fix: тактический режим теперь ПОЛНОСТЬЮ отвязан от уровня зума канваса — он
  // включается только двойным кликом (см. GameTable.diveIntoMap) и выключается только явно
  // (кнопка "Карта мира" / Escape). Раньше `zoom >= TACTICAL_ZOOM_THRESHOLD` заставлял узел
  // схлопываться обратно в карточку при обычном отдалении камеры, чтобы посмотреть на край
  // тактической доски — это и было живым багом.
  const activeLocalMapId = useWorkspaceStore((s) => s.activeLocalMapId)
  const isFocused = activeLocalMapId === locationKey
  const isTactical = isFocused

  return isTactical ? (
    <TacticalBoard locationKey={locationKey} title={title} />
  ) : (
    <>
      {/* Bug 2 fix: точки подключения для маршрутов между локациями — были невидимы
          (opacity-0) и однонаправленны (только низ->верх), из-за чего связи было
          невозможно провести. Теперь 4 стороны, any-to-any — тот же проверенный паттерн,
          что и у легаси-узлов в CustomNodes.tsx (видимая точка-target снизу, прозрачный
          source поверх неё того же размера, чтобы с неё же можно было потащить связь). */}
      <Handle type="target" position={Position.Top} id="t-top" className="!bg-neutral-500 !w-2 !h-2 !border !border-neutral-950 !z-10" />
      <Handle type="source" position={Position.Top} id="s-top" className="!bg-transparent !border-none !w-2 !h-2 !z-20" />
      <Handle type="target" position={Position.Bottom} id="t-bot" className="!bg-neutral-500 !w-2 !h-2 !border !border-neutral-950 !z-10" />
      <Handle type="source" position={Position.Bottom} id="s-bot" className="!bg-transparent !border-none !w-2 !h-2 !z-20" />
      <Handle type="target" position={Position.Left} id="t-left" className="!bg-neutral-500 !w-2 !h-2 !border !border-neutral-950 !z-10" />
      <Handle type="source" position={Position.Left} id="s-left" className="!bg-transparent !border-none !w-2 !h-2 !z-20" />
      <Handle type="target" position={Position.Right} id="t-right" className="!bg-neutral-500 !w-2 !h-2 !border !border-neutral-950 !z-10" />
      <Handle type="source" position={Position.Right} id="s-right" className="!bg-transparent !border-none !w-2 !h-2 !z-20" />
      <CompactCard id={id} data={data} title={title} locationKey={locationKey} isFocused={isFocused} />
    </>
  )
}

/**
 * Макроуровень (Блок 2): аккуратная, "тактильная" карточка локации на глобальной карте —
 * матовый обсидиан, микробордер, лёгкая тень. Никакой предварительной тактической разметки —
 * это сознательный отказ от старого поведения (раньше узел с картинкой сразу растягивался
 * до 600×400 и показывал статичные токены). Здесь только миниатюра, название и счётчик
 * токенов — сам бой открывается двойным кликом / приближением (см. TacticalBoard).
 */
/**
 * Bug 3 fix: раньше режим/статус локации (безопасно/напряжение/враждебно/слух) менял сам
 * ТИП reactflow-узла на легаси-компонент из CustomNodes.tsx с полностью иной, куда более
 * широкой версткой (своя рамка, EntityList, произвольная ширина) — если ГМ применял такой
 * статус к новой карточке MapNode, верстка карточки буквально ломалась/скакала. Теперь это
 * просто данные (`data.mode`), отрисованные компактным бейджем внутри той же карточки.
 */
const MODE_BADGES: Record<string, { label: string; dot: string; text: string }> = {
  safe: { label: 'Безопасно', dot: 'bg-emerald-400', text: 'text-emerald-300' },
  tense: { label: 'Напряжение', dot: 'bg-amber-400', text: 'text-amber-300' },
  hostile: { label: 'Враждебно', dot: 'bg-red-400', text: 'text-red-300' },
  mystery: { label: 'Слух', dot: 'bg-zinc-400', text: 'text-zinc-300' },
}

function CompactCard({
  id, data, title, locationKey, isFocused,
}: {
  id: string
  data: MapNodeData
  title: string
  locationKey: string
  isFocused: boolean
}) {
  const canonicalMapImage = useWorkspaceStore((state) =>
    data.entityId ? state.locations[data.entityId]?.mapImage : undefined
  )
  const mapImage = canonicalMapImage ?? data.mapImage
  const isImageLoaded = useImagePreload(mapImage)
  const tokenCount = useWorkspaceStore((state) => Object.keys(state.localMaps[locationKey]?.tokens || {}).length)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadStage, setUploadStage] = useState<'compressing' | 'uploading' | null>(null)
  const isUploading = uploadStage !== null
  const spawnEntityToMap = useWorkspaceStore((state) => state.spawnEntityToMap)
  const updateEntity = useWorkspaceStore((state) => state.updateEntity)
  const updateNodeData = useWorkspaceStore((state) => state.updateNodeData)

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const publicUrl = await uploadEntityImage(file, locationKey, setUploadStage)
      if (data.entityId) {
        updateEntity('locations', data.entityId, { mapImage: publicUrl })
      } else {
        updateNodeData(id, 'mapImage', publicUrl)
      }
    } catch (error) {
      const message = error instanceof ImageUploadError ? error.message : 'Не удалось загрузить фон карты'
      console.error('Ошибка загрузки фона карты:', error)
      toast.error(message)
    } finally {
      setUploadStage(null)
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
    spawnEntityToMap(locationKey, resolved.entity, resolved.tokenType, 0, 0)
    toast.success('Добавлено на боевую карту локации — приблизьтесь (двойной клик), чтобы расставить на сетке.')
  }

  return (
    <div
      className={`group relative rounded-2xl border shadow-xl transition-all overflow-hidden backdrop-blur-sm nodrag-child ${
        isFocused
          ? 'border-indigo-500/70 shadow-indigo-950/40 ring-1 ring-indigo-500/40'
          : 'border-white/[0.06] shadow-black/50'
      } bg-neutral-950/90`}
      style={{ width: COMPACT_WIDTH }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      title="Двойной клик — провалиться в тактический режим этой локации"
    >
      <div className="relative h-24 w-full overflow-hidden">
        {mapImage ? (
          <>
            <div className={`absolute inset-0 bg-neutral-900 transition-opacity duration-500 ${isImageLoaded ? 'opacity-0' : 'opacity-100'}`}>
              <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,#141417_35%,#2a2a30_50%,#141417_65%)] bg-[length:200%_100%]" />
            </div>
            <div
              className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out ${
                isImageLoaded ? 'opacity-100 scale-100 blur-none' : 'opacity-0 scale-110 blur-lg'
              }`}
              style={{ backgroundImage: `url(${mapImage})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/10 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-neutral-950" />
        )}

        <button
          type="button"
          title="Загрузить фон локации"
          disabled={isUploading}
          className="nodrag nopan pointer-events-auto absolute top-1.5 right-1.5 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-950/70 text-neutral-400 hover:text-white border border-white/10 disabled:opacity-100"
          onPointerDown={(e) => {
            e.stopPropagation()
            if (!isUploading) fileInputRef.current?.click()
          }}
        >
          {isUploading ? (
            <span className="text-[8px] font-bold whitespace-nowrap px-0.5">
              {uploadStage === 'compressing' ? 'Сжатие…' : 'Загрузка…'}
            </span>
          ) : (
            <ImageIcon className="w-3 h-3" />
          )}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={handleImageUpload} />

        {data.mode && MODE_BADGES[data.mode] && (
          <div className={`absolute top-1.5 left-1.5 flex items-center gap-1 max-w-[calc(100%-1.5rem)] bg-neutral-950/80 border border-white/10 rounded-full pl-1 pr-2 py-0.5 text-[8px] font-black uppercase tracking-wide backdrop-blur-sm ${MODE_BADGES[data.mode].text}`}>
            <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${MODE_BADGES[data.mode].dot}`} />
            <span className="truncate">{MODE_BADGES[data.mode].label}</span>
          </div>
        )}
      </div>

      <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-400/70 mb-0.5">Локация</div>
          <div className="text-[13px] font-bold text-neutral-100 leading-snug truncate tracking-tight">{title}</div>
        </div>
        {tokenCount > 0 && (
          <span className="shrink-0 text-[10px] font-black text-neutral-300 bg-white/[0.06] border border-white/10 rounded-full w-5 h-5 flex items-center justify-center">
            {tokenCount}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Микроуровень (Блок 2, п.2): узел "проваливается" в полноразмерную тактическую доску —
 * фон (IndexedDB/Архив, см. useMapBackground.ts), боевая сетка, мини-тулбар калибровки.
 * Сами токены сюда НЕ рендерятся — это отдельные reactflow-узлы с parentId на этот узел
 * (Блок 3), их генерирует GameTable.tsx; здесь только "сцена", на которой они стоят.
 */
function TacticalBoard({ locationKey, title }: { locationKey: string; title: string }) {
  const { fitView } = useReactFlow()
  const closeLocalMap = useWorkspaceStore((s) => s.closeLocalMap)
  const mapData = useWorkspaceStore((s) => s.localMaps[locationKey])
  const updateLocalMap = useWorkspaceStore((s) => s.updateLocalMap)
  const allLocations = useWorkspaceStore((s) => Object.values(s.locations))

  // Карта не всегда 1:1 совпадает с архивной локацией (узел мог быть создан без entityId,
  // либо ГМ перепривязал карту вручную) — linkedLocationId побеждает, как и в прежнем
  // LocalMapBoard (resolveTargetLocationId).
  const resolvedLocationId = mapData?.linkedLocationId || locationKey
  const location = useWorkspaceStore((s) => s.locations[resolvedLocationId])

  const {
    backgroundImage, hasCustomBackground, archiveImage, isLoading: isBgLoading,
    isUploading: isBgUploading, uploadBackground, resetToArchiveImage,
  } = useMapBackground(resolvedLocationId)

  const gridSize = mapData?.gridSize || 50
  const offsetX = mapData?.gridOffsetX || 0
  const offsetY = mapData?.gridOffsetY || 0
  const backgroundScale = mapData?.backgroundScale || 1
  const [isToolbarOpen, setIsToolbarOpen] = useState(false)

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await uploadBackground(file)
    } catch (error) {
      const message = error instanceof MapBackgroundError ? error.message : 'Не удалось загрузить фон боевой карты'
      console.error('Ошибка загрузки локального фона боевой карты:', error)
      toast.error(message)
    } finally {
      e.target.value = ''
    }
  }

  const handleExit = () => {
    closeLocalMap()
    fitView({ duration: 600, padding: 0.3 })
  }

  return (
    <div
      className="nodrag nopan relative rounded-2xl border border-indigo-500/30 shadow-2xl shadow-black/70 overflow-hidden bg-neutral-950 ring-1 ring-white/[0.04]"
      style={{ width: TACTICAL_WIDTH, height: TACTICAL_HEIGHT }}
      onWheelCapture={(e) => e.stopPropagation()}
    >
      {/* Фон: приоритет — кастомный локальный (IndexedDB) -> автофон Архива -> пусто.
          Логика полностью совпадает с прежним LocalMapBoard, просто переехала внутрь узла. */}
      <div className="absolute inset-0 pointer-events-none">
        {isBgLoading && !backgroundImage && <div className="absolute inset-0 animate-shimmer bg-neutral-900" />}
        {backgroundImage && (
          <img
            src={backgroundImage}
            alt={`Тактическая карта: ${title}`}
            className="w-full h-full"
            style={{ objectFit: 'contain', objectPosition: 'center', transform: `scale(${backgroundScale})` }}
          />
        )}
      </div>

      {/* Боевая сетка */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: `${gridSize}px ${gridSize}px`,
          backgroundPosition: `${offsetX}px ${offsetY}px`,
        }}
      />

      {/* Заголовок + мини-тулбар (сжатый вариант старого MapToolbar из LocalMapBoard) */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 max-w-[280px]">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-neutral-950/90 border border-white/10 text-white text-xs font-black tracking-wide shadow-lg backdrop-blur-sm truncate max-w-[180px]">
            {title}
          </span>
          <button
            onClick={() => setIsToolbarOpen((v) => !v)}
            className="w-7 h-7 rounded-lg bg-neutral-950/90 border border-white/10 text-neutral-300 hover:text-white text-xs shadow-lg backdrop-blur-sm"
            title="Настройки фона и сетки"
          >
            ⚙️
          </button>
        </div>

        {isToolbarOpen && (
          <div className="flex flex-col gap-2 bg-neutral-950/95 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl w-64">
            <div className="flex items-center gap-2">
              <label className={`cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-2 rounded-lg text-[11px] font-bold text-center flex-1 ${isBgUploading || isBgLoading ? 'opacity-60 pointer-events-none' : ''}`}>
                {isBgUploading ? '⏳ Обработка…' : hasCustomBackground ? '📁 Заменить фон' : '📁 Загрузить фон'}
                <input type="file" accept="image/png, image/jpeg, image/webp, image/gif" className="hidden" onChange={handleImageUpload} disabled={isBgUploading || isBgLoading} />
              </label>
              {hasCustomBackground && (
                <button onClick={resetToArchiveImage} className="bg-red-900/80 hover:bg-red-600 text-white px-2.5 py-2 rounded-lg text-xs font-bold" title="Вернуться к автофону из Архива">✕</button>
              )}
            </div>
            <div className="text-[9px] leading-snug text-neutral-400">
              {hasCustomBackground
                ? '⚡ Локальный фон (офлайн, только этот браузер).'
                : archiveImage
                  ? '🖼️ Автофон из карточки локации (в облаке).'
                  : 'У локации нет изображения.'}
            </div>
            {!location && (
              <div className="flex flex-col gap-1 pt-1 border-t border-white/10">
                <span className="text-[9px] text-neutral-400">Карта не привязана к Архиву:</span>
                <select
                  className="w-full bg-neutral-900 border border-white/10 text-white text-[10px] p-1.5 rounded-lg outline-none focus:border-indigo-500"
                  onChange={(e) => { if (e.target.value) updateLocalMap(locationKey, { linkedLocationId: e.target.value }) }}
                  value=""
                >
                  <option value="" disabled>-- Выбрать локацию --</option>
                  {allLocations.map((loc: any) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                </select>
              </div>
            )}
            <div className="flex items-center gap-2 pt-1 border-t border-white/10">
              <span className="text-[10px] text-neutral-400 whitespace-nowrap">Сетка {gridSize}px</span>
              <input
                type="range" min={20} max={150} step={1} value={gridSize}
                onChange={(e) => updateLocalMap(locationKey, { gridSize: parseInt(e.target.value, 10) })}
                className="flex-1 accent-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleExit}
        className="nodrag absolute top-3 right-3 z-20 bg-neutral-950/90 border border-white/10 text-neutral-300 hover:text-white hover:border-red-500/50 text-[11px] font-bold px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm transition-colors"
        title="Вернуться на глобальную карту"
      >
        ← Карта мира
      </button>
    </div>
  )
}

function areMapNodePropsEqual(prev: NodeProps<MapNodeData>, next: NodeProps<MapNodeData>): boolean {
  return (
    prev.id === next.id &&
    prev.data.title === next.data.title &&
    prev.data.label === next.data.label &&
    prev.data.mapImage === next.data.mapImage &&
    prev.data.entityId === next.data.entityId &&
    prev.data.mode === next.data.mode
  )
}

export default memo(MapNode, areMapNodePropsEqual)
