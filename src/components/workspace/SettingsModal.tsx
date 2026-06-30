import React, { useState } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { X } from 'lucide-react';
import { CampaignBackupWidget } from './CampaignBackupWidget';

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const store = useSettingsStore();

  const [prompt, setPrompt] = useState(store.systemPrompt || '');

  const handleSave = () => {
    store.setSystemPrompt(prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl w-[450px] shadow-2xl flex flex-col gap-5 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-white mb-2">Настройки ⚙️</h2>

        <CampaignBackupWidget />

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
