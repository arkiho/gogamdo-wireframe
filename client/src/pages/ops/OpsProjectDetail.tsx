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
  FileSignature, Calculator, Wallet, Camera, Link2, Star, Download, CheckCircle2, Sparkles,
  LayoutDashboard,
} from "lucide-react";

// 프로젝트 콘솔 그룹형 네비게이션 (목업 gogamdo-project-console)
const CONSOLE_GROUPS: { title: string; items: { v: string; label: string; icon: any; badge?: boolean }[] }[] = [
  { title: "현황", items: [{ v: "overview", label: "대시보드", icon: LayoutDashboard }] },
  { title: "공정 관리", items: [
    { v: "schedule", label: "공정표", icon: ClipboardList },
    { v: "reports", label: "작업보고", icon: FileText },
    { v: "meetings", label: "회의록", icon: FileText },
  ] },
  { title: "정산 · 비용", items: [
    { v: "expenses", label: "지출결의서", icon: Receipt, badge: true },
    { v: "settlement", label: "실행정산표", icon: Wallet },
    { v: "estimates", label: "견적서", icon: FileSpreadsheet },
    { v: "contracts", label: "계약서", icon: FileSignature },
    { v: "cost", label: "원가", icon: Calculator },
  ] },
  { title: "협력 · 현장", items: [
    { v: "subcontractors", label: "하도급", icon: Users },
    { v: "evaluation", label: "평가", icon: Star },
    { v: "camera", label: "현장 CCTV", icon: Camera },
  ] },
];
const CONSOLE_ITEMS = CONSOLE_GROUPS.flatMap((g) => g.items);

