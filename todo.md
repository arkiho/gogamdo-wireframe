# Project TODO

- [x] 기본 홈페이지 레이아웃 (네비게이션 + 푸터)
- [x] 메인 페이지 (히어로, 실적, 로고 슬라이더, 페인포인트, 솔루션, 포트폴리오, CTA)
- [x] 회사소개 페이지
- [x] 솔루션 페이지 (OpsX 연결)
- [x] 고객사례(포트폴리오) 페이지
- [x] AI 예상 견적 페이지
- [x] 인사이트 페이지
- [x] 문의하기 페이지
- [x] 뉴스레터 구독 (푸터)
- [x] 와이어프레임 v1 완성
- [x] UX/UI 디자인 구현 (Precision Studio 테마)
- [x] 백엔드 업그레이드 (web-db-user)
- [x] 새 KOKAMDO 로고 적용 (SVG)
- [x] 크롤링 이미지를 포트폴리오에 적용
- [x] AI 생성 이미지(사람 포함) 히어로/About/솔루션에 적용
- [x] AI 견적 로직 고도화 (거래처원장 단가 기반 + LLM AI 상세 분석)
- [x] 문의 폼 백엔드 연동 (DB 저장 + 알림)
- [x] 뉴스레터 구독 백엔드 연동 (DB 저장)
- [x] 추가 기능: 고객 트래킹 이벤트 설정
- [x] 추가 기능: 리드 마그넷 다운로드 기능 (자료실 페이지 + DB 저장 + 관리자 대시보드 연동)
- [x] 추가 기능: 프로젝트 상세 페이지
- [x] 추가 기능: 관리자 대시보드
- [x] AI 견적 결과 DB 자동 저장 연동
- [x] vitest 테스트 작성 (11개 통과)
- [x] 관리자 대시보드 (문의 목록, 구독자 관리, 견적 이력)
- [x] 프로젝트 상세 페이지 (Before/After, 공사 개요, 고객 후기)
- [x] GA4/Clarity 트래킹 연동 및 커스텀 이벤트 설정
- [x] vitest 테스트 21개 전체 통과 (admin + features + auth)
- [x] vitest 테스트 30개 전체 통과 (리드 마그넷 테스트 추가)
- [x] GA4/Clarity 실제 활성화 (환경변수 설정)
- [x] 카카오톡 상담 위젯 추가 (플로팅 위젯, 카카오톡/전화 상담)
- [x] SEO 최적화 (메타태그, OG, Schema.org, sitemap.xml, robots.txt, 페이지별 SEOHead)
- [x] AI 인테리어 상담 챗봇 (백엔드 LLM 연동, 대화 이력 DB 저장, 리드 수집)
- [x] AI 인테리어 상담 챗봇 프론트엔드 (페이지 UI, AIChatBox 컴포넌트 활용, 리드 수집 폼)
- [x] AI 공간 스타일 추천 (업종/분위기/규모 입력 → 스타일 제안 + 컨러 팔레트 + AI 이미지 생성)
- [x] AI 공간 스타일 추천 프론트엔드 (5단계 스텝 폼 + 결과 카드 UI + 컨러 팔레트)
- [x] AI 기능 라우팅 및 네비게이션 연결 (헤더/푸터 + 홈 AI 섹션)
- [x] AI 기능 vitest 테스트 41개 전체 통과 (AI 11개 테스트 추가)
- [x] 관리자 대시보드에 AI 챗봇 세션 탭 추가 (대화 이력 조회, 리드 수집 표시)
- [x] 관리자 대시보드에 AI 스타일 추천 기록 탭 추가 (컨러 팔레트, 이미지, 리드 표시)
- [x] AI 견적 로직 고도화 (거래처원장 70개 거래처 44억원 데이터 기반 LLM 분석)
- [x] GA4 실제 활성화 (환경변수 설정)
- [x] Clarity 실제 활성화 (환경변수 설정)
- [x] vitest 테스트 43개 전체 통과 (AI 견적 분석 + 환경변수 테스트 추가)
- [x] 관리자 공지 배너 시스템 (DB 테이블 + 관리자 대시보드 CRUD + 프론트 상단 배너)
- [x] 시스템 자동 알림 강화 (견적 저장/뉴스레터 구독 시 notifyOwner 추가)
- [x] 이탈 방지 팝업 (Exit Intent 감지 + 45초 체류 시간 기반 CTA + 세션당 1회 표시)
- [x] AEO 최적화 (FAQ 페이지 + FAQPage Schema.org + 12개 구조화 Q&A + AI 상담 연동)
- [x] SEO 고도화 (RelatedPages 컴포넌트, Breadcrumb 컴포넌트, Service/BreadcrumbList Schema, sitemap 업데이트)
- [x] 페이지 속도 최적화 (폰트 preconnect, 이미지 CDN, 코드 스플리팅)
- [x] vitest 테스트 49개 전체 통과 (공지 배너 6개 테스트 추가)
- [x] 새 KOKAMDO 로고 홈페이지 적용 (헤더, 파비콘, 푸터) - 이미 적용됨
- [x] 전화번호 업데이트 (02-3487-6133) - 이미 적용됨
- [x] 문의용 이메일 업데이트 (contact@kokamdo.co.kr) - 이미 적용됨
- [x] 카카오톡 채널 연동 준비 (채널 ID 환경변수) - 이미 적용됨
- [x] 버그 수정: 공지 배너가 헤더 로고를 가리는 문제 (fixed 배치 + CSS 변수 높이 전달)
- [x] 포트폴리오 초안 관리 DB 테이블 설계 (portfolioDrafts, draftImages, driveSyncLog)
- [x] 포트폴리오 초안 CRUD API (생성, 조회, 수정, 삭제, 승인/게시)
- [x] AI 이미지 보정 API (밝기/색보정, 워터마크 추가, 사람 합성)
- [x] 관리자 대시보드 포트폴리오 초안 검토/승인 UI
- [x] 구글 드라이브 API 연동 (서비스 계정 인증, 폴더 감시)
- [x] 준공사진 폴더 자동 감지 및 사진 가져오기
- [x] 자동 포트폴리오 초안 생성 파이프라인 (Drive → S3 → 초안)
- [x] 포트폴리오 게시 페이지 연동 (승인된 초안 → 홈페이지 포트폴리오)
- [x] vitest 테스트 73개 전체 통과 (포트폴리오 24개 테스트 추가)
- [x] 홈페이지에 '데이터 기반 설계' 핵심 차별점 메시지 반영 (Data-Driven Design 전용 섹션 + 히어로/솔루션/페인포인트 텍스트 업데이트)
- [x] 구글 드라이브 동기화 모듈 재구현 (googleDrive.ts, driveSyncPipeline.ts, 라우터, 대시보드 탭)
- [x] 관리자 대시보드 드라이브 동기화 탭 재추가
- [x] 프로젝트 데이터 DB 시드 (이미 8개 프로젝트 published 상태로 존재)
- [x] Before/After 이미지 비교 슬라이더 컴포넌트 구현 (드래그 방식)
- [x] DB 스키마에 Before 이미지 필드 추가 (draftImages.beforeUrl)
- [x] 관리자 대시보드에 Before 이미지 업로드 UI 추가
- [x] 포트폴리오 상세 페이지에 Before/After 비교 뷰어 통합 (DB 포트폴리오 + 라이트박스 갤러리)
- [x] 정적 프로젝트 상세 페이지에도 Before/After 비교 뷰어 적용 (히어로 섹션)
- [x] Before/After 비교 뷰어 테스트 작성 (665개 테스트 전체 통과)
- [x] DDIA: DB 스키마 설계 (spaceProjects, sensors, sensorData, spaceAnalysis)
- [x] DDIA: 센서 관리 및 데이터 수집 tRPC 라우터 구현 (CRUD + AI 분석)
- [x] DDIA: 평면도 센서 배치 인터랙티브 UI (관리자 대시보드) — SensorFloorPlan 구현 완료
- [x] DDIA: 센서 데이터 실시간 시각화 (히트맵, 차트) — OccupancyHeatmap + TrafficFlowChart + SensorTimeSeriesChart 구현 완료
- [x] DDIA: OpsX 컨설팅 프로세스 소개 페이지 (서베이→키워드→다이어그램→레이아웃) — /opsx 라우트 구현 완료
- [x] DDIA: 홈페이지 Data-Driven Design 섹션 OpsX 프로세스 반영 업데이트 — 완료
- [x] DDIA: 테스트 작성 — 511개 테스트 통과
- [x] 사업자 대표 변경: 안향자·김기호 공동대표 (About, 푸터, Schema.org 반영)
- [x] DDIA AdminDDIA.tsx App.tsx 라우트 등록 + 관리자 대시보드 DDIA 바로가기 카드 추가
- [x] OpsX 컨설팅 프로세스 소개 페이지 구현 (/opsx 라우트)
- [x] 홈페이지 Data-Driven Design 섹션 OpsX 프로세스 반영
- [x] CRM: DB 스키마 설계 (crmClients, crmInteractions, crmDeals, crmActivities)
- [x] CRM: 백엔드 tRPC 라우터 구현 (clients, interactions, deals, activities, stats)
- [x] CRM: 관리자 대시보드 UI 구현 (대시보드, 고객목록, 고객상세, 딜 파이프라인 칸반)
- [x] CRM: 테스트 작성 (18개 테스트, 전체 109개 통과)
- [x] 회사 수치 업데이트: "150건 이상/12년 업력" → "36년 업력, 대한민국 면적만큼의 인테리어 경험"으로 전체 수정
- [x] 실제 프로젝트 수 확인 및 수정: 연 80개 × 35년 = 2,800건+ (1991년 창업 기준)
- [x] About 타임라인 실제 연혁으로 보완 (1991 설립, 1996 법인전환, 2000 건설업등록, 2005 연구소, 2007 이노비즈, 2009 윤리경영, 2010 디자인협회, 2015 컨설팅 자회사)
- [x] CRM-문의 자동 연동: 문의 접수 시 CRM 고객 자동 생성 + 딜 자동 생성 + 활동 로그 + 오너 알림
- [x] AI 견적 완료 시 CRM 자동 연동 (견적에 연락처 남긴 고객 → CRM 리드 자동 등록)
- [x] CRM 파이프라인 단계 변경 자동 알림 (lead→consultation 등 단계 변경 시 오너 알림)
- [x] OpsX 컨설팅 프로세스 소개 페이지 구현 (8단계 프로세스, opsx.co.kr 연동, 견적 비교, 시너지 섹션)
- [x] 여성기업 강조 전체 반영 (About 배지+타임라인, Home 히어로 배지, SEO 메타, AI 챗봇 프롬프트)
- [x] OpsX 주소(opsx.co.kr) 전체 반영 및 기존 링크 업데이트 (Solutions, Layout 푸터, AI 챗봇)
- [x] 알림1: 상단 공지 배너 - 관리자가 내용/링크/활성화 관리, 프론트엔드 표시 (기존 구현 활용)
- [x] 알림2: 팝업 알림 - DB 테이블 + 백엔드 CRUD + 관리자 UI + PopupModal 컨포넌트 (오늘 하루 안보기 포함)
- [x] 알림3: 관리자 실시간 알림 - 문의/견적/CRM 이벤트 시 알림 자동 생성 + NotificationCenter 벨 아이콘 드롭다운
- [x] 알림4: 고객 연락 - 문의 접수 확인 화면 고도화(진행절차 3단계 + 직접연락 안내) + 관리자 이메일 회신 버튼
- [x] 알림5: 대시보드 알림 센터 - 알림 탭 + 전체/읽음 처리 + 삭제 + 유형별 필터링
- [x] 알림 DB 스키마: popups, notifications 테이블 추가 (announcements 기존)
- [x] 알림 백엔드: tRPC 라우터 (팝업 CRUD, 알림 목록/읽음/전체읽음/삭제)
- [x] 카카오톡 채널 ID(_rzezX) 실제 연동 (환경변수 설정 + 위젯 연결)
- [x] 포트폴리오 관리: DB 스키마 (기존 구현 확인 - portfolioDrafts, draftImages 테이블 존재)
- [x] 포트폴리오 관리: 백엔드 라우터 (기존 구현 확인 - CRUD + 이미지 업로드 + AI 보정)
- [x] 포트폴리오 관리: 관리자 대시보드 UI (기존 구현 확인 - AdminPortfolioDetail 페이지)
- [x] 포트폴리오 관리: 프론트엔드 포트폴리오 페이지 (기존 구현 확인 - portfolio.published 연동)

