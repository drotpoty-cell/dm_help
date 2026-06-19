'use client';

import { useEffect } from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useStoreHydration } from '@/hooks/useStoreHydration';
import CockpitHeader from '@/components/workspace/cockpit/CockpitHeader';
import { InspectorPanel } from '@/components/workspace/cockpit/InspectorPanel';
import CockpitSidebar from '@/components/workspace/cockpit/CockpitSidebar';
import { TimelineBar } from '@/components/workspace/cockpit/TimelineBar';
import ArchiveBoard from '@/components/workspace/ArchiveBoard';
import CalendarBoard from '@/components/workspace/CalendarBoard';
import WeatherBoard from '@/components/workspace/WeatherBoard';
import LocalMapBoard from '@/components/workspace/LocalMapBoard';
import MapBoard from '@/components/workspace/MapBoard';
import StoryBoard from '@/components/workspace/StoryBoard';
import HeroesBoard from '@/components/workspace/HeroesBoard';

export default function WorkspacePage({ params }: { params: { id: string } }) {
  const { activeView, activeLocalMapId, switchWorld } = useWorkspaceStore();
  const hydrated = useStoreHydration();

  useEffect(() => {
    if (!hydrated) return;
    if (params.id) {
      switchWorld(params.id);
    }
  }, [params.id, hydrated, switchWorld]);

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
            activeLocalMapId ? <LocalMapBoard /> : <MapBoard />
          )}
          {activeView === 'story' && <StoryBoard />}
          {activeView === 'archive' && <ArchiveBoard />}
          {activeView === 'calendar' && <CalendarBoard />}
          {activeView === 'weather' && <WeatherBoard />}
          {activeView === 'heroes' && <HeroesBoard />}
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
