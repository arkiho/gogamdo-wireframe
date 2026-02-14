import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { initGA4, initClarity, trackPageView, analytics } from "@/lib/analytics";

/**
 * AnalyticsProvider
 * - GA4 + Clarity 초기화
 * - SPA 라우트 변경 시 자동 page_view 전송
 * - 스크롤 깊이 추적 (25%, 50%, 75%, 100%)
 * - 페이지 체류 시간 추적
 */
export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const entryTime = useRef(Date.now());
  const trackedDepths = useRef(new Set<number>());

  // Initialize on mount
  useEffect(() => {
    initGA4();
    initClarity();
  }, []);

  // Track page views on route change
  useEffect(() => {
    trackPageView(location);
    entryTime.current = Date.now();
    trackedDepths.current.clear();

    // Track time on page when leaving
    return () => {
      const seconds = Math.round((Date.now() - entryTime.current) / 1000);
      if (seconds > 3) {
        analytics.timeOnPage(seconds, location);
      }
    };
  }, [location]);

  // Scroll depth tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const percent = Math.round((scrollTop / docHeight) * 100);
      const thresholds = [25, 50, 75, 100];

      for (const threshold of thresholds) {
        if (percent >= threshold && !trackedDepths.current.has(threshold)) {
          trackedDepths.current.add(threshold);
          analytics.scrollDepth(threshold, location);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location]);

  return <>{children}</>;
}
