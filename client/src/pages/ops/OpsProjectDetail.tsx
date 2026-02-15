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
  FileSignature, Calculator, Camera, Link2, Copy,
} from "lucide-react";
import { toast } from "sonner";

// Sub-tab components (lazy loaded inline for now)
import ScheduleTab from "./tabs/ScheduleTab";
import WorkReportTab from "./tabs/WorkReportTab";
import MeetingTab from "./tabs/MeetingTab";
import ExpenseTab from "./tabs/ExpenseTab";
import SubcontractorTab from "./tabs/SubcontractorTab";
import EstimateTab from "./tabs/EstimateTab";
import ContractTab from "./tabs/ContractTab";
import CostTab from "./tabs/CostTab";

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => setLocation("/ops")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />프로젝트 목록
          </button>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold tracking-tight">{p.name}</h1>
            <Badge variant="outline">{p.code}</Badge>
            <Badge className={`${s.color} border-0`}>{s.label}</Badge>
          </div>
          {p.description && <p className="text-muted-foreground text-sm max-w-2xl">{p.description}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleCopyInviteLink("client")}>
            <Link2 className="w-4 h-4 mr-1" />고객사 초대
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleCopyInviteLink("subcontractor")}>
            <Users className="w-4 h-4 mr-1" />하도급 초대
          </Button>
        </div>
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">고객사</p>
                <p className="font-medium">{p.clientName}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {p.siteAddress && (
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">현장</p>
                  <p className="font-medium truncate">{p.siteAddress}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {p.totalArea && (
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-sm">
                <Ruler className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">면적</p>
                  <p className="font-medium">{p.totalArea}㎡</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {p.contractAmount && (
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-sm">
                <Banknote className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">계약금액</p>
                  <p className="font-medium">{Number(p.contractAmount).toLocaleString()}원</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {p.startDate && (
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">공사기간</p>
                  <p className="font-medium">{p.startDate} ~ {p.endDate || "미정"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="text-xs gap-1"><BarChart3 className="w-3.5 h-3.5" />개요</TabsTrigger>
          <TabsTrigger value="schedule" className="text-xs gap-1"><ClipboardList className="w-3.5 h-3.5" />공정표</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs gap-1"><FileText className="w-3.5 h-3.5" />작업보고서</TabsTrigger>
          <TabsTrigger value="meetings" className="text-xs gap-1"><FileText className="w-3.5 h-3.5" />회의록</TabsTrigger>
          <TabsTrigger value="expenses" className="text-xs gap-1"><Receipt className="w-3.5 h-3.5" />지출결의서</TabsTrigger>
          <TabsTrigger value="subcontractors" className="text-xs gap-1"><Users className="w-3.5 h-3.5" />하도급</TabsTrigger>
          <TabsTrigger value="estimates" className="text-xs gap-1"><FileSpreadsheet className="w-3.5 h-3.5" />견적서</TabsTrigger>
          <TabsTrigger value="contracts" className="text-xs gap-1"><FileSignature className="w-3.5 h-3.5" />계약서</TabsTrigger>
          <TabsTrigger value="cost" className="text-xs gap-1"><Calculator className="w-3.5 h-3.5" />원가관리</TabsTrigger>
          <TabsTrigger value="camera" className="text-xs gap-1"><Camera className="w-3.5 h-3.5" />현장카메라</TabsTrigger>
        </TabsList>

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

  const totalSchedules = schedules.data?.length ?? 0;
  const completedSchedules = schedules.data?.filter(s => s.progress === 100).length ?? 0;
  const totalExpenseAmount = expenses.data?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;
  const pendingExpenses = expenses.data?.filter(e => e.approvalStatus === "pending").length ?? 0;
  const activeSubs = subs.data?.filter(s => s.status === "active").length ?? 0;

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">공정 현황</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>전체 공정</span><span className="font-semibold">{totalSchedules}건</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>완료 공정</span><span className="font-semibold text-green-600">{completedSchedules}건</span>
            </div>
            {totalSchedules > 0 && (
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${(completedSchedules / totalSchedules) * 100}%` }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">지출 현황</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>총 지출</span><span className="font-semibold">{totalExpenseAmount.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>결재 대기</span><span className="font-semibold text-amber-600">{pendingExpenses}건</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">하도급 현황</CardTitle></CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm">
            <span>활성 업체</span><span className="font-semibold">{activeSubs}개사</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">현장 카메라</CardTitle></CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground text-sm">
            <Camera className="w-8 h-8 mx-auto mb-2 opacity-30" />
            카메라 연동 후 실시간 확인 가능
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Camera Tab - placeholder for real-time camera integration
function CameraTab({ projectId }: { projectId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Camera className="w-5 h-5" />현장 실시간 카메라
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <Camera className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
          <h3 className="text-lg font-semibold mb-2">현장 카메라 연동 준비 중</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            실시간 현장 카메라가 설치되면 이 페이지에서 바로 확인할 수 있습니다.
            카메라 스트림 URL을 등록하면 실시간 모니터링이 가능합니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
