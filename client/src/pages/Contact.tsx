/*
 * DESIGN: Precision Studio — Contact Page
 * Neurodesign: Minimal friction form, social proof, urgency cues
 * Sections: Hero → Form + Info → FAQ
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Phone, Mail, MapPin, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

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

const FAQS = [
  {
    q: "상담부터 시공 완료까지 얼마나 걸리나요?",
    a: "프로젝트 규모에 따라 다르지만, 일반적으로 100평 기준 설계 2~3주, 시공 4~6주 정도 소요됩니다. 긴급 프로젝트의 경우 일정 단축도 가능합니다.",
  },
  {
    q: "견적은 무료인가요?",
    a: "네, 초기 상담과 개략 견적은 무료입니다. 현장 방문 후 상세 견적을 제공하며, 이 과정에서 별도 비용은 발생하지 않습니다.",
  },
  {
    q: "시공 중 업무가 가능한가요?",
    a: "야간/주말 시공, 구역별 순차 시공 등 업무 중단을 최소화하는 방안을 제안드립니다. 프로젝트 특성에 맞춰 최적의 시공 계획을 수립합니다.",
  },
  {
    q: "하자 보수는 어떻게 되나요?",
    a: "시공 완료 후 1년간 무상 하자 보수를 보장합니다. 긴급 하자의 경우 24시간 내 대응하며, 정기 점검 서비스도 제공합니다.",
  },
];

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    type: "",
    area: "",
    message: "",
  });

  const createInquiry = trpc.inquiry.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("문의가 접수되었습니다. 24시간 내 연락드리겠습니다.");
    },
    onError: (err) => {
      toast.error("문의 접수에 실패했습니다. 다시 시도해 주세요.");
      console.error(err);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createInquiry.mutate({
      name: formData.name,
      company: formData.company || undefined,
      email: formData.email,
      phone: formData.phone || undefined,
      type: formData.type || undefined,
      area: formData.area || undefined,
      message: formData.message,
    });
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
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
              무료 상담을 통해 귀사에 최적화된 공간 솔루션을 제안드립니다.
              평균 24시간 내 회신합니다.
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
                  <div className="p-12 border border-gold/30 bg-gold/5 text-center">
                    <CheckCircle2 className="w-12 h-12 text-gold mx-auto mb-4" />
                    <h2 className="font-heading text-2xl font-bold text-ink mb-3">
                      문의가 접수되었습니다
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      담당 컨설턴트가 24시간 내 연락드리겠습니다.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({ name: "", company: "", email: "", phone: "", type: "", area: "", message: "" });
                      }}
                      className="px-6 py-3 bg-ink text-white text-sm font-medium hover:bg-ink/90 transition-colors"
                    >
                      추가 문의하기
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-2">
                          이름 *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => updateField("name", e.target.value)}
                          className="w-full px-4 py-3 border border-border bg-transparent text-ink text-sm focus:outline-none focus:border-gold transition-colors"
                          placeholder="홍길동"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-2">
                          회사명
                        </label>
                        <input
                          type="text"
                          value={formData.company}
                          onChange={(e) => updateField("company", e.target.value)}
                          className="w-full px-4 py-3 border border-border bg-transparent text-ink text-sm focus:outline-none focus:border-gold transition-colors"
                          placeholder="(주)회사명"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-2">
                          이메일 *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => updateField("email", e.target.value)}
                          className="w-full px-4 py-3 border border-border bg-transparent text-ink text-sm focus:outline-none focus:border-gold transition-colors"
                          placeholder="email@company.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-2">
                          연락처
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => updateField("phone", e.target.value)}
                          className="w-full px-4 py-3 border border-border bg-transparent text-ink text-sm focus:outline-none focus:border-gold transition-colors"
                          placeholder="010-0000-0000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-2">
                        공간 유형
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => updateField("type", e.target.value)}
                        className="w-full px-4 py-3 border border-border bg-transparent text-ink text-sm focus:outline-none focus:border-gold transition-colors appearance-none"
                      >
                        <option value="">선택해 주세요</option>
                        <option value="office">사무실</option>
                        <option value="showroom">쇼룸/전시공간</option>
                        <option value="commercial">상업공간</option>
                        <option value="other">기타</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-2">
                        예상 면적
                      </label>
                      <select
                        value={formData.area}
                        onChange={(e) => updateField("area", e.target.value)}
                        className="w-full px-4 py-3 border border-border bg-transparent text-ink text-sm focus:outline-none focus:border-gold transition-colors appearance-none"
                      >
                        <option value="">선택해 주세요</option>
                        <option value="small">30㎡ 이하 (10평 이하)</option>
                        <option value="medium">30~100㎡ (10~30평)</option>
                        <option value="large">100~300㎡ (30~100평)</option>
                        <option value="xlarge">300㎡ 이상 (100평 이상)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-2">
                        문의 내용 *
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(e) => updateField("message", e.target.value)}
                        className="w-full px-4 py-3 border border-border bg-transparent text-ink text-sm focus:outline-none focus:border-gold transition-colors resize-none"
                        placeholder="프로젝트에 대해 자유롭게 작성해 주세요. 예산, 일정, 특별 요구사항 등을 포함해 주시면 더 정확한 상담이 가능합니다."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={createInquiry.isPending}
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
                          <p className="text-sm font-medium text-ink">02-XXX-XXXX</p>
                          <p className="text-xs text-muted-foreground">평일 09:00 - 18:00</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <Mail className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-ink">info@kokamdo.co.kr</p>
                          <p className="text-xs text-muted-foreground">24시간 내 회신</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-ink">서울특별시 강남구</p>
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
