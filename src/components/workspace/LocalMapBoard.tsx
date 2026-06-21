'use client';

import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import EntityViewerModal from '@/components/workspace/EntityViewerModal';

// =====================================================
// 1. ХУК: Сохранение и загрузка фонов (IndexedDB)
// =====================================================
const initDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("GMAssistant_Maps", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("backgrounds");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const useMapBackground = (activeLocalMapId: string | null) => {
  const updateLocalMap = useWorkspaceStore(s => s.updateLocalMap);

  useEffect(() => {
    if (!activeLocalMapId) return;
    const loadBackground = async () => {
      try {
        const db = await initDB();
        const transaction = db.transaction("backgrounds", "readonly");
        const store = transaction.objectStore("backgrounds");
        const request = store.get(activeLocalMapId);
        request.onsuccess = () => {
          if (request.result) updateLocalMap(activeLocalMapId, { backgroundImage: request.result });
        };
      } catch (error) {
        console.error("Ошибка загрузки фона из IndexedDB:", error);
      }
    };
    loadBackground();
  }, [activeLocalMapId, updateLocalMap]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeLocalMapId) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target?.result as string;
      updateLocalMap(activeLocalMapId, { backgroundImage: base64String });
      try {
        const db = await initDB();
        const transaction = db.transaction("backgrounds", "readwrite");
        transaction.objectStore("backgrounds").put(base64String, activeLocalMapId);
      } catch (error) {
        console.error("Ошибка保存 фона в IndexedDB:", error);
      }
    };
    reader.readAsDataURL(file);
  };

  return { handleImageUpload };
};

