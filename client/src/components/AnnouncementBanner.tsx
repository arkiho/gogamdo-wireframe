/*
 * Announcement Banner Component
 * 관리자가 설정한 공지사항을 상단에 fixed로 표시합니다.
 * 배너 높이를 CSS 변수(--banner-height)로 전달하여 헤더가 아래로 밀립니다.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AnnouncementBanner() {
  const { data: announcements } = trpc.announcement.active.useQuery(undefined, {
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const bannerRef = useRef<HTMLDivElement>(null);

  // 세션 스토리지에서 닫은 공지 복원
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("dismissed_announcements");
      if (stored) {
        setDismissed(new Set(JSON.parse(stored)));
      }
    } catch {}
  }, []);

  // 배너 높이를 CSS 변수로 전달
  const updateBannerHeight = useCallback(() => {
    const h = bannerRef.current?.offsetHeight || 0;
    document.documentElement.style.setProperty("--banner-height", `${h}px`);
  }, []);

  useEffect(() => {
    updateBannerHeight();
    window.addEventListener("resize", updateBannerHeight);
    return () => {
      window.removeEventListener("resize", updateBannerHeight);
    };
  }, [updateBannerHeight]);

  // announcements나 dismissed가 변경될 때 높이 재계산
  useEffect(() => {
    // 약간의 딜레이 후 높이 업데이트 (DOM 렌더 완료 대기)
    const timer = setTimeout(updateBannerHeight, 50);
    return () => clearTimeout(timer);
  }, [announcements, dismissed, updateBannerHeight]);

  // 컴포넌트 언마운트 시 높이 리셋
  useEffect(() => {
    return () => {
      document.documentElement.style.setProperty("--banner-height", "0px");
    };
  }, []);

  const handleDismiss = (id: number) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    try {
      sessionStorage.setItem("dismissed_announcements", JSON.stringify(Array.from(next)));
    } catch {}
    // 닫으면 바로 높이 리셋
    requestAnimationFrame(() => {
      const h = bannerRef.current?.offsetHeight || 0;
      document.documentElement.style.setProperty("--banner-height", `${h}px`);
    });
  };

  // 표시할 배너 계산
  const visible = (announcements || []).filter((a) => !dismissed.has(a.id));

  if (visible.length === 0) {
    return <div ref={bannerRef} style={{ display: "none" }} />;
  }

  const banner = visible[0];

  return (
    <div
      ref={bannerRef}
      className="fixed top-0 left-0 right-0 z-[60] w-full text-center"
      style={{
        backgroundColor: banner.bgColor || "#111111",
        color: banner.textColor || "#ffffff",
      }}
    >
      <div className="container flex items-center justify-center gap-3 py-2.5 px-12 min-h-[40px]">
        <p className="text-xs sm:text-sm font-medium leading-snug">
          <span className="font-semibold mr-1.5">{banner.title}</span>
          <span className="opacity-80">{banner.message}</span>
        </p>
        {banner.linkUrl && (
          <a
            href={banner.linkUrl}
            className="inline-flex items-center gap-0.5 text-xs font-semibold underline underline-offset-2 opacity-90 hover:opacity-100 transition-opacity whitespace-nowrap flex-shrink-0"
            style={{ color: banner.textColor || "#ffffff" }}
          >
            {banner.linkText || "자세히"}
            <ChevronRight className="w-3 h-3" />
          </a>
        )}
        <button
          onClick={() => handleDismiss(banner.id)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 opacity-50 hover:opacity-100 transition-opacity"
          aria-label="공지 닫기"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
