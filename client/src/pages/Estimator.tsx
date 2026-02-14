/*
 * DESIGN: Precision Studio — AI Estimator Page (v2 - 거래처원장 단가 기반 고도화)
 * Neurodesign: Progressive disclosure (step-by-step), 3-choice rule, anchoring
 * Steps: Space Type → Area → Grade → Options → Result (with detailed breakdown)
 * 
 * 단가 기준: 고감도 거래처원장 실제 프로젝트 데이터 분석 기반
 * - 학교/공공: 평당 50~120만원
 * - 기업 사무실: 평당 100~200만원
 * - 상업/쇼룸: 평당 130~260만원
 */

import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowLeft, ArrowUpRight, Building2, Maximize2,
  Palette, Calculator, Sparkles, Settings2, Download, RotateCcw,
  Brain, TrendingDown, TrendingUp, AlertTriangle, Landmark, Loader2, ChevronDown, ChevronUp
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { analytics } from "@/lib/analytics";
import { nanoid } from "nanoid";
import SEOHead, { SEO_CONFIG } from "@/components/SEOHead";

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── 거래처원장 기반 실제 단가 데이터 ───
const SPACE_TYPES = [
  { id: "office", label: "사무실", desc: "일반 업무 공간 · IT, 금융, 서비스업", multiplier: 1.0, icon: "🏢" },
  { id: "showroom", label: "쇼룸/전시", desc: "전시 및 체험 공간 · 브랜드 체험관", multiplier: 1.3, icon: "🎨" },
  { id: "commercial", label: "상업공간", desc: "매장, F&B, 리테일", multiplier: 1.2, icon: "🏪" },
  { id: "education", label: "교육/공공", desc: "학교, 관공서, 도서관", multiplier: 0.85, icon: "🏫" },
];

// 거래처원장 분석 기반 실제 평당 단가 (만원)
const GRADES = [
  {
    id: "standard",
    label: "스탠다드",
    desc: "실용적이고 깔끔한 마감",
    detail: "LPL 마감, 일반 타일, 시스템 천장",
    pricePerPyeong: 150,
    color: "border-border",
  },
  {
    id: "premium",
    label: "프리미엄",
    desc: "고급 마감재와 디자인 디테일",
    detail: "무늬목, 포세린 타일, 간접조명, 맞춤 가구",
    pricePerPyeong: 250,
    color: "border-gold",
  },
  {
    id: "luxury",
    label: "럭셔리",
    desc: "최고급 소재와 맞춤 제작",
    detail: "천연석, 수입 원목, 스마트 시스템, 풀커스텀",
    pricePerPyeong: 400,
    color: "border-ink",
  },
];

// 거래처원장 협력업체 거래 비율 기반 공종별 원가 구성
const COST_BREAKDOWN_BASE = [
  { name: "설계/감리", ratio: 0.08, desc: "공간 설계, 인허가, 감리" },
  { name: "철거/기초", ratio: 0.07, desc: "기존 시설 철거, 바닥 기초" },
  { name: "목공/벽체", ratio: 0.15, desc: "파티션, 천장, 벽체 공사" },
  { name: "전기/통신", ratio: 0.11, desc: "배선, 조명, 네트워크" },
  { name: "냉난방/환기", ratio: 0.13, desc: "공조 설비, 덕트, 소방" },
  { name: "바닥재", ratio: 0.09, desc: "타일, 카펫, 에폭시 등" },
  { name: "도장/마감", ratio: 0.06, desc: "페인트, 필름, 특수 마감" },
  { name: "유리/파티션", ratio: 0.08, desc: "유리 파티션, 블라인드" },
  { name: "가구/집기", ratio: 0.15, desc: "사무가구, 수납, 맞춤가구" },
  { name: "기타/잡공사", ratio: 0.08, desc: "사인물, 식재, 청소 등" },
];

// 추가 옵션
const EXTRA_OPTIONS = [
  { id: "smartOffice", label: "스마트 오피스", desc: "IoT 센서, 회의실 예약, 재실 감지", addPerPyeong: 15 },
  { id: "soundproof", label: "방음 강화", desc: "회의실/스튜디오 방음 처리", addPerPyeong: 12 },
  { id: "greenOffice", label: "친환경 인증", desc: "LEED/WELL 인증 대응 마감재", addPerPyeong: 20 },
  { id: "brandWall", label: "브랜드월/사인", desc: "로비 브랜드월, CI 사인물", addPerPyeong: 8 },
  { id: "lounge", label: "라운지/카페", desc: "직원 휴게 공간, 미니 카페", addPerPyeong: 18 },
  { id: "server", label: "서버룸/전산실", desc: "항온항습, UPS, 이중바닥", addPerPyeong: 25 },
];

