/**
 * 고객 프로젝트 상세 페이지 - 파이프라인 진행
 * 도면 업로드 → 서베이 → AI 보고서 → 전사 서베이 → 미팅 예약
 */
import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useRoute, useLocation } from "wouter";
import { Streamdown } from "streamdown";
import {
  ArrowLeft, Upload, FileText, ClipboardList, BarChart3, Calendar,
  Loader2, CheckCircle2, Clock, Send, Link2, Copy, Users, Star,
  ChevronRight, Building2, Mail, Phone, MapPin,
  Home, Layers, Box, FileCheck, HeartHandshake,
} from "lucide-react";
import KakaoShareButton from "@/components/KakaoShareButton";

const STATUS_STEP: Record<string, number> = {
  created: 1, floor_plan_uploaded: 2, survey_completed: 3,
  report_generated: 4, report_sent: 5, company_survey_shared: 6,
  company_survey_done: 7, meeting_requested: 8, meeting_confirmed: 9, completed: 10,
};

// Satisfaction rating component
function RatingInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-1 mt-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
              n <= value ? "bg-gold text-ink" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ClientProjectDetail() {
  const { user, loading: authLoading } = useAuth();
  const [, params] = useRoute("/my/project/:id");
  const [, navigate] = useLocation();
  const projectId = params?.id ? parseInt(params.id) : 0;

  const project = trpc.clientPipeline.getProject.useQuery(
    { id: projectId },
    { enabled: !!user && projectId > 0 }
  );
  const floorPlans = trpc.clientPipeline.getFloorPlans.useQuery(
    { projectId },
    { enabled: !!user && projectId > 0 }
  );
  const survey = trpc.clientPipeline.getWorkSurvey.useQuery(
    { projectId },
    { enabled: !!user && projectId > 0 }
  );
  const reports = trpc.clientPipeline.getReports.useQuery(
    { projectId },
    { enabled: !!user && projectId > 0 }
  );
  const companySurveys = trpc.clientPipeline.getCompanySurveys.useQuery(
    { projectId },
    { enabled: !!user && projectId > 0 }
  );
  const meetings = trpc.clientPipeline.getMeetings.useQuery(
    { projectId },
    { enabled: !!user && projectId > 0 }
  );

  const currentStep = STATUS_STEP[project.data?.status || "created"] || 1;

  // Floor Plan Upload
  const [uploading, setUploading] = useState(false);
  const uploadFloorPlan = trpc.clientPipeline.uploadFloorPlan.useMutation({
    onSuccess: () => {
      toast.success("도면이 업로드되었습니다!");
      floorPlans.refetch();
      project.refetch();
      setUploading(false);
    },
    onError: () => { toast.error("업로드에 실패했습니다."); setUploading(false); },
  });

  const analyzeFloorPlan = trpc.clientPipeline.analyzeFloorPlan.useMutation({
    onSuccess: () => {
      toast.success("도면 분석이 완료되었습니다!");
      floorPlans.refetch();
    },
    onError: () => toast.error("분석에 실패했습니다."),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("파일 크기는 20MB 이하여야 합니다.");
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadFloorPlan.mutate({
        projectId,
        fileName: file.name,
        fileBase64: base64,
        fileType: file.type,
        fileSize: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  // Survey form
  const [surveyForm, setSurveyForm] = useState({
    respondentName: "", respondentRole: "", respondentEmail: "",
    workStyle: "" as any, remoteWorkRatio: 0, meetingFrequency: "" as any,
    privateOfficeCount: 0, meetingRoomCount: 0,
    needsLounge: 0, needsCafeteria: 0, needsPhoneBooth: 0,
    needsLibrary: 0, needsGym: 0, needsNapRoom: 0,
    designStyle: "" as any, colorPreference: "", brandColors: "",
    inspirationNotes: "", currentPainPoints: [] as string[],
    priorityAreas: [] as string[],
    lightingPreference: "" as any, noiseControl: "" as any,
    storageNeeds: "" as any, budgetPriority: "" as any,
    timelineUrgency: "" as any, additionalNotes: "",
  });

  const submitSurvey = trpc.clientPipeline.submitWorkSurvey.useMutation({
    onSuccess: () => {
      toast.success("서베이가 제출되었습니다!");
      survey.refetch();
      project.refetch();
    },
    onError: () => toast.error("서베이 제출에 실패했습니다."),
  });

  // Report generation
  const generateReport = trpc.clientPipeline.generateReport.useMutation({
    onSuccess: () => {
      toast.success("AI 보고서와 제안서가 생성되었습니다!");
      reports.refetch();
      project.refetch();
    },
    onError: () => toast.error("보고서 생성에 실패했습니다."),
  });

  // Company survey
  const [companySurveyForm, setCompanySurveyForm] = useState({
    title: "", description: "", maxResponses: "", expiresInDays: "14",
  });
  const createCompanySurvey = trpc.clientPipeline.createCompanySurvey.useMutation({
    onSuccess: (data) => {
      toast.success("전사 서베이 링크가 생성되었습니다!");
      companySurveys.refetch();
      project.refetch();
      const url = `${window.location.origin}/survey/${data.token}`;
      navigator.clipboard.writeText(url).then(() => toast.info("링크가 클립보드에 복사되었습니다!"));
    },
    onError: () => toast.error("서베이 생성에 실패했습니다."),
  });

  // Meeting booking
  const [meetingForm, setMeetingForm] = useState({
    requestedDate: "", requestedTime: "", meetingType: "office" as any,
    location: "", agenda: "",
  });
  const requestMeeting = trpc.clientPipeline.requestMeeting.useMutation({
    onSuccess: () => {
      toast.success("미팅 요청이 접수되었습니다! 담당자가 확인 후 연락드리겠습니다.");
      meetings.refetch();
      project.refetch();
      setMeetingForm({ requestedDate: "", requestedTime: "", meetingType: "office", location: "", agenda: "" });
    },
    onError: () => toast.error("미팅 요청에 실패했습니다."),
  });

  if (authLoading || project.isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!project.data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md"><CardContent className="py-12 text-center">
          <p className="text-muted-foreground">프로젝트를 찾을 수 없습니다.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/my")}>돌아가기</Button>
        </CardContent></Card>
      </div>
    );
  }

  const p = project.data;

  const PAIN_POINT_OPTIONS = [
    "소음 문제", "조명 부족", "공간 부족", "환기 불량", "온도 조절 어려움",
    "프라이버시 부족", "회의실 부족", "수납 공간 부족", "동선 비효율", "노후 시설",
  ];
  const PRIORITY_OPTIONS = [
    "직원 만족도", "브랜드 이미지", "업무 효율성", "비용 절감", "확장성",
    "친환경", "안전/보건", "IT 인프라", "방문객 인상",
  ];

  return (
    <section className="py-16 lg:py-24">
      <div className="container max-w-5xl">
        {/* Back + Header */}
        <button onClick={() => navigate("/my")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-ink mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> 프로젝트 목록
        </button>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-bold text-ink">{p.companyName}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {p.contactName}</span>
              {p.contactEmail && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {p.contactEmail}</span>}
              {p.contactPhone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {p.contactPhone}</span>}
            </div>
          </div>
          <Badge className="text-sm">{STATUS_STEP[p.status] || 1}단계</Badge>
        </div>

        {/* Progress Steps */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="flex items-center justify-between gap-2">
              {[
                { step: 1, label: "프로젝트", icon: Building2 },
                { step: 2, label: "도면", icon: FileText },
                { step: 3, label: "서베이", icon: ClipboardList },
                { step: 4, label: "보고서", icon: BarChart3 },
                { step: 6, label: "전사 서베이", icon: Users },
                { step: 8, label: "미팅", icon: Calendar },
              ].map((s, i, arr) => (
                <div key={s.step} className="flex items-center gap-2 flex-1">
                  <div className={`flex flex-col items-center gap-1 flex-shrink-0 ${currentStep >= s.step ? "text-gold" : "text-muted-foreground"}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      currentStep > s.step ? "bg-gold text-ink" :
                      currentStep === s.step ? "bg-gold/20 text-gold border-2 border-gold" :
                      "bg-gray-100 text-gray-400"
                    }`}>
                      {currentStep > s.step ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                    </div>
                    <span className="text-[10px] font-medium whitespace-nowrap">{s.label}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className={`h-0.5 flex-1 rounded ${currentStep > s.step ? "bg-gold" : "bg-gray-100"}`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue={currentStep <= 2 ? "floorplan" : currentStep <= 3 ? "survey" : currentStep <= 5 ? "report" : currentStep <= 7 ? "company-survey" : "meeting"}>
          <TabsList className="w-full flex flex-wrap gap-1 mb-6">
            <TabsTrigger value="floorplan" className="text-xs">도면</TabsTrigger>
            <TabsTrigger value="survey" className="text-xs">서베이</TabsTrigger>
            <TabsTrigger value="report" className="text-xs">AI 보고서</TabsTrigger>
            <TabsTrigger value="company-survey" className="text-xs">전사 서베이</TabsTrigger>
            <TabsTrigger value="realestate" className="text-xs">부동산</TabsTrigger>
            <TabsTrigger value="layouts" className="text-xs">레이아웃</TabsTrigger>
            <TabsTrigger value="renderings" className="text-xs">3D</TabsTrigger>
            <TabsTrigger value="proposal" className="text-xs">제안서</TabsTrigger>
            <TabsTrigger value="meeting" className="text-xs">미팅</TabsTrigger>
            <TabsTrigger value="aftercare" className="text-xs">사후관리</TabsTrigger>
          </TabsList>

          {/* ===== TAB 1: Floor Plan Upload ===== */}
          <TabsContent value="floorplan">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gold" /> 도면 업로드
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center">
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    도면 파일을 업로드하세요 (PDF, CAD, 이미지 파일 지원, 최대 20MB)
                  </p>
                  <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-gold text-ink font-semibold text-sm cursor-pointer hover:bg-gold-light transition-colors rounded">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? "업로드 중..." : "파일 선택"}
                    <input type="file" className="hidden" accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png,.webp" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                </div>

                {(floorPlans.data?.length ?? 0) > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-ink">업로드된 도면</h4>
                    {floorPlans.data?.map((fp: any) => (
                      <div key={fp.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gold" />
                          <div>
                            <p className="text-sm font-medium text-ink">{fp.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {fp.fileType} · {Math.round((fp.fileSize || 0) / 1024)}KB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {fp.aiAnalysis ? (
                            <Badge className="bg-green-100 text-green-700">분석 완료</Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => analyzeFloorPlan.mutate({ floorPlanId: fp.id, projectId })}
                              disabled={analyzeFloorPlan.isPending}
                            >
                              {analyzeFloorPlan.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                              AI 분석
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {floorPlans.data?.some((fp: any) => fp.aiAnalysis) && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-ink">AI 분석 결과</h4>
                    {floorPlans.data?.filter((fp: any) => fp.aiAnalysis).map((fp: any) => (
                      <Card key={fp.id} className="border-gold/20">
                        <CardContent className="py-4 space-y-2">
                          <p className="font-medium text-ink">{fp.fileName}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                            <div><span className="text-muted-foreground">추정 면적:</span> <span className="font-medium">{fp.aiAnalysis.estimatedArea}</span></div>
                            <div><span className="text-muted-foreground">방 수:</span> <span className="font-medium">{fp.aiAnalysis.roomCount}</span></div>
                            <div><span className="text-muted-foreground">리셉션:</span> <span className="font-medium">{fp.aiAnalysis.hasReception ? "있음" : "없음"}</span></div>
                            <div><span className="text-muted-foreground">회의실:</span> <span className="font-medium">{fp.aiAnalysis.hasMeetingRoom ? "있음" : "없음"}</span></div>
                          </div>
                          <p className="text-sm text-muted-foreground">{fp.aiAnalysis.spaceAnalysis}</p>
                          {fp.aiAnalysis.recommendations?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-ink mt-2">개선 제안:</p>
                              <ul className="list-disc list-inside text-xs text-muted-foreground">
                                {fp.aiAnalysis.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TAB 2: Work Environment Survey ===== */}
          <TabsContent value="survey">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-gold" /> 업무환경 서베이
                </CardTitle>
              </CardHeader>
              <CardContent>
                {survey.data ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">서베이가 완료되었습니다</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-muted-foreground">응답자:</span> {survey.data.respondentName}</div>
                      <div><span className="text-muted-foreground">업무 스타일:</span> {survey.data.workStyle || "-"}</div>
                      <div><span className="text-muted-foreground">디자인 스타일:</span> {survey.data.designStyle || "-"}</div>
                      <div><span className="text-muted-foreground">예산 우선순위:</span> {survey.data.budgetPriority || "-"}</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-sm text-muted-foreground">
                      업무환경에 대한 정보를 입력해주세요. 이 데이터를 바탕으로 AI가 맞춤형 분석 보고서와 제안서를 생성합니다.
                    </p>

                    {/* 기본 정보 */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-ink border-b pb-2">기본 정보</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div><Label>응답자명 *</Label><Input value={surveyForm.respondentName} onChange={e => setSurveyForm(f => ({ ...f, respondentName: e.target.value }))} /></div>
                        <div><Label>직책</Label><Input value={surveyForm.respondentRole} onChange={e => setSurveyForm(f => ({ ...f, respondentRole: e.target.value }))} /></div>
                        <div><Label>이메일</Label><Input type="email" value={surveyForm.respondentEmail} onChange={e => setSurveyForm(f => ({ ...f, respondentEmail: e.target.value }))} /></div>
                      </div>
                    </div>

                    {/* 업무 스타일 */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-ink border-b pb-2">업무 스타일</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>업무 방식</Label>
                          <Select value={surveyForm.workStyle} onValueChange={v => setSurveyForm(f => ({ ...f, workStyle: v }))}>
                            <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="collaborative">협업 중심</SelectItem>
                              <SelectItem value="focused">집중 업무 중심</SelectItem>
                              <SelectItem value="hybrid">혼합형</SelectItem>
                              <SelectItem value="flexible">유연 근무</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>회의 빈도</Label>
                          <Select value={surveyForm.meetingFrequency} onValueChange={v => setSurveyForm(f => ({ ...f, meetingFrequency: v }))}>
                            <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="rarely">거의 없음</SelectItem>
                              <SelectItem value="few_weekly">주 2-3회</SelectItem>
                              <SelectItem value="daily">매일</SelectItem>
                              <SelectItem value="very_frequent">매우 빈번</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>재택근무 비율 ({surveyForm.remoteWorkRatio}%)</Label>
                        <input type="range" min="0" max="100" step="10" value={surveyForm.remoteWorkRatio}
                          onChange={e => setSurveyForm(f => ({ ...f, remoteWorkRatio: parseInt(e.target.value) }))}
                          className="w-full accent-gold mt-1"
                        />
                      </div>
                    </div>

                    {/* 공간 요구사항 */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-ink border-b pb-2">공간 요구사항</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>임원실 수</Label><Input type="number" min="0" value={surveyForm.privateOfficeCount} onChange={e => setSurveyForm(f => ({ ...f, privateOfficeCount: parseInt(e.target.value) || 0 }))} /></div>
                        <div><Label>회의실 수</Label><Input type="number" min="0" value={surveyForm.meetingRoomCount} onChange={e => setSurveyForm(f => ({ ...f, meetingRoomCount: parseInt(e.target.value) || 0 }))} /></div>
                      </div>
                      <div>
                        <Label>필요한 부대시설 (해당 항목 체크)</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {[
                            { key: "needsLounge", label: "라운지" },
                            { key: "needsCafeteria", label: "카페테리아" },
                            { key: "needsPhoneBooth", label: "폰부스" },
                            { key: "needsLibrary", label: "라이브러리" },
                            { key: "needsGym", label: "피트니스" },
                            { key: "needsNapRoom", label: "수면실" },
                          ].map(item => (
                            <label key={item.key} className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={(surveyForm as any)[item.key] === 1}
                                onChange={e => setSurveyForm(f => ({ ...f, [item.key]: e.target.checked ? 1 : 0 }))}
                                className="accent-gold"
                              />
                              <span className="text-sm">{item.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 디자인 선호 */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-ink border-b pb-2">디자인 선호</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>디자인 스타일</Label>
                          <Select value={surveyForm.designStyle} onValueChange={v => setSurveyForm(f => ({ ...f, designStyle: v }))}>
                            <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="modern">모던</SelectItem>
                              <SelectItem value="minimal">미니멀</SelectItem>
                              <SelectItem value="warm">따뜻한/내추럴</SelectItem>
                              <SelectItem value="industrial">인더스트리얼</SelectItem>
                              <SelectItem value="natural">자연친화</SelectItem>
                              <SelectItem value="luxury">럭셔리</SelectItem>
                              <SelectItem value="creative">크리에이티브</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>조명 선호</Label>
                          <Select value={surveyForm.lightingPreference} onValueChange={v => setSurveyForm(f => ({ ...f, lightingPreference: v }))}>
                            <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="natural">자연광 중심</SelectItem>
                              <SelectItem value="warm">따뜻한 조명</SelectItem>
                              <SelectItem value="cool">시원한 조명</SelectItem>
                              <SelectItem value="mixed">혼합</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>선호 색상</Label><Input value={surveyForm.colorPreference} onChange={e => setSurveyForm(f => ({ ...f, colorPreference: e.target.value }))} placeholder="예: 화이트, 우드톤" /></div>
                        <div><Label>브랜드 컬러</Label><Input value={surveyForm.brandColors} onChange={e => setSurveyForm(f => ({ ...f, brandColors: e.target.value }))} placeholder="예: #C8A96E" /></div>
                      </div>
                    </div>

                    {/* 현재 불편사항 */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-ink border-b pb-2">현재 불편사항</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {PAIN_POINT_OPTIONS.map(pp => (
                          <label key={pp} className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={surveyForm.currentPainPoints.includes(pp)}
                              onChange={e => {
                                setSurveyForm(f => ({
                                  ...f,
                                  currentPainPoints: e.target.checked
                                    ? [...f.currentPainPoints, pp]
                                    : f.currentPainPoints.filter(x => x !== pp),
                                }));
                              }}
                              className="accent-gold"
                            />
                            <span className="text-sm">{pp}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 우선순위 */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-ink border-b pb-2">우선순위 영역</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {PRIORITY_OPTIONS.map(pr => (
                          <label key={pr} className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={surveyForm.priorityAreas.includes(pr)}
                              onChange={e => {
                                setSurveyForm(f => ({
                                  ...f,
                                  priorityAreas: e.target.checked
                                    ? [...f.priorityAreas, pr]
                                    : f.priorityAreas.filter(x => x !== pr),
                                }));
                              }}
                              className="accent-gold"
                            />
                            <span className="text-sm">{pr}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 예산/일정 */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-ink border-b pb-2">예산 및 일정</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>예산 우선순위</Label>
                          <Select value={surveyForm.budgetPriority} onValueChange={v => setSurveyForm(f => ({ ...f, budgetPriority: v }))}>
                            <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cost_saving">비용 절감 우선</SelectItem>
                              <SelectItem value="balanced">균형 잡힌 투자</SelectItem>
                              <SelectItem value="quality_first">품질 우선</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>일정 긴급도</Label>
                          <Select value={surveyForm.timelineUrgency} onValueChange={v => setSurveyForm(f => ({ ...f, timelineUrgency: v }))}>
                            <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="flexible">여유 있음</SelectItem>
                              <SelectItem value="within_6months">6개월 이내</SelectItem>
                              <SelectItem value="within_3months">3개월 이내</SelectItem>
                              <SelectItem value="urgent">긴급</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>추가 요청사항</Label>
                      <Textarea value={surveyForm.additionalNotes} onChange={e => setSurveyForm(f => ({ ...f, additionalNotes: e.target.value }))} placeholder="기타 요청사항이나 참고사항을 자유롭게 작성해주세요." rows={4} />
                    </div>

                    <Button
                      className="w-full bg-gold text-ink hover:bg-gold-light font-semibold"
                      onClick={() => {
                        if (!surveyForm.respondentName) { toast.error("응답자명은 필수입니다."); return; }
                        submitSurvey.mutate({ projectId, ...surveyForm });
                      }}
                      disabled={submitSurvey.isPending}
                    >
                      {submitSurvey.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                      서베이 제출
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TAB 3: AI Report ===== */}
          <TabsContent value="report">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gold" /> AI 분석 보고서 & 제안서
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!survey.data ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ClipboardList className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p>업무환경 서베이를 먼저 완료해주세요.</p>
                  </div>
                ) : (reports.data?.length ?? 0) === 0 ? (
                  <div className="text-center py-8 space-y-4">
                    <BarChart3 className="w-10 h-10 mx-auto text-gold/50" />
                    <p className="text-muted-foreground">서베이 데이터를 바탕으로 AI가 분석 보고서와 맞춤 제안서를 생성합니다.</p>
                    <Button
                      className="bg-gold text-ink hover:bg-gold-light font-semibold gap-2"
                      onClick={() => generateReport.mutate({ projectId })}
                      disabled={generateReport.isPending}
                    >
                      {generateReport.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                      {generateReport.isPending ? "AI 보고서 생성 중... (1-2분 소요)" : "AI 보고서 생성"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reports.data?.map((report: any) => (
                      <Card key={report.id} className="border-gold/20">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-heading">{report.title}</CardTitle>
                            <Badge className={report.type === "analysis" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}>
                              {report.type === "analysis" ? "분석 보고서" : "제안서"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-sm max-w-none">
                            <Streamdown>{report.content}</Streamdown>
                          </div>
                          <div className="mt-4 flex items-center gap-3 flex-wrap">
                            <KakaoShareButton
                              type="report"
                              reportParams={{
                                title: `[${p.companyName}] ${report.title}`,
                                description: report.type === "analysis"
                                  ? `${p.companyName}의 업무환경 AI 분석 보고서입니다. 고감도 인테리어 전문 컨설팅.`
                                  : `${p.companyName}을 위한 맞춤형 인테리어 제안서입니다. 고감도 인테리어 전문 컨설팅.`,
                                pageUrl: window.location.href,
                                buttonTitle: "보고서 확인하기",
                              }}
                              label="카카오톡으로 공유"
                            />
                            {report.emailSentAt && (
                              <div className="flex items-center gap-2 text-xs text-green-600">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {report.emailSentTo}로 발송됨
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TAB 4: Company-Wide Survey ===== */}
          <TabsContent value="company-survey">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-gold" /> 전사 업무환경 설문조사
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  전 직원을 대상으로 업무환경 만족도 설문을 실시하세요. 링크를 공유하면 직원들이 익명으로 응답할 수 있습니다.
                </p>

                {/* Create new survey */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-semibold text-ink">새 설문 생성</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>설문 제목</Label><Input value={companySurveyForm.title} onChange={e => setCompanySurveyForm(f => ({ ...f, title: e.target.value }))} placeholder="업무환경 설문조사" /></div>
                    <div><Label>유효기간 (일)</Label><Input type="number" value={companySurveyForm.expiresInDays} onChange={e => setCompanySurveyForm(f => ({ ...f, expiresInDays: e.target.value }))} /></div>
                  </div>
                  <div><Label>설명</Label><Textarea value={companySurveyForm.description} onChange={e => setCompanySurveyForm(f => ({ ...f, description: e.target.value }))} placeholder="설문 안내 문구" rows={2} /></div>
                  <Button
                    className="bg-gold text-ink hover:bg-gold-light font-semibold gap-2"
                    onClick={() => createCompanySurvey.mutate({
                      projectId,
                      title: companySurveyForm.title || undefined,
                      description: companySurveyForm.description || undefined,
                      expiresInDays: parseInt(companySurveyForm.expiresInDays) || 14,
                      maxResponses: companySurveyForm.maxResponses ? parseInt(companySurveyForm.maxResponses) : undefined,
                    })}
                    disabled={createCompanySurvey.isPending}
                  >
                    {createCompanySurvey.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                    설문 링크 생성
                  </Button>
                </div>

                {/* Existing surveys */}
                {(companySurveys.data?.length ?? 0) > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-ink">생성된 설문</h4>
                    {companySurveys.data?.map((cs: any) => (
                      <div key={cs.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-ink">{cs.title}</p>
                          <p className="text-xs text-muted-foreground">
                            응답 {cs.responseCount}건 · {cs.isActive ? "진행중" : "마감"}
                            {cs.expiresAt && ` · 만료: ${new Date(cs.expiresAt).toLocaleDateString("ko-KR")}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => {
                              const url = `${window.location.origin}/survey/${cs.token}`;
                              navigator.clipboard.writeText(url);
                              toast.success("설문 링크가 복사되었습니다!");
                            }}
                          >
                            <Copy className="w-3 h-3" /> 링크 복사
                          </Button>
                          <KakaoShareButton
                            type="survey"
                            surveyParams={{
                              title: cs.title || "업무환경 설문조사",
                              description: `${p.companyName}의 업무환경 개선을 위한 설문조사에 참여해주세요. 익명으로 응답됩니다.`,
                              surveyUrl: `${window.location.origin}/survey/${cs.token}`,
                              buttonTitle: "설문 참여하기",
                            }}
                            label="카카오톡 공유"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TAB 5: Meeting Booking ===== */}
          <TabsContent value="meeting">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gold" /> 미팅 예약
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  고감도 전문 컨설턴트와의 미팅을 예약하세요. 분석 보고서를 바탕으로 구체적인 프로젝트 논의를 진행합니다.
                </p>

                <div className="border rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>희망 날짜 *</Label><Input type="date" value={meetingForm.requestedDate} onChange={e => setMeetingForm(f => ({ ...f, requestedDate: e.target.value }))} /></div>
                    <div><Label>희망 시간 *</Label><Input type="time" value={meetingForm.requestedTime} onChange={e => setMeetingForm(f => ({ ...f, requestedTime: e.target.value }))} /></div>
                  </div>
                  <div>
                    <Label>미팅 방식</Label>
                    <Select value={meetingForm.meetingType} onValueChange={v => setMeetingForm(f => ({ ...f, meetingType: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="office">고감도 사무실 방문</SelectItem>
                        <SelectItem value="visit">현장 방문</SelectItem>
                        <SelectItem value="online">온라인 (Zoom/Teams)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {meetingForm.meetingType === "visit" && (
                    <div><Label>방문 주소</Label><Input value={meetingForm.location} onChange={e => setMeetingForm(f => ({ ...f, location: e.target.value }))} placeholder="방문 주소를 입력하세요" /></div>
                  )}
                  <div><Label>미팅 안건</Label><Textarea value={meetingForm.agenda} onChange={e => setMeetingForm(f => ({ ...f, agenda: e.target.value }))} placeholder="논의하고 싶은 내용을 간략히 적어주세요" rows={3} /></div>
                  <Button
                    className="w-full bg-gold text-ink hover:bg-gold-light font-semibold gap-2"
                    onClick={() => {
                      if (!meetingForm.requestedDate || !meetingForm.requestedTime) {
                        toast.error("날짜와 시간을 선택해주세요.");
                        return;
                      }
                      requestMeeting.mutate({ projectId, ...meetingForm });
                    }}
                    disabled={requestMeeting.isPending}
                  >
                    {requestMeeting.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                    미팅 요청
                  </Button>
                </div>

                {/* Existing meetings */}
                {(meetings.data?.length ?? 0) > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-ink">미팅 이력</h4>
                    {meetings.data?.map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-ink">{m.requestedDate} {m.requestedTime}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.meetingType === "office" ? "사무실 방문" : m.meetingType === "visit" ? "현장 방문" : "온라인"}
                            {m.agenda && ` · ${m.agenda.substring(0, 50)}`}
                          </p>
                        </div>
                        <Badge className={
                          m.status === "confirmed" ? "bg-green-100 text-green-700" :
                          m.status === "requested" ? "bg-amber-100 text-amber-700" :
                          m.status === "completed" ? "bg-blue-100 text-blue-700" :
                          m.status === "cancelled" ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-700"
                        }>
                          {m.status === "requested" ? "요청됨" : m.status === "confirmed" ? "확정" : m.status === "completed" ? "완료" : m.status === "cancelled" ? "취소" : m.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TAB: 부동산 매칭 ===== */}
          <TabsContent value="realestate">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Home className="w-5 h-5 text-gold" /> 부동산 매칭
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  전사 서베이 결과와 도면 분석을 기반으로 최적의 사무실 매물을 매칭합니다.
                  필요 면적, 예산, 위치 조건을 분석하여 적합한 매물을 추천합니다.
                </p>
                <div className="border rounded-lg p-6 bg-gray-50 text-center">
                  <Home className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-ink">매물 매칭 서비스</p>
                  <p className="text-xs text-muted-foreground mt-1">서베이 완료 후 담당자가 매물 검색 조건을 설정하면 자동으로 매칭됩니다.</p>
                  <Badge variant="outline" className="mt-3">담당자 배정 대기 중</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TAB: 레이아웃 비교 ===== */}
          <TabsContent value="layouts">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5 text-gold" /> 레이아웃 옵션 비교
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  AI가 생성한 다양한 레이아웃 옵션을 비교하고 선호하는 안을 선택할 수 있습니다.
                </p>
                <div className="border rounded-lg p-6 bg-gray-50 text-center">
                  <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-ink">레이아웃 생성 대기 중</p>
                  <p className="text-xs text-muted-foreground mt-1">도면 분석과 서베이 데이터를 기반으로 레이아웃 옵션이 자동 생성됩니다.</p>
                  <Badge variant="outline" className="mt-3">도면 분석 완료 후 활성화</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TAB: 3D 렌더링 ===== */}
          <TabsContent value="renderings">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Box className="w-5 h-5 text-gold" /> 3D 렌더링 갤러리
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  선택한 레이아웃을 기반으로 생성된 포토리얼리스틱 3D 렌더링을 확인하세요.
                </p>
                <div className="border rounded-lg p-6 bg-gray-50 text-center">
                  <Box className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-ink">3D 렌더링 대기 중</p>
                  <p className="text-xs text-muted-foreground mt-1">레이아웃 선택 후 3D 렌더링이 자동 생성됩니다.</p>
                  <Badge variant="outline" className="mt-3">레이아웃 선택 후 활성화</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TAB: AI 제안서 ===== */}
          <TabsContent value="proposal">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-gold" /> AI 제안서
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  모든 분석 데이터를 종합하여 자동 생성된 제안서를 확인하세요.
                  견적, 일정, 시공 범위가 포함됩니다.
                </p>
                <div className="border rounded-lg p-6 bg-gray-50 text-center">
                  <FileCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-ink">제안서 생성 대기 중</p>
                  <p className="text-xs text-muted-foreground mt-1">미팅 확정 후 담당자가 제안서를 생성합니다.</p>
                  <Badge variant="outline" className="mt-3">미팅 확정 후 활성화</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TAB: 사후관리 ===== */}
          <TabsContent value="aftercare">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5 text-gold" /> 사후관리
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  입주 후 만족도 설문, 미세 조정 방문 예약, OpsX Insight 구독 서비스를 이용할 수 있습니다.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 text-center">
                    <Star className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">만족도 설문</p>
                    <p className="text-xs text-muted-foreground mt-1">입주 1주 후 자동 발송</p>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">방문 예약</p>
                    <p className="text-xs text-muted-foreground mt-1">미세 조정 방문 예약</p>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <BarChart3 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">Insight 구독</p>
                    <p className="text-xs text-muted-foreground mt-1">3개월 주기 최적화 리포트</p>
                  </div>
                </div>
                <Badge variant="outline" className="mt-2">프로젝트 완료 후 활성화</Badge>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
