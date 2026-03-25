'use client'

import { useQuery } from "@tanstack/react-query";

export type TemporalKey = "1D" | "1W" | "1M" | "1Y";

export type EcosPoint = { time: string; value: number };
export type EcosSeries = { indicatorId: string; points: EcosPoint[] };

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
  cycleByTemporalKey: Record<TemporalKey, "D" | "M" | "A">;
};

// Phase 3 (per plan): DXY 제외. 현재 UI indicator id 기준 매핑.
const ECOS_INDICATOR_MAPPING: Partial<Record<string, EcosMapping>> = {
  // 원-달러 환율: STAT_CODE=731Y003, ITEM_CODE1=0000003 (종가 15:30)
  "usd-krw": {
    statCode: "731Y003",
    itemCode1: "0000003",
    cycleByTemporalKey: { "1D": "D", "1W": "D", "1M": "D", "1Y": "D" },
  },
  // 외환보유고: STAT_CODE=732Y001, ITEM_CODE1=99(합계)
  // 외환보유고는 해당 STAT_CODE에서 cycle=D는 INFO-200이 뜨고,
  // cycle=M(월별) / cycle=A(연별)일 때만 데이터가 내려옵니다.
  "fx-res": {
    statCode: "732Y001",
    itemCode1: "99",
    cycleByTemporalKey: { "1D": "M", "1W": "M", "1M": "M", "1Y": "A" },
  },
  // KOSPI/KOSDAQ: STAT_CODE=802Y001
  "kospi": {
    statCode: "802Y001",
    itemCode1: "0001000",
    cycleByTemporalKey: { "1D": "D", "1W": "D", "1M": "D", "1Y": "D" },
  },
  "kosdaq": {
    statCode: "802Y001",
    itemCode1: "0089000",
    cycleByTemporalKey: { "1D": "D", "1W": "D", "1M": "D", "1Y": "D" },
  },
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function getKstShiftedDate(now: Date) {
  // Convert "now" into KST by shifting UTC time +09:00.
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
}

function formatStartEnd(temporalKey: TemporalKey) {
  // ECOS는 일부 STAT_CODE 조합에서 cycle=M(월별) / cycle=A(연별)가 INFO-200을 줄 수 있습니다.
  // 따라서 Phase 3에서는 temporalKey를 우선 "일자 범위"로 변환해서 cycle=D로 요청합니다.
  const shifted = getKstShiftedDate(new Date());

  // 데이터 업데이트가 지연될 수 있으므로 "오늘"이 아니라 "어제" 기준으로 end를 잡습니다.
  const endBase = new Date(shifted.getTime());
  endBase.setUTCDate(endBase.getUTCDate() - 1);
  const end = adjustToBusinessDay(endBase);

  const start =
    temporalKey === "1D"
      ? end
      : temporalKey === "1W"
        ? subtractKstDays(end, 6) // inclusive: 1W => 7 calendar days window
        : temporalKey === "1M"
          ? subtractKstMonths(end, 1)
          : subtractKstYears(end, 1);

  return { cycle: "D" as const, start: formatKstYmd(start), end: formatKstYmd(end) };
}

function isWeekendKst(d: Date) {
  // d is already shifted to KST; use UTC weekday.
  const day = d.getUTCDay(); // 0=Sun, 6=Sat
  return day === 0 || day === 6;
}

function formatKstYmd(d: Date) {
  const y = d.getUTCFullYear();
  const m = pad2(d.getUTCMonth() + 1);
  const dd = pad2(d.getUTCDate());
  return `${y}${m}${dd}`;
}

function parseKstYmd(ymd: string) {
  const y = Number(ymd.slice(0, 4));
  const m = Number(ymd.slice(4, 6)) - 1;
  const d = Number(ymd.slice(6, 8));
  return new Date(Date.UTC(y, m, d));
}

function adjustToBusinessDay(d: Date) {
  const x = new Date(d.getTime());
  while (isWeekendKst(x)) {
    x.setUTCDate(x.getUTCDate() - 1);
  }
  return x;
}

function subtractKstDays(d: Date, days: number) {
  const x = new Date(d.getTime());
  x.setUTCDate(x.getUTCDate() - days);
  return x;
}

function subtractKstMonths(d: Date, months: number) {
  const x = new Date(d.getTime());
  x.setUTCMonth(x.getUTCMonth() - months);
  return x;
}

function subtractKstYears(d: Date, years: number) {
  const x = new Date(d.getTime());
  x.setUTCFullYear(x.getUTCFullYear() - years);
  return x;
}

function shiftEndByTemporalKey(temporalKey: TemporalKey, endDate: Date) {
  const x = new Date(endDate.getTime());
  if (temporalKey === "1D") {
    x.setUTCDate(x.getUTCDate() - 1);
  } else if (temporalKey === "1W") {
    x.setUTCDate(x.getUTCDate() - 7);
  } else if (temporalKey === "1M") {
    x.setUTCMonth(x.getUTCMonth() - 1);
  } else {
    x.setUTCFullYear(x.getUTCFullYear() - 1);
  }
  return adjustToBusinessDay(x);
}

function computeWindowForTemporalKey(temporalKey: TemporalKey, endDate: Date) {
  const end = adjustToBusinessDay(endDate);
  const start =
    temporalKey === "1D"
      ? end
      : temporalKey === "1W"
        ? subtractKstDays(end, 6)
        : temporalKey === "1M"
          ? subtractKstMonths(end, 1)
          : subtractKstYears(end, 1);
  return { start: formatKstYmd(start), end: formatKstYmd(end) };
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

  if (isEmpty) return { points: [] as EcosPoint[], isEmpty: true, infoCode };

  const filtered = itemCode1
    ? rows.filter((r) => String(r.ITEM_CODE1 ?? "").trim() === itemCode1.trim())
    : rows;

  const points = filtered
    .map((r) => {
      const time = String(r.TIME ?? "");
      const rawValue = r.DATA_VALUE;
      const value = typeof rawValue === "string" ? Number(rawValue) : typeof rawValue === "number" ? rawValue : NaN;
      if (!time || !Number.isFinite(value)) return null;
      return { time, value } satisfies EcosPoint;
    })
    .filter((p): p is EcosPoint => p !== null)
    .sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));

  return { points, isEmpty: points.length === 0, infoCode };
}

