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
} from "lucide-react";
import { Link } from "wouter";
import Logo from "@/components/Logo";

type TabType = "overview" | "inquiries" | "subscribers" | "estimates" | "leads";

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
  ];

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
                        <div className="flex items-center gap-3">
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
      </div>
    </div>
  );
}
