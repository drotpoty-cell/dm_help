import React, { useState } from 'react';
import Link from 'next/link';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { X, ShieldAlert, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { CampaignBackupWidget } from './CampaignBackupWidget';

const PROVIDERS = [
  { id: 'gemini', label: 'Google Gemini', defaultModel: 'gemini-2.5-flash' },
  { id: 'openrouter', label: 'OpenRouter', defaultModel: 'openai/gpt-4o-mini' },
] as const;

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const store = useSettingsStore();
  const worldSystemPrompt = useWorkspaceStore((s) => s.worldSystemPrompt);
  const setWorldSystemPrompt = useWorkspaceStore((s) => s.setWorldSystemPrompt);

  const [prompt, setPrompt] = useState(store.systemPrompt || '');
  const [provider, setProvider] = useState(store.provider || 'gemini');
  const [model, setModel] = useState(store.model || '');
  const [apiKey, setApiKey] = useState(store.apiKey || '');
  const [worldPromptDraft, setWorldPromptDraft] = useState(worldSystemPrompt || '');

  const handleSave = () => {
    store.setSystemPrompt(prompt);
    store.setProvider(provider);
    store.setModel(model);
    store.setApiKey(apiKey);
    setWorldSystemPrompt(worldPromptDraft);
    toast.success('Настройки сохранены');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl w-[500px] max-h-[85vh] overflow-y-auto custom-scrollbar shadow-2xl flex flex-col gap-5 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-white mb-2">Настройки ⚙️</h2>

        <CampaignBackupWidget />

        <div className="border-t border-zinc-900 pt-4 flex flex-col gap-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Провайдер ИИ (BYOK)</h3>

          <div>
            <Label>Провайдер</Label>
            <select
              value={provider}
              onChange={(e) => {
                const next = e.target.value;
                setProvider(next);
                const found = PROVIDERS.find((p) => p.id === next);
                if (found && !model) setModel(found.defaultModel);
              }}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-indigo-500"
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Модель</Label>
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={PROVIDERS.find((p) => p.id === provider)?.defaultModel}
            />
          </div>

          <div>
            <Label>API-ключ</Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Вставьте свой ключ провайдера..."
              autoComplete="off"
            />
            {/* Предупреждение BYOK — прямо рядом с полем ввода, а не спрятано где-то в
                README (Блок 6, п.1). */}
            <div className="flex items-start gap-2 mt-2 bg-amber-950/30 border border-amber-900/50 rounded-lg px-3 py-2">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-300/90 leading-snug">
                Ключ хранится в <strong>открытом виде</strong> в localStorage вашего браузера и никуда не отправляется,
                кроме тела запроса к собственному <code className="text-amber-200">/api/ai</code> этого приложения.
                Не используйте общий/публичный компьютер для ввода ключа и не делитесь этим устройством с теми, кому не
                доверяете расходовать вашу квоту.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-900 pt-4">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-3.5 h-3.5 text-emerald-500" />
            <Label className="mb-0">Атмосфера и правила генерации мира</Label>
          </div>
          <Textarea
            value={worldPromptDraft}
            onChange={(e) => setWorldPromptDraft(e.target.value)}
            rows={4}
            placeholder='Например: "Кампания в жанре психологического хоррора, тон как в фильме Х. Избегай юмора, держи напряжение."'
          />
          <p className="text-[10px] text-zinc-600 mt-1.5 leading-snug">
            Это свойство МИРА, а не браузера — сохраняется в кампании (Supabase) и одинаково
            на любом устройстве. Автоматически подмешивается ко всем генерациям через AiWand
            и в шаблон экспорта этого мира. Если поле пустое — ИИ генерирует нейтральный
            текст в духе базового D&D 5e, никакого жанра или сеттинга по умолчанию нет.
          </p>
        </div>

        <div className="border-t border-zinc-900 pt-4">
          <Label>Системная роль (личный тон, этот браузер)</Label>
          <Textarea 
            value={prompt} 
            onChange={(e) => setPrompt(e.target.value)} 
            rows={3} 
          />
          <p className="text-[10px] text-zinc-600 mt-1.5 leading-snug">
            Ваш личный стиль поверх атмосферы мира выше — хранится только в этом браузере,
            не путешествует между устройствами и не сохраняется в кампании.
          </p>
        </div>

        <button 
          onClick={handleSave} 
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-colors mt-2"
        >
          Сохранить настройки
        </button>

        <div className="border-t border-zinc-900 pt-4 text-[10px] text-zinc-600 leading-relaxed space-y-1.5">
          <p>
            Независимый фан-инструмент для ведения настольных ролевых игр (в духе D&D и
            совместимых с OGL систем). Не аффилирован с правообладателями настольных систем,
            некоммерческое личное использование.
          </p>
          <p>
            <Link href="/privacy" className="text-indigo-400/80 hover:text-indigo-300 underline underline-offset-2">
              Политика конфиденциальности
            </Link>
            {' · '}
            <a href="mailto:dmitriy671games@list.ru" className="text-indigo-400/80 hover:text-indigo-300 underline underline-offset-2">
              dmitriy671games@list.ru
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
