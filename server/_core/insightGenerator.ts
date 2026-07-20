/**
 * 인사이트 아티클 생성 공유 로직
 * - HTTP 엔드포인트(scheduledInsight.ts)와 서버 내부 스케줄러(insightScheduler.ts)가
 *   동일한 생성 로직을 공유하도록 추출한 모듈입니다.
 */
import { invokeLLM } from "./llm";
import { generateImage } from "./imageGeneration";
import { createInsightArticle } from "../db";

// SEO/AEO/GEO 최적화 키워드 풀
export const SEO_KEYWORDS = [
  "사무실 인테리어",
  "오피스 리모델링",
  "사무공간 설계",
  "기업 인테리어",
  "상업공간 인테리어",
  "사무실 이전",
  "오피스 디자인",
  "업무환경 개선",
  "사무실 인테리어 비용",
  "사무실 인테리어 업체",
  "오피스 공간 최적화",
  "스타트업 사무실",
  "기업 이전 인테리어",
  "사무실 리뉴얼",
  "인테리어 트렌드",
];

export const TARGET_AUDIENCES = [
  "스타트업 대표",
  "총무팀 담당자",
  "시설관리팀",
  "기업이전 수요기업 경영진",
  "HR 담당자",
  "경영지원부",
];

export const INSIGHT_CATEGORIES = ["trend", "cost_guide", "case_study", "tip", "news"] as const;
export type InsightCategory = (typeof INSIGHT_CATEGORIES)[number];

export interface GenerateInsightOptions {
  topic?: string;
  category?: string;
  targetAudience?: string;
  trendContext?: string;
  keywords?: string[];
  /** true면 즉시 발행(published), false면 초안(draft) */
  publish?: boolean;
}

export interface GenerateInsightResult {
  articleId: number | string | null;
  slug: string;
  title: string;
  category: InsightCategory;
  status: "published" | "draft";
}

