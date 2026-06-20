'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Node, Edge } from 'reactflow'
import { 
  WorkspaceState, 
  LibraryCategory, 
  LibraryState, 
  NPC, 
  Enemy,
  Hero,
  Quest, 
  BaseEntity, 
  ClimateType,
  Combatant,
  PlotNode
} from '@/types/workspace'

export * from '@/types/workspace'

export const MOCK_DATA = {}

export const getEmptyWorldState = () => ({
  nodes: [],
  edges: [],
  story: [],
  heroes: {},
  npcs: {},
  enemies: {},
  crowd: {},
  locations: {},
  plotNodes: {},
  extras: {},
  quests: {},
  loot: {},
  events: {},
  factions: {},
  secrets: {},
  characters: {},
  bestiary: {},
  localMaps: {},
  activeLocalMapId: null,
  viewedEntityId: null,
  activeView: 'map' as const,
  scratchpad: '',
  isScratchpadOpen: false,
  partyLocationId: null,
  currentDay: 1,
  currentHour: 8,
  activeWorldId: null,
  savedWorlds: {},
  combat: { isActive: false, turnIndex: 0, participants: [] },
  weather: { mode: 'disabled' as const, condition: 'Ясно', temp: 20, interval: 24, hoursSinceChange: 0, climate: 'temperate' as const, forecast: {} }
})

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

