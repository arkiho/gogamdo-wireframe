# HANDOFF — 고감도 프로젝트 인수인계

> 작성일: 2026-07-17 | 작성: Claude Code CLI 세션에서 조사 결과

---

## 1. 고객 사례(포트폴리오) 데이터 유실 — 최우선

### 현재 상태
- **`portfolio.published` API 응답: 빈 배열 `[]`** — 확인됨 (curl로 직접 조회)
- sitemap.xml에 `/portfolio/p/` 경로 0건 — 확인됨
- 관리자 페이지에서도 "포트폴리오가 없습니다" 표시

### 데이터가 비워진 시점 특정
이 프로젝트는 **마누스에서 코드만 GitHub로 옮기고 Railway에 새 MySQL DB를 만들어 배포**한 것. 따라서:

- **원래 마누스의 MySQL DB에 있던 데이터는 Railway로 마이그레이션된 적이 없음**
- Railway MySQL은 처음부터 빈 DB였고, 커밋 `560be53` (2026-07-15)에서 `CREATE TABLE IF NOT EXISTS`로 빈 테이블만 생성
- drizzle 마이그레이션 파일(0000~0012)에 DROP/TRUNCATE/DELETE 문은 없음 — 파괴적 마이그레이션은 발생하지 않았음
- **결론: 데이터가 "삭제"된 것이 아니라, 애초에 Railway DB에 이관된 적이 없음. 원본 데이터는 마누스 호스팅의 MySQL에 존재.**

### Railway DB 백업/스냅샷
- Railway CLI에서 확인한 결과, 이 MySQL 서비스에는 **기존 데이터 백업이 없음** (빈 DB로 시작)
- Railway 무료/Hobby 플랜은 자동 백업 미제공. Pro 플랜에서 수동 스냅샷 가능하나 설정된 적 없음
- **Railway 백업 복원으로는 데이터 복구 불가** — 처음부터 비었으므로

### 복구 방안
1. **마누스 원본 DB에서 데이터 덤프** (최선책)
   - 마누스에서 프로젝트가 아직 남아있다면 마누스 채팅에서 "portfolioDrafts, draftImages 테이블 전체를 SQL INSERT 문으로 내보내줘" 요청
   - 또는 마누스 관리자 대시보드에서 DB 덤프 가능 여부 확인
   - 받은 SQL을 Railway MySQL에 import

2. **마누스 Forge 스토리지 이미지 확인** (차선책)
   - `server/storage.ts`를 보면 이미지는 `BUILT_IN_FORGE_API_URL`의 마누스 Forge 프록시에 저장됨
   - DB의 `draftImages.originalUrl` 필드에 `files.manuscdn.com/...` 형태의 URL이 저장되어 있었을 것
   - 이미지 파일 자체는 마누스 스토리지에 남아있을 **가능성 있음**
   - 하지만 `BUILT_IN_FORGE_API_URL`/`BUILT_IN_FORGE_API_KEY`가 Railway 환경변수에 **설정되어 있지 않음** → 마누스에서 값을 가져와야 함
   - 이미지 URL만 알면 DB 행 재구성은 수동으로 가능하나, 제목/설명/카테고리 등 메타데이터는 DB에서만 복구 가능

3. **사용자(대표)에게 직접 재입력 요청** (최후 수단)
   - 포트폴리오 사진과 정보를 관리자 페이지에서 새로 등록

### `client/src/lib/images.ts`의 하드코딩 데이터
- 6개 프로젝트(허시드, LAB543, 페이퍼랩 등)가 정적으로 정의되어 있으나, 이는 프론트엔드 폴백/샘플용
- 실제 DB 데이터와 무관하며 복구 대상 아님

---

## 2. DB 현황

### 연결 정보
- **Railway 프로젝트**: `kokamdo-website` (ID: `affa7e1a-8f5a-47f1-a3c3-8cc2d2883bda`)
- **앱 서비스**: `efficient-harmony`
- **MySQL 서비스**: `MySQL` (내부: `mysql.railway.internal:3306`, DB명: `railway`)
- **DATABASE_URL**: 앱 서비스 환경변수에 설정됨 (내부 주소 사용)
- **접속**: 정상 (서버 로그에 `[DB] Tables ensured successfully.` 확인)
- **Public URL**: 설정 안 됨 → 외부에서 직접 MySQL 접속 불가 (Railway 대시보드에서 TCP Proxy 활성화 필요)

