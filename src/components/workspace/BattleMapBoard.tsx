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
    updateLocalMap,
    addEntity,
    setViewedEntityId,
    heroes, 
    npcs,
    currentHour
  } = useWorkspaceStore();
  
  const mapData = activeLocalMapId ? localMaps[activeLocalMapId] : null;

  const [tokenMenu, setTokenMenu] = React.useState<{ tokenId: string, entityId: string, x: number, y: number } | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeLocalMapId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      updateLocalMap(activeLocalMapId, { backgroundImage: base64String });
    };
    reader.readAsDataURL(file);
  };

  const updateCalibration = (field: 'gridSize' | 'gridOffsetX' | 'gridOffsetY', value: number) => {
    if (activeLocalMapId && mapData) {
      updateLocalMap(activeLocalMapId, { [field]: value });
    }
  };

  if (!mapData || !activeLocalMapId) return null;

  const gridSize = mapData.gridSize || 50;
  const offsetX = mapData.gridOffsetX || 0;
  const offsetY = mapData.gridOffsetY || 0;
  const backgroundScale = mapData.backgroundScale || 1;
  const backgroundRotation = mapData.backgroundRotation || 0;

  const spawnToken = (entity: any, type: 'hero' | 'npc' | 'poi' | 'check') => {
    const isAlreadyOnMap = Object.values(mapData.tokens).some(t => entity && t.entityId === entity.id);
    if (isAlreadyOnMap) return null;

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
    const gridX = Math.floor((xPixels - offsetX) / gridSize);
    const gridY = Math.floor((yPixels - offsetY) / gridSize);
    updateLocalToken(activeLocalMapId, tokenId, { x: gridX, y: gridY });
  };

  const getEntityName = (token: any) => {
    if (token.type === 'hero') return heroes[token.entityId]?.name || 'Hero';
    if (token.type === 'npc' || token.type === 'monster') return npcs[token.entityId]?.name || 'NPC';
    return '?';
  };

  return (
    <div 
      className="w-full h-full flex bg-neutral-950 relative overflow-hidden"
      onClick={() => setTokenMenu(null)}
      onContextMenu={() => setTokenMenu(null)}
    >
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
          
          <div className="text-xs text-neutral-500 font-bold uppercase mb-2">Герои</div>
          {Object.values(heroes).map((h: any) => {
            const isOnMap = Object.values(mapData.tokens).some(t => t.entityId === h.id);
            return (
              <div key={h.id} className="flex justify-between items-center text-neutral-300 text-sm">
                <span>{h.name}</span>
                <button 
                  draggable={!isOnMap}
                  onDragStart={(e) => {
                    const id = spawnToken(h, 'hero');
                    if (id) e.dataTransfer.setData('text/plain', id);
                  }}
                  disabled={isOnMap}
                  className={`px-2 py-1 rounded text-xs ${isOnMap ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-grab'}`}
                >{isOnMap ? 'На карте' : '+'}</button>
              </div>
            );
          })}

          <div className="text-xs text-neutral-500 font-bold uppercase mb-2 mt-4">NPC</div>
          {Object.values(npcs).filter(n => {
            const hasSchedule = n.schedule && n.schedule.length > 0;
            const isScheduledHere = n.schedule?.some(s => s.startHour <= currentHour && s.endHour > currentHour && s.locationId === activeLocalMapId);
            return !hasSchedule || isScheduledHere;
          }).map((n: any) => {
            const isOnMap = Object.values(mapData.tokens).some(t => t.entityId === n.id);
            return (
              <div key={n.id} className="flex justify-between items-center text-neutral-300 text-sm">
                <span>{n.name}</span>
                <button 
                  draggable={!isOnMap}
                  onDragStart={(e) => {
                    const id = spawnToken(n, 'npc');
                    if (id) e.dataTransfer.setData('text/plain', id);
                  }}
                  disabled={isOnMap}
                  className={`px-2 py-1 rounded text-xs ${isOnMap ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700 cursor-grab'}`}
                >{isOnMap ? 'На карте' : '+'}</button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 h-full relative">
        <div className="absolute top-4 left-4 z-20 flex gap-2 bg-neutral-900 p-2 rounded shadow flex-col">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors">
              📁 Загрузить фон карты
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/webp" 
                className="hidden" 
                onChange={handleImageUpload} 
              />
            </label>
            {mapData?.backgroundImage && (
              <button 
                onClick={() => updateLocalMap(activeLocalMapId!, { backgroundImage: null })}
                className="bg-red-900/80 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-bold transition-colors"
              >
                ❌ Убрать фон
              </button>
            )}
          </div>
          <div className="flex gap-2 text-xs text-neutral-300">
            <label>Размер: <input type="number" value={gridSize} onChange={(e) => updateCalibration('gridSize', parseInt(e.target.value))} className="w-12 bg-neutral-800 text-white"/></label>
            <label>X: <input type="number" value={offsetX} onChange={(e) => updateCalibration('gridOffsetX', parseInt(e.target.value))} className="w-12 bg-neutral-800 text-white"/></label>
            <label>Y: <input type="number" value={offsetY} onChange={(e) => updateCalibration('gridOffsetY', parseInt(e.target.value))} className="w-12 bg-neutral-800 text-white"/></label>
          </div>
          <div className="flex gap-2 text-xs text-neutral-300">
            <label>Масштаб: <input type="number" step="0.05" value={backgroundScale} onChange={(e) => updateLocalMap(activeLocalMapId, { backgroundScale: parseFloat(e.target.value) })} className="w-12 bg-neutral-800 text-white"/></label>
            <label>Поворот: <input type="number" value={backgroundRotation} onChange={(e) => updateLocalMap(activeLocalMapId, { backgroundRotation: parseInt(e.target.value) })} className="w-12 bg-neutral-800 text-white"/></label>
          </div>
          <button
            onClick={() => closeLocalMap()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-full text-sm"
          >
            Выйти из боя
          </button>
        </div>

        <div
          className="w-full h-full relative overflow-hidden"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div
            className="z-0"
            style={{ 
              backgroundImage: mapData?.backgroundImage ? `url("${mapData.backgroundImage}")` : 'none', 
              backgroundSize: 'contain', 
              backgroundPosition: 'center', 
              backgroundRepeat: 'no-repeat',
              transform: `scale(${backgroundScale}) rotate(${backgroundRotation}deg)`,
              transition: 'transform 0.1s ease-out',
              width: '100%', 
              height: '100%', 
              position: 'absolute' 
            }}
          />
          <div
            className="z-10"
            style={{ 
              backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)', 
              backgroundSize: `${gridSize}px ${gridSize}px`, 
              backgroundPosition: `${offsetX}px ${offsetY}px`, 
              width: '100%', 
              height: '100%', 
              position: 'absolute', 
              pointerEvents: 'none' 
            }}
          />
          {Object.values(mapData.tokens).map((token: any) => {
            const name = getEntityName(token);
            const isHero = token.type === 'hero';
            const isNpc = token.type === 'npc';
            
            if (isNpc) {
              const npc = npcs[token.entityId];
              if (npc && npc.schedule) {
                const isScheduledHere = npc.schedule.some(s => s.startHour <= currentHour && s.endHour > currentHour && s.locationId === activeLocalMapId);
                if (!isScheduledHere) return null;
              }
            }

            return (
              <div
                key={token.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', token.id);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTokenMenu({ tokenId: token.id, entityId: token.entityId, x: e.clientX, y: e.clientY });
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (token.type === 'poi' || token.type === 'check') {
                    setViewedEntityId(token.entityId);
                  } else {
                    removeLocalToken(activeLocalMapId, token.id);
                  }
                }}
                className={`absolute rounded-full border-2 cursor-move flex items-center justify-center font-bold text-xs shadow-md select-none z-20 ${
                  isHero ? 'bg-indigo-900/80 border-indigo-500 text-white' : 'bg-red-900/80 border-red-500 text-white'
                }`}
                style={{
                  left: token.x * gridSize + offsetX,
                  top: token.y * gridSize + offsetY,
                  width: (token.size || 1) * gridSize,
                  height: (token.size || 1) * gridSize
                }}
              >
                {name.substring(0, 2).toUpperCase()}
              </div>
            );
          })}
        </div>
      </div>
      
      {tokenMenu && (
        <div 
          className="fixed z-50 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl py-1 w-48 flex flex-col"
          style={{ left: tokenMenu.x, top: tokenMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => {
              useWorkspaceStore.getState().setViewedEntityId(tokenMenu.entityId);
              setTokenMenu(null);
            }} 
            className="px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-indigo-600 hover:text-white text-left flex items-center gap-2 transition-colors"
          >
            📖 Открыть досье
          </button>
          <button 
            onClick={() => {
              removeLocalToken(activeLocalMapId, tokenMenu.tokenId);
              setTokenMenu(null);
            }} 
            className="px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-600 hover:text-white text-left flex items-center gap-2 transition-colors"
          >
            ❌ Удалить с карты
          </button>
        </div>
      )}
    </div>
  );
};

export default BattleMapBoard;
