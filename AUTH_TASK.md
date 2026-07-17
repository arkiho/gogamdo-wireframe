# 인증 시스템 구축 작업 지시서

## 프로젝트 경로
`~/Workspace/gogamdo-website`

## 프로젝트 기술스택
- React + TypeScript + Vite (클라이언트)
- Express + tRPC (서버)
- Drizzle ORM + MySQL (DB, Railway 호스팅)
- wouter (라우터)
- sonner (토스트 알림)

## 현재 상태
- 마누스 OAuth 의존 코드를 제거하고 자체 인증 시스템 뼈대를 만들어둔 상태
- 구글 OAuth 콜백 + 이메일/비밀번호 로그인/회원가입 API는 구현됨
- 로그인 페이지(`/auth/login`)가 만들어져 있음
- Railway에 배포 완료 (kokamdo.co.kr)
- DB 테이블 자동 생성 로직 포함

## 요구사항

### 1. 홈페이지 상단 로그인 버튼
- **파일**: `client/src/components/Layout.tsx`
- 현재 네비게이션 바에 로그인/사용자 메뉴가 있음 (`LoginDropdown` 컴포넌트, 약 300번째 줄)
- 비로그인 시: "로그인" 버튼 → `/auth/login` 페이지로 이동
- 로그인 시: 사용자 이름 + 드롭다운 (마이페이지, 로그아웃)

### 2. 로그인/회원가입 페이지 (`/auth/login`)
- **파일**: `client/src/pages/AuthLogin.tsx` (이미 기본 구조 있음)
- 로그인/회원가입 모드 전환 가능
- 4가지 로그인 방식 지원:

#### 2-1. 구글 로그인
- **이미 구현됨**: `server/_core/oauth.ts`의 `/api/auth/google/callback`
- Google OAuth 2.0 사용
- 환경변수: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (이미 설정됨)
- 리디렉션 URI: `https://kokamdo.co.kr/api/auth/google/callback`

#### 2-2. 네이버 로그인 (새로 구현)
- 네이버 개발자센터에서 앱 등록 필요
- 콜백 URL: `https://kokamdo.co.kr/api/auth/naver/callback`
- 네이버 API로 사용자 정보 가져오기 (이름, 이메일, 프로필 이미지)
- `server/_core/oauth.ts`에 `/api/auth/naver/callback` 추가
- 환경변수: `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`

#### 2-3. 카카오 로그인 (새로 구현)
- 카카오 개발자센터에서 앱 등록 필요
- 콜백 URL: `https://kokamdo.co.kr/api/auth/kakao/callback`
- 카카오 API로 사용자 정보 가져오기 (닉네임, 이메일)
- `server/_core/oauth.ts`에 `/api/auth/kakao/callback` 추가
- 환경변수: `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET` (또는 REST API 키)

#### 2-4. 이메일/비밀번호 회원가입 + 로그인
- **이미 구현됨**: `/api/auth/login`, `/api/auth/register`
- 회원가입: 이름, 이메일, 비밀번호 (8자 이상)
- bcryptjs로 비밀번호 해싱
- 가입 후 자동 로그인

### 3. DB 스키마 (이미 수정됨)
- **파일**: `drizzle/schema.ts` (users 테이블)
- `googleId` (VARCHAR, unique, nullable) — 구글 OAuth용
- `passwordHash` (VARCHAR, nullable) — 이메일/비밀번호용
- `email` (VARCHAR, unique, nullable)
- `loginMethod` — "google", "naver", "kakao", "email" 중 하나
- **추가 필요**: `naverId` (VARCHAR, unique, nullable), `kakaoId` (VARCHAR, unique, nullable)
- DB 테이블 생성은 `server/_core/index.ts`의 `ensureTables()` 함수에서 처리 (CREATE TABLE IF NOT EXISTS)

### 4. 세션 관리 (이미 구현됨)
- **파일**: `server/_core/sdk.ts`
- JWT 기반 세션 (HS256)
- `app_session_id` 쿠키에 저장
- 1년 만료
- `JWT_SECRET` 환경변수 사용 (fallback 있음)

### 5. 인증 확인 훅 (이미 구현됨)
- **파일**: `client/src/_core/hooks/useAuth.ts`
- `trpc.auth.me` 쿼리로 현재 사용자 정보 가져옴
- `{ user, loading, logout }` 반환

## 핵심 파일 목록
| 파일 | 역할 |
|------|------|
| `server/_core/oauth.ts` | OAuth 콜백 + 로그인/회원가입 API |
| `server/_core/sdk.ts` | JWT 세션 생성/검증 |
| `server/_core/env.ts` | 환경변수 정의 |
| `server/_core/index.ts` | Express 서버 + DB 테이블 생성 |
| `server/_core/context.ts` | tRPC 컨텍스트 (인증 주입) |
| `server/db.ts` | DB 쿼리 함수 (getUserByEmail, getUserByGoogleId 등) |
| `drizzle/schema.ts` | DB 스키마 (users 테이블) |
| `client/src/pages/AuthLogin.tsx` | 로그인/회원가입 페이지 |
| `client/src/const.ts` | getGoogleLoginUrl 등 클라이언트 URL 생성 |
| `client/src/components/Layout.tsx` | 네비게이션 바 (LoginDropdown) |
| `client/src/App.tsx` | 라우터 (`/auth/login` 등록됨) |

## 환경변수 (.env)
```
# Railway 환경변수에 설정됨 (값은 Railway 대시보드 참조)
GOOGLE_CLIENT_ID=<Railway에서 확인>
GOOGLE_CLIENT_SECRET=<Railway에서 확인>
GOOGLE_REDIRECT_URI=https://kokamdo.co.kr/api/auth/google/callback
VITE_GOOGLE_CLIENT_ID=<GOOGLE_CLIENT_ID와 동일>
JWT_SECRET=<Railway에서 확인>
MASTER_EMAIL=henrykkim@kokamdo.co.kr

# 새로 추가 필요 (사용자가 개발자센터에서 발급받아야 함)
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
```

## 배포
- Railway에 배포: `cd ~/Workspace/gogamdo-website && railway up`
- 환경변수 설정: `railway variables set KEY=VALUE`
- GitHub 푸시: `git push origin main`

## 참고사항
- 마스터 이메일(henrykkim@kokamdo.co.kr)로 가입하면 자동으로 master 권한 부여됨
- 소셜 로그인으로 기존 이메일 사용자와 같은 이메일이면 계정 연결 (merge)
- 로그인 페이지 디자인은 기존 사이트 스타일 유지 (gold 액센트, 깔끔한 폼)
- 네이버/카카오 개발자센터 등록은 사용자가 직접 해야 하므로, 환경변수가 비어있으면 해당 버튼 숨기기
