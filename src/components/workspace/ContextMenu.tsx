'use client'

import { useWorkspaceStore } from '@/store/useWorkspaceStore'

interface ContextMenuProps {
  menu: { id: string, x: number, y: number, overContainers: any[] } | null
  nodes: any[]
  onChangeType: (id: string, newType: string) => void
  onAttach: (childId: string, parentId: string | null) => void
  onDelete: (id: string) => void
  onMoveParty: (id: string) => void
  onClose: () => void
}

export default function ContextMenu({ menu, nodes, onChangeType, onAttach, onDelete, onMoveParty, onClose }: ContextMenuProps) {
  if (!menu) return null

  const preventLeak = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  // Находим целевой узел, чтобы понять его тип
  const targetNode = nodes.find(n => n.id === menu.id)
  // Отряд можно ставить куда угодно, КРОМЕ контейнеров (Регионов и Областей)
  const canHoldParty = targetNode && targetNode.type !== 'region' && targetNode.type !== 'area'

  return (
    <div 
      style={{ top: menu.y, left: menu.x }} 
      className="absolute z-50 bg-zinc-900 border border-zinc-800 shadow-xl py-2 w-48 text-xs rounded-md"
      onMouseDown={preventLeak} 
      onClick={preventLeak}
      onDoubleClick={preventLeak}
    >
      <button 
        onClick={() => {
          useWorkspaceStore.getState().openLocalMap(menu.id);
          useWorkspaceStore.getState().setActiveView('map');
          onClose();
        }} 
        className="w-full text-left px-4 py-2 hover:bg-indigo-900/30 text-indigo-400 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 transition-colors mb-2"
      >
        🗺️ Войти на тактическую карту
      </button>

      {/* КНОПКА ПЕРЕМЕЩЕНИЯ ОТРЯДА */}
      {canHoldParty && (
        <>
          <button 
            onClick={() => {
              onMoveParty(menu.id);
              onClose();
            }} 
            className="w-full text-left px-4 py-2 hover:bg-indigo-900/30 text-indigo-400 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 transition-colors"
          >
            <span className="text-sm">🛡</span> Отряд сюда
          </button>
          <div className="border-t border-zinc-800 my-1"></div>
        </>
      )}

      <div className="px-4 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Сменить статус</div>
      
      <button onClick={() => onChangeType(menu.id, 'safe')} className="w-full text-left px-4 py-1.5 hover:bg-zinc-800 text-emerald-400">Безопасно</button>
      <button onClick={() => onChangeType(menu.id, 'tense')} className="w-full text-left px-4 py-1.5 hover:bg-zinc-800 text-amber-400">Напряжение</button>
      <button onClick={() => onChangeType(menu.id, 'hostile')} className="w-full text-left px-4 py-1.5 hover:bg-zinc-800 text-red-400">Враждебно</button>
      <button onClick={() => onChangeType(menu.id, 'mystery')} className="w-full text-left px-4 py-1.5 hover:bg-zinc-800 text-zinc-400">Слух</button>
      <button onClick={() => onChangeType(menu.id, 'region')} className="w-full text-left px-4 py-1.5 hover:bg-zinc-800 text-indigo-300">Сделать регионом</button>
      <button onClick={() => onChangeType(menu.id, 'area')} className="w-full text-left px-4 py-1.5 hover:bg-zinc-800 text-purple-400">Сделать областью</button>
      
      {menu.overContainers.length > 0 && (
        <>
          <div className="px-4 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-2 border-t border-zinc-800 pt-2">Иерархия</div>
          {menu.overContainers.map(container => (
            <button key={container.id} onClick={() => onAttach(menu.id, container.id)} className="w-full text-left px-4 py-1.5 hover:bg-zinc-800 text-zinc-300">
              Привязать к "{container.data.label}"
            </button>
          ))}
        </>
      )}
      
      {targetNode?.parentId && (
        <button onClick={() => onAttach(menu.id, null)} className="w-full text-left px-4 py-1.5 hover:bg-zinc-800 text-zinc-400 italic">
          Отвязать от контейнера
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