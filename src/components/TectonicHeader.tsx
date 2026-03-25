"use client";

import React, { useEffect, useState } from "react";

function formatKstLikeISO(d: Date) {
  // Reference UI uses "YYYY.MM.DD HH:mm:ss". We keep local time formatting (good enough for UI).
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;
}

export function TectonicHeader() {
  // IMPORTANT:
  // This is a Client Component but Next.js may still pre-render it on the server.
  // If we initialize with `new Date()` the server/client timestamps differ and hydration fails.
  // So we render an empty value on first paint, then populate it in `useEffect` (client-only).
  const [timestamp, setTimestamp] = useState<string>("");

  useEffect(() => {
    const tick = () => setTimestamp(formatKstLikeISO(new Date()));
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <header>
      <div className="brand">
        <h1>KRW-INDEX</h1>
      </div>
      <div className="meta-data">
        LATEST PULL: <span id="timestamp">{timestamp}</span>
        <br />
        SOURCE: REUTERS/BOK/KRX API
      </div>
    </header>
  );
}

