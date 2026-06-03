'use client'

import { useState, useCallback, useEffect, useRef, use, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import ReactFlow, { Background, Controls, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, addEdge, Connection, Edge, Node } from 'reactflow'
import 'reactflow/dist/style.css'
import { toast } from 'sonner'

import SettingsModal from '@/components/workspace/SettingsModal'
import TopBar from '@/components/workspace/TopBar'
import Sidebar from '@/components/workspace/Sidebar'
import ContextMenu from '@/components/workspace/ContextMenu'
import ArchiveBoard from '@/components/workspace/ArchiveBoard'
import CalendarBoard from '@/components/workspace/CalendarBoard'
import StoryBoard from '@/components/workspace/StoryBoard'
import WeatherBoard from '@/components/workspace/WeatherBoard' // НОВЫЙ ИМПОРТ
import EntityViewerModal from '@/components/workspace/EntityViewerModal'
import Scratchpad from '@/components/workspace/Scratchpad'
import CombatTracker from '@/components/workspace/CombatTracker'
import { nodeTypes } from '@/components/workspace/CustomNodes'
import TravelEdge from '@/components/workspace/CustomEdges'

import { useWorkspaceStore } from '@/store/useWorkspaceStore' 

export default function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  
  const { 
    nodes, edges, currentDay, currentHour,
    setNodes, setEdges, setLibrary, advanceTime,
    attachToRegion,
    partyLocationId, setPartyLocation 
  } = useWorkspaceStore()

  const memoNodeTypes = useMemo(() => nodeTypes, [])
  const memoEdgeTypes = useMemo(() => ({ travel: TravelEdge }), [])

  const locations = useWorkspaceStore(state => state.locations)
  const unmappedLocations = Object.values(locations).filter(
    loc => !nodes.some(n => n.data.entityId === loc.id)
  )

  const addNodeFromArchive = (location: any) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'safe',
      position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      data: {
        label: location.name || location.title,
        description: location.description || '',
        entityId: location.id,
        needsUpdate: false
      }
    }
    setNodes([...nodes, newNode])
  }

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [menu, setMenu] = useState<{ id: string, x: number, y: number, overContainers: Node[] } | null>(null)
  
  // ИСПРАВЛЕНО: Добавили 'weather' в типы видов
  const [viewMode, setViewMode] = useState<'map' | 'kanban' | 'archive' | 'calendar' | 'story' | 'weather'>('map')
  
  const [isCombatOpen, setIsCombatOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const paneRef = useRef<HTMLDivElement>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const loadMap = async () => {
      const { data, error } = await supabase.from('campaigns').select('map_data').eq('id', id).single()
      if (error) toast.error('Ошибка загрузки', { description: error.message })
      if (data?.map_data) {
        setNodes(data.map_data.nodes || [])
        setEdges((data.map_data.edges || []).map((e: any) => ({ ...e, type: 'travel' })))
        setLibrary(data.map_data.library || {})
        
        useWorkspaceStore.setState({ 
          currentDay: data.map_data.currentDay || 1, 
          currentHour: data.map_data.currentHour || 8,
          partyLocationId: data.map_data.partyLocationId || null, 
          story: data.map_data.story || [],
          scratchpad: data.map_data.scratchpad || '',
          weather: data.map_data.weather || { mode: 'dynamic', condition: 'Ясно', temp: 20, interval: 24, hoursSinceChange: 0, climate: 'temperate' }
        })
      }
      setIsLoading(false)
    }
    loadMap()
  }, [id, supabase, setNodes, setEdges, setLibrary])

  const persistMap = useCallback(async ({ silent, markSaving }: { silent: boolean; markSaving: boolean }) => {
    if (markSaving) setIsSaving(true)
    try {
      const state = useWorkspaceStore.getState()
      const dbLibrary = {
        heroes: Object.values(state.heroes),
        npcs: Object.values(state.npcs),
        quests: Object.values(state.quests),
        locations: Object.values(state.locations),
        secrets: Object.values(state.secrets),
        loot: Object.values(state.loot),
        events: Object.values(state.events)
      }

      const { error } = await supabase
        .from('campaigns')
        .update({
          map_data: {
            nodes: state.nodes,
            edges: state.edges,
            currentDay: state.currentDay,
            currentHour: state.currentHour,
            weather: state.weather,
            partyLocationId: state.partyLocationId,
            library: dbLibrary,
            story: state.story,
            scratchpad: state.scratchpad
          }
        })
        .eq('id', id)

      if (!silent) {
        if (error) toast.error('Ошибка сохранения', { description: error.message })
        else toast.success('Мир успешно сохранен')
      }
    } catch (err) {
      if (!silent) toast.error('Ошибка сохранения', { description: err instanceof Error ? err.message : 'Неизвестная ошибка' })
    } finally {
      if (markSaving) setIsSaving(false)
    }
  }, [id, supabase])

  const saveMap = useCallback(async () => persistMap({ silent: false, markSaving: true }), [persistMap])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void saveMap()
        return
      }
      if (e.key === 'Escape') {
        setIsCombatOpen(false)
        useWorkspaceStore.getState().setViewedEntityId(null)
        setMenu(null)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [saveMap])

  useEffect(() => {
    if (isLoading) return
    const unsub = useWorkspaceStore.subscribe(() => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = setTimeout(() => persistMap({ silent: true, markSaving: false }), 5000)
    })
    return () => {
      unsub()
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [isLoading, persistMap])

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes(applyNodeChanges(changes, nodes)), [nodes, setNodes])
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges(applyEdgeChanges(changes, edges)), [edges, setEdges])
  const onConnect = useCallback((params: Connection | Edge) => setEdges(addEdge({ ...params, type: 'travel', data: { days: 0, hours: 0 } }, edges)), [edges, setEdges])

  const changeNodeType = useCallback((id: string, newType: string) => { 
    setNodes(nodes.map((n) => {
      if (n.id !== id) return n;
      let style = n.style || {};
      if (newType === 'region') style = { ...style, width: Math.max(Number(style.width) || 400, 400), height: Math.max(Number(style.height) || 300, 300), zIndex: -1 };
      if (newType === 'area') style = { ...style, width: Math.max(Number(style.width) || 800, 800), height: Math.max(Number(style.height) || 600, 600), zIndex: -2 };
      return { ...n, type: newType, style };
    }))
    setMenu(null)
  }, [nodes, setNodes])
  
  const deleteNode = useCallback((id: string) => { 
    setNodes(nodes.filter(n => n.id !== id))
    setEdges(edges.filter(e => e.source !== id && e.target !== id))
    // Чистим dangling ссылки в NPC/Quest, если они были привязаны к удаляемому узлу
    useWorkspaceStore.setState((state) => {
      let npcsChanged = false
      let questsChanged = false

      const nextNpcs = { ...state.npcs }
      for (const npc of Object.values(state.npcs)) {
        if (npc.locationId === id) {
          nextNpcs[npc.id] = { ...npc, locationId: null }
          npcsChanged = true
        }
      }

      const nextQuests = { ...state.quests }
      for (const quest of Object.values(state.quests)) {
        if (quest.locationId === id) {
          nextQuests[quest.id] = { ...quest, locationId: null }
          questsChanged = true
        }
      }

      if (!npcsChanged && !questsChanged) return {}
      return { npcs: npcsChanged ? nextNpcs : state.npcs, quests: questsChanged ? nextQuests : state.quests }
    })
    setMenu(null)
  }, [nodes, edges, setNodes, setEdges])

  const addNewNode = (type: string) => {
    const entityId = `ent-${Date.now()}`
    
    useWorkspaceStore.getState().addEntity('locations', {
      id: entityId, name: type === 'area' ? 'Новая область' : type === 'region' ? 'Новый регион' : 'Новая локация', description: ''
    })

    const newNode: Node = { 
      id: `node-${Date.now()}`, type, position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }, 
      data: { label: type === 'area' ? 'Новая область' : type === 'region' ? 'Новый регион' : 'Новая локация', description: '', entityId: entityId, needsUpdate: false }, 
      style: type === 'area' ? { width: 800, height: 600, zIndex: -2 } : type === 'region' ? { width: 400, height: 300, zIndex: -1 } : undefined 
    }
    setNodes([...nodes, newNode])
  }

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault()
    if (!paneRef.current) return
    const pane = paneRef.current.getBoundingClientRect()
    
    const overContainers = nodes.filter(n => {
      if ((n.type !== 'region' && n.type !== 'area') || n.id === node.id) return false
      
      const rLeft = n.position.x
      const rRight = n.position.x + (n.width || (n.type === 'area' ? 800 : 400))
      const rTop = n.position.y
      const rBottom = n.position.y + (n.height || (n.type === 'area' ? 600 : 300))
      
      const nCenterX = node.position.x + (node.width || 160) / 2
      const nCenterY = node.position.y + (node.height || 60) / 2
      
      return nCenterX >= rLeft && nCenterX <= rRight && nCenterY >= rTop && nCenterY <= rBottom
    })

    setMenu({ id: node.id, x: event.clientX - pane.left, y: event.clientY - pane.top, overContainers })
  }, [nodes])

  if (isLoading) return <div className="h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 font-mono text-xs uppercase tracking-widest">Loading World...</div>

  return (
    <div className="h-screen w-screen bg-zinc-950 flex flex-col overflow-hidden text-zinc-200 font-sans relative">
      <TopBar 
        campaignId={id} day={currentDay} hour={currentHour} 
        viewMode={viewMode} onViewChange={setViewMode} 
        onTimeChange={advanceTime} onSave={saveMap} onSettingsOpen={() => setIsSettingsOpen(true)} isSaving={isSaving} 
      />
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}

      <div className="flex-1 flex relative">
        {viewMode === 'archive' && <ArchiveBoard />}
        {viewMode === 'calendar' && <CalendarBoard />}
        {viewMode === 'story' && <StoryBoard />}
        {/* НОВАЯ ВКЛАДКА ЭКОЛОГИИ */}
        {viewMode === 'weather' && <WeatherBoard />}

        {viewMode === 'map' && (
          <>
            <div className="w-64 border-r border-zinc-900 bg-zinc-950 flex flex-col z-20 shrink-0 overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-zinc-900 bg-zinc-900/20">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">Создать пустое</div>
                <div className="flex gap-4 flex-wrap">
                  <button onClick={() => addNewNode('safe')} className="w-8 h-8 rounded-full border-2 border-emerald-500/50 bg-emerald-500/10 hover:border-emerald-500 hover:bg-emerald-500/20 transition-all shadow-lg" title="Безопасно"></button>
                  <button onClick={() => addNewNode('tense')} className="w-8 h-8 rounded-md border-2 border-amber-500/50 bg-amber-500/10 hover:border-amber-500 hover:bg-amber-500/20 transition-all shadow-lg" title="Напряжение"></button>
                  <button onClick={() => addNewNode('hostile')} className="w-8 h-8 border-2 border-red-500/50 bg-red-500/10 hover:border-red-500 hover:bg-red-500/20 transition-all shadow-lg" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} title="Враждебно"></button>
                  <button onClick={() => addNewNode('mystery')} className="w-8 h-8 rounded-full border-2 border-dashed border-zinc-500 bg-zinc-800/50 hover:border-zinc-300 transition-all shadow-lg" title="Слух"></button>
                  <button onClick={() => addNewNode('region')} className="w-8 h-8 rounded-xl border-2 border-dashed border-indigo-600 bg-indigo-900/20 hover:border-indigo-400 hover:text-indigo-400 transition-all flex items-center justify-center text-xs text-zinc-500 font-black shadow-lg" title="Регион">R</button>
                  <button onClick={() => addNewNode('area')} className="w-8 h-8 rounded-xl border-[3px] border-solid border-purple-600 bg-purple-900/20 hover:border-purple-400 hover:text-purple-400 transition-all flex items-center justify-center text-xs text-zinc-500 font-black shadow-lg" title="Область">A</button>
                </div>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-5 pb-2">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Из Архива</div>
                </div>
                <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2 mt-2 custom-scrollbar">
                  {unmappedLocations.length === 0 ? (
                    <div className="text-zinc-600 text-[10px] uppercase font-bold text-center py-6 border border-dashed border-zinc-800 rounded-lg">
                      Все локации уже на карте
                    </div>
                  ) : (
                    unmappedLocations.map(loc => (
                      <div key={loc.id} className="bg-zinc-900/40 border border-zinc-800 hover:border-indigo-500/50 p-3 rounded-xl flex justify-between items-center group transition-colors">
                        <span className="text-xs text-zinc-300 font-bold truncate pr-2">{loc.name || loc.title}</span>
                        <button 
                          onClick={() => addNodeFromArchive(loc)} 
                          className="text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-500 px-2 py-1 rounded-md text-[9px] uppercase font-black transition-all opacity-0 group-hover:opacity-100"
                          title="Добавить на карту"
                        >
                          +
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div ref={paneRef} className="flex-1 relative bg-[#09090b]">
              <ReactFlow 
                nodes={nodes} edges={edges} 
                nodeTypes={memoNodeTypes} edgeTypes={memoEdgeTypes}
                onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
                onNodeClick={(_, n) => { setSelectedNodeId(n.id); setMenu(null); }}
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
                  />
                )}
              </ReactFlow>

              {/* КНОПКА БОЯ ВНИЗУ СЛЕВА */}
              <button
                onClick={() => setIsCombatOpen(!isCombatOpen)}
                className="absolute bottom-6 left-6 z-30 bg-red-950/90 border-2 border-red-900/50 hover:border-red-500 hover:bg-red-900 text-red-500 hover:text-white px-6 py-3.5 rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.15)] hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all flex items-center gap-3 backdrop-blur-md group"
              >
                <span className="text-xl group-hover:scale-125 transition-transform drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]">⚔️</span>
                <span className="text-xs font-black uppercase tracking-widest drop-shadow-md">Боевой Режим</span>
              </button>
            </div>

            {selectedNodeId && (
               <Sidebar selectedNodeId={selectedNodeId} onClose={() => setSelectedNodeId(null)} />
            )}
          </>
        )}
      </div>
      
      {/* ГЛОБАЛЬНЫЕ КОМПОНЕНТЫ */}
      {isCombatOpen && <CombatTracker onClose={() => setIsCombatOpen(false)} />}
      <EntityViewerModal />
      <Scratchpad />
      
    </div>
  )
}