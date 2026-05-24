'use client'

import { create } from 'zustand'
import { Node, Edge } from 'reactflow'
import { 
  WorkspaceState, 
  LibraryCategory, 
  LibraryState, 
  NPC, 
  Quest, 
  BaseEntity, 
  ClimateType 
} from '@/types/workspace'

export * from '@/types/workspace'

const cleanLocationLinks = ({
  npcs,
  quests,
  nodeId
}: {
  npcs: Record<string, NPC>
  quests: Record<string, Quest>
  nodeId: string
}) => {
  let npcsChanged = false
  let questsChanged = false

  const nextNpcs: Record<string, NPC> = { ...npcs }
  for (const npc of Object.values(npcs)) {
    if (npc.locationId === nodeId) {
      nextNpcs[npc.id] = { ...npc, locationId: null }
      npcsChanged = true
    }
  }

  const nextQuests: Record<string, Quest> = { ...quests }
  for (const quest of Object.values(quests)) {
    if (quest.locationId === nodeId) {
      nextQuests[quest.id] = { ...quest, locationId: null }
      questsChanged = true
    }
  }

  return {
    npcs: npcsChanged ? nextNpcs : npcs,
    quests: questsChanged ? nextQuests : quests,
    changed: npcsChanged || questsChanged
  }
}

