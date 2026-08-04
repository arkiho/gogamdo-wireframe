/*
 * DESIGN: Precision Studio — Contact Page
 * Neurodesign: Minimal friction form, social proof, urgency cues
 * Sections: Hero → Form + Info → FAQ
 */

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Phone, Mail, MapPin, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { analytics } from "@/lib/analytics";
import SEOHead, { SEO_CONFIG } from "@/components/SEOHead";
import {
  MAX_INQUIRY_FREEFORM_LENGTH,
  MAX_INQUIRY_QUALIFICATION_FIELD_LENGTH,
} from "@shared/inquiryLimits";
import {
  parseSpaceCalculatorSearch,
  submitQualifiedInquiryMessage,
} from "@/lib/leadQualification";

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 30 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const FAQS = [
  {
    q: "상담부터 시공 완료까지 얼마나 걸리나요?",
    a: "설계와 시공 기간은 면적, 공사 범위, 건물 조건과 의사결정 일정에 따라 달라집니다. 문의 내용을 확인한 뒤 단계별 예상 일정을 안내합니다.",
  },
  {
    q: "상담과 진단의 범위는 어떻게 정해지나요?",
    a: "필요 평수 기본 진단은 연락처 없이 확인할 수 있습니다. 상세 진단, 현장 방문, 설계와 견적의 범위는 프로젝트 조건을 확인한 뒤 별도로 안내합니다.",
  },
  {
    q: "시공 중 업무가 가능한가요?",
    a: "야간/주말 시공, 구역별 순차 시공 등 업무 중단을 최소화하는 방안을 제안드립니다. 프로젝트 특성에 맞춰 최적의 시공 계획을 수립합니다.",
  },
  {
    q: "하자 보수는 어떻게 되나요?",
    a: "하자 보수의 대상과 기간, 대응 절차는 공사 범위와 계약 조건에 따라 정합니다. 계약 전에 해당 기준을 문서로 확인할 수 있도록 안내합니다.",
  },
];

