export const dynamic = 'force-dynamic'; 

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { provider, model, prompt, systemPrompt, context } = body;

    const normalizedProvider = String(provider || '').toLowerCase().trim();
    const cleanModel = String(model || '').trim().replace(/^models\//, '');
    
    // ПЛАН Б: Сначала берем секретный ключ из переменных окружения Vercel (процесс на сервере).
    // Если его там нет, берем то, что пришло из браузера (для локальной разработки).
    const serverKey = process.env.OPENROUTER_API_KEY;
    const clientKey = String(body.apiKey || '').replace(/[\r\n\s"']/g, '');
    const safeApiKey = serverKey || clientKey;
    
    console.log('🤖 ИИ Запрос:', { 
      normalizedProvider, 
      cleanModel, 
      hasKey: !!safeApiKey,
      source: serverKey ? 'vercel-env' : 'browser'
    });

    if (!safeApiKey) {
      return NextResponse.json({ error: 'API ключ не найден ни на сервере, ни в запросе' }, { status: 401 });
    }

    const combinedText = `[SYSTEM INSTRUCTION]\n${systemPrompt || ''}\n\n[CONTEXT]\n${context || 'Нет контекста'}\n\n[USER REQUEST]\n${prompt}`;

    let url = '';
    let headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    let fetchBody: any = {};

    if (normalizedProvider === 'gemini') {
      const baseUrl = process.env.GEMINI_PROXY_URL || 'https://generativelanguage.googleapis.com';
      url = `${baseUrl}/v1beta/models/${cleanModel}:generateContent?key=${safeApiKey}`;
      fetchBody = { contents: [{ parts: [{ text: combinedText }] }] };
    } 
    else if (normalizedProvider === 'openrouter') {
      url = 'https://openrouter.ai/api/v1/chat/completions';
      headers['Authorization'] = `Bearer ${safeApiKey}`;
      headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_SITE_URL || 'https://dm-help.vercel.app';
      headers['X-Title'] = 'GM Assistant';
      
      fetchBody = { 
        model: cleanModel, 
        messages: [{ role: 'user', content: combinedText }] 
      };
    } 
    else {
      return NextResponse.json({ error: `Неизвестный провайдер: ${normalizedProvider}` }, { status: 400 });
    }

    const res = await fetch(url, { 
      method: 'POST', 
      headers, 
      body: JSON.stringify(fetchBody),
      cache: 'no-store' 
    });
    
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