const updateInLibrary = <K extends keyof LibraryState>(
  state: WorkspaceState,
  category: K,
  id: string,
  updater: (prev: any) => any
) => {
  const record = state[category] as Record<string, any>
  const prev = record[id]
  if (!prev) return null

  const next = updater(prev)
  return {
    ...state,
    [category]: { ...record, [id]: next }
  } as WorkspaceState
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  nodes: [],
  edges: [],
  story: [],
  currentDay: 1,
  currentHour: 8,
  
  weather: { mode: 'disabled', condition: 'Ясно', temp: 20, interval: 24, hoursSinceChange: 0, climate: 'temperate', forecast: {} },
  setWeather: (newWeather) => set(state => ({ weather: { ...state.weather, ...newWeather } })),

  generateForecast: (daysCount) => set(state => {
    const newForecast = { ...state.weather.forecast };
    const startDay = state.currentDay;
    
    const conditionsMap = {
      temperate: ['Ясно', 'Ясно', 'Облачно', 'Облачно', 'Дождь', 'Гроза', 'Туман'],
      winter: ['Ясно', 'Облачно', 'Снег', 'Снег', 'Вьюга', 'Туман'],
      desert: ['Ясно', 'Ясно', 'Ясно', 'Песчаная буря', 'Облачно'],
      tropical: ['Ясно', 'Дождь', 'Ливень', 'Гроза', 'Туман']
    };

    const baseTemp = { temperate: 15, winter: -15, desert: 35, tropical: 28 }[state.weather.climate];

    for (let i = 0; i < daysCount; i++) {
      const dayNum = startDay + i;
      const options = conditionsMap[state.weather.climate] || conditionsMap.temperate;
      newForecast[dayNum] = {
        condition: options[Math.floor(Math.random() * options.length)],
        temp: baseTemp + (Math.floor(Math.random() * 10) - 5)
      };
    }
    return { weather: { ...state.weather, forecast: newForecast } };
  }),

  partyLocationId: null,

  setPartyLocation: (newLocationId) => {
    const state = get()
    const currentLocationId = state.partyLocationId
    
    if (currentLocationId && newLocationId && currentLocationId !== newLocationId) {
      const edge = state.edges.find(e => 
        (e.source === currentLocationId && e.target === newLocationId) || 
        (e.target === currentLocationId && e.source === newLocationId)
      )

      if (edge && edge.data) {
        let travelDays = edge.data.days || 0
        let travelHours = edge.data.hours || 0
        
        if (state.weather.mode !== 'disabled') {
          const badWeather = ['Дождь', 'Снег', 'Гроза', 'Туман', 'Песчаная буря', 'Вьюга']
          if (badWeather.includes(state.weather.condition)) {
            const multiplier = ['Гроза', 'Вьюга', 'Туман', 'Песчаная буря'].includes(state.weather.condition) ? 2 : 1.5;
            travelDays = Math.ceil(travelDays * multiplier)
            travelHours = Math.ceil(travelHours * multiplier)
          }
        }

        const totalHoursToAdd = (travelDays * 24) + travelHours

        if (totalHoursToAdd > 0) {
          state.advanceTime(totalHoursToAdd)
        }
      }
    }
    
    set({ partyLocationId: newLocationId })
  },

  heroes: {}, npcs: {}, quests: {}, locations: {}, secrets: {}, loot: {}, events: {},
  viewedEntityId: null,
  scratchpad: '',
  isScratchpadOpen: false,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  updateEdgeData: (edgeId, data) => set((state) => ({
    edges: state.edges.map(e => e.id === edgeId ? { ...e, data: { ...e.data, ...data } } : e)
  })),

  setStory: (story) => set({ story }),
  setLibrary: (library) => {
    const toRecord = (arr: any[]) => arr.reduce((acc, item) => ({ ...acc, [item.id]: item }), {})
    set({
      heroes: toRecord(library.heroes || []),
      npcs: toRecord(library.npcs || []),
      quests: toRecord(library.quests || []),
      locations: toRecord(library.locations || []),
      secrets: toRecord(library.secrets || []),
      loot: toRecord(library.loot || []),
      events: toRecord(library.events || []),
    })
  },

  advanceTime: (hoursToAdd) => set((state) => {
    let newHour = state.currentHour + hoursToAdd;
    let newDay = state.currentDay;
    
    while (newHour >= 24) { newHour -= 24; newDay += 1; }
    while (newHour < 0) { newHour += 24; newDay -= 1; }
    if (newDay < 1) { newDay = 1; newHour = 0; }

    const updatedNpcs = { ...state.npcs };
    let hasChanges = false;

    Object.values(updatedNpcs).forEach((npc) => {
      if (npc.schedule && npc.schedule.length > 0) {
        const task = npc.schedule.find(s => {
          if (s.startHour <= s.endHour) return newHour >= s.startHour && newHour < s.endHour;
          else return newHour >= s.startHour || newHour < s.endHour;
        });
        
        if (task) {
          if (npc.locationId !== task.locationId || npc.currentActivity !== task.activity) {
            updatedNpcs[npc.id] = { 
              ...npc, defaultLocationId: npc.defaultLocationId !== undefined ? npc.defaultLocationId : npc.locationId,
              locationId: task.locationId, currentActivity: task.activity 
            } as NPC;
            hasChanges = true;
          }
        } else {
          const homeLocation = npc.defaultLocationId !== undefined ? npc.defaultLocationId : npc.locationId;
          if (npc.currentActivity || npc.locationId !== homeLocation) {
            updatedNpcs[npc.id] = { ...npc, locationId: homeLocation, currentActivity: undefined } as NPC;
            hasChanges = true;
          }
        }
      }
    });

    let newWeather = { ...state.weather };

    if (newDay !== state.currentDay && newWeather.forecast[newDay] && newWeather.mode !== 'disabled') {
      newWeather.condition = newWeather.forecast[newDay].condition;
      newWeather.temp = newWeather.forecast[newDay].temp;
    } 
    else if (newWeather.mode === 'dynamic') {
      newWeather.hoursSinceChange += hoursToAdd;
      if (newWeather.hoursSinceChange >= newWeather.interval) {
        newWeather.hoursSinceChange = 0;
        const climates: Record<ClimateType, string[]> = {
          temperate: ['Ясно', 'Ясно', 'Облачно', 'Облачно', 'Дождь', 'Гроза', 'Туман'],
          winter: ['Ясно', 'Облачно', 'Снег', 'Снег', 'Вьюга', 'Туман'],
          desert: ['Ясно', 'Ясно', 'Ясно', 'Песчаная буря', 'Облачно'],
          tropical: ['Ясно', 'Облачно', 'Дождь', 'Ливень', 'Гроза', 'Туман']
        }
        const options = climates[newWeather.climate] || climates.temperate;
        newWeather.condition = options[Math.floor(Math.random() * options.length)];
        const tempBase = { temperate: 15, winter: -10, desert: 35, tropical: 28 }[newWeather.climate] || 15;
        newWeather.temp = tempBase + (Math.floor(Math.random() * 15) - 7);
      }
    }

    return { 
      currentDay: newDay, 
      currentHour: newHour,
      weather: newWeather,
      npcs: hasChanges ? updatedNpcs : state.npcs 
    };
  }),

  setViewedEntityId: (id) => set({ viewedEntityId: id }),
  setScratchpad: (text) => set({ scratchpad: text }),
  toggleScratchpad: () => set((state) => ({ isScratchpadOpen: !state.isScratchpadOpen })),

  addEntity: (category, entity) => set((state) => ({
    [category]: { ...state[category], [entity.id]: entity }
  })),

  updateEntity: (category, id, data) => set((state) => {
    const result = updateInLibrary(state, category, id, (prev) => {
      const next = { ...(prev as object), ...(data as object) } as any
      if (category === 'npcs' && data && typeof data === 'object' && 'locationId' in data) {
        next.defaultLocationId = (data as any).locationId ?? null
      }
      return next
    })
    if (!result) return state

    if (category === 'locations') {
      const patch = data as Partial<BaseEntity>
      const nextNodes = result.nodes.map((n) => {
        if (n.data?.entityId !== id) return n
        return {
          ...n,
          data: {
            ...n.data,
            label: patch.name !== undefined ? patch.name : n.data.label,
            description: patch.description !== undefined ? patch.description : n.data.description
          }
        }
      })
      return { ...result, nodes: nextNodes }
    }

    return result
  }),

  deleteEntity: (category, id) => set((state) => {
    const record = { ...(state[category] as Record<string, unknown>) }
    if (!(id in record)) return state
    delete record[id]

    if (category === 'locations') {
      const removedNodeIds = state.nodes.filter((n) => n.data?.entityId === id).map((n) => n.id)
      const nextNodes = state.nodes.filter((n) => n.data?.entityId !== id)
      const nextEdges = state.edges.filter((e) => !removedNodeIds.includes(e.source) && !removedNodeIds.includes(e.target))

      let nextNpcs = state.npcs
      let nextQuests = state.quests
      for (const nodeId of removedNodeIds) {
        const cleaned = cleanLocationLinks({ npcs: nextNpcs, quests: nextQuests, nodeId })
        nextNpcs = cleaned.npcs
        nextQuests = cleaned.quests
      }

      return {
        ...state,
        locations: record as Record<string, BaseEntity>,
        nodes: nextNodes,
        edges: nextEdges,
        npcs: nextNpcs,
        quests: nextQuests
      }
    }

    return { ...state, [category]: record }
  }),

  updateQuestStatus: (questId, newStatus) => set((state) => {
    const quest = state.quests[questId]
    if (!quest) return state
    const isTerminal = newStatus === 'completed' || newStatus === 'failed'
    let updatedNpcs = { ...state.npcs }
    let updatedNodes = [...state.nodes]
    if (isTerminal && quest.locationId) {
      Object.values(updatedNpcs).forEach(npc => {
        if (npc.locationId === quest.locationId) updatedNpcs[npc.id] = { ...npc, needsUpdate: true }
      })
      updatedNodes = updatedNodes.map(n => n.id === quest.locationId ? { ...n, data: { ...n.data, needsUpdate: true } } : n)
    }
    return { quests: { ...state.quests, [questId]: { ...quest, status: newStatus } }, npcs: updatedNpcs, nodes: updatedNodes }
  }),

  attachToRegion: (childId, regionId) => set((state) => {
    const childIndex = state.nodes.findIndex(n => n.id === childId)
    if (childIndex === -1) return state
    const child = state.nodes[childIndex]
    const newNodes = [...state.nodes]
    if (regionId === null) {
      newNodes[childIndex] = { ...child, parentId: undefined, extent: undefined }
    } else {
      const region = state.nodes.find(n => n.id === regionId)
      if (region) newNodes[childIndex] = { ...child, parentId: regionId, position: { x: child.position.x - region.position.x, y: child.position.y - region.position.y }, extent: 'parent' }
    }
    return { nodes: newNodes }
  }),

  clearNeedsUpdate: (type, targetId) => set((state) => {
    if (type === 'node') return { nodes: state.nodes.map(n => n.id === targetId ? { ...n, data: { ...n.data, needsUpdate: false } } : n) }
    if (type === 'npc' && state.npcs[targetId]) return { npcs: { ...state.npcs, [targetId]: { ...state.npcs[targetId], needsUpdate: false } } }
    return state
  })
}))
