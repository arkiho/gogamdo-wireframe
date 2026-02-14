/*
 * FAQ Page — AEO (Answer Engine Optimization) 최적화
 * Google Featured Snippets, 음성 검색, AI 답변에 최적화된 FAQ 구조
 * FAQPage Schema.org 구조화 데이터 자동 삽입
 */

import { useState } from "react";
import { ChevronDown, Search, MessageSquare, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import SEOHead from "@/components/SEOHead";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  // 비용 관련
  {
    category: "비용",
    question: "사무실 인테리어 비용은 얼마나 드나요?",
    answer: "사무실 인테리어 비용은 면적, 등급, 공사 범위에 따라 달라집니다. 일반적으로 평당 80만원~250만원 수준이며, 30평 기준 스탠다드 등급은 약 2,400만원~3,600만원, 프리미엄 등급은 약 4,500만원~7,500만원입니다. 고감도에서는 AI 견적 시스템으로 30초 만에 예상 비용을 무료로 확인하실 수 있습니다.",
  },
  {
    category: "비용",
    question: "인테리어 견적은 어떻게 받을 수 있나요?",
    answer: "고감도 홈페이지의 AI 견적 시스템에서 공간 유형, 면적, 원하는 등급을 입력하면 30초 만에 예상 비용을 확인할 수 있습니다. 더 정확한 견적이 필요하시면 무료 현장 실측 후 상세 견적서를 제공해 드립니다. 전화(02-3487-6133) 또는 온라인 상담 신청으로 예약 가능합니다.",
  },
  {
    category: "비용",
    question: "인테리어 비용을 절감하는 방법이 있나요?",
    answer: "비용 절감을 위해 몇 가지 방법을 추천드립니다. 첫째, 기존 설비(전기, 배관)를 최대한 활용하는 설계를 하면 공사비를 20~30% 절감할 수 있습니다. 둘째, 핵심 공간(회의실, 로비)에 집중 투자하고 나머지는 심플하게 마감하는 전략이 효과적입니다. 셋째, 시공 비수기(1~2월, 7~8월)를 활용하면 인건비를 절약할 수 있습니다.",
  },
  // 프로세스 관련
  {
    category: "프로세스",
    question: "사무실 인테리어 공사 기간은 얼마나 걸리나요?",
    answer: "공사 기간은 면적과 공사 범위에 따라 다릅니다. 30평 이하 소규모 사무실은 약 2~3주, 50~100평 중규모는 약 4~6주, 100평 이상 대규모는 약 6~10주가 소요됩니다. 고감도는 체계적인 공정 관리 시스템으로 일정을 준수하며, 공사 진행 상황을 실시간으로 공유해 드립니다.",
  },
  {
    category: "프로세스",
    question: "인테리어 진행 절차는 어떻게 되나요?",
    answer: "고감도의 인테리어 프로세스는 5단계로 진행됩니다. 1단계: 무료 상담 및 현장 실측, 2단계: 공간 설계 및 3D 시뮬레이션, 3단계: 상세 견적 및 계약, 4단계: 시공 및 품질 관리, 5단계: 준공 검수 및 A/S. 각 단계마다 고객과 충분히 소통하며 진행합니다.",
  },
  {
    category: "프로세스",
    question: "설계 변경이 가능한가요?",
    answer: "네, 시공 착수 전까지 설계 변경이 가능합니다. 고감도는 3D 렌더링을 통해 완공 전 공간을 미리 체험하실 수 있어, 시공 전에 충분히 검토하고 수정할 수 있습니다. 시공 중 변경은 추가 비용과 일정 지연이 발생할 수 있으므로, 설계 단계에서 꼼꼼히 확인하시는 것을 권장합니다.",
  },
  // 서비스 관련
  {
    category: "서비스",
    question: "고감도는 어떤 인테리어 서비스를 제공하나요?",
    answer: "고감도는 사무실 인테리어 전문 기업으로, 공간 설계, 3D 시뮬레이션, 시공 관리, 가구 및 집기 조달, A/S까지 원스톱 서비스를 제공합니다. 사무실, 상업공간, 공유오피스, 쇼룸 등 다양한 업무 공간을 전문적으로 시공하며, 36년간 500건 이상의 프로젝트를 성공적으로 완료했습니다.",
  },
  {
    category: "서비스",
    question: "A/S는 어떻게 진행되나요?",
    answer: "고감도는 시공 완료 후 1년간 무상 A/S를 제공합니다. 하자 발생 시 48시간 이내에 현장 방문하여 조치합니다. 무상 A/S 기간 이후에도 유상으로 유지보수 서비스를 제공하며, 전담 매니저가 배정되어 신속하게 대응합니다.",
  },
  {
    category: "서비스",
    question: "소규모 사무실도 인테리어가 가능한가요?",
    answer: "네, 고감도는 10평 이하의 소규모 사무실부터 대형 오피스까지 모든 규모의 프로젝트를 진행합니다. 소규모 공간일수록 효율적인 동선 설계와 수납 계획이 중요한데, 고감도의 전문 설계팀이 작은 공간도 최대한 활용할 수 있는 맞춤 솔루션을 제안해 드립니다.",
  },
  // AI 기능 관련
  {
    category: "AI 서비스",
    question: "AI 견적 시스템은 정확한가요?",
    answer: "고감도의 AI 견적 시스템은 36년간 500건 이상의 실제 프로젝트 데이터와 70개 이상의 거래처 단가 정보를 기반으로 예상 비용을 산출합니다. 정확도는 약 85~90% 수준이며, 정확한 견적은 현장 실측 후 제공됩니다. AI 견적은 예산 계획 수립에 참고용으로 활용하시기 좋습니다.",
  },
  {
    category: "AI 서비스",
    question: "AI 스타일 추천은 어떻게 작동하나요?",
    answer: "업종, 인원 규모, 선호 분위기, 예산, 우선순위 5가지 질문에 답하시면 AI가 최적의 인테리어 스타일을 추천합니다. 컬러 팔레트, 추천 마감재, 가구 스타일, 조명 계획까지 구체적인 제안과 함께 AI가 생성한 참고 이미지도 제공됩니다.",
  },
  {
    category: "AI 서비스",
    question: "AI 상담은 24시간 가능한가요?",
    answer: "네, 고감도의 AI 인테리어 상담사는 24시간 365일 운영됩니다. 인테리어 비용, 프로세스, 트렌드, 자재 선택 등 다양한 질문에 즉시 답변해 드립니다. 더 전문적인 상담이 필요하시면 영업시간(평일 9시~18시) 내에 전문 컨설턴트와 상담을 예약하실 수 있습니다.",
  },
];

