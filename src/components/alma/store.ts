import { create } from 'zustand';

export type Screen = 'dashboard' | 'venta' | 'compra' | 'retiro' | 'config' | 'historial';

interface AlmaStore {
  screen: Screen;
  setScreen: (s: Screen) => void;
  dashboardRefresh: number;
  refreshDashboard: () => void;
}

export const useAlmaStore = create<AlmaStore>((set) => ({
  screen: 'dashboard',
  setScreen: (s) => set({ screen: s }),
  dashboardRefresh: 0,
  refreshDashboard: () => set((st) => ({ dashboardRefresh: st.dashboardRefresh + 1 })),
}));