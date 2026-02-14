/*
 * Popup Modal Component
 * 관리자가 설정한 팝업 알림을 방문자에게 표시합니다.
 * showOnce="yes"인 팝업은 로컬스토리지에 기록하여 한 번만 표시합니다.
 */

import { useState, useEffect, useMemo } from "react";
import { X, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

export default function PopupModal() {
  const { data: popups } = trpc.popup.active.useQuery(undefined, {
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  // 로컬스토리지에서 영구 닫은 팝업 복원
  useEffect(() => {
    try {
      const stored = localStorage.getItem("dismissed_popups");
      if (stored) {
        setDismissed(new Set(JSON.parse(stored)));
      }
    } catch {}
  }, []);

  // 표시할 팝업 계산
  const visible = useMemo(() => {
    return (popups || []).filter((p) => !dismissed.has(p.id));
  }, [popups, dismissed]);

  const handleDismiss = (popup: { id: number; showOnce: string }) => {
    const next = new Set(dismissed);
    next.add(popup.id);
    setDismissed(next);

    // showOnce="yes"이면 로컬스토리지에 영구 저장
    if (popup.showOnce === "yes") {
      try {
        localStorage.setItem("dismissed_popups", JSON.stringify(Array.from(next)));
      } catch {}
    }
  };

  const handleDismissToday = (popup: { id: number }) => {
    const next = new Set(dismissed);
    next.add(popup.id);
    setDismissed(next);
    // 오늘 하루 안 보기: 세션스토리지에 저장
    try {
      const todayKey = `popup_today_${popup.id}_${new Date().toDateString()}`;
      sessionStorage.setItem(todayKey, "true");
    } catch {}
  };

  if (visible.length === 0) return null;

  const popup = visible[0]; // 우선순위가 가장 높은 팝업 하나만 표시

  const positionClasses: Record<string, string> = {
    center: "items-center justify-center",
    bottom_right: "items-end justify-end p-6",
    bottom_left: "items-end justify-start p-6",
  };

  return (
    <div
      className={`fixed inset-0 z-[70] flex ${positionClasses[popup.position] || positionClasses.center}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && popup.position === "center") {
          handleDismiss(popup);
        }
      }}
    >
      {/* Backdrop for center popups */}
      {popup.position === "center" && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      )}

      {/* Popup Card */}
      <div
        className={`relative bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 ${
          popup.position === "center"
            ? "w-full max-w-lg mx-4"
            : "w-full max-w-sm"
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => handleDismiss(popup)}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
          aria-label="팝업 닫기"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Image */}
        {popup.imageUrl && (
          <div className="w-full aspect-[16/9] overflow-hidden">
            <img
              src={popup.imageUrl}
              alt={popup.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <h3 className="font-heading text-lg font-bold text-ink mb-2">
            {popup.title}
          </h3>
          <div
            className="text-sm text-muted-foreground leading-relaxed mb-4 whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: popup.content }}
          />

          <div className="flex items-center gap-3">
            {popup.linkUrl && (
              <a
                href={popup.linkUrl}
                className="flex-1"
                target={popup.linkUrl.startsWith("http") ? "_blank" : undefined}
                rel={popup.linkUrl.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                <Button className="w-full bg-gold text-ink hover:bg-gold-light font-semibold">
                  {popup.linkText || "자세히 보기"}
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </a>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-ink whitespace-nowrap"
              onClick={() => handleDismissToday(popup)}
            >
              오늘 하루 안 보기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
