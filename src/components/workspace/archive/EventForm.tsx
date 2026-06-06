import { useState } from 'react'
import { Event } from '@/types/workspace'
import { AiWand } from '../ai/AiWand'

export function EventForm({ event, onUpdate }: { event: Event; onUpdate: (data: Partial<Event>) => void }) {
  const [eventType, setEventType] = useState<'peaceful' | 'hostile' | 'random'>('random')

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 mb-3">
        <button 
          onClick={() => setEventType('peaceful')} 
          className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded border transition-colors ${eventType === 'peaceful' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-emerald-900/50 hover:text-emerald-500/70'}`}
        >
          🕊️ Мирное
        </button>
        <button 
          onClick={() => setEventType('hostile')} 
          className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded border transition-colors ${eventType === 'hostile' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-red-900/50 hover:text-red-500/70'}`}
        >
          ⚔️ Враждебное
        </button>
        <button 
          onClick={() => setEventType('random')} 
          className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded border transition-colors ${eventType === 'random' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-indigo-900/50 hover:text-indigo-500/70'}`}
        >
          🎲 Случайно
        </button>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 bg-zinc-950/50 p-2 rounded border border-zinc-800">
          <label className="text-[8px] font-bold text-zinc-500 uppercase block mb-1">День начала</label>
          <input
            type="number"
            min={1}
            value={event.startDay || 1}
            onChange={(e) => onUpdate({ startDay: Number.parseInt(e.target.value, 10) || 1 })}
            className="bg-transparent text-cyan-400 font-bold text-xs w-full outline-none"
          />
        </div>
        <div className="flex-1 bg-zinc-950/50 p-2 rounded border border-zinc-800">
          <label className="text-[8px] font-bold text-zinc-500 uppercase block mb-1">Длительность</label>
          <input
            type="number"
            min={1}
            value={event.duration || 1}
            onChange={(e) => onUpdate({ duration: Number.parseInt(e.target.value, 10) || 1 })}
            className="bg-transparent text-cyan-400 font-bold text-xs w-full outline-none"
          />
        </div>
      </div>
      <div className="bg-zinc-950/50 p-2 rounded border border-zinc-800">
        <label className="text-[8px] font-bold text-zinc-500 uppercase block mb-1">Статус в сюжете</label>
        <select
          value={event.status || 'backlog'}
          onChange={(e) => onUpdate({ status: e.target.value as Event['status'] })}
          className="bg-transparent text-zinc-300 text-[10px] font-bold uppercase w-full outline-none cursor-pointer"
        >
          <option value="backlog">В планах</option>
          <option value="active">Происходит сейчас</option>
          <option value="completed">Завершено</option>
        </select>
      </div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Описание события</label>
        <AiWand 
          mode="general"
          currentValue={event.description || ''}
          contextData={{ ...event, eventType }}
          onApply={(text) => onUpdate({ description: text })}
        />
      </div>
      <textarea
        value={event.description || ''}
        onChange={(e) => onUpdate({ description: e.target.value })}
        placeholder="Что именно произойдет? Последствия для мира..."
        className="bg-zinc-950/30 border border-zinc-800/50 p-3 text-xs text-zinc-400 w-full h-24 resize-none outline-none rounded-lg"
      />
    </div>
  )
}

