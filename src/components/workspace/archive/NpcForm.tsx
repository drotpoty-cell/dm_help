import type { Node } from 'reactflow'
import { useState } from 'react'
import { NPC } from '@/types/workspace'
import { ArchiveTooltip } from './ArchiveTooltip'
import { AiWand } from '../ai/AiWand'
import { Input } from '../../ui/Input'
import { Textarea } from '../../ui/Textarea'
import { Label } from '../../ui/Label'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export function NpcForm({
  npc,
  nodes,
  onUpdate
}: {
  npc: NPC
  nodes: Node[]
  onUpdate: (data: Partial<NPC>) => void
}) {
  const { locations, updateEntity } = useWorkspaceStore()
  const [traitInput, setTraitInput] = useState('')

  const handleAddTrait = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && traitInput.trim()) {
      onUpdate({ traits: [...(npc.traits || []), traitInput.trim()] })
      setTraitInput('')
    }
  }

  const handleRemoveTrait = (index: number) => {
    onUpdate({ traits: (npc.traits || []).filter((_, i) => i !== index) })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !traitInput && (npc.traits?.length ?? 0) > 0) {
      onUpdate({ traits: (npc.traits || []).slice(0, -1) })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Имя</Label>
          <Input
            value={npc.name || ''}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Имя персонажа"
          />
        </div>
        <div>
          <Label>Роль</Label>
          <Input
            value={npc.occupation || ''}
            onChange={(e) => onUpdate({ occupation: e.target.value })}
            placeholder="Торговец, Стражник..."
            className="text-indigo-300"
          />
        </div>
        <div className="col-span-full">
          <Label>Базовая локация</Label>
          <select
            value={npc.defaultLocationId || ''}
            onChange={(e) => updateEntity('npcs', npc.id, { defaultLocationId: e.target.value, locationId: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-[10px] text-zinc-300 focus:border-indigo-500 outline-none"
          >
            <option value="">Нет локации</option>
            {Object.values(locations).map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="col-span-full">
        <Label>Черты</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {(npc.traits || []).map((trait, index) => (
            <span key={index} className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-xs flex items-center gap-2">
              {trait}
              <button onClick={() => handleRemoveTrait(index)} className="text-zinc-500 hover:text-red-400">✕</button>
            </span>
          ))}
        </div>
        <Input
          value={traitInput}
          onChange={(e) => setTraitInput(e.target.value)}
          onKeyDown={(e) => { handleAddTrait(e); handleKeyDown(e) }}
          placeholder="Нажмите Enter, чтобы добавить черту..."
        />
      </div>

      <div className="col-span-full">
        <label className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800 rounded-lg p-3 cursor-pointer hover:bg-zinc-900/60 transition-colors">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-200 flex items-center gap-2">
            <span className="text-amber-400">💰</span> Этот персонаж — торговец
          </span>
          <input
            type="checkbox"
            checked={!!npc.isMerchant}
            onChange={(e) => onUpdate({ isMerchant: e.target.checked })}
            className="h-4 w-4 accent-indigo-500"
          />
        </label>
      </div>

      <div className="col-span-full">
        <div className="flex justify-between items-center mb-1">
          <Label>Описание</Label>
          <AiWand 
            currentValue={npc.description || ''}
            contextData={npc}
            onApply={(text) => onUpdate({ description: text })}
          />
        </div>
        <Textarea
          value={npc.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Внешность, манеры, первое впечатление..."
          className="min-h-[120px]"
        />
      </div>

      <div className="col-span-full">
        <Label>Цели</Label>
        <Textarea
          value={npc.goal || ''}
          onChange={(e) => onUpdate({ goal: e.target.value })}
          placeholder="Чего хочет добиться персонаж?"
          className="min-h-[120px]"
        />
      </div>

      <div className="col-span-full">
        <Label>Секреты</Label>
        <Textarea
          value={npc.secret || ''}
          onChange={(e) => onUpdate({ secret: e.target.value })}
          placeholder="Что скрывает этот персонаж?"
          className="min-h-[120px]"
        />
      </div>

      <div className="flex gap-2 mt-2">
        <ArchiveTooltip text="Настройте время, чтобы персонаж автоматически перемещался по карте в зависимости от времени суток.">
          <button
            onClick={() => onUpdate({ showSchedule: !npc.showSchedule })}
            className={`text-[8px] font-black uppercase tracking-widest px-2 py-1.5 rounded border transition-colors ${
              npc.showSchedule
                ? 'bg-indigo-950/30 border-indigo-900/50 text-indigo-400'
                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Расписание
          </button>
        </ArchiveTooltip>
      </div>

      {npc.showSchedule && (
        <div className="bg-zinc-950/80 border border-zinc-800 p-3 rounded-lg flex flex-col gap-3 shadow-inner">
          <div className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest">Распорядок дня</div>
          
          {(npc.schedule || []).map((entry, index) => (
            <div key={index} className="grid grid-cols-2 gap-2 pb-3 border-b border-zinc-900 last:border-0 last:pb-0">
              <div className="flex gap-1">
                <Input
                  type="number"
                  min={0}
                  max={23}
                  placeholder="С"
                  value={entry.startHour ?? ''}
                  onChange={(e) => {
                    const newSched = [...(npc.schedule || [])]
                    let val = Number.parseInt(e.target.value, 10);
                    if (isNaN(val)) val = 0;
                    if (val < 0) val = 0;
                    if (val > 23) val = 23;
                    newSched[index] = { ...newSched[index], startHour: val }
                    onUpdate({ schedule: newSched })
                  }}
                />
                <Input
                  type="number"
                  min={0}
                  max={23}
                  placeholder="По"
                  value={entry.endHour ?? ''}
                  onChange={(e) => {
                    const newSched = [...(npc.schedule || [])]
                    let val = Number.parseInt(e.target.value, 10);
                    if (isNaN(val)) val = 0;
                    if (val < 0) val = 0;
                    if (val > 23) val = 23;
                    newSched[index] = { ...newSched[index], endHour: val }
                    onUpdate({ schedule: newSched })
                  }}
                />
              </div>
              <select
                value={entry.locationId || 'none'}
                onChange={(e) => {
                  const newSched = [...(npc.schedule || [])]
                  newSched[index] = { ...newSched[index], locationId: e.target.value === 'none' ? null : e.target.value }
                  onUpdate({ schedule: newSched })
                }}
                className="bg-zinc-900 border border-zinc-800 text-[10px] p-1.5 rounded outline-none text-zinc-300 cursor-pointer focus:border-indigo-500 truncate"
              >
                <option value="none">Вне карты</option>
                {nodes
                  .filter((n) => n.type !== 'region')
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {String((n.data as { label?: string })?.label || '')}
                    </option>
                  ))}
              </select>

              <div className="col-span-2 flex gap-1 items-center">
                <Input
                  placeholder="Чем занимается? (Спит, Торгует...)"
                  value={entry.activity || ''}
                  onChange={(e) => {
                    const newSched = [...(npc.schedule || [])]
                    newSched[index] = { ...newSched[index], activity: e.target.value }
                    onUpdate({ schedule: newSched })
                  }}
                />
                <button
                  onClick={() => {
                    const newSched = [...(npc.schedule || [])]
                    newSched.splice(index, 1)
                    onUpdate({ schedule: newSched })
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded bg-red-950/30 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                  title="Удалить запись"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => {
              const newSched = [...(npc.schedule || []), { startHour: 8, endHour: 18, locationId: null, activity: '' }]
              onUpdate({ schedule: newSched })
            }}
            className="w-full py-2 border border-dashed border-zinc-800 text-[8px] text-zinc-500 hover:text-indigo-400 hover:border-indigo-900/50 uppercase font-bold transition-colors rounded"
          >
            + Добавить время
          </button>
        </div>
      )}
    </div>
  )
}

