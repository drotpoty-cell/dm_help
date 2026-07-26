'use client';

import { use, useEffect } from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useStoreHydration } from '@/hooks/useStoreHydration';
import { useCampaignSync } from '@/hooks/useCampaignSync';
import CockpitHeader from '@/components/workspace/cockpit/CockpitHeader';
import { InspectorPanel } from '@/components/workspace/cockpit/InspectorPanel';
import CockpitSidebar from '@/components/workspace/cockpit/CockpitSidebar';
import { TimelineBar } from '@/components/workspace/cockpit/TimelineBar';
import GameTable from '@/components/workspace/GameTable';
import ArchiveBoard from '@/components/workspace/ArchiveBoard';
import CalendarBoard from '@/components/workspace/CalendarBoard';
import WeatherBoard from '@/components/workspace/WeatherBoard';
import StoryBoard from '@/components/workspace/StoryBoard';

export default function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { activeView, switchWorld } = useWorkspaceStore();
  const hydrated = useStoreHydration();
  const { status: syncStatus, hasLegacyData, forceSync, campaignName, renameCampaign } = useCampaignSync(id || null, hydrated);

  useEffect(() => {
    if (!hydrated) return;
    if (id) {
      switchWorld(id);
    }
  }, [id, hydrated, switchWorld]);

  // Старые сохранённые кампании могут ещё хранить activeView: 'dashboard' | 'map' —
  // обе вкладки объединены в «Игровой стол» (GameTable), см. CockpitHeader.tsx.
  const view = activeView === 'dashboard' || activeView === 'map' ? 'table' : activeView;

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col bg-neutral-950 text-neutral-200">
      {/* Верхняя панель (Header) */}
      <header className="h-14 border-b border-neutral-800 shrink-0">
        <CockpitHeader
          syncStatus={syncStatus}
          hasLegacyData={hasLegacyData}
          forceSync={forceSync}
          campaignName={campaignName}
          renameCampaign={renameCampaign}
        />
      </header>

      {/* Средняя часть (Main Workspace) */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Левая колонка (Пульс/Списки) */}
        <CockpitSidebar />

        {/* Центральная зона */}
        <section className="flex-1 relative bg-neutral-900">
          {view === 'table' && <GameTable />}
          {view === 'archive' && <ArchiveBoard />}
          {view === 'story' && <StoryBoard />}
          {view === 'calendar' && <CalendarBoard />}
          {view === 'weather' && <WeatherBoard />}
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
