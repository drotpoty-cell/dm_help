'use client'

import { useState } from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { Hero, NPC } from '@/types/workspace'

interface Combatant {
  id: string
  name: string
  initiative: number
  hp: number
  maxHp: number
  ac: number
  type: 'hero' | 'npc'
}

export default function CombatTracker({ onClose }: { onClose: () => void }) {
  const { heroes, npcs } = useWorkspaceStore()
  
  const [combatants, setCombatants] = useState<Combatant[]>([])
  const [currentTurn, setCurrentTurn] = useState<number>(0)
  const [round, setRound] = useState<number>(1)
  const [isCombatActive, setIsCombatActive] = useState(false)

  // --- БОЕВАЯ СЕТКА (GRID) ---
  const GRID_SIZE = 10;
  const [positions, setPositions] = useState<Record<string, {x: number, y: number}>>({})
  const [selectedToMove, setSelectedToMove] = useState<string | null>(null)

  const rollInitiativeAll = () => {
    setCombatants(prev =>
      prev
        .map(c => ({ ...c, initiative: Math.floor(Math.random() * 20) + 1 }))
        .sort((a, b) => b.initiative - a.initiative)
    )
    setCurrentTurn(0)
    setRound(1)
  }

  const clearCombat = () => {
    setCombatants([])
    setPositions({})
    setSelectedToMove(null)
    setCurrentTurn(0)
    setRound(1)
    setIsCombatActive(false)
  }

  // --- ДОБАВЛЕНИЕ УЧАСТНИКОВ (С фиксом TypeScript) ---
  const addHero = (id: string) => {
    const hero = heroes[id]
    if (!hero) return
    setCombatants(prev => [...prev, {
      id: `${id}-${Date.now()}`, name: hero.name, 
      initiative: (hero.initiativeModifier || 0) + Math.floor(Math.random() * 20) + 1,
      hp: hero.hp || 10, maxHp: hero.maxHp || 10, ac: hero.ac || 10, 
      type: 'hero' as const // Фикс TS ошибки
    }].sort((a, b) => b.initiative - a.initiative))
  }

  const addNpc = (id: string) => {
    const npc = npcs[id]
    if (!npc) return
    
    let hp = npc.hp ?? npc.maxHp ?? 10
    let maxHp = npc.maxHp ?? npc.hp ?? hp
    let ac = npc.ac ?? 10

    if ((npc.hp === undefined || npc.maxHp === undefined || npc.ac === undefined) && npc.stats) {
      const hpMatch = npc.stats.match(/HP:\s*(\d+)/i)
      const acMatch = npc.stats.match(/AC:\s*(\d+)/i)
      if (hpMatch) {
        hp = Number.parseInt(hpMatch[1], 10) || hp
        maxHp = Number.parseInt(hpMatch[1], 10) || maxHp
      }
      if (acMatch) ac = Number.parseInt(acMatch[1], 10) || ac
    }

    setCombatants(prev => [...prev, {
      id: `${id}-${Date.now()}`, name: npc.name, 
      initiative: Math.floor(Math.random() * 20) + 1,
      hp, maxHp, ac, 
      type: 'npc' as const // Фикс TS ошибки
    }].sort((a, b) => b.initiative - a.initiative))
  }

  // --- УПРАВЛЕНИЕ БОЕМ ---
  const nextTurn = () => {
    if (currentTurn >= combatants.length - 1) {
      setCurrentTurn(0)
      setRound(r => r + 1)
    } else {
      setCurrentTurn(t => t + 1)
    }
  }

  const adjustHp = (id: string, amount: number) => {
    setCombatants(prev => prev.map(c => {
      if (c.id !== id) return c
      const newHp = Math.max(0, Math.min(c.maxHp, c.hp + amount))
      return { ...c, hp: newHp }
    }))
  }

  const removeCombatant = (id: string) => {
    setCombatants(prev => prev.filter(c => c.id !== id))
    // Удаляем с поля
    const newPos = {...positions}
    delete newPos[id]
    setPositions(newPos)
  }

  // --- КЛИК ПО КЛЕТКЕ ---
  const handleCellClick = (x: number, y: number) => {
    if (selectedToMove) {
      setPositions(prev => ({ ...prev, [selectedToMove]: { x, y } }))
      setSelectedToMove(null) // Сбрасываем выбор после перемещения
    }
  }

  return (
    <div className="absolute right-0 top-16 bottom-0 w-[60vw] bg-zinc-950/95 backdrop-blur-2xl border-l border-zinc-800 shadow-[0_0_80px_rgba(0,0,0,0.9)] z-40 flex animate-in slide-in-from-right-8 duration-300">
      
      {/* ЛЕВАЯ ЧАСТЬ: ИНТЕРАКТИВНОЕ ПОЛЕ БОЯ */}
      <div className="flex-1 flex flex-col p-6 bg-[#09090b]">
        <div className="mb-4">
          <h2 className="text-xl font-black text-white uppercase tracking-widest">Тактическая Сетка</h2>
          <p className="text-zinc-500 text-xs">
            {selectedToMove ? <span className="text-amber-400 font-bold">Кликните на клетку, чтобы переместить выбранного персонажа.</span> : "Выберите персонажа справа в списке, чтобы расставить его на поле."}
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div 
            className="grid border border-zinc-800/50 bg-zinc-900/30 rounded-lg overflow-hidden shadow-2xl"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
              const x = index % GRID_SIZE;
              const y = Math.floor(index / GRID_SIZE);
              
              // Ищем, стоит ли кто-то в этой клетке
              const occupantId = Object.keys(positions).find(id => positions[id].x === x && positions[id].y === y)
              const occupant = occupantId ? combatants.find(c => c.id === occupantId) : null

              return (
                <div 
                  key={index}
                  onClick={() => handleCellClick(x, y)}
                  className={`w-12 h-12 sm:w-14 sm:h-14 border border-zinc-800/30 flex items-center justify-center cursor-pointer transition-colors relative group
                    ${selectedToMove ? 'hover:bg-amber-500/20' : 'hover:bg-zinc-800/50'}
                  `}
                >
                  {occupant && (
                    (() => {
                      const pct = occupant.maxHp > 0 ? occupant.hp / occupant.maxHp : 0
                      const hpBorder =
                        occupant.hp <= 0 ? 'border-red-500' : pct > 0.5 ? 'border-emerald-400' : pct > 0.2 ? 'border-amber-400' : 'border-red-500'
                      const baseColor =
                        occupant.type === 'hero' ? 'bg-cyan-900 text-cyan-100' : 'bg-orange-900 text-orange-100'

                      return (
                        <div
                          className={`w-8 h-8 rounded-full border-2 ${hpBorder} flex items-center justify-center text-[10px] font-black shadow-lg z-10 transition-transform group-hover:scale-110 ${baseColor}
                            ${occupant.hp <= 0 ? 'opacity-40 grayscale' : ''}
                            ${occupantId === selectedToMove ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-zinc-900 animate-pulse' : ''}
                          `}
                          title={`${occupant.name} (${occupant.hp}/${occupant.maxHp} HP)`}
                        >
                          {occupant.name.substring(0, 2).toUpperCase()}

                          {occupant.hp <= 0 && (
                            <div className="absolute inset-0 rounded-full flex items-center justify-center">
                              <div className="absolute inset-0 rounded-full bg-red-500/10"></div>
                              <svg
                                viewBox="0 0 24 24"
                                width="22"
                                height="22"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-red-400/80 drop-shadow-[0_0_8px_rgba(239,68,68,0.35)]"
                              >
                                <path d="M6 6l12 12" />
                                <path d="M18 6L6 18" />
                              </svg>
                            </div>
                          )}
                        </div>
                      )
                    })()
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ПРАВАЯ ЧАСТЬ: ТРЕКЕР ИНИЦИАТИВЫ */}
      <div className="w-96 flex flex-col border-l border-zinc-800 bg-zinc-950 shrink-0">
        {/* ШАПКА */}
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <span className="text-red-500">⚔️</span> Трекер Боя
            </h2>
            {isCombatActive && <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Раунд {round}</div>}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-2xl transition-colors">×</button>
        </div>

        {/* ПАНЕЛЬ ДОБАВЛЕНИЯ */}
        {!isCombatActive && (
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/20 flex flex-col gap-3">
            <select onChange={(e) => { addHero(e.target.value); e.target.value = ''; }} className="w-full bg-zinc-900 border border-zinc-700 text-cyan-400 text-[10px] font-bold uppercase p-2 rounded outline-none cursor-pointer">
              <option value="">+ Добавить Героя</option>
              {Object.values(heroes).map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <select onChange={(e) => { addNpc(e.target.value); e.target.value = ''; }} className="w-full bg-zinc-900 border border-zinc-700 text-orange-400 text-[10px] font-bold uppercase p-2 rounded outline-none cursor-pointer">
              <option value="">+ Добавить Врага (NPC)</option>
              {Object.values(npcs).map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>

            <button
              onClick={rollInitiativeAll}
              disabled={combatants.length === 0}
              className="w-full py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Кинуть инициативу всем
            </button>
            
            <button 
              onClick={() => setIsCombatActive(true)}
              disabled={combatants.length === 0}
              className="w-full py-3 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-2 border border-red-500/30"
            >
              Начать бой!
            </button>

            <button
              onClick={clearCombat}
              disabled={combatants.length === 0 && Object.keys(positions).length === 0 && round === 1}
              className="w-full py-2 bg-red-950/30 hover:bg-red-600/20 text-red-400 hover:text-red-200 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-red-900/40 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Очистить поле
            </button>
          </div>
        )}

        {/* СПИСОК ИНИЦИАТИВЫ */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {combatants.length === 0 && (
            <div className="text-center text-zinc-600 text-[10px] uppercase font-bold tracking-widest py-10 border-2 border-dashed border-zinc-800 rounded-xl">
              Никто не дерется.<br/>Добавьте участников.
            </div>
          )}

          {combatants.map((c, index) => {
            const isCurrentTurn = isCombatActive && currentTurn === index;
            const isDead = c.hp <= 0;
            const isSelected = selectedToMove === c.id;

            return (
              <div 
                key={c.id} 
                onClick={() => setSelectedToMove(isSelected ? null : c.id)}
                className={`relative rounded-xl border p-3 flex flex-col gap-2 transition-all cursor-pointer ${
                  isSelected ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] bg-amber-950/20' :
                  isDead ? 'bg-zinc-900/50 border-zinc-800 opacity-50 grayscale' :
                  isCurrentTurn ? 'bg-indigo-950/40 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)] scale-[1.02] z-10' : 
                  'bg-zinc-900/80 border-zinc-700 hover:border-zinc-500'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 pointer-events-none">
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black ${c.type === 'hero' ? 'bg-cyan-950 text-cyan-400' : 'bg-orange-950 text-orange-400'}`}>
                      {c.initiative}
                    </div>
                    <span className={`font-bold truncate max-w-[130px] ${isDead ? 'line-through text-zinc-500' : c.type === 'hero' ? 'text-cyan-100' : 'text-orange-100'}`}>
                      {c.name}
                    </span>
                  </div>
                  {!isCombatActive && (
                    <button onClick={(e) => { e.stopPropagation(); removeCombatant(c.id); }} className="text-zinc-600 hover:text-red-500 text-xs">✕</button>
                  )}
                </div>

                {/* ПАНЕЛЬ ЗДОРОВЬЯ */}
                <div className="flex items-center gap-2 mt-1 pointer-events-none">
                  <div className="flex-1 bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                    <div 
                      className={`h-full transition-all duration-500 ${c.hp > c.maxHp * 0.5 ? 'bg-emerald-500' : c.hp > c.maxHp * 0.2 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.max(0, (c.hp / c.maxHp) * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-zinc-400 w-12 text-right">
                    {c.hp}/{c.maxHp}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-900/50 ml-1">
                    🛡️{c.ac}
                  </span>
                </div>

                {/* УПРАВЛЕНИЕ УРОНОМ */}
                <div className="flex gap-1 mt-1">
                  <button onClick={(e) => { e.stopPropagation(); adjustHp(c.id, -1) }} className="flex-1 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded py-1 text-[10px] font-bold">-1 Урон</button>
                  <button onClick={(e) => { e.stopPropagation(); adjustHp(c.id, -5) }} className="flex-1 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded py-1 text-[10px] font-bold">-5 Урон</button>
                  <button onClick={(e) => { e.stopPropagation(); adjustHp(c.id, 1) }} className="flex-1 bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-900/50 rounded py-1 text-[10px] font-bold">+1 Хил</button>
                </div>
              </div>
            )
          })}
        </div>

        {/* НИЖНЯЯ ПАНЕЛЬ КОНТРОЛЯ */}
        {isCombatActive && (
          <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex flex-col gap-2">
            <button 
              onClick={nextTurn}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)]"
            >
              Следующий Ход ⏭️
            </button>
            <button 
              onClick={() => { setIsCombatActive(false); setRound(1); }}
              className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 rounded text-[9px] font-bold uppercase tracking-widest transition-colors border border-zinc-800"
            >
              Завершить бой
            </button>
            <button
              onClick={clearCombat}
              className="w-full py-2 bg-red-950/30 hover:bg-red-600/20 text-red-400 hover:text-red-200 rounded text-[9px] font-black uppercase tracking-widest transition-colors border border-red-900/40"
            >
              Очистить поле
            </button>
          </div>
        )}
      </div>
    </div>
  )
}