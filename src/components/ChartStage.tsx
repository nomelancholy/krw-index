import React from "react";
import { EcosChart } from "./EcosChart";
import type { PanelId } from "@/store";

export function ChartStage({ panelId }: { panelId: PanelId }) {
  return (
    <section className="chart-stage" aria-label="Main chart">
      <EcosChart panelId={panelId} />
    </section>
  );
}

