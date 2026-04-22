'use client'

import { useState, useCallback, useEffect, useRef, use } from 'react'
import { createClient } from '@/utils/supabase/client'
import ReactFlow, { Background, Controls, MiniMap, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, addEdge, Connection, Edge, Node } from 'reactflow'
import 'reactflow/dist/style.css'

// Компоненты интерфейса
import TopBar from '@/components/workspace/TopBar'
import Sidebar from '@/components/workspace/Sidebar'
import EntityArchive from '@/components/workspace/EntityArchive'
import ContextMenu from '@/components/workspace/ContextMenu'
import KanbanBoard from '@/components/workspace/KanbanBoard'

import { nodeTypes } from '@/components/workspace/CustomNodes'
import TravelEdge from '@/components/workspace/CustomEdges'

const edgeTypes = { travel: TravelEdge }

export default function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [currentDay, setCurrentDay] = useState(1)
  const [currentHour, setCurrentHour] = useState(8)
  const [library, setLibrary] = useState({ npcs: [] as any[], quests: [] as any[], locations: [] as any[] })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [menu, setMenu] = useState<{ id: string, x: number, y: number, overRegions: Node[] } | null>(null)
  
  const [viewMode, setViewMode] = useState<'map' | 'kanban'>('map')

  const paneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadMap = async () => {
      const { data } = await supabase.from('campaigns').select('map_data').eq('id', id).single()
      if (data?.map_data) {
        setNodes(data.map_data.nodes || [])
        const loadedEdges = (data.map_data.edges || []).map((e: any) => ({ ...e, type: 'travel' }))
        setEdges(loadedEdges)
        setCurrentDay(data.map_data.currentDay || 1)
        setCurrentHour(data.map_data.currentHour || 8)
        setLibrary(data.map_data.library || { npcs: [], quests: [], locations: [] })
      }
      setIsLoading(false)
    }
    loadMap()
  }, [id, supabase])

  const saveMap = async () => {
    setIsSaving(true)
    await supabase.from('campaigns').update({ map_data: { nodes, edges, currentDay, currentHour, library } }).eq('id', id)
    setIsSaving(false)
  }

  const handleTimeAdvance = (addedHours: number) => {
    let newHour = currentHour + addedHours
    let daysPassed = 0
    if (newHour >= 24) { daysPassed = Math.floor(newHour / 24); newHour = newHour % 24; }
    else if (newHour < 0) {
      if (currentDay > 1) { daysPassed = -1; newHour = 24 + newHour; }
      else newHour = 0;
    }
    setCurrentHour(newHour); setCurrentDay(prev => prev + daysPassed);
  }

  const handleUpdateQuestStatusGlobal = (nodeId: string, questId: string, newStatus: string) => {
    setNodes(nds => nds.map(n => {
      if (n.id === nodeId) {
        const updatedQuests = n.data.quests.map((q: any) => {
          if (q.id === questId) {
            const startDay = (newStatus === 'active' && q.status !== 'active' && !q.startDay) 
              ? currentDay 
              : q.startDay;
            return { ...q, status: newStatus, startDay }
          }
          return q
        })
        return { ...n, data: { ...n.data, quests: updatedQuests } }
      }
      return n
    }))
  }

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), [])
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), [])
  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, type: 'travel', animated: true, data: { days: 0, hours: 0 } }, eds)), [])

  const addNewNode = (type: string) => {
    const newNode: Node = { id: `node-${Date.now()}`, type, position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }, data: { label: 'Новая локация', description: '', npcs: '', quests: [], secrets: '', loot: '' }, ...(type === 'region' ? { style: { width: 500, height: 400, zIndex: -1 } } : {}) }
    setNodes((nds) => [...nds, newNode])
  }

  const updateNodeData = (nodeId: string, field: string, value: any) => { 
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, [field]: value } } : n)) 
  }
  
  const updateLibrary = (category: string, items: any[]) => { 
    setLibrary(prev => ({ ...prev, [category]: items })) 
  }
  
  const placeOnMap = (entity: any, category: string) => {
    if (category === 'locations') {
      const newNode: Node = {
        id: `node-${Date.now()}`, type: 'safe',
        position: { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 100 },
        data: { label: entity.name, description: entity.description || '', entityId: entity.id, npcs: '', quests: [], secrets: '', loot: '' }
      }
      setNodes(nds => [...nds, newNode])
    } 
    else if (category === 'npcs') {
      if (!selectedNodeId) { alert('Сначала выберите локацию на карте!'); return; }
      const updatedNpcs = library.npcs.map((npc: any) => npc.id === entity.id ? { ...npc, locationId: selectedNodeId } : npc)
      updateLibrary('npcs', updatedNpcs)
      alert(`Персонаж "${entity.name}" прибыл в локацию!`)
    } 
    else if (category === 'quests') {
      if (!selectedNodeId) { alert('Сначала выберите локацию на карте!'); return; }
      setNodes(nds => nds.map(n => {
        if (n.id === selectedNodeId) {
          const currentQuests = Array.isArray(n.data.quests) ? n.data.quests : []
          const newQuest = { id: `quest-${Date.now()}`, title: entity.name, hook: entity.description || '', description: '', giver: '', deadline: 3, startDay: null, status: 'available', reward: '', consequence: '' }
          return { ...n, data: { ...n.data, quests: [...currentQuests, newQuest] } }
        }
        return n
      }))
      alert(`Квест "${entity.name}" добавлен в локацию!`)
    }
  }

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault()
    if (!paneRef.current) return
    const pane = paneRef.current.getBoundingClientRect()
    const overRegions = nodes.filter(n => {
      if (n.type !== 'region' || n.id === node.id) return false
      const rx = n.position.x, ry = n.position.y, rw = n.width || 500, rh = n.height || 400
      const nx = node.position.x + (node.width || 160) / 2, ny = node.position.y + (node.height || 60) / 2
      return nx >= rx && nx <= rx + rw && ny >= ry && ny <= ry + rh
    })
    setMenu({ id: node.id, x: event.clientX - pane.left, y: event.clientY - pane.top, overRegions })
  }, [nodes])

  // ВОТ ЭТИ ФУНКЦИИ Я СЛУЧАЙНО "ОБРЕЗАЛ" В ПРОШЛЫЙ РАЗ:
  const changeNodeType = (id: string, newType: string) => {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, type: newType, style: newType === 'region' ? { width: 500, height: 400, zIndex: -1 } : {} } : n))
    setMenu(null)
  }
  
  const attachToParent = (childId: string, parentId: string | null) => {
    setNodes((nds) => nds.map((n) => n.id === childId ? { ...n, parentId: parentId || undefined, extent: parentId ? 'parent' : undefined } : n))
    setMenu(null)
  }
  
  const deleteNode = (id: string) => { 
    setNodes(nds => nds.filter(n => n.id !== id))
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id))
    setMenu(null) 
  }

  if (isLoading) return <div className="h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 font-mono text-xs uppercase tracking-widest">Loading World...</div>

  return (
    <div className="h-screen w-screen bg-zinc-950 flex flex-col overflow-hidden text-zinc-200 font-sans relative">
      
      <TopBar 
        campaignId={id} day={currentDay} hour={currentHour} 
        viewMode={viewMode} onViewChange={setViewMode}
        onTimeChange={handleTimeAdvance} onSave={saveMap} isSaving={isSaving} 
      />

      <div className="flex-1 flex relative">
        <EntityArchive library={library} onUpdateLibrary={updateLibrary} onPlaceOnMap={placeOnMap} />

        {viewMode === 'map' ? (
          <>
            <div className="w-16 border-r border-zinc-900 bg-zinc-950/80 flex flex-col items-center py-6 gap-6 z-20 shrink-0">
              <button onClick={() => addNewNode('safe')} className="w-8 h-8 rounded-full border border-emerald-500/50 bg-emerald-500/10 hover:border-emerald-500 transition-colors" title="Безопасно" />
              <button onClick={() => addNewNode('tense')} className="w-8 h-8 rounded-sm border border-amber-500/50 bg-amber-500/10 hover:border-amber-500 transition-colors" title="Напряжение" />
              <button onClick={() => addNewNode('hostile')} className="w-8 h-8 border border-red-500/50 bg-red-500/10 hover:border-red-500 transition-colors" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} title="Враждебно" />
              <button onClick={() => addNewNode('mystery')} className="w-8 h-8 rounded-full border border-dashed border-zinc-500 hover:border-zinc-300 transition-colors" title="Слух" />
              <div className="w-8 h-px bg-zinc-800"></div>
              <button onClick={() => addNewNode('region')} className="w-8 h-6 rounded-md border border-dashed border-zinc-500 bg-zinc-800/30 hover:border-zinc-400 transition-colors flex items-center justify-center text-[10px] text-zinc-500 font-bold" title="Регион">R</button>
            </div>

            <div ref={paneRef} className="flex-1 relative bg-[#09090b]">
              <ReactFlow 
                nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
                onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
                onNodeClick={(_, n) => { setSelectedNodeId(n.id); setMenu(null); }}
                onNodeContextMenu={onNodeContextMenu}
                onPaneClick={() => { setSelectedNodeId(null); setMenu(null); }}
                fitView
              >
                <Background color="#18181b" gap={25} size={1} />
                <Controls className="!bg-zinc-900 !border-zinc-800 !fill-zinc-400" />
                <ContextMenu menu={menu} nodes={nodes} onChangeType={changeNodeType} onAttach={attachToParent} onDelete={deleteNode} />
              </ReactFlow>
            </div>

            {selectedNodeId && (
               <Sidebar 
                 selectedNode={nodes.find(n => n.id === selectedNodeId)} nodes={nodes} library={library} 
                 onUpdateLibrary={updateLibrary} onClose={() => setSelectedNodeId(null)} 
                 onUpdateNode={updateNodeData} currentDay={currentDay}
               />
            )}
          </>
        ) : (
          <KanbanBoard 
            nodes={nodes} 
            currentDay={currentDay} 
            onUpdateQuestStatus={handleUpdateQuestStatusGlobal} 
          />
        )}
      </div>
    </div>
  )
}