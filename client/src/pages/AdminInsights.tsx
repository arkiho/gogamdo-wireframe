/**
 * Admin Insights Management Page
 * Manage insight articles, AI auto-generate, publish/archive
 */
import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Loader2, Trash2, Eye, Sparkles, Edit, Globe,
  Archive, FileText, Clock, BarChart3, Tag, BookOpen
} from "lucide-react";
import { Streamdown } from "streamdown";

const CATEGORY_LABELS: Record<string, string> = {
  trend: "트렌드",
  cost_guide: "비용 가이드",
  case_study: "사례 연구",
  tip: "실용 팁",
  news: "업계 뉴스",
};

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "초안", variant: "outline" },
  published: { label: "발행됨", variant: "default" },
  archived: { label: "보관됨", variant: "secondary" },
};

function formatDate(date: string | Date | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default function AdminInsights() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>("all");
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [showPreview, setShowPreview] = useState<number | null>(null);
  const [aiTopic, setAiTopic] = useState("");
  const [aiCategory, setAiCategory] = useState<string>("trend");
  const [aiAudience, setAiAudience] = useState("");

  const { data: articles, isLoading, refetch } = trpc.insight.all.useQuery(undefined, { enabled: !!user });
  const aiGenerateMutation = trpc.insight.aiGenerate.useMutation({
    onSuccess: () => {
      toast.success("AI 아티클이 생성되었습니다 (초안)");
      refetch();
      setShowAiDialog(false);
      setAiTopic("");
    },
    onError: (err) => toast.error(`생성 실패: ${err.message}`),
  });
  const updateMutation = trpc.insight.update.useMutation({
    onSuccess: () => {
      toast.success("아티클이 업데이트되었습니다");
      refetch();
    },
    onError: (err) => toast.error(`업데이트 실패: ${err.message}`),
  });
  const deleteMutation = trpc.insight.delete.useMutation({
    onSuccess: () => {
      toast.success("아티클이 삭제되었습니다");
      refetch();
    },
    onError: (err) => toast.error(`삭제 실패: ${err.message}`),
  });

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">관리자 권한이 필요합니다.</p>
      </div>
    );
  }

  const filteredArticles = articles?.filter((a: any) => {
    if (filter === "all") return true;
    return a.status === filter || a.category === filter;
  }) || [];

  const previewArticle = articles?.find((a: any) => a.id === showPreview);

  const stats = {
    total: articles?.length || 0,
    published: articles?.filter((a: any) => a.status === "published").length || 0,
    draft: articles?.filter((a: any) => a.status === "draft").length || 0,
    totalViews: articles?.reduce((sum: number, a: any) => sum + (a.viewCount || 0), 0) || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> 관리자</Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-ink flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-gold" /> 인사이트 관리
                </h1>
                <p className="text-sm text-muted-foreground">아티클 관리 및 AI 자동 생성</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAiDialog(true)}>
                <Sparkles className="w-4 h-4 mr-1" /> AI 아티클 생성
              </Button>
              <Link href="/admin/newsletter">
                <Button variant="outline" size="sm">뉴스레터 관리 →</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-ink">{stats.total}</p>
              <p className="text-xs text-muted-foreground">전체 아티클</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.published}</p>
              <p className="text-xs text-muted-foreground">발행됨</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.draft}</p>
              <p className="text-xs text-muted-foreground">초안</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.totalViews.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">총 조회수</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "전체" },
            { key: "published", label: "발행됨" },
            { key: "draft", label: "초안" },
            { key: "archived", label: "보관됨" },
            ...Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ key: k, label: v })),
          ].map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.key)}
              className={filter === f.key ? "bg-gold text-ink hover:bg-gold/90" : ""}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Article List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gold" />
          </div>
        ) : filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">아티클이 없습니다</p>
              <Button className="mt-4 bg-gold text-ink hover:bg-gold/90" onClick={() => setShowAiDialog(true)}>
                <Sparkles className="w-4 h-4 mr-1" /> AI로 첫 아티클 생성
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredArticles.map((article: any) => (
              <Card key={article.id} className="hover:border-gold/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Cover Image */}
                    {article.coverImageUrl && (
                      <img
                        src={article.coverImageUrl}
                        alt={article.title}
                        className="w-20 h-20 object-cover rounded flex-shrink-0"
                      />
                    )}
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={STATUS_BADGE[article.status]?.variant || "outline"}>
                          {STATUS_BADGE[article.status]?.label || article.status}
                        </Badge>
                        <Badge variant="secondary">{CATEGORY_LABELS[article.category] || article.category}</Badge>
                        {article.featured && <Badge className="bg-gold/20 text-gold border-gold/30">추천</Badge>}
                      </div>
                      <h3 className="font-semibold text-ink truncate">{article.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{article.excerpt}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(article.publishedAt || article.createdAt)}</span>
                        <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {article.viewCount || 0}회</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {article.readTimeMinutes || 5}분</span>
                        {article.author && <span>{article.author}</span>}
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => setShowPreview(article.id)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      {article.status === "draft" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-600"
                          onClick={() => updateMutation.mutate({ id: article.id, status: "published" })}
                        >
                          <Globe className="w-4 h-4" />
                        </Button>
                      )}
                      {article.status === "published" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-amber-600"
                          onClick={() => updateMutation.mutate({ id: article.id, status: "archived" })}
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm("이 아티클을 삭제하시겠습니까?")) {
                            deleteMutation.mutate({ id: article.id });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* AI Generate Dialog */}
      <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold" /> AI 아티클 자동 생성
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-ink mb-1 block">카테고리</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={aiCategory === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAiCategory(key)}
                    className={aiCategory === key ? "bg-gold text-ink hover:bg-gold/90" : ""}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-ink mb-1 block">주제 (선택사항)</label>
              <Input
                placeholder="비워두면 AI가 자동으로 주제를 선정합니다"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">예: 2026년 하이브리드 오피스 트렌드, 소규모 사무실 비용 절감 팁</p>
            </div>
            <div>
              <label className="text-sm font-medium text-ink mb-1 block">대상 독자 (선택사항)</label>
              <Input
                placeholder="기본: 사무실 인테리어를 계획 중인 기업 담당자"
                value={aiAudience}
                onChange={(e) => setAiAudience(e.target.value)}
              />
            </div>
            <Button
              className="w-full bg-gold text-ink hover:bg-gold/90"
              disabled={aiGenerateMutation.isPending}
              onClick={() => {
                aiGenerateMutation.mutate({
                  topic: aiTopic || undefined,
                  category: aiCategory as any,
                  targetAudience: aiAudience || undefined,
                });
              }}
            >
              {aiGenerateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> AI가 아티클을 작성 중...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> 아티클 생성</>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              생성된 아티클은 초안 상태로 저장됩니다. 검토 후 발행해주세요.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      {previewArticle && (
        <Dialog open={!!showPreview} onOpenChange={() => setShowPreview(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{previewArticle.title}</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {previewArticle.coverImageUrl && (
                <img
                  src={previewArticle.coverImageUrl}
                  alt={previewArticle.title}
                  className="w-full h-48 object-cover rounded mb-4"
                />
              )}
              <div className="flex items-center gap-2 mb-4">
                <Badge variant={STATUS_BADGE[previewArticle.status]?.variant || "outline"}>
                  {STATUS_BADGE[previewArticle.status]?.label}
                </Badge>
                <Badge variant="secondary">{CATEGORY_LABELS[previewArticle.category]}</Badge>
                <span className="text-xs text-muted-foreground">{previewArticle.author}</span>
              </div>
              {previewArticle.subtitle && (
                <p className="text-lg text-muted-foreground mb-4">{previewArticle.subtitle}</p>
              )}
              <div className="prose prose-sm max-w-none">
                <Streamdown>{previewArticle.content}</Streamdown>
              </div>
              {previewArticle.tags && previewArticle.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-6 pt-4 border-t">
                  {previewArticle.tags.map((tag: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" /> {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-6 pt-4 border-t">
                {previewArticle.status === "draft" && (
                  <Button
                    className="bg-green-600 text-white hover:bg-green-700"
                    onClick={() => {
                      updateMutation.mutate({ id: previewArticle.id, status: "published" });
                      setShowPreview(null);
                    }}
                  >
                    <Globe className="w-4 h-4 mr-1" /> 발행하기
                  </Button>
                )}
                {previewArticle.status === "published" && (
                  <Link href={`/insights/${previewArticle.slug}`}>
                    <Button variant="outline">
                      <Eye className="w-4 h-4 mr-1" /> 공개 페이지 보기
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
