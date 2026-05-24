import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { provider, model, prompt, apiKey, systemPrompt, context } = body;

    const normalizedProvider = String(provider || '').toLowerCase().trim();
    // Жестко вычищаем префикс models/, чтобы избежать двойного наложения в URL
    const cleanModel = String(model || '').trim().replace(/^models\//, '');
    
    console.log('🤖 ИИ Запрос:', { normalizedProvider, cleanModel, hasKey: !!apiKey });

    if (!apiKey) {
      return NextResponse.json({ error: 'API ключ не предоставлен сервером' }, { status: 401 });
    }

    const combinedText = `[SYSTEM INSTRUCTION]\n${systemPrompt || ''}\n\n[CONTEXT]\n${context || 'Нет контекста'}\n\n[USER REQUEST]\n${prompt}`;

    let url = '';
    let headers: any = { 'Content-Type': 'application/json' };
    let fetchBody: any = {};

    if (normalizedProvider === 'gemini') {
      // Поддержка прокси для РФ. Если переменной нет, использует стандартный URL.
      const baseUrl = process.env.GEMINI_PROXY_URL || 'https://generativelanguage.googleapis.com';
      url = `${baseUrl}/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;
      fetchBody = { contents: [{ parts: [{ text: combinedText }] }] };
    } 
    else if (normalizedProvider === 'openrouter') {
      url = 'https://openrouter.ai/api/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      headers['X-Title'] = 'GM Assistant'; // Помогает избежать некоторых блокировок OpenRouter
      fetchBody = { 
        model: cleanModel, 
        messages: [{ role: 'user', content: combinedText }] 
      };
    } 
    else if (normalizedProvider === 'openai') {
      url = 'https://api.openai.com/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
      fetchBody = { model: cleanModel, messages: [{ role: 'user', content: combinedText }] };
    } 
    else {
      return NextResponse.json({ error: `Неизвестный провайдер: ${normalizedProvider}` }, { status: 400 });
    }

    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(fetchBody) });
    const data = await res.json();

    if (!res.ok) {
      // Более детальный вывод ошибки провайдера
      const errorMessage = data.error?.message || data.error || 'Неизвестная ошибка API провайдера';
      console.error(`Провайдер ${normalizedProvider} вернул ошибку:`, errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: res.status });
    }

    const text = normalizedProvider === 'gemini' 
      ? data.candidates?.[0]?.content?.parts?.[0]?.text 
      : data.choices?.[0]?.message?.content;

    return NextResponse.json({ text: text || 'Пустой ответ от ИИ' });
  } catch (error: any) {
    console.error('Server AI Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}