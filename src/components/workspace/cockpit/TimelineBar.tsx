'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Clock } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

const WEATHER_EMOJI: Record<string, string> = {
  'Ясно': '☀️', 'Облачно': '☁️', 'Дождь': '🌧️', 'Ливень': '🌧️',
  'Гроза': '⛈️', 'Снег': '❄️', 'Вьюга': '🌬️', 'Туман': '🌫️', 'Песчаная буря': '🏜️',
}

/** Сколько суток показываем на линейке одновременно — окно "сегодня минус один день, плюс четыре вперёд". */
const WINDOW_DAYS = 6
const HOUR_TICKS = Array.from({ length: 24 }, (_, i) => i)

/**
 * Блок 4 — "Режиссёрский пульт": нижний таймлайн переосмыслен в духе таймлайна нелинейного
 * видеоредактора (NLE) — линейка с часовыми засечками, светящаяся каретка (playhead),
 * которую можно тащить мышью, и отдельные треки данных (погода, квесты/события) под ней.
 * Чистый React/Tailwind, без сторонних библиотек — весь драг реализован на pointer-событиях.
 */
export const TimelineBar = () => {
  const { currentDay, currentHour, advanceTime, weather, quests } = useWorkspaceStore()

  const trackRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [previewDeltaHours, setPreviewDeltaHours] = useState(0)

  // Окно всегда начинается на день раньше текущего (если это не День 1) — так каретка
  // никогда не прилипает к самому левому краю линейки.
  const startDay = Math.max(1, currentDay - 1)
  const days = useMemo(() => Array.from({ length: WINDOW_DAYS }, (_, i) => startDay + i), [startDay])
  const totalWindowHours = WINDOW_DAYS * 24

  // Позиция каретки в долях (0..1) вдоль всего окна — которая же используется и для превью
  // во время перетаскивания (previewDeltaHours не сохраняется в стор, пока палец не отпущен).
  const currentOffsetHours = (currentDay - startDay) * 24 + currentHour
  const playheadFraction = Math.min(1, Math.max(0, (currentOffsetHours + previewDeltaHours) / totalWindowHours))

  const clientXToDeltaHours = useCallback((clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return 0
    const fraction = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const targetOffsetHours = Math.round(fraction * totalWindowHours)
    return targetOffsetHours - currentOffsetHours
  }, [totalWindowHours, currentOffsetHours])

  const handlePlayheadPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    const onMove = (ev: PointerEvent) => setPreviewDeltaHours(clientXToDeltaHours(ev.clientX))
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      const delta = clientXToDeltaHours(ev.clientX)
      if (delta !== 0) advanceTime(delta)
      setIsDragging(false)
      setPreviewDeltaHours(0)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [clientXToDeltaHours, advanceTime])

  // Клик прямо по линейке (не по каретке) — мгновенный прыжок времени в эту точку.
  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (isDragging) return
    const delta = clientXToDeltaHours(e.clientX)
    if (delta !== 0) advanceTime(delta)
  }, [isDragging, clientXToDeltaHours, advanceTime])

  const questEvents = useMemo(() => {
    const items: { id: string; title: string; day: number; hourFraction: number; kind: 'start' | 'deadline' }[] = []
    Object.values(quests || {}).forEach((q: any) => {
      if (q.startDay && days.includes(q.startDay)) items.push({ id: `${q.id}-start`, title: q.title, day: q.startDay, hourFraction: 0.15, kind: 'start' })
      if (q.deadline && days.includes(q.deadline)) items.push({ id: `${q.id}-deadline`, title: q.title, day: q.deadline, hourFraction: 0.85, kind: 'deadline' })
    })
    return items
  }, [quests, days])

  return (
    <div className="flex flex-col h-full w-full bg-neutral-950/95 backdrop-blur-md border-t border-white/[0.06] text-neutral-300 select-none">
      {/* Верхняя строка: текущее время + быстрые прыжки */}
      <div className="flex items-center justify-between px-4 h-9 shrink-0 border-b border-white/[0.05]">
        <div className="flex items-center gap-2 text-sm font-bold min-w-[160px]">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span className="text-white tracking-wide">День {currentDay}</span>
          <span className="text-neutral-700">/</span>
          <span className="text-white tabular-nums tracking-wide">{String(currentHour).padStart(2, '0')}:00</span>
          {weather?.mode !== 'disabled' && weather?.condition && (
            <span className="text-neutral-500 text-xs ml-1">{WEATHER_EMOJI[weather.condition] || ''} {weather.temp}°C</span>
          )}
        </div>
        <div className="flex gap-1.5">
          {[{ label: '+1ч', value: 1 }, { label: '+8ч', value: 8 }, { label: '+1д', value: 24 }].map((btn) => (
            <button
              key={btn.value}
              onClick={() => advanceTime(btn.value)}
              className="px-2.5 py-1 text-[10px] font-black bg-neutral-900 hover:bg-neutral-800 border border-white/[0.06] hover:border-white/10 hover:text-white text-neutral-400 rounded-md transition-all"
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* NLE-линейка + треки */}
      <div className="relative flex-1 min-h-0 px-4 py-1.5">
        <div ref={trackRef} className="relative h-full cursor-crosshair" onClick={handleTrackClick}>
          {/* Дневные колонки: подложка, разделители, часовые засечки */}
          <div className="absolute inset-0 flex">
            {days.map((day, idx) => (
              <div key={day} className={`relative flex-1 min-w-0 ${idx > 0 ? 'border-l border-white/[0.05]' : ''}`}>
                {/* Линейка (ruler) */}
                <div className="h-5 relative">
                  <span className={`absolute top-0 left-1 text-[9px] font-black uppercase tracking-widest ${day === currentDay ? 'text-indigo-300' : 'text-neutral-600'}`}>
                    День {day}
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 flex items-end h-2.5">
                    {HOUR_TICKS.map((h) => (
                      <div key={h} className={`flex-1 border-l ${h % 6 === 0 ? 'h-2.5 border-white/20' : 'h-1 border-white/[0.08]'}`} />
                    ))}
                  </div>
                </div>

                {/* Трек погоды */}
                <div className="h-7 flex items-center px-1 border-t border-white/[0.04]">
                  {weather?.forecast?.[day] && (
                    <div className="flex items-center gap-1 bg-sky-950/40 border border-sky-800/30 text-sky-300 rounded-md px-1.5 py-0.5 text-[9px] font-bold">
                      <span>{WEATHER_EMOJI[weather.forecast[day].condition] || '·'}</span>
                      <span className="tabular-nums">{weather.forecast[day].temp}°</span>
                    </div>
                  )}
                </div>

                {/* Трек квестов/событий */}
                <div className="relative h-7 border-t border-white/[0.04]">
                  {questEvents.filter((qe) => qe.day === day).map((qe) => (
                    <div
                      key={qe.id}
                      title={`${qe.kind === 'start' ? 'Начало' : 'Дедлайн'}: ${qe.title}`}
                      className={`absolute top-1 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold max-w-[45%] truncate border ${
                        qe.kind === 'deadline'
                          ? 'bg-rose-950/40 border-rose-800/30 text-rose-300'
                          : 'bg-emerald-950/40 border-emerald-800/30 text-emerald-300'
                      }`}
                      style={{ left: `${qe.hourFraction * 100}%`, transform: 'translateX(-10%)' }}
                    >
                      <span>{qe.kind === 'deadline' ? '⚑' : '▶'}</span>
                      <span className="truncate">{qe.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Каретка времени (playhead) — светящаяся вертикальная линия + ползунок */}
          <div
            className={`absolute top-0 bottom-0 w-px bg-indigo-400 pointer-events-none z-10 shadow-[0_0_10px_2px_rgba(129,140,248,0.7)] ${isDragging ? '' : 'transition-[left] duration-300'}`}
            style={{ left: `${playheadFraction * 100}%` }}
          >
            <div
              onPointerDown={handlePlayheadPointerDown}
              className="pointer-events-auto absolute -top-1 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-indigo-400 border-2 border-neutral-950 shadow-[0_0_8px_2px_rgba(129,140,248,0.8)] cursor-ew-resize"
              title="Перетащите, чтобы промотать время"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
