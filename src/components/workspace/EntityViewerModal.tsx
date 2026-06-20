'use client'

import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'

export default function EntityViewerModal() {
  const viewedEntityId = useWorkspaceStore(state => state.viewedEntityId)
  const setViewedEntityId = useWorkspaceStore(state => state.setViewedEntityId)
  const updateEntity = useWorkspaceStore(state => state.updateEntity)
  
  // Ищем сущность во всех категориях
  const library = useWorkspaceStore(state => ({
    npcs: state.npcs, quests: state.quests, locations: state.locations,
    secrets: state.secrets, loot: state.loot, events: state.events,
    interactive: state.interactive
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
  const handleChange = (field: string, value: any) => {
    updateEntity(type as any, viewedEntityId, { ...entity, [field]: value })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={close}>
      <div 
        className="bg-zinc-950 border border-zinc-800 shadow-2xl rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`absolute top-0 left-0 w-full h-1 ${type === 'interactive' ? 'bg-amber-600' : type === 'quests' ? 'bg-amber-500' : type === 'npcs' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>

        <div className="flex justify-between items-start">
          <div className="w-full">
            <Input 
              value={entity.name || entity.title}
              onChange={(e) => handleChange(entity.name ? 'name' : 'title', e.target.value)}
              className="text-2xl font-bold bg-transparent border-none p-0 h-auto"
            />
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">
              {type === 'interactive' ? 'Интерактивный объект' : type === 'npcs' ? (entity.occupation || 'Житель') : type === 'quests' ? 'Квест / Сюжет' : 'Локация'}
            </div>
          </div>
          <button onClick={close} className="text-zinc-500 hover:text-white text-xl p-1 leading-none">✕</button>
        </div>

        <div className="flex flex-col gap-2">
            <Label>Описание</Label>
            <Textarea 
              value={entity.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="bg-zinc-900 border-zinc-800"
            />
        </div>

        {type === 'interactive' && entity.type === 'check' && (
            <div className="flex flex-col gap-2">
                <Label>Сложность (DC)</Label>
                <Input 
                    type="number"
                    value={entity.dc || 10}
                    onChange={(e) => handleChange('dc', parseInt(e.target.value))}
                    className="bg-zinc-900 border-zinc-800"
                />
            </div>
        )}

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
