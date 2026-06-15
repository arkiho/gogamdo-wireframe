/*
 * DESIGN: Precision Studio — Portfolio Page
 * Neurodesign: Social proof, before/after contrast
 * Sections: Hero → Filter (대분류 + 세부) → Project Grid → CTA
 * 
 * 정적 프로젝트(PROJECTS)와 DB에서 게시된 포트폴리오를 합쳐서 표시
 */

import { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Building2, Store, HeartPulse, Factory, Shield, Phone } from "lucide-react";
import { PROJECTS, MAJOR_CATEGORIES, CATEGORY_MAP, type MajorCategory } from "@/lib/images";
import { trpc } from "@/lib/trpc";
import SEOHead, { SEO_CONFIG } from "@/components/SEOHead";

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 대분류 아이콘 매핑
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "오피스": <Building2 className="w-4 h-4" />,
  "산업시설": <Factory className="w-4 h-4" />,
  "병원": <HeartPulse className="w-4 h-4" />,
  "관급공사": <Shield className="w-4 h-4" />,
  "리테일": <Store className="w-4 h-4" />,
};

// 대분류별 설명 텍스트
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "전체": "고객사로부터 공개 승인을 받은 프로젝트만 선별하여 소개합니다.",
  "오피스": "스타트업부터 글로벌 기업까지, 업무 효율과 기업 문화를 반영한 맞춤형 오피스 인테리어",
  "산업시설": "제조 시설, 스마트 팩토리 등 산업 공간의 효율성과 안전성을 극대화하는 설계",
  "병원": "환자와 이용자의 심리적 안정을 고려한 치유적 의료 공간 디자인",
  "관급공사": "공공기관, 교육시설 등 공공성과 기능성을 겸비한 공간 설계",
  "리테일": "매장, F&B, 코워킹 등 고객 경험을 극대화하는 상업 공간 설계",
};

// Unified project type for display
type DisplayProject = {
  id: string;
  name: string;
  category: string;
  majorCategory: MajorCategory;
  area: string;
  year: string;
  image: string;
  href: string;
  source: "static" | "db";
};