### 테이블 상태 (추정 — 직접 쿼리 불가)
| 테이블 | 상태 | 근거 |
|--------|------|------|
| `users` | 비어있거나 소수 | 새 인증 시스템으로 전환, 마누스 사용자 미이관 |
| `portfolioDrafts` | **비어있음** | `portfolio.published` API가 `[]` 반환 |
| `draftImages` | **비어있음** | portfolioDrafts와 연관 |
| `insightArticles` | **비어있음** | sitemap에 insights 0건 |
| `crmClients` | **비어있음** | 마누스에서 미이관 |
| `newsletterSubscribers` | **비어있음** | 마누스에서 미이관 |
| 기타 테이블 | 빈 테이블 존재 | `ensureTables()`로 구조만 생성됨 |

### drizzle 마이그레이션 정합성
- `drizzle/` 폴더에 0000~0012까지 13개 SQL 파일 존재
- **모두 CREATE TABLE 또는 ALTER TABLE ADD COLUMN** — 파괴적 변경 없음
- 단, 이 마이그레이션들이 Railway DB에 실제 적용되었는지는 불명확
- 현재는 `server/_core/index.ts`의 `ensureTables()` 함수가 `CREATE TABLE IF NOT EXISTS`로 핵심 테이블만 생성 중
- drizzle 마이그레이션과 `ensureTables()` 사이에 스키마 불일치 가능성 있음 (컬럼 누락 등)

---

## 3. 스토리지/외부 연동

### 마누스 Forge 스토리지
- `server/storage.ts`: `BUILT_IN_FORGE_API_URL` + `BUILT_IN_FORGE_API_KEY` 사용
- **Railway 환경변수에 이 두 키가 설정되어 있지 않음** → 현재 신규 이미지 업로드 **불가**
- 마누스 대시보드에서 이 값을 확인하여 Railway에 설정하거나, 다른 스토리지(S3, Cloudflare R2 등)로 전환 필요
- 참고: `package.json`에 `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` 의존성 존재 — S3 전환 코드 일부 존재 가능

### 외부 서비스 연결
| 서비스 | 환경변수 | Railway 설정 여부 |
|--------|----------|-------------------|
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | ✅ 설정됨 |
| 네이버 OAuth | `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` | ❌ 미설정 |
| 카카오 OAuth | `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET` | ❌ 미설정 |
| 마누스 Forge | `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY` | ❌ 미설정 |
| Resend (이메일) | `RESEND_API_KEY` | ❌ 미설정 |
| Google Ads/Analytics | `VITE_GA4_MEASUREMENT_ID` 등 | ❌ 미설정 |

---

## 4. 배포 파이프라인

### 배포 방식
- **수동 `railway up`** 명령으로 배포 (git push 자동배포 아님)
- 빌드: `pnpm run build` → `vite build` + `esbuild` → `dist/` 생성
- 시작: `pnpm start` → `NODE_ENV=production node dist/index.js`
- 서버 시작 시 `ensureTables()` 백그라운드 실행 (DB 테이블 자동 생성)

### Railway 앱 서비스(`efficient-harmony`) 환경변수 키 목록
```
DATABASE_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI
JWT_SECRET
MASTER_EMAIL
NODE_ENV
OAUTH_SERVER_URL
PORT
VITE_ANALYTICS_ENDPOINT
VITE_ANALYTICS_WEBSITE_ID
VITE_APP_ID
VITE_GOOGLE_CLIENT_ID
VITE_OAUTH_PORTAL_URL
RAILWAY_*  (자동 생성)
```

### 배포 시 주의점
- `.env` 파일은 로컬 개발용. Railway에는 `railway variables set` 으로 별도 설정
- `VITE_*` 변수는 **빌드 타임**에 번들에 포함됨 → `railway up`으로 재빌드해야 반영
- esbuild가 `--packages=external`을 사용하므로 `node_modules`가 런타임에 필요
- MySQL 4개 인스턴스가 생성되어 있음 (실수로 중복 생성) — 사용하는 건 하나만

---

## 5. 인증 시스템 현황

### 마누스 OAuth 제거 상태
- `server/_core/sdk.ts`: 마누스 `OAuthService` 클래스 완전 제거됨
- `server/_core/oauth.ts`: 마누스 콜백 제거, 구글/네이버/카카오/이메일 콜백으로 교체됨
- JWT 세션: `userId` 기반으로 변경 (기존 `openId` 하위 호환 코드 포함)
- `client/src/const.ts`: `getLoginUrl()` → `getGoogleLoginUrl()` alias

