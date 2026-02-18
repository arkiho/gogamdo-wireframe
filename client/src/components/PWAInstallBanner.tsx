/**
 * PWA 설치 안내 배너
 * - OpsX 페이지(/ops)에서만 표시
 * - Android: 네이티브 설치 프롬프트
 * - iOS: Safari 공유 → 홈 화면에 추가 안내
 * - 이미 설치된 경우 표시하지 않음
 */
import { useState } from "react";
import { usePWA } from "@/hooks/usePWA";
import { X, Download, Share, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PWAInstallBanner() {
  const { canInstall, isIOS, isInstalled, isStandalone, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem("pwa-banner-dismissed") === "true";
    } catch {
      return false;
    }
  });

  // 이미 설치됐거나 PWA로 실행 중이거나 닫았으면 표시 안 함
  if (isInstalled || isStandalone || dismissed) return null;

  // 설치 가능하지 않고 iOS도 아니면 표시 안 함
  if (!canInstall && !isIOS) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("pwa-banner-dismissed", "true");
    } catch {}
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 z-50 lg:left-auto lg:right-6 lg:max-w-sm"
      >
        <div className="bg-ink text-white rounded-lg shadow-2xl p-4 border border-white/10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm mb-1">OpsX 앱 설치</h4>
              {isIOS ? (
                <p className="text-xs text-white/60 leading-relaxed">
                  Safari 하단의 <Share className="w-3 h-3 inline" /> 공유 버튼을 누른 후
                  <strong className="text-white/80"> "홈 화면에 추가"</strong>를 선택하세요.
                </p>
              ) : (
                <p className="text-xs text-white/60 leading-relaxed">
                  앱을 설치하면 홈 화면에서 바로 접속할 수 있습니다.
                </p>
              )}
              {canInstall && (
                <button
                  onClick={promptInstall}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold text-ink text-xs font-semibold rounded hover:bg-gold-light transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  앱 설치하기
                </button>
              )}
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/40 hover:text-white/70 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
