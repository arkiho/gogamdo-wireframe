/**
 * DESIGN: Precision Studio — How We Work Page
 * 고감도의 차별화된 프로세스를 설명하는 페이지
 * 일반 인테리어 회사와의 차이를 명확히 보여주는 비교 구조
 * Sections: Hero → 비교 → 6단계 프로세스 → 기술 차별점 → 수치 → CTA
 */

import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  ClipboardCheck,
  Ruler,
  PenTool,
  HardHat,
  HeartHandshake,
  X,
  Check,
  BarChart3,
  Brain,
  Camera,
  FileText,
  Eye,
  Database,
  Sparkles,
  Users,
  Clock,
  TrendingUp,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { analytics } from "@/lib/analytics";

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
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

const PROCESS_STEPS = [
  {
    number: "01",
    title: "데이터 기반 진단",
    subtitle: "Diagnostic",
    icon: <ClipboardCheck className="w-6 h-6" />,
    description:
      "업무환경 서베이와 공간 활용 데이터를 수집합니다. 직원들의 실제 업무 패턴, 동선, 불편사항을 정량적으로 분석하여 설계의 출발점으로 삼습니다.",
    details: [
      "업무환경 셀프 서베이 (전 직원 대상)",
      "공간 활용도 데이터 수집·분석",
      "업종별 벤치마크 비교 리포트",
    ],
    diff: "일반 업체: 담당자 1명의 구두 요청만으로 설계 시작",
  },
  {
    number: "02",
    title: "AI 도면 분석 & 공간 프로그래밍",
    subtitle: "Analysis",
    icon: <Ruler className="w-6 h-6" />,
    description:
      "AI가 도면을 자동 분석하여 면적, 벽체, 기둥, 창문 위치를 인식합니다. 2,800건 이상의 프로젝트 데이터를 기반으로 최적의 공간 배분을 산출합니다.",
    details: [
      "AI 도면 자동 분석 (면적·구조 인식)",
      "업종별 최적 좌석 배치 DB 활용",
      "인접성 매트릭스 기반 공간 프로그래밍",
    ],
    diff: "일반 업체: 설계자의 경험과 감에 의존한 배치",
  },
  {
    number: "03",
    title: "3D 렌더링 & 가상 체험",
    subtitle: "Visualization",
    icon: <PenTool className="w-6 h-6" />,
    description:
      "포토리얼리스틱 3D 렌더링과 AI 투어 영상으로 완공 전 공간을 미리 체험합니다. 마감재, 조명, 가구 배치를 시뮬레이션하여 의사결정을 돕습니다.",
    details: [
      "포토리얼 3D 렌더링 (주요 공간별)",
      "AI 워크스루 투어 영상 생성",
      "마감재·조명 시뮬레이션",
    ],
    diff: "일반 업체: 2D 도면만 제공하거나 외주 렌더링에 추가 비용 발생",
  },
  {
    number: "04",
    title: "투명한 견적 & 계약",
    subtitle: "Estimation",
    icon: <FileText className="w-6 h-6" />,
    description:
      "70개 이상 거래처, 44억원 규모의 실거래 데이터를 기반으로 공종별 상세 견적을 산출합니다. 시장가 벤치마크와 비교하여 합리적인 비용을 제시합니다.",
    details: [
      "실거래 데이터 기반 단가 산출",
      "공종별 상세 견적서 (자재·수량·단가)",
      "시장가 벤치마크 비교 리포트",
    ],
    diff: "일반 업체: 불투명한 일괄 견적, 추가 비용 발생 빈번",
  },
  {
    number: "05",
    title: "실시간 시공 관리",
    subtitle: "Execution",
    icon: <HardHat className="w-6 h-6" />,
    description:
      "자체 시공팀과 검증된 협력사 네트워크로 시공합니다. 오피스엑스(OpsX) 시스템으로 공정 진행률, 현장 카메라, 작업 보고를 실시간으로 공유합니다.",
    details: [
      "오피스엑스(OpsX) 실시간 공정 관리 시스템",
      "현장 카메라 실시간 모니터링",
      "일일 작업보고서 자동 공유",
    ],
    diff: "일반 업체: 현장 방문 시에만 진행 상황 확인 가능",
  },
  {
    number: "06",
    title: "사후 관리 & 데이터 축적",
    subtitle: "Aftercare",
    icon: <HeartHandshake className="w-6 h-6" />,
    description:
      "입주 후 공간 활용도를 추적하고 개선점을 제안합니다. 프로젝트 데이터는 축적되어 다음 프로젝트의 정확도를 높이는 선순환 구조를 만듭니다.",
    details: [
      "입주 후 만족도 서베이 & 개선 제안",
      "하자 보수 보증 시스템",
      "프로젝트 데이터 축적 → 정확도 향상",
    ],
    diff: "일반 업체: 시공 완료 후 관계 종료, 하자 대응 소극적",
  },
];

