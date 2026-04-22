'use client'

import { useState } from 'react'

interface SidebarProps {
  selectedNode: any | null
  nodes: any[]
  library: any
  onUpdateLibrary: (category: string, items: any[]) => void
  onClose: () => void
  onUpdateNode: (id: string, field: string, value: any) => void
  currentDay: number
  onClearUpdate: (type: 'node' | 'npc', id: string) => void
}

// --- УМНЫЙ РЕДАКТОР С WIKI-ССЫЛКАМИ ---
const SmartEditor = ({ value, onChange, library, placeholder }: any) => {
  const [isEditing, setIsEditing] = useState(false)

  const renderFormattedText = (text: string) => {
    if (!text) return <span className="text-zinc-600 italic">Пусто. Кликните, чтобы добавить...</span>
    
    const allEntities = [...library.npcs, ...library.quests, ...library.locations]
    let formattedText = text

    allEntities.forEach(entity => {
      if (!entity.name) return
      // Исправленная регулярка для кириллицы
      const regex = new RegExp(`@${entity.name}(?![\\wа-яА-ЯёЁ])`, 'gi')
      formattedText = formattedText.replace(regex, `<span class="text-indigo-400 bg-indigo-900/30 px-1.5 py-0.5 rounded font-bold cursor-pointer hover:bg-indigo-900/50 transition-colors border border-indigo-900/50">@${entity.name}</span>`)
    })

    return <div dangerouslySetInnerHTML={{ __html: formattedText }} className="whitespace-pre-wrap leading-relaxed" />
  }

  return (
    <div className="w-full h-full min-h-[300px] flex flex-col">
      <div className="flex justify-end mb-2">
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 hover:text-indigo-400 transition-colors"
        >
          {isEditing ? 'Режим просмотра' : 'Режим редактирования'}
        </button>
      </div>

      {isEditing ? (
        <textarea 
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full flex-1 bg-zinc-950/50 border border-indigo-900/50 rounded-xl p-4 text-sm text-zinc-300 resize-none focus:outline-none focus:border-indigo-500 font-mono"
          placeholder={placeholder}
          autoFocus
        />
      ) : (
        <div 
          onClick={() => setIsEditing(true)}
          className="w-full flex-1 bg-transparent border border-transparent p-4 text-sm text-zinc-300 cursor-text hover:bg-zinc-900/30 rounded-xl transition-colors"
        >
          {renderFormattedText(value)}
        </div>
      )}
      <div className="text-[10px] text-zinc-600 mt-2">Совет: Используйте символ @ перед точным именем из Архива для создания связи.</div>
    </div>
  )
}

