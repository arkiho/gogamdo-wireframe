/*
 * Breadcrumb Component — SEO 내부 링크 강화
 * Schema.org BreadcrumbList 구조화 데이터 자동 삽입
 */

import { Link, useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  "/about": "회사소개",
  "/solutions": "솔루션",
  "/portfolio": "프로젝트",
  "/estimator": "AI 견적",
  "/insights": "인사이트",
  "/resources": "자료실",
  "/ai-chat": "AI 상담",
  "/ai-style": "AI 스타일",
  "/faq": "FAQ",
  "/contact": "문의하기",
};

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  const [location] = useLocation();

  // 자동 생성 또는 수동 지정
  const breadcrumbs: BreadcrumbItem[] = items || [
    { label: "홈", href: "/" },
    ...(ROUTE_LABELS[location]
      ? [{ label: ROUTE_LABELS[location] }]
      : []),
  ];

  if (breadcrumbs.length <= 1) return null;

  // Schema.org BreadcrumbList
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `https://kokamdo.co.kr${item.href}` } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <nav
        aria-label="브레드크럼"
        className={`flex items-center gap-1.5 text-xs text-muted-foreground ${className}`}
      >
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <span key={index} className="flex items-center gap-1.5">
              {index > 0 && <ChevronRight className="w-3 h-3 opacity-40" />}
              {item.href && !isLast ? (
                <Link href={item.href}>
                  <span className="hover:text-gold transition-colors cursor-pointer flex items-center gap-1">
                    {index === 0 && <Home className="w-3 h-3" />}
                    {item.label}
                  </span>
                </Link>
              ) : (
                <span className={isLast ? "text-ink font-medium" : ""}>
                  {item.label}
                </span>
              )}
            </span>
          );
        })}
      </nav>
    </>
  );
}
