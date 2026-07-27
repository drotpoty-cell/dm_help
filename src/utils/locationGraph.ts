import type { LocalMapData } from '@/types/workspace'

/**
 * Блок 1 — защита от рекурсии вложенных локаций ("матрёшка", см. TacticalCanvas.tsx).
 *
 * "Родитель" локации X — это любая другая локация Y, на тактической доске которой лежит
 * токен типа 'location' с entityId === X (формального дерева parentId в данных нет,
 * связь выводится из содержимого localMaps[*].tokens). Перед тем как положить токен
 * `candidateLocationId` на доску `targetBoardId`, нужно рекурсивно подняться вверх по
 * цепочке родителей `targetBoardId` — если где-то среди них встретится `candidateLocationId`
 * (или targetBoardId === candidateLocationId), это создаст бесконечный цикл вложенности.
 *
 * @returns true, если дроп ЗАПРЕЩЁН (создаст цикл или самовложение)
 */
export function wouldCreateLocationCycle(
  candidateLocationId: string,
  targetBoardId: string,
  localMaps: Record<string, LocalMapData>
): boolean {
  if (candidateLocationId === targetBoardId) return true

  const visited = new Set<string>()

  function findParents(locationId: string): string[] {
    const parents: string[] = []
    for (const [ownerId, mapData] of Object.entries(localMaps)) {
      const tokens = mapData?.tokens
      if (!tokens) continue
      for (const token of Object.values(tokens)) {
        if (token.type === 'location' && token.entityId === locationId) {
          parents.push(ownerId)
        }
      }
    }
    return parents
  }

  function walkUp(locationId: string): boolean {
    if (visited.has(locationId)) return false // защита от уже испорченных циклов в старых данных
    visited.add(locationId)
    for (const parentId of findParents(locationId)) {
      if (parentId === candidateLocationId) return true
      if (walkUp(parentId)) return true
    }
    return false
  }

  return walkUp(targetBoardId)
}
