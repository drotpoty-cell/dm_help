import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

const ALLOWED_PROVIDERS = ['gemini', 'openrouter'] as const;
type Provider = (typeof ALLOWED_PROVIDERS)[number];

// Модель приходит от клиента и подставляется в URL — ограничиваем допустимые символы,
// чтобы исключить инъекцию лишних query-параметров или path traversal в адресе провайдера.
const SAFE_MODEL_RE = /^[a-zA-Z0-9._:-]{1,100}$/;

// Грубые лимиты на размер входных данных, чтобы один запрос не мог создать
// неограниченно дорогой вызов внешнего AI API.
const MAX_PROMPT_LENGTH = 4000;
const MAX_CONTEXT_LENGTH = 20000;
const MAX_SYSTEM_PROMPT_LENGTH = 4000;

type GeminiBody = { contents: { parts: { text: string }[] }[] };
type OpenRouterBody = { model: string; messages: { role: 'user'; content: string }[]; max_tokens: number };

function truncate(value: unknown, max: number): string {
  const str = typeof value === 'string' ? value : '';
  return str.length > max ? str.slice(0, max) : str;
}

export async function POST(req: Request) {
  try {
    // Требуем авторизованную сессию Supabase. Раньше этот роут был полностью открытым:
    // при отсутствии клиентского ключа он тихо использовал СЕРВЕРНЫЙ OPENROUTER_API_KEY,
    // и любой человек, знающий URL, мог бесплатно жечь чужую платную квоту.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    const body = await req.json();

    const prompt = truncate(body.prompt, MAX_PROMPT_LENGTH) || 'Сделай красивое описание';
    const context = truncate(body.context, MAX_CONTEXT_LENGTH) || 'Нет данных';
    const systemPrompt = truncate(body.systemPrompt, MAX_SYSTEM_PROMPT_LENGTH) || 'Ты — креативный помощник Мастера Подземелий D&D 5e.';

    const providerInput = String(body.provider || process.env.DEFAULT_AI_PROVIDER || 'gemini').toLowerCase().trim();
    if (!ALLOWED_PROVIDERS.includes(providerInput as Provider)) {
      return NextResponse.json({ error: 'Неизвестный провайдер: ' + providerInput }, { status: 400 });
    }
    const normalizedProvider = providerInput as Provider;

    const modelInput = String(body.model || process.env.DEFAULT_AI_MODEL || 'gemini-2.5-flash').trim().replace(/^models\//, '');
    let cleanModel = modelInput;

    // Принудительный апгрейд старых моделей из кэша LocalStorage
    if (normalizedProvider === 'gemini' && (cleanModel.includes('1.5') || cleanModel === 'gemini-pro')) {
      cleanModel = 'gemini-2.5-flash';
    }

    if (!SAFE_MODEL_RE.test(cleanModel)) {
      return NextResponse.json({ error: 'Недопустимое имя модели' }, { status: 400 });
    }

    const serverKey = process.env.OPENROUTER_API_KEY;
    const clientKey = String(body.apiKey || '').replace(/[\r\n\s"']/g, '');
    const safeApiKey = clientKey || serverKey;

    if (!safeApiKey) {
      return NextResponse.json({ error: 'API ключ не найден ни на клиенте, ни на сервере' }, { status: 401 });
    }

    const strictRules = 'УСТАНОВКА ДЛЯ ИИ:\n1. Полностью сопоставь и используй все известные данные из предоставленного контекста (JSON).\n2. Выполни задачу из [USER REQUEST], строго соблюдая запрошенный там стиль и объем.\n3. Выведи ТОЛЬКО чистый итоговый текст. Никаких кавычек на всю строку, никаких вводных слов, пояснений и списков.';

    // Никакого зашитого в код сеттинга/жанра здесь нет и не должно быть (было — убрано по
    // явному решению владельца продукта). Кастомная атмосфера/правила конкретного мира,
    // если ГМ их задал, уже подмешаны В systemPrompt ДО того, как запрос попал сюда — см.
    // buildCombinedSystemPrompt в utils/aiClient.ts. Если ГМ ничего не задал — systemPrompt
    // остаётся нейтральным (см. дефолт выше), и результат будет в духе базового D&D 5e.
    const combinedText = '[SYSTEM INSTRUCTION]\n' + systemPrompt + '\n' + strictRules + '\n\n[CONTEXT]\n' + context + '\n\n[USER REQUEST]\n' + prompt;

    let url: string;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    let fetchBody: GeminiBody | OpenRouterBody;

    if (normalizedProvider === 'gemini') {
      const baseUrl = process.env.GEMINI_PROXY_URL || 'https://generativelanguage.googleapis.com';
      url = baseUrl + '/v1beta/models/' + encodeURIComponent(cleanModel) + ':generateContent?key=' + encodeURIComponent(safeApiKey);
      fetchBody = { contents: [{ parts: [{ text: combinedText }] }] };
    } else {
      url = 'https://openrouter.ai/api/v1/chat/completions';
      headers['Authorization'] = 'Bearer ' + safeApiKey;
      headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_SITE_URL || 'https://dm-help.vercel.app';
      headers['X-Title'] = 'GM Assistant';
      fetchBody = { model: cleanModel, messages: [{ role: 'user', content: combinedText }], max_tokens: 1500 };
    }

    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(fetchBody), cache: 'no-store' });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || data.error || 'Ошибка провайдера API' }, { status: res.status });
    }

    let text: string | undefined = normalizedProvider === 'gemini'
      ? data.candidates?.[0]?.content?.parts?.[0]?.text
      : data.choices?.[0]?.message?.content;

    if (!text) {
      return NextResponse.json({ error: 'Пустой ответ от ИИ' }, { status: 502 });
    }

    text = text.trim().replace(/^["']|["']$/g, '');
    return NextResponse.json({ text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
