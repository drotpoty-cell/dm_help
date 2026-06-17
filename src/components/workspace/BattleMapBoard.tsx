'use client';

import React from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

const BattleMapBoard = () => {
  const [bgUrl, setBgUrl] = React.useState('');
  const { 
    localMaps, 
    activeLocalMapId,
    updateLocalToken, 
    addLocalToken, 
    removeLocalToken, 
    closeLocalMap,
    updateLocalMap,
    addEntity,
    setViewedEntityId,
    heroes, 
    npcs 
  } = useWorkspaceStore();
  
  const mapData = activeLocalMapId ? localMaps[activeLocalMapId] : null;

  const handleSetBackground = () => {
    if (activeLocalMapId) {
      updateLocalMap(activeLocalMapId, { backgroundImage: bgUrl });
    }
  };

  if (!mapData || !activeLocalMapId) return null;

  const spawnToken = (entity: any, type: 'hero' | 'npc' | 'poi' | 'check') => {
    const id = `token-${Date.now()}`;
    const tokenData = {
      id,
      entityId: entity?.id || id,
      type,
      x: 2,
      y: 2,
      size: 1
    };
    addLocalToken(activeLocalMapId, tokenData);
    
    if (type === 'poi' || type === 'check') {
      addEntity('extras', {
        id,
        name: type === 'poi' ? 'Новая точка интереса' : 'Новая проверка',
        description: '',
        tokenType: type
      });
    }
    
    return id;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const tokenId = e.dataTransfer.getData('text/plain');
    const rect = e.currentTarget.getBoundingClientRect();
    const xPixels = e.clientX - rect.left;
    const yPixels = e.clientY - rect.top;
    const gridX = Math.floor(xPixels / mapData.gridSize);
    const gridY = Math.floor(yPixels / mapData.gridSize);
    updateLocalToken(activeLocalMapId, tokenId, { x: gridX, y: gridY });
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
          <button 
            onClick={() => spawnToken(null, 'poi')}
            className="w-full bg-yellow-600 text-white px-2 py-2 rounded text-sm hover:bg-yellow-700"
          >
            ➕ Добавить точку интереса (POI)
          </button>
          <button 
            onClick={() => spawnToken(null, 'check')}
            className="w-full bg-orange-600 text-white px-2 py-2 rounded text-sm hover:bg-orange-700"
          >
            ➕ Добавить проверку (Check)
          </button>
          <div className="border-t border-neutral-800 my-4" />
          {Object.values(heroes).map((h: any) => (
            <div key={h.id} className="flex justify-between items-center text-neutral-300 text-sm">
              <span>{h.name}</span>
              <button 
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', spawnToken(h, 'hero'))}
                className="bg-indigo-600 text-white px-2 py-1 rounded text-xs hover:bg-indigo-700 cursor-grab"
              >+</button>
            </div>
          ))}
          {Object.values(npcs).map((n: any) => (
            <div key={n.id} className="flex justify-between items-center text-neutral-300 text-sm">
              <span>{n.name}</span>
              <button 
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', spawnToken(n, 'npc'))}
                className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 cursor-grab"
              >+</button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 h-full relative">
        <div className="absolute top-4 left-4 z-10 flex gap-2 bg-neutral-900 p-2 rounded shadow flex-col">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={bgUrl} 
              onChange={(e) => setBgUrl(e.target.value)} 
              placeholder="URL фона" 
              className="bg-neutral-800 text-white px-2 py-1 rounded text-sm"
            />
            <button
              onClick={handleSetBackground}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
            >
              Установить фон
            </button>
          </div>
          <button
            onClick={() => closeLocalMap()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-full text-sm"
          >
            Выйти из боя
          </button>
        </div>

        <div
          className="w-full h-full relative"
          style={{
            backgroundImage: mapData?.backgroundImage ? `url(${mapData.backgroundImage})` : 'none',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundColor: '#171717'
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <div
            className="w-full h-full absolute top-0 left-0"
            style={{
              backgroundImage: `linear-gradient(to right, #262626 1px, transparent 1px), linear-gradient(to bottom, #262626 1px, transparent 1px)`,
              backgroundSize: `${mapData.gridSize}px ${mapData.gridSize}px`
            }}
          />
          {Object.values(mapData.tokens).map((token: any) => {
            const name = getEntityName(token);
            const isHero = token.type === 'hero';
            return (
              <div
                key={token.id}
                draggable
                title="Двойной клик для удаления"
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', token.id);
                }}
                onDrop={(e) => {
                  handleDrop(e);
                  e.stopPropagation();
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (token.type === 'poi' || token.type === 'check') {
                    setViewedEntityId(token.entityId);
                  } else {
                    removeLocalToken(activeLocalMapId, token.id);
                  }
                }}
                className={`absolute rounded-full border-2 cursor-move flex items-center justify-center font-bold text-xs shadow-md select-none ${
                  isHero ? 'bg-indigo-900/80 border-indigo-500 text-white' : 'bg-red-900/80 border-red-500 text-white'
                }`}
                style={{
                  left: token.x * mapData.gridSize,
                  top: token.y * mapData.gridSize,
                  width: (token.size || 1) * mapData.gridSize,
                  height: (token.size || 1) * mapData.gridSize
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
