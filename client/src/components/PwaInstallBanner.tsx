import { useState, useEffect, useCallback } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * PWA 설치 유도 배너
 * - beforeinstallprompt 이벤트를 감지하여 설치 가능할 때만 표시
 * - 사용자가 닫으면 7일간 다시 표시하지 않음
 * - 이미 PWA로 실행 중이면 표시하지 않음
 */
export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // 이미 PWA로 실행 중이면 표시하지 않음
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) return;

    // 7일 이내에 닫은 적이 있으면 표시하지 않음
    const dismissedAt = localStorage.getItem("pwa-banner-dismissed");
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < sevenDays) return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // 3초 후에 배너 표시 (페이지 로드 직후 바로 표시하면 UX가 좋지 않음)
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
    } catch {
      // 사용자가 취소한 경우
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem("pwa-banner-dismissed", Date.now().toString());
  }, []);

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] px-4 pb-4 sm:px-6 sm:pb-6 animate-in slide-in-from-bottom duration-500">
      <div className="mx-auto max-w-lg bg-ink border border-gold/20 shadow-2xl shadow-black/40 p-4 sm:p-5 flex items-center gap-4">
        {/* 아이콘 */}
        <div className="flex-shrink-0 w-12 h-12 bg-gold/10 flex items-center justify-center">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/98603122/inVH3wtLGFa5DdYEVu2HqP/kokamdo-icon-192x192_5e8135d9.png"
            alt="Kokamdo"
            className="w-8 h-8 object-contain"
          />
        </div>

        {/* 텍스트 */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">
            고감도 앱 설치
          </p>
          <p className="text-white/50 text-xs mt-0.5 leading-snug">
            홈 화면에 추가하면 더 빠르게 이용할 수 있습니다
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={handleInstall}
            disabled={isInstalling}
            className="bg-gold text-ink hover:bg-gold/90 font-semibold text-xs gap-1.5 h-8 px-3"
          >
            <Download className="w-3.5 h-3.5" />
            {isInstalling ? "설치 중..." : "설치"}
          </Button>
          <button
            onClick={handleDismiss}
            className="text-white/30 hover:text-white/60 transition-colors p-1"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
