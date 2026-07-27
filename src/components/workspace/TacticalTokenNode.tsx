'use client'

import { memo } from 'react'
import type { NodeProps } from 'reactflow'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import type { BattleToken } from '@/types/workspace'

export type TacticalTokenNodeData = {
  token: BattleToken
  locationId: string
  gridSize: number
}

/**
 * Токен на тактической доске — Блок 3: живёт как ДОЧЕРНИЙ reactflow-узел локации
 * (parentId + extent: 'parent', см. GameTable.tsx), а не как разметка внутри MapNode.
 * Благодаря этому координаты токена всегда относительны родителя: если ГМ подвинет саму
 * локацию на глобальной карте, все токены внутри неё физически перемещаются вместе с ней
 * без какой-либо дополнительной синхронизации.
 *
 * Перетаскивание — штатный drag reactflow (весь блок — "хендл"), снеппинг к сетке и запись
 * в state.localMaps[locationId].tokens происходят в onNodesChange самого GameTable —
 * компонент только рисует то, что ему передали, и открывает досье/удаляет токен по клику.
 */
function TacticalTokenNode({ data }: NodeProps<TacticalTokenNodeData>) {
  const { token, locationId, gridSize } = data
  const setViewedEntityId = useWorkspaceStore((s) => s.setViewedEntityId)
  const removeLocalToken = useWorkspaceStore((s) => s.removeLocalToken)
  const entity = useWorkspaceStore((s) =>
    s.heroes[token.entityId] || s.characters[token.entityId] || s.enemies[token.entityId] ||
    s.extras[token.entityId] || s.loot[token.entityId] || s.interactive[token.entityId] ||
    s.locations[token.entityId]
  )
  const name = entity?.name || 'Объект'
  const size = (token.size || 1) * gridSize

  const isPoi = token.type === 'poi'
  const isCheck = token.type === 'check'
  const isHero = token.type === 'hero'
  const isNpc = token.type === 'npc'
  const isEnemy = token.type === 'enemies'
  const isExtra = token.type === 'extra'
  const isLocation = token.type === 'location'

  const shapeClass = isPoi
    ? 'rounded-md bg-amber-400/90 border-amber-200 text-amber-950'
    : isCheck
      ? 'rotate-45 bg-fuchsia-600/90 border-fuchsia-300 text-white'
      : isHero
        ? 'rounded-full bg-indigo-600/90 border-indigo-300 text-white shadow-indigo-500/30'
        : isNpc
          ? 'rounded-full bg-emerald-600/90 border-emerald-300 text-white shadow-emerald-500/30'
          : isEnemy
            ? 'rounded-full bg-rose-700/90 border-rose-400 text-white shadow-rose-500/30'
            : isExtra
              ? 'rounded-full bg-zinc-600/90 border-zinc-400 text-white shadow-zinc-500/30'
              : isLocation
                // Блок 2: вложенная локация ("портал") — визуально отличается от обычных
                // токенов (шестиугольная рамка вместо круга/квадрата), чтобы сразу читалось
                // как "сюда можно провалиться", а не как персонаж/предмет на доске.
                ? 'rounded-lg bg-violet-700/90 border-violet-300 text-white shadow-violet-500/40'
                : 'rounded-full bg-cyan-600/90 border-cyan-300 text-white shadow-cyan-500/30'

  const icon = isPoi ? '🔍' : isCheck ? '🎲' : isHero ? '🛡️' : isNpc ? '👤' : isEnemy ? '⚔️' : isExtra ? '👥' : isLocation ? '🌀' : '💎'

  return (
    <div className="group relative flex flex-col items-center" style={{ width: size, height: size }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setViewedEntityId(token.entityId)
        }}
        className={`w-full h-full border-2 cursor-move flex items-center justify-center font-black shadow-xl select-none backdrop-blur-sm transition-transform hover:scale-110 ${shapeClass} ${isLocation ? 'ring-2 ring-violet-400/40 ring-offset-2 ring-offset-neutral-950' : ''}`}
        title={isLocation ? `${name} — двойной клик, чтобы провалиться внутрь` : name}
      >
        <div className={`${isCheck ? '-rotate-45' : ''} drop-shadow-md text-base`}>{icon}</div>
      </button>

      <div className="absolute top-full mt-1.5 bg-neutral-950/90 border border-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xl whitespace-nowrap max-w-[140px] truncate select-none pointer-events-none tracking-wide">
        {name}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          removeLocalToken(locationId, token.id)
        }}
        className="nodrag nopan absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg border border-red-400/50"
        title="Убрать с карты"
      >
        ✕
      </button>
    </div>
  )
}

export default memo(TacticalTokenNode)
