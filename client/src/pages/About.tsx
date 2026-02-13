/*
 * DESIGN: Precision Studio — About Page
 * Neurodesign: Face & gaze direction, timeline pattern recognition
 * Sections: Hero → Mission → Timeline → Team → Values → CTA
 */

import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowUpRight, Target, Eye, Shield, Users } from "lucide-react";
import { ABOUT_TEAM_IMG } from "@/lib/images";

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

const TIMELINE = [
  { year: "2014", event: "고감도 설립", detail: "사무공간 전문 인테리어 회사로 출발" },
  { year: "2016", event: "50번째 프로젝트 완료", detail: "IT, 금융, 제조업 등 다양한 업종으로 확장" },
  { year: "2019", event: "자체 시공팀 구축", detail: "설계-시공 원스톱 체제 완성" },
  { year: "2021", event: "100번째 프로젝트 돌파", detail: "누적 시공 면적 30,000㎡ 달성" },
  { year: "2024", event: "OpsX 프로젝트 관리 도입", detail: "디지털 프로젝트 관리 시스템 구축" },
  { year: "2026", event: "AI 설계 자동화 도입", detail: "AI 기반 견적·설계 시스템 런칭" },
];

const VALUES = [
  { icon: <Target className="w-6 h-6" />, title: "정밀함", desc: "밀리미터 단위의 정확한 설계와 시공으로 완성도를 높입니다" },
  { icon: <Eye className="w-6 h-6" />, title: "투명함", desc: "견적부터 시공까지 모든 과정을 투명하게 공유합니다" },
  { icon: <Shield className="w-6 h-6" />, title: "신뢰", desc: "약속한 일정과 품질을 반드시 지키는 것이 우리의 원칙입니다" },
  { icon: <Users className="w-6 h-6" />, title: "협업", desc: "고객의 비전을 함께 만들어가는 파트너십을 추구합니다" },
];

export default function About() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 lg:pt-40 pb-20 lg:pb-28">
        <div className="container">
          <FadeUp>
            <p className="text-xs font-medium tracking-widest uppercase text-gold mb-6">
              About Us
            </p>
            <h1 className="font-heading text-4xl lg:text-6xl font-bold text-ink leading-tight mb-8 max-w-3xl">
              공간에 감도를 더하다
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
              (주)고감도는 2014년 설립 이래, 기업의 비전과 문화를 공간에 담아내는 사무공간 전문 인테리어 기업입니다.
              설계부터 시공까지 원스톱 솔루션을 제공하며, 150건 이상의 프로젝트를 성공적으로 완수하였습니다.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* Image + Mission */}
      <section className="pb-20 lg:pb-28">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <FadeUp>
              <div className="aspect-[4/3] overflow-hidden">
                <img src={ABOUT_TEAM_IMG} alt="고감도 회의실" className="w-full h-full object-cover" />
              </div>
            </FadeUp>
            <FadeUp delay={0.2}>
              <div>
                <p className="text-xs font-medium tracking-widest uppercase text-gold mb-4">
                  Our Mission
                </p>
                <h2 className="font-heading text-2xl lg:text-4xl font-bold text-ink mb-6 leading-tight">
                  좋은 공간은
                  <br />좋은 일을 만듭니다
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  우리는 단순히 예쁜 공간을 만드는 것이 아닙니다. 그 공간에서 일하는 사람들의 생산성, 창의성, 그리고 행복을 설계합니다.
                  12년간 축적된 데이터와 경험을 바탕으로, 각 기업에 최적화된 공간 솔루션을 제안합니다.
                </p>
                <div className="gold-line w-16 mb-6" />
                <blockquote className="text-ink font-heading text-lg font-semibold italic">
                  "공간이 달라지면 일하는 방식이 달라집니다"
                </blockquote>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 lg:py-28 bg-paper-warm">
        <div className="container">
          <FadeUp>
            <p className="text-xs font-medium tracking-widest uppercase text-gold mb-4">
              Our Journey
            </p>
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-ink mb-16">
              고감도의 여정
            </h2>
          </FadeUp>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 lg:left-1/2 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-12">
              {TIMELINE.map((item, i) => (
                <FadeUp key={i} delay={i * 0.1}>
                  <div className={`relative flex items-start gap-8 ${i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"}`}>
                    {/* Dot */}
                    <div className="absolute left-4 lg:left-1/2 w-3 h-3 bg-gold -translate-x-1.5 mt-2 z-10" />

                    {/* Content */}
                    <div className={`ml-12 lg:ml-0 lg:w-1/2 ${i % 2 === 0 ? "lg:pr-16 lg:text-right" : "lg:pl-16"}`}>
                      <span className="font-heading text-3xl font-extrabold text-ink/10">{item.year}</span>
                      <h3 className="font-heading text-lg font-bold text-ink mt-1">{item.event}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{item.detail}</p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <FadeUp>
            <p className="text-xs font-medium tracking-widest uppercase text-gold mb-4">
              Core Values
            </p>
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-ink mb-16">
              우리가 지키는 가치
            </h2>
          </FadeUp>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((val, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <div className="p-8 border border-border/50 hover:border-gold/30 transition-colors duration-500 group h-full">
                  <div className="w-12 h-12 flex items-center justify-center bg-paper-warm text-ink mb-6 group-hover:bg-gold group-hover:text-ink transition-colors duration-500">
                    {val.icon}
                  </div>
                  <h3 className="font-heading text-lg font-bold text-ink mb-2">{val.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{val.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 bg-ink text-white">
        <div className="container text-center">
          <FadeUp>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold mb-6">
              함께 만들어갈 공간이 있으신가요?
            </h2>
            <p className="text-white/50 mb-10 max-w-md mx-auto">
              프로젝트에 대해 이야기를 나눠보세요. 무료 상담을 통해 최적의 솔루션을 제안드립니다.
            </p>
            <Link href="/contact">
              <span className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-ink font-semibold text-sm tracking-wide hover:bg-gold-light transition-all duration-300">
                무료 상담 신청
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </Link>
          </FadeUp>
        </div>
      </section>
    </>
  );
}