const CATEGORIES = ["전체", "비용", "프로세스", "서비스", "AI 서비스"];

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = FAQ_DATA.filter((faq) => {
    const matchCategory = activeCategory === "전체" || faq.category === activeCategory;
    const matchSearch = !searchQuery || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // FAQ Schema.org 구조화 데이터
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_DATA.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <SEOHead
        title="자주 묻는 질문 (FAQ) | 고감도 사무실 인테리어"
        description="사무실 인테리어 비용, 공사 기간, 진행 절차, AI 견적 시스템 등 자주 묻는 질문과 답변을 확인하세요. 고감도가 궁금한 모든 것을 알려드립니다."
      />

      {/* FAQ Schema.org 구조화 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-20 bg-ink text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }} />
        </div>
        <div className="container relative z-10">
          <p className="text-xs font-medium tracking-widest uppercase text-gold mb-4">FAQ</p>
          <h1 className="font-heading text-3xl lg:text-5xl font-bold mb-4">
            자주 묻는 질문
          </h1>
          <p className="text-white/50 max-w-xl">
            사무실 인테리어에 대해 궁금한 점을 찾아보세요.
            원하는 답변이 없다면 AI 상담사에게 물어보세요.
          </p>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="py-8 border-b border-border/50 sticky top-[72px] bg-paper/95 backdrop-blur-sm z-30">
        <div className="container">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="질문 검색..."
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
              />
            </div>
            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    activeCategory === cat
                      ? "bg-ink text-white"
                      : "bg-white text-muted-foreground border border-border hover:text-ink"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-16 lg:py-20">
        <div className="container max-w-3xl">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">검색 결과가 없습니다.</p>
              <Link href="/ai-chat">
                <span className="inline-flex items-center gap-2 text-gold font-medium hover:underline cursor-pointer">
                  AI 상담사에게 직접 물어보기
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((faq, index) => {
                const globalIndex = FAQ_DATA.indexOf(faq);
                const isOpen = openIndex === globalIndex;
                return (
                  <div
                    key={globalIndex}
                    className="border border-border/50 bg-white overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                      className="w-full flex items-start gap-4 p-5 text-left hover:bg-paper-warm/50 transition-colors"
                    >
                      <span className="text-xs font-medium text-gold mt-1 flex-shrink-0">
                        Q{index + 1}
                      </span>
                      <span className="flex-1 font-heading font-semibold text-ink text-sm lg:text-base leading-snug">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pl-14">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA - AI 상담 유도 */}
      <section className="py-16 lg:py-20 bg-paper-warm">
        <div className="container text-center">
          <div className="max-w-lg mx-auto">
            <MessageSquare className="w-10 h-10 text-gold mx-auto mb-4" />
            <h2 className="font-heading text-2xl lg:text-3xl font-bold text-ink mb-3">
              원하는 답변을 찾지 못하셨나요?
            </h2>
            <p className="text-muted-foreground text-sm mb-8">
              AI 인테리어 상담사가 24시간 모든 질문에 답변해 드립니다.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/ai-chat">
                <span className="inline-flex items-center gap-2 px-7 py-3.5 bg-ink text-white font-semibold text-sm hover:bg-ink/90 transition-colors cursor-pointer">
                  AI 상담 시작하기
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
              <Link href="/contact">
                <span className="inline-flex items-center gap-2 px-7 py-3.5 border border-border text-ink font-medium text-sm hover:bg-white transition-colors cursor-pointer">
                  전문가 상담 신청
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
