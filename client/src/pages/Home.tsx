/*
 * DESIGN: Precision Studio — Home Page
 * Z-pattern layout: Logo(TL) → CTA(TR) → Hero(Center) → Stats(BL) → Estimator CTA(BR)
 * Neurodesign: Visual hierarchy, social proof counters, emotional flow (fear→empathy→hope)
 * Sections: Hero → Client Logos → Stats → Pain Points → Solutions → Featured Projects → CTA
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { ArrowUpRight, ArrowRight, ChevronRight, Ruler, PenTool, HardHat, CheckCircle2, BarChart3, Database, LineChart, TrendingUp } from "lucide-react";
import { HERO_IMG, PORTFOLIO } from "@/lib/images";
import { analytics } from "@/lib/analytics";
import SEOHead, { SEO_CONFIG } from "@/components/SEOHead";
import { trpc } from "@/lib/trpc";

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

const HERO_VIDEOS = [
  "https://files.manuscdn.com/user_upload_by_module/session_file/98603122/ZlsHWiISvwlDIFdQ.mp4",
  "https://files.manuscdn.com/user_upload_by_module/session_file/98603122/zrLjiZAfRptnMaDh.mp4",
];

function HeroVideo() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoEnd = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_VIDEOS.length);
      setIsTransitioning(false);
    }, 800);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.load();
    video.play().catch(() => {});
  }, [currentIndex]);

  return (
    <div className="absolute inset-0">
      <video
        ref={videoRef}
        className={`w-full h-full object-cover transition-opacity duration-800 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
        src={HERO_VIDEOS[currentIndex]}
        muted
        playsInline
        onEnded={handleVideoEnd}
        poster={HERO_IMG}
      />
      {/* Fallback image for slow connections */}
      <img
        src={HERO_IMG}
        alt="고감도 사무공간 인테리어"
        className="absolute inset-0 w-full h-full object-cover -z-10"
      />
    </div>
  );
}

const CLIENT_LOGOS = [
  "승일일렉트로닉스", "허시드", "LAB543", "필립스", "APEC",
  "엠아이티소프트", "페이퍼랩", "삼성SDS", "현대건설", "LG전자",
];

const STATS = [
  { number: 35, suffix: "년", label: "업력" },
  { number: 100000, suffix: "㎡+", label: "누적 시공 면적" },
  { number: 98, suffix: "%", label: "고객 만족도" },
  { number: 2800, suffix: "+", label: "완료 프로젝트" },
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
    desc: "실측 데이터와 업종별 공간 효율 DB를 기반으로 한 맞춤형 공간 설계",
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
    category: "사무 공간",
    area: "250㎡",
    image: PORTFOLIO.huxeed.image,
  },
  {
    slug: "philips",
    title: "필립스 코리아 오피스",
    category: "사무 공간",
    area: "500㎡",
    image: PORTFOLIO.philips.image,
  },
  {
    slug: "lawfirmjnp",
    title: "JNP 법률사무소",
    category: "사무 공간",
    area: "420㎡",
    image: PORTFOLIO.lawfirmjnp.image,
  },
  {
    slug: "fintechpaybo",
    title: "페이보 핀테크 오피스",
    category: "사무 공간",
    area: "380㎡",
    image: PORTFOLIO.fintechpaybo.image,
  },
  {
    slug: "coworkbridge",
    title: "브릿지 코워킹 스페이스",
    category: "상업 공간",
    area: "450㎡",
    image: PORTFOLIO.coworkbridge.image,
  },
  {
    slug: "heal",
    title: "HEAL 헬스케어 오피스",
    category: "의료·복지",
    area: "350㎡",
    image: PORTFOLIO.heal.image,
  },
];

