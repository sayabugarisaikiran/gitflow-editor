import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
    theme: 'dark' | 'light';
    hasSeenOnboarding: boolean;
    toggleTheme: () => void;
    setHasSeenOnboarding: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            theme: 'dark', // Default to dark mode for developer tools
            hasSeenOnboarding: false,
            toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
            setHasSeenOnboarding: (value: boolean) => set({ hasSeenOnboarding: value }),
        }),
        {
            name: 'gitflow-settings', // unique name for localStorage
        }
    )
);

