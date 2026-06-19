import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    
    // TODO: Заменить на реальный вызов LLM (OpenAI/Gemini/Anthropic), когда будет добавлен API ключ
    // const response = await fetch('https://api.openai.com/v1/chat/completions', { ... })

    // Временная заглушка для тестирования UI
    const mockText = `✨ [Сгенерировано ИИ для: ${prompt.substring(0, 30)}...] В этом месте чувствуется древняя магия...`;

    // Имитация задержки сети
    await new Promise(resolve => setTimeout(resolve, 1500));

    return NextResponse.json({ text: mockText });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка генерации' }, { status: 500 });
  }
}
