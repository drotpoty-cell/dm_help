import { AiWand } from '@/components/workspace/ai/AiWand'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

export function LocationForm({ 
  location, 
  onUpdate, 
  onPlaceOnMap 
}: { 
  location: any
  onUpdate: (data: any) => void
  onPlaceOnMap: () => void 
}) {
  const checks = location.checks || []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Название</label>
        <Input
          value={location.name || ''}
          onChange={(e: any) => onUpdate({ name: e.target.value })}
          placeholder="Название локации..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Краткое описание</label>
        <Textarea
          value={location.description || ''}
          onChange={(e: any) => onUpdate({ description: e.target.value })}
          placeholder="Краткое описание..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Текущее состояние</label>
        <Input
          value={location.currentState || ''}
          onChange={(e: any) => onUpdate({ currentState: e.target.value })}
          placeholder="Осаждена, Разрушена, Процветает..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Персонажи в локации</label>
        <Textarea
          value={location.charactersInside || ''}
          onChange={(e: any) => onUpdate({ charactersInside: e.target.value })}
          placeholder="Кто здесь находится..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Секреты локации</label>
        <Textarea
          value={location.secrets || ''}
          onChange={(e: any) => onUpdate({ secrets: e.target.value })}
          placeholder="Секреты..."
        />
      </div>


      {/* --- БЛОК ОПИСАНИЯ --- */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            Описание локации (Детали)
          </label>
          <AiWand 
            mode="location"
            currentValue={location.description || ''}
            contextData={location}
            onApply={(text) => onUpdate({ description: text })}
          />
        </div>
      </div>


      {/* --- БЛОК ПРОВЕРОК И ЛОВУШЕК --- */}
      {checks.length > 0 && (
        <div className="space-y-4 pt-2">
          <label className="text-[10px] font-black text-indigo-500/50 uppercase tracking-[0.2em] block mb-2">
            Испытания на локации
          </label>
          
          {checks.map((check: any, index: number) => (
            <div key={check.id || index} className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3 relative group">
              
              {/* Шапка проверки (Навык и Сложность) */}
              <div className="flex justify-between items-center border-b border-zinc-800/50 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Навык</label>
                    <input
                      value={check.skill || ''}
                      onChange={(e) => {
                        const newChecks = [...checks];
                        newChecks[index] = { ...check, skill: e.target.value };
                        onUpdate({ checks: newChecks });
                      }}
                      placeholder="Внимательность..."
                      className="bg-zinc-950 border border-zinc-800 text-xs font-bold text-indigo-300 p-2 rounded outline-none w-36 focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-black uppercase text-zinc-500 tracking-widest text-center">СЛ (DC)</label>
                    <input
                      type="number"
                      value={check.dc || 10}
                      onChange={(e) => {
                        const newChecks = [...checks];
                        newChecks[index] = { ...check, dc: parseInt(e.target.value) || 10 };
                        onUpdate({ checks: newChecks });
                      }}
                      className="bg-zinc-950 border border-zinc-800 text-xs font-black text-amber-500 p-2 rounded outline-none w-16 text-center focus:border-amber-500"
                    />
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const newChecks = [...checks];
                    newChecks.splice(index, 1);
                    onUpdate({ checks: newChecks });
                  }} 
                  className="w-8 h-8 flex items-center justify-center rounded bg-red-950/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors border border-red-900/30"
                  title="Удалить проверку"
                >
                  ✕
                </button>
              </div>

              {/* Поля Успеха и Провала */}
              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Успех (Что нашел)</label>
                    <AiWand 
                      mode="general"
                      currentValue={check.passText || ''}
                      contextData={check}
                      onApply={(text) => {
                        const newChecks = [...checks];
                        newChecks[index] = { ...check, passText: text };
                        onUpdate({ checks: newChecks });
                      }}
                    />
                  </div>
                  <textarea
                    value={check.passText || ''}
                    onChange={(e) => {
                      const newChecks = [...checks];
                      newChecks[index] = { ...check, passText: e.target.value };
                      onUpdate({ checks: newChecks });
                    }}
                    className="w-full bg-emerald-950/10 border border-emerald-900/30 p-3 text-xs text-emerald-200 rounded-lg h-16 resize-none outline-none focus:border-emerald-500 leading-relaxed custom-scrollbar"
                    placeholder="Замечает скрытый рычаг..."
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] font-bold text-red-600 uppercase tracking-widest">Провал (Ловушка)</label>
                    <AiWand 
                      mode="general"
                      currentValue={check.failText || ''}
                      contextData={check}
                      onApply={(text) => {
                        const newChecks = [...checks];
                        newChecks[index] = { ...check, failText: text };
                        onUpdate({ checks: newChecks });
                      }}
                    />
                  </div>
                  <textarea
                    value={check.failText || ''}
                    onChange={(e) => {
                      const newChecks = [...checks];
                      newChecks[index] = { ...check, failText: e.target.value };
                      onUpdate({ checks: newChecks });
                    }}
                    className="w-full bg-red-950/10 border border-red-900/30 p-3 text-xs text-red-200 rounded-lg h-16 resize-none outline-none focus:border-red-500 leading-relaxed custom-scrollbar"
                    placeholder="Наступает на нажимную плиту..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- КНОПКИ ДЕЙСТВИЙ --- */}
      <div className="flex gap-3 pt-4 border-t border-zinc-800/50">
        <button
          onClick={() => {
            const newChecks = [...checks, { id: `chk-${Date.now()}`, skill: 'Внимательность', dc: 15, passText: '', failText: '' }];
            onUpdate({ checks: newChecks });
          }}
          className="flex-1 py-2.5 border border-dashed border-zinc-700 hover:border-indigo-500/50 text-[10px] text-zinc-500 hover:text-indigo-400 uppercase font-black tracking-widest transition-colors rounded-xl bg-zinc-950/50"
        >
          + Добавить проверку
        </button>
        <button 
          onClick={onPlaceOnMap} 
          className="flex-1 py-2.5 bg-zinc-800 hover:bg-indigo-600 hover:text-white text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors border border-zinc-700 hover:border-indigo-500 shadow-lg"
        >
          📍 На карту
        </button>
      </div>
    </div>
  )
}