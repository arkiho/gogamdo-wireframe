import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  FolderKanban, Plus, Building2, MapPin, Calendar,
  TrendingUp, ClipboardList, Receipt, Clock,
  Banknote, CheckCircle2, Activity, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import NotificationBell from "@/components/NotificationBell";
import { MonthlyExpenseChart, ProjectStatusChart, ExpenseCategoryChart } from "@/components/OpsCharts";
import PWAInstallBanner from "@/components/PWAInstallBanner";

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

function formatAmount(amount: number): string {
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억`;
  if (amount >= 10000) return `${Math.round(amount / 10000).toLocaleString()}만`;
  return amount.toLocaleString();
}

export default function OpsHome() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", code: "", clientName: "", clientContact: "",
    clientEmail: "", siteAddress: "", totalArea: "", contractAmount: "",
    startDate: "", endDate: "", status: "planning" as const, description: "",
  });

  const stats = trpc.ops.stats.useQuery();
  const projects = trpc.ops.project.list.useQuery();
  const createProject = trpc.ops.project.create.useMutation({
    onSuccess: () => {
      projects.refetch();
      setOpen(false);
      setForm({ name: "", code: "", clientName: "", clientContact: "", clientEmail: "", siteAddress: "", totalArea: "", contractAmount: "", startDate: "", endDate: "", status: "planning", description: "" });
      toast.success("프로젝트가 생성되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!form.name || !form.code || !form.clientName) {
      toast.error("프로젝트명, 코드, 고객사명은 필수입니다.");
      return;
    }
    createProject.mutate({
      ...form,
      totalArea: form.totalArea || undefined,
      contractAmount: form.contractAmount || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      description: form.description || undefined,
      clientContact: form.clientContact || undefined,
      clientEmail: form.clientEmail || undefined,
      siteAddress: form.siteAddress || undefined,
    });
  };

  const avgProgress = stats.data?.avgScheduleProgress ?? 0;

  return (
    <div className="space-y-6">
      <PWAInstallBanner />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">프로젝트 관리</h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">
            {user?.name}님, 안녕하세요. 진행 중인 프로젝트를 관리하세요.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <NotificationBell />
          <Button variant="outline" size="sm" onClick={() => setLocation("/ops/partners")} className="h-9">
            <Building2 className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">협력업체</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setLocation("/ops/calendar")} className="h-9">
            <Calendar className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">캘린더</span>
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="sm:size-default"><Plus className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">새 프로젝트</span><span className="sm:hidden">새로운</span></Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>새 프로젝트 생성</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>프로젝트명 *</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="예: 승일일렉트로닉스 본사" />
                </div>
                <div>
                  <Label>프로젝트 코드 *</Label>
                  <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="예: GGD-2026-001" />
                </div>
              </div>
              <div>
                <Label>고객사명 *</Label>
                <Input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} placeholder="고객사명" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>담당자</Label>
                  <Input value={form.clientContact} onChange={e => setForm(f => ({ ...f, clientContact: e.target.value }))} placeholder="담당자명" />
                </div>
                <div>
                  <Label>이메일</Label>
                  <Input value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} placeholder="email@company.com" />
                </div>
              </div>
              <div>
                <Label>현장 주소</Label>
                <Input value={form.siteAddress} onChange={e => setForm(f => ({ ...f, siteAddress: e.target.value }))} placeholder="서울시 강남구..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>면적 (㎡)</Label>
                  <Input value={form.totalArea} onChange={e => setForm(f => ({ ...f, totalArea: e.target.value }))} placeholder="330" />
                </div>
                <div>
                  <Label>계약금액 (원)</Label>
                  <Input value={form.contractAmount} onChange={e => setForm(f => ({ ...f, contractAmount: e.target.value }))} placeholder="100000000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>시작일</Label>
                  <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <Label>종료일</Label>
                  <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>상태</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>설명</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="프로젝트 개요..." rows={3} />
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={createProject.isPending}>
                {createProject.isPending ? "생성 중..." : "프로젝트 생성"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Primary Stats Cards - 핵심 4개 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg"><FolderKanban className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.data?.totalProjects ?? 0}</p>
                <p className="text-xs text-muted-foreground">전체 프로젝트</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg"><TrendingUp className="w-5 h-5 text-amber-600" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.data?.activeProjects ?? 0}</p>
                <p className="text-xs text-muted-foreground">시공 중</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg"><Clock className="w-5 h-5 text-red-600" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.data?.pendingApprovals ?? 0}</p>
                <p className="text-xs text-muted-foreground">결재 대기</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.data?.completedProjects ?? 0}</p>
                <p className="text-xs text-muted-foreground">완료</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats - 재무 + 진행률 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-medium mb-1">총 계약금액</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-900">
                  {formatAmount(stats.data?.totalContractAmount ?? 0)}
                  <span className="text-sm font-normal text-blue-600/70 ml-0.5">원</span>
                </p>
              </div>
              <div className="p-2.5 bg-blue-100 rounded-xl"><Banknote className="w-5 h-5 text-blue-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-600 font-medium mb-1">이번달 지출</p>
                <p className="text-xl sm:text-2xl font-bold text-amber-900">
                  {formatAmount(stats.data?.monthlyExpenseAmount ?? 0)}
                  <span className="text-sm font-normal text-amber-600/70 ml-0.5">원</span>
                </p>
                <p className="text-[10px] text-amber-600/60 mt-0.5">결의서 {stats.data?.totalExpenses ?? 0}건</p>
              </div>
              <div className="p-2.5 bg-amber-100 rounded-xl"><Wallet className="w-5 h-5 text-amber-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-600 font-medium mb-1">평균 공정 진행률</p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-900">
                  {avgProgress}
                  <span className="text-sm font-normal text-emerald-600/70 ml-0.5">%</span>
                </p>
                <div className="w-24 bg-emerald-200 rounded-full h-1.5 mt-2">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(avgProgress, 100)}%` }}
                  />
                </div>
              </div>
              <div className="p-2.5 bg-emerald-100 rounded-xl"><Activity className="w-5 h-5 text-emerald-600" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <MonthlyExpenseChart />
        </div>
        <ProjectStatusChart />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ExpenseCategoryChart />
      </div>

      {/* Project List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">프로젝트 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : !projects.data?.length ? (
            <div className="text-center py-12">
              <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">아직 프로젝트가 없습니다.</p>
              <p className="text-sm text-muted-foreground/70 mt-1">새 프로젝트를 생성하여 시작하세요.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.data.map(p => {
                const s = STATUS_LABELS[p.status] ?? { label: p.status, color: "bg-gray-100 text-gray-600" };
                return (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors active:bg-accent/70"
                    onClick={() => setLocation(`/ops/project/${p.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                        <span className="font-semibold truncate text-sm sm:text-base">{p.name}</span>
                        <Badge variant="outline" className="text-[10px] sm:text-xs">{p.code}</Badge>
                        <Badge className={`text-[10px] sm:text-xs ${s.color} border-0`}>{s.label}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />{p.clientName}</span>
                        {p.siteAddress && <span className="flex items-center gap-1 truncate max-w-[150px] sm:max-w-none"><MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />{p.siteAddress}</span>}
                        {p.startDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />{p.startDate}</span>}
                      </div>
                    </div>
                    {p.contractAmount && (
                      <div className="text-left sm:text-right flex-shrink-0">
                        <p className="font-semibold text-xs sm:text-sm">{Number(p.contractAmount).toLocaleString()}원</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">계약금액</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
