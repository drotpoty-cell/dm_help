'use client'

import { useMemo, useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
  Users,
  MapPin,
  ScrollText,
  Gem,
  Swords,
  Search,
  Settings,
} from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import type { LibraryCategory } from '@/types/workspace'
import EntityCard from '../archive/EntityCard'
import { InitiativeTracker } from '../InitiativeTracker'
import SettingsModal from '../SettingsModal'

const INVENTORY_TABS: {
  id: LibraryCategory
  label: string
  icon: typeof Users
}[] = [
  { id: 'npcs', label: 'NPC', icon: Users },
  { id: 'locations', label: 'Локации', icon: MapPin },
  { id: 'quests', label: 'Квесты', icon: ScrollText },
  { id: 'loot', label: 'Лут', icon: Gem },
]

export default function CockpitSidebar() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<LibraryCategory>('npcs')
  const [query, setQuery] = useState('')
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)

  const activeView = useWorkspaceStore((state) => state.activeView)
  const activeLocalMapId = useWorkspaceStore((state) => state.activeLocalMapId)
  const setViewedEntityId = useWorkspaceStore((state) => state.setViewedEntityId)
  const library = useWorkspaceStore((state) => ({
    npcs: state.npcs,
    locations: state.locations,
    quests: state.quests,
    loot: state.loot,
  }))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const filteredItems = useMemo(() => {
    const items = Object.values(library[activeTab as keyof typeof library] || {}) as any[]
    const normalized = query.trim().toLowerCase()
    const filtered = normalized
      ? items.filter((e) => {
          const hay = String(e.title || e.name || '').toLowerCase()
          return hay.includes(normalized)
        })
      : items
    return filtered.sort((a, b) => (a.order || 0) - (b.order || 0))
  }, [library, activeTab, query])

  const handleTabChange = (tab: LibraryCategory) => {
    setActiveTab(tab)
    setSelectedEntityId(null)
    setQuery('')
  }

  return (
    <aside className="w-72 shrink-0 flex flex-col h-full bg-zinc-950 border-r border-zinc-900">
      <div className="p-3 border-b border-zinc-900 space-y-3 shrink-0">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500">
            Инвентарь
          </h2>
          <span className="text-[10px] text-zinc-600 font-bold tabular-nums">
            {filteredItems.length}
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по имени…"
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
          />
        </div>

        <div className="grid grid-cols-4 gap-1">
          {INVENTORY_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                title={tab.label}
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-col items-center gap-1 px-1 py-2 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30'
                    : 'text-zinc-500 border-transparent hover:bg-zinc-900 hover:text-zinc-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[8px] font-black uppercase tracking-wider truncate w-full text-center">
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3">
        {filteredItems.length === 0 ? (
          <p className="text-[10px] text-zinc-600 italic tracking-wider text-center py-8">
            {query.trim() ? 'Ничего не найдено' : 'Список пуст'}
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter}>
            <SortableContext
              items={filteredItems.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {filteredItems.map((entity) => (
                  <EntityCard
                    key={entity.id}
                    entity={entity}
                    type={activeTab}
                    isActive={selectedEntityId === entity.id}
                    onClick={() => {
                      setSelectedEntityId(entity.id)
                      setViewedEntityId(entity.id)
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {activeView === 'map' && activeLocalMapId && (
        <div className="p-3 border-t border-zinc-900 shrink-0">
          <div className="flex items-center gap-2 mb-2 text-zinc-500">
            <Swords className="w-3.5 h-3.5" />
            <h2 className="text-[10px] uppercase tracking-wider font-semibold">Инициатива</h2>
          </div>
          <InitiativeTracker />
        </div>
      )}

      <div className="p-3 border-t border-zinc-900 shrink-0">
        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-xl transition-colors w-full"
        >
          <Settings className="w-4 h-4" />
          Настройки
        </button>
      </div>

      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </aside>
  )
}
