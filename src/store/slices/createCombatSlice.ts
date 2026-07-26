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
  /** Правит HP (текущее и/или максимальное) и AC участника прямо во время боя —
   *  не трогает карточку сущности в архиве, только снапшот на время энкаунтера. */
  updateCombatantStats: (tokenId: string, data: Partial<Pick<Combatant, 'hp' | 'maxHp' | 'ac'>>) => void
  addCombatantStatus: (tokenId: string, status: string) => void
  removeCombatantStatus: (tokenId: string, status: string) => void
}

export const createCombatSlice: StateCreator<WorkspaceState, [], [], CombatSlice> = (set) => ({
  ...getEmptyCombatState(),

  startCombat: (mapId) =>
    set((state) => {
      const tokens = state.localMaps[mapId]?.tokens || {}
      // Токены персонажей (heroes/npc) И массовки (extra) И противников (enemies) —
      // раньше 'enemies'/'extra' сюда не попадали вовсе (см. комментарий у типа Combatant).
      const combatantTypes: Combatant['type'][] = ['hero', 'npc', 'enemies', 'extra']
      const participants = Object.values(tokens)
        .filter((t) => combatantTypes.includes(t.type as Combatant['type']))
        .map((t) => {
          const entity =
            state.heroes[t.entityId] ||
            state.characters[t.entityId] ||
            state.enemies[t.entityId] ||
            state.extras[t.entityId] ||
            state.bestiary[t.entityId] ||
            { hp: 10, maxHp: 10, ac: 10 }
          return {
            tokenId: t.id,
            entityId: t.entityId,
            type: t.type as Combatant['type'],
            initiative: 0,
            hp: (entity as any).hp ?? (entity as any).maxHp ?? 10,
            maxHp: (entity as any).maxHp ?? (entity as any).hp ?? 10,
            ac: (entity as any).ac ?? 10,
            statuses: [],
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
        participants[index] = { ...participants[index], initiative }
        participants.sort((a, b) => b.initiative - a.initiative)
      }
      return { combat: { ...state.combat, participants } }
    }),

  updateCombatantStats: (tokenId, data) =>
    set((state) => ({
      combat: {
        ...state.combat,
        participants: state.combat.participants.map((p) =>
          p.tokenId === tokenId ? { ...p, ...data } : p
        ),
      },
    })),

  addCombatantStatus: (tokenId, status) =>
    set((state) => ({
      combat: {
        ...state.combat,
        participants: state.combat.participants.map((p) =>
          p.tokenId === tokenId && !p.statuses.includes(status)
            ? { ...p, statuses: [...p.statuses, status] }
            : p
        ),
      },
    })),

  removeCombatantStatus: (tokenId, status) =>
    set((state) => ({
      combat: {
        ...state.combat,
        participants: state.combat.participants.map((p) =>
          p.tokenId === tokenId ? { ...p, statuses: p.statuses.filter((s) => s !== status) } : p
        ),
      },
    })),
})
