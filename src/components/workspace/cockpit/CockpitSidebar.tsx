'use client';

const CockpitSidebar = () => {
  return (
    <aside className="w-64 border-r border-neutral-800 p-4 h-full flex flex-col gap-6">
      <section>
        <h2 className="text-xs text-neutral-500 uppercase mb-2">ГРУППА</h2>
        <div className="space-y-2">
          <div className="text-sm">Герой 1 <span className="text-neutral-500">HP: 10/10 | AC: 14</span></div>
          <div className="text-sm">Герой 2 <span className="text-neutral-500">HP: 12/12 | AC: 12</span></div>
        </div>
      </section>
      
      <section>
        <h2 className="text-xs text-neutral-500 uppercase mb-2">ИНИЦИАТИВА</h2>
        <div className="text-neutral-500 text-sm italic">Список пуст</div>
      </section>
    </aside>
  );
};

export default CockpitSidebar;
