"use client";

import React from "react";
import { FragmentCard, type FragmentDelta } from "@/components/FragmentCard";

const FRAGMENTS: Array<{
  label: string;
  value: string;
  delta: FragmentDelta;
  accentBorderRight?: boolean;
}> = [
  {
    label: "USD/KRW",
    value: "1,342.50",
    delta: { label: "-0.42%", variant: "down" },
  },
  {
    label: "DXY",
    value: "106.24",
    delta: { label: "+0.12%", variant: "up" },
  },
  {
    label: "KOSPI",
    value: "2,415.60",
    delta: { label: "-1.24%", variant: "down" },
  },
  {
    label: "ADJ. EXCHANGE",
    value: "1,310.12",
    delta: { label: "NEUTRAL", variant: "neutral" },
    accentBorderRight: true,
  },
];

export function FragmentsGrid() {
  return (
    <section className="data-fragments" aria-label="Data fragments">
      {FRAGMENTS.map((f) => (
        <FragmentCard key={f.label} {...f} />
      ))}
    </section>
  );
}

