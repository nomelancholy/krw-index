"use client";

import React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDashboardStore, type PanelId } from "@/store";
import { useEcosQuery, type EcosSeries, type TemporalKey } from "@/hooks/useEcosQuery";

const INDICATOR_META: Record<
  string,
  {
    label: string;
    color: string;
    axis: "left" | "right";
  }
> = {
  "usd-krw": { label: "USD/KRW", color: "#ff4d00", axis: "left" },
  "fx-res": { label: "FX Reserves", color: "#00f2ff", axis: "right" },
  kospi: { label: "KOSPI", color: "#ff00f2", axis: "right" },
  kosdaq: { label: "KOSDAQ", color: "#ffffff", axis: "right" },
};

function formatTimeLabel(t: string) {
  if (t.length === 8) return `${t.slice(4, 6)}/${t.slice(6, 8)}`;
  if (t.length === 6) return `${t.slice(0, 4)}/${t.slice(4, 6)}`;
  return t;
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return String(value);
  const isInt = Number.isInteger(value);
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: isInt ? 0 : 2,
  }).format(value);
}

function getUnionTimes(seriesList: EcosSeries[]) {
  const all = new Set<string>();
  for (const s of seriesList) for (const p of s.points) all.add(p.time);
  return Array.from(all).sort();
}

function buildChartData(seriesList: EcosSeries[], indicatorIds: string[], forwardFillIds: Set<string>) {
  const valueMaps = new Map<string, Map<string, number>>();
  for (const s of seriesList) {
    const m = new Map<string, number>();
    for (const p of s.points) m.set(p.time, p.value);
    valueMaps.set(s.indicatorId, m);
  }

  const times = getUnionTimes(seriesList);

  // forward-fill only for very sparse series (fx-res).
  const lastKnown = new Map<string, number>();
  return times.map((time) => {
    const row: Record<string, unknown> = { time };

    for (const id of indicatorIds) {
      const v = valueMaps.get(id)?.get(time);
      if (typeof v === "number" && Number.isFinite(v)) {
        row[id] = v;
        if (forwardFillIds.has(id)) lastKnown.set(id, v);
      } else if (forwardFillIds.has(id) && typeof lastKnown.get(id) === "number") {
        row[id] = lastKnown.get(id)!;
      }
    }

    return row;
  });
}

function roundUpToStep(value: number, step: number) {
  if (!Number.isFinite(value)) return value;
  return Math.ceil(value / step) * step;
}

export function EcosChart({ panelId }: { panelId: PanelId }) {
  const selectedIndicators = useDashboardStore((s) => (panelId === 1 ? s.selectedIndicators1 : s.selectedIndicators2));
  const temporalKey = useDashboardStore((s) => (panelId === 1 ? s.temporalKey1 : s.temporalKey2));

  const visibleIndicatorIds = selectedIndicators.filter((id) => id in INDICATOR_META);
  const { data, isLoading, isError, error } = useEcosQuery(visibleIndicatorIds, temporalKey as TemporalKey);
  const seriesList = data ?? [];

  const hasAnyPoint = seriesList.some((s) => s.points.length > 0);
  if (isLoading) {
    return (
      <div className="chart-placeholder">
        <div className="chart-placeholder__title">Loading ECOS data...</div>
        <div className="chart-placeholder__subtitle">Temporal: {temporalKey}</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="chart-placeholder">
        <div className="chart-placeholder__title">ECOS fetch failed</div>
        <div className="chart-placeholder__subtitle">
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
      </div>
    );
  }

  if (!hasAnyPoint) {
    return (
      <div className="chart-placeholder">
        <div className="chart-placeholder__title">No data returned</div>
        <div className="chart-placeholder__subtitle">Temporal: {temporalKey}. Try a different selection.</div>
      </div>
    );
  }

  const indicatorIdsByAxis = {
    left: visibleIndicatorIds.filter((id) => INDICATOR_META[id]?.axis === "left"),
    right: visibleIndicatorIds.filter((id) => INDICATOR_META[id]?.axis === "right"),
  };

  const chartData = buildChartData(seriesList, visibleIndicatorIds, new Set<string>(["fx-res"]));

  const leftMin = indicatorIdsByAxis.left.includes("usd-krw") ? 800 : undefined;

  // right axis minimum: if KOSPI/KOSDAQ selected -> 2000, else if only fx-res -> 1000
  const hasKosdaq = indicatorIdsByAxis.right.includes("kosdaq");
  const hasKospi = indicatorIdsByAxis.right.includes("kospi");

  const rightMin = hasKosdaq ? 600 : hasKospi ? 2000 : indicatorIdsByAxis.right.includes("fx-res") ? 1000 : undefined;

  const tickCount = Math.min(6, chartData.length || 0);

  const chartHeight = "clamp(320px, 45vh, 500px)";

  return (
    <div style={{ height: chartHeight, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" />
          <XAxis
            dataKey="time"
            tick={{ fill: "#8884d8", fontFamily: "JetBrains Mono, monospace" }}
            tickFormatter={(v) => formatTimeLabel(String(v))}
            interval="preserveStartEnd"
            tickLine={false}
            minTickGap={20}
            tickCount={tickCount > 0 ? tickCount : undefined}
          />

          <YAxis
            yAxisId="left"
            orientation="left"
            domain={
              leftMin !== undefined
                ? [leftMin, (dataMax: number) => (Number.isFinite(dataMax) ? roundUpToStep(dataMax, 100) : "auto")]
                : undefined
            }
            tick={{ fill: "#8884d8", fontFamily: "JetBrains Mono, monospace" }}
            tickFormatter={(v) => formatNumber(Number(v))}
            width={70}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={
              rightMin !== undefined
                ? [
                    rightMin,
                    (dataMax: number) => (Number.isFinite(dataMax) ? roundUpToStep(dataMax, 100) : "auto"),
                  ]
                : undefined
            }
            tick={{ fill: "#8884d8", fontFamily: "JetBrains Mono, monospace" }}
            tickFormatter={(v) => formatNumber(Number(v))}
            allowDecimals={false}
            width={70}
          />

          <Tooltip
            contentStyle={{
              background: "rgba(0,0,0,0.7)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6,
            }}
            labelStyle={{ fontFamily: "JetBrains Mono, monospace" }}
            formatter={(value, name) => [formatNumber(Number(value)), name]}
          />

          {visibleIndicatorIds
            .filter((id) => INDICATOR_META[id]?.axis === "left")
            .map((id) => {
              const meta = INDICATOR_META[id];
              const series = seriesList.find((s) => s.indicatorId === id);
              if (!meta || !series || series.points.length === 0) return null;
              return (
                <Line
                  key={id}
                  type="monotone"
                  dataKey={id}
                  yAxisId="left"
                  name={meta.label}
                  stroke={meta.color}
                  strokeWidth={2}
                  dot={false}
                />
              );
            })}

          {visibleIndicatorIds
            .filter((id) => INDICATOR_META[id]?.axis === "right")
            .map((id) => {
              const meta = INDICATOR_META[id];
              const series = seriesList.find((s) => s.indicatorId === id);
              if (!meta || !series || series.points.length === 0) return null;
              return (
                <Line
                  key={id}
                  type="monotone"
                  dataKey={id}
                  yAxisId="right"
                  name={meta.label}
                  stroke={meta.color}
                  strokeWidth={2}
                  dot={false}
                />
              );
            })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

