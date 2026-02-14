/*
 * Resources (리드 마그넷) Page
 * 무료 자료 다운로드 + 이메일 수집
 * 뇌과학: 호혜성 원칙(무료 가치 제공 → 신뢰 구축), 앵커링(프리미엄 자료 강조)
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { trackEvent } from "@/lib/analytics";
import {
  Download, FileText, BarChart3, CheckCircle2,
  BookOpen, Lightbulb, ArrowRight, Lock
} from "lucide-react";
import SEOHead, { SEO_CONFIG } from "@/components/SEOHead";

const RESOURCES = [
  {
    id: "office-checklist",
    title: "사무실 인테리어 체크리스트",
    subtitle: "이전·리모델링 시 꼭 확인해야 할 50가지",
    description: "공간 기획부터 시공 완료까지, 놓치기 쉬운 핵심 체크포인트를 정리한 실무 가이드입니다. 예산 초과와 일정 지연을 방지하는 데 도움이 됩니다.",
    icon: <CheckCircle2 className="w-6 h-6" />,
    category: "체크리스트",
    pages: 12,
    popular: true,
  },
  {
    id: "trend-report-2026",
    title: "2026 오피스 트렌드 리포트",
    subtitle: "하이브리드 워크 시대의 공간 전략",
    description: "글로벌 오피스 디자인 트렌드와 국내 시장 동향을 분석한 리포트입니다. 하이브리드 근무, 웰니스 공간, AI 통합 오피스 등 최신 트렌드를 다룹니다.",
    icon: <BarChart3 className="w-6 h-6" />,
    category: "리포트",
    pages: 24,
    popular: false,
  },
  {
    id: "cost-guide",
    title: "사무실 인테리어 비용 가이드",
    subtitle: "평당 단가부터 숨은 비용까지",
    description: "공종별 평당 단가, 마감재 등급별 비용 차이, 예상치 못한 추가 비용 항목까지 투명하게 정리한 비용 안내서입니다.",
    icon: <FileText className="w-6 h-6" />,
    category: "가이드",
    pages: 16,
    popular: true,
  },
  {
    id: "space-planning",
    title: "효율적인 공간 배치 가이드",
    subtitle: "업무 생산성을 높이는 레이아웃 전략",
    description: "부서별 특성에 맞는 공간 배치, 동선 최적화, 협업 공간과 집중 공간의 균형 등 과학적 근거에 기반한 공간 설계 원칙을 소개합니다.",
    icon: <BookOpen className="w-6 h-6" />,
    category: "가이드",
    pages: 20,
    popular: false,
  },
  {
    id: "brand-space",
    title: "브랜드를 담는 공간 디자인",
    subtitle: "기업 아이덴티티를 공간에 녹이는 방법",
    description: "CI/BI를 인테리어에 반영하는 실전 사례와 방법론입니다. 방문객과 직원 모두에게 브랜드 경험을 전달하는 공간 전략을 다룹니다.",
    icon: <Lightbulb className="w-6 h-6" />,
    category: "케이스 스터디",
    pages: 18,
    popular: false,
  },
];

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

function DownloadModal({
  resource,
  onClose,
}: {
  resource: typeof RESOURCES[0];
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const downloadMutation = trpc.leadMagnet.download.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      trackEvent("lead_magnet_download", {
        resource_id: resource.id,
        resource_title: resource.title,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    downloadMutation.mutate({
      email,
      name: name || undefined,
      company: company || undefined,
      resourceId: resource.id,
      resourceTitle: resource.title,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3 }}
        className="relative bg-white max-w-md w-full p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {!submitted ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 flex items-center justify-center bg-[#C8A96E]/10 text-[#C8A96E]">
                {resource.icon}
              </div>
              <div>
                <h3 className="font-bold text-[#1A1A1A]">{resource.title}</h3>
                <p className="text-sm text-[#1A1A1A]/50">{resource.pages}페이지 PDF</p>
              </div>
            </div>

            <p className="text-sm text-[#1A1A1A]/60 mb-6">
              이메일을 입력하시면 다운로드 링크를 보내드립니다.
              고감도의 인테리어 인사이트도 함께 받아보실 수 있습니다.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#1A1A1A]/60 mb-1.5">
                  이메일 *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-4 py-3 border border-[#1A1A1A]/10 text-sm focus:outline-none focus:border-[#C8A96E] transition-colors bg-white text-[#1A1A1A]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1A1A1A]/60 mb-1.5">
                  이름
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full px-4 py-3 border border-[#1A1A1A]/10 text-sm focus:outline-none focus:border-[#C8A96E] transition-colors bg-white text-[#1A1A1A]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1A1A1A]/60 mb-1.5">
                  회사명
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="(주)고감도"
                  className="w-full px-4 py-3 border border-[#1A1A1A]/10 text-sm focus:outline-none focus:border-[#C8A96E] transition-colors bg-white text-[#1A1A1A]"
                />
              </div>

              <button
                type="submit"
                disabled={downloadMutation.isPending}
                className="w-full py-3.5 bg-[#C8A96E] text-[#1A1A1A] font-semibold text-sm tracking-wide hover:bg-[#B8994E] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {downloadMutation.isPending ? (
                  "처리 중..."
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    무료 다운로드
                  </>
                )}
              </button>

              <p className="text-xs text-[#1A1A1A]/40 text-center">
                입력하신 정보는 자료 발송 및 뉴스레터 구독에만 사용됩니다.
              </p>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-green-50 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="font-bold text-xl text-[#1A1A1A] mb-2">
              신청이 완료되었습니다
            </h3>
            <p className="text-sm text-[#1A1A1A]/60 mb-6">
              입력하신 이메일({email})로<br />
              다운로드 링크를 발송해 드리겠습니다.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-[#1A1A1A] text-white text-sm font-medium hover:bg-[#1A1A1A]/90 transition-colors"
            >
              확인
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function Resources() {
  const [selectedResource, setSelectedResource] = useState<typeof RESOURCES[0] | null>(null);

  return (
    <>
      <SEOHead {...SEO_CONFIG.resources} />
      {/* Hero */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 bg-[#1A1A1A] text-white relative overflow-hidden">
        <div className="absolute top-8 right-8 lg:right-16 opacity-[0.04] select-none pointer-events-none">
          <span className="font-heading text-[10rem] lg:text-[16rem] font-extrabold leading-none">
            R
          </span>
        </div>
        <div className="container relative z-10">
          <FadeUp>
            <span className="inline-block px-3 py-1 mb-6 text-xs font-medium tracking-widest uppercase text-[#C8A96E] border border-[#C8A96E]/30">
              Free Resources
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6">
              인테리어 전문 자료를
              <br />
              <span className="text-[#C8A96E]">무료</span>로 받아보세요
            </h1>
            <p className="text-white/50 text-lg max-w-xl leading-relaxed">
              고감도의 35년 노하우를 담은 실무 가이드와 트렌드 리포트.
              사무실 인테리어를 준비하시는 분들께 도움이 되길 바랍니다.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {RESOURCES.map((resource, i) => (
              <FadeUp key={resource.id} delay={i * 0.1}>
                <div
                  className="group relative p-8 border border-[#1A1A1A]/10 hover:border-[#C8A96E]/40 transition-all duration-500 cursor-pointer h-full flex flex-col bg-white"
                  onClick={() => setSelectedResource(resource)}
                >
                  {resource.popular && (
                    <span className="absolute top-4 right-4 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-[#C8A96E] text-[#1A1A1A]">
                      인기
                    </span>
                  )}

                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-[#1A1A1A] text-white group-hover:bg-[#C8A96E] group-hover:text-[#1A1A1A] transition-colors duration-500 flex-shrink-0">
                      {resource.icon}
                    </div>
                    <div>
                      <span className="text-xs font-medium text-[#C8A96E] tracking-wide">
                        {resource.category}
                      </span>
                      <h3 className="font-heading text-lg font-bold text-[#1A1A1A] mt-1">
                        {resource.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm text-[#1A1A1A]/80 font-medium mb-2">
                    {resource.subtitle}
                  </p>
                  <p className="text-sm text-[#1A1A1A]/50 leading-relaxed mb-6 flex-1">
                    {resource.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#1A1A1A]/40">
                      PDF · {resource.pages}페이지
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-[#C8A96E] opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      다운로드 <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 lg:py-20 bg-[#FAF9F7]">
        <div className="container">
          <FadeUp>
            <div className="max-w-2xl mx-auto text-center">
              <Lock className="w-8 h-8 text-[#C8A96E] mx-auto mb-4" />
              <h2 className="font-heading text-2xl lg:text-3xl font-bold text-[#1A1A1A] mb-4">
                왜 무료로 제공하나요?
              </h2>
              <p className="text-[#1A1A1A]/50 leading-relaxed">
                좋은 공간은 좋은 정보에서 시작됩니다. 고감도는 투명한 정보 공유가
                신뢰의 시작이라고 믿습니다. 자료가 도움이 되셨다면,
                프로젝트를 시작할 때 고감도를 떠올려 주세요.
              </p>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Download Modal */}
      {selectedResource && (
        <DownloadModal
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
        />
      )}
    </>
  );
}
