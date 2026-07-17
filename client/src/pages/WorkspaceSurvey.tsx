/**
 * 업무 환경 서베이 — 담당자 설문 페이지
 * 홈페이지에서 진입, 로그인 없이 세션 기반으로 진행
 * 토스 스타일: 한 화면에 하나의 질문, 부드러운 전환
 */
import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  ArrowRight, ArrowLeft, Building2, Users, Briefcase,
  Palette, AlertTriangle, Clock, CheckCircle2, Loader2,
} from "lucide-react";
import Logo from "@/components/Logo";

// 세션 ID 생성/관리
function getOrCreateSessionId(): string {
  const key = "gogamdo_journey_session";
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID().replace(/-/g, "").slice(0, 32) + Date.now().toString(36);
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
}

type StepId =
  | "company_info"
  | "employee_count"
  | "office_size"
  | "work_style"
  | "remote_ratio"
  | "meeting_frequency"
  | "pain_points"
  | "desired_spaces"
  | "design_style"
  | "budget"
  | "priority"
  | "timeline"
  | "additional";

interface SurveyData {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  employeeCount: number | null;
  officeSizePyeong: number | null;
  workStyle: string;
  remoteWorkRatio: number;
  meetingFrequency: string;
  painPoints: string[];
  desiredSpaces: string[];
  designStyle: string;
  budgetRange: string;
  priority: string;
  timelineUrgency: string;
  additionalNotes: string;
}

const PAIN_POINT_OPTIONS = [
  "소음이 심해 집중이 어렵다",
  "회의실이 부족하다",
  "수납공간이 부족하다",
  "조명이 어둡거나 눈이 피로하다",
  "냉난방이 불균형하다",
  "동선이 비효율적이다",
  "프라이버시가 부족하다",
  "브랜드 이미지와 맞지 않는다",
  "노후화되어 리뉴얼이 필요하다",
  "확장/축소가 필요하다",
];

const DESIRED_SPACE_OPTIONS = [
  "집중 업무실 (포커스룸)",
  "개방형 협업 공간",
  "화상회의 전용 부스",
  "휴게 라운지",
  "카페테리아/주방",
  "수면실/명상실",
  "피트니스 공간",
  "라이브러리",
  "대형 세미나실",
  "고객 접견실",
  "사내 카페",
  "옥외 테라스",
];

const DESIGN_STYLES = [
  { value: "modern", label: "모던", desc: "깔끔한 직선, 무채색 기반" },
  { value: "minimal", label: "미니멀", desc: "최소한의 요소, 여백 활용" },
  { value: "warm", label: "따뜻한", desc: "우드톤, 따뜻한 조명" },
  { value: "industrial", label: "인더스트리얼", desc: "노출 콘크리트, 메탈" },
  { value: "natural", label: "내추럴", desc: "자연 소재, 식물 인테리어" },
  { value: "luxury", label: "럭셔리", desc: "고급 마감재, 세련된 디테일" },
  { value: "creative", label: "크리에이티브", desc: "컬러풀, 자유로운 구성" },
];

const BUDGET_OPTIONS = [
  { value: "under_50m", label: "5천만원 미만" },
  { value: "50m_100m", label: "5천만원 ~ 1억원" },
  { value: "100m_300m", label: "1억원 ~ 3억원" },
  { value: "300m_500m", label: "3억원 ~ 5억원" },
  { value: "over_500m", label: "5억원 이상" },
  { value: "undecided", label: "아직 미정" },
];

const PRIORITY_OPTIONS = [
  { value: "design", label: "디자인 퀄리티", desc: "브랜드 이미지와 심미성 우선" },
  { value: "functionality", label: "기능성", desc: "업무 효율과 실용성 우선" },
  { value: "cost", label: "비용 절감", desc: "예산 내 최대 효과" },
  { value: "balanced", label: "균형", desc: "디자인·기능·비용 모두 고려" },
];

