import { PROJECTS } from "@/lib/images";
import { useParams, Link } from "wouter";
import { useEffect } from "react";
import { analytics } from "@/lib/analytics";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Calendar, MapPin, Clock,
  Ruler, ChevronRight, ArrowUpRight, Quote, SplitSquareHorizontal,
} from "lucide-react";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";

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

export default function ProjectDetail() {
  const params = useParams<{ slug: string }>();
  const project = PROJECTS.find(p => p.slug === params.slug);

  // Track portfolio view
  useEffect(() => {
    if (project) {
      analytics.portfolioView(project.slug, project.name);
    }
  }, [project?.slug]);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="font-heading text-3xl font-bold text-ink">프로젝트를 찾을 수 없습니다</h1>
          <Link href="/portfolio">
            <span className="inline-flex items-center gap-2 text-gold hover:text-gold-dark transition-colors">
              <ArrowLeft className="w-4 h-4" /> 전체 프로젝트 보기
            </span>
          </Link>
        </div>
      </div>
    );
  }

  // Find adjacent projects for navigation
  const currentIdx = PROJECTS.findIndex(p => p.slug === params.slug);
  const prevProject = currentIdx > 0 ? PROJECTS[currentIdx - 1] : null;
  const nextProject = currentIdx < PROJECTS.length - 1 ? PROJECTS[currentIdx + 1] : null;

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-[60vh] lg:h-[70vh] overflow-hidden">
        {project.beforeImage ? (
          <BeforeAfterSlider
            beforeImage={project.beforeImage}
            afterImage={project.image}
            beforeLabel="시공 전"
            afterLabel="시공 후"
            className="w-full h-full"
          />
        ) : (
          <img
            src={project.image}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

        {/* Breadcrumb */}
        <div className="absolute top-24 left-0 right-0 z-10">
          <div className="container">
            <nav className="flex items-center gap-2 text-sm text-white/60">
              <Link href="/">
                <span className="hover:text-white transition-colors">홈</span>
              </Link>
              <ChevronRight className="w-3 h-3" />
              <Link href="/portfolio">
                <span className="hover:text-white transition-colors">프로젝트</span>
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white">{project.name}</span>
            </nav>
          </div>
        </div>

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="container pb-12 lg:pb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="inline-block px-3 py-1 mb-4 text-xs font-medium tracking-widest uppercase text-gold border border-gold/30">
                {project.category}
              </span>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-2">
                {project.name}
              </h1>
              <p className="text-white/50 text-lg font-heading">{project.nameEn}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Project Info Bar */}
      <section className="py-8 border-b border-border/50 bg-white">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-paper-warm">
                <MapPin className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">위치</p>
                <p className="text-sm font-medium text-ink">{project.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-paper-warm">
                <Ruler className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">면적</p>
                <p className="text-sm font-medium text-ink">{project.area}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-paper-warm">
                <Calendar className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">완공</p>
                <p className="text-sm font-medium text-ink">{project.year}년</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-paper-warm">
                <Clock className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">공사기간</p>
                <p className="text-sm font-medium text-ink">{project.duration}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-7">
              <FadeUp>
                <p className="text-xs font-medium tracking-widest uppercase text-gold mb-4">
                  Project Overview
                </p>
                <h2 className="font-heading text-2xl lg:text-3xl font-bold text-ink mb-6 leading-tight">
                  프로젝트 개요
                </h2>
                <p className="text-ink/70 leading-relaxed text-lg">
                  {project.description}
                </p>
              </FadeUp>

              {/* Scope */}
              <FadeUp delay={0.1}>
                <div className="mt-10">
                  <h3 className="font-heading text-lg font-bold text-ink mb-4">수행 범위</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.scope.map((item, i) => (
                      <span
                        key={i}
                        className="px-4 py-2 text-sm font-medium bg-paper-warm text-ink border border-border/50"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </FadeUp>
            </div>

            <div className="lg:col-span-5 space-y-8">
              {/* Challenge */}
              <FadeUp delay={0.2}>
                <div className="p-6 lg:p-8 bg-ink text-white">
                  <h3 className="font-heading text-lg font-bold mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-gold rounded-full" />
                    Challenge
                  </h3>
                  <p className="text-white/70 leading-relaxed text-sm">
                    {project.challenge}
                  </p>
                </div>
              </FadeUp>

              {/* Solution */}
              <FadeUp delay={0.3}>
                <div className="p-6 lg:p-8 border border-gold/30 bg-gold/5">
                  <h3 className="font-heading text-lg font-bold text-ink mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-gold rounded-full" />
                    Solution
                  </h3>
                  <p className="text-ink/70 leading-relaxed text-sm">
                    {project.solution}
                  </p>
                </div>
              </FadeUp>

              {/* Highlights */}
              {project.highlights && project.highlights.length > 0 && (
                <FadeUp delay={0.4}>
                  <div className="p-6 lg:p-8 bg-paper-warm">
                    <h3 className="font-heading text-lg font-bold text-ink mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-gold rounded-full" />
                      Key Highlights
                    </h3>
                    <ul className="space-y-3">
                      {project.highlights.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-ink/70">
                          <span className="mt-1.5 w-1.5 h-1.5 bg-gold rounded-full flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeUp>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      {project.testimonial && (
        <section className="py-16 lg:py-24 bg-paper-warm">
          <div className="container">
            <FadeUp>
              <div className="max-w-3xl mx-auto text-center">
                <Quote className="w-10 h-10 text-gold/30 mx-auto mb-6" />
                <blockquote className="font-heading text-xl lg:text-2xl font-medium text-ink leading-relaxed mb-8">
                  "{project.testimonial.text}"
                </blockquote>
                <div>
                  <p className="font-heading font-bold text-ink">{project.testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{project.testimonial.role}</p>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>
      )}

      {/* Project Navigation */}
      <section className="py-12 border-t border-border/50">
        <div className="container">
          <div className="flex items-center justify-between">
            {prevProject ? (
              <Link href={`/portfolio/${prevProject.slug}`}>
                <span className="group flex items-center gap-3 text-ink hover:text-gold transition-colors">
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">이전 프로젝트</p>
                    <p className="font-heading font-semibold">{prevProject.name}</p>
                  </div>
                </span>
              </Link>
            ) : (
              <div />
            )}

            <Link href="/portfolio">
              <span className="text-sm font-medium text-muted-foreground hover:text-ink transition-colors">
                전체 목록
              </span>
            </Link>

            {nextProject ? (
              <Link href={`/portfolio/${nextProject.slug}`}>
                <span className="group flex items-center gap-3 text-ink hover:text-gold transition-colors">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">다음 프로젝트</p>
                    <p className="font-heading font-semibold">{nextProject.name}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20 bg-ink text-white">
        <div className="container text-center">
          <FadeUp>
            <h2 className="font-heading text-2xl lg:text-4xl font-bold mb-4">
              비슷한 프로젝트를 계획하고 계신가요?
            </h2>
            <p className="text-white/50 mb-8 max-w-lg mx-auto">
              고감도의 전문 컨설턴트가 귀사에 최적화된 공간 솔루션을 제안해 드립니다.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/estimator">
                <span className="inline-flex items-center gap-2 px-7 py-3.5 bg-gold text-ink font-semibold text-sm tracking-wide hover:bg-gold-light transition-all duration-300">
                  AI 예상 견적 받기
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </Link>
              <Link href="/contact">
                <span className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/30 text-white font-medium text-sm tracking-wide hover:bg-white/10 transition-all duration-300">
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
