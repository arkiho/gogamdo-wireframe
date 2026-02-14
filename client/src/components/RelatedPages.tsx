/*
 * Related Pages Component — SEO 내부 링크 강화
 * 현재 페이지와 관련된 다른 페이지를 추천하여 내부 링크를 강화합니다.
 */

import { Link, useLocation } from "wouter";
import { ArrowRight } from "lucide-react";

interface RelatedPage {
  label: string;
  href: string;
  description: string;
}

const ALL_PAGES: RelatedPage[] = [
  { label: "AI 견적", href: "/estimator", description: "30초 만에 예상 비용을 무료로 확인하세요" },
  { label: "AI 상담", href: "/ai-chat", description: "24시간 AI 인테리어 상담사와 대화하세요" },
  { label: "AI 스타일", href: "/ai-style", description: "맞춤 인테리어 스타일을 추천받으세요" },
  { label: "프로젝트", href: "/portfolio", description: "35년간 2,800건 이상의 완료 프로젝트를 확인하세요" },
  { label: "솔루션", href: "/solutions", description: "설계부터 시공까지 원스톱 솔루션" },
  { label: "FAQ", href: "/faq", description: "자주 묻는 질문과 답변을 확인하세요" },
  { label: "무료 상담", href: "/contact", description: "전문 컨설턴트와 무료 상담을 시작하세요" },
  { label: "자료실", href: "/resources", description: "인테리어 가이드와 체크리스트를 다운로드하세요" },
];

// 페이지별 관련 페이지 매핑
const RELATED_MAP: Record<string, string[]> = {
  "/about": ["/portfolio", "/solutions", "/contact"],
  "/solutions": ["/estimator", "/portfolio", "/contact"],
  "/portfolio": ["/estimator", "/solutions", "/contact"],
  "/estimator": ["/ai-chat", "/ai-style", "/contact"],
  "/insights": ["/resources", "/faq", "/ai-chat"],
  "/resources": ["/estimator", "/insights", "/faq"],
  "/ai-chat": ["/estimator", "/ai-style", "/faq"],
  "/ai-style": ["/ai-chat", "/estimator", "/portfolio"],
  "/faq": ["/ai-chat", "/estimator", "/contact"],
  "/contact": ["/estimator", "/ai-chat", "/faq"],
};

export default function RelatedPages() {
  const [location] = useLocation();
  
  const relatedHrefs = RELATED_MAP[location] || ["/estimator", "/ai-chat", "/contact"];
  const related = relatedHrefs
    .map((href) => ALL_PAGES.find((p) => p.href === href))
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
