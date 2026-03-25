"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { PanelId } from "@/store";

const IndicatorSelectorPanel = dynamic(
  () => import("@/components/IndicatorSelector").then((m) => m.IndicatorSelector),
  { ssr: false },
);

const TemporalResolutionButtonsPanel = dynamic(
  () =>
    import("@/components/TemporalResolutionButtons").then((m) => m.TemporalResolutionButtons),
  { ssr: false },
);

export function TectonicSidebar({ panelId }: { panelId: PanelId }) {
  return (
    <aside className="sidebar">
      <IndicatorSelectorPanel panelId={panelId} />
      <TemporalResolutionButtonsPanel panelId={panelId} />
    </aside>
  );
}

