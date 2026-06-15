/**
 * 이미지 CDN URL 상수
 * 모든 이미지를 한 곳에서 관리
 */

// AI 생성 이미지 (사람 없는 고급 사무실 인테리어)
export const HERO_IMG = "https://files.manuscdn.com/user_upload_by_module/session_file/98603122/FoTJgIhXQbYpbExT.jpg";

export const ABOUT_TEAM_IMG = "https://files.manuscdn.com/user_upload_by_module/session_file/98603122/HNxDbnrjBxaAWQcD.jpg";

export const SOLUTION_CONSULT_IMG = "https://files.manuscdn.com/user_upload_by_module/session_file/98603122/aIFyBWbzwawLDmbf.jpg";

// 고품질 포트폴리오 이미지 (CDN)
// 대분류 카테고리 (필터 탭)
export const MAJOR_CATEGORIES = [
  "전체",
  "오피스",
  "산업시설",
  "병원",
  "관급공사",
  "리테일",
] as const;

export type MajorCategory = (typeof MAJOR_CATEGORIES)[number];

// 세부 카테고리 → 대분류 매핑
export const CATEGORY_MAP: Record<string, MajorCategory> = {
  "사무실 인테리어": "오피스",
  "크리에이티브 오피스": "오피스",
  "크리에이티브 스튜디오": "오피스",
  "글로벌 기업 오피스": "오피스",
  "IT 오피스": "오피스",
  "오피스": "오피스",
  "상업공간": "리테일",
  "코워킹 스페이스": "리테일",
  "F&B": "리테일",
  "리테일": "리테일",
  "헬스케어 오피스": "병원",
  "병원": "병원",
  "클리닉": "병원",
  "복지시설": "병원",
  "공공기관": "관급공사",
  "산업시설": "산업시설",
  "교육시설": "관급공사",
  "관급공사": "관급공사",
};

// 대분류에서 해당하는 세부 카테고리 목록 반환
export function getSubCategories(major: MajorCategory): string[] {
  if (major === "전체") return [];
  return Object.entries(CATEGORY_MAP)
    .filter(([, m]) => m === major)
    .map(([sub]) => sub);
}

export type ProjectData = {
  slug: string;
  name: string;
  nameEn: string;
  category: string;
  majorCategory: MajorCategory;
  area: string;
  year: string;
  duration: string;
  location: string;
  image: string;
  beforeImage?: string;
  description: string;
  scope: string[];
  challenge: string;
  solution: string;
  highlights?: string[];
  testimonial?: { text: string; author: string; role: string };
};