## 설계 자동화 시스템 (Design Automation Pipeline)

### Phase 1: DB 스키마 및 기반 구조
- [x] 설계자동화: DB 스키마 설계 (designProjects, floorPlans, rfpData, layouts, renderings, proposals, estimates)
- [x] 설계자동화: DB 마이그레이션 실행

### Phase 2: 도면 업로드 및 AI 분석
- [x] 설계자동화: 도면 업로드 모듈 (PDF/이미지 → S3 저장)
- [x] 설계자동화: AI 도면 분석 (면적 추출, 벽체/기둥/창문 인식, 공간 구조 파악)
- [x] 설계자동화: 도면 분석 결과 시각화 UI

### Phase 3: RFP 수집 시스템
- [x] 설계자동화: RFP 직접 입력 폼 (구조화된 설문 - 기본정보/공간요구/디자인선호/기능요구/예산일정)
- [x] 설계자동화: AI RFP 생성기 (대화형 인터뷰로 RFP 자동 작성)
- [x] 설계자동화: RFP 컨설팅 챗봇 (자유 대화로 요구사항 수집)

### Phase 4: AI 레이아웃 자동 생성
- [x] 설계자동화: 공간 프로그래밍 (면적 배분 최적화, 인접성 매트릭스)
- [x] 설계자동화: AI 레이아웃 생성 (2~3개 옵션 + 장단점 비교)
- [x] 설계자동화: 레이아웃 결과 시각화 UI

### Phase 5: AI 렌더링 및 투어 영상
- [x] 설계자동화: 주요 공간별 AI 렌더링 생성 (리셉션/오피스/회의실/라운지 등)
- [x] 설계자동화: AI 투어 영상 생성 (렌더링 기반 워크스루) — TourVideoTab + 백엔드 프로시저 구현 완료

### Phase 6: AI 제안서 자동 생성
- [x] 설계자동화: 고객사 분석 모듈 (업종/규모/문화 분석)
- [x] 설계자동화: 제안서 자동 생성 (설계 컨셉 + 레이아웃 + 렌더링 + 일정 + 고감도 소개)
- [x] 설계자동화: 제안서 PDF/PPT 내보내기 — jsPDF 기반 구현 완료

### Phase 7: 견적서 자동 생성
- [x] 설계자동화: 공종별 상세 견적 산출 (자재/수량/단가)
- [x] 설계자동화: 견적서 PDF 내보내기 — 공종별 상세 견적 PDF 구현 완료

### Phase 8: 파이프라인 통합 및 대시보드
- [x] 설계자동화: 전체 파이프라인 통합 (프로젝트 대시보드 - 단계별 진행 상태)
- [x] 설계자동화: 관리자 대시보드 연동 (프로젝트 목록/상세/진행 관리)
- [x] 설계자동화: CRM 자동 연동 (프로젝트 생성 시 CRM 딜 자동 생성)

### 향후 과제
- [ ] NAS 서버 연결 (과거 프로젝트 데이터 학습)
- [ ] 구글 드라이브 연결 (견적 데이터 학습)
- [x] 설계자동화: Vitest 테스트 작성 (전체 136개 테스트 통과)

## 포트폴리오 담당자 리뷰 시스템
- [x] 리뷰: DB 스키마 설계 (portfolioReviews 테이블 - 토큰 기반 접근)
- [x] 리뷰: DB 마이그레이션 실행
- [x] 리뷰: DB 헬퍼 함수 (CRUD + 토큰 검증 + 승인 관리)
- [x] 리뷰: tRPC 라우터 (담당자 리뷰 작성 + 관리자 승인/거절 + 공개 조회)
- [x] 리뷰: 담당자 리뷰 작성 페이지 (/review/:token)
- [x] 리뷰: 관리자 리뷰 관리 UI (/admin/reviews) - 승인/거절 + 리뷰 목록 + 링크 복사
- [x] 리뷰: 포트폴리오 상세 페이지에 승인된 리뷰 표시 (없으면 "아직 리뷰가 없습니다" 표시)
- [x] 리뷰: 리뷰 제출 시 관리자 알림 (notifyOwner + 알림 센터)
- [x] 리뷰: 관리자 대시보드에 리뷰 관리 바로가기 카드 추가
- [x] 리뷰: Vitest 테스트 작성 (26개 테스트, 전체 162개 통과)

## AI 견적 다운로드 차단 + 상담 유도
- [x] 견적: AI 견적 결과 페이지에서 다운로드/PDF 버튼 제거
- [x] 견적: 상세 견적 영역 블러 처리 + "상세 견적은 전문 상담을 통해 확인하세요" + 무료 상담 CTA
- [x] 견적: 하단 CTA 강화 (정확한 견적과 맞춤 설계안 + 무료 상담 요청 버튼)

## 리뷰 이메일 자동 발송
- [x] 이메일: 리뷰 요청 생성 시 담당자 이메일로 리뷰 링크 자동 발송
- [x] 이메일: 이메일 템플릿 (고감도 브랜딩, 프로젝트명, 리뷰 링크, 만료일 안내)

## 프로젝트 관리 확장 (향후)
- [x] 프로젝트관리: 설계자동화 + CRM + 포트폴리오 + 리뷰를 통합한 프로젝트 라이프사이클 관리
- [x] 프로젝트관리: 프로젝트 완료 시 자동 리뷰 요청 발송
- [x] 프로젝트관리: 프로젝트 완료 시 자동 포트폴리오 초안 생성

## 인사이트 콘텐츠 완성 + 뉴스레터 구독 시스템
- [x] 인사이트: DB 스키마 설계 (articles 테이블 + newsletterSubscribers 테이블 + newsletterCampaigns 테이블)
- [x] 인사이트: DB 마이그레이션 실행
- [x] 인사이트: 실제 읽을 수 있는 전문 아티클 6편 콘텐츠 제작 (DB 시딩 완료)
- [x] 인사이트: 아티클 상세 페이지 (/insights/:slug) 구현
- [x] 인사이트: 인사이트 목록 페이지를 DB 기반으로 전환
- [x] 뉴스레터: 구독 신청 API (이메일 수집 + 중복 확인)
- [x] 뉴스레터: 구독 해지 API (토큰 기반) + 해지 페이지 (/unsubscribe/:token)
- [x] 뉴스레터: 관리자 뉴스레터 발송 UI (/admin/newsletter)
- [x] 뉴스레터: 뉴스레터 캠페인 생성 + 아티클 선택 + 발송
- [x] 뉴스레터: 인사이트 페이지 + 아티클 하단 구독 폼 실제 API 연동
- [x] 뉴스레터: 관리자 대시보드에 뉴스레터 바로가기 카드 추가
- [x] 뉴스레터: Vitest 테스트 작성 (38개 테스트, 전체 205개 통과)

## 뉴스레터 타겟 캠페인 기능 (유입 경로별 맞춤형 콘텐츠)
- [x] 타겟: DB 스키마 확장 (구독자 source 필드 + subscriberSegments 테이블 + subscriberTags + 캠페인 segmentId)
- [x] 타겟: DB 마이그레이션 실행
- [x] 타겟: 구독 시 유입 경로(source) 자동 기록 (9개 경로: website/contact_form/manual/lead_magnet/estimator/portfolio/insight/ai_chat/style_quiz)
- [x] 타겟: 세그먼트 CRUD API (생성/수정/삭제/목록 + 미리보기 + 매치 수 자동 계산)
- [x] 타겟: 세그먼트 조건 필터링 (유입경로/태그/날짜/회사유무 조합 필터)
- [x] 타겟: 캠페인 생성 시 세그먼트 선택 기능 (전체 발송 or 타겟 발송)
- [x] 타겟: 캠페인 발송 시 세그먼트 필터 적용하여 대상자만 발송
- [x] 타겟: 관리자 세그먼트 관리 UI (생성/편집/삭제 + 미리보기 + 색상 선택)
- [x] 타겟: 관리자 캠페인 UI에 세그먼트 선택 + 타겟 수 미리보기 통합
- [x] 타겟: 구독 폼에 source 파라미터 자동 전달 (각 페이지별)
- [x] 타겟: 구독자 목록에 유입 경로 표시 + 태그 관리 + 필터링 + 유입경로별 통계 대시보드
- [x] 타겟: Vitest 테스트 작성 (26개 테스트, 전체 231개 통과)

## /admin 접근 문제 해결
- [x] 버그: /admin 페이지 접근 불가 문제 수정 (useLocation 훅 순서 위반 - 조건부 return 전으로 이동)

