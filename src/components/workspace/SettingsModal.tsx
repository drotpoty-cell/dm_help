import React, { useState } from 'react';
import { useSettingsStore, AIProvider } from '@/store/useSettingsStore';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { X } from 'lucide-react';

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const store = useSettingsStore();

  // Инициализируем локальный стейт текущими значениями из стора
  const [provider, setProvider] = useState<AIProvider>(store.aiProvider || 'openrouter');
  const [model, setModel] = useState(store.aiModel || 'google/gemini-1.5-flash');
  const [key, setKey] = useState(store.apiKey || '');
  const [prompt, setPrompt] = useState(store.systemPrompt || '');

  const handleSave = () => {
    // Сохраняем всё в стор только по клику
    store.setAiProvider(provider);
    store.setAiModel(model.trim());
    store.setApiKey(key.trim());
    store.setSystemPrompt(prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl w-[450px] shadow-2xl flex flex-col gap-5 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-white mb-2">Настройки ИИ ⚙️</h2>

        <div>
          <Label>Провайдер ИИ</Label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as AIProvider)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none appearance-none"
          >
            <option value="openrouter">OpenRouter (Рекомендуется)</option>
            <option value="gemini">Google Gemini (Direct)</option>
            <option value="openai">OpenAI (ChatGPT)</option>
          </select>
        </div>

        <div>
          <Label>Модель</Label>
          <Input 
            value={model} 
            onChange={(e) => setModel(e.target.value)} 
            placeholder="Например: google/gemini-1.5-flash" 
          />
        </div>

        <div>
          <Label>API Ключ</Label>
          <Input 
            type="password" 
            value={key} 
            onChange={(e) => setKey(e.target.value)} 
            placeholder="sk-..." 
          />
        </div>

        <div>
          <Label>Системная роль</Label>
          <Textarea 
            value={prompt} 
            onChange={(e) => setPrompt(e.target.value)} 
            rows={3} 
          />
        </div>

        <button 
          onClick={handleSave} 
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-colors mt-2"
        >
          Сохранить настройки
        </button>
      </div>
    </div>
  );
}