/** LLM으로 인사이트 아티클을 생성하고 커버 이미지를 만들어 DB에 저장합니다. */
export async function generateAndSaveInsight(
  opts: GenerateInsightOptions = {}
): Promise<GenerateInsightResult> {
  const { topic, category, targetAudience, trendContext, keywords } = opts;
  const publishNow = opts.publish !== false; // 기본값: 발행

  // 카테고리 결정 (미지정 시 랜덤)
  const selectedCategory: InsightCategory =
    category && (INSIGHT_CATEGORIES as readonly string[]).includes(category)
      ? (category as InsightCategory)
      : INSIGHT_CATEGORIES[Math.floor(Math.random() * INSIGHT_CATEGORIES.length)];

  const categoryLabels: Record<string, string> = {
    trend: "인테리어 트렌드",
    cost_guide: "비용 가이드",
    case_study: "사례 연구",
    tip: "실용 팁",
    news: "업계 뉴스",
  };
  const catLabel = categoryLabels[selectedCategory] || "인테리어";

  const audience =
    targetAudience || TARGET_AUDIENCES[Math.floor(Math.random() * TARGET_AUDIENCES.length)];

  const selectedKeywords =
    keywords?.length ? keywords : SEO_KEYWORDS.slice().sort(() => Math.random() - 0.5).slice(0, 3);

  const topicInstruction = topic
    ? `주제: ${topic}`
    : `${catLabel} 분야에서 ${audience}에게 유용한 최신 주제를 선정해주세요.`;

  const trendInfo = trendContext ? `\n\n[최신 트렌드 리서치 결과]\n${trendContext}` : "";

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `당신은 (주)고감도 인테리어(kokamdo.co.kr)의 전문 콘텐츠 에디터입니다.

[역할]
- 사무실 인테리어, 상업공간 디자인, 공간 최적화 분야의 전문 콘텐츠를 작성합니다.
- B2B 독자(${audience})를 위한 전문적이면서도 읽기 쉬운 아티클을 작성합니다.

[SEO/AEO/GEO 최적화 지침]
- 핵심 키워드를 자연스럽게 본문에 3~5회 포함시키세요: ${selectedKeywords.join(", ")}
- 제목(H1)에 핵심 키워드를 반드시 포함하세요.
- 소제목(H2, H3)에도 관련 키워드를 배치하세요.
- 첫 문단에 핵심 키워드와 주제를 명확히 제시하세요.
- FAQ 형식의 섹션을 1~2개 포함하여 AEO(답변엔진최적화)에 대응하세요.
- 구체적인 수치, 통계, 사례를 포함하여 신뢰도를 높이세요.
- 내부 링크 유도: 글 말미에 "고감도 인테리어에서 무료 상담을 받아보세요" 등의 CTA를 자연스럽게 포함하세요.
- metaTitle은 60자 이내, metaDescription은 155자 이내로 작성하세요.

[콘텐츠 목적]
- 리드 생성: 잠재 고객이 검색을 통해 유입되어 상담 문의로 전환되도록 합니다.
- 전문성 어필: 고감도의 인테리어 전문성과 경험을 자연스럽게 녹여내세요.

[형식]
- 마크다운 형식으로 작성하되, 소제목(##), 불릿 포인트, 강조(**) 등을 활용하여 가독성을 높여주세요.
- 분량은 1500~2500자 정도로 작성합니다.
- 숫자 범위는 물결표 1개만 사용하세요. 예: "3~4주" (O), "3~~4주" (X). 물결표 2개(~~)는 취소선으로 렌더되니 절대 쓰지 마세요.
- 회사명 "(주)고감도" 또는 "고감도 인테리어"를 1~2회 자연스럽게 언급하세요.`,
      },
      {
        role: "user",
        content: `다음 조건으로 인테리어 인사이트 아티클을 작성해주세요.

카테고리: ${catLabel}
대상 독자: ${audience}
SEO 핵심 키워드: ${selectedKeywords.join(", ")}
${topicInstruction}${trendInfo}

반드시 아래 JSON 형식으로 응답해주세요:
{
  "title": "아티클 제목 (핵심 키워드 포함, 60자 이내)",
  "subtitle": "부제목",
  "excerpt": "2~3문장 요약 (검색 결과에 표시될 내용)",
  "content": "마크다운 본문 (1500~2500자, FAQ 섹션 포함)",
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"],
  "readTimeMinutes": 숫자,
  "metaTitle": "SEO 메타 타이틀 (60자 이내, 핵심 키워드 포함)",
  "metaDescription": "SEO 메타 디스크립션 (155자 이내, 행동 유도 문구 포함)"
}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "insight_article_generation",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "아티클 제목" },
            subtitle: { type: "string", description: "부제목" },
            excerpt: { type: "string", description: "2~3문장 요약" },
            content: { type: "string", description: "마크다운 본문" },
            tags: { type: "array", items: { type: "string" }, description: "태그 목록" },
            readTimeMinutes: { type: "integer", description: "예상 읽기 시간(분)" },
            metaTitle: { type: "string", description: "SEO 메타 타이틀" },
            metaDescription: { type: "string", description: "SEO 메타 디스크립션" },
          },
          required: ["title", "subtitle", "excerpt", "content", "tags", "readTimeMinutes", "metaTitle", "metaDescription"],
          additionalProperties: false,
        },
      },
    },
  });

  const parsed = JSON.parse(response.choices[0].message.content || "{}");

  // 물결표 2개(~~)로 인한 의도치 않은 취소선 방지 (숫자 범위 등)
  const stripDoubleTilde = (v: any) =>
    typeof v === "string" ? v.replace(/[～〜]/g, "~").replace(/~{2,}/g, "~") : v;
  parsed.content = stripDoubleTilde(parsed.content);
  parsed.excerpt = stripDoubleTilde(parsed.excerpt);
  parsed.subtitle = stripDoubleTilde(parsed.subtitle);
  parsed.title = stripDoubleTilde(parsed.title);

  const slug =
    parsed.title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80) +
    "-" +
    Date.now().toString(36);

  let coverImageUrl: string | null = null;
  try {
    const imgResult = await generateImage({
      prompt: `Professional editorial cover image for an interior design article titled "${parsed.title}". Modern office interior, architectural photography style, warm lighting, high-end commercial space. Minimalist composition with strong visual impact. No text overlay.`,
    });
    coverImageUrl = imgResult.url ?? null;
  } catch (err) {
    console.error("[InsightGenerator] Cover image generation failed:", err);
  }

  const articleId = await createInsightArticle({
    slug,
    title: parsed.title,
    subtitle: parsed.subtitle,
    category: selectedCategory,
    excerpt: parsed.excerpt,
    content: parsed.content,
    coverImageUrl,
    author: "고감도",
    readTimeMinutes: parsed.readTimeMinutes || 5,
    tags: parsed.tags || [],
    metaTitle: parsed.metaTitle || null,
    metaDescription: parsed.metaDescription || null,
    isAiGenerated: true,
    featured: false,
    status: publishNow ? "published" : "draft",
    publishedAt: publishNow ? new Date() : null,
  } as any);

  console.log(
    `[InsightGenerator] Article created: id=${articleId}, status=${publishNow ? "published" : "draft"}, title="${parsed.title}"`
  );

  return {
    articleId,
    slug,
    title: parsed.title,
    category: selectedCategory,
    status: publishNow ? "published" : "draft",
  };
}