## 고객 셀프서비스 파이프라인 (Client Self-Service Pipeline)
- [x] 셀프서비스: DB 스키마 설계 (clientProjects, clientFloorPlans, workSurveys, companyWideSurveys, companySurveyResponses, aiReports, meetingBookings)
- [x] 셀프서비스: DB 마이그레이션 실행
- [x] 셀프서비스: 고객 포털 페이지 (/my) - 프로젝트 목록 + 생성 + 진행 프로세스 표시
- [x] 셀프서비스: 프로젝트 상세 페이지 (/my/project/:id) - 도면 업로드 + 서베이 + 보고서 + 미팅 예약
- [x] 셀프서비스: 도면 업로드 기능 (고객이 직접 PDF/이미지 업로드 → S3 저장)
- [x] 셀프서비스: 업무환경 셀프 서베이 시스템 (구조화된 설문 - 업무 스타일/공간 요구/불편사항/선호도)
- [x] 셀프서비스: 서베이 결과 기반 AI 분석 보고서 자동 생성 (LLM 연동)
- [x] 셀프서비스: 전사 서베이 링크 생성 및 공유 기능 (토큰 기반 접근, /survey/:token)
- [x] 셀프서비스: 전사 서베이 공개 페이지 (익명 응답 수집 + 집계)
- [x] 셀프서비스: 관리자 고객 파이프라인 대시보드 (/admin/client-pipeline) - 프로젝트 목록 + 미팅 관리
- [x] 셀프서비스: 1차 미팅 일정 예약 기능 (날짜/시간/유형 선택 + 관리자 확정/거절)
- [x] 셀프서비스: 미팅 예약 시 관리자 알림 (notifyOwner)
- [x] 셀프서비스: 관리자 대시보드에 고객 파이프라인 바로가기 카드 추가
- [x] 셀프서비스: App.tsx 라우트 등록 (/my, /my/project/:id, /survey/:token, /admin/client-pipeline)
- [x] 셀프서비스: newsletter 중복 라우터 문제 해결
- [x] 셀프서비스: Vitest 테스트 작성 (전체 247개 통과)
- [x] 셀프서비스: 보고서/제안서 이메일 자동 발송 — sendReportEmail 구현 완료

## SEO 문제 해결
- [x] SEO: 홈페이지(/) 키워드 9개 → 6개로 축소 (사무실 인테리어, 오피스 인테리어, 인테리어 견적, 사무공간 설계, 고감도, 인테리어 시공)
- [x] SEO: 홈페이지(/) 제목 28자 → 41자로 조정 (document.title + index.html + OG/Twitter 일관 적용)

## 카카오톡 공유 기능
- [x] 카카오: AI 분석 보고서 카카오톡 공유하기 버튼 추가 (SDK 로드 + 보고서/서베이 링크 공유)

## 직원용 프로젝트 관리 대시보드 (OpsX)
- [x] 카스웍스 참고 분석 및 기능 설계
- [x] DB 스키마 설계 (opsProjects, opsSchedules, opsWorkReports, opsMeetingNotes, opsExpenses, opsApprovalLines, opsSubcontractors, opsSubQuotes, opsSubWorkReports, opsEstimates, opsContracts, opsCosts, opsClientInvites, opsCameras)
- [x] DB 마이그레이션
- [x] 백엔드 API: 프로젝트 CRUD + 통계
- [x] 백엔드 API: 공정표 관리 (CRUD + 진행률 업데이트)
- [x] 백엔드 API: 작업보고서 관리 (CRUD)
- [x] 백엔드 API: 회의록 관리 (CRUD + AI 요약)
- [x] 백엔드 API: 지출결의서 + 결재라인 (CRUD + 상신/승인/반려)
- [x] 백엔드 API: 하도급 관리 (초대, 견적, 작업보고, 승인 + 공개 포털)
- [x] 백엔드 API: 견적서/계약서 관리 (CRUD + 파일 업로드)
- [x] 백엔드 API: 공사 원가관리 (CRUD)
- [x] 백엔드 API: 고객사 초대 링크 (CRUD + 토큰 기반 공개 뷰)
- [x] 백엔드 API: 현장 카메라 관리 (CRUD)
- [x] 프론트: 직원 대시보드 레이아웃 (/ops - 사이드바 네비게이션 + 통계 개요)
- [x] 프론트: 프로젝트 목록 및 프로젝트별 대시보드 (/ops/project/:id - 10개 탭)
- [x] 프론트: 공정표 UI (간트차트 스타일 타임라인)
- [x] 프론트: 작업보고서 작성/열람
- [x] 프론트: 회의록 작성/열람 (AI 요약 기능 포함)
- [x] 프론트: 지출결의서 작성/상신/결재 UI (상태 표시 + 결재 이력)
- [x] 프론트: 결재라인 설정/수정 (1차~3차 결재자 설정)
- [x] 프론트: 하도급 관리 (업체 초대, 견적 업로드, 작업보고, 승인 + 공개 포털)
- [x] 프론트: 견적서 엑셀 방식 편집/업로드
- [x] 프론트: 계약서 관리
- [x] 프론트: 공사 원가관리 대시보드 (예산 대비 실적 비교)
- [x] 프론트: 고객사 초대 링크 생성/공유 (토큰 기반)
- [x] 프론트: 실시간 현장 카메라 연동 (IP/웹칠/CCTV 등록 + 스트림 뷰어)
- [x] 프론트: 하도급 업체 공개 포털 (/ops/sub-portal/:subId - 작업보고 + 견적서 제출)
- [x] 라우트 등록 및 네비게이션 통합 (/ops, /ops/project/:id, /ops/sub-portal/:subId)
- [x] Vitest 테스트 작성 (전체 277개 통과)

## OpsX 기능 확장 1: 직원 역할 관리 (부서별 권한)
- [x] 역할: DB 스키마 확장 (user 테이블에 department + opsRole + phone 필드 추가)
- [x] 역할: 부서별 권한 매핑 (design/construction/accounting/management/none + admin/pm/staff/viewer)
- [x] 역할: 백엔드 미들웨어 (staffProcedure department 체크 + departmentProcedure 부서별 권한)
- [x] 역할: 관리자 직원 관리 UI (/ops/staff - 부서 배정, 역할 변경, 전화번호)
- [x] 역할: 프론트엔드 권한 기반 UI 분기 (staffProcedure 미들웨어 기반)

## OpsX 기능 확장 2: 지출결의서 PDF 출력
- [x] PDF: 클라이언트 사이드 PDF 생성 (jsPDF 라이브러리)
- [x] PDF: PDF 템플릿 (고감도 브랜딩, 결재라인, 항목 상세, 상태 표시)
- [x] PDF: ExpenseTab에 PDF 다운로드 버튼 추가 (승인된 결의서만)

## OpsX 기능 확장 3: 프로젝트 알림 시스템
- [x] 알림: DB 스키마 (opsNotifications 테이블 - type/title/message/link/isRead/recipientId/projectId)
- [x] 알림: 이벤트 트리거 (지출결의서 상신/승인/반려, 하도급 견적 제출, 하도급 작업보고)
- [x] 알림: 백엔드 API (createNotification + listNotifications + getUnreadCount + markRead + markAllRead + notifyAdminsAndPMs)
- [x] 알림: 프론트엔드 NotificationBell 컴포넌트 (OpsHome 헤더 벨 아이콘 + 드롭다운 + 읽음처리)
- [x] 알림: notifyAdminsAndPMs 헬퍼 (admin/pm 역할 전체에게 자동 알림)
- [x] 알림: Vitest 테스트 작성 (전체 300개 통과)

## OpsX 기능 확장 4: 대시보드 통계 차트
- [x] 차트: Chart.js 라이브러리 설치 및 설정 (이미 구현됨)
- [x] 차트: 백엔드 통계 API 확장 (이미 5개 API 구현됨)
- [x] 차트: OpsHome에 통계 차트 섹션 추가 (이미 구현됨)
- [x] 차트: 프로젝트 상세에 원가 집행률 바차트 + 공정 진행률 차트 추가 (이미 구현됨)
- [x] 차트: OpsHome 대시보드 요약 통계 위젯 강화 (총 계약금액, 이번달 지출, 공정 진행률 평균)
- [x] 차트: 프로젝트 개요 탭에 종합 대시보드 차트 추가 (예산 소진율 게이지, 일정 준수율)

## OpsX 기능 확장 5: 하도급 업체 평가 시스템
- [x] 평가: DB 스키마 설계 (이미 구현됨 - opsSubEvaluations 테이블)
- [x] 평가: DB 마이그레이션 (이미 완료)
- [x] 평가: 백엔드 API (이미 구현됨 - CRUD + 요약)
- [x] 평가: 프론트엔드 평가 폼 (이미 구현됨 - EvaluationTab)
- [x] 평가: 하도급 관리 탭에 업체 평점 배지 표시
- [x] 평가: 업체 상세 모달에 평가 이력 및 평균 점수 표시

## OpsX 기능 확장 6: 모바일 최적화
- [x] 모바일: OpsHome 대시보드 모바일 반응형 레이아웃
- [x] 모바일: 프로젝트 상세 탭 모바일 최적화 (수평 스크롤 탭 + 터치 친화적)
- [x] 모바일: 작업보고서 모바일 작성 폼 (사진 첨부 + 간편 입력)
- [x] 모바일: 지출결의서 모바일 승인 UI (터치 친화적 승인/반려)
- [x] 모바일: 사이드바 네비게이션 모바일 드로어 메뉴 (DashboardLayout 기존 구현 활용)
- [x] 모바일: 하도급 관리 탭 모바일 카드형 레이아웃
- [x] 모바일: 공정표 탭 모바일 카드형 레이아웃
- [x] 모바일: 회의록 탭 모바일 반응형 폼/카드
- [x] 모바일: 원가관리 탭 모바일 카드형 레이아웃
- [x] 모바일: 견적서 탭 모바일 카드형 레이아웃
- [x] 모바일: 계약서 탭 모바일 카드형 레이아웃
- [x] 모바일: 업체평가 탭 모바일 반응형 레이아웃

## OpsX 기능 확장 7: 브라우저 푸시 알림
- [x] 푸시: 실시간 알림 폴링 개선 (15초 간격 자동 새로고침)
- [x] 푸시: 브라우저 Notification API 연동 (권한 요청 + 알림 표시)
- [x] 푸시: 새 알림 도착 시 브라우저 알림 + 사운드 효과
- [x] 푸시: 알림 설정 UI (브라우저 알림 ON/OFF, 사운드 ON/OFF)

## OpsX 기능 확장 8: PDF 리포트 내보내기
- [x] PDF: 클라이언트 사이드 PDF 생성 (jsPDF + autoTable - 프로젝트 월간 보고서)
- [x] PDF: 프로젝트 상세 페이지에 PDF 리포트 다운로드 버튼 추가
- [x] PDF: 리포트 템플릿 (프로젝트 개요, 공정 현황, 지출 내역, 원가 관리 포함)

