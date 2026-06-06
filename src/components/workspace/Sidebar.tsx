'use client'

import { useState, useMemo } from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { AiWand } from './ai/AiWand'
import LocationLootGenerator from './ai/LocationLootGenerator'

interface SidebarProps {
  selectedNodeId: string
  onClose: () => void
}

const SmartEditor = ({ value, onChange, placeholder, mode, contextData }: { value: string, onChange: (val: string) => void, placeholder: string, mode?: 'location' | 'general', contextData?: any }) => {
  const [isEditing, setIsEditing] = useState(false)
  const library = useWorkspaceStore(state => ({
    characters: Object.values(state.characters), extras: Object.values(state.extras), factions: Object.values(state.factions), bestiary: Object.values(state.bestiary), quests: Object.values(state.quests), locations: Object.values(state.locations)
  }))

  const renderFormattedText = (text: string) => {
    if (!text) return <span className="text-zinc-600 italic">Пусто. Кликните, чтобы добавить...</span>
    let formattedText = text
    const allEntities = [...library.characters, ...library.extras, ...library.factions, ...library.bestiary, ...library.quests, ...library.locations]
    
    allEntities.forEach((entity: any) => {
      const name = entity.name || entity.title
      if (!name) return
      const regex = new RegExp(`@${name}(?![\\wа-яА-ЯёЁ])`, 'gi')
      formattedText = formattedText.replace(regex, `<span class="text-indigo-400 bg-indigo-900/30 px-1.5 py-0.5 rounded font-bold cursor-pointer hover:bg-indigo-900/50 border border-indigo-900/50">@${name}</span>`)
    })
    return <div dangerouslySetInnerHTML={{ __html: formattedText }} className="whitespace-pre-wrap leading-relaxed" />
  }

  return (
    <div className="w-full h-full min-h-[300px] flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          {mode === 'location' ? 'Описание локации' : 'Описание / Секрет'}
        </label>
        <div className="flex items-center gap-3">
          <AiWand 
            mode={mode} 
            currentValue={value || ''} 
            contextData={contextData} 
            onApply={(text) => { onChange(text); setIsEditing(false); }} 
          />
          <button onClick={() => setIsEditing(!isEditing)} className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 hover:text-indigo-400">
            {isEditing ? 'Режим просмотра' : 'Режим редактирования'}
          </button>
        </div>
      </div>
      {isEditing ? (
        <textarea 
          value={value || ''} onChange={(e) => onChange(e.target.value)}
          className="w-full flex-1 bg-zinc-950/50 border border-indigo-900/50 rounded-xl p-4 text-sm text-zinc-300 resize-none outline-none focus:border-indigo-500"
          placeholder={placeholder} autoFocus
        />
      ) : (
        <div onClick={() => setIsEditing(true)} className="w-full flex-1 p-4 text-sm text-zinc-300 cursor-text hover:bg-zinc-900/30 rounded-xl border border-transparent">
          {renderFormattedText(value)}
        </div>
      )}
    </div>
  )
}

const TABS = ['general', 'inhabitants', 'threats', 'quests', 'loot', 'secrets'] as const;
type Tab = typeof TABS[number];

