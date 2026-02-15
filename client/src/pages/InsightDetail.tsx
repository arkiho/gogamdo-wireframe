/*
 * DESIGN: Precision Studio — Insight Article Detail Page
 * Long-form content reading experience with newsletter CTA
 */

import { useState } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Eye, Tag, Calendar, Mail, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import SEOHead from "@/components/SEOHead";

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
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

export default function InsightDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const { data: article, isLoading, error } = trpc.insight.bySlug.useQuery(
    { slug },
    { enabled: !!slug }
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

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: article?.title,
          text: article?.excerpt,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("링크가 복사되었습니다.");
      }
    } catch {
      // user cancelled share
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-lg">아티클을 찾을 수 없습니다.</p>
        <Link href="/insights">
          <span className="inline-flex items-center gap-2 text-gold hover:underline">
            <ArrowLeft className="w-4 h-4" /> 인사이트 목록으로 돌아가기
          </span>
        </Link>
      </div>
    );
  }

  const tags = typeof article.tags === "string" ? article.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : (article.tags || []);

  return (
    <>
      <SEOHead
        title={`${article.title} | 고감도 인사이트`}
        description={article.excerpt}
      />

      {/* Back Navigation */}
      <section className="pt-28 lg:pt-36 pb-4">
        <div className="container">
          <Link href="/insights">
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors">
              <ArrowLeft className="w-4 h-4" /> 인사이트 목록
            </span>
          </Link>
        </div>
      </section>

      {/* Article Header */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="pb-8 lg:pb-12"
      >
        <div className="container max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 text-xs font-medium bg-gold/10 text-gold">
              {CATEGORY_LABEL[article.category] || article.category}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formatDate(article.publishedAt)}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> {article.readTimeMinutes || 5}분 읽기
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Eye className="w-3 h-3" /> {article.viewCount?.toLocaleString() || 0}
            </span>
          </div>

          <h1 className="font-heading text-3xl lg:text-5xl font-bold text-ink leading-tight mb-4">
            {article.title}
          </h1>

          {article.subtitle && (
            <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed mb-6">
              {article.subtitle}
            </p>
          )}

          <div className="flex items-center justify-between border-b border-border/50 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-ink text-white flex items-center justify-center text-sm font-bold">
                {(article.author || "고감도")[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-ink">{article.author || "고감도 에디터"}</p>
                <p className="text-xs text-muted-foreground">(주)고감도 인테리어</p>
              </div>
            </div>
            <button
              onClick={handleShare}
              className="p-2 text-muted-foreground hover:text-gold transition-colors"
              title="공유하기"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.section>

      {/* Cover Image */}
      {article.coverImageUrl && (
        <section className="pb-8 lg:pb-12">
          <div className="container max-w-4xl">
            <img
              src={article.coverImageUrl}
              alt={article.title}
              className="w-full h-64 lg:h-96 object-cover"
            />
          </div>
        </section>
      )}

      {/* Article Content */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="pb-12 lg:pb-16"
      >
        <div className="container max-w-4xl">
          <div className="prose prose-lg max-w-none
            prose-headings:font-heading prose-headings:text-ink prose-headings:font-bold
            prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border/30 prose-h2:pb-3
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-ink/80 prose-p:leading-[1.8] prose-p:mb-4
            prose-strong:text-ink
            prose-ul:my-4 prose-li:text-ink/80 prose-li:leading-[1.8]
            prose-ol:my-4
            prose-blockquote:border-l-gold prose-blockquote:bg-paper-warm prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:not-italic
            prose-table:border prose-th:bg-paper-warm prose-th:p-3 prose-td:p-3 prose-td:border
            prose-a:text-gold prose-a:no-underline hover:prose-a:underline
          ">
            <Streamdown>{article.content}</Streamdown>
          </div>
        </div>
      </motion.section>

      {/* Tags */}
      {tags.length > 0 && (
        <section className="pb-8">
          <div className="container max-w-4xl">
            <div className="flex flex-wrap gap-2 border-t border-border/50 pt-6">
              {tags.map((tag: string, i: number) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-paper-warm text-ink/60"
                >
                  <Tag className="w-3 h-3" /> {tag}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter CTA */}
      <section className="pb-20 lg:pb-28">
        <div className="container max-w-4xl">
          <div className="p-8 lg:p-12 bg-ink text-white text-center">
            <Mail className="w-8 h-8 text-gold mx-auto mb-4" />
            <h3 className="font-heading text-2xl font-bold mb-2">
              이런 인사이트를 정기적으로 받아보세요
            </h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              격주로 발행되는 고감도 뉴스레터에서 사무공간 트렌드와 실전 팁을 전해드립니다.
            </p>
            <form className="flex max-w-md mx-auto gap-0" onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-gold transition-colors"
                required
                disabled={subscribing}
              />
              <button
                type="submit"
                disabled={subscribing}
                className="px-6 py-3 bg-gold text-ink text-sm font-semibold hover:bg-gold-light transition-colors whitespace-nowrap disabled:opacity-50"
              >
                {subscribing ? "처리 중..." : "구독하기"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
