'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import ReactFlow, { Background, Controls, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, addEdge, Connection, Edge, Node } from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { nodeTypes as legacyNodeTypes } from '@/components/workspace/CustomNodes';
import MapNode from '@/components/workspace/MapNode';
import TravelEdge from '@/components/workspace/CustomEdges';
import RouteEdge from '@/components/workspace/RouteEdge';
import ContextMenu from '@/components/workspace/ContextMenu';
import Sidebar from '@/components/workspace/Sidebar';
import CombatTracker from '@/components/workspace/CombatTracker';

const MapBoard = () => {
  const {
    nodes, edges, setNodes, setEdges,
    attachToRegion, setPartyLocation,
    locations, setActiveView,
    activeView, activeLocalMapId
  } = useWorkspaceStore();

  const [isArchivePanelOpen, setIsArchivePanelOpen] = useState(false);
  
  const nodeTypes = useMemo(() => ({ ...legacyNodeTypes, custom: MapNode }), []);
  const edgeTypes = useMemo(() => ({ travel: TravelEdge, custom: RouteEdge }), []);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ id: string, x: number, y: number, overContainers: Node[] } | null>(null);
  const [isCombatOpen, setIsCombatOpen] = useState(false);
  const paneRef = useRef<HTMLDivElement>(null);

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes(applyNodeChanges(changes, nodes)), [nodes, setNodes]);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges(applyEdgeChanges(changes, edges)), [edges, setEdges]);
  const onConnect = useCallback(
    (params: Connection | Edge) =>
      setEdges(addEdge({ ...params, type: 'custom', data: { days: 0, hours: 0 } }, edges)),
    [edges, setEdges],
  );
  const availableLocations = useMemo(() => {
    return Object.values(locations).filter(
      (loc) => !nodes.some((node) => node.data?.entityId === loc.id)
    );
  }, [locations, nodes]);

  const addLocationNode = (loc: any) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'custom',
      position: { x: 100, y: 100 },
      data: {
        title: loc.name,
        label: loc.name,
        mapImage: loc.mapImage || null,
        entityId: loc.id,
        description: loc.description || '',
      },
    };
    setNodes([...nodes, newNode]);
    setIsArchivePanelOpen(false);
  };

  const handleNodeDoubleClick = (node: Node) => {
    if (node.data?.entityId && locations[node.data.entityId]) {
      useWorkspaceStore.setState({ activeView: 'map', activeLocalMapId: node.data.entityId });
    }
  };

  const changeNodeType = useCallback((id: string, newType: string) => {
    setNodes(nodes.map((n) => {
      if (n.id !== id) return n;
      let style = n.style || {};
      if (newType === 'region') style = { ...style, width: Math.max(Number(style.width) || 400, 400), height: Math.max(Number(style.height) || 300, 300), zIndex: -1 };
      if (newType === 'area') style = { ...style, width: Math.max(Number(style.width) || 800, 800), height: Math.max(Number(style.height) || 600, 600), zIndex: -2 };
      return { ...n, type: newType, style };
    }));
    setMenu(null);
  }, [nodes, setNodes]);

  const deleteNode = useCallback((id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
    setEdges(edges.filter(e => e.source !== id && e.target !== id));
    setMenu(null);
  }, [nodes, edges, setNodes, setEdges]);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    if (!paneRef.current) return;
    const pane = paneRef.current.getBoundingClientRect();
    
    const overContainers = nodes.filter(n => {
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

  return (
    <div className="w-full h-full relative" ref={paneRef}>
      <div className="absolute top-4 left-4 z-40">
        <button
          onClick={() => setIsArchivePanelOpen(!isArchivePanelOpen)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-lg flex items-center gap-2"
        >
          <span>📁</span> Локации из Архива
        </button>
      </div>

      {isArchivePanelOpen && (
        <div className="absolute top-16 left-4 z-40 w-72 h-[calc(100%-5rem)] bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden flex flex-col">
          <div className="p-3 border-b border-zinc-800 font-bold text-white flex justify-between items-center">
            <span>Доступные локации</span>
            <button onClick={() => setIsArchivePanelOpen(false)} className="text-zinc-500 hover:text-white">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 gap-2 flex flex-col">
            {availableLocations.length > 0 ? (
              availableLocations.map((loc: any) => (
                <div
                  key={loc.id}
                  onClick={() => addLocationNode(loc)}
                  className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 cursor-pointer transition-colors"
                >
                  <div className="text-white font-medium">{loc.name}</div>
                  <div className="text-xs text-zinc-400">{loc.type || 'Локация'}</div>
                </div>
              ))
            ) : (
              <div className="p-4 text-zinc-500 text-sm italic">
                Все локации из Архива уже на карте или Архив пуст.
              </div>
            )}
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes} edges={edges}
        nodeTypes={nodeTypes} edgeTypes={edgeTypes}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
        onNodeClick={(_, n) => { setSelectedNodeId(n.id); setMenu(null); }}
        onNodeDoubleClick={(_, n) => handleNodeDoubleClick(n)}
        onNodeContextMenu={onNodeContextMenu} onPaneClick={() => { setSelectedNodeId(null); setMenu(null); }}
        fitView
      >
        <Background color="#18181b" gap={25} size={1} />
        <Controls className="!bg-zinc-900 !border-zinc-800" />
        {menu && (
          <ContextMenu
            menu={menu} nodes={nodes} onChangeType={changeNodeType}
            onAttach={attachToRegion} onDelete={deleteNode}
            onMoveParty={(nodeId) => { setPartyLocation(nodeId); setMenu(null); }}
            onClose={() => setMenu(null)}
          />
        )}
      </ReactFlow>

      {selectedNodeId && (
        <Sidebar selectedNodeId={selectedNodeId} onClose={() => setSelectedNodeId(null)} />
      )}
      
      {isCombatOpen && <CombatTracker onClose={() => setIsCombatOpen(false)} />}
    </div>
  );
};

export default MapBoard;
