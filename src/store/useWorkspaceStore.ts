'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WorkspaceState } from '@/types/workspace'
import { getEmptyWorldState } from './storeConstants'
import { createUISlice } from './slices/createUISlice'
import { createLibrarySlice } from './slices/createLibrarySlice'
import { createMapSlice } from './slices/createMapSlice'
import { createCombatSlice } from './slices/createCombatSlice'
import { createSystemSlice } from './slices/createSystemSlice'

export * from '@/types/workspace'
export { getEmptyWorldState } from './storeConstants'

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get, api) => ({
      ...getEmptyWorldState(),
      ...createUISlice(set, get, api),
      ...createLibrarySlice(set, get, api),
      ...createMapSlice(set, get, api),
      ...createCombatSlice(set, get, api),
      ...createSystemSlice(set, get, api),
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
