'use client'

import { useState } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow } from 'reactflow'

export default function TravelEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, data }: any) {
  const { setEdges } = useReactFlow()
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })

  // Локальные состояния для инлайн-редактирования
  const [isEditing, setIsEditing] = useState(false)
  const [editDays, setEditDays] = useState(data?.days || 0)
  const [editHours, setEditHours] = useState(data?.hours || 0)

  // Удаление связи
  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if(window.confirm('Удалить эту дорогу?')) {
      setEdges((eds) => eds.filter((e) => e.id !== id))
    }
  }

  // Сохранение времени и выход из режима редактирования
  const onSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEdges((eds) => eds.map((edge) => 
      edge.id === id ? { ...edge, data: { ...edge.data, days: editDays, hours: editHours } } : edge
    ))
    setIsEditing(false)
  }

  // Отмена редактирования
  const onCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(false)
    setEditDays(data?.days || 0)
    setEditHours(data?.hours || 0)
  }

  const hasTime = data?.days > 0 || data?.hours > 0

  return (
    <>
      {/* Сама линия дороги */}
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
          className="nodrag nopan flex items-center justify-center z-50"
        >
          {isEditing ? (
            
            /* --- КРАСИВАЯ ФОРМА ВВОДА (Вместо prompt) --- */
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

            /* --- СТАНДАРТНОЕ ОТОБРАЖЕНИЕ КНОПКИ --- */
            <div className="group relative flex items-center justify-center cursor-pointer">
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

          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}