const COMPARISON = [
  {
    category: "설계 근거",
    general: "설계자 경험·감에 의존",
    kokamdo: "2,800건 프로젝트 데이터 기반",
  },
  {
    category: "견적 투명성",
    general: "일괄 견적, 추가 비용 빈번",
    kokamdo: "실거래 데이터 기반 공종별 상세 견적",
  },
  {
    category: "시공 현황 공유",
    general: "현장 방문 시에만 확인",
    kokamdo: "오피스엑스(OpsX) 실시간 공정·카메라 공유",
  },
  {
    category: "고객 요구 수집",
    general: "담당자 1명 구두 전달",
    kokamdo: "전 직원 서베이 + 데이터 분석",
  },
  {
    category: "완공 전 확인",
    general: "2D 도면 또는 외주 렌더링",
    kokamdo: "3D 렌더링 + AI 투어 영상",
  },
  {
    category: "사후 관리",
    general: "시공 완료 후 관계 종료",
    kokamdo: "입주 후 만족도 추적 & 개선 제안",
  },
];

const TECH_HIGHLIGHTS = [
  {
    icon: <Brain className="w-8 h-8" />,
    title: "AI 도면 분석",
    desc: "PDF/이미지 도면을 업로드하면 AI가 자동으로 면적, 벽체, 기둥, 창문을 인식하고 공간 구조를 파악합니다.",
  },
  {
    icon: <Database className="w-8 h-8" />,
    title: "실거래 데이터 DB",
    desc: "35년간 축적된 70개 이상 거래처, 44억원 규모의 실거래 데이터로 정확한 단가를 산출합니다.",
  },
  {
    icon: <Camera className="w-8 h-8" />,
    title: "현장 실시간 관제",
    desc: "4G 카메라를 통해 시공 현장을 실시간으로 모니터링하고, 고객에게 진행 상황을 투명하게 공유합니다.",
  },
  {
    icon: <Eye className="w-8 h-8" />,
    title: "360도 현장 실측",
    desc: "360도 카메라로 현장을 촬영하고, 사진 기반으로 치수를 추정하여 정밀한 실측 데이터를 확보합니다.",
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: "업무환경 서베이",
    desc: "전 직원 대상 업무환경 서베이를 실시하여 실제 사용자의 니즈를 정량적으로 분석합니다.",
  },
  {
    icon: <Sparkles className="w-8 h-8" />,
    title: "AI 제안서 자동 생성",
    desc: "도면 분석, 서베이 결과, 렌더링을 종합하여 맞춤형 제안서와 견적서를 자동으로 생성합니다.",
  },
];

