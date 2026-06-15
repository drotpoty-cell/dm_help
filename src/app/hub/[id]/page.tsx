'use client';

export default function WorkspacePage() {
  return (
    <div className="h-screen w-full overflow-hidden flex flex-col bg-background text-foreground">
      {/* Верхняя панель (Header) */}
      <header className="h-14 border-b flex items-center px-4 shrink-0">
        ВЕРХНЯЯ ПАНЕЛЬ
      </header>

      {/* Средняя часть (Main Workspace) */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Левая колонка (Пульс/Списки) */}
        <aside className="w-72 border-r overflow-y-auto shrink-0">
          ЛЕВАЯ КОЛОНКА: Игроки и Инициатива
        </aside>

        {/* Центральная зона (Карта) */}
        <section className="flex-1 relative bg-neutral-900/50">
          ЦЕНТР: Глобальная карта
        </section>

        {/* Правая шторка (Инспектор) */}
        {/* Управляется через глобальный стейт, по умолчанию скрыта */}
        <aside className="absolute right-0 top-0 bottom-0 w-80 border-l bg-background shadow-lg translate-x-full transition-transform">
          ПРАВАЯ ШТОРКА: Инспектор
        </aside>
      </main>

      {/* Нижняя панель (Таймлайн) */}
      <footer className="h-24 border-t shrink-0">
        НИЖНЯЯ ПАНЕЛЬ: Таймлайн
      </footer>
    </div>
  );
}
