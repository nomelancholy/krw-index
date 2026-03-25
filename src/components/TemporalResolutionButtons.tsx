"use client";

import React, { type CSSProperties } from "react";
import { useDashboardStore, type PanelId, type TemporalKey } from "@/store";

const TEMPORALS: TemporalKey[] = ["1D", "1W", "1M", "1Y"];

export function TemporalResolutionButtons({ panelId }: { panelId: PanelId }) {
  const temporalKey = useDashboardStore((s) => (panelId === 1 ? s.temporalKey1 : s.temporalKey2));
  const setTemporalKey = useDashboardStore((s) => (panelId === 1 ? s.setTemporalKey1 : s.setTemporalKey2));

  return (
    <div className="control-group">
      <h3>Temporal Resolution</h3>
      <div className="temporal-btn-row" role="group" aria-label="Temporal Resolution">
        {TEMPORALS.map((t) => {
          const isSelected = t === temporalKey;
          return (
            <button
              key={t}
              type="button"
              className={`temporal-btn ${isSelected ? "temporal-btn--selected" : ""}`}
              style={
                {
                  ["--temporal-accent"]: isSelected ? "var(--lava-accent)" : "var(--basalt-crust)",
                } as CSSProperties & Record<string, string>
              }
              onClick={() => setTemporalKey(t)}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}

