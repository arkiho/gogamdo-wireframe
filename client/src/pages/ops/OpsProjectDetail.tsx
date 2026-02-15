import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useParams } from "wouter";
import { useState } from "react";
import {
  ArrowLeft, Building2, MapPin, Calendar, Ruler, Banknote,
  BarChart3, ClipboardList, FileText, Receipt, Users, FileSpreadsheet,
  FileSignature, Calculator, Camera, Link2, Star, Download,
} from "lucide-react";
import { toast } from "sonner";
import { generateProjectReportPdf, type ProjectReportData } from "@/lib/projectReportPdf";

// Sub-tab components
import ScheduleTab from "./tabs/ScheduleTab";
import WorkReportTab from "./tabs/WorkReportTab";
import MeetingTab from "./tabs/MeetingTab";
import ExpenseTab from "./tabs/ExpenseTab";
import SubcontractorTab from "./tabs/SubcontractorTab";
import EstimateTab from "./tabs/EstimateTab";
import ContractTab from "./tabs/ContractTab";
import CostTab from "./tabs/CostTab";
import EvaluationTab from "./tabs/EvaluationTab";
import { CostExecutionChart, ScheduleProgressChart, ExpenseCategoryChart } from "@/components/OpsCharts";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  planning: { label: "기획", color: "bg-slate-100 text-slate-700" },
  designing: { label: "설계", color: "bg-blue-100 text-blue-700" },
  permit: { label: "인허가", color: "bg-purple-100 text-purple-700" },
  construction: { label: "시공중", color: "bg-amber-100 text-amber-700" },
  inspection: { label: "검수", color: "bg-cyan-100 text-cyan-700" },
  completed: { label: "완료", color: "bg-green-100 text-green-700" },
  warranty: { label: "하자보수", color: "bg-orange-100 text-orange-700" },
  closed: { label: "종료", color: "bg-gray-100 text-gray-500" },
};

