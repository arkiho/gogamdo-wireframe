/*
 * DESIGN: Precision Studio — Portfolio Page
 * Neurodesign: Social proof, before/after contrast
 * Sections: Hero → Filter → Project Grid → CTA
 * 
 * 정적 프로젝트(PROJECTS)와 DB에서 게시된 포트폴리오를 합쳐서 표시
 */

import { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { PROJECTS } from "@/lib/images";
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

const CATEGORIES = ["전체", "사무실 인테리어", "크리에이티브 오피스", "크리에이티브 스튜디오", "글로벌 기업 오피스", "공공기관", "헬스케어 오피스", "IT 오피스", "산업시설"];

// Unified project type for display
type DisplayProject = {
  id: string;
  name: string;
  category: string;
  area: string;
  year: string;
  image: string;
  href: string;
  source: "static" | "db";
};

export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState("전체");
  
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
      area: p.area.split(" ")[0],
      year: p.year,
      image: p.image,
      href: `/portfolio/${p.slug}`,
      source: "static" as const,
    }));

    const dbProjects: DisplayProject[] = (publishedPortfolios.data || []).map((p: any) => ({
      id: `db-${p.id}`,
      name: p.title,
      category: p.category || "기타",
      area: p.area || "",
      year: p.createdAt ? new Date(p.createdAt).getFullYear().toString() : new Date().getFullYear().toString(),
      image: p.coverImage || "",
      href: `/portfolio/p/${p.id}`,
      source: "db" as const,
    }));

    // DB projects first (newest), then static
    return [...dbProjects, ...staticProjects];
  }, [publishedPortfolios.data]);

  const filtered = activeCategory === "전체"
    ? allProjects
    : allProjects.filter((p) => p.category === activeCategory);

  return (
    <>
      <SEOHead {...SEO_CONFIG.portfolio} />
      {/* Hero */}
      <section className="pt-32 lg:pt-40 pb-12 lg:pb-16">
        <div className="container">
          <FadeUp>
            <p className="text-xs font-medium tracking-widest uppercase text-gold mb-6">
              Projects
            </p>
            <h1 className="font-heading text-4xl lg:text-6xl font-bold text-ink leading-tight mb-8 max-w-3xl">
              150건 이상의
              <br />프로젝트가 증명합니다
            </h1>
          </FadeUp>
        </div>
      </section>

      {/* Filter */}
      <section className="pb-12">
        <div className="container">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  activeCategory === cat
                    ? "bg-ink text-white"
                    : "bg-paper-warm text-ink/60 hover:text-ink"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="pb-20 lg:pb-28">
        <div className="container">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
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
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 bg-ink text-white">
        <div className="container text-center">
          <FadeUp>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold mb-6">
              다음 프로젝트의 주인공이 되세요
            </h2>
            <p className="text-white/50 mb-10 max-w-md mx-auto">
              AI 견적으로 예상 비용을 확인하고, 전문 컨설턴트와 무료 상담을 시작하세요.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/estimator">
                <span className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-ink font-semibold text-sm tracking-wide hover:bg-gold-light transition-all duration-300">
                  AI 예상 견적 받기
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </Link>
              <Link href="/contact">
                <span className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white font-medium text-sm tracking-wide hover:bg-white/10 transition-all duration-300">
                  무료 상담 신청
                </span>
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>
    </>
  );
}
