import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { provider, model, prompt, systemPrompt, context } = body;

    const normalizedProvider = String(provider || '').toLowerCase().trim();
    const cleanModel = String(model || '').trim().replace(/^models\//, '');
    
    // ЖЕСТКАЯ ОЧИСТКА КЛЮЧА: удаляем абсолютно все пробелы, переносы строк и невидимые символы
    const apiKey = String(body.apiKey || '').replace(/[\r\n\s]+/g, '').trim();
    
    console.log('🤖 ИИ Запрос:', { normalizedProvider, cleanModel, hasKey: !!apiKey });

    if (!apiKey) {
      return NextResponse.json({ error: 'API ключ не предоставлен сервером' }, { status: 401 });
    }

    const combinedText = `[SYSTEM INSTRUCTION]\n${systemPrompt || ''}\n\n[CONTEXT]\n${context || 'Нет контекста'}\n\n[USER REQUEST]\n${prompt}`;

    let url = '';
    // Используем строгий класс Headers, который Vercel обрабатывает без ошибок
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    let fetchBody: any = {};

    if (normalizedProvider === 'gemini') {
      const baseUrl = process.env.GEMINI_PROXY_URL || 'https://generativelanguage.googleapis.com';
      url = `${baseUrl}/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;
      fetchBody = { contents: [{ parts: [{ text: combinedText }] }] };
    } 
    else if (normalizedProvider === 'openrouter') {
      url = 'https://openrouter.ai/api/v1/chat/completions';
      headers.append('Authorization', `Bearer ${apiKey}`);
      headers.append('HTTP-Referer', process.env.NEXT_PUBLIC_SITE_URL || 'https://dm-help.vercel.app');
      headers.append('X-Title', 'GM Assistant');
      
      fetchBody = { 
        model: cleanModel, 
        messages: [{ role: 'user', content: combinedText }] 
      };
    } 
    else {
      return NextResponse.json({ error: `Неизвестный провайдер: ${normalizedProvider}` }, { status: 400 });
    }

    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(fetchBody) });
    const data = await res.json();

    if (!res.ok) {
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