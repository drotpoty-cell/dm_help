import { AiWand } from '@/components/workspace/ai/AiWand'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'

export function FactionForm({ faction, nodes, characters, onUpdate }: { faction: any; nodes: any[]; characters: any[]; onUpdate: (data: any) => void }) {
  const factionTypes = ['Гильдия', 'Культ', 'Орден', 'Банда', 'Синдикат', 'Государство']
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Имя фракции</Label>
        <Input
          value={faction.name || ''}
          onChange={(e) => onUpdate({ ...faction, name: e.target.value })}
          placeholder="Имя..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Краткое описание</Label>
        <Textarea
          value={faction.description || ''}
          onChange={(e) => onUpdate({ ...faction, description: e.target.value })}
          placeholder="Краткое описание..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Текущая роль в сюжете</Label>
        <Input
          value={faction.currentRole || ''}
          onChange={(e) => onUpdate({ ...faction, currentRole: e.target.value })}
          placeholder="Роль..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Статус фракции</Label>
        <select
          value={faction.status || 'active'}
          onChange={(e) => onUpdate({ ...faction, status: e.target.value })}
          className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
        >
          <option value="active">Активна</option>
          <option value="destroyed">Уничтожена</option>
          <option value="declining">В упадке</option>
          <option value="emerging">Зарождается</option>
        </select>
      </div>

      <div className="flex gap-2">
        <select
          value={faction.type || ''}
          onChange={(e) => onUpdate({ ...faction, type: e.target.value })}
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
        >
          <option value="">Выберите тип...</option>
          {factionTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <Input
          value={faction.reputation || ''}
          onChange={(e) => onUpdate({ ...faction, reputation: e.target.value })}
          placeholder="Отношение народа"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Символика</Label>
        <Input
          value={faction.symbol || ''}
          onChange={(e) => onUpdate({ ...faction, symbol: e.target.value })}
          placeholder="Герб / Знак"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <Label>Глобальная цель</Label>
          <AiWand 
            currentValue={faction.goal || ''}
            contextData={faction}
            onApply={(text) => onUpdate({ ...faction, goal: text })}
            title="Цели фракции"
          />
        </div>
        <Textarea
          value={faction.goal || ''}
          onChange={(e) => onUpdate({ ...faction, goal: e.target.value })}
          placeholder="К чему они стремятся?"
          className="h-20"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label>Лидер</Label>
          <select
            value={faction.leaderId || ''}
            onChange={(e) => onUpdate({ ...faction, leaderId: e.target.value })}
            className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
          >
            <option value="">Выберите лидера...</option>
            {characters.map(c => <option key={c.id} value={c.id}>{c.name || 'Без имени'}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <Label>Штаб</Label>
          <select
            value={faction.headquartersId || ''}
            onChange={(e) => onUpdate({ ...faction, headquartersId: e.target.value })}
            className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
          >
            <option value="">Выберите штаб...</option>
            {nodes.map(n => <option key={n.id} value={n.id}>{n.data?.label || 'Без имени'}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}
