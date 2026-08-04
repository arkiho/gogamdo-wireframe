# 홈페이지 최적화 측정·검증 보고서

- 측정·구현일: 2026-08-04 KST
- 저장소: `gogamdo-homepage-release`
- 브랜치: `feature/homepage-office-positioning`
- 운영 URL: <https://www.kokamdo.co.kr/>
- 기준: 운영 배포본 vs 현재 local production candidate
- 배포 상태: **미배포** — commit, push, Railway 배포, DNS, 운영 DB 변경 없음

## 1. 결론

운영 홈페이지의 주 병목은 서버 TTFB가 아니라 모바일 초기 payload와 main-thread 작업이었다. 운영 페이지는 약 4.9 MB Hero MP4, 757 KB Hero JPEG, Manus runtime이 포함된 큰 HTML, 홈에서 사용하지 않는 charts/UI preload, 전역 Kakao SDK, `max-age=0` 정적 자산을 초기 경로에 포함했다.

현재 local candidate는 이미 MP4/JPEG Hero를 74 KB/177 KB WebP로 교체한 상태였고, 이번 작업에서 다음 저위험·고효과 항목을 추가 최적화했다.

1. route 전용 charts/UI를 전역 manual chunk preload에서 제거
2. Kakao SDK를 공유 기능 사용 route에서만 비동기 로드
3. fingerprinted JS/CSS에 1년 immutable cache 적용
4. Home Hero preload를 `/` route에만 유지
5. 모바일/데스크톱 Hero preload media를 `767px/768px` 경계로 분리해 이중 다운로드 방지
6. 네이버 블로그 링크의 visible label과 accessible name 불일치 제거

## 2. 운영 기준선

### HTTP

- 10회 root 측정 warm TTFB 중앙값: **243 ms**
- p90 TTFB: **279 ms**
- cold/worst 관측: **1.151 s**
- HTTP/2: 적용
- gzip: 적용
- fingerprinted JS/CSS cache: `public, max-age=0`
- `https://kokamdo.co.kr/`와 `https://www.kokamdo.co.kr/`: 둘 다 200
- canonical: apex `https://kokamdo.co.kr`

서버 응답은 개선 여지가 있으나 모바일 10초대 LCP의 주원인은 아니었다.

### Lighthouse 13, 3회 중앙값

| 지표 | 운영 mobile | local candidate mobile | 변화 |
|---|---:|---:|---:|
| Performance | 44 | 77 | +33점 |
| FCP | 5.24 s | 3.33 s | -36.4% |
| LCP | 10.87 s | 4.25 s | **-60.9%** |
| TBT | 587 ms | 284 ms | **-51.6%** |
| CLS | 0.016 | 0.016 | 유지 |
| 전송량 | 6.32 MB | 0.38 MB | **-94.0%** |
| 요청 수 | 28 | 14 | -50.0% |
| Accessibility | 77 | 100 | +23점 |

| 지표 | 운영 desktop | local candidate desktop | 변화 |
|---|---:|---:|---:|
| Performance | 83 | 98 | +15점 |
| FCP | 1.51 s | 0.72 s | -52.5% |
| LCP | 2.05 s | 1.01 s | **-50.6%** |
| TBT | 36 ms | 0 ms | -100% |
| CLS | 0.006 | 0.006 | 유지 |
| 전송량 | 6.37 MB | 0.48 MB | **-92.4%** |
| 요청 수 | 28 | 18 | -35.7% |

마지막 단독 mobile smoke에서는 Performance 78, FCP 3.3 s, LCP 4.3 s, TBT 120 ms, 전송량 373 KiB, Accessibility 100을 관측했다. Lighthouse 점수는 CPU·네트워크 상태에 따라 흔들리므로 공식 비교값은 3회 중앙값을 사용한다.

## 3. 병목 분류

### 실제 운영 P0

- Hero MP4: 약 **4.9 MB**
- Hero JPEG: 약 **757 KB**
- Manus runtime: 원본 HTML 약 378 KB 중 약 367 KB
- charts chunk: gzip 약 **176 KB**, 홈에서 대부분 미사용
- Kakao SDK: gzip 약 **28.5 KB**, 모든 route에서 초기 로드
- fingerprinted assets: `max-age=0`, 재방문마다 network revalidation

### local candidate에서 이번에 개선한 초기 graph

- 변경 전 초기 JS/CSS gzip: **416,491 bytes**
- 변경 후 초기 JS/CSS gzip: **222,316 bytes**
- 감소: **194,175 bytes, 46.6%**
- 초기 charts preload: 제거
- 초기 Kakao SDK: 제거
- 초기 asset 수: main JS + vendor JS + CSS 3개

## 4. 구현 내용

### Bundle

