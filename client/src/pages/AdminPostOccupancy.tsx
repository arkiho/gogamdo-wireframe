import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  HeartHandshake, CalendarCheck, Star, BarChart3, Brain, Plus,
  FileText, Send, Clock, CheckCircle2, AlertCircle, Repeat
} from "lucide-react";

export default function AdminPostOccupancy() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("satisfaction");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [showScheduleVisit, setShowScheduleVisit] = useState(false);
  const [showCreateSubscription, setShowCreateSubscription] = useState(false);
  const [visitForm, setVisitForm] = useState({
    clientProjectId: 0, visitDate: Date.now(), visitType: "initial_inspection" as const,
    scheduledDate: Date.now(), description: "",
  });
  const [subscriptionForm, setSubscriptionForm] = useState({
    clientProjectId: 0, plan: "basic" as const,
    monthlyFee: 0, sensorTypes: "[]", reportFrequency: "monthly" as const,
  });

  const satisfaction = trpc.postOccupancy.getSatisfaction.useQuery(
    { clientProjectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );
  const visits = trpc.postOccupancy.getVisits.useQuery(
    { clientProjectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );
  const subscription = trpc.postOccupancy.getSubscription.useQuery(
    { clientProjectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );
  const reports = trpc.postOccupancy.getOptimizationReports.useQuery(
    { subscriptionId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );

  const scheduleVisit = trpc.postOccupancy.scheduleVisit.useMutation({
    onSuccess: () => { visits.refetch(); setShowScheduleVisit(false); toast.success("방문이 예약되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const createSubscription = trpc.postOccupancy.createSubscription.useMutation({
    onSuccess: () => { subscription.refetch(); setShowCreateSubscription(false); toast.success("구독이 생성되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const generateReport = trpc.postOccupancy.generateOptimizationReport.useMutation({
    onSuccess: () => { reports.refetch(); toast.success("최적화 리포트가 생성되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const planLabels: Record<string, string> = {
    basic: "Basic (분기 1회)", standard: "Standard (월 1회)", premium: "Premium (월 2회)",
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground font-heading">사후관리 & OpsX Insight</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">입주 후 만족도 → 정기 방문 → 공간 최적화 제안 → 구독 매출</p>
        </div>
      </div>

      {/* 프로젝트 선택 */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <Input
              placeholder="프로젝트 ID 입력"
              type="number"
              className="max-w-xs"
              onChange={e => setSelectedProjectId(parseInt(e.target.value) || null)}
            />
            <Button variant="outline" onClick={() => { satisfaction.refetch(); visits.refetch(); subscription.refetch(); reports.refetch(); }}>
              조회
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedProjectId && (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardContent className="pt-6">
                <Star className="w-6 h-6 text-amber-500 mb-2" />
                <p className="text-2xl font-bold">{satisfaction.data?.overallScore || "-"}</p>
                <p className="text-xs text-muted-foreground">만족도 점수</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <CalendarCheck className="w-6 h-6 text-blue-500 mb-2" />
                <p className="text-2xl font-bold">{visits.data?.length || 0}</p>
                <p className="text-xs text-muted-foreground">방문 기록</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Repeat className="w-6 h-6 text-green-500 mb-2" />
                <p className="text-2xl font-bold">{subscription.data ? planLabels[subscription.data.planType] || subscription.data.planType : "-"}</p>
                <p className="text-xs text-muted-foreground">구독 상태</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Brain className="w-6 h-6 text-purple-500 mb-2" />
                <p className="text-2xl font-bold">{reports.data?.length || 0}</p>
                <p className="text-xs text-muted-foreground">최적화 리포트</p>
              </CardContent>
            </Card>
          </div>

          {/* 탭 */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="satisfaction" className="gap-1"><Star className="w-4 h-4" />만족도</TabsTrigger>
              <TabsTrigger value="visits" className="gap-1"><CalendarCheck className="w-4 h-4" />방문 관리</TabsTrigger>
              <TabsTrigger value="subscription" className="gap-1"><Repeat className="w-4 h-4" />OpsX 구독</TabsTrigger>
              <TabsTrigger value="reports" className="gap-1"><Brain className="w-4 h-4" />최적화 리포트</TabsTrigger>
            </TabsList>

            {/* 만족도 */}
            <TabsContent value="satisfaction">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">입주 후 만족도 조사</CardTitle>
                  <CardDescription>시공 완료 3개월 후 자동 발송되는 만족도 설문 결과</CardDescription>
                </CardHeader>
                <CardContent>
                  {satisfaction.data ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold">{satisfaction.data.overallScore || 0}</p>
                          <p className="text-xs text-muted-foreground">종합 점수</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold">{satisfaction.data.designScore || 0}</p>
                          <p className="text-xs text-muted-foreground">설계 만족도</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold">{satisfaction.data.constructionScore || 0}</p>
                          <p className="text-xs text-muted-foreground">시공 만족도</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold">{satisfaction.data.communicationScore || 0}</p>
                          <p className="text-xs text-muted-foreground">소통 만족도</p>
                        </div>
                      </div>
                      {satisfaction.data.feedback && (
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium text-sm mb-2">고객 피드백</h4>
                          <p className="text-sm text-muted-foreground">{satisfaction.data.feedback}</p>
                        </div>
                      )}
                      {satisfaction.data.improvementSuggestions && (
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium text-sm mb-2">개선 제안</h4>
                          <p className="text-sm text-muted-foreground">{satisfaction.data.improvementSuggestions}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">만족도 조사 결과가 없습니다.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 방문 관리 */}
            <TabsContent value="visits" className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={showScheduleVisit} onOpenChange={setShowScheduleVisit}>
                  <DialogTrigger asChild>
                    <Button className="gap-2"><Plus className="w-4 h-4" />방문 예약</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>사후관리 방문 예약</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Select value={visitForm.visitType} onValueChange={v => setVisitForm(f => ({ ...f, visitType: v as any }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3month">3개월 정기 방문</SelectItem>
                          <SelectItem value="6month">6개월 정기 방문</SelectItem>
                          <SelectItem value="annual">연간 점검</SelectItem>
                          <SelectItem value="emergency">긴급 AS</SelectItem>
                          <SelectItem value="optimization">공간 최적화 컨설팅</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input type="date" onChange={e => setVisitForm(f => ({ ...f, visitDate: new Date(e.target.value).getTime() }))} />
                      <Textarea placeholder="방문 목적 및 메모" onChange={e => setVisitForm(f => ({ ...f, notes: e.target.value }))} />
                      <Button className="w-full" onClick={() => scheduleVisit.mutate({ ...visitForm, clientProjectId: selectedProjectId!, scheduledDate: visitForm.visitDate })} disabled={scheduleVisit.isPending}>
                        {scheduleVisit.isPending ? "예약 중..." : "방문 예약"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                {visits.data?.map((v: any) => (
                  <Card key={v.id}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{v.visitType === "3month" ? "3개월" : v.visitType === "6month" ? "6개월" : v.visitType === "annual" ? "연간" : v.visitType === "emergency" ? "긴급" : "최적화"}</Badge>
                            <Badge variant={v.status === "completed" ? "default" : v.status === "scheduled" ? "secondary" : "outline"}>
                              {v.status === "scheduled" ? "예정" : v.status === "completed" ? "완료" : v.status === "cancelled" ? "취소" : v.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {v.visitDate ? new Date(v.visitDate).toLocaleDateString("ko-KR") : "-"}
                          </p>
                          {v.notes && <p className="text-xs text-muted-foreground mt-1">{v.notes}</p>}
                        </div>
                        {v.status === "completed" && v.report && (
                          <Button size="sm" variant="outline" className="gap-1"><FileText className="w-3 h-3" />리포트</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {!visits.data?.length && (
                  <Card><CardContent className="pt-8 pb-8 text-center text-muted-foreground text-sm">예약된 방문이 없습니다.</CardContent></Card>
                )}
              </div>
            </TabsContent>

            {/* OpsX Insight 구독 */}
            <TabsContent value="subscription" className="space-y-4">
              {subscription.data ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Repeat className="w-5 h-5" />OpsX Insight 구독 현황
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground">플랜</p>
                        <p className="font-medium">{planLabels[subscription.data.planType] || subscription.data.planType}</p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground">상태</p>
                        <Badge variant={subscription.data.status === "active" ? "default" : "secondary"}>
                          {subscription.data.status === "active" ? "활성" : subscription.data.status === "paused" ? "일시중지" : subscription.data.status}
                        </Badge>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground">주기</p>
                        <p className="font-medium">{subscription.data.intervalMonths}개월</p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground">다음 리포트</p>
                        <p className="font-medium">
                          {subscription.data.nextReportDate ? new Date(subscription.data.nextReportDate).toLocaleDateString("ko-KR") : "-"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-8 pb-8 text-center">
                    <Repeat className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="font-medium mb-2">OpsX Insight 구독이 없습니다</h3>
                    <p className="text-sm text-muted-foreground mb-4">3개월 주기로 공간 최적화 제안을 받아보세요.</p>
                    <Dialog open={showCreateSubscription} onOpenChange={setShowCreateSubscription}>
                      <DialogTrigger asChild>
                        <Button className="gap-2"><Plus className="w-4 h-4" />구독 생성</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>OpsX Insight 구독 생성</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-4">
                          <Input placeholder="고객 ID" type="number" onChange={e => setSubscriptionForm(f => ({ ...f, clientId: parseInt(e.target.value) || 0 }))} />
                          <Select value={subscriptionForm.planType} onValueChange={v => setSubscriptionForm(f => ({ ...f, planType: v as any }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basic">Basic (분기 1회)</SelectItem>
                              <SelectItem value="standard">Standard (월 1회)</SelectItem>
                              <SelectItem value="premium">Premium (월 2회)</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button className="w-full" onClick={() => createSubscription.mutate({ ...subscriptionForm, clientProjectId: selectedProjectId! })} disabled={createSubscription.isPending}>
                            {createSubscription.isPending ? "생성 중..." : "구독 생성"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* 최적화 리포트 */}
            <TabsContent value="reports" className="space-y-4">
              <div className="flex justify-end">
                <Button
                  className="gap-2"
                  onClick={() => generateReport.mutate({ subscriptionId: selectedProjectId!, clientProjectId: selectedProjectId!, sensorDataSummary: '{}' })}
                  disabled={generateReport.isPending}
                >
                  <Brain className="w-4 h-4" />{generateReport.isPending ? "생성 중..." : "AI 최적화 리포트 생성"}
                </Button>
              </div>

              <div className="space-y-4">
                {reports.data?.map((r: any) => (
                  <Card key={r.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{r.reportTitle || `리포트 #${r.id}`}</CardTitle>
                        <Badge variant="secondary">{r.createdAt ? new Date(r.createdAt).toLocaleDateString("ko-KR") : "-"}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {r.recommendations && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">AI 추천 사항</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.recommendations}</p>
                        </div>
                      )}
                      {r.dataInsights && (
                        <div className="mt-3 space-y-2">
                          <h4 className="text-sm font-medium">데이터 인사이트</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.dataInsights}</p>
                        </div>
                      )}
                      {r.estimatedSavings && (
                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-sm font-medium text-green-700 dark:text-green-400">
                            예상 절감 효과: {r.estimatedSavings}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {!reports.data?.length && (
                  <Card><CardContent className="pt-8 pb-8 text-center text-muted-foreground text-sm">생성된 리포트가 없습니다. AI 최적화 리포트를 생성해 보세요.</CardContent></Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
