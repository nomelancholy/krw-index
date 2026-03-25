"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { PanelId } from "@/store";

const EcosChartNoSSR = dynamic(() => import("./EcosChart").then((m) => m.EcosChart), {
  ssr: false,
});

export function ChartStage({ panelId }: { panelId: PanelId }) {
  return (
    <section className="chart-stage" aria-label="Main chart">
      <EcosChartNoSSR panelId={panelId} />
    </section>
  );
}

