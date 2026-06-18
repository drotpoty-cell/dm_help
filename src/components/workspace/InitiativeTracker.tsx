'use client'

import React from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export const InitiativeTracker = () => {
  const { combat, startCombat, endCombat, nextTurn, updateCombatantInitiative, activeLocalMapId, heroes, npcs } = useWorkspaceStore()

  if (!combat.isActive) {
    return (
      <button 
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={() => activeLocalMapId && startCombat(activeLocalMapId)}
      >
        ⚔️ Начать бой
      </button>
    )
  }

  return (
    <div className="p-4 border rounded bg-gray-800 text-white">
      <div className="flex justify-between mb-4">
        <button className="px-2 py-1 bg-green-600 rounded" onClick={nextTurn}>Следующий ход</button>
        <button className="px-2 py-1 bg-red-600 rounded" onClick={endCombat}>Завершить бой</button>
      </div>
      <div className="space-y-2">
        {combat.participants.map((p, index) => {
          const entity = (p.type === 'hero' ? heroes[p.entityId] : npcs[p.entityId]) || { hp: p.hp, maxHp: p.maxHp, ac: 0 };
          return (
            <div 
              key={p.tokenId} 
              className={`p-2 border rounded flex justify-between items-center ${index === combat.turnIndex ? 'border-yellow-400 bg-gray-700' : 'border-gray-600'}`}
            >
              <div className="flex flex-col">
                <span className="font-bold">{entity.name || 'Unknown'}</span>
                <span className="text-xs text-neutral-400">HP: {entity.hp ?? p.hp} / AC: {entity.ac ?? 0}</span>
              </div>
              <input 
                type="number" 
                className="w-16 bg-gray-900 border border-gray-600 p-1 rounded text-center"
                value={p.initiative}
                onChange={(e) => updateCombatantInitiative(p.tokenId, parseInt(e.target.value) || 0)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
