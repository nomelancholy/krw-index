import React from "react";

export type FragmentDelta = {
  label: string;
  variant: "up" | "down" | "neutral";
};

export function FragmentCard({
  label,
  value,
  delta,
  accentBorderRight,
}: {
  label: string;
  value: string;
  delta: FragmentDelta;
  accentBorderRight?: boolean;
}) {
  return (
    <div
      className={`fragment-card ${accentBorderRight ? "fragment-card--accent-border-right" : ""}`}
    >
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      <div className={`delta ${delta.variant}`}>{delta.label}</div>
    </div>
  );
}

