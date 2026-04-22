'use client'

import React, { useState } from 'react'

interface StoryBoardProps {
  storyData: any[]
  onChange: (newStoryData: any[]) => void
}

export default function StoryBoard({ storyData, onChange }: StoryBoardProps) {
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)

  const addPart = () => {
    const newPart = { id: `part-${Date.now()}`, title: 'Новая Часть', chapters: [] }
    onChange([...storyData, newPart])
  }

  const addChapter = (partId: string) => {
    const newStory = storyData.map(part => {
      if (part.id === partId) {
        return {
          ...part,
          chapters: [...part.chapters, { id: `chap-${Date.now()}`, title: 'Новая Глава', content: '', linkedQuests: [] }]
        }
      }
      return part
    })
    onChange(newStory)
  }

  const updateChapterContent = (partId: string, chapterId: string, newContent: string) => {
    const newStory = storyData.map(part => {
      if (part.id === partId) {
        return { ...part, chapters: part.chapters.map((chap: any) => chap.id === chapterId ? { ...chap, content: newContent } : chap) }
      }
      return part
    })
    onChange(newStory)
  }

  const updateTitle = (partId: string, chapterId: string | null, newTitle: string) => {
    const newStory = storyData.map(part => {
      if (part.id === partId) {
        if (!chapterId) return { ...part, title: newTitle }
        return { ...part, chapters: part.chapters.map((chap: any) => chap.id === chapterId ? { ...chap, title: newTitle } : chap) }
      }
      return part
    })
    onChange(newStory)
  }

  const getSelectedChapter = () => {
    for (const part of storyData) {
      const chapter = part.chapters.find((c: any) => c.id === selectedChapterId)
      if (chapter) return { part, chapter }
    }
    return null
  }

  const activeSelection = getSelectedChapter()

  return (
    <div className="absolute inset-0 bg-[#09090b] flex z-10 overflow-hidden">
      
      {/* Левая панель: Дерево Иерархии */}
      <div className="w-80 border-r border-zinc-900 bg-zinc-950 flex flex-col shrink-0">
        <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20">
          <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Структура Сюжета</h2>
          <button onClick={addPart} className="px-2 py-1 hover:bg-zinc-800 rounded text-indigo-400 transition-colors text-[10px] font-bold uppercase tracking-widest">+ Часть</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {storyData.length === 0 && <div className="text-zinc-600 text-xs text-center mt-10 uppercase tracking-widest font-bold">Нажмите "+ Часть", чтобы начать</div>}

          {storyData.map(part => (
            <div key={part.id} className="space-y-2">
              <div className="flex items-center justify-between group">
                <input 
                  value={part.title} onChange={(e) => updateTitle(part.id, null, e.target.value)}
                  className="bg-transparent font-bold text-zinc-300 w-full outline-none focus:text-indigo-400 focus:border-b focus:border-indigo-500 transition-colors"
                />
                <button onClick={() => addChapter(part.id)} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-indigo-400 px-2 transition-opacity font-bold" title="Добавить главу">+</button>
              </div>
              
              <div className="pl-3 border-l-2 border-zinc-800 space-y-1 ml-1">
                {part.chapters.map((chapter: any) => (
                  <div 
                    key={chapter.id} onClick={() => setSelectedChapterId(chapter.id)}
                    className={`cursor-pointer px-3 py-2 rounded-lg text-xs transition-colors font-medium truncate ${selectedChapterId === chapter.id ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 border border-transparent'}`}
                  >
                    {chapter.title}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Правая панель: Редактор контента */}
      <div className="flex-1 flex flex-col bg-[#09090b] overflow-y-auto p-8">
        {activeSelection ? (
          <div className="max-w-3xl mx-auto w-full flex flex-col h-full gap-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500/50">
              {activeSelection.part.title} /
            </div>
            <input 
              value={activeSelection.chapter.title}
              onChange={(e) => updateTitle(activeSelection.part.id, activeSelection.chapter.id, e.target.value)}
              className="text-3xl font-bold bg-transparent outline-none text-zinc-100 placeholder-zinc-800 focus:border-b focus:border-indigo-500 pb-2 transition-colors"
              placeholder="Название главы..."
            />
            
            <textarea
              value={activeSelection.chapter.content}
              onChange={(e) => updateChapterContent(activeSelection.part.id, activeSelection.chapter.id, e.target.value)}
              className="flex-1 bg-transparent resize-none outline-none text-zinc-400 text-sm leading-relaxed mt-4"
              placeholder="Опишите события главы. Помните о завязке, развитии и наградах..."
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-600 text-xs font-bold uppercase tracking-widest">
            Выберите главу в меню слева
          </div>
        )}
      </div>
    </div>
  )
}