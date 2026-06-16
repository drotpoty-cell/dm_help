'use client';

import React from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

const BattleMapBoard = () => {
  const { battleMap, updateBattleToken, addBattleToken, removeBattleToken, toggleBattleMode, heroes, npcs } = useWorkspaceStore();

  const handleDrop = (e: React.DragEvent, tokenId: string) => {
    e.preventDefault();
    const x = Math.floor(e.nativeEvent.offsetX / battleMap.gridSize);
    const y = Math.floor(e.nativeEvent.offsetY / battleMap.gridSize);
    updateBattleToken(tokenId, { x, y });
  };

  const spawnToken = (entity: any, type: 'hero' | 'npc') => {
    addBattleToken({
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
            onClick={() => toggleBattleMode()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Выйти из боя
          </button>
        </div>

        <div
          className="w-full h-full relative"
          style={{
            backgroundImage: `linear-gradient(to right, #262626 1px, transparent 1px), linear-gradient(to bottom, #262626 1px, transparent 1px)`,
            backgroundSize: `${battleMap.gridSize}px ${battleMap.gridSize}px`
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          {Object.values(battleMap.tokens).map((token) => {
            const name = getEntityName(token);
            const isHero = token.type === 'hero';
            return (
              <div
                key={token.id}
                draggable
                title="Двойной клик для удаления"
                onDragStart={(e) => e.dataTransfer.setData('tokenId', token.id)}
                onDrop={(e) => handleDrop(e, token.id)}
                onDoubleClick={() => removeBattleToken(token.id)}
                className={`absolute rounded-full border-2 cursor-move flex items-center justify-center font-bold text-xs shadow-md select-none ${
                  isHero ? 'bg-indigo-900/80 border-indigo-500 text-white' : 'bg-red-900/80 border-red-500 text-white'
                }`}
                style={{
                  left: token.x * battleMap.gridSize,
                  top: token.y * battleMap.gridSize,
                  width: (token.size || 1) * battleMap.gridSize,
                  height: (token.size || 1) * battleMap.gridSize
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
