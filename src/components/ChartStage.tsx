import React from "react";

export function ChartStage() {
  return (
    <section className="chart-stage" aria-label="Main chart">
      {/* Phase 4에서 Recharts/ECharts로 실제 차트 렌더링 예정 */}
      <div className="chart-placeholder">
        <div className="chart-placeholder__title">Main Chart</div>
        <div className="chart-placeholder__subtitle">Chart rendering will be wired in Phase 4</div>
      </div>
      {/* Phase 4에서 차트 컴포넌트를 이 영역에 연결 */}
      <div id="mainChart" className="chart-stage__canvas-spacer" />
    </section>
  );
}

