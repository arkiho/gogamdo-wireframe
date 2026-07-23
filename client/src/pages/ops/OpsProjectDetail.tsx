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
  const pid = Number(projectId);
  const schedules = trpc.ops.schedule.list.useQuery({ projectId: pid });
  const expenses = trpc.ops.expense.list.useQuery({ projectId: pid });
  const project = trpc.ops.project.get.useQuery({ id: pid });
  const reports = trpc.ops.workReport.list.useQuery({ projectId: pid });
  const cameras = trpc.ops.camera.list.useQuery({ projectId: pid });

  const items = schedules.data ?? [];
  const totalSchedules = items.length;
  const avgProgress = totalSchedules > 0
    ? Math.round(items.reduce((s: number, x: any) => s + (x.progress ?? 0), 0) / totalSchedules)
    : 0;

  // 공정별 실행정산 (승인·지급 결의서만 실집행 반영 — SettlementTab과 동일)
  const approved = (expenses.data ?? []).filter((e: any) => e.status === "approved" || e.status === "paid");
  const actualByItem = new Map<number, number>();
  let untagged = 0;
  for (const e of approved) {
    const amt = Number(e.totalAmount ?? 0);
    const sid = (e as any).scheduleItemId;
    if (sid) actualByItem.set(sid, (actualByItem.get(sid) ?? 0) + amt);
    else untagged += amt;
  }
  const rows = items.map((it: any) => {
    const budget = Number(it.budgetAmount ?? 0);
    const actual = actualByItem.get(it.id) ?? 0;
    const rate = budget > 0 ? Math.round((actual / budget) * 100) : (actual > 0 ? Infinity : 0);
    return { id: it.id, name: it.name, budget, actual, remain: budget - actual, rate, over: rate === Infinity || rate > 100 };
  });
  const totalBudget = rows.reduce((s: number, r: any) => s + r.budget, 0);
  const totalActual = rows.reduce((s: number, r: any) => s + r.actual, 0) + untagged;
  const budgetRate = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0;
  const contractAmount = Number(project.data?.contractAmount ?? 0);
  const overItem = rows.find((r: any) => r.over);

  // 결재 대기 지출결의서
  const pending = (expenses.data ?? []).filter((e: any) => ["submitted", "in_review"].includes(e.status));

  // 잔여 공기 (D-day)
  let dday: number | null = null;
  if (project.data?.endDate) {
    const diff = Math.ceil((new Date(project.data.endDate).getTime() - Date.now()) / 86400000);
    if (!Number.isNaN(diff)) dday = diff;
  }
  const ddayLabel = dday == null ? "-" : dday < 0 ? `D+${Math.abs(dday)}` : dday === 0 ? "D-day" : `D-${dday}`;

  const SCH_STATUS: Record<string, { label: string; dot: string; chip: string }> = {
    completed: { label: "완료", dot: "bg-green-500", chip: "bg-green-100 text-green-700" },
    in_progress: { label: "진행", dot: "bg-blue-500", chip: "bg-blue-100 text-blue-700" },
    delayed: { label: "지연", dot: "bg-red-500", chip: "bg-red-100 text-red-700" },
    on_hold: { label: "보류", dot: "bg-amber-500", chip: "bg-amber-100 text-amber-700" },
    not_started: { label: "예정", dot: "bg-gray-300", chip: "bg-gray-100 text-gray-500" },
  };
  const fmt = (n: number) => n.toLocaleString();

  return (
    <div className="space-y-4">
      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-[11px] text-muted-foreground">공정 진행률</p>
          <p className="text-2xl font-bold mt-1">{avgProgress}<span className="text-sm text-muted-foreground">%</span></p>
          <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(avgProgress, 100)}%` }} /></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-[11px] text-muted-foreground">실행예산 집행률</p>
          <p className={`text-2xl font-bold mt-1 ${budgetRate > 100 ? "text-red-600" : ""}`}>{budgetRate}<span className="text-sm text-muted-foreground">%</span></p>
          <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden"><div className={`h-full rounded-full ${budgetRate > 100 ? "bg-red-500" : "bg-gold"}`} style={{ width: `${Math.min(budgetRate, 100)}%` }} /></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-[11px] text-muted-foreground">결재 대기</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">{pending.length}<span className="text-sm text-muted-foreground">건</span></p>
          <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden"><div className="h-full rounded-full bg-amber-500" style={{ width: pending.length > 0 ? "40%" : "0%" }} /></div>
        </CardContent></Card>
        <Card className={dday != null && dday < 0 ? "border-red-300" : ""}><CardContent className="pt-4 pb-3">
          <p className="text-[11px] text-muted-foreground">잔여 공기</p>
          <p className={`text-2xl font-bold mt-1 ${dday != null && dday < 0 ? "text-red-600" : "text-green-600"}`}>{ddayLabel}</p>
          {project.data?.endDate && <p className="text-[10px] text-muted-foreground mt-1">~ {project.data.endDate}</p>}
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-4">
        {/* LEFT */}
        <div className="space-y-4">
          {/* 실행정산표 */}
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2"><Wallet className="w-4 h-4" />실행정산표 <span className="text-[11px] font-normal text-muted-foreground ml-auto">승인·지급분 기준</span></CardTitle></CardHeader>
            <CardContent>
              {rows.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">공정표에 공정·실행예산을 먼저 입력하세요.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="text-muted-foreground border-b">
                      <th className="text-left font-medium py-1.5">공정</th>
                      <th className="text-right font-medium">실행예산</th>
                      <th className="text-right font-medium">실집행</th>
                      <th className="text-left font-medium w-20 pl-2">집행률</th>
                      <th className="text-right font-medium">잔액</th>
                    </tr></thead>
                    <tbody>
                      {rows.map((r: any) => (
                        <tr key={r.id} className={`border-b last:border-0 ${r.over ? "bg-red-50" : ""}`}>
                          <td className="py-2">{r.name}</td>
                          <td className="text-right tabular-nums">{r.budget ? fmt(r.budget) : "-"}</td>
                          <td className="text-right tabular-nums">{fmt(r.actual)}</td>
                          <td className="pl-2"><div className="h-1.5 bg-muted rounded overflow-hidden min-w-[60px]"><div className={`h-full ${r.over ? "bg-red-500" : r.rate >= 80 ? "bg-amber-500" : "bg-blue-500"}`} style={{ width: `${r.rate === Infinity ? 100 : Math.min(r.rate, 100)}%` }} /></div></td>
                          <td className={`text-right tabular-nums ${r.remain < 0 ? "text-red-600 font-semibold" : ""}`}>{fmt(r.remain)}</td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-muted/40"><td className="py-2">합계</td><td className="text-right tabular-nums">{fmt(totalBudget)}</td><td className="text-right tabular-nums">{fmt(totalActual)}</td><td className="pl-2"><div className="h-1.5 bg-muted rounded overflow-hidden"><div className="h-full bg-gold" style={{ width: `${Math.min(budgetRate, 100)}%` }} /></div></td><td className={`text-right tabular-nums ${totalBudget - totalActual < 0 ? "text-red-600" : ""}`}>{fmt(totalBudget - totalActual)}</td></tr>
                    </tbody>
                  </table>
                  {overItem && (
                    <div className="mt-3 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700">
                      <b>{overItem.name}</b> 공정이 실행예산을 {fmt(Math.abs(overItem.remain))}원 초과했습니다.
                      {contractAmount > 0 && <> 계약금액 대비 총 실행률 {Math.round((totalActual / contractAmount) * 100)}%.</>}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 공정 진행 미니 */}
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="w-4 h-4" />공정 진행 <span className="text-[11px] font-normal text-muted-foreground ml-auto">전체 {avgProgress}%</span></CardTitle></CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">등록된 공정이 없습니다.</p>
              ) : (
                <div className="space-y-0.5">
                  {items.slice(0, 6).map((it: any) => {
                    const st = SCH_STATUS[it.status] ?? SCH_STATUS.not_started;
                    return (
                      <div key={it.id} className="flex items-center gap-2.5 py-2 border-b last:border-0 text-xs">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${st.dot}`} />
                        <div className="flex-1 min-w-0"><div className="font-medium truncate">{it.name}</div><div className="text-muted-foreground text-[11px]">{it.startDate || "-"} ~ {it.endDate || "-"}</div></div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${st.chip}`}>{it.status === "in_progress" ? `진행 ${it.progress ?? 0}%` : st.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          {/* 결재 대기 지출결의서 */}
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2"><Receipt className="w-4 h-4" />결재 대기 지출결의서 <span className="text-[11px] font-normal text-muted-foreground ml-auto">{pending.length}건</span></CardTitle></CardHeader>
            <CardContent>
              {pending.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">결재 대기 결의서가 없습니다.</p>
              ) : (
                <div className="space-y-0.5">
                  {pending.slice(0, 5).map((e: any) => (
                    <div key={e.id} className="flex items-center gap-2 py-2 border-b last:border-0 text-xs">
                      <div className="flex-1 min-w-0"><div className="font-medium truncate">{e.title}</div><div className="text-muted-foreground text-[11px]">{e.expenseNumber}</div></div>
                      <span className="font-semibold tabular-nums">{fmt(Number(e.totalAmount ?? 0))}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">결재중</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 최근 작업보고 */}
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4" />최근 작업보고</CardTitle></CardHeader>
            <CardContent>
              {(reports.data?.length ?? 0) === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">작업보고가 없습니다.</p>
              ) : (
                <div className="space-y-0.5">
                  {(reports.data ?? []).slice(0, 3).map((r: any) => (
                    <div key={r.id} className="py-2 border-b last:border-0 text-xs">
                      <div className="font-medium">{r.reportDate} {r.title}</div>
                      <div className="text-muted-foreground text-[11px]">{r.workersCount ? `인원 ${r.workersCount}명` : ""}{Array.isArray(r.photoUrls) && r.photoUrls.length ? ` · 사진 ${r.photoUrls.length}` : ""}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 현장 CCTV */}
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2"><Camera className="w-4 h-4" />현장 CCTV <span className="text-[11px] font-normal text-muted-foreground ml-auto">{cameras.data?.length ?? 0}대</span></CardTitle></CardHeader>
            <CardContent>
              {(cameras.data?.length ?? 0) === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">등록된 카메라가 없습니다.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {(cameras.data ?? []).slice(0, 4).map((c: any) => (
                    <div key={c.id} className="aspect-video bg-gradient-to-br from-[#2a2820] to-[#3a3830] rounded-lg relative flex items-end overflow-hidden">
                      {c.isOnline ? <span className="absolute top-1.5 right-1.5 text-[8px] text-white bg-red-500 px-1.5 rounded font-bold">● LIVE</span> : null}
                      <span className="text-[9px] text-white/90 bg-black/45 px-1.5 py-0.5 rounded m-1.5 truncate">{c.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <CostExecutionChart projectId={pid} />
    </div>
  );
}

// CameraTab is now imported from ./tabs/CameraTab.tsx
