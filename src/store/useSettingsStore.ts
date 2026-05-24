import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AIProvider = 'openai' | 'gemini' | 'openrouter';

interface SettingsState {
  apiKey: string;
  aiProvider: AIProvider;
  aiModel: string;
  systemPrompt: string;
  setApiKey: (key: string) => void;
  setAiProvider: (provider: AIProvider) => void;
  setAiModel: (model: string) => void;
  setSystemPrompt: (prompt: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      aiProvider: 'gemini',
      aiModel: 'gemini-1.5-flash-latest',
      systemPrompt: 'Ты помощник Мастера Подземелий D&D 5e',
      setApiKey: (apiKey) => set({ apiKey }),
      setAiProvider: (aiProvider) => set({ aiProvider }),
      setAiModel: (aiModel) => set({ aiModel }),
      setSystemPrompt: (systemPrompt) => set({ systemPrompt }),
    }),
    {
      name: 'gm-assistant:settings',
    }
  )
);
