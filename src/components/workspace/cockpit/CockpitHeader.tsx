'use client';

import { useWorkspaceStore } from '@/store/useWorkspaceStore';

const CockpitHeader = () => {
  const { currentDay, currentHour, weather } = useWorkspaceStore();

  const weatherIcon = {
    'Ясно': '☀️',
    'Облачно': '☁️',
    'Дождь': '🌧️',
    'Ливень': '⛈️',
    'Гроза': '⚡',
    'Снег': '❄️',
    'Вьюга': '🌪️',
    'Туман': '🌫️',
    'Песчаная буря': '🏜️'
  }[weather.condition] || '☀️';

  return (
    <header className="flex items-center justify-between h-full px-4 border-b border-neutral-800 text-neutral-200">
      <div className="flex items-center gap-6">
        <h1 className="font-bold text-lg">GM Assistant</h1>
        <nav className="flex gap-4 text-sm text-neutral-400">
          <a href="#" className="hover:text-white">Дашборд</a>
          <a href="#" className="hover:text-white">Архив</a>
        </nav>
      </div>
      <div className="text-sm font-mono bg-neutral-900 px-3 py-1 rounded border border-neutral-800">
        День {currentDay} | {currentHour.toString().padStart(2, '0')}:00 | {weatherIcon} {weather.temp}°C
      </div>
    </header>
  );
};

export default CockpitHeader;
