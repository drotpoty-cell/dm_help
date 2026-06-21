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
import { toast } from 'sonner'
import EntityCard from './archive/EntityCard'
import { DataSyncModal } from './archive/DataSyncModal'
import { ArchiveHeader } from './archive/ArchiveHeader'
import { ArchiveSidebar } from './archive/ArchiveSidebar'
import { AiWand } from './ai/AiWand'

type ArchiveEntity = Hero | NPC | Enemy | Quest | Loot | Event | { id: string; name?: string; title?: string; description?: string }

export default function ArchiveBoard() {
  const [activeTab, setActiveTab] = useState<LibraryCategory>('heroes')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDataSyncModalOpen, setIsDataSyncModalOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  
  const [isLootModalOpen, setIsLootModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // Считываем состояние базы данных, включая интерактивные объекты
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
  const activeLocalMapId = useWorkspaceStore((state) => state.activeLocalMapId)
  const spawnEntityToMap = useWorkspaceStore((state) => state.spawnEntityToMap)
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
    const dataToExport = Object.fromEntries(
      Object.entries(library).map(([k, v]) => [k, Object.values(v || {})])
    )
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
          return CategorySchema.parse(arrayData).reduce((acc: Record<string, any>, item) => {
            if (item && item.id) acc[item.id] = item;
            return acc;
          }, {});
        };

        useWorkspaceStore.setState((state: any) => {
          const nextState = { ...state };
          tabs.forEach(t => {
            if (parsedData[t.id]) {
              nextState[t.id] = { ...state[t.id], ...safeParseToRecord(parsedData[t.id]) };
            }
          });
          return nextState;
        });
        toast.success('Архив успешно загружен и синхронизирован!');
      } catch (err) {
        toast.error('Ошибка структуры файла.');
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const template = {
      "locations": {}, "factions": {}, "npcs": {}, "enemies": {}, 
      "characters": {}, "extras": {}, "quests": {}, "loot": {}, "events": {}, "heroes": {}, "interactive": {}
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
          ? ({ ...base, name: 'Новое лицо', raceClass: '', role: '', relation: 'neutral', description: '' } as any)
          : activeTab === 'extras'
            ? ({ ...base, name: 'Новый житель', occupation: '', quirk: '' } as any)
          : activeTab === 'factions'
            ? ({ ...base, name: 'Новая фракция', status: 'active' } as any)
          : activeTab === 'bestiary'
            ? ({ ...base, name: 'Новый монстр', combatStats: { ac: 10, hp: 10 } } as any)
          : activeTab === 'quests'
            ? ({ id, title: 'Новый сюжет', description: '', status: 'available', locationId: null, order } as Quest)
          : activeTab === 'npcs'
            ? ({ ...base, name: 'Новый персонаж', locationId: null, needsUpdate: false, schedule: [], traits: [], defaultLocationId: '' } satisfies NPC)
          : activeTab === 'enemies'
            ? ({ id, name: 'Новый противник', description: '', hp: 10, maxHp: 10, ac: 10, cr: '1', attacks: '', order } as Enemy)
          : activeTab === 'loot'
            ? ({ ...base, name: 'Новый артефакт', rarity: 'common', price: 0, weight: 0, stats: '', ownerId: null } as Loot)
          : activeTab === 'interactive'
            ? ({ id, name: 'Новый интерактивный объект', description: '', type: 'poi', dc: 10, order })
          : activeTab === 'events'
            ? ({ ...base, name: 'Новое событие', startDay: 1, duration: 1, status: 'backlog' } as Event)
          : activeTab === 'locations'
            ? ({ ...base, name: 'Новая локация', status: 'discovered' } as any)
            : base

    addEntity(activeTab, newEntity)
  };

  const handlePlaceOnMap = (entity: any) => {
    if (activeTab === 'locations') {
      const newNode = {
        id: `node-${Date.now()}`, type: 'safe',
        position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        data: { label: entity.name, description: entity.description || '', entityId: entity.id, quests: [], needsUpdate: false }
      }
      setNodes([...nodes, newNode])
      toast.success('Локация добавлена на глобальную карту!')
    }
  };

  const currentItems = useMemo(() => {
    return Object.values(library[activeTab] || {})
  }, [library, activeTab])

  const getLocationName = (locationId?: string) => {
    if (!locationId) return "Вне локаций"
    return library.locations?.[locationId]?.name || "Вне локаций"
  };
  
  const selectedEntity = useMemo(() => {
    if (!selectedEntityId) return null
    return (currentItems as any[]).find(e => e.id === selectedEntityId) || null
  }, [selectedEntityId, currentItems])

  const npcsList = useMemo(() => Object.values(library.npcs || {}) as NPC[], [library.npcs])
  const charactersList = useMemo(() => Object.values(library.characters || {}), [library.characters])
  const normalizedQuery = query.trim().toLowerCase()
  
  const filteredItems = useMemo(() => {
    let items = currentItems as any[]
    if (normalizedQuery) {
      items = items.filter((e) => {
        const hay = String(e.title || e.name || '').toLowerCase()
        return hay.includes(normalizedQuery)
      })
    }
    return items.sort((a, b) => (a.order || 0) - (b.order || 0))
  }, [currentItems, normalizedQuery])

  const handleTabChange = (tab: LibraryCategory) => {
    setActiveTab(tab)
    setSelectedEntityId(null)
    setDeletingId(null)
    setQuery('')
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = filteredItems.findIndex((i) => i.id === active.id);
      const newIndex = filteredItems.findIndex((i) => i.id === over.id);
      const newItems = arrayMove(filteredItems, oldIndex, newIndex);
      newItems.forEach((item, index) => {
        updateEntity(activeTab, item.id, { order: index });
      });
    }
  }

  return (
    <div className="absolute inset-0 bg-[#09090b] flex z-10">
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

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredItems.map(i => i.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredItems.map((entity: any) => (
                  <div key={entity.id} className="flex flex-col">
                    <div onClick={() => setSelectedEntityId(selectedEntityId === entity.id ? null : entity.id)} className="cursor-pointer flex-1">
                      {activeTab === 'interactive' ? (
                        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl hover:border-indigo-500 transition-colors h-full flex flex-col justify-between">
                          <div>
                            <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">
                              {entity.type === 'poi' ? '🔍 Точка интереса' : '🎲 Проверка'}
                            </div>
                            <div className="text-sm font-bold text-zinc-200 mb-1 truncate">{entity.name}</div>
                            <div className="text-xs text-zinc-400 line-clamp-2 mb-2 h-8">{entity.description || 'Нет описания...'}</div>
                          </div>
                          <div className="text-[10px] text-zinc-500 bg-zinc-950 p-1.5 rounded border border-zinc-800 truncate">
                            🗺️ {getLocationName(entity.locationId)}
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
                        if (deletingId === entity.id) {
                          deleteEntity(activeTab, entity.id)
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
                  <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Редактирование</h3>
                  <button onClick={() => setSelectedEntityId(null)} className="text-zinc-500 hover:text-white transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
                <div className="overflow-y-auto p-6 custom-scrollbar flex-1">
                  {activeTab === 'heroes' && <HeroForm hero={selectedEntity as Hero} onUpdate={(data) => updateEntity('heroes', selectedEntity.id, data)} />}
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
                  
                  {/* ЧИСТАЯ ФОРМА ДЛЯ ДОП. МАТЕРИАЛОВ (БЕЗ ЖИТЕЛЕЙ) */}
                  {activeTab === 'extras' && (
                    <div className="flex flex-col gap-4 text-zinc-300">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Название</label>
                        <input
                          type="text"
                          value={selectedEntity.name || ''}
                          onChange={(e) => updateEntity('extras', selectedEntity.id, { name: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 p-3 text-sm text-white rounded-xl mt-1 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Описание</label>
                        <textarea
                          value={selectedEntity.description || ''}
                          onChange={(e) => updateEntity('extras', selectedEntity.id, { description: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 p-3 text-sm text-white rounded-xl mt-1 h-48 resize-none outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* ПОЛНАЯ ФОРМА ДЛЯ ИНТЕРАКТИВНЫХ ОБЪЕКТОВ И ПРОВЕРОК */}
                  {activeTab === 'interactive' && (
                    <div className="flex flex-col gap-4 text-zinc-300">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Название</label>
                        <input
                          type="text"
                          value={selectedEntity.name || ''}
                          onChange={(e) => updateEntity('interactive', selectedEntity.id, { name: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 p-3 text-sm text-white rounded-xl mt-1 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                          {selectedEntity.type === 'check' ? 'Описание общее' : 'Описание'}
                        </label>
                        <textarea
                          value={selectedEntity.description || ''}
                          onChange={(e) => updateEntity('interactive', selectedEntity.id, { description: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 p-3 text-sm text-white rounded-xl mt-1 h-32 resize-none outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Тип объекта</label>
                        <select
                          value={selectedEntity.type || 'poi'}
                          onChange={(e) => updateEntity('interactive', selectedEntity.id, { type: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 p-3 text-sm text-white rounded-xl mt-1 outline-none focus:border-indigo-500"
                        >
                          <option value="poi">Точка интереса (POI)</option>
                          <option value="check">Проверка (Check)</option>
                        </select>
                      </div>
                      {selectedEntity.type === 'check' && (
                        <>
                          <div>
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Сложность проверки (DC)</label>
                            <input
                              type="number"
                              value={selectedEntity.dc || 10}
                              onChange={(e) => updateEntity('interactive', selectedEntity.id, { dc: parseInt(e.target.value) || 0 })}
                              className="w-full bg-zinc-950 border border-zinc-800 p-3 text-sm text-white rounded-xl mt-1 outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Результат успеха</label>
                            <textarea
                              value={selectedEntity.successResult || ''}
                              onChange={(e) => updateEntity('interactive', selectedEntity.id, { successResult: e.target.value })}
                              placeholder="Что увидят или получат игроки при успехе..."
                              className="w-full bg-zinc-950 border border-zinc-800 p-3 text-sm text-white rounded-xl mt-1 h-24 resize-none outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Результат провала</label>
                            <textarea
                              value={selectedEntity.failureResult || ''}
                              onChange={(e) => updateEntity('interactive', selectedEntity.id, { failureResult: e.target.value })}
                              placeholder="Что произойдет при провале (ловушка, тревога)..."
                              className="w-full bg-zinc-950 border border-zinc-800 p-3 text-sm text-white rounded-xl mt-1 h-24 resize-none outline-none focus:border-indigo-500"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {activeTab === 'secrets' && (
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Скрытая информация</label>
                        <AiWand mode="general" currentValue={selectedEntity.description || ''} contextData={selectedEntity} onApply={(text) => updateEntity('secrets', selectedEntity.id, { description: text })} />
                      </div>
                      <textarea
                        value={selectedEntity.description || ''}
                        onChange={(e) => updateEntity('secrets', selectedEntity.id, { description: e.target.value })}
                        placeholder="Детальное описание секрета..."
                        className="bg-zinc-950/50 border border-zinc-800 p-3 text-sm text-zinc-300 w-full resize-none outline-none leading-relaxed h-24 rounded-xl focus:border-indigo-500"
                      />
                    </div>
                  )}

                  {/* СИНХРОНИЗАЦИЯ: Моментальное выставление токена из Архива на активную карту */}
                  {activeLocalMapId && ['heroes', 'npcs', 'enemies', 'crowd', 'loot', 'interactive'].includes(activeTab) && (
                    <div className="mt-6 pt-4 border-t border-zinc-900">
                      <button
                        onClick={() => {
                          let tokenType: any = activeTab;
                          if (activeTab === 'heroes') tokenType = 'hero';
                          if (activeTab === 'npcs') tokenType = 'npc';
                          if (activeTab === 'interactive') tokenType = selectedEntity.type || 'poi';
                          
                          spawnEntityToMap(activeLocalMapId, selectedEntity, tokenType);
                          toast.success('Токен успешно выставлен на карту!');
                          setSelectedEntityId(null);
                        }}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-xl"
                      >
                        📍 Разместить объект на текущей тактической карте
                      </button>
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