export default function Sidebar({ selectedNodeId, onClose }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<Tab>('general');

  const { nodes, setNodes, currentDay, updateEntity, updateQuestStatus, clearNeedsUpdate, characters, extras, bestiary, factions, quests, loot: storeLoot } = useWorkspaceStore()
  const selectedNode = nodes.find(n => n.id === selectedNodeId)

  if (!selectedNode) return null
  
  const allCharacters = useMemo(() => Object.values(characters || {}), [characters])
  const allExtras = useMemo(() => Object.values(extras || {}), [extras])
  const allBestiary = useMemo(() => Object.values(bestiary || {}), [bestiary])
  const allQuests = useMemo(() => Object.values(quests || {}), [quests])
  const loot = useMemo(() => Object.values(storeLoot || {}), [storeLoot])

  const { localCharacters, localExtras, localBestiary, localQuests, localLoot, availableCharacters, availableExtras, availableBestiary, availableQuests } = useMemo(() => ({
    localCharacters: allCharacters.filter((c: any) => c.locationId === selectedNodeId),
    localExtras: allExtras.filter((e: any) => e.locationId === selectedNodeId),
    localBestiary: allBestiary.filter((b: any) => b.locationId === selectedNodeId),
    localQuests: allQuests.filter((q: any) => q.locationId === selectedNodeId),
    localLoot: loot.filter((l: any) => l.ownerId === selectedNodeId),
    availableCharacters: allCharacters.filter((c: any) => c.locationId !== selectedNodeId),
    availableExtras: allExtras.filter((e: any) => e.locationId !== selectedNodeId),
    availableBestiary: allBestiary.filter((b: any) => b.locationId !== selectedNodeId),
    availableQuests: allQuests.filter((q: any) => q.locationId !== selectedNodeId),
  }), [allCharacters, allExtras, allBestiary, allQuests, loot, selectedNodeId])

  const updateNodeData = (field: string, value: any) => {
    setNodes(nodes.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, [field]: value } } : n))
    
    if (selectedNode.data.entityId) {
      const updateData: any = {}
      if (field === 'label') updateData.name = value
      if (field === 'description') updateData.description = value
      
      if (Object.keys(updateData).length > 0) {
        updateEntity('locations', selectedNode.data.entityId, updateData)
      }
    }
  }

  const attachNpc = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value) updateEntity('npcs', e.target.value, { locationId: selectedNodeId })
  }
  const attachQuest = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value) updateEntity('quests', e.target.value, { locationId: selectedNodeId })
  }

  return (
    <div className="fixed top-16 right-0 bottom-0 w-[500px] bg-zinc-950 border-l border-zinc-900 flex flex-col shadow-2xl z-50">
      <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20">
        <input 
          type="text" value={selectedNode.data.label} onChange={(e) => updateNodeData('label', e.target.value)}
          className="bg-transparent text-xl font-bold text-zinc-100 focus:outline-none w-full mr-4"
          placeholder="Название локации..."
        />
        <button onClick={onClose} className="text-zinc-500 hover:text-white text-2xl leading-none">×</button>
      </div>

      {selectedNode.data.needsUpdate && (
        <div className="bg-red-950/40 border-b border-red-900/50 p-4 flex items-start gap-4">
          <div className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-black animate-pulse shrink-0">!</div>
          <div className="flex-1">
            <h4 className="text-red-400 text-[10px] font-black uppercase tracking-widest mb-1">Сюжетный сдвиг</h4>
            <p className="text-zinc-400 text-xs leading-relaxed mb-3">Один из квестов завершен. Внесите изменения в лор локации.</p>
            <button onClick={() => clearNeedsUpdate('node', selectedNode.id)} className="bg-red-500/20 hover:bg-red-500/40 text-red-400 text-[9px] font-bold uppercase px-3 py-2 rounded">
              Снять метку
            </button>
          </div>
        </div>
      )}

      <div className="flex bg-zinc-950 text-[10px] font-bold uppercase tracking-widest border-b border-zinc-900 shrink-0">
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t as Tab)} className={`px-5 py-4 flex-1 transition-all ${activeTab === t ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
            {t === 'general' ? 'Мир' : t === 'inhabitants' ? `Жители (${localCharacters.length + localExtras.length})` : t === 'threats' ? `Угрозы (${localBestiary.length})` : t === 'quests' ? 'Квесты' : t === 'loot' ? `Лут (${localLoot.length})` : 'Секреты'}
          </button>
        ))}
      </div>

      {/* 2. Добавлен min-h-0 сюда, чтобы скролл работал правильно */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {(activeTab === 'general' || activeTab === 'secrets') && (
          <SmartEditor 
            value={selectedNode.data[activeTab === 'general' ? 'description' : 'secrets']}
            onChange={(val: string) => updateNodeData(activeTab === 'general' ? 'description' : 'secrets', val)}
            placeholder={activeTab === 'general' ? "Опишите влажный воздух, запахи и звуки..." : "Скрытая информация..."}
            mode={activeTab === 'general' ? 'location' : 'general'}
            contextData={selectedNode.data}
          />
        )}

        {/* --- ВКЛАДКА ЛУТ --- */}
        {activeTab === 'loot' && (
          <div className="space-y-4">
            
            {/* НОВЫЙ БЛОК ГЕНЕРАЦИИ ЛУТА */}
            <LocationLootGenerator 
              locationId={selectedNode.id}
              locationName={selectedNode.data.label}
              locationDescription={selectedNode.data.description}
              locationType={selectedNode.type || ''}
            />

            {localLoot.length === 0 ? (
              <div className="text-center text-zinc-600 text-sm py-10 border border-dashed border-zinc-800 rounded-xl">В этой локации нет спрятанных предметов. Добавьте их через Архив.</div>
            ) : (
              localLoot.map((item: any) => (
                <div key={item.id} className={`bg-zinc-900/30 border rounded-xl p-4 flex flex-col gap-3 transition-colors ${item.rarity === 'legendary' ? 'border-orange-900/50 shadow-[0_0_15px_rgba(251,146,60,0.05)]' : item.rarity === 'epic' ? 'border-purple-900/50' : item.rarity === 'rare' ? 'border-blue-900/50' : 'border-zinc-800'}`}>
                  <div className="flex justify-between items-start border-b border-zinc-800/50 pb-2">
                    <div>
                      <div className={`font-bold text-lg ${item.rarity === 'legendary' ? 'text-orange-400' : item.rarity === 'epic' ? 'text-purple-400' : item.rarity === 'rare' ? 'text-blue-400' : 'text-zinc-100'}`}>{item.name}</div>
                      <div className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider mt-0.5">{item.rarity === 'legendary' ? 'Легендарный' : item.rarity === 'epic' ? 'Эпический' : item.rarity === 'rare' ? 'Редкий' : 'Обычный'}</div>
                    </div>
                    <button onClick={() => updateEntity('loot', item.id, { ownerId: null })} className="text-zinc-600 hover:text-amber-500 text-[10px] uppercase font-bold tracking-widest transition-colors">Забрать</button>
                  </div>
                  <div className="flex gap-4 text-[10px] font-bold text-zinc-400">
                    {item.price > 0 && <div className="text-amber-500/80">💰 {item.price} gp</div>}
                    {item.weight > 0 && <div>⚖️ {item.weight} кг</div>}
                    {item.stats && <div className="text-indigo-400/80">⚔️ {item.stats}</div>}
                  </div>
                  <div className="text-sm text-zinc-400 leading-relaxed">{item.description || 'Нет описания.'}</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- ВКЛАДКА ЖИТЕЛИ --- */}
        {activeTab === 'inhabitants' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 mb-4">
              <select onChange={(e) => updateEntity('characters', e.target.value, { locationId: selectedNodeId })} value="" className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-bold uppercase p-2 rounded-lg outline-none focus:border-indigo-500 cursor-pointer">
                <option value="" disabled>+ Призвать Действующее лицо</option>
                {availableCharacters.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select onChange={(e) => updateEntity('extras', e.target.value, { locationId: selectedNodeId })} value="" className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-bold uppercase p-2 rounded-lg outline-none focus:border-indigo-500 cursor-pointer">
                <option value="" disabled>+ Призвать Массовку</option>
                {availableExtras.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>

            {localCharacters.map((char: any) => {
              const charLoot = loot.filter((l: any) => l.ownerId === char.id)
              return (
                <div key={char.id} className="bg-indigo-950/10 border border-indigo-900/50 rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center border-b border-indigo-900/30 pb-2">
                    <div className="font-bold text-indigo-400">{char.name}</div>
                    <button onClick={() => updateEntity('characters', char.id, { locationId: null })} className="text-zinc-600 hover:text-red-500 text-[9px] uppercase font-bold">Убрать</button>
                  </div>
                  <div className="text-xs text-zinc-300">{char.description}</div>
                  <div className="text-[10px] text-indigo-300/80">Цель: {char.goal}</div>
                  <div className="text-[10px] text-red-300/80">Секрет: {char.secret}</div>
                  {char.currentActivity && <div className="text-[9px] bg-indigo-900/30 text-indigo-200 px-2 py-1 rounded">Деятельность: {char.currentActivity}</div>}
                </div>
              )
            })}

            {localExtras.map((extra: any) => (
              <div key={extra.id} className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div className="font-bold text-zinc-200">{extra.name} ({extra.occupation})</div>
                  <button onClick={() => updateEntity('extras', extra.id, { locationId: null })} className="text-zinc-600 hover:text-red-500 text-[9px] uppercase font-bold">X</button>
                </div>
                <div className="text-[10px] text-zinc-400">{extra.quirk} / {extra.knowledge}</div>
              </div>
            ))}
          </div>
        )}

        {/* --- ВКЛАДКА УГРОЗЫ --- */}
        {activeTab === 'threats' && (
          <div className="space-y-4">
            <select onChange={(e) => updateEntity('bestiary', e.target.value, { locationId: selectedNodeId })} value="" className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-bold uppercase p-2 rounded-lg outline-none focus:border-red-500 cursor-pointer">
              <option value="" disabled>+ Призвать Монстра/Угрозу</option>
              {availableBestiary.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            
            {localBestiary.map((b: any) => (
              <div key={b.id} className="bg-red-950/10 border-2 border-red-900/50 rounded-xl p-4">
                <div className="flex justify-between items-center border-b border-red-900/30 pb-2 mb-2">
                  <div className="font-bold text-red-400">{b.name} (CR {b.cr})</div>
                  <button onClick={() => updateEntity('bestiary', b.id, { locationId: null })} className="text-red-900 hover:text-red-500 text-[9px] uppercase font-bold">X</button>
                </div>
                <div className="text-[10px] text-red-200/80 grid grid-cols-2 gap-1 mb-2">
                  <div>AC: {b.combatStats?.ac}</div>
                  <div>HP: {b.combatStats?.hp}</div>
                </div>
                <div className="text-[10px] text-zinc-400">Тактика: {b.tactics}</div>
              </div>
            ))}
          </div>
        )}

        {/* --- ВКЛАДКА КВЕСТЫ --- */}
        {activeTab === 'quests' && (
          <div className="space-y-6">
            <div className="mb-4">
              <select onChange={attachQuest} value="" className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold uppercase p-3 rounded-lg outline-none focus:border-indigo-500 cursor-pointer">
                <option value="" disabled>+ Привязать Сюжет из Архива</option>
                {availableQuests.map((q: any) => <option key={q.id} value={q.id}>{q.title || q.name || 'Безымянный квест'}</option>)}
              </select>
            </div>

            {localQuests.length === 0 && availableQuests.length > 0 && (
               <div className="text-center text-zinc-600 text-[10px] uppercase font-bold tracking-widest py-10 border border-dashed border-zinc-800 rounded-xl">Квестов здесь пока нет.</div>
            )}

            {localQuests.map((q: any) => {
              const isExpired = q.status === 'active' && q.deadline && currentDay > (q.startDay + q.deadline)
              
              return (
                <div key={q.id} className={`bg-zinc-900/30 border rounded-xl p-5 flex flex-col gap-4 ${q.status === 'active' ? 'border-indigo-900 shadow-[0_0_15px_rgba(99,102,241,0.05)]' : 'border-zinc-800'}`}>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="text" value={q.title} onChange={(e) => updateEntity('quests', q.id, { title: e.target.value })}
                      className="flex-1 bg-transparent font-bold text-white outline-none border-b border-transparent focus:border-indigo-500"
                    />
                    <button onClick={() => updateEntity('quests', q.id, { locationId: null })} className="text-zinc-600 hover:text-amber-500 text-xs font-bold transition-colors">Отвязать</button>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div>
                        <label className="text-[9px] font-bold text-zinc-500 uppercase mb-1 block">Подача игрокам (Слух)</label>
                        <textarea value={q.hook || ''} onChange={(e) => updateEntity('quests', q.id, { hook: e.target.value })} className="w-full bg-zinc-950/50 border border-zinc-800 p-2 text-xs text-zinc-300 rounded outline-none h-16 resize-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="text-[9px] font-bold text-zinc-500 uppercase mb-1 block">Скрытая Механика</label>
                        <SmartEditor value={q.description} onChange={(val) => updateEntity('quests', q.id, { description: val })} placeholder="Детали..." />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase mb-1 block">Кто дает</label>
                      <select 
                        value={q.giver || ''} 
                        onChange={(e) => updateEntity('quests', q.id, { giver: e.target.value })} 
                        className="w-full bg-zinc-950/50 border border-zinc-800 p-2 text-xs text-zinc-300 rounded outline-none cursor-pointer focus:border-indigo-500"
                      >
                        <option value="">-- Неизвестно / Нет --</option>
                        <optgroup label="Действующие лица">
                          {allCharacters.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </optgroup>
                        <optgroup label="Массовка">
                          {allExtras.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </optgroup>
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase mb-1 block">Срок (Дней)</label>
                      <input type="number" min="0" value={q.deadline || 0} onChange={(e) => updateEntity('quests', q.id, { deadline: parseInt(e.target.value) || 0 })} className="w-full bg-zinc-950/50 border border-zinc-800 p-2 text-xs text-amber-400 rounded outline-none text-center font-bold focus:border-indigo-500" />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[9px] font-bold text-emerald-600 uppercase mb-1 block">Награда</label>
                      <textarea value={q.reward || ''} onChange={(e) => updateEntity('quests', q.id, { reward: e.target.value })} className="w-full bg-emerald-950/10 border border-emerald-900/30 p-2 text-xs text-emerald-200 rounded h-16 resize-none focus:border-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] font-bold text-red-600 uppercase mb-1 block">Провал</label>
                      <textarea value={q.consequence || ''} onChange={(e) => updateEntity('quests', q.id, { consequence: e.target.value })} className="w-full bg-red-950/10 border border-red-900/30 p-2 text-xs text-red-200 rounded h-16 resize-none focus:border-red-500" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-800/50 flex justify-between items-center">
                    {q.status === 'available' ? (
                      <button onClick={() => updateQuestStatus(q.id, 'active')} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase rounded transition-colors">Выдать игрокам</button>
                    ) : q.status === 'active' ? (
                      <div className="w-full flex gap-2">
                         <div className={`flex-1 flex items-center justify-center text-[10px] font-bold rounded tracking-widest ${isExpired ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-300'}`}>
                           {isExpired ? 'СРОК ВЫШЕЛ!' : `В ПРОЦЕССЕ`}
                         </div>
                         <button onClick={() => updateQuestStatus(q.id, 'completed')} className="px-4 py-2 bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600/40 text-[10px] font-black uppercase rounded transition-colors">Успех</button>
                         <button onClick={() => updateQuestStatus(q.id, 'failed')} className="px-4 py-2 bg-red-600/20 text-red-500 hover:bg-red-600/40 text-[10px] font-black uppercase rounded transition-colors">Провал</button>
                      </div>
                    ) : (
                      <div className={`w-full text-center py-2 text-[10px] font-black uppercase rounded ${q.status === 'completed' ? 'bg-emerald-900/20 text-emerald-500' : 'bg-red-900/20 text-red-500'}`}>
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