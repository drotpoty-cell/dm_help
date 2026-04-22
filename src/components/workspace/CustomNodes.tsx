'use client'

import { Handle, Position } from 'reactflow'

export const SafeNode = ({ data }: any) => (
  <div className="bg-zinc-800/90 border border-emerald-500/30 rounded-xl p-3 min-w-[160px] shadow-lg">
    <Handle type="target" position={Position.Top} className="!bg-emerald-500 border-none" />
    <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] uppercase font-bold tracking-wider mb-1">
      <div className="w-2 h-2 rounded-full bg-emerald-400"></div> Безопасно
    </div>
    <div className="text-zinc-100 text-sm font-medium leading-tight">{data.label}</div>
    <Handle type="source" position={Position.Bottom} className="!bg-emerald-500 border-none" />
  </div>
)

export const TenseNode = ({ data }: any) => (
  <div className="bg-zinc-800/90 border border-amber-500/30 rounded-xl p-3 min-w-[160px] shadow-lg">
    <Handle type="target" position={Position.Top} className="!bg-amber-500 border-none" />
    <div className="flex items-center gap-1.5 text-amber-400 text-[10px] uppercase font-bold tracking-wider mb-1">
      <div className="w-2 h-2 rounded-sm bg-amber-400"></div> Напряжение
    </div>
    <div className="text-zinc-100 text-sm font-medium leading-tight">{data.label}</div>
    <Handle type="source" position={Position.Bottom} className="!bg-amber-500 border-none" />
  </div>
)

export const HostileNode = ({ data }: any) => (
  <div className="bg-zinc-800/90 border border-red-500/40 rounded-xl p-3 min-w-[160px] shadow-lg">
    <Handle type="target" position={Position.Top} className="!bg-red-500 border-none" />
    <div className="flex items-center gap-1.5 text-red-400 text-[10px] uppercase font-bold tracking-wider mb-1">
      <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[8px] border-l-transparent border-r-transparent border-b-red-400"></div> Враждебно
    </div>
    <div className="text-zinc-100 text-sm font-medium leading-tight">{data.label}</div>
    <Handle type="source" position={Position.Bottom} className="!bg-red-500 border-none" />
  </div>
)

export const MysteryNode = ({ data }: any) => (
  <div className="bg-zinc-800/50 border border-dashed border-zinc-500/50 rounded-xl p-3 min-w-[160px]">
    <Handle type="target" position={Position.Top} className="!bg-zinc-500 border-none" />
    <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-1">
      <div className="w-2 h-2 border border-zinc-400 rounded-full"></div> Слух
    </div>
    <div className="text-zinc-300 text-sm italic leading-tight">{data.label}</div>
    <Handle type="source" position={Position.Bottom} className="!bg-zinc-500 border-none" />
  </div>
)

export const RegionNode = ({ data }: any) => (
  <div className="bg-zinc-800/20 border-2 border-dashed border-zinc-700/50 rounded-2xl p-4 w-full h-full">
    <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest pointer-events-none select-none">
      {data.label || 'Регион'}
    </div>
  </div>
)

// Экспортируем объект для React Flow
export const nodeTypes = { 
  safe: SafeNode, 
  tense: TenseNode, 
  hostile: HostileNode, 
  mystery: MysteryNode, 
  region: RegionNode 
}