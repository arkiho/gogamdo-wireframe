# 인사이트 자동 생성 시스템 구현 계획

## 현재 상태
- `insight_articles` 테이블 이미 존재 (schema.ts 887행)
- `insight.aiGenerate` 프로시저 이미 존재 (routers.ts 2110행) — LLM + 이미지 생성
- `AdminInsights.tsx` 관리자 페이지 존재 — AI 생성 버튼, 초안/발행/보관 상태 관리
- 공개 인사이트 페이지 존재 (`Insights.tsx`, `InsightDetail.tsx`)

## 구현 방식: AGENT cron
- 트렌드 리서치(웹 브라우징) 필요 → AGENT cron이 적합
- AGENT cron이 트렌드를 조사한 후 사이트 API를 curl로 호출

## 필요한 작업

### 1. §5c 패치 적용 (cron 인증)
- `server/_core/types/manusTypes.ts` (62행): `taskUid?: string | null` 추가
- `server/_core/sdk.ts` (259행): cron 단축 경로 추가 + AuthenticatedUser 타입

### 2. 콜백 핸들러 추가
- `server/_core/index.ts` (104행 근처, tRPC 전에): 
  ```
  app.post("/api/scheduled/generateInsight", generateInsightHandler);
  ```
- 핸들러: sdk.authenticateRequest → isCron 확인 → aiGenerate 로직 호출

### 3. SEO/AEO/GEO 프롬프트 강화
- 기존 프롬프트에 키워드 전략, 메타 디스크립션, 구조화 데이터 추가
- 타겟: 스타트업 대표, 총무팀, 시설관리팀, 기업이전 수요기업
- 목적: 리드 생성

### 4. 배포 후 AGENT cron 등록
- 화요일/금요일 KST 09:00 = UTC 00:00
- 6-field cron: `0 0 0 * * 2,5` (화,금 UTC 00:00)
- manus-heartbeat CLI 또는 manus-config schedule로 등록

## 핵심 파일 위치
- server/_core/index.ts: 라우트 등록 (104행 근처)
- server/_core/sdk.ts: authenticateRequest (259행)
- server/_core/types/manusTypes.ts: GetUserInfoWithJwtResponse (62행)
- server/_core/heartbeat.ts: SDK 함수들
- server/routers.ts: insight.aiGenerate (2110행)
- drizzle/schema.ts: insightArticles (887행)

## AGENT cron 프롬프트 방향
- 인테리어 업계 최신 트렌드 리서치
- 고객 관점 유용한 콘텐츠 (비용 가이드, 공간 최적화 팁, 트렌드 분석)
- SEO 키워드: 사무실 인테리어, 오피스 리모델링, 사무공간 설계 등
- curl로 /api/scheduled/generateInsight POST 호출
