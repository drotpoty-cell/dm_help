'use client'

import { useState } from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export default function CalendarBoard() {
  const currentDay = useWorkspaceStore(state => state.currentDay)
  const quests = useWorkspaceStore(state => Object.values(state.quests || {}))
  const events = useWorkspaceStore(state => Object.values(state.events || {}))
  const updateEntity = useWorkspaceStore(state => state.updateEntity)
  const addEntity = useWorkspaceStore(state => state.addEntity)

  const [showQuestForm, setShowQuestForm] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  const [questTitle, setQuestTitle] = useState('')
  const [eventName, setEventName] = useState('')
  const [eventDesc, setEventDesc] = useState('')
  const [eventDay, setEventDay] = useState(currentDay)

  const handleAddQuest = () => {
    if (!questTitle.trim()) return
    addEntity('quests', {
      id: crypto.randomUUID(),
      title: questTitle,
      status: 'available',
      description: ''
    })
    setQuestTitle('')
    setShowQuestForm(false)
  }

  const handleAddEvent = () => {
    if (!eventName.trim()) return
    addEntity('events', {
      id: crypto.randomUUID(),
      name: eventName,
      description: eventDesc,
      startDay: eventDay
    })
    setEventName('')
    setEventDesc('')
    setEventDay(currentDay)
    setShowEventForm(false)
  }

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
      <div className="col-span-2 flex flex-col gap-6 h-full overflow-hidden">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-zinc-100">Сюжеты</h2>
          <button 
            onClick={() => setShowQuestForm(!showQuestForm)}
            className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-1 rounded-md hover:border-indigo-500 transition-colors"
          >
            + Добавить сюжет
          </button>
        </div>
        {showQuestForm && (
          <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-700 flex gap-2">
            <input 
              value={questTitle}
              onChange={e => setQuestTitle(e.target.value)}
              placeholder="Название сюжета..."
              className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-300 px-3 py-2 rounded focus:border-indigo-500 outline-none text-sm"
            />
            <button onClick={handleAddQuest} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-bold">Добавить</button>
          </div>
        )}
        <div className="grid grid-cols-3 gap-6 overflow-y-auto pr-2">
          {kanbanColumns.map(col => (
            <div key={col.id} className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{col.title}</h3>
              {quests.filter(q => q.status === col.id).map(quest => (
                <QuestCard key={quest.id} quest={quest} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="col-span-1 bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-zinc-100 text-xl font-bold">Календарь</h2>
          <span className="text-sm text-zinc-500">День {currentDay}</span>
        </div>
        
        {showEventForm && (
          <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-700 flex flex-col gap-2 mb-6">
            <input 
              value={eventName}
              onChange={e => setEventName(e.target.value)}
              placeholder="Название события..."
              className="bg-zinc-950 border border-zinc-800 text-zinc-300 px-3 py-2 rounded focus:border-indigo-500 outline-none text-sm"
            />
            <button onClick={handleAddEvent} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-bold mt-1">Добавить</button>
          </div>
        )}

        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 30 }, (_, i) => {
            const day = i + 1;
            const isCurrentDay = day === currentDay;
            const dayEvents = events.filter(e => e.startDay === day);
            
            return (
              <div 
                key={day}
                onClick={() => { setEventDay(day); setShowEventForm(true); }}
                className={`
                  aspect-square p-1 rounded-lg border flex flex-col gap-1 transition-all cursor-pointer
                  ${isCurrentDay ? 'ring-2 ring-indigo-500 bg-indigo-500/10 border-indigo-500' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600'}
                `}
              >
                <span className={`text-[10px] ${isCurrentDay ? 'text-indigo-300 font-bold' : 'text-zinc-600'}`}>{day}</span>
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {dayEvents.map(e => (
                    <div key={e.id} className="text-[10px] bg-zinc-800 text-zinc-300 px-1 rounded truncate">
                      {e.name}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
