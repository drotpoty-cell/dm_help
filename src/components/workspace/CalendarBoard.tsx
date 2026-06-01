'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

type SidebarTab = 'backlog' | 'active' | 'history'

export default function CalendarBoard() {
  const { currentDay, currentHour, advanceTime, weather, updateEntity, nodes } = useWorkspaceStore()
  
  const quests = useWorkspaceStore(state => Object.values(state.quests || {}))
  const events = useWorkspaceStore(state => Object.values(state.events || {}))
  
  const [activeTab, setActiveTab] = useState<SidebarTab>('active')
  const todayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  const daysInYear = 365
  const dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

  // --- ЛОГИКА ФИЛЬТРАЦИИ ДЛЯ БОКОВОЙ ПАНЕЛИ СЮЖЕТОВ ---
  const allItems = [
    ...quests.map(q => ({ ...q, itemType: 'quest' as const })),
    ...events.map(e => ({ ...e, itemType: 'event' as const }))
  ]

  const { backlogItems, activeItems, historyItems } = useMemo(() => {
    return {
      backlogItems: allItems.filter(i => i.status === 'available' || i.status === 'backlog'),
      activeItems: allItems.filter(i => i.status === 'active'),
      historyItems: allItems.filter(i => i.status === 'completed' || i.status === 'failed')
    }
  }, [allItems])

  const renderSidebarItem = (item: any) => {
    const isEvent = item.itemType === 'event'
    const locationNode = nodes.find(n => n.id === item.locationId)
    const locationName = locationNode ? locationNode.data.label : 'В мире'
    const isExpired = item.status === 'active' && item.deadline && currentDay > (item.startDay + item.deadline)

    return (
      <div key={item.id} className={`p-4 rounded-xl border flex flex-col gap-3 shadow-lg relative overflow-hidden ${
        item.status === 'failed' ? 'bg-red-950/10 border-red-900/30' :
        isEvent ? 'bg-cyan-950/10 border-cyan-900/30' : 
        'bg-zinc-900/40 border-zinc-800'
      }`}>
        {isEvent && <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>}
        
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className={`font-bold ${item.status === 'failed' ? 'text-red-400 line-through opacity-70' : 'text-zinc-200'}`}>
              {isEvent && <span className="text-cyan-400 mr-2">✨</span>}
              {item.title || item.name}
            </div>
            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mt-1">
              {isEvent ? 'Глобальное событие' : 'Сюжетный квест'}
            </div>
          </div>
          {isExpired && (
            <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center font-black animate-pulse text-xs shrink-0" title="Срок вышел!">!</div>
          )}
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
          {item.hook || item.description || 'Нет описания.'}
        </p>

        <div className="flex justify-between items-center pt-2 border-t border-zinc-800/50 mt-auto">
          <span className="text-[9px] text-zinc-500 font-bold uppercase truncate max-w-[50%]">📍 {locationName}</span>
          
          {item.status === 'active' && (
            <span className={`text-[9px] font-black uppercase tracking-wider ${isExpired ? 'text-red-500 animate-pulse' : 'text-amber-500'}`}>
              {isEvent ? `Длится: ${item.duration} дн.` : (item.deadline ? `Осталось: ${(item.startDay + item.deadline) - currentDay} дн.` : 'Без срока')}
            </span>
          )}
        </div>

        {/* УПРАВЛЕНИЕ СТАТУСАМИ */}
        {item.status === 'available' || item.status === 'backlog' ? (
          <button 
            onClick={() => updateEntity(isEvent ? 'events' : 'quests', item.id, { status: 'active', startDay: currentDay })}
            className="w-full mt-2 py-2 bg-indigo-600/10 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-[9px] font-black uppercase tracking-widest rounded transition-colors"
          >
            Начать сегодня
          </button>
        ) : item.status === 'active' ? (
          <div className="flex gap-2 mt-2">
            <button 
              onClick={() => updateEntity(isEvent ? 'events' : 'quests', item.id, { status: 'completed' })}
              className="flex-1 py-2 bg-emerald-600/10 hover:bg-emerald-600/30 text-emerald-500 border border-emerald-500/30 text-[9px] font-black uppercase tracking-widest rounded transition-colors"
            >
              Завершить
            </button>
            {!isEvent && (
              <button 
                onClick={() => updateEntity('quests', item.id, { status: 'failed' })}
                className="flex-1 py-2 bg-red-600/10 hover:bg-red-600/30 text-red-500 border border-red-500/30 text-[9px] font-black uppercase tracking-widest rounded transition-colors"
              >
                Провал
              </button>
            )}
          </div>
        ) : null}
      </div>
    )
  }

  // --- ЛОГИКА РЕНДЕРА ДНЕЙ КАЛЕНДАРЯ ---
  const questsWithDeadlines = quests.filter((q: any) => q.status === 'active' && q.startDay !== undefined && q.deadline !== undefined && q.deadline > 0)

  const renderDay = (dayNumber: number) => {
    const isToday = dayNumber === currentDay
    const dayWeather = weather.forecast ? weather.forecast[dayNumber] : null 
    
    // Квесты, чей дедлайн выпадает на этот день
    const deadlineQuests = questsWithDeadlines.filter(q => (q.startDay! + q.deadline!) === dayNumber)

    // События, которые идут в этот день
    const activeEventsOnDay = events.filter((e: any) => e.status === 'active' && e.startDay && dayNumber >= e.startDay && dayNumber < (e.startDay + e.duration))

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

        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className={`font-black transition-all ${isToday ? 'text-indigo-400 text-xl' : 'text-zinc-600 text-sm group-hover:text-zinc-400'}`}>
              {dayNumber}
            </span>
            
            {weather.mode !== 'disabled' && dayWeather && (
              <span className="text-base cursor-help opacity-70 group-hover:opacity-100 transition-opacity" title={`${dayWeather.condition}, ${dayWeather.temp}°C`}>
                {dayWeather.condition === 'Ясно' ? '☀️' : dayWeather.condition === 'Облачно' ? '⛅' : dayWeather.condition === 'Дождь' ? '🌧️' : dayWeather.condition === 'Гроза' ? '⛈️' : dayWeather.condition === 'Снег' ? '❄️' : dayWeather.condition === 'Вьюга' ? '🌪️' : dayWeather.condition === 'Песчаная буря' ? '🏜️' : '🌫️'}
              </span>
            )}
          </div>
          {isToday && <span className="text-[8px] bg-indigo-600 text-white px-1.5 py-0.5 rounded uppercase tracking-widest font-black shadow-[0_0_15px_rgba(99,102,241,0.5)]">Сегодня</span>}
        </div>
        
        {/* Карточки на сетке */}
        <div className="space-y-1.5">
          {activeEventsOnDay.map((ev: any) => (
            <div key={ev.id} className="text-[9px] p-1.5 rounded border leading-tight bg-cyan-950/30 border-cyan-900/50 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.05)]">
              <div className="font-bold truncate flex items-center gap-1"><span>✨</span> {ev.name || ev.title}</div>
            </div>
          ))}

          {deadlineQuests.map(q => (
            <div key={q.id} className="text-[9px] p-1.5 rounded-lg border leading-tight bg-red-950/40 border-red-900/50 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.15)] flex flex-col gap-1">
              <div className="font-bold truncate flex items-center justify-between">
                <span>{q.title}</span>
                <span className="text-[8px] text-red-400 font-black uppercase">Дедлайн</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 bg-[#09090b] flex overflow-hidden z-10">
      
      {/* ЛЕВАЯ ПАНЕЛЬ: ИНСПЕКТОР СЮЖЕТОВ (Замена Канбана) */}
      <div className="w-96 border-r border-zinc-900 bg-zinc-950 flex flex-col shrink-0 shadow-2xl z-20">
        <div className="p-6 border-b border-zinc-900 flex justify-between items-end bg-zinc-900/20">
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-widest mb-1">Сюжеты</h2>
            <p className="text-zinc-500 text-xs uppercase tracking-wider font-bold">Инспектор историй</p>
          </div>
        </div>

        <div className="flex bg-zinc-950 text-[9px] font-bold uppercase tracking-widest border-b border-zinc-900 shrink-0">
          <button onClick={() => setActiveTab('backlog')} className={`px-4 py-4 flex-1 transition-all flex items-center justify-center gap-2 ${activeTab === 'backlog' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
            Слухи <span className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full">{backlogItems.length}</span>
          </button>
          <button onClick={() => setActiveTab('active')} className={`px-4 py-4 flex-1 transition-all flex items-center justify-center gap-2 ${activeTab === 'active' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
            В процессе <span className="bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded-full">{activeItems.length}</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`px-4 py-4 flex-1 transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'text-zinc-300 border-b-2 border-zinc-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
            Архив <span className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full">{historyItems.length}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {activeTab === 'backlog' && backlogItems.map(renderSidebarItem)}
          {activeTab === 'active' && activeItems.map(renderSidebarItem)}
          {activeTab === 'history' && historyItems.map(renderSidebarItem)}

          {((activeTab === 'backlog' && backlogItems.length === 0) || 
            (activeTab === 'active' && activeItems.length === 0) || 
            (activeTab === 'history' && historyItems.length === 0)) && (
            <div className="text-center text-zinc-600 text-[10px] uppercase font-bold tracking-widest py-10 border border-dashed border-zinc-800 rounded-xl">
              Пусто
            </div>
          )}
        </div>
      </div>

      {/* ПРАВАЯ ПАНЕЛЬ: КАЛЕНДАРЬ */}
      <div className="flex-1 flex flex-col bg-[#09090b] relative">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-end shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-widest mb-1">Календарь Мира</h2>
            <p className="text-zinc-500 text-[10px] uppercase tracking-wider font-bold">
              Сейчас: День {currentDay}, {currentHour.toString().padStart(2, '0')}:00
            </p>
          </div>
          <button 
            onClick={() => advanceTime(24)} 
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors border border-zinc-800 shadow-lg"
          >
            Пропустить день
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative">
          <div className="max-w-6xl mx-auto">
            <div className="sticky top-0 z-20 grid grid-cols-7 gap-px mb-px border-x border-t border-zinc-800 bg-zinc-950 shadow-2xl">
              {dayNames.map(name => (
                <div key={name} className="bg-zinc-950/90 backdrop-blur-md p-3 text-center text-[9px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800">
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
      
    </div>
  )
}