export default function Portfolio() {
  const [activeMajor, setActiveMajor] = useState<MajorCategory>("전체");
  const [activeSub, setActiveSub] = useState<string | null>(null);
  
  // Fetch published portfolios from DB
  const publishedPortfolios = trpc.portfolio.published.useQuery(undefined, {
    staleTime: 60_000,
  });

  // Merge static + DB projects
  const allProjects = useMemo<DisplayProject[]>(() => {
    const staticProjects: DisplayProject[] = PROJECTS.map(p => ({
      id: `static-${p.slug}`,
      name: p.name,
      category: p.category,
      majorCategory: p.majorCategory,
      area: p.area.split(" ")[0],
      year: p.year,
      image: p.image,
      href: `/portfolio/${p.slug}`,
      source: "static" as const,
    }));

    const dbProjects: DisplayProject[] = (publishedPortfolios.data || []).map((p: any) => {
      const cat = p.category || "기타";
      const major = CATEGORY_MAP[cat] || "사무 공간";
      return {
        id: `db-${p.id}`,
        name: p.title,
        category: cat,
        majorCategory: major,
        area: p.area || "",
        year: p.createdAt ? new Date(p.createdAt).getFullYear().toString() : new Date().getFullYear().toString(),
        image: p.coverImage || "",
        href: `/portfolio/p/${p.id}`,
        source: "db" as const,
      };
    });

    // DB projects first (newest), then static
    return [...dbProjects, ...staticProjects];
  }, [publishedPortfolios.data]);

  // 현재 대분류에 속하는 세부 카테고리 목록 (실제 프로젝트가 있는 것만)
  const availableSubCategories = useMemo(() => {
    if (activeMajor === "전체") return [];
    const subsInMajor = allProjects
      .filter(p => p.majorCategory === activeMajor)
      .map(p => p.category);
    return [...new Set(subsInMajor)];
  }, [activeMajor, allProjects]);

  // 필터링 로직
  const filtered = useMemo(() => {
    let result = allProjects;
    if (activeMajor !== "전체") {
      result = result.filter(p => p.majorCategory === activeMajor);
    }
    if (activeSub) {
      result = result.filter(p => p.category === activeSub);
    }
    return result;
  }, [allProjects, activeMajor, activeSub]);

  // 대분류별 프로젝트 수
  const majorCounts = useMemo(() => {
    const counts: Record<string, number> = { "전체": allProjects.length };
    for (const p of allProjects) {
      counts[p.majorCategory] = (counts[p.majorCategory] || 0) + 1;
    }
    return counts;
  }, [allProjects]);

  const handleMajorChange = (cat: MajorCategory) => {
    setActiveMajor(cat);
    setActiveSub(null); // 대분류 변경 시 세부 필터 초기화
  };

  return (
    <>
      <SEOHead {...SEO_CONFIG.portfolio} />
      {/* Hero */}
      <section className="pt-32 lg:pt-40 pb-12 lg:pb-16">
        <div className="container">
          <FadeUp>
            <p className="text-xs font-medium tracking-widest uppercase text-gold mb-6">
              Client Cases
            </p>
            <h1 className="font-heading text-4xl lg:text-6xl font-bold text-ink leading-tight mb-4 max-w-3xl">
              고객 사례
            </h1>
            <p className="text-muted-foreground max-w-xl text-base lg:text-lg leading-relaxed">
              {CATEGORY_DESCRIPTIONS[activeMajor]}
            </p>
          </FadeUp>

          {/* 보안 비공개 원칙 안내 */}
          <FadeUp delay={0.15}>
            <div className="mt-8 p-5 lg:p-6 border border-border/60 bg-paper-warm/50 max-w-2xl">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-ink mb-1">
                    고객사 보안 비공개 원칙
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    고감도는 고객사의 내부 공간 정보를 철저히 보호합니다.
                    본 페이지에는 고객사로부터 공개 승인을 받은 프로젝트만 게재되어 있으며,
                    더 많은 사례는 대면 상담 시 확인하실 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* 대분류 필터 */}
      <section className="pb-4">
        <div className="container">
          <div className="flex gap-3 flex-wrap">
            {MAJOR_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleMajorChange(cat)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all duration-300 border ${
                  activeMajor === cat
                    ? "bg-ink text-white border-ink"
                    : "bg-transparent text-ink/60 border-border hover:text-ink hover:border-ink/30"
                }`}
              >
                {cat !== "전체" && CATEGORY_ICONS[cat]}
                <span>{cat}</span>
                <span className={`text-xs ml-1 ${
                  activeMajor === cat ? "text-white/60" : "text-muted-foreground"
                }`}>
                  {majorCounts[cat] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 세부 카테고리 필터 (대분류 선택 시에만 표시) */}
      <AnimatePresence>
        {availableSubCategories.length > 0 && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="pb-8 overflow-hidden"
          >
            <div className="container">
              <div className="flex gap-2 flex-wrap pt-3 border-t border-border/50">
                <button
                  onClick={() => setActiveSub(null)}
                  className={`px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
                    activeSub === null
                      ? "bg-gold/10 text-gold border border-gold/30"
                      : "text-muted-foreground hover:text-ink"
                  }`}
                >
                  전체 보기
                </button>
                {availableSubCategories.map((sub) => {
                  const count = allProjects.filter(p => p.category === sub).length;
                  return (
                    <button
                      key={sub}
                      onClick={() => setActiveSub(activeSub === sub ? null : sub)}
                      className={`px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
                        activeSub === sub
                          ? "bg-gold/10 text-gold border border-gold/30"
                          : "text-muted-foreground hover:text-ink"
                      }`}
                    >
                      {sub}
                      <span className="ml-1 text-[10px] opacity-60">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 결과 수 표시 */}
      <section className="pb-6">
        <div className="container">
          <p className="text-sm text-muted-foreground">
            {activeMajor !== "전체" || activeSub ? (
              <>
                <span className="font-medium text-ink">{filtered.length}</span>개 프로젝트
                {activeSub && <span className="ml-1">· {activeSub}</span>}
              </>
            ) : (
              <>전체 <span className="font-medium text-ink">{allProjects.length}</span>개 프로젝트</>
            )}
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="pb-20 lg:pb-28">
        <div className="container">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeMajor}-${activeSub}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filtered.map((project) => (
                <Link key={project.id} href={project.href}>
                  <div className="group cursor-pointer">
                    <div className="relative overflow-hidden aspect-[4/3] mb-4 bg-paper-warm">
                      {project.image ? (
                        <img
                          src={project.image}
                          alt={project.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-muted-foreground/30 font-heading text-2xl font-bold">{project.name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
                      <div className="absolute bottom-3 right-3 w-8 h-8 bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ArrowUpRight className="w-4 h-4 text-ink" />
                      </div>
                      {project.source === "db" && (
                        <div className="absolute top-3 left-3">
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-gold/90 text-ink rounded-full">NEW</span>
                        </div>
                      )}
                      {/* 대분류 배지 */}
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-white/90 text-ink/70 backdrop-blur-sm">
                          {project.majorCategory}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-medium text-gold">{project.category}</span>
                      {project.area && <span className="text-xs text-muted-foreground">{project.area}</span>}
                      <span className="text-xs text-muted-foreground">{project.year}</span>
                    </div>
                    <h3 className="font-heading text-lg font-bold text-ink group-hover:text-gold transition-colors">
                      {project.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* 빈 결과 */}
          {filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg mb-2">해당 카테고리의 프로젝트가 아직 없습니다.</p>
              <button
                onClick={() => handleMajorChange("전체")}
                className="text-gold font-medium text-sm hover:underline"
              >
                전체 프로젝트 보기
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 상담 유도 CTA */}
      <section className="py-20 lg:py-28 bg-ink text-white">
        <div className="container text-center">
          <FadeUp>
            <Shield className="w-10 h-10 text-gold mx-auto mb-6" />
            <h2 className="font-heading text-3xl lg:text-5xl font-bold mb-6">
              더 많은 사례가 궁금하신가요?
            </h2>
            <p className="text-white/50 mb-4 max-w-lg mx-auto leading-relaxed">
              고감도는 고객사의 보안을 최우선으로 하기에,
              온라인에 공개할 수 있는 사례는 제한적입니다.
            </p>
            <p className="text-white/40 mb-10 max-w-lg mx-auto text-sm leading-relaxed">
              대면 상담 시 고객사로부터 승인받은 다양한 프로젝트 사례를
              직접 확인하실 수 있습니다.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact">
                <span className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-ink font-semibold text-sm tracking-wide hover:bg-gold-light transition-all duration-300">
                  <Phone className="w-4 h-4" />
                  무료 상담 신청
                </span>
              </Link>
              <Link href="/estimator">
                <span className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white font-medium text-sm tracking-wide hover:bg-white/10 transition-all duration-300">
                  AI 예상 견적 받기
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>
    </>
  );
}
