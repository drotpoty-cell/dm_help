'use client'

import { useCallback, useMemo, useState, type ChangeEvent } from 'react'
import ReactFlow, {
  Controls, ReactFlowProvider, useReactFlow,
  type Node, type NodeChange,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { toast } from 'sonner'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { useMapBackground, MapBackgroundError } from '@/hooks/useMapBackground'
import TacticalTokenNode from '@/components/workspace/TacticalTokenNode'
import TacticalSpawnPanel from '@/components/workspace/TacticalSpawnPanel'
import BattleTrackerWidget from '@/components/workspace/BattleTrackerWidget'
import { parseDragPayload, resolveEntity } from '@/components/workspace/MapNode'
import { wouldCreateLocationCycle } from '@/utils/locationGraph'

const nodeTypes = { token: TacticalTokenNode }

/**
 * Блок 1 — изолированный fullscreen тактический режим: полностью отдельный reactflow-канвас
 * (свой ReactFlowProvider, своя система координат в пикселях — никаких parentId/extent
 * относительно узла на глобальной карте, как было раньше). Глобальный стол в этот момент
 * скрыт/затемнён позади (см. GameTable.tsx), а этот компонент занимает 100% ширины/высоты.
 *
 * Блок 2 — вложенные локации: `locationId` здесь всегда равен верхушке
 * `mapNavigationStack`; двойной клик по токену-локации не открывает ничего "внутри" этого
 * же компонента — он просто вызывает `diveIntoMap`, GameTable перерисовывает этот же
 * компонент с новым `locationId` (React делает remount благодаря `key`), что и создаёт
 * ощущение проваливания на следующий уровень "матрёшки".
 */
export default function TacticalCanvas({ locationId }: { locationId: string }) {
  return (
    <ReactFlowProvider>
      <TacticalCanvasInner locationId={locationId} />
    </ReactFlowProvider>
  )
}

function TacticalCanvasInner({ locationId }: { locationId: string }) {
  const mapNavigationStack = useWorkspaceStore((s) => s.mapNavigationStack)
  const mapsUpTo = useWorkspaceStore((s) => s.mapsUpTo)
  const closeLocalMap = useWorkspaceStore((s) => s.closeLocalMap)
  const diveIntoMap = useWorkspaceStore((s) => s.diveIntoMap)
  const locations = useWorkspaceStore((s) => s.locations)
  const mapData = useWorkspaceStore((s) => s.localMaps[locationId])
  const updateLocalMap = useWorkspaceStore((s) => s.updateLocalMap)
  const updateLocalToken = useWorkspaceStore((s) => s.updateLocalToken)
  const spawnEntityToMap = useWorkspaceStore((s) => s.spawnEntityToMap)
  const allLocations = useWorkspaceStore((s) => Object.values(s.locations))
  const reactFlowInstance = useReactFlow()

  // Карта не всегда 1:1 совпадает с архивной локацией (узел мог быть создан без entityId,
  // либо ГМ перепривязал карту вручную) — linkedLocationId побеждает.
  const resolvedLocationId = mapData?.linkedLocationId || locationId
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
  const [isSpawnPanelOpen, setIsSpawnPanelOpen] = useState(true)
  const [dragOverrides, setDragOverrides] = useState<Record<string, { x: number; y: number }>>({})

  const tokenNodes = useMemo<Node[]>(() => {
    const tokens = mapData?.tokens || {}
    return Object.values(tokens).map((token) => ({
      id: token.id,
      type: 'token',
      position: dragOverrides[token.id] ?? { x: token.x * gridSize, y: token.y * gridSize },
      data: { token, locationId, gridSize },
      draggable: true,
    }))
  }, [mapData, gridSize, dragOverrides, locationId])

  // Живое визуальное перемещение токена во время драга — фиксация в стор происходит в
  // onNodeDragStop ниже (тот же надёжный паттерн, что и раньше: onNodesChange не гарантирует
  // единственный вызов на конец жеста, onNodeDragStop — гарантирует).
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    changes.forEach((change) => {
      if (change.type === 'position' && change.position && change.dragging) {
        setDragOverrides((prev) => ({ ...prev, [change.id]: change.position! }))
      }
    })
  }, [])

  const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    const { token } = node.data as any
    const snappedX = Math.round(node.position.x / gridSize)
    const snappedY = Math.round(node.position.y / gridSize)
    updateLocalToken(locationId, token.id, { x: snappedX, y: snappedY })
    setDragOverrides((prev) => {
      const next = { ...prev }
      delete next[node.id]
      return next
    })
  }, [gridSize, locationId, updateLocalToken])

  // Блок 2: двойной клик по токену-локации "проваливается" на уровень глубже.
  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    const token = (node.data as any)?.token
    if (token?.type === 'location' && token.entityId) {
      diveIntoMap(token.entityId)
    }
  }, [diveIntoMap])

  // Блок 2: перетаскивание карточки любой сущности (включая локацию) из сайдбара архива
  // прямо на тактическую сетку — тот же механизм native HTML5 drag, что уже работает для
  // героев/врагов (см. EntityCard.tsx), просто теперь ловим drop на весь fullscreen канвас.
  const localMaps = useWorkspaceStore((s) => s.localMaps)

  const handleCanvasDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const payload = parseDragPayload(e.dataTransfer)
    if (!payload) return
    const resolved = resolveEntity(payload)
    if (!resolved) return
    if (resolved.tokenType === 'location' && wouldCreateLocationCycle(resolved.entity.id, locationId, localMaps)) {
      toast.error('🌀 Нарушение пространственно-временного континуума: эта локация уже содержит текущую карту (прямо или через вложенность).')
      return
    }
    const flowPosition = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY })
    const gridX = Math.round(flowPosition.x / gridSize)
    const gridY = Math.round(flowPosition.y / gridSize)
    spawnEntityToMap(locationId, resolved.entity, resolved.tokenType, gridX, gridY)
  }

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

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col bg-neutral-950"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleCanvasDrop}
    >
      {/* Блок 1: верхняя панель зафиксирована — хлебные крошки вложенности (Блок 2) слева,
          явный выход на глобальную карту справа. Никакого схлопывания по скроллу/клику мимо. */}
      <div className="h-14 shrink-0 border-b border-white/10 bg-neutral-950/95 backdrop-blur-md flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-1.5 text-xs font-bold overflow-x-auto">
          {mapNavigationStack.map((locId, idx) => {
            const loc = locations[locId]
            const isLast = idx === mapNavigationStack.length - 1
            return (
              <span key={locId} className="flex items-center gap-1.5 shrink-0">
                {idx > 0 && <span className="text-neutral-700">/</span>}
                <button
                  onClick={() => mapsUpTo(idx)}
                  className={isLast ? 'text-white tracking-wide' : 'text-neutral-500 hover:text-white transition-colors tracking-wide'}
                >
                  {loc?.name || 'Локация'}
                </button>
              </span>
            )
          })}
        </div>
        <button
          onClick={() => closeLocalMap()}
          className="bg-neutral-900 border border-white/10 hover:border-red-500/50 text-neutral-300 hover:text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md transition-colors whitespace-nowrap"
          title="Escape тоже работает"
        >
          ← Выйти на глобальную карту
        </button>
      </div>

      {/* Тело: фон + сетка + канвас токенов на 100% оставшейся площади. */}
      <div className="relative flex-1 min-h-0">
        <div className="absolute inset-0 pointer-events-none">
          {isBgLoading && !backgroundImage && <div className="absolute inset-0 animate-shimmer bg-neutral-900" />}
          {backgroundImage && (
            <img
              src={backgroundImage}
              alt={`Тактическая карта: ${location?.name || 'локация'}`}
              className="w-full h-full"
              style={{ objectFit: 'contain', objectPosition: 'center', transform: `scale(${backgroundScale})` }}
            />
          )}
        </div>
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: `${gridSize}px ${gridSize}px`,
            backgroundPosition: `${offsetX}px ${offsetY}px`,
          }}
        />

        <ReactFlow
          nodes={tokenNodes}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onNodeDragStop={onNodeDragStop}
          onNodeDoubleClick={onNodeDoubleClick}
          minZoom={0.3}
          maxZoom={3}
          proOptions={{ hideAttribution: true }}
        >
          <Controls className="!bg-neutral-950/90 !border-white/10 !shadow-2xl" />
        </ReactFlow>

        {/* Мини-тулбар фона/сетки */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 max-w-[280px]">
          <button
            onClick={() => setIsToolbarOpen((v) => !v)}
            className="w-9 h-9 rounded-lg bg-neutral-950/90 border border-white/10 text-neutral-300 hover:text-white text-sm shadow-lg backdrop-blur-sm self-start"
            title="Настройки фона и сетки"
          >
            ⚙️
          </button>

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
                    onChange={(e) => { if (e.target.value) updateLocalMap(locationId, { linkedLocationId: e.target.value }) }}
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
                  onChange={(e) => updateLocalMap(locationId, { gridSize: parseInt(e.target.value, 10) })}
                  className="flex-1 accent-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {isSpawnPanelOpen ? (
          <TacticalSpawnPanel locationId={locationId} onClose={() => setIsSpawnPanelOpen(false)} />
        ) : (
          <button
            onClick={() => setIsSpawnPanelOpen(true)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-neutral-950/90 border border-white/10 text-neutral-300 hover:text-white text-xs font-bold px-2 py-3 rounded-xl shadow-xl"
            title="Показать панель добавления сущностей"
          >
            ▶
          </button>
        )}

        <BattleTrackerWidget locationId={locationId} />
      </div>
    </div>
  )
}
