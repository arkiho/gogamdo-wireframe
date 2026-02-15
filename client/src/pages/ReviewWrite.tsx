/**
 * 포트폴리오 담당자 리뷰 작성 페이지
 * 토큰 기반 접근 - 관리자가 발급한 링크로 담당자가 리뷰 작성
 */

import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Send, CheckCircle2, AlertCircle, Building2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const HIGHLIGHT_OPTIONS = [
  "디자인 감각", "시공 품질", "일정 준수", "커뮤니케이션",
  "예산 관리", "문제 해결력", "세심한 마감", "공간 활용",
  "브랜드 반영", "사후 관리", "전문성", "창의성",
];

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="p-0.5 transition-transform hover:scale-110"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              star <= (hover || value)
                ? "fill-gold text-gold"
                : "fill-transparent text-ink/20"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ReviewWrite() {
  const params = useParams<{ token: string }>();
  const token = params.token || "";

  const { data, isLoading, error } = trpc.portfolioReview.getByToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const submitMutation = trpc.portfolioReview.submit.useMutation({
    onSuccess: () => {
      toast.success("리뷰가 성공적으로 제출되었습니다!");
      setSubmitted(true);
    },
    onError: (err) => {
      toast.error(err.message || "리뷰 제출에 실패했습니다.");
    },
  });

  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerTitle, setReviewerTitle] = useState("");
  const [reviewerCompany, setReviewerCompany] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);

  // 기존 데이터 로드
  useEffect(() => {
    if (data?.review) {
      const r = data.review;
      if (r.reviewerName) setReviewerName(r.reviewerName);
      if (r.reviewerTitle) setReviewerTitle(r.reviewerTitle);
      if (r.reviewerCompany) setReviewerCompany(r.reviewerCompany);
      if (r.rating) setRating(r.rating);
      if (r.title) setTitle(r.title);
      if (r.content) setContent(r.content);
      if (r.highlights) setHighlights(r.highlights as string[]);
      if (r.status === "approved") setSubmitted(true);
    }
  }, [data]);

  const toggleHighlight = (h: string) => {
    setHighlights((prev) =>
      prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]
    );
  };

  const handleSubmit = () => {
    if (!rating) return toast.error("별점을 선택해주세요.");
    if (!content || content.length < 10) return toast.error("리뷰 내용을 10자 이상 작성해주세요.");
    if (!reviewerName) return toast.error("성함을 입력해주세요.");

    submitMutation.mutate({
      token,
      reviewerName,
      reviewerTitle: reviewerTitle || undefined,
      reviewerCompany: reviewerCompany || undefined,
      rating,
      title: title || undefined,
      content,
      highlights: highlights.length > 0 ? highlights : undefined,
    });
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper-warm flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-paper-warm flex items-center justify-center p-4">
        <div className="text-center max-w-md space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h1 className="font-heading text-2xl font-bold text-ink">접근할 수 없습니다</h1>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  // 제출 완료 상태
  if (submitted || data?.review?.status === "submitted") {
    return (
      <div className="min-h-screen bg-paper-warm flex items-center justify-center p-4">
        <FadeUp>
          <div className="text-center max-w-md space-y-6">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-ink">
              리뷰가 제출되었습니다
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              소중한 리뷰를 작성해주셔서 감사합니다.<br />
              관리자 확인 후 포트폴리오에 게시됩니다.
            </p>
            <div className="pt-4">
              <a
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-ink font-semibold text-sm hover:bg-gold-light transition-colors"
              >
                고감도 홈페이지 방문
              </a>
            </div>
          </div>
        </FadeUp>
      </div>
    );
  }

  const portfolio = data?.portfolio;

  return (
    <div className="min-h-screen bg-paper-warm">
      {/* Header */}
      <header className="bg-ink text-white py-6">
        <div className="container">
          <div className="flex items-center gap-3">
            <span className="font-heading text-lg font-bold tracking-tight">
              고감도
            </span>
            <span className="text-white/30">|</span>
            <span className="text-sm text-white/60">프로젝트 리뷰</span>
          </div>
        </div>
      </header>

      <main className="container py-12 lg:py-16 max-w-2xl mx-auto px-4">
        {/* 프로젝트 정보 */}
        {portfolio && (
          <FadeUp>
            <div className="bg-white border border-border/50 p-6 mb-8">
              <p className="text-xs font-medium tracking-widest uppercase text-gold mb-2">
                Review for
              </p>
              <h1 className="font-heading text-2xl font-bold text-ink mb-2">
                {portfolio.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {portfolio.client && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    {portfolio.client}
                  </span>
                )}
                {portfolio.category && (
                  <span className="px-2 py-0.5 bg-gold/10 text-gold text-xs font-medium">
                    {portfolio.category}
                  </span>
                )}
              </div>
            </div>
          </FadeUp>
        )}

        {/* 안내 메시지 */}
        <FadeUp delay={0.1}>
          <div className="bg-blue-50 border border-blue-100 p-4 mb-8 flex gap-3">
            <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">리뷰 작성 안내</p>
              <p className="text-blue-600">
                프로젝트에 대한 솔직한 리뷰를 남겨주세요. 작성하신 리뷰는 관리자 확인 후 포트폴리오에 게시됩니다.
              </p>
            </div>
          </div>
        </FadeUp>

        {/* 리뷰 작성 폼 */}
        <FadeUp delay={0.2}>
          <div className="bg-white border border-border/50 p-6 lg:p-8 space-y-8">
            {/* 별점 */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-3">
                전체 만족도 <span className="text-red-400">*</span>
              </label>
              <StarRating value={rating} onChange={setRating} />
              {rating > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {rating === 5 && "매우 만족"}
                  {rating === 4 && "만족"}
                  {rating === 3 && "보통"}
                  {rating === 2 && "불만족"}
                  {rating === 1 && "매우 불만족"}
                </p>
              )}
            </div>

            {/* 특히 좋았던 점 */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-3">
                특히 좋았던 점 (선택)
              </label>
              <div className="flex flex-wrap gap-2">
                {HIGHLIGHT_OPTIONS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => toggleHighlight(h)}
                    className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                      highlights.includes(h)
                        ? "bg-gold/10 border-gold/30 text-gold"
                        : "bg-white border-border text-muted-foreground hover:border-gold/30"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* 리뷰 제목 */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">
                리뷰 제목 (선택)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 직원들이 정말 좋아하는 사무실이 되었습니다"
                className="w-full px-4 py-3 border border-border bg-white text-ink placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/50 transition-colors text-sm"
              />
            </div>

            {/* 리뷰 내용 */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">
                리뷰 내용 <span className="text-red-400">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="프로젝트 진행 과정, 결과물에 대한 만족도, 특별히 좋았던 점 등을 자유롭게 작성해주세요."
                rows={6}
                className="w-full px-4 py-3 border border-border bg-white text-ink placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/50 transition-colors text-sm resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {content.length}자 / 최소 10자
              </p>
            </div>

            <hr className="border-border/50" />

            {/* 작성자 정보 */}
            <div>
              <p className="text-sm font-semibold text-ink mb-4">작성자 정보</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    성함 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full px-3 py-2.5 border border-border bg-white text-ink placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/50 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    직책 (선택)
                  </label>
                  <input
                    type="text"
                    value={reviewerTitle}
                    onChange={(e) => setReviewerTitle(e.target.value)}
                    placeholder="총무팀장"
                    className="w-full px-3 py-2.5 border border-border bg-white text-ink placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/50 transition-colors text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-muted-foreground mb-1">
                    회사명 (선택)
                  </label>
                  <input
                    type="text"
                    value={reviewerCompany}
                    onChange={(e) => setReviewerCompany(e.target.value)}
                    placeholder="(주)ABC"
                    className="w-full px-3 py-2.5 border border-border bg-white text-ink placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/50 transition-colors text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="pt-2">
              <Button
                onClick={handleSubmit}
                disabled={submitMutation.isPending || !rating || content.length < 10 || !reviewerName}
                className="w-full bg-gold text-ink hover:bg-gold-light font-semibold py-6 text-sm tracking-wide"
              >
                {submitMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin w-4 h-4 border-2 border-ink/30 border-t-ink rounded-full" />
                    제출 중...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    리뷰 제출하기
                  </span>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                제출된 리뷰는 관리자 확인 후 게시됩니다.
              </p>
            </div>
          </div>
        </FadeUp>

        {/* Footer */}
        <div className="text-center mt-12 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} (주)고감도. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
