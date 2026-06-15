import React from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { Clock, Sun, Moon } from 'lucide-react';

export const TimelineBar = () => {
  const { currentDay, currentHour, advanceTime } = useWorkspaceStore();

  const getTimeIcon = (hour: number) => {
    if (hour >= 6 && hour < 18) return <Sun className="w-3 h-3 text-amber-400" />;
    return <Moon className="w-3 h-3 text-indigo-300" />;
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-neutral-950 border-t border-neutral-800 text-neutral-300 w-full h-14">
      <div className="flex items-center gap-2 text-sm font-medium min-w-[140px]">
        <Clock className="w-4 h-4 text-neutral-500" />
        <span>День {currentDay}</span>
        <span className="text-neutral-500">|</span>
        <span>{String(currentHour).padStart(2, '0')}:00</span>
      </div>

      <div className="flex-1 flex gap-0.5 mx-4 h-4 items-center relative">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-full rounded-sm transition-colors ${
              i === currentHour ? 'bg-blue-600' : 'bg-neutral-800'
            }`}
          />
        ))}
      </div>

      <div className="flex gap-1">
        {[
          { label: '+1ч', value: 1 },
          { label: '+8ч', value: 8 },
          { label: '+1д', value: 24 },
        ].map((btn) => (
          <button
            key={btn.value}
            onClick={() => advanceTime(btn.value)}
            className="px-2 py-1 text-[10px] font-bold bg-neutral-800 hover:bg-neutral-700 hover:text-white text-neutral-400 rounded transition-all"
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};
