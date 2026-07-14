export interface WireSection {
  id: string;
  type: 'hero' | 'stats' | 'logos' | 'cards' | 'form' | 'text' | 'grid' | 'cta' | 'timeline' | 'calculator' | 'tabs' | 'map' | 'filter' | 'footer';
  title: string;
  height: number; // relative height in px
  annotation?: string;
  children?: WireElement[];
}

export interface WireElement {
  id: string;
  type: 'image' | 'text' | 'button' | 'input' | 'select' | 'slider' | 'card' | 'logo' | 'icon' | 'chart' | 'badge';
  label: string;
  width?: string; // tailwind width class
  annotation?: string;
}

export interface WirePage {
  id: string;
  title: string;
  titleEn: string;
  icon: string;
  description: string;
  sections: WireSection[];
}

export const wireframePages: WirePage[] = [
  {
    id: 'main',
    title: '메인',
    titleEn: 'Main / Home',
    icon: '🏠',
    description: '방문자에게 회사의 핵심 가치와 전문성을 단시간에 각인시키고, 주요 콘텐츠로의 탐색을 유도하는 랜딩 페이지',
    sections: [
      {
        id: 'main-gnb',
        type: 'hero',
        title: 'GNB (Global Navigation Bar)',
        height: 60,
        annotation: '로고 + 메뉴(회사소개, 솔루션, 고객사례, AI견적, 인사이트, 문의) + CTA(무료 상담 신청) — 전 페이지 공통, 스크롤 시 상단 고정(sticky)',
        children: [
          { id: 'gnb-logo', type: 'image', label: '고감도 로고', width: 'w-32', annotation: '클릭 시 메인으로 이동' },
          { id: 'gnb-menu', type: 'text', label: '회사소개 | 솔루션 | 고객사례 | AI견적 | 인사이트 | 문의', width: 'w-auto' },
          { id: 'gnb-cta', type: 'button', label: '무료 상담 신청', width: 'w-36', annotation: '항상 노출되는 핵심 CTA' },
        ]
      },
      {
        id: 'main-hero',
        type: 'hero',
        title: '히어로 섹션',
        height: 500,
        annotation: '풀스크린 배경 이미지/영상 + 슬로건 + CTA 버튼 2개. Bluepinlabs 스타일 참고. 시공 완료된 세련된 오피스 공간의 타임랩스 또는 드론 영상 배경.',
        children: [
          { id: 'hero-bg', type: 'image', label: '배경: 시공 완료 오피스 영상/이미지', width: 'w-full', annotation: '풀스크린 비디오 또는 고화질 이미지. 오버레이 처리.' },
          { id: 'hero-slogan', type: 'text', label: '"공간을 넘어 경험을 설계합니다"', annotation: '메인 슬로건 — 대형 타이포그래피' },
          { id: 'hero-sub', type: 'text', label: '"(주)고감도 — 사무실 인테리어 전문"', annotation: '서브 카피' },
          { id: 'hero-cta1', type: 'button', label: 'AI 예상 견적 바로가기', annotation: '→ /estimator 페이지로 이동' },
          { id: 'hero-cta2', type: 'button', label: '고객 사례 둘러보기', annotation: '→ /portfolio 페이지로 이동' },
        ]
      },
      {
        id: 'main-stats',
        type: 'stats',
        title: '핵심 실적 지표',
        height: 160,
        annotation: '"숫자로 증명하는 고감도" — 카운트업 애니메이션으로 수치가 올라가는 효과. 스크롤 트리거.',
        children: [
          { id: 'stat-1', type: 'badge', label: '누적 프로젝트 000건', annotation: '실제 데이터 반영' },
          { id: 'stat-2', type: 'badge', label: '총 시공 면적 00,000㎡', annotation: '실제 데이터 반영' },
          { id: 'stat-3', type: 'badge', label: '고객 만족도 98%', annotation: '설문 기반 수치' },
          { id: 'stat-4', type: 'badge', label: '품질 보증 3년', annotation: '차별화 포인트' },
        ]
      },
      {
        id: 'main-logos',
        type: 'logos',
        title: '고객사 로고 배너',
        height: 100,
        annotation: '주요 고객사 로고 자동 슬라이드. 거래처원장 기반 — 에드워드코리아, 서울시, 서울교통공사, 세종미디어그룹 등',
        children: [
          { id: 'logo-1', type: 'logo', label: '에드워드코리아' },
          { id: 'logo-2', type: 'logo', label: '서울특별시' },
          { id: 'logo-3', type: 'logo', label: '서울교통공사' },
          { id: 'logo-4', type: 'logo', label: '세종미디어그룹' },
          { id: 'logo-5', type: 'logo', label: '승일일렉트로닉스' },
          { id: 'logo-6', type: 'logo', label: '라쿠텐심포니' },
        ]
      },
      {
        id: 'main-solutions',
        type: 'cards',
        title: '솔루션 하이라이트',
        height: 280,
        annotation: '핵심 솔루션 3~4개를 아이콘 + 짧은 설명으로 소개. 각 카드 클릭 시 솔루션 상세 페이지(→ OpsX 연계)로 이동.',
        children: [
          { id: 'sol-1', type: 'card', label: '사무실 인테리어', annotation: '아이콘 + 2줄 설명 + 더보기 링크' },
          { id: 'sol-2', type: 'card', label: '상업공간 인테리어', annotation: '아이콘 + 2줄 설명 + 더보기 링크' },
          { id: 'sol-3', type: 'card', label: '공간 컨설팅', annotation: '아이콘 + 2줄 설명 + 더보기 링크' },
          { id: 'sol-4', type: 'card', label: 'A/S 및 유지보수', annotation: '아이콘 + 2줄 설명 + 더보기 링크' },
        ]
      },
      {
        id: 'main-portfolio',
        type: 'cards',
        title: '고객 사례 (포트폴리오)',
        height: 360,
        annotation: '대표 프로젝트 3~4개의 Before & After 이미지 카드. 카드 클릭 시 상세 페이지로 이동. "더보기" 버튼으로 전체 포트폴리오 목록 이동.',
        children: [
          { id: 'port-1', type: 'card', label: 'Before → After\n프로젝트 A', annotation: '이미지 슬라이더 (좌우 드래그)' },
          { id: 'port-2', type: 'card', label: 'Before → After\n프로젝트 B', annotation: '이미지 슬라이더 (좌우 드래그)' },
          { id: 'port-3', type: 'card', label: 'Before → After\n프로젝트 C', annotation: '이미지 슬라이더 (좌우 드래그)' },
        ]
      },
      {
        id: 'main-insights',
        type: 'cards',
        title: '인사이트 (블로그)',
        height: 240,
        annotation: '최신 블로그 포스트 3개 썸네일 + 제목 노출. 클릭 시 상세 페이지로 이동.',
        children: [
          { id: 'ins-1', type: 'card', label: '블로그 포스트 1\n썸네일 + 제목 + 요약' },
          { id: 'ins-2', type: 'card', label: '블로그 포스트 2\n썸네일 + 제목 + 요약' },
          { id: 'ins-3', type: 'card', label: '블로그 포스트 3\n썸네일 + 제목 + 요약' },
        ]
      },
      {
        id: 'main-contact-cta',
        type: 'cta',
        title: '문의 유도 섹션',
        height: 200,
        annotation: '"지금 바로 당신의 공간에 대한 전문가의 조언을 들어보세요." — 무료 상담 신청 폼으로 연결되는 CTA 버튼.',
        children: [
          { id: 'cta-text', type: 'text', label: '"지금 바로 전문가의 조언을 들어보세요"' },
          { id: 'cta-btn', type: 'button', label: '무료 상담 신청하기 →', annotation: '→ /contact 페이지로 이동' },
        ]
      },
      {
        id: 'main-footer',
        type: 'footer',
        title: '푸터',
        height: 180,
        annotation: '회사 정보(주소, 대표자, 사업자등록번호), 연락처, 개인정보처리방침, 소셜 미디어 링크. 전 페이지 공통.',
        children: [
          { id: 'footer-info', type: 'text', label: '(주)고감도 | 대표: OOO | 사업자등록번호: 000-00-00000' },
          { id: 'footer-links', type: 'text', label: '개인정보처리방침 | 이용약관' },
          { id: 'footer-social', type: 'icon', label: 'SNS 아이콘 (인스타그램, 블로그, 유튜브)' },
        ]
      },
    ]
  },
  {
    id: 'about',
    title: '회사소개',
    titleEn: 'About',
    icon: '🏢',
    description: '회사의 비전과 철학, 전문성을 전달하여 고객에게 신뢰감을 주는 페이지',
    sections: [
      {
        id: 'about-vision',
        type: 'hero',
        title: '비전 및 미션',
        height: 400,
        annotation: '고감도의 디자인 철학, 핵심 가치, 비전을 대형 타이포그래피와 이미지로 소개. 배경 이미지 위에 텍스트 오버레이.',
        children: [
          { id: 'vision-bg', type: 'image', label: '배경: 대표 시공 이미지', width: 'w-full' },
          { id: 'vision-title', type: 'text', label: '"공간의 가치를 높이는 파트너"', annotation: '비전 슬로건' },
          { id: 'vision-desc', type: 'text', label: '미션 설명 텍스트 (2~3줄)', annotation: '핵심 가치 3가지 아이콘 포함' },
        ]
      },
      {
        id: 'about-team',
        type: 'grid',
        title: '팀 소개',
        height: 350,
        annotation: '대표이사 및 핵심 디자인 컨설턴트 프로필. 사진 + 직책 + 약력. 향후 영업 중심 컨설턴트 프로필로 전환 예정.',
        children: [
          { id: 'team-1', type: 'card', label: '대표이사\n프로필 사진 + 약력', annotation: '원형 프로필 이미지' },
          { id: 'team-2', type: 'card', label: '디자인 컨설턴트 A\n프로필 사진 + 약력' },
          { id: 'team-3', type: 'card', label: '디자인 컨설턴트 B\n프로필 사진 + 약력' },
          { id: 'team-4', type: 'card', label: '디자인 컨설턴트 C\n프로필 사진 + 약력' },
        ]
      },
      {
        id: 'about-history',
        type: 'timeline',
        title: '연혁 및 수상 이력',
        height: 300,
        annotation: '회사 설립부터 현재까지의 주요 마일스톤을 세로 타임라인 형태로 시각화. 수상 내역 포함.',
        children: [
          { id: 'hist-1', type: 'badge', label: '20XX — 회사 설립' },
          { id: 'hist-2', type: 'badge', label: '20XX — 주요 프로젝트 수주' },
          { id: 'hist-3', type: 'badge', label: '20XX — OO 수상' },
          { id: 'hist-4', type: 'badge', label: '2026 — AI 자동화 도입' },
        ]
      },
      {
        id: 'about-map',
        type: 'map',
        title: '오시는 길',
        height: 300,
        annotation: '본사 위치 지도 (네이버/카카오맵 API 연동). 주소, 연락처, 대중교통 안내.',
        children: [
          { id: 'map-embed', type: 'image', label: '지도 임베드 영역', width: 'w-full', annotation: '네이버/카카오맵 API' },
          { id: 'map-info', type: 'text', label: '주소: 서울시 광진구 동일로 12길 15\n전화: 02-3487-6133' },
        ]
      },
    ]
  },
  {
    id: 'solution',
    title: '솔루션',
    titleEn: 'Solution',
    icon: '💡',
    description: '제공하는 서비스를 명확히 정의하고, 외부 OpsX 시스템으로 자연스럽게 연결하는 페이지',
    sections: [
      {
        id: 'sol-overview',
        type: 'hero',
        title: '솔루션 개요',
        height: 300,
        annotation: '"고감도가 제공하는 공간 솔루션" — 전체 서비스 라인업을 한눈에 보여주는 인트로 섹션.',
        children: [
          { id: 'sol-intro', type: 'text', label: '"기업의 성장을 위한 공간 솔루션"', annotation: '페이지 타이틀' },
          { id: 'sol-desc', type: 'text', label: '솔루션 개요 설명 텍스트' },
        ]
      },
      {
        id: 'sol-services',
        type: 'tabs',
        title: '서비스 상세',
        height: 450,
        annotation: '탭 형태로 각 솔루션 상세 내용 표시. 각 탭에서 OpsX로 연결되는 CTA 포함.',
        children: [
          { id: 'tab-office', type: 'card', label: '사무실 인테리어\n설계→시공→A/S 원스톱', annotation: '탭 1: 서비스 설명 + 대표 이미지 + OpsX 링크' },
          { id: 'tab-commercial', type: 'card', label: '상업공간 인테리어\n매장/카페/병원 등', annotation: '탭 2: 서비스 설명 + 대표 이미지 + OpsX 링크' },
          { id: 'tab-consulting', type: 'card', label: '공간 컨설팅\n업종별 맞춤 공간 기획', annotation: '탭 3: 서비스 설명 + 대표 이미지 + OpsX 링크' },
          { id: 'tab-as', type: 'card', label: 'A/S 및 유지보수\n3년 품질 보증', annotation: '탭 4: 서비스 설명 + 대표 이미지 + OpsX 링크' },
        ]
      },
      {
        id: 'sol-opsx',
        type: 'cta',
        title: 'OpsX 연계 안내',
        height: 180,
        annotation: '"더 자세한 프로젝트 관리는 OpsX에서" — OpsX 시스템으로 리디렉션하는 CTA. 외부 링크로 새 탭에서 열림.',
        children: [
          { id: 'opsx-text', type: 'text', label: '"고감도의 프로젝트 관리 시스템 OpsX에서\n실시간으로 프로젝트 진행 상황을 확인하세요."' },
          { id: 'opsx-btn', type: 'button', label: 'OpsX 바로가기 →', annotation: '외부 링크 (새 탭)' },
        ]
      },
    ]
  },
  {
    id: 'portfolio',
    title: '고객 사례',
    titleEn: 'Portfolio',
    icon: '📸',
    description: '다양한 프로젝트 경험과 높은 퀄리티의 결과물을 보여주어 잠재 고객의 신뢰를 얻고 문의를 유도하는 페이지',
    sections: [
      {
        id: 'port-header',
        type: 'hero',
        title: '포트폴리오 헤더',
        height: 200,
        annotation: '"고감도가 만든 공간 이야기" — 포트폴리오 페이지 인트로. 총 프로젝트 수 표시.',
        children: [
          { id: 'port-title', type: 'text', label: '"고감도가 만든 공간 이야기"' },
          { id: 'port-count', type: 'badge', label: '총 000개 프로젝트' },
        ]
      },
      {
        id: 'port-filter',
        type: 'filter',
        title: '필터 영역',
        height: 80,
        annotation: '업종별(사무실/매장/학교/공공기관), 면적별(50평 미만/50~100평/100평 이상) 필터. 복수 선택 가능.',
        children: [
          { id: 'filter-type', type: 'select', label: '업종별: 전체 | 사무실 | 매장 | 학교 | 공공기관', annotation: '필터 버튼 그룹' },
          { id: 'filter-area', type: 'select', label: '면적별: 전체 | ~50평 | 50~100평 | 100평~', annotation: '필터 버튼 그룹' },
        ]
      },
      {
        id: 'port-grid',
        type: 'grid',
        title: '프로젝트 카드 그리드',
        height: 500,
        annotation: '각 프로젝트의 대표 이미지 + 프로젝트명 + 면적 + 위치를 포함한 카드 그리드. 3열 레이아웃. 카드 클릭 시 상세 페이지로 이동.',
        children: [
          { id: 'proj-1', type: 'card', label: '[이미지]\n에드워드코리아 C4 공장동\n충남 아산시 | 000㎡', annotation: '호버 시 오버레이 효과' },
          { id: 'proj-2', type: 'card', label: '[이미지]\nKAAM SQUARE 데이터센터\n경기 안산시 | 3,447㎡', annotation: '호버 시 오버레이 효과' },
          { id: 'proj-3', type: 'card', label: '[이미지]\nBYD 매장 (의정부)\n경기 의정부시 | 000㎡', annotation: '호버 시 오버레이 효과' },
          { id: 'proj-4', type: 'card', label: '[이미지]\n갤럭스 사무실\n서울 관악구 | 000㎡', annotation: '호버 시 오버레이 효과' },
          { id: 'proj-5', type: 'card', label: '[이미지]\n보코보코 3호점\n서울 마포구 | 169㎡', annotation: '호버 시 오버레이 효과' },
          { id: 'proj-6', type: 'card', label: '[이미지]\nBYD 매장 (청주)\n청주시 서원구 | 000㎡', annotation: '호버 시 오버레이 효과' },
        ]
      },
      {
        id: 'port-detail-preview',
        type: 'text',
        title: '상세 페이지 구조 (참고)',
        height: 350,
        annotation: '카드 클릭 시 표시되는 상세 페이지의 구조. 프로젝트 개요 → Before & After 슬라이더 → 프로젝트 스토리 → 시공 완료 갤러리 → 고객 후기.',
        children: [
          { id: 'detail-overview', type: 'text', label: '프로젝트 개요: 프로젝트명, 고객사, 위치, 면적, 기간, 담당 컨설턴트' },
          { id: 'detail-ba', type: 'image', label: 'Before & After 이미지 슬라이더', width: 'w-full', annotation: '좌우 드래그로 비교' },
          { id: 'detail-story', type: 'text', label: '프로젝트 스토리: 요구사항 → 해결 과제 → 디자인 컨셉' },
          { id: 'detail-gallery', type: 'image', label: '시공 완료 사진 갤러리 (다양한 각도)', width: 'w-full' },
          { id: 'detail-review', type: 'text', label: '고객 후기 (선택): "고감도 덕분에 직원들의 만족도가..."' },
        ]
      },
    ]
  },
  {
    id: 'estimator',
    title: 'AI 예상 견적',
    titleEn: 'AI Estimator',
    icon: '🤖',
    description: '홈페이지의 핵심 차별화 기능. 간단한 정보 입력만으로 AI가 예상 비용을 즉시 산출하여 고객의 초기 의사결정을 돕는 페이지',
    sections: [
      {
        id: 'est-header',
        type: 'hero',
        title: 'AI 견적 헤더',
        height: 200,
        annotation: '"AI가 분석하는 맞춤 예상 견적" — 간단한 정보 입력으로 빠르고 직관적인 예상 비용 제공. 잠재 고객 DB 확보 목적.',
        children: [
          { id: 'est-title', type: 'text', label: '"AI가 분석하는 맞춤 예상 견적"' },
          { id: 'est-sub', type: 'text', label: '"과거 프로젝트 데이터를 기반으로 정확한 예상 비용을 산출합니다"' },
        ]
      },
      {
        id: 'est-form',
        type: 'calculator',
        title: '정보 입력 폼',
        height: 500,
        annotation: '단계별 입력 폼. 1단계(필수): 공간 용도 + 면적. 2단계(선택): 마감재 등급 + 특수 요구사항 + 희망 예산 범위. 프로그레스 바로 진행 상태 표시.',
        children: [
          { id: 'form-step', type: 'badge', label: '단계 표시: ① 기본 정보 → ② 상세 옵션 → ③ 결과 확인', annotation: '프로그레스 바' },
          { id: 'form-usage', type: 'select', label: '공간 용도 선택\n사무실 | 매장 | 카페 | 학교 | 병원 | 기타', annotation: '필수 입력 — 아이콘 카드 형태로 선택' },
          { id: 'form-area', type: 'input', label: '공간 면적 입력 (평 / ㎡ 전환 가능)', annotation: '필수 입력 — 숫자 입력 + 단위 토글' },
          { id: 'form-grade', type: 'select', label: '마감재 등급 선택\n스탠다드 | 프리미엄 | 럭셔리', annotation: '선택 입력 — 각 등급 설명 툴팁 제공' },
          { id: 'form-special', type: 'input', label: '특수 요구사항\n회의실 수, 서버룸 유무, 탕비실 등', annotation: '선택 입력 — 체크박스 + 수량 입력' },
          { id: 'form-budget', type: 'slider', label: '희망 예산 범위 (슬라이더)\n최소 0000만원 ~ 최대 0억원', annotation: '선택 입력 — 양방향 슬라이더' },
          { id: 'form-submit', type: 'button', label: 'AI 견적 확인하기', annotation: '클릭 시 결과 섹션으로 스크롤' },
        ]
      },
      {
        id: 'est-result',
        type: 'calculator',
        title: '결과 표시 영역',
        height: 500,
        annotation: 'AI 분석 결과 표시. 총 예상 비용 범위 + 공종별 비용 분포 차트 + 예산 조절 기능 + 연락처 입력 CTA.',
        children: [
          { id: 'result-loading', type: 'text', label: '로딩: "과거 000개 프로젝트 데이터를 분석 중입니다..."', annotation: '로딩 애니메이션 (3~5초)' },
          { id: 'result-total', type: 'badge', label: '총 예상 비용: 8,500만원 ~ 9,800만원', annotation: '대형 숫자 표시 + 범위' },
          { id: 'result-chart', type: 'chart', label: '공종별 예상 비용 분포\n설계비 | 목공사 | 전기공사 | 도장공사 | ...', annotation: '도넛 차트 또는 가로 막대 차트' },
          { id: 'result-adjust', type: 'slider', label: '예산 조절 슬라이더\n"예산을 10% 낮추면 바닥재를 A→B로 변경 추천"', annotation: '예산 변경 시 AI가 실시간 재조정' },
          { id: 'result-cta', type: 'button', label: '"더 정확한 견적을 받아보시려면\n연락처를 남겨주세요"', annotation: '이름 + 연락처 + 이메일 입력 폼' },
        ]
      },
    ]
  },
  {
    id: 'insights',
    title: '인사이트',
    titleEn: 'Insights',
    icon: '📝',
    description: '전문적인 콘텐츠를 통해 업계 리더십을 보여주고, SEO를 통해 자연 유입 트래픽을 증대시키는 블로그 페이지',
    sections: [
      {
        id: 'ins-header',
        type: 'hero',
        title: '인사이트 헤더',
        height: 180,
        annotation: '"고감도 인사이트" — 블로그/콘텐츠 허브 페이지 인트로.',
        children: [
          { id: 'ins-title', type: 'text', label: '"고감도 인사이트"' },
          { id: 'ins-sub', type: 'text', label: '"공간 트렌드와 전문 지식을 공유합니다"' },
        ]
      },
      {
        id: 'ins-categories',
        type: 'filter',
        title: '카테고리 필터',
        height: 60,
        annotation: '콘텐츠 유형별 필터: 전체 | 트렌드 리포트 | 공간 활용 가이드 | 뉴스/공지',
        children: [
          { id: 'cat-all', type: 'badge', label: '전체' },
          { id: 'cat-trend', type: 'badge', label: '트렌드 리포트' },
          { id: 'cat-guide', type: 'badge', label: '공간 활용 가이드' },
          { id: 'cat-news', type: 'badge', label: '뉴스/공지' },
        ]
      },
      {
        id: 'ins-list',
        type: 'grid',
        title: '블로그 포스트 목록',
        height: 500,
        annotation: '블로그 포스트 카드 리스트. 썸네일 + 카테고리 태그 + 제목 + 요약 + 작성일. 2열 또는 3열 그리드.',
        children: [
          { id: 'post-1', type: 'card', label: '[썸네일]\n트렌드 리포트\n"2026 사무실 디자인 트렌드 5가지"' },
          { id: 'post-2', type: 'card', label: '[썸네일]\n공간 활용 가이드\n"팀워크를 살리는 사무실 배치법"' },
          { id: 'post-3', type: 'card', label: '[썸네일]\n뉴스\n"고감도, AI 설계 자동화 시스템 도입"' },
          { id: 'post-4', type: 'card', label: '[썸네일]\n가이드\n"사무실 인테리어 예산 책정 가이드"' },
          { id: 'post-5', type: 'card', label: '[썸네일]\n트렌드\n"하이브리드 오피스 공간 설계 전략"' },
          { id: 'post-6', type: 'card', label: '[썸네일]\n뉴스\n"에드워드코리아 프로젝트 완료"' },
        ]
      },
    ]
  },
  {
    id: 'contact',
    title: '문의',
    titleEn: 'Contact',
    icon: '📞',
    description: '잠재 고객의 문의를 유형별로 접수하고, 빠르고 정확하게 응대할 수 있는 채널을 제공하는 페이지',
    sections: [
      {
        id: 'con-header',
        type: 'hero',
        title: '문의 헤더',
        height: 200,
        annotation: '"고감도에 문의하세요" — 문의 유형별 안내. 전화번호, 이메일도 함께 표시.',
        children: [
          { id: 'con-title', type: 'text', label: '"고감도에 문의하세요"' },
          { id: 'con-info', type: 'text', label: '전화: 02-3487-6133 | 이메일: contact@kokamdo.co.kr' },
        ]
      },
      {
        id: 'con-tabs',
        type: 'tabs',
        title: '문의 유형 선택',
        height: 80,
        annotation: '탭 형태로 문의 유형 선택: 무료 상담 신청 | 견적 문의 | 입찰 제안. 선택에 따라 하단 폼이 변경.',
        children: [
          { id: 'tab-consult', type: 'badge', label: '무료 상담 신청' },
          { id: 'tab-quote', type: 'badge', label: '견적 문의' },
          { id: 'tab-bid', type: 'badge', label: '입찰 제안' },
        ]
      },
      {
        id: 'con-form',
        type: 'form',
        title: '문의 입력 폼',
        height: 450,
        annotation: '공통 필드: 회사명, 담당자명, 연락처, 이메일, 문의 내용. 견적 문의 시 추가: 프로젝트 주소, 희망 공사 시기, 첨부 파일(도면 등) 업로드.',
        children: [
          { id: 'form-company', type: 'input', label: '회사명', annotation: '필수' },
          { id: 'form-name', type: 'input', label: '담당자명', annotation: '필수' },
          { id: 'form-phone', type: 'input', label: '연락처', annotation: '필수' },
          { id: 'form-email', type: 'input', label: '이메일', annotation: '필수' },
          { id: 'form-address', type: 'input', label: '프로젝트 주소', annotation: '견적 문의 시 노출' },
          { id: 'form-date', type: 'input', label: '희망 공사 시기', annotation: '견적 문의 시 노출' },
          { id: 'form-file', type: 'input', label: '첨부 파일 (도면 등)', annotation: '견적 문의 시 노출 — 파일 업로드' },
          { id: 'form-content', type: 'input', label: '문의 내용 (텍스트 에어리어)', annotation: '필수' },
          { id: 'form-submit', type: 'button', label: '문의하기', annotation: '제출 후 완료 메시지 표시' },
        ]
      },
    ]
  },
];

