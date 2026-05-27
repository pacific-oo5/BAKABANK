import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTradingStore = create(
  persist(
    (set) => ({
      user: null,
      activeTab: 'main',

      setUser: (userData) => set({ user: userData }),
      setActiveTab: (tabName) => set({ activeTab: tabName }),
      
      logout: () => {
        set({ user: null, activeTab: 'main' });
        localStorage.removeItem('bakabank-session');
      },
      
      updateBalances: (updatedAccounts) => set((state) => ({
        user: state.user ? { ...state.user, ...updatedAccounts } : null
      }))
    }),
    {
      name: 'bakabank-session',
      version: 3,
      // ЖЕЛЕЗОБЕТОННОЕ ИСПРАВЛЕНИЕ: Если версия в кэше не совпадает, 
      // этот метод просто сбрасывает старый стейт и не дает ошибке появиться!
      migrate: (persistedState, version) => {
        if (version !== 3) {
          console.log("Старый кэш обнаружен и успешно очищен!");
          return { user: null, activeTab: 'main' }; // Возвращаем чистый дефолтный стейт
        }
        return persistedState;
      },
    }
  )
);