export default function Contact() {
  const calculatorContext = parseSpaceCalculatorSearch(
    typeof window === "undefined" ? "" : window.location.search,
  );
  const [submitted, setSubmitted] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    type: calculatorContext.source ? "office" : "",
    area: calculatorContext.recommendedPyeong
      ? `${calculatorContext.recommendedPyeong}평 (무료 필요면적 진단)`
      : "",
    budget: "",
    purpose: calculatorContext.source ? "space-review" : "",
    role: "",
    location: "",
    targetDate: "",
    decisionStage: "",
    leaseStatus: "",
    message: "",
    referralSource: calculatorContext.source ? "space_calculator" : "",
  });

  useEffect(() => {
    analytics.qualifiedContactView(calculatorContext.source || "direct");
  }, [calculatorContext.source]);

  const createInquiry = trpc.inquiry.create.useMutation({
    onSuccess: () => {
      analytics.contactSubmit(formData.type || "general");
      analytics.qualifiedContactSubmit(
        calculatorContext.source || "direct",
        formData.purpose || "unspecified",
        formData.decisionStage || "unspecified",
      );
      setSubmitted(true);
      toast.success("문의가 접수되었습니다. 담당자가 내용을 확인하겠습니다.");
    },
    onError: (err) => {
      toast.error("문의 접수에 실패했습니다. 다시 시도해 주세요.");
      console.error(err);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inquiryMessage = submitQualifiedInquiryMessage({
      purpose: formData.purpose,
      role: formData.role,
      location: formData.location,
      targetDate: formData.targetDate,
      budget: formData.budget,
      decisionStage: formData.decisionStage,
      leaseStatus: formData.leaseStatus,
      employeeCount: calculatorContext.employeeCount,
      recommendedPyeong: calculatorContext.recommendedPyeong,
      message: formData.message,
    }, (qualifiedMessage) => createInquiry.mutate({
      name: formData.name,
      company: formData.company || undefined,
      email: formData.email,
      phone: formData.phone || undefined,
      type:
        formData.type ||
        (formData.purpose === "public-project"
          ? "public"
          : formData.purpose === "other"
            ? "other"
            : "office"),
      budget: formData.budget || undefined,
      area: formData.area || undefined,
      message: qualifiedMessage,
      referralSource: formData.referralSource || undefined,
    }));
    if (!inquiryMessage.ok) {
      toast.error(inquiryMessage.error);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <SEOHead {...SEO_CONFIG.contact} />
      {/* Hero */}
      <section className="pt-32 lg:pt-40 pb-16 lg:pb-20">
        <div className="container">
          <FadeUp>
            <p className="text-xs font-medium tracking-widest uppercase text-gold mb-6">
              Contact Us
            </p>
            <h1 className="font-heading text-4xl lg:text-6xl font-bold text-ink leading-tight mb-8 max-w-3xl">
              프로젝트에 대해
              <br />이야기해 주세요
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              프로젝트 목적과 현재 단계, 일정과 공간 조건을 알려주시면
              담당자가 내용을 확인한 뒤 상담 범위를 안내합니다.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* Form + Info */}
      <section className="pb-20 lg:pb-28">
        <div className="container">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-16">
            {/* Form */}
            <div className="lg:col-span-3">
              <FadeUp>
                {submitted ? (
                  <div className="p-10 border border-gold/30 bg-gold/5">
                    <div className="text-center mb-8">
                      <CheckCircle2 className="w-14 h-14 text-gold mx-auto mb-4" />
                      <h2 className="font-heading text-2xl font-bold text-ink mb-2">
                        문의가 접수되었습니다
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        {formData.name}님, 소중한 문의 감사합니다.
                      </p>
                    </div>

                    <div className="bg-white/80 border border-border/50 p-6 mb-6 space-y-3">
                      <h3 className="font-heading text-sm font-bold text-ink mb-3">앞으로의 진행 절차</h3>
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                        <div>
                          <p className="text-sm font-medium text-ink">접수 확인</p>
                          <p className="text-xs text-muted-foreground">문의 내용이 담당 컨설턴트에게 전달되었습니다.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                        <div>
                          <p className="text-sm font-medium text-ink">담당자 검토</p>
                          <p className="text-xs text-muted-foreground">프로젝트 조건을 확인한 뒤 전화 또는 이메일로 연락드립니다.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                        <div>
                          <p className="text-sm font-medium text-ink">상담 범위 협의</p>
                          <p className="text-xs text-muted-foreground">현장 방문, 상세 진단과 제안 범위를 프로젝트에 맞게 협의합니다.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-ink/5 p-4 mb-6 text-center">
                      <p className="text-xs text-muted-foreground mb-1">급한 문의는 직접 연락해 주세요</p>
                      <div className="flex items-center justify-center gap-4">
                        <a href="tel:02-3487-6133" className="text-sm font-medium text-ink hover:text-gold transition-colors flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> 02-3487-6133
                        </a>
                        <a href="mailto:contact@kokamdo.co.kr" className="text-sm font-medium text-ink hover:text-gold transition-colors flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" /> contact@kokamdo.co.kr
                        </a>
                      </div>
                    </div>

                    <div className="text-center">
                      <button
                        onClick={() => {
                          setSubmitted(false);
                          setFormData({
                            name: "",
                            company: "",
                            email: "",
                            phone: "",
                            type: "",
                            area: "",
                            budget: "",
                            purpose: "",
                            role: "",
                            location: "",
                            targetDate: "",
                            decisionStage: "",
                            leaseStatus: "",
                            message: "",
                            referralSource: "",
                          });
                        }}
                        className="px-6 py-3 bg-ink text-white text-sm font-medium hover:bg-ink/90 transition-colors"
                      >
                        추가 문의하기
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="contact-name" className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-2">
                          이름 *
                        </label>
                        <input
                          id="contact-name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => updateField("name", e.target.value)}
                          className="w-full px-4 py-3 border border-border bg-transparent text-ink text-sm focus:outline-none focus:border-gold transition-colors"
                          placeholder="홍길동"
                        />
                      </div>
                      <div>
                        <label htmlFor="contact-company" className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-2">
                          회사명 *
                        </label>
                        <input
                          id="contact-company"
                          type="text"
                          required
                          value={formData.company}
                          onChange={(e) => updateField("company", e.target.value)}
                          className="w-full px-4 py-3 border border-border bg-transparent text-ink text-sm focus:outline-none focus:border-gold transition-colors"
                          placeholder="(주)회사명"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="contact-email" className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-2">
                          이메일 *
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => updateField("email", e.target.value)}
                          className="w-full px-4 py-3 border border-border bg-transparent text-ink text-sm focus:outline-none focus:border-gold transition-colors"
                          placeholder="email@company.com"
                        />
                      </div>
                      <div>
                        <label htmlFor="contact-phone" className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-2">
                          연락처
                        </label>
                        <input
                          id="contact-phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => updateField("phone", e.target.value)}
                          className="w-full px-4 py-3 border border-border bg-transparent text-ink text-sm focus:outline-none focus:border-gold transition-colors"
                          placeholder="010-0000-0000"
                        />
                      </div>
                    </div>

                    {calculatorContext.recommendedPyeong && (
                      <div className="border border-gold/30 bg-gold/5 p-4 text-sm text-ink">
                        무료 필요면적 진단 결과 <strong>{calculatorContext.recommendedPyeong}평</strong>과
                        입력 인원 <strong>{calculatorContext.employeeCount ?? "-"}명</strong>을 함께 전달합니다.
                      </div>
                    )}

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="contact-purpose" className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-2">
                          프로젝트 목적 *
                        </label>
                        <select
                          id="contact-purpose"
                          required
                          value={formData.purpose}
                          onChange={(e) => updateField("purpose", e.target.value)}
                          className="w-full px-4 py-3 border border-border bg-transparent text-ink text-sm focus:outline-none focus:border-gold transition-colors appearance-none"
                        >
                          <option value="">선택해 주세요</option>
                          <option value="space-review">부동산 계약 전 면적 검토</option>
                          <option value="office-relocation">사무실 이전</option>
                          <option value="office-renewal">기존 사무실 리뉴얼</option>
                          <option value="public-project">학교·공공기관 관급공사</option>
                          <option value="other">기타</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="contact-role" className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-2">
                          담당자 역할
                        </label>
                        <select
                          id="contact-role"
                          value={formData.role}
                          onChange={(e) => updateField("role", e.target.value)}
                          className="w-full px-4 py-3 border border-border bg-transparent text-ink text-sm focus:outline-none focus:border-gold transition-colors appearance-none"
                        >
                          <option value="">선택해 주세요</option>
                          <option value="decision-maker">의사결정권자</option>
                          <option value="project-owner">프로젝트 실무 책임자</option>
                          <option value="researcher">정보 수집·비교 담당자</option>
                          <option value="broker">부동산·외부 파트너</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="contact-location" className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-2">희망 지역</label>
                        <input
                          id="contact-location"
                          type="text"
                          value={formData.location}
                          maxLength={MAX_INQUIRY_QUALIFICATION_FIELD_LENGTH}
                          onChange={(e) => updateField("location", e.target.value)}
                          className="w-full px-4 py-3 border border-border bg-transparent text-ink text-sm focus:outline-none focus:border-gold transition-colors"
                          placeholder="예: 서울 성동구"
                        />
                      </div>
                      <div>
                        <label htmlFor="contact-target-date" className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-2">희망 착수·입주 시기</label>
                        <input
                          id="contact-target-date"
                          type="month"
                          value={formData.targetDate}
                          onChange={(e) => updateField("targetDate", e.target.value)}
                          className="w-full px-4 py-3 border border-border bg-transparent text-ink text-sm focus:outline-none focus:border-gold transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="contact-budget" className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-2">예산 범위</label>
                        <select
                          id="contact-budget"
                          value={formData.budget}
                          onChange={(e) => updateField("budget", e.target.value)}
                          className="w-full px-4 py-3 border border-border bg-transparent text-ink text-sm focus:outline-none focus:border-gold transition-colors appearance-none"
                        >
                          <option value="">선택해 주세요</option>
                          <option value="under-100m">1억원 미만</option>
                          <option value="100m-200m">1억~2억원</option>
                          <option value="200m-500m">2억~5억원</option>
                          <option value="over-500m">5억원 이상</option>
                          <option value="undecided">미정</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="contact-lease-status" className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-2">부동산 계약 상태</label>
                        <select
                          id="contact-lease-status"
                          value={formData.leaseStatus}
                          onChange={(e) => updateField("leaseStatus", e.target.value)}
                          className="w-full px-4 py-3 border border-border bg-transparent text-ink text-sm focus:outline-none focus:border-gold transition-colors appearance-none"
                        >
                          <option value="">선택해 주세요</option>
                          <option value="not-signed">계약 전</option>
                          <option value="negotiating">계약 협의 중</option>
                          <option value="signed">계약 완료</option>
                          <option value="existing">기존 공간 리뉴얼</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="contact-decision-stage" className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-2">의사결정 단계</label>
                      <select
                        id="contact-decision-stage"
                        value={formData.decisionStage}
                        onChange={(e) => updateField("decisionStage", e.target.value)}
                        className="w-full px-4 py-3 border border-border bg-transparent text-ink text-sm focus:outline-none focus:border-gold transition-colors appearance-none"
                      >
                        <option value="">선택해 주세요</option>
                        <option value="reviewing-buildings">후보 건물 검토 중</option>
                        <option value="planning-budget">예산·일정 기획 중</option>
                        <option value="selecting-vendor">업체 비교·선정 중</option>
                        <option value="ready-to-start">즉시 추진 가능</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="contact-message" className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-2">
                        문의 내용 *
                      </label>
                      <textarea
                        id="contact-message"
                        required
                        rows={5}
                        maxLength={MAX_INQUIRY_FREEFORM_LENGTH}
                        aria-describedby="inquiry-message-limit"
                        value={formData.message}
                        onChange={(e) => updateField("message", e.target.value)}
                        className="w-full px-4 py-3 border border-border bg-transparent text-ink text-sm focus:outline-none focus:border-gold transition-colors resize-none"
                        placeholder="프로젝트에 대해 자유롭게 작성해 주세요. 예산, 일정, 특별 요구사항 등을 포함해 주시면 더 정확한 상담이 가능합니다."
                      />
                      <p id="inquiry-message-limit" className="mt-1 text-right text-xs text-muted-foreground">
                        {MAX_INQUIRY_FREEFORM_LENGTH - formData.message.length}자 남음
                      </p>
                    </div>

                    <div>
                      <label htmlFor="contact-referral-source" className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-2">
                        어떻게 알게 되셨나요?
                      </label>
                      <select
                        id="contact-referral-source"
                        value={formData.referralSource}
                        onChange={(e) => updateField("referralSource", e.target.value)}
                        className="w-full px-4 py-3 border border-border bg-transparent text-ink text-sm focus:outline-none focus:border-gold transition-colors"
                      >
                        <option value="">선택 안 함</option>
                        <option value="search">검색(구글·네이버)</option>
                        <option value="ai_assistant">AI 어시스턴트(ChatGPT·Claude 등)</option>
                        <option value="referral">지인·소개</option>
                        <option value="sns">SNS·블로그</option>
                        <option value="portfolio">고객 사례·포트폴리오</option>
                        <option value="ad">광고</option>
                        <option value="etc">기타</option>
                      </select>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacyAgreed}
                        onChange={(e) => setPrivacyAgreed(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-gold"
                        required
                      />
                      <span className="text-xs text-ink/60 leading-relaxed">
                        <Link href="/privacy" className="text-gold hover:underline" target="_blank">개인정보처리방침</Link>에 따라 이름, 이메일, 연락처 등 개인정보의 수집·이용에 동의합니다. (필수)
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={createInquiry.isPending || !privacyAgreed}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-ink font-semibold text-sm tracking-wide hover:bg-gold-light transition-all duration-300 disabled:opacity-50"
                    >
                      {createInquiry.isPending ? "접수 중..." : "문의 보내기"}
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </FadeUp>
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-2">
              <FadeUp delay={0.2}>
                <div className="space-y-8">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-ink mb-6">연락처</h3>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <Phone className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-ink"><a href="tel:02-3487-6133">02-3487-6133</a></p>
                          <p className="text-xs text-muted-foreground">평일 09:00 - 18:00</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <Mail className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-ink"><a href="mailto:contact@kokamdo.co.kr">contact@kokamdo.co.kr</a></p>
                          <p className="text-xs text-muted-foreground">영업시간 내 문의 확인</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-ink">서울시 광진구 동일로 12길 15</p>
                          <p className="text-xs text-muted-foreground">상세 주소 안내</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <Clock className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-ink">평일 09:00 - 18:00</p>
                          <p className="text-xs text-muted-foreground">주말/공휴일 휴무</p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="gold-line w-16" />

                  <div className="p-6 bg-paper-warm border border-border/50">
                    <h4 className="font-heading text-sm font-bold text-ink mb-3">빠른 상담</h4>
                    <p className="text-xs text-muted-foreground mb-4">
                      카카오톡으로 간편하게 상담하세요.
                    </p>
                    <button
                      onClick={() => toast.info("카카오톡 상담 기능은 준비 중입니다.")}
                      className="w-full py-2.5 bg-[#FEE500] text-[#3C1E1E] text-sm font-medium hover:bg-[#FEE500]/90 transition-colors"
                    >
                      카카오톡 상담
                    </button>
                  </div>
                </div>
              </FadeUp>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-28 bg-paper-warm">
        <div className="container max-w-3xl mx-auto">
          <FadeUp>
            <p className="text-xs font-medium tracking-widest uppercase text-gold mb-4 text-center">
              FAQ
            </p>
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-ink mb-12 text-center">
              자주 묻는 질문
            </h2>
          </FadeUp>

          <div className="space-y-0">
            {FAQS.map((faq, i) => (
              <FadeUp key={i} delay={i * 0.05}>
                <div className="border-b border-border/50">
                  <button
                    type="button"
                    aria-expanded={expandedFaq === i}
                    aria-controls={`contact-faq-panel-${i}`}
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full py-5 flex items-center justify-between text-left group"
                  >
                    <span className="font-heading text-base font-semibold text-ink group-hover:text-gold transition-colors pr-4">
                      {faq.q}
                    </span>
                    <span
                      className={`text-xl text-ink/30 transition-transform duration-300 flex-shrink-0 ${
                        expandedFaq === i ? "rotate-45" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                  {expandedFaq === i && (
                    <motion.div
                      id={`contact-faq-panel-${i}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.3 }}
                      className="pb-5"
                    >
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
