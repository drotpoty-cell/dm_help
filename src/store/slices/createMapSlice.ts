'use client'

import type { StateCreator } from 'zustand'
import {
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
} from 'reactflow'
import type { WorkspaceState, LocalMapData, BattleToken } from '@/types/workspace'

export interface MapSlice {
  nodes: Node[]
  edges: Edge[]
  localMaps: Record<string, LocalMapData>
  activeLocalMapId: string | null

  setNodes: (nodes: Node[]) => void
  onNodesChange: (changes: NodeChange[]) => void
  setEdges: (edges: Edge[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  updateNodeData: (nodeId: string, field: string, value: any) => void
  addNode: (node: Node) => void
  deleteNode: (id: string) => void
  spawnEntityToMap: (
    locationId: string,
    entity: any,
    type: 'hero' | 'npc' | 'poi' | 'check' | 'enemies' | 'crowd' | 'loot',
    x?: number,
    y?: number
  ) => void
  updateLocalToken: (locationId: string, tokenId: string, data: Partial<BattleToken>) => void
  removeLocalToken: (locationId: string, tokenId: string) => void
  updateMapCamera: (
    locationId: string,
    camera: { cameraX?: number; cameraY?: number; zoom?: number }
  ) => void
  updateMapBackground: (locationId: string, backgroundImage: string | null) => void
  clearLocalMapTokens: (locationId: string) => void
}

export const getEmptyMapState = (): Pick<
  MapSlice,
  'nodes' | 'edges' | 'localMaps' | 'activeLocalMapId'
> => ({
  nodes: [],
  edges: [],
  localMaps: {},
  activeLocalMapId: null,
})

export const createMapSlice: StateCreator<WorkspaceState, [], [], MapSlice> = (set) => ({
  ...getEmptyMapState(),

  setNodes: (nodes) => set({ nodes }),

  onNodesChange: (changes) =>
    set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) })),

  setEdges: (edges) => set({ edges }),

  onEdgesChange: (changes) =>
    set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),

  updateNodeData: (nodeId, field, value) =>
    set((state) => {
      const node = state.nodes.find((n) => n.id === nodeId)
      const nodes = state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, [field]: value } } : n
      )

      if (node?.data?.entityId) {
        const updateData: Record<string, any> = {}
        if (field === 'label') updateData.name = value
        if (field === 'description') updateData.description = value

        if (Object.keys(updateData).length > 0) {
          return {
            nodes,
            locations: {
              ...state.locations,
              [node.data.entityId]: {
                ...state.locations[node.data.entityId],
                ...updateData,
              },
            },
          }
        }
      }

      return { nodes }
    }),

  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),

  deleteNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
    })),

  updateMapCamera: (locationId, camera) =>
    set((state) => ({
      localMaps: {
        ...state.localMaps,
        [locationId]: {
          ...state.localMaps[locationId],
          ...camera,
        },
      },
    })),

  updateMapBackground: (locationId, backgroundImage) =>
    set((state) => {
      const existingMap = state.localMaps[locationId] || {
        gridSize: 60,
        tokens: {},
        backgroundImage: null,
      }
      return {
        localMaps: {
          ...state.localMaps,
          [locationId]: { ...existingMap, backgroundImage },
        },
      }
    }),

  updateLocalToken: (locationId, tokenId, data) =>
    set((state) => ({
      localMaps: {
        ...state.localMaps,
        [locationId]: {
          ...state.localMaps[locationId],
          tokens: {
            ...state.localMaps[locationId]?.tokens,
            [tokenId]: { ...state.localMaps[locationId]?.tokens[tokenId], ...data },
          },
        },
      },
    })),

  spawnEntityToMap: (locationId, entity, type, x, y) =>
    set((state) => {
      const nextLocalMaps = { ...state.localMaps }
      const tokenId = `token-${Date.now()}`

      const typeToCategory: Record<string, string> = {
        hero: 'heroes',
        npc: 'npcs',
        enemies: 'enemies',
        crowd: 'crowd',
        loot: 'loot',
        poi: 'interactive',
        check: 'interactive',
      }
      const category = typeToCategory[type] || type
      const currentCategoryState =
        (state[category as keyof WorkspaceState] as Record<string, any>) || {}

      const newEntity =
        type === 'poi' || type === 'check'
          ? {
              id: entity.id,
              name: type === 'poi' ? 'Новая точка интереса' : 'Новая проверка',
              description: '',
              dc: type === 'check' ? 10 : undefined,
              type,
            }
          : entity

      const updatedLibrary = {
        ...currentCategoryState,
        [entity.id]: { ...(currentCategoryState[entity.id] || {}), ...newEntity },
      }

      Object.keys(nextLocalMaps).forEach((locId) => {
        if (nextLocalMaps[locId]?.tokens) {
          nextLocalMaps[locId].tokens = Object.fromEntries(
            Object.entries(nextLocalMaps[locId].tokens).filter(([, t]) => t.entityId !== entity.id)
          )
        }
      })

      const newToken = {
        id: tokenId,
        entityId: entity.id,
        type,
        locationId,
        x: x ?? 0,
        y: y ?? 0,
        size: 1,
      } as const

      const targetMap = nextLocalMaps[locationId] || { gridSize: 60, tokens: {} }
      nextLocalMaps[locationId] = {
        ...targetMap,
        tokens: { ...targetMap.tokens, [tokenId]: newToken as any },
      }

      let nextInteractive = state.interactive
      if (type === 'poi' || type === 'check') {
        nextInteractive = {
          ...state.interactive,
          [entity.id]: {
            id: entity.id,
            name: newEntity.name,
            type,
            description: '',
            dc: newEntity.dc,
            successResult: entity.successResult || '',
            failureResult: entity.failureResult || '',
          },
        }
      }

      return { localMaps: nextLocalMaps, [category]: updatedLibrary, interactive: nextInteractive }
    }),

  removeLocalToken: (locationId, tokenId) =>
    set((state) => {
      const nextTokens = { ...state.localMaps[locationId]?.tokens }
      delete nextTokens[tokenId]
      return {
        localMaps: {
          ...state.localMaps,
          [locationId]: {
            ...state.localMaps[locationId],
            tokens: nextTokens,
          },
        },
      }
    }),

  clearLocalMapTokens: (locationId) =>
    set((state) => {
      const map = state.localMaps[locationId]
      if (!map) return state
      return {
        localMaps: {
          ...state.localMaps,
          [locationId]: { ...map, tokens: {} },
        },
      }
    }),
})
