export const generateAIPromptTemplate = () => {
  return `Ты — профессиональный Dungeon Master и сценарист. Мы с тобой только что проработали лор, локацию и персонажей. 
Твоя задача: перевести все созданные нами данные в строгий JSON формат для импорта в базу данных GM Assistant.

ПРАВИЛА:
1. Выведи ТОЛЬКО валидный JSON. Никакого markdown, никаких комментариев до или после кода.
2. Все ID должны быть уникальными строками в формате snake_case.
3. Заполни АБСОЛЮТНО ВСЕ поля, указанные в схеме ниже. Если данных нет, придумай их логично исходя из контекста или оставь пустую строку/массив, но не удаляй ключ.

СХЕМА JSON:
{
  "plotNodes": [
    {
      "id": "уникальный_id",
      "title": "Название квеста",
      "description": "Подробное описание",
      "status": "hidden"
    }
  ],
  "heroes": [
    {
      "id": "hero_id",
      "name": "Имя персонажа",
      "playerName": "Имя игрока",
      "raceClass": "Раса и класс",
      "level": 1,
      "hp": 20,
      "maxHp": 20,
      "ac": 12,
      "initiativeModifier": 0,
      "passivePerception": 10,
      "inventory": "Инвентарь",
      "classResources": [{"name": "Ресурс", "current": 0, "max": 0}],
      "description": "Описание",
      "linkedNodeId": "node_id"
    }
  ],
  "npcs": [
    {
      "id": "npc_id",
      "name": "Имя",
      "description": "Описание",
      "occupation": "Род деятельности",
      "locationId": "location_id",
      "needsUpdate": false,
      "isMerchant": false,
      "hp": 10,
      "maxHp": 10,
      "ac": 10,
      "dndClass": "Класс",
      "skills": "Навыки",
      "goal": "Цель",
      "secret": "Секрет",
      "personalLoot": "Лут",
      "stats": "Статы",
      "notes": "Заметки",
      "traits": ["черта"],
      "linkedNodeId": "node_id"
    }
  ],
  "quests": [
    {
      "id": "quest_id",
      "title": "Название",
      "description": "Описание",
      "hook": "Завязка",
      "giver": "Дающий квест",
      "status": "available",
      "startDay": 1,
      "deadline": 7,
      "reward": "Награда",
      "consequence": "Последствия",
      "locationId": "location_id"
    }
  ],
  "loot": [
    {
      "id": "loot_id",
      "name": "Название",
      "description": "Описание",
      "rarity": "common",
      "price": 0,
      "weight": 0,
      "stats": "Статы",
      "ownerId": "owner_id"
    }
  ],
  "extras": [
    {
      "id": "extra_id",
      "name": "Название",
      "description": "Описание",
      "type": "check" 
    }
  ]
}`;
};
