import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  CalendarCheck, Star, Brain, Plus, Send, Wrench,
  CheckCircle2, Repeat, Search, Users,
} from "lucide-react";

/** maintenance_visits.visitType — DB enum과 1:1로 맞춰야 함 */
const VISIT_TYPES = [
  { value: "inspection", label: "정기 점검" },
  { value: "fine_tuning", label: "미세 조정" },
  { value: "warranty", label: "하자 보수" },
  { value: "optimization", label: "공간 최적화" },
] as const;

const VISIT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  VISIT_TYPES.map(t => [t.value, t.label]),
);

const VISIT_STATUS_LABELS: Record<string, string> = {
  scheduled: "예정",
  confirmed: "확정",
  in_progress: "진행 중",
  completed: "완료",
  cancelled: "취소",
  rescheduled: "일정 변경",
};

const PLAN_LABELS: Record<string, string> = {
  basic: "Basic (분기 1회)",
  standard: "Standard (월 1회)",
  premium: "Premium (월 2회)",
};

/** 만족도 항목 — post_occupancy_surveys는 1~5점 척도 */
const SATISFACTION_FIELDS = [
  { key: "overallSatisfaction", label: "종합" },
  { key: "designSatisfaction", label: "설계" },
  { key: "constructionSatisfaction", label: "시공" },
  { key: "communicationSatisfaction", label: "소통" },
  { key: "timelineSatisfaction", label: "일정" },
] as const;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function avg(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function Stars({ score }: { score: number | null }) {
  if (score == null) return <span className="text-muted-foreground text-sm">-</span>;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`5점 만점에 ${score.toFixed(1)}점`}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= Math.round(score) ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`}
        />
      ))}
    </span>
  );
}

export default function AdminPostOccupancy() {
  const [activeTab, setActiveTab] = useState("satisfaction");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projectSearch, setProjectSearch] = useState("");
  const [showScheduleVisit, setShowScheduleVisit] = useState(false);
  const [showCreateSubscription, setShowCreateSubscription] = useState(false);
  const [completingVisit, setCompletingVisit] = useState<any | null>(null);

  const [visitForm, setVisitForm] = useState({
    visitType: "inspection" as (typeof VISIT_TYPES)[number]["value"],
    scheduledDate: todayISO(),
    assignedStaffName: "",
    description: "",
    issueReported: "",
  });
  const [completeForm, setCompleteForm] = useState({ workPerformed: "", clientFeedback: "" });
  const [subscriptionForm, setSubscriptionForm] = useState({
    plan: "basic" as "basic" | "standard" | "premium",
    monthlyFee: 0,
    reportFrequency: "monthly" as "weekly" | "biweekly" | "monthly" | "quarterly",
  });

  // ===== 전체 집계용 =====
  const projectsQuery = trpc.clientPipeline.adminListProjects.useQuery();
  const allSurveys = trpc.postOccupancy.adminListSurveys.useQuery();
  const allVisits = trpc.postOccupancy.adminListVisits.useQuery();

  // ===== 선택 프로젝트용 =====
  const satisfaction = trpc.postOccupancy.getSatisfaction.useQuery(
    { clientProjectId: selectedProjectId! },
    { enabled: !!selectedProjectId },
  );
  const subscription = trpc.postOccupancy.getSubscription.useQuery(
    { clientProjectId: selectedProjectId! },
    { enabled: !!selectedProjectId },
  );
  const reports = trpc.postOccupancy.getOptimizationReports.useQuery(
    { subscriptionId: subscription.data?.id! },
    { enabled: !!subscription.data?.id },
  );

  const completedProjects = useMemo(
    () => (projectsQuery.data || []).filter((p: any) => p.status === "completed"),
    [projectsQuery.data],
  );

  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return completedProjects;
    return completedProjects.filter((p: any) =>
      (p.companyName || "").toLowerCase().includes(q) ||
      (p.contactName || "").toLowerCase().includes(q),
    );
  }, [completedProjects, projectSearch]);

  const selectedProject = completedProjects.find((p: any) => p.id === selectedProjectId) || null;

  // 선택 프로젝트의 방문 — 전체 목록에서 필터 (쿼리 하나로 처리)
  const visits = useMemo(
    () => (allVisits.data || []).filter((v: any) => v.clientProjectId === selectedProjectId),
    [allVisits.data, selectedProjectId],
  );
  const regularVisits = visits.filter((v: any) => v.visitType !== "warranty");
  const warrantyVisits = visits.filter((v: any) => v.visitType === "warranty");

  // 전체 평균 만족도 (완료된 응답만)
  const completedSurveys = (allSurveys.data || []).filter((s: any) => s.status === "completed");
  const overallAvg = avg(
    completedSurveys.map((s: any) => s.overallSatisfaction).filter((n: any): n is number => typeof n === "number"),
  );
  const upcomingVisitCount = (allVisits.data || []).filter(
    (v: any) => v.status === "scheduled" || v.status === "confirmed",
  ).length;
  const openWarrantyCount = (allVisits.data || []).filter(
    (v: any) => v.visitType === "warranty" && v.status !== "completed" && v.status !== "cancelled",
  ).length;

  // ===== mutations =====
  const invalidateVisits = () => allVisits.refetch();

  const sendSurvey = trpc.postOccupancy.sendSatisfactionSurvey.useMutation({
    onSuccess: () => {
      satisfaction.refetch();
      allSurveys.refetch();
      toast.success("만족도 조사가 발송되었습니다.");
    },
    onError: e => toast.error(e.message),
  });

  const scheduleVisit = trpc.postOccupancy.scheduleVisit.useMutation({
    onSuccess: () => {
      invalidateVisits();
      setShowScheduleVisit(false);
      setVisitForm(f => ({ ...f, description: "", issueReported: "" }));
      toast.success("방문이 예약되었습니다.");
    },
    onError: e => toast.error(e.message),
  });

  const updateVisit = trpc.postOccupancy.updateVisit.useMutation({
    onSuccess: () => {
      invalidateVisits();
      setCompletingVisit(null);
      setCompleteForm({ workPerformed: "", clientFeedback: "" });
      toast.success("방문 상태가 업데이트되었습니다.");
    },
    onError: e => toast.error(e.message),
  });

  const createSubscription = trpc.postOccupancy.createSubscription.useMutation({
    onSuccess: () => {
      subscription.refetch();
      setShowCreateSubscription(false);
      toast.success("구독이 생성되었습니다.");
    },
    onError: e => toast.error(e.message),
  });

  const generateReport = trpc.postOccupancy.generateOptimizationReport.useMutation({
    onSuccess: () => {
      reports.refetch();
      toast.success("최적화 리포트가 생성되었습니다.");
    },
    onError: e => toast.error(e.message),
  });

  function renderVisitCard(v: any) {
    const isOpen = v.status !== "completed" && v.status !== "cancelled";
    return (
      <Card key={v.id}>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{VISIT_TYPE_LABELS[v.visitType] || v.visitType}</Badge>
                <Badge variant={v.status === "completed" ? "default" : "secondary"}>
                  {VISIT_STATUS_LABELS[v.status] || v.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  <CalendarCheck className="w-3 h-3 inline mr-1" />
                  {v.scheduledDate || "-"}
                </span>
              </div>
              {v.technicianName && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  <Users className="w-3 h-3 inline mr-1" />담당 {v.technicianName}
                </p>
              )}
              {v.description && <p className="text-sm text-muted-foreground mt-1.5 whitespace-pre-wrap">{v.description}</p>}
              {v.workPerformed && (
                <p className="text-sm mt-2 p-2 bg-muted/40 rounded whitespace-pre-wrap">
                  <span className="font-medium">조치 내역: </span>{v.workPerformed}
                </p>
              )}
              {Array.isArray(v.photoUrls) && v.photoUrls.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {v.photoUrls.map((url: string, i: number) => (
                    <img key={i} src={url} alt={`방문 사진 ${i + 1}`} className="w-16 h-16 object-cover rounded border" />
                  ))}
                </div>
              )}
            </div>
            {isOpen && (
              <div className="flex gap-2 flex-shrink-0">
                {v.status === "scheduled" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateVisit.mutate({ id: v.id, status: "in_progress" })}
                    disabled={updateVisit.isPending}
                  >
                    진행 시작
                  </Button>
                )}
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={() => { setCompletingVisit(v); setCompleteForm({ workPerformed: "", clientFeedback: "" }); }}
                >
                  <CheckCircle2 className="w-3 h-3" />완료 처리
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground font-heading">사후관리 &amp; OpsX Insight</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          입주 후 만족도 → 정기 방문 → 하자 보수 → 공간 최적화 구독
        </p>
      </div>

      {/* 전체 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-6">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-2" />
            <p className="text-2xl font-bold">{completedProjects.length}</p>
            <p className="text-xs text-muted-foreground">완료 프로젝트</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Star className="w-6 h-6 text-amber-500 mb-2" />
            <p className="text-2xl font-bold">{overallAvg != null ? overallAvg.toFixed(1) : "-"}</p>
            <p className="text-xs text-muted-foreground">평균 만족도 (5점)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <CalendarCheck className="w-6 h-6 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{upcomingVisitCount}</p>
            <p className="text-xs text-muted-foreground">예정된 방문</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Wrench className="w-6 h-6 text-red-500 mb-2" />
            <p className="text-2xl font-bold">{openWarrantyCount}</p>
            <p className="text-xs text-muted-foreground">미완료 하자</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
        {/* 완료 프로젝트 목록 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">완료 프로젝트</CardTitle>
            <CardDescription className="text-xs">시공이 완료된 프로젝트를 선택하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="회사명 · 담당자 검색"
                className="pl-8"
                value={projectSearch}
                onChange={e => setProjectSearch(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 max-h-[520px] overflow-y-auto">
              {projectsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground py-6 text-center">로딩 중...</p>
              ) : filteredProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  {completedProjects.length === 0 ? "완료된 프로젝트가 없습니다." : "검색 결과가 없습니다."}
                </p>
              ) : (
                filteredProjects.map((p: any) => {
                  const survey = (allSurveys.data || []).find((s: any) => s.clientProjectId === p.id);
                  const openWarranty = (allVisits.data || []).some(
                    (v: any) => v.clientProjectId === p.id && v.visitType === "warranty" &&
                      v.status !== "completed" && v.status !== "cancelled",
                  );
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProjectId(p.id)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                        selectedProjectId === p.id
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-muted/30 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{p.companyName || "미정"}</p>
                        {openWarranty && <Wrench className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-xs text-muted-foreground truncate">{p.contactName}</p>
                        {survey?.status === "completed"
                          ? <Stars score={survey.overallSatisfaction ?? null} />
                          : <span className="text-[11px] text-muted-foreground">{survey ? "응답 대기" : "미발송"}</span>}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* 상세 */}
        {!selectedProjectId ? (
          <Card>
            <CardContent className="py-20 text-center text-sm text-muted-foreground">
              왼쪽에서 프로젝트를 선택하세요.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 min-w-0">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="font-heading font-bold text-lg">{selectedProject?.companyName || `프로젝트 #${selectedProjectId}`}</h2>
                <p className="text-xs text-muted-foreground">{selectedProject?.contactName} · {selectedProject?.contactEmail}</p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="satisfaction" className="gap-1"><Star className="w-4 h-4" />만족도</TabsTrigger>
                <TabsTrigger value="visits" className="gap-1"><CalendarCheck className="w-4 h-4" />정기 방문</TabsTrigger>
                <TabsTrigger value="warranty" className="gap-1">
                  <Wrench className="w-4 h-4" />하자 보수
                  {warrantyVisits.some((v: any) => v.status !== "completed" && v.status !== "cancelled") && (
                    <span className="ml-1 w-1.5 h-1.5 rounded-full bg-red-500" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="subscription" className="gap-1"><Repeat className="w-4 h-4" />구독/리포트</TabsTrigger>
              </TabsList>

              {/* 만족도 */}
              <TabsContent value="satisfaction">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <CardTitle className="text-lg">입주 후 만족도 조사</CardTitle>
                        <CardDescription>5점 척도 · 시공 완료 후 발송</CardDescription>
                      </div>
                      {!satisfaction.data && (
                        <Button
                          className="gap-2"
                          onClick={() => sendSurvey.mutate({ clientProjectId: selectedProjectId })}
                          disabled={sendSurvey.isPending}
                        >
                          <Send className="w-4 h-4" />{sendSurvey.isPending ? "발송 중..." : "조사 발송"}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!satisfaction.data ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        발송된 만족도 조사가 없습니다.
                      </p>
                    ) : satisfaction.data.status !== "completed" ? (
                      <div className="text-center py-8 space-y-2">
                        <Badge variant="secondary">{satisfaction.data.status === "sent" ? "발송됨" : satisfaction.data.status}</Badge>
                        <p className="text-sm text-muted-foreground">고객 응답을 기다리는 중입니다.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          {SATISFACTION_FIELDS.map(f => {
                            const score = (satisfaction.data as any)[f.key] as number | null;
                            return (
                              <div key={f.key} className="text-center p-3 bg-muted/30 rounded-lg">
                                <p className="text-2xl font-bold">{score ?? "-"}</p>
                                <div className="flex justify-center my-1"><Stars score={score ?? null} /></div>
                                <p className="text-xs text-muted-foreground">{f.label}</p>
                              </div>
                            );
                          })}
                        </div>
                        {satisfaction.data.wouldRecommend != null && (
                          <div className="p-3 border rounded-lg text-sm">
                            <span className="font-medium">추천 의향(NPS): </span>
                            {satisfaction.data.wouldRecommend}
                          </div>
                        )}
                        {satisfaction.data.positiveComments && (
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-medium text-sm mb-2">고객 피드백</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{satisfaction.data.positiveComments}</p>
                          </div>
                        )}
                        {satisfaction.data.improvementSuggestions && (
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-medium text-sm mb-2">개선 제안</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{satisfaction.data.improvementSuggestions}</p>
                          </div>
                        )}
                        {Array.isArray(satisfaction.data.issuesReported) && satisfaction.data.issuesReported.length > 0 && (
                          <div className="p-4 border rounded-lg space-y-2">
                            <h4 className="font-medium text-sm">보고된 이슈</h4>
                            {satisfaction.data.issuesReported.map((issue: any, i: number) => (
                              <div key={i} className="text-sm text-muted-foreground">
                                <Badge variant="outline" className="mr-2 text-[11px]">{issue.area}</Badge>
                                {issue.description}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 정기 방문 */}
              <TabsContent value="visits" className="space-y-4">
                <div className="flex justify-end">
                  <Button className="gap-2" onClick={() => { setVisitForm(f => ({ ...f, visitType: "inspection" })); setShowScheduleVisit(true); }}>
                    <Plus className="w-4 h-4" />방문 예약
                  </Button>
                </div>
                <div className="space-y-3">
                  {regularVisits.length === 0 ? (
                    <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">예약된 방문이 없습니다.</CardContent></Card>
                  ) : regularVisits.map(renderVisitCard)}
                </div>
              </TabsContent>

              {/* 하자 보수 */}
              <TabsContent value="warranty" className="space-y-4">
                <div className="flex justify-end">
                  <Button className="gap-2" onClick={() => { setVisitForm(f => ({ ...f, visitType: "warranty" })); setShowScheduleVisit(true); }}>
                    <Plus className="w-4 h-4" />하자 접수
                  </Button>
                </div>
                <div className="space-y-3">
                  {warrantyVisits.length === 0 ? (
                    <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">접수된 하자가 없습니다.</CardContent></Card>
                  ) : warrantyVisits.map(renderVisitCard)}
                </div>
              </TabsContent>

              {/* 구독 / 리포트 */}
              <TabsContent value="subscription" className="space-y-4">
                {subscription.data ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Repeat className="w-5 h-5" />OpsX Insight 구독
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-xs text-muted-foreground">플랜</p>
                            <p className="font-medium">{PLAN_LABELS[subscription.data.plan] || subscription.data.plan}</p>
                          </div>
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-xs text-muted-foreground">상태</p>
                            <Badge variant={subscription.data.status === "active" ? "default" : "secondary"}>
                              {subscription.data.status === "active" ? "활성"
                                : subscription.data.status === "paused" ? "일시중지" : subscription.data.status}
                            </Badge>
                          </div>
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-xs text-muted-foreground">월 이용료</p>
                            <p className="font-medium">
                              {subscription.data.monthlyFee
                                ? `${Number(subscription.data.monthlyFee).toLocaleString("ko-KR")}원`
                                : "-"}
                            </p>
                          </div>
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-xs text-muted-foreground">시작일</p>
                            <p className="font-medium">{subscription.data.startDate || "-"}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-end">
                      <Button
                        className="gap-2"
                        onClick={() => generateReport.mutate({
                          subscriptionId: subscription.data!.id,
                          clientProjectId: selectedProjectId,
                          sensorDataSummary: "{}",
                        })}
                        disabled={generateReport.isPending}
                      >
                        <Brain className="w-4 h-4" />{generateReport.isPending ? "생성 중..." : "AI 최적화 리포트 생성"}
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {reports.data?.length ? reports.data.map((r: any) => (
                        <Card key={r.id}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <CardTitle className="text-base">{r.reportPeriod || `리포트 #${r.id}`}</CardTitle>
                              <Badge variant="secondary">
                                {r.createdAt ? new Date(r.createdAt).toLocaleDateString("ko-KR") : "-"}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {r.summary && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.summary}</p>}
                            {Array.isArray(r.optimizationSuggestions) && r.optimizationSuggestions.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium mb-1">개선 제안</h4>
                                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                                  {r.optimizationSuggestions.map((s: any, i: number) => (
                                    <li key={i}>{s.change || s.recommendation || JSON.stringify(s)}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )) : (
                        <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">생성된 리포트가 없습니다.</CardContent></Card>
                      )}
                    </div>
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Repeat className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="font-medium mb-2">OpsX Insight 구독이 없습니다</h3>
                      <p className="text-sm text-muted-foreground mb-4">정기적으로 공간 최적화 제안을 받아보세요.</p>
                      <Button className="gap-2" onClick={() => setShowCreateSubscription(true)}>
                        <Plus className="w-4 h-4" />구독 생성
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* 방문/하자 예약 다이얼로그 */}
      <Dialog open={showScheduleVisit} onOpenChange={setShowScheduleVisit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{visitForm.visitType === "warranty" ? "하자 접수" : "사후관리 방문 예약"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-muted-foreground">방문 유형</label>
              <Select value={visitForm.visitType} onValueChange={v => setVisitForm(f => ({ ...f, visitType: v as typeof f.visitType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VISIT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">방문 예정일</label>
              <Input
                type="date"
                value={visitForm.scheduledDate}
                onChange={e => setVisitForm(f => ({ ...f, scheduledDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">담당자</label>
              <Input
                placeholder="담당자 이름"
                value={visitForm.assignedStaffName}
                onChange={e => setVisitForm(f => ({ ...f, assignedStaffName: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                {visitForm.visitType === "warranty" ? "하자 내용" : "방문 목적 · 점검 항목"}
              </label>
              <Textarea
                value={visitForm.description}
                onChange={e => setVisitForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <Button
              className="w-full"
              disabled={scheduleVisit.isPending || !visitForm.scheduledDate}
              onClick={() => scheduleVisit.mutate({
                clientProjectId: selectedProjectId!,
                visitType: visitForm.visitType,
                scheduledDate: new Date(visitForm.scheduledDate).getTime(),
                assignedStaffName: visitForm.assignedStaffName || undefined,
                description: visitForm.description || undefined,
              })}
            >
              {scheduleVisit.isPending ? "저장 중..." : "저장"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 방문 완료 처리 다이얼로그 */}
      <Dialog open={!!completingVisit} onOpenChange={open => !open && setCompletingVisit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>방문 완료 처리</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-muted-foreground">조치 내역</label>
              <Textarea
                placeholder="수행한 작업을 기록하세요"
                value={completeForm.workPerformed}
                onChange={e => setCompleteForm(f => ({ ...f, workPerformed: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">고객 피드백</label>
              <Textarea
                value={completeForm.clientFeedback}
                onChange={e => setCompleteForm(f => ({ ...f, clientFeedback: e.target.value }))}
              />
            </div>
            <Button
              className="w-full"
              disabled={updateVisit.isPending}
              onClick={() => updateVisit.mutate({
                id: completingVisit.id,
                status: "completed",
                workPerformed: completeForm.workPerformed || undefined,
                clientFeedback: completeForm.clientFeedback || undefined,
              })}
            >
              {updateVisit.isPending ? "처리 중..." : "완료 처리"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 구독 생성 다이얼로그 */}
      <Dialog open={showCreateSubscription} onOpenChange={setShowCreateSubscription}>
        <DialogContent>
          <DialogHeader><DialogTitle>OpsX Insight 구독 생성</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-muted-foreground">플랜</label>
              <Select value={subscriptionForm.plan} onValueChange={v => setSubscriptionForm(f => ({ ...f, plan: v as typeof f.plan }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PLAN_LABELS).map(([k, label]) => <SelectItem key={k} value={k}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">월 이용료 (원)</label>
              <Input
                type="number"
                value={subscriptionForm.monthlyFee || ""}
                onChange={e => setSubscriptionForm(f => ({ ...f, monthlyFee: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">리포트 주기</label>
              <Select value={subscriptionForm.reportFrequency} onValueChange={v => setSubscriptionForm(f => ({ ...f, reportFrequency: v as typeof f.reportFrequency }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">주 1회</SelectItem>
                  <SelectItem value="biweekly">격주</SelectItem>
                  <SelectItem value="monthly">월 1회</SelectItem>
                  <SelectItem value="quarterly">분기 1회</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              disabled={createSubscription.isPending}
              onClick={() => createSubscription.mutate({
                clientProjectId: selectedProjectId!,
                plan: subscriptionForm.plan,
                monthlyFee: subscriptionForm.monthlyFee,
                sensorTypes: "[]",
                reportFrequency: subscriptionForm.reportFrequency,
              })}
            >
              {createSubscription.isPending ? "생성 중..." : "구독 생성"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
