'use client'

import React, { useState, useMemo } from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { AiWand } from './ai/AiWand'

const storyTemplates = {
  classic: "### 🪝 Завязка (Hook)\n[Что привлекает внимание героев?]\n\n### ⚔️ Развитие (Conflict)\n[С какими препятствиями они столкнутся?]\n\n### 🌪 Твист (Plot Twist)\n[Что идет не по плану?]\n\n### 👑 Развязка (Resolution)\n[Чем всё заканчивается и какая награда?]",
  detective: "### 🩸 Преступление\n[Что произошло и где улики?]\n\n### 🔍 Расследование\n[Кого допрашивают герои? Какие ложные следы?]\n\n### 🎭 Разоблачение\n[Кто настоящий убийца и как он попытается сбежать?]",
  blank: ""
}

const plotTwists = [
  "Один из союзников оказывается шпионом злодея.",
  "Внезапно начинается магическая буря, меняющая правила боя.",
  "Цель квеста уже уничтожена кем-то другим.",
  "Награда оказывается проклятой.",
  "Игрокам предлагают взятку, превышающую награду за квест в 5 раз.",
  "Появляется третья фракция, которой тоже нужен этот артефакт."
]

// --- ИНТЕРАКТИВНЫЙ ПАРСЕР ТЕКСТА ---
const SmartContent = ({ content, onChange, contextData }: { content: string, onChange: (val: string) => void, contextData?: any }) => {
  const [isEditing, setIsEditing] = useState(false)
  const setViewedEntityId = useWorkspaceStore(state => state.setViewedEntityId)

  const library = useWorkspaceStore(state => ({
    npcs: Object.values(state.npcs),
    quests: Object.values(state.quests),
    locations: Object.values(state.locations)
  }))

  const entityMap = useMemo(() => {
    const map = new Map<string, string>()
    const all = [...library.npcs, ...library.quests, ...library.locations]
    all.forEach((ent: any) => {
      const name = ent.title || ent.name
      if (name) map.set(name.toLowerCase(), ent.id)
    })
    return map
  }, [library])

  const renderText = () => {
    if (!content) return <span className="text-zinc-600 italic">Нажмите, чтобы добавить описание...</span>

    const names = Array.from(entityMap.keys()).map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    if (names.length === 0) return <span className="whitespace-pre-wrap">{content}</span>

    const regex = new RegExp(`(@(?:${names.join('|')}))(?![\\wа-яА-ЯёЁ])`, 'gi')
    const parts = content.split(regex)

    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const cleanName = part.slice(1).toLowerCase()
        const id = entityMap.get(cleanName)
        if (id) {
          const isNpc = library.npcs.find((n: any) => n.id === id)
          const isQuest = library.quests.find((q: any) => q.id === id)
          const icon = isNpc ? '👤' : isQuest ? '📜' : '📍'

          return (
            <button 
              key={index} 
              onClick={(e) => { e.stopPropagation(); setViewedEntityId(id); }}
              className="text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded font-bold cursor-pointer hover:bg-indigo-600 hover:text-white transition-colors border border-indigo-500/30 inline-flex items-center gap-1 shadow-sm mx-0.5 align-baseline"
              title="Нажмите, чтобы открыть досье"
            >
              <span className="text-[10px] grayscale">{icon}</span>
              {part.slice(1)}
            </button>
          )
        }
      }
      return <span key={index} className="whitespace-pre-wrap">{part}</span>
    })
  }

  return (
    <div className="flex-1 flex flex-col mt-4 min-h-[500px]">
      <div className="flex justify-between items-end mb-2">
        <span className="text-[10px] text-zinc-500 font-medium">
          {isEditing ? 'Используйте @Имя для создания кликабельных ссылок' : 'Кликните по тексту для редактирования'}
        </span>
        <div className="flex items-center gap-3">
           <AiWand 
             mode="general"
             currentValue={content}
             contextData={contextData}
             onApply={(val) => { onChange(val); setIsEditing(false); }}
           />
           <button onClick={() => setIsEditing(!isEditing)} className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 hover:text-indigo-400 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800 transition-colors">
             {isEditing ? 'Сохранить и смотреть' : 'Редактировать текст'}
           </button>
        </div>
      </div>

      {isEditing ? (
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 w-full bg-zinc-950/80 border border-indigo-900/50 rounded-xl p-6 text-sm text-zinc-300 resize-none outline-none focus:border-indigo-500 leading-relaxed font-mono shadow-inner custom-scrollbar"
          placeholder="Опишите события главы. Помните о завязке, развитии и наградах..."
          autoFocus
        />
      ) : (
        <div 
          onClick={() => setIsEditing(true)} 
          className="flex-1 w-full p-6 text-sm text-zinc-300 cursor-text hover:bg-zinc-900/40 rounded-xl leading-relaxed border border-transparent transition-colors custom-scrollbar"
        >
          {renderText()}
        </div>
      )}
    </div>
  )
}

