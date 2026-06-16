'use client';

import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import CockpitHeader from '@/components/workspace/cockpit/CockpitHeader';
import { InspectorPanel } from '@/components/workspace/cockpit/InspectorPanel';
import CockpitSidebar from '@/components/workspace/cockpit/CockpitSidebar';
import { TimelineBar } from '@/components/workspace/cockpit/TimelineBar';
import ArchiveBoard from '@/components/workspace/ArchiveBoard';
import CalendarBoard from '@/components/workspace/CalendarBoard';
import WeatherBoard from '@/components/workspace/WeatherBoard';
import BattleMapBoard from '@/components/workspace/BattleMapBoard';
import MapBoard from '@/components/workspace/MapBoard';
import StoryBoard from '@/components/workspace/StoryBoard';

export default function WorkspacePage() {
  const { activeView, battleMap } = useWorkspaceStore();

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col bg-neutral-950 text-neutral-200">
      {/* Верхняя панель (Header) */}
      <header className="h-14 border-b border-neutral-800 shrink-0">
        <CockpitHeader />
      </header>

      {/* Средняя часть (Main Workspace) */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Левая колонка (Пульс/Списки) */}
        <CockpitSidebar />

        {/* Центральная зона (Карта) */}
        <section className="flex-1 relative bg-neutral-900">
          {activeView === 'map' && (
            battleMap.isActive ? <BattleMapBoard /> : <MapBoard />
          )}
          {activeView === 'story' && <StoryBoard />}
          {activeView === 'archive' && <ArchiveBoard />}
          {activeView === 'calendar' && <CalendarBoard />}
          {activeView === 'weather' && <WeatherBoard />}
        </section>

        {/* Правая шторка (Инспектор) */}
        <InspectorPanel />
      </main>

      {/* Нижняя панель (Таймлайн) */}
      <footer className="h-14 border-t border-neutral-800 shrink-0">
        <TimelineBar />
      </footer>
    </div>
  );
}
