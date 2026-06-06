import type { Node } from 'reactflow'
import { AiWand } from '../ai/AiWand'
import { Input } from '../../ui/Input'
import { Textarea } from '../../ui/Textarea'
import { Label } from '../../ui/Label'

export const ExtraForm = ({
  extra,
  nodes,
  onUpdate
}: {
  extra: any
  nodes: Node[]
  onUpdate: (data: any) => void
}) => {
  return (
    <div className="flex flex-col gap-3">
      <Input
        value={extra.occupation || ''}
        onChange={(e) => onUpdate({ ...extra, occupation: e.target.value })}
        placeholder="Профессия / Статус"
      />
      <Input
        value={extra.quirk || ''}
        onChange={(e) => onUpdate({ ...extra, quirk: e.target.value })}
        placeholder="Особая примета / Отыгрыш"
      />
      <Input
        value={extra.state || ''}
        onChange={(e) => onUpdate({ ...extra, state: e.target.value })}
        placeholder="Текущее настроение"
      />
      <div>
        <div className="flex justify-between items-center mb-1">
          <Label className="mb-0">Слух / Зацепка</Label>
          <AiWand 
            currentValue={extra.knowledge || ''}
            contextData={extra}
            onApply={(text) => onUpdate({ ...extra, knowledge: text })}
          />
        </div>
        <Textarea
          value={extra.knowledge || ''}
          onChange={(e) => onUpdate({ ...extra, knowledge: e.target.value })}
          rows={2}
        />
      </div>

      <select
        value={extra.locationId || 'none'}
        onChange={(e) => onUpdate({ ...extra, locationId: e.target.value === 'none' ? null : e.target.value })}
        className="bg-zinc-900 border border-zinc-800 text-[10px] p-2 rounded outline-none text-zinc-300 w-full"
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

      {/* Логика расписания из NpcForm */}
      <div className="bg-zinc-950/80 border border-zinc-800 p-3 rounded-lg flex flex-col gap-3 shadow-inner">
          <div className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest">Распорядок дня</div>
          {(extra.schedule || []).map((entry: any, index: number) => (
            <div key={index} className="grid grid-cols-2 gap-2 pb-3 border-b border-zinc-900 last:border-0 last:pb-0">
              <div className="flex gap-1">
                <Input
                  type="number"
                  placeholder="С"
                  value={entry.startHour ?? ''}
                  onChange={(e) => {
                    const newSched = [...(extra.schedule || [])]
                    newSched[index] = { ...newSched[index], startHour: Number.parseInt(e.target.value, 10) || 0 }
                    onUpdate({ ...extra, schedule: newSched })
                  }}
                />
                <Input
                  type="number"
                  placeholder="По"
                  value={entry.endHour ?? ''}
                  onChange={(e) => {
                    const newSched = [...(extra.schedule || [])]
                    newSched[index] = { ...newSched[index], endHour: Number.parseInt(e.target.value, 10) || 0 }
                    onUpdate({ ...extra, schedule: newSched })
                  }}
                />
              </div>
              <select
                value={entry.locationId || 'none'}
                onChange={(e) => {
                  const newSched = [...(extra.schedule || [])]
                  newSched[index] = { ...newSched[index], locationId: e.target.value === 'none' ? null : e.target.value }
                  onUpdate({ ...extra, schedule: newSched })
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
                    const newSched = [...(extra.schedule || [])]
                    newSched[index] = { ...newSched[index], activity: e.target.value }
                    onUpdate({ ...extra, schedule: newSched })
                  }}
                />
                <button
                  onClick={() => {
                    const newSched = [...(extra.schedule || [])]
                    newSched.splice(index, 1)
                    onUpdate({ ...extra, schedule: newSched })
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
              const newSched = [...(extra.schedule || []), { startHour: 8, endHour: 18, locationId: null, activity: '' }]
              onUpdate({ ...extra, schedule: newSched })
            }}
            className="w-full py-2 border border-dashed border-zinc-800 text-[8px] text-zinc-500 hover:text-indigo-400 hover:border-indigo-900/50 uppercase font-bold transition-colors rounded"
          >
            + Добавить время
          </button>
        </div>
    </div>
  )
}
