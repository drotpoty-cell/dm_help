'use client';

import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import CockpitHeader from '@/components/workspace/cockpit/CockpitHeader';
import CockpitSidebar from '@/components/workspace/cockpit/CockpitSidebar';
import { TimelineBar } from '@/components/workspace/cockpit/TimelineBar';
import ArchiveBoard from '@/components/workspace/ArchiveBoard';
import CalendarBoard from '@/components/workspace/CalendarBoard';
import WeatherBoard from '@/components/workspace/WeatherBoard';

export default function WorkspacePage() {
  const { activeView } = useWorkspaceStore();

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
          {activeView === 'map' && <div className="p-4 text-neutral-500">Глобальная карта (в разработке)</div>}
          {activeView === 'archive' && <ArchiveBoard />}
          {activeView === 'calendar' && <CalendarBoard />}
          {activeView === 'weather' && <WeatherBoard />}
        </section>

        {/* Правая шторка (Инспектор) */}
        {/* Управляется через глобальный стейт, по умолчанию скрыта */}
        <aside className="absolute right-0 top-0 bottom-0 w-80 border-l border-neutral-800 bg-neutral-950 shadow-lg translate-x-full transition-transform">
          ПРАВАЯ ШТОРКА: Инспектор
        </aside>
      </main>

      {/* Нижняя панель (Таймлайн) */}
      <footer className="h-14 border-t border-neutral-800 shrink-0">
        <TimelineBar />
      </footer>
    </div>
  );
}
