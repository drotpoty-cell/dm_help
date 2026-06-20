'use client';

import React from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

const LocalMapBoard = () => {
  const { 
    localMaps, 
    activeLocalMapId,
    updateLocalToken, 
    spawnEntityToMap, 
    removeLocalToken, 
    closeLocalMap,
    updateLocalMap,
    updateMapCamera,
    addEntity,
    setViewedEntityId,
    heroes, 
    npcs,
    enemies,
    crowd,
    currentHour
  } = useWorkspaceStore();
  
  const mapData = activeLocalMapId ? localMaps[activeLocalMapId] : null;

  const debugMapSync = () => {
    const state = useWorkspaceStore.getState();
    const activeId = state.activeLocalMapId;
    if (!activeId) {
      console.warn('debugMapSync: Нет активной карты.');
      return;
    }
    const map = state.localMaps[activeId];
    if (!map) {
      console.warn('debugMapSync: Активная карта не найдена в store.');
      return;
    }

    const allEntities = { ...state.npcs, ...state.enemies, ...state.heroes };
    const tokens = Object.values(map.tokens);
    
    const expected = Object.values(allEntities).filter((e: any) => e.locationId === activeId);
    
    const report: any[] = [];
    
    expected.forEach(e => {
      const found = tokens.find(t => t.entityId === e.id);
      report.push({
        entityName: e.name,
        entityId: e.id,
        expectedLocation: activeId,
        presentOnMap: !!found,
        status: found ? 'OK' : 'MISSING'
      });
    });
    
    tokens.forEach(t => {
      const entity = (allEntities as any)[t.entityId];
      if (!entity) {
        report.push({
          entityName: 'Unknown',
          entityId: t.entityId,
          expectedLocation: 'N/A',
          presentOnMap: true,
          status: 'ORPHAN_TOKEN'
        });
      } else if (entity.locationId !== activeId && t.type !== 'poi' && t.type !== 'check') {
        report.push({
          entityName: entity.name,
          entityId: t.entityId,
          expectedLocation: entity.locationId,
          presentOnMap: true,
          status: 'MISPLACED'
        });
      }
    });
    
    console.table(report);
  };

  React.useEffect(() => {
    (window as any).debugMapSync = debugMapSync;
  }, [activeLocalMapId, currentHour]);

  const [tokenMenu, setTokenMenu] = React.useState<{ tokenId: string, entityId: string, x: number, y: number } | null>(null);
  const [isPanning, setIsPanning] = React.useState(false);
  const [panStart, setPanStart] = React.useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    // Запускаем панорамирование на ЛКМ (0) или Колесико (1)
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - (mapData?.cameraX || 0), y: e.clientY - (mapData?.cameraY || 0) });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !activeLocalMapId) return;
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;

    updateMapCamera(activeLocalMapId, {
      cameraX: e.clientX - panStart.x,
      cameraY: e.clientY - panStart.y
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleWheel = (e: React.WheelEvent) => {
    if (!activeLocalMapId || !mapData) return;
    const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.min(Math.max((mapData.zoom || 1) + zoomDelta, 0.5), 3);
    updateMapCamera(activeLocalMapId, { zoom: newZoom });
  };


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

  const spawnToken = (entity: any, type: 'hero' | 'npc' | 'poi' | 'check' | 'enemies' | 'crowd' | 'loot', locationId: string | null = activeLocalMapId) => {
    const isAlreadyOnMap = Object.values(mapData.tokens).some(t => entity && t.entityId === entity.id);
    if (isAlreadyOnMap) return null;

    const id = entity?.id || `token-${Date.now()}`;
    
    spawnEntityToMap(locationId || activeLocalMapId || '', { id: id, name: entity?.name || (type === 'poi' ? 'POI' : 'Check') }, type);
    
    return id;
  };

  const categories: ('heroes' | 'npcs' | 'enemies' | 'crowd' | 'loot')[] = ['heroes', 'npcs', 'enemies', 'crowd', 'loot'];

  const renderSidebar = () => {
    return categories.map(category => (
      <div key={category} className="mb-6">
        <div className="text-xs text-neutral-500 font-bold uppercase mb-2">
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </div>
        <div className="space-y-1">
          {Object.values((useWorkspaceStore.getState() as any)[category] || {}).map((item: any) => {
            const isOnMap = Object.values(mapData.tokens).some(t => t.entityId === item.id);
            return (
              <div key={item.id} className="flex justify-between items-center text-neutral-300 text-sm p-1 hover:bg-neutral-800 rounded">
                <span>{item.name}</span>
                <button 
                  onClick={() => spawnEntityToMap(activeLocalMapId!, item, category as any)}
                  disabled={isOnMap}
                  className={`px-2 py-0.5 rounded text-xs ${isOnMap ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  {isOnMap ? 'На карте' : '+'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    ));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const tokenId = e.dataTransfer.getData('text/plain');
    const rect = e.currentTarget.getBoundingClientRect(); // Вьюпорт
    const xPixels = e.clientX - rect.left;
    const yPixels = e.clientY - rect.top;

    // Обратная трансформация: отнимаем смещение камеры и делим на зум
    const worldX = (xPixels - (mapData?.cameraX || 0)) / (mapData?.zoom || 1);
    const worldY = (yPixels - (mapData?.cameraY || 0)) / (mapData?.zoom || 1);

    // Расчет финальной клетки с учетом оффсета сетки
    const gridX = Math.floor((worldX - (mapData?.gridOffsetX || 0)) / gridSize);
    const gridY = Math.floor((worldY - (mapData?.gridOffsetY || 0)) / gridSize);
    updateLocalToken(activeLocalMapId, tokenId, { x: gridX, y: gridY });
  };

  const getEntityName = (token: any) => {
    const entity = heroes[token.entityId] || npcs[token.entityId] || enemies[token.entityId] || crowd[token.entityId];
    return entity?.name || (token.type === 'hero' ? 'Hero' : token.type === 'npc' ? 'NPC' : '?');
  };

  return (
    <div 
      className="w-full h-full flex bg-neutral-950 relative overflow-hidden"
      onClick={() => setTokenMenu(null)}
      onContextMenu={() => setTokenMenu(null)}
    >
      <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col p-4 overflow-y-auto">
        <h2 className="text-white font-bold mb-4">Архив</h2>
        <div className="space-y-4">
          <button 
            onClick={() => spawnEntityToMap(activeLocalMapId!, { id: `poi-${Date.now()}`, name: 'POI' }, 'poi')}
            className="w-full bg-yellow-600 text-white px-2 py-2 rounded text-sm hover:bg-yellow-700"
          >
            ➕ Добавить точку интереса (POI)
          </button>
          <button 
            onClick={() => spawnEntityToMap(activeLocalMapId!, { id: `check-${Date.now()}`, name: 'Check' }, 'check')}
            className="w-full bg-orange-600 text-white px-2 py-2 rounded text-sm hover:bg-orange-700"
          >
            ➕ Добавить проверку (Check)
          </button>
          <div className="border-t border-neutral-800 my-4" />
          {renderSidebar()}
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
            Вернуться на карту мира
          </button>
        </div>

        <div
          className={`relative flex-1 w-full h-full overflow-hidden bg-neutral-950 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => setTokenMenu(null)}
          onContextMenu={(e) => { e.preventDefault(); setTokenMenu(null); }}
        >
          <div
            className="absolute top-0 left-0 origin-top-left w-full h-full"
            style={{
              transform: `translate(${mapData?.cameraX || 0}px, ${mapData?.cameraY || 0}px) scale(${mapData?.zoom || 1})`
            }}
          >
            {/* Layer 0: Background - самый нижний */}
            <div className="absolute inset-0 z-0">
               {mapData?.backgroundImage && <img src={mapData.backgroundImage} className="w-full h-full object-contain" />}
            </div>

            {/* Layer 1: Grid - поверх фона */}
            <div
              className="absolute inset-0 z-10 pointer-events-none"
              style={{ 
                backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)', 
                backgroundSize: `${gridSize}px ${gridSize}px`, 
                backgroundPosition: `${offsetX}px ${offsetY}px`
              }}
            />

            {/* Layer 2: Tokens - самый верхний, кликабельный */}
            <div className="absolute inset-0 z-20 pointer-events-auto">
              {Object.values(mapData.tokens).map((token: any) => {
                const name = getEntityName(token);
                const isHero = token.type === 'hero';
                const isNpc = token.type === 'npc';
                const isPoi = token.type === 'poi';
                const isCheck = token.type === 'check';
                
                let isScheduledHere = true;
                if (isNpc) {
                  const npc = npcs[token.entityId];
                  if (npc?.schedule && npc.schedule.length > 0) {
                    isScheduledHere = npc.schedule.some(s => s.startHour <= currentHour && s.endHour > currentHour && s.locationId === activeLocalMapId);
                  }
                }

                return (
                  <div
                    key={token.id}
                    className={`absolute flex flex-col items-center pointer-events-auto ${!isScheduledHere ? 'opacity-50' : ''}`}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                      left: token.x * gridSize + offsetX,
                      top: token.y * gridSize + offsetY,
                      width: (token.size || 1) * gridSize,
                      height: (token.size || 1) * gridSize,
                      position: 'absolute'
                    }}
                  >
                    {(() => {
                      const entity = heroes[token.entityId] || 
                                     npcs[token.entityId] || 
                                     enemies[token.entityId] || 
                                     crowd[token.entityId];
                      const initial = entity?.name ? entity.name.charAt(0).toUpperCase() : '?';

                      return (
                        <>
                          {entity?.hp !== undefined && entity?.maxHp && !isPoi && !isCheck && (
                            <div className="absolute -top-3 w-full h-1.5 bg-red-950 border border-zinc-900 rounded-sm overflow-hidden">
                              <div 
                                className="h-full bg-green-500 transition-all" 
                                style={{ width: `${Math.max(0, Math.min(100, (entity.hp / entity.maxHp) * 100))}%` }}
                              />
                            </div>
                          )}
                          
                          <div
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
                              if (isPoi || isCheck) {
                                setViewedEntityId(token.entityId);
                              } else {
                                removeLocalToken(activeLocalMapId, token.id);
                              }
                            }}
                            className={`w-full h-full border-2 cursor-move flex items-center justify-center font-bold text-xs shadow-md select-none ${
                              isPoi 
                                ? 'rounded-md bg-amber-500/80 border-amber-400 text-black' 
                                : isCheck
                                  ? 'rotate-45 bg-fuchsia-700/80 border-fuchsia-400 text-white'
                                  : isHero 
                                    ? 'rounded-full bg-indigo-900/80 border-indigo-500 text-white' 
                                    : 'rounded-full bg-red-900/80 border-red-500 text-white'
                            }`}
                          >
                            <div className={isCheck ? '-rotate-45' : ''}>
                              {isPoi ? '🔍' : isCheck ? '🎲' : initial}
                            </div>
                          </div>

                          <div className="absolute -bottom-5 text-[9px] font-bold text-white bg-black/70 px-1 rounded whitespace-nowrap pointer-events-none">
                            {isPoi ? 'Точка интереса' : isCheck ? 'Проверка' : (entity?.name || name)}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
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

export default LocalMapBoard;