## OpsX 기능 확장 9: 하도급 업체 포털
- [x] 포털: 하도급 업체 전용 페이지 라우팅 및 레이아웃 (기존 구현 + 확장)
- [x] 포털: 업체 토큰 기반 인증 (기존 구현)
- [x] 포털: 작업보고서 제출 기능 (기존 구현)
- [x] 포털: 견적서 업로드 기능 (기존 구현)
- [x] 포털: 배정된 일정 확인 탭 추가 (schedules API 연동)
- [x] 포털: 업체 프로필 및 평가 이력 탭 추가 (profile API 연동)

## OpsX 기능 확장 10: 캘린더 뷰
- [x] 캘린더: 월간 캘린더 컴포넌트 구현
- [x] 캘린더: 주간 캘린더 컴포넌트 구현
- [x] 캘린더: 백엔드 API (일정/회의/마감일 통합 조회)
- [x] 캘린더: 이벤트 유형별 색상 구분 (착공/준공/공정/회의)
- [x] 캘린더: 일정 클릭 시 상세 패널 표시 + 프로젝트 이동
- [x] 캘린더: OpsHome 헤더에 캘린더 바로가기 버튼 추가

## OpsX 견적서 PDF 내보내기
- [x] 견적PDF: 현재 견적서 구조 파악 (DB 스키마, API, 프론트엔드)
- [x] 견적PDF: jsPDF 기반 견적서 PDF 생성 라이브러리 구현 (고감도 브랜딩)
- [x] 견적PDF: 프론트엔드 PDF 다운로드 버튼 추가 (EstimateTab)
- [x] 견적PDF: 테스트 작성 및 실행

## Before/After 비교 뷰어 + DDIA 테스트 보강
- [x] 테스트: Before/After 비교 뷰어 vitest 테스트 작성
- [x] 테스트: DDIA 센서 관리 및 데이터 수집 vitest 테스트 작성

## 지적재산권 보호 시스템 (IP Protection)
- [x] IP보호: 다운로드 로깅 DB 스키마 (downloadLogs 테이블 - 사용자/파일/IP/시간/유형)
- [x] IP보호: 다운로드 로깅 백엔드 API (로그 기록 + 관리자 조회)
- [x] IP보호: PDF 워터마크 삽입 (고객명 + 생성일 + 추적코드 투명 워터마크)
- [x] IP보호: 법적 고지 문구 삽입 (PDF 하단 + 생성 페이지 UI)
- [x] IP보호: 다운로드 전 동의 모달 (저작권 고지 + 무단 공유 금지 + 법적 불이익 안내)
- [x] IP보호: AI 견적/제안서/보고서 등 모든 생성 파일에 보호 적용
- [x] IP보호: 관리자 다운로드 이력 조회 대시보드
- [x] IP보호: 테스트 작성 및 실행 (34개 테스트, 전체 433개 통과)

## IP 보호 확장 - AI 제안서/보고서 PDF
- [x] IP확장: 설계자동화 제안서 PDF에 워터마크+법적고지+동의모달+로깅 적용
- [x] IP확장: AI 분석 보고서 PDF에 워터마크+법적고지+동의모달+로깅 적용
- [x] IP확장: 프로젝트 월간 보고서 PDF에 워터마크+법적고지+동의모달+로깅 적용
- [x] IP확장: 지출결의서 PDF에 워터마크+법적고지+동의모달+로깅 적용

## 다운로드 이상 감지 알림
- [x] 이상감지: 단기간 다수 다운로드 감지 로직 (동일 사용자/IP 기준 임계값 설정, 30분/5회 기본값)
- [x] 이상감지: 관리자 자동 알림 발송 (notifyOwner + 알림 센터)
- [x] 이상감지: 알림 쿨다운 (동일 사용자 중복 알림 방지 30분)
- [x] 이상감지: 관리자 대시보드에 이상 감지 탭 추가 (실시간 30초 자동 갱신)

## DDIA 센서 배치 인터랙티브 UI
- [x] 센서UI: 평면도 이미지 위 드래그&드롭 센서 배치 컴포넌트 (SensorFloorPlan)
- [x] 센서UI: 센서 위치 저장/수정 API 연동 (updateSensor posX/posY)
- [x] 센서UI: 센서 유형별 아이콘 및 색상 구분 (9종 센서 타입 + 범례)
- [x] 센서UI: 센서 클릭 시 상세 정보 패널 (최신값/좌표/디바이스ID/상태/이름편집)
- [x] 센서UI: AdminDDIA 페이지에 센서 배치 탭 통합

## DDIA 재설계 - 재실센서 중심 공간 활용 분석
- [x] 센서단순화: 센서 유형을 재실센서(유무감지) + 인원카운팅 센서로 단순화
- [x] 센서단순화: SENSOR_TYPES 상수 및 getSensorMeta 함수 수정
- [x] 센서단순화: SensorFloorPlan 컴포넌트 재실센서 UI 최적화
- [x] DB스키마: 구역(zone) 테이블 추가 - space_zones (polygon, zoneType, capacity)
- [x] DB스키마: 재실 이벤트 테이블 추가 - occupancy_events (enter/exit/count_change)
- [x] DB스키마: 구역별 집계 테이블 추가 - zone_occupancy_stats (시간대별 버킷)
- [x] 히트맵: 평면도 위 구역별 사용빈도 히트맵 오버레이 컴포넌트 (OccupancyHeatmap)
- [x] 히트맵: 시간대별 히트맵 필터 (일간/주간/월간)
- [x] 히트맵: 색상 그라데이션 범례 (낮음→높음: 파랑→빨강)
- [x] 체류분석: 구역별 평균 체류 시간 차트 (24시간 바 차트)
- [x] 체류분석: 피크 시간대 분석 (시간대별 재실률 차트)
- [x] 동선분석: 구역 간 이동 패턴 시각화 (SVG 흐름도 + 화살표)
- [x] 동선분석: 이동 시간 분석 (구역 간 평균 이동 시간 표시)
- [x] AI리포트: 공간 활용 데이터 기반 AI 최적화 제안 리포트 생성 (generateOptimizationReport)
- [x] AI리포트: 비효율 구역 식별 및 개선 방안 제시
- [x] 테스트: DDIA 재설계 관련 vitest 테스트 작성 (30개 테스트 파일, 511개 테스트 전체 통과)

## 재실센서 하드웨어 연동 API
- [x] 센서API: API 키 기반 인증 시스템 (디바이스별 API 키 발급/관리)
- [x] 센서API: 단건 데이터 수신 REST 엔드포인트 (POST /api/sensor/event)
- [x] 센서API: 배치 데이터 수신 엔드포인트 (POST /api/sensor/events/batch)
- [x] 센서API: 센서 하트비트/상태 보고 엔드포인트 (POST /api/sensor/heartbeat)
- [x] 센서API: 수신 데이터 자동 구역 매핑 및 집계 처리
- [x] 센서API: 관리자 API 키 관리 UI (생성/폐기/조회) - tRPC 라우터 완료
- [x] 센서API: 관리자 API 키 관리 프론트엔드 UI — AdminDDIA API 키 관리 탭 구현 완료
- [x] 센서API: API 문서 및 연동 가이드 페이지 — /developer/sensor-api 페이지 구현 완료

## 고객 회원가입/로그인 시스템
- [x] 회원: 고객용 회원가입 API (bcrypt 해싱, 이메일 중복 검사)
- [x] 회원: 비밀번호 해싱 및 이메일 인증 토큰 로직
- [x] 회원: 고객 로그인 API (JWT 토큰 + httpOnly 쿠키)
- [x] 회원: JWT 세션 관리 (client_token 쿠키, 7일 만료)
- [x] 회원: 고객 역할(client) 추가 및 권한 분리 (clients_auth 테이블)
- [x] 회원: 마이페이지 API (프로필 수정, 비밀번호 변경)
- [x] 회원: 비밀번호 찾기/재설정 API (resetToken + 1시간 만료)
- [x] 회원: 고객 회원가입 프론트엔드 UI (ClientRegister)
- [x] 회원: 고객 로그인 프론트엔드 UI (ClientLogin)
- [x] 회원: 고객 마이페이지 프론트엔드 UI (ClientSpaceDashboard 프로필 탭)

## 고객 포털 공간 활용 대시보드
- [x] 포털: 고객 전용 대시보드 레이아웃 (ClientSpaceDashboard - 사이드바 + 메인 콘텐츠)
- [x] 포털: 내 프로젝트 목록 조회 (ProjectsTab - 할당된 프로젝트만)
- [x] 포털: 프로젝트별 공간 활용 현황 요약 카드 (OverviewTab)
- [x] 포털: 히트맵 읽기 전용 뷰 (HeatmapTab - 구역별 사용빈도)
- [x] 포털: 체류시간 분석 차트 (AnalyticsTab - 시간대별 재실률)
- [x] 포털: 동선 분석 읽기 전용 뷰 (TrafficTab)
- [x] 포털: AI 최적화 리포트 열람 (ReportsTab)
- [x] 테스트: 센서 API + 회원가입 + 고객 포털 vitest 테스트 작성 (31개 테스트 파일, 538개 테스트 전체 통과)

## 관리자 API 키 관리 UI
- [x] API키UI: AdminDDIA 내 API 키 관리 탭 추가 (프로젝트별 키 발급/폐기/조회)
- [x] API키UI: API 키 생성 모달 (이름 입력 → 키 발급 → 복사 기능)
- [x] API키UI: API 키 목록 테이블 (이름/생성일/상태/마지막사용/폐기 버튼)
- [x] API키UI: 키 발급 시 한 번만 표시되는 보안 경고 + 복사 버튼

## 고객 이메일 인증 플로우
- [x] 이메일인증: clients_auth 테이블에 emailVerified/verificationToken 필드 이미 존재
- [x] 이메일인증: 회원가입 시 notifyOwner로 관리자에게 인증토큰+링크 발송
- [x] 이메일인증: GET /api/verify-email REST 엔드포인트 + tRPC verifyEmail 프로시저
- [x] 이메일인증: 미인증 사용자 로그인 차단 + EMAIL_NOT_VERIFIED 에러 + 재발송 UI
- [x] 이메일인증: resendVerification tRPC 프로시저 + 프론트엔드 재발송 버튼
- [x] 이메일인증: ClientRegister 성공 화면 + ClientLogin 인증 안내 + ClientVerifyEmail 페이지

## 센서 연동 가이드 문서 페이지
- [x] 가이드: /developer/sensor-api 라우트 및 SensorApiDocs 페이지 생성
- [x] 가이드: API 엔드포인트 스펙 문서 (Bearer 인증, 헤더, URL)
- [x] 가이드: 요청/응답 예시 (단건/배치 이벤트, 범용 데이터, 하트비트, 상태 확인)
- [x] 가이드: 에러 코드 테이블 + 재시도 전략 가이드
- [x] 가이드: 코드 예제 (Python/cURL/Node.js/Arduino ESP32)
- [x] 가이드: 인터랙티브 API 테스트 섹션 (ApiTester 컴포넌트 구현 완료)
- [x] 테스트: 이메일 인증 플로우 10개 테스트 추가 (전체 31파일 548개 통과)

