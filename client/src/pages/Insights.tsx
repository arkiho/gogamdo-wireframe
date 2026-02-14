/*
 * DESIGN: Precision Studio — Insights Page
 * Content hub: Blog articles, trend reports, newsletter signup
 * Neurodesign: Information density rhythm, progressive disclosure
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Tag, Mail } from "lucide-react";
import { toast } from "sonner";
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

const CATEGORIES = ["전체", "트렌드", "비용 가이드", "사례 분석", "팁"];

const ARTICLES = [
  {
    title: "2026 사무공간 트렌드: 하이브리드 워크를 위한 공간 설계",
    category: "트렌드",
    date: "2026.02.10",
    readTime: "5분",
    excerpt: "하이브리드 근무 환경에서 효율적인 공간 활용을 위한 최신 설계 트렌드를 분석합니다.",
    featured: true,
  },
  {
    title: "사무실 인테리어 비용, 얼마나 들까? 평당 단가 완벽 가이드",
    category: "비용 가이드",
    date: "2026.01.28",
    readTime: "8분",
    excerpt: "마감재 등급별 평당 단가부터 숨겨진 비용 항목까지, 사무실 인테리어 예산 수립의 모든 것.",
    featured: true,
  },
  {
    title: "직원 만족도를 높이는 사무실 조명 설계 5가지 원칙",
    category: "팁",
    date: "2026.01.15",
    readTime: "4분",
    excerpt: "자연광 활용부터 색온도 설정까지, 과학적 근거에 기반한 사무실 조명 가이드.",
    featured: false,
  },
  {
    title: "승일일렉트로닉스 본사 리모델링 프로젝트 스토리",
    category: "사례 분석",
    date: "2025.12.20",
    readTime: "6분",
    excerpt: "330㎡ 사무공간을 8주 만에 완성한 프로젝트의 기획부터 시공까지 전 과정을 공개합니다.",
    featured: false,
  },
  {
    title: "소음 없는 사무실 만들기: 어쿠스틱 설계 가이드",
    category: "팁",
    date: "2025.12.05",
    readTime: "5분",
    excerpt: "흡음재, 차음벽, 사운드 마스킹까지. 집중력을 높이는 음향 환경 설계법.",
    featured: false,
  },
  {
    title: "ESG 시대의 친환경 사무실 인테리어",
    category: "트렌드",
    date: "2025.11.18",
    readTime: "7분",
    excerpt: "LEED 인증, 재활용 소재, 에너지 효율. 지속가능한 사무공간 설계의 실전 가이드.",
    featured: false,
  },
];

export default function Insights() {
  const [activeCategory, setActiveCategory] = useState("전체");

  const filtered = activeCategory === "전체"
    ? ARTICLES
    : ARTICLES.filter((a) => a.category === activeCategory);

  const featuredArticles = filtered.filter((a) => a.featured);
  const regularArticles = filtered.filter((a) => !a.featured);

  return (
    <>
      <SEOHead {...SEO_CONFIG.insights} />
      {/* Hero */}
      <section className="pt-32 lg:pt-40 pb-12 lg:pb-16">
        <div className="container">
          <FadeUp>
            <p className="text-xs font-medium tracking-widest uppercase text-gold mb-6">
              Insights
            </p>
            <h1 className="font-heading text-4xl lg:text-6xl font-bold text-ink leading-tight mb-8 max-w-3xl">
              공간에 대한
              <br />인사이트
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              사무공간 트렌드, 비용 가이드, 프로젝트 사례 등 유용한 정보를 제공합니다.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="pb-12">
        <div className="container">
          <FadeUp>
            <div className="p-6 lg:p-8 bg-paper-warm border border-border/50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-gold mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-heading text-lg font-bold text-ink mb-1">격주 뉴스레터 구독</h3>
                  <p className="text-sm text-muted-foreground">최신 트렌드와 비용 절감 팁을 이메일로 받아보세요.</p>
                </div>
              </div>
              <form
                className="flex w-full lg:w-auto gap-0"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("구독이 완료되었습니다!");
                }}
              >
                <input
                  type="email"
                  placeholder="이메일 주소"
                  className="flex-1 lg:w-64 px-4 py-2.5 border border-border bg-white text-sm focus:outline-none focus:border-gold transition-colors"
                  required
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-ink text-white text-sm font-medium hover:bg-ink/90 transition-colors whitespace-nowrap"
                >
                  구독
                </button>
              </form>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Filter */}
      <section className="pb-8">
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

      {/* Featured Articles */}
      {featuredArticles.length > 0 && (
        <section className="pb-12">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-6">
              {featuredArticles.map((article, i) => (
                <FadeUp key={i} delay={i * 0.1}>
                  <div className="group p-8 lg:p-10 border border-border/50 hover:border-gold/30 transition-all duration-500 cursor-pointer h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-2 py-0.5 text-xs font-medium bg-gold/10 text-gold">
                        {article.category}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {article.readTime}
                      </span>
                    </div>
                    <h2 className="font-heading text-xl lg:text-2xl font-bold text-ink mb-3 group-hover:text-gold transition-colors duration-300 flex-1">
                      {article.title}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{article.date}</span>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                        읽기 <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Regular Articles */}
      <section className="pb-20 lg:pb-28">
        <div className="container">
          <div className="space-y-0">
            {regularArticles.map((article, i) => (
              <FadeUp key={i} delay={i * 0.05}>
                <div className="group py-6 border-b border-border/50 hover:border-gold/30 transition-colors cursor-pointer flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Tag className="w-3 h-3" /> {article.category}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {article.readTime}
                      </span>
                    </div>
                    <h3 className="font-heading text-lg font-bold text-ink group-hover:text-gold transition-colors duration-300 mb-1">
                      {article.title}
                    </h3>
                    <p className="text-sm text-muted-foreground hidden sm:block">{article.excerpt}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap mt-1">{article.date}</span>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
