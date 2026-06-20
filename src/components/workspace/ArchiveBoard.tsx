'use client'

import { useMemo, useRef, useState } from 'react'
import { z } from 'zod';
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';


const AiEntitySchema = z.object({
  id: z.string().min(1).catch(() => `gen-${crypto.randomUUID()}`),
  name: z.string().catch('Безымянная сущность'),
}).passthrough();

const CategorySchema = z.array(AiEntitySchema).catch([]);
import {
  type LibraryCategory,
  type Event,
  type Hero,
  type Loot,
  type NPC,
  type Enemy,
  type Quest
} from '@/types/workspace'
import { BestiaryForm } from '@/components/workspace/archive/BestiaryForm'
import { EnemyForm } from '@/components/workspace/archive/EnemyForm'
import { FactionForm } from '@/components/workspace/archive/FactionForm'
import { HeroForm } from '@/components/workspace/archive/HeroForm'
import { NpcForm } from '@/components/workspace/archive/NpcForm'
import { CharacterForm } from '@/components/workspace/archive/CharacterForm'
import { ExtraForm } from '@/components/workspace/archive/ExtraForm'
import { CrowdForm } from '@/components/workspace/archive/CrowdForm'
import { QuestForm } from '@/components/workspace/archive/QuestForm'
import { LootForm } from '@/components/workspace/archive/LootForm'
import { EventForm } from '@/components/workspace/archive/EventForm'
import { LocationForm } from '@/components/workspace/archive/LocationForm'
import LootGeneratorModal from '@/components/workspace/ai/LootGeneratorModal'
import { generateAIPromptTemplate } from '@/utils/aiTemplateGenerator'
import { toast } from 'sonner'
import EntityCard from './archive/EntityCard'
import { DataSyncModal } from './archive/DataSyncModal'
import { ArchiveHeader } from './archive/ArchiveHeader'
import { ArchiveSidebar } from './archive/ArchiveSidebar'
import { AiWand } from './ai/AiWand'

type ArchiveEntity = Hero | NPC | Enemy | Quest | Loot | Event | { id: string; name?: string; title?: string; description?: string }

const isPlainObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

const isArchiveLike = (v: unknown) => {
  if (!isPlainObject(v)) return false
  const candidates = ['heroes', 'locations', 'npcs', 'enemies', 'quests', 'secrets', 'loot', 'events'] as const
  return candidates.some((k) => k in v)
}

