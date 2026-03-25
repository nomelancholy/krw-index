import { create } from 'zustand'

export type TemporalKey = "1D" | "1W" | "1M" | "1Y";
export type PanelId = 1 | 2;

interface DashboardState {
  selectedIndicators1: string[];
  selectedIndicators2: string[];

  temporalKey1: TemporalKey;
  temporalKey2: TemporalKey;

  toggleIndicator1: (indicatorId: string) => void;
  toggleIndicator2: (indicatorId: string) => void;

  setTemporalKey1: (key: TemporalKey) => void;
  setTemporalKey2: (key: TemporalKey) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  // Panel 1 defaults (PAIR_1: usd-krw + kospi)
  selectedIndicators1: ["usd-krw"],
  temporalKey1: "1W",

  // Panel 2 defaults (PAIR_2: fx-res + kosdaq)
  selectedIndicators2: ["fx-res"],
  temporalKey2: "1W",

  toggleIndicator1: (indicatorId) =>
    set((state) => ({
      selectedIndicators1: state.selectedIndicators1.includes(indicatorId)
        ? state.selectedIndicators1.filter((i) => i !== indicatorId)
        : [...state.selectedIndicators1, indicatorId],
    })),
  toggleIndicator2: (indicatorId) =>
    set((state) => ({
      selectedIndicators2: state.selectedIndicators2.includes(indicatorId)
        ? state.selectedIndicators2.filter((i) => i !== indicatorId)
        : [...state.selectedIndicators2, indicatorId],
    })),

  setTemporalKey1: (key) => set({ temporalKey1: key }),
  setTemporalKey2: (key) => set({ temporalKey2: key }),
}))
