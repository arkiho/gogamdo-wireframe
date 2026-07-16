/*
 * Admin Newsletter Management Page
 * Manage subscribers, segments, tags, create targeted campaigns, send newsletters
 */

import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Mail, Users, Send, Plus, Loader2, Trash2,
  CheckCircle2, Clock, FileText, MailPlus, Tag, Filter,
  Eye, RefreshCw, X, ChevronDown, BarChart3, Target
} from "lucide-react";
import { toast } from "sonner";

function formatDate(date: string | Date | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "초안", variant: "outline" },
  scheduled: { label: "예약", variant: "secondary" },
  sending: { label: "발송 중", variant: "default" },
  sent: { label: "발송 완료", variant: "default" },
  failed: { label: "실패", variant: "destructive" },
};

const SOURCE_LABELS: Record<string, string> = {
  website: "웹사이트",
  contact_form: "문의폼",
  manual: "수동 등록",
  lead_magnet: "리드마그넷",
  estimator: "AI 견적",
  portfolio: "포트폴리오",
  insight: "인사이트",
  ai_chat: "AI 채팅",
  style_quiz: "스타일 퀴즈",
};

const SEGMENT_COLORS = [
  "#b8860b", "#2563eb", "#dc2626", "#16a34a", "#9333ea",
  "#ea580c", "#0891b2", "#be185d", "#65a30d", "#4f46e5",
];

