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

import { toast } from 'sonner';

import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { nodeTypes as legacyNodeTypes } from '@/components/workspace/CustomNodes';
import MapNode from '@/components/workspace/MapNode';
import TravelEdge from '@/components/workspace/CustomEdges';
import RouteEdge from '@/components/workspace/RouteEdge';
import ContextMenu from '@/components/workspace/ContextMenu';
import Sidebar from '@/components/workspace/Sidebar';
import TacticalCanvas from '@/components/workspace/TacticalCanvas';
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

type PanelKey = 'weather' | 'calendar';

/** Кнопка-тумблер плавающей панели на тулбаре. */
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

/** Эти "статусы" из ContextMenu — это данные (`data.mode`) на карточке MapNode, а не
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
    activeLocalMapId, diveIntoMap, closeLocalMap,
  } = useWorkspaceStore();

  const [isArchivePanelOpen, setIsArchivePanelOpen] = useState(false);
  const [openPanels, setOpenPanels] = useState<Record<PanelKey, boolean>>({ weather: true, calendar: true });
  const togglePanel = useCallback((key: PanelKey) => setOpenPanels((p) => ({ ...p, [key]: !p[key] })), []);

  const nodeTypes = useMemo(() => ({ ...legacyNodeTypes, custom: MapNode }), []);
  // Блок 3: новые связи по умолчанию создаются как 'travel' (TravelEdge) — полноценный
  // интерактивный бейдж времени в пути с popover-редактированием и генератором событий в
  // пути, а не статичная 'custom' (RouteEdge), которая только показывала цифру без
  // возможности её поменять. RouteEdge остаётся зарегистрированным для старых сохранений.
  const edgeTypes = useMemo(() => ({ travel: TravelEdge, custom: RouteEdge }), []);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ id: string, x: number, y: number, overContainers: Node[] } | null>(null);
  const paneRef = useRef<HTMLDivElement>(null);

  const reactFlowInstance = useReactFlow();
  const [draggedLocationId, setDraggedLocationId] = useState<string | null>(null);
  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Блок 1: тактический режим — полностью отдельный fullscreen-слой (см. TacticalCanvas.tsx),
  // а не расширение узла на этом же канвасе. Глобальный стол при этом не размонтируется —
  // он остаётся позади, просто скрывается под сильным blur и перестаёт быть интерактивным
  // (см. className ниже), чтобы клики/скролл не проваливались на него сквозь оверлей.
  const isTacticalActive = !!activeLocalMapId;

  // Блок 3: сохранение фокуса камеры глобального слоя. Поскольку глобальный канвас во время
  // тактического режима просто блюрится/блокируется (Блок 1), а не размонтируется, его
  // viewport физически не может измениться, пока ГМ внутри тактики — значит, "сохранить
  // прямо перед diveIntoMap" эквивалентно "сохранить в момент, когда activeLocalMapId только
  // что стал не-null". Отслеживаем именно этот переход, а не оборачиваем каждый отдельный
  // вызов diveIntoMap — точек входа несколько (двойной клик, ContextMenu).
  const savedViewportRef = useRef<{ x: number; y: number; zoom: number } | null>(null);
  const wasTacticalRef = useRef(false);
  useEffect(() => {
    if (activeLocalMapId && !wasTacticalRef.current) {
      savedViewportRef.current = reactFlowInstance.getViewport();
    } else if (!activeLocalMapId && wasTacticalRef.current && savedViewportRef.current) {
      reactFlowInstance.setViewport(savedViewportRef.current, { duration: 500 });
    }
    wasTacticalRef.current = !!activeLocalMapId;
  }, [activeLocalMapId, reactFlowInstance]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes(applyNodeChanges(changes, nodes)),
    [nodes, setNodes],
  );
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges(applyEdgeChanges(changes, edges)), [edges, setEdges]);
  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges(addEdge({ ...params, type: 'travel', data: { days: 0, hours: 0 } }, edges)),
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

  // Блок 1: двойной клик по локации — единственный вход в тактический режим. Никакой
  // привязки к камере/зуму глобального канваса — открывается независимый fullscreen-слой.
  const handleNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type !== 'custom') return;
    const locationKey = (node.data as any)?.entityId || node.id;
    diveIntoMap(locationKey);
  }, [diveIntoMap]);

  // Блок 2: setPartyLocation (createSystemSlice.ts) уже сам умеет автоматически двигать
  // мировое время вперёд на время в пути по ребру (с поправкой на непогоду) — просто делал
  // это молча. Здесь оборачиваем вызов, чтобы "предложить" результат ГМу явно: тост с
  // итогом + кнопка "Отменить время", если поездка оказалась не той, что он ожидал.
  const handleMoveParty = useCallback((nodeId: string) => {
    const before = useWorkspaceStore.getState();
    const beforeDay = before.currentDay;
    const beforeHour = before.currentHour;
    setPartyLocation(nodeId);
    const after = useWorkspaceStore.getState();
    const deltaHours = (after.currentDay - beforeDay) * 24 + (after.currentHour - beforeHour);
    if (deltaHours > 0) {
      const days = Math.floor(deltaHours / 24);
      const hours = deltaHours % 24;
      const parts = [days > 0 ? `${days} дн.` : null, hours > 0 ? `${hours} ч.` : null].filter(Boolean).join(' ');
      toast(`🕐 Партия в пути: время сдвинуто на ${parts} — теперь День ${after.currentDay}, ${String(after.currentHour).padStart(2, '0')}:00`, {
        action: {
          label: 'Отменить время',
          onClick: () => useWorkspaceStore.getState().advanceTime(-deltaHours),
        },
      });
    }
    setMenu(null);
  }, [setPartyLocation]);

  const changeNodeType = useCallback((id: string, newType: string) => {
    setNodes(nodes.map((n) => {
      if (n.id !== id) return n;
      if (LOCATION_MODES.has(newType)) {
        // Раньше это меняло n.type на легаси-компонент (safe/tense/hostile/mystery из
        // CustomNodes.tsx) с совершенно другой версткой — карточка "прыгала" и теряла
        // тактильный дизайн. Теперь статус — это просто данные на той же карточке MapNode.
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

  // Хоткеи тулбара: переключение плавающих панелей, Escape — выйти из тактического режима
  // (Блок 1). Игнорируем нажатия, когда фокус в текстовом поле/редакторе.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      if (e.key === 'Escape' && activeLocalMapId) {
        closeLocalMap();
        return;
      }
      const key = e.key.toLowerCase();
      if (key === 'w') togglePanel('weather');
      if (key === 'c') togglePanel('calendar');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeLocalMapId, closeLocalMap, togglePanel]);

  const draggedLocation = draggedLocationId ? locations[draggedLocationId] : null;

  return (
    <DndContext sensors={dndSensors} onDragStart={handleDndDragStart} onDragEnd={handleDndDragEnd}>
      <div className="w-full h-full relative bg-neutral-950 overflow-hidden" ref={paneRef}>
        {/* Тулбар: локации из Архива (только на глобальной карте) + тумблеры плавающих панелей.
            Остаётся поверх blur'а даже в тактическом режиме — панели погоды/календаря/боя
            общие для всего стола, не только для глобального слоя. */}
        <div className="absolute top-4 left-4 z-[60] flex items-center gap-2 flex-wrap">
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
        </div>

        {isArchivePanelOpen && !activeLocalMapId && (
          <div className="absolute top-16 left-4 z-[60] w-72 h-[calc(100%-5rem)] bg-neutral-950/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
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

        {/* Блок 1: глобальный слой уходит под сильный backdrop-blur и перестаёт быть
            интерактивным, пока открыт тактический режим — визуально "детективная доска"
            остаётся видна позади, но не мешает и не путается с тактической сеткой поверх. */}
        <div
          className={`absolute inset-0 transition-all duration-500 ${
            isTacticalActive ? 'blur-xl scale-[0.98] opacity-30 pointer-events-none' : ''
          }`}
        >
          <ReactFlow
            nodes={nodes} edges={edges}
            nodeTypes={nodeTypes} edgeTypes={edgeTypes}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
            onNodeClick={(_, n) => { setSelectedNodeId(n.id); setMenu(null); }}
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
                onMoveParty={handleMoveParty}
                onClose={() => setMenu(null)}
              />
            )}
          </ReactFlow>

          {selectedNodeId && <Sidebar selectedNodeId={selectedNodeId} onClose={() => setSelectedNodeId(null)} />}
        </div>

        {/* Блок 1: изолированный fullscreen тактический слой. key=activeLocalMapId гарантирует
            чистый remount внутреннего состояния (тулбары, драг-оверрайды) при проваливании
            на следующий уровень вложенности (Блок 2). */}
        {activeLocalMapId && <TacticalCanvas key={activeLocalMapId} locationId={activeLocalMapId} />}

        {!isTacticalActive && openPanels.weather && <WeatherBanner />}
        {openPanels.calendar && <CalendarWidget />}
        {openPanels.weather && <WeatherWidget />}
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
