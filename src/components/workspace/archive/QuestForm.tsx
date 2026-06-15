import type { Node } from 'reactflow'
import { NPC, Quest } from '@/types/workspace'
import { AiWand } from '@/components/workspace/ai/AiWand'

export function QuestForm({
  quest,
  nodes,
  npcs,
  onUpdate
}: {
  quest: Quest
  nodes: Node[]
  npcs: NPC[]
  onUpdate: (data: Partial<Quest>) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Текущий статус квеста</label>
        <select
          value={quest.status || 'available'}
          onChange={(e) => onUpdate({ status: e.target.value as any })}
          className="w-full bg-zinc-950/50 border border-zinc-800 p-2 text-xs text-zinc-300 rounded outline-none cursor-pointer"
        >
          <option value="available">Доступен</option>
          <option value="active">В процессе</option>
          <option value="completed">Выполнен</option>
          <option value="failed">Провален</option>
        </select>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Кто дает</label>
          <select
            value={quest.giver || ''}
            onChange={(e) => onUpdate({ giver: e.target.value })}
            className="w-full bg-zinc-950/50 border border-zinc-800 p-2 text-xs text-zinc-300 rounded outline-none cursor-pointer"
          >
            <option value="">-- Неизвестно / Нет --</option>
            {npcs.map((n) => (
              <option key={n.id} value={n.id}>
                👤 {n.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-24">
          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Срок (Дней)</label>
          <input
            type="number"
            min={0}
            value={quest.deadline || 0}
            onChange={(e) => onUpdate({ deadline: Number.parseInt(e.target.value, 10) || 0 })}
            className="w-full bg-zinc-950/50 border border-zinc-800 p-2 text-xs text-amber-400 font-bold text-center rounded outline-none"
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Подача игрокам (Слух)</label>
          <AiWand 
            currentValue={quest.hook || ''}
            contextData={quest}
            onApply={(text) => onUpdate({ hook: text })}
            title="Подача (Слух)"
          />
        </div>
        <textarea
          value={quest.hook || ''}
          onChange={(e) => onUpdate({ hook: e.target.value })}
          className="w-full bg-zinc-950/50 border border-zinc-800 p-2 text-xs text-zinc-300 rounded outline-none h-14 resize-none"
          placeholder="Что услышат игроки..."
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Скрытая Механика (Лор)</label>
          <AiWand 
            currentValue={quest.description || ''}
            contextData={quest}
            onApply={(text) => onUpdate({ description: text })}
            title="Механика (Лор)"
          />
        </div>
        <textarea
          value={quest.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="w-full bg-zinc-950/50 border border-zinc-800 p-2 text-xs text-zinc-300 rounded outline-none h-20 resize-none"
          placeholder="Что происходит на самом деле..."
        />
      </div>

      <div className="flex gap-3 mt-1">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Награда</label>
            <AiWand 
              currentValue={quest.reward || ''}
              contextData={quest}
              onApply={(text) => onUpdate({ reward: text })}
              title="Награда"
            />
          </div>
          <textarea
            value={quest.reward || ''}
            onChange={(e) => onUpdate({ reward: e.target.value })}
            className="w-full bg-emerald-950/10 border border-emerald-900/30 p-2 text-xs text-emerald-200 rounded h-14 resize-none"
          />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[9px] font-bold text-red-600 uppercase tracking-wider">Провал / Истек срок</label>
            <AiWand 
              currentValue={quest.consequence || ''}
              contextData={quest}
              onApply={(text) => onUpdate({ consequence: text })}
              title="Провал"
            />
          </div>
          <textarea
            value={quest.consequence || ''}
            onChange={(e) => onUpdate({ consequence: e.target.value })}
            className="w-full bg-red-950/10 border border-red-900/30 p-2 text-xs text-red-200 rounded h-14 resize-none"
          />
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-1">
        <label className="text-[9px] font-bold text-zinc-500 uppercase">Привязка к локации на карте:</label>
        <select
          value={quest.locationId || 'none'}
          onChange={(e) => onUpdate({ locationId: e.target.value === 'none' ? null : e.target.value })}
          className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] font-bold uppercase p-1.5 rounded outline-none cursor-pointer"
        >
          <option value="none">-- В Архиве (Не на карте) --</option>
          {nodes
            .filter((n) => n.type !== 'region')
            .map((n) => (
              <option key={n.id} value={n.id}>
                {String((n.data as { label?: string })?.label || '')}
              </option>
            ))}
        </select>
      </div>
    </div>
  )
}

