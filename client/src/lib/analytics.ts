/**
 * Google Analytics 4 + Microsoft Clarity 트래킹 모듈
 * 
 * GA4 측정 ID와 Clarity 프로젝트 ID는 환경변수로 관리합니다.
 * VITE_GA4_MEASUREMENT_ID, VITE_CLARITY_PROJECT_ID
 * 
 * 스크립트 로딩은 index.html이 아닌 런타임에서 동적으로 수행하여
 * ID가 없을 때 불필요한 네트워크 요청을 방지합니다.
 */

// ─── GA4 ───

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
    clarity: (...args: unknown[]) => void;
  }
}

let ga4Loaded = false;

export function initGA4() {
  const id = import.meta.env.VITE_GA4_MEASUREMENT_ID;
  if (!id || ga4Loaded) return;
  ga4Loaded = true;

  // Load gtag.js script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", id, {
    send_page_view: false, // We'll send page views manually for SPA
  });
}

// ─── Microsoft Clarity ───

let clarityLoaded = false;

export function initClarity() {
  const id = import.meta.env.VITE_CLARITY_PROJECT_ID;
  if (!id || clarityLoaded) return;
  clarityLoaded = true;

  // Clarity snippet
  (function (c: Window, l: Document, a: string, r: string, i: string) {
    (c as any)[a] =
      (c as any)[a] ||
      function (...args: unknown[]) {
        ((c as any)[a].q = (c as any)[a].q || []).push(args);
      };
    const t = l.createElement("script") as HTMLScriptElement;
    t.async = true;
    t.src = "https://www.clarity.ms/tag/" + i;
    const y = l.getElementsByTagName("script")[0];
    y?.parentNode?.insertBefore(t, y);
  })(window, document, "clarity", "script", id);
}

// ─── Facebook Pixel ───
let fbPixelLoaded = false;
export function initFBPixel() {
  const id = import.meta.env.VITE_FB_PIXEL_ID;
  if (!id || fbPixelLoaded) return;
  fbPixelLoaded = true;
  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function (...args: any[]) {
      n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  (window as any).fbq("init", id);
  (window as any).fbq("track", "PageView");
}

// ─── Google Ads Remarketing ───
let gAdsLoaded = false;
export function initGoogleAds() {
  const id = import.meta.env.VITE_GOOGLE_ADS_ID;
  if (!id || gAdsLoaded) return;
  gAdsLoaded = true;
  if (window.gtag) {
    window.gtag("config", id);
  } else {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function (...args: unknown[]) {
      window.dataLayer.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", id);
  }
}

// ─── Naver Analytics ───
let naverLoaded = false;
export function initNaverAnalytics() {
  const id = import.meta.env.VITE_NAVER_ANALYTICS_ID;
  if (!id || naverLoaded) return;
  naverLoaded = true;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://wcs.naver.net/wcslog.js";
  document.head.appendChild(script);
  script.onload = () => {
    if ((window as any).wcs) {
      const wcs = (window as any).wcs;
      if (wcs.inflow) wcs.inflow("kokamdo.co.kr");
      wcs.cntr = id;
      wcs.act = "jt";
      wcs.log();
    }
  };
}

// ─── Custom Events ───

/**
 * 10개 핵심 트래킹 이벤트 (기획서 v2.0 기반)
 * 1. page_view — 페이지 조회
 * 2. portfolio_view — 포트폴리오 상세 조회
 * 3. estimator_start — AI 견적 시작
 * 4. estimator_complete — AI 견적 완료
 * 5. contact_submit — 문의 제출
 * 6. newsletter_subscribe — 뉴스레터 구독
 * 7. solution_click — 솔루션(OpsX) 클릭
 * 8. cta_click — CTA 버튼 클릭
 * 9. scroll_depth — 스크롤 깊이 (25%, 50%, 75%, 100%)
 * 10. time_on_page — 페이지 체류 시간
 */

export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  // GA4
  if (window.gtag) {
    window.gtag("event", eventName, params);
  }

  // Clarity custom tags
  if (window.clarity) {
    window.clarity("set", eventName, JSON.stringify(params || {}));
  }
  // Facebook Pixel custom events
  if ((window as any).fbq) {
    (window as any).fbq("trackCustom", eventName, params);
  }
}

export function trackPageView(path: string, title?: string) {
  const id = import.meta.env.VITE_GA4_MEASUREMENT_ID;
  if (window.gtag && id) {
    window.gtag("event", "page_view", {
      page_path: path,
      page_title: title || document.title,
      page_location: window.location.href,
    });
  }
}

// Convenience wrappers for key events
export const analytics = {
  portfolioView: (projectSlug: string, projectName: string) =>
    trackEvent("portfolio_view", { project_slug: projectSlug, project_name: projectName }),

  estimatorStart: () =>
    trackEvent("estimator_start"),

  estimatorComplete: (totalAmount: number, spaceType: string) =>
    trackEvent("estimator_complete", { total_amount: totalAmount, space_type: spaceType }),

  contactSubmit: (type: string) =>
    trackEvent("contact_submit", { contact_type: type }),

  newsletterSubscribe: () =>
    trackEvent("newsletter_subscribe"),

  solutionClick: (solutionName: string) =>
    trackEvent("solution_click", { solution_name: solutionName }),

  ctaClick: (ctaName: string, location: string) =>
    trackEvent("cta_click", { cta_name: ctaName, cta_location: location }),

  scrollDepth: (depth: number, page: string) =>
    trackEvent("scroll_depth", { depth_percent: depth, page }),

  timeOnPage: (seconds: number, page: string) =>
    trackEvent("time_on_page", { seconds, page }),
};
