'use client'

import { Handle, Position } from 'reactflow'
import { NodeResizer } from '@reactflow/node-resizer'
import '@reactflow/node-resizer/dist/style.css'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

// Универсальный компонент для значка уведомления
const NotificationBadge = ({ needsUpdate }: { needsUpdate?: boolean }) => {
  if (!needsUpdate) return null;
  return (
    <div className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black animate-bounce shadow-[0_0_15px_rgba(239,68,68,0.6)] z-50 pointer-events-none">
      !
    </div>
  )
}

// --- ЭЛЕГАНТНЫЙ МАРКЕР-ШЛЕМ ОТРЯДА ---
const PartyMarker = () => (
  <div className="absolute -top-4 -left-4 z-50 pointer-events-none group transform -rotate-12 transition-transform duration-300">
    <div className="relative">
      <div className="absolute inset-0 rounded-full bg-indigo-500/40 blur-md animate-pulse"></div>
      <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-zinc-300 drop-shadow-[0_5px_10px_rgba(0,0,0,0.6)] relative z-10">
        <path d="M50 10 L80 30 V60 L50 90 L20 60 V30 Z" fill="#09090b" stroke="currentColor" strokeWidth="6" strokeLinejoin="round"/>
        <rect x="35" y="42" width="30" height="8" rx="2" fill="currentColor"/>
        <path d="M50 5 V20" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
        <path d="M38 8 L50 5 L62 8" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
      </svg>
    </div>
    <div className="absolute top-10 left-0 px-1.5 py-0.5 bg-indigo-600 text-white text-[7px] font-black uppercase tracking-tighter rounded border border-indigo-400 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
      Отряд
    </div>
  </div>
);

// --- НОВОЕ: Универсальные точки подключения (4 стороны, Any-to-Any) ---
const UniversalHandles = () => (
  <>
    {/* ВЕРХ */}
    <Handle type="target" position={Position.Top} id="t-top" className="!bg-zinc-600 !w-2 !h-2 border-none z-10" />
    <Handle type="source" position={Position.Top} id="s-top" className="!bg-transparent !w-2 !h-2 border-none z-20" />
    {/* НИЗ */}
    <Handle type="target" position={Position.Bottom} id="t-bot" className="!bg-zinc-600 !w-2 !h-2 border-none z-10" />
    <Handle type="source" position={Position.Bottom} id="s-bot" className="!bg-transparent !w-2 !h-2 border-none z-20" />
    {/* ЛЕВО */}
    <Handle type="target" position={Position.Left} id="t-left" className="!bg-zinc-600 !w-2 !h-2 border-none z-10" />
    <Handle type="source" position={Position.Left} id="s-left" className="!bg-transparent !w-2 !h-2 border-none z-20" />
    {/* ПРАВО */}
    <Handle type="target" position={Position.Right} id="t-right" className="!bg-zinc-600 !w-2 !h-2 border-none z-10" />
    <Handle type="source" position={Position.Right} id="s-right" className="!bg-transparent !w-2 !h-2 border-none z-20" />
  </>
);

