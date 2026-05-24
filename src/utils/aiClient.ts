import { useSettingsStore } from '@/store/useSettingsStore';

export async function generateAiText(prompt: string, context?: string): Promise<string> {
  const { apiKey, aiProvider, aiModel, systemPrompt } = useSettingsStore.getState();
  
  const cleanKey = apiKey.trim();
  const cleanModel = aiModel.trim().replace(/^models\//, '');

  if (!cleanKey) throw new Error('API ключ не указан в настройках ⚙️');

  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: aiProvider,
        model: cleanModel,
        prompt,
        apiKey: cleanKey,
        systemPrompt,
        context
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка сервера при генерации');
    
    return data.text;
  } catch (err: any) {
    console.error('Client AI Error:', err);
    throw new Error(err.message || 'Ошибка сети при обращении к локальному API');
  }
}