export default function HowWeWork() {
  return (
    <>
      <SEOHead
        title="우리가 일하는 방식 | 고감도 프로세스"
        description="고감도는 감이 아닌 데이터로 설계합니다. 2,800건 이상의 프로젝트 데이터, AI 도면 분석, 실시간 시공 관리 시스템으로 일반 인테리어 회사와는 다른 차원의 서비스를 제공합니다."
        path="/how-we-work"
      />

      {/* HowTo 구조화 데이터 (AEO) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "고감도 사무실 인테리어 진행 프로세스",
            description: "데이터 기반 진단부터 사후 관리까지, 고감도의 체계적인 인테리어 프로세스",
            totalTime: "P6W",
            step: PROCESS_STEPS.map((step, i) => ({
              "@type": "HowToStep",
              position: i + 1,
              name: step.title,
              text: step.description,
              url: `https://kokamdo.co.kr/how-we-work#step-${step.number}`,
            })),
          }),
        }}
      />

      {/* ==================== HERO ==================== */}
      <section className="relative py-24 lg:py-36 bg-ink text-white overflow-hidden">
        <div className="absolute top-8 right-8 lg:right-16 opacity-[0.04] select-none pointer-events-none">
          <span className="font-heading text-[10rem] lg:text-[16rem] font-extrabold leading-none">
            HOW
          </span>
        </div>
        <div className="container relative z-10">
          <FadeUp>
            <span className="inline-block px-3 py-1 mb-6 text-xs font-medium tracking-widest uppercase text-gold border border-gold/30">
              How We Work
            </span>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] mb-6 max-w-3xl">
              감이 아닌{" "}
              <span className="text-gradient-gold">데이터</span>로,
              <br />
              경험이 아닌{" "}
              <span className="text-gradient-gold">시스템</span>으로
            </h1>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className="text-white/60 text-lg lg:text-xl leading-relaxed max-w-2xl mb-10">
              35년간 2,800건 이상의 프로젝트에서 축적한 데이터와 자체 개발
              기술 플랫폼으로, 설계부터 시공까지 모든 과정을 체계적으로
              관리합니다. 고감도가 다른 인테리어 회사와 근본적으로 다른
              이유입니다.
            </p>
          </FadeUp>
          <FadeUp delay={0.3}>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2 text-white/40">
                <Clock className="w-4 h-4 text-gold" />
                <span>
                  <strong className="text-white">35년</strong> 업력
                </span>
              </div>
              <div className="flex items-center gap-2 text-white/40">
                <TrendingUp className="w-4 h-4 text-gold" />
                <span>
                  <strong className="text-white">2,800건+</strong> 프로젝트
                </span>
              </div>
              <div className="flex items-center gap-2 text-white/40">
                <Users className="w-4 h-4 text-gold" />
                <span>
                  <strong className="text-white">70개+</strong> 검증된 협력사
                </span>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ==================== COMPARISON TABLE ==================== */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <FadeUp>
            <p className="text-xs font-medium tracking-widest uppercase text-gold mb-4">
              The Difference
            </p>
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-ink mb-4 max-w-2xl leading-tight">
              같은 인테리어,
              <br />
              <span className="text-ink/40">다른 결과</span>
            </h2>
            <p className="text-muted-foreground mb-12 max-w-lg">
              동일한 공간이라도 어떤 프로세스로 접근하느냐에 따라 결과는
              완전히 달라집니다.
            </p>
          </FadeUp>

          <FadeUp delay={0.1}>
            <p className="text-xs text-muted-foreground mb-2 lg:hidden">← 좌우로 스크롤하여 비교해 보세요</p>
            <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
              <table className="w-full border-collapse min-w-[640px]">
                <thead>
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground border-b border-border/50 w-1/4">
                      구분
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground border-b border-border/50 w-[37.5%]">
                      <span className="flex items-center gap-2">
                        <X className="w-4 h-4 text-red-400" />
                        일반 인테리어 업체
                      </span>
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gold border-b border-gold/30 w-[37.5%] bg-gold/5">
                      <span className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-gold" />
                        고감도
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-border/30 last:border-0"
                    >
                      <td className="py-4 px-6 text-sm font-semibold text-ink">
                        {row.category}
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        {row.general}
                      </td>
                      <td className="py-4 px-6 text-sm text-ink font-medium bg-gold/5">
                        {row.kokamdo}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ==================== 6-STEP PROCESS ==================== */}
      <section className="py-20 lg:py-28 bg-ink text-white relative overflow-hidden">
        <div className="absolute top-8 left-8 lg:left-16 opacity-[0.04] select-none pointer-events-none">
          <span className="font-heading text-[10rem] lg:text-[16rem] font-extrabold leading-none">
            PROCESS
          </span>
        </div>
        <div className="container relative z-10">
          <FadeUp>
            <p className="text-xs font-medium tracking-widest uppercase text-gold mb-4">
              Our Process
            </p>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold mb-4 max-w-2xl leading-tight">
              6단계 프로세스,
              <br />
              <span className="text-white/40">빈틈없는 결과</span>
            </h2>
            <p className="text-white/50 mb-16 max-w-lg">
              모든 프로젝트는 동일한 6단계 프로세스를 거칩니다. 체계적인
              시스템이 일관된 품질을 보장합니다.
            </p>
          </FadeUp>

          <div className="space-y-0">
            {PROCESS_STEPS.map((step, i) => (
              <FadeUp key={i} delay={i * 0.08}>
                <div className="group border-t border-white/10 py-10 lg:py-14">
                  <div className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-start">
                    {/* Number + Title */}
                    <div className="lg:col-span-4 flex items-start gap-4">
                      <span className="font-heading text-3xl lg:text-4xl font-extrabold text-gold/30 group-hover:text-gold transition-colors duration-500 leading-none pt-1">
                        {step.number}
                      </span>
                      <div>
                        <h3 className="font-heading text-xl lg:text-2xl font-bold text-white group-hover:text-gold transition-colors duration-500">
                          {step.title}
                        </h3>
                        <span className="text-xs font-medium tracking-widest uppercase text-white/30 mt-1 block">
                          {step.subtitle}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="lg:col-span-4">
                      <p className="text-white/60 leading-relaxed text-sm lg:text-base">
                        {step.description}
                      </p>
                    </div>

                    {/* Details + Diff */}
                    <div className="lg:col-span-4 space-y-4">
                      <ul className="space-y-2">
                        {step.details.map((detail, j) => (
                          <li
                            key={j}
                            className="flex items-start gap-2 text-sm text-white/70"
                          >
                            <Check className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="pt-3 border-t border-white/10">
                        <p className="text-xs text-white/30 flex items-start gap-2">
                          <X className="w-3.5 h-3.5 text-red-400/50 flex-shrink-0 mt-0.5" />
                          <span>{step.diff}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== TECH HIGHLIGHTS ==================== */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <FadeUp>
            <p className="text-xs font-medium tracking-widest uppercase text-gold mb-4">
              Technology
            </p>
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-ink mb-4 max-w-2xl leading-tight">
              자체 개발 기술로
              <br />
              <span className="text-ink/40">차원이 다른 서비스</span>
            </h2>
            <p className="text-muted-foreground mb-16 max-w-lg">
              고감도는 인테리어 회사이면서 동시에 기술 회사입니다. 자체
              개발한 플랫폼과 AI 기술이 모든 프로세스를 뒷받침합니다.
            </p>
          </FadeUp>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TECH_HIGHLIGHTS.map((tech, i) => (
              <FadeUp key={i} delay={i * 0.08}>
                <div className="p-8 border border-border/50 hover:border-gold/30 transition-all duration-500 group h-full">
                  <div className="text-ink/20 group-hover:text-gold transition-colors duration-500 mb-6">
                    {tech.icon}
                  </div>
                  <h3 className="font-heading text-lg font-bold text-ink mb-3">
                    {tech.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tech.desc}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== QUOTE ==================== */}
      <section className="py-16 lg:py-20 bg-paper-warm">
        <div className="container">
          <FadeUp>
            <div className="max-w-3xl mx-auto text-center">
              <div className="text-gold text-5xl font-heading mb-6">"</div>
              <blockquote className="font-heading text-xl lg:text-2xl font-semibold text-ink leading-relaxed mb-6">
                좋은 공간은 좋은 시스템에서 나옵니다.
                <br />
                우리는 35년간의 데이터와 기술로
                <br />
                그 시스템을 만들어 왔습니다.
              </blockquote>
              <p className="text-sm text-muted-foreground">
                — (주)고감도 대표이사
              </p>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <section className="py-20 lg:py-28 bg-ink text-white">
        <div className="container">
          <FadeUp>
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-heading text-3xl lg:text-4xl font-bold mb-6">
                다른 방식으로,
                <br />
                다른 결과를 경험하세요
              </h2>
              <p className="text-white/50 mb-10 leading-relaxed">
                데이터 기반 설계와 투명한 프로세스가 만드는 차이를 직접
                확인해 보세요. AI 견적으로 예상 비용을 먼저 확인하거나,
                전문 컨설턴트와 무료 상담을 시작하세요.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/estimator">
                  <span
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-gold text-ink font-semibold text-sm tracking-wide hover:bg-gold-light transition-all duration-300 cursor-pointer"
                    onClick={() =>
                      analytics.trackEvent("cta_click", {
                        location: "how_we_work_bottom",
                        action: "estimator",
                      })
                    }
                  >
                    AI 예상 견적 받기
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </Link>
                <Link href="/contact">
                  <span
                    className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/30 text-white font-medium text-sm tracking-wide hover:bg-white/10 transition-all duration-300 cursor-pointer"
                    onClick={() =>
                      analytics.trackEvent("cta_click", {
                        location: "how_we_work_bottom",
                        action: "contact",
                      })
                    }
                  >
                    무료 상담 신청
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>
    </>
  );
}