export default function ArchiveBoard() {
  const [activeTab, setActiveTab] = useState<LibraryCategory>('heroes')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDataSyncModalOpen, setIsDataSyncModalOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  
  const [isLootModalOpen, setIsLootModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const importAIData = useWorkspaceStore((state) => (state as any).importAIData)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const library = useWorkspaceStore((state) => ({
    heroes: state.heroes,
    locations: state.locations,
    npcs: state.npcs,
    enemies: state.enemies,
    quests: state.quests,
    secrets: state.secrets,
    loot: state.loot,
    events: state.events,
    characters: state.characters,
    extras: state.extras,
    bestiary: state.bestiary,
    factions: state.factions,
    crowd: state.crowd,
    interactive: state.interactive
  }))

  const nodes = useWorkspaceStore((state) => state.nodes)
  const setNodes = useWorkspaceStore((state) => state.setNodes)
  const { addEntity, updateEntity, deleteEntity } = useWorkspaceStore()

  const tabs = [
    { id: 'heroes', label: 'ГЕРОИ' },
    { id: 'npcs', label: 'ДЕЙСТВУЮЩИЕ ЛИЦА' },
    { id: 'enemies', label: 'ПРОТИВНИКИ' },
    { id: 'crowd', label: 'МАССОВКА' },
    { id: 'extras', label: 'ДОП. МАТЕРИАЛЫ' },
    { id: 'factions', label: 'ФРАКЦИИ' },
    { id: 'locations', label: 'ЛОКАЦИИ' },
    { id: 'quests', label: 'СЮЖЕТЫ' },
    { id: 'loot', label: 'АРТЕФАКТЫ' },
    { id: 'events', label: 'СОБЫТИЯ' },
    { id: 'interactive', label: 'ИНТЕРАКТИВНЫЕ ОБЪЕКТЫ' }
  ]

  const handleExport = () => {
    const dataToExport = {
      heroes: Object.values(library.heroes || {}),
      locations: Object.values(library.locations || {}),
      npcs: Object.values(library.npcs || {}),
      enemies: Object.values(library.enemies || {}),
      quests: Object.values(library.quests || {}),
      secrets: Object.values(library.secrets || {}),
      loot: Object.values(library.loot || {}),
      events: Object.values(library.events || {}),
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
    try {
      const rawText = e.target?.result as string;
      const cleanText = rawText.replace(/^\uFEFF/, '').replace(/^```(json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsedData = JSON.parse(cleanText);

      const safeParseToRecord = (rawData: any) => {
        const arrayData = Array.isArray(rawData) ? rawData : (typeof rawData === 'object' && rawData !== null ? Object.values(rawData) : []);
        const validArray = CategorySchema.parse(arrayData);
        return validArray.reduce((acc: Record<string, any>, item) => {
          if (item && item.id) acc[item.id] = item;
          return acc;
        }, {});
      };

      const safeState = {
        heroes: safeParseToRecord(parsedData.heroes),
        locations: safeParseToRecord(parsedData.locations),
        npcs: safeParseToRecord(parsedData.npcs),
        enemies: safeParseToRecord(parsedData.enemies),
        quests: safeParseToRecord(parsedData.quests),
        secrets: safeParseToRecord(parsedData.secrets),
        loot: safeParseToRecord(parsedData.loot),
        events: safeParseToRecord(parsedData.events),
        characters: safeParseToRecord(parsedData.characters),
        extras: safeParseToRecord(parsedData.extras),
        bestiary: safeParseToRecord(parsedData.bestiary),
        factions: safeParseToRecord(parsedData.factions),
      };

      useWorkspaceStore.setState((state: any) => ({
        ...state,
        heroes: { ...state.heroes, ...safeState.heroes },
        locations: { ...state.locations, ...safeState.locations },
        npcs: { ...state.npcs, ...safeState.npcs },
        enemies: { ...state.enemies, ...safeState.enemies },
        quests: { ...state.quests, ...safeState.quests },
        secrets: { ...state.secrets, ...safeState.secrets },
        loot: { ...state.loot, ...safeState.loot },
        events: { ...state.events, ...safeState.events },
        characters: { ...state.characters, ...safeState.characters },
        extras: { ...state.extras, ...safeState.extras },
        bestiary: { ...state.bestiary, ...safeState.bestiary },
        factions: { ...state.factions, ...safeState.factions },
      }));

      toast.success('Архив успешно загружен и отвалидирован!');
    } catch (err) {
      toast.error('Ошибка структуры файла.');
      console.error('Import Error:', err);
    }
    event.target.value = '';
  };
  reader.readAsText(file);
};

  const handleDownloadTemplate = () => {
    const template = {
      "_INSTRUCTION_": "ВНИМАНИЕ! Верни СТРОГО один JSON-объект. Каждая категория (locations, factions, npcs, enemies, characters, extras, quests, loot, events, heroes) должна быть ОБЪЕКТОМ (словарём), где ключи — это уникальные ID (например, 'loc_1'), а значения — сами данные. Удали эту инструкцию из ответа. Для всех персонажей (npcs, heroes) обязательно добавляй пустой массив schedule: [] и поля defaultLocationId, locationId, currentActivity.",
      "locations": {
        "loc_1": { "id": "loc_1", "name": "Название локации", "description": "Описание", "type": "hub", "order": 1 }
      },
      "factions": {
        "fac_1": { "id": "fac_1", "name": "Название фракции", "description": "Описание", "alignment": "Neutral", "status": "active", "order": 1 }
      },
      "npcs": {
        "npc_1": { "id": "npc_1", "name": "Имя NPC", "currentRole": "Роль", "description": "Описание", "traits": ["черта1", "черта2"], "order": 1, "defaultLocationId": "loc_1", "locationId": "loc_1", "currentActivity": "Ожидает", "schedule": [] }
      },
      "enemies": {
        "enemy_1": { "id": "enemy_1", "name": "Гоблин", "description": "Опасный", "hp": 15, "maxHp": 15, "ac": 14, "cr": "1/4", "attacks": "Нож (+4, 1d4+2)" }
      },
      "characters": {},
      "extras": {
        "ext_1": { "id": "ext_1", "name": "Секрет, лор или атмосфера", "description": "Описание", "order": 1, "defaultLocationId": "", "locationId": "", "currentActivity": "", "schedule": [] }
      },
      "quests": {
        "quest_1": { "id": "quest_1", "title": "Название квеста", "type": "main", "description": "Описание", "reward": "Награда", "status": "available", "order": 1 }
      },
      "loot": {
        "item_1": { "id": "item_1", "name": "Название предмета", "type": "Снаряжение", "description": "Описание", "status": "available", "order": 1 }
      },
      "events": {
        "event_1": { "id": "event_1", "name": "Название события", "description": "Описание", "day": 1, "status": "pending", "order": 1 }
      },
      "heroes": {
        "hero_1": { "id": "hero_1", "name": "Имя героя", "currentRole": "Игрок", "description": "Место для игрока", "order": 1, "defaultLocationId": "", "locationId": "", "currentActivity": "", "schedule": [] }
      }
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
    const order = Date.now()
    const base = { id, name: 'Новая запись', description: '', order }
    const newEntity =
      activeTab === 'heroes'
        ? ({ id, name: 'Новый герой', playerName: '', raceClass: '', level: 1, hp: 10, maxHp: 10, ac: 10, initiativeModifier: 0, passivePerception: 10, description: '', order } as Hero)
        : activeTab === 'characters'
          ? ({ ...base, name: 'Новое лицо', raceClass: '', role: '', relation: 'neutral', description: '', traits: '', ideals: '', bonds: '', flaws: '', appearance: '', secret: '', relations: '', currentRole: '', defaultLocationId: '' } as any)
          : activeTab === 'extras'
            ? ({ ...base, name: 'Новый житель', occupation: '', quirk: '', knowledge: '', state: '', defaultLocationId: '' } as any)
            : activeTab === 'factions'
              ? ({ ...base, name: 'Новая фракция', type: '', symbol: '', goal: '', leaderId: null, headquartersId: null, reputation: '', currentRole: '', status: 'active' } as any)
              : activeTab === 'bestiary'
                ? ({ ...base, name: 'Новый монстр', type: '', cr: '', combatStats: { ac: 10, hp: 10, speed: '30 футов', resistances: '' }, actions: '', tactics: '', drops: '' } as any)
                : activeTab === 'quests'
                  ? ({ id, title: 'Новый сюжет', description: '', hook: '', giver: '', reward: '', consequence: '', deadline: 0, status: 'available', locationId: null, order } as Quest)
                  : activeTab === 'npcs'
                    ? ({ ...base, name: 'Новый персонаж', occupation: '', locationId: null, needsUpdate: false, goal: '', secret: '', personalLoot: '', stats: '', notes: '', showSchedule: false, schedule: [], traits: [], defaultLocationId: '' } satisfies NPC)
                    : activeTab === 'enemies'
                      ? ({ id, name: 'Новый противник', description: '', hp: 10, maxHp: 10, ac: 10, cr: '1', attacks: '', order } as Enemy)
                    : activeTab === 'loot'
                      ? ({ ...base, name: 'Новый артефакт', rarity: 'common', price: 0, weight: 0, stats: '', ownerId: null, detailedDescription: '', status: 'unclaimed' } as Loot)
                    : activeTab === 'interactive'
                      ? ({ id, name: 'Новый интерактивный объект', description: '', type: 'poi' })
                      : activeTab === 'events'
                        ? ({ ...base, name: 'Новое событие', startDay: 1, duration: 1, status: 'backlog' } as Event)
                        : activeTab === 'locations'
                          ? ({ ...base, name: 'Новая локация', secrets: '', charactersInside: '', currentState: '', status: 'discovered' } as any)
                          : base
    
    if (activeTab !== 'interactive') {
      addEntity(activeTab as Exclude<LibraryCategory, 'interactive'>, newEntity)
    } else {
      addEntity('interactive', newEntity)
    }
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

  const currentItems = useMemo(() => {
    if (activeTab === 'interactive') {
      return Object.values(library.interactive || {}); // Читаем напрямую из нужного стейта!
    }
    return Object.values(library[activeTab as Exclude<LibraryCategory, 'interactive'>] || {})
  }, [library, activeTab])

  const getLocationName = (locationId?: string) => {
    if (!locationId) return "Локация неизвестна"
    const location = library.locations?.[locationId]
    return location?.name || "Локация неизвестна"
  }
  
  const selectedEntity = useMemo(() => {
    if (!selectedEntityId) return null
    if (activeTab === 'interactive') {
      return (currentItems as any[]).find(e => e.id === selectedEntityId) || null
    }
    return (currentItems as ArchiveEntity[]).find(e => e.id === selectedEntityId) || null
  }, [selectedEntityId, currentItems, activeTab])

  const npcsList = useMemo(() => Object.values(library.npcs || {}) as NPC[], [library.npcs])
  const charactersList = useMemo(() => Object.values(library.characters || {}), [library.characters])
  const normalizedQuery = query.trim().toLowerCase()
  const filteredItems = useMemo(() => {
    let items = currentItems as ArchiveEntity[]
    if (normalizedQuery) {
      items = items.filter((e) => {
        const hay = String('title' in e ? e.title : ('name' in e ? e.name : '')).toLowerCase()
        return hay.includes(normalizedQuery)
      })
    }
    return items.sort((a, b) => ((a as any).order || 0) - ((b as any).order || 0))
  }, [currentItems, normalizedQuery])

  const handleTabChange = (tab: LibraryCategory | 'interactive') => {
    setActiveTab(tab)
    setSelectedEntityId(null)
    setDeletingId(null)
    setQuery('')
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredItems.findIndex((i) => i.id === active.id);
      const newIndex = filteredItems.findIndex((i) => i.id === over.id);

      const newItems = arrayMove(filteredItems, oldIndex, newIndex);

      newItems.forEach((item, index) => {
        updateEntity(activeTab as Exclude<LibraryCategory, 'interactive'>, item.id, { order: index });
      });
    }
  }

  return (
    <div className="absolute inset-0 bg-[#09090b] flex z-10">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-card { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
        .animate-float-card { animation: float-card 4s ease-in-out infinite; }
      `}} />
      <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" />

      <DataSyncModal isOpen={isDataSyncModalOpen} onClose={() => setIsDataSyncModalOpen(false)} />

      <ArchiveSidebar
        tabs={tabs}
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        library={library}
        fileInputRef={fileInputRef}
        handleExport={handleExport}
        handleDownloadTemplate={handleDownloadTemplate}
        onOpenDataSync={() => setIsDataSyncModalOpen(true)}
      />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <ArchiveHeader
            tabs={tabs}
            activeTab={activeTab === 'interactive' ? 'extras' : activeTab}
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

          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={filteredItems.map(i => i.id)} 
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredItems.map((entity: any) => (
                  <div key={entity.id} className="flex flex-col">
                    <div 
                      onClick={() => setSelectedEntityId(selectedEntityId === entity.id ? null : entity.id)}
                      className="cursor-pointer"
                    >
                      {activeTab === 'interactive' ? (
                        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl hover:border-indigo-500 transition-colors">
                          <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">
                            {entity.tokenType === 'poi' ? 'POI' : 'Проверка'}
                          </div>
                          <div className="text-sm font-bold text-zinc-200 mb-1">{entity.name}</div>
                          <div className="text-[10px] text-zinc-500">
                            Локация: {getLocationName(entity.locationId)}
                          </div>
                        </div>
                      ) : (
                        <EntityCard
                          entity={entity as any}
                          type={activeTab as any}
                          isActive={selectedEntityId === entity.id}
                          onClick={() => {}}
                        />
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const targetCategory = activeTab === 'interactive' ? 'extras' : activeTab
                        if (deletingId === entity.id) {
                          deleteEntity(targetCategory as LibraryCategory, entity.id)
                          setDeletingId(null)
                          if (selectedEntityId === entity.id) setSelectedEntityId(null)
                        } else {
                          setDeletingId(entity.id)
                        }
                      }}
                      onMouseLeave={() => setDeletingId(null)}
                      className={`mt-2 w-full px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-colors ${
                        deletingId === entity.id ? 'text-red-300 bg-red-950/40 border-red-900/50 hover:bg-red-500 hover:text-white' : 'text-zinc-600 bg-zinc-950/40 border-zinc-800 hover:text-red-400 hover:border-red-900/50 hover:bg-red-950/20'
                      }`}
                    >
                      {deletingId === entity.id ? 'Точно?' : 'Удалить'}
                    </button>
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
          
          {selectedEntity && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-zinc-900 bg-zinc-900/50">
                  <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
                    Редактирование
                  </h3>
                  <button 
                    onClick={() => setSelectedEntityId(null)}
                    className="text-zinc-500 hover:text-white transition-colors"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
                <div className="overflow-y-auto p-6 custom-scrollbar">
                  {activeTab === 'heroes' && <HeroForm hero={selectedEntity as Hero} onUpdate={(data) => updateEntity('heroes', selectedEntity.id, data)} />}
                  {activeTab === 'extras' && <ExtraForm extra={selectedEntity} nodes={nodes} onUpdate={(data) => updateEntity('extras', selectedEntity.id, data)} />}
                  {activeTab === 'interactive' && <ExtraForm extra={selectedEntity} nodes={nodes} onUpdate={(data) => updateEntity('extras', selectedEntity.id, data)} />}
                  {activeTab === 'crowd' && <CrowdForm crowd={selectedEntity} nodes={nodes} onUpdate={(data) => updateEntity('crowd', selectedEntity.id, data)} />}
                  {activeTab === 'characters' && <CharacterForm character={selectedEntity} onUpdate={(data) => updateEntity('characters', selectedEntity.id, data)} />}
                  {activeTab === 'npcs' && <NpcForm npc={selectedEntity as NPC} nodes={nodes} onUpdate={(data) => updateEntity('npcs', selectedEntity.id, data)} />}
                  {activeTab === 'enemies' && <EnemyForm enemy={selectedEntity as Enemy} onUpdate={(data) => updateEntity('enemies', selectedEntity.id, data)} />}
                  {activeTab === 'loot' && <LootForm loot={selectedEntity as Loot} nodes={nodes} npcs={npcsList} onUpdate={(data) => updateEntity('loot', selectedEntity.id, data)} />}
                  {activeTab === 'events' && <EventForm event={selectedEntity as Event} onUpdate={(data) => updateEntity('events', selectedEntity.id, data)} />}
                  {activeTab === 'bestiary' && <BestiaryForm threat={selectedEntity} onUpdate={(data) => updateEntity('bestiary', selectedEntity.id, data)} />}
                  {activeTab === 'factions' && <FactionForm faction={selectedEntity} nodes={nodes} characters={charactersList} onUpdate={(data) => updateEntity('factions', selectedEntity.id, data)} />}
                  {activeTab === 'quests' && <QuestForm quest={selectedEntity as Quest} nodes={nodes} npcs={npcsList} onUpdate={(data) => updateEntity('quests', selectedEntity.id, data)} />}
                  {activeTab === 'locations' && <LocationForm location={selectedEntity} onUpdate={(data) => updateEntity('locations', selectedEntity.id, data)} onPlaceOnMap={() => handlePlaceOnMap(selectedEntity)} />}
                  
                  {activeTab === 'secrets' && (
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                          Скрытая информация
                        </label>
                        <AiWand 
                          mode="general"
                          currentValue={selectedEntity.description || ''}
                          contextData={selectedEntity}
                          onApply={(text) => updateEntity('secrets', selectedEntity.id, { description: text })}
                        />
                      </div>
                      <textarea
                        value={selectedEntity.description || ''}
                        onChange={(e) => updateEntity('secrets', selectedEntity.id, { description: e.target.value })}
                        placeholder="Детальное описание секрета..."
                        className="bg-zinc-950/50 border border-zinc-800 p-3 text-sm text-zinc-300 w-full resize-none outline-none leading-relaxed h-24 rounded-xl focus:border-indigo-500"
                      />
                      <div className="pt-3 border-t border-zinc-800/50">
                        <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest text-center">Доступно через @Упоминания в других местах</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
  )
}
