/*
 * DESIGN: Precision Studio — OpsX Consulting Process Page
 * 고감도의 자회사 OpsX(opsx.co.kr)의 데이터 기반 사무환경 컨설팅 프로세스를 소개하는 페이지
 * Sections: Hero → 4대 가치 → 8단계 프로세스 → 견적 비교 → CTA
 */

import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ExternalLink,
  BarChart3,
  LayoutDashboard,
  FileText,
  ClipboardList,
  Search,
  Users,
  Building2,
  MessageSquare,
  BrainCircuit,
  BookOpen,
  Headphones,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { analytics } from "@/lib/analytics";
import SEOHead from "@/components/SEOHead";

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

const VALUES = [
  {
    icon: <BarChart3 className="w-7 h-7" />,
    title: "데이터 기반 심층 분석",
    desc: "막연한 추측이 아닌, 실제 직원들의 목소리를 정밀 수치화하여 숨겨진 오피스의 문제점을 명확히 진단합니다.",
  },
  {
    icon: <LayoutDashboard className="w-7 h-7" />,
    title: "맞춤형 공간 전략 수립",
    desc: "조직 문화와 업무 특성을 고려한 최적의 공간 평면 구성과 개선 우선순위를 전략적으로 제안합니다.",
  },
  {
    icon: <FileText className="w-7 h-7" />,
    title: "최종 의사결정 보고서",
    desc: "경영진을 설득할 수 있는 데이터 근거와 투자 대비 효율(ROI) 분석이 포함된 전문 진단 보고서를 제공합니다.",
  },
  {
    icon: <ClipboardList className="w-7 h-7" />,
    title: "실무용 RFP 패키지",
    desc: "실제 업체 선정 시 활용 가능한 구체적인 과업지시서(RFP)를 생성하여 리뉴얼 과정의 시행착오를 차단합니다.",
  },
];

const PROCESS_STEPS = [
  {
    step: "01",
    icon: <Search className="w-6 h-6" />,
    title: "진단 설계 및 맞춤화",
    desc: "기업마다 당면한 과제는 다릅니다. 우리 조직의 문화와 리뉴얼 목적에 최적화된 맞춤형 진단 문항을 설계하여 정밀도를 높입니다.",
  },
  {
    step: "02",
    icon: <Users className="w-6 h-6" />,
    title: "스마트 웹 설문 조사",
    desc: "직원들의 업무 스타일, 공간 사용 패턴, 숨겨진 니즈를 익명으로 수집하여 실제 구성원들이 바라는 오피스의 모습을 데이터로 전환합니다.",
  },
  {
    step: "03",
    icon: <Building2 className="w-6 h-6" />,
    title: "전문가 현장 실사",
    desc: "데이터 너머의 맥락을 읽습니다. 전문 매니저가 직접 방문하여 공간 동선, 노후도, 현장 제약 사항을 세밀하게 분석합니다.",
  },
  {
    step: "04",
    icon: <MessageSquare className="w-6 h-6" />,
    title: "심층 인터뷰 (FGI)",
    desc: "핵심 그룹 인터뷰를 통해 설문만으로 파악하기 어려운 핵심 이슈와 정성적인 인사이트를 발굴하여 전략의 깊이를 더합니다.",
  },
  {
    step: "05",
    icon: <BrainCircuit className="w-6 h-6" />,
    title: "AI 기반 데이터 분석",
    desc: "수집된 빅데이터를 독자적인 분석 알고리즘으로 처리하여, 공간 개선이 업무 생산성에 미치는 상관관계를 객관적으로 도출합니다.",
  },
  {
    step: "06",
    icon: <BookOpen className="w-6 h-6" />,
    title: "전략적 진단 리포트",
    desc: "현 상황의 점수화부터 구체적인 공간 개선안까지 담긴 리포트를 제공합니다. 경영진 의사결정을 위한 가장 강력한 근거 자료가 됩니다.",
  },
  {
    step: "07",
    icon: <Headphones className="w-6 h-6" />,
    title: "1:1 전략 컨설팅",
    desc: "분석 결과를 바탕으로 전문 컨설턴트가 기업의 예산과 상황에 맞는 최적의 실행 로드맵과 맞춤형 솔루션을 제안합니다.",
  },
  {
    step: "08",
    icon: <Activity className="w-6 h-6" />,
    title: "사후 관리 및 측정",
    desc: "개선 효과를 정밀 측정 및 분석하고, 지속적인 공간 운영 최적화 가이드와 주기적 피드백 기반 유연한 대응을 제공합니다.",
  },
];

