/**
 * "Умный" контекст для точечной генерации через AiWand (Блок 6, п.2) — раньше весь
 * `contextData`, что бы ни передал вызывающий компонент, уходил в промпт целиком через
 * `JSON.stringify`. Например, реплика/описание одного NPC могла утащить с собой тяжёлые
 * поля вроде `schedule`/`assortment`, которые ИИ для этой конкретной генерации не нужны и
 * только раздувают промпт. Здесь — явные allowlist'ы полей под конкретные режимы
 * генерации, и безопасный дефолт (обрезка длинных строк + отсев тяжёлых массивов) для
 * всех остальных случаев, которые explicit-allowlist не покрывает.
 */
const MAX_CONTEXT_STRING_LENGTH = 400

function pick<T extends Record<string, any>>(obj: T, keys: string[]): Record<string, any> {
  const result: Record<string, any> = {}
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') result[key] = obj[key]
  }
  return result
}

function trimGenericContext(obj: Record<string, any>): Record<string, any> {
  const HEAVY_KEYS = new Set(['schedule', 'assortment', 'tokens', 'nodes', 'edges', 'stats', 'notes', 'secret'])
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (HEAVY_KEYS.has(key)) continue
    if (typeof value === 'string') {
      result[key] = value.length > MAX_CONTEXT_STRING_LENGTH ? `${value.slice(0, MAX_CONTEXT_STRING_LENGTH)}…` : value
    } else if (Array.isArray(value)) {
      if (value.length <= 5) result[key] = value // маленькие массивы (например traits) — ок
    } else if (typeof value !== 'object') {
      result[key] = value
    }
    // вложенные объекты (кроме простых массивов выше) сознательно отбрасываем —
    // им самим нужна была бы отдельная обрезка, а для промпта они почти никогда не нужны
  }
  return result
}

export function buildSmartAiContext(mode: string | undefined, contextData: any): Record<string, any> {
  if (!contextData || typeof contextData !== 'object') return {}

  switch (mode) {
    case 'character':
      // Реплика/описание NPC — только сам персонаж, БЕЗ данных локации, где он стоит,
      // без чужого расписания и без полного архива предметов торговца.
      return pick(contextData, ['name', 'occupation', 'raceClass', 'role', 'relation', 'isImportant', 'goal'])
    case 'location':
      // Описание локации — не нужно тащить назад собственный черновик detailedDescription,
      // если мы как раз его и генерируем; краткое description как затравка — можно.
      return pick(contextData, ['name', 'type', 'description'])
    case 'loot':
      return pick(contextData, ['name', 'rarity'])
    case 'quest':
      return pick(contextData, ['title', 'status', 'hook'])
    default:
      return trimGenericContext(contextData)
  }
}