export default function StoryBoard() {
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [randomTwist, setRandomTwist] = useState<string | null>(null)
  
  const story = useWorkspaceStore(state => state.story)
  const setStory = useWorkspaceStore(state => state.setStory)
  
  const nodes = useWorkspaceStore(state => state.nodes.filter(n => n.type !== 'region'))
  const quests = useWorkspaceStore(state => state.quests)

  const addPart = () => setStory([...story, { id: `part-${Date.now()}`, title: 'Новая Часть', chapters: [] }])

  const addChapter = (partId: string, templateKey: keyof typeof storyTemplates = 'blank') => {
    setStory(story.map(p => p.id === partId ? { 
      ...p, 
      chapters: [...p.chapters, { 
        id: `chap-${Date.now()}`, 
        title: 'Новая Глава', 
        content: storyTemplates[templateKey],
        locationId: null,
        questId: null
      }] 
    } : p))
    setActiveMenuId(null)
  }

  const updateChapterData = (partId: string, chapterId: string, data: any) => {
    setStory(story.map(p => p.id === partId ? { 
      ...p, 
      chapters: p.chapters.map((c: any) => c.id === chapterId ? { ...c, ...data } : c) 
    } : p))
  }

  const updateTitle = (partId: string, chapterId: string | null, newTitle: string) => {
    setStory(story.map(p => p.id === partId ? { 
      ...p, 
      title: chapterId ? p.title : newTitle, 
      chapters: p.chapters.map((c: any) => c.id === chapterId ? { ...c, title: newTitle } : c) 
    } : p))
  }

  const rollTwist = () => {
    const twist = plotTwists[Math.floor(Math.random() * plotTwists.length)]
    setRandomTwist(twist)
  }

  const getSelectedChapter = () => {
    for (const part of story) {
      const chapter = part.chapters.find((c: any) => c.id === selectedChapterId)
      if (chapter) return { part, chapter }
    }
    return null
  }

  const activeSelection = getSelectedChapter()

  const getChapterStatus = (questId?: string | null) => {
    if (!questId) return null
    const quest = quests[questId]
    if (!quest) return null
    
    switch (quest.status) {
      case 'available': return { label: 'Заблокирована (Квест не начат)', color: 'text-zinc-500', bg: 'bg-zinc-500/20' }
      case 'active': return { label: 'В процессе', color: 'text-amber-400', bg: 'bg-amber-400/20' }
      case 'completed': return { label: 'Успешно завершена', color: 'text-emerald-500', bg: 'bg-emerald-500/20' }
      case 'failed': return { label: 'Провалена', color: 'text-red-500', bg: 'bg-red-500/20' }
      default: return null
    }
  }

  return (
    <div className="absolute inset-0 bg-[#09090b] flex z-10 overflow-hidden">
      
      {/* ЛЕВАЯ ПАНЕЛЬ НАВИГАЦИИ */}
      <div className="w-80 border-r border-zinc-900 bg-zinc-950 flex flex-col shrink-0 z-20 shadow-2xl">
        <div className="p-5 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/40">
          <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Структура Сценария</h2>
          <button onClick={addPart} className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded transition-colors text-[9px] font-black uppercase tracking-widest border border-indigo-500/20">
            + Часть
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
          {story.length === 0 && <div className="text-zinc-600 text-[10px] text-center mt-10 uppercase tracking-widest font-bold border-2 border-dashed border-zinc-800 p-6 rounded-xl">Нажмите "+ Часть", чтобы начать строить историю</div>}

          {story.map(part => (
            <div key={part.id} className="space-y-3 relative">
              <div className="flex items-center justify-between group">
                <input value={part.title} onChange={(e) => updateTitle(part.id, null, e.target.value)} className="bg-transparent font-black text-sm text-zinc-300 w-full outline-none focus:text-indigo-400 transition-colors uppercase tracking-wider" />
                <button 
                  onClick={() => setActiveMenuId(activeMenuId === part.id ? null : part.id)} 
                  className="opacity-0 group-hover:opacity-100 bg-zinc-800 hover:bg-indigo-600 text-zinc-400 hover:text-white w-5 h-5 rounded-full flex items-center justify-center transition-all font-bold text-xs"
                  title="Добавить главу"
                >
                  +
                </button>
              </div>

              {/* МЕНЮ ШАБЛОНОВ */}
              {activeMenuId === part.id && (
                <div className="absolute top-6 right-0 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-30 py-2 w-52 overflow-hidden">
                  <div className="px-4 py-1.5 text-[8px] font-black uppercase text-zinc-500 border-b border-zinc-800/50 mb-1 tracking-widest">Шаблон главы</div>
                  <button onClick={() => addChapter(part.id, 'blank')} className="w-full text-left px-4 py-2.5 text-xs font-medium text-zinc-300 hover:bg-indigo-600 hover:text-white transition-colors">📄 Пустая глава</button>
                  <button onClick={() => addChapter(part.id, 'classic')} className="w-full text-left px-4 py-2.5 text-xs font-medium text-zinc-300 hover:bg-indigo-600 hover:text-white transition-colors">⚔️ Приключение</button>
                  <button onClick={() => addChapter(part.id, 'detective')} className="w-full text-left px-4 py-2.5 text-xs font-medium text-zinc-300 hover:bg-indigo-600 hover:text-white transition-colors">🔍 Детектив</button>
                </div>
              )}

              <div className="pl-3 border-l-2 border-zinc-800 space-y-1.5 ml-1.5">
                {part.chapters.map((chapter: any) => {
                  const status = getChapterStatus(chapter.questId)
                  
                  return (
                    <div 
                      key={chapter.id} 
                      onClick={() => setSelectedChapterId(chapter.id)} 
                      className={`cursor-pointer px-3 py-2.5 rounded-lg text-[11px] transition-all font-medium truncate flex items-center justify-between ${
                        selectedChapterId === chapter.id 
                          ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-inner' 
                          : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 border border-transparent'
                      }`}
                    >
                      <span className="truncate">{chapter.title}</span>
                      
                      {status && (
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ml-2 ${status.bg}`} title={status.label}></span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ПРАВАЯ РАБОЧАЯ ОБЛАСТЬ */}
      <div className="flex-1 flex flex-col bg-[#09090b] overflow-y-auto p-10 relative">
        {activeSelection ? (
          <div className="max-w-5xl mx-auto w-full flex flex-col h-full gap-6">
            
            <div className="flex flex-col gap-4 border-b border-zinc-800/80 pb-6">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500/50 flex items-center gap-2">
                <span>{activeSelection.part.title}</span>
                <span className="text-zinc-700">/</span>
              </div>
              
              <div className="flex items-start justify-between gap-8">
                <input 
                  value={activeSelection.chapter.title}
                  onChange={(e) => updateTitle(activeSelection.part.id, activeSelection.chapter.id, e.target.value)}
                  className="text-4xl font-black bg-transparent outline-none text-zinc-100 placeholder-zinc-800 flex-1 leading-tight"
                  placeholder="Название главы..."
                />

                <div className="flex flex-col gap-3 min-w-[250px] shrink-0 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50 shadow-inner">
                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-1.5 block">📍 Место действия (Карта)</label>
                    <select 
                      value={activeSelection.chapter.locationId || ''}
                      onChange={(e) => updateChapterData(activeSelection.part.id, activeSelection.chapter.id, { locationId: e.target.value || null })}
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] font-bold p-2 rounded outline-none cursor-pointer focus:border-indigo-500 truncate"
                    >
                      <option value="">-- Не привязано --</option>
                      {nodes.map(n => <option key={n.id} value={n.id}>{n.data.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-1.5 block">📜 Связанный сюжет (Квест)</label>
                    <select 
                      value={activeSelection.chapter.questId || ''}
                      onChange={(e) => updateChapterData(activeSelection.part.id, activeSelection.chapter.id, { questId: e.target.value || null })}
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] font-bold p-2 rounded outline-none cursor-pointer focus:border-indigo-500 truncate"
                    >
                      <option value="">-- Не привязано --</option>
                      {Object.values(quests).map((q: any) => <option key={q.id} value={q.id}>{q.title}</option>)}
                    </select>
                    
                    {activeSelection.chapter.questId && getChapterStatus(activeSelection.chapter.questId) && (
                      <div className={`mt-2 text-[8px] font-black uppercase tracking-widest px-2 py-1.5 rounded border inline-block ${getChapterStatus(activeSelection.chapter.questId)?.bg} ${getChapterStatus(activeSelection.chapter.questId)?.color} border-current/20`}>
                        Статус: {getChapterStatus(activeSelection.chapter.questId)?.label}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-1 gap-10 mt-2">
              <div className="flex-1 min-w-0">
                <SmartContent 
                  content={activeSelection.chapter.content} 
                  onChange={(val) => updateChapterData(activeSelection.part.id, activeSelection.chapter.id, { content: val })} 
                  contextData={activeSelection.chapter}
                />
              </div>
              
              <div className="w-72 pl-10 border-l border-zinc-800/50 hidden lg:flex flex-col gap-10 shrink-0">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2"><span className="text-sm">💡</span> Советы мастера</h3>
                  <ul className="text-xs text-zinc-400 space-y-4 leading-relaxed">
                    <li className="flex gap-3"><span className="text-emerald-500/50 mt-0.5">•</span> Опишите сенсорный опыт: запахи, температуру, звуки в этой локации.</li>
                    <li className="flex gap-3"><span className="text-emerald-500/50 mt-0.5">•</span> Используйте "Правило 3 улик": любая важная инфа должна упоминаться трижды.</li>
                    <li className="flex gap-3"><span className="text-emerald-500/50 mt-0.5">•</span> Провал — это тоже сюжет. Подготовьте последствия проигрыша.</li>
                  </ul>
                </div>
                
                <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Генератор осложнений</h3>
                  <p className="text-[10px] text-zinc-500 mb-5 leading-relaxed">Игроки заскучали? Бросьте кубик судьбы, чтобы внести хаос в сцену.</p>
                  
                  {randomTwist && (
                    <div className="mb-5 p-4 bg-indigo-950/20 border border-indigo-900/50 rounded-xl text-xs text-indigo-200 leading-relaxed shadow-inner">
                      {randomTwist}
                    </div>
                  )}

                  <button onClick={rollTwist} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                    🎲 Бросить кубик
                  </button>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center pb-20">
            <div className="w-20 h-20 bg-indigo-500/5 rounded-3xl border border-indigo-500/20 flex items-center justify-center text-3xl mb-6 shadow-[0_0_50px_rgba(99,102,241,0.1)]">📖</div>
            <h2 className="text-2xl font-black text-zinc-100 mb-3 tracking-wide">Режиссерский Пульт</h2>
            <p className="text-sm text-zinc-500 max-w-md leading-relaxed">
              Создайте структуру кампании. Нажмите <span className="text-indigo-400 font-bold px-1">+ Часть</span> слева, добавьте главу и привяжите её к Карте и Архиву.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}