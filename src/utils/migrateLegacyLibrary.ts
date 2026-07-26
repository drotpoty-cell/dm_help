/**
 * Миграция кампаний, сохранённых до слияния категорий npcs -> characters и crowd -> extras.
 *
 * ВАЖНО: эта миграция НИКОГДА не запускается автоматически. Старые кампании в Supabase/
 * localStorage могут содержать ключи `npcs`/`crowd` — они просто игнорируются текущим стором
 * (он больше не читает и не пишет эти поля), но данные в них не потеряны, пока их не смигрируют
 * явным действием ГМа (кнопка «Мигрировать данные кампании» + подтверждение), потому что
 * автосохранение работает по принципу last-write-wins и молчаливая миграция с ошибкой
 * могла бы необратимо перезаписать облачную копию.
 */

export interface LegacySnapshot {
  npcs?: Record<string, any>
  crowd?: Record<string, any>
  characters?: Record<string, any>
  extras?: Record<string, any>
  [key: string]: any
}

export interface MigrationResult {
  characters: Record<string, any>
  extras: Record<string, any>
  migratedNpcCount: number
  migratedCrowdCount: number
}

/**
 * Определяет, есть ли в снапшоте кампании данные в старом формате, которые ещё
 * не были перенесены в characters/extras.
 */
export function hasLegacyLibraryData(snapshot: LegacySnapshot | null | undefined): boolean {
  if (!snapshot) return false
  const npcCount = Object.keys(snapshot.npcs || {}).length
  const crowdCount = Object.keys(snapshot.crowd || {}).length
  return npcCount > 0 || crowdCount > 0
}

/**
 * Строит новые characters/extras на основе текущих + старых npcs/crowd.
 * Не удаляет ничего из уже существующих characters/extras — только дополняет их.
 * Старые npc-записи получают isImportant: true (раньше npcs = ключевые персонажи,
 * в отличие от crowd/extras — второстепенной массовки).
 */
export function migrateLegacyLibrary(snapshot: LegacySnapshot): MigrationResult {
  const characters: Record<string, any> = { ...(snapshot.characters || {}) }
  const extras: Record<string, any> = { ...(snapshot.extras || {}) }

  const legacyNpcs = snapshot.npcs || {}
  const legacyCrowd = snapshot.crowd || {}

  let migratedNpcCount = 0
  for (const npc of Object.values(legacyNpcs)) {
    if (!npc || typeof npc !== 'object' || !('id' in npc)) continue
    const id = (npc as { id: string }).id
    // Если персонаж с таким id уже существует в characters (например, миграция уже
    // выполнялась раньше), не затираем более новую версию — просто пропускаем.
    if (characters[id]) continue
    characters[id] = { ...(npc as object), isImportant: true }
    migratedNpcCount++
  }

  let migratedCrowdCount = 0
  for (const person of Object.values(legacyCrowd)) {
    if (!person || typeof person !== 'object' || !('id' in person)) continue
    const id = (person as { id: string }).id
    if (extras[id]) continue
    extras[id] = { ...(person as object) }
    migratedCrowdCount++
  }

  return { characters, extras, migratedNpcCount, migratedCrowdCount }
}