### 구글 로그인
- **코드 구현 완료**, Railway 환경변수 설정 완료
- **실제 동작 여부 미확인** — Google Cloud Console의 리디렉션 URI 설정이 맞는지 테스트 필요
- 승인된 리디렉션 URI: `https://kokamdo.co.kr/api/auth/google/callback`

### 이메일/비밀번호 로그인
- **코드 구현 완료** (`/api/auth/login`, `/api/auth/register`)
- **실제 동작 여부 미확인** — DB `users` 테이블의 `passwordHash`, `email` UNIQUE 컬럼 존재 확인 필요

### 네이버/카카오 로그인
- **코드 구현 완료** (커밋 `fa76921`, 미푸시)
- 개발자센터 앱 등록 필요 (NAVER_CLIENT_ID, KAKAO_CLIENT_ID)
- 환경변수 미설정

### 로그인 페이지 (`/auth/login`)
- `AuthLogin.tsx`: 구글/네이버/카카오 버튼 + 이메일/비밀번호 폼
- 환경변수 없는 소셜 로그인 버튼은 자동 숨김
- `Layout.tsx`: 비로그인 시 "로그인" 버튼 → `/auth/login` 이동

---

## 6. 진행 중/미해결

### 알려진 이슈
1. **포트폴리오 데이터 비어있음** — 위 1번 참조
2. **이미지 업로드 불가** — Forge API 키 미설정
3. **네이버/카카오 로그인** — 개발자센터 등록 + 환경변수 필요
4. **Resend 이메일** — API 키 미설정, 이메일 인증/비밀번호 재설정 불가
5. **Multiple MySQL instances** — Railway에 MySQL 4개 존재 (MySQL, MySQL-wKlA, MySQL-6jxl, MySQL-BBdA), 정리 필요
6. **SSR 미구현** — 서버에서 라우트별 메타태그 주입은 구현했으나 완전한 SSR은 아님

### tsc 상태
- 커밋 `fa76921`에서 서버 타입 에러 정합화 작업이 포함됨
- 전체 `tsc --noEmit` 통과 여부는 미확인 (Cowork 세션에서 수정한 것으로 추정)

### 감사 리포트 기반 완료 항목
- ✅ 개인정보처리방침, 이용약관 페이지
- ✅ 푸터 정책 링크, 동의 체크박스
- ✅ Soft 404, og:image, 카카오 SDK
- ✅ 보안 헤더, 사업자 정보
- ✅ 코드 스플리팅 (React.lazy)
- ✅ SEO 메타 서버 주입
- ✅ Admin 에러 핸들링/UX 개선
- ✅ 마누스 OAuth 제거

---

## 7. 로컬 작업 상태

### 미푸시 커밋
```
fa76921 feat: 네이버·카카오 소셜 로그인 추가 + 서버 타입 에러 정합화
```
- `origin/main`은 `279d412`
- `HEAD`는 `fa76921` (1커밋 ahead)
- 변경: 38 files changed, 702 insertions(+), 245 deletions(-)
- 내용: 네이버/카카오 OAuth 콜백, DB 스키마 naverId/kakaoId 추가, AuthLogin UI, Layout 로그인 버튼, env.ts, sitemap null 체크 등

### 잔여 파일 정리
- `_stale_git_locks/`, `_to_delete/`, `_lockbak_*` — **정리 완료**

### push 판단
- 이 커밋에 포함된 타입 에러 수정이 빌드에 필수이므로 **push 권장**
- 단, 네이버/카카오 환경변수가 비어있으므로 해당 버튼은 자동 숨김 → 부작용 없음

---

## 빠른 참조

| 항목 | 값 |
|------|-----|
| 프로젝트 경로 | `~/Workspace/gogamdo-website` |
| GitHub | `arkiho/gogamdo-wireframe` (public) |
| Railway 프로젝트 | `kokamdo-website` |
| 앱 서비스 | `efficient-harmony` |
| 도메인 | `kokamdo.co.kr` (A → 69.46.46.98) |
| Railway 대시보드 | https://railway.com/project/affa7e1a-8f5a-47f1-a3c3-8cc2d2883bda |
| 마스터 이메일 | `henrykkim@kokamdo.co.kr` |
| 배포 명령 | `cd ~/Workspace/gogamdo-website && railway up` |
