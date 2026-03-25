🚀 Project: KRW-Index

본 문서는 한국은행 ECOS API와 Supabase를 활용하여 주요 경제 지표를 시각화하는 **Anti-Gravity** 서비스의 통합 개발 지침서입니다.

---

## 1. 프로젝트 개요
* **목적**: 환율, 주가지수 등 주요 경제 지표의 상관관계를 대시보드 형태로 시각화.
* **핵심 기능**: 
    * 지표별 개별/혼합 그래프 출력 (Multi-axis 지원).
    * 기간별(주/월/년) 데이터 필터링.
    * 사용자 정의 보정 환율 계산 로직 적용.
    * 유저별 관심 지표 조합 저장 (Supabase 연동).

---

## 2. 기술 스택 (Tech Stack)
* **Framework**: Next.js 14+ (App Router)
* **Database & Auth**: Supabase (PostgreSQL)
* **Styling**: Tailwind CSS
* **State Management**: Zustand (UI 상태), TanStack Query v5 (Server State)
* **Visualization**: Recharts 또는 ECharts
* **API Source**: 한국은행 경제통계시스템 (ECOS)

---

## 3. 환경 설정 및 참조 파일
* **API Key**: `.env` 파일 내 `ECOS_API_KEY` 변수 사용. (Client-side 노출 금지)
* **공식 가이드**: [ECOS Open API 개발 명세서](https://ecos.bok.or.kr/api/#/DevGuide/DevSpeciflcation)
* **상세 파라미터**: `/api_guide/` 폴더 내 엑셀 명세서 파일 참조.
* **UI Reference**: `reference_ui/index.html` 의 레이아웃 및 클래스 구조 준수.

---

## 4. 데이터 로드 및 백엔드 전략 (Next.js Route Handlers)

브라우저에서의 CORS 에러 및 API Key 유출 방지를 위해 Next.js의 **Route Handlers**를 Proxy로 사용합니다.

### 4.1 API 프록시 구조
**`GET /api/ecos?code=...&start=...&end=...`**
1. 클라이언트(React)가 Next.js 서버 코스로 요청을 보냄.
2. Next.js 서버에서 `.env`의 API Key를 붙여 한국은행 서버에 요청.
3. 결과를 받아 클라이언트에 반환.

### 4.2 주요 통계표 코드 (참조)
| 지표명 | 통계표 코드 | 주기 | 비고 |
| :--- | :--- | :--- | :--- |
| 원-달러 환율 | `036Y001` | D, M, Y | 원/달러(종가) |
| 달러 지수 | `036Y044` | D, M | 주요국 통화 대비 |
| 외환 보유고 | `073Y005` | M | 합계 |
| KOSPI/KOSDAQ | `064Y001` | D, M, Y | 0001000(코스피), 0002000(코스닥) |

---

## 5. 핵심 구현 지침

### 5.1 데이터 시각화 (Charting)
* **Multi-Layer**: 2개 이상의 지표 선택 시 하나의 차트에 렌더링.
* **Y-Axis Dual**: 환율(4자리)과 지수(2~3자리) 등 단위가 다른 데이터는 좌/우 독립된 Y축을 적용할 것.
* **Caching**: TanStack Query를 사용하여 동일 조건의 API 호출은 5분간 캐싱 처리.

### 5.2 Supabase 연동
* **Dashboard Settings**: 유저가 자주 보는 지표 조합(예: 환율 + 코스피)을 테이블에 저장하여 재접속 시 자동 로드.
* **Auth**: 프로젝트 확장 시 소셜 로그인(Google, Github) 연동 고려.

### 5.3 보정 환율 계산 (Utility)
* `src/utils/calculator.ts`: API로 받은 Raw Data를 가공하여 서비스만의 고유한 '보정 환율' 수치를 도출하는 순수 함수 작성.

---

## 6. 프로젝트 구조 (Directory Structure)
```text
anti-gravity/
├── src/
│   ├── app/
│   │   ├── api/ecos/route.ts   # ECOS API Proxy Handler
│   │   └── dashboard/          # 메인 대시보드 페이지
│   ├── components/             # Chart, Indicator Selector, UI Components
│   ├── hooks/                  # useEcosQuery, useSupabaseAuth
│   ├── store/                  # Zustand (현재 선택된 지표 상태 관리)
│   ├── types/                  # ECOS 응답 및 비즈니스 로직 타입 정의
│   └── utils/                  # 날짜 포맷팅, 보정 환율 계산기
├── api_guide/                  # 개발 명세서 엑셀 파일 (.xlsx)
├── reference_ui/               # 기존 HTML/CSS 레퍼런스
└── API_IMPLEMENTATION_GUIDE.md # 본 문서

## 7. 에러 처리 및 예외 상황

- 데이터 부재: 특정 일자에 데이터가 없는 경우(공휴일 등) 직전 영업일 데이터를 사용하거나 차트에서 해당 구간을 Skip 처리함.
- API 제한: INFO-200 등 ECOS 에러 코드 발생 시 사용자에게 "데이터 업데이트 중" 메시지 노출.