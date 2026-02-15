/*
 * SEO Head Component
 * 각 페이지별 메타태그를 동적으로 설정합니다.
 * React Helmet 없이 document.head를 직접 조작합니다.
 */

import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: string;
}

const BASE_URL = "https://kokamdo.co.kr";
const DEFAULT_TITLE = "고감도 KOKAMDO | 사무실 인테리어 설계·시공 전문기업 - AI 견적";
const DEFAULT_DESC = "1991년 창업, 35년 경력의 여성기업 인증 사무공간 인테리어 전문기업 고감도. 대한민국 면적만큼의 공간을 설계하고 시공한 경험, 2,800건 이상 프로젝트 완료. AI 예상 견적 서비스 제공.";

function setMeta(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    if (property.startsWith("og:") || property.startsWith("twitter:")) {
      el.setAttribute("property", property);
    } else {
      el.setAttribute("name", property);
    }
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export default function SEOHead({ title, description, path = "/", image, type = "website" }: SEOProps) {
  const fullTitle = title ? `${title} | 고감도 KOKAMDO` : DEFAULT_TITLE;
  const fullDesc = description || DEFAULT_DESC;
  const fullUrl = `${BASE_URL}${path}`;
  const fullImage = image || `${BASE_URL}/og-image.jpg`;

  useEffect(() => {
    // Title
    document.title = fullTitle;

    // Standard meta
    setMeta("description", fullDesc);

    // OG
    setMeta("og:title", fullTitle);
    setMeta("og:description", fullDesc);
    setMeta("og:url", fullUrl);
    setMeta("og:image", fullImage);
    setMeta("og:type", type);

    // Twitter
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", fullDesc);
    setMeta("twitter:image", fullImage);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", fullUrl);
  }, [fullTitle, fullDesc, fullUrl, fullImage, type]);

  return null;
}

// Pre-defined SEO configs for each page
export const SEO_CONFIG = {
  home: {
    title: undefined,
    description: "1991년 창업, 35년 경력의 사무공간 인테리어 전문기업 고감도. 대한민국 면적만큼의 공간을 설계하고 시공한 경험, 2,800건 이상 프로젝트 완료. AI 예상 견적 서비스 제공.",
    path: "/",
  },
  about: {
    title: "회사소개",
    description: "고감도는 1991년 창업 이래 35년간 대한민국 면적만큼의 공간을 설계하고 시공해 온 여성기업 인증 인테리어 전문기업입니다. 2,800건 이상의 프로젝트, 데이터 기반 설계와 체계적인 시공 관리로 최적의 업무 환경을 만듭니다.",
    path: "/about",
  },
  solutions: {
    title: "솔루션",
    description: "공간 설계, 3D 렌더링, 시공 관리까지 원스톱 인테리어 솔루션. 업무 효율과 브랜드 아이덴티티를 반영한 맞춤형 공간을 제안합니다.",
    path: "/solutions",
  },
  opsx: {
    title: "OpsX 컨설팅 프로세스",
    description: "데이터 기반 사무환경 진단부터 원스톱 구축까지. OpsX 인사이트 서비스의 8단계 프로세스로 최적의 오피스를 완성합니다.",
    path: "/opsx",
  },
  portfolio: {
    title: "프로젝트",
    description: "고감도가 완성한 사무실, 상업공간, 리모델링 프로젝트를 확인하세요. Before/After 비교와 상세 공사 개요를 제공합니다.",
    path: "/portfolio",
  },
  estimator: {
    title: "AI 예상 견적",
    description: "AI 기반 사무실 인테리어 예상 견적 서비스. 공간 정보와 마감재 등급을 입력하면 실제 시공 데이터 기반의 예상 비용을 즉시 확인할 수 있습니다.",
    path: "/estimator",
  },
  insights: {
    title: "인사이트",
    description: "사무공간 인테리어 트렌드, 비용 절감 팁, 공간 설계 노하우를 공유합니다. 고감도의 전문 지식을 무료로 확인하세요.",
    path: "/insights",
  },
  resources: {
    title: "자료실",
    description: "사무실 인테리어 체크리스트, 비용 가이드, 트렌드 리포트 등 실무에 도움이 되는 전문 자료를 무료로 다운로드하세요.",
    path: "/resources",
  },
  contact: {
    title: "문의하기",
    description: "사무실 인테리어 무료 상담을 신청하세요. 전문 컨설턴트가 프로젝트 규모와 예산에 맞는 최적의 솔루션을 제안합니다.",
    path: "/contact",
  },
};
