import { getEmptyWorldState } from '@/store/storeConstants'

/**
 * Section 1.2 — Data Schema Fault Tolerance.
 *
 * `map_data` в Supabase — это произвольный JSONB, накопленный за много итераций схемы
 * (старые кампании могли сохраняться до появления вложенных локаций, NLE-таймлайна,
 * системы токенов и т.д.). Если какое-то поле в загруженном JSON отсутствует, имеет
 * не тот тип (например, вместо Record — массив, или null) или повреждено, слепое
 * `useWorkspaceStore.setState(rawMapData)` затирает исправные значения по умолчанию
 * "мусором" и валит компоненты, ожидающие конкретную форму данных.
 *
 * Эта функция — типобезопасный defensive merge: для каждого известного поля проверяет
 * форму (объект/массив/примитив) и либо берёт значение как есть, либо откатывается на
 * канонический дефолт (`getEmptyWorldState`), вместо падения или молчаливой порчи стора.
 * Ключи, которых нет в списке ниже (например, устаревшие `npcs`/`crowd`), просто
 * пропускаются сюда — их отдельно обрабатывает `migrateLegacyLibrary.ts`.
 */
export function sanitizeCampaignSnapshot(raw: unknown): Record<string, unknown> {
  const defaults = getEmptyWorldState() as Record<string, unknown>
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    // Совсем не похоже на объект кампании — ничего не мержим, стор остаётся с дефолтами.
    return {}
  }
  const source = raw as Record<string, unknown>
  const result: Record<string, unknown> = {}

  const isPlainRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v)

  // Record<string, Entity>-поля — библиотека сущностей, локальные карты, узлы графов и т.д.
  const recordKeys = [
    'heroes', 'characters', 'extras', 'enemies', 'bestiary', 'locations',
    'quests', 'loot', 'events', 'factions', 'secrets', 'interactive',
    'localMaps', 'plotNodes',
  ]
  for (const key of recordKeys) {
    result[key] = isPlainRecord(source[key]) ? source[key] : defaults[key]
  }

  // Array-поля — reactflow-узлы/рёбра, глава сюжета.
  const arrayKeys = ['nodes', 'edges', 'story']
  for (const key of arrayKeys) {
    result[key] = Array.isArray(source[key]) ? source[key] : defaults[key]
  }

  // weather — обязателен объект хотя бы с полем mode, иначе виджеты погоды упадут.
  result.weather = isPlainRecord(source.weather) && typeof source.weather.mode === 'string'
    ? { ...(defaults.weather as object), ...source.weather }
    : defaults.weather

  // combat — обязателен объект с массивом participants.
  result.combat = isPlainRecord(source.combat) && Array.isArray((source.combat as any).participants)
    ? source.combat
    : defaults.combat

  // Скалярные поля с типовой проверкой.
  result.currentDay = typeof source.currentDay === 'number' && Number.isFinite(source.currentDay) ? source.currentDay : defaults.currentDay
  result.currentHour = typeof source.currentHour === 'number' && Number.isFinite(source.currentHour) ? source.currentHour : defaults.currentHour
  result.worldSystemPrompt = typeof source.worldSystemPrompt === 'string' ? source.worldSystemPrompt : defaults.worldSystemPrompt
  result.partyLocationId = typeof source.partyLocationId === 'string' || source.partyLocationId === null ? source.partyLocationId : defaults.partyLocationId

  return result
}
