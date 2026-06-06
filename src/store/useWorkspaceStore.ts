'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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

// Универсальная функция для очистки ссылок на удаленную локацию
const cleanLocationLinks = (
  entities: Record<string, any>,
  nodeId: string
) => {
  let changed = false
  const next: Record<string, any> = { ...entities }
  for (const item of Object.values(entities)) {
    if (item.locationId === nodeId) {
      next[item.id] = { ...item, locationId: null }
      changed = true
    }
  }
  return { next, changed }
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

// Вспомогательная функция для прокрутки расписания персонажей
const processSchedules = (entitiesRecord: Record<string, any>, newHour: number) => {
  let hasChanges = false;
  const updated = { ...entitiesRecord };
  
  Object.values(updated).forEach((entity: any) => {
    if (entity.schedule && entity.schedule.length > 0) {
      const task = entity.schedule.find((s: any) => {
        if (s.startHour <= s.endHour) return newHour >= s.startHour && newHour < s.endHour;
        else return newHour >= s.startHour || newHour < s.endHour;
      });
      
      if (task) {
        if (entity.locationId !== task.locationId || entity.currentActivity !== task.activity) {
          updated[entity.id] = { 
            ...entity, 
            defaultLocationId: entity.defaultLocationId !== undefined ? entity.defaultLocationId : entity.locationId,
            locationId: task.locationId, 
            currentActivity: task.activity 
          };
          hasChanges = true;
        }
      } else {
        const homeLocation = entity.defaultLocationId !== undefined ? entity.defaultLocationId : entity.locationId;
        if (entity.currentActivity || entity.locationId !== homeLocation) {
          updated[entity.id] = { ...entity, locationId: homeLocation, currentActivity: undefined };
          hasChanges = true;
        }
      }
    }
  });
  return { updated, hasChanges };
}

// Добавляем & any к create, чтобы TS не ругался в процессе перехода на новые типы
export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      story: [],
      currentDay: 1,
      currentHour: 8,
      
      weather: { mode: 'disabled', condition: 'Ясно', temp: 20, interval: 24, hoursSinceChange: 0, climate: 'temperate', forecast: {} },
      setWeather: (newWeather: any) => set((state: any) => ({ weather: { ...state.weather, ...newWeather } })),
      
      // ... rest of store body ...
      generateForecast: (daysCount: number) => set((state: any) => {
        const newForecast = { ...state.weather.forecast };
        const startDay = state.currentDay;
        
        const conditionsMap: Record<string, string[]> = {
          temperate: ['Ясно', 'Ясно', 'Облачно', 'Облачно', 'Дождь', 'Гроза', 'Туман'],
          winter: ['Ясно', 'Облачно', 'Снег', 'Снег', 'Вьюга', 'Туман'],
          desert: ['Ясно', 'Ясно', 'Ясно', 'Песчаная буря', 'Облачно'],
          tropical: ['Ясно', 'Дождь', 'Ливень', 'Гроза', 'Туман']
        };
        
        const baseTemp = { temperate: 15, winter: -15, desert: 35, tropical: 28 }[state.weather.climate as string] || 15;
        
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
      
      setPartyLocation: (newLocationId: string | null) => {
        const state = get()
        const currentLocationId = state.partyLocationId
        
        if (currentLocationId && newLocationId && currentLocationId !== newLocationId) {
          const edge = state.edges.find((e: Edge) => 
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
      characters: {}, extras: {}, bestiary: {}, factions: {},
      
      viewedEntityId: null,
      scratchpad: '',
      isScratchpadOpen: false,
      
      setNodes: (nodes: Node[]) => set({ nodes }),
      setEdges: (edges: Edge[]) => set({ edges }),
      
      updateEdgeData: (edgeId: string, data: any) => set((state: any) => ({
        edges: state.edges.map((e: Edge) => e.id === edgeId ? { ...e, data: { ...e.data, ...data } } : e)
      })),
      
      setStory: (story: any) => set({ story }),
      
      setLibrary: (library: any) => {
        const toRecord = (arr: any[]) => arr.reduce((acc, item) => ({ ...acc, [item.id]: item }), {})
        set({
          heroes: toRecord(library.heroes || []),
          npcs: toRecord(library.npcs || []),
          quests: toRecord(library.quests || []),
          locations: toRecord(library.locations || []),
          secrets: toRecord(library.secrets || []),
          loot: toRecord(library.loot || []),
          events: toRecord(library.events || []),
          characters: toRecord(library.characters || []),
          extras: toRecord(library.extras || []),
          bestiary: toRecord(library.bestiary || []),
          factions: toRecord(library.factions || []),
        })
      },
      
      advanceTime: (hoursToAdd: number) => set((state: any) => {
        let newHour = state.currentHour + hoursToAdd;
        let newDay = state.currentDay;
        
        while (newHour >= 24) { newHour -= 24; newDay += 1; }
        while (newHour < 0) { newHour += 24; newDay -= 1; }
        if (newDay < 1) { newDay = 1; newHour = 0; }
        
        const npcsResult = processSchedules(state.npcs || {}, newHour);
        const charactersResult = processSchedules(state.characters || {}, newHour);
        const extrasResult = processSchedules(state.extras || {}, newHour);
        
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
            const options = climates[newWeather.climate as ClimateType] || climates.temperate;
            newWeather.condition = options[Math.floor(Math.random() * options.length)];
            const tempBase = { temperate: 15, winter: -10, desert: 35, tropical: 28 }[newWeather.climate as ClimateType] || 15;
            newWeather.temp = tempBase + (Math.floor(Math.random() * 15) - 7);
          }
        }
        
        return { 
          currentDay: newDay, 
          currentHour: newHour,
          weather: newWeather,
          npcs: npcsResult.hasChanges ? npcsResult.updated : state.npcs,
          characters: charactersResult.hasChanges ? charactersResult.updated : state.characters,
          extras: extrasResult.hasChanges ? extrasResult.updated : state.extras
        };
      }),
      
      setViewedEntityId: (id: string | null) => set({ viewedEntityId: id }),
      setScratchpad: (text: string) => set({ scratchpad: text }),
      toggleScratchpad: () => set((state: any) => ({ isScratchpadOpen: !state.isScratchpadOpen })),
      
      addEntity: (category: string, entity: any) => set((state: any) => ({
        [category]: { ...state[category], [entity.id]: entity }
      })),
      
      updateEntity: (category: string, id: string, data: any) => set((state: any) => {
        const result = updateInLibrary(state, category as any, id, (prev) => {
          const next = { ...(prev as object), ...(data as object) } as any
          if ((category === 'npcs' || category === 'characters' || category === 'extras') && data && typeof data === 'object' && 'locationId' in data) {
            next.defaultLocationId = (data as any).locationId ?? null
          }
          return next
        })
        if (!result) return state
        
        if (category === 'locations') {
          const patch = data as Partial<BaseEntity>
          const nextNodes = result.nodes.map((n: Node) => {
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
      
      deleteEntity: (category: string, id: string) => set((state: any) => {
        const record = { ...(state[category] as Record<string, unknown>) }
        if (!(id in record)) return state
        delete record[id]
        
        if (category === 'locations') {
          const removedNodeIds = state.nodes.filter((n: Node) => n.data?.entityId === id).map((n: Node) => n.id)
          const nextNodes = state.nodes.filter((n: Node) => n.data?.entityId !== id)
          const nextEdges = state.edges.filter((e: Edge) => !removedNodeIds.includes(e.source) && !removedNodeIds.includes(e.target))
          
          let nextNpcs = state.npcs
          let nextQuests = state.quests
          let nextCharacters = state.characters || {}
          let nextExtras = state.extras || {}
          
          for (const nodeId of removedNodeIds) {
            const cleanedNpcs = cleanLocationLinks(nextNpcs, nodeId)
            const cleanedQuests = cleanLocationLinks(nextQuests, nodeId)
            const cleanedCharacters = cleanLocationLinks(nextCharacters, nodeId)
            const cleanedExtras = cleanLocationLinks(nextExtras, nodeId)
            
            nextNpcs = cleanedNpcs.changed ? cleanedNpcs.next : nextNpcs
            nextQuests = cleanedQuests.changed ? cleanedQuests.next : nextQuests
            nextCharacters = cleanedCharacters.changed ? cleanedCharacters.next : nextCharacters
            nextExtras = cleanedExtras.changed ? cleanedExtras.next : nextExtras
          }
          
          return {
            ...state,
            locations: record as Record<string, BaseEntity>,
            nodes: nextNodes,
            edges: nextEdges,
            npcs: nextNpcs,
            quests: nextQuests,
            characters: nextCharacters,
            extras: nextExtras
          }
        }
        
        return { ...state, [category]: record }
      }),
      
      updateQuestStatus: (questId: string, newStatus: string) => set((state: any) => {
        const quest = state.quests[questId]
        if (!quest) return state
        const isTerminal = newStatus === 'completed' || newStatus === 'failed'
        
        let updatedNpcs = { ...state.npcs }
        let updatedCharacters = { ...state.characters }
        let updatedNodes = [...state.nodes]
        
        if (isTerminal && quest.locationId) {
          Object.values(updatedNpcs).forEach((npc: any) => {
            if (npc.locationId === quest.locationId) updatedNpcs[npc.id] = { ...npc, needsUpdate: true }
          })
          Object.values(updatedCharacters).forEach((char: any) => {
            if (char.locationId === quest.locationId) updatedCharacters[char.id] = { ...char, needsUpdate: true }
          })
          updatedNodes = updatedNodes.map(n => n.id === quest.locationId ? { ...n, data: { ...n.data, needsUpdate: true } } : n)
        }
        return { 
          quests: { ...state.quests, [questId]: { ...quest, status: newStatus } }, 
          npcs: updatedNpcs, 
          characters: updatedCharacters,
          nodes: updatedNodes 
        }
      }),
      
      attachToRegion: (childId: string, regionId: string | null) => set((state: any) => {
        const childIndex = state.nodes.findIndex((n: Node) => n.id === childId)
        if (childIndex === -1) return state
        const child = state.nodes[childIndex]
        const newNodes = [...state.nodes]
        if (regionId === null) {
          newNodes[childIndex] = { ...child, parentId: undefined, extent: undefined }
        } else {
          const region = state.nodes.find((n: Node) => n.id === regionId)
          if (region) newNodes[childIndex] = { ...child, parentId: regionId, position: { x: child.position.x - region.position.x, y: child.position.y - region.position.y }, extent: 'parent' }
        }
        return { nodes: newNodes }
      }),
      
      clearNeedsUpdate: (type: string, targetId: string) => set((state: any) => {
        if (type === 'node') return { nodes: state.nodes.map((n: Node) => n.id === targetId ? { ...n, data: { ...n.data, needsUpdate: false } } : n) }
        if (type === 'npc' && state.npcs[targetId]) return { npcs: { ...state.npcs, [targetId]: { ...state.npcs[targetId], needsUpdate: false } } }
        if (type === 'character' && state.characters[targetId]) return { characters: { ...state.characters, [targetId]: { ...state.characters[targetId], needsUpdate: false } } }
        return state
      })
    }),
    {
      name: 'gm-workspace-storage',
    }
  )
)