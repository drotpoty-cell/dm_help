'use client'

import { useWorkspaceStore } from '@/store/useWorkspaceStore'

interface TopBarProps {
  campaignId: string
  day: number
  hour: number
  viewMode: 'map' | 'kanban' | 'archive' | 'calendar' | 'story' | 'weather'
  onViewChange: (mode: 'map' | 'kanban' | 'archive' | 'calendar' | 'story' | 'weather') => void
  onTimeChange: (hours: number) => void
  onSave: () => void
  onSettingsOpen: () => void
  isSaving: boolean
}

// Вспомогательная функция для иконок погоды (минималистичные SVG)
const getWeatherIcon = (condition: string) => {
  switch(condition) {
    case 'Ясно': return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42 1.42"/></svg>;
    case 'Облачно': return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>;
    case 'Дождь': return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M16 14v6M8 14v6M12 16v6"/></svg>;
    case 'Гроза': return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"/><polyline points="13 11 9 17 15 17 11 23"/></svg>;
    case 'Снег': return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-200"><path d="M20 12h-6M4 12h6M12 20v-6M12 4v6M17.5 17.5l-4-4M6.5 6.5l 4 4M17.5 6.5l-4-4M6.5 17.5l 4-4"/></svg>;
    default: return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>;
  }
}

export default function TopBar({ campaignId, day: propDay, hour: propHour, viewMode, onViewChange, onTimeChange, onSave, onSettingsOpen, isSaving }: TopBarProps) {
  // Берём время напрямую из глобального стора (источник правды)
  const currentDay = useWorkspaceStore(state => state.currentDay)
  const currentHour = useWorkspaceStore(state => state.currentHour)
  const weather = useWorkspaceStore(state => state.weather)
  
  const formattedHour = currentHour.toString().padStart(2, '0') + ':00'
  const isDaytime = currentHour >= 6 && currentHour < 18

  // БОЕВАЯ МАТЕМАТИКА ВРЕМЕНИ (Вперёд и Назад с перелистыванием дней)
  const handleTimeChange = (hoursToChange: number) => {
    useWorkspaceStore.setState((state) => {
      let newHour = state.currentHour + hoursToChange
      let newDay = state.currentDay

      if (newHour >= 24) {
        const daysToAdd = Math.floor(newHour / 24)
        newDay += daysToAdd
        newHour = newHour % 24
      } else if (newHour < 0) {
        // Вычисляем сколько дней нужно отнять назад
        const daysToSubtract = Math.ceil(Math.abs(newHour) / 24)
        newDay -= daysToSubtract
        newHour = (newHour % 24 + 24) % 24
      }

      // Ограничение: нельзя уйти раньше 1 дня
      if (newDay < 1) {
        newDay = 1
        newHour = 0
      }

      return {
        currentHour: newHour,
        currentDay: newDay
      }
    })
  }

  const navItems = [
    { id: 'map', label: 'Карта' },
    { id: 'kanban', label: 'Сюжеты' },
    { id: 'calendar', label: 'Календарь' },
    { id: 'archive', label: 'Архив' },
    { id: 'story', label: 'Сценарий' },
    { id: 'weather', label: 'Экология' },
  ]

  return (
    <div className="h-16 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between px-6 z-30 shrink-0 relative">
      
      {/* ЛЕВАЯ ЧАСТЬ: Навигация */}
      <div className="flex gap-1">
        {navItems.map(item => (
          <button 
            key={item.id}
            onClick={() => onViewChange(item.id as any)} 
            className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === item.id 
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' 
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 border border-transparent'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ЦЕНТР: Время и Погода */}
      <div className="flex items-center bg-zinc-950/80 rounded-2xl border border-zinc-800/60 shadow-[0_4px_20px_rgba(0,0,0,0.5)] p-1.5 backdrop-blur-md">
        
        {/* Минус время — теперь яркие, рабочие и красивые */}
        <div className="flex gap-1 pr-4 border-r border-zinc-800/50">
          <button 
            onClick={() => handleTimeChange(-8)} 
            className="px-3 h-8 rounded-xl bg-zinc-900/80 hover:bg-red-500/15 text-zinc-400 hover:text-red-400 border border-zinc-800 text-[10px] font-black transition-all"
          >
            -8ч
          </button>
          <button 
            onClick={() => handleTimeChange(-1)} 
            className="px-3 h-8 rounded-xl bg-zinc-900/80 hover:bg-orange-500/15 text-zinc-400 hover:text-orange-400 border border-zinc-800 text-[10px] font-black transition-all"
          >
            -1ч
          </button>
        </div>

        {/* Инфо-блок */}
        <div className="flex flex-col items-center justify-center px-6 min-w-[160px]">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5">
            <div className="flex items-center gap-1.5">
              {isDaytime 
                ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-amber-400"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
                : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-indigo-400"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              }
              <span>День {currentDay}</span>
            </div>

            {weather.mode !== 'disabled' && (
              <>
                <div className="w-px h-3 bg-zinc-800 mx-1"></div>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  {getWeatherIcon(weather.condition)}
                  <span>{weather.temp}°C</span>
                </div>
              </>
            )}
          </div>
          <div className="text-2xl font-black text-indigo-400 tracking-widest leading-none drop-shadow-[0_0_12px_rgba(99,102,241,0.4)] mt-0.5">
            {formattedHour}
          </div>
        </div>

        {/* Плюс время */}
        <div className="flex gap-1.5 pl-4 border-l border-zinc-800/50">
          <button 
            onClick={() => handleTimeChange(1)} 
            className="px-3 h-8 rounded-xl bg-zinc-900/80 hover:bg-indigo-500/15 text-zinc-400 hover:text-indigo-300 border border-zinc-800 text-[10px] font-black transition-all"
          >
            +1ч
          </button>
          <button 
            onClick={() => handleTimeChange(8)} 
            className="px-3 h-8 rounded-xl bg-zinc-900/80 hover:bg-indigo-500/15 text-zinc-400 hover:text-indigo-300 border border-zinc-800 text-[10px] font-black transition-all"
          >
            +8ч
          </button>
        </div>
      </div>

      {/* Кнопка сохранения */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSettingsOpen}
          className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
        <button 
          onClick={onSave} 
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
        >
          Сохранить
        </button>
      </div>
      
    </div>
  )
}