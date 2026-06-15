'use client';

import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { Map, Archive, Calendar, Sun, CloudRain, Cloud, CloudLightning, Snowflake, Wind, Droplets } from 'lucide-react';

const CockpitHeader = () => {
  const { currentDay, currentHour, weather, activeView, setActiveView } = useWorkspaceStore();

  const navItems = [
    { id: 'map', label: 'Дашборд', icon: Map },
    { id: 'archive', label: 'Архив', icon: Archive },
    { id: 'calendar', label: 'Календарь', icon: Calendar },
    { id: 'weather', label: 'Погода', icon: Cloud }
  ];

  const weatherIcons: Record<string, React.ReactNode> = {
    'Ясно': <Sun className="w-4 h-4 text-amber-400" />,
    'Облачно': <Cloud className="w-4 h-4 text-neutral-400" />,
    'Дождь': <CloudRain className="w-4 h-4 text-blue-400" />,
    'Ливень': <CloudRain className="w-4 h-4 text-blue-600" />,
    'Гроза': <CloudLightning className="w-4 h-4 text-yellow-500" />,
    'Снег': <Snowflake className="w-4 h-4 text-white" />,
    'Вьюга': <Wind className="w-4 h-4 text-neutral-200" />,
    'Туман': <Cloud className="w-4 h-4 text-neutral-500" />,
    'Песчаная буря': <Wind className="w-4 h-4 text-amber-600" />
  };

  const weatherIcon = weatherIcons[weather.condition] || <Sun className="w-4 h-4 text-amber-400" />;

  return (
    <header className="flex items-center justify-between h-12 px-4 border-b border-neutral-800 bg-neutral-950 text-neutral-200">
      <div className="flex items-center gap-6">
        <h1 className="font-bold text-sm tracking-tight">GM Assistant</h1>
        <nav className="flex items-center gap-4 text-[11px] text-neutral-500 font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-1.5 transition-colors ${isActive ? 'text-blue-500' : 'hover:text-neutral-200'}`}
              >
                <Icon className="w-3.5 h-3.5" /> {item.label}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-3 text-[11px] font-mono bg-neutral-900 px-3 py-1.5 rounded border border-neutral-800">
        <span className="text-neutral-400">День {currentDay}</span>
        <span className="text-neutral-700">|</span>
        <span>{currentHour.toString().padStart(2, '0')}:00</span>
        <span className="text-neutral-700">|</span>
        <div className="flex items-center gap-1">
          {weatherIcon} {weather.temp}°C
        </div>
      </div>
    </header>
  );
};

export default CockpitHeader;
