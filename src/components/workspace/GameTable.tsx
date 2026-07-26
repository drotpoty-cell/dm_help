'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background, Controls, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange,
  addEdge, Connection, Edge, Node, ReactFlowProvider, useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useDraggable, useSensor, useSensors,
} from '@dnd-kit/core';

import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { nodeTypes as legacyNodeTypes } from '@/components/workspace/CustomNodes';
import MapNode from '@/components/workspace/MapNode';
import TacticalTokenNode from '@/components/workspace/TacticalTokenNode';
import TravelEdge from '@/components/workspace/CustomEdges';
import RouteEdge from '@/components/workspace/RouteEdge';
import ContextMenu from '@/components/workspace/ContextMenu';
import Sidebar from '@/components/workspace/Sidebar';
import BattleTrackerWidget from '@/components/workspace/BattleTrackerWidget';
import TacticalSpawnPanel from '@/components/workspace/TacticalSpawnPanel';
import CalendarWidget from '@/components/workspace/cockpit/CalendarWidget';
import WeatherWidget from '@/components/workspace/cockpit/WeatherWidget';
import WeatherBanner from '@/components/workspace/cockpit/WeatherBanner';

/**
 * Мост dnd-kit -> координаты reactflow (перенесено из старого MapBoard без изменений).
 */
function getDropClientPosition(event: DragEndEvent): { x: number; y: number } | null {
  const activator = event.activatorEvent as MouseEvent & Partial<TouchEvent>;
  let startX: number | undefined;
  let startY: number | undefined;
  if (typeof activator.clientX === 'number') {
    startX = activator.clientX;
    startY = activator.clientY;
  } else if (activator.touches && activator.touches[0]) {
    startX = activator.touches[0].clientX;
    startY = activator.touches[0].clientY;
  }
  if (startX === undefined || startY === undefined) return null;
  return { x: startX + event.delta.x, y: startY + event.delta.y };
}

const DraggableLocationCard = ({ loc, onQuickAdd }: { loc: any; onQuickAdd: () => void }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `archive-location-${loc.id}`,
    data: { locationId: loc.id },
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onQuickAdd}
      className={`p-3 bg-neutral-900/80 hover:bg-neutral-800 rounded-xl border border-white/[0.06] cursor-grab active:cursor-grabbing transition-colors touch-none ${isDragging ? 'opacity-30' : ''}`}
      title="Перетащите на карту или кликните для быстрого добавления"
    >
      <div className="text-white font-bold text-sm">{loc.name}</div>
      <div className="text-[10px] text-neutral-500 uppercase tracking-wide">{loc.type || 'Локация'}</div>
    </div>
  );
};

type PanelKey = 'weather' | 'calendar' | 'battle';

