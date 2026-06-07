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
      <div className="flex justify-between items-center bg-zinc-950/50 border border-zinc-800 p-1 rounded-lg">
        <button
          onClick={() => onUpdate({ isMajor: false })}
          className={`flex-1 py-1 text-[9px] font-bold uppercase rounded ${
            !npc.isMajor ? 'bg-zinc-800 text-zinc-300' : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          Массовка
        </button>
        <ArchiveTooltip text="Сделайте персонажа ключевым, чтобы открыть глубокие настройки лора: статы, секреты, цели и особый лут.">
          <button
            onClick={() => onUpdate({ isMajor: true })}
            className={`flex-1 py-1 px-2 text-[9px] font-bold uppercase rounded flex justify-center items-center gap-1 ${
              npc.isMajor
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            Ключевой
          </button>
        </ArchiveTooltip>
      </div>

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
              onChange={(e) => onUpdate({ defaultLocationId: e.target.value })}
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

      {npc.isMajor && (
        <div className="flex flex-col gap-3 mt-2">
          <ArchiveTooltip text="Попросите ИИ сгенерировать статы, если планируете бой с этим персонажем.">
            <SectionButton
              title="СТАТЫ"
              subtitle="Класс, AC, HP, навыки"
              open={!!npc.showStats}
              onClick={() => onUpdate({ showStats: !npc.showStats })}
              tone="warning"
            />
          </ArchiveTooltip>
          {npc.showStats && (
            <div className="bg-zinc-950/40 border border-zinc-800 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <Label>Класс</Label>
                  <Input
                    value={npc.dndClass || ''}
                    onChange={(e) => onUpdate({ dndClass: e.target.value })}
                    placeholder="Бард 3 / Воин 2..."
                  />
                </div>

                <div>
                  <Label>AC</Label>
                  <Input
                    type="number"
                    min={0}
                    value={npc.ac ?? ''}
                    onChange={(e) => onUpdate({ ac: e.target.value === '' ? undefined : Number.parseInt(e.target.value, 10) || 0 })}
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label>Текущее HP</Label>
                  <Input
                    type="number"
                    min={0}
                    value={npc.hp ?? ''}
                    onChange={(e) => onUpdate({ hp: e.target.value === '' ? undefined : Number.parseInt(e.target.value, 10) || 0 })}
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label>Макс HP</Label>
                  <Input
                    type="number"
                    min={0}
                    value={npc.maxHp ?? ''}
                    onChange={(e) =>
                      onUpdate({ maxHp: e.target.value === '' ? undefined : Number.parseInt(e.target.value, 10) || 0 })
                    }
                    placeholder="10"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Ключевые навыки</Label>
                  <Input
                    value={npc.skills || ''}
                    onChange={(e) => onUpdate({ skills: e.target.value })}
                    placeholder="Stealth +6, Perception +4..."
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-zinc-600">Legacy (stats)</Label>
                  <Input
                    value={npc.stats || ''}
                    onChange={(e) => onUpdate({ stats: e.target.value })}
                    placeholder="HP: 45, AC: 14..."
                    className="bg-zinc-900/60 text-zinc-500 focus:border-zinc-700 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <SectionButton
            title="ЦЕЛЬ"
            subtitle="Скрытая мотивация"
            open={!!npc.showGoal}
            onClick={() => onUpdate({ showGoal: !npc.showGoal })}
          />
          {npc.showGoal && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <Label className="mb-0">Цель</Label>
                <AiWand 
                  currentValue={npc.goal || ''}
                  contextData={npc}
                  onApply={(text) => onUpdate({ goal: text })}
                />
              </div>
              <Textarea
                value={npc.goal || ''}
                onChange={(e) => onUpdate({ goal: e.target.value })}
                rows={3}
                placeholder="Свергнуть короля, найти дочь..."
              />
            </div>
          )}

          <SectionButton
            title="ТАЙНА"
            subtitle="Что скрывает от игроков"
            open={!!npc.showSecret}
            onClick={() => onUpdate({ showSecret: !npc.showSecret })}
            tone="danger"
          />
          {npc.showSecret && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <Label className="mb-0">Тайна</Label>
                <AiWand 
                  currentValue={npc.secret || ''}
                  contextData={npc}
                  onApply={(text) => onUpdate({ secret: text })}
                />
              </div>
              <Textarea
                value={npc.secret || ''}
                onChange={(e) => onUpdate({ secret: e.target.value })}
                rows={3}
                placeholder="На самом деле он вампир..."
              />
            </div>
          )}

          <SectionButton
            title={npc.isMerchant ? 'АССОРТИМЕНТ И ЦЕНЫ' : 'СОКРОВИЩА'}
            subtitle={npc.isMerchant ? 'Что продаёт и по чём' : 'Лорный лут / что в карманах'}
            open={!!npc.showLoot}
            onClick={() => onUpdate({ showLoot: !npc.showLoot })}
            tone="warning"
          />
          {npc.showLoot && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <Label className="mb-0">Лут</Label>
                <AiWand 
                  currentValue={npc.personalLoot || ''}
                  contextData={npc}
                  onApply={(text) => onUpdate({ personalLoot: text })}
                />
              </div>
              <Textarea
                value={npc.personalLoot || ''}
                onChange={(e) => onUpdate({ personalLoot: e.target.value })}
                rows={3}
                placeholder={npc.isMerchant ? 'Зелья лечения — 50 gp, Стрелы (20) — 5 gp...' : 'Ключ от сейфа, старая монета...'}
              />
            </div>
          )}

          <SectionButton
            title="ЗАМЕТКИ"
            subtitle="Связи, привычки, страхи"
            open={!!npc.showNotes}
            onClick={() => onUpdate({ showNotes: !npc.showNotes })}
          />
          {npc.showNotes && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <Label className="mb-0">Заметки</Label>
                <AiWand 
                  currentValue={npc.notes || ''}
                  contextData={npc}
                  onApply={(text) => onUpdate({ notes: text })}
                />
              </div>
              <Textarea
                value={npc.notes || ''}
                onChange={(e) => onUpdate({ notes: e.target.value })}
                rows={3}
                placeholder="Связи, привычки, страхи..."
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

