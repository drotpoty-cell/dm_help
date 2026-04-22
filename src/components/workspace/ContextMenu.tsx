'use client'

interface ContextMenuProps {
  menu: { id: string, x: number, y: number, overRegions: any[] } | null
  nodes: any[]
  onChangeType: (id: string, newType: string) => void
  onAttach: (childId: string, parentId: string | null) => void
  onDelete: (id: string) => void
}

export default function ContextMenu({ menu, nodes, onChangeType, onAttach, onDelete }: ContextMenuProps) {
  if (!menu) return null

  // Вот та самая "магия", которая блокирует клики от пробивания в карту
  const preventLeak = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div 
      style={{ top: menu.y, left: menu.x }} 
      className="absolute z-50 bg-zinc-900 border border-zinc-800 shadow-xl py-2 w-48 text-xs rounded-md"
      onMouseDown={preventLeak} 
      onClick={preventLeak}
      onDoubleClick={preventLeak}
    >
      <div className="px-4 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Сменить статус</div>
      
      {/* Кнопки теперь будут отрабатывать штатно */}
      <button onClick={() => onChangeType(menu.id, 'safe')} className="w-full text-left px-4 py-1.5 hover:bg-zinc-800 text-emerald-400">Безопасно</button>
      <button onClick={() => onChangeType(menu.id, 'tense')} className="w-full text-left px-4 py-1.5 hover:bg-zinc-800 text-amber-400">Напряжение</button>
      <button onClick={() => onChangeType(menu.id, 'hostile')} className="w-full text-left px-4 py-1.5 hover:bg-zinc-800 text-red-400">Враждебно</button>
      <button onClick={() => onChangeType(menu.id, 'mystery')} className="w-full text-left px-4 py-1.5 hover:bg-zinc-800 text-zinc-400">Слух</button>
      <button onClick={() => onChangeType(menu.id, 'region')} className="w-full text-left px-4 py-1.5 hover:bg-zinc-800 text-zinc-200">Сделать регионом</button>
      
      {menu.overRegions.length > 0 && (
        <>
          <div className="px-4 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-2 border-t border-zinc-800 pt-2">Иерархия</div>
          {menu.overRegions.map(reg => (
            <button key={reg.id} onClick={() => onAttach(menu.id, reg.id)} className="w-full text-left px-4 py-1.5 hover:bg-zinc-800 text-indigo-400">
              Привязать к "{reg.data.label}"
            </button>
          ))}
        </>
      )}
      
      {nodes.find(n => n.id === menu.id)?.parentId && (
        <button onClick={() => onAttach(menu.id, null)} className="w-full text-left px-4 py-1.5 hover:bg-zinc-800 text-zinc-300">
          Отвязать от региона
        </button>
      )}
      
      <div className="border-t border-zinc-800 mt-2 pt-2">
        <button onClick={() => onDelete(menu.id)} className="w-full text-left px-4 py-1.5 hover:bg-red-900/30 text-red-400 uppercase text-[10px] font-bold tracking-widest">
          Удалить узел
        </button>
      </div>
    </div>
  )
}