const processSchedules = (entitiesRecord: Record<string, any>, newHour: number) => {
  let hasChanges = false;
  const updated = { ...entitiesRecord };
  
  Object.values(updated).forEach((entity: any) => {
    let activeSchedule = null;
    if (entity.schedule) {
      activeSchedule = entity.schedule.find((entry: any) => {
        if (entry.startHour <= entry.endHour) {
          return newHour >= entry.startHour && newHour < entry.endHour;
        } else {
          return newHour >= entry.startHour || newHour < entry.endHour;
        }
      });
    }

    if (activeSchedule) {
      if (entity.locationId !== activeSchedule.locationId || entity.currentActivity !== activeSchedule.activity) {
        updated[entity.id] = { 
          ...entity, 
          locationId: activeSchedule.locationId, 
          currentActivity: activeSchedule.activity 
        };
        hasChanges = true;
      }
    } else {
      const homeLocation = entity.defaultLocationId || '';
      if (entity.currentActivity !== '' || entity.locationId !== homeLocation) {
        updated[entity.id] = { ...entity, locationId: homeLocation, currentActivity: '' };
        hasChanges = true;
      }
    }
  });
  return { updated, hasChanges };
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      ...getEmptyWorldState(),
      
      startCombat: (mapId: string) => set((state: any) => {
        const tokens = state.localMaps[mapId]?.tokens || {};
        const participants: Combatant[] = Object.values(tokens)
          .filter((t: any) => ['hero', 'npc', 'monster'].includes(t.type))
          .map((t: any) => {
            const entity = state.heroes[t.entityId] || state.npcs[t.entityId] || state.bestiary[t.entityId] || { hp: 10, maxHp: 10 };
            return {
              tokenId: t.id,
              entityId: t.entityId,
              type: t.type,
              initiative: 0,
              hp: entity.hp || entity.maxHp || 10,
              maxHp: entity.maxHp || 10,
            };
          });
        return { combat: { isActive: true, turnIndex: 0, participants } };
      }),
      endCombat: () => set((state: any) => ({ 
        combat: { isActive: false, turnIndex: 0, participants: [] } 
      })),
      nextTurn: () => set((state: any) => ({
        combat: {
          ...state.combat,
          turnIndex: (state.combat.turnIndex + 1) % (state.combat.participants.length || 1)
        }
      })),
      updateCombatantInitiative: (tokenId: string, initiative: number) => set((state: any) => {
        const participants = [...state.combat.participants];
        const index = participants.findIndex(p => p.tokenId === tokenId);
        if (index !== -1) {
          participants[index].initiative = initiative;
          participants.sort((a, b) => b.initiative - a.initiative);
        }
        return { combat: { ...state.combat, participants } };
      }),

      openLocalMap: (locationId: string) => set((state: any) => {
        const localMaps = { ...state.localMaps };
        if (!localMaps[locationId]) {
          localMaps[locationId] = { backgroundImage: null, gridSize: 60, tokens: {} };
        }
        return { localMaps, activeLocalMapId: locationId };
      }),
      closeLocalMap: () => set({ activeLocalMapId: null }),
      updateMapCamera: (locationId: string, camera: { cameraX?: number; cameraY?: number; zoom?: number }) => set((state: any) => ({
        localMaps: {
          ...state.localMaps,
          [locationId]: {
            ...state.localMaps[locationId],
            ...camera
          }
        }
      })),
      updateLocalMap: (locationId, data) => set((state: any) => {
        const existingMap = state.localMaps[locationId] || { gridSize: 60, tokens: {}, backgroundImage: null };
        return {
          localMaps: {
            ...state.localMaps,
            [locationId]: { ...existingMap, ...data }
          }
        };
      }),
      updateLocalToken: (locationId: string, tokenId: string, data: any) => set((state: any) => ({
        localMaps: {
          ...state.localMaps,
          [locationId]: {
            ...state.localMaps[locationId],
            tokens: {
              ...state.localMaps[locationId]?.tokens,
              [tokenId]: { ...state.localMaps[locationId]?.tokens[tokenId], ...data }
            }
          }
        }
      })),
      spawnEntityToMap: (locationId: string, entity: any, type: 'hero' | 'npc' | 'poi' | 'check' | 'enemies' | 'crowd' | 'loot') => set((state: any) => {
        const nextLocalMaps = { ...state.localMaps };
        const tokenId = `token-${Date.now()}`;

        // Если сущности еще нет в архиве (например, новый объект), добавляем её
        const category = type === 'poi' || type === 'check' ? 'interactive' : type as LibraryCategory;
        const updatedLibrary = {
          ...state[category],
          [entity.id]: { ...(state[category][entity.id] || {}), ...entity }
        };

        // 1. Очистка сущности со всех других карт
        Object.keys(nextLocalMaps).forEach(locId => {
          if (nextLocalMaps[locId]?.tokens) {
            nextLocalMaps[locId].tokens = Object.fromEntries(
              Object.entries(nextLocalMaps[locId].tokens).filter(([_, t]: any) => t.entityId !== entity.id)
            );
          }
        });

        // 2. Создание токена
        const newToken = { id: tokenId, entityId: entity.id, type, locationId, x: 0, y: 0, size: 1 };
        
        // 3. Обновление целевой карты
        const targetMap = nextLocalMaps[locationId] || { gridSize: 60, tokens: {} };
        nextLocalMaps[locationId] = {
          ...targetMap,
          tokens: { ...targetMap.tokens, [tokenId]: newToken }
        };

        return { localMaps: nextLocalMaps, [category]: updatedLibrary };
      }),
      removeLocalToken: (locationId: string, tokenId: string) => set((state: any) => {
        const nextTokens = { ...state.localMaps[locationId]?.tokens };
        delete nextTokens[tokenId];
        return {
          localMaps: {
            ...state.localMaps,
            [locationId]: {
              ...state.localMaps[locationId],
              tokens: nextTokens
            }
          }
        };
      }),
      
      setWeather: (newWeather: any) => set((state: any) => ({ weather: { ...state.weather, ...newWeather } })),
      
      addPlotNode: (node: PlotNode) => set((state: any) => ({
        plotNodes: { ...state.plotNodes, [node.id]: node }
      })),
      updatePlotNode: (id: string, data: Partial<PlotNode>) => set((state: any) => ({
        plotNodes: { ...state.plotNodes, [id]: { ...state.plotNodes[id], ...data } }
      })),
      deletePlotNode: (id: string) => set((state: any) => {
        const next = { ...state.plotNodes };
        delete next[id];
        return { plotNodes: next };
      }),
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
      
      advanceTime: (hours: number) => set((state: any) => {
        const safeHours = Number(hours);
        let newHour = Number(state.currentHour) + safeHours;
        let newDay = Number(state.currentDay);

        if (newHour >= 24) {
          newDay += Math.floor(newHour / 24);
          newHour = newHour % 24;
        } else if (newHour < 0) {
          const daysToSubtract = Math.ceil(Math.abs(newHour) / 24);
          newDay -= daysToSubtract;
          newHour = (newHour % 24 + 24) % 24;
        }
        if (newDay < 1) { newDay = 1; newHour = 0; }

        const nextState: any = { 
          currentHour: newHour, 
          currentDay: newDay 
        };

        try {
          const processEntities = (entities: any) => {
            if (!entities) return entities;
            const updated = { ...entities };
            Object.keys(updated).forEach(id => {
              const entity = updated[id];
              if (!entity || !Array.isArray(entity.schedule) || entity.schedule.length === 0) {
                if (entity && entity.defaultLocationId !== undefined) {
                  entity.locationId = entity.defaultLocationId || '';
                  entity.currentActivity = '';
                }
                return;
              }

              const activeSchedule = entity.schedule.find((entry: any) => {
                if (!entry) return false;
                const s = Number(entry.startHour);
                const e = Number(entry.endHour);
                if (s <= e) return newHour >= s && newHour < e;
                return newHour >= s || newHour < e;
              });

              if (activeSchedule) {
                entity.locationId = activeSchedule.locationId || '';
                entity.currentActivity = activeSchedule.activity || '';
              } else {
                entity.locationId = entity.defaultLocationId || '';
                entity.currentActivity = '';
              }
            });
            return updated;
          };

          nextState.characters = processEntities(state.characters);
          nextState.npcs = processEntities(state.npcs);
          nextState.extras = processEntities(state.extras);
        } catch (error) {
          console.error("Ошибка при пересчете расписаний:", error);
        }

        return nextState;
      }),
      
      setViewedEntityId: (id: string | null) => set({ viewedEntityId: id }),
      setActiveView: (view: string) => set({ activeView: view }),
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

      updateHero: (id: string, data: Partial<Hero>) => set((state: any) => ({
        heroes: { ...state.heroes, [id]: { ...state.heroes[id], ...data } }
      })),
      updateNpc: (id: string, data: Partial<NPC>) => set((state: any) => ({
        npcs: { ...state.npcs, [id]: { ...state.npcs[id], ...data } }
      })),
      
      clearNeedsUpdate: (type: string, targetId: string) => set((state: any) => {
        if (type === 'node') return { nodes: state.nodes.map((n: Node) => n.id === targetId ? { ...n, data: { ...n.data, needsUpdate: false } } : n) }
        if (type === 'npc' && state.npcs[targetId]) return { npcs: { ...state.npcs, [targetId]: { ...state.npcs[targetId], needsUpdate: false } } }
        if (type === 'character' && state.characters[targetId]) return { characters: { ...state.characters, [targetId]: { ...state.characters[targetId], needsUpdate: false } } }
        return state
      }),

      importAIData: (data) => set((state: any) => {
        const mergeData = (stateRecord: Record<string, any>, dataArray: any[]) => {
          const result = { ...stateRecord };
          if (Array.isArray(dataArray)) {
            dataArray.forEach((item: any) => {
              if (item.id) result[item.id] = { ...result[item.id], ...item };
            });
          }
          return result;
        };

        return {
          plotNodes: mergeData(state.plotNodes, data.plotNodes),
          npcs: mergeData(state.npcs, data.npcs),
          enemies: mergeData(state.enemies, data.enemies),
          crowd: mergeData(state.crowd, data.crowd),
          locations: mergeData(state.locations, data.locations),
          quests: mergeData(state.quests, data.quests),
          loot: mergeData(state.loot, data.loot),
          events: mergeData(state.events, data.events),
          factions: mergeData(state.factions, data.factions),
          secrets: mergeData(state.secrets, data.secrets),
          extras: mergeData(state.extras, data.extras)
        };
      }),
      
      switchWorld: (newId: string) => set((state: any) => {
        if (!useWorkspaceStore.persist?.hasHydrated()) return state;
        if (state.activeWorldId === newId) return state;

        const newSavedWorlds = { ...state.savedWorlds };

        // Сохраняем текущий мир
        if (state.activeWorldId) {
          newSavedWorlds[state.activeWorldId] = {
            heroes: state.heroes, npcs: state.npcs, enemies: state.enemies, 
            crowd: state.crowd, locations: state.locations, plotNodes: state.plotNodes, 
            extras: state.extras, quests: state.quests, loot: state.loot, 
            events: state.events, factions: state.factions, secrets: state.secrets,
            activeLocalMapId: state.activeLocalMapId, viewedEntityId: state.viewedEntityId,
            combat: state.combat, nodes: state.nodes, edges: state.edges
          };
        }

        // Получаем данные нового мира или ЖЕСТКИЙ пустой шаблон
        const nextWorldData = newSavedWorlds[newId] || getEmptyWorldState();

        // ЯДЕРНАЯ ОЧИСТКА: собираем все ключи текущего стейта, которые относятся к данным мира,
        // и принудительно обнуляем их (undefined), чтобы Zustand их удалил/затер перед накатыванием новых.
        const wipeState: any = {};
        Object.keys(getEmptyWorldState()).forEach((key) => {
          // @ts-ignore
          wipeState[key] = undefined; // Заставляем Zustand забыть эти ключи
        });

        return {
          ...state,           // сохраняем системные вещи (если есть)
          ...wipeState,       // принудительно стираем активные данные
          ...nextWorldData,   // накатываем чистое состояние или загруженный мир
          savedWorlds: newSavedWorlds,
          activeWorldId: newId,
        };
      }),
      addEnemy: (enemy: Enemy) => set((state: any) => ({
        enemies: { ...state.enemies, [enemy.id]: enemy }
      })),
      updateEnemy: (id: string, data: Partial<Enemy>) => set((state: any) => ({
        enemies: { ...state.enemies, [id]: { ...state.enemies[id], ...data } }
      })),
      deleteEnemy: (id: string) => set((state: any) => {
        const enemies = { ...state.enemies };
        delete enemies[id];
        return { enemies };
      }),
      // resetWorld: () => set(getEmptyWorldState())
    }),
    {
      name: 'gm-assistant-storage',
      version: 1,
      skipHydration: true,
      partialize: (state) => {
        // Создаем "легкую" копию localMaps без тяжелых base64 изображений
        const lightLocalMaps = Object.entries(state.localMaps).reduce((acc, [key, val]) => {
          acc[key] = { ...val, backgroundImage: null }; // Очищаем фон для сохранения
          return acc;
        }, {} as Record<string, any>);

        return {
          nodes: state.nodes,
          edges: state.edges,
          story: state.story,
          plotNodes: state.plotNodes,
          heroes: state.heroes,
          npcs: state.npcs,
          enemies: state.enemies,
          crowd: state.crowd,
          quests: state.quests,
          locations: state.locations,
          secrets: state.secrets,
          loot: state.loot,
          events: state.events,
          factions: state.factions,
          characters: state.characters,
          extras: state.extras,
          bestiary: state.bestiary,
          currentDay: state.currentDay,
          currentHour: state.currentHour,
          weather: state.weather,
          partyLocationId: state.partyLocationId,
          activeView: state.activeView,
          localMaps: lightLocalMaps, // Сохраняем только структуру и токены
          combat: state.combat,
          savedWorlds: state.savedWorlds,
          activeWorldId: state.activeWorldId
        };
      }
    }
  )
)
