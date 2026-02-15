/*
 * DESIGN: Precision Studio — Insights Page
 * Content hub: DB-driven blog articles, trend reports, newsletter signup
 * Neurodesign: Information density rhythm, progressive disclosure
 */

import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Tag, Mail, Loader2, BookOpen, Eye } from "lucide-react";
import { toast } from "sonner";
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

const CATEGORY_MAP: Record<string, string> = {
  "전체": "",
  "트렌드": "trend",
  "비용 가이드": "cost_guide",
  "사례 분석": "case_study",
  "팁": "tip",
  "뉴스": "news",
};

const CATEGORY_LABEL: Record<string, string> = {
  trend: "트렌드",
  cost_guide: "비용 가이드",
  case_study: "사례 분석",
  tip: "팁",
  news: "뉴스",
};

function formatDate(date: string | Date | null) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, ".").replace(/\.$/, "");
}

export default function Insights() {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const categoryValue = CATEGORY_MAP[activeCategory] || undefined;
  const { data: articles, isLoading } = trpc.insight.published.useQuery(
    categoryValue ? { category: categoryValue } : undefined
  );

  const subscribeMutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setEmail("");
      setSubscribing(false);
    },
    onError: (err) => {
      toast.error(err.message || "구독 중 오류가 발생했습니다.");
      setSubscribing(false);
    },
  });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribing(true);
    subscribeMutation.mutate({ email, source: "website" });
  };

  const featuredArticles = articles?.filter((a: any) => a.featured) || [];
  const regularArticles = articles?.filter((a: any) => !a.featured) || [];

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
              <form className="flex w-full lg:w-auto gap-0" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  placeholder="이메일 주소"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 lg:w-64 px-4 py-2.5 border border-border bg-white text-sm focus:outline-none focus:border-gold transition-colors"
                  required
                  disabled={subscribing}
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="px-5 py-2.5 bg-ink text-white text-sm font-medium hover:bg-ink/90 transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  {subscribing ? "처리 중..." : "구독"}
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
            {Object.keys(CATEGORY_MAP).map((cat) => (
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

      {/* Loading */}
      {isLoading && (
        <section className="pb-20">
          <div className="container flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        </section>
      )}

      {/* Featured Articles */}
      {!isLoading && featuredArticles.length > 0 && (
        <section className="pb-12">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-6">
              {featuredArticles.map((article: any, i: number) => (
                <FadeUp key={article.id} delay={i * 0.1}>
                  <Link href={`/insights/${article.slug}`}>
                    <div className="group p-8 lg:p-10 border border-border/50 hover:border-gold/30 transition-all duration-500 cursor-pointer h-full flex flex-col">
                      {article.coverImageUrl && (
                        <div className="mb-6 -mx-2 -mt-2 overflow-hidden">
                          <img
                            src={article.coverImageUrl}
                            alt={article.title}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-2 py-0.5 text-xs font-medium bg-gold/10 text-gold">
                          {CATEGORY_LABEL[article.category] || article.category}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {article.readTimeMinutes || 5}분
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {article.viewCount?.toLocaleString() || 0}
                        </span>
                      </div>
                      <h2 className="font-heading text-xl lg:text-2xl font-bold text-ink mb-3 group-hover:text-gold transition-colors duration-300 flex-1">
                        {article.title}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{formatDate(article.publishedAt)}</span>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                          읽기 <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Regular Articles */}
      {!isLoading && regularArticles.length > 0 && (
        <section className="pb-20 lg:pb-28">
          <div className="container">
            <div className="space-y-0">
              {regularArticles.map((article: any, i: number) => (
                <FadeUp key={article.id} delay={i * 0.05}>
                  <Link href={`/insights/${article.slug}`}>
                    <div className="group py-6 border-b border-border/50 hover:border-gold/30 transition-colors cursor-pointer flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Tag className="w-3 h-3" /> {CATEGORY_LABEL[article.category] || article.category}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {article.readTimeMinutes || 5}분
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {article.viewCount?.toLocaleString() || 0}
                          </span>
                        </div>
                        <h3 className="font-heading text-lg font-bold text-ink group-hover:text-gold transition-colors duration-300 mb-1">
                          {article.title}
                        </h3>
                        <p className="text-sm text-muted-foreground hidden sm:block">{article.excerpt}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap mt-1">{formatDate(article.publishedAt)}</span>
                    </div>
                  </Link>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {!isLoading && (!articles || articles.length === 0) && (
        <section className="pb-20 lg:pb-28">
          <div className="container">
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">아직 게시된 아티클이 없습니다.</p>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
