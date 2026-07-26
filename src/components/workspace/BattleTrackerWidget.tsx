'use client'

import React, { useRef, useState } from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import type { Combatant } from '@/types/workspace'

/**
 * Плавающая панель трекера боя поверх тактической карты (Блок 3, п.4).
 *
 * Сознательно НЕ встроена в CockpitSidebar и НЕ заменяет старый `InitiativeTracker`
 * (он остаётся в сайдбаре дашборда как есть) — это отдельный виджет именно для боевой
 * карты, с полноценным редактированием HP/AC/инициативы и произвольными тегами статусов,
 * которых в старом трекере не было. Перетаскивается за шапку, сворачивается в компактный
 * бейдж, не блокирует канвас модальным фоном.
 */
const BattleTrackerWidget = ({ locationId }: { locationId: string }) => {
  const {
    combat, startCombat, endCombat, nextTurn,
    updateCombatantInitiative, updateCombatantStats,
    addCombatantStatus, removeCombatantStatus,
    heroes, characters, enemies, extras,
  } = useWorkspaceStore()

  const [isMinimized, setIsMinimized] = useState(false)
  const [position, setPosition] = useState({ x: 24, y: 24 }) // от правого/нижнего края
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({})
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null)
  const [isDraggingPanel, setIsDraggingPanel] = useState(false)

  const getEntity = (p: Combatant): any => {
    if (p.type === 'hero') return heroes[p.entityId]
    if (p.type === 'npc') return characters[p.entityId]
    if (p.type === 'enemies') return enemies[p.entityId]
    if (p.type === 'extra') return extras[p.entityId]
    return undefined
  }

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: position.x, originY: position.y }
    setIsDraggingPanel(true);
    const handleMove = (moveEvent: MouseEvent) => {
      if (!dragRef.current) return
      const dx = moveEvent.clientX - dragRef.current.startX
      const dy = moveEvent.clientY - dragRef.current.startY
      // x/y считаются от правого/нижнего края — двигаем панель мышью в обратном направлении
      setPosition({ x: dragRef.current.originX - dx, y: dragRef.current.originY - dy })
    }
    const handleUp = () => {
      setIsDraggingPanel(false);
      dragRef.current = null
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }

  const clampHp = (hp: number, maxHp: number) => Math.max(0, Math.min(maxHp, hp))

  const handleAddStatus = (tokenId: string) => {
    const draft = (statusDrafts[tokenId] || '').trim()
    if (!draft) return
    addCombatantStatus(tokenId, draft)
    setStatusDrafts((prev) => ({ ...prev, [tokenId]: '' }))
  }

  if (!combat.isActive) {
    return (
      <div
        className="fixed z-40 flex flex-col items-end gap-2"
        style={{ right: position.x, bottom: position.y }}
      >
        <button
          onClick={() => startCombat(locationId)}
          className="bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2"
        >
          ⚔️ Начать бой
        </button>
      </div>
    )
  }

  return (
    <div
      className="fixed z-40 bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden w-80"
      style={{ right: position.x, bottom: position.y, maxHeight: isMinimized ? undefined : '75vh' }}
    >
      <div
        onMouseDown={handleHeaderMouseDown}
        className={`flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/60 select-none ${isDraggingPanel ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-red-500">⚔️</span>
          <span className="text-xs font-black uppercase tracking-widest text-white">Трекер боя</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setIsMinimized((v) => !v)}
            className="text-zinc-500 hover:text-white w-6 h-6 flex items-center justify-center rounded transition-colors"
            title={isMinimized ? 'Развернуть' : 'Свернуть'}
          >
            {isMinimized ? '▲' : '▼'}
          </button>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={endCombat}
            className="text-zinc-500 hover:text-red-400 w-6 h-6 flex items-center justify-center rounded transition-colors"
            title="Завершить бой"
          >
            ✕
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="p-3 border-b border-zinc-800">
            <button
              onClick={nextTurn}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              Следующий ход ⏭️
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {combat.participants.length === 0 && (
              <div className="text-center text-zinc-600 text-[10px] uppercase font-bold tracking-widest py-6 border-2 border-dashed border-zinc-800 rounded-xl">
                На карте нет боевых токенов
              </div>
            )}
            {combat.participants.map((p, index) => {
              const entity = getEntity(p)
              const name = entity?.name || 'Без имени'
              const isDead = p.hp <= 0
              const isCurrentTurn = index === combat.turnIndex

              return (
                <div
                  key={p.tokenId}
                  className={`rounded-xl border p-3 flex flex-col gap-2 transition-all ${
                    isCurrentTurn
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-[0_0_16px_rgba(99,102,241,0.25)]'
                      : 'bg-zinc-900/70 border-zinc-800'
                  } ${isDead ? 'opacity-50 grayscale' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-bold text-sm truncate ${isDead ? 'line-through text-zinc-500' : 'text-white'}`}>
                      {name}
                    </span>
                    <input
                      type="number"
                      value={p.initiative}
                      onChange={(e) => updateCombatantInitiative(p.tokenId, Number.parseInt(e.target.value, 10) || 0)}
                      className="w-12 bg-zinc-950 border border-zinc-700 text-center text-xs font-bold text-white rounded p-1"
                      title="Инициатива"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 items-center">
                    <label className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded px-1.5 py-1">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase">HP</span>
                      <input
                        type="number"
                        value={p.hp}
                        onChange={(e) =>
                          updateCombatantStats(p.tokenId, { hp: clampHp(Number.parseInt(e.target.value, 10) || 0, p.maxHp) })
                        }
                        className="w-full bg-transparent text-white text-xs font-bold outline-none text-center"
                      />
                    </label>
                    <label className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded px-1.5 py-1">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase">Макс</span>
                      <input
                        type="number"
                        value={p.maxHp}
                        onChange={(e) => updateCombatantStats(p.tokenId, { maxHp: Number.parseInt(e.target.value, 10) || 0 })}
                        className="w-full bg-transparent text-white text-xs font-bold outline-none text-center"
                      />
                    </label>
                    <label className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded px-1.5 py-1">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase">AC</span>
                      <input
                        type="number"
                        value={p.ac}
                        onChange={(e) => updateCombatantStats(p.tokenId, { ac: Number.parseInt(e.target.value, 10) || 0 })}
                        className="w-full bg-transparent text-white text-xs font-bold outline-none text-center"
                      />
                    </label>
                  </div>

                  <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                    <div
                      className={`h-full transition-all duration-300 ${p.hp > p.maxHp * 0.5 ? 'bg-emerald-500' : p.hp > p.maxHp * 0.2 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${p.maxHp > 0 ? Math.max(0, (p.hp / p.maxHp) * 100) : 0}%` }}
                    />
                  </div>

                  {/* Произвольные текстовые теги статусов — не хардкодим конкретную редакцию правил */}
                  <div className="flex flex-wrap gap-1">
                    {p.statuses.map((status) => (
                      <span
                        key={status}
                        className="flex items-center gap-1 bg-fuchsia-950/40 border border-fuchsia-800/60 text-fuchsia-300 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                      >
                        {status}
                        <button onClick={() => removeCombatantStatus(p.tokenId, status)} className="text-fuchsia-500 hover:text-white">✕</button>
                      </span>
                    ))}
                  </div>
                  <input
                    value={statusDrafts[p.tokenId] || ''}
                    onChange={(e) => setStatusDrafts((prev) => ({ ...prev, [p.tokenId]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddStatus(p.tokenId)
                    }}
                    placeholder="+ статус (Enter)"
                    className="w-full bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-300 rounded px-2 py-1 outline-none focus:border-fuchsia-600"
                  />
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default BattleTrackerWidget
