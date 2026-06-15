'use client'

import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export default function CockpitSidebar() {
  const heroes = useWorkspaceStore((state) => state.heroes)
  const heroList = Object.values(heroes)

  return (
    <div className="flex flex-col h-full bg-neutral-950 border-r border-neutral-800">
      {/* Секция ГРУППА */}
      <div className="p-4 border-b border-neutral-800">
        <h2 className="text-xs text-neutral-500 uppercase font-semibold mb-3">Группа</h2>
        <div className="space-y-2">
          {heroList.length === 0 ? (
            <p className="text-xs text-neutral-600 italic">Персонажи не найдены</p>
          ) : (
            heroList.map((hero) => (
              <div key={hero.id} className="p-2 rounded bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-neutral-200">{hero.name}</span>
                  <span className="text-xs text-neutral-400">AC: {hero.ac || 10}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-600" 
                      style={{ width: `${((hero.hp || 0) / (hero.maxHp || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-neutral-300">{hero.hp}/{hero.maxHp}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Секция ИНИЦИАТИВА */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xs text-neutral-500 uppercase font-semibold">Инициатива</h2>
          <button className="text-neutral-500 hover:text-neutral-300 transition-colors">+</button>
        </div>
        <div className="text-xs text-neutral-600 italic">Бой не начат</div>
      </div>
    </div>
  )
}
