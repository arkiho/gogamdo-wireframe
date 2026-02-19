/**
 * 관리자 포트폴리오 리뷰 관리 페이지
 * 리뷰 요청 생성, 승인/거절, 링크 복사 등
 */

import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, Plus, CheckCircle2, XCircle, Copy, ExternalLink,
  Star, Clock, Mail, Phone, Building2, User, Trash2, Eye,
  MessageSquare, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ReviewStatus = "pending" | "submitted" | "approved" | "rejected";

const STATUS_CONFIG: Record<ReviewStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "대기 중", color: "bg-gray-100 text-gray-600", icon: <Clock className="w-3.5 h-3.5" /> },
  submitted: { label: "검토 필요", color: "bg-amber-100 text-amber-700", icon: <MessageSquare className="w-3.5 h-3.5" /> },
  approved: { label: "승인됨", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected: { label: "거절됨", color: "bg-red-100 text-red-600", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function AdminReviews() {
  const { user, loading: authLoading } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  // 포트폴리오 목록 (리뷰 요청 생성 시 선택용)
  const { data: portfolios } = trpc.portfolio.list.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  // 전체 리뷰 목록
  const { data: reviews, refetch } = trpc.portfolioReview.list.useQuery(
    statusFilter !== "all" ? { status: statusFilter } : undefined,
    { enabled: user?.role === "admin" }
  );

  // 생성 폼 상태
  const [formData, setFormData] = useState({
    portfolioId: 0,
    reviewerName: "",
    reviewerEmail: "",
    reviewerPhone: "",
    reviewerCompany: "",
    reviewerTitle: "",
    expiresInDays: 30,
  });

  const createMutation = trpc.portfolioReview.create.useMutation({
    onSuccess: (data) => {
      const reviewUrl = `${window.location.origin}/review/${data.token}`;
      navigator.clipboard.writeText(reviewUrl);
      if (data.emailSent) {
        toast.success("리뷰 요청이 생성되고 이메일이 발송되었습니다.");
      } else if (data.emailMethod === "notification_fallback") {
        toast.success("리뷰 요청이 생성되었습니다. 이메일 발송은 알림으로 전달되었습니다. 링크가 클립보드에 복사되었습니다.");
      } else {
        toast.success("리뷰 요청이 생성되었습니다. 링크가 클립보드에 복사되었습니다.");
      }
      setShowCreateForm(false);
      setFormData({ portfolioId: 0, reviewerName: "", reviewerEmail: "", reviewerPhone: "", reviewerCompany: "", reviewerTitle: "", expiresInDays: 30 });
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const approveMutation = trpc.portfolioReview.approve.useMutation({
    onSuccess: () => { toast.success("리뷰가 승인되었습니다."); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const rejectMutation = trpc.portfolioReview.reject.useMutation({
    onSuccess: () => { toast.success("리뷰가 거절되었습니다."); setRejectingId(null); setRejectNote(""); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.portfolioReview.delete.useMutation({
    onSuccess: () => { toast.success("삭제되었습니다."); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  // 포트폴리오 이름 매핑
  const portfolioMap = useMemo(() => {
    const map = new Map<number, string>();
    if (portfolios) {
      for (const p of portfolios) {
        map.set(p.id, p.title);
      }
    }
    return map;
  }, [portfolios]);

  const copyReviewLink = (token: string) => {
    const url = `${window.location.origin}/review/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("리뷰 링크가 클립보드에 복사되었습니다.");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "master")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-bold">관리자 권한이 필요합니다</h1>
          <a href={getLoginUrl()} className="text-gold hover:underline">로그인</a>
        </div>
      </div>
    );
  }

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0, pending: 0, submitted: 0, approved: 0, rejected: 0 };
    if (reviews) {
      counts.all = reviews.length;
      for (const r of reviews) {
        counts[r.status] = (counts[r.status] || 0) + 1;
      }
    }
    return counts;
  }, [reviews]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-ink text-white">
        <div className="container py-6">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/admin">
              <span className="text-white/60 hover:text-white transition-colors flex items-center gap-1 text-sm">
                <ArrowLeft className="w-4 h-4" />
                관리자
              </span>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold">포트폴리오 리뷰 관리</h1>
              <p className="text-white/50 text-sm mt-1">담당자 리뷰 요청 생성, 승인/거절 관리</p>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gold text-ink hover:bg-gold-light font-semibold"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              리뷰 요청 생성
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* 상태 필터 */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: "all", label: "전체" },
            { key: "submitted", label: "검토 필요" },
            { key: "pending", label: "대기 중" },
            { key: "approved", label: "승인됨" },
            { key: "rejected", label: "거절됨" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                statusFilter === f.key
                  ? "bg-gold/10 border-gold/30 text-gold"
                  : "bg-white border-border text-muted-foreground hover:border-gold/30"
              }`}
            >
              <Filter className="w-3 h-3" />
              {f.label}
              {statusFilter === "all" && f.key !== "all" && statusCounts[f.key] > 0 && (
                <span className="bg-ink/10 text-ink/60 px-1.5 py-0.5 text-[10px] rounded-full">
                  {statusCounts[f.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 리뷰 요청 생성 모달 */}
        {showCreateForm && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowCreateForm(false)}>
            <div className="bg-white max-w-lg w-full p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
              <h2 className="font-heading text-lg font-bold text-ink">리뷰 요청 생성</h2>
              <p className="text-sm text-muted-foreground">담당자에게 전달할 리뷰 작성 링크를 생성합니다.</p>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">포트폴리오 선택 *</label>
                <select
                  value={formData.portfolioId}
                  onChange={(e) => setFormData({ ...formData, portfolioId: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-border bg-white text-ink text-sm focus:outline-none focus:border-gold/50"
                >
                  <option value={0}>포트폴리오를 선택하세요</option>
                  {portfolios?.map((p) => (
                    <option key={p.id} value={p.id}>{p.title} {p.status !== "published" ? `(${p.status})` : ""}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">담당자 성함 *</label>
                  <input
                    type="text"
                    value={formData.reviewerName}
                    onChange={(e) => setFormData({ ...formData, reviewerName: e.target.value })}
                    placeholder="홍길동"
                    className="w-full px-3 py-2 border border-border bg-white text-ink text-sm focus:outline-none focus:border-gold/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">직책</label>
                  <input
                    type="text"
                    value={formData.reviewerTitle}
                    onChange={(e) => setFormData({ ...formData, reviewerTitle: e.target.value })}
                    placeholder="총무팀장"
                    className="w-full px-3 py-2 border border-border bg-white text-ink text-sm focus:outline-none focus:border-gold/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">회사명</label>
                <input
                  type="text"
                  value={formData.reviewerCompany}
                  onChange={(e) => setFormData({ ...formData, reviewerCompany: e.target.value })}
                  placeholder="(주)ABC"
                  className="w-full px-3 py-2 border border-border bg-white text-ink text-sm focus:outline-none focus:border-gold/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    이메일
                    <span className="text-gold ml-1">(입력 시 자동 발송)</span>
                  </label>
                  <input
                    type="email"
                    value={formData.reviewerEmail}
                    onChange={(e) => setFormData({ ...formData, reviewerEmail: e.target.value })}
                    placeholder="email@company.com"
                    className="w-full px-3 py-2 border border-border bg-white text-ink text-sm focus:outline-none focus:border-gold/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">전화번호</label>
                  <input
                    type="tel"
                    value={formData.reviewerPhone}
                    onChange={(e) => setFormData({ ...formData, reviewerPhone: e.target.value })}
                    placeholder="010-0000-0000"
                    className="w-full px-3 py-2 border border-border bg-white text-ink text-sm focus:outline-none focus:border-gold/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">링크 유효기간</label>
                <select
                  value={formData.expiresInDays}
                  onChange={(e) => setFormData({ ...formData, expiresInDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-border bg-white text-ink text-sm focus:outline-none focus:border-gold/50"
                >
                  <option value={7}>7일</option>
                  <option value={14}>14일</option>
                  <option value={30}>30일</option>
                  <option value={60}>60일</option>
                  <option value={90}>90일</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={() => createMutation.mutate({ ...formData, origin: window.location.origin })}
                  disabled={!formData.portfolioId || !formData.reviewerName || createMutation.isPending}
                  className="flex-1 bg-gold text-ink hover:bg-gold-light font-semibold"
                >
                  {createMutation.isPending ? "생성 중..." : "생성 및 링크 복사"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 거절 사유 모달 */}
        {rejectingId && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setRejectingId(null)}>
            <div className="bg-white max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="font-heading text-lg font-bold text-ink">리뷰 거절</h2>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">거절 사유 (선택)</label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="거절 사유를 입력하세요 (담당자에게 전달되지 않습니다)"
                  rows={3}
                  className="w-full px-3 py-2 border border-border bg-white text-ink text-sm focus:outline-none focus:border-gold/50 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setRejectingId(null)} className="flex-1">취소</Button>
                <Button
                  onClick={() => rejectMutation.mutate({ id: rejectingId, adminNote: rejectNote || undefined })}
                  disabled={rejectMutation.isPending}
                  className="flex-1 bg-red-500 text-white hover:bg-red-600"
                >
                  거절
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 리뷰 목록 */}
        {!reviews || reviews.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-heading text-lg font-semibold text-ink mb-2">리뷰가 없습니다</h3>
            <p className="text-sm text-muted-foreground mb-6">
              포트폴리오 담당자에게 리뷰 요청을 보내보세요.
            </p>
            <Button onClick={() => setShowCreateForm(true)} className="bg-gold text-ink hover:bg-gold-light">
              <Plus className="w-4 h-4 mr-1.5" />
              첫 리뷰 요청 생성
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => {
              const statusConf = STATUS_CONFIG[review.status as ReviewStatus] || STATUS_CONFIG.pending;
              return (
                <div key={review.id} className="bg-white border border-border/50 p-5 hover:border-gold/20 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium ${statusConf.color}`}>
                          {statusConf.icon}
                          {statusConf.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {portfolioMap.get(review.portfolioId) || `포트폴리오 #${review.portfolioId}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-semibold text-ink flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          {review.reviewerName}
                        </span>
                        {review.reviewerTitle && (
                          <span className="text-muted-foreground">{review.reviewerTitle}</span>
                        )}
                        {review.reviewerCompany && (
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {review.reviewerCompany}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyReviewLink(review.accessToken)}
                        className="p-1.5 text-muted-foreground hover:text-gold transition-colors"
                        title="리뷰 링크 복사"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={`/review/${review.accessToken}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-muted-foreground hover:text-gold transition-colors"
                        title="리뷰 페이지 열기"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => {
                          if (confirm("정말 삭제하시겠습니까?")) deleteMutation.mutate({ id: review.id });
                        }}
                        className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 리뷰 내용 (submitted/approved 상태일 때) */}
                  {(review.status === "submitted" || review.status === "approved" || review.status === "rejected") && review.content && (
                    <div className="mt-3 pt-3 border-t border-border/30">
                      {review.rating && (
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${s <= review.rating! ? "fill-gold text-gold" : "fill-transparent text-ink/15"}`}
                            />
                          ))}
                        </div>
                      )}
                      {review.title && (
                        <p className="font-semibold text-ink text-sm mb-1">"{review.title}"</p>
                      )}
                      <p className="text-sm text-ink/70 leading-relaxed line-clamp-3">{review.content}</p>
                      {review.highlights && (review.highlights as string[]).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(review.highlights as string[]).map((h) => (
                            <span key={h} className="px-2 py-0.5 text-[10px] font-medium bg-gold/10 text-gold border border-gold/20">
                              {h}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 연락처 정보 */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    {review.reviewerEmail && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {review.reviewerEmail}
                      </span>
                    )}
                    {review.reviewerPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {review.reviewerPhone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                    {review.tokenExpiresAt && (
                      <span className={`flex items-center gap-1 ${new Date(review.tokenExpiresAt) < new Date() ? "text-red-400" : ""}`}>
                        만료: {new Date(review.tokenExpiresAt).toLocaleDateString("ko-KR")}
                      </span>
                    )}
                  </div>

                  {/* 액션 버튼 */}
                  {review.status === "submitted" && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate({ id: review.id })}
                        disabled={approveMutation.isPending}
                        className="bg-green-500 text-white hover:bg-green-600 text-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        승인
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejectingId(review.id)}
                        className="text-xs border-red-200 text-red-500 hover:bg-red-50"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        거절
                      </Button>
                    </div>
                  )}

                  {review.adminNote && (
                    <div className="mt-3 p-2 bg-red-50 text-xs text-red-600">
                      관리자 메모: {review.adminNote}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
