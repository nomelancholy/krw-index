"use client";

import { useMemo, type CSSProperties } from "react";
import { useDashboardStore } from "@/store";

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

export function IndicatorSelector() {
  const selectedIndicators = useDashboardStore((s) => s.selectedIndicators);
  const toggleIndicator = useDashboardStore((s) => s.toggleIndicator);

  const selectedSet = useMemo(() => new Set(selectedIndicators), [selectedIndicators]);

  return (
    <div className="control-group">
      <h3>Select Data Layers</h3>
      {INDICATORS.map((ind) => {
        const checked = selectedSet.has(ind.id);
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
              id={`indicator-${ind.id}`}
              checked={checked}
              onChange={() => toggleIndicator(ind.id)}
            />
            <label htmlFor={`indicator-${ind.id}`}>{ind.label}</label>
          </div>
        );
      })}
    </div>
  );
}

