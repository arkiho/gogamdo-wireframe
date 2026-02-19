# 현재 상태 메모

## 서버 상태
- 정상 동작 (No errors)
- db.ts 중복 함수 에러 해결됨 (이전 캐시 에러였음)

## 이미 완료된 작업
- siteSettings DB 테이블 생성 완료
- insightArticles에 isAiGenerated 컬럼 추가 완료
- db.ts에 getSiteSetting, setSiteSetting, listSiteSettings, deleteUser 함수 추가 완료
- routers.ts에 import 추가 완료

## 남은 작업
1. routers.ts에 siteSettings tRPC 라우터 추가 (getSetting, setSetting, listSettings)
2. Layout.tsx 네비게이션에서 AI 서비스 메뉴 조건부 표시
3. 관리자 설정 페이지에 AI ON/OFF 토글 UI
4. 직원 권한 관리 UI 보강
5. InsightDetail.tsx에 AI 작성 표시 추가
6. 포트폴리오 수정/삭제 기능
7. 외국인 사진 → 한국인 교체

## 히어로 이미지 확인
- 히어로 배경: 사무실 인테리어 사진 (외국인 뒷모습 보임)
- About, Solutions 등 다른 페이지도 확인 필요
