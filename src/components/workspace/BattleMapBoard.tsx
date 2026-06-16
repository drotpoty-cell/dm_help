'use client';

import React from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

const BattleMapBoard = () => {
  const { battleMap, updateBattleToken, toggleBattleMode, heroes, npcs } = useWorkspaceStore();

  const handleDrop = (e: React.DragEvent, tokenId: string) => {
    e.preventDefault();
    const x = Math.floor(e.nativeEvent.offsetX / battleMap.gridSize);
    const y = Math.floor(e.nativeEvent.offsetY / battleMap.gridSize);
    updateBattleToken(tokenId, { x, y });
  };

  const getEntityName = (token: any) => {
    if (token.type === 'hero') return heroes[token.entityId]?.name || 'Hero';
    if (token.type === 'npc' || token.type === 'monster') return npcs[token.entityId]?.name || 'NPC';
    return '?';
  };

  return (
    <div className="w-full h-full flex flex-col bg-neutral-950 relative">
      <div className="absolute top-4 left-4 z-10 flex gap-2 bg-neutral-900 p-2 rounded shadow">
        <button
          onClick={() => toggleBattleMode()}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Выйти из боя
        </button>
      </div>

      <div
        className="flex-1 w-full h-full relative"
        style={{
          backgroundImage: `linear-gradient(to right, #262626 1px, transparent 1px), linear-gradient(to bottom, #262626 1px, transparent 1px)`,
          backgroundSize: `${battleMap.gridSize}px ${battleMap.gridSize}px`
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        {Object.values(battleMap.tokens).map((token) => (
          <div
            key={token.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('tokenId', token.id)}
            onDrop={(e) => handleDrop(e, token.id)}
            className="absolute bg-blue-500 rounded-full cursor-move flex items-center justify-center text-white text-xs font-bold select-none"
            style={{
              left: token.x * battleMap.gridSize,
              top: token.y * battleMap.gridSize,
              width: battleMap.gridSize,
              height: battleMap.gridSize
            }}
          >
            {getEntityName(token).charAt(0)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BattleMapBoard;
