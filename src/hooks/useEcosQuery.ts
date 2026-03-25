'use client'

import { useQuery } from "@tanstack/react-query";

export type TemporalKey = "1D" | "1W" | "1M" | "1Y";

type NormalizedPoint = { time: string; value: number };
type NormalizedIndicatorSeries = { indicatorId: string; points: NormalizedPoint[] };

type EcosUpstream =
  | {
      RESULT?: { CODE?: string; MESSAGE?: string };
      StatisticSearch?: {
        list_total_count?: number;
        row?: Array<Record<string, unknown>>;
      };
    }
  | Record<string, unknown>;

const MAX_RETRY = 5;

type EcosMapping = {
  statCode: string;
  itemCode1: string;
};

// Phase 3 (per plan): DXY 제외. 현재 UI indicator id 기준 매핑.
const ECOS_INDICATOR_MAPPING: Partial<Record<string, EcosMapping>> = {
  // 원-달러 환율: STAT_CODE=731Y003, ITEM_CODE1=0000003 (종가 15:30)
  "usd-krw": { statCode: "731Y003", itemCode1: "0000003" },
  // 외환보유고: STAT_CODE=732Y001, ITEM_CODE1=99(합계)
  "fx-res": { statCode: "732Y001", itemCode1: "99" },
  // KOSPI/KOSDAQ: STAT_CODE=802Y001
  "kospi": { statCode: "802Y001", itemCode1: "0001000" },
  "kosdaq": { statCode: "802Y001", itemCode1: "0089000" },
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function getKstShiftedDate(now: Date) {
  // Convert "now" into KST by shifting UTC time +09:00.
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
}

function formatStartEnd(temporalKey: TemporalKey) {
  const shifted = getKstShiftedDate(new Date());

  if (temporalKey === "1D") {
    const y = shifted.getUTCFullYear();
    const m = pad2(shifted.getUTCMonth() + 1);
    const d = pad2(shifted.getUTCDate());
    const ymd = `${y}${m}${d}`;
    return { cycle: "D" as const, start: ymd, end: ymd };
  }

  if (temporalKey === "1W" || temporalKey === "1M") {
    const y = shifted.getUTCFullYear();
    const ym = `${y}${pad2(shifted.getUTCMonth() + 1)}`;
    return { cycle: "M" as const, start: ym, end: ym };
  }

  // 1Y
  return {
    cycle: "Y" as const,
    start: String(shifted.getUTCFullYear()),
    end: String(shifted.getUTCFullYear()),
  };
}

function isWeekendKst(d: Date) {
  // d is already shifted to KST; use UTC weekday.
  const day = d.getUTCDay(); // 0=Sun, 6=Sat
  return day === 0 || day === 6;
}

function parseCursorDate(cycle: "D" | "M" | "Y", cursor: string) {
  if (cycle === "D") {
    // YYYYMMDD
    const y = Number(cursor.slice(0, 4));
    const m = Number(cursor.slice(4, 6)) - 1;
    const d = Number(cursor.slice(6, 8));
    return new Date(Date.UTC(y, m, d));
  }

  if (cycle === "M") {
    // YYYYMM (use first day of month in cursor space)
    const y = Number(cursor.slice(0, 4));
    const m = Number(cursor.slice(4, 6)) - 1;
    return new Date(Date.UTC(y, m, 1));
  }

  // Y
  const y = Number(cursor);
  return new Date(Date.UTC(y, 0, 1));
}

function formatCursorDate(cycle: "D" | "M" | "Y", cursor: Date) {
  if (cycle === "D") {
    const y = cursor.getUTCFullYear();
    const m = pad2(cursor.getUTCMonth() + 1);
    const d = pad2(cursor.getUTCDate());
    const ymd = `${y}${m}${d}`;
    return { start: ymd, end: ymd };
  }

  if (cycle === "M") {
    const y = cursor.getUTCFullYear();
    const ym = `${y}${pad2(cursor.getUTCMonth() + 1)}`;
    return { start: ym, end: ym };
  }

  return { start: String(cursor.getUTCFullYear()), end: String(cursor.getUTCFullYear()) };
}

function decrementCursorDate(cycle: "D" | "M" | "Y", cursor: Date) {
  if (cycle === "D") {
    // Step back to previous business day (skip weekends).
    do {
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } while (isWeekendKst(cursor));
    return cursor;
  }

  if (cycle === "M") {
    cursor.setUTCMonth(cursor.getUTCMonth() - 1);
    return cursor;
  }

  cursor.setUTCFullYear(cursor.getUTCFullYear() - 1);
  return cursor;
}

function extractInfoCode(upstream: EcosUpstream) {
  // Upstream info-200 looks like:
  // { "RESULT": { "MESSAGE": "...", "CODE": "INFO-200" } }
  const rec = upstream as Record<string, unknown>;
  const result =
    typeof rec["RESULT"] === "object" && rec["RESULT"] !== null
      ? (rec["RESULT"] as Record<string, unknown>)
      : undefined;
  const code = result?.["CODE"];
  return typeof code === "string" ? code : undefined;
}

function normalizeStatisticSearch(upstream: EcosUpstream, itemCode1?: string) {
  const rec = upstream as Record<string, unknown>;
  const search =
    typeof rec["StatisticSearch"] === "object" && rec["StatisticSearch"] !== null
      ? (rec["StatisticSearch"] as Record<string, unknown>)
      : undefined;

  const rows: Array<Record<string, unknown>> = Array.isArray(search?.["row"])
    ? (search?.["row"] as Array<Record<string, unknown>>)
    : [];
  const listTotalCount =
    typeof search?.["list_total_count"] === "number" ? (search?.["list_total_count"] as number) : undefined;

  const infoCode = extractInfoCode(upstream);
  const isEmpty =
    !rows ||
    rows.length === 0 ||
    (typeof listTotalCount === "number" && listTotalCount === 0) ||
    infoCode === "INFO-200";

  if (isEmpty) return { points: [] as NormalizedPoint[], isEmpty: true, infoCode };

  const filtered = itemCode1
    ? rows.filter((r) => String(r.ITEM_CODE1 ?? "").trim() === itemCode1.trim())
    : rows;

  const points = filtered
    .map((r) => {
      const time = String(r.TIME ?? "");
      const rawValue = r.DATA_VALUE;
      const value = typeof rawValue === "string" ? Number(rawValue) : typeof rawValue === "number" ? rawValue : NaN;
      if (!time || !Number.isFinite(value)) return null;
      return { time, value } satisfies NormalizedPoint;
    })
    .filter((p): p is NormalizedPoint => p !== null)
    .sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));

  return { points, isEmpty: points.length === 0, infoCode };
}

