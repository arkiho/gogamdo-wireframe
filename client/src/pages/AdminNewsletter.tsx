/*
 * Admin Newsletter Management Page
 * Manage subscribers, create campaigns, send newsletters
 */

import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Mail, Users, Send, Plus, Loader2, Trash2, Eye,
  CheckCircle2, XCircle, Clock, FileText, MailPlus
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

export default function AdminNewsletter() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"subscribers" | "campaigns" | "create">("subscribers");

  // Campaign creation state
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignPreview, setCampaignPreview] = useState("");
  const [campaignContent, setCampaignContent] = useState("");
  const [selectedArticleIds, setSelectedArticleIds] = useState<number[]>([]);

  const { data: subscribers, isLoading: subsLoading } = trpc.newsletter.subscribers.useQuery(undefined, { enabled: !!user });
  const { data: campaigns, isLoading: campsLoading, refetch: refetchCampaigns } = trpc.newsletter.campaigns.useQuery(undefined, { enabled: !!user });
  const { data: articles } = trpc.insight.all.useQuery(undefined, { enabled: !!user });
  const { data: activeCount } = trpc.newsletter.activeCount.useQuery(undefined, { enabled: !!user });

  const createCampaignMutation = trpc.newsletter.createCampaign.useMutation({
    onSuccess: () => {
      toast.success("캠페인이 생성되었습니다.");
      setCampaignTitle("");
      setCampaignSubject("");
      setCampaignPreview("");
      setCampaignContent("");
      setSelectedArticleIds([]);
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
    onSuccess: () => {
      toast.success("캠페인이 삭제되었습니다.");
      refetchCampaigns();
    },
    onError: (err) => toast.error(err.message),
  });

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>;
  }

  if (!user || user.role !== "admin") {
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
              <p className="text-sm text-muted-foreground mt-1">구독자 관리 및 뉴스레터 캠페인 발송</p>
            </div>
            <div className="flex gap-3">
              <div className="text-center px-4 py-2 bg-paper-warm border border-border/50">
                <p className="text-2xl font-bold text-ink">{activeCount?.count || 0}</p>
                <p className="text-xs text-muted-foreground">활성 구독자</p>
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
          <div className="flex gap-0">
            {[
              { key: "subscribers" as const, label: "구독자", icon: Users },
              { key: "campaigns" as const, label: "캠페인", icon: FileText },
              { key: "create" as const, label: "새 캠페인", icon: MailPlus },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
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
        {/* Subscribers Tab */}
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
                  <CardTitle className="text-lg">구독자 목록 ({subscribers.length}명)</CardTitle>
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
                                {sub.source === "website" ? "웹사이트" : sub.source === "contact_form" ? "문의폼" : sub.source === "lead_magnet" ? "리드마그넷" : sub.source || "-"}
                              </Badge>
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

        {/* Campaigns Tab */}
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
                  return (
                    <Card key={camp.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-ink">{camp.title}</h3>
                              <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">제목: {camp.subject}</p>
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
                                    if (confirm(`"${camp.title}" 캠페인을 ${activeCount?.count || 0}명의 구독자에게 발송하시겠습니까?`)) {
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

        {/* Create Campaign Tab */}
        {activeTab === "create" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MailPlus className="w-5 h-5 text-gold" /> 새 뉴스레터 캠페인
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
                  });
                }}
              >
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">캠페인 이름 (내부용)</label>
                  <Input
                    value={campaignTitle}
                    onChange={(e) => setCampaignTitle(e.target.value)}
                    placeholder="예: 2026년 2월 뉴스레터"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">이메일 제목</label>
                  <Input
                    value={campaignSubject}
                    onChange={(e) => setCampaignSubject(e.target.value)}
                    placeholder="예: [고감도] 2026 사무공간 트렌드 리포트"
                    required
                  />
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
                    생성 후 캠페인 탭에서 발송할 수 있습니다.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