export default function OpsXProcess() {
  return (
    <>
      <SEOHead
        title="OpsX 컨설팅 프로세스"
        description="데이터 기반 사무환경 진단부터 원스톱 구축까지. OpsX 인사이트 서비스의 8단계 프로세스로 최적의 오피스를 완성합니다."
        path="/opsx"
      />

      {/* ==================== HERO ==================== */}
      <section className="pt-32 lg:pt-40 pb-20 lg:pb-28 bg-ink text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="container relative z-10">
          <FadeUp>
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 text-xs font-medium tracking-widest uppercase text-gold border border-gold/30">
                OpsX Insight Service
              </span>
              <a
                href="https://opsx.co.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-gold transition-colors"
                onClick={() => analytics.solutionClick("OpsX")}
              >
                opsx.co.kr <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <h1 className="font-heading text-4xl lg:text-6xl font-bold leading-tight mb-8 max-w-4xl">
              사무환경 컨설팅부터
              <br /><span className="text-gradient-gold">원스톱 구축</span>까지
            </h1>
            <p className="text-lg text-white/50 max-w-2xl leading-relaxed mb-10">
              데이터 기반 진단으로 현재의 문제를 명확히 파악하고,
              전담 매니저가 설계부터 시공까지 최적의 오피스를 완성해 드립니다.
              고감도의 35년 시공 노하우와 OpsX의 데이터 분석 역량이 결합된 솔루션입니다.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/contact">
                <span className="inline-flex items-center gap-2 px-7 py-3.5 bg-gold text-ink font-semibold text-sm tracking-wide hover:bg-gold-light transition-all duration-300">
                  무료 상담 신청
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </Link>
              <a
                href="https://opsx.co.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/30 text-white font-medium text-sm tracking-wide hover:bg-white/10 transition-all duration-300"
                onClick={() => analytics.solutionClick("OpsX")}
              >
                OpsX 사이트 방문
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ==================== 4대 가치 ==================== */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <FadeUp>
            <p className="text-xs font-medium tracking-widest uppercase text-gold mb-4">
              Why OpsX
            </p>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold text-ink mb-4 max-w-2xl leading-tight">
              왜 오피스엑스인가요?
            </h2>
            <p className="text-muted-foreground mb-16 max-w-lg">
              더 이상 무작정 리뉴얼이 아니라, 정확한 분석과 근거에 기반한 개선을 할 수 있습니다.
            </p>
          </FadeUp>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((val, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <div className="p-8 border border-border/50 hover:border-gold/30 transition-all duration-500 group h-full">
                  <div className="w-14 h-14 flex items-center justify-center bg-paper-warm text-ink mb-6 group-hover:bg-gold transition-colors duration-500">
                    {val.icon}
                  </div>
                  <h3 className="font-heading text-lg font-bold text-ink mb-3">{val.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{val.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 8단계 프로세스 ==================== */}
      <section className="py-20 lg:py-28 bg-paper-warm relative overflow-hidden">
        <div className="absolute top-8 right-8 lg:right-16 opacity-[0.04] select-none pointer-events-none">
          <span className="font-heading text-[10rem] lg:text-[16rem] font-extrabold text-ink leading-none">
            8
          </span>
        </div>
        <div className="container relative z-10">
          <FadeUp>
            <p className="text-xs font-medium tracking-widest uppercase text-gold mb-4">
              Insight Service Process
            </p>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold text-ink mb-4 max-w-3xl leading-tight">
              체계적인 데이터 분석을 통해
              <br />가장 합리적인 오피스를 구축합니다
            </h2>
            <p className="text-muted-foreground mb-16 max-w-lg">
              8단계 프로세스로 진단부터 사후 관리까지 빈틈없이 진행합니다.
            </p>
          </FadeUp>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROCESS_STEPS.map((step, i) => (
              <FadeUp key={i} delay={i * 0.08}>
                <div className="bg-white p-6 lg:p-8 border border-border/50 hover:border-gold/30 transition-all duration-500 group h-full relative">
                  {/* Step number */}
                  <span className="absolute top-4 right-4 font-heading text-3xl font-extrabold text-ink/5 group-hover:text-gold/20 transition-colors duration-500">
                    {step.step}
                  </span>
                  <div className="w-12 h-12 flex items-center justify-center bg-ink text-white mb-5 group-hover:bg-gold group-hover:text-ink transition-colors duration-500">
                    {step.icon}
                  </div>
                  <h3 className="font-heading text-base font-bold text-ink mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 견적 비교 서비스 ==================== */}
      <section className="py-20 lg:py-28 bg-ink text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeUp>
              <p className="text-xs font-medium tracking-widest uppercase text-gold mb-4">
                Estimate Comparison
              </p>
              <h2 className="font-heading text-3xl lg:text-5xl font-bold mb-6 leading-tight">
                견적을 비교해 보세요
              </h2>
              <p className="text-white/50 leading-relaxed mb-8">
                현재 보유하고 계신 견적이 합리적인 수준인지,
                오피스엑스의 축적된 데이터를 통해 정밀하게 비교 분석해 드립니다.
                35년간 2,800건 이상의 프로젝트에서 축적한 실제 거래 데이터가 기준이 됩니다.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "업종별·규모별 평균 단가 비교",
                  "자재 시세 기반 적정가 분석",
                  "숨겨진 비용 항목 사전 점검",
                  "투자 대비 효율(ROI) 예측",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-4">
                <a
                  href="https://opsx.co.kr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-gold text-ink font-semibold text-sm tracking-wide hover:bg-gold-light transition-all duration-300"
                  onClick={() => analytics.solutionClick("OpsX-Estimate")}
                >
                  견적 비교하기
                  <ExternalLink className="w-4 h-4" />
                </a>
                <Link href="/estimator">
                  <span className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/30 text-white font-medium text-sm tracking-wide hover:bg-white/10 transition-all duration-300">
                    AI 예상 견적 받기
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
            </FadeUp>

            {/* Visual: Data comparison illustration */}
            <FadeUp delay={0.2}>
              <div className="bg-white/[0.03] border border-white/10 p-8 lg:p-10">
                <div className="space-y-6">
                  {/* Comparison bars */}
                  {[
                    { label: "시장 평균 단가", value: 75, color: "bg-white/20" },
                    { label: "고감도 실적 단가", value: 92, color: "bg-gold" },
                    { label: "견적 투명도", value: 96, color: "bg-gold" },
                  ].map((bar, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{bar.label}</span>
                        <span className="font-heading text-lg font-bold text-gold">{bar.value}%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${bar.color} rounded-full`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${bar.value}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, delay: 0.3 + i * 0.2, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-white/30 text-sm leading-relaxed italic">
                    "데이터가 뒷받침하는 견적은 고객에게 신뢰를, 프로젝트에는 안정을 선사합니다."
                  </p>
                  <p className="text-gold text-xs mt-2 font-medium">— OpsX 데이터 분석팀</p>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ==================== 고감도 + OpsX 시너지 ==================== */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <FadeUp>
            <div className="text-center mb-16">
              <p className="text-xs font-medium tracking-widest uppercase text-gold mb-4">
                KOKAMDO + OpsX
              </p>
              <h2 className="font-heading text-3xl lg:text-5xl font-bold text-ink mb-4 leading-tight">
                35년 시공 노하우 + 데이터 분석
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                고감도의 현장 경험과 OpsX의 데이터 역량이 결합되어 최적의 사무환경을 완성합니다.
              </p>
            </div>
          </FadeUp>

          <div className="grid lg:grid-cols-3 gap-6">
            <FadeUp delay={0}>
              <div className="p-8 lg:p-10 bg-paper-warm border border-border/50 h-full text-center">
                <div className="w-16 h-16 flex items-center justify-center bg-ink text-white mx-auto mb-6">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <h3 className="font-heading text-xl font-bold text-ink mb-3">진단</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  OpsX 인사이트 서비스로 현재 사무환경을 데이터 기반으로 정밀 진단합니다.
                  직원 만족도, 공간 효율, 개선 우선순위를 객관적으로 파악합니다.
                </p>
              </div>
            </FadeUp>
            <FadeUp delay={0.1}>
              <div className="p-8 lg:p-10 bg-ink text-white border border-ink h-full text-center">
                <div className="w-16 h-16 flex items-center justify-center bg-gold text-ink mx-auto mb-6">
                  <LayoutDashboard className="w-7 h-7" />
                </div>
                <h3 className="font-heading text-xl font-bold mb-3">설계 & 시공</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  고감도의 35년 설계·시공 노하우로 진단 결과를 실제 공간으로 구현합니다.
                  2,800건 이상의 프로젝트 데이터가 설계의 기반이 됩니다.
                </p>
              </div>
            </FadeUp>
            <FadeUp delay={0.2}>
              <div className="p-8 lg:p-10 bg-paper-warm border border-border/50 h-full text-center">
                <div className="w-16 h-16 flex items-center justify-center bg-ink text-white mx-auto mb-6">
                  <Activity className="w-7 h-7" />
                </div>
                <h3 className="font-heading text-xl font-bold text-ink mb-3">사후 관리</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  시공 완료 후에도 개선 효과를 측정하고, 지속적인 공간 운영 최적화를 지원합니다.
                  주기적 피드백으로 공간 가치를 유지합니다.
                </p>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <section className="py-24 lg:py-32 bg-paper-warm relative overflow-hidden">
        <div className="container relative z-10 text-center">
          <FadeUp>
            <p className="text-xs font-medium tracking-widest uppercase text-gold mb-6">
              Get Started
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-6xl font-bold text-ink mb-6 leading-tight">
              사무환경 개선,
              <br />데이터로 시작하세요
            </h2>
            <p className="text-muted-foreground mb-10 max-w-lg mx-auto">
              OpsX 인사이트 서비스로 현재 사무환경을 진단하고,
              고감도의 원스톱 솔루션으로 최적의 공간을 완성하세요.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact">
                <span className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-ink font-semibold text-sm tracking-wide hover:bg-gold-light transition-all duration-300">
                  무료 상담 신청
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </Link>
              <a
                href="https://opsx.co.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-ink text-white font-medium text-sm tracking-wide hover:bg-ink/90 transition-all duration-300"
                onClick={() => analytics.solutionClick("OpsX")}
              >
                OpsX 사이트 방문
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </FadeUp>
        </div>
      </section>
    </>
  );
}
