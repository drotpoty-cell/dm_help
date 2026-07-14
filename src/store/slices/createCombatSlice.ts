'use client'

import type { StateCreator } from 'zustand'
import type { WorkspaceState, Combatant, CombatState } from '@/types/workspace'
import { getEmptyCombatState } from '../storeConstants'

export interface CombatSlice {
  combat: CombatState

  startCombat: (mapId: string) => void
  endCombat: () => void
  nextTurn: () => void
  updateCombatantInitiative: (tokenId: string, initiative: number) => void
}

export const createCombatSlice: StateCreator<WorkspaceState, [], [], CombatSlice> = (set) => ({
  ...getEmptyCombatState(),

  startCombat: (mapId) =>
    set((state) => {
      const tokens = state.localMaps[mapId]?.tokens || {}
      const participants = Object.values(tokens)
        .filter((t) => ['hero', 'npc', 'monster'].includes(t.type))
        .map((t) => {
          const entity =
            state.heroes[t.entityId] ||
            state.npcs[t.entityId] ||
            state.bestiary[t.entityId] ||
            { hp: 10, maxHp: 10 }
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

  endCombat: () =>
    set(() => ({
      combat: { isActive: false, turnIndex: 0, participants: [] },
    })),

  nextTurn: () =>
    set((state) => ({
      combat: {
        ...state.combat,
        turnIndex: (state.combat.turnIndex + 1) % (state.combat.participants.length || 1),
      },
    })),

  updateCombatantInitiative: (tokenId, initiative) =>
    set((state) => {
      const participants = [...state.combat.participants]
      const index = participants.findIndex((p) => p.tokenId === tokenId)
      if (index !== -1) {
        participants[index].initiative = initiative
        participants.sort((a, b) => b.initiative - a.initiative)
      }
      return { combat: { ...state.combat, participants } }
    }),
})
