import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      systemPrompt: 'Ты помощник Мастера Подземелий D&D 5e',
      setSystemPrompt: (systemPrompt) => set({ systemPrompt }),
    }),
    {
      name: 'gm-assistant:settings',
    }
  )
);
