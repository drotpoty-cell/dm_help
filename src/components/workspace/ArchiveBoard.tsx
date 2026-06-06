'use client'

import { useMemo, useRef, useState } from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import {
  type LibraryCategory,
  type Event,
  type Hero,
  type Loot,
  type NPC,
  type Quest
} from '@/types/workspace'
import { BestiaryForm } from '@/components/workspace/archive/BestiaryForm'
import { FactionForm } from '@/components/workspace/archive/FactionForm'
import { HeroForm } from '@/components/workspace/archive/HeroForm'
import { NpcForm } from '@/components/workspace/archive/NpcForm'
import { CharacterForm } from '@/components/workspace/archive/CharacterForm'
import { ExtraForm } from '@/components/workspace/archive/ExtraForm'
import { QuestForm } from '@/components/workspace/archive/QuestForm'
import { LootForm } from '@/components/workspace/archive/LootForm'
import { EventForm } from '@/components/workspace/archive/EventForm'
import { LocationForm } from '@/components/workspace/archive/LocationForm'
import LootGeneratorModal from '@/components/workspace/ai/LootGeneratorModal'
import { toast } from 'sonner'
import EntityCard from './archive/EntityCard'
import { ArchiveHeader } from './archive/ArchiveHeader'
import { ArchiveSidebar } from './archive/ArchiveSidebar'
import { AiWand } from './ai/AiWand'

type ArchiveEntity = Hero | NPC | Quest | Loot | Event | { id: string; name?: string; title?: string; description?: string }

const isPlainObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

const isArchiveLike = (v: unknown) => {
  if (!isPlainObject(v)) return false
  const candidates = ['heroes', 'locations', 'npcs', 'quests', 'secrets', 'loot', 'events'] as const
  return candidates.some((k) => k in v)
}