export default function Estimator() {
  const [step, setStep] = useState(0);
  const [spaceType, setSpaceType] = useState("");
  const [area, setArea] = useState(100);
  const [grade, setGrade] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [sessionId] = useState(() => nanoid(12));

  const saveEstimate = trpc.estimate.save.useMutation();
  const aiAnalysis = trpc.estimate.aiAnalysis.useMutation();
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisExpanded, setAnalysisExpanded] = useState(true);

  useEffect(() => {
    if (step === 1 && !spaceType) {
      analytics.estimatorStart();
    }
    if (step === 4 && totalCost > 0) {
      analytics.estimatorComplete(totalCost, spaceType);
      saveEstimate.mutate({
        sessionId,
        spaceType,
        area,
        grade,
        resultJson: breakdownItems.map((item) => ({
          name: item.name,
          ratio: item.ratio,
          cost: item.cost,
        })),
        totalMin: Math.round(totalCost * 0.85),
        totalMax: Math.round(totalCost * 1.15),
      });
    }
  }, [step]);

  const selectedGrade = GRADES.find((g) => g.id === grade);
  const selectedType = SPACE_TYPES.find((t) => t.id === spaceType);
  const pyeong = Math.round(area / 3.3);

  const optionsCostPerPyeong = useMemo(() => {
    return selectedOptions.reduce((sum, optId) => {
      const opt = EXTRA_OPTIONS.find((o) => o.id === optId);
      return sum + (opt?.addPerPyeong || 0);
    }, 0);
  }, [selectedOptions]);

  const totalCost = useMemo(() => {
    if (!selectedGrade || !selectedType) return 0;
    const baseCost = pyeong * selectedGrade.pricePerPyeong * selectedType.multiplier;
    const optionsCost = pyeong * optionsCostPerPyeong;
    return Math.round(baseCost + optionsCost);
  }, [pyeong, selectedGrade, selectedType, optionsCostPerPyeong]);

  const breakdownItems = useMemo(() => {
    if (totalCost === 0) return [];
    const baseCostTotal = totalCost - pyeong * optionsCostPerPyeong;
    const items = COST_BREAKDOWN_BASE.map((item) => ({
      name: item.name,
      ratio: item.ratio,
      cost: Math.round(baseCostTotal * item.ratio),
      desc: item.desc,
    }));
    // 추가 옵션을 별도 항목으로 표시
    selectedOptions.forEach((optId) => {
      const opt = EXTRA_OPTIONS.find((o) => o.id === optId);
      if (opt) {
        items.push({
          name: `[옵션] ${opt.label}`,
          ratio: 0,
          cost: pyeong * opt.addPerPyeong,
          desc: opt.desc,
        });
      }
    });
    return items;
  }, [totalCost, pyeong, optionsCostPerPyeong, selectedOptions]);

  const canNext = () => {
    if (step === 0) return !!spaceType;
    if (step === 1) return area >= 30;
    if (step === 2) return !!grade;
    if (step === 3) return true; // options are optional
    return true;
  };

  const toggleOption = (id: string) => {
    setSelectedOptions((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  };

  const STEPS = [
    { icon: <Building2 className="w-5 h-5" />, label: "공간 유형" },
    { icon: <Maximize2 className="w-5 h-5" />, label: "면적" },
    { icon: <Palette className="w-5 h-5" />, label: "마감 등급" },
    { icon: <Settings2 className="w-5 h-5" />, label: "추가 옵션" },
    { icon: <Calculator className="w-5 h-5" />, label: "결과" },
  ];

  const formatCost = (cost: number) => {
    if (cost >= 10000) {
      const eok = Math.floor(cost / 10000);
      const man = cost % 10000;
      return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`;
    }
    return `${cost.toLocaleString()}만원`;
  };

  return (
    <>
      <SEOHead {...SEO_CONFIG.estimator} />
      <section className="pt-32 lg:pt-40 pb-20 lg:pb-28 min-h-screen">
        <div className="container max-w-4xl mx-auto">
          <FadeUp>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-medium tracking-widest uppercase text-gold border border-gold/30">
                <Sparkles className="w-3.5 h-3.5" />
                AI Estimator
              </div>
              <h1 className="font-heading text-3xl lg:text-5xl font-bold text-ink leading-tight mb-4">
                AI 예상 견적
              </h1>
              <p className="text-muted-foreground max-w-lg mx-auto">
                고감도의 35년간 2,800건 이상 실제 프로젝트 데이터를 기반으로 산출합니다.
                정확한 견적은 현장 방문 후 확정됩니다.
              </p>
            </div>
          </FadeUp>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-1 sm:gap-2 mb-12 overflow-x-auto">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-1 sm:gap-2">
                <div
                  className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
                    i === step ? "bg-ink text-white" : i < step ? "bg-gold/10 text-gold" : "bg-paper-warm text-ink/30"
                  }`}
                >
                  {s.icon}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className="w-4 sm:w-6 h-px bg-border" />}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {/* Step 0: Space Type */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="font-heading text-xl font-bold text-ink mb-6 text-center">
                  어떤 공간을 계획하고 계신가요?
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {SPACE_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSpaceType(type.id)}
                      className={`p-6 border text-left transition-all duration-300 ${
                        spaceType === type.id
                          ? "border-gold bg-gold/5"
                          : "border-border/50 hover:border-gold/30"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <span className="text-2xl">{type.icon}</span>
                        <div>
                          <h3 className="font-heading text-lg font-bold text-ink mb-1">{type.label}</h3>
                          <p className="text-sm text-muted-foreground">{type.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 1: Area */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="font-heading text-xl font-bold text-ink mb-6 text-center">
                  공간의 면적은 어느 정도인가요?
                </h2>
                <div className="max-w-md mx-auto text-center">
                  <div className="mb-8">
                    <span className="font-heading text-5xl font-extrabold text-ink">{area}</span>
                    <span className="text-2xl text-muted-foreground ml-1">㎡</span>
                    <p className="text-sm text-muted-foreground mt-2">약 {pyeong}평</p>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={3000}
                    step={10}
                    value={area}
                    onChange={(e) => setArea(Number(e.target.value))}
                    className="w-full h-1 bg-border rounded-none appearance-none cursor-pointer accent-gold"
                    style={{
                      background: `linear-gradient(to right, #C8A96E 0%, #C8A96E ${((area - 30) / (3000 - 30)) * 100}%, #e5e5e5 ${((area - 30) / (3000 - 30)) * 100}%, #e5e5e5 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>30㎡ (약 9평)</span>
                    <span>3,000㎡ (약 909평)</span>
                  </div>
                  {/* Quick select buttons */}
                  <div className="flex flex-wrap justify-center gap-2 mt-6">
                    {[50, 100, 200, 330, 500, 1000].map((v) => (
                      <button
                        key={v}
                        onClick={() => setArea(v)}
                        className={`px-3 py-1.5 text-xs font-medium border transition-all ${
                          area === v ? "border-gold bg-gold/10 text-gold" : "border-border/50 text-ink/50 hover:border-gold/30"
                        }`}
                      >
                        {v}㎡ ({Math.round(v / 3.3)}평)
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Grade */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="font-heading text-xl font-bold text-ink mb-6 text-center">
                  마감 등급을 선택하세요
                </h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {GRADES.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setGrade(g.id)}
                      className={`p-6 border text-left transition-all duration-300 relative ${
                        grade === g.id
                          ? "border-gold bg-gold/5"
                          : `${g.color} hover:border-gold/30`
                      }`}
                    >
                      {g.id === "premium" && (
                        <span className="absolute -top-2.5 right-4 px-2 py-0.5 bg-gold text-ink text-[10px] font-bold uppercase tracking-wider">
                          추천
                        </span>
                      )}
                      <h3 className="font-heading text-lg font-bold text-ink mb-1">{g.label}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{g.desc}</p>
                      <p className="text-xs text-ink/40 mb-3">{g.detail}</p>
                      <p className="font-heading text-lg font-bold text-gold">
                        평당 {g.pricePerPyeong}만원~
                      </p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Extra Options */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="font-heading text-xl font-bold text-ink mb-2 text-center">
                  추가 옵션을 선택하세요
                </h2>
                <p className="text-sm text-muted-foreground text-center mb-8">선택하지 않아도 다음 단계로 진행할 수 있습니다</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {EXTRA_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => toggleOption(opt.id)}
                      className={`p-5 border text-left transition-all duration-300 ${
                        selectedOptions.includes(opt.id)
                          ? "border-gold bg-gold/5"
                          : "border-border/50 hover:border-gold/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-heading text-base font-bold text-ink mb-1">{opt.label}</h3>
                          <p className="text-xs text-muted-foreground">{opt.desc}</p>
                        </div>
                        <span className="text-sm font-medium text-gold whitespace-nowrap">
                          +{opt.addPerPyeong}만/평
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                {selectedOptions.length > 0 && (
                  <div className="mt-6 p-4 bg-gold/5 border border-gold/20 text-center">
                    <p className="text-sm text-ink/70">
                      선택한 옵션: <span className="font-semibold text-ink">{selectedOptions.length}개</span>
                      {" · "}추가 비용: <span className="font-semibold text-gold">평당 +{optionsCostPerPyeong}만원</span>
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 4: Result */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="max-w-2xl mx-auto">
                  {/* Summary Header */}
                  <div className="text-center mb-10">
                    <p className="text-xs font-medium tracking-widest uppercase text-gold mb-2">
                      예상 견적 결과
                    </p>
                    <div className="font-heading text-5xl lg:text-6xl font-extrabold text-ink">
                      {formatCost(totalCost)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      {selectedType?.label} · {area}㎡({pyeong}평) · {selectedGrade?.label} 등급
                      {selectedOptions.length > 0 && ` · 옵션 ${selectedOptions.length}개`}
                    </p>
                    <div className="flex justify-center gap-6 mt-4 text-sm">
                      <div>
                        <span className="text-ink/40">최소</span>
                        <span className="ml-2 font-semibold text-ink">{formatCost(Math.round(totalCost * 0.85))}</span>
                      </div>
                      <div className="w-px h-5 bg-border" />
                      <div>
                        <span className="text-ink/40">최대</span>
                        <span className="ml-2 font-semibold text-ink">{formatCost(Math.round(totalCost * 1.15))}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cost Breakdown Table */}
                  <div className="border border-border/50 p-6 lg:p-8 mb-6">
                    <h3 className="font-heading text-lg font-bold text-ink mb-6">공종별 예상 비용</h3>
                    <div className="space-y-3">
                      {breakdownItems.map((item) => {
                        const maxCost = Math.max(...breakdownItems.map((i) => i.cost));
                        return (
                          <div key={item.name}>
                            <div className="flex items-center justify-between mb-1">
                              <div>
                                <span className={`text-sm ${item.name.startsWith("[옵션]") ? "text-gold font-medium" : "text-ink/70"}`}>
                                  {item.name}
                                </span>
                                <span className="text-xs text-ink/30 ml-2 hidden sm:inline">{item.desc}</span>
                              </div>
                              <span className="text-sm font-medium text-ink">
                                {item.cost.toLocaleString()}만원
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-paper-warm overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(item.cost / maxCost) * 100}%` }}
                                transition={{ duration: 0.8, delay: 0.1 }}
                                className={item.name.startsWith("[옵션]") ? "h-full bg-gold/60" : "h-full bg-gold"}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-6 pt-4 border-t border-border/50 flex justify-between">
                      <span className="font-heading font-bold text-ink">합계</span>
                      <span className="font-heading font-bold text-ink text-lg">{formatCost(totalCost)}</span>
                    </div>
                  </div>

                  {/* Per-pyeong summary */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="p-4 bg-paper-warm text-center">
                      <p className="text-xs text-ink/40 mb-1">평당 단가</p>
                      <p className="font-heading font-bold text-ink">
                        {pyeong > 0 ? Math.round(totalCost / pyeong).toLocaleString() : 0}만원
                      </p>
                    </div>
                    <div className="p-4 bg-paper-warm text-center">
                      <p className="text-xs text-ink/40 mb-1">㎡당 단가</p>
                      <p className="font-heading font-bold text-ink">
                        {area > 0 ? Math.round((totalCost * 10000) / area).toLocaleString() : 0}원
                      </p>
                    </div>
                    <div className="p-4 bg-paper-warm text-center">
                      <p className="text-xs text-ink/40 mb-1">예상 공기</p>
                      <p className="font-heading font-bold text-ink">
                        {pyeong <= 30 ? "3~4주" : pyeong <= 100 ? "4~6주" : pyeong <= 300 ? "6~10주" : "10~16주"}
                      </p>
                    </div>
                  </div>

                  {/* AI 상세 분석 섹션 */}
                  <div className="mb-8">
                    {!showAnalysis ? (
                      <button
                        onClick={() => {
                          setShowAnalysis(true);
                          aiAnalysis.mutate({
                            spaceType: selectedType?.label || spaceType,
                            area,
                            grade: selectedGrade?.label || grade,
                            options: selectedOptions.map(id => EXTRA_OPTIONS.find(o => o.id === id)?.label || id),
                            totalCost,
                            breakdown: breakdownItems.map(b => ({ name: b.name, cost: b.cost })),
                          });
                        }}
                        className="w-full p-5 border border-gold/30 bg-gold/5 hover:bg-gold/10 transition-all duration-300 flex items-center justify-center gap-3"
                      >
                        <Brain className="w-5 h-5 text-gold" />
                        <span className="font-heading font-bold text-ink">AI 상세 분석 보기</span>
                        <span className="text-xs text-muted-foreground">고감도 실적 데이터 기반</span>
                      </button>
                    ) : aiAnalysis.isPending ? (
                      <div className="border border-gold/30 bg-gold/5 p-8 text-center">
                        <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-3" />
                        <p className="text-sm text-ink/70">AI가 거래처원장 데이터를 분석하고 있습니다...</p>
                        <p className="text-xs text-muted-foreground mt-1">70개 거래처, 44억원 실적 데이터 기반 분석</p>
                      </div>
                    ) : aiAnalysis.data?.analysis ? (
                      <div className="border border-gold/30">
                        <button
                          onClick={() => setAnalysisExpanded(!analysisExpanded)}
                          className="w-full p-4 bg-gold/5 flex items-center justify-between hover:bg-gold/10 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-gold" />
                            <span className="font-heading font-bold text-ink">AI 상세 분석 결과</span>
                          </div>
                          {analysisExpanded ? <ChevronUp className="w-4 h-4 text-ink/50" /> : <ChevronDown className="w-4 h-4 text-ink/50" />}
                        </button>
                        {analysisExpanded && (
                          <div className="p-6 space-y-6">
                            {/* 시장 비교 */}
                            <div className="p-4 bg-paper-warm">
                              <div className="flex items-center gap-2 mb-2">
                                <Landmark className="w-4 h-4 text-gold" />
                                <span className="font-heading font-semibold text-ink text-sm">시장 비교 평가</span>
                              </div>
                              <p className="text-sm text-ink/70 leading-relaxed">{aiAnalysis.data.analysis.marketComparison}</p>
                            </div>

                            {/* 벤치마크 프로젝트 */}
                            {aiAnalysis.data.analysis.benchmarkProjects?.length > 0 && (
                              <div>
                                <h4 className="font-heading font-semibold text-ink text-sm mb-3 flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-gold" /> 고감도 유사 프로젝트
                                </h4>
                                <div className="grid sm:grid-cols-3 gap-3">
                                  {aiAnalysis.data.analysis.benchmarkProjects.map((p: any, i: number) => (
                                    <div key={i} className="p-3 border border-border/50 bg-paper-warm">
                                      <p className="font-medium text-ink text-sm mb-1">{p.name}</p>
                                      <p className="text-xs text-muted-foreground">{p.scale}</p>
                                      <p className="text-xs font-medium text-gold mt-1">{p.cost}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 비용 절감 팁 */}
                            <div>
                              <h4 className="font-heading font-semibold text-ink text-sm mb-3 flex items-center gap-2">
                                <TrendingDown className="w-4 h-4 text-green-600" /> 비용 절감 팁
                              </h4>
                              <div className="space-y-2">
                                {aiAnalysis.data.analysis.costSavingTips?.map((tip: string, i: number) => (
                                  <div key={i} className="flex items-start gap-2 text-sm text-ink/70">
                                    <span className="text-green-600 font-bold mt-0.5">{i + 1}.</span>
                                    <span>{tip}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* 품질 업그레이드 팁 */}
                            <div>
                              <h4 className="font-heading font-semibold text-ink text-sm mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-600" /> 품질 업그레이드 팁
                              </h4>
                              <div className="space-y-2">
                                {aiAnalysis.data.analysis.qualityUpgradeTips?.map((tip: string, i: number) => (
                                  <div key={i} className="flex items-start gap-2 text-sm text-ink/70">
                                    <span className="text-blue-600 font-bold mt-0.5">{i + 1}.</span>
                                    <span>{tip}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* 예상 일정 */}
                            <div className="p-4 bg-paper-warm">
                              <h4 className="font-heading font-semibold text-ink text-sm mb-2">예상 공사 일정</h4>
                              <p className="text-sm text-ink/70 leading-relaxed">{aiAnalysis.data.analysis.timeline}</p>
                            </div>

                            {/* 리스크 요인 */}
                            {aiAnalysis.data.analysis.riskFactors?.length > 0 && (
                              <div>
                                <h4 className="font-heading font-semibold text-ink text-sm mb-3 flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 text-amber-500" /> 주의 사항
                                </h4>
                                <div className="space-y-2">
                                  {aiAnalysis.data.analysis.riskFactors.map((risk: string, i: number) => (
                                    <div key={i} className="flex items-start gap-2 text-sm text-ink/70">
                                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                                      <span>{risk}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 종합 추천 */}
                            <div className="p-4 border border-gold/20 bg-gold/5">
                              <h4 className="font-heading font-semibold text-ink text-sm mb-2">종합 추천</h4>
                              <p className="text-sm text-ink/70 leading-relaxed">{aiAnalysis.data.analysis.recommendation}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : aiAnalysis.isError ? (
                      <div className="border border-red-200 bg-red-50 p-4 text-center">
                        <p className="text-sm text-red-600">AI 분석 중 오류가 발생했습니다. 다시 시도해 주세요.</p>
                        <button
                          onClick={() => {
                            aiAnalysis.mutate({
                              spaceType: selectedType?.label || spaceType,
                              area,
                              grade: selectedGrade?.label || grade,
                              options: selectedOptions.map(id => EXTRA_OPTIONS.find(o => o.id === id)?.label || id),
                              totalCost,
                              breakdown: breakdownItems.map(b => ({ name: b.name, cost: b.cost })),
                            });
                          }}
                          className="mt-2 text-sm text-gold hover:underline"
                        >
                          다시 시도
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <p className="text-xs text-muted-foreground text-center mb-8">
                    * 본 견적은 고감도의 35년간 2,800건 이상 실제 프로젝트 데이터를 기반으로 AI가 산출한 예상 금액입니다.
                    실제 견적은 현장 조건, 마감재 선택, 설비 사양에 따라 달라질 수 있습니다.
                  </p>

                  <div className="bg-ink/5 p-4 mb-6 text-center rounded">
                    <p className="text-xs text-muted-foreground mb-1">직접 상담을 원하시면</p>
                    <div className="flex items-center justify-center gap-4">
                      <a href="tel:02-6952-3111" className="text-sm font-medium text-ink hover:text-gold transition-colors">
                        02-6952-3111
                      </a>
                      <span className="text-border">|</span>
                      <a href="mailto:contact@kokamdo.co.kr" className="text-sm font-medium text-ink hover:text-gold transition-colors">
                        contact@kokamdo.co.kr
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-4">
                    <Link href="/contact">
                      <span className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-ink font-semibold text-sm tracking-wide hover:bg-gold-light transition-all duration-300">
                        정확한 견적 요청
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </Link>
                    <button
                      onClick={() => {
                        setStep(0);
                        setSpaceType("");
                        setArea(100);
                        setGrade("");
                        setSelectedOptions([]);
                      }}
                      className="inline-flex items-center gap-2 px-8 py-4 border border-border text-ink font-medium text-sm hover:border-gold/30 transition-all duration-300"
                    >
                      <RotateCcw className="w-4 h-4" />
                      다시 계산하기
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          {step < 4 && (
            <div className="flex justify-between mt-12">
              <button
                onClick={() => setStep(Math.max(0, step - 1))}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                  step === 0 ? "opacity-0 pointer-events-none" : "text-ink/60 hover:text-ink"
                }`}
              >
                <ArrowLeft className="w-4 h-4" /> 이전
              </button>
              <button
                onClick={() => canNext() && setStep(step + 1)}
                disabled={!canNext()}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-300 ${
                  canNext()
                    ? "bg-ink text-white hover:bg-ink/90"
                    : "bg-paper-warm text-ink/30 cursor-not-allowed"
                }`}
              >
                {step === 3 ? "결과 보기" : "다음"} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
