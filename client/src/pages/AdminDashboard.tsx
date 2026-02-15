import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare, Users, Calculator, AlertCircle,
  ArrowLeft, Mail, Phone, Building2, Calendar,
  ChevronDown, ChevronUp, LogOut, Download,
  Bot, Sparkles, ExternalLink, Megaphone, Plus, Trash2, ToggleLeft, ToggleRight,
  Image, Eye, Archive, Send, Wand2, Upload, FolderOpen, Check, X, Loader2,
  HardDrive, RefreshCw, CloudDownload, BarChart3, Bell, Clock, Link2,
} from "lucide-react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import Logo from "@/components/Logo";
import NotificationCenter from "@/components/NotificationCenter";

type TabType = "overview" | "inquiries" | "subscribers" | "estimates" | "leads" | "ai-chat" | "ai-style" | "announcements" | "popups" | "notifications" | "portfolio" | "drive-sync";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  new: { label: "신규", variant: "destructive" },
  contacted: { label: "연락완료", variant: "default" },
  in_progress: { label: "진행중", variant: "secondary" },
  completed: { label: "완료", variant: "outline" },
};

function formatDate(d: Date | string | null) {
  if (!d) return "-";
  const date = new Date(d);
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatNumber(n: number | null | undefined) {
  if (n == null) return "-";
  return n.toLocaleString("ko-KR");
}

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [expandedInquiry, setExpandedInquiry] = useState<number | null>(null);

  const stats = trpc.admin.stats.useQuery(undefined, { enabled: !!user && user.role === "admin" });
  const inquiries = trpc.inquiry.list.useQuery(undefined, { enabled: !!user && user.role === "admin" });
  const subscribers = trpc.newsletter.list.useQuery(undefined, { enabled: !!user && user.role === "admin" });
  const estimates = trpc.estimate.list.useQuery(undefined, { enabled: !!user && user.role === "admin" });
  const leadDownloads = trpc.leadMagnet.list.useQuery(undefined, { enabled: !!user && user.role === "admin" });
  const chatSessions = trpc.aiChat.list.useQuery(undefined, { enabled: !!user && user.role === "admin" });
  const styleRecs = trpc.aiStyle.list.useQuery(undefined, { enabled: !!user && user.role === "admin" });
  const announcementsList = trpc.announcement.list.useQuery(undefined, { enabled: !!user && user.role === "admin" });
  const portfolioDrafts = trpc.portfolio.list.useQuery(undefined, { enabled: !!user && user.role === "admin" });

  // Announcement mutations
  const [showNewAnnouncement, setShowNewAnnouncement] = useState(false);
  const [newAnn, setNewAnn] = useState({ title: "", message: "", linkUrl: "", linkText: "", bgColor: "#111111", textColor: "#ffffff" });
  const createAnnouncement = trpc.announcement.create.useMutation({
    onSuccess: () => { announcementsList.refetch(); setShowNewAnnouncement(false); setNewAnn({ title: "", message: "", linkUrl: "", linkText: "", bgColor: "#111111", textColor: "#ffffff" }); },
  });
  const updateAnnouncement = trpc.announcement.update.useMutation({
    onSuccess: () => announcementsList.refetch(),
  });
  const deleteAnnouncement = trpc.announcement.delete.useMutation({
    onSuccess: () => announcementsList.refetch(),
  });

  const updateStatus = trpc.inquiry.updateStatus.useMutation({
    onSuccess: () => {
      inquiries.refetch();
      stats.refetch();
    },
  });

  const toggleActive = trpc.newsletter.toggleActive.useMutation({
    onSuccess: () => subscribers.refetch(),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-center space-y-6 max-w-md px-6">
          <Logo className="w-32 h-8 mx-auto" color="#111" />
          <h1 className="font-heading text-2xl font-bold text-ink">관리자 로그인</h1>
          <p className="text-muted-foreground text-sm">관리자 대시보드에 접근하려면 로그인이 필요합니다.</p>
          <Button onClick={() => { window.location.href = getLoginUrl(); }} className="bg-ink text-white hover:bg-ink/90">
            로그인
          </Button>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-center space-y-4 max-w-md px-6">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="font-heading text-2xl font-bold text-ink">접근 권한 없음</h1>
          <p className="text-muted-foreground text-sm">관리자 권한이 필요합니다.</p>
          <Link href="/">
            <Button variant="outline">홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "overview", label: "개요", icon: <Calculator className="w-4 h-4" /> },
    { id: "inquiries", label: "문의", icon: <MessageSquare className="w-4 h-4" />, count: stats.data?.newInquiries },
    { id: "subscribers", label: "구독자", icon: <Users className="w-4 h-4" />, count: stats.data?.subscribers },
    { id: "estimates", label: "견적", icon: <Calculator className="w-4 h-4" />, count: stats.data?.estimates },
    { id: "leads", label: "리드", icon: <Download className="w-4 h-4" /> },
    { id: "ai-chat", label: "AI 상담", icon: <Bot className="w-4 h-4" />, count: chatSessions.data?.length },
    { id: "ai-style", label: "AI 스타일", icon: <Sparkles className="w-4 h-4" />, count: styleRecs.data?.length },
    { id: "announcements", label: "공지관리", icon: <Megaphone className="w-4 h-4" />, count: announcementsList.data?.length },
    { id: "popups", label: "팝업관리", icon: <Eye className="w-4 h-4" /> },
    { id: "notifications", label: "알림센터", icon: <Bell className="w-4 h-4" /> },
    { id: "portfolio", label: "포트폴리오", icon: <Image className="w-4 h-4" />, count: portfolioDrafts.data?.length },
    { id: "drive-sync", label: "드라이브 동기화", icon: <HardDrive className="w-4 h-4" /> },
  ];

  // DDIA 바로가기 링크
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <span className="flex items-center gap-2 text-sm text-muted-foreground hover:text-ink transition-colors">
                <ArrowLeft className="w-4 h-4" />
                사이트로
              </span>
            </Link>
            <div className="h-5 w-px bg-border" />
            <Logo className="w-24 h-6" color="#111" />
            <span className="text-xs font-medium tracking-widest uppercase text-gold">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter />
            <span className="text-sm text-muted-foreground">{user.name || user.email}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 bg-white rounded-lg p-1 border border-border/50 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-ink text-white"
                  : "text-muted-foreground hover:text-ink hover:bg-paper-warm"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count != null && tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? "bg-gold text-ink" : "bg-muted text-muted-foreground"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> 총 문의
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-heading font-bold text-ink">{formatNumber(stats.data?.inquiries)}</div>
                  {(stats.data?.newInquiries ?? 0) > 0 && (
                    <p className="text-xs text-destructive mt-1 font-medium">신규 {stats.data?.newInquiries}건</p>
                  )}
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" /> 뉴스레터 구독자
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-heading font-bold text-ink">{formatNumber(stats.data?.subscribers)}</div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calculator className="w-4 h-4" /> AI 견적 요청
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-heading font-bold text-ink">{formatNumber(stats.data?.estimates)}</div>
                </CardContent>
              </Card>
              <Card className="border-border/50 border-gold/30 bg-gold/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> 즉시 대응 필요
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-heading font-bold text-gold">{formatNumber(stats.data?.newInquiries)}</div>
                  <p className="text-xs text-muted-foreground mt-1">미처리 문의</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Inquiries Preview */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-heading">최근 문의</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("inquiries")} className="text-gold hover:text-gold-dark">
                    전체 보기
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {inquiries.isLoading ? (
                  <div className="text-sm text-muted-foreground py-8 text-center">로딩 중...</div>
                ) : (inquiries.data?.length ?? 0) === 0 ? (
                  <div className="text-sm text-muted-foreground py-8 text-center">아직 접수된 문의가 없습니다.</div>
                ) : (
                  <div className="space-y-3">
                    {inquiries.data?.slice(0, 5).map((inq: any) => (
                      <div key={inq.id} className="flex items-center justify-between p-3 rounded-lg bg-paper-warm hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Badge variant={STATUS_MAP[inq.status]?.variant || "secondary"} className="text-xs">
                            {STATUS_MAP[inq.status]?.label || inq.status}
                          </Badge>
                          <div>
                            <p className="text-sm font-medium text-ink">{inq.name} {inq.company && <span className="text-muted-foreground">({inq.company})</span>}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[300px]">{inq.message}</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(inq.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* DDIA 바로가기 */}
            <Card className="border-gold/30 bg-gradient-to-r from-gold/5 to-transparent cursor-pointer hover:border-gold/50 transition-colors" onClick={() => navigate("/admin/ddia")}>
              <CardContent className="py-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-ink">DDIA 공간 분석</h3>
                    <p className="text-xs text-muted-foreground">Data Driven Interior Architecture — 센서 데이터 수집 및 공간 분석</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>

            {/* 설계 자동화 바로가기 */}
            <Card className="border-emerald-300/30 bg-gradient-to-r from-emerald-50/50 to-transparent cursor-pointer hover:border-emerald-400/50 transition-colors" onClick={() => navigate("/admin/design-auto")}>
              <CardContent className="py-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Wand2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-ink">설계 자동화</h3>
                    <p className="text-xs text-muted-foreground">도면 → RFP → 레이아웃 → 렌더링 → 제안서 → 견적서 자동 생성</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>

            {/* 리뷰 관리 바로가기 */}
            <Card className="border-purple-300/30 bg-gradient-to-r from-purple-50/50 to-transparent cursor-pointer hover:border-purple-400/50 transition-colors" onClick={() => navigate("/admin/reviews")}>
              <CardContent className="py-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-ink">포트폴리오 리뷰</h3>
                    <p className="text-xs text-muted-foreground">담당자 리뷰 요청 생성, 승인/거절 관리</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>

            {/* CRM 바로가기 */}
            <Card className="border-blue-300/30 bg-gradient-to-r from-blue-50/50 to-transparent cursor-pointer hover:border-blue-400/50 transition-colors" onClick={() => navigate("/admin/crm")}>
              <CardContent className="py-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-ink">고객 관리 (CRM)</h3>
                    <p className="text-xs text-muted-foreground">고객 관리, 상담 이력, 딜 파이프라인, 프로젝트 추적</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Inquiries Tab */}
        {activeTab === "inquiries" && (
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-bold text-ink">문의 관리</h2>
            {inquiries.isLoading ? (
              <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
            ) : (inquiries.data?.length ?? 0) === 0 ? (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center text-muted-foreground">
                  아직 접수된 문의가 없습니다.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {inquiries.data?.map((inq: any) => (
                  <Card key={inq.id} className="border-border/50 overflow-hidden">
                    <div
                      className="p-4 cursor-pointer hover:bg-paper-warm/50 transition-colors"
                      onClick={() => setExpandedInquiry(expandedInquiry === inq.id ? null : inq.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant={STATUS_MAP[inq.status]?.variant || "secondary"} className="text-xs">
                            {STATUS_MAP[inq.status]?.label || inq.status}
                          </Badge>
                          <div>
                            <p className="font-medium text-ink">{inq.name}</p>
                            {inq.company && <p className="text-xs text-muted-foreground">{inq.company}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{formatDate(inq.createdAt)}</span>
                          {expandedInquiry === inq.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </div>
                    </div>

                    {expandedInquiry === inq.id && (
                      <div className="px-4 pb-4 border-t border-border/30 pt-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <a href={`mailto:${inq.email}`} className="text-gold hover:underline">{inq.email}</a>
                          </div>
                          {inq.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <a href={`tel:${inq.phone}`} className="hover:underline">{inq.phone}</a>
                            </div>
                          )}
                          {inq.company && (
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span>{inq.company}</span>
                            </div>
                          )}
                        </div>
                        {(inq.type || inq.budget || inq.area) && (
                          <div className="flex flex-wrap gap-2">
                            {inq.type && <Badge variant="outline" className="text-xs">유형: {inq.type}</Badge>}
                            {inq.budget && <Badge variant="outline" className="text-xs">예산: {inq.budget}</Badge>}
                            {inq.area && <Badge variant="outline" className="text-xs">면적: {inq.area}</Badge>}
                          </div>
                        )}
                        <div className="bg-paper-warm rounded-lg p-4">
                          <p className="text-sm text-ink whitespace-pre-wrap">{inq.message}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs text-muted-foreground">상태 변경:</span>
                          <Select
                            value={inq.status}
                            onValueChange={(val: string) => updateStatus.mutate({ id: inq.id, status: val as any })}
                          >
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">신규</SelectItem>
                              <SelectItem value="contacted">연락완료</SelectItem>
                              <SelectItem value="in_progress">진행중</SelectItem>
                              <SelectItem value="completed">완료</SelectItem>
                            </SelectContent>
                          </Select>
                          <a
                            href={`mailto:${inq.email}?subject=${encodeURIComponent(`[${"\uACE0\uAC10\uB3C4"}] ${inq.name}\uB2D8 \uBB38\uC758 \uD68C\uC2E0`)}&body=${encodeURIComponent(`${inq.name}\uB2D8 \uC548\uB155\uD558\uC138\uC694,\n\n\uACE0\uAC10\uB3C4\uC5D0 \uBB38\uC758\uD574 \uC8FC\uC154\uC11C \uAC10\uC0AC\uD569\uB2C8\uB2E4.\n\n---\n\uACE0\uAC10\uB3C4 \uB300\uD45C\uC804\uD654: 02-6952-3111\nhttps://kokamdo.co.kr`)}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gold/10 text-gold text-xs font-medium rounded hover:bg-gold/20 transition-colors"
                          >
                            <Send className="w-3 h-3" /> 이메일 회신
                          </a>
                          {inq.phone && (
                            <a
                              href={`tel:${inq.phone}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-ink/5 text-ink text-xs font-medium rounded hover:bg-ink/10 transition-colors"
                            >
                              <Phone className="w-3 h-3" /> 전화 걸기
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Subscribers Tab */}
        {activeTab === "subscribers" && (
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-bold text-ink">뉴스레터 구독자</h2>
            {subscribers.isLoading ? (
              <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
            ) : (subscribers.data?.length ?? 0) === 0 ? (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center text-muted-foreground">
                  아직 구독자가 없습니다.
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50 bg-paper-warm">
                          <th className="text-left p-3 font-medium text-muted-foreground">이메일</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">이름</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">회사</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">유입경로</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">상태</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">가입일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscribers.data?.map((sub: any) => (
                          <tr key={sub.id} className="border-b border-border/30 hover:bg-paper-warm/50 transition-colors">
                            <td className="p-3 text-ink font-medium">{sub.email}</td>
                            <td className="p-3 text-muted-foreground">{sub.name || "-"}</td>
                            <td className="p-3 text-muted-foreground">{sub.company || "-"}</td>
                            <td className="p-3"><Badge variant="outline" className="text-xs">{sub.source || "footer"}</Badge></td>
                            <td className="p-3">
                              <button
                                onClick={() => toggleActive.mutate({ id: sub.id, active: sub.active === "yes" ? "no" : "yes" })}
                                className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                                  sub.active === "yes"
                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                    : "bg-red-100 text-red-700 hover:bg-red-200"
                                }`}
                              >
                                {sub.active === "yes" ? "활성" : "비활성"}
                              </button>
                            </td>
                            <td className="p-3 text-xs text-muted-foreground">{formatDate(sub.createdAt)}</td>
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

        {/* Estimates Tab */}
        {activeTab === "estimates" && (
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-bold text-ink">AI 견적 이력</h2>
            {estimates.isLoading ? (
              <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
            ) : (estimates.data?.length ?? 0) === 0 ? (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center text-muted-foreground">
                  아직 견적 요청이 없습니다.
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50 bg-paper-warm">
                          <th className="text-left p-3 font-medium text-muted-foreground">공간유형</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">면적(평)</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">등급</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">예상 견적</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">연락처</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">일시</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estimates.data?.map((est: any) => (
                          <tr key={est.id} className="border-b border-border/30 hover:bg-paper-warm/50 transition-colors">
                            <td className="p-3 text-ink font-medium">{est.spaceType || "-"}</td>
                            <td className="p-3 text-muted-foreground">{est.area ? `${est.area}평` : "-"}</td>
                            <td className="p-3">
                              {est.grade && (
                                <Badge variant="outline" className="text-xs">
                                  {est.grade === "standard" ? "스탠다드" : est.grade === "premium" ? "프리미엄" : est.grade === "luxury" ? "럭셔리" : est.grade}
                                </Badge>
                              )}
                            </td>
                            <td className="p-3 text-ink">
                              {est.totalMin && est.totalMax
                                ? `${formatNumber(est.totalMin)} ~ ${formatNumber(est.totalMax)}만원`
                                : "-"}
                            </td>
                            <td className="p-3 text-muted-foreground text-xs">
                              {est.contactName || est.contactEmail ? (
                                <div>
                                  {est.contactName && <div>{est.contactName}</div>}
                                  {est.contactEmail && <a href={`mailto:${est.contactEmail}`} className="text-gold hover:underline">{est.contactEmail}</a>}
                                </div>
                              ) : "-"}
                            </td>
                            <td className="p-3 text-xs text-muted-foreground">{formatDate(est.createdAt)}</td>
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
        {/* Lead Downloads Tab */}
        {activeTab === "leads" && (
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-bold text-ink">리드 마그넷 다운로드</h2>
            {leadDownloads.isLoading ? (
              <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
            ) : (leadDownloads.data?.length ?? 0) === 0 ? (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center text-muted-foreground">
                  아직 다운로드 이력이 없습니다.
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50 bg-paper-warm">
                          <th className="text-left p-3 font-medium text-muted-foreground">이메일</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">이름</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">회사</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">자료</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">일시</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leadDownloads.data?.map((lead: any) => (
                          <tr key={lead.id} className="border-b border-border/30 hover:bg-paper-warm/50 transition-colors">
                            <td className="p-3 text-ink font-medium">{lead.email}</td>
                            <td className="p-3 text-muted-foreground">{lead.name || "-"}</td>
                            <td className="p-3 text-muted-foreground">{lead.company || "-"}</td>
                            <td className="p-3"><Badge variant="outline" className="text-xs">{lead.resourceTitle || lead.resourceId}</Badge></td>
                            <td className="p-3 text-xs text-muted-foreground">{formatDate(lead.createdAt)}</td>
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
        {/* AI Chat Sessions Tab */}
        {activeTab === "ai-chat" && (
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-bold text-ink">AI 상담 세션</h2>
            {chatSessions.isLoading ? (
              <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
            ) : (chatSessions.data?.length ?? 0) === 0 ? (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center text-muted-foreground">
                  아직 AI 상담 이력이 없습니다.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {chatSessions.data?.map((session: any) => {
                  const msgs = Array.isArray(session.messages) ? session.messages : [];
                  const userMsgs = msgs.filter((m: any) => m.role === "user");
                  const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
                  return (
                    <Card key={session.id} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Bot className="w-4 h-4 text-gold" />
                              <span className="text-sm font-medium text-ink">
                                세션 {session.sessionId?.slice(0, 8)}...
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {userMsgs.length}회 대화
                              </Badge>
                              {session.contactEmail && (
                                <Badge variant="default" className="text-xs bg-gold text-ink">
                                  리드 수집
                                </Badge>
                              )}
                            </div>
                            {session.contactEmail && (
                              <div className="flex flex-wrap gap-3 mb-2 text-xs text-muted-foreground">
                                {session.contactName && (
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" /> {session.contactName}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  <a href={`mailto:${session.contactEmail}`} className="text-gold hover:underline">{session.contactEmail}</a>
                                </span>
                                {session.contactPhone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> {session.contactPhone}
                                  </span>
                                )}
                              </div>
                            )}
                            {lastMsg && (
                              <p className="text-xs text-muted-foreground truncate max-w-[500px]">
                                마지막: {lastMsg.content?.slice(0, 100)}{lastMsg.content?.length > 100 ? "..." : ""}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(session.updatedAt || session.createdAt)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* AI Style Recommendations Tab */}
        {activeTab === "ai-style" && (
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-bold text-ink">AI 스타일 추천 기록</h2>
            {styleRecs.isLoading ? (
              <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
            ) : (styleRecs.data?.length ?? 0) === 0 ? (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center text-muted-foreground">
                  아직 AI 스타일 추천 이력이 없습니다.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {styleRecs.data?.map((rec: any) => {
                  const result = typeof rec.resultJson === "string" ? JSON.parse(rec.resultJson) : rec.resultJson;
                  const priorities = typeof rec.priorities === "string" ? JSON.parse(rec.priorities) : rec.priorities;
                  return (
                    <Card key={rec.id} className="border-border/50 overflow-hidden">
                      {rec.imageUrl && (
                        <div className="aspect-[16/9] overflow-hidden">
                          <img src={rec.imageUrl} alt={result?.styleName || "추천 스타일"} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-gold" />
                            <span className="font-heading font-bold text-ink">
                              {result?.styleName || "스타일 추천"}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDate(rec.createdAt)}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">{rec.industry}</Badge>
                          <Badge variant="outline" className="text-xs">{rec.teamSize}</Badge>
                          <Badge variant="outline" className="text-xs">{rec.mood}</Badge>
                          <Badge variant="outline" className="text-xs">{rec.budget}</Badge>
                        </div>
                        {Array.isArray(priorities) && priorities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {priorities.map((p: string, i: number) => (
                              <span key={i} className="text-xs px-2 py-0.5 bg-gold/10 text-gold rounded-full">{p}</span>
                            ))}
                          </div>
                        )}
                        {result?.colorPalette && (
                          <div className="flex gap-1 mb-3">
                            {result.colorPalette.slice(0, 5).map((c: any, i: number) => (
                              <div key={i} className="flex flex-col items-center gap-1">
                                <div className="w-8 h-8 rounded-full border border-border/50" style={{ backgroundColor: c.hex }} title={`${c.name}: ${c.usage}`} />
                                <span className="text-[10px] text-muted-foreground">{c.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {rec.contactEmail && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <a href={`mailto:${rec.contactEmail}`} className="text-xs text-gold hover:underline">{rec.contactEmail}</a>
                            <Badge variant="default" className="text-xs bg-gold text-ink ml-auto">리드</Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {/* Announcements Tab */}
        {activeTab === "announcements" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold text-ink">공지 배너 관리</h2>
              <Button onClick={() => setShowNewAnnouncement(!showNewAnnouncement)} className="bg-ink text-white hover:bg-ink/90">
                <Plus className="w-4 h-4 mr-1" />
                새 공지
              </Button>
            </div>

            {showNewAnnouncement && (
              <Card className="border-gold/30">
                <CardHeader>
                  <CardTitle className="text-lg">새 공지 작성</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">제목 *</label>
                      <input
                        type="text"
                        value={newAnn.title}
                        onChange={e => setNewAnn({ ...newAnn, title: e.target.value })}
                        placeholder="예: 봄맞이 이벤트"
                        className="w-full px-3 py-2 border border-border rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">메시지 *</label>
                      <input
                        type="text"
                        value={newAnn.message}
                        onChange={e => setNewAnn({ ...newAnn, message: e.target.value })}
                        placeholder="예: 3월 한정 인테리어 상담 20% 할인"
                        className="w-full px-3 py-2 border border-border rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">링크 URL</label>
                      <input
                        type="text"
                        value={newAnn.linkUrl}
                        onChange={e => setNewAnn({ ...newAnn, linkUrl: e.target.value })}
                        placeholder="/contact"
                        className="w-full px-3 py-2 border border-border rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">링크 텍스트</label>
                      <input
                        type="text"
                        value={newAnn.linkText}
                        onChange={e => setNewAnn({ ...newAnn, linkText: e.target.value })}
                        placeholder="자세히 보기"
                        className="w-full px-3 py-2 border border-border rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">배경색</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={newAnn.bgColor}
                          onChange={e => setNewAnn({ ...newAnn, bgColor: e.target.value })}
                          className="w-10 h-10 rounded cursor-pointer border-0"
                        />
                        <input
                          type="text"
                          value={newAnn.bgColor}
                          onChange={e => setNewAnn({ ...newAnn, bgColor: e.target.value })}
                          className="flex-1 px-3 py-2 border border-border rounded-md text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">글자색</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={newAnn.textColor}
                          onChange={e => setNewAnn({ ...newAnn, textColor: e.target.value })}
                          className="w-10 h-10 rounded cursor-pointer border-0"
                        />
                        <input
                          type="text"
                          value={newAnn.textColor}
                          onChange={e => setNewAnn({ ...newAnn, textColor: e.target.value })}
                          className="flex-1 px-3 py-2 border border-border rounded-md text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Preview */}
                  <div className="rounded-md overflow-hidden" style={{ backgroundColor: newAnn.bgColor, color: newAnn.textColor }}>
                    <div className="flex items-center justify-center gap-3 py-2.5 px-4">
                      <p className="text-xs sm:text-sm font-medium">
                        <span className="font-semibold mr-1.5">{newAnn.title || "제목"}</span>
                        <span className="opacity-80">{newAnn.message || "메시지"}</span>
                      </p>
                      {newAnn.linkText && <span className="text-xs font-semibold underline">{newAnn.linkText}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => createAnnouncement.mutate({ title: newAnn.title, message: newAnn.message, linkUrl: newAnn.linkUrl || undefined, linkText: newAnn.linkText || undefined, bgColor: newAnn.bgColor, textColor: newAnn.textColor })}
                      disabled={!newAnn.title || !newAnn.message || createAnnouncement.isPending}
                      className="bg-gold text-ink hover:bg-gold-light"
                    >
                      {createAnnouncement.isPending ? "저장 중..." : "공지 등록"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowNewAnnouncement(false)}>취소</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!announcementsList.data || announcementsList.data.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="py-16 text-center">
                  <Megaphone className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">등록된 공지가 없습니다.</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">새 공지를 등록하면 홈페이지 상단에 배너로 표시됩니다.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {announcementsList.data.map((ann) => (
                  <Card key={ann.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={ann.active === "yes" ? "default" : "secondary"} className={ann.active === "yes" ? "bg-green-500 text-white" : ""}>
                              {ann.active === "yes" ? "활성" : "비활성"}
                            </Badge>
                            <span className="font-heading font-bold text-ink">{ann.title}</span>
                            <span className="text-xs text-muted-foreground">우선순위: {ann.priority}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{ann.message}</p>
                          {/* Preview bar */}
                          <div className="rounded-md overflow-hidden inline-block" style={{ backgroundColor: ann.bgColor || "#111", color: ann.textColor || "#fff" }}>
                            <div className="flex items-center gap-2 py-1.5 px-4">
                              <span className="text-xs font-semibold">{ann.title}</span>
                              <span className="text-xs opacity-80">{ann.message}</span>
                              {ann.linkText && <span className="text-xs underline">{ann.linkText}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {ann.linkUrl && <span>링크: {ann.linkUrl}</span>}
                            <span>{formatDate(ann.createdAt)}</span>
                            {ann.startsAt && <span>시작: {formatDate(ann.startsAt)}</span>}
                            {ann.endsAt && <span>종료: {formatDate(ann.endsAt)}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateAnnouncement.mutate({ id: ann.id, active: ann.active === "yes" ? "no" : "yes" })}
                            title={ann.active === "yes" ? "비활성화" : "활성화"}
                          >
                            {ann.active === "yes" ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { if (confirm("이 공지를 삭제하시겠습니까?")) deleteAnnouncement.mutate({ id: ann.id }); }}
                            className="text-destructive hover:text-destructive"
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
        )}
        {/* Popup Management Tab */}
        {activeTab === "popups" && (
          <PopupManagementTab />
        )}
        {/* Notification Center Tab */}
        {activeTab === "notifications" && (
          <NotificationCenterTab />
        )}
        {/* Portfolio Drafts Tab */}
        {activeTab === "portfolio" && (
          <PortfolioTab />
        )}
        {/* Drive Sync Tab */}
        {activeTab === "drive-sync" && (
          <DriveSyncTab />
        )}
      </div>
    </div>
  );
}

// ===== Portfolio Management Tab Component =====
const DRAFT_STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "초안", variant: "secondary" },
  review: { label: "검토중", variant: "default" },
  published: { label: "게시됨", variant: "outline" },
  archived: { label: "보관", variant: "destructive" },
};

const CATEGORY_OPTIONS = [
  "사무실 인테리어", "크리에이티브 오피스", "크리에이티브 스튜디오",
  "글로벌 기업 오피스", "공공기관", "헬스케어 오피스", "IT 오피스", "산업시설", "기타",
];

function PortfolioTab() {
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newDraft, setNewDraft] = useState({
    title: "", projectName: "", category: "사무실 인테리어",
    client: "", area: "", location: "", duration: "", description: "",
  });

  const drafts = trpc.portfolio.list.useQuery(undefined);
  const createDraft = trpc.portfolio.create.useMutation({ onSuccess: () => { drafts.refetch(); setShowCreateForm(false); resetForm(); } });
  const updateDraft = trpc.portfolio.update.useMutation({ onSuccess: () => { drafts.refetch(); setEditingId(null); } });
  const publishDraft = trpc.portfolio.publish.useMutation({ onSuccess: () => drafts.refetch() });
  const archiveDraft = trpc.portfolio.archive.useMutation({ onSuccess: () => drafts.refetch() });
  const deleteDraft = trpc.portfolio.delete.useMutation({ onSuccess: () => drafts.refetch() });
  const generateDesc = trpc.portfolio.generateDescription.useMutation();

  function resetForm() {
    setNewDraft({ title: "", projectName: "", category: "사무실 인테리어", client: "", area: "", location: "", duration: "", description: "" });
  }

  const filteredDrafts = statusFilter === "all"
    ? drafts.data ?? []
    : (drafts.data ?? []).filter((d: any) => d.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-ink">포트폴리오 관리</h2>
          <p className="text-sm text-muted-foreground mt-1">프로젝트 포트폴리오를 생성, 편집, 게시할 수 있습니다.</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-gold text-ink hover:bg-gold-light">
          <Plus className="w-4 h-4 mr-1" />
          새 포트폴리오
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {["all", "draft", "review", "published", "archived"].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              statusFilter === s ? "bg-ink text-white" : "bg-paper-warm text-muted-foreground hover:text-ink"
            }`}
          >
            {s === "all" ? "전체" : DRAFT_STATUS_MAP[s]?.label || s}
            {s !== "all" && (
              <span className="ml-1">({(drafts.data ?? []).filter((d: any) => d.status === s).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="border-gold/30">
          <CardHeader>
            <CardTitle className="text-lg">새 포트폴리오 초안</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">프로젝트 제목 *</label>
                <input
                  type="text" value={newDraft.title}
                  onChange={e => setNewDraft({ ...newDraft, title: e.target.value })}
                  placeholder="예: 허시드 본사 리모델링" className="w-full px-3 py-2 border border-border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">카테고리</label>
                <select
                  value={newDraft.category}
                  onChange={e => setNewDraft({ ...newDraft, category: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white"
                >
                  {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">고객사</label>
                <input
                  type="text" value={newDraft.client}
                  onChange={e => setNewDraft({ ...newDraft, client: e.target.value })}
                  placeholder="예: (주)허시드" className="w-full px-3 py-2 border border-border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">면적</label>
                <input
                  type="text" value={newDraft.area}
                  onChange={e => setNewDraft({ ...newDraft, area: e.target.value })}
                  placeholder="예: 250㎡ (76평)" className="w-full px-3 py-2 border border-border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">위치</label>
                <input
                  type="text" value={newDraft.location}
                  onChange={e => setNewDraft({ ...newDraft, location: e.target.value })}
                  placeholder="예: 서울 강남구" className="w-full px-3 py-2 border border-border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">공사 기간</label>
                <input
                  type="text" value={newDraft.duration}
                  onChange={e => setNewDraft({ ...newDraft, duration: e.target.value })}
                  placeholder="예: 8주" className="w-full px-3 py-2 border border-border rounded-md text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">설명</label>
              <textarea
                value={newDraft.description}
                onChange={e => setNewDraft({ ...newDraft, description: e.target.value })}
                placeholder="프로젝트에 대한 간략한 설명..." rows={3}
                className="w-full px-3 py-2 border border-border rounded-md text-sm resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => createDraft.mutate(newDraft)}
                disabled={!newDraft.title || createDraft.isPending}
                className="bg-gold text-ink hover:bg-gold-light"
              >
                {createDraft.isPending ? "생성 중..." : "초안 생성"}
              </Button>
              <Button variant="outline" onClick={() => { setShowCreateForm(false); resetForm(); }}>취소</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Drafts List */}
      {drafts.isLoading ? (
        <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
      ) : filteredDrafts.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-16 text-center">
            <FolderOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">포트폴리오 초안이 없습니다.</p>
            <p className="text-sm text-muted-foreground/60 mt-1">새 포트폴리오를 생성하거나 Google Drive에서 자동으로 가져올 수 있습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDrafts.map((draft: any) => {
            const isEditing = editingId === draft.id;
            return (
              <Card key={draft.id} className={`border-border/50 ${draft.status === "published" ? "border-green-200 bg-green-50/30" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant={DRAFT_STATUS_MAP[draft.status]?.variant || "secondary"}
                          className={draft.status === "published" ? "bg-green-500 text-white" : ""}>
                          {DRAFT_STATUS_MAP[draft.status]?.label || draft.status}
                        </Badge>
                        <Link href={`/admin/portfolio/${draft.id}`}>
                          <span className="font-heading font-bold text-ink text-lg hover:text-gold transition-colors cursor-pointer">{draft.title}</span>
                        </Link>
                        {draft.category && (
                          <Badge variant="outline" className="text-xs">{draft.category}</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-2">
                        {draft.client && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {draft.client}</span>}
                        {draft.area && <span>{draft.area}</span>}
                        {draft.location && <span>{draft.location}</span>}
                        {draft.duration && <span>{draft.duration}</span>}
                      </div>
                      {draft.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{draft.description}</p>
                      )}
                      {draft.aiDescription && (
                        <div className="bg-gold/5 border border-gold/20 rounded-md p-3 mb-2">
                          <div className="flex items-center gap-1 text-xs text-gold font-medium mb-1">
                            <Wand2 className="w-3 h-3" /> AI 생성 설명
                          </div>
                          <p className="text-sm text-ink/80 line-clamp-3">{draft.aiDescription}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        생성: {formatDate(draft.createdAt)}
                        {draft.publishedAt && <span className="text-green-600">| 게시: {formatDate(draft.publishedAt)}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1">
                      {draft.status === "draft" && (
                        <>
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => {
                              generateDesc.mutate({
                                id: draft.id, title: draft.title,
                                category: draft.category, client: draft.client,
                                area: draft.area, location: draft.location,
                              });
                            }}
                            disabled={generateDesc.isPending}
                            title="AI 설명 생성"
                          >
                            {generateDesc.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4 text-gold" />}
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => updateDraft.mutate({ id: draft.id, status: "review" })}
                            title="검토 요청"
                          >
                            <Eye className="w-4 h-4 text-blue-500" />
                          </Button>
                        </>
                      )}
                      {(draft.status === "draft" || draft.status === "review") && (
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => {
                            if (confirm("이 포트폴리오를 게시하시겠습니까?")) publishDraft.mutate({ id: draft.id });
                          }}
                          title="게시"
                        >
                          <Send className="w-4 h-4 text-green-500" />
                        </Button>
                      )}
                      {draft.status === "published" && (
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => archiveDraft.mutate({ id: draft.id })}
                          title="보관"
                        >
                          <Archive className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      )}
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => { if (confirm("이 포트폴리오를 삭제하시겠습니까?")) deleteDraft.mutate({ id: draft.id }); }}
                        className="text-destructive hover:text-destructive"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== Drive Sync Tab Component =====
function DriveSyncTab() {
  const [rootFolderId, setRootFolderId] = useState("");
  const [syncingFolderId, setSyncingFolderId] = useState<string | null>(null);

  const connection = trpc.driveSync.checkConnection.useQuery(undefined, {
    retry: false,
  });
  const syncLogs = trpc.driveSync.listLogs.useQuery(undefined);

  const syncFolder = trpc.driveSync.syncFolder.useMutation({
    onSuccess: () => {
      syncLogs.refetch();
      setSyncingFolderId(null);
    },
    onError: () => {
      setSyncingFolderId(null);
    },
  });

  const syncAll = trpc.driveSync.syncAll.useMutation({
    onSuccess: () => {
      syncLogs.refetch();
    },
  });

  const projectFolders = trpc.driveSync.listProjectFolders.useQuery(
    { rootFolderId },
    { enabled: !!rootFolderId && rootFolderId.length > 5 }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-heading text-xl font-bold text-ink">Google Drive 동기화</h2>
        <p className="text-sm text-muted-foreground mt-1">
          구글 드라이브의 준공사진 폴더를 자동으로 탐색하여 포트폴리오 초안을 생성합니다.
        </p>
      </div>

      {/* Connection Status */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${connection.data?.connected ? "bg-green-500" : "bg-red-400"}`} />
              <div>
                <p className="font-medium text-sm">
                  {connection.isLoading ? "연결 확인 중..." :
                    connection.data?.connected ? "Google Drive 연결됨" : "Google Drive 미연결"}
                </p>
                {connection.data?.connected && connection.data.email && (
                  <p className="text-xs text-muted-foreground">{connection.data.email}</p>
                )}
                {connection.data?.error && (
                  <p className="text-xs text-red-500">{connection.data.error}</p>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => connection.refetch()}>
              <RefreshCw className="w-3 h-3 mr-1" /> 재확인
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Drive 미연결 안내 */}
      {!connection.isLoading && !connection.data?.connected && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 mb-2">Google Drive 서비스 계정 설정이 필요합니다</p>
                <ol className="list-decimal list-inside space-y-1 text-amber-700">
                  <li>Google Cloud Console에서 서비스 계정 생성</li>
                  <li>서비스 계정에 Google Drive API 권한 부여</li>
                  <li>JSON 키 파일 다운로드</li>
                  <li>환경변수 <code className="bg-amber-100 px-1 rounded">GOOGLE_SERVICE_ACCOUNT_JSON</code>에 JSON 내용 설정</li>
                  <li>공유 드라이브 또는 폴더를 서비스 계정 이메일에 공유</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Folder ID Input & Scan */}
      {connection.data?.connected && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-gold" />
              프로젝트 폴더 탐색
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                "완료 프로젝트" 루트 폴더 ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={rootFolderId}
                  onChange={e => setRootFolderId(e.target.value)}
                  placeholder="Google Drive 폴더 ID (URL에서 복사)"
                  className="flex-1 px-3 py-2 border border-border rounded-md text-sm"
                />
                <Button
                  onClick={() => projectFolders.refetch()}
                  disabled={!rootFolderId || projectFolders.isFetching}
                  className="bg-gold text-ink hover:bg-gold-light"
                >
                  {projectFolders.isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : "탐색"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => syncAll.mutate({ rootFolderId })}
                  disabled={!rootFolderId || syncAll.isPending}
                >
                  {syncAll.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CloudDownload className="w-4 h-4 mr-1" />}
                  전체 동기화
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                폴더 구조: 완료 프로젝트/[프로젝트명]/06. IMAGE (현장사진)/준공사진/4. 준공사진
              </p>
            </div>

            {/* Sync All Result */}
            {syncAll.data && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm font-medium text-green-800 mb-2">
                  동기화 완료: {syncAll.data.synced}건 성공 / {syncAll.data.skipped}건 건너뜀 / {syncAll.data.errors}건 오류
                </p>
                <div className="space-y-1">
                  {syncAll.data.details.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {d.status === "synced" && <Check className="w-3 h-3 text-green-500" />}
                      {d.status === "skipped" && <X className="w-3 h-3 text-gray-400" />}
                      {d.status === "error" && <AlertCircle className="w-3 h-3 text-red-500" />}
                      <span className={d.status === "error" ? "text-red-600" : "text-muted-foreground"}>
                        {d.projectName} — {d.status === "synced" ? `${d.imageCount}장` : d.error || d.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discovered Folders */}
            {projectFolders.data && projectFolders.data.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-ink">발견된 프로젝트 ({projectFolders.data.length}건)</p>
                {projectFolders.data.map((folder, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-paper-warm rounded-md border border-border/30">
                    <div>
                      <p className="text-sm font-medium text-ink">{folder.projectName}</p>
                      <p className="text-xs text-muted-foreground">{folder.folderPath}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSyncingFolderId(folder.folderId);
                        syncFolder.mutate({
                          folderId: folder.folderId,
                          projectName: folder.projectName,
                          folderPath: folder.folderPath,
                        });
                      }}
                      disabled={syncingFolderId === folder.folderId}
                    >
                      {syncingFolderId === folder.folderId ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        <CloudDownload className="w-3 h-3 mr-1" />
                      )}
                      동기화
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {projectFolders.data && projectFolders.data.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                준공사진 폴더가 발견되지 않았습니다. 폴더 구조를 확인해주세요.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sync Logs */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-gold" />
            동기화 기록
          </CardTitle>
        </CardHeader>
        <CardContent>
          {syncLogs.isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">로딩 중...</p>
          ) : (syncLogs.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">아직 동기화 기록이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {(syncLogs.data ?? []).map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-3 border border-border/30 rounded-md">
                  <div>
                    <p className="text-sm font-medium text-ink">{log.folderPath || log.folderId}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.fileCount}장 | {formatDate(log.lastSyncAt)}
                    </p>
                  </div>
                  <Badge variant={
                    log.syncStatus === "done" ? "outline" :
                    log.syncStatus === "syncing" ? "default" : "destructive"
                  }>
                    {log.syncStatus === "done" ? "완료" :
                     log.syncStatus === "syncing" ? "진행중" : "오류"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


// ===== Popup Management Tab Component =====
function PopupManagementTab() {
  const popupList = trpc.popup.list.useQuery();
  const createPopup = trpc.popup.create.useMutation({ onSuccess: () => popupList.refetch() });
  const updatePopup = trpc.popup.update.useMutation({ onSuccess: () => popupList.refetch() });
  const deletePopup = trpc.popup.delete.useMutation({ onSuccess: () => popupList.refetch() });

  const [showNew, setShowNew] = useState(false);
  const [newPopup, setNewPopup] = useState({
    title: "", content: "", imageUrl: "", linkUrl: "", linkText: "",
    position: "center" as "center" | "bottom_right" | "bottom_left",
    showOnce: "no" as "yes" | "no",
    priority: 0,
  });

  const POSITION_LABELS: Record<string, string> = {
    center: "화면 중앙",
    bottom_right: "우측 하단",
    bottom_left: "좌측 하단",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-ink">팝업 관리</h2>
        <Button onClick={() => setShowNew(!showNew)} size="sm" className="bg-gold text-ink hover:bg-gold-light">
          <Plus className="w-4 h-4 mr-1" /> 새 팝업
        </Button>
      </div>

      {showNew && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">제목 *</label>
                <input
                  className="w-full px-3 py-2 border border-border rounded-md text-sm"
                  value={newPopup.title}
                  onChange={(e) => setNewPopup({ ...newPopup, title: e.target.value })}
                  placeholder="팝업 제목"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">위치</label>
                <Select value={newPopup.position} onValueChange={(v) => setNewPopup({ ...newPopup, position: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center">화면 중앙</SelectItem>
                    <SelectItem value="bottom_right">우측 하단</SelectItem>
                    <SelectItem value="bottom_left">좌측 하단</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">내용 *</label>
              <textarea
                className="w-full px-3 py-2 border border-border rounded-md text-sm min-h-[80px]"
                value={newPopup.content}
                onChange={(e) => setNewPopup({ ...newPopup, content: e.target.value })}
                placeholder="팝업 내용 (HTML 지원)"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">이미지 URL</label>
                <input
                  className="w-full px-3 py-2 border border-border rounded-md text-sm"
                  value={newPopup.imageUrl}
                  onChange={(e) => setNewPopup({ ...newPopup, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">링크 URL</label>
                <input
                  className="w-full px-3 py-2 border border-border rounded-md text-sm"
                  value={newPopup.linkUrl}
                  onChange={(e) => setNewPopup({ ...newPopup, linkUrl: e.target.value })}
                  placeholder="/estimator"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">링크 텍스트</label>
                <input
                  className="w-full px-3 py-2 border border-border rounded-md text-sm"
                  value={newPopup.linkText}
                  onChange={(e) => setNewPopup({ ...newPopup, linkText: e.target.value })}
                  placeholder="자세히 보기"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newPopup.showOnce === "yes"}
                  onChange={(e) => setNewPopup({ ...newPopup, showOnce: e.target.checked ? "yes" : "no" })}
                />
                한 번만 표시
              </label>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground">우선순위</label>
                <input
                  type="number"
                  className="w-16 px-2 py-1 border border-border rounded-md text-sm"
                  value={newPopup.priority}
                  onChange={(e) => setNewPopup({ ...newPopup, priority: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-ink text-white hover:bg-ink/90"
                onClick={() => {
                  createPopup.mutate({
                    title: newPopup.title,
                    content: newPopup.content,
                    imageUrl: newPopup.imageUrl || undefined,
                    linkUrl: newPopup.linkUrl || undefined,
                    linkText: newPopup.linkText || undefined,
                    position: newPopup.position,
                    showOnce: newPopup.showOnce,
                    priority: newPopup.priority,
                  });
                  setShowNew(false);
                  setNewPopup({ title: "", content: "", imageUrl: "", linkUrl: "", linkText: "", position: "center", showOnce: "no", priority: 0 });
                }}
                disabled={!newPopup.title || !newPopup.content}
              >
                생성
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowNew(false)}>취소</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Popup List */}
      <div className="space-y-3">
        {popupList.data?.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              등록된 팝업이 없습니다.
            </CardContent>
          </Card>
        )}
        {popupList.data?.map((popup) => (
          <Card key={popup.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-ink text-sm">{popup.title}</h3>
                    <Badge variant={popup.active === "yes" ? "default" : "secondary"} className="text-[10px]">
                      {popup.active === "yes" ? "활성" : "비활성"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {POSITION_LABELS[popup.position] || popup.position}
                    </Badge>
                    {popup.showOnce === "yes" && (
                      <Badge variant="outline" className="text-[10px]">1회만</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{popup.content.replace(/<[^>]*>/g, "").slice(0, 100)}</p>
                  {popup.linkUrl && (
                    <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                      <Link2 className="w-3 h-3" /> {popup.linkUrl}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updatePopup.mutate({ id: popup.id, active: popup.active === "yes" ? "no" : "yes" })}
                    title={popup.active === "yes" ? "비활성화" : "활성화"}
                  >
                    {popup.active === "yes" ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { if (confirm("이 팝업을 삭제하시겠습니까?")) deletePopup.mutate({ id: popup.id }); }}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ===== Notification Center Tab Component =====
function NotificationCenterTab() {
  const notificationList = trpc.notification.list.useQuery({ limit: 50 });
  const markRead = trpc.notification.markRead.useMutation({ onSuccess: () => notificationList.refetch() });
  const markAllRead = trpc.notification.markAllRead.useMutation({ onSuccess: () => notificationList.refetch() });
  const deleteNotification = trpc.notification.delete.useMutation({ onSuccess: () => notificationList.refetch() });

  const TYPE_LABELS: Record<string, string> = {
    inquiry: "문의",
    estimate: "견적",
    crm_deal: "CRM 딜",
    crm_stage_change: "단계변경",
    newsletter: "뉴스레터",
    chat: "채팅",
    system: "시스템",
  };

  const TYPE_COLORS: Record<string, string> = {
    inquiry: "bg-blue-100 text-blue-700",
    estimate: "bg-green-100 text-green-700",
    crm_deal: "bg-purple-100 text-purple-700",
    crm_stage_change: "bg-orange-100 text-orange-700",
    newsletter: "bg-teal-100 text-teal-700",
    chat: "bg-indigo-100 text-indigo-700",
    system: "bg-gray-100 text-gray-700",
  };

  function timeAgo(date: Date | string) {
    const now = new Date();
    const d = new Date(date);
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return "방금 전";
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  const unreadCount = (notificationList.data || []).filter((n) => n.isRead === "no").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-xl font-bold text-ink">알림 센터</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">{unreadCount}개 읽지 않음</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
            <Check className="w-4 h-4 mr-1" /> 모두 읽음 처리
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {notificationList.data?.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              알림이 없습니다
            </CardContent>
          </Card>
        )}
        {notificationList.data?.map((n) => (
          <Card key={n.id} className={n.isRead === "no" ? "border-l-4 border-l-blue-500" : ""}>
            <CardContent className="py-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TYPE_COLORS[n.type] || "bg-gray-100 text-gray-700"}`}>
                      {TYPE_LABELS[n.type] || n.type}
                    </span>
                    {n.isRead === "no" && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                    <span className="text-[10px] text-muted-foreground/60 ml-auto flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-ink">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  {n.linkUrl && (
                    <a href={n.linkUrl} className="text-xs text-blue-500 hover:underline mt-1 inline-flex items-center gap-1">
                      <Link2 className="w-3 h-3" /> 바로가기
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {n.isRead === "no" && (
                    <Button variant="ghost" size="sm" onClick={() => markRead.mutate({ id: n.id })} title="읽음 처리">
                      <Check className="w-4 h-4 text-green-500" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNotification.mutate({ id: n.id })}
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
