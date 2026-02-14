/*
 * DESIGN: Precision Studio — Home Page
 * Z-pattern layout: Logo(TL) → CTA(TR) → Hero(Center) → Stats(BL) → Estimator CTA(BR)
 * Neurodesign: Visual hierarchy, social proof counters, emotional flow (fear→empathy→hope)
 * Sections: Hero → Client Logos → Stats → Pain Points → Solutions → Featured Projects → CTA
 */

import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { ArrowUpRight, ArrowRight, ChevronRight, Ruler, PenTool, HardHat, CheckCircle2 } from "lucide-react";
import { HERO_IMG, PORTFOLIO } from "@/lib/images";
import { analytics } from "@/lib/analytics";

// Counter animation hook
function useCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return { count, ref };
}

// Fade-up animation wrapper
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

const CLIENT_LOGOS = [
  "승일일렉트로닉스", "허시드", "LAB543", "필립스", "APEC",
  "엠아이티소프트", "페이퍼랩", "삼성SDS", "현대건설", "LG전자",
];

const STATS = [
  { number: 150, suffix: "+", label: "완료 프로젝트" },
  { number: 50000, suffix: "㎡+", label: "시공 면적" },
  { number: 98, suffix: "%", label: "고객 만족도" },
  { number: 12, suffix: "년", label: "업력" },
];

const PAIN_POINTS = [
  { question: "불투명한 견적으로\n예산을 초과한 경험이 있으신가요?", icon: "💰" },
  { question: "설계 변경이 반복되어\n일정이 지연된 적 있으신가요?", icon: "📐" },
  { question: "시공 품질이 기대에\n미치지 못한 적 있으신가요?", icon: "🔨" },
];

const SOLUTIONS = [
  {
    icon: <Ruler className="w-6 h-6" />,
    title: "공간 설계",
    desc: "업무 효율과 브랜드 아이덴티티를 반영한 맞춤형 공간 설계",
  },
  {
    icon: <PenTool className="w-6 h-6" />,
    title: "디자인 & 3D",
    desc: "포토리얼리스틱 3D 렌더링으로 완공 전 공간을 미리 체험",
  },
  {
    icon: <HardHat className="w-6 h-6" />,
    title: "시공 관리",
    desc: "자체 시공팀과 검증된 협력사 네트워크로 품질과 일정 보장",
  },
];

const FEATURED_PROJECTS = [
  {
    slug: "huxeed",
    title: "허시드 본사",
    category: "사무실 인테리어",
    area: "250㎡",
    image: PORTFOLIO.huxeed.image,
  },
  {
    slug: "lab543",
    title: "LAB543 크리에이티브 스튜디오",
    category: "크리에이티브 스튜디오",
    area: "200㎡",
    image: PORTFOLIO.lab543.image,
  },
  {
    slug: "philips",
    title: "필립스 코리아 오피스",
    category: "글로벌 기업 오피스",
    area: "500㎡",
    image: PORTFOLIO.philips.image,
  },
  {
    slug: "heal",
    title: "HEAL 헬스케어 오피스",
    category: "헬스케어",
    area: "350㎡",
    image: PORTFOLIO.heal.image,
  },
];

