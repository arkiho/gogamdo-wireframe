import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  DraftingCompass,
  HardHat,
  Ruler,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { analytics } from "@/lib/analytics";
import SEOHead, { SEO_CONFIG } from "@/components/SEOHead";
import { trpc } from "@/lib/trpc";

const PROCESS = [
  {
    title: "업무·면적 진단",
    description: "인원, 좌석 방식, 회의와 지원공간 요구를 확인해 필요한 면적을 먼저 판단합니다.",
    icon: Ruler,
  },
  {
    title: "공간 기획",
    description: "부서 관계, 방문객과 직원 동선, 집중·협업 환경을 기준으로 공간을 구성합니다.",
    icon: ClipboardCheck,
  },
  {
    title: "설계",
    description: "레이아웃과 마감, 설비·전기·네트워크 요구를 하나의 실행안으로 정리합니다.",
    icon: DraftingCompass,
  },
  {
    title: "시공·공정관리",
    description: "현장 조건과 변경사항을 관리하고 주요 진행 내용을 고객과 공유합니다.",
    icon: HardHat,
  },
  {
    title: "준공·사후관리",
    description: "완공 점검과 인수인계를 거쳐 운영 중 필요한 보완사항까지 이어서 관리합니다.",
    icon: Wrench,
  },
];

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-64px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const publishedPortfolios = trpc.portfolio.published.useQuery(undefined, {
    staleTime: 60_000,
  });
  const featuredProjects = (publishedPortfolios.data || []).slice(0, 3);

  return (
    <>
      <SEOHead {...SEO_CONFIG.home} />

      <section className="relative min-h-[92vh] flex items-end overflow-hidden bg-ink pb-16 pt-32 lg:pb-24">
        <picture>
          <source media="(max-width: 767px)" srcSet="/images/office-hero-mobile.webp" />
          <img
            src="/images/office-hero.webp"
            alt="고감도가 설계·시공한 오피스 공간"
            width="1600"
            height="893"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20" />

        <div className="container relative z-10">
          <div className="max-w-4xl">
            <FadeUp>
              <div className="mb-6 flex flex-wrap gap-2">
                <span className="border border-gold/50 bg-black/40 px-3 py-1.5 text-xs font-semibold tracking-wide text-gold backdrop-blur-sm">
                  오피스 인테리어 전문
                </span>
                <span className="border border-white/35 bg-black/40 px-3 py-1.5 text-xs font-semibold tracking-wide text-white backdrop-blur-sm">
                  학교·공공기관 관급공사
                </span>
              </div>
            </FadeUp>

            <FadeUp delay={0.08}>
              <p className="mb-4 text-sm font-semibold tracking-[0.16em] text-gold">
                기업의 일하는 방식부터 진단
              </p>
              <h1 className="max-w-4xl font-heading text-4xl font-bold leading-[1.12] text-white sm:text-5xl lg:text-7xl">
                기업 이전부터 설계·시공·사후관리까지 책임지는
                <span className="mt-2 block text-gradient-gold">오피스 전문기업</span>
              </h1>
            </FadeUp>

            <FadeUp delay={0.16}>
              <p className="mt-7 max-w-2xl text-base leading-relaxed text-white/70 lg:text-lg">
                부동산 계약보다 먼저 우리 회사에 필요한 면적과 공간 구성을 확인하세요.
                고감도는 진단부터 설계, 시공과 준공 이후까지 하나의 흐름으로 함께합니다.
              </p>
            </FadeUp>

            <FadeUp delay={0.24}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/office-space-calculator"
                  onClick={() => analytics.ctaClick("계약 전 필요 평수 무료 진단", "hero")}
                >
                  <span className="inline-flex w-full items-center justify-center gap-2 bg-gold px-7 py-4 text-sm font-semibold text-ink transition-colors hover:bg-gold-light sm:w-auto">
                    계약 전 필요 평수 무료 진단
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </Link>
                <Link
                  href="/portfolio"
                  onClick={() => analytics.ctaClick("오피스 사례", "hero")}
                >
                  <span className="inline-flex w-full items-center justify-center gap-2 border border-white/45 px-7 py-4 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto">
                    오피스 사례 보기
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
                <Link
                  href="/portfolio"
                  onClick={() => analytics.ctaClick("관급공사 문의", "hero")}
                >
                  <span className="inline-flex w-full items-center justify-center gap-2 border border-gold/55 px-7 py-4 text-sm font-semibold text-gold transition-colors hover:bg-gold/10 sm:w-auto">
                    관급공사 수행역량 보기
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                </Link>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 bg-paper-warm py-16 lg:py-20">
        <div className="container grid gap-8 lg:grid-cols-[1.05fr_1.95fr] lg:items-center">
          <FadeUp>
            <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-gold">BEFORE YOU LEASE</p>
            <h2 className="font-heading text-3xl font-bold leading-tight text-ink lg:text-4xl">
              계약할 평수를 먼저 정하지 마세요
            </h2>
            <p className="mt-4 max-w-lg leading-relaxed text-muted-foreground">
              인원수만으로 면적을 정하면 회의실과 라운지, 서버실, 성장 여유가 빠지기 쉽습니다.
              업무방식과 필요한 공간을 기준으로 권장 범위를 먼저 확인해 보세요.
            </p>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div className="grid gap-4 border border-border/70 bg-white p-6 shadow-sm sm:grid-cols-3 lg:p-8">
              {[
                ["01", "익명 입력", "연락처 없이 인원·좌석·회의실·지원공간 입력"],
                ["02", "즉시 확인", "권장 면적 범위와 주요 공간 배분 확인"],
                ["03", "선택 상담", "상세 PDF나 상담이 필요할 때만 연락처 입력"],
              ].map(([number, title, description]) => (
                <div key={number} className="border-b border-border/50 pb-4 last:border-0 last:pb-0 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4 sm:last:border-r-0">
                  <span className="text-xs font-bold text-gold">{number}</span>
                  <h3 className="mt-2 font-heading text-lg font-bold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>
              ))}
              <div className="sm:col-span-3">
                <Link href="/office-space-calculator">
                  <span className="inline-flex w-full items-center justify-center gap-2 bg-ink px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90">
                    무료 진단 시작하기
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="container">
          <FadeUp>
            <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-gold">END-TO-END RESPONSIBILITY</p>
            <h2 className="max-w-3xl font-heading text-3xl font-bold leading-tight text-ink lg:text-5xl">
              예쁜 공간보다 먼저, 실패할 지점을 줄입니다
            </h2>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted-foreground">
              고감도는 공간을 그리는 일과 실제로 완성하는 일을 분리하지 않습니다.
              사업 요구와 현장 조건을 확인하고 주요 결정을 단계별로 연결합니다.
            </p>
          </FadeUp>

          <div className="mt-12 grid gap-px overflow-hidden border border-border/60 bg-border/60 md:grid-cols-5">
            {PROCESS.map((step, index) => {
              const Icon = step.icon;
              return (
                <FadeUp key={step.title} delay={index * 0.05} className="h-full">
                  <article className="h-full bg-white p-6 lg:p-7">
                    <div className="flex items-center justify-between">
                      <Icon className="h-6 w-6 text-gold" />
                      <span className="text-xs font-bold text-ink/25">0{index + 1}</span>
                    </div>
                    <h3 className="mt-7 font-heading text-lg font-bold text-ink">{step.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                  </article>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-ink py-20 text-white lg:py-28">
        <div className="container">
          <FadeUp>
            <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-gold">TWO SPECIALTIES</p>
            <h2 className="max-w-3xl font-heading text-3xl font-bold leading-tight lg:text-5xl">
              기업 오피스와 공공 공간,
              <span className="block text-white/45">서로 다른 기준으로 수행합니다</span>
            </h2>
          </FadeUp>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <FadeUp>
              <article className="h-full border border-white/15 p-8 lg:p-10">
                <Building2 className="h-7 w-7 text-gold" />
                <h3 className="mt-6 font-heading text-2xl font-bold">오피스 인테리어</h3>
                <p className="mt-4 leading-relaxed text-white/60">
                  사무실 이전과 리뉴얼을 준비하는 기업을 위해 인원, 업무방식, 성장계획과 운영 조건을 공간으로 연결합니다.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-white/75">
                  {["계약 전 필요면적 검토", "업무방식 기반 조닝과 동선", "설계·시공·변경관리 연결"].map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </FadeUp>
            <FadeUp delay={0.08}>
              <article className="h-full border border-white/15 p-8 lg:p-10">
                <ShieldCheck className="h-7 w-7 text-gold" />
                <h3 className="mt-6 font-heading text-2xl font-bold">학교·공공기관 관급공사</h3>
                <p className="mt-4 leading-relaxed text-white/60">
                  교육·공공 공간의 기능과 안전, 일정, 행정 요구를 고려해 공개 승인을 받은 수행 사례를 구분해 소개합니다.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-white/75">
                  {["교육·공공 공간 수행 경험", "운영 중 공사와 일정 대응", "공개 승인 사례만 게시"].map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </FadeUp>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="container">
          <FadeUp>
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-gold">APPROVED CASES</p>
                <h2 className="font-heading text-3xl font-bold text-ink lg:text-5xl">공개 승인된 고객 사례</h2>
              </div>
              <Link href="/portfolio">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-gold">
                  전체 사례 보기 <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </FadeUp>

          {featuredProjects.length > 0 ? (
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {featuredProjects.map((project: any, index: number) => (
                <FadeUp key={project.id} delay={index * 0.06}>
                  <Link href={`/portfolio/p/${project.id}`}>
                    <article className="group overflow-hidden border border-border/60 bg-white">
                      <div className="aspect-[4/3] overflow-hidden bg-paper-warm">
                        {project.coverImage ? (
                          <img
                            src={project.coverImage}
                            alt={project.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">이미지 준비 중</div>
                        )}
                      </div>
                      <div className="p-5">
                        <p className="text-xs font-semibold text-gold">{project.category || "오피스"}</p>
                        <h3 className="mt-2 font-heading text-lg font-bold text-ink">{project.title}</h3>
                        {(project.area || project.location) && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {[project.area, project.location].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                    </article>
                  </Link>
                </FadeUp>
              ))}
            </div>
          ) : (
            <FadeUp>
              <div className="mt-10 border border-border/60 bg-paper-warm p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  고객사 공개 승인을 받은 사례를 정리하고 있습니다. 상담 시 목적과 조건에 맞는 사례를 안내해 드립니다.
                </p>
              </div>
            </FadeUp>
          )}
        </div>
      </section>

      <section className="bg-paper-warm py-20 lg:py-24">
        <div className="container text-center">
          <FadeUp>
            <h2 className="font-heading text-3xl font-bold leading-tight text-ink lg:text-5xl">
              부동산 계약 전에 필요한 면적부터 확인하세요
            </h2>
            <p className="mx-auto mt-5 max-w-xl leading-relaxed text-muted-foreground">
              기본 결과는 연락처 없이 바로 확인할 수 있습니다. 더 자세한 검토가 필요할 때만 상담을 요청하세요.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/office-space-calculator">
                <span className="inline-flex items-center justify-center gap-2 bg-gold px-8 py-4 text-sm font-semibold text-ink hover:bg-gold-light">
                  필요 평수 무료 진단
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
              <Link href="/contact">
                <span className="inline-flex items-center justify-center gap-2 border border-ink/30 px-8 py-4 text-sm font-semibold text-ink hover:bg-white">
                  프로젝트 상담
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>
    </>
  );
}
