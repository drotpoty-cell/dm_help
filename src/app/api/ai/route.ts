export const dynamic = 'force-dynamic'; 

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { provider, model, prompt, systemPrompt, context } = body;

    const normalizedProvider = String(provider || '').toLowerCase().trim();
    const cleanModel = String(model || '').trim().replace(/^models\//, '');
    
    // ПЛАН Б: Берем ключ из секретных переменных сервера Vercel
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
      return NextResponse.json({ error: 'API ключ не найден на сервере' }, { status: 401 });
    }

    // Формируем железобетонную системную инструкцию прямо на бэкенде
    const baseSystemPrompt = systemPrompt || 'Ты — креативный помощник Мастера Подземелий D&D 5e.';
    const strictRules = `
УСТАНОВКА ДЛЯ ИИ:
1. Сгенерируй ОДИН вариант готового художественного текста для карточки.
2. Объём текста должен быть строго в пределах 20-30 слов (коротко, ёмко и атмосферно).
3. Полностью сопоставь и используй все известные данные из предоставленного контекста карточки (JSON данные персонажа/локации).
4. Если пользователь передал конкретный запрос (USER REQUEST), адаптируй текст и стилистику под это пожелание. Если запрос пустой — просто сделай сочное художественное описание на основе карточки.
5. Выведи ТОЛЬКО чистый итоговый текст. Никаких кавычек на всю строку, никаких вводных слов ("Вот ваше описание:", "Вариант:"), никаких пояснений и списков.
`;

    const combinedText = `[SYSTEM INSTRUCTION]\n${baseSystemPrompt}\n${strictRules}\n\n[CARD CONTEXT (ДАННЫЕ ИЗ КАРТОЧКИ)]\n${context || 'Нет данных'}\n\n[USER REQUEST (ДОПОЛНИТЕЛЬНЫЙ ЗАПРОС)]\n${prompt || 'Просто сделай красивое описание на основе всей карточки'}`;

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
        messages: [{ role: 'user', content: combinedText }],
        max_tokens: 1000 // Решает проблему лимита кредитов (MORE CREDITS ERROR)
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

    let text = normalizedProvider === 'gemini' 
      ? data.candidates?.[0]?.content?.parts?.[0]?.text 
      : data.choices?.[0]?.message?.content;

    if (text) {
      // Подчищаем случайные кавычки, которые ИИ по привычке может поставить в начале и конце
      text = text.trim().replace(/^["']|["']$/g, '');
    }

    return NextResponse.json({ text: text || 'Пустой ответ от ИИ' });
  } catch (error: any) {
    console.error('Server AI Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}