export default function Home() {
  const { data: aiSetting } = trpc.settings.aiEnabled.useQuery(undefined, {
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const aiEnabled = aiSetting?.enabled ?? true;

  return (
    <>
      <SEOHead {...SEO_CONFIG.home} />
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative min-h-screen flex items-end pb-16 lg:pb-24 overflow-hidden">
        {/* Background Video */}
        <HeroVideo />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10 z-[1]" />

        {/* Oversize Section Number */}
        <div className="absolute top-24 right-8 lg:right-16 opacity-[0.06] select-none pointer-events-none z-[2]">
          <span className="font-heading text-[12rem] lg:text-[20rem] font-extrabold text-white leading-none">
            01
          </span>
        </div>

        {/* Hero Content */}
        <div className="container relative z-[3]">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="inline-block px-3 py-1 text-xs font-medium tracking-widest uppercase text-gold border border-gold/30">
                  Office Interior Specialist
                </span>
                <span className="inline-block px-3 py-1 text-xs font-medium tracking-widest uppercase text-gold/80 border border-gold/20 bg-gold/5">
                  여성기업 인증
                </span>
              </div>
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
              1991년 창업 이래 35년간 2,800건 이상의 프로젝트를 설계하고 시공해 온 경험.
              데이터 기반 설계부터 시공까지 원스톱 솔루션으로 기업의 비전을 공간에 담습니다.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap gap-4"
            >
              {aiEnabled ? (
                <Link href="/estimator" onClick={() => analytics.ctaClick("AI 견적", "hero")}>
                  <span className="inline-flex items-center gap-2 px-7 py-3.5 bg-gold text-ink font-semibold text-sm tracking-wide hover:bg-gold-light transition-all duration-300">
                    AI 예상 견적 받기
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </Link>
              ) : (
                <Link href="/contact" onClick={() => analytics.ctaClick("무료 상담", "hero")}>
                  <span className="inline-flex items-center gap-2 px-7 py-3.5 bg-gold text-ink font-semibold text-sm tracking-wide hover:bg-gold-light transition-all duration-300">
                    무료 상담 신청
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </Link>
              )}
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
                    데이터 기반의 투명한 견적, 체계적인 프로젝트 관리, 검증된 시공 품질.
                    35년간 2,800건 이상의 프로젝트에서 축적한 실측 데이터로 증명해 왔습니다.
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

      {/* ==================== DATA-DRIVEN DESIGN ==================== */}
      <section className="py-20 lg:py-28 bg-[#0a0f1a] text-white relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Content */}
            <div>
              <FadeUp>
                <p className="text-xs font-medium tracking-widest uppercase text-gold mb-4">
                  Data-Driven Design
                </p>
                <h2 className="font-heading text-3xl lg:text-5xl font-bold mb-6 leading-tight">
                  감이 아닌 <span className="text-gradient-gold">데이터</span>로
                  <br />설계합니다
                </h2>
                <p className="text-white/50 leading-relaxed mb-10 max-w-lg">
                  고감도는 35년간 2,800건 이상의 프로젝트에서 축적한 실측 데이터와 거래처 원가 정보를 기반으로 공간을 설계합니다.
                  직감이 아닌 데이터가 설계의 출발점이 되면, 예산 낭비는 줄고 공간 효율은 높아집니다.
                </p>
              </FadeUp>

              <div className="grid grid-cols-2 gap-6">
                <FadeUp delay={0.1}>
                  <div className="p-5 border border-white/10 rounded-sm">
                    <BarChart3 className="w-5 h-5 text-gold mb-3" />
                    <h4 className="font-heading text-sm font-bold mb-1">실적 데이터 분석</h4>
                    <p className="text-white/40 text-xs leading-relaxed">
                      70개 이상 거래처, 44억원 규모의 실제 거래 데이터를 분석하여 정확한 단가를 산출합니다.
                    </p>
                  </div>
                </FadeUp>
                <FadeUp delay={0.15}>
                  <div className="p-5 border border-white/10 rounded-sm">
                    <Database className="w-5 h-5 text-gold mb-3" />
                    <h4 className="font-heading text-sm font-bold mb-1">공간 효율 DB</h4>
                    <p className="text-white/40 text-xs leading-relaxed">
                      업종별 최적 좌석 배치, 동선 패턴, 공용 공간 비율 등 축적된 노하우를 DB화하여 활용합니다.
                    </p>
                  </div>
                </FadeUp>
                <FadeUp delay={0.2}>
                  <div className="p-5 border border-white/10 rounded-sm">
                    <LineChart className="w-5 h-5 text-gold mb-3" />
                    <h4 className="font-heading text-sm font-bold mb-1">비용 예측 모델</h4>
                    <p className="text-white/40 text-xs leading-relaxed">
                      과거 프로젝트 데이터를 기반으로 면적·등급·옵션별 비용을 사전에 정확하게 예측합니다.
                    </p>
                  </div>
                </FadeUp>
                <FadeUp delay={0.25}>
                  <div className="p-5 border border-white/10 rounded-sm">
                    <TrendingUp className="w-5 h-5 text-gold mb-3" />
                    <h4 className="font-heading text-sm font-bold mb-1">시장가 벤치마크</h4>
                    <p className="text-white/40 text-xs leading-relaxed">
                      실시간 자재 시세와 시장 평균 단가를 비교하여 합리적인 견적을 제시합니다.
                    </p>
                  </div>
                </FadeUp>
              </div>
            </div>

            {/* Right: Visual data illustration */}
            <FadeUp delay={0.1}>
              <div className="relative">
                {/* Main stat card */}
                <div className="bg-white/[0.03] border border-white/10 p-8 lg:p-10">
                  <div className="space-y-8">
                    {/* Data point 1 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">견적 정확도</span>
                        <span className="font-heading text-2xl font-bold text-gold">96.4%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-gold/60 to-gold rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: '96.4%' }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </div>
                    {/* Data point 2 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">예산 준수율</span>
                        <span className="font-heading text-2xl font-bold text-gold">94.2%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-gold/60 to-gold rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: '94.2%' }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </div>
                    {/* Data point 3 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">일정 준수율</span>
                        <span className="font-heading text-2xl font-bold text-gold">97.1%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-gold/60 to-gold rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: '97.1%' }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bottom quote */}
                  <div className="mt-10 pt-8 border-t border-white/10">
                    <p className="text-white/30 text-sm leading-relaxed italic">
                      "데이터가 뒷받침하는 설계는 고객에게 신뢰를, 공간에는 효율을 선사합니다."
                    </p>
                    <p className="text-gold text-xs mt-2 font-medium">— (주)고감도 설계팀</p>
                  </div>
                </div>

                {/* Floating accent */}
                <div className="absolute -top-4 -right-4 w-24 h-24 border border-gold/20 opacity-50" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gold/10" />
              </div>
            </FadeUp>
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURED_PROJECTS.map((project, i) => (
              <FadeUp key={i} delay={i * 0.08}>
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

      {/* ==================== AI FEATURES (conditionally rendered) ==================== */}
      {aiEnabled && <section className="py-20 lg:py-28 bg-ink text-white relative overflow-hidden">
        <div className="absolute top-8 right-8 lg:right-16 opacity-[0.04] select-none pointer-events-none">
          <span className="font-heading text-[10rem] lg:text-[16rem] font-extrabold leading-none">
            05
          </span>
        </div>
        <div className="container relative z-10">
          <FadeUp>
            <p className="text-xs font-medium tracking-widest uppercase text-gold mb-4">
              AI-Powered Tools
            </p>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold mb-4 max-w-2xl leading-tight">
              AI로 더 쉽게,<br />
              <span className="text-white/40">더 스마트하게</span>
            </h2>
            <p className="text-white/50 mb-12 max-w-lg">
              인공지능 기술로 인테리어 상담부터 스타일 추천까지, 더 빠르고 정확한 서비스를 경험하세요.
            </p>
          </FadeUp>

          <div className="grid lg:grid-cols-3 gap-6">
            <FadeUp delay={0}>
              <Link href="/ai-chat">
                <div className="group p-8 lg:p-10 border border-white/10 hover:border-gold/30 transition-all duration-500 h-full">
                  <div className="w-12 h-12 flex items-center justify-center bg-gold text-ink mb-6 group-hover:scale-110 transition-transform duration-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-white mb-3">
                    AI 인테리어 상담
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-6">
                    24시간 AI 상담사가 비용, 디자인, 공사 기간 등 인테리어에 대한 모든 궁금증을 실시간으로 답변해 드립니다.
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-gold opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    상담 시작하기 <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            </FadeUp>
            <FadeUp delay={0.1}>
              <Link href="/ai-style">
                <div className="group p-8 lg:p-10 border border-white/10 hover:border-gold/30 transition-all duration-500 h-full">
                  <div className="w-12 h-12 flex items-center justify-center bg-gold text-ink mb-6 group-hover:scale-110 transition-transform duration-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-white mb-3">
                    AI 스타일 추천
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-6">
                    업종, 분위기, 예산에 맞는 맞춤 인테리어 스타일을 AI가 추천하고, 컨러 팔레트와 참고 이미지까지 생성합니다.
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-gold opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    스타일 추천받기 <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            </FadeUp>
            <FadeUp delay={0.2}>
              <Link href="/estimator">
                <div className="group p-8 lg:p-10 border border-white/10 hover:border-gold/30 transition-all duration-500 h-full">
                  <div className="w-12 h-12 flex items-center justify-center bg-gold text-ink mb-6 group-hover:scale-110 transition-transform duration-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><path d="M8 10h8"/><path d="M8 14h4"/></svg>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-white mb-3">
                    AI 예상 견적
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-6">
                    면적, 용도, 등급만 입력하면 AI가 즉시 예상 비용을 산출합니다. 투명한 견적으로 예산 계획을 시작하세요.
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-gold opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    견적 받아보기 <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            </FadeUp>
          </div>
        </div>
      </section>}

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
              {aiEnabled ? "AI 견적으로 예상 비용을 먼저 확인하거나, 전문 컨설턴트와 무료 상담을 시작하세요." : "전문 컨설턴트와 무료 상담을 시작하세요."}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {aiEnabled && (
                <Link href="/estimator">
                  <span className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-ink font-semibold text-sm tracking-wide hover:bg-gold-light transition-all duration-300">
                    AI 예상 견적 받기
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </Link>
              )}
              <Link href="/contact">
                <span className={`inline-flex items-center gap-2 px-8 py-4 font-medium text-sm tracking-wide transition-all duration-300 ${aiEnabled ? "bg-ink text-white hover:bg-ink/90" : "bg-gold text-ink font-semibold hover:bg-gold-light"}`}>
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