async function fetchIndicatorSeries(params: {
  indicatorId: string;
  temporalKey: TemporalKey;
  statCode: string;
  itemCode1: string;
  initialEnd: string; // YYYYMMDD in KST-cursor space
}) {
  const { indicatorId, temporalKey, statCode, itemCode1, initialEnd } = params;
  const cycle = ECOS_INDICATOR_MAPPING[indicatorId]?.cycleByTemporalKey[temporalKey] ?? "D";

  let attempt = 0;
  let cursorEndDate = parseKstYmd(initialEnd);
  let lastUpstream: EcosUpstream | null = null;

  // ECOS 월/연 데이터는 "현재 달/현재 연"이 아직 반영되지 않는 경우가 있어,
  // 첫 시도부터 직전 기간으로 커서를 당겨 INFO-200 가능성을 줄입니다.
  if (cycle === "M") cursorEndDate = subtractKstMonths(cursorEndDate, 1);
  if (cycle === "A") cursorEndDate = subtractKstYears(cursorEndDate, 1);

  // Phase 3: try the same temporal window by shifting the end backwards.
  while (attempt < MAX_RETRY) {
    let start: string;
    let end: string;

    if (cycle === "D") {
      const window = computeWindowForTemporalKey(temporalKey, cursorEndDate);
      start = window.start;
      end = window.end;
    } else if (cycle === "M") {
      // cycle=M은 YYYYMM
      const y = cursorEndDate.getUTCFullYear();
      const m = pad2(cursorEndDate.getUTCMonth() + 1);
      start = `${y}${m}`;
      end = `${y}${m}`;
    } else {
      // cycle=A는 year
      const y = String(cursorEndDate.getUTCFullYear());
      start = y;
      end = y;
    }

    const url = `/api/ecos?code=${encodeURIComponent(statCode)}&cycle=${encodeURIComponent(cycle)}&start=${encodeURIComponent(
      start,
    )}&end=${encodeURIComponent(end)}&itemCode=${encodeURIComponent(itemCode1)}`;

    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      throw new Error(`ECOS proxy failed (indicator=${indicatorId}, status=${res.status})`);
    }

    const upstream = (await res.json()) as EcosUpstream;
    lastUpstream = upstream;

    const normalized = normalizeStatisticSearch(upstream, itemCode1);
    if (!normalized.isEmpty) {
      return { indicatorId, points: normalized.points } satisfies EcosSeries;
    }

    attempt += 1;
    if (attempt >= MAX_RETRY) break;

    // Fallback 재요청은 "cycle 기준"으로 이전 기간으로 이동합니다.
    if (cycle === "D") {
      cursorEndDate = shiftEndByTemporalKey(temporalKey, cursorEndDate);
    } else if (cycle === "M") {
      cursorEndDate = subtractKstMonths(cursorEndDate, 1);
    } else {
      cursorEndDate = subtractKstYears(cursorEndDate, 1);
    }
  }

  const normalized = lastUpstream ? normalizeStatisticSearch(lastUpstream, itemCode1) : { points: [] as EcosPoint[] };
  return { indicatorId, points: normalized.points } satisfies EcosSeries;
}

export function useEcosQuery(indicatorIds: string[], temporalKey: TemporalKey) {
  const uniqueIds = Array.from(new Set(indicatorIds));
  const stableSortedIds = [...uniqueIds].sort();

  const { end: initialEnd } = formatStartEnd(temporalKey);

  return useQuery({
    queryKey: ["ecosData", stableSortedIds, temporalKey],
    enabled: stableSortedIds.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<EcosSeries[]> => {
      const requested = stableSortedIds;

      const results = await Promise.all(
        requested.map(async (indicatorId) => {
          const mapping = ECOS_INDICATOR_MAPPING[indicatorId];
          if (!mapping) {
            // DXY/adj-rate 등 Phase 3 매핑 대상 밖이면 빈 시리즈로 반환.
            return { indicatorId, points: [] } satisfies EcosSeries;
          }

          return fetchIndicatorSeries({
            indicatorId,
            statCode: mapping.statCode,
            itemCode1: mapping.itemCode1,
            initialEnd,
            temporalKey,
          });
        }),
      );

      return results;
    },
  });
}
