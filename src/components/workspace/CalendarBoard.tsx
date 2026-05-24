'use client'

import { useEffect, useRef } from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export default function CalendarBoard() {
  const currentDay = useWorkspaceStore(state => state.currentDay)
  const currentHour = useWorkspaceStore(state => state.currentHour)
  const advanceTime = useWorkspaceStore(state => state.advanceTime)
  
  const nodes = useWorkspaceStore(state => state.nodes)
  const quests = useWorkspaceStore(state => Object.values(state.quests || {}))
  const events = useWorkspaceStore(state => Object.values(state.events || {}))
  
  const weather = useWorkspaceStore(state => state.weather)

  const todayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  const daysInYear = 365
  const dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

  const questsWithDeadlines = quests
    .filter((q: any) => q.status === 'active' && q.startDay !== undefined && q.deadline !== undefined && q.deadline > 0)
    .map((q: any) => {
      const node = nodes.find(n => n.id === q.locationId)
      return { ...q, locationName: node?.data?.label || 'В пути / Мир' }
    })

  const renderDay = (dayNumber: number) => {
    const isToday = dayNumber === currentDay
    
    // БЕЗОПАСНОЕ ЧТЕНИЕ: Если forecast отсутствует, не падаем
    const dayWeather = weather.forecast ? weather.forecast[dayNumber] : null 
    
    const deadlineQuests = questsWithDeadlines.filter(q => {
      if (q.startDay === undefined || q.deadline === undefined) return false
      return dayNumber === (q.startDay + q.deadline)
    })

    const activeEvents = events.filter((e: any) => {
      if (!e.startDay || !e.duration) return false
      return dayNumber >= e.startDay && dayNumber < e.startDay + e.duration
    })

    const isNewMonth = dayNumber % 30 === 1 && dayNumber !== 1

    return (
      <div 
        key={dayNumber} 
        ref={isToday ? todayRef : null}
        className={`min-h-[120px] border border-zinc-800/50 p-3 transition-colors relative group ${
          isToday 
            ? 'bg-indigo-900/10 border-indigo-500/40 shadow-[inset_0_0_30px_rgba(99,102,241,0.15)]' 
            : 'bg-zinc-900/20 hover:bg-zinc-800/40'
        }`}
      >
        {isNewMonth && (
           <div className="absolute -top-3 left-2 bg-zinc-800 text-zinc-400 text-[8px] px-2 py-0.5 rounded-full font-black tracking-widest z-10 shadow-lg border border-zinc-700">
             МЕСЯЦ {Math.floor(dayNumber / 30) + 1}
           </div>
        )}

        {/* Шапка дня с прогнозом погоды */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className={`font-black transition-all ${isToday ? 'text-indigo-400 text-xl' : 'text-zinc-600 text-sm group-hover:text-zinc-400'}`}>
              {dayNumber}
            </span>
            
            {weather.mode !== 'disabled' && dayWeather && (
              <span 
                className="text-base cursor-help opacity-70 group-hover:opacity-100 transition-opacity" 
                title={`${dayWeather.condition}, ${dayWeather.temp}°C`}
              >
                {dayWeather.condition === 'Ясно' ? '☀️' : 
                 dayWeather.condition === 'Облачно' ? '⛅' : 
                 dayWeather.condition === 'Дождь' ? '🌧️' : 
                 dayWeather.condition === 'Гроза' ? '⛈️' : 
                 dayWeather.condition === 'Снег' ? '❄️' : 
                 dayWeather.condition === 'Вьюга' ? '🌪️' : 
                 dayWeather.condition === 'Песчаная буря' ? '🏜️' : '🌫️'}
              </span>
            )}
          </div>

          {isToday && (
            <span className="text-[9px] bg-indigo-600 text-white px-2 py-1 rounded uppercase tracking-widest font-black shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              Сегодня
            </span>
          )}
        </div>
        
        {/* Карточки квестов и событий */}
        <div className="space-y-1.5">
          {activeEvents.map((ev: any) => (
            <div key={ev.id} className="text-[9px] p-1.5 rounded border leading-tight bg-cyan-950/30 border-cyan-900/50 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.05)]">
              <div className="font-bold truncate flex items-center gap-1"><span>✨</span> {ev.name || ev.title}</div>
            </div>
          ))}

          {deadlineQuests.map(q => (
            <div key={q.id} className="text-[10px] p-2 rounded-lg border leading-tight bg-red-950/40 border-red-900/50 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
              <div className="font-bold truncate mb-1">{q.title}</div>
              <div className="flex justify-between items-center pt-1 border-t border-red-900/30">
                <span className="opacity-70 truncate max-w-[60%] text-[8px]">📍 {q.locationName}</span>
                <span className="text-red-400 font-black text-[8px] uppercase tracking-wider">Дедлайн</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 bg-[#09090b] p-8 flex flex-col z-10 overflow-hidden">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full">
        
        <div className="flex justify-between items-end mb-6 border-b border-zinc-800 pb-6 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-widest mb-1">Календарь Мира</h2>
            <p className="text-zinc-500 text-xs uppercase tracking-wider font-bold">
              Текущее время: День {currentDay}, {currentHour.toString().padStart(2, '0')}:00
            </p>
          </div>
          <div className="flex gap-3">
             <button 
               onClick={() => advanceTime(24)} 
               className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors border border-zinc-800 shadow-lg"
             >
               Пропустить день
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10 relative">
          <div className="sticky top-0 z-20 grid grid-cols-7 gap-px mb-px border-x border-t border-zinc-800 bg-zinc-950 shadow-2xl">
            {dayNames.map(name => (
              <div key={name} className="bg-zinc-950/90 backdrop-blur-md p-3 text-center text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800">
                {name}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px border border-zinc-800/50 bg-zinc-800/50 shadow-2xl">
            {Array.from({ length: daysInYear }, (_, i) => renderDay(i + 1))}
          </div>
        </div>
        
      </div>
    </div>
  )
}