// =====================================================
// 2. КОМПОНЕНТ: Сайдбар (Архив и Кнопки)
// =====================================================
const MapSidebar = ({ activeLocalMapId }: { activeLocalMapId: string }) => {
  const store = useWorkspaceStore();
  const mapData = store.localMaps[activeLocalMapId];
  
  const categories: ('heroes' | 'npcs' | 'enemies' | 'crowd' | 'loot' | 'interactive')[] = 
    ['heroes', 'npcs', 'enemies', 'crowd', 'loot', 'interactive'];

  const categoryNames: Record<string, string> = {
    heroes: "Герои",
    npcs: "Действующие лица",
    enemies: "Противники",
    crowd: "Массовка",
    loot: "Артефакты / Лут",
    interactive: "Интерактивные объекты"
  };

  const getTokenType = (category: string, item: any): 'hero' | 'npc' | 'poi' | 'check' | 'enemies' | 'crowd' | 'loot' => {
    if (category === 'heroes') return 'hero';
    if (category === 'npcs') return 'npc';
    if (category === 'interactive') return item.type || 'poi'; 
    return category as any; 
  };

  return (
    <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col p-4 overflow-y-auto">
      <h2 className="text-white font-bold mb-4">Архив</h2>
      <div className="space-y-4">
        <button 
          onClick={() => store.createAndSpawnInteractive(activeLocalMapId, 'poi')}
          className="w-full bg-yellow-600 text-white px-2 py-3 rounded-lg text-sm font-bold shadow-lg hover:bg-yellow-500 transition-colors"
        >
          ➕ Точка интереса (POI)
        </button>
        <button 
          onClick={() => store.createAndSpawnInteractive(activeLocalMapId, 'check')}
          className="w-full bg-fuchsia-700 text-white px-2 py-3 rounded-lg text-sm font-bold shadow-lg hover:bg-fuchsia-600 transition-colors"
        >
          ➕ Проверка (Check)
        </button>
        <div className="border-t border-neutral-800 my-4" />
        
        {categories.map(category => (
          <div key={category} className="mb-6">
            <div className="text-xs text-neutral-500 font-bold uppercase mb-2 tracking-wider">
              {categoryNames[category] || category}
            </div>
            <div className="space-y-1">
              {Object.values((store as any)[category] || {}).map((item: any) => {
                const isOnMap = Object.values(mapData?.tokens || {}).some((t: any) => t.entityId === item.id);
                return (
                  <div key={item.id} className="flex justify-between items-center text-neutral-300 text-sm p-1.5 hover:bg-neutral-800/80 rounded transition-colors group">
                    <span className="truncate pr-2 group-hover:text-white transition-colors">{item.name}</span>
                    <button 
                      onClick={() => store.spawnEntityToMap(activeLocalMapId, item, getTokenType(category, item))}
                      disabled={isOnMap}
                      className={`px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap transition-all ${isOnMap ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md'}`}
                    >
                      {isOnMap ? 'На карте' : '+'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =====================================================
// 3. КОМПОНЕНТ: Верхняя панель (Тулбар и Сетка)
// =====================================================
const MapToolbar = ({ activeLocalMapId, handleImageUpload }: { activeLocalMapId: string, handleImageUpload: (e: any) => void }) => {
  const store = useWorkspaceStore();
  const mapData = store.localMaps[activeLocalMapId];

  const handleCalibrationChange = (field: string, value: number) => {
    store.updateLocalMap(activeLocalMapId, { [field]: value || 0 });
  };

  if (!mapData) return null;

  return (
    <div className="absolute top-4 left-4 z-20 flex gap-2 bg-neutral-900/95 backdrop-blur-md p-3 rounded-xl shadow-2xl flex-col border border-neutral-800/50 w-64">
      <div className="flex items-center gap-2">
        <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all text-center flex-1 shadow-md">
          📁 Загрузить фон
          <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleImageUpload} />
        </label>
        {mapData.backgroundImage && (
          <button 
            onClick={() => store.updateLocalMap(activeLocalMapId, { backgroundImage: null })}
            className="bg-red-900/80 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-bold transition-all shadow-md flex items-center justify-center"
            title="Удалить фон"
          >
            ❌
          </button>
        )}
      </div>
      <button
        onClick={() => store.closeLocalMap()}
        className="bg-neutral-800 text-neutral-300 px-4 py-2 rounded-lg hover:bg-red-600 hover:text-white w-full text-sm font-bold transition-all border border-neutral-700 hover:border-red-600 shadow-md"
      >
        Вернуться на карту мира
      </button>
      <div className="flex justify-between items-center text-xs font-bold text-neutral-400 mt-2 gap-2 bg-neutral-950 p-2 rounded-lg border border-neutral-800">
        <label className="flex items-center gap-1">Сетка: <input type="number" value={mapData.gridSize || 50} onChange={(e) => handleCalibrationChange('gridSize', parseInt(e.target.value))} className="w-10 bg-neutral-800 text-white p-1 rounded border border-neutral-700 focus:border-indigo-500 outline-none text-center"/></label>
        <label className="flex items-center gap-1">X: <input type="number" value={mapData.gridOffsetX || 0} onChange={(e) => handleCalibrationChange('gridOffsetX', parseInt(e.target.value))} className="w-8 bg-neutral-800 text-white p-1 rounded border border-neutral-700 focus:border-indigo-500 outline-none text-center"/></label>
        <label className="flex items-center gap-1">Y: <input type="number" value={mapData.gridOffsetY || 0} onChange={(e) => handleCalibrationChange('gridOffsetY', parseInt(e.target.value))} className="w-8 bg-neutral-800 text-white p-1 rounded border border-neutral-700 focus:border-indigo-500 outline-none text-center"/></label>
      </div>
    </div>
  );
};

// =====================================================
// 4. ГЛАВНЫЙ КОМПОНЕНТ: Интерактивная доска
// =====================================================
const LocalMapBoard = () => {
  const store = useWorkspaceStore();
  const activeLocalMapId = store.activeLocalMapId;
  const mapData = activeLocalMapId ? store.localMaps[activeLocalMapId] : null;

  const { handleImageUpload } = useMapBackground(activeLocalMapId);

  const [tokenMenu, setTokenMenu] = useState<{ tokenId: string, entityId: string, x: number, y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  if (!activeLocalMapId || !mapData) return null;

  const gridSize = mapData.gridSize || 50;
  const offsetX = mapData.gridOffsetX || 0;
  const offsetY = mapData.gridOffsetY || 0;
  const backgroundScale = mapData.backgroundScale || 1;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - (mapData.cameraX || 0), y: e.clientY - (mapData.cameraY || 0) });
    }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    store.updateMapCamera(activeLocalMapId, { cameraX: e.clientX - panStart.x, cameraY: e.clientY - panStart.y });
  };
  const handleMouseUp = () => setIsPanning(false);
  const handleWheel = (e: React.WheelEvent) => {
    const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.min(Math.max((mapData.zoom || 1) + zoomDelta, 0.5), 3);
    store.updateMapCamera(activeLocalMapId, { zoom: newZoom });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const tokenId = e.dataTransfer.getData('text/plain');
    if (!tokenId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const xPixels = e.clientX - rect.left;
    const yPixels = e.clientY - rect.top;

    const worldX = (xPixels - (mapData.cameraX || 0)) / (mapData.zoom || 1);
    const worldY = (yPixels - (mapData.cameraY || 0)) / (mapData.zoom || 1);

    const gridX = Math.floor((worldX - offsetX) / gridSize);
    const gridY = Math.floor((worldY - offsetY) / gridSize);
    
    store.updateLocalToken(activeLocalMapId, tokenId, { x: gridX, y: gridY });
  };

  return (
    <div 
      className="w-full h-full flex bg-neutral-950 relative overflow-hidden font-sans"
      onClick={() => setTokenMenu(null)}
      onContextMenu={() => setTokenMenu(null)}
    >
      <MapSidebar activeLocalMapId={activeLocalMapId} />

      <div className="flex-1 h-full relative">
        <MapToolbar activeLocalMapId={activeLocalMapId} handleImageUpload={handleImageUpload} />

        <div
          className={`relative flex-1 w-full h-full overflow-hidden bg-[#0a0a0a] ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div
            className="absolute top-0 left-0 origin-top-left w-full h-full transition-transform duration-75 ease-out"
            style={{ transform: `translate(${mapData.cameraX || 0}px, ${mapData.cameraY || 0}px) scale(${mapData.zoom || 1})` }}
          >
            <div className="absolute inset-0 z-0 pointer-events-none">
               {mapData.backgroundImage && (
                <img 
                  src={mapData.backgroundImage} 
                  alt="Map Background"
                  className="w-full h-full"
                  style={{ objectFit: 'contain', objectPosition: 'center', transform: `scale(${backgroundScale})` }}
                />
               )}
            </div>

            <div
              className="absolute inset-0 z-10 pointer-events-none opacity-40 mix-blend-overlay"
              style={{ 
                backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)', 
                backgroundSize: `${gridSize}px ${gridSize}px`, 
                backgroundPosition: `${offsetX}px ${offsetY}px`
              }}
            />

            <div className="absolute inset-0 z-20 pointer-events-none" onWheel={handleWheel}>
              {Object.values(mapData.tokens || {}).map((token: any) => {
                const isPoi = token.type === 'poi';
                const isCheck = token.type === 'check';
                const isHero = token.type === 'hero';
                const isNpc = token.type === 'npc';
                const isEnemy = token.type === 'enemies';
                const isCrowd = token.type === 'crowd';
                const isLoot = token.type === 'loot';

                // Безопасное получение названия сущности для подписи под токеном
                const entity = store.heroes[token.entityId] || 
                               store.npcs[token.entityId] || 
                               store.enemies[token.entityId] || 
                               store.crowd[token.entityId] || 
                               store.loot[token.entityId] || 
                               store.interactive[token.entityId];
                const entityName = entity?.name || 'Объект';
                
                return (
                  <div
                    key={token.id}
                    className="absolute flex flex-col items-center pointer-events-auto transition-all duration-200 hover:scale-110 hover:z-50"
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                      left: token.x * gridSize + offsetX,
                      top: token.y * gridSize + offsetY,
                      width: (token.size || 1) * gridSize,
                      height: (token.size || 1) * gridSize
                    }}
                  >
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', token.id);
                        setTokenMenu(null);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTokenMenu({ tokenId: token.id, entityId: token.entityId, x: e.clientX, y: e.clientY });
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        store.setViewedEntityId(token.entityId); 
                        setTokenMenu(null);
                      }}
                      className={`w-full h-full border-2 cursor-move flex items-center justify-center font-black text-sm shadow-xl select-none backdrop-blur-sm transition-all ${
                        isPoi ? 'rounded-md bg-amber-400/90 border-amber-200 text-amber-950' 
                        : isCheck ? 'rotate-45 bg-fuchsia-600/90 border-fuchsia-300 text-white'
                        : isHero ? 'rounded-full bg-indigo-600/90 border-indigo-300 text-white shadow-indigo-500/20' 
                        : isNpc ? 'rounded-full bg-emerald-600/90 border-emerald-300 text-white shadow-emerald-500/20' // Зеленый для Действующих лиц
                        : isEnemy ? 'rounded-full bg-rose-700/90 border-rose-400 text-white shadow-rose-500/20' // Красный для Врагов
                        : isCrowd ? 'rounded-full bg-zinc-600/90 border-zinc-400 text-white shadow-zinc-500/20' // Серый для Массовки
                        : 'rounded-full bg-cyan-600/90 border-cyan-300 text-white shadow-cyan-500/20' // Сине-зеленый для Лута
                      }`}
                    >
                      <div className={`${isCheck ? '-rotate-45' : ''} drop-shadow-md text-base`}>
                        {isPoi ? '🔍' : isCheck ? '🎲' : isHero ? '🛡️' : isNpc ? '👤' : isEnemy ? '⚔️' : isCrowd ? '👥' : '💎'}
                      </div>
                    </div>
                    {/* Текстовая плашка с названием объекта под токеном */}
                    <div className="absolute top-full mt-1.5 bg-black/85 border border-neutral-800 text-neutral-200 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md whitespace-nowrap max-w-[120px] truncate select-none pointer-events-none tracking-wide">
                      {entityName}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {tokenMenu && (
        <div 
          className="fixed z-50 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl py-1.5 w-48 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150"
          style={{ left: tokenMenu.x, top: tokenMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => {
              store.setViewedEntityId(tokenMenu.entityId);
              setTokenMenu(null);
            }} 
            className="px-4 py-3 text-xs font-bold text-neutral-200 hover:bg-indigo-600 hover:text-white text-left flex items-center gap-3 transition-colors"
          >
            📖 Открыть досье
          </button>
          <div className="h-px bg-neutral-800 w-full my-1" />
          <button 
            onClick={() => {
              store.removeLocalToken(activeLocalMapId, tokenMenu.tokenId);
              setTokenMenu(null);
            }} 
            className="px-4 py-3 text-xs font-bold text-red-400 hover:bg-red-600 hover:text-white text-left flex items-center gap-3 transition-colors"
          >
            ❌ Удалить с карты
          </button>
        </div>
      )}

      {/* КРИТИЧЕСКИЙ РЕНДЕР МОДАЛКИ: Окно досье теперь будет физически открываться прямо поверх карты */}
      {store.viewedEntityId && <EntityViewerModal />}
    </div>
  );
};

export default LocalMapBoard;