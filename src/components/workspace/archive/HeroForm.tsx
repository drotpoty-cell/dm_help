import { Hero } from '@/types/workspace'
import { AiWand } from '@/components/workspace/ai/AiWand'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'

export function HeroForm({ hero, onUpdate }: { hero: Hero; onUpdate: (data: Partial<Hero>) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Input
          value={hero.playerName || ''}
          onChange={(e) => onUpdate({ playerName: e.target.value })}
          placeholder="Имя игрока (Кто играет?)"
        />
        <Input
          value={hero.raceClass || ''}
          onChange={(e) => onUpdate({ raceClass: e.target.value })}
          placeholder="Раса и Класс"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-3 flex justify-between items-center mb-1 mt-2">
          <Label>Описание / Предыстория</Label>
          <AiWand 
            currentValue={hero.description || ''}
            contextData={hero}
            onApply={(text) => onUpdate({ description: text })}
            title="Предыстория"
          />
        </div>
        <Textarea
          value={hero.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Краткая предыстория..."
          className="col-span-3 h-20"
        />
        
        <div className="bg-zinc-950/50 p-2 rounded border border-zinc-800 shadow-inner">
          <Label className="mb-1">Уровень</Label>
          <input
            type="number"
            min={1}
            value={hero.level || 1}
            onChange={(e) => onUpdate({ level: Number.parseInt(e.target.value, 10) || 1 })}
            className="bg-transparent text-white font-bold text-sm w-full outline-none"
          />
        </div>
        <div className="bg-zinc-950/50 p-2 rounded border border-zinc-800 shadow-inner">
          <Label className="mb-1">Класс Брони</Label>
          <input
            type="number"
            value={hero.ac || 10}
            onChange={(e) => onUpdate({ ac: Number.parseInt(e.target.value, 10) || 0 })}
            className="bg-transparent text-cyan-400 font-bold text-sm w-full outline-none"
          />
        </div>
        <div className="bg-zinc-950/50 p-2 rounded border border-zinc-800 shadow-inner">
          <Label className="mb-1">Инициатива</Label>
          <input
            type="number"
            value={hero.initiativeModifier || 0}
            onChange={(e) => onUpdate({ initiativeModifier: Number.parseInt(e.target.value, 10) || 0 })}
            className="bg-transparent text-purple-400 font-bold text-sm w-full outline-none"
          />
        </div>

        <div className="bg-emerald-950/20 p-2 rounded border border-emerald-900/30 shadow-inner">
          <Label className="text-emerald-600 mb-1">Макс. HP</Label>
          <input
            type="number"
            value={hero.maxHp || 10}
            onChange={(e) => onUpdate({ maxHp: Number.parseInt(e.target.value, 10) || 0 })}
            className="bg-transparent text-emerald-400 font-bold text-sm w-full outline-none"
          />
        </div>
        <div className="bg-emerald-950/20 p-2 rounded border border-emerald-900/30 shadow-inner">
          <Label className="text-emerald-600 mb-1">Тек. HP</Label>
          <input
            type="number"
            value={hero.hp || 10}
            onChange={(e) => onUpdate({ hp: Number.parseInt(e.target.value, 10) || 0 })}
            className="bg-transparent text-emerald-400 font-bold text-sm w-full outline-none"
          />
        </div>
        <div className="bg-zinc-950/50 p-2 rounded border border-zinc-800 shadow-inner">
          <Label className="mb-1">Пасс. Внимание</Label>
          <input
            type="number"
            value={hero.passivePerception || 10}
            onChange={(e) => onUpdate({ passivePerception: Number.parseInt(e.target.value, 10) || 0 })}
            className="bg-transparent text-amber-400 font-bold text-sm w-full outline-none"
          />
        </div>
      </div>
    </div>
  )
}