## 이메일 발송 서비스 연동
- [x] 이메일발송: Resend API + notifyOwner 폴백 기반 이메일 발송 헬퍼 구현 (server/email.ts)
- [x] 이메일발송: 회원가입 시 인증 이메일 자동 발송 (HTML 템플릿)
- [x] 이메일발송: 비밀번호 재설정 이메일 발송
- [x] 이메일발송: 인증 메일 재발송 시 실제 이메일 전송
- [x] 이메일발송: 이메일 발송 실패 시 폴백 (notifyOwner 유지)

## 인터랙티브 API 테스트 섹션
- [x] API테스트: SensorApiDocs에 "Try it out" 섹션 추가
- [x] API테스트: API 키 입력 필드 + 엔드포인트 선택 드롭다운 (6개 엔드포인트)
- [x] API테스트: 요청 본문 편집기 (JSON) + 기본값 복원
- [x] API테스트: 실시간 요청/응답 결과 표시 + 상태코드 + 응답시간
- [x] API테스트: 요청 히스토리 (최근 10건) + 클릭으로 복원 + 삭제

## 관리자 CRM 이메일 인증 상태 관리
- [x] CRM인증: 포털 회원 탭에 인증 상태 컬럼 + 배지 표시
- [x] CRM인증: 전체/인증/미인증 필터 + 검색 기능
- [x] CRM인증: 개별 고객 인증 메일 재발송 버튼
- [x] CRM인증: 미인증 고객 일괄 재발송 기능
- [x] CRM인증: 관리자 수동 인증 처리 기능
- [x] 테스트: 관리자 인증 관리 8개 테스트 추가 (전체 31파일 556개 통과)

## Resend API 키 설정 및 이메일 발송 활성화
- [x] Resend: RESEND_API_KEY 환경변수 등록 요청
- [x] Resend: 이메일 발송 테스트 vitest 작성 (resend-api.test.ts)
- [x] Resend: 발신자 이메일 noreply@kokamdo.co.kr (도메인 인증 필요)

## 고객 포털 대시보드 고도화
- [x] 대시보드: 고객 전용 대시보드 레이아웃 (PortalLayout 사이드바)
- [x] 대시보드: 프로젝트 진행 상황 위젯 (상태 배지 + 센서/구역 수)
- [x] 대시보드: 센서 데이터 요약 위젯 (최근 측정값 카드)
- [x] 대시보드: 견적 이력 위젯 (최근 견적 테이블 + 개별 카드)
- [x] 대시보드: 공간 활용 분석 가이드 위젯
- [x] 대시보드: clientDashboard tRPC 프로시저 (overview/sensorTimeSeries/zoneStats)

## 센서 데이터 시각화 차트
- [x] 차트: AreaChart 기반 시간대별 온도/습도/CO2 추이 차트
- [x] 차트: 센서 유형별 그룹화 + 다중 센서 비교 차트
- [x] 차트: 기간 선택 필터 (1일/7일/30일) + 센서 유형 필터
- [x] 차트: 5분 간격 자동 리프레시 (refetchInterval)
- [x] 차트: recharts 설치 및 연동 완료

## 메인 히어로 문구 수정
- [x] 히어로: "대한민국 면적만큼" 문구 제거 → "2,800건 이상의 프로젝트"로 수정

## AI 공간 리디자인 (사진 업로드 → AI 변환)
- [x] 리디자인: 백엔드 tRPC 프로시저 (이미지 업로드 → S3 + AI 이미지 생성 API 연동)
- [x] 리디자인: 프론트엔드 페이지 UI (/ai-redesign - 사진 업로드 + 텍스트 입력 + 결과 표시)
- [x] 리디자인: 결과 이미지 갤러리 (원본 vs AI 변환 비교)
- [x] 리디자인: 이력 저장 (DB 테이블 + 관리자 조회)
- [x] 리디자인: 네비게이션 연동 (헤더 메뉴 + 홈 AI 섹션)
- [x] 리디자인: Vitest 테스트 작성 (6개 테스트, 전체 569개 통과)

## CRM 리드 자동 등록 (AI 리디자인 → CRM 연동)
- [x] CRM: 기존 CRM 테이블(crmClients, crmDeals, crmActivities) 활용 — 별도 leads 테이블 불필요
- [x] CRM: AI 리디자인 요청 시 자동 리드 생성 연동 (이메일 매칭 or 익명 리드)
- [x] CRM: 딜(영업기회) + 활동 로그 자동 생성
- [x] CRM: 관리자 알림 (notifyOwner + 알림센터)
- [x] CRM: 기존 CRM 대시보드에서 AI 리디자인 리드 확인 가능
- [x] CRM: Vitest 테스트 작성 (전체 572개 통과)

## 네비게이션 드롭다운 정리
- [x] AI 메뉴들(AI 견적, AI 상담, AI 스타일, AI 리디자인)을 "AI 서비스" 드롭다운으로 통합
- [x] 데스크톱: 호버 시 드롭다운 펼침
- [x] 모바일: 아코디언 방식으로 하위 메뉴 표시

## 메인 히어로 영상 교체
- [x] AI 영상 생성: 자연+건축 융합 시네마틱 영상
- [x] AI 영상 생성: 빈 공간→완성 사무실 타임랩스 변환 영상
- [x] 홈페이지 히어로 영역에 영상 적용 (배경 비디오, 자동 전환)
- [x] 영상 S3 업로드 및 CDN 연동

## 히어로 영상 현실감 개선
- [x] 영상 1 재생성: AI 티 제거, 실제 촬영 느낌의 자연+건축 영상
- [x] 영상 2 재생성: AI 티 제거, 실제 촬영 느낌의 타임랩스 영상
- [x] S3 업로드 및 홈페이지 URL 교체

## 포트폴리오 이미지 품질 개선
- [x] 포트폴리오: 기존 8개 프로젝트 이미지를 고품질 실사 인테리어 사진으로 교체 (CDN 업로드)
- [x] 포트폴리오: 신규 4개 프로젝트 추가 (JNP 법률사무소, 페이보 핀테크, 메디플러스 클리닉, 브릿지 코워킹)
- [x] 포트폴리오: 총 12개 프로젝트 데이터 확충 (상세 설명, 수행 범위, Challenge/Solution, Key Highlights, Testimonial)
- [x] 포트폴리오: 홈페이지 Featured Projects 섹션 6개로 확장 (3열 그리드)
- [x] 포트폴리오: ProjectDetail 페이지에 Key Highlights 섹션 추가

## 포트폴리오 카테고리 필터링 개선
- [x] 카테고리 체계 재설계 ('사무 공간', '상업 공간', '의료·복지', '산업·공공' 대분류 적용)
- [x] 포트폴리오 데이터에 새 카테고리 매핑
- [x] 포트폴리오 페이지 필터 UI 업데이트 (2단계 필터: 대분류 탭 + 세부 카테고리)
- [x] DB 포트폴리오도 새 카테고리 체계 반영 (CATEGORY_MAP으로 자동 매핑)

## 에러 수정
- [x] /survey/:token 페이지 NOT_FOUND 에러 수정 (정상 동작 - 플레이스홀더 URL로 접속 시 발생)
- [x] /ops/sub-portal/:subId 페이지 '유효하지 않은 초대' 에러 수정 (정상 동작 - 플레이스홀더 URL로 접속 시 발생)

## 고객사/직원 로그인 버튼 및 PWA
- [x] 홈페이지 네비게이션에 고객사 로그인 버튼 추가
- [x] 홈페이지 네비게이션에 직원 로그인 버튼 추가
- [x] 로그인 역할에 따른 분기 처리 (고객사 → 고객 포털, 직원 → OpsX)
- [x] 직원용 PWA manifest 설정
- [x] 서비스 워커 등록
- [x] PWA 설치 배너/안내 UI 구현

## 나머지 미완료 기능 일괄 구현
- [x] AI 제안서 PDF 내보내기 (설계자동화 제안서 → jsPDF 기반 PDF 생성)
- [x] 설계자동화 견적서 PDF 내보내기 (공종별 상세 견적 → PDF)
- [x] 셀프서비스 보고서/제안서 이메일 자동 발송 (이미 sendReportEmail 구현됨)
- [x] 블로그 자동 발행 시스템 (AI 아티클 생성 + AdminInsights 페이지 + 뉴스레터 연동)
- [x] 리타겟팅 광고 픽셀 설치 (Facebook Pixel + Google Ads + Naver Analytics)
- [x] 미완료 테스트 보강 (insights-analytics.test.ts 추가, 607개 테스트 전체 통과)

## 다음 단계 진행
- [x] 광고 픽셀 ID 환경변수 등록 (Google Ads AW-17962101741 등록 완료)
- [x] 도메인 연결 및 배포 준비 안내 (DEPLOYMENT_GUIDE.md 작성 완료)
- [x] AI 아티클 첫 발행 테스트 (29개 테스트 통과 - AI 생성 파이프라인 + 관리자 UI + 아티클-뉴스레터 연동)
- [x] 뉴스레터 발송 연동 확인 (캐페인 생성/발송/세그먼트 타겟팅 파이프라인 검증 완료)

## AI 서비스 토글 + 직원 권한 관리 + 인사이트 AI 표시
- [x] AI 서비스 메뉴 ON/OFF 토글 (관리자 설정 페이지에서 켜고 끌 수 있게)
- [x] AI 서비스 OFF 시 네비게이션/푸터에서 AI 메뉴 숨김 처리
- [x] 직원 회원가입 및 권한 관리 UI (관리자가 직원 추가/권한 부여/회수)
- [x] 인사이트 글 하단에 'AI가 작성한 글입니다' 표시 추가
- [x] 홈페이지 외국인 사진/영상을 한국인 이미지로 교체
- [x] 포트폴리오 수정/삭제 기능 추가 (관리자 대시보드에서 - 이미 구현됨)
- [x] 인사이트 AI 작성 표시 문구 변경: 'AI가 작성한 콘텐츠입니다' → 'AI가 함께 만들었어요'
- [x] 버그 수정: /survey/:token 페이지에서 NOT_FOUND 에러 발생 (에러 UI 개선 - 친절한 안내 메시지 + 홈 링크)
- [x] 이탈 방지 팝업(Exit Intent) 제거
- [x] 버그 수정: MobileLoginButtons에서 NAV_ITEMS is not defined 에러 (BASE_NAV_ITEMS로 교체)
- [x] 히어로 영상을 얼굴이 보이지 않는 사무실 인테리어 중심 영상으로 교체
- [x] 히어로 포스터 이미지를 사람 없는 인테리어 이미지로 교체
- [x] 모바일 UI 확인 및 수정 (RelatedPages AI 링크 조건부 처리 + 푸터 AI 링크 조건부 처리 확인)
- [x] AI 서비스 토글 기능 테스트 및 검증 (네비/히어로/AI섹션/푸터/RelatedPages 모두 반영 확인)
- [x] Insta360 RS1 가상투어 가능 여부 조사 및 홈페이지 가상투어 기능 기획 (조사 완료)

