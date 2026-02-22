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
import { toast } from "sonner";
import {
  FileText, Plus, Send, BarChart3, Mail, Eye, Trash2, Edit, RefreshCw,
  ClipboardList, Users, CheckCircle2, Clock, AlertCircle
} from "lucide-react";

export default function AdminSurveyAutomation() {
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showTriggerSurvey, setShowTriggerSurvey] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: "", description: "", type: "initial_contact" as const });
  const [triggerData, setTriggerData] = useState({ clientProjectId: 0, recipientEmail: "", recipientName: "", templateId: 0 });
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ questionText: "", questionType: "single_choice" as const, isRequired: 1, sortOrder: 0, options: "" });

  const templates = trpc.surveyAuto.listTemplates.useQuery(undefined, { enabled: !!user });
  const templateDetail = trpc.surveyAuto.getTemplate.useQuery(
    { id: selectedTemplate! },
    { enabled: !!selectedTemplate }
  );

  const createTemplate = trpc.surveyAuto.createTemplate.useMutation({
    onSuccess: () => { templates.refetch(); setShowCreateTemplate(false); toast.success("템플릿이 생성되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const triggerSurvey = trpc.surveyAuto.triggerInitialSurvey.useMutation({
    onSuccess: (data) => { setShowTriggerSurvey(false); toast.success(`설문이 발송되었습니다. (토큰: ${data.token.slice(0, 8)}...)`); },
    onError: (e) => toast.error(e.message),
  });

  const addQuestion = trpc.surveyAuto.addQuestion.useMutation({
    onSuccess: () => { templateDetail.refetch(); setShowAddQuestion(false); toast.success("질문이 추가되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const deleteQuestion = trpc.surveyAuto.deleteQuestion.useMutation({
    onSuccess: () => { templateDetail.refetch(); toast.success("질문이 삭제되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const typeLabels: Record<string, string> = {
    initial_contact: "1차 상담 설문",
    company_wide: "전사 설문",
    post_occupancy: "입주 후 만족도",
    satisfaction: "고객 만족도",
  };

  const questionTypeLabels: Record<string, string> = {
    text: "단답형",
    textarea: "장문형",
    single_choice: "단일 선택",
    multiple_choice: "다중 선택",
    scale: "척도",
    number: "숫자",
  };

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
              <Button className="gap-2"><Send className="w-4 h-4" />설문 발송</Button>
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
                    {templates.data?.map(t => (
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

      {/* 템플릿 목록 + 상세 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 템플릿 목록 */}
        <div className="space-y-3">
          <h2 className="font-semibold text-lg">설문 템플릿</h2>
          {templates.isLoading ? (
            <p className="text-muted-foreground text-sm">로딩 중...</p>
          ) : templates.data?.length === 0 ? (
            <Card><CardContent className="pt-6 text-center text-muted-foreground text-sm">템플릿이 없습니다. 새로 생성해 주세요.</CardContent></Card>
          ) : (
            templates.data?.map(t => (
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

        {/* 오른쪽: 템플릿 상세 + 질문 관리 */}
        <div className="lg:col-span-2 space-y-4">
          {selectedTemplate && templateDetail.data ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{templateDetail.data.name}</CardTitle>
                  <CardDescription>{templateDetail.data.description || "설명 없음"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">
                      질문 {templateDetail.data.questions?.length || 0}개
                    </span>
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
                        <Button
                          size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                          onClick={() => deleteQuestion.mutate({ id: q.id })}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
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
    </div>
  );
}
