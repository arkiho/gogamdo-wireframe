/**
 * 설계 자동화 시스템 관리자 대시보드
 * 프로젝트 목록, 생성, 상세 보기 (단계별 파이프라인)
 */
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, FileUp, MessageSquare, Layout, Image, FileText, Calculator,
  CheckCircle2, Clock, Loader2, ChevronRight, Building2, Upload, Trash2, Eye,
  Sparkles, RefreshCw, Download, Send, Video, Play, Pause, SkipForward
} from "lucide-react";
import { Link } from "wouter";
import { generateProposalPdf, type ProposalPdfData } from "@/lib/proposalPdf";
import { generateEstimatePdf, type EstimatePdfData } from "@/lib/estimatePdf";

// ===== Stage Config =====
const STAGES = [
  { key: "floorplan", label: "도면 업로드", icon: FileUp, color: "bg-blue-500" },
  { key: "rfp", label: "RFP 수집", icon: MessageSquare, color: "bg-purple-500" },
  { key: "analysis", label: "데이터 분석", icon: Sparkles, color: "bg-indigo-500" },
  { key: "layout", label: "레이아웃", icon: Layout, color: "bg-green-500" },
  { key: "rendering", label: "렌더링", icon: Image, color: "bg-orange-500" },
  { key: "tour", label: "투어 영상", icon: Video, color: "bg-cyan-500" },
  { key: "proposal", label: "제안서", icon: FileText, color: "bg-pink-500" },
  { key: "estimate", label: "견적서", icon: Calculator, color: "bg-red-500" },
  { key: "completed", label: "완료", icon: CheckCircle2, color: "bg-emerald-500" },
] as const;

function getStageIndex(stage: string) {
  return STAGES.findIndex(s => s.key === stage);
}

