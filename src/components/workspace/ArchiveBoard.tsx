'use client'

import { useMemo, useState } from 'react'
import { Users, MapPin, ScrollText, Gem, Swords, Search, Skull, UsersRound, Flag, Drama, Plus, Calendar as CalendarIcon } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { createBlankEntity } from '@/utils/createBlankEntity'
import { confirmToast } from '@/utils/confirmToast'

type ArchiveCategory = 'heroes' | 'characters' | 'extras' | 'enemies' | 'bestiary' | 'locations' | 'quests' | 'loot' | 'events' | 'factions'

const CATEGORIES: { id: ArchiveCategory; label: string; icon: typeof Users }[] = [
  { id: 'heroes', label: 'Герои', icon: Users },
  { id: 'characters', label: 'Персонажи', icon: Drama },
  { id: 'extras', label: 'Массовка', icon: UsersRound },
  { id: 'enemies', label: 'Враги', icon: Swords },
  { id: 'bestiary', label: 'Бестиарий', icon: Skull },
  { id: 'locations', label: 'Локации', icon: MapPin },
  { id: 'quests', label: 'Квесты', icon: ScrollText },
  { id: 'loot', label: 'Лут', icon: Gem },
  { id: 'events', label: 'События', icon: CalendarIcon },
  { id: 'factions', label: 'Фракции', icon: Flag },
]

/**
 * Вкладка "Архив" (Блок 4, п.3) — полноэкранный браузер по всем категориям сущностей
 * сразу, вместо узкого CockpitSidebar (который остаётся как есть — он нужен для
 * быстрого доступа/drag-n-drop на карту, это разные сценарии использования). Заменяет
 * собой старую отдельную вкладку "Герои": здесь герои — просто одна из категорий, наравне
 * со всеми остальными.
 */
export default function ArchiveBoard() {
  const [activeCategory, setActiveCategory] = useState<ArchiveCategory>('characters')
  const [query, setQuery] = useState('')

  const library = useWorkspaceStore((state) => ({
    heroes: state.heroes,
    characters: state.characters,
    extras: state.extras,
    enemies: state.enemies,
    bestiary: state.bestiary,
    locations: state.locations,
    quests: state.quests,
    loot: state.loot,
    events: state.events,
    factions: state.factions,
  }))
  const addEntity = useWorkspaceStore((s) => s.addEntity)
  const deleteEntity = useWorkspaceStore((s) => s.deleteEntity)
  const setViewedEntityId = useWorkspaceStore((s) => s.setViewedEntityId)
  const isReadOnly = useWorkspaceStore((s) => s.displayMode === 'player')

  const items = useMemo(() => {
    const all = Object.values(library[activeCategory] || {}) as any[]
    const normalized = query.trim().toLowerCase()
    if (!normalized) return all
    return all.filter((e) => String(e.title || e.name || '').toLowerCase().includes(normalized))
  }, [library, activeCategory, query])

  const handleCreate = () => {
    const entity = createBlankEntity(activeCategory)
    addEntity(activeCategory, entity)
    setViewedEntityId(entity.id)
  }

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation()
    confirmToast(`Удалить «${name}» без возможности восстановления?`, () => deleteEntity(activeCategory, id))
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#09090b] overflow-hidden">
      <div className="flex items-center gap-2 px-6 pt-5 pb-3 border-b border-zinc-900 overflow-x-auto shrink-0">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const isActive = activeCategory === cat.id
          const count = Object.keys(library[cat.id] || {}).length
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                isActive ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {cat.label}
              <span className={`text-[10px] ${isActive ? 'text-indigo-200' : 'text-zinc-600'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3 px-6 py-4 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по имени..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-200 outline-none focus:border-indigo-500"
          />
        </div>
        {!isReadOnly && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest px-3 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Добавить
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6">
        {items.length === 0 ? (
          <div className="text-center text-zinc-600 text-sm italic py-20 border-2 border-dashed border-zinc-900 rounded-2xl">
            {query ? 'Ничего не найдено' : 'В этой категории пока пусто'}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((entity) => (
              <div
                key={entity.id}
                onClick={() => setViewedEntityId(entity.id)}
                className="bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-indigo-600/50 rounded-xl p-4 cursor-pointer transition-colors group flex flex-col gap-1.5 min-h-[92px]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-sm text-zinc-100 truncate">{entity.title || entity.name || 'Без имени'}</span>
                  {!isReadOnly && (
                    <button
                      onClick={(e) => handleDelete(e, entity.id, entity.title || entity.name || 'запись')}
                      className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 text-xs shrink-0 transition-opacity"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className="text-xs text-zinc-500 line-clamp-2">{entity.description || '\u00A0'}</p>
                {entity.isImportant && (
                  <span className="text-[9px] font-black uppercase text-amber-400 tracking-widest mt-auto">★ Важный</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
