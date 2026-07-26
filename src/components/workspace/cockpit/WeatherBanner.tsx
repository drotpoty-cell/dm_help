'use client'

import { useState } from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

/**
 * Текстовые напоминания по погоде — это ЧИСТО описательные подсказки для ГМа
 * ("не забудьте описать, как это ощущается"), никаких зашитых игромеханических эффектов
 * (штрафов/бонусов) — так и было решено (Блок 5): последствия применяет сам ГМ, если
 * захочет, а не движок.
 */
const WEATHER_REMINDERS: Record<string, { emoji: string; text: string; tone: 'calm' | 'notable' | 'severe' }> = {
  'Ясно': { emoji: '☀️', text: 'Ясная погода — ничего необычного описывать не нужно.', tone: 'calm' },
  'Облачно': { emoji: '☁️', text: 'Облачно — свет тусклый, дальность обзора чуть хуже обычной.', tone: 'calm' },
  'Туман': { emoji: '🌫️', text: 'Туман — не забудьте сократить дальность видимости в описаниях сцены.', tone: 'notable' },
  'Дождь': { emoji: '🌧️', text: 'Идёт дождь — земля мокрая, звуки шагов и следы могут быть заметнее/незаметнее.', tone: 'notable' },
  'Ливень': { emoji: '🌧️', text: 'Ливень — видимость и слышимость сильно снижены, самое время для засады или погони.', tone: 'notable' },
  'Гроза': { emoji: '⛈️', text: 'Гроза — вспышки молний и раскаты грома. Хороший момент для драматической паузы.', tone: 'severe' },
  'Снег': { emoji: '❄️', text: 'Снегопад — следы на снегу видны отчётливо, холод даёт о себе знать.', tone: 'notable' },
  'Вьюга': { emoji: '🌬️', text: 'Вьюга — почти ничего не видно дальше нескольких шагов. Считайте это напоминанием.', tone: 'severe' },
  'Песчаная буря': { emoji: '🏜️', text: 'Песчаная буря — видимость нулевая, песок повсюду.', tone: 'severe' },
}

const TONE_STYLES: Record<string, string> = {
  calm: 'bg-zinc-900/70 border-zinc-800 text-zinc-400',
  notable: 'bg-sky-950/40 border-sky-800/50 text-sky-300',
  severe: 'bg-amber-950/40 border-amber-700/60 text-amber-300',
}

export default function WeatherBanner() {
  const weather = useWorkspaceStore((s) => s.weather)
  const [dismissed, setDismissed] = useState(false)

  const info = WEATHER_REMINDERS[weather.condition]
  // "Ясно" не показываем баннером вовсе — не о чем напоминать, только шум для ГМа.
  if (!info || info.tone === 'calm' || dismissed) return null

  return (
    <div
      className={`absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2 rounded-xl border shadow-xl backdrop-blur-md text-xs font-medium max-w-md ${TONE_STYLES[info.tone]}`}
    >
      <span className="text-base shrink-0">{info.emoji}</span>
      <span className="leading-snug">{info.text}</span>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity text-[10px] font-bold uppercase tracking-widest"
      >
        ✕
      </button>
    </div>
  )
}
