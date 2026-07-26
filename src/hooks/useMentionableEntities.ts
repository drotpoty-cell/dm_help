'use client'

import { useMemo } from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export interface MentionableEntity {
  id: string
  name: string
  category: string
  icon: string
}

const CATEGORY_ICONS: Record<string, string> = {
  characters: '👤',
  extras: '🧑',
  enemies: '⚔️',
  bestiary: '🐉',
  locations: '📍',
  quests: '📜',
  factions: '🚩',
  heroes: '🛡️',
}

/**
 * Единый источник кандидатов для @mention во всех текстовых полях приложения (Блок 4,
 * п.5 — "расширение текущей системы @mention"). Раньше (StoryBoard.tsx, SmartContent)
 * @mention работал только с characters/quests/locations через ручной regex-парсинг —
 * теперь это охватывает все именованные сущности сразу и работает как настоящий
 * автокомплит в RichTextEditor, а не просто подсветка совпавшего текста постфактум.
 * Осознанно не включает `secrets` — по решению из Блока 1 они не участвуют в @mention.
 */
export function useMentionableEntities(): MentionableEntity[] {
  const source = useWorkspaceStore((s) => ({
    characters: s.characters,
    extras: s.extras,
    enemies: s.enemies,
    bestiary: s.bestiary,
    locations: s.locations,
    quests: s.quests,
    factions: s.factions,
    heroes: s.heroes,
  }))

  return useMemo(() => {
    const all: MentionableEntity[] = []
    for (const category of Object.keys(source) as (keyof typeof source)[]) {
      for (const entity of Object.values(source[category]) as any[]) {
        const name = entity?.title || entity?.name
        if (!name) continue
        all.push({ id: entity.id, name, category, icon: CATEGORY_ICONS[category] || '•' })
      }
    }
    return all
  }, [source])
}
