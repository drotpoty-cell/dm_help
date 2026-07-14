'use client'

import type { WorkspaceState, LibraryState } from '@/types/workspace'
import { getEmptyMapState } from './slices/createMapSlice'
import type { CombatSlice } from './slices/createCombatSlice'
import type { SystemSlice } from './slices/createSystemSlice'

export type { WorkspaceState, LibraryState, LibraryCategory } from '@/types/workspace'

export const getEmptyCombatState = (): Pick<CombatSlice, 'combat'> => ({
  combat: { isActive: false, turnIndex: 0, participants: [] },
})

export const getEmptySystemState = (): Pick<
  SystemSlice,
  'weather' | 'currentDay' | 'currentHour' | 'story' | 'plotNodes' | 'partyLocationId'
> => ({
  story: [],
  plotNodes: {},
  partyLocationId: null,
  currentDay: 1,
  currentHour: 8,
  weather: {
    mode: 'disabled' as const,
    condition: 'Ясно',
    temp: 20,
    interval: 24,
    hoursSinceChange: 0,
    climate: 'temperate' as const,
    forecast: {},
  },
})

export const getEmptyWorldState = () => ({
  ...getEmptyMapState(),
  ...getEmptySystemState(),
  ...getEmptyCombatState(),
  heroes: {},
  npcs: {},
  enemies: {},
  crowd: {},
  locations: {},
  extras: {},
  quests: {},
  loot: {},
  events: {},
  factions: {},
  secrets: {},
  characters: {},
  bestiary: {},
  interactive: {},
  viewedEntityId: null,
  activeView: 'map' as const,
  scratchpad: '',
  isScratchpadOpen: false,
  activeWorldId: null,
  savedWorlds: {},
})

export const getEmptyLibraryState = (): LibraryState => {
  const world = getEmptyWorldState()
  return {
    heroes: world.heroes,
    npcs: world.npcs,
    enemies: world.enemies,
    crowd: world.crowd,
    quests: world.quests,
    locations: world.locations,
    secrets: world.secrets,
    loot: world.loot,
    events: world.events,
    characters: world.characters,
    extras: world.extras,
    bestiary: world.bestiary,
    factions: world.factions,
    interactive: world.interactive,
  }
}

export const cleanLocationLinks = (entities: Record<string, any>, nodeId: string) => {
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

export const updateInLibrary = <K extends keyof LibraryState>(
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
    [category]: { ...record, [id]: next },
  } as WorkspaceState
}