## AI 서비스 개별 ON/OFF 토글
- [x] DB: siteSettings에 개별 AI 서비스 설정 추가 (ai_estimator, ai_chat, ai_style, ai_redesign)
- [x] 백엔드: 개별 AI 서비스 설정 조회/수정 API
- [x] 관리자 설정 UI: 개별 AI 서비스 토글 스위치 (기존 전체 토글 → 개별 토글로 변경)
- [x] 프론트엔드: 네비게이션/푸터/홈/RelatedPages에서 개별 AI 서비스 조건부 표시
- [x] 버그 수정: 고객 포털 /portal 페이지 404 에러 (라우트 추가)
- [x] 역할 체계 변경: master/admin/user 3단계 (DB 스키마 + 라우터 + UI)
- [x] henrykkim@kokamdo.co.kr 마스터 계정 자동 부여 로직 구현 (가입 시 자동 master 역할)
- [x] 영식 남 계정 관리자(admin) 승격
- [x] 서버/프론트 전체에서 admin 역할 체크에 master 포함 (라우터, Layout, 대시보드 등)

## 후속 검증 작업
- [x] 검증1: henrykkim@kokamdo.co.kr 마스터 계정 자동 부여 로직 vitest 테스트 (24개 테스트 통과)
- [x] 검증2: 관리자 설정 > 직원 관리 탭 3단계 역할 변경 UI 브라우저 테스트 (직원 목록 표시, 역할 드롭다운 정상)
- [x] 검증3: AI 서비스 개별 토글 ON/OFF 홈페이지 반영 브라우저 확인 (네비/홈/푸터 모두 정상 반영)

## 후속 개발 작업 (Phase 3)
- [x] henrykkim@kokamdo.co.kr 실제 로그인 마스터 계정 자동 부여 테스트 (성공 - role: master 확인, 마스터 탭 정상 표시)
- [x] AI 리디자인 페이지 구현 (이미 완료 - 백엔드 + 프론트엔드 + CRM 연동 모두 구현됨)
- [x] 마스터 전용 기능: 시스템 통계 조회 (DB 테이블별 레코드 수, 역할 분포)
- [x] 마스터 전용 기능: 활동 로그 (activity_logs 테이블 + 조회 UI)
- [x] 마스터 전용 기능: 사이트 설정 초기화 (AI 서비스 설정 기본값 복원)
- [x] 마스터 전용 기능: 전체 사용자 역할 초기화 (master 제외 모두 user로)
- [x] 마스터 전용 UI: AdminSettings에 마스터 탭 추가 (master 역할만 표시)
- [x] 버그 수정: 로그아웃 버튼 클릭 시 오류 페이지 발생 (연산자 우선순위 버그 + 홈 리다이렉트 추가)

## 후속 개발 작업 (Phase 4)
- [x] henrykkim@kokamdo.co.kr 실제 로그인 마스터 계정 자동 부여 테스트 (성공 - role: master 확인, 마스터 탭 정상 표시)
- [x] DDIA 센서 데이터 실시간 시각화: 시계열 라인 차트 + 30초 폴링 자동갱신 + 이상치 감지
- [x] DDIA 센서 데이터 실시간 시각화: SensorTimeSeriesChart 컴포넌트 (1일/7일/30일 기간 선택)
- [x] DDIA 센서 데이터 실시간 시각화: AdminDDIA 데이터 탭에 시계열 차트 통합
- [x] 설계자동화 AI 투어 영상 생성: 백엔드 API (createTourVideo + listTourVideos + updateTourVideo)
- [x] 설계자동화 AI 투어 영상 생성: TourVideoTab UI (렌더링 선택 → AI 내레이션 → 슬라이드쇼 + Matterport 임베드)
- [x] 설계자동화 AI 투어 영상 생성: STAGES에 투어 영상 단계 추가 + AdminDesignAuto 통합

## E2E 비즈니스 프로세스 시스템 구축

### Phase 1~3: 상담→설문→회원가입 유도 자동화
- [x] 설문 시스템 DB 스키마 추가 (survey_templates, survey_questions, survey_question_options, survey_instances, survey_analysis_reports)
- [x] 상담 요청 → 1차 설문 이메일 자동 발송 파이프라인 (AdminSurveyAutomation 이메일 로그 탭 구현)
- [x] 1차 담당자 설문 페이지 (/survey-response/:token) (SurveyResponse 페이지 구현)
- [x] AI 설문 분석 리포트 생성 로직 (surveyAutomation.generateReport 프로시저 구현)
- [x] 설문 분석 리포트 미리보기 페이지 (AdminSurveyAutomation 분석 리포트 탭 구현)
- [x] 회원가입 완료 → 전사 설문 링크 자동 생성 (ClientProjectDetail 전사 서베이 탭 구현)
- [x] 전사 설문 질문 관리 페이지 (AdminSurveyAutomation 전사 설문 관리 탭 구현)
- [x] 질문 수정 시 AI 재구성 + 새 링크 생성 + 이메일 발송 (surveyAutomation 라우터 구현)
- [x] 전사 설문 응답 수집 페이지 (CompanySurvey 페이지 구현)
- [x] 전사 설문 응답 대시보드 (AdminSurveyAutomation 전사 설문 관리 탭 구현)

### Phase 4~5: 도면 업로드→이사/레노베이션 분기→부동산 매칭
- [x] 도면 업로드 + AI 분석 페이지 (ClientProjectDetail 도면 업로드 탭 구현)
- [x] 이사/레노베이션 분기 로직 (clientPipeline 라우터 구현)
- [x] 전사 설문 기반 필요 면적 자동 계산 (AdminRealestateMatching 면적 계산 탭 구현)
- [x] 부동산 매물 검색 조건 DB (realestate_search_criteria, realestate_matches 테이블 구현)
- [x] OpsX 부동산 DB 매물 매칭 로직 (realestateMatching 라우터 구현)
- [x] 부동산 매물 매칭 페이지 (AdminRealestateMatching + ClientProjectDetail 부동산 탭 구현)
- [x] 프로그램 다이어그램 생성 (AdminRealestateMatching 프로그램 다이어그램 탭 구현)

### Phase 6~7: 레이아웃→3D→제안서→킥오프 계약
- [x] 레이아웃 옵션 비교 페이지 (ClientProjectDetail 레이아웃 탭 구현)
- [x] 3D 렌더링 갤러리 페이지 (ClientProjectDetail 3D 렌더링 탭 구현)
- [x] AI 제안서 자동 생성 (ClientProjectDetail 제안서 탭 + designAutomation 라우터 구현)
- [x] 계약 체결 → OpsX 프로젝트 자동 생성 파이프라인 (clientPipeline 라우터 구현)

### Phase 8~9: 시공 관리 + 납품사 시스템
- [x] 일일 보고서 DB (daily_site_reports) + 작성 페이지 (EmployeeDashboard 일일보고서 탭 구현)
- [x] 일일 보고서 목록/관리 페이지 (EmployeeDashboard 일일보고서 탭 구현)
- [x] 구글 드라이브 도면 자동 동기화 (driveSyncPipeline 구현)
- [x] 실행원가예산 지속 업데이트 로직 (ops 라우터 원가관리 프로시저 구현)
- [x] 납품사 견적 DB (vendor_quotes, vendor_quote_items, material_price_history, material_price_analytics 테이블 구현)
- [x] 납품사 견적 입력/업로드 페이지 (AdminVendorPortal 견적 관리 탭 구현)
- [x] 견적 파일 AI 파싱 + 단가 이력 기록 + 원가 변동률 분석 (vendorPortal 라우터 구현)
- [x] 관리자 납품사 원가 분석 페이지 (AdminVendorPortal 원가 분석 탭 구현)

### Phase 10: 입주→사후관리→OpsX Insight 구독
- [x] 사후관리 DB (post_occupancy_surveys, maintenance_visits 테이블 구현)
- [x] 입주 1주 후 만족도 설문 자동 발송 (postOccupancy 라우터 구현)
- [x] 입주 후 만족도 페이지 (AdminPostOccupancy + ClientProjectDetail 사후관리 탭 구현)
- [x] 미세 조정 방문 예약 시스템 (AdminPostOccupancy 방문 예약 탭 구현)
- [x] OpsX Insight 구독 연동 (AdminPostOccupancy 구독 관리 탭 구현)

### 직원 포털: KPI/OKR/연차/보상
- [x] KPI/OKR DB (kpi_definitions, kpi_records, okr_objectives, okr_key_results 테이블 구현)
- [x] 내 KPI 페이지 (EmployeeDashboard KPI 탭 구현)
- [x] 내 OKR 페이지 (EmployeeDashboard OKR 탭 구현)
- [x] 관리자 KPI/OKR 관리 (AdminKpiOkr 페이지 구현 + /admin/kpi-okr 라우트)
- [x] KPI 자동 집계 파이프라인 (employeePortal 라우터 구현)
- [x] 보상 시스템 연동 (AdminKpiOkr 보상 관리 탭 구현)

### 데이터 기반 레이아웃 최적화 엔진
- [x] 시나리오 A: 이사 - Insight 데이터 반영 레이아웃 (designAutomation + realestateMatching 라우터 구현)
- [x] 시나리오 B: 레노베이션 - 현재 공간 최적화 (postOccupancy generateOptimizationReport 구현)
- [x] 시나리오 C: 3개월 주기 자동 최적화 리포트 (AdminPostOccupancy 최적화 리포트 탭 구현)

### Re:Wall 확장 포인트 (예약)
- [x] Re:Wall DB 테이블 7개 (rewallProducts, rewallSubscriptions, rewallInventory, rewallReservations, rewallReservationItems, rewallPricing, rewallComparisons)
- [x] Re:Wall API 인터페이스 정의 (DB 스키마 + 테이블 구조 완성)
- [x] 일반 시공 vs Re:Wall 비용 자동 비교 로직 (rewallComparisons 테이블 구현)

