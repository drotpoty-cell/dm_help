'use client'

import React from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'

export default function EntityViewerModal() {
  const viewedEntityId = useWorkspaceStore(state => state.viewedEntityId)
  const setViewedEntityId = useWorkspaceStore(state => state.setViewedEntityId)
  const updateEntity = useWorkspaceStore(state => state.updateEntity)
  
  const state = useWorkspaceStore()
  
  // Ищем сущность во всех категориях
  const getEntityData = () => {
    if (!viewedEntityId) return null
    
    const categories: Record<string, Record<string, any>> = { 
        heroes: state.heroes, 
        npcs: state.npcs, 
        enemies: state.enemies, 
        crowd: state.crowd, 
        loot: state.loot, 
        interactive: state.interactive, 
        extras: state.extras,
        quests: state.quests,
        locations: state.locations,
        secrets: state.secrets,
        events: state.events
    }

    for (const [categoryName, categoryObj] of Object.entries(categories)) {
      if (!categoryObj) continue; // КРИТИЧЕСКИЙ ФИКС: защита от падения
      if (categoryObj[viewedEntityId]) {
        return { entity: categoryObj[viewedEntityId], category: categoryName };
      }
    }
    return null
  }

  const entityData = getEntityData()
  if (!viewedEntityId || !entityData) return null

  const { entity, category } = entityData
  const close = () => setViewedEntityId(null)
  
  const [formData, setFormData] = React.useState(entity)

  React.useEffect(() => {
    setFormData(entity)
  }, [entity])

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    updateEntity(category as any, viewedEntityId, formData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={close}>
      <div 
        className="bg-zinc-950 border border-zinc-800 shadow-2xl rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`absolute top-0 left-0 w-full h-1 ${category === 'interactive' ? 'bg-amber-600' : category === 'quests' ? 'bg-amber-500' : category === 'npcs' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>

        <div className="flex justify-between items-start">
          <div className="w-full">
            <Input 
              value={formData.name || formData.title || ''}
              onChange={(e) => handleChange(formData.name !== undefined ? 'name' : 'title', e.target.value)}
              className="text-2xl font-bold bg-transparent border-none p-0 h-auto"
            />
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">
              {category === 'interactive' ? 'Интерактивный объект' : category === 'npcs' ? (formData.occupation || 'Житель') : category === 'quests' ? 'Квест / Сюжет' : 'Локация'}
            </div>
          </div>
          <button onClick={() => { handleSave(); close(); }} className="text-zinc-500 hover:text-white text-xl p-1 leading-none">✕</button>
        </div>

        <div className="flex flex-col gap-2">
            <Label>Описание</Label>
            <Textarea 
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className="bg-zinc-900 border-zinc-800"
            />
        </div>

        {category === 'interactive' && formData.type === 'check' && (
            <div className="flex flex-col gap-2">
                <Label>Сложность (DC)</Label>
                <Input 
                    type="number"
                    value={formData.dc || 10}
                    onChange={(e) => handleChange('dc', parseInt(e.target.value))}
                    className="bg-zinc-900 border-zinc-800"
                />
            </div>
        )}

        <button 
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-sm"
        >
          Сохранить изменения
        </button>

        {category === 'quests' && formData.reward && (
           <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-4">
             <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-500 mb-1">Награда</div>
             <div className="text-xs text-emerald-200">{formData.reward}</div>
           </div>
        )}
      </div>
    </div>
  )
}
