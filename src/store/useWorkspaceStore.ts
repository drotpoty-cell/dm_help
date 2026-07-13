'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Node, Edge } from 'reactflow'
import { WorkspaceState, PlotNode, Combatant } from '@/types/workspace'
import { getEmptyWorldState } from './storeConstants'
import { createUISlice } from './slices/createUISlice'
import { createLibrarySlice } from './slices/createLibrarySlice'
import { createMapSlice } from './slices/createMapSlice'

export * from '@/types/workspace'
export { getEmptyWorldState } from './storeConstants'

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get, api) => ({
      ...getEmptyWorldState(),
      ...createUISlice(set, get, api),
      ...createLibrarySlice(set, get, api),
      ...createMapSlice(set, get, api),

      startCombat: (mapId: string) => set((state) => {
        const tokens = state.localMaps[mapId]?.tokens || {}
        const participants = Object.values(tokens)
          .filter((t) => ['hero', 'npc', 'monster'].includes(t.type))
          .map((t) => {
            const entity = state.heroes[t.entityId] || state.npcs[t.entityId] || state.bestiary[t.entityId] || { hp: 10, maxHp: 10 }
            return {
              tokenId: t.id,
              entityId: t.entityId,
              type: t.type as Combatant['type'],
              initiative: 0,
              hp: entity.hp || entity.maxHp || 10,
              maxHp: entity.maxHp || 10,
            }
          }) as Combatant[]
        return { combat: { isActive: true, turnIndex: 0, participants } }
      }),
      endCombat: () => set(() => ({
        combat: { isActive: false, turnIndex: 0, participants: [] },
      })),
      nextTurn: () => set((state) => ({
        combat: {
          ...state.combat,
          turnIndex: (state.combat.turnIndex + 1) % (state.combat.participants.length || 1),
        },
      })),
      updateCombatantInitiative: (tokenId: string, initiative: number) => set((state) => {
        const participants = [...state.combat.participants]
        const index = participants.findIndex((p) => p.tokenId === tokenId)
        if (index !== -1) {
          participants[index].initiative = initiative
          participants.sort((a, b) => b.initiative - a.initiative)
        }
        return { combat: { ...state.combat, participants } }
      }),

      openLocalMap: (locationId: string) => set((state) => {
        const localMaps = { ...state.localMaps }
        if (!localMaps[locationId]) {
          localMaps[locationId] = { backgroundImage: null, gridSize: 60, tokens: {} }
        }
        return { localMaps, activeLocalMapId: locationId }
      }),
      closeLocalMap: () => set({ activeLocalMapId: null }),
      updateLocalMap: (locationId, data) => set((state) => {
        const existingMap = state.localMaps[locationId] || { gridSize: 60, tokens: {}, backgroundImage: null }
        return {
          localMaps: {
            ...state.localMaps,
            [locationId]: { ...existingMap, ...data },
          },
        }
      }),
      createAndSpawnInteractive: (locationId: string, type: 'poi' | 'check') => set((state) => {
        if (!locationId) return state

        const newEntityId = `interactive-${Date.now()}`
        const newEntity = {
          id: newEntityId,
          name: type === 'poi' ? 'Новая точка интереса' : 'Новая проверка',
          description: '',
          type,
          dc: type === 'check' ? 10 : undefined,
          locationId,
        }

        const tokenId = `token-${Date.now()}`
        const newToken = { id: tokenId, entityId: newEntityId, type, locationId, x: 0, y: 0, size: 1 }

        const targetMap = state.localMaps[locationId] || { gridSize: 60, tokens: {} }

        return {
          interactive: { ...state.interactive, [newEntityId]: newEntity },
          localMaps: {
            ...state.localMaps,
            [locationId]: {
              ...targetMap,
              tokens: { ...targetMap.tokens, [tokenId]: newToken },
            },
          },
        }
      }),
      setWeather: (newWeather) => set((state) => ({ weather: { ...state.weather, ...newWeather } })),

      addPlotNode: (node: PlotNode) => set((state) => ({
        plotNodes: { ...state.plotNodes, [node.id]: node },
      })),
      updatePlotNode: (id: string, data: Partial<PlotNode>) => set((state) => ({
        plotNodes: { ...state.plotNodes, [id]: { ...state.plotNodes[id], ...data } },
      })),
      deletePlotNode: (id: string) => set((state) => {
        const next = { ...state.plotNodes }
        delete next[id]
        return { plotNodes: next }
      }),
      generateForecast: (daysCount: number) => set((state) => {
        const newForecast = { ...state.weather.forecast }
        const startDay = state.currentDay

        const conditionsMap: Record<string, string[]> = {
          temperate: ['Ясно', 'Ясно', 'Облачно', 'Облачно', 'Дождь', 'Гроза', 'Туман'],
          winter: ['Ясно', 'Облачно', 'Снег', 'Снег', 'Вьюга', 'Туман'],
          desert: ['Ясно', 'Ясно', 'Ясно', 'Песчаная буря', 'Облачно'],
          tropical: ['Ясно', 'Дождь', 'Ливень', 'Гроза', 'Туман'],
        }

        const baseTemp = { temperate: 15, winter: -15, desert: 35, tropical: 28 }[state.weather.climate as string] || 15

        for (let i = 0; i < daysCount; i++) {
          const dayNum = startDay + i
          const options = conditionsMap[state.weather.climate] || conditionsMap.temperate
          newForecast[dayNum] = {
            condition: options[Math.floor(Math.random() * options.length)],
            temp: baseTemp + (Math.floor(Math.random() * 10) - 5),
          }
        }
        return { weather: { ...state.weather, forecast: newForecast } }
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
                const multiplier = ['Гроза', 'Вьюга', 'Туман', 'Песчаная буря'].includes(state.weather.condition) ? 2 : 1.5
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

      updateEdgeData: (edgeId: string, data: any) => set((state) => ({
        edges: state.edges.map((e: Edge) => e.id === edgeId ? { ...e, data: { ...e.data, ...data } } : e),
      })),

      setStory: (story) => set({ story }),

      advanceTime: (hours: number) => set((state) => {
        const safeHours = Number(hours)
        let newHour = Number(state.currentHour) + safeHours
        let newDay = Number(state.currentDay)

        if (newHour >= 24) {
          newDay += Math.floor(newHour / 24)
          newHour = newHour % 24
        } else if (newHour < 0) {
          const daysToSubtract = Math.ceil(Math.abs(newHour) / 24)
          newDay -= daysToSubtract
          newHour = (newHour % 24 + 24) % 24
        }
        if (newDay < 1) { newDay = 1; newHour = 0 }

        const nextState: Partial<WorkspaceState> = {
          currentHour: newHour,
          currentDay: newDay,
        }

        try {
          const processEntities = (entities: any) => {
            if (!entities) return entities
            const updated = { ...entities }
            Object.keys(updated).forEach((id) => {
              const entity = updated[id]
              if (!entity || !Array.isArray(entity.schedule) || entity.schedule.length === 0) {
                if (entity && entity.defaultLocationId !== undefined) {
                  entity.locationId = entity.defaultLocationId || ''
                  entity.currentActivity = ''
                }
                return
              }

              const activeSchedule = entity.schedule.find((entry: any) => {
                if (!entry) return false
                const s = Number(entry.startHour)
                const e = Number(entry.endHour)
                if (s <= e) return newHour >= s && newHour < e
                return newHour >= s || newHour < e
              })

              if (activeSchedule) {
                entity.locationId = activeSchedule.locationId || ''
                entity.currentActivity = activeSchedule.activity || ''
              } else {
                entity.locationId = entity.defaultLocationId || ''
                entity.currentActivity = ''
              }
            })
            return updated
          }

          nextState.characters = processEntities(state.characters)
          nextState.npcs = processEntities(state.npcs)
          nextState.extras = processEntities(state.extras)
        } catch (error) {
          console.error('Ошибка при пересчете расписаний:', error)
        }

        return nextState
      }),

      attachToRegion: (childId: string, regionId: string | null) => set((state) => {
        const childIndex = state.nodes.findIndex((n: Node) => n.id === childId)
        if (childIndex === -1) return state
        const child = state.nodes[childIndex]
        const newNodes = [...state.nodes]
        if (regionId === null) {
          newNodes[childIndex] = { ...child, parentId: undefined, extent: undefined }
        } else {
          const region = state.nodes.find((n: Node) => n.id === regionId)
          if (region) {
            newNodes[childIndex] = {
              ...child,
              parentId: regionId,
              position: { x: child.position.x - region.position.x, y: child.position.y - region.position.y },
              extent: 'parent',
            }
          }
        }
        return { nodes: newNodes }
      }),
    }),
    {
      name: 'gm-assistant-storage',
      version: 1,
      skipHydration: true,
      partialize: (state) => {
        const lightLocalMaps = Object.entries(state.localMaps).reduce((acc, [key, val]) => {
          acc[key] = { ...val, backgroundImage: null }
          return acc
        }, {} as Record<string, any>)

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
          interactive: state.interactive,
          currentDay: state.currentDay,
          currentHour: state.currentHour,
          weather: state.weather,
          partyLocationId: state.partyLocationId,
          activeView: state.activeView,
          localMaps: lightLocalMaps,
          combat: state.combat,
          savedWorlds: state.savedWorlds,
          activeWorldId: state.activeWorldId,
        }
      },
    }
  )
)