export const iaTree = {
  title: '고감도 홈페이지',
  children: [
    {
      title: '메인 (index)',
      children: [
        { title: '히어로 (풀스크린 영상/이미지 + 슬로건 + CTA)' },
        { title: '핵심 실적 지표 (프로젝트 수, 시공 면적, 만족도)' },
        { title: '고객사 로고 슬라이더' },
        { title: '솔루션 하이라이트 (4개 카드)' },
        { title: '고객 사례 미리보기 (Before & After)' },
        { title: '인사이트 미리보기 (최신 3개)' },
        { title: '문의 유도 CTA' },
      ]
    },
    {
      title: '회사소개 (about)',
      children: [
        { title: '비전 및 미션' },
        { title: '팀 소개 (디자인 컨설턴트)' },
        { title: '연혁 및 수상 이력 (타임라인)' },
        { title: '오시는 길 (지도)' },
      ]
    },
    {
      title: '솔루션 (solution) → OpsX 연결',
      children: [
        { title: '솔루션 개요' },
        { title: '사무실 인테리어' },
        { title: '상업공간 인테리어' },
        { title: '공간 컨설팅' },
        { title: 'A/S 및 유지보수' },
        { title: 'OpsX 연계 CTA' },
      ]
    },
    {
      title: '고객 사례 (portfolio)',
      children: [
        { title: '필터 (업종별/면적별)' },
        { title: '프로젝트 카드 그리드' },
        { title: '상세 페이지 (B&A 슬라이더, 스토리, 갤러리, 후기)' },
      ]
    },
    {
      title: 'AI 예상 견적 (estimator)',
      children: [
        { title: '1단계: 공간 용도 + 면적 (필수)' },
        { title: '2단계: 마감재 등급 + 특수 요구사항 + 예산 범위 (선택)' },
        { title: '결과: 예상 비용 범위 + 공종별 차트 + 예산 조절' },
        { title: '연락처 입력 CTA (리드 확보)' },
      ]
    },
    {
      title: '인사이트 (insights)',
      children: [
        { title: '카테고리 필터 (트렌드/가이드/뉴스)' },
        { title: '블로그 포스트 카드 목록' },
        { title: '상세 페이지 (본문 + 이미지 + 인포그래픽)' },
      ]
    },
    {
      title: '문의 (contact)',
      children: [
        { title: '문의 유형 탭 (상담/견적/입찰)' },
        { title: '입력 폼 (공통 + 유형별 추가 필드)' },
        { title: '완료 페이지' },
      ]
    },
  ]
};
