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
import { Streamdown } from "streamdown";
import {
  FileText, Plus, Send, BarChart3, Mail, Eye, Trash2, RefreshCw,
  ClipboardList, Users, CheckCircle2, Clock, AlertCircle, Loader2,
  ChevronRight, ArrowRight, Download, Zap
} from "lucide-react";

const typeLabels: Record<string, string> = {
  initial_contact: "1차 상담 설문",
  company_wide: "전사 설문",
  post_occupancy: "입주 후 만족도",
  satisfaction: "고객 만족도",
};

const questionTypeLabels: Record<string, string> = {
  text: "단답형", textarea: "장문형", single_choice: "단일 선택",
  multiple_choice: "다중 선택", scale: "척도", number: "숫자",
};

export default function AdminSurveyAutomation() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("templates");
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showTriggerSurvey, setShowTriggerSurvey] = useState(false);
  const [showCompanySurvey, setShowCompanySurvey] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: "", description: "", type: "initial_contact" as const });
  const [triggerData, setTriggerData] = useState({ clientProjectId: 0, recipientEmail: "", recipientName: "", templateId: 0 });
  const [companySurveyData, setCompanySurveyData] = useState({ clientProjectId: 0, templateId: 0, recipientEmail: "", recipientName: "", customQuestions: "" });
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ questionText: "", questionType: "single_choice" as const, isRequired: 1, sortOrder: 0, options: "" });
  const [selectedReportProject, setSelectedReportProject] = useState<number>(0);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [emailLogProject, setEmailLogProject] = useState<number>(0);
  const [generateReportData, setGenerateReportData] = useState({ clientProjectId: 0, instanceId: 0 });
  const [showGenerateReport, setShowGenerateReport] = useState(false);

  // Queries
  const templates = trpc.surveyAuto.listTemplates.useQuery(undefined, { enabled: !!user });
  const templateDetail = trpc.surveyAuto.getTemplate.useQuery(
    { id: selectedTemplate! }, { enabled: !!selectedTemplate }
  );
  const analysisReports = trpc.surveyAuto.getAnalysisReports.useQuery(
    { clientProjectId: selectedReportProject },
    { enabled: selectedReportProject > 0 }
  );
  const selectedReport = trpc.surveyAuto.getAnalysisReport.useQuery(
    { id: selectedReportId! }, { enabled: !!selectedReportId }
  );
  // 전체 분석 데이터는 리포트 content(JSON)에 보존되어 있어 파싱해서 사용
  const reportAnalysis: any = (() => {
    try { return selectedReport.data?.content ? JSON.parse(selectedReport.data.content) : {}; }
    catch { return {}; }
  })();
  const emailLogs = trpc.surveyAuto.getEmailLogs.useQuery(
    { clientProjectId: emailLogProject },
    { enabled: emailLogProject > 0 }
  );

  // Mutations
  const createTemplate = trpc.surveyAuto.createTemplate.useMutation({
    onSuccess: () => { templates.refetch(); setShowCreateTemplate(false); toast.success("템플릿이 생성되었습니다."); },
    onError: (e: any) => toast.error(e.message),
  });
  const triggerSurvey = trpc.surveyAuto.triggerInitialSurvey.useMutation({
    onSuccess: (data: any) => { setShowTriggerSurvey(false); toast.success(`설문이 발송되었습니다. (토큰: ${data.token.slice(0, 8)}...)`); },
    onError: (e: any) => toast.error(e.message),
  });
  const addQuestion = trpc.surveyAuto.addQuestion.useMutation({
    onSuccess: () => { templateDetail.refetch(); setShowAddQuestion(false); toast.success("질문이 추가되었습니다."); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteQuestion = trpc.surveyAuto.deleteQuestion.useMutation({
    onSuccess: () => { templateDetail.refetch(); toast.success("질문이 삭제되었습니다."); },
    onError: (e: any) => toast.error(e.message),
  });
  const generateReport = trpc.surveyAuto.generateAnalysisReport.useMutation({
    onSuccess: () => { analysisReports.refetch(); setShowGenerateReport(false); toast.success("AI 분석 리포트가 생성되었습니다."); },
    onError: (e: any) => toast.error(e.message),
  });
  const createCompanySurveyInstance = trpc.surveyAuto.createCompanySurveyInstance.useMutation({
    onSuccess: (data: any) => { setShowCompanySurvey(false); toast.success(`전사 설문이 발송되었습니다. (토큰: ${data.token.slice(0, 8)}...)`); },
    onError: (e: any) => toast.error(e.message),
  });
  const regenerateQuestions = trpc.surveyAuto.regenerateQuestions.useMutation({
    onSuccess: (data: any) => { toast.success("질문이 AI로 재구성되었습니다."); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">설문 자동화 관리</h1>
          <p className="text-muted-foreground mt-1">상담 요청 → 1차 설문 → 분석 리포트 → 전사 설문 자동화 파이프라인</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showTriggerSurvey} onOpenChange={setShowTriggerSurvey}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Send className="w-4 h-4" />1차 설문 발송</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>1차 설문 발송</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <Input placeholder="프로젝트 ID" type="number" onChange={e => setTriggerData(d => ({ ...d, clientProjectId: parseInt(e.target.value) || 0 }))} />
                <Input placeholder="수신자 이름" onChange={e => setTriggerData(d => ({ ...d, recipientName: e.target.value }))} />
                <Input placeholder="수신자 이메일" type="email" onChange={e => setTriggerData(d => ({ ...d, recipientEmail: e.target.value }))} />
                <Select onValueChange={v => setTriggerData(d => ({ ...d, templateId: parseInt(v) }))}>
                  <SelectTrigger><SelectValue placeholder="설문 템플릿 선택" /></SelectTrigger>
                  <SelectContent>
                    {templates.data?.map((t: any) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button className="w-full" onClick={() => triggerSurvey.mutate(triggerData)} disabled={triggerSurvey.isPending}>
                  {triggerSurvey.isPending ? "발송 중..." : "설문 발송"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 파이프라인 개요 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: Mail, label: "1차 설문 발송", desc: "상담 요청 시 자동 발송", color: "text-blue-500" },
          { icon: ClipboardList, label: "설문 응답 수집", desc: "토큰 기반 비로그인 응답", color: "text-green-500" },
          { icon: BarChart3, label: "AI 분석 리포트", desc: "블러 처리 + 회원가입 유도", color: "text-purple-500" },
          { icon: Users, label: "전사 설문", desc: "담당자 질문 커스터마이징", color: "text-amber-500" },
        ].map((step, i) => (
          <Card key={i} className="relative">
            <CardContent className="pt-6">
              <step.icon className={`w-8 h-8 ${step.color} mb-3`} />
              <h3 className="font-semibold text-sm">{step.label}</h3>
              <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
              {i < 3 && <div className="hidden md:block absolute top-1/2 -right-2 text-muted-foreground">→</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="templates" className="gap-1 text-xs sm:text-sm"><FileText className="w-4 h-4" />템플릿</TabsTrigger>
          <TabsTrigger value="reports" className="gap-1 text-xs sm:text-sm"><BarChart3 className="w-4 h-4" />분석 리포트</TabsTrigger>
          <TabsTrigger value="company" className="gap-1 text-xs sm:text-sm"><Users className="w-4 h-4" />전사 설문</TabsTrigger>
          <TabsTrigger value="logs" className="gap-1 text-xs sm:text-sm"><Mail className="w-4 h-4" />발송 로그</TabsTrigger>
        </TabsList>

        {/* ===== 탭 1: 템플릿 관리 ===== */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showCreateTemplate} onOpenChange={setShowCreateTemplate}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2"><Plus className="w-4 h-4" />템플릿 생성</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>설문 템플릿 생성</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input placeholder="템플릿 이름" value={newTemplate.name} onChange={e => setNewTemplate(t => ({ ...t, name: e.target.value }))} />
                  <Textarea placeholder="설명" value={newTemplate.description} onChange={e => setNewTemplate(t => ({ ...t, description: e.target.value }))} />
                  <Select value={newTemplate.type} onValueChange={v => setNewTemplate(t => ({ ...t, type: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="initial_contact">1차 상담 설문</SelectItem>
                      <SelectItem value="company_wide">전사 설문</SelectItem>
                      <SelectItem value="post_occupancy">입주 후 만족도</SelectItem>
                      <SelectItem value="satisfaction">고객 만족도</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="w-full" onClick={() => createTemplate.mutate(newTemplate)} disabled={createTemplate.isPending}>
                    {createTemplate.isPending ? "생성 중..." : "생성"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h2 className="font-semibold text-lg">설문 템플릿</h2>
              {templates.isLoading ? (
                <p className="text-muted-foreground text-sm">로딩 중...</p>
              ) : templates.data?.length === 0 ? (
                <Card><CardContent className="pt-6 text-center text-muted-foreground text-sm">템플릿이 없습니다.</CardContent></Card>
              ) : (
                templates.data?.map((t: any) => (
                  <Card
                    key={t.id}
                    className={`cursor-pointer transition-colors hover:border-primary/50 ${selectedTemplate === t.id ? "border-primary" : ""}`}
                    onClick={() => setSelectedTemplate(t.id)}
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-sm">{t.name}</h3>
                          <Badge variant="secondary" className="mt-1 text-xs">{typeLabels[t.type] || t.type}</Badge>
                        </div>
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <div className="lg:col-span-2 space-y-4">
              {selectedTemplate && templateDetail.data ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{templateDetail.data.name}</CardTitle>
                    <CardDescription>{templateDetail.data.description || "설명 없음"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">질문 {templateDetail.data.questions?.length || 0}개</span>
                      <Dialog open={showAddQuestion} onOpenChange={setShowAddQuestion}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-1"><Plus className="w-3 h-3" />질문 추가</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>질문 추가</DialogTitle></DialogHeader>
                          <div className="space-y-4 pt-4">
                            <Textarea placeholder="질문 내용" value={newQuestion.questionText} onChange={e => setNewQuestion(q => ({ ...q, questionText: e.target.value }))} />
                            <Select value={newQuestion.questionType} onValueChange={v => setNewQuestion(q => ({ ...q, questionType: v as any }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">단답형</SelectItem>
                                <SelectItem value="textarea">장문형</SelectItem>
                                <SelectItem value="single_choice">단일 선택</SelectItem>
                                <SelectItem value="multiple_choice">다중 선택</SelectItem>
                                <SelectItem value="scale">척도 (1~5)</SelectItem>
                                <SelectItem value="number">숫자</SelectItem>
                              </SelectContent>
                            </Select>
                            {(newQuestion.questionType === "single_choice" || newQuestion.questionType === "multiple_choice") && (
                              <Textarea placeholder="선택지 (줄바꿈으로 구분)" value={newQuestion.options} onChange={e => setNewQuestion(q => ({ ...q, options: e.target.value }))} />
                            )}
                            <Button className="w-full" onClick={() => {
                              const opts = newQuestion.options.split("\n").filter(Boolean).map((o, i) => ({ optionText: o.trim(), optionValue: o.trim(), sortOrder: i }));
                              addQuestion.mutate({
                                templateId: selectedTemplate!,
                                questionText: newQuestion.questionText,
                                questionType: newQuestion.questionType,
                                isRequired: newQuestion.isRequired,
                                sortOrder: newQuestion.sortOrder,
                                options: opts.length > 0 ? opts : undefined,
                              });
                            }} disabled={addQuestion.isPending}>
                              {addQuestion.isPending ? "추가 중..." : "추가"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="space-y-3">
                      {templateDetail.data.questions?.map((q: any, i: number) => (
                        <div key={q.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <span className="text-xs font-mono text-muted-foreground mt-1">Q{i + 1}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{q.questionText}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{questionTypeLabels[q.questionType] || q.questionType}</Badge>
                              {q.isRequired ? <Badge variant="secondary" className="text-xs">필수</Badge> : null}
                            </div>
                            {q.options?.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {q.options.map((o: any) => (
                                  <span key={o.id} className="text-xs px-2 py-0.5 bg-background rounded border">{o.optionText}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteQuestion.mutate({ id: q.id })}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>왼쪽에서 템플릿을 선택하면 질문을 관리할 수 있습니다.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ===== 탭 2: AI 분석 리포트 ===== */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="number" placeholder="프로젝트 ID 입력"
              className="max-w-[200px]"
              onChange={e => setSelectedReportProject(parseInt(e.target.value) || 0)}
            />
            <Dialog open={showGenerateReport} onOpenChange={setShowGenerateReport}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Zap className="w-4 h-4" />AI 리포트 생성</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>AI 분석 리포트 생성</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input placeholder="프로젝트 ID" type="number" onChange={e => setGenerateReportData(d => ({ ...d, clientProjectId: parseInt(e.target.value) || 0 }))} />
                  <Input placeholder="설문 인스턴스 ID" type="number" onChange={e => setGenerateReportData(d => ({ ...d, instanceId: parseInt(e.target.value) || 0 }))} />
                  <Button className="w-full" onClick={() => generateReport.mutate(generateReportData)} disabled={generateReport.isPending}>
                    {generateReport.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />분석 중...</> : "AI 분석 리포트 생성"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {selectedReportProject > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h2 className="font-semibold text-lg">리포트 목록</h2>
                {analysisReports.isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                ) : analysisReports.data?.length === 0 ? (
                  <Card><CardContent className="pt-6 text-center text-muted-foreground text-sm">리포트가 없습니다.</CardContent></Card>
                ) : (
                  analysisReports.data?.map((r: any) => (
                    <Card
                      key={r.id}
                      className={`cursor-pointer transition-colors hover:border-primary/50 ${selectedReportId === r.id ? "border-primary" : ""}`}
                      onClick={() => setSelectedReportId(r.id)}
                    >
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-sm">리포트 #{r.id}</h3>
                            <p className="text-xs text-muted-foreground mt-1">종합 점수: {r.overallScore}/100</p>
                            <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("ko-KR")}</p>
                          </div>
                          <BarChart3 className="w-5 h-5 text-purple-500" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              <div className="lg:col-span-2">
                {selectedReport.data ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-purple-500" />
                        AI 분석 리포트 #{selectedReport.data.id}
                      </CardTitle>
                      <CardDescription>
                        종합 점수: <span className="font-bold text-foreground">{reportAnalysis.overallScore}/100</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* 핵심 요약 */}
                      <div>
                        <h3 className="font-semibold text-sm mb-2">핵심 요약</h3>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">{reportAnalysis.executiveSummary}</p>
                      </div>

                      {/* 카테고리 점수 */}
                      {reportAnalysis.categoryScores && (
                        <div>
                          <h3 className="font-semibold text-sm mb-2">카테고리별 점수</h3>
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(reportAnalysis.categoryScores || {}).map(([key, val]: any) => (
                              <div key={key} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                                <span className="text-sm">{key}</span>
                                <Badge variant={val >= 70 ? "default" : val >= 50 ? "secondary" : "destructive"} className="text-xs">{val}점</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 문제점 */}
                      {reportAnalysis.painPoints && (
                        <div>
                          <h3 className="font-semibold text-sm mb-2">주요 문제점</h3>
                          <ul className="space-y-1">
                            {(reportAnalysis.painPoints || []).map((p: string, i: number) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />{p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 개선 권고 */}
                      {reportAnalysis.recommendations && (
                        <div>
                          <h3 className="font-semibold text-sm mb-2">개선 권고사항</h3>
                          <ul className="space-y-1">
                            {(reportAnalysis.recommendations || []).map((r: string, i: number) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 공간 니즈 */}
                      {reportAnalysis.spaceNeeds && (() => {
                        const needs = reportAnalysis.spaceNeeds || {};
                        return (
                          <div>
                            <h3 className="font-semibold text-sm mb-2">공간 니즈 분석</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <p className="text-2xl font-bold text-blue-600">{needs.estimatedArea || "-"}</p>
                                <p className="text-xs text-muted-foreground">필요 면적(평)</p>
                              </div>
                              <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-2xl font-bold text-green-600">{needs.meetingRooms || "-"}</p>
                                <p className="text-xs text-muted-foreground">회의실</p>
                              </div>
                              <div className="text-center p-3 bg-purple-50 rounded-lg">
                                <p className="text-2xl font-bold text-purple-600">{needs.focusZones || "-"}</p>
                                <p className="text-xs text-muted-foreground">집중 공간</p>
                              </div>
                              <div className="text-center p-3 bg-amber-50 rounded-lg">
                                <p className="text-2xl font-bold text-amber-600">{Object.keys(needs.departmentBreakdown || {}).length}</p>
                                <p className="text-xs text-muted-foreground">부서 수</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
                      <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>왼쪽에서 리포트를 선택하면 상세 내용을 확인할 수 있습니다.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {selectedReportProject === 0 && (
            <Card>
              <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>프로젝트 ID를 입력하면 해당 프로젝트의 분석 리포트를 확인할 수 있습니다.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== 탭 3: 전사 설문 관리 ===== */}
        <TabsContent value="company" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showCompanySurvey} onOpenChange={setShowCompanySurvey}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Users className="w-4 h-4" />전사 설문 발송</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>전사 설문 발송</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input placeholder="프로젝트 ID" type="number" onChange={e => setCompanySurveyData(d => ({ ...d, clientProjectId: parseInt(e.target.value) || 0 }))} />
                  <Select onValueChange={v => setCompanySurveyData(d => ({ ...d, templateId: parseInt(v) }))}>
                    <SelectTrigger><SelectValue placeholder="전사 설문 템플릿 선택" /></SelectTrigger>
                    <SelectContent>
                      {templates.data?.filter((t: any) => t.type === "company_wide").map((t: any) => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input placeholder="담당자 이름" onChange={e => setCompanySurveyData(d => ({ ...d, recipientName: e.target.value }))} />
                  <Input placeholder="담당자 이메일" type="email" onChange={e => setCompanySurveyData(d => ({ ...d, recipientEmail: e.target.value }))} />
                  <Textarea placeholder="커스텀 질문 (JSON, 선택사항)" value={companySurveyData.customQuestions} onChange={e => setCompanySurveyData(d => ({ ...d, customQuestions: e.target.value }))} rows={3} />
                  <Button className="w-full" onClick={() => createCompanySurveyInstance.mutate(companySurveyData)} disabled={createCompanySurveyInstance.isPending}>
                    {createCompanySurveyInstance.isPending ? "발송 중..." : "전사 설문 발송"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />전사 설문 프로세스
              </CardTitle>
              <CardDescription>1차 설문 분석 후, 담당자가 질문을 커스터마이징하여 전사 설문을 발송합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">1</div>
                    <h4 className="font-medium text-sm">질문 커스터마이징</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">1차 분석 결과를 바탕으로 담당자가 전사 설문 질문을 수정/추가/삭제합니다.</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm">2</div>
                    <h4 className="font-medium text-sm">AI 질문 재구성</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">수정 사항을 AI가 분석하여 최적화된 설문 질문으로 재구성합니다.</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-sm">3</div>
                    <h4 className="font-medium text-sm">전사 설문 발송</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">새 링크가 생성되어 전 직원에게 이메일로 발송됩니다.</p>
                </div>
              </div>

              {/* AI 질문 재구성 */}
              <div className="p-4 border-2 border-dashed border-purple-200 rounded-lg bg-purple-50/50">
                <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
                  <RefreshCw className="w-4 h-4 text-purple-500" />AI 질문 재구성
                </h4>
                <div className="flex gap-3">
                  <Select onValueChange={v => {}}>
                    <SelectTrigger className="max-w-[200px]"><SelectValue placeholder="템플릿 선택" /></SelectTrigger>
                    <SelectContent>
                      {templates.data?.map((t: any) => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea placeholder="수정 요청 사항 (예: '소통 관련 질문 추가', '5점 척도를 7점으로 변경')" className="flex-1" rows={2} />
                  <Button variant="outline" disabled={regenerateQuestions.isPending} className="gap-1">
                    {regenerateQuestions.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    재구성
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== 탭 4: 이메일 발송 로그 ===== */}
        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="number" placeholder="프로젝트 ID 입력"
              className="max-w-[200px]"
              onChange={e => setEmailLogProject(parseInt(e.target.value) || 0)}
            />
          </div>

          {emailLogProject > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-500" />발송 이력
                </CardTitle>
              </CardHeader>
              <CardContent>
                {emailLogs.isLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : emailLogs.data?.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">발송 이력이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {emailLogs.data?.map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{log.recipientName} ({log.recipientEmail})</p>
                            <p className="text-xs text-muted-foreground">{log.subject}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={log.status === "sent" ? "default" : log.status === "failed" ? "destructive" : "secondary"} className="text-xs">
                            {log.status === "sent" ? "발송됨" : log.status === "failed" ? "실패" : log.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleDateString("ko-KR")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>프로젝트 ID를 입력하면 이메일 발송 이력을 확인할 수 있습니다.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
