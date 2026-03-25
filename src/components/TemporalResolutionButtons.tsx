"use client";

import React, { useState, type CSSProperties } from "react";

type TemporalKey = "1D" | "1W" | "1M" | "1Y";

const TEMPORALS: TemporalKey[] = ["1D", "1W", "1M", "1Y"];

export function TemporalResolutionButtons() {
  const [selected, setSelected] = useState<TemporalKey>("1W");

  return (
    <div className="control-group">
      <h3>Temporal Resolution</h3>
      <div className="temporal-btn-row" role="group" aria-label="Temporal Resolution">
        {TEMPORALS.map((t) => {
          const isSelected = t === selected;
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
              onClick={() => setSelected(t)}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}

