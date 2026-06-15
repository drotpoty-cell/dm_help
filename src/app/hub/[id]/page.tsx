'use client';

import CockpitHeader from '@/components/workspace/cockpit/CockpitHeader';
import CockpitSidebar from '@/components/workspace/cockpit/CockpitSidebar';

export default function WorkspacePage() {
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
          ЦЕНТР: Глобальная карта
        </section>

        {/* Правая шторка (Инспектор) */}
        {/* Управляется через глобальный стейт, по умолчанию скрыта */}
        <aside className="absolute right-0 top-0 bottom-0 w-80 border-l border-neutral-800 bg-neutral-950 shadow-lg translate-x-full transition-transform">
          ПРАВАЯ ШТОРКА: Инспектор
        </aside>
      </main>

      {/* Нижняя панель (Таймлайн) */}
      <footer className="h-24 border-t border-neutral-800 shrink-0">
        НИЖНЯЯ ПАНЕЛЬ: Таймлайн
      </footer>
    </div>
  );
}
