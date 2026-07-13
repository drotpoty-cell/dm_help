'use client'

import type { StateCreator } from 'zustand'
import type { Node, Edge } from 'reactflow'
import type {
  WorkspaceState,
  LibraryCategory,
  Hero,
  NPC,
  Enemy,
  EntityStatus,
  BaseEntity,
  Quest,
  Loot,
  Event,
} from '@/types/workspace'
import { cleanLocationLinks, getEmptyLibraryState, updateInLibrary } from '../storeConstants'

export interface LibrarySlice {
  heroes: Record<string, Hero>
  npcs: Record<string, NPC>
  enemies: Record<string, Enemy>
  quests: Record<string, Quest>
  locations: Record<string, BaseEntity>
  factions: Record<string, any>
  bestiary: Record<string, any>
  interactive: Record<string, any>
  characters: Record<string, any>
  extras: Record<string, any>
  crowd: Record<string, any>
  secrets: Record<string, BaseEntity>
  loot: Record<string, Loot>
  events: Record<string, Event>

  setLibrary: (library: any) => void
  addEntity: (category: LibraryCategory, entity: any) => void
  updateEntity: (category: LibraryCategory, id: string, data: any) => void
  deleteEntity: (category: LibraryCategory, id: string) => void
  updateQuestStatus: (questId: string, newStatus: EntityStatus) => void
  updateHero: (id: string, data: Partial<Hero>) => void
  updateNpc: (id: string, data: Partial<NPC>) => void
  addEnemy: (enemy: Enemy) => void
  updateEnemy: (id: string, data: Partial<Enemy>) => void
  deleteEnemy: (id: string) => void
  importAIData: (data: any) => void
  clearNeedsUpdate: (type: 'node' | 'npc' | 'character' | 'enemy', targetId: string) => void
}

export const createLibrarySlice: StateCreator<WorkspaceState, [], [], LibrarySlice> = (set) => ({
  ...getEmptyLibraryState(),

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
      characters: toRecord(library.characters || []),
      extras: toRecord(library.extras || []),
      bestiary: toRecord(library.bestiary || []),
      factions: toRecord(library.factions || []),
    })
  },

  addEntity: (category, entity) =>
    set((state) => ({
      [category]: { ...state[category], [entity.id]: entity },
    })),

  updateEntity: (category, id, data) =>
    set((state) => {
      const result = updateInLibrary(state, category, id, (prev) => {
        const next = { ...(prev as object), ...(data as object) } as any
        if (
          (category === 'npcs' || category === 'characters' || category === 'extras') &&
          data &&
          typeof data === 'object' &&
          'locationId' in data
        ) {
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
              description: patch.description !== undefined ? patch.description : n.data.description,
            },
          }
        })
        return { ...result, nodes: nextNodes }
      }

      return result
    }),

  deleteEntity: (category, id) =>
    set((state) => {
      const record = { ...(state[category] as Record<string, unknown>) }
      if (!(id in record)) return state
      delete record[id]

      if (category === 'locations') {
        const removedNodeIds = state.nodes
          .filter((n: Node) => n.data?.entityId === id)
          .map((n: Node) => n.id)
        const nextNodes = state.nodes.filter((n: Node) => n.data?.entityId !== id)
        const nextEdges = state.edges.filter(
          (e: Edge) => !removedNodeIds.includes(e.source) && !removedNodeIds.includes(e.target)
        )

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
          extras: nextExtras,
        }
      }

      return { ...state, [category]: record }
    }),

  updateQuestStatus: (questId, newStatus) =>
    set((state) => {
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
          if (char.locationId === quest.locationId)
            updatedCharacters[char.id] = { ...char, needsUpdate: true }
        })
        updatedNodes = updatedNodes.map((n) =>
          n.id === quest.locationId ? { ...n, data: { ...n.data, needsUpdate: true } } : n
        )
      }
      return {
        quests: { ...state.quests, [questId]: { ...quest, status: newStatus } },
        npcs: updatedNpcs,
        characters: updatedCharacters,
        nodes: updatedNodes,
      }
    }),

  updateHero: (id, data) =>
    set((state) => ({
      heroes: { ...state.heroes, [id]: { ...state.heroes[id], ...data } },
    })),

  updateNpc: (id, data) =>
    set((state) => ({
      npcs: { ...state.npcs, [id]: { ...state.npcs[id], ...data } },
    })),

  addEnemy: (enemy) =>
    set((state) => ({
      enemies: { ...state.enemies, [enemy.id]: enemy },
    })),

  updateEnemy: (id, data) =>
    set((state) => ({
      enemies: { ...state.enemies, [id]: { ...state.enemies[id], ...data } },
    })),

  deleteEnemy: (id) =>
    set((state) => {
      const enemies = { ...state.enemies }
      delete enemies[id]
      return { enemies }
    }),

  importAIData: (data) =>
    set((state) => {
      const mergeData = (stateRecord: Record<string, any>, dataArray: any[]) => {
        const result = { ...stateRecord }
        if (Array.isArray(dataArray)) {
          dataArray.forEach((item: any) => {
            if (item.id) result[item.id] = { ...result[item.id], ...item }
          })
        }
        return result
      }

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
        extras: mergeData(state.extras, data.extras),
      }
    }),

  clearNeedsUpdate: (type, targetId) =>
    set((state) => {
      if (type === 'node')
        return {
          nodes: state.nodes.map((n: Node) =>
            n.id === targetId ? { ...n, data: { ...n.data, needsUpdate: false } } : n
          ),
        }
      if (type === 'npc' && state.npcs[targetId])
        return { npcs: { ...state.npcs, [targetId]: { ...state.npcs[targetId], needsUpdate: false } } }
      if (type === 'character' && state.characters[targetId])
        return {
          characters: {
            ...state.characters,
            [targetId]: { ...state.characters[targetId], needsUpdate: false },
          },
        }
      return state
    }),
})
