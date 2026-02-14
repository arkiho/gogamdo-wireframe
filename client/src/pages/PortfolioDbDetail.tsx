/*
 * DB에서 가져온 게시된 포트폴리오 상세 페이지
 */

import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, MapPin, Calendar, Ruler, Building2, Clock } from "lucide-react";

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

export default function PortfolioDbDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0");

  const { data: project, isLoading } = trpc.portfolio.detail.useQuery(
    { id },
    { enabled: id > 0 }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="font-heading text-2xl font-bold text-ink">프로젝트를 찾을 수 없습니다</h1>
          <Link href="/portfolio">
            <span className="inline-flex items-center gap-2 text-gold hover:underline">
              <ArrowLeft className="w-4 h-4" /> 포트폴리오로 돌아가기
            </span>
          </Link>
        </div>
      </div>
    );
  }

  const images = project.images || [];
  const coverImage = images.find((img: any) => img.isCover === "yes") || images[0];
  const galleryImages = images.filter((img: any) => img.id !== coverImage?.id);

  return (
    <>
      {/* Hero */}
      <section className="pt-28 lg:pt-36 pb-12 lg:pb-16">
        <div className="container">
          <FadeUp>
            <Link href="/portfolio">
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-ink transition-colors mb-8">
                <ArrowLeft className="w-4 h-4" />
                포트폴리오
              </span>
            </Link>
            <div className="flex items-center gap-3 mb-4">
              {project.category && (
                <span className="px-3 py-1 text-xs font-medium bg-gold/10 text-gold border border-gold/20">
                  {project.category}
                </span>
              )}
            </div>
            <h1 className="font-heading text-3xl lg:text-5xl font-bold text-ink leading-tight mb-6">
              {project.title}
            </h1>
          </FadeUp>
        </div>
      </section>

      {/* Cover Image */}
      {coverImage && (
        <section className="pb-12">
          <div className="container">
            <FadeUp>
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={coverImage.processedUrl || coverImage.originalUrl}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </FadeUp>
          </div>
        </section>
      )}

      {/* Project Info */}
      <section className="pb-16">
        <div className="container">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Left: Description */}
            <div className="lg:col-span-2">
              <FadeUp>
                <h2 className="font-heading text-2xl font-bold text-ink mb-6">프로젝트 개요</h2>
                <p className="text-ink/70 leading-relaxed text-lg">
                  {project.aiDescription || project.description || "프로젝트 설명이 준비 중입니다."}
                </p>
              </FadeUp>
            </div>

            {/* Right: Details */}
            <div>
              <FadeUp delay={0.1}>
                <div className="bg-paper-warm p-6 space-y-4">
                  <h3 className="font-heading text-sm font-bold text-ink uppercase tracking-widest mb-4">프로젝트 정보</h3>
                  {project.client && (
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-gold flex-shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">고객사</div>
                        <div className="text-sm font-medium text-ink">{project.client}</div>
                      </div>
                    </div>
                  )}
                  {project.area && (
                    <div className="flex items-center gap-3">
                      <Ruler className="w-4 h-4 text-gold flex-shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">면적</div>
                        <div className="text-sm font-medium text-ink">{project.area}</div>
                      </div>
                    </div>
                  )}
                  {project.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gold flex-shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">위치</div>
                        <div className="text-sm font-medium text-ink">{project.location}</div>
                      </div>
                    </div>
                  )}
                  {project.duration && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-gold flex-shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">공사 기간</div>
                        <div className="text-sm font-medium text-ink">{project.duration}</div>
                      </div>
                    </div>
                  )}
                  {project.publishedAt && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gold flex-shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">게시일</div>
                        <div className="text-sm font-medium text-ink">
                          {new Date(project.publishedAt).toLocaleDateString("ko-KR")}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </FadeUp>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      {galleryImages.length > 0 && (
        <section className="pb-20 lg:pb-28">
          <div className="container">
            <FadeUp>
              <h2 className="font-heading text-2xl font-bold text-ink mb-8">프로젝트 갤러리</h2>
            </FadeUp>
            <div className="grid md:grid-cols-2 gap-6">
              {galleryImages.map((img: any, i: number) => (
                <FadeUp key={img.id} delay={i * 0.1}>
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={img.processedUrl || img.originalUrl}
                      alt={img.caption || `${project.title} - ${i + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  {img.caption && (
                    <p className="text-sm text-muted-foreground mt-2">{img.caption}</p>
                  )}
                </FadeUp>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 lg:py-28 bg-ink text-white">
        <div className="container text-center">
          <FadeUp>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold mb-6">
              비슷한 프로젝트를 계획하고 계신가요?
            </h2>
            <p className="text-white/50 mb-10 max-w-md mx-auto">
              AI 견적으로 예상 비용을 확인하고, 전문 컨설턴트와 무료 상담을 시작하세요.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/estimator">
                <span className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-ink font-semibold text-sm tracking-wide hover:bg-gold-light transition-all duration-300">
                  AI 예상 견적 받기
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </Link>
              <Link href="/contact">
                <span className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white font-medium text-sm tracking-wide hover:bg-white/10 transition-all duration-300">
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
