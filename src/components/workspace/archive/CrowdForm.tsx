import type { Node } from 'reactflow'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'

export interface Crowd {
  id: string
  name: string
  description: string
  occupation?: string
  quirk?: string
  state?: string
  knowledge?: string
}

export function CrowdForm({
  crowd,
  onUpdate
}: {
  crowd: Crowd
  nodes: Node[]
  onUpdate: (data: Partial<Crowd>) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Имя</Label>
          <Input
            value={crowd.name || ''}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Имя или прозвище"
          />
        </div>
        <div>
          <Label>Роль/Статус</Label>
          <Input
            value={crowd.occupation || ''}
            onChange={(e) => onUpdate({ occupation: e.target.value })}
            placeholder="Нищий, стражник..."
          />
        </div>
      </div>

      <div>
        <Label>Примета</Label>
        <Input
          value={crowd.quirk || ''}
          onChange={(e) => onUpdate({ quirk: e.target.value })}
          placeholder="Шрам, заикается..."
        />
      </div>

      <div>
        <Label>Настроение</Label>
        <Input
          value={crowd.state || ''}
          onChange={(e) => onUpdate({ state: e.target.value })}
          placeholder="Пьян, напуган, зол..."
        />
      </div>

      <div>
        <Label>Описание</Label>
        <Textarea
          value={crowd.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Внешность..."
        />
      </div>

      <div>
        <Label>Слухи/Зацепки</Label>
        <Textarea
          value={crowd.knowledge || ''}
          onChange={(e) => onUpdate({ knowledge: e.target.value })}
          placeholder="Какой слух может рассказать?"
        />
      </div>
    </div>
  )
}
