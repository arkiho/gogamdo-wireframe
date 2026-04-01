/**
 * 고객 셀프서비스 파이프라인 - 고객 포털 메인 페이지
 * 로그인한 고객이 프로젝트를 생성하고, 진행 상황을 확인하는 대시보드
 */
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Plus, Building2, FileText, ClipboardList, BarChart3, Calendar,
  ChevronRight, Loader2, CheckCircle2, Clock, ArrowRight,
} from "lucide-react";
import ClientNotificationBell from "@/components/ClientNotificationBell";

const STATUS_LABELS: Record<string, { label: string; color: string; step: number }> = {
  created: { label: "프로젝트 생성", color: "bg-gray-100 text-gray-700", step: 1 },
  floor_plan_uploaded: { label: "도면 업로드 완료", color: "bg-blue-100 text-blue-700", step: 2 },
  survey_completed: { label: "서베이 완료", color: "bg-indigo-100 text-indigo-700", step: 3 },
  report_generated: { label: "보고서 생성됨", color: "bg-purple-100 text-purple-700", step: 4 },
  report_sent: { label: "보고서 발송됨", color: "bg-violet-100 text-violet-700", step: 5 },
  company_survey_shared: { label: "전사 서베이 진행중", color: "bg-amber-100 text-amber-700", step: 6 },
  company_survey_done: { label: "전사 서베이 완료", color: "bg-orange-100 text-orange-700", step: 7 },
  meeting_requested: { label: "미팅 요청됨", color: "bg-emerald-100 text-emerald-700", step: 8 },
  meeting_confirmed: { label: "미팅 확정", color: "bg-green-100 text-green-700", step: 9 },
  completed: { label: "완료", color: "bg-gold/20 text-gold-dark", step: 10 },
};

const PIPELINE_STEPS = [
  { key: "created", label: "프로젝트 생성", icon: Building2 },
  { key: "floor_plan_uploaded", label: "도면 업로드", icon: FileText },
  { key: "survey_completed", label: "업무환경 서베이", icon: ClipboardList },
  { key: "report_generated", label: "AI 보고서", icon: BarChart3 },
  { key: "meeting_requested", label: "미팅 예약", icon: Calendar },
];

