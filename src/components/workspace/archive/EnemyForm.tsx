import { Enemy } from '@/types/workspace'
import { AiWand } from '@/components/workspace/ai/AiWand'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'

export function EnemyForm({
  enemy,
  onUpdate
}: {
  enemy: Enemy
  onUpdate: (data: Partial<Enemy>) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-full">
          <Label>Имя</Label>
          <Input
            value={enemy.name || ''}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Слепой Ползун"
          />
        </div>
        <div>
          <Label>Здоровье</Label>
          <Input
            type="number"
            value={enemy.hp ?? ''}
            onChange={(e) => onUpdate({ hp: Number(e.target.value) })}
            placeholder="Текущее HP"
          />
        </div>
        <div>
          <Label>Макс. HP</Label>
          <Input
            type="number"
            value={enemy.maxHp ?? ''}
            onChange={(e) => onUpdate({ maxHp: Number(e.target.value) })}
            placeholder="Макс HP"
          />
        </div>
        <div>
          <Label>КД (AC)</Label>
          <Input
            type="number"
            value={enemy.ac ?? ''}
            onChange={(e) => onUpdate({ ac: Number(e.target.value) })}
            placeholder="10"
          />
        </div>
        <div>
          <Label>Опасность (CR)</Label>
          <Input
            value={enemy.cr || ''}
            onChange={(e) => onUpdate({ cr: e.target.value })}
            placeholder="1/2, 5..."
          />
        </div>
      </div>

      <div className="col-span-full">
        <label className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800 rounded-lg p-3 cursor-pointer hover:bg-zinc-900/60 transition-colors">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-200">
            Этот противник — торговец
          </span>
          <input
            type="checkbox"
            checked={!!enemy.isMerchant}
            onChange={(e) => onUpdate({ isMerchant: e.target.checked })}
            className="h-4 w-4 accent-indigo-500"
          />
        </label>
      </div>

      <div className="col-span-full">
        <div className="flex justify-between items-center mb-1">
          <Label>Описание</Label>
          <AiWand 
            currentValue={enemy.description || ''}
            contextData={enemy}
            onApply={(text) => onUpdate({ description: text })}
          />
        </div>
        <Textarea
          value={enemy.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Внешность, повадки..."
          className="min-h-[100px]"
        />
      </div>

      <div className="col-span-full">
        <Label>Атаки и урон</Label>
        <Textarea
          value={enemy.attacks || ''}
          onChange={(e) => onUpdate({ attacks: e.target.value })}
          placeholder="Когти (+5, 1d6+2 колющего)..."
          className="min-h-[80px]"
        />
      </div>

      <div className="col-span-full">
        <Label>Тактика в бою</Label>
        <Textarea
          value={(enemy as any).tactics || ''}
          onChange={(e) => onUpdate({ tactics: e.target.value } as any)}
          placeholder="Как ведет себя в бою?.."
          className="min-h-[80px]"
        />
      </div>
    </div>
  )
}
