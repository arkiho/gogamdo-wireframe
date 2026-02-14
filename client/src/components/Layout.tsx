/*
 * DESIGN: Precision Studio — Swiss Design + Contemporary Editorial
 * Navigation: Minimal top nav with gold accent CTA + KOKAMDO logo
 * Footer: Editorial grid with newsletter signup
 * Scroll progress: Left vertical gold line
 */

import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowUpRight, Mail } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { analytics } from "@/lib/analytics";
import Logo from "./Logo";
import KakaoChat from "./KakaoChat";

const NAV_ITEMS = [
  { label: "회사소개", href: "/about" },
  { label: "솔루션", href: "/solutions" },
  { label: "프로젝트", href: "/portfolio" },
  { label: "AI 견적", href: "/estimator" },
  { label: "인사이트", href: "/insights" },
  { label: "자료실", href: "/resources" },
];

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const subscribe = trpc.newsletter.subscribe.useMutation({
    onSuccess: (data) => {
      if (data.isNew) {
        analytics.newsletterSubscribe();
        toast.success("구독이 완료되었습니다. 감사합니다!");
      } else {
        toast.info("이미 구독 중인 이메일입니다.");
      }
      setEmail("");
    },
    onError: () => {
      toast.error("구독에 실패했습니다. 다시 시도해 주세요.");
    },
  });

  return (
    <form
      className="flex w-full lg:w-auto gap-0"
      onSubmit={(e) => {
        e.preventDefault();
        if (email) subscribe.mutate({ email, source: "footer" });
      }}
    >
      <div className="relative flex-1 lg:w-80">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일 주소를 입력하세요"
          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-gold transition-colors"
          required
        />
      </div>
      <button
        type="submit"
        disabled={subscribe.isPending}
        className="px-6 py-3 bg-gold text-ink font-medium text-sm hover:bg-gold-light transition-colors whitespace-nowrap disabled:opacity-50"
      >
        {subscribe.isPending ? "처리 중..." : "구독하기"}
      </button>
    </form>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      setScrollProgress(progress);
      setIsScrolled(window.scrollY > 60);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location]);

  const isHome = location === "/";
  const isTransparent = !isScrolled && isHome;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Scroll Progress Bar */}
      <div
        className="scroll-progress"
        style={{ height: `${scrollProgress}%` }}
      />

      {/* Navigation */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-paper/90 backdrop-blur-xl border-b border-border/50"
            : isHome ? "bg-transparent" : "bg-paper/80 backdrop-blur-sm"
        }`}
      >
        <nav className="container flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/">
            <Logo
              variant="full"
              color={isTransparent ? "#ffffff" : "#111111"}
              height={28}
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href}>
                <span
                  className={`text-sm font-medium tracking-wide transition-colors duration-300 hover:text-gold ${
                    location === item.href ? "text-gold" : isTransparent ? "text-white/70" : "text-ink-light"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            ))}
          </div>

          {/* CTA + Mobile Toggle */}
          <div className="flex items-center gap-4">
            <Link href="/contact">
              <span className={`hidden lg:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium tracking-wide transition-colors duration-300 ${
                isTransparent
                  ? "bg-gold text-ink hover:bg-gold-light"
                  : "bg-ink text-white hover:bg-ink/90"
              }`}>
                무료 상담
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Link>
            <button
              className="lg:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="메뉴 토글"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className={`w-5 h-5 ${isTransparent ? "text-white" : "text-ink"}`} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-paper pt-20"
          >
            <div className="container flex flex-col gap-1 pt-8">
              {NAV_ITEMS.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={item.href}>
                    <span
                      className={`block py-4 text-2xl font-heading font-semibold border-b border-border/30 transition-colors ${
                        location === item.href ? "text-gold" : "text-ink"
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: NAV_ITEMS.length * 0.05 }}
              >
                <Link href="/contact">
                  <span className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-ink text-white text-lg font-medium">
                    무료 상담 신청
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Kakao Chat Widget */}
      <KakaoChat />

      {/* Footer */}
      <footer className="bg-ink text-white/80">
        {/* Newsletter Strip */}
        <div className="border-b border-white/10">
          <div className="container py-12 lg:py-16">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div>
                <h3 className="font-heading text-2xl lg:text-3xl font-bold text-white mb-2">
                  인사이트 뉴스레터
                </h3>
                <p className="text-white/50 text-sm max-w-md">
                  사무공간 트렌드, 비용 절감 팁, 프로젝트 사례를 격주로 전달합니다.
                </p>
              </div>
              <NewsletterForm />
            </div>
          </div>
        </div>

        {/* Footer Grid */}
        <div className="container py-12 lg:py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="col-span-2 lg:col-span-1">
              <Logo variant="full" color="#ffffff" height={24} />
              <p className="mt-4 text-sm text-white/40 leading-relaxed max-w-xs">
                데이터 기반 원활한 소통,<br />
                그 공간 가치를 경험하다.
              </p>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-heading text-xs font-semibold text-white/60 uppercase tracking-widest mb-4">
                서비스
              </h4>
              <ul className="space-y-2.5">
                {["사무실 인테리어", "상업공간 설계", "리모델링", "가구 솔루션"].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-white/40 hover:text-gold transition-colors cursor-pointer">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-heading text-xs font-semibold text-white/60 uppercase tracking-widest mb-4">
                회사
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "회사소개", href: "/about" },
                  { label: "프로젝트", href: "/portfolio" },
                  { label: "인사이트", href: "/insights" },
                  { label: "자료실", href: "/resources" },
                  { label: "문의하기", href: "/contact" },
                ].map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}>
                      <span className="text-sm text-white/40 hover:text-gold transition-colors">
                        {item.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-heading text-xs font-semibold text-white/60 uppercase tracking-widest mb-4">
                연락처
              </h4>
              <ul className="space-y-2.5 text-sm text-white/40">
                <li>서울특별시 강남구</li>
                <li>02-XXX-XXXX</li>
                <li>info@kokamdo.co.kr</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/5">
          <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/25">
              &copy; 2026 (주)고감도. All rights reserved.
            </p>
            <div className="flex gap-6">
              <span className="text-xs text-white/25 hover:text-white/50 transition-colors cursor-pointer">
                개인정보처리방침
              </span>
              <span className="text-xs text-white/25 hover:text-white/50 transition-colors cursor-pointer">
                이용약관
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
