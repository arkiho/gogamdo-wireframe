/*
 * Exit Intent & Engagement Popup
 * 1) Exit Intent: 마우스가 뷰포트 상단으로 벗어날 때 이탈 방지 팝업
 * 2) 체류 시간 기반: 45초 이상 체류 시 상담 유도 팝업
 * 세션당 각각 1회만 표시
 */

import { useState, useEffect, useCallback } from "react";
import { X, ArrowRight, Sparkles, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

type PopupType = "exit" | "engagement" | null;

export default function ExitIntentPopup() {
  const [activePopup, setActivePopup] = useState<PopupType>(null);
  const [exitShown, setExitShown] = useState(false);
  const [engagementShown, setEngagementShown] = useState(false);

  // 세션 스토리지에서 이미 표시 여부 확인
  useEffect(() => {
    try {
      if (sessionStorage.getItem("exit_popup_shown")) setExitShown(true);
      if (sessionStorage.getItem("engagement_popup_shown")) setEngagementShown(true);
    } catch {}
  }, []);

  const showPopup = useCallback((type: PopupType) => {
    if (activePopup) return; // 이미 팝업이 열려있으면 무시
    setActivePopup(type);
    try {
      sessionStorage.setItem(`${type}_popup_shown`, "true");
    } catch {}
  }, [activePopup]);

  const closePopup = useCallback(() => {
    setActivePopup(null);
  }, []);

  // Exit Intent 감지 (데스크톱만)
  useEffect(() => {
    if (exitShown) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5 && !exitShown) {
        setExitShown(true);
        showPopup("exit");
      }
    };

    // 페이지 로드 후 5초 뒤부터 감지 시작 (즉시 트리거 방지)
    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 5000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [exitShown, showPopup]);

  // 체류 시간 기반 팝업 (45초)
  useEffect(() => {
    if (engagementShown) return;

    const timer = setTimeout(() => {
      if (!engagementShown) {
        setEngagementShown(true);
        showPopup("engagement");
      }
    }, 45000);

    return () => clearTimeout(timer);
  }, [engagementShown, showPopup]);

  return (
    <AnimatePresence>
      {activePopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={closePopup}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white max-w-md w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closePopup}
              className="absolute top-4 right-4 p-1 text-ink/40 hover:text-ink transition-colors z-10"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>

            {activePopup === "exit" ? (
              /* Exit Intent Content */
              <div>
                <div className="bg-ink px-8 pt-10 pb-8 text-white">
                  <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="font-heading text-2xl font-bold mb-2">
                    잠깐, 떠나시기 전에!
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    AI가 30초 만에 사무실 인테리어 예상 비용을 알려드립니다.
                    무료로 견적을 확인해 보세요.
                  </p>
                </div>
                <div className="px-8 py-6 space-y-3">
                  <Link href="/estimator">
                    <span
                      onClick={closePopup}
                      className="flex items-center justify-center gap-2 w-full py-3.5 bg-gold text-ink font-semibold text-sm hover:bg-gold-light transition-colors cursor-pointer"
                    >
                      AI 무료 견적 받기
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </Link>
                  <Link href="/ai-chat">
                    <span
                      onClick={closePopup}
                      className="flex items-center justify-center gap-2 w-full py-3 border border-border text-ink/70 font-medium text-sm hover:bg-paper-warm transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      AI 상담사에게 물어보기
                    </span>
                  </Link>
                  <button
                    onClick={closePopup}
                    className="w-full py-2 text-xs text-muted-foreground hover:text-ink transition-colors"
                  >
                    다음에 할게요
                  </button>
                </div>
              </div>
            ) : (
              /* Engagement Content (45초 체류) */
              <div>
                <div className="bg-gradient-to-br from-gold/10 to-gold/5 px-8 pt-10 pb-8">
                  <div className="w-12 h-12 rounded-full bg-ink flex items-center justify-center mb-4">
                    <MessageSquare className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="font-heading text-2xl font-bold text-ink mb-2">
                    궁금한 점이 있으신가요?
                  </h3>
                  <p className="text-ink/60 text-sm leading-relaxed">
                    고감도의 AI 상담사가 인테리어 관련 모든 질문에
                    24시간 답변해 드립니다.
                  </p>
                </div>
                <div className="px-8 py-6 space-y-3">
                  <Link href="/ai-chat">
                    <span
                      onClick={closePopup}
                      className="flex items-center justify-center gap-2 w-full py-3.5 bg-ink text-white font-semibold text-sm hover:bg-ink/90 transition-colors cursor-pointer"
                    >
                      AI 상담 시작하기
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </Link>
                  <Link href="/contact">
                    <span
                      onClick={closePopup}
                      className="flex items-center justify-center gap-2 w-full py-3 border border-border text-ink/70 font-medium text-sm hover:bg-paper-warm transition-colors cursor-pointer"
                    >
                      전문 컨설턴트 상담 신청
                    </span>
                  </Link>
                  <button
                    onClick={closePopup}
                    className="w-full py-2 text-xs text-muted-foreground hover:text-ink transition-colors"
                  >
                    괜찮습니다
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
