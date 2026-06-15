import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, systemPrompt, context } = body;

    const provider = body.provider || process.env.DEFAULT_AI_PROVIDER || 'gemini';
    const model = body.model || process.env.DEFAULT_AI_MODEL || 'gemini-1.5-pro-latest';
    
    const normalizedProvider = String(provider).toLowerCase().trim();
    const cleanModel = String(model).trim().replace(/^models\//, '');
    
    const serverKey = process.env.OPENROUTER_API_KEY; 
    const clientKey = String(body.apiKey || '').replace(/[\r\n\s"']/g, '');
    const safeApiKey = clientKey || serverKey;
    
    if (!safeApiKey) {
      return NextResponse.json({ error: 'API ключ не найден ни на клиенте, ни на сервере' }, { status: 401 });
    }

    const baseSystemPrompt = systemPrompt || 'Ты — креативный помощник Мастера Подземелий D&D 5e.';
    const strictRules = 'УСТАНОВКА ДЛЯ ИИ:\n1. Полностью сопоставь и используй все известные данные из предоставленного контекста (JSON).\n2. Выполни задачу из [USER REQUEST], строго соблюдая запрошенный там стиль и объем.\n3. Выведи ТОЛЬКО чистый итоговый текст. Никаких кавычек на всю строку, никаких вводных слов, пояснений и списков.';

    const combinedText = '[SYSTEM INSTRUCTION]\n' + baseSystemPrompt + '\n' + strictRules + '\n\n[CONTEXT]\n' + (context || 'Нет данных') + '\n\n[USER REQUEST]\n' + (prompt || 'Сделай красивое описание');

    let url = '';
    let headers: Record<string, string> = { 'Content-Type': 'application/json' };
    let fetchBody: any = {};

    if (normalizedProvider === 'gemini') {
      const baseUrl = process.env.GEMINI_PROXY_URL || 'https://generativelanguage.googleapis.com';
      url = baseUrl + '/v1beta/models/' + cleanModel + ':generateContent?key=' + safeApiKey;
      fetchBody = { contents: [{ parts: [{ text: combinedText }] }] };
    } 
    else if (normalizedProvider === 'openrouter') {
      url = 'https://openrouter.ai/api/v1/chat/completions';
      headers['Authorization'] = 'Bearer ' + safeApiKey;
      headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_SITE_URL || 'https://dm-help.vercel.app';
      headers['X-Title'] = 'GM Assistant';
      fetchBody = { model: cleanModel, messages: [{ role: 'user', content: combinedText }], max_tokens: 1500 };
    } 
    else {
      return NextResponse.json({ error: 'Неизвестный провайдер: ' + normalizedProvider }, { status: 400 });
    }

    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(fetchBody), cache: 'no-store' });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || data.error || 'Ошибка провайдера API' }, { status: res.status });
    }

    let text = normalizedProvider === 'gemini' 
      ? data.candidates?.[0]?.content?.parts?.[0]?.text 
      : data.choices?.[0]?.message?.content;

    if (!text) {
      return NextResponse.json({ error: 'Пустой ответ от ИИ' }, { status: 502 });
    }

    text = text.trim().replace(/^["']|["']$/g, '');
    return NextResponse.json({ text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}