export const PROJECTS: ProjectData[] = [
  {
    slug: "huxeed",
    name: "허시드",
    nameEn: "Huxeed",
    category: "사무실 인테리어",
    majorCategory: "오피스",
    area: "250㎡ (76평)",
    year: "2024",
    duration: "8주",
    location: "서울 강남구",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/98603122/cNLDAtXkhNOXNqMK.jpg",
    description: "IT 스타트업 허시드의 새로운 오피스 공간을 설계하였습니다. 개방형 업무 공간과 집중 부스를 조화롭게 배치하여 협업과 집중을 동시에 지원하는 하이브리드 워크 환경을 구현하였습니다. 자연광을 최대한 끌어들이는 유리 파티션과 식물을 활용한 바이오필릭 요소가 공간에 생기를 더합니다.",
    scope: ["공간 기획", "인테리어 설계", "가구 배치", "조명 설계", "시공 관리"],
    challenge: "제한된 면적 안에서 개방형 업무 공간, 회의실 3개, 집중 부스, 휴게 공간을 모두 수용해야 했습니다.",
    solution: "가변형 파티션과 다목적 가구를 활용하여 공간 효율을 극대화하고, 자연광을 최대한 활용하는 레이아웃을 설계하였습니다.",
    highlights: ["개방형 업무 공간 + 집중 부스 하이브리드 구성", "자연광 극대화 유리 파티션 시스템", "바이오필릭 디자인 요소 적용"],
    testimonial: { text: "직원들의 업무 만족도가 눈에 띄게 향상되었습니다. 특히 집중 부스와 개방형 공간의 균형이 잘 잡혀 있어 다양한 업무 스타일을 지원합니다.", author: "김대표", role: "허시드 CEO" },
  },
  {
    slug: "lab543",
    name: "LAB543",
    nameEn: "LAB543",
    category: "크리에이티브 스튜디오",
    majorCategory: "오피스",
    area: "200㎡ (60평)",
    year: "2023",
    duration: "6주",
    location: "서울 성동구",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/98603122/TqqvtcILYTQzDPFB.jpg",
    description: "디지털 콘텐츠 제작사 LAB543의 크리에이티브 스튜디오를 설계하였습니다. 촬영 스튜디오, 편집실, 회의 공간이 유기적으로 연결되는 워크플로우 중심의 공간을 구현하였습니다. 인더스트리얼 감성과 따뜻한 우드톤의 조화가 크리에이티브 팀의 영감을 자극합니다.",
    scope: ["공간 기획", "인테리어 설계", "조명 설계", "방음 시공", "전기 배선"],
    challenge: "촬영 스튜디오의 방음과 조명 요구사항을 충족하면서도 일반 오피스 기능을 유지해야 했습니다.",
    solution: "존별 방음 등급을 차등 적용하고, 가변형 조명 시스템을 도입하여 촬영과 업무 환경을 모두 최적화하였습니다.",
    highlights: ["인더스트리얼 + 우드톤 하이브리드 디자인", "존별 방음 등급 차등 적용", "가변형 조명 시스템 도입"],
    testimonial: { text: "촬영 환경이 크게 개선되어 작업 효율이 30% 이상 향상되었습니다. 공간 동선이 워크플로우에 최적화되어 있어 매우 만족합니다.", author: "이PD", role: "LAB543 대표" },
  },

  {
    slug: "paperlab",
    name: "페이퍼랩",
    nameEn: "Paperlab",
    category: "크리에이티브 오피스",
    majorCategory: "오피스",
    area: "180㎡ (54평)",
    year: "2024",
    duration: "7주",
    location: "서울 마포구",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/98603122/koSHCzPKNjesEpDR.jpg",
    description: "디자인 에이전시 페이퍼랩의 새 오피스를 설계하였습니다. 크리에이티브 팀의 영감을 자극하는 갤러리형 공간과 실용적인 업무 환경을 결합하였습니다. 노출 천장과 원목 바닥재의 조합이 뉴욕 소호 스타일의 세련된 분위기를 연출합니다.",
    scope: ["공간 기획", "인테리어 설계", "갤러리 조명", "가구 커스텀", "시공 관리"],
    challenge: "디자이너들의 창의성을 자극하면서도 클라이언트 미팅에 적합한 전문적인 분위기를 동시에 연출해야 했습니다.",
    solution: "작업 공간과 프레젠테이션 공간을 명확히 구분하되, 갤러리 월을 통해 자연스럽게 연결하는 동선을 설계하였습니다.",
    highlights: ["뉴욕 소호 스타일 갤러리형 공간", "노출 천장 + 원목 바닥 디자인", "작업-프레젠테이션 공간 분리 동선"],
  },
  {
    slug: "huray",
    name: "휴레이",
    nameEn: "Huray",
    category: "IT 오피스",
    majorCategory: "오피스",
    area: "300㎡ (91평)",
    year: "2024",
    duration: "10주",
    location: "서울 서초구",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/98603122/ncSJvUqhhpHRYEqT.jpg",
    description: "헬스케어 IT 기업 휴레이의 본사 오피스를 설계하였습니다. 데이터 센터와 일반 오피스가 공존하는 특수한 환경에서 쾌적한 업무 공간을 구현하였습니다. 첨단 기술 기업의 정체성을 반영한 미래지향적 디자인이 특징입니다.",
    scope: ["공간 기획", "인테리어 설계", "서버룸 설계", "공조 시스템", "시공 관리"],
    challenge: "서버룸의 냉각 요구사항과 일반 오피스의 쾌적성을 동시에 충족하는 공조 시스템이 필요했습니다.",
    solution: "서버룸 전용 냉각 시스템과 오피스 공조를 분리 설계하고, 이중 바닥 시스템을 도입하여 케이블 관리와 공기 순환을 최적화하였습니다.",
    highlights: ["서버룸-오피스 분리 공조 시스템", "이중 바닥 케이블 관리 시스템", "미래지향적 테크 기업 디자인"],
    testimonial: { text: "서버룸과 오피스가 같은 층에 있는데도 소음과 온도 문제가 전혀 없습니다. 전문적인 설계 덕분입니다.", author: "정CTO", role: "휴레이 기술이사" },
  },

  {
    slug: "sba-setec",
    name: "SBA/SETEC",
    nameEn: "SBA/SETEC",
    category: "공공기관",
    majorCategory: "관급공사",
    area: "400㎡ (121평)",
    year: "2022",
    duration: "14주",
    location: "서울 강남구",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/98603122/FiNBIDGgyXtIAQQm.jpeg",
    description: "서울산업진흥원(SBA) SETEC 전시장 내 사무 공간을 리모델링하였습니다. 공공기관의 격식과 전시장 운영의 실용성을 모두 충족하는 공간을 설계하였습니다. 미니멀한 디자인 언어와 효율적인 동선이 공공 서비스의 품격을 높입니다.",
    scope: ["공간 기획", "인테리어 설계", "전시 연계 설계", "가구 조달", "시공 관리"],
    challenge: "전시장 운영 중에도 공사를 진행해야 하는 제약 조건이 있었습니다.",
    solution: "공사를 3단계로 분할하여 전시 일정에 영향을 최소화하고, 방음 가림막을 설치하여 운영 중 시공을 가능하게 하였습니다.",
    highlights: ["전시장 운영 중 3단계 분할 시공", "미니멀 공공기관 디자인 언어", "효율적 동선 설계"],
  },
  {
    slug: "factory-remodel",
    name: "제조시설 리모델링",
    nameEn: "Factory Remodeling",
    category: "산업시설",
    majorCategory: "산업시설",
    area: "600㎡ (181평)",
    year: "2022",
    duration: "16주",
    location: "경기도 화성시",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/98603122/OnwfoGXRjxDzWSjx.jpg",
    description: "기존 제조 시설을 현대적인 스마트 팩토리 오피스로 리모델링하였습니다. 생산 라인과 사무 공간이 유기적으로 연결되는 하이브리드 공간을 구현하였습니다. 높은 천장고를 살린 로프트 스타일이 산업 공간의 매력을 극대화합니다.",
    scope: ["공간 기획", "구조 보강", "인테리어 설계", "설비 이전", "시공 관리"],
    challenge: "노후 건물의 구조적 제약과 기존 설비 이전 문제를 해결해야 했습니다.",
    solution: "구조 엔지니어와 협업하여 보강 설계를 진행하고, 설비 이전 일정을 공사 일정과 동기화하여 다운타임을 최소화하였습니다.",
    highlights: ["노후 건물 구조 보강 설계", "로프트 스타일 산업 공간 디자인", "생산-사무 하이브리드 동선"],
  },
];

// 포트폴리오 배열 (순서 정렬) - 하위 호환용
export const PORTFOLIO = Object.fromEntries(PROJECTS.map(p => [p.slug.replace(/-/g, ""), { name: p.name, category: p.category, area: p.area.split(" ")[0], image: p.image }])) as Record<string, { name: string; category: string; area: string; image: string }>;

export const PORTFOLIO_LIST = PROJECTS.map(p => ({
  name: p.name,
  category: p.category,
  area: p.area.split(" ")[0],
  image: p.image,
}));
