'use client'

import { useState } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from 'reactflow'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { generateAiText } from '@/utils/aiClient'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function TravelEdge({ id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, data }: any) {
  const edges = useWorkspaceStore(state => state.edges)
  const setEdges = useWorkspaceStore(state => state.setEdges)
  const updateEdgeData = useWorkspaceStore(state => state.updateEdgeData)
  const nodes = useWorkspaceStore(state => state.nodes)
  
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })

  // Локальные состояния
  const [isEditing, setIsEditing] = useState(false)
  const [editDays, setEditDays] = useState(data?.days || 0)
  const [editHours, setEditHours] = useState(data?.hours || 0)
  
  // Состояния для ИИ-генератора событий
  const [isGenerating, setIsGenerating] = useState(false)
  const [encounterData, setEncounterData] = useState<{ roll: number, text: string } | null>(null)

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if(window.confirm('Удалить эту дорогу?')) {
      setEdges(edges.filter((edge) => edge.id !== id))
    }
  }

  const onSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateEdgeData(id, { days: editDays, hours: editHours })
    setIsEditing(false)
  }

  const onCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(false)
    setEditDays(data?.days || 0)
    setEditHours(data?.hours || 0)
  }

  // --- ЛОГИКА СЛУЧАЙНЫХ СОБЫТИЙ ---
  const handleRollEncounter = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Бросаем кубик (1-20)
    const roll = Math.floor(Math.random() * 20) + 1

    if (roll >= 15) {
      toast.success(`🎲 Бросок ${roll}: Путь безопасен. Вы спокойно добираетесь до цели, не встретив преград.`)
      return
    }

    // Если событие случилось, собираем контекст
    const sourceNode = nodes.find(n => n.id === source)
    const targetNode = nodes.find(n => n.id === target)
    
    const sourceName = sourceNode?.data?.label || 'Неизвестное место'
    const targetName = targetNode?.data?.label || 'Неизвестное место'
    const sourceDesc = sourceNode?.data?.description || ''
    const targetDesc = targetNode?.data?.description || ''

    const severity = roll === 1 ? 'КРИТИЧЕСКАЯ ОПАСНОСТЬ (засада, сильный монстр, катастрофа, смертельная ловушка)'
                   : roll <= 5 ? 'Высокая опасность (агрессивные существа, бандиты, опасное явление)'
                   : roll <= 10 ? 'Среднее событие (поломка телеги, странный путник, тяжелая погода)'
                   : 'Легкое происшествие (интересная находка, пугающий звук, атмосферное событие)'

    setIsGenerating(true)
    setEncounterData(null)

    try {
      const prompt = `Игроки путешествуют из локации "${sourceName}" (${sourceDesc}) в локацию "${targetName}" (${targetDesc}).
На кубике случайных дорожных событий выпало ${roll} из 20.
Тяжесть события: ${severity}.

Сгенерируй короткое, кинематографичное дорожное происшествие на 1-2 абзаца, которое логично вписывается в этот маршрут и атмосферу мест. 
Верни ТОЛЬКО художественный текст события без предисловий, вариантов и пояснений.`

      const response = await generateAiText(prompt)
      setEncounterData({ roll, text: response })
    } catch (error) {
      console.error(error)
      toast.error('Не удалось сгенерировать событие')
    } finally {
      setIsGenerating(false)
    }
  }

  const closeEncounter = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEncounterData(null)
  }

  const hasTime = data?.days > 0 || data?.hours > 0

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{ ...style, strokeWidth: 2, stroke: hasTime ? '#6366f1' : '#52525b', opacity: hasTime ? 0.8 : 0.5 }} 
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan flex flex-col items-center justify-center z-50"
        >
          {isEditing ? (
            /* ФОРМА ВВОДА ВРЕМЕНИ */
            <div 
              className="bg-zinc-950/90 backdrop-blur-md border border-indigo-500/50 shadow-2xl rounded-lg p-2.5 flex gap-3 items-center" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Дни</label>
                <input 
                  type="number" min="0" value={editDays} 
                  onChange={(e) => setEditDays(parseInt(e.target.value) || 0)}
                  className="w-14 bg-zinc-900 border border-zinc-700 text-xs text-white px-2 py-1 rounded outline-none focus:border-indigo-500 font-mono text-center"
                />
              </div>
              <div className="text-zinc-600 font-bold mt-3">:</div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Часы</label>
                <input 
                  type="number" min="0" max="23" value={editHours} 
                  onChange={(e) => setEditHours(parseInt(e.target.value) || 0)}
                  className="w-14 bg-zinc-900 border border-zinc-700 text-xs text-white px-2 py-1 rounded outline-none focus:border-indigo-500 font-mono text-center"
                />
              </div>
              <div className="flex flex-col gap-1 ml-1 mt-3">
                <button onClick={onSave} className="w-5 h-5 flex items-center justify-center rounded bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/40 font-bold text-xs transition-colors">✓</button>
                <button onClick={onCancel} className="w-5 h-5 flex items-center justify-center rounded bg-red-500/20 text-red-500 hover:bg-red-500/40 font-bold text-xs transition-colors">✕</button>
              </div>
            </div>

          ) : (
            /* СТАНДАРТНОЕ ОТОБРАЖЕНИЕ */
            <div className="flex items-center gap-2 group relative">
              
              {/* Кнопка генерации события */}
              <button 
                onClick={handleRollEncounter} 
                disabled={isGenerating}
                className="opacity-0 group-hover:opacity-100 transition-all bg-zinc-900 hover:bg-indigo-600 border border-zinc-700 hover:border-indigo-500 text-zinc-400 hover:text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                title="Бросить на дорожное событие"
              >
                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : '🎲'}
              </button>

              {/* Плашка времени */}
              <div className="relative flex items-center justify-center cursor-pointer">
                <div 
                  onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} 
                  className={`flex items-center justify-center transition-all bg-zinc-900 border hover:border-indigo-500 hover:bg-zinc-800 ${hasTime ? 'px-2.5 py-1 rounded-md border-indigo-500/30 shadow-lg shadow-indigo-900/20' : 'w-4 h-4 rounded-full border-zinc-700'}`}
                >
                  {hasTime ? (
                    <span className="text-[10px] font-bold text-indigo-300 font-mono whitespace-nowrap">
                      {data.days > 0 && `${data.days}д `}{data.hours > 0 && `${data.hours}ч`}
                    </span>
                  ) : (
                    <span className="text-zinc-500 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">⏱</span>
                  )}
                </div>
                
                {/* Кнопка удаления */}
                <button 
                  onClick={onDelete} 
                  className={`absolute text-zinc-500 hover:text-red-500 text-[10px] font-black transition-opacity ${hasTime ? '-top-2.5 -right-2.5 opacity-0 group-hover:opacity-100 bg-zinc-900 rounded-full w-4 h-4 flex items-center justify-center border border-zinc-700 shadow-md' : '-top-3 -right-3 opacity-0 group-hover:opacity-100 bg-zinc-900 rounded-full w-4 h-4 flex items-center justify-center border border-zinc-700 shadow-md'}`}
                  title="Удалить дорогу"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* ПОПАП С ИТОГОМ СОБЫТИЯ */}
          {encounterData && (
            <div 
              className="absolute top-10 left-1/2 -translate-x-1/2 w-80 bg-zinc-950/95 backdrop-blur-xl border border-indigo-500/50 rounded-xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col gap-3" 
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-indigo-900/50 pb-3">
                 <div className="flex items-center gap-2">
                   <span className="text-lg">🎲</span>
                   <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                     Результат: {encounterData.roll}
                   </span>
                 </div>
                 <button onClick={closeEncounter} className="text-zinc-500 hover:text-white transition-colors">✕</button>
              </div>
              <div className="text-xs text-zinc-300 leading-relaxed max-h-48 overflow-y-auto custom-scrollbar italic font-medium">
                 {encounterData.text}
              </div>
              <button 
                onClick={closeEncounter} 
                className="mt-2 w-full bg-indigo-600/10 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/20 py-2 rounded-lg text-[10px] uppercase font-black tracking-widest transition-colors"
              >
                Принять судьбу
              </button>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}