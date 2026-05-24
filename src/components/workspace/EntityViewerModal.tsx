'use client'

import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export default function EntityViewerModal() {
  const viewedEntityId = useWorkspaceStore(state => state.viewedEntityId)
  const setViewedEntityId = useWorkspaceStore(state => state.setViewedEntityId)
  
  // Ищем сущность во всех категориях
  const library = useWorkspaceStore(state => ({
    npcs: state.npcs, quests: state.quests, locations: state.locations,
    secrets: state.secrets, loot: state.loot, events: state.events
  }))

  if (!viewedEntityId) return null

  // Пытаемся найти, кто это такой
  let entity: any = null
  let type = ''
  
  for (const [key, category] of Object.entries(library)) {
    if (category[viewedEntityId]) {
      entity = category[viewedEntityId]
      type = key
      break
    }
  }

  if (!entity) return null

  const close = () => setViewedEntityId(null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={close}>
      <div 
        className="bg-zinc-950 border border-zinc-800 shadow-2xl rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Чтобы клик внутри окна не закрывал его
      >
        {/* Декоративная полоска */}
        <div className={`absolute top-0 left-0 w-full h-1 ${type === 'quests' ? 'bg-amber-500' : type === 'npcs' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>

        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">{entity.title || entity.name}</h2>
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">
              {type === 'npcs' ? (entity.occupation || 'Житель') : type === 'quests' ? 'Квест / Сюжет' : 'Локация'}
            </div>
          </div>
          <button onClick={close} className="text-zinc-500 hover:text-white text-xl p-1 leading-none">✕</button>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 mt-2">
           <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
             {entity.description || entity.hook || 'Нет детального описания.'}
           </div>
        </div>

        {/* Специфичные данные для квестов */}
        {type === 'quests' && entity.reward && (
           <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-4">
             <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-500 mb-1">Награда</div>
             <div className="text-xs text-emerald-200">{entity.reward}</div>
           </div>
        )}
      </div>
    </div>
  )
}