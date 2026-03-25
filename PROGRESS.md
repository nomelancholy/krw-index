# 진행 상황 (Progress Tracker)

## Phase 1: 개발 환경 세팅 (Project Setup)
- [x] Next.js 14 (App Router) 프로젝트 초기화
- [x] Tailwind CSS, Zustand, TanStack Query 패키지 설치 및 설정
- [x] Chart 라이브러리 (Recharts 또는 ECharts) 설치
- [x] `PROJECT_SPEC.md`에 정의된 디렉토리 구조 생성 (`src/components`, `src/hooks`, `src/store`, 등)
- [x] 환경 변수(`.env`) 설정 (ECOS API Key 등)

## Phase 2: UI 퍼블리싱 및 구조화 (UI & Layout)
- [x] `reference_ui/index.html` 기반으로 글로벌 스타일 (`index.css` 등) 이식
- [x] 메인 레이아웃 컴포넌트 개발 (Sidebar, Header, Main Display)
- [x] Tectonic 디자인 시스템에 맞춘 상태 표시 컴포넌트 (Fragment Card 등) 개발
- [x] 기간 선택 (1D, 1W, 1M, 1Y) 및 지표 선택 (Checkbox) UI 구성

## Phase 3: BOK ECOS API 연동 (API Integration)
- [ ] Next.js Route Handlers (`src/app/api/ecos/route.ts`) 프록시 서버 구현
- [ ] BOK ECOS 통계표 코드 매핑 (환율, DXY, 외환보유고, KOSPI/KOSDAQ)
- [ ] TanStack Query를 활용한 `useEcosQuery` 커스텀 훅 개발 (5분 캐싱 적용)
- [ ] 데이터 부재 시 직전 영업일 데이터 fallback 처리 로직 구현

## Phase 4: 데이터 시각화 (Charting)
- [ ] Chart 컴포넌트를 생성하고 선택된 지표에 맞춰 Multi-Layer 그래프 렌더링
- [ ] 환율(4자리)과 지수(2~3자리) 등 단위가 다른 데이터를 위한 Dual Y-Axis 설계
- [ ] Zustand와 연동하여 체크박스에 따른 동적 차트 업데이트
- [ ] 기간 필터링(Temporal Resolution) 상태에 따른 차트 데이터 재호출

## Phase 5: 비즈니스 로직 및 유틸리티 (Business Logic)
- [ ] `src/utils/calculator.ts` 로직 구현 (자체 보정 환율 계산기)
- [ ] 차트 툴팁, 데이터 증감률(Delta)에 대한 포맷팅 유틸리티 함수 생성
- [ ] INFO-200 등 API 에러 시나리오에 대한 예외 처리 및 토스트 메시지 구현

## Phase 6: Supabase 연동 및 유저 설정 저장 (Database & Auth)
- [ ] Supabase 프로젝트 생성 및 Database Schema 모델링
- [ ] (선택) 소셜 유저 로그인 기능 연동 (Google, Github 등)
- [ ] 유저별 대시보드 커스텀 세팅 (선택된 지표 조합) 저장 및 로드 기능 구현
