import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateAiText } from '@/utils/aiClient';
import { Textarea } from '../../ui/Textarea';

interface AiWandProps {
  currentValue: string;
  contextData: any;
  onApply: (text: string) => void;
  title?: string;
  // Добавляем режим генерации
  mode?: 'character' | 'location' | 'general'; 
}

export const AiWand: React.FC<AiWandProps> = ({ currentValue, contextData, onApply, title, mode = 'character' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleGenerate = async (useCurrentValue: boolean) => {
    setIsLoading(true);
    try {
      let rules = `ВАЖНО: Верни ТОЛЬКО готовый текст. Будь краток (1-3 предложения). Никаких вариантов на выбор, никаких пояснений, никаких приветствий. Только художественный результат.`;

      if (mode === 'location') {
        rules = `ВАЖНО: Сделай подробное, кинематографичное описание локации. Используй 3-5 развернутых предложений. Обязательно опиши визуальные детали, звуки, освещение и запахи, чтобы игроки полностью погрузились в сцену. Верни ТОЛЬКО готовый текст без пояснений, кавычек и вариантов.`;
      }

      // --- НОВАЯ ЛОГИКА ДЛЯ СОБЫТИЙ ---
      let toneInstruction = "";
      if (contextData?.eventType) {
        if (contextData.eventType === 'peaceful') {
          toneInstruction = "\nИНСТРУКЦИЯ К СОБЫТИЮ: Это событие строго МИРНОЕ. Отряд не должен получить урон. Это может быть полезная находка, бродячий торговец, безопасный лор или красивое природное явление.";
        } else if (contextData.eventType === 'hostile') {
          toneInstruction = "\nИНСТРУКЦИЯ К СОБЫТИЮ: Это событие строго ВРАЖДЕБНОЕ и ОПАСНОЕ. Это может быть засада монстров, скрытая ловушка, агрессивная магия локации или опасный катаклизм.";
        } else if (contextData.eventType === 'random') {
          toneInstruction = "\nИНСТРУКЦИЯ К СОБЫТИЮ: Выбери характер события случайно на свое усмотрение (оно может быть как опасным, так и мирным).";
        }
        
        // Добавляем погоду для атмосферы, если она передана
        if (contextData.weatherCondition) {
             toneInstruction += `\nПОГОДА: Сейчас ${contextData.weatherCondition}, климат ${contextData.climate}. Обязательно вплети эту погоду в описание события (например, метель скрывает следы или жара утомляет).`
        }
      }

      const finalPrompt = useCurrentValue
        ? `Улучши текст для D&D кампании, сделай его более атмосферным. Текущий текст: "${currentValue}". Дополнительные пожелания: ${prompt || 'нет'}. \n\n${rules}${toneInstruction}`
        : `Сгенерируй текст для D&D по запросу: "${prompt}". \n\n${rules}${toneInstruction}`;
      
      const response = await generateAiText(finalPrompt, JSON.stringify(contextData));
      
      const cleanedResponse = response.replace(/^["']|["']$/g, '').trim();
      
      onApply(cleanedResponse);
      toast.success('Успешно сгенерировано');
      setIsOpen(false);
      setPrompt('');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Ошибка при генерации текста');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <span className="relative inline-flex items-center" ref={popoverRef}>
      <Sparkles 
        className="w-4 h-4 text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      />
      
      {isOpen && (
        <span className="absolute z-50 bg-zinc-900 border border-zinc-700 p-3 rounded-xl w-72 shadow-2xl mt-1 right-0" onClick={(e) => e.stopPropagation()}>
          <Textarea
            className="mb-3"
            placeholder={mode === 'location' ? "Опиши детали (например: мрачная пещера, пахнет серой...)" : "Что сгенерировать? Укажи детали..."}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />
          
          <span className="flex flex-col gap-2">
            {currentValue && (
              <button 
                onClick={() => handleGenerate(true)}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Улучшить текущее
              </button>
            )}
            
            <button 
              onClick={() => handleGenerate(false)}
              disabled={isLoading || (mode !== 'location' && !prompt.trim())}
              className="flex items-center justify-center gap-2 w-full bg-zinc-700 hover:bg-zinc-600 text-white text-xs py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Сгенерировать с нуля'}
            </button>
          </span>
        </span>
      )}
    </span>
  );
};