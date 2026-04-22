'use client'

import React from 'react'

interface KanbanBoardProps {
  nodes: any[]
  currentDay: number
  onUpdateQuestStatus: (nodeId: string, questId: string, newStatus: string) => void
}

export default function KanbanBoard({ nodes, currentDay, onUpdateQuestStatus }: KanbanBoardProps) {
  // 1. Собираем все квесты со всех локаций в один плоский массив
  const allQuests: any[] = []
  nodes.forEach(node => {
    if (node.data.quests && Array.isArray(node.data.quests)) {
      node.data.quests.forEach((q: any) => {
        allQuests.push({ ...q, nodeId: node.id, locationName: node.data.label })
      })
    }
  })

  // 2. Логика перетаскивания (Drag and Drop)
  const handleDragStart = (e: React.DragEvent, nodeId: string, questId: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ nodeId, questId }))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault() // Разрешаем сброс (Drop)
  }

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'))
      onUpdateQuestStatus(data.nodeId, data.questId, newStatus)
    } catch (err) {
      console.error('Ошибка перетаскивания', err)
    }
  }

  // 3. Конфигурация колонок
  const columns = [
    { id: 'available', title: 'Слухи / Доступно', color: 'border-zinc-700' },
    { id: 'active', title: 'В процессе', color: 'border-indigo-500' },
    { id: 'completed', title: 'Успех', color: 'border-emerald-500' },
    { id: 'failed', title: 'Провал', color: 'border-red-500' }
  ]

  return (
    <div className="absolute inset-0 bg-[#09090b] p-8 overflow-x-auto z-10">
      <div className="flex gap-6 h-full min-w-max">
        {columns.map(col => {
          const columnQuests = allQuests.filter(q => q.status === col.id)
          
          return (
            <div 
              key={col.id} 
              className="w-80 flex flex-col h-full bg-zinc-900/40 rounded-2xl border border-zinc-800/50 overflow-hidden"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Шапка колонки */}
              <div className={`p-4 border-b-2 bg-zinc-950/50 flex justify-between items-center ${col.color}`}>
                <h3 className="text-xs font-black uppercase tracking-[0.15em] text-zinc-300">{col.title}</h3>
                <span className="bg-zinc-800 text-zinc-400 text-[10px] font-bold px-2 py-1 rounded-full">{columnQuests.length}</span>
              </div>

              {/* Карточки квестов */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {columnQuests.map(q => {
                  const isExpired = q.status === 'active' && currentDay > (q.startDay + q.deadline)
                  
                  return (
                    <div 
                      key={q.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, q.nodeId, q.id)}
                      className={`bg-zinc-950 border rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-zinc-500 transition-colors shadow-lg ${isExpired ? 'border-red-500/50' : 'border-zinc-800'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-zinc-100 text-sm leading-tight pr-4">{q.title}</h4>
                        <div className="text-[10px] text-zinc-600">☰</div>
                      </div>
                      
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1">
                        <span>📍</span> {q.locationName}
                      </div>

                      {/* Индикатор времени для активных */}
                      {q.status === 'active' && (
                        <div className={`text-[9px] font-black uppercase tracking-widest p-1.5 rounded text-center mb-2 ${isExpired ? 'bg-red-950/30 text-red-500' : 'bg-indigo-950/30 text-indigo-400'}`}>
                          {isExpired ? 'СРОК ВЫШЕЛ!' : `Осталось: ${Math.max(0, (q.startDay + q.deadline) - currentDay)} дн.`}
                        </div>
                      )}

                      <div className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                        {q.hook || q.description || 'Нет описания...'}
                      </div>
                    </div>
                  )
                })}

                {columnQuests.length === 0 && (
                  <div className="h-32 flex items-center justify-center border-2 border-dashed border-zinc-800/50 rounded-xl text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                    Перетащите сюда
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}