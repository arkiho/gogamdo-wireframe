/*
 * 내부 링크 강화 (SEO): 인사이트 ↔ 포트폴리오 상호 추천 컴포넌트
 * - RelatedPortfolios: 인사이트 상세에서 관련 고객 사례(포트폴리오)를 추천
 * - RelatedInsights: 포트폴리오 상세에서 관련 인사이트를 추천
 * 태그 겹침 점수로 관련도를 계산하고, 없으면 최신순으로 3개를 노출합니다.
 */

import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Clock, FileText, Building2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

const INSIGHT_CATEGORY_LABEL: Record<string, string> = {
  trend: "트렌드",
  cost_guide: "비용 가이드",
  case_study: "사례 분석",
  tip: "팁",
  news: "뉴스",
};

function scoreByTags(itemTags: string[] | null | undefined, refTags: string[]): number {
  if (!itemTags || !refTags?.length) return 0;
  const ref = new Set(refTags.map((t) => t.toLowerCase().trim()));
  return itemTags.reduce((acc, t) => acc + (ref.has(t.toLowerCase().trim()) ? 1 : 0), 0);
}

function SectionShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-16 lg:py-20 border-t border-border/40">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xs font-medium tracking-widest uppercase text-gold mb-3">
            {eyebrow}
          </p>
          <h2 className="font-heading text-2xl lg:text-3xl font-bold text-ink mb-8">
            {title}
          </h2>
        </motion.div>
        {children}
      </div>
    </section>
  );
}

/** 인사이트 상세 → 관련 고객 사례(포트폴리오) 추천 */
export function RelatedPortfolios({
  tags = [],
  limit = 3,
}: {
  tags?: string[];
  limit?: number;
}) {
  const { data } = trpc.portfolio.published.useQuery();
  if (!data || data.length === 0) return null;

  const ranked = [...data]
    .map((p) => ({ p, score: scoreByTags(p.tags as string[] | null, tags) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);

  if (ranked.length === 0) return null;

  return (
    <SectionShell eyebrow="Related Projects" title="이런 사례도 있어요">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ranked.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          >
            <Link href={`/portfolio/p/${p.id}`}>
              <div className="group cursor-pointer h-full border border-border/50 hover:border-gold/40 transition-all duration-500 overflow-hidden">
                <div className="aspect-[4/3] bg-paper-warm overflow-hidden">
                  {p.coverImage ? (
                    <img
                      src={p.coverImage}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink/15">
                      <Building2 className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  {p.category && (
                    <span className="text-xs font-medium text-gold">{p.category}</span>
                  )}
                  <h3 className="font-heading text-base font-bold text-ink mt-1 mb-2 line-clamp-2 group-hover:text-gold transition-colors">
                    {p.title}
                  </h3>
                  {p.location && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" /> {p.location}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
      <div className="mt-8">
        <Link href="/portfolio">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-gold hover:gap-3 transition-all cursor-pointer">
            전체 고객 사례 보기 <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      </div>
    </SectionShell>
  );
}

/** 포트폴리오 상세 → 관련 인사이트 추천 */
export function RelatedInsights({
  tags = [],
  limit = 3,
}: {
  tags?: string[];
  limit?: number;
}) {
  const { data } = trpc.insight.published.useQuery(undefined);
  if (!data || data.length === 0) return null;

  const ranked = [...data]
    .map((a) => ({ a, score: scoreByTags(a.tags as string[] | null, tags) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map((x) => x.a);

  if (ranked.length === 0) return null;

  return (
    <SectionShell eyebrow="Related Insights" title="함께 보면 좋은 인사이트">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ranked.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          >
            <Link href={`/insights/${a.slug}`}>
              <div className="group cursor-pointer h-full border border-border/50 hover:border-gold/40 transition-all duration-500 overflow-hidden">
                <div className="aspect-[16/9] bg-paper-warm overflow-hidden">
                  {a.coverImageUrl ? (
                    <img
                      src={a.coverImageUrl}
                      alt={a.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink/15">
                      <FileText className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <span className="text-xs font-medium text-gold">
                    {INSIGHT_CATEGORY_LABEL[a.category] ?? a.category}
                  </span>
                  <h3 className="font-heading text-base font-bold text-ink mt-1 mb-2 line-clamp-2 group-hover:text-gold transition-colors">
                    {a.title}
                  </h3>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" /> {a.readTimeMinutes ?? 5}분 읽기
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
      <div className="mt-8">
        <Link href="/insights">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-gold hover:gap-3 transition-all cursor-pointer">
            전체 인사이트 보기 <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      </div>
    </SectionShell>
  );
}
