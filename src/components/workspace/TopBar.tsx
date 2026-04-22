'use client'

import { useRouter } from 'next/navigation'

interface TopBarProps {
  campaignId: string
  day: number
  hour: number
  viewMode: 'map' | 'kanban'
  onViewChange: (mode: 'map' | 'kanban') => void
  onTimeChange: (hours: number) => void
  onSave: () => void
  isSaving: boolean
}

export default function TopBar({ campaignId, day, hour, viewMode, onViewChange, onTimeChange, onSave, isSaving }: TopBarProps) {
  const router = useRouter()
  const formattedHour = hour.toString().padStart(2, '0') + ':00'

  return (
    <div className="h-14 border-b border-zinc-900 bg-zinc-950 flex items-center px-6 justify-between z-20 shrink-0">
      <div className="flex items-center gap-6">
        <button onClick={() => router.push('/hub')} className="text-zinc-500 hover:text-zinc-200 text-sm font-bold uppercase tracking-widest transition-colors">← Хаб</button>
        <div className="h-4 w-px bg-zinc-800"></div>
        
        {/* ПЕРЕКЛЮЧАТЕЛЬ РЕЖИМОВ (КАРТА / СЮЖЕТ) */}
        <div className="flex bg-zinc-900/50 rounded-md p-1 border border-zinc-800">
          <button 
            onClick={() => onViewChange('map')} 
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] rounded transition-all ${viewMode === 'map' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Карта
          </button>
          <button 
            onClick={() => onViewChange('kanban')} 
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] rounded transition-all ${viewMode === 'kanban' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Доска Сюжетов
          </button>
        </div>

        <div className="h-4 w-px bg-zinc-800"></div>

        {/* УМНЫЕ ЧАСЫ МАСТЕРА */}
        <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-md border border-zinc-800/80">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2 mr-2">Время</span>
          <button onClick={() => onTimeChange(-1)} className="px-2 py-1 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded text-xs transition-colors">-1ч</button>
          <div className="px-3 text-center flex gap-2 items-center">
            <span className="text-zinc-300 font-mono font-bold text-xs">День {day}</span>
            <span className="text-indigo-400 font-mono font-bold text-sm">{formattedHour}</span>
          </div>
          <button onClick={() => onTimeChange(1)} className="px-2 py-1 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded text-xs transition-colors">+1ч</button>
          <button onClick={() => onTimeChange(8)} className="px-2 py-1 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded text-xs transition-colors">+8ч (Сон)</button>
        </div>
      </div>

      <button onClick={onSave} className="bg-zinc-200 text-zinc-950 px-5 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-lg shadow-zinc-200/5">
        {isSaving ? 'Синхронизация...' : 'Сохранить мир'}
      </button>
    </div>
  )
}