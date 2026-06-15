import { AiWand } from '@/components/workspace/ai/AiWand'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'

export function BestiaryForm({ threat, onUpdate }: { threat: any; onUpdate: (data: any) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Input
          value={threat.type || ''}
          onChange={(e) => onUpdate({ ...threat, type: e.target.value })}
          placeholder="Тип (Нежить, Зверь и т.д.)"
        />
        <Input
          value={threat.cr || ''}
          onChange={(e) => onUpdate({ ...threat, cr: e.target.value })}
          placeholder="Уровень угрозы / Сложность"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 text-xs font-bold text-zinc-500 uppercase mt-2">Боевые параметры</div>
        <div className="bg-zinc-950/50 p-2 rounded border border-zinc-800 shadow-inner">
          <Label className="mb-1">Класс Брони (AC)</Label>
          <input
            type="number"
            value={threat.combatStats?.ac || 10}
            onChange={(e) => onUpdate({ ...threat, combatStats: { ...threat.combatStats, ac: Number.parseInt(e.target.value, 10) || 10 } })}
            className="bg-transparent text-cyan-400 font-bold text-sm w-full outline-none"
          />
        </div>
        <div className="bg-zinc-950/50 p-2 rounded border border-zinc-800 shadow-inner">
          <Label className="mb-1">HP</Label>
          <input
            type="number"
            value={threat.combatStats?.hp || 10}
            onChange={(e) => onUpdate({ ...threat, combatStats: { ...threat.combatStats, hp: Number.parseInt(e.target.value, 10) || 10 } })}
            className="bg-transparent text-emerald-400 font-bold text-sm w-full outline-none"
          />
        </div>
        <Input
          className="col-span-2"
          value={threat.combatStats?.speed || ''}
          onChange={(e) => onUpdate({ ...threat, combatStats: { ...threat.combatStats, speed: e.target.value } })}
          placeholder="Скорость"
        />
        <Input
          className="col-span-2"
          value={threat.combatStats?.resistances || ''}
          onChange={(e) => onUpdate({ ...threat, combatStats: { ...threat.combatStats, resistances: e.target.value } })}
          placeholder="Стойкости и Уязвимости"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Действия</Label>
        <Textarea
          value={threat.actions || ''}
          onChange={(e) => onUpdate({ ...threat, actions: e.target.value })}
          placeholder="Описания атак..."
          className="h-20"
        />
      </div>

      <div className="flex flex-col gap-2 border-l-2 border-red-500 pl-3">
        <div className="flex justify-between items-center">
          <Label>Тактика в бою</Label>
          <AiWand 
            currentValue={threat.tactics || ''}
            contextData={threat}
            onApply={(text) => onUpdate({ ...threat, tactics: text })}
            title="Тактика"
          />
        </div>
        <Textarea
          value={threat.tactics || ''}
          onChange={(e) => onUpdate({ ...threat, tactics: e.target.value })}
          placeholder="Как ведет себя в бою..."
          className="h-20"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <Label>Трофеи</Label>
          <AiWand 
            currentValue={threat.drops || ''}
            contextData={threat}
            onApply={(text) => onUpdate({ ...threat, drops: text })}
            title="Трофеи"
          />
        </div>
        <Textarea
          value={threat.drops || ''}
          onChange={(e) => onUpdate({ ...threat, drops: e.target.value })}
          placeholder="Лут с монстра..."
          className="h-20"
        />
      </div>
    </div>
  )
}
