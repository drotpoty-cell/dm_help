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

  // Section 1.2 — Strict Sequential Hydration Guard: ни один дочерний компонент рабочей
  // области не должен монтироваться, пока (а) локальный persist ещё не восстановлен из
  // localStorage браузера, и (б) первичная загрузка map_data из Supabase для ЭТОЙ кампании
  // ещё не завершена. Раньше всё рендерилось сразу с дефолтными пустыми значениями стора,
  // и был короткий кадр (race condition), в течение которого компоненты успевали прочитать
  // "пусто" вместо реальных данных — а debounced автосохранение могло в этот момент
  // отправить это "пусто" поверх настоящих данных в облаке.
  const isReady = hydrated && syncStatus !== 'loading';

  if (!isReady) {
    return <WorkspaceLoadingSkeleton />;
  }

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
      <footer className="h-36 border-t border-neutral-800 shrink-0">
        <TimelineBar />
      </footer>
    </div>
  );
}

/**
 * Заглушка на время гидратации/первичной загрузки кампании (Section 1.2) — тот же
 * обсидиановый каркас (шапка/сайдбар/центр/таймлайн), только на скелетонах вместо
 * реального контента, чтобы не было ни пустого экрана, ни скачка вёрстки (layout shift)
 * в момент, когда данные наконец приедут.
 */
function WorkspaceLoadingSkeleton() {
  return (
    <div className="h-screen w-full overflow-hidden flex flex-col bg-neutral-950 text-neutral-200 animate-pulse">
      <header className="h-14 border-b border-neutral-800 shrink-0 flex items-center px-4 gap-3">
        <div className="w-32 h-4 rounded bg-neutral-800/80" />
        <div className="w-20 h-4 rounded bg-neutral-800/50 ml-auto" />
      </header>
      <main className="flex-1 flex overflow-hidden relative">
        <aside className="w-72 shrink-0 border-r border-neutral-900 p-3 space-y-2">
          <div className="w-full h-8 rounded-lg bg-neutral-900" />
          <div className="w-full h-8 rounded-lg bg-neutral-900" />
          <div className="w-full h-8 rounded-lg bg-neutral-900" />
        </aside>
        <section className="flex-1 flex items-center justify-center">
          <div className="text-neutral-700 text-xs font-bold uppercase tracking-[0.2em]">Загрузка кампании…</div>
        </section>
        <aside className="w-72 shrink-0 border-l border-neutral-900" />
      </main>
      <footer className="h-36 border-t border-neutral-800 shrink-0" />
    </div>
  );
}
