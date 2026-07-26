import type { UISlice } from '@/store/slices/createUISlice'
import type { LibrarySlice } from '@/store/slices/createLibrarySlice'
import type { MapSlice } from '@/store/slices/createMapSlice'
import type { CombatSlice } from '@/store/slices/createCombatSlice'
import type { SystemSlice } from '@/store/slices/createSystemSlice'

export interface PlotNode {
  id: string;
  title: string;
  description: string;
  status: 'hidden' | 'active' | 'completed';
}

export type EntityStatus = 'available' | 'active' | 'completed' | 'failed'
export type LootRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Hero {
  id: string
  name: string
  /** Аватар/портрет — универсальное поле картинки для любой категории Архива (Блок 5). */
  image?: string
  playerName?: string
  raceClass?: string
  level?: number
  hp?: number
  maxHp?: number
  ac?: number
  initiativeModifier?: number
  passivePerception?: number
  inventory?: string
  classResources?: { name: string; current: number; max: number }[]
  description?: string
  linkedNodeId?: string;
}

export type WeatherMode = 'disabled' | 'static' | 'dynamic'
export type ClimateType = 'temperate' | 'winter' | 'desert' | 'tropical'

export interface DailyWeather {
  condition: string
  temp: number
}

export interface WeatherState {
  mode: WeatherMode
  condition: string 
  temp: number      
  interval: number           
  hoursSinceChange: number   
  climate: ClimateType       
  forecast: Record<number, DailyWeather>
}

export interface ScheduleEntry {
  startHour: number;
  endHour: number;
  locationId: string | null;
  activity: string;
}

export interface Quest {
  id: string
  title: string
  description: string
  image?: string
  hook?: string
  giver?: string
  status: EntityStatus
  startDay?: number
  deadline?: number
  reward?: string
  consequence?: string
  locationId: string | null
}

export interface Enemy {
  id: string
  name: string
  description: string
  image?: string
  hp: number
  maxHp: number
  ac: number
  cr: string
  attacks: string
  isMerchant?: boolean
  assortment?: { itemName: string; price: string; description: string }[]
  linkedNodeId?: string
}

/**
 * Character — каноническая категория для всех именованных персонажей-НПС.
 * Объединяет старые дублирующиеся категории `npcs` (сюжетные NPC) и `characters`
 * (карточки с чертами характера/расписанием) в одну сущность. `isImportant`
 * отличает ключевых сюжетных персонажей от менее значимых.
 */
export interface Character {
  id: string
  name: string
  description: string
  image?: string
  occupation?: string
  raceClass?: string
  role?: string
  relation?: 'neutral' | 'friendly' | 'hostile'
  locationId: string | null
  defaultLocationId?: string | null
  needsUpdate: boolean
  isImportant?: boolean
  isMerchant?: boolean
  assortment?: { itemName: string; price: string; description: string }[]
  hp?: number
  maxHp?: number
  ac?: number
  dndClass?: string
  skills?: string
  goal?: string
  secret?: string
  personalLoot?: string
  stats?: string
  notes?: string
  showGoal?: boolean
  showSecret?: boolean
  showLoot?: boolean
  showStats?: boolean
  showNotes?: boolean
  schedule?: ScheduleEntry[]
  currentActivity?: string
  showSchedule?: boolean
  traits?: string[]
  ideals?: string
  bonds?: string
  flaws?: string
  appearance?: string
  relations?: string
  currentRole?: string
  linkedNodeId?: string
}

/**
 * Extra — каноническая категория для второстепенных персонажей массовки.
 * Объединяет старые дублирующиеся категории `crowd` и `extras`.
 */
export interface Extra {
  id: string
  name: string
  description: string
  image?: string
  occupation?: string
  quirk?: string
  state?: string
  knowledge?: string
  locationId?: string | null
  defaultLocationId?: string | null
  schedule?: ScheduleEntry[]
}

export interface Loot {
  id: string
  name: string
  description: string
  image?: string
  rarity: LootRarity
  price: number
  weight: number
  stats: string
  ownerId: string | null
}

export interface Event {
  id: string
  name: string
  description: string
  image?: string
  startDay: number
  duration: number
  status: 'backlog' | 'active' | 'completed'
}

export interface BaseEntity {
  id: string
  name: string
  description: string
  [key: string]: any
}

export interface StoryChapter {
  id: string;
  title: string;
  content: string;
  locationId?: string | null;
  questId?: string | null;
}

export interface StoryPart {
  id: string;
  title: string;
  chapters: StoryChapter[];
}

export type LibraryCategory = 'heroes' | 'quests' | 'locations' | 'loot' | 'events' | 'extras' | 'factions' | 'secrets' | 'characters' | 'bestiary' | 'interactive' | 'enemies'

export interface BattleToken {
  id: string; // уникальный ID токена на карте
  entityId: string; // ссылка на героя или NPC
  type: 'hero' | 'npc' | 'monster' | 'poi' | 'check' | 'enemies' | 'extra' | 'loot';
  locationId?: string; // текущая локация
  x: number; // координата колонки (например, 0, 1, 2)
  y: number; // координата строки
  size?: number; // размер (1 = 1x1 клетка, 2 = 2x2 и т.д.)
}

export interface LocalMapData {
  /** @deprecated Тяжёлые фоны больше не хранятся в Zustand-сторе — см. useMapBackground.ts
   *  (IndexedDB) и location.mapImage (автофон из Архива). Поле оставлено только для
   *  совместимости со старыми снапшотами кампаний, приложение его больше не читает и не пишет. */
  backgroundImage: string | null;
  gridSize: number;
  gridOffsetX?: number;
  gridOffsetY?: number;
  backgroundScale?: number;
  backgroundRotation?: number;
  /** Ручная привязка боевой карты к другой карточке локации в Архиве (если карта ещё не
   *  связана автоматически через узел на карте мира, или ГМ перепривязал её вручную). */
  linkedLocationId?: string | null;
  cameraX?: number; // дефолт 0
  cameraY?: number; // дефолт 0
  zoom?: number;    // дефолт 1 (диапазон от 0.5 до 3)
  tokens: Record<string, BattleToken>;
}

export interface Combatant {
  tokenId: string; // связь с токеном на карте
  entityId: string;
  // ВАЖНО: раньше здесь было 'hero'|'npc'|'monster' — 'monster' никогда не производился
  // spawnEntityToMap, а 'enemies'/'extra' не входили в список вовсе, из-за чего токены
  // противников и массовки молча выпадали из боя при startCombat. Приведено в соответствие
  // с реальными типами BattleToken, которые могут участвовать в бою.
  type: 'hero' | 'npc' | 'enemies' | 'extra';
  initiative: number;
  hp: number;
  maxHp: number;
  ac: number;
  /** Произвольные текстовые метки состояний (не хардкодим конкретную редакцию правил —
   *  ГМ может вписать что угодно: "Отравлен", "Опрокинут", кастомный хоумрул-статус). */
  statuses: string[];
}

export interface CombatState {
  isActive: boolean;
  turnIndex: number;
  participants: Combatant[];
}

export interface WorkspaceState extends UISlice, LibrarySlice, MapSlice, CombatSlice, SystemSlice {}

export type LibraryState = Pick<
  WorkspaceState,
  'heroes' | 'enemies' | 'quests' | 'locations' | 'secrets' | 'loot' | 'events' | 'characters' | 'extras' | 'bestiary' | 'factions' | 'interactive'
>;
