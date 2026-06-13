import type { Node } from 'reactflow'
import { NPC } from '@/types/workspace'
import { ArchiveTooltip } from './ArchiveTooltip'
import { AiWand } from '../ai/AiWand'
import { Input } from '../../ui/Input'
import { Textarea } from '../../ui/Textarea'
import { Label } from '../../ui/Label'

const SectionButton = ({
  title,
  subtitle,
  open,
  onClick,
  tone = 'default'
}: {
  title: string
  subtitle?: string
  open: boolean
  onClick: () => void
  tone?: 'default' | 'danger' | 'warning'
}) => {
  const tones: Record<'default' | 'danger' | 'warning', string> = {
    default: 'hover:bg-zinc-800/60',
    warning: 'hover:bg-amber-950/30',
    danger: 'hover:bg-red-950/30'
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex justify-between items-center bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg transition-colors ${tones[tone]}`}
    >
      <div className="text-left">
        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-200">{title}</div>
        {subtitle && <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 mt-0.5">{subtitle}</div>}
      </div>
      <div className={`text-zinc-500 text-xs font-black transition-transform ${open ? 'rotate-180' : ''}`}>⌄</div>
    </button>
  )
}

export function NpcForm({
  npc,
  nodes,
  onUpdate
}: {
  npc: NPC
  nodes: Node[]
  onUpdate: (data: Partial<NPC>) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <Input
        value={npc.occupation || ''}
        onChange={(e) => onUpdate({ occupation: e.target.value })}
        placeholder="Роль (Торговец, Стражник...)"
        className="text-indigo-300"
      />

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

      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <Label className="mb-0">Описание</Label>
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
          rows={3}
        />
      </div>

      <div className="flex gap-2">
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
          
          <div className="mb-2">
            <Label>Постоянная локация (База)</Label>
            <select
              value={npc.defaultLocationId || ''}
              onChange={(e) => onUpdate({ 
                defaultLocationId: e.target.value,
                locationId: e.target.value 
              })}
              className="w-full bg-zinc-900 border border-zinc-800 p-1.5 rounded text-[10px]"
            >
              <option value="">Не выбрана</option>
              {nodes
                .filter((n) => n.type !== 'region')
                .map((n) => (
                  <option key={n.id} value={n.id}>
                    {String((n.data as { label?: string })?.label || '')}
                  </option>
                ))}
            </select>
          </div>

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

