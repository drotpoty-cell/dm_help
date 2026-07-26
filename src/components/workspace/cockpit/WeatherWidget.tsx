'use client'

import { useState } from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

const WEATHER_EMOJI: Record<string, string> = {
  'Ясно': '☀️', 'Облачно': '☁️', 'Дождь': '🌧️', 'Ливень': '🌧️',
  'Гроза': '⛈️', 'Снег': '❄️', 'Вьюга': '🌬️', 'Туман': '🌫️', 'Песчаная буря': '🏜️',
}

/**
 * Компактная плавающая панель погоды для Мастер-вкладки (Блок 4, п.2) — текущее
 * состояние на виду прямо поверх карты, без переключения на вкладку "Погода".
 */
export default function WeatherWidget() {
  const weather = useWorkspaceStore((s) => s.weather)
  const generateForecast = useWorkspaceStore((s) => s.generateForecast)
  const currentDay = useWorkspaceStore((s) => s.currentDay)
  const [isMinimized, setIsMinimized] = useState(false)

  const forecastTomorrow = weather.forecast?.[currentDay + 1]

  return (
    <div className="fixed z-30 top-20 right-[19rem] bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl w-56 overflow-hidden">
      <button
        onClick={() => setIsMinimized((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900/60 border-b border-zinc-800"
      >
        <span className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
          {WEATHER_EMOJI[weather.condition] || '🌤️'} {weather.temp}°C
        </span>
        <span className="text-zinc-500 text-xs">{isMinimized ? '▲' : '▼'}</span>
      </button>

      {!isMinimized && (
        <div className="p-3 flex flex-col gap-2">
          <div className="text-[11px] text-zinc-300">{weather.condition}</div>
          {forecastTomorrow && (
            <div className="text-[10px] text-zinc-500">
              Завтра: {WEATHER_EMOJI[forecastTomorrow.condition] || ''} {forecastTomorrow.condition}, {forecastTomorrow.temp}°C
            </div>
          )}
          <button
            onClick={() => generateForecast(3)}
            className="text-[10px] font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-2 py-1.5 rounded border border-zinc-800 transition-colors"
          >
            🎲 Сгенерировать прогноз (3 дня)
          </button>
        </div>
      )}
    </div>
  )
}
