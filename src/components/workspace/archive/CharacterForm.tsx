import type { Node } from 'reactflow'
import { AiWand } from '../ai/AiWand'
import { Input } from '../../ui/Input'
import { Textarea } from '../../ui/Textarea'
import { Label } from '../../ui/Label'
import { useWorkspaceStore } from '../../../store/useWorkspaceStore'

export const CharacterForm = ({
  character,
  onUpdate
}: {
  character: any
  onUpdate: (data: any) => void
}) => {
  const schedule = character.schedule || []
  const locations = useWorkspaceStore(state => state.locations);

  const updateSchedule = (newSchedule: any[]) => {
    onUpdate({ ...character, schedule: newSchedule })
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        value={character.name || ''}
        onChange={(e) => onUpdate({ ...character, name: e.target.value })}
        placeholder="Имя персонажа"
        className="font-bold text-lg"
      />

      <div className="grid grid-cols-3 gap-2">
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
        <select
          value={character.relation || 'neutral'}
          onChange={(e) => onUpdate({ ...character, relation: e.target.value })}
          className="bg-zinc-900 border border-zinc-800 text-[10px] px-2 rounded outline-none text-zinc-300 cursor-pointer focus:border-indigo-500"
        >
          <option value="neutral">Нейтрально</option>
          <option value="friendly">Дружелюбно</option>
          <option value="hostile">Враждебно</option>
        </select>
      </div>

      <div>
        <Label>Распорядок дня</Label>
        {schedule.map((s: any, idx: number) => (
          <div key={idx} className="flex gap-2 mb-2 items-center">
            <Input type="number" className="w-16" value={s.startHour} onChange={(e) => {
              const newS = [...schedule];
              newS[idx].startHour = parseInt(e.target.value);
              updateSchedule(newS);
            }} placeholder="С" />
            <Input type="number" className="w-16" value={s.endHour} onChange={(e) => {
              const newS = [...schedule];
              newS[idx].endHour = parseInt(e.target.value);
              updateSchedule(newS);
            }} placeholder="По" />
            <select className="flex-1 bg-zinc-900 border border-zinc-800 p-1 rounded" value={s.locationId || ''} onChange={(e) => {
              const newS = [...schedule];
              newS[idx].locationId = e.target.value;
              updateSchedule(newS);
            }}>
              <option value="">Локация</option>
              {Object.values(locations || {}).map((loc: any) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            <Input className="w-24" value={s.activity || ''} onChange={(e) => {
              const newS = [...schedule];
              newS[idx].activity = e.target.value;
              updateSchedule(newS);
            }} placeholder="Что делает" />
            <button className="text-red-500" onClick={() => updateSchedule(schedule.filter((_: any, i: number) => i !== idx))}>X</button>
          </div>
        ))}
        <button className="w-full bg-zinc-800 p-1 text-xs rounded" onClick={() => updateSchedule([...schedule, { startHour: 0, endHour: 1, locationId: '', activity: '' }])}>+ Распорядок</button>
      </div>

      <div>
        <Label>Краткое описание</Label>
        <Textarea
          value={character.description || ''}
          onChange={(e) => onUpdate({ ...character, description: e.target.value })}
          placeholder="Краткое описание для превью..."
          rows={2}
        />
      </div>

      <div className="bg-zinc-950/50 border border-zinc-800 p-3 rounded-lg">
        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Характер</div>
        <div className="grid grid-cols-2 gap-3">
          <Input value={character.traits || ''} onChange={(e) => onUpdate({ ...character, traits: e.target.value })} placeholder="Черты" />
          <Input value={character.ideals || ''} onChange={(e) => onUpdate({ ...character, ideals: e.target.value })} placeholder="Идеалы" />
          <Input value={character.bonds || ''} onChange={(e) => onUpdate({ ...character, bonds: e.target.value })} placeholder="Привязанности" />
          <Input value={character.flaws || ''} onChange={(e) => onUpdate({ ...character, flaws: e.target.value })} placeholder="Слабости" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <Textarea value={character.appearance || ''} onChange={(e) => onUpdate({ ...character, appearance: e.target.value })} placeholder="Внешность" rows={2} />
        <Textarea value={character.secret || ''} onChange={(e) => onUpdate({ ...character, secret: e.target.value })} placeholder="Секрет" rows={2} />
        <Textarea value={character.relations || ''} onChange={(e) => onUpdate({ ...character, relations: e.target.value })} placeholder="Отношения с другими" rows={2} />
        <Input value={character.currentRole || ''} onChange={(e) => onUpdate({ ...character, currentRole: e.target.value })} placeholder="Текущая роль в сюжете" />
      </div>
    </div>
  )
}
