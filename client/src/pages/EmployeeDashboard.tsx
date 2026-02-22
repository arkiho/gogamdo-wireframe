import { useState, useMemo } from "react";
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
  FileText, Plus, Target, TrendingUp, Calendar, CheckCircle2, Clock,
  BarChart3, Award, Briefcase, ClipboardList, ArrowRight
} from "lucide-react";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("daily");
  const [showCreateReport, setShowCreateReport] = useState(false);
  const [showCreateOkr, setShowCreateOkr] = useState(false);
  const [reportForm, setReportForm] = useState({
    projectId: 0, reportDate: Date.now(),
    weatherCondition: "sunny", workSummary: "", workDetails: "",
    materialsUsed: "", progressPercentage: 0, tomorrowPlan: "",
    issuesEncountered: "", safetyNotes: "",
  });
  const [okrForm, setOkrForm] = useState({
    title: "", description: "", period: `${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`,
    level: "individual" as const,
  });
  const [krForm, setKrForm] = useState({ objectiveId: 0, title: "", targetValue: 0, unit: "" });

  const dailyReports = trpc.employee.getMyDailyReports.useQuery(
    { limit: 30, offset: 0 },
    { enabled: !!user }
  );
  const [currentPeriod] = useState(`${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`);
  const myOkrs = trpc.employee.getMyObjectives.useQuery(
    { period: currentPeriod },
    { enabled: !!user }
  );
  const myKpis = trpc.employee.getMyKpiRecords.useQuery(
    { period: currentPeriod },
    { enabled: !!user }
  );

  const createReport = trpc.employee.submitDailyReport.useMutation({
    onSuccess: () => { dailyReports.refetch(); setShowCreateReport(false); toast.success("일일 보고서가 제출되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const createOkr = trpc.employee.createObjective.useMutation({
    onSuccess: () => { myOkrs.refetch(); setShowCreateOkr(false); toast.success("OKR이 등록되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const addKeyResult = trpc.employee.addKeyResult.useMutation({
    onSuccess: () => { myOkrs.refetch(); toast.success("핵심 결과가 추가되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const updateKrProgress = trpc.employee.updateKeyResult.useMutation({
    onSuccess: () => { myOkrs.refetch(); toast.success("진행률이 업데이트되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const weatherLabels: Record<string, string> = {
    sunny: "☀️ 맑음", cloudy: "⛅ 흐림", rainy: "🌧️ 비", snowy: "❄️ 눈",
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">직원 대시보드</h1>
          <p className="text-muted-foreground mt-1">일일 보고서, KPI, OKR 관리</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-sm">{currentPeriod}</Badge>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <FileText className="w-6 h-6 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{dailyReports.data?.length || 0}</p>
            <p className="text-xs text-muted-foreground">이번 달 보고서</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Target className="w-6 h-6 text-purple-500 mb-2" />
            <p className="text-2xl font-bold">{myOkrs.data?.length || 0}</p>
            <p className="text-xs text-muted-foreground">진행 중 OKR</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <BarChart3 className="w-6 h-6 text-green-500 mb-2" />
            <p className="text-2xl font-bold">{myKpis.data?.length || 0}</p>
            <p className="text-xs text-muted-foreground">KPI 기록</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Award className="w-6 h-6 text-amber-500 mb-2" />
            <p className="text-2xl font-bold">-</p>
            <p className="text-xs text-muted-foreground">이번 분기 평가</p>
          </CardContent>
        </Card>
      </div>

      {/* 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="daily" className="gap-1"><FileText className="w-4 h-4" />일일 보고서</TabsTrigger>
          <TabsTrigger value="okr" className="gap-1"><Target className="w-4 h-4" />OKR</TabsTrigger>
          <TabsTrigger value="kpi" className="gap-1"><BarChart3 className="w-4 h-4" />KPI</TabsTrigger>
        </TabsList>

        {/* 일일 보고서 */}
        <TabsContent value="daily" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showCreateReport} onOpenChange={setShowCreateReport}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" />보고서 작성</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>일일 현장 보고서</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="프로젝트 ID" type="number" onChange={e => setReportForm(f => ({ ...f, projectId: parseInt(e.target.value) || 0 }))} />
                    <Input type="date" value={reportForm.reportDate} onChange={e => setReportForm(f => ({ ...f, reportDate: e.target.value }))} />
                  </div>
                  <Select value={reportForm.weatherCondition} onValueChange={v => setReportForm(f => ({ ...f, weatherCondition: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(weatherLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea placeholder="작업 내용 (상세히 기록)" rows={4} onChange={e => setReportForm(f => ({ ...f, workSummary: e.target.value }))} />
                  <Textarea placeholder="안전 이슈 (있을 경우)" rows={2} onChange={e => setReportForm(f => ({ ...f, safetyNotes: e.target.value }))} />
                  <Textarea placeholder="사용 자재" rows={2} onChange={e => setReportForm(f => ({ ...f, materialsUsed: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">공정률 (%)</label>
                      <Input type="number" min={0} max={100} value={reportForm.progressPercentage || ""} onChange={e => setReportForm(f => ({ ...f, progressPercentage: parseInt(e.target.value) || 0 }))} />
                    </div>
                  </div>
                  <Textarea placeholder="내일 계획" rows={2} onChange={e => setReportForm(f => ({ ...f, tomorrowPlan: e.target.value }))} />
                  <Button className="w-full" onClick={() => createReport.mutate(reportForm)} disabled={createReport.isPending}>
                    {createReport.isPending ? "제출 중..." : "보고서 제출"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {dailyReports.data?.map((r: any) => (
              <Card key={r.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{r.reportDate ? new Date(r.reportDate).toLocaleDateString("ko-KR") : "-"}</span>
                        <Badge variant="outline" className="text-xs">{weatherLabels[r.weatherCondition] || r.weatherCondition}</Badge>
                        <Badge variant={r.status === "approved" ? "default" : r.status === "submitted" ? "secondary" : "outline"}>
                          {r.status === "submitted" ? "제출됨" : r.status === "reviewed" ? "검토중" : r.status === "approved" ? "승인" : r.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{r.workSummary}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-primary">{r.progressPercentage || 0}%</span>
                      <p className="text-xs text-muted-foreground">공정률</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!dailyReports.data?.length && (
              <Card><CardContent className="pt-8 pb-8 text-center text-muted-foreground text-sm">작성된 보고서가 없습니다.</CardContent></Card>
            )}
          </div>
        </TabsContent>

        {/* OKR */}
        <TabsContent value="okr" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showCreateOkr} onOpenChange={setShowCreateOkr}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" />OKR 등록</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>OKR 등록</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input placeholder="목표 (Objective)" value={okrForm.title} onChange={e => setOkrForm(f => ({ ...f, title: e.target.value }))} />
                  <Textarea placeholder="상세 설명" value={okrForm.description} onChange={e => setOkrForm(f => ({ ...f, description: e.target.value }))} />
                  <Select value={okrForm.level} onValueChange={v => setOkrForm(f => ({ ...f, level: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">회사</SelectItem>
                      <SelectItem value="department">부서</SelectItem>
                      <SelectItem value="individual">개인</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="w-full" onClick={() => createOkr.mutate(okrForm)} disabled={createOkr.isPending}>
                    {createOkr.isPending ? "등록 중..." : "OKR 등록"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {myOkrs.data?.map((okr: any) => (
              <Card key={okr.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{okr.title}</CardTitle>
                    <Badge variant={okr.status === "completed" ? "default" : "secondary"}>
                      {okr.status === "draft" ? "초안" : okr.status === "active" ? "진행중" : okr.status === "completed" ? "완료" : okr.status}
                    </Badge>
                  </div>
                  {okr.description && <CardDescription className="text-xs">{okr.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {okr.keyResults?.map((kr: any) => (
                      <div key={kr.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                        <div className="flex-1">
                          <p className="text-sm">{kr.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="h-1.5 bg-muted rounded-full flex-1">
                              <div
                                className="h-1.5 bg-primary rounded-full transition-all"
                                style={{ width: `${Math.min(100, (kr.currentValue / kr.targetValue) * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{kr.currentValue}/{kr.targetValue} {kr.unit}</span>
                          </div>
                        </div>
                        <Input
                          type="number"
                          className="w-20 h-8 text-xs"
                          placeholder="현재값"
                          onBlur={e => {
                            const val = parseInt(e.target.value);
                            if (val && val !== kr.currentValue) {
                              updateKrProgress.mutate({ id: kr.id, currentValue: val });
                            }
                          }}
                        />
                      </div>
                    ))}
                    <Button
                      size="sm" variant="ghost" className="gap-1 text-xs"
                      onClick={() => {
                        const title = prompt("핵심 결과 (Key Result) 제목:");
                        const target = prompt("목표 수치:");
                        const unit = prompt("단위 (건, %, 원 등):");
                        if (title && target && unit) {
                          addKeyResult.mutate({ objectiveId: okr.id, title, targetValue: parseInt(target) || 0, unit });
                        }
                      }}
                    >
                      <Plus className="w-3 h-3" />핵심 결과 추가
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!myOkrs.data?.length && (
              <Card><CardContent className="pt-8 pb-8 text-center text-muted-foreground text-sm">등록된 OKR이 없습니다.</CardContent></Card>
            )}
          </div>
        </TabsContent>

        {/* KPI */}
        <TabsContent value="kpi" className="space-y-4">
          <div className="space-y-3">
            {myKpis.data?.map((kpi: any) => (
              <Card key={kpi.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{kpi.kpiName || `KPI #${kpi.kpiDefinitionId}`}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{kpi.period}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold">{kpi.actualValue || 0}</span>
                      <span className="text-xs text-muted-foreground"> / {kpi.targetValue || 0}</span>
                      <div className="h-1.5 bg-muted rounded-full w-24 mt-1">
                        <div
                          className="h-1.5 bg-primary rounded-full"
                          style={{ width: `${Math.min(100, ((kpi.actualValue || 0) / (kpi.targetValue || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!myKpis.data?.length && (
              <Card><CardContent className="pt-8 pb-8 text-center text-muted-foreground text-sm">KPI 기록이 없습니다. 관리자가 KPI를 배정하면 여기에 표시됩니다.</CardContent></Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
