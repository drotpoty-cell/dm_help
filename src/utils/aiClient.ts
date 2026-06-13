import { useSettingsStore } from '@/store/useSettingsStore';

export async function generateAiText(prompt: string, context?: string): Promise<string> {
  const { systemPrompt } = useSettingsStore.getState();

  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
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
