'use client';

import React from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

const BattleMapBoard = () => {
  const { 
    localMaps, 
    activeLocalMapId,
    updateLocalToken, 
    addLocalToken, 
    removeLocalToken, 
    closeLocalMap, 
    heroes, 
    npcs 
  } = useWorkspaceStore();

  const activeMap = activeLocalMapId ? localMaps[activeLocalMapId] : null;

  if (!activeMap || !activeLocalMapId) return null;

  const handleDrop = (e: React.DragEvent, tokenId: string) => {
    e.preventDefault();
    const x = Math.floor(e.nativeEvent.offsetX / activeMap.gridSize);
    const y = Math.floor(e.nativeEvent.offsetY / activeMap.gridSize);
    updateLocalToken(activeLocalMapId, tokenId, { x, y });
  };

  const spawnToken = (entity: any, type: 'hero' | 'npc') => {
    addLocalToken(activeLocalMapId, {
      id: `token-${Date.now()}`,
      entityId: entity.id,
      type,
      x: 2,
      y: 2,
      size: 1
    });
  };

  const getEntityName = (token: any) => {
    if (token.type === 'hero') return heroes[token.entityId]?.name || 'Hero';
    if (token.type === 'npc' || token.type === 'monster') return npcs[token.entityId]?.name || 'NPC';
    return '?';
  };

  return (
    <div className="w-full h-full flex bg-neutral-950 relative overflow-hidden">
      <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col p-4 overflow-y-auto">
        <h2 className="text-white font-bold mb-4">Персонажи</h2>
        <div className="space-y-4">
          {Object.values(heroes).map((h: any) => (
            <div key={h.id} className="flex justify-between items-center text-neutral-300 text-sm">
              <span>{h.name}</span>
              <button onClick={() => spawnToken(h, 'hero')} className="bg-indigo-600 text-white px-2 py-1 rounded text-xs hover:bg-indigo-700">+</button>
            </div>
          ))}
          {Object.values(npcs).map((n: any) => (
            <div key={n.id} className="flex justify-between items-center text-neutral-300 text-sm">
              <span>{n.name}</span>
              <button onClick={() => spawnToken(n, 'npc')} className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700">+</button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 h-full relative">
        <div className="absolute top-4 left-4 z-10 flex gap-2 bg-neutral-900 p-2 rounded shadow">
          <button
            onClick={() => closeLocalMap()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Выйти из боя
          </button>
        </div>

        <div
          className="w-full h-full relative"
          style={{
            backgroundImage: `linear-gradient(to right, #262626 1px, transparent 1px), linear-gradient(to bottom, #262626 1px, transparent 1px)`,
            backgroundSize: `${activeMap.gridSize}px ${activeMap.gridSize}px`
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          {Object.values(activeMap.tokens).map((token: any) => {
            const name = getEntityName(token);
            const isHero = token.type === 'hero';
            return (
              <div
                key={token.id}
                draggable
                title="Двойной клик для удаления"
                onDragStart={(e) => e.dataTransfer.setData('tokenId', token.id)}
                onDrop={(e) => handleDrop(e, token.id)}
                onDoubleClick={() => removeLocalToken(activeLocalMapId, token.id)}
                className={`absolute rounded-full border-2 cursor-move flex items-center justify-center font-bold text-xs shadow-md select-none ${
                  isHero ? 'bg-indigo-900/80 border-indigo-500 text-white' : 'bg-red-900/80 border-red-500 text-white'
                }`}
                style={{
                  left: token.x * activeMap.gridSize,
                  top: token.y * activeMap.gridSize,
                  width: (token.size || 1) * activeMap.gridSize,
                  height: (token.size || 1) * activeMap.gridSize
                }}
              >
                {name.substring(0, 2).toUpperCase()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BattleMapBoard;
