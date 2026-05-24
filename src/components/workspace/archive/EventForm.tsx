import { Event } from '@/types/workspace'

export function EventForm({ event, onUpdate }: { event: Event; onUpdate: (data: Partial<Event>) => void }) {
  return (
    <div className="flex flex-col gap-3">
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
      <textarea
        value={event.description || ''}
        onChange={(e) => onUpdate({ description: e.target.value })}
        placeholder="Что именно произойдет? Последствия для мира..."
        className="bg-zinc-950/30 border border-zinc-800/50 p-3 text-xs text-zinc-400 w-full h-24 resize-none outline-none rounded-lg"
      />
    </div>
  )
}

