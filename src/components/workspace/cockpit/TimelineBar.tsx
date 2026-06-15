import React from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

export const TimelineBar = () => {
  const { currentDay, currentHour, advanceTime } = useWorkspaceStore();

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-neutral-950 border-t border-neutral-800 text-neutral-300 w-full h-14">
      <div className="text-sm font-medium min-w-[120px]">
        День {currentDay} / {String(currentHour).padStart(2, '0')}:00
      </div>

      <div className="flex-1 flex gap-0.5 mx-4 h-4 items-center">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-full rounded-sm ${
              i === currentHour ? 'bg-indigo-500' : 'bg-neutral-800'
            }`}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => advanceTime(1)}
          className="px-2 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
        >
          +1ч
        </button>
        <button
          onClick={() => advanceTime(8)}
          className="px-2 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
        >
          +8ч
        </button>
        <button
          onClick={() => advanceTime(24)}
          className="px-2 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
        >
          +1д
        </button>
      </div>
    </div>
  );
};
