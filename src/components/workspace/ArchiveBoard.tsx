'use client'

import { useState } from 'react'

interface ArchiveBoardProps {
  library: any
  onUpdateLibrary: (category: string, items: any[]) => void
  onPlaceOnMap: (entity: any, category: string) => void
  nodes: any[] // Передаем карту, чтобы видеть, куда селить NPC
}

export default function ArchiveBoard({ library, onUpdateLibrary, onPlaceOnMap, nodes }: ArchiveBoardProps) {
  const [activeTab, setActiveTab] = useState('locations')

  const tabs = [
    { id: 'locations', label: 'Локации' },
    { id: 'npcs', label: 'Персонажи' },
    { id: 'quests', label: 'Сюжеты' },
    { id: 'secrets', label: 'Секреты' },
    { id: 'loot', label: 'Артефакты' },
    { id: 'events', label: 'События' }
  ]

  const addEntity = () => {
    const newEntity = {
      id: `ent-${Date.now()}`,
      name: 'Новая запись',
      description: '',
      ...(activeTab === 'npcs' ? { occupation: '', locationId: 'none' } : {}),
      ...(activeTab === 'quests' ? { reward: '', consequence: '' } : {}),
    }
    onUpdateLibrary(activeTab, [...(library[activeTab] || []), newEntity])
  }

  const updateEntity = (id: string, field: string, value: any) => {
    const updated = library[activeTab].map((e: any) => e.id === id ? { ...e, [field]: value } : e)
    onUpdateLibrary(activeTab, updated)
  }

  const deleteEntity = (id: string) => {
    if(window.confirm('Навсегда удалить запись из базы?')) {
      onUpdateLibrary(activeTab, library[activeTab].filter((e: any) => e.id !== id))
    }
  }

  const items = library[activeTab] || []

  return (
    <div className="absolute inset-0 bg-[#09090b] flex z-10">
      
      {/* Боковое меню навигации */}
      <div className="w-64 bg-zinc-950 border-r border-zinc-900 p-6 flex flex-col gap-2">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4 pl-4">Категории</div>
        {tabs.map(tab => (
          <button 
            key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab.id ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 border border-transparent'}`}
          >
            {tab.label} <span className="float-right text-zinc-600">{(library[tab.id] || []).length}</span>
          </button>
        ))}
      </div>

      {/* Основная рабочая область базы данных */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
            <h2 className="text-2xl font-bold text-white uppercase tracking-widest">{tabs.find(t => t.id === activeTab)?.label}</h2>
            <button onClick={addEntity} className="bg-indigo-600 text-white px-6 py-2 rounded font-bold uppercase tracking-widest text-[10px] hover:bg-indigo-500 transition-colors">
              + Создать новую запись
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((entity: any) => (
              <div key={entity.id} className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl flex flex-col gap-4 group hover:border-zinc-600 transition-colors">
                
                <div className="flex justify-between items-start">
                  <input 
                    value={entity.name} onChange={(e) => updateEntity(entity.id, 'name', e.target.value)}
                    className="bg-transparent font-bold text-lg text-zinc-100 outline-none w-full focus:border-b focus:border-indigo-500"
                    placeholder="Название..."
                  />
                  <button onClick={() => deleteEntity(entity.id)} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                </div>

                {activeTab === 'npcs' && (
                  <input 
                    value={entity.occupation} onChange={(e) => updateEntity(entity.id, 'occupation', e.target.value)}
                    className="bg-zinc-950/50 border border-zinc-800 p-2 rounded text-xs text-indigo-300 outline-none w-full"
                    placeholder="Роль (Торговец, Стражник...)"
                  />
                )}

                <textarea 
                  value={entity.description} onChange={(e) => updateEntity(entity.id, 'description', e.target.value)}
                  placeholder="Детальное описание (лор)..."
                  className="bg-transparent text-sm text-zinc-400 w-full h-24 resize-none outline-none leading-relaxed"
                />

                {/* Действия в зависимости от категории */}
                <div className="mt-auto pt-4 border-t border-zinc-800/50">
                  {activeTab === 'locations' ? (
                    <button onClick={() => onPlaceOnMap(entity, 'locations')} className="w-full py-2 bg-zinc-800 hover:bg-indigo-900/50 hover:text-indigo-300 text-zinc-400 text-[10px] font-bold uppercase tracking-widest rounded transition-colors border border-zinc-700 hover:border-indigo-500/50">
                      Создать узел на Карте
                    </button>
                  ) : activeTab === 'npcs' ? (
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase">Поселить в локацию:</label>
                      <select 
                        value={entity.locationId || 'none'}
                        onChange={(e) => updateEntity(entity.id, 'locationId', e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] font-bold uppercase p-1.5 rounded outline-none"
                      >
                        <option value="none">-- Не на карте --</option>
                        {nodes.filter(n => n.type !== 'region').map(n => (
                          <option key={n.id} value={n.id}>{n.data.label}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest text-center">
                      Доступно через @Упоминания
                    </div>
                  )}
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="col-span-full py-20 text-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded-xl text-xs font-bold uppercase tracking-widest">
                В этой категории пока нет записей
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}