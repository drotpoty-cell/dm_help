'use client'

import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export default function CalendarBoard() {
  const currentDay = useWorkspaceStore(state => state.currentDay)
  const quests = useWorkspaceStore(state => Object.values(state.quests || {}))
  const events = useWorkspaceStore(state => Object.values(state.events || {}))
  const updateEntity = useWorkspaceStore(state => state.updateEntity)

  const kanbanColumns = [
    { id: 'available', title: 'Доступные' },
    { id: 'active', title: 'Активные' },
    { id: 'completed', title: 'Завершенные' }
  ]

  const QuestCard = ({ quest }: { quest: any }) => (
    <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl backdrop-blur flex flex-col gap-2">
      <h4 className="font-bold text-zinc-200">{quest.title}</h4>
      <p className="text-xs text-zinc-400 line-clamp-2">{quest.description || quest.hook}</p>
      <select 
        value={quest.status} 
        onChange={(e) => updateEntity('quests', quest.id, { status: e.target.value })}
        className="bg-zinc-800 text-zinc-300 text-xs p-1 rounded mt-2 border border-zinc-700"
      >
        <option value="available">Доступные</option>
        <option value="active">Активные</option>
        <option value="completed">Завершенные</option>
      </select>
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full p-6 overflow-hidden bg-[#09090b]">
      {/* Kanban */}
      <div className="col-span-2 grid grid-cols-3 gap-6 overflow-y-auto pr-2">
        {kanbanColumns.map(col => (
          <div key={col.id} className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{col.title}</h3>
            {quests.filter(q => q.status === col.id).map(quest => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="col-span-1 bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 overflow-y-auto">
        <h2 className="text-indigo-400 drop-shadow text-2xl font-bold mb-6">День {currentDay}</h2>
        <div className="border-l-2 border-zinc-800 ml-4 pl-6 space-y-8">
          {events.sort((a, b) => (a.startDay || 0) - (b.startDay || 0)).map(event => (
            <div key={event.id} className="relative">
              <div className="absolute -left-[33px] top-1 w-4 h-4 bg-zinc-800 rounded-full border-2 border-zinc-700" />
              <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                <p className="font-bold text-zinc-200 text-sm">{event.name}</p>
                <p className="text-xs text-zinc-500">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