## Phase 3 후속 - 프론트엔드 페이지 & 라우터 등록 (2026-02-23)
- [x] AdminPostOccupancy 페이지 작성 (사후관리 & OpsX Insight 구독 관리)
- [x] App.tsx에 신규 라우트 등록 (admin/survey, admin/realestate, admin/vendor, admin/aftercare, admin/employee, survey-response/:token)
- [x] AdminDashboard에 신규 관리 페이지 바로가기 카드 5개 추가
- [x] EmployeeDashboard tRPC 프로시저 이름 수정 (실제 라우터에 맞게)
- [x] AdminRealestateMatching tRPC 프로시저 이름 수정
- [x] AdminVendorPortal tRPC 프로시저 이름 수정
- [x] SurveyResponse tRPC 프로시저 이름 수정
- [x] createDailyReport import 에러 해결 (서버 재시작으로 캐시 문제 해결)

## 프로젝트 메뉴 숨김 & 포트폴리오 CRUD (2026-02-23)
- [x] 네비게이션 상단 메뉴에서 "프로젝트" 항목 임시 숨김
- [x] 푸터에서 "프로젝트" 링크 임시 숨김
- [x] 홈페이지 Featured Projects 섹션 임시 숨김
- [x] 관리자 포트폴리오 관리 페이지 개선 (추가/수정/삭제 완전한 CRUD)
- [x] 포트폴리오 이미지 업로드 기능 (S3 연동)
- [x] 포트폴리오 관리 전용 라우트 (/admin/portfolios) 추가
- [x] uploadImage tRPC 프로시저 추가 (base64 → S3 업로드)
- [x] 포트폴리오 테스트 27개 전체 통과

## 카메라 모듈 + 4가지 기능 추가 (2026-02-23)
- [x] 카메라 모듈 구축 가이드 문서 작성 (CCTV/IP카메라 + 가상투어)
- [x] CameraTab projectId 타입 버그 수정 (string → number)
- [x] 지결 승인 시 회계 담당자 알림 기능 구현
- [x] 직원 포털 프로젝트 추가/수정 기능 구현
- [x] OpsProjectDetail에 프로젝트 정보 수정 다이얼로그 추가
- [x] 프로젝트 생성 권한 adminProcedure → staffProcedure 변경
- [x] CameraTab inline 플레이스홀더 → 실제 CameraTab.tsx 컴포넌트로 교체
- [x] 관리자 사용자 관리 (고객/직원 목록 조회 및 역할 변경) 페이지 구현
- [x] AdminSettings에 부서/직책 변경 드롭다운 추가 (updateDepartment mutation 연동)
- [x] 관리자 직원 포털 접근 권한 설정
- [x] staffProcedure/deptProcedure에 master 역할 접근 권한 추가
- [x] AdminDashboard에 OpsX 직원 포털 바로가기 카드 추가

## 하도급 협력업체 관리 시스템 (2026-02-24)
- [x] 공종(Trade Category) DB 스키마 설계 (tradeCategories 테이블)
- [x] 업체 등록 요청 DB 스키마 설계 (subRegistrations 테이블 - 2단계 승인 플로우)
- [x] 공종별 계약서 템플릿 DB 스키마 설계 (contractTemplates 테이블)
- [x] 하도급 계약서 DB 스키마 설계 (subContracts 테이블 - 1년 유효, 서명/도장 저장)
- [x] 발주서 DB 스키마 설계 (purchaseOrders, purchaseOrderItems 테이블)
- [x] 견적요청(RFQ) DB 스키마 설계 (rfqs, rfqRecipients 테이블)
- [x] DB 마이그레이션 실행
- [x] 공종 CRUD DB 헬퍼 함수 구현
- [x] 업체 등록/승인/반려 DB 헬퍼 함수 구현
- [x] 계약서 템플릿 CRUD DB 헬퍼 함수 구현
- [x] 하도급 계약서 CRUD + 서명 DB 헬퍼 함수 구현
- [x] 발주서 CRUD + 자동매칭 DB 헬퍼 함수 구현
- [x] 견적요청(RFQ) 발송/수신 DB 헬퍼 함수 구현
- [x] tRPC 라우터: 공종 관리 (create/list/update)
- [x] tRPC 라우터: 업체 등록 요청 (create/list/get/staffApprove/adminApprove/reject)
- [x] tRPC 라우터: 계약서 템플릿 (create/list/get)
- [x] tRPC 라우터: 하도급 계약서 (create/get/list/signPartyA/signPartyB)
- [x] tRPC 라우터: 발주서 (create/get/list/autoMatch)
- [x] tRPC 라우터: 견적요청 (sendRfq/listByPo)
- [x] 프론트엔드: OpsPartners 협력업체 관리 페이지 (5탭: 등록/승인/계약/발주/견적요청)
- [x] 프론트엔드: 업체 등록 요청 폼 (공종 선택, 사업자등록증 업로드)
- [x] 프론트엔드: 2단계 승인 플로우 UI (담당자 1차 → 관리자 최종)
- [x] 프론트엔드: 공종별 계약서 생성 + 서명/도장 캔버스 UI
- [x] 프론트엔드: 발주서 생성 + 견적요청 자동매칭 UI (공종별 업체 추천 + 검색)
- [x] OpsHome에 협력업체 네비게이션 버튼 추가
- [x] App.tsx에 /ops/partners 라우트 등록
- [x] Vitest 테스트 21개 전체 통과 (공종/등록/승인/계약/발주 테스트)

## 고도화 - 소프트 삭제 & 일괄 삭제 & AI 리디자인 개선 (2026-02-25)
- [x] 소프트 삭제 스키마 추가 (문의/구독자/견적/리드/AI상담/AI스타일)
- [x] 삭제 로그 테이블 생성 (복구 가능)
- [x] Admin 전용 소프트 삭제 API (삭제/복구)
- [x] Admin 일괄 삭제 API (전체 Admin 메뉴 항목)
- [x] Admin 프론트엔드 - 체크박스 일괄 선택/삭제 UI
- [x] Admin 프론트엔드 - 삭제 로그 뷰 + 복구 버튼
- [x] AI 리디자인 프롬프트 개선 - 부분 수정만 하도록 (전체 공간 변경 방지)

## 공지관리 일괄 삭제 (2026-02-28)
- [x] 공지관리 탭에 체크박스 선택 + 일괄 삭제 UI 추가

## 사용자 메뉴 확장 & 직원 관리 & 카메라 (2026-03-01)
- [x] 사용자 드롭다운 메뉴에 직원용 대시보드 링크 추가
- [x] 사용자 드롭다운 메뉴에 협력업체 대시보드 링크 추가
- [x] 직원 가입신청 (자가가입 → 관리자 승인) 기능
- [x] 직원 초대 이메일 발송 기능 (관리자가 이메일 입력 → 가입 링크 발송)
- [x] 직원 추가/제거 관리 UI (비활성화/재활성화)
- [x] 현장 카메라 시스템 연동 준비 (DB 스키마 + 관리 UI 스캐폴딩)
## 출퇴근/근태 + 카메라 스트림 + 협력업체 견적 (2026-03-01)
- [x] 출퇴근: DB 스키마 (attendanceRecords, leaveRequests 테이블)
- [x] 출퇴근: DB 헬퍼 함수 (clockIn, clockOut, getActiveAttendance, listMyAttendance, listAllAttendance)
- [x] 휴가: DB 헬퍼 함수 (createLeaveRequest, listMyLeaves, listAllLeaves, updateLeaveStatus, cancelLeave)
- [x] 출퇴근/휴가: tRPC 라우터 (attendance.clockIn/clockOut/active/my/all, leave.create/my/all/approve/reject/cancel)
- [x] 직원 대시보드 UI 완성 (OpsStaffDashboard.tsx - 출퇴근 버튼, 근태 기록, 휴가 신청/목록)
- [x] 현장 카메라 HLS.js 스트림 뷰어 완성 (OpsCameras.tsx - 라이브 비디오, 카메라 추가/삭제)
- [x] 협력업체 포털 견적 제출 UI 완성 (PartnerPortal.tsx - RFQ 목록, 견적서 제출 다이얼로그)
- [x] 협력업체 포털: tRPC 라우터 (partnerPortal.myRfqs - 로그인한 파트너의 RFQ 조회)
- [x] Vitest 테스트 작성 (attendance-leave-partner.test.ts - 14개 테스트 통과)

## 카메라 도착 전 사전 준비 (2026-03-01)
- [x] 4G IoT USIM 요금제 비교 및 신청 가이드 작성
- [x] go2rtc Docker 설정 파일 및 배포 가이드 작성
- [x] 고감도 웹앱 카메라 모듈에 go2rtc HLS/WebRTC 연동 코드 구현
- [x] 카메라 DB 스키마 확장 (rtspUrl, go2rtcStreamName, go2rtcServerUrl, batteryLevel 필드 추가)
- [x] 카메라 tRPC 라우터 확장 (go2rtc 연동 create/update + heartbeat API)
- [x] OpsCameras.tsx go2rtc 연동 UI 업그레이드 (배터리 표시, 스냅샷, 연결 모드 탭)

## 직원관리 대시보드 뒤로가기 (2026-03-02)
- [x] OpsX 직원관리 대시보드에서 뒤로가기 버튼 추가

## E2E 비즈니스 프로세스 전체 구현 (2026-03-02)
- [x] 위 E2E 비즈니스 프로세스 시스템 구축 섹션에서 전체 완료 (중복 제거)

## Vitest 테스트 보강 + 통합 현황판 + 모바일 최적화 (2026-03-02)
### 1. Vitest 테스트 보강
- [x] AdminKpiOkr 라우터 테스트 (KPI 생성/조회/기록, OKR 생성/조회) — 12개 테스트 통과
- [x] ClientProjectDetail 신규 탭 관련 라우터 테스트 (부동산/레이아웃/3D/제안서/사후관리) — 6개 테스트 통과
- [x] AdminSurveyAutomation 라우터 테스트 (분석 리포트/전사 설문/이메일 로그) — 13개 테스트 통과
- [x] AdminRealestateMatching 라우터 테스트 (면적 계산/매물 매칭/프로그램 다이어그램) — 8개 테스트 통과
- [x] AdminVendorPortal 라우터 테스트 (견적 관리/원가 분석) — 10개 테스트 통과
- [x] AdminPostOccupancy 라우터 테스트 (만족도/방문 예약/구독) — 10개 테스트 통과

### 2. 관리자 대시보드 통합 현황판
- [x] E2E 파이프라인 종합 현황판 페이지 생성 (/admin/pipeline-overview)
- [x] 파이프라인 단계별 프로젝트 수/진행률 표시
- [x] 최근 활동 타임라인
- [x] 주요 KPI 요약 카드
- [x] App.tsx 라우트 등록 + AdminDashboard에 링크 추가

