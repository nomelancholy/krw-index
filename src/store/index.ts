import { create } from 'zustand'

interface DashboardState {
  selectedIndicators: string[];
  toggleIndicator: (indicatorId: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedIndicators: ['usd-krw'], // Default selection
  toggleIndicator: (indicatorId) =>
    set((state) => ({
      selectedIndicators: state.selectedIndicators.includes(indicatorId)
        ? state.selectedIndicators.filter((i) => i !== indicatorId)
        : [...state.selectedIndicators, indicatorId],
    })),
}))