async function fetchIndicatorSeries(params: {
  indicatorId: string;
  cycle: "D" | "M" | "Y";
  statCode: string;
  itemCode1: string;
  initialStart: string;
  initialEnd: string;
}) {
  const { indicatorId, cycle, statCode, itemCode1, initialStart, initialEnd } = params;

  let attempt = 0;
  let start = initialStart;
  let end = initialEnd;
  let lastUpstream: EcosUpstream | null = null;
  // Use a KST-cursor space date: year/month/day correspond 1:1 to the input format.
  let cursorDate = parseCursorDate(cycle, initialEnd);

  while (attempt < MAX_RETRY) {
    const url = `/api/ecos?code=${encodeURIComponent(statCode)}&cycle=${encodeURIComponent(
      cycle,
    )}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&itemCode=${encodeURIComponent(itemCode1)}`;

    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      throw new Error(`ECOS proxy failed (indicator=${indicatorId}, status=${res.status})`);
    }
    const upstream = (await res.json()) as EcosUpstream;
    lastUpstream = upstream;

    const normalized = normalizeStatisticSearch(upstream, itemCode1);
    if (!normalized.isEmpty) {
      return { indicatorId, points: normalized.points } satisfies NormalizedIndicatorSeries;
    }

    attempt += 1;
    if (attempt >= MAX_RETRY) break;

    // Fallback: decrement based on the cycle, then retry.
    cursorDate = decrementCursorDate(cycle, cursorDate);
    const fallback = formatCursorDate(cycle, cursorDate);
    start = fallback.start;
    end = fallback.end;
  }

  // Return empty points after exhausting retries.
  const normalized = lastUpstream ? normalizeStatisticSearch(lastUpstream, itemCode1) : { points: [] as NormalizedPoint[] };
  return { indicatorId, points: normalized.points } satisfies NormalizedIndicatorSeries;
}

export function useEcosQuery(indicatorIds: string[], temporalKey: TemporalKey) {
  const uniqueIds = Array.from(new Set(indicatorIds));
  const stableSortedIds = [...uniqueIds].sort();

  const { cycle, start: initialStart, end: initialEnd } = formatStartEnd(temporalKey);

  return useQuery({
    queryKey: ["ecosData", stableSortedIds, temporalKey],
    enabled: stableSortedIds.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<NormalizedIndicatorSeries[]> => {
      const requested = stableSortedIds;

      const results = await Promise.all(
        requested.map(async (indicatorId) => {
          const mapping = ECOS_INDICATOR_MAPPING[indicatorId];
          if (!mapping) {
            // DXY/adj-rate 등 Phase 3 매핑 대상 밖이면 빈 시리즈로 반환.
            return { indicatorId, points: [] } satisfies NormalizedIndicatorSeries;
          }

          return fetchIndicatorSeries({
            indicatorId,
            cycle,
            statCode: mapping.statCode,
            itemCode1: mapping.itemCode1,
            initialStart,
            initialEnd,
          });
        }),
      );

      return results;
    },
  });
}
