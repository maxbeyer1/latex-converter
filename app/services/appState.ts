// Shared state across pages
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  latexContent: string;
  setLatexContent: (content: string) => void;
  clearLatexContent: () => void;
}

// Create a store with persistence
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      latexContent: '',
      setLatexContent: (content) => set({ latexContent: content }),
      clearLatexContent: () => set({ latexContent: '' }),
    }),
    {
      name: 'latex-app-storage',
    }
  )
);