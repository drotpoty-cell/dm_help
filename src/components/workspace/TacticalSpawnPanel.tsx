'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { wouldCreateLocationCycle } from '@/utils/locationGraph'

const CATEGORIES: ('heroes' | 'characters' | 'enemies' | 'extras' | 'loot' | 'interactive')[] = [
  'heroes', 'characters', 'enemies', 'extras', 'loot', 'interactive',
]
const CATEGORY_NAMES: Record<string, string> = {
  heroes: 'Герои',
  characters: 'Действующие лица',
  enemies: 'Противники',
  extras: 'Массовка',
  loot: 'Артефакты / Лут',
  interactive: 'Интерактивные объекты',
}

function getTokenType(category: string, item: any): 'hero' | 'npc' | 'poi' | 'check' | 'enemies' | 'extra' | 'loot' | 'location' {
  if (category === 'heroes') return 'hero'
  if (category === 'characters') return 'npc'
  if (category === 'extras') return 'extra'
  if (category === 'interactive') return item.type || 'poi'
  return category as any
}

/**
 * Панель добавления сущностей на тактическую доску активной локации (Блок 3) —
 * прежний "Архив" из LocalMapBoard, теперь плавающая панель поверх GameTable. Показывается,
 * пока открыт бой (activeLocalMapId), а не только на максимальном зуме — ГМ может
 * подготовить токены заранее, до того как визуально провалится в тактический режим.
 */
export default function TacticalSpawnPanel({ locationId, onClose }: { locationId: string; onClose: () => void }) {
  const store = useWorkspaceStore()
  const mapData = store.localMaps[locationId]
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={`absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-neutral-950/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl flex flex-col transition-all ${isCollapsed ? 'w-12' : 'w-72 max-h-[70vh]'}`}>
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        {!isCollapsed && <span className="text-white text-sm font-black tracking-wide">Добавить на доску</span>}
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => setIsCollapsed((v) => !v)} className="text-neutral-500 hover:text-white text-xs px-1" title={isCollapsed ? 'Развернуть' : 'Свернуть'}>
            {isCollapsed ? '▶' : '◀'}
          </button>
          {!isCollapsed && <button onClick={onClose} className="text-neutral-500 hover:text-white text-xs px-1">✕</button>}
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => store.createAndSpawnInteractive(locationId, 'poi')}
              className="w-full bg-amber-600/90 hover:bg-amber-500 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-md transition-colors"
            >
              ➕ Точка интереса
            </button>
            <button
              onClick={() => store.createAndSpawnInteractive(locationId, 'check')}
              className="w-full bg-fuchsia-700/90 hover:bg-fuchsia-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-md transition-colors"
            >
              ➕ Проверка
            </button>
          </div>

          {CATEGORIES.map((category) => (
            <div key={category}>
              <div className="text-[10px] text-neutral-500 font-black uppercase mb-2 tracking-widest">
                {CATEGORY_NAMES[category]}
              </div>
              <div className="space-y-1">
                {Object.values((store as any)[category] || {}).map((item: any) => {
                  const isOnMap = Object.values(mapData?.tokens || {}).some((t: any) => t.entityId === item.id)
                  return (
                    <div key={item.id} className="flex justify-between items-center text-neutral-300 text-xs p-1.5 hover:bg-white/[0.04] rounded-lg group">
                      <span className="truncate pr-2 group-hover:text-white transition-colors">{item.name}</span>
                      <button
                        onClick={() => store.spawnEntityToMap(locationId, item, getTokenType(category, item))}
                        disabled={isOnMap}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition-all ${isOnMap ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md'}`}
                      >
                        {isOnMap ? 'На доске' : '+'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Блок 2: вложенные локации-порталы — та же карточка локации может стоять
              токеном внутри тактической доски ДРУГОЙ локации ("Таверна" внутри "Города"). */}
          <div>
            <div className="text-[10px] text-violet-400/80 font-black uppercase mb-2 tracking-widest">
              🌀 Локации (вложенность)
            </div>
            <div className="space-y-1">
              {Object.values(store.locations || {})
                .filter((loc: any) => loc.id !== locationId)
                .map((loc: any) => {
                  const isOnMap = Object.values(mapData?.tokens || {}).some((t: any) => t.entityId === loc.id)
                  return (
                    <div key={loc.id} className="flex justify-between items-center text-neutral-300 text-xs p-1.5 hover:bg-violet-500/[0.06] rounded-lg group">
                      <span className="truncate pr-2 group-hover:text-white transition-colors">{loc.name}</span>
                      <button
                        onClick={() => {
                          if (wouldCreateLocationCycle(loc.id, locationId, store.localMaps)) {
                            toast.error('🌀 Нарушение пространственно-временного континуума: эта локация уже содержит текущую карту.')
                            return
                          }
                          store.spawnEntityToMap(locationId, loc, 'location')
                        }}
                        disabled={isOnMap}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition-all ${isOnMap ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed' : 'bg-violet-700 text-white hover:bg-violet-600 shadow-md'}`}
                      >
                        {isOnMap ? 'На доске' : '+'}
                      </button>
                    </div>
                  )
                })}
              {Object.values(store.locations || {}).filter((loc: any) => loc.id !== locationId).length === 0 && (
                <div className="text-[10px] text-neutral-600 italic px-1.5">Больше локаций в Архиве нет.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