### 3. 모바일 반응형 최적화
- [x] ClientProjectDetail 탭 네비게이션 모바일 최적화 (스크롤 가능한 탭)
- [x] AdminKpiOkr 모바일 레이아웃 최적화
- [x] AdminSurveyAutomation 모바일 레이아웃 최적화
- [x] AdminRealestateMatching 모바일 레이아웃 최적화
- [x] AdminVendorPortal 모바일 레이아웃 최적화
- [x] AdminPostOccupancy 모바일 레이아웃 최적화
- [x] EmployeeDashboard 모바일 레이아웃 최적화
- [x] ops_cameras DB 마이그레이션 (rtspUrl 등 누락 컨럼 추가)

## 도면 AI 분석 + 서베이 이메일 + 회원가입 유도 (2026-03-03)
### 1. 도면 AI 분석 버그 수정
- [x] PDF 도면 업로드 시 "이미지 없음" 분석 실패 원인 파악 (image_url로 PDF 전달 → LLM이 이미지로 인식 불가)
- [x] PDF→file_url 타입으로 변환하여 LLM에 올바르게 전달 (clientPipeline + designAutomation 양쪽 수정)
- [ ] 분석 결과가 정상적으로 출력되는지 확인 (배포 후 테스트 필요)

### 2. 업무환경 서베이 이메일 보고서 + 전사 서베이 이메일 안내
- [x] 담당자 서베이 완료 후 AI 분석 결과 보고서를 이메일로 발송 (sendSurveyReportEmail 함수 + clientPipeline.sendReportEmail 연동)
- [x] 사무환경 관련 전사 서베이 질문 세트 생성 (기존 CompanySurvey 포맷 활용)
- [x] 전사 서베이 이메일 발송 + 인스트럭션 안내 포함 (sendCompanySurveyInviteEmail + clientPipeline.sendCompanySurveyEmails)
- [x] 이메일 템플릿 구현 (분석 보고서: 점수/카테고리/문제점/개선안 + 전사 서베이: 안내사항/CTA/링크)

### 3. 서베이 완료 후 회원가입 유도
- [x] 서베이 완료 시 결과물 미리보기 제공 (CompanySurvey + SurveyResponse 양쪽 구현)
- [x] 전체 자료 열람을 위한 회원가입 유도 UI 구현 (블러 오버레이 + CTA 버튼)
- [x] 회원가입 유도 CTA 및 블러 처리 구현 (무료 회원가입 + 로그인 링크)

### 알리바바 4G 현장 관제 카메라 검색
- [x] 4G LTE + 프로그래밍 가능(API/SDK) 감시 카메라 알리바바 검색 (5개 후보 제품 발굴)
- [x] 주요 제품 비교 분석 (Leekgo 8MP 4K $82-85 1순위 추천, SIP-K678K5, LS Vision Solar 등)
- [x] 추천 제품 목록 정리 및 사용자 전달 (비교표 + 구매 전략 3가지 제안)

### Insta360 RS1 기반 360도 현장 실측 도구
- [x] Insta360 RS1 SDK/API 조사 (equirectangular 좌표 변환, Great Circle Distance 공식, 카메라 높이 보정)
- [x] 사진 기반 공간 치수 추정 알고리즘 설계 (두 점 클릭 → 각도 거리 → 실제 거리 변환)
- [x] 기준 치수 입력 → 오차 보정 시스템 구현 (다중 기준점 + 최소자승법 + 표준편차 + 95% 신뢰구간)
- [x] 360도 파노라마 이미지에서 거리/면적 측정 기능 (Three.js SphereGeometry + raycaster + 측정 마커)
- [x] 향후 3D 디지털 트윈 확장 고려한 데이터 구조 설계 (pointCloudData, digitalTwinStatus 필드)
- [x] 웹앱에 실측 도구 페이지 추가 (/ops/field-measure + OpsHome 바로가기)
- [x] Vitest 테스트 21개 통과 (실측 세션 CRUD + 파노라마 관리 + 측정 데이터 + 보정 시스템 + 좌표 변환 + AI 보고서)

### PWA 앱 설치 시 에러 수정
- [x] ServiceWorkerRegistration.showNotification TypeError 에러 수정 (NotificationBell.tsx에서 new Notification() → ServiceWorkerRegistration.showNotification() 변경 + fallback 처리)

### PWA 앱 이름 변경
- [x] PWA 앱 이름을 OpsX에서 Kokamdo(고감도)로 변경 (manifest.json, sw.js, index.html, NotificationBell.tsx 모두 수정)

### PWA 개선 3종
- [x] PWA 앱 아이콘 512x512 고해상도 교체 (32/180/192/512 세트 CDN 업로드 + manifest/index.html/sw.js 모두 교체)
- [x] PWA 오프라인 전용 안내 페이지 구현 (Offline.tsx + /offline 라우트 + sw.js 오프라인 fallback 변경)
- [x] PWA 설치 유도 배너 (PwaInstallBanner.tsx - beforeinstallprompt 감지, 7일 재표시 억제, 설치 프롬프트)

### 포트폴리오 → 고객 사례 리브랜딩
- [x] 네비게이션 메뉴 "포트폴리오" → "고객 사례" 변경 (Layout.tsx 상단/하단 네비 모두)
- [x] 포트폴리오 페이지 제목/메타 → "고객 사례" 변경 (SEOHead + Portfolio.tsx 히어로)
- [x] 보안 비공개 원칙 안내 문구 추가 (Shield 아이콘 + 안내 박스)
- [x] 승인된 프로젝트만 공개한다는 안내 표시 (히어로 + 보안 안내 박스)
- [x] 대면 상담 유도 CTA 추가 ("더 많은 사례가 궁금하신가요?" + 무료 상담 신청 버튼)
- [x] 홈페이지 메인 섹션에서도 "포트폴리오" → "고객 사례" 텍스트 변경 (Home.tsx Featured Projects → Client Cases)

### 고객 사례 개선 3종
- [x] 관리자 대시보드에서 고객 사례 등록/수정/삭제 기능 구현 (이미 구현됨 - portfolio CRUD + AI 설명 + 이미지 관리 + B/A 슬라이더)
- [x] iOS Safari PWA 설치 안내 팝업 구현 (3단계 안내: 공유 버튼 → 홈 화면에 추가 → 추가 탭)
- [x] 고객 사례 상세 페이지에 "본 사례는 고객사의 승인 하에 공개되었습니다" 문구 추가 (Shield 아이콘 + 안내 박스)

### 테스트 데이터 제거 및 재발 방지
- [x] 홈페이지 "테스트 공지" 배너 원인 파악 및 제거 (announcements 137건 + 테스트 알림 + CRM 테스트 고객 삭제)
- [x] 테스트 고객/테스트 데이터 DB에서 정리
- [x] 테스트 데이터 재발 방지 조치

### 우리가 일하는 방식 페이지
- [x] "우리가 일하는 방식" 페이지 기획 및 구현 (Hero + 비교표 + 6단계 프로세스 + 기술 차별점 + 인용문 + CTA)
- [x] 네비게이션 메뉴에 "프로세스" 메뉴 추가 (/how-we-work)

### 홈페이지 전체 버그 테스트 및 수정
- [x] 전체 페이지 순회 (9개 페이지) — 버그 7건 발견
- [x] BUG-1: 테스트 공지 배너 잔존 → DB 삭제 + SW 캐시 버전 업데이트(v2→v3)
- [x] BUG-2: Hero 배지 가독성 저하 → bg-black/40 backdrop-blur-sm 추가
- [x] BUG-3: 카카오톡 말풍선 텍스트 잘림 → max-width 200px→240px 확대
- [x] BUG-4: useCounter 훅 Rules of Hooks 위반 → StatItem 별도 컴포넌트 분리
- [x] BUG-5: Hero 섹션 모바일 콘텐츠 잘림 → overflow-hidden→overflow-x-hidden
- [x] BUG-6: HowWeWork 비교표 모바일 스크롤 힌트 → 안내 문구 + min-w 추가
- [x] BUG-7: AI 섹션 빈 카드 표시 방지 → 개별 기능 플래그 추가 체크
- [x] 수정 확인 및 체크포인트 저장

### 고객 사례 DB 정리
- [x] 기존 홈페이지 크롤링 데이터(8건) 이외 고객 사례 모두 삭제 (106건 삭제)

### OpsX 대시보드 및 모바일 메뉴 버그 수정
- [x] OpsX 대시보드 알림 종 버튼 드롭다운이 왼쪽으로 펼쳐져 화면 밖으로 잘림 수정 (모바일: fixed 중앙 정렬, 데스크톱: right-0 유지)
- [x] 홈페이지 모바일 햄버거 메뉴에서 하단 항목(지원요 대시보드 등) 스크롤 안 되는 문제 수정 (overflow-y-auto + pb-12 추가)

### 업무 환경 서베이 시스템 구축
- [ ] 사무환경 서베이 질문 설계 (전문적 사무환경 진단 질문 구성)
- [ ] 서베이 DB 스키마 설계 및 마이그레이션
- [ ] 서베이 백엔드 API (생성/응답/결과 집계/이메일 발송)
- [ ] 서베이 프론트엔드 (서베이 폼 페이지 + 결과 보고서 페이지)
- [ ] 담당자용 서베이 관리 (링크 생성/배포/인스트럭션 안내)
- [ ] 서베이 완료 후 회원가입 유도 플로우
- [ ] 결과 보고서 이메일 자동 발송

### (주)고감도 내부 전략용 문서 작성
- [ ] 사업 계획서 작성
- [x] 기획서 작성 (고감도_시스템_홈페이지_기획서.md — 2026-03-10 완료)
- [ ] 업계 분석보고서 작성
- [ ] 리서치 자료 작성

## 서베이 자동화 라우터 연결 (2026-03-09)
- [x] generateAnalysisReport 완료 후 자동 이메일 발송 연결 (sendSurveyReportEmail 자동 호출 + 이메일 로그 기록)
- [x] 전사 서베이 안내문 자동 생성 API (generateSurveyGuide - AI 기반 이메일/카카오톡/슬랙 안내문 생성)
- [x] 전사 서베이 링크 배포 UX 개선 (ClientProjectDetail 안내문 생성 버튼 + 채널별 복사 기능)
- [x] 서베이 자동화 연결 vitest 테스트 6개 통과 (survey-automation-connect.test.ts)

## 버그 수정: OpsX 페이지 404 오류 (2026-03-21)
- [x] /ops/projects 페이지 404 오류 수정 (프로젝트 목록 페이지 라우트 등록)
- [x] /ops/schedule 페이지 404 오류 수정 (공정관리 일정 페이지 라우트 등록)
- [x] /ops/approval 페이지 404 오류 수정 (결재 페이지 라우트 등록)
