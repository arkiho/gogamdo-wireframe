/*
 * DESIGN: Precision Studio — AI Estimator Page
 * Neurodesign: Progressive disclosure (step-by-step), 3-choice rule, anchoring
 * Steps: Space Type → Area → Grade → Budget Slider → Result
 */

import { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, ArrowUpRight, Building2, Maximize2, Palette, Calculator, Sparkles } from "lucide-react";

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

const SPACE_TYPES = [
  { id: "office", label: "사무실", desc: "일반 업무 공간", multiplier: 1.0 },
  { id: "showroom", label: "쇼룸/전시", desc: "전시 및 체험 공간", multiplier: 1.3 },
  { id: "commercial", label: "상업공간", desc: "매장, F&B 등", multiplier: 1.2 },
];

const GRADES = [
  { id: "standard", label: "스탠다드", desc: "실용적이고 깔끔한 마감", pricePerPyeong: 180, color: "border-border" },
  { id: "premium", label: "프리미엄", desc: "고급 마감재와 디자인 디테일", pricePerPyeong: 280, color: "border-gold" },
  { id: "luxury", label: "럭셔리", desc: "최고급 소재와 맞춤 제작", pricePerPyeong: 420, color: "border-ink" },
];

const COST_BREAKDOWN = [
  { name: "설계비", ratio: 0.08 },
  { name: "철거/기초", ratio: 0.10 },
  { name: "전기/통신", ratio: 0.12 },
  { name: "냉난방/환기", ratio: 0.15 },
  { name: "바닥재", ratio: 0.10 },
  { name: "벽체/천장", ratio: 0.12 },
  { name: "도장", ratio: 0.05 },
  { name: "가구", ratio: 0.18 },
  { name: "기타", ratio: 0.10 },
];

export default function Estimator() {
  const [step, setStep] = useState(0);
  const [spaceType, setSpaceType] = useState("");
  const [area, setArea] = useState(100);
  const [grade, setGrade] = useState("");

  const selectedGrade = GRADES.find((g) => g.id === grade);
  const selectedType = SPACE_TYPES.find((t) => t.id === spaceType);
  const pyeong = Math.round(area / 3.3);

  const totalCost = useMemo(() => {
    if (!selectedGrade || !selectedType) return 0;
    return Math.round(pyeong * selectedGrade.pricePerPyeong * selectedType.multiplier);
  }, [pyeong, selectedGrade, selectedType]);

  const canNext = () => {
    if (step === 0) return !!spaceType;
    if (step === 1) return area >= 30;
    if (step === 2) return !!grade;
    return true;
  };

  const STEPS = [
    { icon: <Building2 className="w-5 h-5" />, label: "공간 유형" },
    { icon: <Maximize2 className="w-5 h-5" />, label: "면적" },
    { icon: <Palette className="w-5 h-5" />, label: "마감 등급" },
    { icon: <Calculator className="w-5 h-5" />, label: "결과" },
  ];

  return (
    <>
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
                3단계 입력만으로 예상 비용을 확인하세요. 실제 견적과 다를 수 있으며, 정확한 견적은 현장 방문 후 산출됩니다.
              </p>
            </div>
          </FadeUp>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-12">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
                    i === step ? "bg-ink text-white" : i < step ? "bg-gold/10 text-gold" : "bg-paper-warm text-ink/30"
                  }`}
                >
                  {s.icon}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className="w-6 h-px bg-border" />}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
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
                <div className="grid sm:grid-cols-3 gap-4">
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
                      <h3 className="font-heading text-lg font-bold text-ink mb-1">{type.label}</h3>
                      <p className="text-sm text-muted-foreground">{type.desc}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

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
                    <span>30㎡</span>
                    <span>3,000㎡</span>
                  </div>
                </div>
              </motion.div>
            )}

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
                      <p className="text-sm text-muted-foreground mb-3">{g.desc}</p>
                      <p className="font-heading text-lg font-bold text-gold">
                        평당 {g.pricePerPyeong}만원~
                      </p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-10">
                    <p className="text-xs font-medium tracking-widest uppercase text-gold mb-2">
                      예상 견적 결과
                    </p>
                    <div className="font-heading text-5xl lg:text-6xl font-extrabold text-ink">
                      {totalCost >= 10000
                        ? `${Math.floor(totalCost / 10000)}억 ${(totalCost % 10000).toLocaleString()}만원`
                        : `${totalCost.toLocaleString()}만원`}
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      {selectedType?.label} · {area}㎡({pyeong}평) · {selectedGrade?.label} 등급 기준
                    </p>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="border border-border/50 p-6 lg:p-8 mb-8">
                    <h3 className="font-heading text-lg font-bold text-ink mb-6">공종별 예상 비용</h3>
                    <div className="space-y-3">
                      {COST_BREAKDOWN.map((item) => {
                        const cost = Math.round(totalCost * item.ratio);
                        return (
                          <div key={item.name} className="flex items-center justify-between">
                            <span className="text-sm text-ink/70">{item.name}</span>
                            <div className="flex items-center gap-4">
                              <div className="w-32 h-1.5 bg-paper-warm overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${item.ratio * 100 * 5}%` }}
                                  transition={{ duration: 0.8, delay: 0.2 }}
                                  className="h-full bg-gold"
                                />
                              </div>
                              <span className="text-sm font-medium text-ink w-24 text-right">
                                {cost.toLocaleString()}만원
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center mb-8">
                    * 본 견적은 AI가 산출한 예상 금액이며, 실제 견적은 현장 조건에 따라 달라질 수 있습니다.
                  </p>

                  <div className="flex flex-wrap justify-center gap-4">
                    <Link href="/contact">
                      <span className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-ink font-semibold text-sm tracking-wide hover:bg-gold-light transition-all duration-300">
                        정확한 견적 요청
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </Link>
                    <button
                      onClick={() => { setStep(0); setSpaceType(""); setArea(100); setGrade(""); }}
                      className="px-8 py-4 border border-border text-ink font-medium text-sm hover:border-gold/30 transition-all duration-300"
                    >
                      다시 계산하기
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          {step < 3 && (
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
                {step === 2 ? "결과 보기" : "다음"} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
