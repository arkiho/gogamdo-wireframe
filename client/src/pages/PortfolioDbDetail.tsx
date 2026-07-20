/*
 * DB에서 가져온 게시된 포트폴리오 상세 페이지
 * Before/After 비교 슬라이더 통합
 */

import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import SEOHead from "@/components/SEOHead";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowUpRight, MapPin, Calendar, Ruler, Building2, Clock,
  SplitSquareHorizontal, Grid3X3, X, Star, MessageSquare, Quote, Shield,
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

export default function PortfolioDbDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

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
              <ArrowLeft className="w-4 h-4" /> 고객 사례로 돌아가기
            </span>
          </Link>
        </div>
      </div>
    );
  }

  const images = project.images || [];
  const coverImage = images.find((img: any) => img.isCover === "yes") || images[0];
  const galleryImages = images.filter((img: any) => img.id !== coverImage?.id);
  const beforeAfterImages = images.filter((img: any) => img.beforeUrl);
  const regularGalleryImages = galleryImages.filter((img: any) => !img.beforeUrl);

  return (
    <>
      <SEOHead
        title={`${project.title} | 고객 사례`}
        description={`${project.title} - ${project.category || ''} ${project.area || ''} ${project.location || ''} 사무실 인테리어 시공 사례`}
        path={`/portfolio/p/${id}`}
        image={coverImage?.processedUrl || coverImage?.originalUrl}
      />

      {/* CreativeWork + ImageGallery 구조화 데이터 (AEO) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: project.title,
            headline: project.title,
            description: project.description || project.aiDescription || `${project.title} 사무실 인테리어 시공 사례`,
            image: images.map((img: any) => img.processedUrl || img.originalUrl).filter(Boolean),
            creator: { "@type": "Organization", name: "(주)고감도", url: "https://kokamdo.co.kr" },
            genre: project.category || undefined,
            locationCreated: project.location ? { "@type": "Place", name: project.location } : undefined,
            url: `https://kokamdo.co.kr/portfolio/p/${project.id}`,
            ...(images.length > 0
              ? {
                  associatedMedia: {
                    "@type": "ImageGallery",
                    name: `${project.title} 시공 사진`,
                    image: images
                      .map((img: any) => img.processedUrl || img.originalUrl)
                      .filter(Boolean)
                      .map((url: string) => ({ "@type": "ImageObject", contentUrl: url, caption: project.title })),
                  },
                }
              : {}),
          }),
        }}
      />

      {/* Hero */}
      <section className="pt-28 lg:pt-36 pb-12 lg:pb-16">
        <div className="container">
          <FadeUp>
            <Link href="/portfolio">
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-ink transition-colors mb-8">
                <ArrowLeft className="w-4 h-4" />
                고객 사례
              </span>
            </Link>
            <div className="flex items-center gap-3 mb-4">
              {project.category && (
                <span className="px-3 py-1 text-xs font-medium bg-gold/10 text-gold border border-gold/20">
                  {project.category}
                </span>
              )}
              {beforeAfterImages.length > 0 && (
                <span className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 inline-flex items-center gap-1">
                  <SplitSquareHorizontal className="w-3 h-3" />
                  Before/After {beforeAfterImages.length}장
                </span>
              )}
            </div>
            <h1 className="font-heading text-3xl lg:text-5xl font-bold text-ink leading-tight mb-6">
              {project.title}
            </h1>
          </FadeUp>
        </div>
      </section>

      {/* Cover Image - show as B/A slider if cover has beforeUrl */}
      {coverImage && (
        <section className="pb-12">
          <div className="container">
            <FadeUp>
              {coverImage.beforeUrl ? (
                <div className="aspect-[16/9] overflow-hidden rounded-lg">
                  <BeforeAfterSlider
                    beforeImage={coverImage.beforeUrl}
                    afterImage={coverImage.processedUrl || coverImage.originalUrl}
                    beforeLabel="시공 전"
                    afterLabel="시공 후"
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src={coverImage.processedUrl || coverImage.originalUrl}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </FadeUp>
          </div>
        </section>
      )}

      {/* Project Info */}
      <section className="pb-16">
        <div className="container">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Left: Description + Challenge/Solution/Result */}
            <div className="lg:col-span-2 space-y-10">
              <FadeUp>
                <h2 className="font-heading text-2xl font-bold text-ink mb-6">프로젝트 개요</h2>
                <p className="text-ink/70 leading-relaxed text-lg">
                  {project.aiDescription || project.description || "프로젝트 설명이 준비 중입니다."}
                </p>
              </FadeUp>

              {/* 과제 · 솔루션 · 성과 구조 */}
              {(project.challenge || project.solution || project.result) && (
                <FadeUp delay={0.15}>
                  <div className="grid sm:grid-cols-3 gap-6">
                    {project.challenge && (
                      <div className="bg-red-50/50 border border-red-100 p-5">
                        <div className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3">과제</div>
                        <p className="text-sm text-ink/70 leading-relaxed">{project.challenge}</p>
                      </div>
                    )}
                    {project.solution && (
                      <div className="bg-blue-50/50 border border-blue-100 p-5">
                        <div className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-3">솔루션</div>
                        <p className="text-sm text-ink/70 leading-relaxed">{project.solution}</p>
                      </div>
                    )}
                    {project.result && (
                      <div className="bg-green-50/50 border border-green-100 p-5">
                        <div className="text-xs font-bold text-green-600 uppercase tracking-widest mb-3">성과</div>
                        <p className="text-sm text-ink/70 leading-relaxed">{project.result}</p>
                      </div>
                    )}
                  </div>
                </FadeUp>
              )}
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

              {/* 승인 안내 문구 */}
              <FadeUp delay={0.2}>
                <div className="mt-6 bg-ink/[0.03] border border-border/40 p-4 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-ink">
                      본 사례는 고객사의 승인 하에 공개되었습니다
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      고감도는 고객사의 내부 공간 정보를 철저히 보호합니다. 모든 프로젝트 사례는 해당 고객사의 사전 동의를 받은 경우에만 게재됩니다.
                    </p>
                  </div>
                </div>
              </FadeUp>
            </div>
          </div>
        </div>
      </section>

      {/* Before/After Comparison Section */}
      {beforeAfterImages.length > 0 && (
        <section className="pb-20 lg:pb-28 bg-paper-warm py-16 lg:py-24">
          <div className="container">
            <FadeUp>
              <div className="flex items-center gap-3 mb-2">
                <SplitSquareHorizontal className="w-5 h-5 text-gold" />
                <p className="text-xs font-medium tracking-widest uppercase text-gold">
                  Before & After
                </p>
              </div>
              <h2 className="font-heading text-2xl lg:text-4xl font-bold text-ink mb-4">
                시공 전후 비교
              </h2>
              <p className="text-muted-foreground mb-12 max-w-lg">
                슬라이더를 좌우로 드래그하여 시공 전후의 변화를 직접 확인하세요.
              </p>
            </FadeUp>
            <div className="space-y-12">
              {beforeAfterImages.map((img: any, i: number) => (
                <FadeUp key={img.id} delay={i * 0.1}>
                  <div className="max-w-4xl mx-auto">
                    <div className="aspect-[16/10] overflow-hidden rounded-lg shadow-lg">
                      <BeforeAfterSlider
                        beforeImage={img.beforeUrl}
                        afterImage={img.processedUrl || img.originalUrl}
                        beforeLabel="시공 전"
                        afterLabel="시공 후"
                        className="w-full h-full"
                      />
                    </div>
                    {img.caption && (
                      <p className="text-sm text-muted-foreground mt-3 text-center">{img.caption}</p>
                    )}
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Regular Gallery */}
      {regularGalleryImages.length > 0 && (
        <section className="pb-20 lg:pb-28">
          <div className="container">
            <FadeUp>
              <div className="flex items-center gap-3 mb-2">
                <Grid3X3 className="w-5 h-5 text-gold" />
                <p className="text-xs font-medium tracking-widest uppercase text-gold">
                  Gallery
                </p>
              </div>
              <h2 className="font-heading text-2xl font-bold text-ink mb-8">프로젝트 갤러리</h2>
            </FadeUp>
            <div className="grid md:grid-cols-2 gap-6">
              {regularGalleryImages.map((img: any, i: number) => (
                <FadeUp key={img.id} delay={i * 0.1}>
                  <div
                    className="aspect-[4/3] overflow-hidden cursor-pointer group"
                    onClick={() => setLightboxIdx(i)}
                  >
                    <img
                      src={img.processedUrl || img.originalUrl}
                      alt={img.caption || `${project.title} - ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
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

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
            onClick={() => setLightboxIdx(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={regularGalleryImages[lightboxIdx]?.processedUrl || regularGalleryImages[lightboxIdx]?.originalUrl}
            alt=""
            className="max-w-full max-h-[90vh] object-contain"
            onClick={e => e.stopPropagation()}
          />
          {/* Navigation arrows */}
          {regularGalleryImages.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                onClick={e => {
                  e.stopPropagation();
                  setLightboxIdx(prev => prev !== null ? (prev - 1 + regularGalleryImages.length) % regularGalleryImages.length : 0);
                }}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors rotate-180"
                onClick={e => {
                  e.stopPropagation();
                  setLightboxIdx(prev => prev !== null ? (prev + 1) % regularGalleryImages.length : 0);
                }}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            </>
          )}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-sm">
            {lightboxIdx + 1} / {regularGalleryImages.length}
          </div>
        </div>
      )}

      {/* Client Review Section */}
      <ReviewSection portfolioId={id} />

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

/**
 * 담당자 리뷰 섹션 - 승인된 리뷰만 표시
 */
function ReviewSection({ portfolioId }: { portfolioId: number }) {
  const { data: reviews, isLoading } = trpc.portfolioReview.approved.useQuery(
    { portfolioId },
    { enabled: portfolioId > 0 }
  );

  // 리뷰가 없으면 "아직 리뷰가 없습니다" 표시
  return (
    <section className="py-16 lg:py-24">
      <div className="container">
        <FadeUp>
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-5 h-5 text-gold" />
            <p className="text-xs font-medium tracking-widest uppercase text-gold">
              Client Review
            </p>
          </div>
          <h2 className="font-heading text-2xl lg:text-4xl font-bold text-ink mb-4">
            담당자 리뷰
          </h2>
          <p className="text-muted-foreground mb-10 max-w-lg">
            프로젝트를 함께한 담당자분의 솔직한 후기입니다.
          </p>
        </FadeUp>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-ink/5 rounded" />
          </div>
        ) : !reviews || reviews.length === 0 ? (
          <FadeUp delay={0.1}>
            <div className="bg-paper-warm border border-border/30 p-10 text-center">
              <MessageSquare className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">
                아직 리뷰가 없습니다.
              </p>
            </div>
          </FadeUp>
        ) : (
          <div className="space-y-6">
            {reviews.map((review: any, i: number) => (
              <FadeUp key={review.id} delay={i * 0.1}>
                <div className="bg-white border border-border/30 p-6 lg:p-8 relative">
                  {/* Quote icon */}
                  <Quote className="absolute top-6 right-6 w-8 h-8 text-gold/10" />

                  {/* Rating */}
                  {review.rating && (
                    <div className="flex items-center gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((s: number) => (
                        <Star
                          key={s}
                          className={`w-5 h-5 ${
                            s <= review.rating
                              ? "fill-gold text-gold"
                              : "fill-transparent text-ink/15"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Title */}
                  {review.title && (
                    <h3 className="font-heading text-lg font-bold text-ink mb-3">
                      "{review.title}"
                    </h3>
                  )}

                  {/* Content */}
                  <p className="text-ink/70 leading-relaxed mb-4">
                    {review.content}
                  </p>

                  {/* Highlights */}
                  {review.highlights && (review.highlights as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-5">
                      {(review.highlights as string[]).map((h: string) => (
                        <span
                          key={h}
                          className="px-2.5 py-1 text-xs font-medium bg-gold/10 text-gold border border-gold/20"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Reviewer info */}
                  <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                    <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center">
                      <span className="text-gold font-bold text-sm">
                        {review.reviewerName?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-ink text-sm">
                        {review.reviewerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[review.reviewerTitle, review.reviewerCompany]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
