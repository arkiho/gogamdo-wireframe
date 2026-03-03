import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, ClipboardList, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { useRoute } from "wouter";

export default function SurveyResponse() {
  const [, params] = useRoute("/survey-response/:token");
  const token = params?.token || "";
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [respondentInfo, setRespondentInfo] = useState({ name: "", email: "", department: "" });

  const survey = trpc.surveyAuto.getSurveyByToken.useQuery({ token }, { enabled: !!token, retry: false });
  const submitResponse = trpc.surveyAuto.submitSurveyResponse.useMutation({
    onSuccess: () => { setSubmitted(true); toast.success("설문이 제출되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const questions = survey.data?.questions || [];
  const totalSteps = questions.length + 1; // +1 for respondent info

  if (survey.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (survey.error || !survey.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-lg font-semibold mb-2">설문을 찾을 수 없습니다</h2>
            <p className="text-sm text-muted-foreground">유효하지 않은 링크이거나 만료된 설문입니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* 완료 메시지 */}
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-xl font-bold mb-2">설문이 완료되었습니다</h2>
              <p className="text-sm text-muted-foreground">
                소중한 의견 감사합니다. 분석 결과는 담당자에게 공유됩니다.
              </p>
            </CardContent>
          </Card>

          {/* AI 분석 결과 미리보기 + 회원가입 유도 */}
          <Card className="relative overflow-hidden">
            <CardContent className="pt-6 pb-8 space-y-4">
              <h3 className="text-center font-semibold text-lg">AI 업무환경 분석 결과</h3>
              <div className="relative">
                {/* 블러 처리된 미리보기 */}
                <div className="space-y-3 filter blur-sm select-none pointer-events-none">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">종합 점수</p>
                      <p className="text-xl font-bold">72/100</p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">공간 활용도</p>
                      <p className="text-xl font-bold">65/100</p>
                    </div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">주요 개선 영역</p>
                    <ul className="text-sm space-y-0.5">
                      <li>• 소음 환경 개선 필요</li>
                      <li>• 집중 업무 공간 부족</li>
                      <li>• 협업 공간 확충 권장</li>
                    </ul>
                  </div>
                </div>

                {/* 오버레이 - 회원가입 유도 */}
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
                  <div className="text-center space-y-3 p-4">
                    <h4 className="font-semibold">전체 분석 결과를 확인하세요</h4>
                    <p className="text-sm text-muted-foreground">
                      상세 보고서, 공간 설계 제안, 예상 비용 분석 등<br />
                      전체 자료를 고감도 고객 포털에서 확인하세요.
                    </p>
                    <div className="flex flex-col gap-2">
                      <a
                        href="/client/register"
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-md hover:opacity-90 transition-opacity"
                      >
                        무료 회원가입하고 확인하기
                      </a>
                      <a
                        href="/client/login"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        이미 계정이 있으신가요? 로그인
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    const answersObj = Object.fromEntries(
      Object.entries(answers).map(([qId, value]) => [qId, value])
    );
    submitResponse.mutate({
      token,
      respondentName: respondentInfo.name,
      respondentEmail: respondentInfo.email,
      respondentDepartment: respondentInfo.department,
      answers: JSON.stringify(answersObj),
    });
  };

  const renderQuestion = (q: any, index: number) => {
    const value = answers[q.id] || "";

    return (
      <div className="space-y-4">
        <div className="flex items-start gap-2">
          <span className="text-sm font-mono text-muted-foreground mt-0.5">Q{index + 1}.</span>
          <div>
            <p className="font-medium">{q.questionText}</p>
            {q.isRequired ? <Badge variant="secondary" className="text-xs mt-1">필수</Badge> : null}
          </div>
        </div>

        {q.questionType === "text" && (
          <Input
            value={value}
            onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
            placeholder="답변을 입력하세요"
          />
        )}

        {q.questionType === "textarea" && (
          <Textarea
            value={value}
            onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
            placeholder="답변을 입력하세요"
            rows={4}
          />
        )}

        {q.questionType === "number" && (
          <Input
            type="number"
            value={value}
            onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
            placeholder="숫자를 입력하세요"
          />
        )}

        {q.questionType === "single_choice" && q.options?.length > 0 && (
          <RadioGroup value={value} onValueChange={v => setAnswers(a => ({ ...a, [q.id]: v }))}>
            {q.options.map((o: any) => (
              <div key={o.id} className="flex items-center space-x-2">
                <RadioGroupItem value={o.optionValue} id={`q${q.id}-o${o.id}`} />
                <Label htmlFor={`q${q.id}-o${o.id}`}>{o.optionText}</Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {q.questionType === "multiple_choice" && q.options?.length > 0 && (
          <div className="space-y-2">
            {q.options.map((o: any) => {
              const selected = value.split(",").filter(Boolean);
              const isChecked = selected.includes(o.optionValue);
              return (
                <div key={o.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`q${q.id}-o${o.id}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const newSelected = checked
                        ? [...selected, o.optionValue]
                        : selected.filter(v => v !== o.optionValue);
                      setAnswers(a => ({ ...a, [q.id]: newSelected.join(",") }));
                    }}
                  />
                  <Label htmlFor={`q${q.id}-o${o.id}`}>{o.optionText}</Label>
                </div>
              );
            })}
          </div>
        )}

        {q.questionType === "scale" && (
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <Button
                key={n}
                variant={value === String(n) ? "default" : "outline"}
                size="sm"
                className="w-10 h-10"
                onClick={() => setAnswers(a => ({ ...a, [q.id]: String(n) }))}
              >
                {n}
              </Button>
            ))}
            <span className="text-xs text-muted-foreground ml-2">1=매우 불만족 ~ 5=매우 만족</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold font-heading">{"업무환경 설문조사"}</h1>
          <p className="text-muted-foreground mt-2">고감도 공간 컨설팅을 위한 설문입니다.</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="h-1 bg-muted rounded-full flex-1 max-w-xs">
              <div
                className="h-1 bg-primary rounded-full transition-all"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{currentStep + 1} / {totalSteps}</span>
          </div>
        </div>

        {/* 응답자 정보 (첫 번째 스텝) */}
        {currentStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">응답자 정보</CardTitle>
              <CardDescription>설문 응답을 위한 기본 정보를 입력해 주세요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>이름 *</Label>
                <Input value={respondentInfo.name} onChange={e => setRespondentInfo(r => ({ ...r, name: e.target.value }))} placeholder="홍길동" />
              </div>
              <div>
                <Label>이메일 *</Label>
                <Input type="email" value={respondentInfo.email} onChange={e => setRespondentInfo(r => ({ ...r, email: e.target.value }))} placeholder="hong@company.com" />
              </div>
              <div>
                <Label>부서</Label>
                <Input value={respondentInfo.department} onChange={e => setRespondentInfo(r => ({ ...r, department: e.target.value }))} placeholder="경영지원팀" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* 질문 (나머지 스텝) */}
        {currentStep > 0 && currentStep <= questions.length && (
          <Card>
            <CardContent className="pt-6">
              {renderQuestion(questions[currentStep - 1], currentStep - 1)}
            </CardContent>
          </Card>
        )}

        {/* 네비게이션 */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
            disabled={currentStep === 0}
            className="gap-1"
          >
            <ArrowLeft className="w-4 h-4" />이전
          </Button>

          {currentStep < totalSteps - 1 ? (
            <Button
              onClick={() => setCurrentStep(s => s + 1)}
              disabled={currentStep === 0 && (!respondentInfo.name || !respondentInfo.email)}
              className="gap-1"
            >
              다음<ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitResponse.isPending} className="gap-1">
              {submitResponse.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              제출하기
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
