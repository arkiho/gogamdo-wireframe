# SEO/AEO 노출 극대화 작업 지시서

## 프로젝트
- 경로: `~/Workspace/gogamdo-website`
- 도메인: kokamdo.co.kr
- 기술: React + Vite + Express + tRPC + MySQL (Railway)
- 배포: `railway up`

## 목표
고감도 홈페이지가 구글, 네이버, AI 답변엔진(ChatGPT, Perplexity, 구글 AI Overview), 소셜 미디어에서 지속적으로 노출되게 만들기.

## 현재 상태 (이미 완료)
- ✅ 페이지별 메타태그 (SEOHead + 서버 주입)
- ✅ 구조화 데이터: LocalBusiness, Organization, Service, FAQPage, Article, BreadcrumbList
- ✅ 동적 sitemap.xml + robots.txt
- ✅ OG/Twitter 카드
- ✅ 인사이트 자동 생성 시스템 (LLM)
- ✅ FAQ 16개 + FAQPage 스키마
- ✅ 분석 코드 준비 (GA4, Clarity, FB Pixel, 네이버) — ID 미설정

---

## 작업 내용

### 1단계: 검색엔진 등록
1. **구글 서치 콘솔** — `client/index.html`에 인증 메타태그 추가, sitemap 제출
2. **네이버 서치 어드바이저** — 인증 메타태그 추가, sitemap 제출
3. **분석 도구 ID 설정** — GA4, Clarity 등 ID 발급 안내 + `.env` 설정

### 2단계: AEO 강화
1. **HowTo 스키마** — `HowWeWork.tsx`에 인테리어 프로세스 8단계 HowTo 마크업
2. **FAQ 확장** — `FAQ.tsx` 16개 → 30개+, 카테고리 추가 (데이터기반설계, 리모델링, 산업시설)
3. **포트폴리오 구조화 데이터** — `PortfolioDbDetail.tsx`에 CreativeWork + ImageGallery 스키마

### 3단계: 지역 SEO
1. **지역 키워드 랜딩 페이지** — "서울 사무실 인테리어" 등 주요 키워드별 전용 페이지
2. **구글 비즈니스 프로필** 등록 안내

### 4단계: 콘텐츠 자동화
1. **인사이트 자동 발행** — draft → published 자동 전환
2. **내부 링크 강화** — 인사이트↔포트폴리오 상호 추천

### 5단계: 소셜/공유
1. **카카오톡 공유 최적화** — 페이지별 공유 메타데이터
2. **네이버 블로그 연동** 가이드

## 핵심 파일
| 파일 | 역할 |
|------|------|
| `client/index.html` | 인증 메타태그, 구조화 데이터 |
| `client/src/components/SEOHead.tsx` | 페이지별 메타태그 |
| `client/src/pages/HowWeWork.tsx` | HowTo 스키마 대상 |
| `client/src/pages/FAQ.tsx` | FAQ 확장 대상 |
| `client/src/pages/PortfolioDbDetail.tsx` | 포트폴리오 스키마 대상 |
| `server/routers/sitemap.ts` | sitemap 관리 |
| `server/_core/vite.ts` | 서버 메타 주입 (ROUTE_META) |
| `client/src/lib/analytics.ts` | 분석 도구 통합 |
| `client/src/App.tsx` | 라우트 등록 |

## 검증 방법
- 구글 리치 결과 테스트: https://search.google.com/test/rich-results
- 구조화 데이터 검증: https://validator.schema.org
- 카카오 공유 디버거: https://developers.kakao.com/tool/debugger/sharing
- sitemap 확인: https://kokamdo.co.kr/sitemap.xml

## 배포
```bash
cd ~/Workspace/gogamdo-website
git add -A && git commit -m "feat: SEO/AEO 강화" && git push origin main
railway up
```

## 환경변수 (사용자가 발급 후 설정)
```
VITE_GA4_MEASUREMENT_ID=
VITE_CLARITY_PROJECT_ID=
VITE_NAVER_ANALYTICS_ID=
VITE_FB_PIXEL_ID=
VITE_GOOGLE_ADS_ID=
```