- `client/src/config/buildPolicy.ts`
- `vite.config.ts`

production manual chunk는 React vendor만 고정하고 charts/UI/motion을 전역 preload하지 않는다. route-only 모듈은 lazy route 경계에 남는다.

### Kakao SDK

- `client/index.html`
- `client/src/hooks/useKakaoShare.ts`

전역 동기 script를 제거했다. Kakao 공유 component가 실제 mount되고 public integration key가 존재할 때만 Promise 기반으로 async script를 한 번 로드한다. 중복 mount는 같은 Promise를 공유하고 load 실패 후 재시도할 수 있다.

### Cache

- `server/_core/staticCachePolicy.ts`
- `server/_core/vite.ts`

정책:

```text
/assets/*  public, max-age=31536000, immutable
/images/*  public, max-age=86400, stale-while-revalidate=604800
기타        public, max-age=0, must-revalidate
```

fingerprinted assets만 immutable이며, 고정 URL public image와 HTML은 변경 반영 가능성을 유지한다. Railway edge gzip은 운영에서 이미 확인됐으므로 app-level compression을 중복 도입하지 않았다.

### Home Hero preload

- `client/index.html`
- `server/_core/vite.ts`
- `server/homepage-preload-policy.test.ts`

두 preload를 mutually exclusive media로 분리했다.

```text
mobile:  (max-width: 767px) → office-hero-mobile.webp
 desktop: (min-width: 768px) → office-hero.webp
```

production Express HTML 주입은 `/`에서만 두 preload를 유지하고, 다른 public route, auth/admin/private route, 404/noindex route에서는 제거한다.

### 접근성

네이버 블로그 link의 강제 `aria-label`을 제거해 보이는 텍스트와 브라우저가 계산하는 accessible name을 동일하게 만들었다. Lighthouse `label-content-name-mismatch`는 최종 smoke에서 0건이었다.

## 5. 검증

### 최종 자동 검증

- Vitest test files: **98/98 PASS**
- Vitest tests: **1,215/1,215 PASS**
- focused performance/SEO contracts: **30/30 PASS**
- TypeScript `pnpm check`: **PASS**
- production build: **PASS**
- `git diff --check`: **PASS**
- SEO hydration/Express/Chrome QA: **PASS**
- unexpected dynamic API requests: **0**
- footer desktop/mobile interaction QA: **PASS**
- mobile touch targets: **44 px PASS**
- final Lighthouse Accessibility: **100**
- final label-content-name mismatch: **0**
- independent final re-review: **PASS, blocker 0**

### local Lighthouse artifact

Vite preview는 backend와 production `robots.txt`를 제공하지 않으므로 다음 두 항목은 local-only artifact다.

- `/api/trpc/portfolio.published`가 SPA HTML을 반환해 console JSON parse error
- `/robots.txt`가 SPA HTML을 반환해 SEO 92

실제 Express SEO/hydration QA는 통과했고 운영 Lighthouse SEO는 100이었다.

## 6. 보안·운영 경계

다음 항목은 변경하지 않았다.

- OAuth/JWT/session/account-state 경계
- storage authorization 및 unknown-prefix fail-closed 404
- public published-only DB access
- migration runner, checksum, advisory lock, startup DDL 금지
- Railway 운영 DB·Volume·backup
- GCP billing/API/Cloud SQL/PITR
- production domain/DNS

commit, push, production deployment는 실행하지 않았다.

## 7. 남은 후속 후보

### 배포 전 별도 결정

1. apex/www 한쪽으로 301 통일
2. commit/push가 Railway 자동배포를 유발하는지 확인
3. 승인 후 staging/production 배포
4. 배포 직후 production Lighthouse 3회와 cache header 재측정

### 후속 최적화

1. below-the-fold 이미지 `loading="lazy"`, `decoding="async"`, dimensions 계약 확대
2. Streamdown/Shiki/KaTeX 언어·테마 범위 축소
3. PDF/XLSX 라이브러리를 사용자 action 시점까지 지연
4. 외부 font self-hosting 또는 weight 축소 실험
5. service worker API cache allowlist와 비해시 이미지 갱신 정책 정리
6. production Brotli 가능 여부 확인

이 항목들은 공개 콘텐츠 호환성, 파일 다운로드, PWA cache, typography에 영향을 줄 수 있어 이번 저위험 slice에는 포함하지 않았다.

## 8. 알려진 warning

- pnpm 10.4.1이 `package.json`의 `pnpm.patchedDependencies`와 `pnpm.overrides`를 읽지 않는 warning
- 일부 lazy route chunk가 500 KB를 넘는 build warning

둘 다 이번 homepage 초기 경로 최적화를 막지는 않았지만 별도 dependency/build hygiene 작업이 필요하다.
