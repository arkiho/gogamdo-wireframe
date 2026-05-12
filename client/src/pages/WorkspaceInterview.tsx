/**
 * 전사 인터뷰 설문 페이지
 * - 토큰 기반 공개 접근 (companySurveyToken)
 * - AI가 생성한 질문을 직원들이 응답
 * - 토스 스타일 한 질문씩 진행
 */
import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ChevronRight, ChevronLeft, Building2 } from "lucide-react";

interface InterviewQuestion {
  id: number;
  category: string;
  question: string;
  questionType: "text" | "single_choice" | "multiple_choice" | "scale";
  options: string[];
}

export default function WorkspaceInterview() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token") || "";

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [respondentName, setRespondentName] = useState("");
  const [respondentDept, setRespondentDept] = useState("");
  const [showIntro, setShowIntro] = useState(true);

  // 보고서 데이터 로드 (토큰 기반)
  const { data: report, isLoading, error } = trpc.workspaceJourney.getReport.useQuery(
    { token },
    { enabled: !!token }
  );

  const submitMutation = trpc.workspaceJourney.submitInterviewResponse.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md text-center">
          <p className="text-red-500 font-medium">유효하지 않은 링크입니다.</p>
          <p className="text-sm text-muted-foreground mt-2">담당자에게 올바른 설문 링크를 요청해주세요.</p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-muted-foreground">설문을 불러오는 중...</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md text-center">
          <p className="text-red-500 font-medium">설문을 찾을 수 없습니다.</p>
          <p className="text-sm text-muted-foreground mt-2">링크가 만료되었거나 존재하지 않습니다.</p>
        </Card>
      </div>
    );
  }

  const questions: InterviewQuestion[] = (report.interviewQuestions as InterviewQuestion[]) || [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIdx];
  const progress = totalQuestions > 0 ? ((currentIdx + 1) / totalQuestions) * 100 : 0;

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
        <Card className="p-10 max-w-md text-center shadow-lg">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">설문 완료</h2>
          <p className="text-muted-foreground">
            소중한 의견 감사합니다. 응답 내용은 업무환경 개선에 활용됩니다.
          </p>
        </Card>
      </div>
    );
  }

  // 인트로 화면
  if (showIntro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white px-4">
        <Card className="p-8 max-w-lg w-full shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-8 h-8 text-amber-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{report.companyName}</h1>
              <p className="text-sm text-muted-foreground">업무환경 인터뷰</p>
            </div>
          </div>

          <p className="text-gray-700 leading-relaxed mb-6">
            안녕하세요. {report.companyName}의 업무환경 개선을 위한 설문입니다.
            총 <strong>{totalQuestions}개</strong>의 질문이 있으며, 약 <strong>5~10분</strong> 소요됩니다.
            솔직한 답변이 더 나은 업무환경을 만드는 데 큰 도움이 됩니다.
          </p>

          <div className="space-y-3 mb-6">
            <div>
              <Label className="text-sm font-medium">이름 (선택)</Label>
              <input
                type="text"
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                placeholder="홍길동"
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">부서 (선택)</Label>
              <input
                type="text"
                value={respondentDept}
                onChange={(e) => setRespondentDept(e.target.value)}
                placeholder="마케팅팀"
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <Button
            onClick={() => setShowIntro(false)}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
          >
            설문 시작하기
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Card>
      </div>
    );
  }

  // 답변 저장
  function setAnswer(value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  }

  function handleNext() {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // 마지막 질문 → 제출
      submitMutation.mutate({
        token,
        respondentName: respondentName || "익명",
        respondentDept: respondentDept || "미입력",
        answers: Object.entries(answers).map(([qId, answer]) => ({
          questionId: Number(qId),
          answer: Array.isArray(answer) ? answer.join(", ") : answer,
        })),
      });
    }
  }

  function handlePrev() {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  }

  const currentAnswer = answers[currentQuestion?.id];
  const hasAnswer = currentAnswer && (Array.isArray(currentAnswer) ? currentAnswer.length > 0 : currentAnswer.trim() !== "");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex flex-col">
      {/* 상단 프로그레스 */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b z-10 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              {currentQuestion?.category}
            </span>
            <span className="text-xs text-muted-foreground">
              {currentIdx + 1} / {totalQuestions}
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      {/* 질문 영역 */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-lg w-full">
          <h2 className="text-xl font-bold text-gray-900 mb-6 leading-relaxed">
            {currentQuestion?.question}
          </h2>

          {/* 질문 유형별 입력 UI */}
          {currentQuestion?.questionType === "text" && (
            <Textarea
              value={(currentAnswer as string) || ""}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="자유롭게 작성해주세요..."
              className="min-h-[120px] text-base"
            />
          )}

          {currentQuestion?.questionType === "single_choice" && (
            <RadioGroup
              value={(currentAnswer as string) || ""}
              onValueChange={(val) => setAnswer(val)}
              className="space-y-3"
            >
              {currentQuestion.options.map((opt, i) => (
                <label
                  key={i}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                    currentAnswer === opt
                      ? "border-amber-500 bg-amber-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <RadioGroupItem value={opt} id={`opt-${i}`} />
                  <Label htmlFor={`opt-${i}`} className="text-base cursor-pointer flex-1">
                    {opt}
                  </Label>
                </label>
              ))}
            </RadioGroup>
          )}

          {currentQuestion?.questionType === "multiple_choice" && (
            <div className="space-y-3">
              {currentQuestion.options.map((opt, i) => {
                const selected = Array.isArray(currentAnswer) && currentAnswer.includes(opt);
                return (
                  <label
                    key={i}
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                      selected
                        ? "border-amber-500 bg-amber-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Checkbox
                      checked={selected}
                      onCheckedChange={(checked) => {
                        const prev = (currentAnswer as string[]) || [];
                        if (checked) {
                          setAnswer([...prev, opt]);
                        } else {
                          setAnswer(prev.filter((v) => v !== opt));
                        }
                      }}
                    />
                    <span className="text-base">{opt}</span>
                  </label>
                );
              })}
            </div>
          )}

          {currentQuestion?.questionType === "scale" && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>매우 불만족</span>
                <span>매우 만족</span>
              </div>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setAnswer(String(n))}
                    className={`w-14 h-14 rounded-full text-lg font-bold transition-all ${
                      currentAnswer === String(n)
                        ? "bg-amber-500 text-white scale-110"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="sticky bottom-0 bg-white border-t px-4 py-4">
        <div className="max-w-lg mx-auto flex gap-3">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            이전
          </Button>
          <Button
            onClick={handleNext}
            disabled={!hasAnswer}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
          >
            {currentIdx === totalQuestions - 1 ? "제출하기" : "다음"}
            {currentIdx < totalQuestions - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
