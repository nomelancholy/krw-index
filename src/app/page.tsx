import React from "react";
import { ChartStage } from "@/components/ChartStage";
import { TectonicHeader } from "@/components/TectonicHeader";
import { TectonicSidebar } from "@/components/TectonicSidebar";
import type { PanelId } from "@/store";

export default function Home() {
  const panel1: PanelId = 1;
  const panel2: PanelId = 2;

  return (
    <div className="tectonic-app">
      {/* Reference UI: grain filter overlay */}
      <svg id="grain-filter" aria-hidden="true">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.4 0"
          />
        </filter>
      </svg>
      <div className="noise-overlay" />

      <div className="pair-stack">
        <TectonicHeader />
        <div className="pair-row">
          <TectonicSidebar panelId={panel1} />
          <main className="main-display">
            <ChartStage panelId={panel1} />
          </main>
        </div>
        <div className="pair-row">
          <TectonicSidebar panelId={panel2} />
          <main className="main-display">
            <ChartStage panelId={panel2} />
          </main>
        </div>
      </div>
    </div>
  );
}
