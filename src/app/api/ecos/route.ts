import { NextRequest } from "next/server";

const ECOS_BASE_URL = "https://ecos.bok.or.kr/api";

type EcosProxyError = {
  error: string;
  details?: unknown;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const statCode = searchParams.get("code") ?? searchParams.get("stat_code");
  const cycle = searchParams.get("cycle");
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const itemCode = searchParams.get("itemCode") ?? searchParams.get("item_code1");

  if (!statCode || !cycle || !start || !end) {
    return jsonResponse(
      {
        error: "Missing required query parameters",
        details: { required: ["code/stat_code", "cycle", "start", "end"] },
      } satisfies EcosProxyError,
      400,
    );
  }

  const apiKey = process.env.ECOS_API_KEY;
  if (!apiKey) {
    return jsonResponse(
      {
        error: "ECOS_API_KEY is not configured",
      } satisfies EcosProxyError,
      500,
    );
  }

  // ECOS expects item_code1 to exist. If the client doesn't provide it,
  // pass "?" (encoded) to indicate "any".
  const resolvedItemCode =
    itemCode && itemCode.trim().length > 0 ? itemCode.trim() : "?";

  // "Start/End number" are the request range for rows. For our UI use-cases
  // (daily/monthly/yearly), 1000 is a safe upper bound.
  const requestStartNo = "1";
  const requestEndNo = "1000";

  const url = `${ECOS_BASE_URL}/StatisticSearch/${encodeURIComponent(
    apiKey,
  )}/json/kr/${requestStartNo}/${requestEndNo}/${encodeURIComponent(
    statCode,
  )}/${encodeURIComponent(cycle)}/${encodeURIComponent(
    start,
  )}/${encodeURIComponent(end)}/${encodeURIComponent(resolvedItemCode)}`;

  let upstreamJson: unknown;
  try {
    const upstreamRes = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const text = await upstreamRes.text();
    try {
      upstreamJson = JSON.parse(text);
    } catch {
      // If the upstream returns non-JSON, forward as plain payload.
      return jsonResponse(
        {
          error: "Upstream ECOS response is not valid JSON",
          details: { status: upstreamRes.status, payload: text.slice(0, 2000) },
        } satisfies EcosProxyError,
        502,
      );
    }

    if (!upstreamRes.ok) {
      return jsonResponse(
        {
          error: "Upstream ECOS request failed",
          details: { status: upstreamRes.status, payload: upstreamJson },
        } satisfies EcosProxyError,
        502,
      );
    }
  } catch (err) {
    return jsonResponse(
      {
        error: "Failed to call upstream ECOS",
        details: err instanceof Error ? err.message : err,
      } satisfies EcosProxyError,
      502,
    );
  }

  return jsonResponse(upstreamJson, 200);
}

