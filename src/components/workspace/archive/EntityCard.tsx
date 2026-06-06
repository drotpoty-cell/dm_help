'use client'

import { Hero, NPC, Quest, Loot, Event, BaseEntity } from '@/store/useWorkspaceStore'
import { ReactNode } from 'react'

interface EntityCardProps {
  entity: any
  type: string
  isActive: boolean
  onClick: () => void
}

// Вспомогательные иконки (строгий стиль)
const Icons: Record<string, ReactNode> = {
  heroes: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  npcs: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  quests: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
  loot: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  events: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  locations: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  characters: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  extras: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><circle cx="16" cy="7" r="4"/></svg>,
  bestiary: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 9a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1"/><path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M12 15v2"/><path d="M12 12v3"/></svg>,
  factions: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
}

export default function EntityCard({ entity, type, isActive, onClick }: EntityCardProps) {
  // Логика определения торговца
  const isMerchant = type === 'npcs' && entity.occupation?.toLowerCase().includes('торговец');
  
  // Бейджи статусов и редкости
  const renderBadge = () => {
    if (type === 'quests') {
      const q = entity as Quest;
      return (
        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
          q.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-zinc-800 border-zinc-700 text-zinc-500'
        }`}>
          {q.status === 'active' ? 'Активен' : 'Завершен'}
        </span>
      );
    }
    if (type === 'loot') {
      const l = entity as Loot;
      const colors: Record<string, string> = {
        common: 'text-zinc-400 border-zinc-700 bg-zinc-800',
        rare: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
        epic: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
        legendary: 'text-orange-400 border-orange-500/30 bg-orange-500/10'
      };
      return (
        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${colors[l.rarity] || colors.common}`}>
          {l.rarity}
        </span>
      );
    }
    if (type === 'bestiary') {
      return (
        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded border bg-red-500/10 text-red-500 border-red-500/30">
          CR: {entity.cr || '?'}
        </span>
      );
    }
    if (type === 'characters' && entity.role) {
      return (
        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded border bg-indigo-500/10 text-indigo-400 border-indigo-500/30">
          {entity.role}
        </span>
      );
    }
    if (type === 'factions' && entity.type) {
      return (
        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded border bg-purple-500/10 text-purple-400 border-purple-500/30">
          {entity.type}
        </span>
      );
    }
    return null;
  };

  return (
    <div 
      onClick={onClick}
      className={`relative p-4 rounded-xl border transition-all cursor-pointer group ${
        isActive 
          ? 'bg-zinc-900 border-indigo-500 shadow-lg shadow-indigo-500/10' 
          : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:scale-[1.01] hover:bg-zinc-900/60'
      }`}
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className={`${isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-400'}`}>
            {Icons[type as keyof typeof Icons] || Icons.locations}
          </span>
          <h3 className={`font-bold text-sm truncate ${isActive ? 'text-white' : 'text-zinc-300'}`}>
            {'title' in entity ? (entity as Quest).title : entity.name}
          </h3>
        </div>
        {renderBadge()}
      </div>

      <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2 mb-3">
        {type === 'characters' 
          ? (entity.description || 'Нет описания...') 
          : (entity.description || 'Нет описания...')}
      </p>

      {/* Ассортимент торговца (показываем личные вещи как товары) */}
      {isMerchant && (entity as NPC).personalLoot && (
        <div className="mt-2 pt-2 border-t border-zinc-800/50">
          <div className="text-[8px] font-black uppercase text-zinc-600 mb-1 tracking-widest">Ассортимент</div>
          <div className="text-[10px] text-orange-400/80 font-medium truncate">
            {(entity as NPC).personalLoot}
          </div>
        </div>
      )}

      {/* Индикация типа для NPC */}
      {type === 'npcs' && (entity as NPC).occupation && !isMerchant && (
        <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">
          {(entity as NPC).occupation}
        </div>
      )}
    </div>
  )
}