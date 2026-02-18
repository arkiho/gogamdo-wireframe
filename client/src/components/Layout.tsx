/*
 * DESIGN: Precision Studio — Swiss Design + Contemporary Editorial
 * Navigation: Minimal top nav with gold accent CTA + KOKAMDO logo
 * AI 서비스 메뉴: 드롭다운(데스크톱 호버, 모바일 아코디언)
 * Footer: Editorial grid with newsletter signup
 * Scroll progress: Left vertical gold line
 */

import { useState, useEffect, useRef, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowUpRight, Mail, ChevronDown, User, Building2, HardHat, LogIn, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { analytics } from "@/lib/analytics";
import Logo from "./Logo";
import KakaoChat from "./KakaoChat";
import AnnouncementBanner from "./AnnouncementBanner";
import ExitIntentPopup from "./ExitIntentPopup";
import PopupModal from "./PopupModal";
import RelatedPages from "./RelatedPages";

type NavItem = {
  label: string;
  href: string;
};

type NavGroup = {
  label: string;
  children: NavItem[];
};

type NavEntry = NavItem | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

const NAV_ITEMS: NavEntry[] = [
  { label: "회사소개", href: "/about" },
  { label: "솔루션", href: "/solutions" },
  { label: "프로젝트", href: "/portfolio" },
  {
    label: "AI 서비스",
    children: [
      { label: "AI 견적", href: "/estimator" },
      { label: "AI 상담", href: "/ai-chat" },
      { label: "AI 스타일", href: "/ai-style" },
      { label: "AI 리디자인", href: "/ai-redesign" },
    ],
  },
  { label: "인사이트", href: "/insights" },
];

/* ─── Desktop Dropdown ─── */
function DesktopDropdown({
  group,
  isTransparent,
  location,
}: {
  group: NavGroup;
  isTransparent: boolean;
  location: string;
}) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isChildActive = group.children.some((c) => location === c.href);

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        className={`flex items-center gap-1 text-sm font-medium tracking-wide transition-colors duration-300 hover:text-gold ${
          isChildActive
            ? "text-gold"
            : isTransparent
              ? "text-white/70"
              : "text-ink-light"
        }`}
      >
        {group.label}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-1/2 -translate-x-1/2 pt-3"
          >
            <div className="bg-paper/95 backdrop-blur-xl border border-border/50 shadow-lg min-w-[180px]">
              {group.children.map((child) => (
                <Link key={child.href} href={child.href}>
                  <span
                    className={`block px-5 py-3 text-sm font-medium transition-colors hover:bg-gold/5 hover:text-gold ${
                      location === child.href
                        ? "text-gold bg-gold/5"
                        : "text-ink-light"
                    }`}
                  >
                    {child.label}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Mobile Accordion ─── */
function MobileAccordion({
  group,
  location,
  index,
}: {
  group: NavGroup;
  location: string;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const isChildActive = group.children.some((c) => location === c.href);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between w-full py-4 text-2xl font-heading font-semibold border-b border-border/30 transition-colors ${
          isChildActive ? "text-gold" : "text-ink"
        }`}
      >
        <span>{group.label}</span>
        <ChevronDown
          className={`w-5 h-5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pl-4 pb-2">
              {group.children.map((child) => (
                <Link key={child.href} href={child.href}>
                  <span
                    className={`block py-3 text-lg font-medium transition-colors ${
                      location === child.href
                        ? "text-gold"
                        : "text-ink/70 hover:text-ink"
                    }`}
                  >
                    {child.label}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Login Dropdown ─── */
function LoginDropdown({ isTransparent }: { isTransparent: boolean }) {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // 로그인 상태: 사용자 이름 + 역할별 바로가기
  if (isAuthenticated && user) {
    const isStaff = user.role === "admin" || (user as any).opsRole !== "none";
    return (
      <div
        className="relative"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <button
          className={`flex items-center gap-2 text-sm font-medium tracking-wide transition-colors duration-300 hover:text-gold ${
            isTransparent ? "text-white/70" : "text-ink-light"
          }`}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            isTransparent ? "bg-white/20 text-white" : "bg-gold/15 text-gold"
          }`}>
            {user.name?.charAt(0) || "U"}
          </div>
          <span className="hidden xl:inline">{user.name}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full right-0 pt-3"
            >
              <div className="bg-paper/95 backdrop-blur-xl border border-border/50 shadow-lg min-w-[200px]">
                <div className="px-4 py-3 border-b border-border/30">
                  <p className="text-sm font-semibold text-ink">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                {isStaff && (
                  <Link href="/ops">
                    <span className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-ink-light hover:bg-gold/5 hover:text-gold transition-colors">
                      <HardHat className="w-4 h-4" />
                      OpsX 대시보드
                    </span>
                  </Link>
                )}
                <Link href="/my">
                  <span className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-ink-light hover:bg-gold/5 hover:text-gold transition-colors">
                    <Building2 className="w-4 h-4" />
                    고객 포털
                  </span>
                </Link>
                {user.role === "admin" && (
                  <Link href="/admin">
                    <span className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-ink-light hover:bg-gold/5 hover:text-gold transition-colors">
                      <LayoutDashboard className="w-4 h-4" />
                      관리자
                    </span>
                  </Link>
                )}
                <button
                  onClick={() => { logout(); setOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors border-t border-border/30"
                >
                  <LogOut className="w-4 h-4" />
                  로그아웃
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // 비로그인 상태: 로그인 드롭다운
  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        className={`flex items-center gap-1.5 text-sm font-medium tracking-wide transition-colors duration-300 hover:text-gold ${
          isTransparent ? "text-white/70" : "text-ink-light"
        }`}
      >
        <User className="w-4 h-4" />
        <span className="hidden xl:inline">로그인</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 pt-3"
          >
            <div className="bg-paper/95 backdrop-blur-xl border border-border/50 shadow-lg min-w-[220px]">
              <div className="px-4 py-3 border-b border-border/30">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">로그인</p>
              </div>
              <Link href="/client/login">
                <span className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-ink-light hover:bg-gold/5 hover:text-gold transition-colors">
                  <Building2 className="w-4 h-4" />
                  <div>
                    <p className="font-semibold text-ink">고객사 로그인</p>
                    <p className="text-xs text-muted-foreground">프로젝트 현황 · 서베이 · 보고서</p>
                  </div>
                </span>
              </Link>
              <a href={getLoginUrl()}>
                <span className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-ink-light hover:bg-gold/5 hover:text-gold transition-colors border-t border-border/20">
                  <HardHat className="w-4 h-4" />
                  <div>
                    <p className="font-semibold text-ink">직원 로그인</p>
                    <p className="text-xs text-muted-foreground">OpsX · 공정관리 · 결재</p>
                  </div>
                </span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Mobile Login Buttons ─── */
function MobileLoginButtons() {
  const { user, isAuthenticated, logout } = useAuth();

  if (isAuthenticated && user) {
    const isStaff = user.role === "admin" || (user as any).opsRole !== "none";
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: (NAV_ITEMS.length + 1) * 0.05 }}
        className="mt-4 pt-4 border-t border-border/30"
      >
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
          {user.name}님
        </p>
        <div className="flex flex-col gap-2">
          {isStaff && (
            <Link href="/ops">
              <span className="flex items-center gap-3 py-3 text-lg font-medium text-ink hover:text-gold transition-colors">
                <HardHat className="w-5 h-5" />
                OpsX 대시보드
              </span>
            </Link>
          )}
          <Link href="/my">
            <span className="flex items-center gap-3 py-3 text-lg font-medium text-ink hover:text-gold transition-colors">
              <Building2 className="w-5 h-5" />
              고객 포털
            </span>
          </Link>
          {user.role === "admin" && (
            <Link href="/admin">
              <span className="flex items-center gap-3 py-3 text-lg font-medium text-ink hover:text-gold transition-colors">
                <LayoutDashboard className="w-5 h-5" />
                관리자
              </span>
            </Link>
          )}
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 py-3 text-lg font-medium text-red-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            로그아웃
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: (NAV_ITEMS.length + 1) * 0.05 }}
      className="mt-4 pt-4 border-t border-border/30"
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
        로그인
      </p>
      <div className="flex gap-3">
        <Link href="/client/login">
          <span className="inline-flex items-center gap-2 px-5 py-3 border border-border text-ink text-base font-medium hover:border-gold hover:text-gold transition-colors">
            <Building2 className="w-4 h-4" />
            고객사
          </span>
        </Link>
        <a href={getLoginUrl()}>
          <span className="inline-flex items-center gap-2 px-5 py-3 bg-gold/10 text-gold text-base font-medium hover:bg-gold/20 transition-colors">
            <HardHat className="w-4 h-4" />
            직원
          </span>
        </a>
      </div>
    </motion.div>
  );
}

/* ─── Newsletter Form ─── */
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

/* ─── Main Layout ─── */
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
      {/* Announcement Banner */}
      <AnnouncementBanner />

      {/* Scroll Progress Bar */}
      <div
        className="scroll-progress"
        style={{ height: `${scrollProgress}%` }}
      />

      {/* Navigation */}
      <header
        style={{ top: "var(--banner-height, 0px)" }}
        className={`fixed left-0 right-0 z-50 transition-all duration-500 ${
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
            {NAV_ITEMS.map((entry) =>
              isGroup(entry) ? (
                <DesktopDropdown
                  key={entry.label}
                  group={entry}
                  isTransparent={isTransparent}
                  location={location}
                />
              ) : (
                <Link key={entry.href} href={entry.href}>
                  <span
                    className={`text-sm font-medium tracking-wide transition-colors duration-300 hover:text-gold ${
                      location === entry.href ? "text-gold" : isTransparent ? "text-white/70" : "text-ink-light"
                    }`}
                  >
                    {entry.label}
                  </span>
                </Link>
              )
            )}
          </div>

          {/* Login + CTA + Mobile Toggle */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:block">
              <LoginDropdown isTransparent={isTransparent} />
            </div>
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
              {NAV_ITEMS.map((entry, i) =>
                isGroup(entry) ? (
                  <MobileAccordion
                    key={entry.label}
                    group={entry}
                    location={location}
                    index={i}
                  />
                ) : (
                  <motion.div
                    key={entry.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={entry.href}>
                      <span
                        className={`block py-4 text-2xl font-heading font-semibold border-b border-border/30 transition-colors ${
                          location === entry.href ? "text-gold" : "text-ink"
                        }`}
                      >
                        {entry.label}
                      </span>
                    </Link>
                  </motion.div>
                )
              )}
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

              {/* 모바일 로그인 버튼 */}
              <MobileLoginButtons />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* KakaoTalk Chat Widget */}
      <KakaoChat />

      {/* Exit Intent & Engagement Popup */}
      <ExitIntentPopup />
      <PopupModal />

      {/* Related Pages - SEO Internal Linking */}
      <RelatedPages />

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
                {[
                  { label: "사무실 인테리어", href: "/solutions" },
                  { label: "상업공간 설계", href: "/solutions" },
                  { label: "OpsX 컨설팅", href: "/opsx" },
                  { label: "AI 견적", href: "/estimator" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link href={item.href}>
                      <span className="text-sm text-white/40 hover:text-gold transition-colors">
                        {item.label}
                      </span>
                    </Link>
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
                  { label: "AI 서비스", href: "/ai-redesign" },
                  { label: "FAQ", href: "/faq" },
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
                <li><a href="tel:02-3487-6133" className="hover:text-gold transition-colors">02-3487-6133</a></li>
                <li><a href="mailto:contact@kokamdo.co.kr" className="hover:text-gold transition-colors">contact@kokamdo.co.kr</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/5">
          <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/25">
              &copy; 2026 (주)고감도. 공동대표 안향자·김기호. All rights reserved.
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