// ===== Project List =====
function ProjectList({ onSelect }: { onSelect: (id: number) => void }) {
  const { data: projects, isLoading } = trpc.designAuto.listProjects.useQuery();
  const createProject = trpc.designAuto.createProject.useMutation();
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", companyName: "", contactName: "", contactEmail: "", contactPhone: "" });

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error("프로젝트명을 입력하세요"); return; }
    try {
      const result = await createProject.mutateAsync(form);
      toast.success("프로젝트가 생성되었습니다");
      utils.designAuto.listProjects.invalidate();
      setShowCreate(false);
      setForm({ name: "", companyName: "", contactName: "", contactEmail: "", contactPhone: "" });
      onSelect(result.id);
    } catch { toast.error("프로젝트 생성 실패"); }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">설계 자동화</h1>
          <p className="text-muted-foreground mt-1">도면 → RFP → 레이아웃 → 렌더링 → 제안서 → 견적서 자동 생성</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> 새 프로젝트</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 설계 프로젝트 생성</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>프로젝트명 *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="예: ABC 테크놀로지 본사 이전" /></div>
              <div><Label>고객사명</Label><Input value={form.companyName} onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))} placeholder="예: (주)ABC 테크놀로지" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>담당자</Label><Input value={form.contactName} onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))} placeholder="홍길동" /></div>
                <div><Label>연락처</Label><Input value={form.contactPhone} onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))} placeholder="010-0000-0000" /></div>
              </div>
              <div><Label>이메일</Label><Input value={form.contactEmail} onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))} placeholder="contact@company.com" /></div>
              <Button className="w-full" onClick={handleCreate} disabled={createProject.isPending}>
                {createProject.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                프로젝트 생성
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!projects?.length ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-4">아직 설계 프로젝트가 없습니다</p>
            <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-2" /> 첫 프로젝트 시작하기</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {projects.map(project => {
            const stageIdx = getStageIndex(project.stage);
            const stageInfo = STAGES[stageIdx] || STAGES[0];
            const StageIcon = stageInfo.icon;
            return (
              <Card key={project.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onSelect(project.id)}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className={`w-10 h-10 rounded-lg ${stageInfo.color} flex items-center justify-center`}>
                    <StageIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{project.name}</h3>
                      <Badge variant={project.status === "active" ? "default" : "secondary"}>
                        {project.status === "active" ? "진행중" : project.status === "completed" ? "완료" : project.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {project.companyName || "고객사 미정"} · {stageInfo.label} 단계
                    </p>
                  </div>
                  {/* Progress bar */}
                  <div className="hidden sm:flex items-center gap-1">
                    {STAGES.map((s, i) => (
                      <div key={s.key} className={`w-6 h-1.5 rounded-full ${i <= stageIdx ? stageInfo.color : "bg-muted"}`} />
                    ))}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== Project Detail (Pipeline View) =====
function ProjectDetail({ projectId, onBack }: { projectId: number; onBack: () => void }) {
  const { data: summary, isLoading, refetch } = trpc.designAuto.getProjectSummary.useQuery({ projectId });
  const [activeTab, setActiveTab] = useState("floorplan");

  if (isLoading || !summary) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;

  const { project, progress } = summary;
  const stageIdx = getStageIndex(project.stage);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{project.name}</h1>
          <p className="text-sm text-muted-foreground">{project.companyName || "고객사 미정"} · {project.contactName || ""}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-1" /> 새로고침</Button>
      </div>

      {/* Pipeline Progress */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
            {STAGES.map((s, i) => {
              const Icon = s.icon;
              const isComplete = i < stageIdx;
              const isCurrent = i === stageIdx;
              const isActive = i <= stageIdx;
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveTab(s.key)}
                  className={`flex flex-col items-center gap-1.5 min-w-[72px] px-2 py-2 rounded-lg transition-colors ${
                    activeTab === s.key ? "bg-accent" : "hover:bg-accent/50"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isComplete ? "bg-emerald-500 text-white" : isCurrent ? s.color + " text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {isComplete ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      {activeTab === "floorplan" && <FloorPlanTab projectId={projectId} floorPlans={summary.floorPlans} onRefresh={refetch} />}
      {activeTab === "rfp" && <RfpTab projectId={projectId} rfp={summary.rfp} onRefresh={refetch} />}
      {activeTab === "analysis" && <AnalysisTab projectId={projectId} rfp={summary.rfp} floorPlans={summary.floorPlans} />}
      {activeTab === "layout" && <LayoutTab projectId={projectId} layouts={summary.layouts} onRefresh={refetch} />}
      {activeTab === "rendering" && <RenderingTab projectId={projectId} renderings={summary.renderings} onRefresh={refetch} />}
      {activeTab === "tour" && <TourVideoTab projectId={projectId} renderings={summary.renderings} tourVideos={summary.tourVideos} onRefresh={refetch} />}
      {activeTab === "proposal" && <ProposalTab projectId={projectId} proposals={summary.proposals} onRefresh={refetch} />}
      {activeTab === "estimate" && <EstimateTab projectId={projectId} estimates={summary.estimates} proposals={summary.proposals} onRefresh={refetch} />}
      {activeTab === "completed" && <CompletedTab summary={summary} />}
    </div>
  );
}

// ===== Floor Plan Tab =====
function FloorPlanTab({ projectId, floorPlans, onRefresh }: { projectId: number; floorPlans: any[]; onRefresh: () => void }) {
  const uploadMutation = trpc.designAuto.uploadFloorPlan.useMutation();
  const analyzeMutation = trpc.designAuto.analyzeFloorPlan.useMutation();
  const deleteMutation = trpc.designAuto.deleteFloorPlan.useMutation();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error("파일 크기는 20MB 이하여야 합니다"); return; }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      try {
        await uploadMutation.mutateAsync({
          projectId,
          fileBase64: base64,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        });
        toast.success("도면이 업로드되었습니다");
        onRefresh();
      } catch { toast.error("업로드 실패"); }
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async (planId: number) => {
    try {
      await analyzeMutation.mutateAsync({ floorPlanId: planId });
      toast.success("도면 분석이 완료되었습니다");
      onRefresh();
    } catch { toast.error("도면 분석 실패"); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileUp className="w-5 h-5" /> 도면 업로드</CardTitle>
        <CardDescription>PDF 또는 이미지 형태의 도면을 업로드하면 AI가 자동으로 분석합니다</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer hover:border-primary/50 transition-colors">
          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">클릭하여 도면 파일 선택 (PDF, JPG, PNG)</span>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleUpload} />
          {uploadMutation.isPending && <Loader2 className="w-5 h-5 animate-spin mt-2" />}
        </label>

        {floorPlans.map(plan => (
          <Card key={plan.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {plan.fileType?.startsWith("image") && (
                  <img src={plan.fileUrl} alt={plan.fileName} className="w-32 h-24 object-cover rounded border" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{plan.fileName}</span>
                    <Badge variant={plan.analysisStatus === "done" ? "default" : plan.analysisStatus === "analyzing" ? "secondary" : "outline"}>
                      {plan.analysisStatus === "done" ? "분석 완료" : plan.analysisStatus === "analyzing" ? "분석 중..." : plan.analysisStatus === "error" ? "오류" : "대기"}
                    </Badge>
                  </div>
                  {plan.aiAnalysis && (
                    <div className="text-sm text-muted-foreground space-y-1 mt-2">
                      <p>면적: {plan.totalArea} · 방: {plan.roomCount}개 · 층수: {plan.floors}</p>
                      <p className="line-clamp-2">{(plan.aiAnalysis as any).description}</p>
                    </div>
                  )}
                  {plan.analysisError && <p className="text-sm text-destructive mt-1">{plan.analysisError}</p>}
                </div>
                <div className="flex gap-2">
                  {plan.analysisStatus !== "done" && (
                    <Button size="sm" variant="outline" onClick={() => handleAnalyze(plan.id)} disabled={analyzeMutation.isPending}>
                      {analyzeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={async () => { await deleteMutation.mutateAsync({ id: plan.id }); onRefresh(); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {plan.aiAnalysis && (plan.aiAnalysis as any).spaces && (
                <div className="mt-3 border-t pt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">인식된 공간</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {((plan.aiAnalysis as any).spaces as any[]).map((space: any, i: number) => (
                      <div key={i} className="bg-muted rounded p-2 text-xs">
                        <span className="font-medium">{space.name}</span>
                        <span className="text-muted-foreground ml-1">{space.estimatedArea}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}

// ===== RFP Tab =====
function RfpTab({ projectId, rfp, onRefresh }: { projectId: number; rfp: any; onRefresh: () => void }) {
  const saveRfp = trpc.designAuto.saveRfp.useMutation();
  const generateRfp = trpc.designAuto.generateRfpFromChat.useMutation();
  const [mode, setMode] = useState<"form" | "chat">(rfp ? "form" : "chat");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "안녕하세요! 오피스 인테리어 프로젝트의 요구사항을 함께 정리해보겠습니다. 먼저 회사명과 업종을 알려주시겠어요?" }
  ]);
  const [chatInput, setChatInput] = useState("");

  // Form state
  const [form, setForm] = useState({
    companyName: rfp?.companyName || "",
    industry: rfp?.industry || "",
    projectType: rfp?.projectType || "new_office",
    totalArea: rfp?.totalArea || "",
    currentHeadcount: rfp?.currentHeadcount || "",
    plannedHeadcount1y: rfp?.plannedHeadcount1y || "",
    preferredStyle: rfp?.preferredStyle || "",
    budgetRange: rfp?.budgetRange || "",
    specialRequests: rfp?.specialRequests || "",
  });

  const handleSaveForm = async () => {
    try {
      await saveRfp.mutateAsync({
        projectId,
        collectionMethod: "form",
        companyName: form.companyName || undefined,
        industry: form.industry || undefined,
        projectType: form.projectType as any,
        totalArea: form.totalArea || undefined,
        currentHeadcount: form.currentHeadcount ? Number(form.currentHeadcount) : undefined,
        plannedHeadcount1y: form.plannedHeadcount1y ? Number(form.plannedHeadcount1y) : undefined,
        preferredStyle: form.preferredStyle || undefined,
        budgetRange: form.budgetRange || undefined,
        specialRequests: form.specialRequests || undefined,
      });
      toast.success("RFP가 저장되었습니다");
      onRefresh();
    } catch { toast.error("저장 실패"); }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const newMessages = [...chatMessages, { role: "user" as const, content: chatInput }];
    setChatMessages(newMessages);
    setChatInput("");

    try {
      const result = await generateRfp.mutateAsync({ projectId, messages: newMessages });
      setChatMessages([...newMessages, { role: "assistant" as const, content: result.message }]);
      if (result.rfpCompleted) {
        toast.success("RFP가 자동 생성되었습니다!");
        onRefresh();
      }
    } catch { toast.error("응답 생성 실패"); }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5" /> RFP 수집</CardTitle>
            <CardDescription>고객 요구사항을 직접 입력하거나 AI 대화로 수집합니다</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant={mode === "form" ? "default" : "outline"} onClick={() => setMode("form")}>직접 입력</Button>
            <Button size="sm" variant={mode === "chat" ? "default" : "outline"} onClick={() => setMode("chat")}>AI 대화</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {mode === "form" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>회사명</Label><Input value={form.companyName} onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))} /></div>
              <div><Label>업종</Label><Input value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))} placeholder="IT, 금융, 제조 등" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>프로젝트 유형</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.projectType} onChange={e => setForm(p => ({ ...p, projectType: e.target.value }))}>
                  <option value="new_office">신규 입주</option>
                  <option value="relocation">사무실 이전</option>
                  <option value="renovation">리모델링</option>
                  <option value="expansion">확장</option>
                </select>
              </div>
              <div><Label>총 면적</Label><Input value={form.totalArea} onChange={e => setForm(p => ({ ...p, totalArea: e.target.value }))} placeholder="예: 330㎡" /></div>
              <div><Label>현재 인원수</Label><Input type="number" value={form.currentHeadcount} onChange={e => setForm(p => ({ ...p, currentHeadcount: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>1년 후 예상 인원</Label><Input type="number" value={form.plannedHeadcount1y} onChange={e => setForm(p => ({ ...p, plannedHeadcount1y: e.target.value }))} /></div>
              <div><Label>선호 스타일</Label><Input value={form.preferredStyle} onChange={e => setForm(p => ({ ...p, preferredStyle: e.target.value }))} placeholder="모던, 미니멀, 내추럴 등" /></div>
              <div><Label>예산 범위</Label><Input value={form.budgetRange} onChange={e => setForm(p => ({ ...p, budgetRange: e.target.value }))} placeholder="예: 3억~5억" /></div>
            </div>
            <div><Label>특별 요청사항</Label><Textarea value={form.specialRequests} onChange={e => setForm(p => ({ ...p, specialRequests: e.target.value }))} rows={3} /></div>
            <Button onClick={handleSaveForm} disabled={saveRfp.isPending}>
              {saveRfp.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              RFP 저장
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-lg h-80 overflow-y-auto p-4 space-y-3 bg-muted/30">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {generateRfp.isPending && (
                <div className="flex justify-start">
                  <div className="bg-card border rounded-lg px-4 py-2"><Loader2 className="w-4 h-4 animate-spin" /></div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleChatSend()}
                placeholder="요구사항을 입력하세요..."
                disabled={generateRfp.isPending}
              />
              <Button onClick={handleChatSend} disabled={generateRfp.isPending || !chatInput.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===== Analysis Tab =====
function AnalysisTab({ projectId, rfp, floorPlans }: { projectId: number; rfp: any; floorPlans: any[] }) {
  const hasData = rfp || floorPlans.some(fp => fp.aiAnalysis);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5" /> 데이터 분석</CardTitle>
        <CardDescription>도면과 RFP 데이터를 종합 분석합니다</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>도면 업로드 또는 RFP 수집을 먼저 완료해주세요</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rfp && (
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">RFP 요약</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground">회사:</span> {rfp.companyName || "-"}</div>
                  <div><span className="text-muted-foreground">면적:</span> {rfp.totalArea || "-"}</div>
                  <div><span className="text-muted-foreground">인원:</span> {rfp.currentHeadcount || "-"}명</div>
                  <div><span className="text-muted-foreground">예산:</span> {rfp.budgetRange || "-"}</div>
                </div>
              </div>
            )}
            {floorPlans.filter(fp => fp.aiAnalysis).map(fp => (
              <div key={fp.id} className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">도면 분석: {fp.fileName}</h4>
                <p className="text-sm text-muted-foreground">{(fp.aiAnalysis as any).description}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===== Layout Tab =====
function LayoutTab({ projectId, layouts, onRefresh }: { projectId: number; layouts: any[]; onRefresh: () => void }) {
  const generateLayouts = trpc.designAuto.generateLayouts.useMutation();
  const selectLayout = trpc.designAuto.selectLayout.useMutation();

  const handleGenerate = async () => {
    try {
      await generateLayouts.mutateAsync({ projectId });
      toast.success("레이아웃 옵션이 생성되었습니다");
      onRefresh();
    } catch { toast.error("레이아웃 생성 실패"); }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Layout className="w-5 h-5" /> AI 레이아웃</CardTitle>
            <CardDescription>AI가 최적의 공간 배치를 3가지 옵션으로 제안합니다</CardDescription>
          </div>
          <Button onClick={handleGenerate} disabled={generateLayouts.isPending}>
            {generateLayouts.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {layouts.length > 0 ? "재생성" : "레이아웃 생성"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {generateLayouts.isPending && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">AI가 최적의 레이아웃을 설계하고 있습니다...</p>
          </div>
        )}
        {layouts.length > 0 && (
          <div className="grid gap-4">
            {layouts.map(layout => (
              <Card key={layout.id} className={`${layout.isSelected === "yes" ? "border-primary ring-1 ring-primary" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{layout.optionName}</h4>
                      {layout.aiScore && <Badge variant="outline" className="mt-1">추천 점수: {layout.aiScore}/100</Badge>}
                    </div>
                    <Button
                      size="sm"
                      variant={layout.isSelected === "yes" ? "default" : "outline"}
                      onClick={async () => {
                        await selectLayout.mutateAsync({ layoutId: layout.id, projectId });
                        onRefresh();
                      }}
                    >
                      {layout.isSelected === "yes" ? <CheckCircle2 className="w-4 h-4 mr-1" /> : null}
                      {layout.isSelected === "yes" ? "선택됨" : "선택"}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{layout.concept}</p>
                  {layout.spaceAllocation && (
                    <div className="space-y-1">
                      {(layout.spaceAllocation as any[]).map((zone: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <div className="w-24 font-medium truncate">{zone.zone}</div>
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div className="bg-primary rounded-full h-2" style={{ width: `${zone.percentage}%` }} />
                          </div>
                          <span className="text-muted-foreground w-12 text-right">{zone.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {layout.pros && (
                    <div className="flex gap-4 mt-3 text-xs">
                      <div className="flex-1">
                        <span className="font-medium text-emerald-600">장점</span>
                        <ul className="mt-1 space-y-0.5 text-muted-foreground">
                          {(layout.pros as string[]).map((p, i) => <li key={i}>· {p}</li>)}
                        </ul>
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-orange-600">단점</span>
                        <ul className="mt-1 space-y-0.5 text-muted-foreground">
                          {(layout.cons as string[]).map((c, i) => <li key={i}>· {c}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===== Rendering Tab =====
function RenderingTab({ projectId, renderings, onRefresh }: { projectId: number; renderings: any[]; onRefresh: () => void }) {
  const generateRendering = trpc.designAuto.generateRendering.useMutation();
  const [spaceType, setSpaceType] = useState("reception");
  const SPACE_TYPES = [
    { value: "reception", label: "리셉션/로비" },
    { value: "open_office", label: "오픈 오피스" },
    { value: "meeting_room", label: "회의실" },
    { value: "executive_office", label: "임원실" },
    { value: "lounge", label: "라운지/휴게공간" },
    { value: "cafeteria", label: "카페테리아" },
    { value: "phone_booth", label: "전화부스/집중실" },
    { value: "conference_room", label: "컨퍼런스룸" },
  ];

  const handleGenerate = async () => {
    try {
      await generateRendering.mutateAsync({ projectId, spaceType, spaceName: SPACE_TYPES.find(s => s.value === spaceType)?.label });
      toast.success("렌더링이 생성되었습니다");
      onRefresh();
    } catch { toast.error("렌더링 생성 실패"); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Image className="w-5 h-5" /> AI 렌더링</CardTitle>
        <CardDescription>주요 공간별 포토리얼리스틱 렌더링을 생성합니다</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <select className="border rounded-md px-3 py-2 text-sm flex-1" value={spaceType} onChange={e => setSpaceType(e.target.value)}>
            {SPACE_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <Button onClick={handleGenerate} disabled={generateRendering.isPending}>
            {generateRendering.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            렌더링 생성
          </Button>
        </div>
        {generateRendering.isPending && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">AI가 렌더링을 생성하고 있습니다... (10~20초 소요)</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          {renderings.filter(r => r.status === "done" && r.imageUrl).map(r => (
            <div key={r.id} className="group relative rounded-lg overflow-hidden border">
              <img src={r.imageUrl} alt={r.spaceName} className="w-full aspect-[4/3] object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <span className="text-white text-sm font-medium">{r.spaceName || r.spaceType}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ===== Tour Video Tab =====
function TourVideoTab({ projectId, renderings, tourVideos, onRefresh }: {
  projectId: number; renderings: any[]; tourVideos: any[]; onRefresh: () => void;
}) {
  const generateTour = trpc.designAuto.generateTourVideo.useMutation();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [tourStyle, setTourStyle] = useState<"walkthrough" | "cinematic" | "presentation">("walkthrough");
  const [title, setTitle] = useState("");
  const [viewingTour, setViewingTour] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const completedRenderings = renderings.filter(r => r.status === "done" && r.imageUrl);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleGenerate = async () => {
    if (selectedIds.length === 0) { toast.error("렌더링 이미지를 선택해주세요"); return; }
    try {
      const result = await generateTour.mutateAsync({
        projectId, renderingIds: selectedIds, style: tourStyle,
        title: title || undefined,
      });
      toast.success("투어 영상이 생성되었습니다");
      if (result.tourData) setViewingTour(result.tourData);
      onRefresh();
    } catch { toast.error("투어 영상 생성 실패"); }
  };

  // 슬라이드쇼 자동 재생
  const tourSlides = viewingTour?.narration?.slides || [];
  const tourRenderings = viewingTour?.renderings || [];

  return (
    <div className="space-y-6">
      {/* 투어 영상 생성 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Video className="w-5 h-5" /> AI 투어 영상 생성</CardTitle>
          <CardDescription>렌더링 이미지를 선택하여 가상 투어 영상을 생성합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {completedRenderings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>렌더링 이미지가 없습니다. 렌더링 탭에서 먼저 이미지를 생성해주세요.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                {completedRenderings.map(r => (
                  <div
                    key={r.id}
                    onClick={() => toggleSelect(r.id)}
                    className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                      selectedIds.includes(r.id) ? "border-cyan-500 ring-2 ring-cyan-500/30" : "border-transparent hover:border-muted-foreground/30"
                    }`}
                  >
                    <img src={r.imageUrl} alt={r.spaceName} className="w-full aspect-[4/3] object-cover" />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 p-2">
                      <span className="text-white text-xs">{r.spaceName || r.spaceType}</span>
                    </div>
                    {selectedIds.includes(r.id) && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label className="text-xs mb-1">투어 제목 (선택)</Label>
                  <Input placeholder="예: OO기업 사무실 가상 투어" value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs mb-1">스타일</Label>
                  <select className="border rounded-md px-3 py-2 text-sm" value={tourStyle} onChange={e => setTourStyle(e.target.value as any)}>
                    <option value="walkthrough">워크스루</option>
                    <option value="cinematic">시네마틱</option>
                    <option value="presentation">프레젠테이션</option>
                  </select>
                </div>
                <Button onClick={handleGenerate} disabled={generateTour.isPending || selectedIds.length === 0}>
                  {generateTour.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Video className="w-4 h-4 mr-2" />}
                  투어 생성 ({selectedIds.length}개 선택)
                </Button>
              </div>
            </>
          )}
          {generateTour.isPending && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">AI가 투어 내레이션을 생성하고 있습니다...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 투어 영상 뷰어 */}
      {viewingTour && tourSlides.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Play className="w-5 h-5" /> 투어 미리보기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-lg overflow-hidden bg-black">
              {tourRenderings[currentSlide] && (
                <img
                  src={tourRenderings[currentSlide].imageUrl}
                  alt={tourRenderings[currentSlide].spaceName}
                  className="w-full aspect-video object-contain"
                />
              )}
              {/* 내레이션 오버레이 */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 p-4">
                <h3 className="text-white font-bold text-lg mb-1">
                  {tourSlides[currentSlide]?.spaceName || "인트로"}
                </h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  {currentSlide === -1 ? viewingTour.narration.intro : tourSlides[currentSlide]?.narration}
                </p>
                {tourSlides[currentSlide]?.highlights && (
                  <div className="flex gap-2 mt-2">
                    {tourSlides[currentSlide].highlights.map((h: string, i: number) => (
                      <Badge key={i} variant="secondary" className="bg-white/20 text-white text-xs">{h}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* 컨트롤 */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide <= 0}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setCurrentSlide(Math.min(tourSlides.length - 1, currentSlide + 1))} disabled={currentSlide >= tourSlides.length - 1}>
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">
                {currentSlide + 1} / {tourSlides.length} 슬라이드 · 예상 {viewingTour.estimatedDuration}초
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 기존 투어 목록 */}
      {tourVideos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">생성된 투어 영상</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tourVideos.map((tv: any) => (
                <div key={tv.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  {tv.thumbnailUrl ? (
                    <img src={tv.thumbnailUrl} alt={tv.title} className="w-24 h-16 object-cover rounded" />
                  ) : (
                    <div className="w-24 h-16 bg-muted rounded flex items-center justify-center"><Video className="w-6 h-6 text-muted-foreground" /></div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{tv.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {tv.duration ? `${tv.duration}초` : "시간 미정"} · {new Date(tv.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                  <Badge variant={tv.status === "done" ? "default" : tv.status === "error" ? "destructive" : "secondary"}>
                    {tv.status === "done" ? "완료" : tv.status === "error" ? "오류" : "생성중"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matterport/CloudPano 임베드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">가상 투어 임베드</CardTitle>
          <CardDescription>Matterport, CloudPano 등 외부 가상 투어 URL을 임베드할 수 있습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input placeholder="https://my.matterport.com/show/?m=..." className="flex-1" />
            <Button variant="outline" onClick={() => toast.info("가상 투어 임베드 기능이 곧 추가됩니다")}>
              임베드 추가
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            지원 플랫폼: Matterport, CloudPano, Kuula, Insta360 등
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ===== Proposal Tab =====
function ProposalTab({ projectId, proposals, onRefresh }: { projectId: number; proposals: any[]; onRefresh: () => void }) {
  const generateProposal = trpc.designAuto.generateProposal.useMutation();
  const [viewId, setViewId] = useState<number | null>(null);
  const { data: viewProposal } = trpc.designAuto.getProposal.useQuery({ id: viewId! }, { enabled: !!viewId });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> AI 제안서</CardTitle>
            <CardDescription>고객사 분석 + 설계안 + 렌더링을 통합한 제안서를 생성합니다</CardDescription>
          </div>
          <Button onClick={async () => { try { await generateProposal.mutateAsync({ projectId }); toast.success("제안서가 생성되었습니다"); onRefresh(); } catch { toast.error("생성 실패"); } }} disabled={generateProposal.isPending}>
            {generateProposal.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            제안서 생성
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {generateProposal.isPending && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">AI가 제안서를 작성하고 있습니다...</p>
          </div>
        )}
        {proposals.map(p => (
          <Card key={p.id} className="mb-3">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{p.title}</h4>
                  <p className="text-xs text-muted-foreground">v{p.version} · {new Date(p.createdAt).toLocaleDateString("ko-KR")}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setViewId(p.id)}>
                    <Eye className="w-4 h-4 mr-1" /> 상세보기
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    const pdfData: ProposalPdfData = {
                      title: p.title || "인테리어 제안서",
                      version: p.version,
                      createdAt: p.createdAt,
                      projectName: p.title || "프로젝트",
                      clientAnalysis: p.clientAnalysis as any,
                      designConcept: p.designConcept as string,
                      spaceProgram: p.spaceProgram as any,
                      materialPlan: p.materialPlan as any,
                      furniturePlan: p.furniturePlan as any,
                      projectTimeline: p.projectTimeline as any,
                      companyIntro: p.companyIntro as string,
                      differentiators: p.differentiators as string[],
                    };
                    generateProposalPdf(pdfData);
                    toast.success("제안서 PDF가 다운로드됩니다");
                  }}>
                    <Download className="w-4 h-4 mr-1" /> PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {viewProposal && viewId && (
          <Dialog open={!!viewId} onOpenChange={() => setViewId(null)}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{viewProposal.title}</DialogTitle></DialogHeader>
              <div className="space-y-6 mt-4">
                {!!viewProposal.clientAnalysis && (
                  <div>
                    <h4 className="font-semibold mb-2">고객사 분석</h4>
                    <p className="text-sm text-muted-foreground">{(viewProposal.clientAnalysis as any).companyProfile}</p>
                    {(viewProposal.clientAnalysis as any).painPoints && (
                      <div className="mt-2">
                        <span className="text-xs font-medium">Pain Points:</span>
                        <ul className="text-sm text-muted-foreground mt-1">{((viewProposal.clientAnalysis as any).painPoints as string[]).map((p, i) => <li key={i}>· {p}</li>)}</ul>
                      </div>
                    )}
                  </div>
                )}
                {viewProposal.designConcept && (
                  <div>
                    <h4 className="font-semibold mb-2">설계 컨셉</h4>
                    <p className="text-sm text-muted-foreground">{viewProposal.designConcept}</p>
                  </div>
                )}
                {!!viewProposal.spaceProgram && (
                  <div>
                    <h4 className="font-semibold mb-2">공간 프로그램</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted"><tr><th className="text-left p-2">공간</th><th className="text-left p-2">면적</th><th className="text-left p-2">설명</th></tr></thead>
                        <tbody>{(viewProposal.spaceProgram as any[]).map((s: any, i: number) => (
                          <tr key={i} className="border-t"><td className="p-2 font-medium">{s.zone}</td><td className="p-2">{s.area}</td><td className="p-2 text-muted-foreground">{s.description}</td></tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </div>
                )}
                {viewProposal.differentiators && (
                  <div>
                    <h4 className="font-semibold mb-2">고감도 차별점</h4>
                    <ul className="text-sm text-muted-foreground">{(viewProposal.differentiators as string[]).map((d, i) => <li key={i}>· {d}</li>)}</ul>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}

// ===== Estimate Tab =====
function EstimateTab({ projectId, estimates, proposals, onRefresh }: { projectId: number; estimates: any[]; proposals: any[]; onRefresh: () => void }) {
  const generateEstimate = trpc.designAuto.generateEstimate.useMutation();
  const [viewId, setViewId] = useState<number | null>(null);
  const { data: viewEstimate } = trpc.designAuto.getEstimate.useQuery({ id: viewId! }, { enabled: !!viewId });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Calculator className="w-5 h-5" /> AI 견적서</CardTitle>
            <CardDescription>공종별 상세 견적을 자동 산출합니다</CardDescription>
          </div>
          <Button onClick={async () => {
            try {
              const proposalId = proposals.length > 0 ? proposals[0].id : undefined;
              await generateEstimate.mutateAsync({ projectId, proposalId });
              toast.success("견적서가 생성되었습니다");
              onRefresh();
            } catch { toast.error("생성 실패"); }
          }} disabled={generateEstimate.isPending}>
            {generateEstimate.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            견적서 생성
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {generateEstimate.isPending && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">AI가 견적서를 산출하고 있습니다...</p>
          </div>
        )}
        {estimates.map(est => (
          <Card key={est.id} className="mb-3">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{est.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    총 {est.totalAmount?.toLocaleString()}원 (VAT 포함) · v{est.version}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setViewId(est.id)}>
                    <Eye className="w-4 h-4 mr-1" /> 상세보기
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    const pdfData: EstimatePdfData = {
                      estimateNumber: `EST-${est.id}`,
                      title: est.title || "견적서",
                      version: est.version,
                      items: (est.items as any[]) || [],
                      subtotal: est.subtotal || 0,
                      overhead: est.overhead || 0,
                      profit: est.profit || 0,
                      vat: est.vat || 0,
                      grandTotal: est.totalAmount || 0,
                      notes: est.notes as string,
                      status: est.status || "draft",
                      createdAt: est.createdAt,
                      projectName: est.title || "프로젝트",
                    };
                    generateEstimatePdf(pdfData);
                    toast.success("견적서 PDF가 다운로드됩니다");
                  }}>
                    <Download className="w-4 h-4 mr-1" /> PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {viewEstimate && viewId && (
          <Dialog open={!!viewId} onOpenChange={() => setViewId(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{viewEstimate.title}</DialogTitle></DialogHeader>
              <div className="mt-4">
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2">공종</th>
                        <th className="text-left p-2">항목</th>
                        <th className="text-left p-2">규격</th>
                        <th className="text-right p-2">수량</th>
                        <th className="text-right p-2">단가</th>
                        <th className="text-right p-2">금액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(viewEstimate.items as any[])?.map((item: any, i: number) => (
                        <tr key={i} className="border-t">
                          <td className="p-2 font-medium">{item.category}</td>
                          <td className="p-2">{item.item}</td>
                          <td className="p-2 text-muted-foreground">{item.specification}</td>
                          <td className="p-2 text-right">{item.quantity} {item.unit}</td>
                          <td className="p-2 text-right">{item.unitPrice?.toLocaleString()}</td>
                          <td className="p-2 text-right font-medium">{item.amount?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/50 font-medium">
                      <tr className="border-t"><td colSpan={5} className="p-2 text-right">소계</td><td className="p-2 text-right">{viewEstimate.subtotal?.toLocaleString()}</td></tr>
                      <tr className="border-t"><td colSpan={5} className="p-2 text-right">VAT (10%)</td><td className="p-2 text-right">{viewEstimate.vat?.toLocaleString()}</td></tr>
                      <tr className="border-t text-base"><td colSpan={5} className="p-2 text-right font-bold">합계</td><td className="p-2 text-right font-bold">{viewEstimate.totalAmount?.toLocaleString()}</td></tr>
                    </tfoot>
                  </table>
                </div>
                {viewEstimate.notes && <p className="text-sm text-muted-foreground mt-3">{viewEstimate.notes}</p>}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}

// ===== Completed Tab =====
function CompletedTab({ summary }: { summary: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> 프로젝트 완료</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-muted rounded-lg p-4"><div className="text-2xl font-bold">{summary.floorPlans.length}</div><div className="text-xs text-muted-foreground">도면</div></div>
          <div className="bg-muted rounded-lg p-4"><div className="text-2xl font-bold">{summary.layouts.length}</div><div className="text-xs text-muted-foreground">레이아웃</div></div>
          <div className="bg-muted rounded-lg p-4"><div className="text-2xl font-bold">{summary.renderings.filter((r: any) => r.status === "done").length}</div><div className="text-xs text-muted-foreground">렌더링</div></div>
          <div className="bg-muted rounded-lg p-4"><div className="text-2xl font-bold">{summary.proposals.length}</div><div className="text-xs text-muted-foreground">제안서</div></div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== Main Component =====
export default function AdminDesignAuto() {
  const { user, loading } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!user || (user.role !== "admin" && user.role !== "master")) return <div className="flex items-center justify-center min-h-screen"><p>관리자 권한이 필요합니다</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back to admin */}
        <div className="mb-4">
          <Link href="/admin">
            <span className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> 관리자 대시보드
            </span>
          </Link>
        </div>

        {selectedProjectId ? (
          <ProjectDetail projectId={selectedProjectId} onBack={() => setSelectedProjectId(null)} />
        ) : (
          <ProjectList onSelect={setSelectedProjectId} />
        )}
      </div>
    </div>
  );
}
