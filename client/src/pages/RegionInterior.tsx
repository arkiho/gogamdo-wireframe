/**
 * DESIGN: Precision Studio — 지역별 사무실 인테리어 랜딩 페이지 (Local SEO)
 * "서울 사무실 인테리어", "강남 사무실 인테리어" 등 지역 키워드 전용 페이지.
 * 라우트: /office-interior/:region
 * 데이터 기반(REGIONS)으로 페이지를 생성하며, Service·FAQPage·BreadcrumbList
 * 구조화 데이터를 주입하여 구글/네이버/AI 답변엔진의 지역 검색에 대응합니다.
 */

import { useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  MapPin,
  Building2,
  Check,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { analytics } from "@/lib/analytics";

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
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

interface RegionData {
  region: string;
  keyword: string;
  tagline: string;
  lead: string;
  districts: string[];
  why: { title: string; desc: string }[];
  faqs: { q: string; a: string }[];
  nearby: string[];
}

const REGIONS: Record<string, RegionData> = {
  seoul: {
    region: "서울",
    keyword: "서울 사무실 인테리어",
    tagline: "Seoul Office Interior",
    lead:
      "광진구 본사를 거점으로 서울 전역의 사무공간을 설계·시공합니다. 강남·여의도·광화문 등 주요 업무지구의 임대 조건과 건물 특성을 이해하는 35년 경력의 전문 기업입니다.",
    districts: [
      "강남구·서초구 (테헤란로)",
      "영등포구 (여의도)",
      "중구·종로구 (광화문·시청)",
      "마포구 (상암·공덕)",
      "성동구 (성수)",
      "송파구 (잠실)",
      "구로·금천 (가산디지털단지)",
      "광진구·강동구",
    ],
    why: [
      {
        title: "높은 임대료, 정확한 공간 효율",
        desc:
          "서울은 평당 임대료가 높은 만큼 1㎡의 낭비도 비용입니다. 2,800건 데이터와 AI 도면 분석으로 좌석 밀도와 동선을 최적화해 같은 면적에서 더 많은 가치를 만듭니다.",
      },
      {
        title: "업무 중단 없는 시공 관리",
        desc:
          "도심 오피스는 주말·야간 반입 규정과 소음 제약이 까다롭습니다. 오피스엑스(OpsX)로 공정과 현장 카메라를 실시간 공유하며 업무 중단을 최소화합니다.",
      },
      {
        title: "빠른 현장 대응",
        desc:
          "서울 전역 30~60분 내 현장 실측·상담이 가능합니다. 하자 발생 시에도 신속하게 대응하는 사후 관리 체계를 운영합니다.",
      },
    ],
    faqs: [
      {
        q: "서울 사무실 인테리어 비용은 평당 얼마인가요?",
        a: "마감 수준과 공종에 따라 다르지만, 사무공간은 통상 평당 100만~250만 원 범위에서 형성됩니다. 고감도는 70개 이상 거래처의 실거래 데이터를 기반으로 공종별 상세 견적을 제공하며, AI 예상 견적으로 사전에 대략적인 비용을 확인할 수 있습니다.",
      },
      {
        q: "서울 도심에서 업무를 하면서 인테리어가 가능한가요?",
        a: "가능합니다. 구간별 공사, 주말·야간 작업, 가벽 분리 등으로 업무 중단을 최소화합니다. 오피스엑스 시스템으로 진행 상황을 실시간 공유해 원격에서도 현장을 확인할 수 있습니다.",
      },
      {
        q: "서울 어느 지역까지 시공하나요?",
        a: "강남·서초·여의도·광화문·마포·성수·잠실·가산디지털단지 등 서울 전 지역에서 진행합니다. 광진구 본사 기준 전역 대응이 가능합니다.",
      },
    ],
    nearby: ["gangnam", "yeouido", "gyeonggi"],
  },
  gangnam: {
    region: "강남",
    keyword: "강남 사무실 인테리어",
    tagline: "Gangnam Office Interior",
    lead:
      "테헤란로를 중심으로 한 강남·서초 업무지구의 사무공간을 설계·시공합니다. 스타트업부터 대기업 지사까지, 브랜드 이미지를 공간에 담아내는 프리미엄 오피스 인테리어를 제공합니다.",
    districts: [
      "역삼동·삼성동 (테헤란로)",
      "논현동·신사동 (가로수길)",
      "서초동·양재동",
      "강남역·선릉역·삼성역 인근",
      "도곡동·대치동",
    ],
    why: [
      {
        title: "브랜드를 담는 프리미엄 설계",
        desc:
          "강남 오피스는 투자 유치, 채용, 고객 미팅의 무대입니다. 3D 렌더링과 AI 투어로 완공 전 브랜드 공간을 시뮬레이션하고, 마감재·조명까지 정교하게 조율합니다.",
      },
      {
        title: "성장 단계별 확장 대응",
        desc:
          "빠르게 인원이 느는 스타트업을 위해 향후 좌석 확장과 부서 재배치를 고려한 유연한 레이아웃을 설계합니다. 데이터 기반 공간 프로그래밍으로 재공사 비용을 줄입니다.",
      },
      {
        title: "고사양 건물 규정 대응",
        desc:
          "테헤란로 대형 빌딩의 인테리어 심의, 소방·전기 규정, 반입 절차를 숙지하고 있어 인허가 리스크를 사전에 관리합니다.",
      },
    ],
    faqs: [
      {
        q: "강남 스타트업 오피스도 진행하나요?",
        a: "네. 시드 단계 소규모 사무실부터 시리즈 이후 확장 오피스까지 규모에 맞춰 진행합니다. 성장에 따른 좌석 확장을 고려한 유연한 레이아웃을 설계합니다.",
      },
      {
        q: "테헤란로 빌딩 인테리어 심의도 대행하나요?",
        a: "건물별 인테리어 심의 도서 작성, 소방·전기 규정 검토, 반입 계획 수립까지 지원합니다. 35년간 대형 빌딩 프로젝트를 수행하며 축적한 노하우로 인허가 리스크를 관리합니다.",
      },
      {
        q: "강남 프리미엄 오피스 견적은 어떻게 받나요?",
        a: "AI 예상 견적으로 대략적인 비용을 즉시 확인하고, 현장 실측 후 마감 수준별 상세 견적을 제공합니다. 실거래 데이터 기반이라 추가 비용 발생을 최소화합니다.",
      },
    ],
    nearby: ["seoul", "yeouido", "pangyo"],
  },
  yeouido: {
    region: "여의도",
    keyword: "여의도 사무실 인테리어",
    tagline: "Yeouido Office Interior",
    lead:
      "금융·증권·대기업이 밀집한 여의도 업무지구의 사무공간을 설계·시공합니다. 보안과 격식을 갖추면서도 업무 효율을 높이는 오피스 인테리어를 제공합니다.",
    districts: [
      "여의도동 (증권가)",
      "국제금융로 일대",
      "IFC·파크원 인근",
      "영등포구청·당산 인근",
      "마포·공덕 연계 지역",
    ],
    why: [
      {
        title: "격식과 효율의 균형",
        desc:
          "금융권 오피스는 고객 응대 공간의 격식과 내부 업무 효율을 동시에 요구합니다. 데이터 기반으로 회의실·상담실·업무공간의 비율을 최적화합니다.",
      },
      {
        title: "보안·규정 대응 설계",
        desc:
          "금융사 특유의 보안 구역 분리, 서버·전산실 요건, 컴플라이언스 기준을 반영한 공간 설계와 시공을 진행합니다.",
      },
      {
        title: "대형 빌딩 시공 경험",
        desc:
          "IFC·파크원 등 초고층 빌딩의 반입 동선, 야간 작업, 층별 공정 관리에 최적화된 시공 프로세스를 운영합니다.",
      },
    ],
    faqs: [
      {
        q: "여의도 금융사 오피스 보안 규정도 반영되나요?",
        a: "네. 보안 구역 분리, 출입 통제 동선, 전산실·서버실 요건 등 금융권 컴플라이언스 기준을 설계에 반영하고 시공합니다.",
      },
      {
        q: "초고층 빌딩도 시공 가능한가요?",
        a: "IFC·파크원 등 초고층 빌딩의 자재 반입 동선과 야간 작업 규정을 숙지하고 있어, 층별 공정 관리로 효율적으로 진행합니다.",
      },
      {
        q: "업무를 하면서 리모델링이 가능한가요?",
        a: "가능합니다. 구간 분리 시공과 주말·야간 작업으로 업무 연속성을 확보하며, 오피스엑스로 진행 상황을 실시간 공유합니다.",
      },
    ],
    nearby: ["seoul", "gangnam", "incheon"],
  },
  pangyo: {
    region: "판교",
    keyword: "판교 사무실 인테리어",
    tagline: "Pangyo Office Interior",
    lead:
      "IT·게임·스타트업이 모인 판교 테크노밸리의 사무공간을 설계·시공합니다. 개발 집중과 협업, 복지를 아우르는 데이터 기반 오피스 인테리어를 제공합니다.",
    districts: [
      "판교테크노밸리 (1·2밸리)",
      "삼평동·백현동",
      "분당구 정자동·서현동 연계",
      "판교역·정자역 인근",
      "경기 성남 일대",
    ],
    why: [
      {
        title: "개발 집중과 협업의 공간 설계",
        desc:
          "IT 조직은 몰입과 협업이 모두 중요합니다. 업무환경 서베이로 개발자의 실제 업무 패턴을 분석해 집중존·협업존·휴게공간의 비율을 데이터로 설계합니다.",
      },
      {
        title: "인재 유치를 위한 복지 공간",
        desc:
          "채용 경쟁이 치열한 판교에서 라운지·게임존·카페테리아 등 복지 공간은 인재 유치의 핵심입니다. 브랜드 컬처를 담은 공간을 구현합니다.",
      },
      {
        title: "빠른 확장에 대응하는 레이아웃",
        desc:
          "성장 속도가 빠른 테크 기업을 위해 좌석 증설과 조직 개편을 고려한 모듈형 레이아웃을 설계해 재공사 부담을 줄입니다.",
      },
    ],
    faqs: [
      {
        q: "판교 IT기업 오피스 특성도 반영되나요?",
        a: "네. 개발 집중존, 협업존, 휴게·복지 공간의 비율을 업무환경 서베이 데이터로 설계합니다. 몰입과 협업을 동시에 지원하는 레이아웃을 구성합니다.",
      },
      {
        q: "복지 공간(라운지·게임존)도 설계하나요?",
        a: "라운지, 게임존, 카페테리아, 폰부스 등 인재 유치에 필요한 복지 공간을 브랜드 컬처에 맞게 설계하고 시공합니다.",
      },
      {
        q: "판교 외 분당·성남 지역도 진행하나요?",
        a: "판교테크노밸리는 물론 분당 정자·서현, 성남 전역까지 진행합니다. 경기 남부 주요 업무지구를 폭넓게 커버합니다.",
      },
    ],
    nearby: ["gangnam", "gyeonggi", "seoul"],
  },
  gyeonggi: {
    region: "경기",
    keyword: "경기 사무실 인테리어",
    tagline: "Gyeonggi Office Interior",
    lead:
      "판교·분당·수원·일산·동탄 등 경기 전역의 사무공간과 산업시설을 설계·시공합니다. 사옥, 공장 사무동, 물류센터 오피스까지 폭넓게 대응합니다.",
    districts: [
      "성남 (판교·분당)",
      "수원·용인 (광교·기흥)",
      "고양 (일산)",
      "화성 (동탄)",
      "안양·평촌·부천",
      "김포·파주 (산업단지)",
    ],
    why: [
      {
        title: "사옥·산업시설까지 원스톱",
        desc:
          "경기권은 단독 사옥과 공장 사무동, 물류센터 오피스가 많습니다. 사무공간부터 생산·산업시설 인테리어까지 한 곳에서 통합 진행합니다.",
      },
      {
        title: "넓은 면적의 효율 설계",
        desc:
          "대면적 오피스일수록 동선과 부서 배치가 생산성을 좌우합니다. 인접성 매트릭스 기반 공간 프로그래밍으로 대규모 공간을 효율적으로 설계합니다.",
      },
      {
        title: "수도권 전역 현장 대응",
        desc:
          "본사와 협력사 네트워크로 경기 전역의 실측·시공·사후 관리를 안정적으로 수행합니다.",
      },
    ],
    faqs: [
      {
        q: "경기도 공장 사무동·물류센터도 진행하나요?",
        a: "네. 사무공간뿐 아니라 공장 사무동, 물류센터 오피스, 생산시설 부속 공간까지 산업시설 인테리어로 통합 진행합니다.",
      },
      {
        q: "수도권 외곽 지역도 시공 가능한가요?",
        a: "성남·수원·용인·고양·화성·김포·파주 등 경기 전역에서 진행합니다. 협력사 네트워크로 외곽 현장도 안정적으로 대응합니다.",
      },
      {
        q: "단독 사옥 인테리어도 설계하나요?",
        a: "층별 조닝, 로비·회의공간 설계, 외부 사이니지까지 사옥 전체를 통합 설계·시공합니다. 대면적 공간의 동선 효율을 데이터로 최적화합니다.",
      },
    ],
    nearby: ["pangyo", "seoul", "incheon"],
  },
  incheon: {
    region: "인천",
    keyword: "인천 사무실 인테리어",
    tagline: "Incheon Office Interior",
    lead:
      "송도 국제도시와 인천 산업단지의 사무공간·산업시설을 설계·시공합니다. 글로벌 기업 오피스부터 제조·물류 시설까지 데이터 기반으로 대응합니다.",
    districts: [
      "송도국제도시 (국제업무지구)",
      "연수구·남동구 (남동산단)",
      "부평·계양",
      "청라국제도시",
      "인천항·물류단지 인근",
    ],
    why: [
      {
        title: "글로벌 스탠다드 오피스",
        desc:
          "송도의 외국계·글로벌 기업 오피스는 국제 기준의 공간 품질을 요구합니다. 포토리얼 렌더링과 정밀 시공으로 글로벌 스탠다드를 구현합니다.",
      },
      {
        title: "제조·물류 시설 대응",
        desc:
          "남동산단·인천항 인근 제조·물류 기업의 사무동과 산업시설을 함께 설계·시공합니다. 생산 가동 중에도 안전 기준을 지키며 시공합니다.",
      },
      {
        title: "인허가·안전 관리",
        desc:
          "산업시설 특유의 인허가 절차와 안전 관리 기준을 숙지해, 리스크를 사전에 점검하고 관리합니다.",
      },
    ],
    faqs: [
      {
        q: "송도 글로벌 기업 오피스도 진행하나요?",
        a: "네. 외국계·글로벌 기업의 국제 기준 오피스를 설계·시공합니다. 포토리얼 3D 렌더링으로 완공 전 공간을 검증하고 정밀하게 마감합니다.",
      },
      {
        q: "인천 산업단지 공장 인테리어도 가능한가요?",
        a: "남동산단·인천항 인근의 공장 사무동과 산업시설을 함께 진행합니다. 생산 가동 중 시공 시 안전 관리 기준을 준수합니다.",
      },
      {
        q: "인천 어느 지역까지 시공하나요?",
        a: "송도·청라 국제도시, 연수·남동·부평·계양 등 인천 전역과 인근 산업단지에서 진행합니다.",
      },
    ],
    nearby: ["seoul", "gyeonggi", "yeouido"],
  },
};

const BASE_URL = "https://kokamdo.co.kr";

export default function RegionInterior() {
  const params = useParams<{ region: string }>();
  const [, navigate] = useLocation();
  const slug = (params.region || "").toLowerCase();
  const data = REGIONS[slug];

  useEffect(() => {
    if (!data) navigate("/404");
  }, [data, navigate]);

  if (!data) return null;

  const pageUrl = `${BASE_URL}/office-interior/${slug}`;

  // 구조화 데이터 (Service + BreadcrumbList + FAQPage)
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: data.keyword,
        serviceType: "사무실 인테리어",
        description: data.lead,
        url: pageUrl,
        provider: {
          "@type": "LocalBusiness",
          name: "고감도 KOKAMDO",
          telephone: "+82-2-3487-6133",
          url: BASE_URL,
          address: {
            "@type": "PostalAddress",
            streetAddress: "광진구 동일로 12길 15",
            addressLocality: "서울특별시",
            postalCode: "05072",
            addressCountry: "KR",
          },
        },
        areaServed: { "@type": "Place", name: data.region },
        offers: {
          "@type": "Offer",
          description: `${data.region} 사무실 인테리어 설계·시공 및 AI 예상 견적`,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "홈", item: BASE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "지역별 사무실 인테리어",
            item: `${BASE_URL}/office-interior/seoul`,
          },
          { "@type": "ListItem", position: 3, name: data.keyword, item: pageUrl },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: data.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <>
      <SEOHead
        title={`${data.keyword} 전문 | 35년 경력 고감도`}
        description={`${data.keyword}는 35년 경력·2,800건+ 프로젝트의 고감도. ${data.region} 사무공간 설계부터 시공, AI 예상 견적까지 원스톱으로 제공합니다. 데이터 기반 설계로 공간 효율을 극대화합니다.`}
        path={`/office-interior/${slug}`}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* ==================== HERO ==================== */}
      <section className="relative py-24 lg:py-36 bg-ink text-white overflow-hidden">
        <div className="absolute top-8 right-8 lg:right-16 opacity-[0.04] select-none pointer-events-none">
          <span className="font-heading text-[8rem] lg:text-[14rem] font-extrabold leading-none uppercase">
            {data.tagline.split(" ")[0]}
          </span>
        </div>
        <div className="container relative z-10">
          <FadeUp>
            <span className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-medium tracking-widest uppercase text-gold border border-gold/30">
              <MapPin className="w-3.5 h-3.5" />
              {data.tagline}
            </span>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6 max-w-3xl">
              {data.region}{" "}
              <span className="text-gradient-gold">사무실 인테리어</span>,
              <br />
              감이 아닌 데이터로
            </h1>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className="text-white/60 text-lg leading-relaxed max-w-2xl mb-10">
              {data.lead}
            </p>
          </FadeUp>
          <FadeUp delay={0.3}>
            <div className="flex flex-wrap gap-6 text-sm mb-10">
              <div className="flex items-center gap-2 text-white/40">
                <Clock className="w-4 h-4 text-gold" />
                <span>
                  <strong className="text-white">35년</strong> 업력
                </span>
              </div>
              <div className="flex items-center gap-2 text-white/40">
                <TrendingUp className="w-4 h-4 text-gold" />
                <span>
                  <strong className="text-white">2,800건+</strong> 프로젝트
                </span>
              </div>
              <div className="flex items-center gap-2 text-white/40">
                <Users className="w-4 h-4 text-gold" />
                <span>
                  <strong className="text-white">70개+</strong> 검증된 협력사
                </span>
              </div>
            </div>
          </FadeUp>
          <FadeUp delay={0.4}>
            <div className="flex flex-wrap gap-4">
              <Link href="/estimator">
                <span
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-gold text-ink font-semibold text-sm tracking-wide hover:bg-gold-light transition-all duration-300 cursor-pointer"
                  onClick={() =>
                    analytics.trackEvent("cta_click", {
                      location: `region_${slug}_hero`,
                      action: "estimator",
                    })
                  }
                >
                  {data.region} 예상 견적 받기
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </Link>
              <Link href="/contact">
                <span
                  className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/30 text-white font-medium text-sm tracking-wide hover:bg-white/10 transition-all duration-300 cursor-pointer"
                  onClick={() =>
                    analytics.trackEvent("cta_click", {
                      location: `region_${slug}_hero`,
                      action: "contact",
                    })
                  }
                >
                  무료 상담 신청
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ==================== WHY (지역 특화 강점) ==================== */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <FadeUp>
            <p className="text-xs font-medium tracking-widest uppercase text-gold mb-4">
              Why KOKAMDO
            </p>
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-ink mb-4 max-w-2xl leading-tight">
              {data.region}에서
              <br />
              <span className="text-ink/40">고감도를 선택하는 이유</span>
            </h2>
          </FadeUp>
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {data.why.map((item, i) => (
              <FadeUp key={i} delay={i * 0.08}>
                <div className="p-8 border border-border/50 hover:border-gold/30 transition-all duration-500 h-full">
                  <span className="font-heading text-3xl font-extrabold text-gold/30 leading-none">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-heading text-lg font-bold text-ink mt-4 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 서비스 지역 ==================== */}
      <section className="py-20 lg:py-28 bg-paper-warm">
        <div className="container">
          <FadeUp>
            <p className="text-xs font-medium tracking-widest uppercase text-gold mb-4">
              Service Area
            </p>
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-ink mb-4 leading-tight">
              {data.region} 주요 시공 지역
            </h2>
            <p className="text-muted-foreground mb-10 max-w-lg">
              아래 지역을 포함한 {data.region} 전역에서 사무실 인테리어 설계·시공을
              진행합니다.
            </p>
          </FadeUp>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.districts.map((d, i) => (
              <FadeUp key={i} delay={i * 0.04}>
                <div className="flex items-center gap-2 p-4 bg-white border border-border/50 text-sm text-ink">
                  <Building2 className="w-4 h-4 text-gold flex-shrink-0" />
                  <span>{d}</span>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 프로세스 요약 ==================== */}
      <section className="py-20 lg:py-28 bg-ink text-white">
        <div className="container">
          <FadeUp>
            <p className="text-xs font-medium tracking-widest uppercase text-gold mb-4">
              Our Process
            </p>
            <h2 className="font-heading text-3xl lg:text-4xl font-bold mb-6 max-w-2xl leading-tight">
              데이터 진단부터 사후 관리까지,
              <br />
              <span className="text-white/40">6단계 프로세스</span>
            </h2>
            <p className="text-white/50 mb-10 max-w-lg">
              {data.region} 프로젝트도 동일한 6단계 시스템으로 진행됩니다.
              체계적인 프로세스가 일관된 품질을 보장합니다.
            </p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <div className="flex flex-wrap gap-3 mb-10">
              {[
                "데이터 기반 진단",
                "AI 도면 분석",
                "3D 렌더링",
                "투명한 견적",
                "실시간 시공 관리",
                "사후 관리",
              ].map((step, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-white/15 text-sm text-white/70"
                >
                  <Check className="w-3.5 h-3.5 text-gold" />
                  {step}
                </span>
              ))}
            </div>
          </FadeUp>
          <FadeUp delay={0.2}>
            <Link href="/how-we-work">
              <span className="inline-flex items-center gap-2 text-gold text-sm font-medium hover:gap-3 transition-all cursor-pointer">
                고감도의 일하는 방식 자세히 보기
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* ==================== 지역 FAQ ==================== */}
      <section className="py-20 lg:py-28">
        <div className="container max-w-3xl">
          <FadeUp>
            <p className="text-xs font-medium tracking-widest uppercase text-gold mb-4">
              FAQ
            </p>
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-ink mb-10 leading-tight">
              {data.keyword} 자주 묻는 질문
            </h2>
          </FadeUp>
          <div className="space-y-6">
            {data.faqs.map((f, i) => (
              <FadeUp key={i} delay={i * 0.06}>
                <div className="border-b border-border/50 pb-6">
                  <h3 className="font-heading text-lg font-bold text-ink mb-3">
                    Q. {f.q}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.a}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 인근 지역 ==================== */}
      <section className="py-16 bg-paper-warm">
        <div className="container">
          <FadeUp>
            <p className="text-sm font-medium text-ink mb-4">인근 지역 사무실 인테리어</p>
            <div className="flex flex-wrap gap-3">
              {data.nearby
                .filter((n) => REGIONS[n])
                .map((n) => (
                  <Link key={n} href={`/office-interior/${n}`}>
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-border/50 text-sm text-ink hover:border-gold/40 transition-colors cursor-pointer">
                      <MapPin className="w-3.5 h-3.5 text-gold" />
                      {REGIONS[n].keyword}
                    </span>
                  </Link>
                ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <section className="py-20 lg:py-28 bg-ink text-white">
        <div className="container">
          <FadeUp>
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-heading text-3xl lg:text-4xl font-bold mb-6">
                {data.region} 사무실 인테리어,
                <br />
                지금 시작하세요
              </h2>
              <p className="text-white/50 mb-10 leading-relaxed">
                AI 예상 견적으로 {data.region} 오피스의 대략적인 비용을 먼저
                확인하거나, 전문 컨설턴트와 무료 상담을 시작하세요.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/estimator">
                  <span
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-gold text-ink font-semibold text-sm tracking-wide hover:bg-gold-light transition-all duration-300 cursor-pointer"
                    onClick={() =>
                      analytics.trackEvent("cta_click", {
                        location: `region_${slug}_bottom`,
                        action: "estimator",
                      })
                    }
                  >
                    AI 예상 견적 받기
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </Link>
                <Link href="/contact">
                  <span
                    className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/30 text-white font-medium text-sm tracking-wide hover:bg-white/10 transition-all duration-300 cursor-pointer"
                    onClick={() =>
                      analytics.trackEvent("cta_click", {
                        location: `region_${slug}_bottom`,
                        action: "contact",
                      })
                    }
                  >
                    무료 상담 신청
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>
    </>
  );
}

export { REGIONS };
