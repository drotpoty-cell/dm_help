import type { LibraryCategory } from '@/types/workspace'
import { generateId } from '@/utils/id'

/** Заголовок сущности по умолчанию — квесты используют `title`, всё остальное `name`. */
export function createBlankEntity(category: LibraryCategory) {
  const base = { id: generateId(category) }
  if (category === 'quests') {
    return { ...base, title: 'Новый квест', description: '', status: 'active', locationId: null }
  }
  if (category === 'heroes') {
    // Разумные дефолты игромеханики — раньше это делал отдельный HeroesBoard.tsx.
    return {
      ...base,
      name: 'Новый герой',
      class: 'Воин',
      level: 1,
      hp: 10,
      maxHp: 10,
      ac: 10,
      passivePerception: 10,
      initiativeModifier: 0,
      notes: '',
      description: '',
    }
  }
  return { ...base, name: 'Новая запись', description: '' }
}
