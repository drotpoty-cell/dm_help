import type { Node } from 'reactflow'
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

export function CharacterForm({
  character,
  nodes,
  onUpdate
}: {
  character: any
  nodes: Node[]
  onUpdate: (data: any) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <Input
          value={character.raceClass || ''}
          onChange={(e) => onUpdate({ ...character, raceClass: e.target.value })}
          placeholder="Раса и Класс"
        />
        <Input
          value={character.role || ''}
          onChange={(e) => onUpdate({ ...character, role: e.target.value })}
          placeholder="Роль в сюжете"
        />
      </div>
      
      <select
        value={character.relation || 'neutral'}
        onChange={(e) => onUpdate({ ...character, relation: e.target.value })}
        className="w-full bg-zinc-900 border border-zinc-800 text-[10px] p-2 rounded outline-none text-zinc-300 cursor-pointer focus:border-indigo-500"
      >
        <option value="neutral">Нейтрально</option>
        <option value="friendly">Дружелюбно</option>
        <option value="hostile">Враждебно</option>
      </select>

      <SectionButton
        title="ОПИСАНИЕ"
        open={!!character.showDescription}
        onClick={() => onUpdate({ ...character, showDescription: !character.showDescription })}
      />
      {character.showDescription && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <Label>Внешность</Label>
            <AiWand 
              currentValue={character.appearance || ''}
              contextData={character}
              onApply={(text) => onUpdate({ ...character, appearance: text })}
            />
          </div>
          <Textarea
            value={character.appearance || ''}
            onChange={(e) => onUpdate({ ...character, appearance: e.target.value })}
            placeholder="Внешность для игроков..."
            rows={3}
          />
          <div className="flex justify-between items-center">
            <Label>Истинная суть</Label>
            <AiWand 
              currentValue={character.trueNature || ''}
              contextData={character}
              onApply={(text) => onUpdate({ ...character, trueNature: text })}
            />
          </div>
          <Textarea
            value={character.trueNature || ''}
            onChange={(e) => onUpdate({ ...character, trueNature: e.target.value })}
            placeholder="Истинная суть для мастера..."
            rows={3}
          />
        </div>
      )}

      <SectionButton
        title="ПСИХОЛОГИЯ"
        tone="warning"
        open={!!character.showPsychology}
        onClick={() => onUpdate({ ...character, showPsychology: !character.showPsychology })}
      />
      {character.showPsychology && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <Label>Цель</Label>
            <AiWand currentValue={character.goal || ''} contextData={character} onApply={(text) => onUpdate({ ...character, goal: text })} />
          </div>
          <Textarea value={character.goal || ''} onChange={(e) => onUpdate({ ...character, goal: e.target.value })} placeholder="Цель..." />
          
          <div className="flex justify-between items-center">
            <Label>Слабость</Label>
            <AiWand currentValue={character.flaw || ''} contextData={character} onApply={(text) => onUpdate({ ...character, flaw: text })} />
          </div>
          <Textarea value={character.flaw || ''} onChange={(e) => onUpdate({ ...character, flaw: e.target.value })} placeholder="Слабость..." />
          
          <div className="flex justify-between items-center">
            <Label>Секрет</Label>
            <AiWand currentValue={character.secret || ''} contextData={character} onApply={(text) => onUpdate({ ...character, secret: text })} />
          </div>
          <Textarea value={character.secret || ''} onChange={(e) => onUpdate({ ...character, secret: e.target.value })} placeholder="Секрет..." />
        </div>
      )}

      <SectionButton
        title="МЕХАНИКА И ИНВЕНТАРЬ"
        open={!!character.showMechanics}
        onClick={() => onUpdate({ ...character, showMechanics: !character.showMechanics })}
      />
      {character.showMechanics && (
        <div className="flex flex-col gap-2">
          <Label>Статы</Label>
          <Input value={character.stats || ''} onChange={(e) => onUpdate({ ...character, stats: e.target.value })} placeholder="AC, HP, Навыки..." />
          <Label>Инвентарь</Label>
          <Input value={character.inventory || ''} onChange={(e) => onUpdate({ ...character, inventory: e.target.value })} placeholder="Квестовые предметы..." />
        </div>
      )}

      <button
        onClick={() => onUpdate({ ...character, showSchedule: !character.showSchedule })}
        className="text-[8px] font-black uppercase tracking-widest px-2 py-1.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300"
      >
        Расписание
      </button>

      {character.showSchedule && (
        <div className="bg-zinc-950/80 border border-zinc-800 p-3 rounded-lg flex flex-col gap-3">
          {(character.schedule || []).map((entry: any, index: number) => (
            <div key={index} className="grid grid-cols-2 gap-2 pb-3 border-b border-zinc-900">
              <Input type="number" placeholder="С" value={entry.startHour ?? ''} onChange={(e) => {
                const newSched = [...(character.schedule || [])];
                newSched[index] = { ...newSched[index], startHour: Number(e.target.value) };
                onUpdate({ ...character, schedule: newSched });
              }} />
              <Input type="number" placeholder="По" value={entry.endHour ?? ''} onChange={(e) => {
                const newSched = [...(character.schedule || [])];
                newSched[index] = { ...newSched[index], endHour: Number(e.target.value) };
                onUpdate({ ...character, schedule: newSched });
              }} />
              <select value={entry.locationId || 'none'} onChange={(e) => {
                const newSched = [...(character.schedule || [])];
                newSched[index] = { ...newSched[index], locationId: e.target.value === 'none' ? null : e.target.value };
                onUpdate({ ...character, schedule: newSched });
              }} className="col-span-2 bg-zinc-900 border border-zinc-800 p-1.5 rounded text-[10px]">
                <option value="none">Вне карты</option>
                {nodes.filter(n => n.type !== 'region').map(n => (
                  <option key={n.id} value={n.id}>{(n.data as any)?.label || n.id}</option>
                ))}
              </select>
              <Input className="col-span-2" placeholder="Занятие" value={entry.activity || ''} onChange={(e) => {
                const newSched = [...(character.schedule || [])];
                newSched[index] = { ...newSched[index], activity: e.target.value };
                onUpdate({ ...character, schedule: newSched });
              }} />
            </div>
          ))}
          <button onClick={() => {
            onUpdate({ ...character, schedule: [...(character.schedule || []), { startHour: 8, endHour: 18, locationId: null, activity: '' }] });
          }} className="w-full py-2 border border-dashed border-zinc-800 text-[8px] text-zinc-500 uppercase rounded">+ Добавить время</button>
        </div>
      )}
    </div>
  )
}
