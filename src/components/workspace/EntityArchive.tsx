'use client'

import { useState } from 'react'

interface EntityArchiveProps {
  library: {
    npcs: any[]
    quests: any[]
    locations: any[]
  }
  onUpdateLibrary: (category: string, items: any[]) => void
  onPlaceOnMap: (entity: any, category: string) => void
}

export default function EntityArchive({ library, onUpdateLibrary, onPlaceOnMap }: EntityArchiveProps) {
  const [activeTab, setActiveTab] = useState('npcs')

  const addEntity = () => {
    const newEntity = {
      id: `ent-${Date.now()}`,
      name: 'Новая запись',
      description: '',
      tags: [],
      // Специфические поля для категорий
      ...(activeTab === 'npcs' ? { occupation: '', faction: '', secret: '' } : {}),
      ...(activeTab === 'quests' ? { status: 'available', difficulty: 'medium', rewards: '' } : {}),
    }
    onUpdateLibrary(activeTab, [...library[activeTab as keyof typeof library], newEntity])
  }

  const updateEntity = (id: string, field: string, value: any) => {
    const updated = library[activeTab as keyof typeof library].map((e: any) => 
      e.id === id ? { ...e, [field]: value } : e
    )
    onUpdateLibrary(activeTab, updated)
  }

  return (
    <div className="w-80 bg-zinc-950 border-r border-zinc-900 flex flex-col h-full z-30 shrink-0">
      <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/10">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Архив Мастера</h2>
        <button onClick={addEntity} className="text-indigo-400 hover:text-white text-xl">+</button>
      </div>

      {/* Переключатель категорий */}
      <div className="flex bg-zinc-950 text-[9px] font-bold uppercase border-b border-zinc-900">
        {['npcs', 'quests', 'locations'].map(cat => (
          <button 
            key={cat} 
            onClick={() => setActiveTab(cat)}
            className={`flex-1 py-3 transition-colors ${activeTab === cat ? 'text-indigo-400 bg-zinc-900' : 'text-zinc-600'}`}
          >
            {cat === 'npcs' ? 'НПС' : cat === 'quests' ? 'Квесты' : 'Места'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {library[activeTab as keyof typeof library].map((entity: any) => (
          <div key={entity.id} className="bg-zinc-900/40 border border-zinc-800 p-3 rounded-lg group hover:border-zinc-700 transition-all">
            <input 
              value={entity.name} 
              onChange={(e) => updateEntity(entity.id, 'name', e.target.value)}
              className="bg-transparent font-bold text-sm text-zinc-100 outline-none w-full mb-2"
            />
            <textarea 
              value={entity.description} 
              onChange={(e) => updateEntity(entity.id, 'description', e.target.value)}
              placeholder="Краткое описание..."
              className="bg-transparent text-[11px] text-zinc-500 w-full h-12 resize-none outline-none leading-relaxed"
            />
            
            <div className="mt-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity pt-2 border-t border-zinc-800/50">
              <button 
                onClick={() => onPlaceOnMap(entity, activeTab)}
                className="text-[9px] font-black uppercase tracking-tighter text-indigo-500 hover:text-indigo-300"
              >
                Разместить на карте
              </button>
              <button 
                onClick={() => onUpdateLibrary(activeTab, library[activeTab as keyof typeof library].filter((e:any) => e.id !== entity.id))}
                className="text-zinc-700 hover:text-red-500 text-xs"
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}