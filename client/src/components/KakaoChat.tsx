/*
 * 카카오톡 상담 플로팅 위젯
 * 
 * 화면 우하단에 카카오톡 채널 상담 버튼을 표시합니다.
 * 카카오톡 채널 ID가 환경변수(VITE_KAKAO_CHANNEL_ID)로 설정되면 실제 채널로 연결되고,
 * 설정되지 않은 경우 카카오톡 채널 검색 페이지로 이동합니다.
 * 
 * 뇌과학: 접근성 원칙 - 항상 보이는 상담 채널로 이탈 방지
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export default function KakaoChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // 3초 후 툴팁 표시 (한 번만)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // 툴팁 5초 후 자동 닫기
  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => setShowTooltip(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showTooltip]);

  const handleOpen = () => {
    setIsOpen(true);
    setShowTooltip(false);
    trackEvent("cta_click", { cta_name: "kakao_chat_open", cta_location: "floating_widget" });
  };

  const handleChat = () => {
    const channelId = import.meta.env.VITE_KAKAO_CHANNEL_ID;
    if (channelId) {
      window.open(`https://pf.kakao.com/${channelId}/chat`, "_blank");
    } else {
      // 카카오톡 채널이 설정되지 않은 경우 기본 URL
      window.open("https://pf.kakao.com/_xnxlxkxj/chat", "_blank");
    }
    trackEvent("cta_click", { cta_name: "kakao_chat_start", cta_location: "floating_widget" });
    setIsOpen(false);
  };

  const handleCall = () => {
    window.location.href = "tel:02-000-0000";
    trackEvent("cta_click", { cta_name: "phone_call", cta_location: "floating_widget" });
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="bg-white shadow-lg border border-[#1A1A1A]/10 px-4 py-2.5 rounded-lg text-sm text-[#1A1A1A] max-w-[200px]"
          >
            <div className="relative">
              <p className="font-medium">궁금한 점이 있으신가요?</p>
              <p className="text-[#1A1A1A]/50 text-xs mt-0.5">카카오톡으로 편하게 상담하세요</p>
              {/* Triangle pointer */}
              <div className="absolute -bottom-[14px] right-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-white shadow-2xl border border-[#1A1A1A]/10 w-72 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#1A1A1A] px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-sm">고감도 상담센터</h3>
                <p className="text-white/50 text-xs mt-0.5">평일 09:00 - 18:00</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3">
              <p className="text-sm text-[#1A1A1A]/60 leading-relaxed">
                사무실 인테리어에 관한 모든 궁금증을 해결해 드립니다.
              </p>

              {/* Kakao Button */}
              <button
                onClick={handleChat}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] font-medium text-sm transition-colors rounded-sm"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="currentColor">
                  <path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67-.15.54-.96 3.47-.99 3.69 0 0-.02.17.09.24.11.06.24.01.24.01.32-.04 3.7-2.44 4.28-2.85.56.08 1.14.12 1.72.12 5.52 0 10-3.58 10-7.88S17.52 3 12 3z" />
                </svg>
                카카오톡 상담하기
              </button>

              {/* Phone Button */}
              <button
                onClick={handleCall}
                className="w-full flex items-center gap-3 px-4 py-3 border border-[#1A1A1A]/10 hover:bg-[#FAF9F7] text-[#1A1A1A] font-medium text-sm transition-colors rounded-sm"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                전화 상담 (02-000-0000)
              </button>

              {/* Quick Links */}
              <div className="pt-2 border-t border-[#1A1A1A]/5">
                <div className="flex gap-2">
                  <a
                    href="/estimator"
                    className="flex-1 text-center px-3 py-2 text-xs font-medium text-[#C8A96E] border border-[#C8A96E]/20 hover:bg-[#C8A96E]/5 transition-colors rounded-sm"
                  >
                    AI 견적
                  </a>
                  <a
                    href="/contact"
                    className="flex-1 text-center px-3 py-2 text-xs font-medium text-[#C8A96E] border border-[#C8A96E]/20 hover:bg-[#C8A96E]/5 transition-colors rounded-sm"
                  >
                    문의하기
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={isOpen ? () => setIsOpen(false) : handleOpen}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${
          isOpen ? "bg-[#1A1A1A]" : "bg-[#FEE500] hover:bg-[#FDD835]"
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-[#3C1E1E]" />
        )}
      </motion.button>
    </div>
  );
}
