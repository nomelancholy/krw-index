"use client";

import { useMemo, type CSSProperties } from "react";
import { useDashboardStore, type PanelId } from "@/store";

type Indicator = {
  id: string;
  label: string;
  accentColor: string;
};

const INDICATORS: Indicator[] = [
  { id: "usd-krw", label: "USD / KRW", accentColor: "#ff4d00" },
  { id: "dxy", label: "Dollar Index (DXY)", accentColor: "#d4ff00" },
  { id: "fx-res", label: "FX Reserves", accentColor: "#00f2ff" },
  { id: "kospi", label: "KOSPI", accentColor: "#ff00f2" },
  { id: "kosdaq", label: "KOSDAQ", accentColor: "#ffffff" },
  { id: "adj-rate", label: "ADJ. Rate (Calibrated)", accentColor: "#5555ff" },
];

const PANEL_INDICATOR_IDS = ["usd-krw", "fx-res", "kospi", "kosdaq"];

export function IndicatorSelector({ panelId }: { panelId: PanelId }) {
  const selectedIndicators = useDashboardStore((s) =>
    panelId === 1 ? s.selectedIndicators1 : s.selectedIndicators2,
  );
  const toggleIndicator = useDashboardStore((s) =>
    panelId === 1 ? s.toggleIndicator1 : s.toggleIndicator2,
  );

  const selectedSet = useMemo(() => new Set(selectedIndicators), [selectedIndicators]);
  const allowedSet = new Set(PANEL_INDICATOR_IDS);

  return (
    <div className="control-group">
      <h3>Select Data Layers</h3>
      {INDICATORS.filter((ind) => allowedSet.has(ind.id)).map((ind) => {
        const checked = selectedSet.has(ind.id);
        const checkboxId = `indicator-${panelId}-${ind.id}`;
        return (
          <div
            key={ind.id}
            className="check-item"
            style={
              { ["--accent-color"]: ind.accentColor } as CSSProperties & Record<string, string>
            }
          >
            <input
              type="checkbox"
              id={checkboxId}
              checked={checked}
              onChange={() => toggleIndicator(ind.id)}
            />
            <label htmlFor={checkboxId}>{ind.label}</label>
          </div>
        );
      })}
    </div>
  );
}

