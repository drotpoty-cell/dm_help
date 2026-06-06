import type { Node } from 'reactflow'
import { Loot, NPC } from '@/types/workspace'
import { AiWand } from '../ai/AiWand'

export function LootForm({
  loot,
  nodes,
  npcs,
  onUpdate
}: {
  loot: Loot
  nodes: Node[]
  npcs: NPC[]
  onUpdate: (data: Partial<Loot>) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <select
        value={loot.rarity || 'common'}
        onChange={(e) => onUpdate({ rarity: e.target.value as Loot['rarity'] })}
        className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-[10px] font-black uppercase tracking-widest outline-none text-zinc-400 cursor-pointer"
      >
        <option value="common">Обычный</option>
        <option value="rare">Редкий</option>
        <option value="epic">Эпический</option>
        <option value="legendary">Легендарный</option>
      </select>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-zinc-950/50 p-2 rounded border border-zinc-800">
          <label className="text-[8px] font-bold text-zinc-500 uppercase block mb-1">Цена (gp)</label>
          <input
            type="number"
            min={0}
            value={loot.price || 0}
            onChange={(e) => onUpdate({ price: Number.parseInt(e.target.value, 10) || 0 })}
            className="bg-transparent text-amber-500 font-bold text-xs w-full outline-none"
          />
        </div>
        <div className="bg-zinc-950/50 p-2 rounded border border-zinc-800">
          <label className="text-[8px] font-bold text-zinc-500 uppercase block mb-1">Вес (кг)</label>
          <input
            type="number"
            min={0}
            step={0.1}
            value={loot.weight || 0}
            onChange={(e) => onUpdate({ weight: Number.parseFloat(e.target.value) || 0 })}
            className="bg-transparent text-zinc-300 font-bold text-xs w-full outline-none"
          />
        </div>
        <div className="bg-zinc-950/50 p-2 rounded border border-zinc-800">
          <label className="text-[8px] font-bold text-zinc-500 uppercase block mb-1">Статы</label>
          <input
            type="text"
            value={loot.stats || ''}
            onChange={(e) => onUpdate({ stats: e.target.value })}
            className="bg-transparent text-indigo-400 font-bold text-xs w-full outline-none"
            placeholder="1d6..."
          />
        </div>
      </div>

      <div className="mt-1 flex flex-col gap-1">
        <label className="text-[9px] font-bold text-zinc-500 uppercase">Владелец (Где находится):</label>
        <select
          value={loot.ownerId || 'none'}
          onChange={(e) => onUpdate({ ownerId: e.target.value === 'none' ? null : e.target.value })}
          className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] font-bold uppercase p-1.5 rounded outline-none cursor-pointer"
        >
          <option value="none">-- В мире не найден --</option>
          <optgroup label="Жители">
            {npcs.map((n) => (
              <option key={n.id} value={n.id}>
                👤 {n.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Локации">
            {nodes
              .filter((n) => n.type !== 'region')
              .map((n) => (
                <option key={n.id} value={n.id}>
                  📍 {String((n.data as { label?: string })?.label || '')}
                </option>
              ))}
          </optgroup>
        </select>
      </div>

      <div className="mt-3">
        <div className="flex justify-between items-center mb-1">
          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Описание / Лор предмета</label>
          <AiWand 
            mode="general"
            currentValue={loot.description || ''}
            contextData={loot}
            onApply={(text) => onUpdate({ description: text })}
          />
        </div>
        <textarea
          value={loot.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Древний клинок, покрытый рунами..."
          className="w-full bg-zinc-950/50 border border-zinc-800 p-2 text-xs text-zinc-300 rounded outline-none h-20 resize-none focus:border-indigo-500"
        />
      </div>
    </div>
  )
}