export default function AdminNewsletter() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"subscribers" | "campaigns" | "segments" | "create" | "stats">("subscribers");

  // Campaign creation state
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignPreview, setCampaignPreview] = useState("");
  const [campaignContent, setCampaignContent] = useState("");
  const [selectedArticleIds, setSelectedArticleIds] = useState<number[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<number | undefined>(undefined);

  // Segment creation state
  const [segmentName, setSegmentName] = useState("");
  const [segmentDesc, setSegmentDesc] = useState("");
  const [segmentColor, setSegmentColor] = useState(SEGMENT_COLORS[0]);
  const [segmentSources, setSegmentSources] = useState<string[]>([]);
  const [segmentAfter, setSegmentAfter] = useState("");
  const [segmentBefore, setSegmentBefore] = useState("");
  const [segmentTags, setSegmentTags] = useState<string[]>([]);
  const [segmentHasCompany, setSegmentHasCompany] = useState<boolean | undefined>(undefined);
  const [showCreateSegment, setShowCreateSegment] = useState(false);

  // Tag management state
  const [tagInput, setTagInput] = useState("");
  const [selectedSubForTag, setSelectedSubForTag] = useState<number | null>(null);

  const { data: subscribers, isLoading: subsLoading, refetch: refetchSubs } = trpc.newsletter.subscribers.useQuery(undefined, { enabled: !!user });
  const { data: campaigns, isLoading: campsLoading, refetch: refetchCampaigns } = trpc.newsletter.campaigns.useQuery(undefined, { enabled: !!user });
  const { data: articles } = trpc.insight.all.useQuery(undefined, { enabled: !!user });
  const { data: activeCount } = trpc.newsletter.activeCount.useQuery(undefined, { enabled: !!user });
  const { data: segments, isLoading: segsLoading, refetch: refetchSegments } = trpc.newsletter.segments.useQuery(undefined, { enabled: !!user });
  const { data: sourceStats } = trpc.newsletter.sourceStats.useQuery(undefined, { enabled: !!user });
  const { data: allTags, refetch: refetchTags } = trpc.newsletter.allTags.useQuery(undefined, { enabled: !!user });

  const createCampaignMutation = trpc.newsletter.createCampaign.useMutation({
    onSuccess: () => {
      toast.success("캠페인이 생성되었습니다.");
      setCampaignTitle(""); setCampaignSubject(""); setCampaignPreview("");
      setCampaignContent(""); setSelectedArticleIds([]); setSelectedSegmentId(undefined);
      setActiveTab("campaigns");
      refetchCampaigns();
    },
    onError: (err) => toast.error(err.message),
  });

  const sendCampaignMutation = trpc.newsletter.sendCampaign.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.sentCount}명에게 발송 완료!`);
      refetchCampaigns();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteCampaignMutation = trpc.newsletter.deleteCampaign.useMutation({
    onSuccess: () => { toast.success("캠페인이 삭제되었습니다."); refetchCampaigns(); },
    onError: (err) => toast.error(err.message),
  });

  const createSegmentMutation = trpc.newsletter.createSegment.useMutation({
    onSuccess: () => {
      toast.success("세그먼트가 생성되었습니다.");
      setSegmentName(""); setSegmentDesc(""); setSegmentSources([]);
      setSegmentAfter(""); setSegmentBefore(""); setSegmentTags([]);
      setSegmentHasCompany(undefined); setShowCreateSegment(false);
      refetchSegments();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteSegmentMutation = trpc.newsletter.deleteSegment.useMutation({
    onSuccess: () => { toast.success("세그먼트가 삭제되었습니다."); refetchSegments(); },
    onError: (err) => toast.error(err.message),
  });

  const refreshSegmentMutation = trpc.newsletter.refreshSegmentCount.useMutation({
    onSuccess: (data) => { toast.success(`매칭 구독자: ${data.count}명`); refetchSegments(); },
    onError: (err) => toast.error(err.message),
  });

  const addTagMutation = trpc.newsletter.addTag.useMutation({
    onSuccess: () => { toast.success("태그가 추가되었습니다."); setTagInput(""); refetchTags(); refetchSubs(); },
    onError: (err) => toast.error(err.message),
  });

  const removeTagMutation = trpc.newsletter.removeTag.useMutation({
    onSuccess: () => { toast.success("태그가 제거되었습니다."); refetchTags(); refetchSubs(); },
    onError: (err) => toast.error(err.message),
  });

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>;
  }

  if (!user || (user.role !== "admin" && user.role !== "master")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">관리자 권한이 필요합니다.</p>
        <Link href="/admin"><span className="text-gold hover:underline">관리자 대시보드로 이동</span></Link>
      </div>
    );
  }

  const activeSubscribers = subscribers?.filter((s: any) => s.status === "active") || [];
  const publishedArticles = articles?.filter((a: any) => a.status === "published") || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-white">
        <div className="container py-6">
          <Link href="/admin">
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" /> 관리자 대시보드
            </span>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-ink flex items-center gap-3">
                <Mail className="w-6 h-6 text-gold" />
                뉴스레터 관리
              </h1>
              <p className="text-sm text-muted-foreground mt-1">구독자 세그먼트 관리 및 타겟 캠페인 발송</p>
            </div>
            <div className="flex gap-3">
              <div className="text-center px-4 py-2 bg-paper-warm border border-border/50">
                <p className="text-2xl font-bold text-ink">{activeCount?.count || 0}</p>
                <p className="text-xs text-muted-foreground">활성 구독자</p>
              </div>
              <div className="text-center px-4 py-2 bg-paper-warm border border-border/50">
                <p className="text-2xl font-bold text-ink">{segments?.length || 0}</p>
                <p className="text-xs text-muted-foreground">세그먼트</p>
              </div>
              <div className="text-center px-4 py-2 bg-paper-warm border border-border/50">
                <p className="text-2xl font-bold text-ink">{campaigns?.length || 0}</p>
                <p className="text-xs text-muted-foreground">캠페인</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border/50 bg-white">
        <div className="container">
          <div className="flex gap-0 overflow-x-auto">
            {[
              { key: "subscribers" as const, label: "구독자", icon: Users },
              { key: "segments" as const, label: "세그먼트", icon: Target },
              { key: "campaigns" as const, label: "캠페인", icon: FileText },
              { key: "create" as const, label: "새 캠페인", icon: MailPlus },
              { key: "stats" as const, label: "유입 통계", icon: BarChart3 },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === key
                    ? "border-gold text-gold"
                    : "border-transparent text-muted-foreground hover:text-ink"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* ===== Subscribers Tab ===== */}
        {activeTab === "subscribers" && (
          <div>
            {subsLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
            ) : !subscribers || subscribers.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">아직 구독자가 없습니다.</p>
                  <p className="text-sm text-muted-foreground mt-1">인사이트 페이지의 구독 폼을 통해 구독자가 유입됩니다.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>구독자 목록 ({subscribers.length}명)</span>
                    <Badge className="bg-green-100 text-green-700">{activeSubscribers.length}명 활성</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">이메일</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">이름</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">회사</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">유입경로</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">태그</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">상태</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">구독일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscribers.map((sub: any) => (
                          <tr key={sub.id} className="border-b border-border/30 hover:bg-paper-warm/50">
                            <td className="py-3 px-4 font-medium">{sub.email}</td>
                            <td className="py-3 px-4">{sub.name || "-"}</td>
                            <td className="py-3 px-4">{sub.company || "-"}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="text-xs">
                                {SOURCE_LABELS[sub.source] || sub.source || "-"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1 flex-wrap">
                                {selectedSubForTag === sub.id ? (
                                  <div className="flex items-center gap-1">
                                    <Input
                                      value={tagInput}
                                      onChange={(e) => setTagInput(e.target.value)}
                                      placeholder="태그 입력"
                                      className="h-6 w-24 text-xs"
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && tagInput.trim()) {
                                          addTagMutation.mutate({ subscriberId: sub.id, tag: tagInput.trim() });
                                        }
                                      }}
                                    />
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setSelectedSubForTag(null)}>
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-1 text-xs text-muted-foreground hover:text-gold"
                                    onClick={() => setSelectedSubForTag(sub.id)}
                                  >
                                    <Tag className="w-3 h-3 mr-1" /> 태그
                                  </Button>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {sub.status === "active" ? (
                                <Badge className="bg-green-100 text-green-700 text-xs">활성</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">해지</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">{formatDate(sub.subscribedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ===== Segments Tab ===== */}
        {activeTab === "segments" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">구독자 세그먼트</h2>
              <Button onClick={() => setShowCreateSegment(!showCreateSegment)} className="bg-gold text-ink hover:bg-gold-light">
                <Plus className="w-4 h-4 mr-2" /> 세그먼트 만들기
              </Button>
            </div>

            {/* Create Segment Form */}
            {showCreateSegment && (
              <Card className="border-gold/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-gold" /> 새 세그먼트 만들기
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-5" onSubmit={(e) => {
                    e.preventDefault();
                    if (!segmentName.trim()) { toast.error("세그먼트 이름을 입력하세요."); return; }
                    if (segmentSources.length === 0 && segmentTags.length === 0 && !segmentAfter && !segmentBefore && !segmentHasCompany) {
                      if (!confirm("필터 조건이 없으면 전체 구독자가 대상이 됩니다. 계속하시겠습니까?")) return;
                    }
                    createSegmentMutation.mutate({
                      name: segmentName,
                      description: segmentDesc || undefined,
                      color: segmentColor,
                      filterConditions: {
                        sources: segmentSources.length > 0 ? segmentSources : undefined,
                        subscribedAfter: segmentAfter || undefined,
                        subscribedBefore: segmentBefore || undefined,
                        tags: segmentTags.length > 0 ? segmentTags : undefined,
                        hasCompany: segmentHasCompany,
                      },
                    });
                  }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-ink mb-1">세그먼트 이름 *</label>
                        <Input value={segmentName} onChange={(e) => setSegmentName(e.target.value)} placeholder="예: 견적 요청 고객" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-ink mb-1">설명</label>
                        <Input value={segmentDesc} onChange={(e) => setSegmentDesc(e.target.value)} placeholder="세그먼트에 대한 간단한 설명" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-ink mb-1">식별 색상</label>
                      <div className="flex gap-2">
                        {SEGMENT_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setSegmentColor(c)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${segmentColor === c ? "border-ink scale-110" : "border-transparent"}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Filter: Sources */}
                    <div>
                      <label className="block text-sm font-medium text-ink mb-2">유입 경로 필터</label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setSegmentSources(prev =>
                                prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
                              );
                            }}
                            className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                              segmentSources.includes(key)
                                ? "border-gold bg-gold/10 text-gold"
                                : "border-border/50 text-muted-foreground hover:border-gold/30"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {segmentSources.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-1">선택하지 않으면 모든 유입 경로가 포함됩니다.</p>
                      )}
                    </div>

                    {/* Filter: Date Range */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-ink mb-1">구독 시작일 (이후)</label>
                        <Input type="date" value={segmentAfter} onChange={(e) => setSegmentAfter(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-ink mb-1">구독 종료일 (이전)</label>
                        <Input type="date" value={segmentBefore} onChange={(e) => setSegmentBefore(e.target.value)} />
                      </div>
                    </div>

                    {/* Filter: Has Company */}
                    <div>
                      <label className="block text-sm font-medium text-ink mb-2">회사 정보 유무</label>
                      <div className="flex gap-3">
                        {[
                          { value: undefined, label: "무관" },
                          { value: true, label: "회사 정보 있음" },
                          { value: false, label: "개인 (회사 없음)" },
                        ].map(({ value, label }) => (
                          <button
                            key={String(value)}
                            type="button"
                            onClick={() => setSegmentHasCompany(value as boolean | undefined)}
                            className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                              segmentHasCompany === value
                                ? "border-gold bg-gold/10 text-gold"
                                : "border-border/50 text-muted-foreground hover:border-gold/30"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Filter: Tags */}
                    {allTags && allTags.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-ink mb-2">태그 필터</label>
                        <div className="flex flex-wrap gap-2">
                          {allTags.map((tag: string) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                setSegmentTags(prev =>
                                  prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                );
                              }}
                              className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                                segmentTags.includes(tag)
                                  ? "border-gold bg-gold/10 text-gold"
                                  : "border-border/50 text-muted-foreground hover:border-gold/30"
                              }`}
                            >
                              <Tag className="w-3 h-3 inline mr-1" />{tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-border/50">
                      <Button type="submit" disabled={createSegmentMutation.isPending} className="bg-gold text-ink hover:bg-gold-light">
                        {createSegmentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        세그먼트 생성
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowCreateSegment(false)}>취소</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Segment List */}
            {segsLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
            ) : !segments || segments.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">아직 세그먼트가 없습니다.</p>
                  <p className="text-sm text-muted-foreground mt-1">세그먼트를 만들어 구독자를 유입 경로별로 분류하세요.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {segments.map((seg: any) => {
                  const conditions = seg.filterConditions || {};
                  return (
                    <Card key={seg.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="py-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color || "#b8860b" }} />
                            <h3 className="font-semibold text-ink">{seg.name}</h3>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => refreshSegmentMutation.mutate({ segmentId: seg.id })}
                              disabled={refreshSegmentMutation.isPending}
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${refreshSegmentMutation.isPending ? "animate-spin" : ""}`} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                              onClick={() => {
                                if (confirm(`"${seg.name}" 세그먼트를 삭제하시겠습니까?`)) {
                                  deleteSegmentMutation.mutate({ id: seg.id });
                                }
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {seg.description && (
                          <p className="text-xs text-muted-foreground mb-3">{seg.description}</p>
                        )}

                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-4 h-4 text-gold" />
                          <span className="text-lg font-bold text-ink">{seg.matchCount || 0}</span>
                          <span className="text-xs text-muted-foreground">명 매칭</span>
                        </div>

                        {/* Filter conditions summary */}
                        <div className="space-y-1.5">
                          {conditions.sources && conditions.sources.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <Filter className="w-3 h-3 text-muted-foreground" />
                              {conditions.sources.map((s: string) => (
                                <Badge key={s} variant="outline" className="text-[10px] py-0">
                                  {SOURCE_LABELS[s] || s}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {(conditions.subscribedAfter || conditions.subscribedBefore) && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {conditions.subscribedAfter && <span>{conditions.subscribedAfter} ~</span>}
                              {conditions.subscribedBefore && <span>~ {conditions.subscribedBefore}</span>}
                            </div>
                          )}
                          {conditions.tags && conditions.tags.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <Tag className="w-3 h-3 text-muted-foreground" />
                              {conditions.tags.map((t: string) => (
                                <Badge key={t} variant="outline" className="text-[10px] py-0">{t}</Badge>
                              ))}
                            </div>
                          )}
                          {conditions.hasCompany === true && (
                            <div className="text-[10px] text-muted-foreground">기업 구독자만</div>
                          )}
                        </div>

                        {seg.lastCalculatedAt && (
                          <p className="text-[10px] text-muted-foreground mt-2">
                            마지막 갱신: {formatDate(seg.lastCalculatedAt)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== Campaigns Tab ===== */}
        {activeTab === "campaigns" && (
          <div>
            {campsLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
            ) : !campaigns || campaigns.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">아직 캠페인이 없습니다.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setActiveTab("create")}>
                    <Plus className="w-4 h-4 mr-2" /> 첫 캠페인 만들기
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {campaigns.map((camp: any) => {
                  const status = STATUS_BADGE[camp.status] || STATUS_BADGE.draft;
                  const targetSegment = segments?.find((s: any) => s.id === camp.segmentId);
                  return (
                    <Card key={camp.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-ink">{camp.title}</h3>
                              <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
                              {targetSegment ? (
                                <Badge variant="outline" className="text-xs" style={{ borderColor: targetSegment.color, color: targetSegment.color }}>
                                  <Target className="w-3 h-3 mr-1" />{targetSegment.name}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-muted-foreground">전체 발송</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{camp.subject}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(camp.createdAt)}</span>
                              {camp.sentAt && <span className="flex items-center gap-1"><Send className="w-3 h-3" /> {formatDate(camp.sentAt)}</span>}
                              {camp.recipientCount > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {camp.recipientCount}명</span>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {camp.status === "draft" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const targetLabel = targetSegment ? `"${targetSegment.name}" 세그먼트` : "전체";
                                    const recipientCount = targetSegment
                                      ? subscribers?.filter((s: any) => s.tags?.some((t: string) => targetSegment.filterTags?.includes(t))).length || 0
                                      : subscribers?.length || 0;
                                    if (confirm(`"${camp.title}" 캠페인을 ${targetLabel} 구독자 약 ${recipientCount}명에게 발송하시겠습니까?\n\n발송 후에는 취소할 수 없습니다.`)) {
                                      sendCampaignMutation.mutate({ campaignId: camp.id, origin: window.location.origin });
                                    }
                                  }}
                                  disabled={sendCampaignMutation.isPending}
                                  className="bg-gold text-ink hover:bg-gold-light"
                                >
                                  {sendCampaignMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                                  발송
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (confirm("이 캠페인을 삭제하시겠습니까?")) {
                                      deleteCampaignMutation.mutate({ id: camp.id });
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {camp.status === "sent" && (
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> 발송 완료
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== Create Campaign Tab ===== */}
        {activeTab === "create" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MailPlus className="w-5 h-5 text-gold" /> 새 타겟 캠페인
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  createCampaignMutation.mutate({
                    title: campaignTitle,
                    subject: campaignSubject,
                    previewText: campaignPreview,
                    articleIds: selectedArticleIds.length > 0 ? selectedArticleIds : undefined,
                    customContent: campaignContent || undefined,
                    segmentId: selectedSegmentId,
                  });
                }}
              >
                {/* Target Segment Selection */}
                <div className="p-4 border border-gold/20 bg-gold/5">
                  <label className="block text-sm font-semibold text-ink mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-gold" /> 발송 대상 세그먼트
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSegmentId(undefined)}
                      className={`px-4 py-2 text-sm font-medium border transition-colors ${
                        !selectedSegmentId
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-border/50 text-muted-foreground hover:border-gold/30"
                      }`}
                    >
                      <Users className="w-4 h-4 inline mr-1" /> 전체 ({activeCount?.count || 0}명)
                    </button>
                    {segments?.map((seg: any) => (
                      <button
                        key={seg.id}
                        type="button"
                        onClick={() => setSelectedSegmentId(seg.id)}
                        className={`px-4 py-2 text-sm font-medium border transition-colors ${
                          selectedSegmentId === seg.id
                            ? "border-gold bg-gold/10 text-gold"
                            : "border-border/50 text-muted-foreground hover:border-gold/30"
                        }`}
                      >
                        <div className="w-2.5 h-2.5 rounded-full inline-block mr-1.5" style={{ backgroundColor: seg.color || "#b8860b" }} />
                        {seg.name} ({seg.matchCount || 0}명)
                      </button>
                    ))}
                  </div>
                  {segments?.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      세그먼트 탭에서 세그먼트를 먼저 만들면 타겟 발송이 가능합니다.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">캠페인 이름 (내부용) *</label>
                    <Input
                      value={campaignTitle}
                      onChange={(e) => setCampaignTitle(e.target.value)}
                      placeholder="예: 2026년 2월 견적고객 타겟"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">이메일 제목 *</label>
                    <Input
                      value={campaignSubject}
                      onChange={(e) => setCampaignSubject(e.target.value)}
                      placeholder="예: [고감도] 오피스 인테리어 비용 절감 가이드"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">미리보기 텍스트 (선택)</label>
                  <Input
                    value={campaignPreview}
                    onChange={(e) => setCampaignPreview(e.target.value)}
                    placeholder="이메일 미리보기에 표시될 짧은 문구"
                  />
                </div>

                {/* Article Selection */}
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">포함할 아티클 선택 (선택)</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-border/50 p-3">
                    {publishedArticles.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">발행된 아티클이 없습니다.</p>
                    ) : (
                      publishedArticles.map((article: any) => (
                        <label key={article.id} className="flex items-start gap-3 p-2 hover:bg-paper-warm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedArticleIds.includes(article.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedArticleIds([...selectedArticleIds, article.id]);
                              } else {
                                setSelectedArticleIds(selectedArticleIds.filter((id) => id !== article.id));
                              }
                            }}
                            className="mt-1"
                          />
                          <div>
                            <p className="text-sm font-medium text-ink">{article.title}</p>
                            <p className="text-xs text-muted-foreground">{article.excerpt?.substring(0, 80)}...</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  {selectedArticleIds.length > 0 && (
                    <p className="text-xs text-gold mt-1">{selectedArticleIds.length}개 아티클 선택됨</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">추가 메시지 (선택)</label>
                  <Textarea
                    value={campaignContent}
                    onChange={(e) => setCampaignContent(e.target.value)}
                    placeholder="구독자에게 전할 추가 메시지를 입력하세요..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-border/50">
                  <Button
                    type="submit"
                    disabled={createCampaignMutation.isPending}
                    className="bg-gold text-ink hover:bg-gold-light"
                  >
                    {createCampaignMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    캠페인 생성
                  </Button>
                  <p className="text-xs text-muted-foreground self-center">
                    생성 후 캠페인 탭에서 발송할 수 있습니다. {selectedSegmentId ? "선택된 세그먼트 구독자에게만 발송됩니다." : "전체 활성 구독자에게 발송됩니다."}
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ===== Stats Tab ===== */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-ink">유입 경로별 통계</h2>
            {sourceStats && Object.keys(sourceStats).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(sourceStats).sort((a: any, b: any) => b[1].total - a[1].total).map(([source, stats]: [string, any]) => {
                  const activeRate = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;
                  return (
                    <Card key={source}>
                      <CardContent className="py-5">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="outline" className="text-xs font-medium">
                            {SOURCE_LABELS[source] || source}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{activeRate}% 활성</span>
                        </div>
                        <div className="flex items-end gap-2 mb-2">
                          <span className="text-3xl font-bold text-ink">{stats.total}</span>
                          <span className="text-sm text-muted-foreground mb-1">명 총 구독</span>
                        </div>
                        <div className="w-full bg-border/30 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gold rounded-full transition-all"
                            style={{ width: `${activeRate}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                          <span>활성 {stats.active}명</span>
                          <span>해지 {stats.total - stats.active}명</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">아직 구독자 데이터가 없습니다.</p>
                </CardContent>
              </Card>
            )}

            {/* Source description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">유입 경로 설명</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] min-w-[70px] justify-center">{label}</Badge>
                      <span className="text-muted-foreground text-xs">
                        {key === "website" && "인사이트 페이지 구독 폼"}
                        {key === "contact_form" && "문의 폼을 통한 구독"}
                        {key === "manual" && "관리자 수동 등록"}
                        {key === "lead_magnet" && "리드마그넷 다운로드"}
                        {key === "estimator" && "AI 견적 페이지에서 구독"}
                        {key === "portfolio" && "포트폴리오 페이지에서 구독"}
                        {key === "insight" && "인사이트 아티클 하단 구독"}
                        {key === "ai_chat" && "AI 상담 채팅에서 구독"}
                        {key === "style_quiz" && "스타일 퀴즈 결과에서 구독"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
