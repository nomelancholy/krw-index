import React from "react";
import { ChartStage } from "@/components/ChartStage";
import { FragmentsGrid } from "@/components/FragmentsGrid";
import { TectonicHeader } from "@/components/TectonicHeader";
import { TectonicSidebar } from "@/components/TectonicSidebar";

export default function Home() {
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

      <div className="tectonic-container">
        <TectonicHeader />
        <TectonicSidebar />

        <main className="main-display">
          <ChartStage />
          <FragmentsGrid />
        </main>
      </div>
    </div>
  );
}
