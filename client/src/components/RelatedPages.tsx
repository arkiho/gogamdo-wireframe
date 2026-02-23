/*
 * Related Pages Component — SEO 내부 링크 강화
 * 현재 페이지와 관련된 다른 페이지를 추천하여 내부 링크를 강화합니다.
 * AI 서비스 OFF 시 AI 관련 페이지는 자동으로 숨겨집니다.
 */

import { Link, useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface RelatedPage {
  label: string;
  href: string;
  description: string;
  /** Which AI service this page requires (undefined = always visible) */
  aiService?: "estimator" | "chat" | "style" | "redesign";
}

const ALL_PAGES: RelatedPage[] = [
  { label: "AI 견적", href: "/estimator", description: "30초 만에 예상 비용을 무료로 확인하세요", aiService: "estimator" },
  { label: "AI 상담", href: "/ai-chat", description: "24시간 AI 인테리어 상담사와 대화하세요", aiService: "chat" },
  { label: "AI 스타일", href: "/ai-style", description: "맞춤 인테리어 스타일을 추천받으세요", aiService: "style" },
  // { label: "프로젝트", href: "/portfolio", description: "35년간 2,800건 이상의 완료 프로젝트를 확인하세요" }, // 임시 숨김
  { label: "솔루션", href: "/solutions", description: "설계부터 시공까지 원스톱 솔루션" },
  { label: "FAQ", href: "/faq", description: "자주 묻는 질문과 답변을 확인하세요" },
  { label: "무료 상담", href: "/contact", description: "전문 컨설턴트와 무료 상담을 시작하세요" },
  { label: "자료실", href: "/resources", description: "인테리어 가이드와 체크리스트를 다운로드하세요" },
];

// AI 관련 href → 서비스 매핑
const AI_HREF_SERVICE: Record<string, "estimator" | "chat" | "style" | "redesign"> = {
  "/estimator": "estimator",
  "/ai-chat": "chat",
  "/ai-style": "style",
  "/ai-redesign": "redesign",
};

// 페이지별 관련 페이지 매핑
const RELATED_MAP: Record<string, string[]> = {
  "/about": ["/solutions", "/contact", "/faq"],
  "/solutions": ["/estimator", "/contact", "/faq"],
  // "/portfolio": ["/estimator", "/solutions", "/contact"], // 임시 숨김
  "/estimator": ["/ai-chat", "/ai-style", "/contact"],
  "/insights": ["/resources", "/faq", "/ai-chat"],
  "/resources": ["/estimator", "/insights", "/faq"],
  "/ai-chat": ["/estimator", "/ai-style", "/faq"],
  "/ai-style": ["/ai-chat", "/estimator", "/solutions"],
  "/faq": ["/ai-chat", "/estimator", "/contact"],
  "/contact": ["/estimator", "/ai-chat", "/faq"],
};

// 비 AI 대체 페이지 풀
const NON_AI_FALLBACKS = ["/solutions", "/contact", "/faq", "/resources"]; // /portfolio 임시 제거

export default function RelatedPages() {
  const [location] = useLocation();
  const { data: aiSetting } = trpc.settings.aiEnabled.useQuery(undefined, {
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const aiEnabled = aiSetting?.enabled ?? true;
  const serviceFlags: Record<string, boolean> = {
    estimator: aiEnabled && (aiSetting?.estimator ?? true),
    chat: aiEnabled && (aiSetting?.chat ?? true),
    style: aiEnabled && (aiSetting?.style ?? true),
    redesign: aiEnabled && (aiSetting?.redesign ?? true),
  };

  // 해당 href가 현재 활성화된 서비스인지 확인
  const isHrefAvailable = (href: string): boolean => {
    const service = AI_HREF_SERVICE[href];
    if (!service) return true; // 비 AI 페이지는 항상 사용 가능
    return serviceFlags[service];
  };

  // 관련 페이지 후보 결정
  let relatedHrefs = RELATED_MAP[location] || ["/estimator", "/ai-chat", "/contact"];

  // 비활성화된 AI 서비스 페이지 제거
  relatedHrefs = relatedHrefs.filter(isHrefAvailable);

  // 3개 미만이면 비 AI 페이지에서 보충
  if (relatedHrefs.length < 3) {
    for (const href of NON_AI_FALLBACKS) {
      if (!relatedHrefs.includes(href) && href !== location && relatedHrefs.length < 3) {
        relatedHrefs.push(href);
      }
    }
  }

  // 사용 가능한 페이지만 필터링
  const availablePages = ALL_PAGES.filter((p) => {
    if (!p.aiService) return true;
    return serviceFlags[p.aiService];
  });
  const related = relatedHrefs
    .map((href) => availablePages.find((p) => p.href === href))
    .filter(Boolean) as RelatedPage[];

  if (related.length === 0) return null;

  return (
    <section className="py-12 lg:py-16 border-t border-border/50">
      <div className="container">
        <p className="text-xs font-medium tracking-widest uppercase text-gold mb-6">
          Related Pages
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {related.map((page) => (
            <Link key={page.href} href={page.href}>
              <div className="group p-5 border border-border/50 hover:border-gold/30 transition-all duration-300 cursor-pointer bg-white">
                <h3 className="font-heading font-semibold text-ink text-sm mb-1 group-hover:text-gold transition-colors">
                  {page.label}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  {page.description}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                  바로가기 <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