export default function OpsProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  const project = trpc.ops.project.get.useQuery({ id: id! });

  if (project.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">프로젝트 로딩 중...</div>
      </div>
    );
  }

  if (!project.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">프로젝트를 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={() => setLocation("/ops")}>
          <ArrowLeft className="w-4 h-4 mr-2" />목록으로
        </Button>
      </div>
    );
  }

  const p = project.data;
  const s = STATUS_LABELS[p.status] ?? { label: p.status, color: "bg-gray-100 text-gray-600" };

  const handleCopyInviteLink = (type: "client" | "subcontractor") => {
    const link = `${window.location.origin}/ops/invite/${p.id}?type=${type}`;
    navigator.clipboard.writeText(link);
    toast.success(`${type === "client" ? "고객사" : "하도급 업체"} 초대 링크가 복사되었습니다.`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="min-w-0">
          <button
            onClick={() => setLocation("/ops")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground active:text-foreground transition-colors mb-2 sm:mb-3 py-1"
          >
            <ArrowLeft className="w-4 h-4" />프로젝트 목록
          </button>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 mb-2">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight">{p.name}</h1>
            <Badge variant="outline" className="text-[10px] sm:text-xs">{p.code}</Badge>
            <Badge className={`text-[10px] sm:text-xs ${s.color} border-0`}>{s.label}</Badge>
          </div>
          {p.description && <p className="text-muted-foreground text-xs sm:text-sm max-w-2xl">{p.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-initial h-9" onClick={() => handleCopyInviteLink("client")}>
            <Link2 className="w-4 h-4 mr-1" />고객사 초대
          </Button>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-initial h-9" onClick={() => handleCopyInviteLink("subcontractor")}>
            <Users className="w-4 h-4 mr-1" />하도급 초대
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-initial h-9"
            onClick={() => {
              const now = new Date();
              const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
              const reportData: ProjectReportData = {
                project: {
                  name: p.name,
                  clientName: p.clientName,
                  status: p.status,
                  startDate: p.startDate,
                  endDate: p.endDate,
                  address: p.siteAddress,
                },
                expenses: (p as any).expenses ?? [],
                schedules: (p as any).schedules ?? [],
                costs: (p as any).costs ?? [],
                meetings: (p as any).meetings ?? [],
                reportMonth: month,
              };
              try {
                generateProjectReportPdf(reportData);
                toast.success("PDF 리포트가 다운로드됩니다.");
              } catch (err) {
                toast.error("PDF 생성에 실패했습니다.");
              }
            }}
          >
            <Download className="w-4 h-4 mr-1" />PDF 리포트
          </Button>
        </div>
      </div>

      {/* Project Info Cards - 모바일에서 2열, 데스크톱에서 5열 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        <Card>
          <CardContent className="pt-3 pb-2 sm:pt-4 sm:pb-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground">고객사</p>
                <p className="font-medium truncate">{p.clientName}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {p.siteAddress && (
          <Card>
            <CardContent className="pt-3 pb-2 sm:pt-4 sm:pb-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">현장</p>
                  <p className="font-medium truncate">{p.siteAddress}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {p.totalArea && (
          <Card>
            <CardContent className="pt-3 pb-2 sm:pt-4 sm:pb-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Ruler className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">면적</p>
                  <p className="font-medium">{p.totalArea}㎡</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {p.contractAmount && (
          <Card>
            <CardContent className="pt-3 pb-2 sm:pt-4 sm:pb-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Banknote className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">계약금액</p>
                  <p className="font-medium">{Number(p.contractAmount).toLocaleString()}원</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {p.startDate && (
          <Card>
            <CardContent className="pt-3 pb-2 sm:pt-4 sm:pb-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">공사기간</p>
                  <p className="font-medium text-xs">{p.startDate} ~ {p.endDate || "미정"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs - 모바일에서 수평 스크롤 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <TabsList className="inline-flex w-max sm:flex sm:flex-wrap sm:w-auto h-auto gap-0.5 sm:gap-1 bg-muted/50 p-1">
            <TabsTrigger value="overview" className="text-[10px] sm:text-xs gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5"><BarChart3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /><span className="hidden xs:inline">개요</span><span className="xs:hidden">개요</span></TabsTrigger>
            <TabsTrigger value="schedule" className="text-[10px] sm:text-xs gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5"><ClipboardList className="w-3 h-3 sm:w-3.5 sm:h-3.5" />공정표</TabsTrigger>
            <TabsTrigger value="reports" className="text-[10px] sm:text-xs gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5"><FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />보고서</TabsTrigger>
            <TabsTrigger value="meetings" className="text-[10px] sm:text-xs gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5"><FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />회의록</TabsTrigger>
            <TabsTrigger value="expenses" className="text-[10px] sm:text-xs gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5"><Receipt className="w-3 h-3 sm:w-3.5 sm:h-3.5" />결의서</TabsTrigger>
            <TabsTrigger value="subcontractors" className="text-[10px] sm:text-xs gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5"><Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />하도급</TabsTrigger>
            <TabsTrigger value="estimates" className="text-[10px] sm:text-xs gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5"><FileSpreadsheet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />견적서</TabsTrigger>
            <TabsTrigger value="contracts" className="text-[10px] sm:text-xs gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5"><FileSignature className="w-3 h-3 sm:w-3.5 sm:h-3.5" />계약서</TabsTrigger>
            <TabsTrigger value="cost" className="text-[10px] sm:text-xs gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5"><Calculator className="w-3 h-3 sm:w-3.5 sm:h-3.5" />원가</TabsTrigger>
            <TabsTrigger value="evaluation" className="text-[10px] sm:text-xs gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5"><Star className="w-3 h-3 sm:w-3.5 sm:h-3.5" />평가</TabsTrigger>
            <TabsTrigger value="camera" className="text-[10px] sm:text-xs gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5"><Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5" />카메라</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab projectId={id!} />
        </TabsContent>
        <TabsContent value="schedule" className="mt-4">
          <ScheduleTab projectId={id!} />
        </TabsContent>
        <TabsContent value="reports" className="mt-4">
          <WorkReportTab projectId={id!} />
        </TabsContent>
        <TabsContent value="meetings" className="mt-4">
          <MeetingTab projectId={id!} />
        </TabsContent>
        <TabsContent value="expenses" className="mt-4">
          <ExpenseTab projectId={id!} projectName={p.name} />
        </TabsContent>
        <TabsContent value="subcontractors" className="mt-4">
          <SubcontractorTab projectId={id!} />
        </TabsContent>
        <TabsContent value="estimates" className="mt-4">
          <EstimateTab projectId={id!} />
        </TabsContent>
        <TabsContent value="contracts" className="mt-4">
          <ContractTab projectId={id!} />
        </TabsContent>
        <TabsContent value="cost" className="mt-4">
          <CostTab projectId={id!} />
        </TabsContent>
        <TabsContent value="evaluation" className="mt-4">
          <EvaluationTab projectId={id!} />
        </TabsContent>
        <TabsContent value="camera" className="mt-4">
          <CameraTab projectId={id!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Overview Tab - project summary with quick stats
function OverviewTab({ projectId }: { projectId: string }) {
  const schedules = trpc.ops.schedule.list.useQuery({ projectId });
  const expenses = trpc.ops.expense.list.useQuery({ projectId });
  const subs = trpc.ops.subcontractor.list.useQuery({ projectId });
  const costs = trpc.ops.charts.costExecution.useQuery({ projectId: Number(projectId) });
  const project = trpc.ops.project.get.useQuery({ id: Number(projectId) });

  const totalSchedules = schedules.data?.length ?? 0;
  const completedSchedules = schedules.data?.filter(s => s.progress === 100).length ?? 0;
  const avgProgress = totalSchedules > 0
    ? Math.round((schedules.data?.reduce((sum, s) => sum + (s.progress ?? 0), 0) ?? 0) / totalSchedules)
    : 0;
  const totalExpenseAmount = expenses.data?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;
  const pendingExpenses = expenses.data?.filter(e => e.approvalStatus === "pending").length ?? 0;
  const activeSubs = subs.data?.filter(s => s.status === "active").length ?? 0;

  // 예산 소진율 계산
  const totalBudget = costs.data?.reduce((sum, c) => sum + Number(c.budget), 0) ?? 0;
  const totalActual = costs.data?.reduce((sum, c) => sum + Number(c.actual), 0) ?? 0;
  const budgetRate = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0;

  // 일정 준수율 (완료된 공정 중 지연 없이 완료된 비율)
  const delayedSchedules = schedules.data?.filter(s => s.status === "delayed").length ?? 0;
  const scheduleComplianceRate = totalSchedules > 0
    ? Math.round(((totalSchedules - delayedSchedules) / totalSchedules) * 100)
    : 100;

  const contractAmount = Number(project.data?.contractAmount ?? 0);
  const contractUsageRate = contractAmount > 0 ? Math.round((totalExpenseAmount / contractAmount) * 100) : 0;

  const pid = Number(projectId);

  return (
    <div className="space-y-4">
      {/* Summary Cards - 모바일 2열 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <Card>
          <CardContent className="pt-3 pb-2 sm:pt-4 sm:pb-3">
            <p className="text-[10px] sm:text-xs text-muted-foreground">전체 공정</p>
            <p className="text-lg sm:text-xl font-bold">{totalSchedules}건</p>
            {totalSchedules > 0 && (
              <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${(completedSchedules / totalSchedules) * 100}%` }} />
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2 sm:pt-4 sm:pb-3">
            <p className="text-[10px] sm:text-xs text-muted-foreground">완료 공정</p>
            <p className="text-lg sm:text-xl font-bold text-green-600">{completedSchedules}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2 sm:pt-4 sm:pb-3">
            <p className="text-[10px] sm:text-xs text-muted-foreground">총 지출</p>
            <p className="text-lg sm:text-xl font-bold">{totalExpenseAmount.toLocaleString()}원</p>
            <p className="text-[10px] sm:text-xs text-amber-600 mt-1">결재 대기 {pendingExpenses}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2 sm:pt-4 sm:pb-3">
            <p className="text-[10px] sm:text-xs text-muted-foreground">하도급 업체</p>
            <p className="text-lg sm:text-xl font-bold">{activeSubs}개사</p>
          </CardContent>
        </Card>
      </div>

      {/* Gauge Cards - 예산 소진율 + 일정 준수율 + 평균 진행률 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className={`border-l-4 ${budgetRate > 90 ? 'border-l-red-500' : budgetRate > 70 ? 'border-l-amber-500' : 'border-l-blue-500'}`}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">예산 소진율</p>
              <span className={`text-lg font-bold ${budgetRate > 90 ? 'text-red-600' : budgetRate > 70 ? 'text-amber-600' : 'text-blue-600'}`}>
                {budgetRate}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${budgetRate > 90 ? 'bg-red-500' : budgetRate > 70 ? 'bg-amber-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(budgetRate, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              실적 {totalActual.toLocaleString()}원 / 예산 {totalBudget.toLocaleString()}원
            </p>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${scheduleComplianceRate >= 90 ? 'border-l-green-500' : scheduleComplianceRate >= 70 ? 'border-l-amber-500' : 'border-l-red-500'}`}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">일정 준수율</p>
              <span className={`text-lg font-bold ${scheduleComplianceRate >= 90 ? 'text-green-600' : scheduleComplianceRate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                {scheduleComplianceRate}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${scheduleComplianceRate >= 90 ? 'bg-green-500' : scheduleComplianceRate >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${scheduleComplianceRate}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              지연 {delayedSchedules}건 / 전체 {totalSchedules}건
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">평균 진행률</p>
              <span className="text-lg font-bold text-emerald-600">{avgProgress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(avgProgress, 100)}%` }}
              />
            </div>
            {contractAmount > 0 && (
              <p className="text-[10px] text-muted-foreground mt-1.5">
                계약금액 대비 지출 {contractUsageRate}%
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ScheduleProgressChart projectId={pid} />
        <ExpenseCategoryChart projectId={pid} />
      </div>
      <CostExecutionChart projectId={pid} />
    </div>
  );
}

// Camera Tab - placeholder for real-time camera integration
function CameraTab({ projectId }: { projectId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Camera className="w-5 h-5" />현장 실시간 카메라
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-10 sm:py-16 border-2 border-dashed rounded-lg">
          <Camera className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground/20 mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold mb-2">현장 카메라 연동 준비 중</h3>
          <p className="text-muted-foreground text-xs sm:text-sm max-w-md mx-auto px-4">
            실시간 현장 카메라가 설치되면 이 페이지에서 바로 확인할 수 있습니다.
            카메라 스트림 URL을 등록하면 실시간 모니터링이 가능합니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
