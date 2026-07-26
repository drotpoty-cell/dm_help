/**
 * Генерирует короткий уникальный идентификатор.
 * Использует crypto.randomUUID(), если доступен (все современные браузеры и Node 19+),
 * с фолбэком на комбинацию времени и случайного числа для старых сред.
 *
 * Заменяет паттерн `${prefix}-${Date.now()}`, который мог давать коллизии
 * при создании нескольких сущностей в один и тот же миллисекунд (например,
 * в цикле или при двойном клике).
 */
export function generateId(prefix?: string): string {
  const raw =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

  return prefix ? `${prefix}-${raw}` : raw
}
