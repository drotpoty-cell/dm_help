'use client'

import { useState } from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { Users, Swords } from 'lucide-react'
import { InitiativeTracker } from '../InitiativeTracker'
import SettingsModal from '../SettingsModal'

export default function CockpitSidebar() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const heroes = useWorkspaceStore((state) => state.heroes)
  const activeView = useWorkspaceStore((state) => state.activeView)
  const activeLocalMapId = useWorkspaceStore((state) => state.activeLocalMapId)
  const heroList = Object.values(heroes)

  return (
    <div className="flex flex-col h-full bg-neutral-950 border-r border-neutral-800">
      {/* Секция ГРУППА */}
      <div className="p-4 border-b border-neutral-800/50">
        <div className="flex items-center gap-2 mb-3 text-neutral-400">
          <Users className="w-3.5 h-3.5" />
          <h2 className="text-[11px] uppercase tracking-wider font-semibold">Группа</h2>
        </div>
        <div className="space-y-2">
          {heroList.length === 0 ? (
            <p className="text-[10px] text-neutral-600 italic tracking-wider">Персонажи не найдены</p>
          ) : (
            heroList.map((hero) => (
              <div 
                key={hero.id} 
                className="p-2 rounded bg-neutral-900 border border-neutral-800/50 hover:border-neutral-700 transition-colors cursor-pointer"
                onClick={() => useWorkspaceStore.getState().setViewedEntityId(hero.id)}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-medium text-neutral-200">{hero.name}</span>
                  <span className="text-[10px] text-neutral-500">AC: {hero.ac || 10}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-600" 
                      style={{ width: `${((hero.hp || 0) / (hero.maxHp || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-neutral-300">{hero.hp}/{hero.maxHp}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Секция ИНИЦИАТИВА */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3 text-neutral-400">
          <div className="flex items-center gap-2">
            <Swords className="w-3.5 h-3.5" />
            <h2 className="text-[11px] uppercase tracking-wider font-semibold">Инициатива</h2>
          </div>
        </div>
        {activeView === 'map' && activeLocalMapId && <InitiativeTracker />}
      </div>

      <div className="mt-auto p-4 border-t border-neutral-800">
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="mt-auto flex items-center gap-3 px-4 py-3 text-sm font-bold text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors w-full"
        >
          <span className="text-xl">⚙️</span> Настройки
        </button>
      </div>

      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  )
}