// --- НОВОЕ: Система отображения NPC внизу локации ---
const getInitials = (name: string) => {
  if (!name) return '?';
  const words = name.trim().split(' ');
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

const getColorForNpc = (id: string, isMajor?: boolean) => {
  if (isMajor) return 'bg-indigo-500 text-white border-indigo-300';
  const colors = [
    'bg-emerald-600 text-white border-emerald-400', 'bg-amber-600 text-white border-amber-400',
    'bg-rose-600 text-white border-rose-400', 'bg-cyan-600 text-white border-cyan-400',
    'bg-purple-600 text-white border-purple-400', 'bg-blue-600 text-white border-blue-400'
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const EntityList = ({ nodeId }: { nodeId: string }) => {
  const characters = useWorkspaceStore(state => state.characters);
  const npcs = useWorkspaceStore(state => state.npcs);
  const extras = useWorkspaceStore(state => state.extras);

  const entitiesHere = [
    ...Object.values(characters || {}).filter(c => (c.locationId || c.defaultLocationId) === nodeId),
    ...Object.values(npcs || {}).filter(n => (n.locationId || n.defaultLocationId) === nodeId),
    ...Object.values(extras || {}).filter(e => (e.locationId || e.defaultLocationId) === nodeId)
  ];

  if (entitiesHere.length === 0) return null;

  return (
    <div className="border-t border-zinc-800 mt-2 pt-2 flex gap-1 flex-wrap nodrag">
      {entitiesHere.map(e => (
        <div 
          key={e.id}
          className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 truncate max-w-[80px]"
          title={e.name}
        >
          {e.name}
        </div>
      ))}
    </div>
  )
}

const useIsPartyHere = (nodeId: string) => {
  const partyLocationId = useWorkspaceStore(state => state.partyLocationId);
  return partyLocationId === nodeId;
}

const getNodeContainerClass = (isParty: boolean, baseBorder: string) => {
  return `relative bg-zinc-900/95 border rounded-2xl p-4 min-w-[180px] shadow-2xl transition-all duration-300 ${
    isParty 
      ? 'border-indigo-500 ring-4 ring-indigo-500/10 shadow-indigo-500/20 z-40' 
      : `${baseBorder} hover:border-zinc-600`
  }`;
}

export const SafeNode = ({ id, data }: any) => {
  const isPartyHere = useIsPartyHere(id);
  return (
    <div className={getNodeContainerClass(isPartyHere, 'border-emerald-500/30')}>
      {isPartyHere && <PartyMarker />}
      <NotificationBadge needsUpdate={data.needsUpdate} />
      <UniversalHandles />
      <div className="flex items-center gap-2 text-emerald-400 text-[9px] font-black uppercase tracking-widest mb-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Безопасно
      </div>
      <div className="text-zinc-100 text-sm font-bold leading-snug pr-2 pb-1">{data.label || 'Новая локация'}</div>
      <EntityList nodeId={id} />
    </div>
  )
}

export const TenseNode = ({ id, data }: any) => {
  const isPartyHere = useIsPartyHere(id);
  return (
    <div className={getNodeContainerClass(isPartyHere, 'border-amber-500/30')}>
      {isPartyHere && <PartyMarker />}
      <NotificationBadge needsUpdate={data.needsUpdate} />
      <UniversalHandles />
      <div className="flex items-center gap-2 text-amber-400 text-[9px] font-black uppercase tracking-widest mb-2">
        <div className="w-1.5 h-1.5 rounded-sm bg-amber-400"></div> Напряжение
      </div>
      <div className="text-zinc-100 text-sm font-bold leading-snug pr-2 pb-1">{data.label || 'Новая локация'}</div>
      <EntityList nodeId={id} />
    </div>
  )
}

export const HostileNode = ({ id, data }: any) => {
  const isPartyHere = useIsPartyHere(id);
  return (
    <div className={getNodeContainerClass(isPartyHere, 'border-red-500/40')}>
      {isPartyHere && <PartyMarker />}
      <NotificationBadge needsUpdate={data.needsUpdate} />
      <UniversalHandles />
      <div className="flex items-center gap-2 text-red-400 text-[9px] font-black uppercase tracking-widest mb-2">
        <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[8px] border-l-transparent border-r-transparent border-b-red-400"></div> Враждебно
      </div>
      <div className="text-zinc-100 text-sm font-bold leading-snug pr-2 pb-1">{data.label || 'Новая локация'}</div>
      <EntityList nodeId={id} />
    </div>
  )
}

export const MysteryNode = ({ id, data }: any) => {
  const isPartyHere = useIsPartyHere(id);
  return (
    <div className={getNodeContainerClass(isPartyHere, 'border-zinc-500/30')}>
      {isPartyHere && <PartyMarker />}
      <NotificationBadge needsUpdate={data.needsUpdate} />
      <UniversalHandles />
      <div className="flex items-center gap-2 text-zinc-400 text-[9px] font-black uppercase tracking-widest mb-2">
        <div className="w-1.5 h-1.5 border border-zinc-400 rounded-full"></div> Слух
      </div>
      <div className="text-zinc-300 text-sm italic font-medium leading-snug pr-2 pb-1">{data.label}</div>
      <EntityList nodeId={id} />
    </div>
  )
}

export const RegionNode = ({ data, selected }: any) => (
  <>
    <NodeResizer color="#6366f1" isVisible={selected} minWidth={200} minHeight={200} />
    <div className="bg-indigo-500/5 border-2 border-dashed border-indigo-500/20 rounded-[2.5rem] p-8 w-full h-full shadow-lg shadow-indigo-900/10 group hover:border-indigo-500/40 transition-colors relative">
      <div className="text-indigo-500/30 text-[10px] font-black uppercase tracking-[0.6em] mb-4 pointer-events-none select-none group-hover:text-indigo-500/50 transition-colors">
        {data.label || 'Неизвестный регион'}
      </div>
    </div>
  </>
)

export const AreaNode = ({ data, selected }: any) => (
  <>
    <NodeResizer color="#a855f7" isVisible={selected} minWidth={400} minHeight={300} />
    <div className="bg-purple-500/5 border-[3px] border-solid border-purple-500/15 rounded-[3.5rem] p-10 w-full h-full shadow-2xl shadow-purple-900/10 group hover:border-purple-500/30 transition-colors relative">
      <div className="text-purple-500/20 text-2xl font-black uppercase tracking-[0.8em] mb-4 pointer-events-none select-none group-hover:text-purple-500/40 transition-colors text-center">
        {data.label || 'Неизвестная область'}
      </div>
    </div>
  </>
)

export const nodeTypes = { safe: SafeNode, tense: TenseNode, hostile: HostileNode, mystery: MysteryNode, region: RegionNode, area: AreaNode }