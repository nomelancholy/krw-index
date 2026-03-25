import React from "react";
import { IndicatorSelector } from "@/components/IndicatorSelector";
import { TemporalResolutionButtons } from "@/components/TemporalResolutionButtons";

export function TectonicSidebar() {
  return (
    <aside className="sidebar">
      <IndicatorSelector />
      <TemporalResolutionButtons />
    </aside>
  );
}

