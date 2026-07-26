import { useSettingsStore } from '@/store/useSettingsStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

/**
 * Подмешивает кастомный системный промпт ТЕКУЩЕГО МИРА (свойство кампании, хранится в
 * JSONB в Supabase — `worldSystemPrompt` в createSystemSlice) к личному промпту ГМа из
 * браузерных настроек. Раньше здесь (и в /api/ai/route.ts, и в aiTemplateGenerator.ts)
 * был жёстко зашитый в код сеттинг/жанр — теперь никакого дефолтного жанра или сеттинга
 * в коде нет вообще: если ГМ не заполнил это поле для конкретной кампании, генератор
 * работает нейтрально (базовый D&D 5e), без обязательной "коррекции" ниже.
 */
function buildCombinedSystemPrompt(personalPrompt: string): string {
  const worldPrompt = useWorkspaceStore.getState().worldSystemPrompt?.trim();
  if (!worldPrompt) return personalPrompt;
  return `${personalPrompt}\n\nАтмосфера и правила генерации этого мира (заданы ГМом для этой кампании, обязательны к соблюдению):\n${worldPrompt}`;
}

export async function enhanceText(text: string): Promise<string> {
  const { provider, model, apiKey } = useSettingsStore.getState();

  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        model,
        apiKey,
        prompt: `Улучши следующее описание, сделав его более атмосферным и детализированным, сохранив суть: ${text}`,
        systemPrompt: buildCombinedSystemPrompt("Ты — профессиональный писатель фэнтези, помогающий мастеру игры."),
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка при улучшении текста');
    
    return data.text;
  } catch (err: unknown) {
    console.error('AI Enhance Error:', err);
    throw err;
  }
}

export async function generateAiText(prompt: string, context?: string): Promise<string> {
  const { provider, model, apiKey, systemPrompt } = useSettingsStore.getState();

  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        model,
        apiKey,
        prompt,
        systemPrompt: buildCombinedSystemPrompt(systemPrompt),
        context
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка сервера при генерации');
    
    return data.text;
  } catch (err: unknown) {
    console.error('Client AI Error:', err);
    throw new Error(err instanceof Error ? err.message : 'Ошибка сети при обращении к API');
  }
}