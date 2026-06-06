import type { Node } from 'reactflow'
import { AiWand } from '../ai/AiWand'
import { Input } from '../../ui/Input'
import { Textarea } from '../../ui/Textarea'
import { Label } from '../../ui/Label'

export const CharacterForm = ({
  character,
  onUpdate
}: {
  character: any
  nodes: Node[]
  onUpdate: (data: any) => void
}) => {
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
