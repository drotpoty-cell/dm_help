import { useSettingsStore } from '@/store/useSettingsStore';

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
        systemPrompt: "Ты — профессиональный писатель фэнтези, помогающий мастеру игры.",
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка при улучшении текста');
    
    return data.text;
  } catch (err: any) {
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
        systemPrompt,
        context
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка сервера при генерации');
    
    return data.text;
  } catch (err: any) {
    console.error('Client AI Error:', err);
    throw new Error(err.message || 'Ошибка сети при обращении к API');
  }
}