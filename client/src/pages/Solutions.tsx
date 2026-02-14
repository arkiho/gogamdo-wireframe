/*
 * DESIGN: Precision Studio — Solutions Page
 * Neurodesign: Progressive disclosure, 3-choice rule, anchoring effect
 * Sections: Hero → Service Cards → Process → OpsX Integration → CTA
 */

import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowUpRight, Ruler, PenTool, HardHat, Sofa, MonitorSmartphone, ExternalLink, CheckCircle2 } from "lucide-react";
import { SOLUTION_CONSULT_IMG } from "@/lib/images";
import { analytics } from "@/lib/analytics";
import SEOHead, { SEO_CONFIG } from "@/components/SEOHead";

const SOLUTION_IMG = SOLUTION_CONSULT_IMG;

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

const SERVICES = [
  {
    icon: <Ruler className="w-7 h-7" />,
    title: "공간 설계",
    desc: "업무 효율과 브랜드 아이덴티티를 반영한 맞춤형 공간 설계. 동선 분석, 좌석 배치, 조닝 계획까지 데이터 기반으로 접근합니다.",
    features: ["동선 분석 및 최적화", "브랜드 아이덴티티 반영", "법규 검토 및 인허가", "BIM 기반 3D 설계"],
  },
  {
    icon: <PenTool className="w-7 h-7" />,
    title: "디자인 & 3D 렌더링",
    desc: "포토리얼리스틱 3D 렌더링으로 완공 전 공간을 미리 체험할 수 있습니다. VR 워크스루도 제공합니다.",
    features: ["컨셉 디자인 및 무드보드", "포토리얼 3D 렌더링", "VR 워크스루 체험", "마감재 샘플 제안"],
  },
  {
    icon: <HardHat className="w-7 h-7" />,
    title: "시공 관리",
    desc: "자체 시공팀과 검증된 협력사 네트워크로 품질과 일정을 보장합니다. OpsX로 실시간 진행 현황을 공유합니다.",
    features: ["자체 시공팀 운영", "품질 관리 체크리스트", "실시간 진행 현황 공유", "하자 보수 보증"],
  },
  {
    icon: <Sofa className="w-7 h-7" />,
    title: "가구 솔루션",
    desc: "공간에 최적화된 가구 선정부터 맞춤 제작까지. 인체공학적 설계로 직원 건강까지 고려합니다.",
    features: ["인체공학적 가구 선정", "맞춤 가구 제작", "가구 배치 시뮬레이션", "유지보수 서비스"],
  },
];

const PROCESS = [
  { step: "01", title: "상담", desc: "요구사항 파악 및 현장 방문" },
  { step: "02", title: "기획", desc: "컨셉 설계 및 예산 수립" },
  { step: "03", title: "설계", desc: "도면 작성 및 3D 렌더링" },
  { step: "04", title: "시공", desc: "공정 관리 및 품질 검수" },
  { step: "05", title: "인도", desc: "최종 검수 및 A/S 안내" },
];

export default function Solutions() {
  return (
    <>
      <SEOHead {...SEO_CONFIG.solutions} />
      {/* Hero */}
      <section className="pt-32 lg:pt-40 pb-20 lg:pb-28">
        <div className="container">
          <FadeUp>
            <p className="text-xs font-medium tracking-widest uppercase text-gold mb-6">
              Solutions
            </p>
            <h1 className="font-heading text-4xl lg:text-6xl font-bold text-ink leading-tight mb-8 max-w-3xl">
              모든 과정을
              <br />하나의 팀이 책임집니다
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
              설계, 디자인, 시공, 가구까지. 각 분야 전문가로 구성된 원팀이 프로젝트의 시작부터 끝까지 함께합니다.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* Services Grid */}
      <section className="pb-20 lg:pb-28">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-6">
            {SERVICES.map((service, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <div className="p-8 lg:p-10 border border-border/50 hover:border-gold/30 transition-all duration-500 group h-full">
                  <div className="w-14 h-14 flex items-center justify-center bg-paper-warm text-ink mb-6 group-hover:bg-gold transition-colors duration-500">
                    {service.icon}
                  </div>
                  <h3 className="font-heading text-2xl font-bold text-ink mb-3">{service.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">{service.desc}</p>
                  <ul className="space-y-2">
                    {service.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-ink/70">
                        <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 lg:py-28 bg-ink text-white">
        <div className="container">
          <FadeUp>
            <p className="text-xs font-medium tracking-widest uppercase text-gold mb-4">
              Our Process
            </p>
            <h2 className="font-heading text-3xl lg:text-4xl font-bold mb-16">
              프로젝트 진행 프로세스
            </h2>
          </FadeUp>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            {PROCESS.map((p, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <div className="text-center lg:text-left">
                  <span className="font-heading text-4xl lg:text-5xl font-extrabold text-white/10 block mb-3">
                    {p.step}
                  </span>
                  <h3 className="font-heading text-lg font-bold text-white mb-1">{p.title}</h3>
                  <p className="text-sm text-white/40">{p.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* OpsX Integration */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <FadeUp>
              <div className="aspect-[4/3] overflow-hidden">
                <img src={SOLUTION_IMG} alt="OpsX 프로젝트 관리" className="w-full h-full object-cover" />
              </div>
            </FadeUp>
            <FadeUp delay={0.2}>
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <MonitorSmartphone className="w-5 h-5 text-gold" />
                  <p className="text-xs font-medium tracking-widest uppercase text-gold">
                    OpsX Integration
                  </p>
                </div>
                <h2 className="font-heading text-2xl lg:text-4xl font-bold text-ink mb-6 leading-tight">
                  프로젝트 진행 현황을
                  <br />실시간으로 확인하세요
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  고감도의 프로젝트 관리 플랫폼 OpsX를 통해 설계 진행률, 시공 일정, 변경 사항, 비용 현황을
                  실시간으로 확인할 수 있습니다. 더 이상 전화나 이메일로 진행 상황을 확인할 필요가 없습니다.
                </p>
                <ul className="space-y-3 mb-8">
                  {["실시간 공정률 대시보드", "변경 요청 및 승인 워크플로", "비용 추적 및 예산 관리", "사진/도면 공유 및 코멘트"].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-ink/70">
                      <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://opsx.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-white font-medium text-sm hover:bg-ink/90 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    analytics.solutionClick("OpsX");
                    window.open("https://opsx.io", "_blank");
                  }}
                >
                  OpsX 자세히 보기
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 bg-paper-warm">
        <div className="container text-center">
          <FadeUp>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold text-ink mb-6">
              어떤 솔루션이 필요하신가요?
            </h2>
            <p className="text-muted-foreground mb-10 max-w-md mx-auto">
              프로젝트 규모와 요구사항에 맞는 최적의 솔루션을 제안드립니다.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/estimator">
                <span className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-ink font-semibold text-sm tracking-wide hover:bg-gold-light transition-all duration-300">
                  AI 예상 견적 받기
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </Link>
              <Link href="/contact">
                <span className="inline-flex items-center gap-2 px-8 py-4 bg-ink text-white font-medium text-sm tracking-wide hover:bg-ink/90 transition-all duration-300">
                  무료 상담 신청
                </span>
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>
    </>
  );
}