/** Кнопка-тумблер плавающей панели на тулбаре (Блок 1: закрыть/открыть по кнопке/хоткею). */
const PanelToggle = ({ label, hotkey, active, onClick }: { label: string; hotkey: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    title={`${label} (клавиша ${hotkey.toUpperCase()})`}
    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors whitespace-nowrap ${
      active
        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-950/40'
        : 'bg-neutral-900/80 border-white/10 text-neutral-400 hover:text-white hover:border-white/20'
    }`}
  >
    {label}
  </button>
);

/** Bug 3: эти "статусы" из ContextMenu — это данные (`data.mode`) на карточке MapNode, а не
 *  отдельные reactflow-типы узлов (см. changeNodeType ниже). */
const LOCATION_MODES = new Set(['safe', 'tense', 'hostile', 'mystery']);

const GameTable = () => (
  <ReactFlowProvider>
    <GameTableInner />
  </ReactFlowProvider>
);

const GameTableInner = () => {
  const {
    nodes, edges, setNodes, setEdges,
    attachToRegion, setPartyLocation,
    locations, placeLocationOnMap,
    localMaps, updateLocalToken,
    activeLocalMapId, diveIntoMap, closeLocalMap,
  } = useWorkspaceStore();

  const [isArchivePanelOpen, setIsArchivePanelOpen] = useState(false);
  const [isSpawnPanelOpen, setIsSpawnPanelOpen] = useState(true);
  const [openPanels, setOpenPanels] = useState<Record<PanelKey, boolean>>({ weather: true, calendar: true, battle: false });
  const togglePanel = useCallback((key: PanelKey) => setOpenPanels((p) => ({ ...p, [key]: !p[key] })), []);

  const nodeTypes = useMemo(() => ({ ...legacyNodeTypes, custom: MapNode, token: TacticalTokenNode }), []);
  const edgeTypes = useMemo(() => ({ travel: TravelEdge, custom: RouteEdge }), []);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ id: string, x: number, y: number, overContainers: Node[] } | null>(null);
  const paneRef = useRef<HTMLDivElement>(null);

  const reactFlowInstance = useReactFlow();
  const [draggedLocationId, setDraggedLocationId] = useState<string | null>(null);
  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Bug 1 fix: тактический режим больше не зависит от useViewport().zoom вообще — только от
  // того, что ГМ явно "провалился" в локацию (двойной клик, см. handleNodeDoubleClick) и ещё
  // не вышел из неё (кнопка "Карта мира" / Escape, см. useEffect с хоткеями ниже). Обычный
  // скролл камеры больше никак не сворачивает и не разворачивает тактическую доску.
  const isTacticalActive = !!activeLocalMapId;

  const [dragOverrides, setDragOverrides] = useState<Record<string, { x: number; y: number }>>({});

  const tokenNodes = useMemo(() => {
    const result: Node[] = [];
    for (const node of nodes) {
      const locationKey = (node.data as any)?.entityId || node.id;
      const map = localMaps[locationKey];
      if (!map?.tokens) continue;
      const gridSize = map.gridSize || 50;
      // Токены локации видимы и интерактивны, только пока ГМ реально находится в её
      // тактическом режиме — иначе на столе одновременно маячили бы токены всех боёв сразу.
      const visible = activeLocalMapId === locationKey;
      Object.values(map.tokens).forEach((token) => {
        const flowId = `token-${token.id}`;
        result.push({
          id: flowId,
          type: 'token',
          parentId: node.id,
          extent: 'parent',
          position: dragOverrides[flowId] ?? { x: token.x * gridSize, y: token.y * gridSize },
          data: { token, locationId: locationKey, gridSize },
          hidden: !visible,
          draggable: visible,
          selectable: visible,
          zIndex: 1001,
        });
      });
    }
    return result;
  }, [nodes, localMaps, activeLocalMapId, dragOverrides]);

  const flowNodes = useMemo(() => {
    // Bug 1 fix: узел активной (тактической) локации получает zIndex поверх всех остальных
    // карточек на столе — иначе соседние компактные карточки перекрывали развёрнутую доску.
    const boosted = nodes.map((n) => {
      const locationKey = (n.data as any)?.entityId || n.id;
      return locationKey === activeLocalMapId ? { ...n, zIndex: 1000 } : n;
    });
    return [...boosted, ...tokenNodes];
  }, [nodes, tokenNodes, activeLocalMapId]);

  // Маршруты и время в пути — атрибут глобальной карты (Блок 2: макроуровень); в
  // тактическом режиме они визуально не нужны и только мешали бы боевой сетке.
  const flowEdges = useMemo(() => edges.map((e) => (isTacticalActive ? { ...e, hidden: true } : e)), [edges, isTacticalActive]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const locationChanges: NodeChange[] = [];
    changes.forEach((change) => {
      const changeId = (change as { id?: string }).id;
      if (!changeId?.startsWith('token-')) {
        locationChanges.push(change);
        return;
      }
      // Токены: во время активного перетаскивания просто отражаем текущую (ещё не
      // привязанную к сетке) позицию визуально — финальный, снеппящийся к сетке коммит в
      // стор происходит в onNodeDragStop ниже (Bug 4), а не здесь. Полагаться на то, что
      // именно в onNodesChange прилетит финальный change с dragging:false, ненадёжно —
      // onNodeDragStop reactflow вызывает гарантированно ровно один раз на отпускание мыши.
      if (change.type === 'position' && change.position && change.dragging) {
        setDragOverrides((prev) => ({ ...prev, [changeId]: change.position! }));
      }
    });
    if (locationChanges.length) setNodes(applyNodeChanges(locationChanges, nodes));
  }, [nodes, setNodes]);

  // Bug 4 fix: строгий снеппинг токена к сетке при отпускании — Math.round(coord/gridSize)
  // приводит пиксельную позицию к ближайшей ячейке, после чего то же самое значение (уже в
  // единицах сетки) улетает в стор. node.position здесь — координата ОТНОСИТЕЛЬНО родителя
  // (см. parentId/extent:'parent' в tokenNodes), то есть именно то, что нужно.
  const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type !== 'token') return;
    const { locationId, gridSize, token } = node.data as any;
    const snappedGridX = Math.round(node.position.x / gridSize);
    const snappedGridY = Math.round(node.position.y / gridSize);
    updateLocalToken(locationId, token.id, { x: snappedGridX, y: snappedGridY });
    setDragOverrides((prev) => {
      const next = { ...prev };
      delete next[node.id];
      return next;
    });
  }, [updateLocalToken]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges(applyEdgeChanges(changes, edges)), [edges, setEdges]);
  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges(addEdge({ ...params, type: 'custom', data: { days: 0, hours: 0 } }, edges)),
    [edges, setEdges],
  );

  const availableLocations = useMemo(
    () => Object.values(locations).filter((loc: any) => !nodes.some((node) => node.data?.entityId === loc.id)),
    [locations, nodes]
  );

  const addLocationNode = (loc: any) => {
    placeLocationOnMap(loc.id);
    setIsArchivePanelOpen(false);
  };

  const handleDndDragStart = useCallback((event: DragStartEvent) => {
    const locationId = event.active.data.current?.locationId as string | undefined;
    if (locationId) setDraggedLocationId(locationId);
  }, []);

  const handleDndDragEnd = useCallback((event: DragEndEvent) => {
    setDraggedLocationId(null);
    const locationId = event.active.data.current?.locationId as string | undefined;
    if (!locationId) return;
    const clientPos = getDropClientPosition(event);
    if (!clientPos || !paneRef.current) {
      placeLocationOnMap(locationId);
      setIsArchivePanelOpen(false);
      return;
    }
    const paneRect = paneRef.current.getBoundingClientRect();
    if (clientPos.x < paneRect.left || clientPos.x > paneRect.right || clientPos.y < paneRect.top || clientPos.y > paneRect.bottom) {
      return;
    }
    const flowPosition = reactFlowInstance.screenToFlowPosition(clientPos);
    placeLocationOnMap(locationId, flowPosition);
    setIsArchivePanelOpen(false);
  }, [placeLocationOnMap, reactFlowInstance]);

  // Двойной клик по локации — семантический "провал" в тактический режим (Блок 2):
  // плавно летим камерой к узлу и приближаемся выше TACTICAL_ZOOM_THRESHOLD, узел сам
  // разворачивается в боевую доску (см. MapNode.tsx), никакой отдельной вкладки/страницы.
  const handleNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type !== 'custom') return;
    const locationKey = (node.data as any)?.entityId || node.id;
    // Узел без привязанной сущности Архива — тактическая доска всё равно поддерживается
    // (см. TacticalBoard в MapNode.tsx, поле linkedLocationId), просто без автофона/карточки
    // локации, пока ГМ не привяжет её вручную через мини-тулбар доски.
    diveIntoMap(locationKey);
    const width = node.width || 220;
    const height = node.height || 120;
    reactFlowInstance.setCenter(node.position.x + width / 2, node.position.y + height / 2, { zoom: 2, duration: 650 });
    setOpenPanels((p) => ({ ...p, battle: true }));
  }, [diveIntoMap, reactFlowInstance]);

  const changeNodeType = useCallback((id: string, newType: string) => {
    setNodes(nodes.map((n) => {
      if (n.id !== id) return n;
      if (LOCATION_MODES.has(newType)) {
        // Раньше это меняло n.type на легаси-компонент (safe/tense/hostile/mystery из
        // CustomNodes.tsx) с совершенно другой версткой — карточка "прыгала" и теряла
        // тактильный дизайн/фон/токены. Теперь статус — это просто данные на той же
        // единой карточке MapNode (см. MODE_BADGES в MapNode.tsx).
        return { ...n, type: 'custom', data: { ...n.data, mode: newType } };
      }
      let style = n.style || {};
      if (newType === 'region') style = { ...style, width: Math.max(Number(style.width) || 400, 400), height: Math.max(Number(style.height) || 300, 300), zIndex: -1 };
      if (newType === 'area') style = { ...style, width: Math.max(Number(style.width) || 800, 800), height: Math.max(Number(style.height) || 600, 600), zIndex: -2 };
      return { ...n, type: newType, style };
    }));
    setMenu(null);
  }, [nodes, setNodes]);

  const deleteNode = useCallback((id: string) => {
    setNodes(nodes.filter((n) => n.id !== id));
    setEdges(edges.filter((e) => e.source !== id && e.target !== id));
    setMenu(null);
  }, [nodes, edges, setNodes, setEdges]);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === 'token') return; // у токенов свой упрощённый UI (кнопка ✕), не общий контекстный
    event.preventDefault();
    if (!paneRef.current) return;
    const pane = paneRef.current.getBoundingClientRect();
    const overContainers = nodes.filter((n) => {
      if ((n.type !== 'region' && n.type !== 'area') || n.id === node.id) return false;
      const rLeft = n.position.x;
      const rRight = n.position.x + (n.width || (n.type === 'area' ? 800 : 400));
      const rTop = n.position.y;
      const rBottom = n.position.y + (n.height || (n.type === 'area' ? 600 : 300));
      const nCenterX = node.position.x + (node.width || 160) / 2;
      const nCenterY = node.position.y + (node.height || 60) / 2;
      return nCenterX >= rLeft && nCenterX <= rRight && nCenterY >= rTop && nCenterY <= rBottom;
    });
    setMenu({ id: node.id, x: event.clientX - pane.left, y: event.clientY - pane.top, overContainers });
  }, [nodes]);

  // Хоткеи тулбара (Блок 1): переключение плавающих панелей, Escape — выйти из тактического
  // режима. Игнорируем нажатия, когда фокус в текстовом поле/редакторе.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      if (e.key === 'Escape' && activeLocalMapId) {
        closeLocalMap();
        reactFlowInstance.fitView({ duration: 600, padding: 0.3 });
        return;
      }
      const key = e.key.toLowerCase();
      if (key === 'w') togglePanel('weather');
      if (key === 'c') togglePanel('calendar');
      if (key === 'b') togglePanel('battle');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeLocalMapId, closeLocalMap, reactFlowInstance, togglePanel]);

  const draggedLocation = draggedLocationId ? locations[draggedLocationId] : null;
  const showBattlePanel = openPanels.battle || isTacticalActive;

  return (
    <DndContext sensors={dndSensors} onDragStart={handleDndDragStart} onDragEnd={handleDndDragEnd}>
      <div className="w-full h-full relative bg-neutral-950" ref={paneRef}>
        {/* Тулбар: локации из Архива (только на глобальной карте) + тумблеры плавающих панелей */}
        <div className="absolute top-4 left-4 z-40 flex items-center gap-2 flex-wrap">
          {!activeLocalMapId && (
            <button
              onClick={() => setIsArchivePanelOpen(!isArchivePanelOpen)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-lg shadow-indigo-950/40 flex items-center gap-2 border border-indigo-400/30"
            >
              <span>📁</span> Локации из Архива
            </button>
          )}
          <PanelToggle label="🌦️ Погода" hotkey="w" active={openPanels.weather} onClick={() => togglePanel('weather')} />
          <PanelToggle label="📅 Календарь" hotkey="c" active={openPanels.calendar} onClick={() => togglePanel('calendar')} />
          <PanelToggle label="⚔️ Трекер боя" hotkey="b" active={showBattlePanel} onClick={() => togglePanel('battle')} />
        </div>

        {isArchivePanelOpen && !activeLocalMapId && (
          <div className="absolute top-16 left-4 z-40 w-72 h-[calc(100%-5rem)] bg-neutral-950/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-3 border-b border-white/10 font-bold text-white flex justify-between items-center">
              <span>Доступные локации</span>
              <button onClick={() => setIsArchivePanelOpen(false)} className="text-neutral-500 hover:text-white">✕</button>
            </div>
            <div className="px-3 pb-1 text-[10px] text-neutral-500">
              Перетащите на карту или кликните для быстрого добавления. Двойной клик по узлу — провал в тактический режим.
            </div>
            <div className="flex-1 overflow-y-auto p-2 gap-2 flex flex-col">
              {availableLocations.length > 0 ? (
                availableLocations.map((loc: any) => <DraggableLocationCard key={loc.id} loc={loc} onQuickAdd={() => addLocationNode(loc)} />)
              ) : (
                <div className="p-4 text-neutral-500 text-sm italic">Все локации из Архива уже на карте или Архив пуст.</div>
              )}
            </div>
          </div>
        )}

        <ReactFlow
          nodes={flowNodes} edges={flowEdges}
          nodeTypes={nodeTypes} edgeTypes={edgeTypes}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={(_, n) => { if (n.type === 'token') return; setSelectedNodeId(n.id); setMenu(null); }}
          onNodeDoubleClick={handleNodeDoubleClick}
          onNodeContextMenu={onNodeContextMenu}
          onPaneClick={() => { setSelectedNodeId(null); setMenu(null); }}
          minZoom={0.2}
          maxZoom={2.5}
          fitView
        >
          <Background color="#141417" gap={25} size={1} />
          <Controls className="!bg-neutral-950/90 !border-white/10 !shadow-2xl" />
          {menu && (
            <ContextMenu
              menu={menu} nodes={nodes} onChangeType={changeNodeType}
              onAttach={attachToRegion} onDelete={deleteNode}
              onMoveParty={(nodeId) => { setPartyLocation(nodeId); setMenu(null); }}
              onClose={() => setMenu(null)}
            />
          )}
        </ReactFlow>

        {selectedNodeId && <Sidebar selectedNodeId={selectedNodeId} onClose={() => setSelectedNodeId(null)} />}
        {activeLocalMapId && isSpawnPanelOpen && (
          <TacticalSpawnPanel locationId={activeLocalMapId} onClose={() => setIsSpawnPanelOpen(false)} />
        )}
        {activeLocalMapId && !isSpawnPanelOpen && (
          <button
            onClick={() => setIsSpawnPanelOpen(true)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-neutral-950/90 border border-white/10 text-neutral-300 hover:text-white text-xs font-bold px-2 py-3 rounded-xl shadow-xl"
            title="Показать панель добавления сущностей"
          >
            ▶
          </button>
        )}

        {!isTacticalActive && openPanels.weather && <WeatherBanner />}
        {openPanels.calendar && <CalendarWidget />}
        {openPanels.weather && <WeatherWidget />}
        {showBattlePanel && activeLocalMapId && <BattleTrackerWidget locationId={activeLocalMapId} />}
      </div>

      <DragOverlay dropAnimation={null}>
        {draggedLocation ? (
          <div className="p-3 bg-indigo-600 rounded-xl border border-indigo-400 shadow-2xl shadow-black/50 pointer-events-none w-64 rotate-2 scale-105">
            <div className="text-white font-bold">{draggedLocation.name}</div>
            <div className="text-[10px] text-indigo-200 uppercase tracking-wider">Отпустите на карте</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default GameTable;