export default function ArchiveBoard() {
  const [activeTab, setActiveTab] = useState<LibraryCategory>('heroes')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const [isLootModalOpen, setIsLootModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const library = useWorkspaceStore((state) => ({
    heroes: state.heroes,
    locations: state.locations,
    npcs: state.npcs,
    quests: state.quests,
    secrets: state.secrets,
    loot: state.loot,
    events: state.events,
    characters: state.characters,
    extras: state.extras,
    bestiary: state.bestiary,
    factions: state.factions
  }))

  const nodes = useWorkspaceStore((state) => state.nodes)
  const setNodes = useWorkspaceStore((state) => state.setNodes)
  const setLibrary = useWorkspaceStore((state) => state.setLibrary)
  const { addEntity, updateEntity, deleteEntity } = useWorkspaceStore()

  const tabs = [
    { id: 'heroes', label: 'Герои' },
    { id: 'characters', label: 'Действующие лица' },
    { id: 'extras', label: 'Массовка' },
    { id: 'factions', label: 'Фракции' },
    { id: 'bestiary', label: 'Бестиарий' },
    { id: 'locations', label: 'Локации' },
    { id: 'quests', label: 'Сюжеты' },
    { id: 'loot', label: 'Артефакты' },
    { id: 'events', label: 'События' },
    { id: 'secrets', label: 'Секреты' }
  ]

  const handleExport = () => {
    const dataToExport = {
      heroes: Object.values(library.heroes || {}),
      locations: Object.values(library.locations || {}),
      npcs: Object.values(library.npcs || {}),
      quests: Object.values(library.quests || {}),
      secrets: Object.values(library.secrets || {}),
      loot: Object.values(library.loot || {}),
      events: Object.values(library.events || {}),
      // Добавляем сюда для экспорта:
      characters: Object.values(library.characters || {}),
      extras: Object.values(library.extras || {}),
      bestiary: Object.values(library.bestiary || {}),
      factions: Object.values(library.factions || {})
    }
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `campaign_archive_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      let rawText = e.target?.result as string;
      let parsedData = null;

      try {
        const cleanText = rawText
          .replace(/^\uFEFF/, '') 
          .replace(/^```(json)?\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        parsedData = JSON.parse(cleanText);
      } catch (parseError: any) {
        console.error('Ошибка парсинга JSON:', parseError);
        alert(`Синтаксическая ошибка в файле:\n${parseError.message}`);
        return; 
      }

      try {
        const forceRecord = (data: any) => {
          if (!data) return {};
          if (Array.isArray(data)) {
            return data.reduce((acc: any, item: any) => {
              if (item) acc[item.id || crypto.randomUUID()] = item;
              return acc;
            }, {});
          }
          return typeof data === 'object' ? data : {};
        };

        const forcedState = {
          heroes: forceRecord(parsedData.heroes),
          locations: forceRecord(parsedData.locations),
          npcs: forceRecord(parsedData.npcs),
          quests: forceRecord(parsedData.quests),
          secrets: forceRecord(parsedData.secrets),
          loot: forceRecord(parsedData.loot),
          events: forceRecord(parsedData.events),
          // Добавляем то, что игнорировалось:
          characters: forceRecord(parsedData.characters),
          extras: forceRecord(parsedData.extras),
          bestiary: forceRecord(parsedData.bestiary),
          factions: forceRecord(parsedData.factions),
        };

        useWorkspaceStore.setState((state: any) => ({
          ...state,
          ...forcedState
        }));

        alert('Архив успешно загружен! Мешка в игре! 🎲');
        
      } catch (stateError: any) {
        console.error('Ошибка обновления стейта:', stateError);
        alert(`Ошибка обновления Архива:\n${stateError.message}`);
      }
      
      event.target.value = '';
    };
    
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const template = {
      "_INSTRUCTION_": "Заполни все поля. Верни JSON-массив объектов. Никакого текста до или после.",
      "locations": [],
      "factions": [],
      "characters": [],
      "extras": [],
      "bestiary": [],
      "quests": [],
      "loot": [],
      "events": [],
      "heroes": [],
      "secrets": []
    }
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `smart_gm_template.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleAdd = () => {
    const id = `ent-${Date.now()}`
    const base = { id, name: 'Новая запись', description: '' }
    const newEntity =
      activeTab === 'heroes'
        ? ({ id, name: 'Новый герой', playerName: '', raceClass: '', level: 1, hp: 10, maxHp: 10, ac: 10, initiativeModifier: 0, passivePerception: 10, description: '' } satisfies Hero)
        : activeTab === 'characters'
          ? ({ ...base, name: 'Новое лицо', raceClass: '', role: '', appearance: '', trueNature: '', secret: '', goal: '', flaw: '', factionId: null, relation: 'neutral', stats: '', inventory: '', schedule: [] } as any)
          : activeTab === 'extras'
            ? ({ ...base, name: 'Новый житель', occupation: '', quirk: '', knowledge: '', state: '' } as any)
            : activeTab === 'factions'
              ? ({ ...base, name: 'Новая фракция', type: '', symbol: '', goal: '', leaderId: null, headquartersId: null, reputation: '' } as any)
              : activeTab === 'bestiary'
                ? ({ ...base, name: 'Новый монстр', type: '', cr: '', combatStats: { ac: 10, hp: 10, speed: '30 футов', resistances: '' }, actions: '', tactics: '', drops: '' } as any)
                : activeTab === 'quests'
                  ? ({ id, title: 'Новый сюжет', description: '', hook: '', giver: '', reward: '', consequence: '', deadline: 0, status: 'available', locationId: null } satisfies Quest)
                  : activeTab === 'npcs'
                    ? ({ ...base, name: 'Новый персонаж', occupation: '', locationId: null, needsUpdate: false, isMajor: false, goal: '', secret: '', personalLoot: '', stats: '', notes: '', showSchedule: false, schedule: [] } satisfies NPC)
                    : activeTab === 'loot'
                      ? ({ ...base, name: 'Новый артефакт', rarity: 'common', price: 0, weight: 0, stats: '', ownerId: null } satisfies Loot)
                      : activeTab === 'events'
                        ? ({ ...base, name: 'Новое событие', startDay: 1, duration: 1, status: 'backlog' } satisfies Event)
                        : base

    addEntity(activeTab, newEntity)
  }

  const handlePlaceOnMap = (entity: any) => {
    if (activeTab === 'locations') {
      const newNode = {
        id: `node-${Date.now()}`, type: 'safe',
        position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        data: { label: entity.name, description: entity.description || '', entityId: entity.id, quests: [], needsUpdate: false, checks: entity.checks || [] }
      }
      setNodes([...nodes, newNode])
      toast.success('Локация добавлена на карту!')
    }
  }

  const currentItems = Object.values(library[activeTab] || {})
  const npcsList = useMemo(() => Object.values(library.npcs || {}) as NPC[], [library.npcs])
  const charactersList = useMemo(() => Object.values(library.characters || {}), [library.characters])
  const normalizedQuery = query.trim().toLowerCase()
  const filteredItems = useMemo(() => {
    if (!normalizedQuery) return currentItems as ArchiveEntity[]
    return (currentItems as ArchiveEntity[]).filter((e) => {
      const hay = String('title' in e ? e.title : ('name' in e ? e.name : '')).toLowerCase()
      return hay.includes(normalizedQuery)
    })
  }, [currentItems, normalizedQuery])

  const handleTabChange = (tab: LibraryCategory) => {
    setActiveTab(tab)
    setSelectedEntityId(null)
    setDeletingId(null)
    setQuery('')
  }

  return (
    <div className="absolute inset-0 bg-[#09090b] flex z-10">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-card { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
        .animate-float-card { animation: float-card 4s ease-in-out infinite; }
      `}} />
      <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" />

      <ArchiveSidebar
        tabs={tabs}
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        library={library}
        fileInputRef={fileInputRef}
        handleExport={handleExport}
        handleDownloadTemplate={handleDownloadTemplate}
      />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <ArchiveHeader
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            query={query}
            setQuery={setQuery}
            handleAdd={handleAdd}
            handleExport={handleExport}
            handleImport={() => fileInputRef.current?.click()}
            handleDownloadTemplate={handleDownloadTemplate}
            isLootTab={activeTab === 'loot'}
            setIsLootModalOpen={setIsLootModalOpen}
          />

          {isLootModalOpen && <LootGeneratorModal onClose={() => setIsLootModalOpen(false)} />}

          <div className="grid grid-cols-1 gap-3">
            {filteredItems.map((entity: ArchiveEntity) => (
              <div key={entity.id}>
                <div className="flex items-center gap-2">
                  <EntityCard
                    entity={entity as any}
                    type={activeTab}
                    isActive={selectedEntityId === entity.id}
                    onClick={() => setSelectedEntityId(selectedEntityId === entity.id ? null : entity.id)}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (deletingId === entity.id) {
                        deleteEntity(activeTab, entity.id)
                        setDeletingId(null)
                        if (selectedEntityId === entity.id) setSelectedEntityId(null)
                      } else {
                        setDeletingId(entity.id)
                      }
                    }}
                    onMouseLeave={() => setDeletingId(null)}
                    className={`shrink-0 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-colors ${
                      deletingId === entity.id ? 'text-red-300 bg-red-950/40 border-red-900/50 hover:bg-red-500 hover:text-white' : 'text-zinc-600 bg-zinc-950/40 border-zinc-800 hover:text-red-400 hover:border-red-900/50 hover:bg-red-950/20'
                    }`}
                  >
                    {deletingId === entity.id ? 'Точно?' : '✕'}
                  </button>
                </div>

                {selectedEntityId === entity.id && (
                  <div className="mt-3 p-4 bg-zinc-900 rounded-xl border border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-200">
                    {activeTab === 'heroes' && <HeroForm hero={entity as Hero} onUpdate={(data) => updateEntity('heroes', entity.id, data)} />}
                    {activeTab === 'extras' && <ExtraForm extra={entity} nodes={nodes} onUpdate={(data) => updateEntity('extras', entity.id, data)} />}
                    {activeTab === 'characters' && <CharacterForm character={entity} nodes={nodes} onUpdate={(data) => updateEntity('characters', entity.id, data)} />}
                    {activeTab === 'npcs' && <NpcForm npc={entity as NPC} nodes={nodes} onUpdate={(data) => updateEntity('npcs', entity.id, data)} />}
                    {activeTab === 'loot' && <LootForm loot={entity as Loot} nodes={nodes} npcs={npcsList} onUpdate={(data) => updateEntity('loot', entity.id, data)} />}
                    {activeTab === 'events' && <EventForm event={entity as Event} onUpdate={(data) => updateEntity('events', entity.id, data)} />}
                    {activeTab === 'bestiary' && <BestiaryForm threat={entity} onUpdate={(data) => updateEntity('bestiary', entity.id, data)} />}
                    {activeTab === 'factions' && <FactionForm faction={entity} nodes={nodes} characters={charactersList} onUpdate={(data) => updateEntity('factions', entity.id, data)} />}
                    {activeTab === 'quests' && <QuestForm quest={entity as Quest} nodes={nodes} npcs={npcsList} onUpdate={(data) => updateEntity('quests', entity.id, data)} />}
                    {activeTab === 'locations' && <LocationForm location={entity} onUpdate={(data) => updateEntity('locations', entity.id, data)} onPlaceOnMap={() => handlePlaceOnMap(entity)} />}
                    
                    {/* Форма для секретов */}
                    {activeTab === 'secrets' && (
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                            Скрытая информация
                          </label>
                          <AiWand 
                            mode="general"
                            currentValue={entity.description || ''}
                            contextData={entity}
                            onApply={(text) => updateEntity('secrets', entity.id, { description: text })}
                          />
                        </div>
                        <textarea
                          value={entity.description || ''}
                          onChange={(e) => updateEntity('secrets', entity.id, { description: e.target.value })}
                          placeholder="Детальное описание секрета..."
                          className="bg-zinc-950/50 border border-zinc-800 p-3 text-sm text-zinc-300 w-full resize-none outline-none leading-relaxed h-24 rounded-xl focus:border-indigo-500"
                        />
                        <div className="pt-3 border-t border-zinc-800/50">
                          <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest text-center">Доступно через @Упоминания в других местах</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {(currentItems.length === 0 || filteredItems.length === 0) && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-800 rounded-xl">
                <div className="mx-auto w-full max-w-sm flex flex-col items-center gap-4 text-zinc-600">
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" className="opacity-70">
                    <path d="M4 7a2 2 0 0 1 2-2h9l5 5v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M15 5v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M8 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M8 17h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <div className="text-xs font-black uppercase tracking-widest">{currentItems.length === 0 ? 'Здесь пока пусто' : 'Ничего не найдено'}</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-700">{currentItems.length === 0 ? 'Создайте первую запись в этой категории' : 'Попробуйте изменить запрос поиска'}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}