const TIMELINE_OPTIONS = [
  { value: "urgent", label: "긴급 (1개월 내)", desc: "빠른 착공 필요" },
  { value: "within_3months", label: "3개월 내", desc: "비교적 빠른 진행" },
  { value: "within_6months", label: "6개월 내", desc: "충분한 기획 시간" },
  { value: "flexible", label: "여유 있음", desc: "시간 제약 없음" },
];

export default function WorkspaceSurvey() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionId] = useState(getOrCreateSessionId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<SurveyData>({
    companyName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    employeeCount: null,
    officeSizePyeong: null,
    workStyle: "",
    remoteWorkRatio: 20,
    meetingFrequency: "",
    painPoints: [],
    desiredSpaces: [],
    designStyle: "",
    budgetRange: "",
    priority: "",
    timelineUrgency: "",
    additionalNotes: "",
  });

  const submitSurvey = trpc.workspaceJourney.submitSurvey.useMutation({
    onSuccess: () => {
      navigate("/survey/floor-plan");
    },
    onError: (e) => {
      toast.error(e.message || "설문 저장에 실패했습니다.");
      setIsSubmitting(false);
    },
  });

  const steps: { id: StepId; title: string; subtitle?: string }[] = [
    { id: "company_info", title: "회사 정보를 알려주세요", subtitle: "맞춤형 공간 솔루션을 위해 기본 정보가 필요합니다" },
    { id: "employee_count", title: "직원 수는 몇 명인가요?", subtitle: "공간 규모 산정의 기초 데이터입니다" },
    { id: "office_size", title: "현재 사무실 면적은?", subtitle: "평수 기준으로 입력해주세요 (모르시면 건너뛰어도 됩니다)" },
    { id: "work_style", title: "우리 팀의 업무 스타일은?", subtitle: "공간 배치의 핵심 기준이 됩니다" },
    { id: "remote_ratio", title: "재택근무 비율은?", subtitle: "좌석 배치와 공용 공간 비율에 영향을 줍니다" },
    { id: "meeting_frequency", title: "회의는 얼마나 자주 하나요?", subtitle: "회의실 수와 규모를 결정합니다" },
    { id: "pain_points", title: "현재 사무실의 불편한 점은?", subtitle: "여러 개 선택 가능합니다" },
    { id: "desired_spaces", title: "어떤 공간이 있으면 좋겠나요?", subtitle: "여러 개 선택 가능합니다" },
    { id: "design_style", title: "선호하는 디자인 스타일은?", subtitle: "브랜드와 문화에 맞는 스타일을 선택해주세요" },
    { id: "budget", title: "예상 예산 범위는?", subtitle: "정확하지 않아도 괜찮습니다" },
    { id: "priority", title: "가장 중요하게 생각하는 것은?", subtitle: "설계 방향의 우선순위를 결정합니다" },
    { id: "timeline", title: "언제까지 완료되면 좋겠나요?", subtitle: "프로젝트 일정 계획에 활용됩니다" },
    { id: "additional", title: "추가로 전달할 내용이 있나요?", subtitle: "자유롭게 작성해주세요 (선택사항)" },
  ];

  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const canProceed = useCallback((): boolean => {
    const step = steps[currentStep];
    switch (step.id) {
      case "company_info":
        return data.companyName.trim().length > 0 && data.contactName.trim().length > 0 && data.contactEmail.trim().length > 0;
      case "employee_count":
        return data.employeeCount !== null && data.employeeCount > 0;
      case "office_size":
        return true; // optional
      case "work_style":
        return data.workStyle !== "";
      case "remote_ratio":
        return true; // slider always has value
      case "meeting_frequency":
        return data.meetingFrequency !== "";
      case "pain_points":
        return data.painPoints.length > 0;
      case "desired_spaces":
        return data.desiredSpaces.length > 0;
      case "design_style":
        return data.designStyle !== "";
      case "budget":
        return data.budgetRange !== "";
      case "priority":
        return data.priority !== "";
      case "timeline":
        return data.timelineUrgency !== "";
      case "additional":
        return true; // optional
      default:
        return true;
    }
  }, [currentStep, data]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    submitSurvey.mutate({
      sessionId,
      ...data,
      employeeCount: data.employeeCount || 0,
      officeSizePyeong: data.officeSizePyeong || 0,
    } as any);
  };

  const toggleArrayItem = (arr: string[], item: string): string[] => {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && canProceed()) {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, canProceed]);

  const renderStep = () => {
    const step = steps[currentStep];
    switch (step.id) {
      case "company_info":
        return (
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-ink/70 mb-1.5 block">회사명 *</label>
              <Input
                value={data.companyName}
                onChange={(e) => setData({ ...data, companyName: e.target.value })}
                placeholder="예: (주)고감도"
                className="h-12 text-base"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink/70 mb-1.5 block">담당자 성함 *</label>
              <Input
                value={data.contactName}
                onChange={(e) => setData({ ...data, contactName: e.target.value })}
                placeholder="예: 김기호"
                className="h-12 text-base"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink/70 mb-1.5 block">이메일 *</label>
              <Input
                type="email"
                value={data.contactEmail}
                onChange={(e) => setData({ ...data, contactEmail: e.target.value })}
                placeholder="예: contact@company.com"
                className="h-12 text-base"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink/70 mb-1.5 block">연락처 (선택)</label>
              <Input
                value={data.contactPhone}
                onChange={(e) => setData({ ...data, contactPhone: e.target.value })}
                placeholder="예: 010-1234-5678"
                className="h-12 text-base"
              />
            </div>
          </div>
        );

      case "employee_count":
        return (
          <div className="space-y-4">
            <Input
              type="number"
              value={data.employeeCount || ""}
              onChange={(e) => setData({ ...data, employeeCount: parseInt(e.target.value) || null })}
              placeholder="숫자만 입력"
              className="h-14 text-2xl text-center font-semibold"
              autoFocus
            />
            <p className="text-sm text-ink/50 text-center">명</p>
          </div>
        );

      case "office_size":
        return (
          <div className="space-y-4">
            <Input
              type="number"
              value={data.officeSizePyeong || ""}
              onChange={(e) => setData({ ...data, officeSizePyeong: parseInt(e.target.value) || null })}
              placeholder="숫자만 입력"
              className="h-14 text-2xl text-center font-semibold"
              autoFocus
            />
            <p className="text-sm text-ink/50 text-center">평 (모르시면 비워두셔도 됩니다)</p>
          </div>
        );

      case "work_style":
        return (
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "collaborative", label: "협업 중심", icon: <Users className="w-5 h-5" /> },
              { value: "focused", label: "집중 업무", icon: <Briefcase className="w-5 h-5" /> },
              { value: "hybrid", label: "하이브리드", icon: <Building2 className="w-5 h-5" /> },
              { value: "flexible", label: "유연 근무", icon: <Clock className="w-5 h-5" /> },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setData({ ...data, workStyle: opt.value })}
                className={`p-5 rounded-xl border-2 transition-all text-left ${
                  data.workStyle === opt.value
                    ? "border-gold bg-gold/5 shadow-sm"
                    : "border-border hover:border-gold/40"
                }`}
              >
                <div className={`mb-2 ${data.workStyle === opt.value ? "text-gold" : "text-ink/40"}`}>
                  {opt.icon}
                </div>
                <span className="font-medium text-sm">{opt.label}</span>
              </button>
            ))}
          </div>
        );

      case "remote_ratio":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <span className="text-5xl font-bold text-ink">{data.remoteWorkRatio}</span>
              <span className="text-2xl text-ink/50 ml-1">%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={data.remoteWorkRatio}
              onChange={(e) => setData({ ...data, remoteWorkRatio: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gold"
            />
            <div className="flex justify-between text-xs text-ink/40">
              <span>전원 출근</span>
              <span>완전 재택</span>
            </div>
          </div>
        );

      case "meeting_frequency":
        return (
          <div className="space-y-3">
            {[
              { value: "rarely", label: "거의 없음", desc: "주 1회 미만" },
              { value: "few_weekly", label: "주 2~3회", desc: "적당한 빈도" },
              { value: "daily", label: "매일", desc: "일일 스탠드업 등" },
              { value: "very_frequent", label: "매우 빈번", desc: "하루 3회 이상" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setData({ ...data, meetingFrequency: opt.value })}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left flex justify-between items-center ${
                  data.meetingFrequency === opt.value
                    ? "border-gold bg-gold/5"
                    : "border-border hover:border-gold/40"
                }`}
              >
                <span className="font-medium">{opt.label}</span>
                <span className="text-sm text-ink/40">{opt.desc}</span>
              </button>
            ))}
          </div>
        );

      case "pain_points":
        return (
          <div className="space-y-2">
            {PAIN_POINT_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setData({ ...data, painPoints: toggleArrayItem(data.painPoints, opt) })}
                className={`w-full p-3.5 rounded-lg border transition-all text-left text-sm ${
                  data.painPoints.includes(opt)
                    ? "border-gold bg-gold/10 text-ink font-medium"
                    : "border-border hover:border-gold/40 text-ink/70"
                }`}
              >
                {data.painPoints.includes(opt) && <CheckCircle2 className="w-4 h-4 inline mr-2 text-gold" />}
                {opt}
              </button>
            ))}
          </div>
        );

      case "desired_spaces":
        return (
          <div className="grid grid-cols-2 gap-2">
            {DESIRED_SPACE_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setData({ ...data, desiredSpaces: toggleArrayItem(data.desiredSpaces, opt) })}
                className={`p-3 rounded-lg border transition-all text-left text-sm ${
                  data.desiredSpaces.includes(opt)
                    ? "border-gold bg-gold/10 font-medium"
                    : "border-border hover:border-gold/40 text-ink/70"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        );

      case "design_style":
        return (
          <div className="space-y-3">
            {DESIGN_STYLES.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setData({ ...data, designStyle: opt.value })}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  data.designStyle === opt.value
                    ? "border-gold bg-gold/5"
                    : "border-border hover:border-gold/40"
                }`}
              >
                <div className="font-medium">{opt.label}</div>
                <div className="text-sm text-ink/50 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        );

      case "budget":
        return (
          <div className="space-y-3">
            {BUDGET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setData({ ...data, budgetRange: opt.value })}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  data.budgetRange === opt.value
                    ? "border-gold bg-gold/5"
                    : "border-border hover:border-gold/40"
                }`}
              >
                <span className="font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        );

      case "priority":
        return (
          <div className="space-y-3">
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setData({ ...data, priority: opt.value })}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  data.priority === opt.value
                    ? "border-gold bg-gold/5"
                    : "border-border hover:border-gold/40"
                }`}
              >
                <div className="font-medium">{opt.label}</div>
                <div className="text-sm text-ink/50 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        );

      case "timeline":
        return (
          <div className="space-y-3">
            {TIMELINE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setData({ ...data, timelineUrgency: opt.value })}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  data.timelineUrgency === opt.value
                    ? "border-gold bg-gold/5"
                    : "border-border hover:border-gold/40"
                }`}
              >
                <div className="font-medium">{opt.label}</div>
                <div className="text-sm text-ink/50 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        );

      case "additional":
        return (
          <Textarea
            value={data.additionalNotes}
            onChange={(e) => setData({ ...data, additionalNotes: e.target.value })}
            placeholder="특별히 고려해야 할 사항, 참고 이미지, 벤치마킹 사례 등 자유롭게 작성해주세요..."
            className="min-h-[150px] text-base"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Logo className="h-6" />
          <span className="text-xs text-ink/40 font-medium">
            {currentStep + 1} / {totalSteps}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-gray-100">
          <div
            className="h-full bg-gold transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 pt-10 pb-32">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-ink leading-tight">
            {steps[currentStep].title}
          </h1>
          {steps[currentStep].subtitle && (
            <p className="text-sm text-ink/50 mt-2">{steps[currentStep].subtitle}</p>
          )}
        </div>

        <div className="flex-1">{renderStep()}</div>
      </main>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border/50 p-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="h-12 px-5"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              이전
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className="flex-1 h-12 bg-gold hover:bg-gold/90 text-ink font-semibold"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : currentStep === totalSteps - 1 ? (
              <>
                설문 완료
                <CheckCircle2 className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                다음
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}