function ProjectConsoleNav({ active, onSelect, pending }: { active: string; onSelect: (v: string) => void; pending: number }) {
  return (
    <>
      {/* 모바일: 수평 스크롤 pill 바 */}
      <div className="lg:hidden overflow-x-auto -mx-4 px-4 scrollbar-hide mb-3">
        <div className="inline-flex gap-1 bg-muted/50 p-1 rounded-lg w-max">
          {CONSOLE_ITEMS.map((it) => {
            const Icon = it.icon;
            const on = active === it.v;
            return (
              <button key={it.v} onClick={() => onSelect(it.v)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] whitespace-nowrap transition-colors ${on ? "bg-ink text-white font-medium" : "text-muted-foreground"}`}>
                <Icon className="w-3.5 h-3.5" />{it.label}
                {it.badge && pending > 0 && <span className={`text-[9px] px-1 rounded-full ${on ? "bg-gold text-ink" : "bg-red-500 text-white"}`}>{pending}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 데스크톱: 그룹형 다크 사이드바 */}
      <aside className="hidden lg:block lg:sticky lg:top-4 rounded-xl bg-[#16150f] text-[#e9e6da] overflow-hidden self-start">
        <div className="px-4 py-3.5 border-b border-white/[0.08]">
          <div className="font-extrabold text-[13px] text-white">현장 콘솔</div>
          <div className="text-[9px] tracking-[1.5px] text-[#7a7566] uppercase mt-0.5">Project Console</div>
        </div>
        <nav className="p-2.5">
          {CONSOLE_GROUPS.map((g) => (
            <div key={g.title} className="mt-3 first:mt-1">
              <div className="text-[10px] tracking-[1.2px] uppercase text-[#6f6a5c] font-semibold px-2.5 pb-1.5">{g.title}</div>
              <div className="space-y-px">
                {g.items.map((it) => {
                  const Icon = it.icon;
                  const on = active === it.v;
                  return (
                    <button key={it.v} onClick={() => onSelect(it.v)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors ${on ? "bg-gold text-[#1a1710] font-semibold" : "text-[#c3bfb1] hover:bg-white/[0.055] hover:text-white"}`}>
                      <Icon className="w-[16px] h-[16px] flex-shrink-0 opacity-90" />
                      <span className="truncate">{it.label}</span>
                      {it.badge && pending > 0 && (
                        <span className={`ml-auto text-[10px] font-semibold px-1.5 rounded-full ${on ? "bg-[#1a1710] text-gold-light" : "bg-red-500 text-white"}`}>{pending}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { generateProjectReportPdf, type ProjectReportData } from "@/lib/projectReportPdf";
import { IPConsentModal } from "@/components/IPConsentModal";

// Sub-tab components
import ScheduleTab from "./tabs/ScheduleTab";
import WorkReportTab from "./tabs/WorkReportTab";
import MeetingTab from "./tabs/MeetingTab";
import ExpenseTab from "./tabs/ExpenseTab";
import SubcontractorTab from "./tabs/SubcontractorTab";
import EstimateTab from "./tabs/EstimateTab";
import ContractTab from "./tabs/ContractTab";
import CostTab from "./tabs/CostTab";
import SettlementTab from "./tabs/SettlementTab";
import EvaluationTab from "./tabs/EvaluationTab";
import CameraTabComponent from "./tabs/CameraTab";
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
  const [reportConsentOpen, setReportConsentOpen] = useState(false);
  const [reportData, setReportData] = useState<ProjectReportData | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const logDownload = trpc.ipProtection.logDownload.useMutation();
  const utils = trpc.useUtils();

  const project = trpc.ops.project.get.useQuery({ id: Number(id) });
  // 사이드바 '지출결의서' 결재 대기 배지
  const expensesQ = trpc.ops.expense.list.useQuery({ projectId: Number(id) }, { enabled: !!id });
  const pendingExpenses = (expensesQ.data ?? []).filter((e: any) => ["submitted", "in_review"].includes(e.status)).length;

  const updateProject = trpc.ops.project.update.useMutation({
    onSuccess: (_, variables) => {
      utils.ops.project.get.invalidate({ id: Number(id) });
      utils.ops.project.list.invalidate();
      if (variables.status === "completed") {
        toast.success(
          "프로젝트가 완료 상태로 변경되었습니다.\n포트폴리오 초안이 자동 생성되고, 고객에게 리뷰 요청이 발송됩니다.",
          { duration: 6000, icon: "\u2728" }
        );
      } else {
        toast.success("프로젝트 상태가 변경되었습니다.");
      }
    },
    onError: () => {
      toast.error("상태 변경에 실패했습니다.");
    },
  });

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
            <Select
              value={p.status}
              onValueChange={(val: string) => {
                if (val === "completed" && p.status !== "completed") {
                  if (confirm("프로젝트를 완료 상태로 변경하시겠습니까?\n\n완료 시 다음이 자동 실행됩니다:\n• 포트폴리오 초안 자동 생성 (AI 설명문 포함)\n• 고객 리뷰 요청 자동 발송 (이메일 등록 시)")) {
                    updateProject.mutate({ id: Number(id), status: val as any });
                  }
                } else {
                  updateProject.mutate({ id: Number(id), status: val as any });
                }
              }}
            >
              <SelectTrigger className={`w-[100px] sm:w-[120px] h-7 text-[10px] sm:text-xs border-0 ${s.color}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([key, val]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {val.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {p.description && <p className="text-muted-foreground text-xs sm:text-sm max-w-2xl">{p.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-initial h-9" onClick={() => {
            setEditForm({
              id: Number(id),
              name: p.name,
              code: p.code,
              clientName: p.clientName,
              clientContact: (p as any).clientContact || "",
              clientEmail: (p as any).clientEmail || "",
              clientPhone: (p as any).clientPhone || "",
              siteAddress: p.siteAddress || "",
              totalArea: p.totalArea || "",
              contractAmount: (p as any).contractAmount || "",
              description: p.description || "",
            });
            setShowEditProject(true);
          }}>
            <Sparkles className="w-4 h-4 mr-1" />프로젝트 수정
          </Button>
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
              const rd: ProjectReportData = {
                project: {
                  name: p.name,
                  clientName: p.clientName,
                  status: p.status,
                  startDate: p.startDate ?? "",
                  endDate: p.endDate ?? "",
                  address: p.siteAddress ?? "",
                },
                expenses: (p as any).expenses ?? [],
                schedules: (p as any).schedules ?? [],
                costs: (p as any).costs ?? [],
                meetings: (p as any).meetings ?? [],
                reportMonth: month,
              };
              setReportData(rd);
              setReportConsentOpen(true);
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

      {/* 프로젝트 콘솔 — 그룹형 사이드바 + 콘텐츠 (목업 gogamdo-project-console) */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="lg:grid lg:grid-cols-[210px_1fr] lg:gap-5 lg:items-start">
          <ProjectConsoleNav active={activeTab} onSelect={setActiveTab} pending={pendingExpenses} />
          <div className="min-w-0">
        <TabsContent value="overview" className="mt-4 lg:mt-0">
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
          <EstimateTab projectId={id!} projectName={p.name} clientName={p.clientName} siteAddress={p.siteAddress ?? ""} />
        </TabsContent>
        <TabsContent value="contracts" className="mt-4">
          <ContractTab projectId={id!} />
        </TabsContent>
        <TabsContent value="cost" className="mt-4">
          <CostTab projectId={id!} />
        </TabsContent>
        <TabsContent value="settlement" className="mt-4">
          <SettlementTab projectId={id!} />
        </TabsContent>
        <TabsContent value="evaluation" className="mt-4">
          <EvaluationTab projectId={id!} />
        </TabsContent>
        <TabsContent value="camera" className="mt-4 lg:mt-0">
          <CameraTabComponent projectId={id!} />
        </TabsContent>
          </div>
        </div>
      </Tabs>

      {/* 프로젝트 정보 수정 다이얼로그 */}
      <Dialog open={showEditProject} onOpenChange={setShowEditProject}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>프로젝트 정보 수정</DialogTitle></DialogHeader>
          {editForm && (
            <div className="space-y-3 pt-2 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="text-xs text-muted-foreground">프로젝트명</label>
                <Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">프로젝트 코드</label>
                  <Input value={editForm.code} onChange={e => setEditForm({...editForm, code: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">고객사</label>
                  <Input value={editForm.clientName} onChange={e => setEditForm({...editForm, clientName: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">고객 담당자</label>
                  <Input value={editForm.clientContact} onChange={e => setEditForm({...editForm, clientContact: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">고객 이메일</label>
                  <Input value={editForm.clientEmail} onChange={e => setEditForm({...editForm, clientEmail: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">고객 전화번호</label>
                <Input value={editForm.clientPhone} onChange={e => setEditForm({...editForm, clientPhone: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">현장 주소</label>
                <Input value={editForm.siteAddress} onChange={e => setEditForm({...editForm, siteAddress: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">면적 (㎡)</label>
                  <Input value={editForm.totalArea} onChange={e => setEditForm({...editForm, totalArea: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">계약금액 (원)</label>
                  <Input value={editForm.contractAmount} onChange={e => setEditForm({...editForm, contractAmount: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">설명</label>
                <Textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} rows={3} />
              </div>
              <Button className="w-full" onClick={() => {
                updateProject.mutate(editForm, {
                  onSuccess: () => { setShowEditProject(false); toast.success("프로젝트 정보가 수정되었습니다."); }
                });
              }} disabled={updateProject.isPending}>
                {updateProject.isPending ? "수정 중..." : "수정 완료"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* IP 보호 동의 모달 - 프로젝트 보고서 PDF */}
      <IPConsentModal
        open={reportConsentOpen}
        onClose={() => { setReportConsentOpen(false); setReportData(null); }}
        onConsent={async () => {
          if (!reportData) return;
          setReportConsentOpen(false);
          setGeneratingReport(true);
          try {
            const logResult = await logDownload.mutateAsync({
              fileType: "project_report_pdf" as const,
              fileName: `프로젝트_보고서_${reportData.project.name}`,
              projectId: parseInt(id!) || undefined,
              projectName: reportData.project.name || undefined,
              consentGiven: "yes",
            });
            generateProjectReportPdf(reportData, logResult.trackingCode);
            toast.success(`PDF 리포트가 다운로드됩니다. (트래킹: ${logResult.trackingCode})`);
          } catch (err) {
            toast.error("PDF 생성에 실패했습니다.");
          } finally {
            setGeneratingReport(false);
            setReportData(null);
          }
        }}
        fileName={reportData ? `프로젝트_보고서_${reportData.project.name}.pdf` : undefined}
        isLoading={generatingReport}
      />
    </div>
  );
}

// Overview Tab - project summary with quick stats
function OverviewTab({ projectId }: { projectId: string }) {
  const schedules = trpc.ops.schedule.list.useQuery({ projectId: Number(projectId) });
  const expenses = trpc.ops.expense.list.useQuery({ projectId: Number(projectId) });
  const subs = trpc.ops.subcontractor.list.useQuery();
  const costs = trpc.ops.charts.costExecution.useQuery({ projectId: Number(projectId) });
  const project = trpc.ops.project.get.useQuery({ id: Number(projectId) });

  const totalSchedules = schedules.data?.length ?? 0;
  const completedSchedules = schedules.data?.filter(s => s.progress === 100).length ?? 0;
  const avgProgress = totalSchedules > 0
    ? Math.round((schedules.data?.reduce((sum, s) => sum + (s.progress ?? 0), 0) ?? 0) / totalSchedules)
    : 0;
  const totalExpenseAmount = expenses.data?.reduce((sum, e) => sum + Number(e.totalAmount), 0) ?? 0;
  const pendingExpenses = expenses.data?.filter(e => e.status === "submitted").length ?? 0;
  const activeSubs = subs.data?.filter(s => s.isActive === 1).length ?? 0;

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

// CameraTab is now imported from ./tabs/CameraTab.tsx
