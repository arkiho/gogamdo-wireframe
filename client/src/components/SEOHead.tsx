/*
 * SEO Head Component
 * 각 페이지별 메타태그를 동적으로 설정합니다.
 * React Helmet 없이 document.head를 직접 조작합니다.
 */

import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "wouter";

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: string;
}

const BASE_URL = "https://kokamdo.co.kr";
const DEFAULT_TITLE = "고감도 KOKAMDO | 기업 이전·오피스 인테리어 전문기업";
const DEFAULT_DESC = "사무실 이전과 부동산 계약 전 필요 면적을 먼저 진단하세요. 고감도는 오피스 기획·설계·시공·사후관리와 학교·공공기관 관급공사를 수행합니다.";

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

function removeSeoUrlTags() {
  document.querySelector('link[rel="canonical"]')?.remove();
  document.querySelector('meta[property="og:url"]')?.remove();
}

function setNoIndex() {
  removeSeoUrlTags();
  setMeta("robots", "noindex, nofollow");
}

function safeDecodedPath(path: string | undefined): string | null {
  if (!path) return null;
  try {
    const decoded = decodeURIComponent(path);
    if (!decoded.startsWith("/") || /[\u0000-\u001f<>"'\\]/.test(decoded)) return null;
    const parsed = new URL(decoded, BASE_URL);
    if (parsed.origin !== BASE_URL || parsed.search || parsed.hash) return null;
    return parsed.pathname;
  } catch {
    return null;
  }
}

function canonicalUrl(path: string | undefined): string | null {
  const configuredPath = safeDecodedPath(path);
  const currentPath = typeof window === "undefined"
    ? null
    : window.location.pathname;
  if (!configuredPath || configuredPath !== currentPath) return null;
  return `${BASE_URL}${configuredPath}`;
}

export function SeoRouteReset() {
  const [location] = useLocation();
  useLayoutEffect(() => {
    setNoIndex();
  }, [location]);
  return null;
}

export default function SEOHead({ title, description, path, image, type = "website" }: SEOProps) {
  const fullTitle = title || DEFAULT_TITLE;
  const fullDesc = description || DEFAULT_DESC;
  const fullUrl = canonicalUrl(path);
  const fullImage = image || `${BASE_URL}/og-image.jpg`;

  useEffect(() => {
    // Title
    document.title = fullTitle;

    // Standard meta
    setMeta("description", fullDesc);

    // OG
    setMeta("og:title", fullTitle);
    setMeta("og:description", fullDesc);
    setMeta("og:image", fullImage);
    setMeta("og:image:secure_url", fullImage);
    setMeta("og:image:width", "1200");
    setMeta("og:image:height", "630");
    setMeta("og:image:alt", fullTitle);
    setMeta("og:type", type);

    // Twitter
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", fullDesc);
    setMeta("twitter:image", fullImage);
    setMeta("twitter:image:alt", fullTitle);
    setMeta("twitter:card", "summary_large_image");

    if (!fullUrl) {
      setNoIndex();
      return;
    }

    setMeta("robots", "index, follow");
    setMeta("og:url", fullUrl);

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
    description: "사무실 이전과 부동산 계약 전 필요한 면적을 먼저 진단하세요. 고감도는 오피스 기획·설계·시공·사후관리와 학교·공공기관 관급공사를 수행합니다.",
    path: "/",
  },
  about: {
    title: "회사소개 | 고감도 KOKAMDO",
    description: "고감도는 기업의 요구와 현장 조건을 확인하고 사무공간의 기획·설계·시공 과정을 함께합니다.",
    path: "/about",
  },
  solutions: {
    title: "솔루션 | 고감도 KOKAMDO",
    description: "업무 방식과 현장 조건을 반영해 사무공간의 기획, 설계, 시공과 사후관리 과정을 안내합니다.",
    path: "/solutions",
  },
  portfolio: {
    title: "고객 사례 | 고감도 KOKAMDO",
    description: "고객사의 공개 승인을 받은 사무공간 인테리어 프로젝트를 선별해 소개합니다.",
    path: "/portfolio",
  },
  estimator: {
    title: "예상 견적 | 고감도 KOKAMDO",
    description: "공간 정보와 공사 조건을 입력해 사무실 인테리어 예상 범위를 확인합니다.",
    path: "/estimator",
  },
  officeSpaceCalculator: {
    title: "계약 전 필요 평수 진단 | 고감도 KOKAMDO",
    description: "사무실 이전 전 직원 수, 좌석 방식, 회의실과 지원공간을 입력해 필요한 사무실 면적 범위를 연락처 없이 바로 확인하세요.",
    path: "/office-space-calculator",
  },
  insights: {
    title: "인사이트 | 고감도 KOKAMDO",
    description: "사무공간 인테리어의 기획, 비용, 설계와 시공에 관한 정보를 확인하세요.",
    path: "/insights",
  },
  resources: {
    title: "자료실 | 고감도 KOKAMDO",
    description: "사무실 이전과 인테리어 실무에 도움이 되는 자료를 확인하세요.",
    path: "/resources",
  },
  contact: {
    title: "문의하기 | 고감도 KOKAMDO",
    description: "프로젝트 목적, 현재 단계, 일정과 공간 조건을 알려주시면 내용을 확인한 뒤 상담 범위를 안내합니다.",
    path: "/contact",
  },
  faq: {
    title: "자주 묻는 질문 | 고감도 KOKAMDO",
    description: "사무실 인테리어 비용, 기간, 진행 과정에 관한 자주 묻는 질문을 확인하세요.",
    path: "/faq",
  },
  howWeWork: {
    title: "진행 과정 | 고감도 KOKAMDO",
    description: "사무공간 프로젝트의 상담, 현장 확인, 기획, 설계와 시공 진행 과정을 안내합니다.",
    path: "/how-we-work",
  },
  aiChat: {
    title: "공간 상담 도구 | 고감도 KOKAMDO",
    description: "사무공간 기획에 필요한 기본 정보를 대화형 도구로 확인하세요.",
    path: "/ai-chat",
  },
  aiStyle: {
    title: "공간 스타일 탐색 | 고감도 KOKAMDO",
    description: "사무공간의 방향을 검토할 수 있는 스타일 자료를 확인하세요.",
    path: "/ai-style",
  },
  aiRedesign: {
    title: "공간 리디자인 | 고감도 KOKAMDO",
    description: "현재 공간을 바탕으로 사무공간 개선 방향을 탐색하세요.",
    path: "/ai-redesign",
  },
  privacy: {
    title: "개인정보처리방침 | 고감도 KOKAMDO",
    description: "(주)고감도의 개인정보처리방침입니다.",
    path: "/privacy",
  },
  terms: {
    title: "이용약관 | 고감도 KOKAMDO",
    description: "(주)고감도 홈페이지 이용약관입니다.",
    path: "/terms",
  },
};
