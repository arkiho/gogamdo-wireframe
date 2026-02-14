/*
 * Announcement Banner Component
 * 관리자가 설정한 공지사항을 상단에 표시합니다.
 * 닫기 버튼으로 개별 공지를 숨길 수 있습니다.
 */

import { useState, useEffect } from "react";
import { X, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AnnouncementBanner() {
  const { data: announcements } = trpc.announcement.active.useQuery(undefined, {
    staleTime: 60_000, // 1분 캐시
    refetchOnWindowFocus: false,
  });

  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  // 세션 스토리지에서 닫은 공지 복원
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("dismissed_announcements");
      if (stored) {
        setDismissed(new Set(JSON.parse(stored)));
      }
    } catch {}
  }, []);

  const handleDismiss = (id: number) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    try {
      sessionStorage.setItem("dismissed_announcements", JSON.stringify(Array.from(next)));
    } catch {}
  };

  if (!announcements || announcements.length === 0) return null;

  const visible = announcements.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  // 가장 우선순위 높은 공지 1개만 표시
  const banner = visible[0];

  return (
    <div
      className="relative z-[60] w-full text-center"
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
