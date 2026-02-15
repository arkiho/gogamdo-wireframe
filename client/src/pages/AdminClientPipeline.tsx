/**
 * 관리자 고객 셀프서비스 파이프라인 대시보드
 * 고객 프로젝트 목록, 서베이 결과, 미팅 관리
 */
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLocation, Link } from "wouter";
import {
  ArrowLeft, Building2, Users, Calendar, BarChart3, ClipboardList,
  Loader2, CheckCircle2, Clock, Mail, Phone, FileText,
  ChevronDown, ChevronUp, ExternalLink, Eye, LogOut,
} from "lucide-react";
import Logo from "@/components/Logo";
import NotificationCenter from "@/components/NotificationCenter";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  created: { label: "생성됨", color: "bg-gray-100 text-gray-700" },
  floor_plan_uploaded: { label: "도면 업로드", color: "bg-blue-100 text-blue-700" },
  survey_completed: { label: "서베이 완료", color: "bg-indigo-100 text-indigo-700" },
  report_generated: { label: "보고서 생성", color: "bg-purple-100 text-purple-700" },
  report_sent: { label: "보고서 발송", color: "bg-violet-100 text-violet-700" },
  company_survey_shared: { label: "전사 서베이", color: "bg-amber-100 text-amber-700" },
  company_survey_done: { label: "전사 서베이 완료", color: "bg-orange-100 text-orange-700" },
  meeting_requested: { label: "미팅 요청", color: "bg-emerald-100 text-emerald-700" },
  meeting_confirmed: { label: "미팅 확정", color: "bg-green-100 text-green-700" },
  completed: { label: "완료", color: "bg-gold/20 text-gold-dark" },
};

const MEETING_STATUS: Record<string, { label: string; color: string }> = {
  requested: { label: "요청됨", color: "bg-amber-100 text-amber-700" },
  confirmed: { label: "확정", color: "bg-green-100 text-green-700" },
  rescheduled: { label: "일정 변경", color: "bg-blue-100 text-blue-700" },
  cancelled: { label: "취소", color: "bg-red-100 text-red-700" },
  completed: { label: "완료", color: "bg-gray-100 text-gray-700" },
};

function formatDate(d: Date | string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default function AdminClientPipeline() {
  const { user, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"projects" | "meetings">("projects");
  const [expandedProject, setExpandedProject] = useState<number | null>(null);

  const projects = trpc.clientPipeline.adminListProjects.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });
  const allMeetings = trpc.clientPipeline.adminListMeetings.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const updateMeeting = trpc.clientPipeline.adminUpdateMeeting.useMutation({
    onSuccess: () => {
      toast.success("미팅 상태가 업데이트되었습니다.");
      allMeetings.refetch();
    },
    onError: () => toast.error("업데이트에 실패했습니다."),
  });

  const updateProjectStatus = trpc.clientPipeline.adminUpdateProjectStatus.useMutation({
    onSuccess: () => {
      toast.success("프로젝트 상태가 업데이트되었습니다.");
      projects.refetch();
    },
    onError: () => toast.error("업데이트에 실패했습니다."),
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>;
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md"><CardContent className="py-12 text-center">
          <p className="text-muted-foreground">관리자 권한이 필요합니다.</p>
          <Button variant="outline" className="mt-4" onClick={() => { window.location.href = getLoginUrl(); }}>로그인</Button>
        </CardContent></Card>
      </div>
    );
  }

  const projectCount = projects.data?.length ?? 0;
  const meetingCount = allMeetings.data?.length ?? 0;
  const pendingMeetings = allMeetings.data?.filter((m: any) => m.status === "requested").length ?? 0;

  return (
    <div className="min-h-screen bg-paper">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 bg-ink text-white border-b border-white/10">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2 text-white/60 hover:text-white text-sm">
              <ArrowLeft className="w-4 h-4" /> 관리자
            </Link>
            <span className="text-white/30">|</span>
            <h1 className="font-heading font-bold text-sm">고객 파이프라인</h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter />
            <span className="text-xs text-white/50">{user.name}</span>
            <Button variant="ghost" size="sm" className="text-white/50 hover:text-white" onClick={() => logout()}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">{projectCount}</p>
                <p className="text-xs text-muted-foreground">전체 프로젝트</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">{meetingCount}</p>
                <p className="text-xs text-muted-foreground">전체 미팅</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">{pendingMeetings}</p>
                <p className="text-xs text-muted-foreground">대기 중 미팅</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
          <TabsList className="mb-6">
            <TabsTrigger value="projects">프로젝트 ({projectCount})</TabsTrigger>
            <TabsTrigger value="meetings">미팅 관리 ({meetingCount})</TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects">
            {projects.isLoading ? (
              <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gold mx-auto" /></div>
            ) : projectCount === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">아직 고객 프로젝트가 없습니다.</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {projects.data?.map((p: any) => {
                  const statusInfo = STATUS_LABELS[p.status] || STATUS_LABELS.created;
                  const isExpanded = expandedProject === p.id;
                  return (
                    <Card key={p.id} className="overflow-hidden">
                      <CardContent className="py-4">
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setExpandedProject(isExpanded ? null : p.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-gold" />
                            </div>
                            <div>
                              <h3 className="font-heading font-bold text-ink">{p.companyName}</h3>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span>{p.contactName}</span>
                                <span>{p.contactEmail}</span>
                                {p.employeeCount && <span>직원 {p.employeeCount}명</span>}
                                <span>{formatDate(p.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                              <div><span className="text-muted-foreground">연락처:</span> {p.contactPhone || "-"}</div>
                              <div><span className="text-muted-foreground">예산:</span> {p.budgetRange || "-"}</div>
                              <div><span className="text-muted-foreground">희망 이전일:</span> {p.desiredMoveDate || "-"}</div>
                              <div><span className="text-muted-foreground">현재 주소:</span> {p.currentAddress || "-"}</div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">상태 변경:</span>
                              <Select
                                value={p.status}
                                onValueChange={v => updateProjectStatus.mutate({ id: p.id, status: v })}
                              >
                                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {Object.entries(STATUS_LABELS).map(([key, val]) => (
                                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Meetings Tab */}
          <TabsContent value="meetings">
            {allMeetings.isLoading ? (
              <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gold mx-auto" /></div>
            ) : meetingCount === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">아직 미팅 요청이 없습니다.</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {allMeetings.data?.map((m: any) => {
                  const meetingStatus = MEETING_STATUS[m.status] || MEETING_STATUS.requested;
                  return (
                    <Card key={m.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-3">
                              <Calendar className="w-5 h-5 text-gold" />
                              <span className="font-heading font-bold text-ink">
                                {m.requestedDate} {m.requestedTime}
                              </span>
                              <Badge className={meetingStatus.color}>{meetingStatus.label}</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 ml-8">
                              <span>{m.meetingType === "office" ? "사무실 방문" : m.meetingType === "visit" ? "현장 방문" : "온라인"}</span>
                              <span>{m.duration}분</span>
                              {m.agenda && <span className="truncate max-w-[200px]">{m.agenda}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {m.status === "requested" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 text-white hover:bg-green-700"
                                  onClick={() => updateMeeting.mutate({
                                    id: m.id,
                                    status: "confirmed",
                                    confirmedDate: m.requestedDate,
                                    confirmedTime: m.requestedTime,
                                  })}
                                >
                                  확정
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => updateMeeting.mutate({ id: m.id, status: "cancelled" })}
                                >
                                  거절
                                </Button>
                              </>
                            )}
                            {m.status === "confirmed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateMeeting.mutate({ id: m.id, status: "completed" })}
                              >
                                완료 처리
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
