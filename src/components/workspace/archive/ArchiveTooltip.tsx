import type { ReactNode } from 'react'

export function ArchiveTooltip({ text, children }: { text: string; children: ReactNode }) {
  return (
    <div className="relative group/tooltip flex items-center justify-center w-full">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 bg-indigo-950/95 text-indigo-200 text-[9px] font-medium leading-relaxed text-center rounded-lg border border-indigo-500/40 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-300 pointer-events-none z-50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-indigo-500/40"></div>
      </div>
    </div>
  )
}

