import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { trackEvent } from "@/lib/analytics";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  Sparkles, ArrowRight, ArrowLeft, Palette, Building2,
  Users, Heart, Wallet, CheckCircle2, Loader2,
  Lightbulb, Sofa, PaintBucket, LayoutGrid, CircleDollarSign,
} from "lucide-react";

const STEPS = [
  { id: "industry", title: "업종", icon: <Building2 className="w-5 h-5" /> },
  { id: "teamSize", title: "인원", icon: <Users className="w-5 h-5" /> },
  { id: "mood", title: "분위기", icon: <Heart className="w-5 h-5" /> },
  { id: "budget", title: "예산", icon: <Wallet className="w-5 h-5" /> },
  { id: "priorities", title: "우선순위", icon: <CheckCircle2 className="w-5 h-5" /> },
];

const INDUSTRIES = [
  "IT / 스타트업", "금융 / 보험", "법률 / 회계", "디자인 / 광고",
  "제조 / 물류", "교육 / 학원", "의료 / 클리닉", "부동산 / 건설",
  "미디어 / 엔터", "기타",
];

const TEAM_SIZES = [
  "1~5명 (소규모)", "6~15명 (중소규모)", "16~30명 (중규모)",
  "31~50명 (중대규모)", "51~100명 (대규모)", "100명 이상",
];

const MOODS = [
  { name: "모던 미니멀", desc: "깔끔하고 절제된 디자인", color: "#E8E8E8" },
  { name: "내추럴 워크", desc: "자연 소재와 따뜻한 톤", color: "#D4C5A9" },
  { name: "인더스트리얼", desc: "노출 콘크리트, 메탈 소재", color: "#8B8B8B" },
  { name: "스칸디나비안", desc: "밝고 기능적인 북유럽 스타일", color: "#F5F0E8" },
  { name: "럭셔리 클래식", desc: "고급스럽고 격조 있는 공간", color: "#C8A96E" },
  { name: "크리에이티브", desc: "창의적이고 역동적인 분위기", color: "#FF6B6B" },
];

const BUDGETS = [
  "스탠다드 (평당 200~280만원)",
  "프리미엄 (평당 280~400만원)",
  "럭셔리 (평당 400~600만원+)",
  "아직 정하지 않았어요",
];

const PRIORITY_OPTIONS = [
  "직원 집중도 향상", "협업 공간 확보", "브랜드 이미지 강화",
  "수납 & 정리", "자연광 활용", "방음 & 프라이버시",
  "휴식 공간", "회의실 효율화", "친환경 소재",
];

type StyleResult = {
  styleName: string;
  description: string;
  colorPalette: Array<{ name: string; hex: string; usage: string }>;
  materials: string[];
  furniture: string[];
  lighting: string;
  layout: string;
  estimatedCostRange: string;
  tips: string[];
};

