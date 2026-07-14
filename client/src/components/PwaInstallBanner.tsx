import { useState, useEffect, useCallback } from "react";
import { Download, X, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * PWA 설치 유도 배너
 * - Android/Chrome: beforeinstallprompt 이벤트로 네이티브 설치 프롬프트
 * - iOS Safari: "공유 > 홈 화면에 추가" 안내 팝업
 * - 사용자가 닫으면 7일간 다시 표시하지 않음
 * - 이미 PWA로 실행 중이면 표시하지 않음
 */
export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isIos, setIsIos] = useState(false);

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

    // iOS Safari 감지
    const ua = window.navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) || 
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
    
    if (isIosDevice) {
      setIsIos(true);
      // iOS Safari에서는 beforeinstallprompt가 없으므로 직접 배너 표시
      if (isSafari) {
        setTimeout(() => setShowBanner(true), 3000);
      }
      return;
    }

    // Android/Chrome: beforeinstallprompt 이벤트 감지
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (isIos) {
      // iOS: 안내 팝업 표시
      setShowIosGuide(true);
      return;
    }

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
  }, [deferredPrompt, isIos]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setShowIosGuide(false);
    localStorage.setItem("pwa-banner-dismissed", Date.now().toString());
  }, []);

  if (!showBanner) return null;

  return (
    <>
      {/* iOS Safari 설치 안내 오버레이 */}
      {showIosGuide && (
        <div className="fixed inset-0 z-[10000] bg-black/60 flex items-end justify-center animate-in fade-in duration-300">
          <div className="w-full max-w-md mx-4 mb-8 bg-ink border border-gold/20 shadow-2xl p-6 animate-in slide-in-from-bottom duration-500">
            {/* 닫기 버튼 */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors p-1"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 제목 */}
            <div className="text-center mb-6">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/98603122/inVH3wtLGFa5DdYEVu2HqP/kokamdo-icon-192x192_5e8135d9.png"
                alt="Kokamdo"
                className="w-14 h-14 mx-auto mb-3 object-contain"
              />
              <h3 className="text-white font-bold text-lg">
                고감도 앱 설치 방법
              </h3>
              <p className="text-white/50 text-sm mt-1">
                Safari에서 아래 단계를 따라주세요
              </p>
            </div>

            {/* 단계별 안내 */}
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gold/10 flex items-center justify-center text-gold font-bold text-sm">
                  1
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-white text-sm font-medium flex items-center gap-2">
                    하단의 <Share className="w-4 h-4 text-blue-400 inline" /> 공유 버튼을 탭하세요
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gold/10 flex items-center justify-center text-gold font-bold text-sm">
                  2
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-white text-sm font-medium flex items-center gap-2">
                    <Plus className="w-4 h-4 text-white/70 inline" /> 홈 화면에 추가를 선택하세요
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gold/10 flex items-center justify-center text-gold font-bold text-sm">
                  3
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-white text-sm font-medium">
                    우측 상단의 "추가"를 탭하면 완료됩니다
                  </p>
                </div>
              </div>
            </div>

            {/* 하단 안내 화살표 (Safari 공유 버튼 위치 가리킴) */}
            <div className="mt-6 text-center">
              <p className="text-white/30 text-xs">
                Safari 하단 중앙의 공유 아이콘을 찾아주세요
              </p>
              <div className="mt-2 text-gold text-2xl animate-bounce">↓</div>
            </div>
          </div>
        </div>
      )}

      {/* 메인 설치 배너 */}
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
              {isIos
                ? "홈 화면에 추가하여 앱처럼 사용하세요"
                : "홈 화면에 추가하면 더 빠르게 이용할 수 있습니다"}
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
              {isIos ? (
                <>
                  <Share className="w-3.5 h-3.5" />
                  방법 보기
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  {isInstalling ? "설치 중..." : "설치"}
                </>
              )}
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
    </>
  );
}
