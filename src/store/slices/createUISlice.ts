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
  /** Глобальный режим показа интерфейса: 'gm' — полный доступ на редактирование,
   *  'player' — read-only, чтобы защитить формы от случайных правок, когда экран
   *  показывается игрокам (Блок 4, п.4). Сознательно НЕ часть кампании (не сбрасывается
   *  при switchWorld) — это личная настройка браузера ГМа, а не данные кампании. */
  displayMode: 'gm' | 'player'
  /** Ширина панели инспектора в px — настраивается драг-ресайзером (Блок 5, п.3).
   *  Как и displayMode, это личная настройка браузера ГМа, а не данные кампании. */
  inspectorPanelWidth: number

  setActiveView: (view: string) => void
  setViewedEntityId: (id: string | null) => void
  setScratchpad: (text: string) => void
  toggleScratchpad: () => void
  switchWorld: (newId: string) => void
  setDisplayMode: (mode: 'gm' | 'player') => void
  toggleDisplayMode: () => void
  setInspectorPanelWidth: (width: number) => void
}

export const getEmptyUIState = (): Pick<
  UISlice,
  'activeView' | 'isScratchpadOpen' | 'viewedEntityId' | 'activeWorldId' | 'scratchpad' | 'savedWorlds'
> => ({
  viewedEntityId: null,
  activeView: 'dashboard',
  scratchpad: '',
  isScratchpadOpen: false,
  activeWorldId: null,
  savedWorlds: {},
})

export const createUISlice: StateCreator<WorkspaceState, [], [], UISlice> = (set) => ({
  ...getEmptyUIState(),
  displayMode: 'gm',
  inspectorPanelWidth: 768, // ровно 2x от старых 384px (w-96), см. Блок 5

  setViewedEntityId: (id) => set({ viewedEntityId: id }),
  setActiveView: (view) => set({ activeView: view }),
  setScratchpad: (text) => set({ scratchpad: text }),
  toggleScratchpad: () => set((state) => ({ isScratchpadOpen: !state.isScratchpadOpen })),
  setDisplayMode: (mode) => set({ displayMode: mode }),
  toggleDisplayMode: () => set((state) => ({ displayMode: state.displayMode === 'gm' ? 'player' : 'gm' })),
  setInspectorPanelWidth: (width) => set({ inspectorPanelWidth: Math.max(384, Math.min(1100, width)) }),

  switchWorld: (newId) =>
    set((state) => {
      if (!useWorkspaceStore.persist?.hasHydrated()) return state
      if (state.activeWorldId === newId) return state

      const newSavedWorlds = { ...state.savedWorlds }

      if (state.activeWorldId) {
        newSavedWorlds[state.activeWorldId] = {
          heroes: state.heroes,
          characters: state.characters,
          enemies: state.enemies,
          extras: state.extras,
          locations: state.locations,
          plotNodes: state.plotNodes,
          quests: state.quests,
          loot: state.loot,
          events: state.events,
          factions: state.factions,
          secrets: state.secrets,
          bestiary: state.bestiary,
          interactive: state.interactive,
          weather: state.weather,
          currentDay: state.currentDay,
          currentHour: state.currentHour,
          story: state.story,
          worldSystemPrompt: state.worldSystemPrompt,
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