function generateSessionId() {
  return `style_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export default function AIStyle() {
  const [sessionId] = useState(generateSessionId);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    industry: "",
    teamSize: "",
    mood: "",
    budget: "",
    priorities: [] as string[],
    contactEmail: "",
  });
  const [result, setResult] = useState<{ recommendation: StyleResult; imageUrl: string | null } | null>(null);

  const recommendMutation = trpc.aiStyle.recommend.useMutation({
    onSuccess: (data) => {
      setResult(data as { recommendation: StyleResult; imageUrl: string | null });
      trackEvent("ai_style_result_received", { sessionId, style: (data as any).recommendation?.styleName });
    },
    onError: () => {
      toast.error("스타일 추천에 실패했습니다. 다시 시도해 주세요.");
    },
  });

  const isStepValid = useMemo(() => {
    switch (step) {
      case 0: return !!formData.industry;
      case 1: return !!formData.teamSize;
      case 2: return !!formData.mood;
      case 3: return !!formData.budget;
      case 4: return formData.priorities.length >= 1;
      default: return false;
    }
  }, [step, formData]);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      trackEvent("ai_style_step", { step: step + 1 });
    } else {
      // Submit
      recommendMutation.mutate({
        sessionId,
        industry: formData.industry,
        teamSize: formData.teamSize,
        mood: formData.mood,
        budget: formData.budget,
        priorities: formData.priorities,
        contactEmail: formData.contactEmail || undefined,
      });
      trackEvent("ai_style_submitted", { sessionId });
    }
  };

  const togglePriority = (p: string) => {
    setFormData(prev => ({
      ...prev,
      priorities: prev.priorities.includes(p)
        ? prev.priorities.filter(x => x !== p)
        : prev.priorities.length < 3
          ? [...prev.priorities, p]
          : prev.priorities,
    }));
  };

  // Result view
  if (result) {
    const rec = result.recommendation;
    return (
      <>
        <SEOHead
          title={`${rec.styleName} - AI 스타일 추천 결과 | 고감도`}
          description={rec.description}
        />

        {/* Result Hero */}
        <section className="pt-32 pb-12 lg:pt-40 lg:pb-16 bg-[#1A1A1A] text-white relative overflow-hidden">
          <div className="container relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 flex items-center justify-center bg-gold text-ink">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium tracking-widest uppercase text-gold">
                AI Style Recommendation
              </span>
            </div>
            <h1 className="font-heading text-3xl lg:text-5xl font-bold mb-2 leading-tight">
              {rec.styleName}
            </h1>
            <p className="text-white/60 max-w-xl leading-relaxed">
              {rec.description}
            </p>
          </div>
        </section>

        <section className="py-12 lg:py-20">
          <div className="container">
            <div className="grid lg:grid-cols-[1fr_400px] gap-10">
              {/* Left: Details */}
              <div className="space-y-10">
                {/* AI Generated Image */}
                {result.imageUrl && (
                  <div>
                    <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-gold" />
                      AI 생성 이미지
                    </h2>
                    <div className="rounded-lg overflow-hidden border">
                      <img
                        src={result.imageUrl}
                        alt={`${rec.styleName} 스타일 인테리어`}
                        className="w-full aspect-[16/10] object-cover"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      * AI가 생성한 참고 이미지입니다. 실제 시공 결과와 다를 수 있습니다.
                    </p>
                  </div>
                )}

                {/* Color Palette */}
                <div>
                  <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
                    <PaintBucket className="w-5 h-5 text-gold" />
                    컬러 팔레트
                  </h2>
                  <div className="grid grid-cols-5 gap-3">
                    {rec.colorPalette.map((color, i) => (
                      <div key={i} className="text-center">
                        <div
                          className="w-full aspect-square rounded-lg border shadow-sm mb-2"
                          style={{ backgroundColor: color.hex }}
                        />
                        <p className="text-xs font-medium">{color.name}</p>
                        <p className="text-[10px] text-muted-foreground">{color.hex}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{color.usage}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Layout */}
                <div>
                  <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-gold" />
                    공간 레이아웃 제안
                  </h2>
                  <div className="bg-card border rounded-lg p-6">
                    <p className="text-sm leading-relaxed text-muted-foreground">{rec.layout}</p>
                  </div>
                </div>

                {/* Tips */}
                <div>
                  <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-gold" />
                    인테리어 팁
                  </h2>
                  <div className="space-y-3">
                    {rec.tips.map((tip, i) => (
                      <div key={i} className="flex gap-3 p-4 bg-card border rounded-lg">
                        <span className="text-gold font-heading font-bold text-sm mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                        <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Sidebar */}
              <div className="space-y-6">
                {/* Materials */}
                <div className="bg-card border rounded-lg p-5">
                  <h3 className="font-heading font-semibold mb-3 flex items-center gap-2 text-sm">
                    <PaintBucket className="w-4 h-4 text-gold" />
                    추천 마감재
                  </h3>
                  <div className="space-y-2">
                    {rec.materials.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                        {m}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Furniture */}
                <div className="bg-card border rounded-lg p-5">
                  <h3 className="font-heading font-semibold mb-3 flex items-center gap-2 text-sm">
                    <Sofa className="w-4 h-4 text-gold" />
                    추천 가구 스타일
                  </h3>
                  <div className="space-y-2">
                    {rec.furniture.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lighting */}
                <div className="bg-card border rounded-lg p-5">
                  <h3 className="font-heading font-semibold mb-3 flex items-center gap-2 text-sm">
                    <Lightbulb className="w-4 h-4 text-gold" />
                    조명 추천
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{rec.lighting}</p>
                </div>

                {/* Cost */}
                <div className="bg-gold/5 border border-gold/20 rounded-lg p-5">
                  <h3 className="font-heading font-semibold mb-2 flex items-center gap-2 text-sm">
                    <CircleDollarSign className="w-4 h-4 text-gold" />
                    예상 비용 (평당)
                  </h3>
                  <p className="text-2xl font-heading font-bold text-gold">{rec.estimatedCostRange}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    * 정확한 견적은 현장 실측 후 산출됩니다.
                  </p>
                </div>

                {/* CTA */}
                <div className="space-y-3">
                  <Link href="/estimator">
                    <Button className="w-full bg-gold text-ink hover:bg-gold/90 h-11">
                      AI 예상 견적 받기
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="outline" className="w-full h-11">
                      무료 상담 신청
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setResult(null);
                      setStep(0);
                      setFormData({ industry: "", teamSize: "", mood: "", budget: "", priorities: [], contactEmail: "" });
                    }}
                  >
                    다시 추천받기
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  // Loading view
  if (recommendMutation.isPending) {
    return (
      <>
        <SEOHead title="AI 스타일 분석 중... | 고감도" description="AI가 최적의 인테리어 스타일을 분석하고 있습니다." />
        <section className="pt-32 pb-12 lg:pt-40 lg:pb-16 bg-[#1A1A1A] text-white">
          <div className="container">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 flex items-center justify-center bg-gold text-ink">
                <Palette className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium tracking-widest uppercase text-gold">
                Analyzing Your Style
              </span>
            </div>
            <h1 className="font-heading text-3xl lg:text-5xl font-bold mb-4 leading-tight">
              AI가 분석 중입니다
            </h1>
          </div>
        </section>
        <section className="py-20">
          <div className="container max-w-lg text-center">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-gold animate-spin" />
                </div>
                <Sparkles className="w-5 h-5 text-gold absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold mb-2">맞춤 스타일을 찾고 있습니다</h2>
                <p className="text-sm text-muted-foreground">
                  AI가 업종, 분위기, 예산에 맞는 최적의 인테리어 스타일을 분석하고
                  참고 이미지를 생성하고 있습니다. 잠시만 기다려 주세요.
                </p>
              </div>
              <div className="flex gap-2 mt-4">
                {["스타일 분석", "컬러 팔레트", "이미지 생성"].map((label, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-card border rounded-full text-xs">
                    <Loader2 className="w-3 h-3 animate-spin text-gold" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  // Form view
  return (
    <>
      <SEOHead
        title="AI 공간 스타일 추천 | 고감도"
        description="업종, 분위기, 예산에 맞는 최적의 사무실 인테리어 스타일을 AI가 추천해 드립니다. 컬러 팔레트, 마감재, 가구까지 맞춤 제안."
      />

      {/* Hero */}
      <section className="pt-32 pb-12 lg:pt-40 lg:pb-16 bg-[#1A1A1A] text-white relative overflow-hidden">
        <div className="absolute top-8 right-8 lg:right-16 opacity-[0.04] select-none pointer-events-none">
          <span className="font-heading text-[10rem] lg:text-[16rem] font-extrabold leading-none">
            AI
          </span>
        </div>
        <div className="container relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 flex items-center justify-center bg-gold text-ink">
              <Palette className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium tracking-widest uppercase text-gold">
              AI Style Recommendation
            </span>
          </div>
          <h1 className="font-heading text-3xl lg:text-5xl font-bold mb-4 leading-tight">
            AI 공간 스타일 추천
          </h1>
          <p className="text-white/60 max-w-xl leading-relaxed">
            5가지 간단한 질문에 답하면, AI가 최적의 인테리어 스타일을 추천하고
            컬러 팔레트, 마감재, 참고 이미지까지 제안해 드립니다.
          </p>
        </div>
      </section>

      {/* Step Progress */}
      <section className="py-12 lg:py-20">
        <div className="container max-w-2xl">
          {/* Progress Bar */}
          <div className="flex items-center gap-2 mb-10">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className={`flex items-center gap-1.5 ${i <= step ? "text-gold" : "text-muted-foreground/40"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    i < step ? "bg-gold text-ink" : i === step ? "bg-gold/20 text-gold border border-gold" : "bg-muted text-muted-foreground"
                  }`}>
                    {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{s.title}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-colors ${i < step ? "bg-gold" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[350px]">
            {/* Step 0: Industry */}
            {step === 0 && (
              <div>
                <h2 className="font-heading text-2xl font-bold mb-2">어떤 업종이신가요?</h2>
                <p className="text-sm text-muted-foreground mb-6">업종에 따라 최적의 공간 구성이 달라집니다.</p>
                <div className="grid grid-cols-2 gap-3">
                  {INDUSTRIES.map(ind => (
                    <button
                      key={ind}
                      onClick={() => setFormData(prev => ({ ...prev, industry: ind }))}
                      className={`p-4 rounded-lg border text-left text-sm transition-all ${
                        formData.industry === ind
                          ? "border-gold bg-gold/5 text-foreground font-medium"
                          : "border-border hover:border-gold/30 text-muted-foreground"
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Team Size */}
            {step === 1 && (
              <div>
                <h2 className="font-heading text-2xl font-bold mb-2">인원 규모는 어떻게 되나요?</h2>
                <p className="text-sm text-muted-foreground mb-6">인원에 맞는 공간 배치를 제안해 드립니다.</p>
                <div className="grid grid-cols-2 gap-3">
                  {TEAM_SIZES.map(size => (
                    <button
                      key={size}
                      onClick={() => setFormData(prev => ({ ...prev, teamSize: size }))}
                      className={`p-4 rounded-lg border text-left text-sm transition-all ${
                        formData.teamSize === size
                          ? "border-gold bg-gold/5 text-foreground font-medium"
                          : "border-border hover:border-gold/30 text-muted-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Mood */}
            {step === 2 && (
              <div>
                <h2 className="font-heading text-2xl font-bold mb-2">어떤 분위기를 원하시나요?</h2>
                <p className="text-sm text-muted-foreground mb-6">선호하는 디자인 스타일을 선택해 주세요.</p>
                <div className="grid grid-cols-2 gap-3">
                  {MOODS.map(mood => (
                    <button
                      key={mood.name}
                      onClick={() => setFormData(prev => ({ ...prev, mood: mood.name }))}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        formData.mood === mood.name
                          ? "border-gold bg-gold/5"
                          : "border-border hover:border-gold/30"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: mood.color }}
                        />
                        <span className={`text-sm font-medium ${formData.mood === mood.name ? "text-foreground" : "text-muted-foreground"}`}>
                          {mood.name}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{mood.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Budget */}
            {step === 3 && (
              <div>
                <h2 className="font-heading text-2xl font-bold mb-2">예산 수준은 어떻게 되나요?</h2>
                <p className="text-sm text-muted-foreground mb-6">예산에 맞는 마감재와 가구를 추천해 드립니다.</p>
                <div className="space-y-3">
                  {BUDGETS.map(budget => (
                    <button
                      key={budget}
                      onClick={() => setFormData(prev => ({ ...prev, budget }))}
                      className={`w-full p-4 rounded-lg border text-left text-sm transition-all ${
                        formData.budget === budget
                          ? "border-gold bg-gold/5 text-foreground font-medium"
                          : "border-border hover:border-gold/30 text-muted-foreground"
                      }`}
                    >
                      {budget}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Priorities */}
            {step === 4 && (
              <div>
                <h2 className="font-heading text-2xl font-bold mb-2">가장 중요한 것은 무엇인가요?</h2>
                <p className="text-sm text-muted-foreground mb-6">최대 3개까지 선택해 주세요. (최소 1개)</p>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {PRIORITY_OPTIONS.map(p => (
                    <button
                      key={p}
                      onClick={() => togglePriority(p)}
                      className={`p-3 rounded-lg border text-xs text-center transition-all ${
                        formData.priorities.includes(p)
                          ? "border-gold bg-gold/5 text-foreground font-medium"
                          : formData.priorities.length >= 3
                            ? "border-border text-muted-foreground/40 cursor-not-allowed"
                            : "border-border hover:border-gold/30 text-muted-foreground"
                      }`}
                      disabled={!formData.priorities.includes(p) && formData.priorities.length >= 3}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Optional email */}
                <div className="bg-card border rounded-lg p-4 mt-6">
                  <Label htmlFor="style-email" className="text-xs font-medium">
                    이메일 (선택) - 결과를 저장하고 전문 상담을 받으실 수 있습니다
                  </Label>
                  <Input
                    id="style-email"
                    type="email"
                    placeholder="email@company.com"
                    value={formData.contactEmail}
                    onChange={e => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                    className="h-9 text-sm mt-2"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="ghost"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              이전
            </Button>
            <Button
              onClick={handleNext}
              disabled={!isStepValid}
              className="gap-2 bg-gold text-ink hover:bg-gold/90"
            >
              {step === STEPS.length - 1 ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI 스타일 추천받기
                </>
              ) : (
                <>
                  다음
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
