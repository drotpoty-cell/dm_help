'use client'

import { useState, useRef, useEffect } from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export default function Scratchpad() {
  const scratchpad = useWorkspaceStore(state => state.scratchpad)
  const setScratchpad = useWorkspaceStore(state => state.setScratchpad)

  const storageKey = 'gm-assistant:scratchpad-position'

  // Состояние позиции окна (чтобы избежать ошибок гидратации, инициализируем нулями, а затем ставим реальные координаты)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isMounted, setIsMounted] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  
  // Реф для хранения стартовых координат во время перетаскивания
  const dragRef = useRef<{ startX: number, startY: number, initialX: number, initialY: number } | null>(null)

  useEffect(() => {
    // Ставим блок заметок в правый нижний угол по умолчанию,
    // но если юзер уже перетаскивал окно — восстанавливаем позицию из localStorage.
    const fallback = { x: window.innerWidth - 340, y: window.innerHeight - 360 }
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) {
        setPosition(fallback)
      } else {
        const parsed = JSON.parse(raw) as { x?: unknown; y?: unknown }
        const x = typeof parsed.x === 'number' ? parsed.x : fallback.x
        const y = typeof parsed.y === 'number' ? parsed.y : fallback.y
        setPosition({ x, y })
      }
    } catch {
      setPosition(fallback)
    }
    setIsMounted(true)
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    }
    // Захватываем указатель, чтобы окно не "отваливалось" при быстром движении мыши
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setPosition({
      x: dragRef.current.initialX + dx,
      y: dragRef.current.initialY + dy
    })
  }

  const onPointerUp = (e: React.PointerEvent) => {
    setIsDragging(false)
    dragRef.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(position))
    } catch {
      // ignore storage errors (private mode / quota)
    }
  }

  if (!isMounted) return null

  return (
    <div
      className={`fixed top-0 left-0 w-80 bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 rounded-xl flex flex-col overflow-hidden transition-shadow ${isDragging ? 'shadow-[0_20px_50px_rgba(0,0,0,0.9)] opacity-95' : 'shadow-2xl'}`}
      style={{ transform: `translate(${position.x}px, ${position.y}px)`, zIndex: isDragging ? 60 : 40 }}
    >
      {/* ШАПКА-ДРАГГЕР (За нее тащим) */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="p-3 bg-zinc-900/50 border-b border-zinc-800 flex justify-between items-center cursor-grab active:cursor-grabbing touch-none select-none"
      >
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 pointer-events-none flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a9 9 0 1 0 9 9"/><path d="M21 3v9h-9"/><path d="M10 14 21 3"/></svg>
          Заметки
        </span>
        <div className="flex gap-1 pointer-events-none">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
        </div>
      </div>

      {/* ТЕКСТОВОЕ ПОЛЕ */}
      <textarea
        value={scratchpad}
        onChange={(e) => setScratchpad(e.target.value)}
        placeholder="Быстрые идеи во время игры, хп монстров, имена..."
        className="w-full h-64 bg-transparent p-4 text-xs text-zinc-300 resize-none outline-none focus:bg-zinc-900/30 transition-colors custom-scrollbar font-mono leading-relaxed"
      />
    </div>
  )
}