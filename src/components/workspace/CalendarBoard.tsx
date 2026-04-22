'use client'

import { useState } from 'react'

interface CalendarBoardProps {
  nodes: any[]
  currentDay: number
  currentHour: number
  onTimeChange: (hours: number) => void
}

export default function CalendarBoard({ nodes, currentDay, currentHour, onTimeChange }: CalendarBoardProps) {
  // Настройки календаря (позже можно вынести в конфиг кампании)
  const daysInMonth = 30
  const daysInWeek = 7
  const dayNames = ['Пон', 'Втор', 'Сред', 'Четв', 'Пятн', 'Субб', 'Воск']

  // Собираем все квесты с дедлайнами
  const questsWithDeadlines = nodes.flatMap(n => 
    (n.data.quests || [])
      .filter((q: any) => q.status === 'active' && q.startDay !== null)
      .map((q: any) => ({ ...q, locationName: n.data.label }))
  )

  const renderDay = (dayNumber: number) => {
    const isToday = dayNumber === currentDay
    const activeHere = questsWithDeadlines.filter(q => {
      const deadlineDay = q.startDay + q.deadline
      return dayNumber >= q.startDay && dayNumber <= deadlineDay
    })

    return (
      <div key={dayNumber} className={`min-h-[120px] border border-zinc-800 p-2 transition-colors ${isToday ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-zinc-900/20 hover:bg-zinc-800/40'}`}>
        <div className="flex justify-between items-center mb-2">
          <span className={`text-[10px] font-black ${isToday ? 'text-indigo-400' : 'text-zinc-600'}`}>{dayNumber}</span>
          {isToday && <span className="text-[9px] bg-indigo-500 text-white px-1.5 py-0.5 rounded uppercase">Сегодня</span>}
        </div>
        
        <div className="space-y-1">
          {activeHere.map(q => {
            const isDeadline = dayNumber === (q.startDay + q.deadline)
            return (
              <div key={q.id} className={`text-[9px] p-1.5 rounded border leading-tight ${isDeadline ? 'bg-red-950/40 border-red-900/50 text-red-200' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>
                <div className="font-bold truncate">{q.title}</div>
                <div className="opacity-60 truncate">📍 {q.locationName}</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 bg-[#09090b] p-8 flex flex-col z-10 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full">
        
        {/* Заголовок и управление */}
        <div className="flex justify-between items-end mb-8 border-b border-zinc-800 pb-6">
          <div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-widest mb-1">Календарь Мира</h2>
            <p className="text-zinc-500 text-xs uppercase tracking-wider font-bold">Текущее время: День {currentDay}, {currentHour}:00</p>
          </div>
          <div className="flex gap-2">
             <button onClick={() => onTimeChange(24)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-black uppercase tracking-widest rounded transition-colors border border-zinc-700">Пропустить день</button>
          </div>
        </div>

        {/* Сетка названий дней */}
        <div className="grid grid-cols-7 gap-px mb-px border-x border-t border-zinc-800">
          {dayNames.map(name => (
            <div key={name} className="bg-zinc-950 p-3 text-center text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{name}</div>
          ))}
        </div>

        {/* Сетка чисел */}
        <div className="grid grid-cols-7 gap-px border border-zinc-800 bg-zinc-800 shadow-2xl">
          {Array.from({ length: daysInMonth }, (_, i) => renderDay(i + 1))}
        </div>
      </div>
    </div>
  )
}