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

      {/* Timeline */}
      <div className="col-span-1 bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-indigo-400 drop-shadow text-2xl font-bold">День {currentDay}</h2>
          <button 
            onClick={() => setShowEventForm(!showEventForm)}
            className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-1 rounded-md hover:border-indigo-500 transition-colors"
          >
            + Планировать событие
          </button>
        </div>
        {showEventForm && (
          <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-700 flex flex-col gap-2 mb-6">
            <input 
              value={eventName}
              onChange={e => setEventName(e.target.value)}
              placeholder="Название события..."
              className="bg-zinc-950 border border-zinc-800 text-zinc-300 px-3 py-2 rounded focus:border-indigo-500 outline-none text-sm"
            />
            <input 
              value={eventDesc}
              onChange={e => setEventDesc(e.target.value)}
              placeholder="Описание..."
              className="bg-zinc-950 border border-zinc-800 text-zinc-300 px-3 py-2 rounded focus:border-indigo-500 outline-none text-sm"
            />
            <input 
              type="number"
              value={eventDay}
              onChange={e => setEventDay(parseInt(e.target.value))}
              className="bg-zinc-950 border border-zinc-800 text-zinc-300 px-3 py-2 rounded focus:border-indigo-500 outline-none text-sm"
            />
            <button onClick={handleAddEvent} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-bold mt-1">Добавить событие</button>
          </div>
        )}
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