export const generateAIPromptTemplate = (currentData?: any, worldSystemPrompt?: string) => {
  const worldAtmosphereBlock = worldSystemPrompt?.trim()
    ? `АТМОСФЕРА И ПРАВИЛА ГЕНЕРАЦИИ ЭТОГО МИРА (заданы ГМом для этой кампании, обязательны к соблюдению):\n${worldSystemPrompt.trim()}\n\n`
    : ''

  return `Ты — профессиональный Dungeon Master и сценарист.
Твоя задача: сгенерировать масштабный, глубокий и детализированный контент для нашей кампании и перевести его в строгий JSON.

${worldAtmosphereBlock}ПРАВИЛА:

Выведи ТОЛЬКО валидный JSON без markdown.

ЗАПОЛНИ АБСОЛЮТНО ВСЕ ПОЛЯ, включая опциональные (расписания, инвентари, слухи, тактику). Никакой лени. Если данных нет — придумай их логично исходя из лора${worldSystemPrompt?.trim() ? ' и атмосферы мира выше' : ''}. Будь креативен.

В разделе "enemies" сгенерируй минимум 5 разнообразных противников.

В разделе "characters" сделай хотя бы 1-2 торговцев ("isMerchant": true) с подробным "assortment".

В разделе "extras" создай минимум 5 уникальных болванчиков со своими приметами и слухами.

Заполни массивы quests, loot, events, factions и secrets минимум 2-3 интересными объектами каждый.

6. Все ID должны быть осмысленными и уникальными строками в формате snake_case (например: faction_black_lotus, loot_cursed_blade).

СТРОГАЯ СХЕМА JSON (это ПРИМЕР структуры, верни свои сгенерированные массивы строго по этому образцу):
{
"heroes": [
{
"id": "hero_example",
"name": "Имя героя",
"playerName": "Имя игрока (опционально)",
"raceClass": "Раса и Класс",
"level": 1,
"hp": 10,
"maxHp": 10,
"ac": 10,
"initiativeModifier": 2,
"passivePerception": 12,
"inventory": "Список предметов...",
"description": "Описание истории и внешности",
"linkedNodeId": "id_узла_карты_если_есть"
}
],
"characters": [
{
"id": "character_example_01",
"name": "Имя персонажа",
"description": "Подробное описание характера, внешности и манер",
"occupation": "Профессия/Роль",
"isImportant": true,
"goal": "Чего хочет добиться",
"secret": "Скрытый мотив или тайна",
"traits": ["Черта 1", "Черта 2"],
"isMerchant": true,
"assortment": [
{ "itemName": "Название предмета", "price": "10 зм", "description": "Что это делает" }
],
"locationId": "id_локации_где_находится",
"schedule": [
{ "startHour": "08:00", "endHour": "18:00", "locationId": "id_локации", "activity": "Чем занимается" }
]
}
],
"enemies": [
{
"id": "enemy_example_01",
"name": "Имя противника",
"description": "Как выглядит и ведет себя в бою",
"hp": 20,
"maxHp": 20,
"ac": 15,
"cr": "1",
"attacks": "Название атаки (+X попадание, XdX+X урон)",
"combatStats": { "speed": "30ft", "resistances": "огонь" },
"tactics": "Кого атакует первым, использует ли укрытия",
"drops": "Что с него падает (золото, предметы)",
"isMerchant": false
}
],
"extras": [
{
"id": "extra_example_01",
"name": "Имя или прозвище",
"description": "Внешность",
"occupation": "Кем работает (нищий, стражник, посетитель)",
"quirk": "Интересная примета (шрам, заикается, странно одет)",
"state": "Текущее настроение (пьян, напуган, зол)",
"knowledge": "Какой слух или зацепку может рассказать"
}
],
"locations": [
{
"id": "location_example_01",
"name": "Название места",
"description": "Атмосферное описание локации (запахи, звуки, освещение)"
}
],
"quests": [
{
"id": "quest_example_01",
"title": "Название глобального квеста или сюжетной арки",
"description": "Подробное описание того, что нужно сделать",
"status": "active"
}
],
"loot": [
{
"id": "loot_example_01",
"name": "Название уникального артефакта или предмета",
"description": "История предмета, его магические свойства и примерная стоимость"
}
],
"events": [
{
"id": "event_example_01",
"name": "Название случайного события или энкаунтера",
"description": "Что происходит (например: 'Обвал тоннеля', 'Встреча с патрулем')"
}
],
"factions": [
{
"id": "faction_example_01",
"name": "Название гильдии, культа или организации",
"description": "Цели фракции, кто ей руководит и как она относится к героям"
}
],
"secrets": [
{
"id": "secret_example_01",
"name": "Название тайны или лорной зацепки",
"description": "Скрытая информация, которую герои могут узнать при расследовании"
}
],
"plotNodes": [
{
"id": "plot_node_example_01",
"title": "Название сюжетного шага/квеста",
"description": "Что нужно сделать или что происходит",
"status": "hidden"
}
],
"interactive": [
{
"id": "extra_check_01",
"type": "check",
"name": "Название проверки (например: Взлом сундука)",
"description": "Контекст того, что происходит",
"dc": 15,
"successResult": "Что происходит при успехе",
"failureResult": "Что происходит при провале (урон, ловушка)",
"linkedNodeId": "id_сюжетного_узла"
},
{
"id": "extra_poi_01",
"type": "poi",
"name": "Название точки интереса",
"description": "Описание объекта",
"linkedNodeId": null
}
]
}
`;
};