export default function Home() {
  return (
    <>
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative min-h-screen flex items-end pb-16 lg:pb-24 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={HERO_IMG}
            alt="고감도 사무공간 인테리어"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        </div>

        {/* Oversize Section Number */}
        <div className="absolute top-24 right-8 lg:right-16 opacity-[0.06] select-none pointer-events-none">
          <span className="font-heading text-[12rem] lg:text-[20rem] font-extrabold text-white leading-none">
            01
          </span>
        </div>

        {/* Hero Content */}
        <div className="container relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="inline-block px-3 py-1 mb-6 text-xs font-medium tracking-widest uppercase text-gold border border-gold/30">
                Office Interior Specialist
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="font-heading text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-[1.1] mb-6"
            >
              공간이 달라지면
              <br />
              <span className="text-gradient-gold">일하는 방식</span>이 달라집니다
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-white/60 text-lg lg:text-xl leading-relaxed mb-10 max-w-xl"
            >
              설계부터 시공까지 원스톱 솔루션. 150건 이상의 프로젝트 경험으로
              기업의 비전을 공간에 담습니다.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap gap-4"
            >
              <Link href="/estimator" onClick={() => analytics.ctaClick("AI 견적", "hero")}>
                <span className="inline-flex items-center gap-2 px-7 py-3.5 bg-gold text-ink font-semibold text-sm tracking-wide hover:bg-gold-light transition-all duration-300">
                  AI 예상 견적 받기
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </Link>
              <Link href="/portfolio" onClick={() => analytics.ctaClick("포트폴리오", "hero")}>
                <span className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/30 text-white font-medium text-sm tracking-wide hover:bg-white/10 transition-all duration-300">
                  프로젝트 보기
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==================== CLIENT LOGOS ==================== */}
      <section className="py-12 lg:py-16 border-b border-border/50 overflow-hidden">
        <div className="container mb-6">
          <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
            Trusted by leading companies
          </p>
        </div>
        <div className="relative">
          <div className="flex animate-[scroll_30s_linear_infinite] gap-16 whitespace-nowrap">
            {[...CLIENT_LOGOS, ...CLIENT_LOGOS].map((logo, i) => (
              <span
                key={i}
                className="text-lg font-heading font-semibold text-ink/15 hover:text-ink/40 transition-colors duration-500 select-none"
              >
                {logo}
              </span>
            ))}
          </div>
        </div>
        <style>{`
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </section>

      {/* ==================== STATS ==================== */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {STATS.map((stat, i) => {
              const counter = useCounter(stat.number);
              return (
                <FadeUp key={i} delay={i * 0.1}>
                  <div ref={counter.ref} className="text-center lg:text-left">
                    <div className="font-heading text-4xl lg:text-5xl font-extrabold text-ink tracking-tight">
                      {stat.number >= 10000
                        ? `${Math.floor(counter.count / 1000).toLocaleString()},${String(counter.count % 1000).padStart(3, "0")}`
                        : counter.count.toLocaleString()}
                      <span className="text-gold">{stat.suffix}</span>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground font-medium">
                      {stat.label}
                    </div>
                  </div>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== PAIN POINTS (Fear → Empathy) ==================== */}
      <section className="py-20 lg:py-28 bg-ink text-white relative overflow-hidden">
        <div className="absolute top-8 left-8 lg:left-16 opacity-[0.04] select-none pointer-events-none">
          <span className="font-heading text-[10rem] lg:text-[16rem] font-extrabold leading-none">
            02
          </span>
        </div>
        <div className="container relative z-10">
          <FadeUp>
            <p className="text-xs font-medium tracking-widest uppercase text-gold mb-4">
              We understand your challenges
            </p>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold mb-16 max-w-2xl leading-tight">
              이런 고민,
              <br />
              <span className="text-white/40">한 번쯤 해보셨을 겁니다</span>
            </h2>
          </FadeUp>

          <div className="grid lg:grid-cols-3 gap-8">
            {PAIN_POINTS.map((point, i) => (
              <FadeUp key={i} delay={i * 0.15}>
                <div className="p-8 lg:p-10 border border-white/10 hover:border-gold/30 transition-colors duration-500 group">
                  <span className="text-4xl mb-6 block">{point.icon}</span>
                  <p className="font-heading text-xl lg:text-2xl font-semibold leading-snug whitespace-pre-line text-white/80 group-hover:text-white transition-colors">
                    {point.question}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>

          <FadeUp delay={0.4}>
            <div className="mt-16 p-8 lg:p-12 border border-gold/20 bg-gold/5">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                <CheckCircle2 className="w-8 h-8 text-gold flex-shrink-0" />
                <div>
                  <h3 className="font-heading text-xl lg:text-2xl font-bold mb-2">
                    고감도는 그 고민을 잘 알고 있습니다
                  </h3>
                  <p className="text-white/50 leading-relaxed">
                    투명한 견적, 체계적인 프로젝트 관리, 검증된 시공 품질.
                    12년간 150건 이상의 프로젝트를 통해 증명해 왔습니다.
                  </p>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ==================== SOLUTIONS (Hope) ==================== */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute top-8 right-8 lg:right-16 opacity-[0.04] select-none pointer-events-none">
          <span className="font-heading text-[10rem] lg:text-[16rem] font-extrabold text-ink leading-none">
            03
          </span>
        </div>
        <div className="container relative z-10">
          <FadeUp>
            <p className="text-xs font-medium tracking-widest uppercase text-gold mb-4">
              Our Solutions
            </p>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold text-ink mb-4 max-w-2xl leading-tight">
              설계부터 시공까지,
              <br />
              원스톱으로 해결합니다
            </h2>
            <p className="text-muted-foreground mb-16 max-w-lg">
              각 분야 전문가로 구성된 팀이 프로젝트의 시작부터 끝까지 함께합니다.
            </p>
          </FadeUp>

          <div className="grid lg:grid-cols-3 gap-6">
            {SOLUTIONS.map((sol, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <Link href="/solutions">
                  <div className="group p-8 lg:p-10 bg-paper-warm border border-border/50 hover:border-gold/40 transition-all duration-500 h-full">
                    <div className="w-12 h-12 flex items-center justify-center bg-ink text-white mb-6 group-hover:bg-gold group-hover:text-ink transition-colors duration-500">
                      {sol.icon}
                    </div>
                    <h3 className="font-heading text-xl font-bold text-ink mb-3">
                      {sol.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                      {sol.desc}
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-gold opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      자세히 보기 <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FEATURED PROJECTS ==================== */}
      <section className="py-20 lg:py-28 bg-paper-warm relative overflow-hidden">
        <div className="absolute top-8 left-8 lg:left-16 opacity-[0.04] select-none pointer-events-none">
          <span className="font-heading text-[10rem] lg:text-[16rem] font-extrabold text-ink leading-none">
            04
          </span>
        </div>
        <div className="container relative z-10">
          <FadeUp>
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-xs font-medium tracking-widest uppercase text-gold mb-4">
                  Featured Projects
                </p>
                <h2 className="font-heading text-3xl lg:text-5xl font-bold text-ink leading-tight">
                  이렇게 해결했습니다
                </h2>
              </div>
              <Link href="/portfolio">
                <span className="hidden lg:inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-gold transition-colors">
                  전체 프로젝트 보기 <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-2 gap-6">
            {FEATURED_PROJECTS.map((project, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <Link href={`/portfolio/${project.slug}`}>
                  <div className="group relative overflow-hidden aspect-[4/3] cursor-pointer">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-2 py-0.5 text-xs font-medium bg-gold/20 text-gold border border-gold/30">
                          {project.category}
                        </span>
                        <span className="text-xs text-white/50">{project.area}</span>
                      </div>
                      <h3 className="font-heading text-xl lg:text-2xl font-bold text-white group-hover:text-gold transition-colors duration-500">
                        {project.title}
                      </h3>
                    </div>
                  </div>
                </Link>
              </FadeUp>
            ))}
          </div>

          <div className="lg:hidden mt-8 text-center">
            <Link href="/portfolio">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-gold transition-colors">
                전체 프로젝트 보기 <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== FINAL CTA ==================== */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        <div className="container relative z-10 text-center">
          <FadeUp>
            <p className="text-xs font-medium tracking-widest uppercase text-gold mb-6">
              Get Started
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-6xl font-bold text-ink mb-6 leading-tight">
              새로운 공간을
              <br />
              시작할 준비가 되셨나요?
            </h2>
            <p className="text-muted-foreground mb-10 max-w-lg mx-auto">
              AI 견적으로 예상 비용을 먼저 확인하거나,
              전문 컨설턴트와 무료 상담을 시작하세요.
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
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>
    </>
  );
}
