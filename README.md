## KRW-INDEX

두 패널(상/하)로 구성된 KRW 인덱스 대시보드입니다. 각 패널은
`SELECT DATA LAYERS` / `TEMPORAL RESOLUTION` / `GRAPH`가 한 쌍으로 동작하며, BOK ECOS(Open API) 데이터를 서버 프록시로 가져와 Recharts로 시각화합니다.

### 핵심 기능
- `src/app/api/ecos/route.ts`: 브라우저에서 ECOS를 직접 호출하지 않고, 서버에서만 `ECOS_API_KEY`로 `StatisticSearch`를 프록시 호출
- `src/hooks/useEcosQuery.ts`: 선택 지표/기간에 따라 ECOS 시계열을 가져오고 TanStack Query 캐시(`staleTime: 5분`) 적용
- 데이터가 비거나(`rows`/`list_total_count`) `INFO-200`이면 직전 기간으로 폴백 재요청(최대 5회)
- `src/components/EcosChart.tsx`: 패널별 dual Y-axis(LineChart) 렌더링
  - `usd-krw`는 left axis
  - `fx-res(외환보유고)`, `kospi`, `kosdaq`은 right axis
  - `fx-res`는 ECOS 응답 단위가 다르므로 차트용으로 값 스케일(/100000) 후 `억` 단위로 표기
- `src/store/index.ts`: 패널 1/2 각각 독립적인 `selectedIndicators1/2`, `temporalKey1/2` 상태 관리
- `src/app/page.tsx` + `src/app/globals.css`: 상/하 두 쌍 레이아웃 구성(모바일에서는 세로 스택)

### 준비물 (.env)
- 프로젝트 루트에 `.env`를 두고 `ECOS_API_KEY`를 설정합니다.

### 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:3000` 접속 후 패널별로 지표와 기간을 선택하면 차트를 확인할 수 있습니다.

### 참고(ECOS 관련 동작)
- ECOS `StatisticSearch`는 지표별로 `stat_code`, `item_code1`, `cycle(D/M/A)` 조합이 달라서 `src/hooks/useEcosQuery.ts`의 `ECOS_INDICATOR_MAPPING`으로 매핑합니다.
- 월/연 데이터가 아직 반영되지 않은 케이스가 있어, 요청 커서를 첫 시도부터 한 기간 당겨 INFO-200 가능성을 낮추도록 구성되어 있습니다.

### 주요 파일
- `src/app/api/ecos/route.ts`
- `src/hooks/useEcosQuery.ts`
- `src/store/index.ts`
- `src/components/EcosChart.tsx`
- `src/app/page.tsx`

## 참여 방법

1. 저장소를 로컬로 받습니다.
```bash
git clone <your-repo-url>
cd krw-index
```
2. `.env`를 준비합니다.
```bash
cp .env.example .env
# (또는 프로젝트 루트에 ECOS_API_KEY를 직접 추가)
```
3. 의존성을 설치하고 실행합니다.
```bash
npm install
npm run dev
```

## 기여 가이드

- `ECOS_INDICATOR_MAPPING`을 수정하면 `useEcosQuery`에서 데이터 조회 cycle/커서 폴백 로직도 함께 검토해야 합니다.
- 차트 레이어링/스케일 관련 변경은 반드시 `src/components/EcosChart.tsx`에서 left/right axis 포맷과 도메인 계산을 함께 점검해 주세요.
- PR 전에 `npm run lint`와 `npm run build`를 실행해 빌드/린트 오류가 없는지 확인하는 것을 권장합니다.