export default function Sidebar({ selectedNode, nodes, library, onUpdateLibrary, onClose, onUpdateNode, currentDay, onClearUpdate }: SidebarProps) {
  const [activeTab, setActiveTab] = useState('general')

  if (!selectedNode) return null

  const quests = Array.isArray(selectedNode.data.quests) ? selectedNode.data.quests : []
  const localNpcs = library.npcs.filter((npc: any) => npc.locationId === selectedNode.id)

  const updateQuest = (questId: string, field: string, value: any) => {
    const updatedQuests = quests.map((q: any) => q.id === questId ? { ...q, [field]: value } : q)
    onUpdateNode(selectedNode.id, 'quests', updatedQuests)
  }

  const moveNpc = (npcId: string, newLocationId: string) => {
    const updatedNpcs = library.npcs.map((npc: any) => 
      npc.id === npcId ? { ...npc, locationId: newLocationId === 'none' ? null : newLocationId } : npc
    )
    onUpdateLibrary('npcs', updatedNpcs)
  }

  const deleteNpc = (npcId: string) => {
    if(window.confirm('Вы уверены, что хотите удалить персонажа из мира?')) {
      onUpdateLibrary('npcs', library.npcs.filter((n: any) => n.id !== npcId))
    }
  }

  const takeQuest = (questId: string) => {
    updateQuest(questId, 'startDay', currentDay)
    updateQuest(questId, 'status', 'active')
  }

  return (
    <div className="w-[500px] bg-zinc-950 border-l border-zinc-900 flex flex-col h-full shadow-2xl z-30 shrink-0">
      
      {/* Шапка */}
      <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20">
        <input 
          type="text" value={selectedNode.data.label} 
          onChange={(e) => onUpdateNode(selectedNode.id, 'label', e.target.value)}
          className="bg-transparent text-xl font-bold text-zinc-100 focus:outline-none w-full mr-4"
        />
        <button onClick={onClose} className="text-zinc-500 hover:text-white text-2xl leading-none">×</button>
      </div>

      {/* УВЕДОМЛЕНИЕ ДЛЯ ЛОКАЦИИ (!) */}
      {selectedNode.data.needsUpdate && (
        <div className="bg-red-950/40 border-b border-red-900/50 p-4 flex items-start gap-4">
          <div className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-black animate-pulse shrink-0">!</div>
          <div className="flex-1">
            <h4 className="text-red-400 text-[10px] font-black uppercase tracking-widest mb-1">Сюжетный сдвиг</h4>
            <p className="text-zinc-400 text-xs leading-relaxed mb-3">Один из квестов в этой зоне завершен. Внесите изменения в лор и описание локации.</p>
            <button 
              onClick={() => onClearUpdate('node', selectedNode.id)} 
              className="bg-red-500/20 hover:bg-red-500/40 text-red-400 text-[9px] font-bold uppercase tracking-widest px-3 py-2 rounded transition-colors"
            >
              Последствия описаны (Снять метку)
            </button>
          </div>
        </div>
      )}

      {/* Вкладки */}
      <div className="flex bg-zinc-950 text-[10px] font-bold uppercase tracking-widest border-b border-zinc-900 shrink-0">
        {['general', 'npcs', 'quests', 'secrets'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-5 py-4 flex-1 transition-all ${activeTab === t ? 'text-indigo-400 bg-zinc-900 border-b-2 border-indigo-400' : 'text-zinc-500'}`}>
            {t === 'general' ? 'Мир' : t === 'npcs' ? `Жители (${localNpcs.length})` : t === 'quests' ? 'Квесты' : 'Секреты'}
          </button>
        ))}
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        
        {/* ВКЛАДКА: МИР / СЕКРЕТЫ */}
        {(activeTab === 'general' || activeTab === 'secrets') && (
          <SmartEditor 
            value={selectedNode.data[activeTab === 'general' ? 'description' : 'secrets']}
            onChange={(val: string) => onUpdateNode(selectedNode.id, activeTab === 'general' ? 'description' : 'secrets', val)}
            library={library}
            placeholder={`Введите данные для ${activeTab}...`}
          />
        )}

        {/* ВКЛАДКА: ЖИТЕЛИ */}
        {activeTab === 'npcs' && (
          <div className="space-y-4">
            {localNpcs.length === 0 ? (
              <div className="text-center text-zinc-600 text-sm py-10">В этой локации пока нет персонажей. Добавьте их из Архива.</div>
            ) : (
              localNpcs.map((npc: any) => (
                <div key={npc.id} className={`bg-zinc-900/30 border rounded-xl p-4 flex flex-col gap-3 group transition-colors ${npc.needsUpdate ? 'border-red-900/50 shadow-[0_0_15px_rgba(153,27,27,0.2)]' : 'border-zinc-800 hover:border-zinc-700'}`}>
                  <div className="flex justify-between items-center border-b border-zinc-800/50 pb-2">
                    <div>
                      <div className="text-zinc-100 font-bold">{npc.name}</div>
                      <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">{npc.occupation || 'Житель'}</div>
                    </div>
                    <button onClick={() => deleteNpc(npc.id)} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                  </div>
                  
                  {/* УВЕДОМЛЕНИЕ ДЛЯ НИПА (!) */}
                  {npc.needsUpdate && (
                    <div className="bg-red-500/10 text-red-400 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md flex justify-between items-center mt-1">
                      <span className="flex items-center gap-2"><span className="bg-red-500 w-2 h-2 rounded-full animate-ping"></span> Затронут сюжетом</span>
                      <button onClick={() => onClearUpdate('npc', npc.id)} className="hover:text-white transition-colors underline">Очистить</button>
                    </div>
                  )}

                  <div className="text-sm text-zinc-400 leading-relaxed">{npc.description || 'Нет описания.'}</div>
                  <div className="pt-2 flex items-center justify-between border-t border-zinc-800/50 mt-1">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase">Местоположение:</span>
                    <select 
                      value={npc.locationId || 'none'}
                      onChange={(e) => moveNpc(npc.id, e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] font-bold uppercase p-1.5 rounded outline-none focus:border-indigo-500"
                    >
                      <option value="none">-- Убрать с карты --</option>
                      {nodes.filter(n => n.type !== 'region').map(n => (
                        <option key={n.id} value={n.id}>{n.data.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ВКЛАДКА: КВЕСТЫ */}
        {activeTab === 'quests' && (
          <div className="space-y-6">
            {quests.length === 0 && (
              <div className="text-center text-zinc-600 text-sm py-10">Здесь пока нет заданий. Добавьте их из Архива Мастера.</div>
            )}
            
            {quests.map((q: any) => {
              const isExpired = q.status === 'active' && currentDay > (q.startDay + q.deadline)
              
              return (
                <div key={q.id} className={`bg-zinc-900/30 border rounded-xl p-5 flex flex-col gap-4 transition-all ${q.status === 'active' ? 'border-indigo-900' : 'border-zinc-800'}`}>
                  {/* Шапка квеста */}
                  <div className="flex gap-2 items-center">
                    <input 
                      type="text" value={q.title} onChange={(e) => updateQuest(q.id, 'title', e.target.value)}
                      className="flex-1 bg-transparent font-bold text-white focus:outline-none border-b border-transparent focus:border-indigo-500"
                    />
                    <button onClick={() => onUpdateNode(selectedNode.id, 'quests', quests.filter((qu:any) => qu.id !== q.id))} className="text-zinc-600 hover:text-red-500 font-bold">✕</button>
                  </div>

                  {/* Описание (Подача и Механика) */}
                  <div className="flex flex-col gap-3">
                    <div>
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Подача игрокам (Слух)</label>
                        <textarea value={q.hook} onChange={(e) => updateQuest(q.id, 'hook', e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-800 p-2 text-xs text-zinc-300 rounded outline-none resize-none h-16" />
                    </div>
                    <div>
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Скрытая Механика (Для мастера)</label>
                        <SmartEditor value={q.description} onChange={(val: string) => updateQuest(q.id, 'description', val)} library={library} placeholder="Детали квеста..." />
                    </div>
                  </div>

                  {/* Сроки и выдача */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Кто дает</label>
                      <input type="text" value={q.giver} onChange={(e) => updateQuest(q.id, 'giver', e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-800 p-2 text-xs text-zinc-300 rounded outline-none" />
                    </div>
                    <div className="w-24">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Срок (Дней)</label>
                      <input type="number" value={q.deadline} onChange={(e) => updateQuest(q.id, 'deadline', parseInt(e.target.value))} className="w-full bg-zinc-950/50 border border-zinc-800 p-2 text-xs text-amber-400 rounded outline-none text-center font-bold" />
                    </div>
                  </div>

                  {/* ЯВНЫЕ ИТОГИ */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">В случае успеха (Награда)</label>
                      <textarea value={q.reward} onChange={(e) => updateQuest(q.id, 'reward', e.target.value)} className="w-full bg-emerald-950/10 border border-emerald-900/30 p-2 text-xs text-emerald-200 rounded outline-none resize-none h-16" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] font-bold text-red-600 uppercase tracking-wider block mb-1">Провал / Истек срок</label>
                      <textarea value={q.consequence} onChange={(e) => updateQuest(q.id, 'consequence', e.target.value)} className="w-full bg-red-950/10 border border-red-900/30 p-2 text-xs text-red-200 rounded outline-none resize-none h-16" />
                    </div>
                  </div>

                  {/* ПАНЕЛЬ СТАТУСА И УПРАВЛЕНИЯ */}
                  <div className="pt-4 border-t border-zinc-800/50 flex justify-between items-center">
                    {q.status === 'available' ? (
                      <button onClick={() => takeQuest(q.id)} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded transition-colors">Выдать игрокам</button>
                    ) : q.status === 'active' ? (
                      <div className="w-full flex gap-2">
                         <div className={`flex-1 flex items-center justify-center text-[10px] font-bold rounded tracking-widest ${isExpired ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-300'}`}>
                           {isExpired ? 'СРОК ВЫШЕЛ!' : `ОСТАЛОСЬ: ${Math.max(0, (q.startDay + q.deadline) - currentDay)} ДН.`}
                         </div>
                         <button onClick={() => updateQuest(q.id, 'status', 'completed')} className="px-4 py-2 bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600/40 text-[10px] font-black uppercase rounded tracking-widest transition-colors">Успех</button>
                         <button onClick={() => updateQuest(q.id, 'status', 'failed')} className="px-4 py-2 bg-red-600/20 text-red-500 hover:bg-red-600/40 text-[10px] font-black uppercase rounded tracking-widest transition-colors">Провал</button>
                      </div>
                    ) : (
                      <div className={`w-full text-center py-2 text-[10px] font-black uppercase rounded tracking-widest ${q.status === 'completed' ? 'bg-emerald-900/20 text-emerald-500' : 'bg-red-900/20 text-red-500'}`}>
                        {q.status === 'completed' ? 'КВЕСТ ЗАВЕРШЕН' : 'КВЕСТ ПРОВАЛЕН'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}