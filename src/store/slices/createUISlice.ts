'use client'

import type { StateCreator } from 'zustand'
import type { WorkspaceState } from '@/types/workspace'
import { getEmptyWorldState } from '../storeConstants'
import { useWorkspaceStore } from '../useWorkspaceStore'

export interface UISlice {
  activeView: string
  isScratchpadOpen: boolean
  viewedEntityId: string | null
  activeWorldId: string | null
  scratchpad: string
  savedWorlds: Record<string, any>

  setActiveView: (view: string) => void
  setViewedEntityId: (id: string | null) => void
  setScratchpad: (text: string) => void
  toggleScratchpad: () => void
  switchWorld: (newId: string) => void
}

export const getEmptyUIState = (): Pick<
  UISlice,
  'activeView' | 'isScratchpadOpen' | 'viewedEntityId' | 'activeWorldId' | 'scratchpad' | 'savedWorlds'
> => ({
  viewedEntityId: null,
  activeView: 'map',
  scratchpad: '',
  isScratchpadOpen: false,
  activeWorldId: null,
  savedWorlds: {},
})

export const createUISlice: StateCreator<WorkspaceState, [], [], UISlice> = (set) => ({
  ...getEmptyUIState(),

  setViewedEntityId: (id) => set({ viewedEntityId: id }),
  setActiveView: (view) => set({ activeView: view }),
  setScratchpad: (text) => set({ scratchpad: text }),
  toggleScratchpad: () => set((state) => ({ isScratchpadOpen: !state.isScratchpadOpen })),

  switchWorld: (newId) =>
    set((state) => {
      if (!useWorkspaceStore.persist?.hasHydrated()) return state
      if (state.activeWorldId === newId) return state

      const newSavedWorlds = { ...state.savedWorlds }

      if (state.activeWorldId) {
        newSavedWorlds[state.activeWorldId] = {
          heroes: state.heroes,
          npcs: state.npcs,
          enemies: state.enemies,
          crowd: state.crowd,
          locations: state.locations,
          plotNodes: state.plotNodes,
          extras: state.extras,
          quests: state.quests,
          loot: state.loot,
          events: state.events,
          factions: state.factions,
          secrets: state.secrets,
          activeLocalMapId: state.activeLocalMapId,
          viewedEntityId: state.viewedEntityId,
          combat: state.combat,
          nodes: state.nodes,
          edges: state.edges,
        }
      }

      const nextWorldData = newSavedWorlds[newId] || getEmptyWorldState()

      const wipeState: Partial<WorkspaceState> = {}
      Object.keys(getEmptyWorldState()).forEach((key) => {
        wipeState[key as keyof WorkspaceState] = undefined as never
      })

      return {
        ...state,
        ...wipeState,
        ...nextWorldData,
        savedWorlds: newSavedWorlds,
        activeWorldId: newId,
      }
    }),
})
