'use client'

import { useState } from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

/**
 * Компактная плавающая панель календаря для Мастер-вкладки (Блок 4, п.2) — чтобы ГМ мог
 * подвинуть время и увидеть ближайшие события, не переключаясь на полноценную вкладку
 * "Календарь". Полный канбан сюжетов остаётся там же, в CalendarBoard.
 */
export default function CalendarWidget() {
  const currentDay = useWorkspaceStore((s) => s.currentDay)
  const currentHour = useWorkspaceStore((s) => s.currentHour)
  const advanceTime = useWorkspaceStore((s) => s.advanceTime)
  const events = useWorkspaceStore((s) => Object.values(s.events || {}))
  const [isMinimized, setIsMinimized] = useState(false)

  const todayEvents = events.filter((e: any) => e.startDay === currentDay)
  const upcomingEvents = events
    .filter((e: any) => e.startDay > currentDay)
    .sort((a: any, b: any) => a.startDay - b.startDay)
    .slice(0, 3)

  return (
    <div className="fixed z-30 top-20 right-6 bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl w-64 overflow-hidden">
      <button
        onClick={() => setIsMinimized((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900/60 border-b border-zinc-800"
      >
        <span className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
          📅 День {currentDay}
        </span>
        <span className="text-zinc-500 text-xs">{isMinimized ? '▲' : '▼'}</span>
      </button>

      {!isMinimized && (
        <div className="p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{currentHour.toString().padStart(2, '0')}:00</span>
            <div className="flex gap-1">
              <button onClick={() => advanceTime(1)} className="text-[10px] font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-2 py-1 rounded border border-zinc-800">+1ч</button>
              <button onClick={() => advanceTime(8)} className="text-[10px] font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-2 py-1 rounded border border-zinc-800">+8ч</button>
              <button onClick={() => advanceTime(24)} className="text-[10px] font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-2 py-1 rounded border border-zinc-800">+1д</button>
            </div>
          </div>

          {todayEvents.length > 0 && (
            <div>
              <div className="text-[9px] font-black uppercase text-emerald-500 tracking-widest mb-1">Сегодня</div>
              {todayEvents.map((e: any) => (
                <div key={e.id} className="text-[11px] text-zinc-300 bg-emerald-950/20 border border-emerald-900/40 rounded px-2 py-1 mb-1 truncate">{e.name}</div>
              ))}
            </div>
          )}

          {upcomingEvents.length > 0 && (
            <div>
              <div className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-1">Скоро</div>
              {upcomingEvents.map((e: any) => (
                <div key={e.id} className="text-[11px] text-zinc-400 flex justify-between gap-2">
                  <span className="truncate">{e.name}</span>
                  <span className="text-zinc-600 shrink-0">д.{e.startDay}</span>
                </div>
              ))}
            </div>
          )}

          {todayEvents.length === 0 && upcomingEvents.length === 0 && (
            <div className="text-[10px] text-zinc-600 italic text-center py-2">Событий не запланировано</div>
          )}
        </div>
      )}
    </div>
  )
}
