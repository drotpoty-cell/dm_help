import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  systemPrompt: string;
  provider: string;
  model: string;
  apiKey: string;
  setSystemPrompt: (prompt: string) => void;
  setProvider: (provider: string) => void;
  setModel: (model: string) => void;
  setApiKey: (apiKey: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      systemPrompt: 'Ты помощник Мастера Подземелий D&D 5e',
      provider: 'gemini',
      model: 'gemini-1.5-pro',
      apiKey: '',
      setSystemPrompt: (systemPrompt) => set({ systemPrompt }),
      setProvider: (provider) => set({ provider }),
      setModel: (model) => set({ model }),
      setApiKey: (apiKey) => set({ apiKey }),
    }),
    {
      name: 'gm-assistant:settings',
    }
  )
);
