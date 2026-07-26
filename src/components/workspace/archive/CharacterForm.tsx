import { useState } from 'react'
import type { Node } from 'reactflow'
import { AiWand } from '@/components/workspace/ai/AiWand'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export const CharacterForm = ({
  character,
  onUpdate
}: {
  character: any
  onUpdate: (data: any) => void
}) => {
  const schedule = character.schedule || []
  const locations = useWorkspaceStore(state => state.locations);
  const [traitInput, setTraitInput] = useState('')

  const updateSchedule = (newSchedule: any[]) => {
    onUpdate({ ...character, schedule: newSchedule })
  }

  const handleAddTrait = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && traitInput.trim()) {
      onUpdate({ ...character, traits: [...(character.traits || []), traitInput.trim()] })
      setTraitInput('')
    }
  }

  const handleRemoveTrait = (index: number) => {
    onUpdate({ ...character, traits: (character.traits || []).filter((_: string, i: number) => i !== index) })
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800 rounded-lg p-3 cursor-pointer hover:bg-zinc-900/60 transition-colors">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-200 flex items-center gap-2">
          <span className="text-amber-400">★</span> Ключевой персонаж (важный)
        </span>
        <input
          type="checkbox"
          checked={!!character.isImportant}
          onChange={(e) => onUpdate({ ...character, isImportant: e.target.checked })}
          className="h-4 w-4 accent-indigo-500"
        />
      </label>

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

      <Input
        value={character.occupation || ''}
        onChange={(e) => onUpdate({ ...character, occupation: e.target.value })}
        placeholder="Занятие (Торговец, Стражник...)"
        className="text-indigo-300"
      />

      <div>
        <Label>Постоянная локация (База)</Label>
        <select
          value={character.defaultLocationId || ''}
          onChange={(e) => onUpdate({ 
            ...character, 
            defaultLocationId: e.target.value,
            locationId: e.target.value 
          })}
          className="w-full bg-zinc-900 border border-zinc-800 p-1 rounded text-sm mb-2"
        >
          <option value="">Не выбрана</option>
          {Object.values(locations || {}).map((loc: any) => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>
        <Label>Распорядок дня</Label>
        {schedule.map((s: any, idx: number) => (
          <div key={idx} className="flex gap-2 mb-2 items-center">
            <Input 
              type="number" 
              className="w-16" 
              value={s.startHour} 
              min={0} 
              max={23} 
              onChange={(e) => {
                const newS = [...schedule];
                let val = parseInt(e.target.value);
                if (isNaN(val)) val = 0;
                if (val < 0) val = 0;
                if (val > 23) val = 23;
                newS[idx].startHour = val;
                updateSchedule(newS);
              }} 
              placeholder="С" 
            />
            <Input 
              type="number" 
              className="w-16" 
              value={s.endHour} 
              min={0} 
              max={23} 
              onChange={(e) => {
                const newS = [...schedule];
                let val = parseInt(e.target.value);
                if (isNaN(val)) val = 0;
                if (val < 0) val = 0;
                if (val > 23) val = 23;
                newS[idx].endHour = val;
                updateSchedule(newS);
              }} 
              placeholder="По" 
            />
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
        <Label>Черты (теги)</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {(character.traits || []).map((trait: string, index: number) => (
            <span key={index} className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-xs flex items-center gap-2">
              {trait}
              <button onClick={() => handleRemoveTrait(index)} className="text-zinc-500 hover:text-red-400">✕</button>
            </span>
          ))}
        </div>
        <Input
          value={traitInput}
          onChange={(e) => setTraitInput(e.target.value)}
          onKeyDown={handleAddTrait}
          placeholder="Нажмите Enter, чтобы добавить черту..."
        />
      </div>

      <div>
        <Label>Краткое описание</Label>
        <div className="flex justify-between items-center mb-1">
          <AiWand
            mode="character"
            currentValue={character.description || ''}
            contextData={character}
            onApply={(text) => onUpdate({ ...character, description: text })}
          />
        </div>
        <Textarea
          value={character.description || ''}
          onChange={(e) => onUpdate({ ...character, description: e.target.value })}
          placeholder="Внешность, манеры, первое впечатление..."
          rows={2}
        />
      </div>

      <div className="bg-zinc-950/50 border border-zinc-800 p-3 rounded-lg">
        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Характер</div>
        <div className="grid grid-cols-2 gap-3">
          <Input value={character.ideals || ''} onChange={(e) => onUpdate({ ...character, ideals: e.target.value })} placeholder="Идеалы" />
          <Input value={character.bonds || ''} onChange={(e) => onUpdate({ ...character, bonds: e.target.value })} placeholder="Привязанности" />
          <Input value={character.flaws || ''} onChange={(e) => onUpdate({ ...character, flaws: e.target.value })} placeholder="Слабости" />
        </div>
      </div>

      <div className="bg-zinc-950/50 border border-zinc-800 p-3 rounded-lg">
        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Игромеханика (для ГМа)</div>
        <div className="grid grid-cols-4 gap-2 mb-2">
          <Input type="number" value={character.hp ?? ''} onChange={(e) => onUpdate({ ...character, hp: Number.parseInt(e.target.value, 10) || 0 })} placeholder="HP" />
          <Input type="number" value={character.maxHp ?? ''} onChange={(e) => onUpdate({ ...character, maxHp: Number.parseInt(e.target.value, 10) || 0 })} placeholder="Макс HP" />
          <Input type="number" value={character.ac ?? ''} onChange={(e) => onUpdate({ ...character, ac: Number.parseInt(e.target.value, 10) || 0 })} placeholder="AC" />
          <Input value={character.dndClass || ''} onChange={(e) => onUpdate({ ...character, dndClass: e.target.value })} placeholder="Класс/CR" />
        </div>
        <Input value={character.skills || ''} onChange={(e) => onUpdate({ ...character, skills: e.target.value })} placeholder="Навыки/особые способности" className="mb-2" />
        <Textarea value={character.goal || ''} onChange={(e) => onUpdate({ ...character, goal: e.target.value })} placeholder="Цели персонажа" rows={2} className="mb-2" />
        <div>
          <Label>Заметки ГМа</Label>
          <RichTextEditor
            content={character.notes || ''}
            onChange={(html) => onUpdate({ ...character, notes: html })}
            placeholder="Заметки ГМа — наберите @, чтобы сослаться на другого персонажа, локацию, квест..."
            minHeight="90px"
          />
        </div>
      </div>

      <label className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800 rounded-lg p-3 cursor-pointer hover:bg-zinc-900/60 transition-colors">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-200 flex items-center gap-2">
          <span className="text-amber-400">💰</span> Этот персонаж — торговец
        </span>
        <input
          type="checkbox"
          checked={!!character.isMerchant}
          onChange={(e) => onUpdate({ ...character, isMerchant: e.target.checked })}
          className="h-4 w-4 accent-indigo-500"
        />
      </label>
      {character.isMerchant && (
        <Textarea
          value={character.personalLoot || ''}
          onChange={(e) => onUpdate({ ...character, personalLoot: e.target.value })}
          placeholder="Ассортимент товаров..."
          rows={2}
        />
      )}

      <div className="grid grid-cols-1 gap-2">
        <Textarea value={character.appearance || ''} onChange={(e) => onUpdate({ ...character, appearance: e.target.value })} placeholder="Внешность" rows={2} />
        <Textarea value={character.secret || ''} onChange={(e) => onUpdate({ ...character, secret: e.target.value })} placeholder="Секрет" rows={2} />
        <Textarea value={character.relations || ''} onChange={(e) => onUpdate({ ...character, relations: e.target.value })} placeholder="Отношения с другими" rows={2} />
        <Input value={character.currentRole || ''} onChange={(e) => onUpdate({ ...character, currentRole: e.target.value })} placeholder="Текущая роль в сюжете" />
      </div>
    </div>
  )
}