export default function ClientPortal() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    companyName: "", contactName: "", contactEmail: "", contactPhone: "",
    employeeCount: "", currentAddress: "", desiredMoveDate: "", budgetRange: "",
  });

  const projects = trpc.clientPipeline.myProjects.useQuery(undefined, {
    enabled: !!user,
  });

  const createProject = trpc.clientPipeline.createProject.useMutation({
    onSuccess: (data) => {
      toast.success("프로젝트가 생성되었습니다!");
      setShowCreate(false);
      setForm({ companyName: "", contactName: "", contactEmail: "", contactPhone: "", employeeCount: "", currentAddress: "", desiredMoveDate: "", budgetRange: "" });
      projects.refetch();
      navigate(`/my/project/${data.id}`);
    },
    onError: () => toast.error("프로젝트 생성에 실패했습니다."),
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto">
              <Building2 className="w-8 h-8 text-gold" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-ink mb-2">고객 포털</h2>
              <p className="text-muted-foreground">
                로그인 후 프로젝트를 시작하고, 맞춤형 인테리어 제안을 받아보세요.
              </p>
            </div>
            <Button
              className="bg-gold text-ink hover:bg-gold-light font-semibold"
              onClick={() => { window.location.href = getLoginUrl(); }}
            >
              로그인하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!form.companyName || !form.contactName || !form.contactEmail) {
      toast.error("회사명, 담당자명, 이메일은 필수입니다.");
      return;
    }
    createProject.mutate({
      ...form,
      employeeCount: form.employeeCount ? parseInt(form.employeeCount) : undefined,
    });
  };

  return (
    <section className="py-16 lg:py-24">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="font-heading text-3xl lg:text-4xl font-bold text-ink">내 프로젝트</h1>
            <p className="text-muted-foreground mt-2">도면 업로드부터 맞춤 제안서까지, 원스톱으로 진행하세요.</p>
          </div>
          <div className="flex items-center gap-3">
            <ClientNotificationBell />
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button className="bg-gold text-ink hover:bg-gold-light font-semibold gap-2">
                  <Plus className="w-4 h-4" /> 새 프로젝트
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-heading text-xl">새 프로젝트 시작</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>회사명 *</Label>
                      <Input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} placeholder="(주)회사명" />
                    </div>
                    <div>
                      <Label>담당자명 *</Label>
                      <Input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} placeholder="홍길동" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>이메일 *</Label>
                      <Input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="email@company.com" />
                    </div>
                    <div>
                      <Label>연락처</Label>
                      <Input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} placeholder="010-0000-0000" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>직원 수</Label>
                      <Input type="number" value={form.employeeCount} onChange={e => setForm(f => ({ ...f, employeeCount: e.target.value }))} placeholder="50" />
                    </div>
                    <div>
                      <Label>예산 범위</Label>
                      <Select value={form.budgetRange} onValueChange={v => setForm(f => ({ ...f, budgetRange: v }))}>
                        <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3000만원 이하">3,000만원 이하</SelectItem>
                          <SelectItem value="3000~5000만원">3,000~5,000만원</SelectItem>
                          <SelectItem value="5000만원~1억">5,000만원~1억</SelectItem>
                          <SelectItem value="1~3억">1~3억</SelectItem>
                          <SelectItem value="3~5억">3~5억</SelectItem>
                          <SelectItem value="5억 이상">5억 이상</SelectItem>
                          <SelectItem value="미정">미정</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>현재 주소</Label>
                    <Input value={form.currentAddress} onChange={e => setForm(f => ({ ...f, currentAddress: e.target.value }))} placeholder="서울시 강남구..." />
                  </div>
                  <div>
                    <Label>희망 이전일</Label>
                    <Input type="date" value={form.desiredMoveDate} onChange={e => setForm(f => ({ ...f, desiredMoveDate: e.target.value }))} />
                  </div>
                  <Button
                    className="w-full bg-gold text-ink hover:bg-gold-light font-semibold"
                    onClick={handleSubmit}
                    disabled={createProject.isPending}
                  >
                    {createProject.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    프로젝트 생성
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Pipeline Guide */}
        <Card className="mb-8 border-gold/20 bg-gradient-to-r from-gold/5 to-transparent">
          <CardContent className="py-6">
            <h3 className="font-heading font-semibold text-ink mb-4">진행 프로세스</h3>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {PIPELINE_STEPS.map((step, i) => (
                <div key={step.key} className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-border/50">
                    <step.icon className="w-4 h-4 text-gold" />
                    <span className="text-xs font-medium text-ink whitespace-nowrap">{step.label}</span>
                  </div>
                  {i < PIPELINE_STEPS.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Project List */}
        {projects.isLoading ? (
          <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gold mx-auto" /></div>
        ) : (projects.data?.length ?? 0) === 0 ? (
          <Card className="border-dashed border-2 border-border/50">
            <CardContent className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto">
                <Plus className="w-8 h-8 text-gold" />
              </div>
              <h3 className="font-heading text-xl font-bold text-ink">아직 프로젝트가 없습니다</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                새 프로젝트를 생성하고, 도면 업로드와 업무환경 서베이를 통해 맞춤형 인테리어 제안을 받아보세요.
              </p>
              <Button className="bg-gold text-ink hover:bg-gold-light font-semibold gap-2" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" /> 첫 프로젝트 시작하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {projects.data?.map((project: any) => {
              const statusInfo = STATUS_LABELS[project.status] || STATUS_LABELS.created;
              return (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:border-gold/30 transition-all duration-300 group"
                  onClick={() => navigate(`/my/project/${project.id}`)}
                >
                  <CardContent className="py-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-gold" />
                        </div>
                        <div>
                          <h3 className="font-heading font-bold text-ink group-hover:text-gold transition-colors">
                            {project.companyName}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span>{project.contactName}</span>
                            {project.employeeCount && <span>직원 {project.employeeCount}명</span>}
                            {project.budgetRange && <span>{project.budgetRange}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-gold transition-colors" />
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4 flex gap-1">
                      {PIPELINE_STEPS.map((step, i) => (
                        <div
                          key={step.key}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            statusInfo.step > i + 1 ? "bg-gold" :
                            statusInfo.step === i + 1 ? "bg-gold/50" :
                            "bg-gray-100"
                          }`}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
