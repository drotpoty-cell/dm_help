'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import ReactFlow, { Background, Controls, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, addEdge, Connection, Edge, Node } from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { nodeTypes } from '@/components/workspace/CustomNodes';
import TravelEdge from '@/components/workspace/CustomEdges';
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

  const [selectedLocationId, setSelectedLocationId] = useState<string>('');

  const memoNodeTypes = useMemo(() => nodeTypes, []);
  const memoEdgeTypes = useMemo(() => ({ travel: TravelEdge }), []);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ id: string, x: number, y: number, overContainers: Node[] } | null>(null);
  const [isCombatOpen, setIsCombatOpen] = useState(false);
  const paneRef = useRef<HTMLDivElement>(null);

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes(applyNodeChanges(changes, nodes)), [nodes, setNodes]);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges(applyEdgeChanges(changes, edges)), [edges, setEdges]);
  const onConnect = useCallback((params: Connection | Edge) => setEdges(addEdge({ ...params, type: 'travel', data: { days: 0, hours: 0 } }, edges)), [edges, setEdges]);

  const addLocationNode = () => {
    const location = locations[selectedLocationId];
    if (!location) return;
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'safe',
      position: { x: 100, y: 100 },
      data: { label: location.name, entityId: location.id, description: location.description || '' }
    };
    setNodes([...nodes, newNode]);
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
      <div className="absolute top-4 left-4 z-40 bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex flex-col gap-2">
        <select
          value={selectedLocationId}
          onChange={(e) => setSelectedLocationId(e.target.value)}
          className="bg-zinc-950 text-white text-xs p-1 rounded border border-zinc-700"
        >
          <option value="">Выберите локацию...</option>
          {Object.values(locations || {}).map((loc: any) => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>
        <button
          onClick={addLocationNode}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1 px-2 rounded"
        >
          + Добавить на канвас
        </button>
      </div>
      <ReactFlow
        nodes={nodes} edges={edges}
        nodeTypes={memoNodeTypes} edgeTypes={memoEdgeTypes}
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
