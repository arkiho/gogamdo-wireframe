/**
 * 네이버 블로그용 초안 생성기 (반자동)
 * 홈페이지 인사이트/고객사례 데이터로 붙여넣기 좋은 블로그 글 초안을 만듭니다.
 * 원문 전체가 아니라 "요약 + 원문 링크"로 구성해 중복 콘텐츠를 피합니다.
 */

const BASE_URL = "https://kokamdo.co.kr";

const DEFAULT_TAGS = ["사무실인테리어", "오피스인테리어", "사무공간설계", "고감도", "오피스디자인"];

function toHashtags(tags: (string | null | undefined)[]): string {
  const cleaned = tags
    .concat(DEFAULT_TAGS)
    .filter((t): t is string => !!t)
    .map((t) => "#" + t.replace(/[\s#]/g, ""))
    .filter((t) => t.length > 1);
  // 중복 제거 (최대 12개)
  return Array.from(new Set(cleaned)).slice(0, 12).join(" ");
}

/** 마크다운 본문에서 H2(##) 소제목을 추출합니다. */
function extractHeadings(content: string | null | undefined): string[] {
  if (!content) return [];
  const matches = content.match(/^##\s+(.+)$/gm) || [];
  return matches.map((h) => h.replace(/^##\s+/, "").replace(/[*_`~]/g, "").trim()).filter(Boolean);
}

export interface InsightLike {
  title: string;
  excerpt?: string | null;
  content?: string | null;
  slug: string;
  tags?: string[] | null;
  category?: string | null;
}

/** 인사이트 글 → 네이버 블로그 초안 */
export function buildInsightBlogDraft(a: InsightLike): string {
  const headings = extractHeadings(a.content).slice(0, 5);
  const teaser =
    headings.length > 0
      ? "\n📌 이런 내용을 다룹니다\n" + headings.map((h) => `· ${h}`).join("\n") + "\n"
      : "";

  const lines = [
    a.title,
    "",
    (a.excerpt || "").trim(),
    teaser,
    "👉 전체 내용은 고감도 홈페이지에서 확인하세요",
    `${BASE_URL}/insights/${a.slug}`,
    "",
    toHashtags(a.tags || []),
  ];
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export interface PortfolioLike {
  id: number | string;
  title: string;
  category?: string | null;
  area?: string | null;
  location?: string | null;
  duration?: string | null;
  client?: string | null;
  description?: string | null;
  aiDescription?: string | null;
  challenge?: string | null;
  solution?: string | null;
  result?: string | null;
  tags?: string[] | null;
}

/** 고객사례(포트폴리오) → 네이버 블로그 초안 */
export function buildPortfolioBlogDraft(p: PortfolioLike): string {
  const headParts = [p.location, p.area].filter(Boolean).join(" ");
  const heading = headParts
    ? `${p.title} | ${headParts} 사무실 인테리어 시공 사례`
    : `${p.title} | 사무실 인테리어 시공 사례`;

  const spec = [
    p.location ? `▪ 위치: ${p.location}` : "",
    p.area ? `▪ 면적: ${p.area}` : "",
    p.category ? `▪ 공종: ${p.category}` : "",
    p.duration ? `▪ 기간: ${p.duration}` : "",
  ].filter(Boolean).join("\n");

  const body = [
    p.challenge ? `[현장 과제]\n${p.challenge.trim()}` : "",
    p.solution ? `[해결 방법]\n${p.solution.trim()}` : "",
    p.result ? `[결과]\n${p.result.trim()}` : "",
  ].filter(Boolean).join("\n\n");

  const intro = (p.description || p.aiDescription || "").trim();

  const regionTag = p.location ? p.location.split(" ")[0].replace(/[^가-힣a-zA-Z0-9]/g, "") : "";
  const tags = toHashtags([regionTag, p.category, "인테리어시공사례", ...(p.tags || [])]);

  const lines = [
    heading,
    "",
    intro,
    "",
    spec,
    "",
    body,
    "",
    "📷 전후 사진과 상세 내용은 고감도 홈페이지에서 확인하세요",
    `${BASE_URL}/portfolio/p/${p.id}`,
    "",
    tags,
  ];
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
