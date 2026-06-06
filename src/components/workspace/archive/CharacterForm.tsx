import type { Node } from 'reactflow'
import { AiWand } from '../ai/AiWand'
import { Input } from '../../ui/Input'
import { Textarea } from '../../ui/Textarea'
import { Label } from '../../ui/Label'
import { ArchiveTooltip } from './ArchiveTooltip'

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

export const CharacterForm = ({
  character,
  nodes,
  onUpdate
}: {
  character: any
  nodes: Node[]
  onUpdate: (data: any) => void
}) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <Input
          value={character.raceClass || ''}
          onChange={(e) => onUpdate({ ...character, raceClass: e.target.value })}
          placeholder="Раса и Класс"
          className="text-indigo-300"
        />
        <Input
          value={character.role || ''}
          onChange={(e) => onUpdate({ ...character, role: e.target.value })}
          placeholder="Роль (Антагонист...)"
          className="text-zinc-300"
        />
      </div>
      
      <select
        value={character.relation || 'neutral'}
        onChange={(e) => onUpdate({ ...character, relation: e.target.value })}
        className="bg-zinc-900 border border-zinc-800 text-[10px] p-2 rounded outline-none text-zinc-300 cursor-pointer focus:border-indigo-500"
      >
        <option value="neutral">Нейтральное отношение</option>
        <option value="allied">Союзник</option>
        <option value="hostile">Антагонист</option>
        <option value="friendly">Дружелюбный</option>
      </select>

      <SectionButton
        title="ОПИСАНИЕ"
        open={!!character.showDescription}
        onClick={() => onUpdate({ ...character, showDescription: !character.showDescription })}
      />
      {character.showDescription && (
        <div className="flex flex-col gap-3 bg-zinc-950/40 border border-zinc-800 p-3 rounded-lg">
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label className="mb-0">Внешность</Label>
              <AiWand 
                currentValue={character.appearance || ''}
                contextData={character}
                onApply={(text) => onUpdate({ ...character, appearance: text })}
              />
            </div>
            <Textarea
              value={character.appearance || ''}
              onChange={(e) => onUpdate({ ...character, appearance: e.target.value })}
              placeholder="Для игроков..."
              rows={3}
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label className="mb-0">Истинная суть</Label>
              <AiWand 
                currentValue={character.trueNature || ''}
                contextData={character}
                onApply={(text) => onUpdate({ ...character, trueNature: text })}
              />
            </div>
            <Textarea
              value={character.trueNature || ''}
              onChange={(e) => onUpdate({ ...character, trueNature: e.target.value })}
              placeholder="Для мастера..."
              rows={3}
            />
          </div>
        </div>
      )}

      <SectionButton
        title="ПСИХОЛОГИЯ"
        tone="warning"
        open={!!character.showPsychology}
        onClick={() => onUpdate({ ...character, showPsychology: !character.showPsychology })}
      />
      {character.showPsychology && (
        <div className="flex flex-col gap-3 bg-zinc-950/40 border border-zinc-800 p-3 rounded-lg">
          {['goal', 'flaw', 'secret'].map((field) => (
            <div key={field}>
              <div className="flex justify-between items-center mb-1">
                <Label className="mb-0 capitalize">{field}</Label>
                <AiWand 
                  currentValue={character[field] || ''}
                  contextData={character}
                  onApply={(text) => onUpdate({ ...character, [field]: text })}
                />
              </div>
              <Textarea
                value={character[field] || ''}
                onChange={(e) => onUpdate({ ...character, [field]: e.target.value })}
                rows={2}
              />
            </div>
          ))}
        </div>
      )}

      <SectionButton
        title="МЕХАНИКА И ИНВЕНТАРЬ"
        tone="warning"
        open={!!character.showMechanics}
        onClick={() => onUpdate({ ...character, showMechanics: !character.showMechanics })}
      />
      {character.showMechanics && (
        <div className="flex flex-col gap-3 bg-zinc-950/40 border border-zinc-800 p-3 rounded-lg">
          <Input
            value={character.stats || ''}
            onChange={(e) => onUpdate({ ...character, stats: e.target.value })}
            placeholder="AC, HP, Навыки..."
          />
          <Input
            value={character.inventory || ''}
            onChange={(e) => onUpdate({ ...character, inventory: e.target.value })}
            placeholder="Квестовые предметы..."
          />
        </div>
      )}

      <div className="flex gap-2">
        <ArchiveTooltip text="Настройте время, чтобы персонаж автоматически перемещался по карте.">
          <button
            onClick={() => onUpdate({ ...character, showSchedule: !character.showSchedule })}
            className={`text-[8px] font-black uppercase tracking-widest px-2 py-1.5 rounded border transition-colors ${
              character.showSchedule
                ? 'bg-indigo-950/30 border-indigo-900/50 text-indigo-400'
                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Расписание
          </button>
        </ArchiveTooltip>
      </div>

      {character.showSchedule && (
        <div className="bg-zinc-950/80 border border-zinc-800 p-3 rounded-lg flex flex-col gap-3 shadow-inner">
          <div className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest">Распорядок дня</div>
          {(character.schedule || []).map((entry: any, index: number) => (
            <div key={index} className="grid grid-cols-2 gap-2 pb-3 border-b border-zinc-900 last:border-0 last:pb-0">
              <div className="flex gap-1">
                <Input
                  type="number"
                  placeholder="С"
                  value={entry.startHour ?? ''}
                  onChange={(e) => {
                    const newSched = [...(character.schedule || [])]
                    newSched[index] = { ...newSched[index], startHour: Number.parseInt(e.target.value, 10) || 0 }
                    onUpdate({ ...character, schedule: newSched })
                  }}
                />
                <Input
                  type="number"
                  placeholder="По"
                  value={entry.endHour ?? ''}
                  onChange={(e) => {
                    const newSched = [...(character.schedule || [])]
                    newSched[index] = { ...newSched[index], endHour: Number.parseInt(e.target.value, 10) || 0 }
                    onUpdate({ ...character, schedule: newSched })
                  }}
                />
              </div>
              <select
                value={entry.locationId || 'none'}
                onChange={(e) => {
                  const newSched = [...(character.schedule || [])]
                  newSched[index] = { ...newSched[index], locationId: e.target.value === 'none' ? null : e.target.value }
                  onUpdate({ ...character, schedule: newSched })
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
                  placeholder="Чем занимается?..."
                  value={entry.activity || ''}
                  onChange={(e) => {
                    const newSched = [...(character.schedule || [])]
                    newSched[index] = { ...newSched[index], activity: e.target.value }
                    onUpdate({ ...character, schedule: newSched })
                  }}
                />
                <button
                  onClick={() => {
                    const newSched = [...(character.schedule || [])]
                    newSched.splice(index, 1)
                    onUpdate({ ...character, schedule: newSched })
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded bg-red-950/30 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              const newSched = [...(character.schedule || []), { startHour: 8, endHour: 18, locationId: null, activity: '' }]
              onUpdate({ ...character, schedule: newSched })
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
