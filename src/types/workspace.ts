import { Node, Edge } from 'reactflow'

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
  hook?: string
  giver?: string
  status: EntityStatus
  startDay?: number
  deadline?: number
  reward?: string
  consequence?: string
  locationId: string | null
}

export interface NPC {
  id: string
  name: string
  description: string
  occupation?: string
  locationId: string | null
  needsUpdate: boolean
  isMerchant?: boolean
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
  schedule?: ScheduleEntry[];
  currentActivity?: string;
  showSchedule?: boolean;
  defaultLocationId?: string | null; 
  traits?: string[];
  linkedNodeId?: string;
}

export interface Loot {
  id: string
  name: string
  description: string
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

export type LibraryCategory = 'heroes' | 'npcs' | 'quests' | 'locations' | 'loot' | 'events' | 'extras' | 'factions' | 'secrets' | 'characters' | 'bestiary' | 'interactive'

export interface BattleToken {
  id: string; // уникальный ID токена на карте
  entityId: string; // ссылка на героя или NPC
  type: 'hero' | 'npc' | 'monster' | 'poi' | 'check';
  x: number; // координата колонки (например, 0, 1, 2)
  y: number; // координата строки
  size?: number; // размер (1 = 1x1 клетка, 2 = 2x2 и т.д.)
}

export interface LocalMapData {
  backgroundImage: string | null;
  gridSize: number;
  gridOffsetX?: number;
  gridOffsetY?: number;
  backgroundScale?: number;
  backgroundRotation?: number;
  cameraX?: number; // дефолт 0
  cameraY?: number; // дефолт 0
  zoom?: number;    // дефолт 1 (диапазон от 0.5 до 3)
  tokens: Record<string, BattleToken>;
}

export interface Combatant {
  tokenId: string; // связь с токеном на карте
  entityId: string;
  type: 'hero' | 'npc' | 'monster';
  initiative: number;
  hp: number;
  maxHp: number;
}

export interface CombatState {
  isActive: boolean;
  turnIndex: number;
  participants: Combatant[];
}

export interface WorkspaceState {
  nodes: Node[]
  edges: Edge[]
  story: StoryPart[]
  plotNodes: Record<string, PlotNode>;

  currentDay: number
  currentHour: number
  
  weather: WeatherState
  setWeather: (weather: Partial<WeatherState>) => void
  generateForecast: (days: number) => void

  partyLocationId: string | null
  setPartyLocation: (id: string | null) => void

  heroes: Record<string, Hero>
  npcs: Record<string, NPC>
  quests: Record<string, Quest>
  locations: Record<string, BaseEntity>
  secrets: Record<string, BaseEntity>
  loot: Record<string, Loot>
  events: Record<string, Event>
  characters: Record<string, any>
  extras: Record<string, any>
  bestiary: Record<string, any>
  factions: Record<string, any>

  combat: CombatState;
  startCombat: (mapId: string) => void;
  endCombat: () => void;
  nextTurn: () => void;
  updateCombatantInitiative: (tokenId: string, initiative: number) => void;

  localMaps: Record<string, LocalMapData>; // Ключ — locationId
  activeLocalMapId: string | null;
  openLocalMap: (locationId: string) => void;
  closeLocalMap: () => void;
  updateLocalMap: (locationId: string, data: Partial<LocalMapData>) => void;
  updateMapCamera: (locationId: string, camera: { cameraX?: number; cameraY?: number; zoom?: number }) => void;
  updateLocalToken: (locationId: string, tokenId: string, data: Partial<BattleToken>) => void;
  addLocalToken: (locationId: string, token: BattleToken) => void;
  removeLocalToken: (locationId: string, tokenId: string) => void;

  importAIData: (data: any) => void;
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  updateEdgeData: (edgeId: string, data: any) => void
  setStory: (story: StoryPart[]) => void
  setLibrary: (library: any) => void 

  advanceTime: (hours: number) => void

  addEntity: (category: LibraryCategory, entity: any) => void
  updateEntity: (category: LibraryCategory, id: string, data: any) => void
  deleteEntity: (category: LibraryCategory, id: string) => void

  addPlotNode: (node: PlotNode) => void;
  updatePlotNode: (id: string, data: Partial<PlotNode>) => void;
  deletePlotNode: (id: string) => void;

  updateQuestStatus: (questId: string, newStatus: EntityStatus) => void
  updateHero: (id: string, data: Partial<Hero>) => void
  updateNpc: (id: string, data: Partial<NPC>) => void
  attachToRegion: (childId: string, regionId: string | null) => void
  clearNeedsUpdate: (type: 'node' | 'npc', targetId: string) => void
  viewedEntityId: string | null
  setViewedEntityId: (id: string | null) => void

  activeView: string
  setActiveView: (view: string) => void

  activeWorldId: string | null;
  savedWorlds: Record<string, any>;
  switchWorld: (newId: string) => void;
  
  scratchpad: string
  isScratchpadOpen: boolean
  setScratchpad: (text: string) => void
  toggleScratchpad: () => void
}

export type LibraryState = Pick<
  WorkspaceState,
  'heroes' | 'npcs' | 'quests' | 'locations' | 'secrets' | 'loot' | 'events' | 'characters' | 'extras' | 'bestiary' | 'factions'
>
