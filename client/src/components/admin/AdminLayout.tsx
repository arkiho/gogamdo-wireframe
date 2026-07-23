/**
 * 관리자 콘솔 셸 (STAFF_UI / B-5)
 * 좌측 사이드바(7그룹) + 상단 바(브레드크럼·알림·프로필) 로 모든 /admin/* 페이지를 감싼다.
 * 목업: _mockups/gogamdo-admin-sidebar.html — 다크 사이드바 + 골드 액티브 + 검색 + 유틸 하단 + 반응형 드로어.
 */
import { ReactNode, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import NotificationCenter from "@/components/NotificationCenter";
import {
  LayoutDashboard, Inbox, Users, GitBranch, BarChart3, Activity,
  FileText, Mail, Image as ImageIcon, Star, Megaphone,
  HardHat, HeartHandshake, Sparkles, ClipboardList, Package,
  MessageSquare, Wand2, UserCog, Target, Download, Receipt, Bell, HardDrive, Banknote, TrendingUp,
  Settings, ScrollText, Search, Menu, X, Loader2, ExternalLink, LogOut,
} from "lucide-react";

type NavItem = { label: string; href: string; icon: any; badge?: "inquiries"; external?: boolean };
type NavGroup = { title?: string; items: NavItem[] };

const NAV: NavGroup[] = [
  { items: [{ label: "대시보드", href: "/admin", icon: LayoutDashboard }] },
  {
    title: "영업 · 고객",
    items: [
      { label: "문의", href: "/admin/inquiries", icon: Inbox, badge: "inquiries" },
      { label: "리드", href: "/admin/leads", icon: Download },
      { label: "견적", href: "/admin/estimates", icon: Receipt },
      { label: "CRM 고객관리", href: "/admin/crm", icon: Users },
      { label: "고객 파이프라인", href: "/admin/client-pipeline", icon: GitBranch },
      { label: "E2E 파이프라인 현황", href: "/admin/pipeline", icon: BarChart3 },
      { label: "여정 분석", href: "/admin/journey-analytics", icon: Activity },
    ],
  },
  {
    title: "콘텐츠 · 마케팅",
    items: [
      { label: "인사이트", href: "/admin/insights", icon: FileText },
      { label: "뉴스레터 · 구독자", href: "/admin/newsletter", icon: Mail },
      { label: "고객 사례(포트폴리오)", href: "/admin/portfolios", icon: ImageIcon },
      { label: "리뷰", href: "/admin/reviews", icon: Star },
      { label: "공지 · 팝업", href: "/admin/announcements", icon: Megaphone },
      { label: "마케팅 · SEO · AEO", href: "/admin/marketing", icon: TrendingUp },
    ],
  },
  {
    title: "프로젝트 · 운영",
    items: [
      { label: "현장관리 (OpsX)", href: "/ops", icon: HardHat, external: true },
      { label: "사후관리", href: "/admin/aftercare", icon: HeartHandshake },
      { label: "설계 자동화 · DDIA", href: "/admin/ddia", icon: Sparkles },
      { label: "설문 자동화", href: "/admin/survey", icon: ClipboardList },
      { label: "납품사 포털", href: "/admin/vendor", icon: Package },
    ],
  },
  {
    title: "AI 서비스",
    items: [
      { label: "AI 상담", href: "/admin/ai-chat", icon: MessageSquare },
      { label: "AI 스타일", href: "/admin/ai-style", icon: Wand2 },
    ],
  },
  {
    title: "조직 · 경영",
    items: [
      { label: "결제 · 경비 현황", href: "/admin/finance", icon: Banknote },
      { label: "직원 관리", href: "/admin/employee", icon: UserCog },
      { label: "KPI · OKR", href: "/admin/kpi-okr", icon: Target },
    ],
  },
];

const UTIL: NavItem[] = [
  { label: "알림센터", href: "/admin/notifications", icon: Bell },
  { label: "드라이브 동기화", href: "/admin/drive-sync", icon: HardDrive },
  { label: "사이트 설정", href: "/admin/settings", icon: Settings },
  { label: "로그 (다운로드 · 삭제)", href: "/admin/download-logs", icon: ScrollText },
  { label: "삭제 로그", href: "/admin/deletion-log", icon: ScrollText },
];

// 라우트 → 라벨 (브레드크럼용)
const LABEL_BY_HREF: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const g of NAV) for (const it of g.items) if (!it.external) m[it.href] = it.label;
  for (const it of UTIL) m[it.href] = it.label;
  m["/admin"] = "대시보드";
  return m;
})();

function isActive(current: string, href: string): boolean {
  if (href === "/admin") return current === "/admin";
  return current === href || current.startsWith(href + "/");
}

function SidebarBody({ current, onNavigate, inquiries }: { current: string; onNavigate?: () => void; inquiries?: number }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const groups = useMemo(() => {
    if (!query) return NAV;
    return NAV
      .map((g) => ({ ...g, items: g.items.filter((it) => it.label.toLowerCase().includes(query)) }))
      .filter((g) => g.items.length > 0);
  }, [query]);

  const renderItem = (it: NavItem) => {
    const active = !it.external && isActive(current, it.href);
    const Icon = it.icon;
    const badgeCount = it.badge === "inquiries" ? inquiries : undefined;
    const inner = (
      <span
        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors relative
          ${active ? "bg-gold text-[#1a1710] font-semibold" : "text-[#c3bfb1] hover:bg-white/[0.055] hover:text-white"}`}
      >
        <Icon className="w-[17px] h-[17px] flex-shrink-0 opacity-90" />
        <span className="truncate">{it.label}</span>
        {it.external && <ExternalLink className="w-3 h-3 opacity-50 flex-shrink-0" />}
        {badgeCount != null && badgeCount > 0 && (
          <span className={`ml-auto text-[10px] font-semibold px-1.5 rounded-full ${active ? "bg-[#1a1710] text-gold-light" : "bg-red-500 text-white"}`}>
            {badgeCount}
          </span>
        )}
      </span>
    );
    if (it.external) {
      return (
        <Link key={it.label} href={it.href} onClick={onNavigate}>{inner}</Link>
      );
    }
    return (
      <Link key={it.label} href={it.href} onClick={onNavigate}>{inner}</Link>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#16150f] text-[#e9e6da]">
      {/* Brand */}
      <div className="px-[18px] py-4 border-b border-white/[0.08]">
        <div className="font-extrabold text-[15px] text-white">고<span className="text-gold-light">감</span>도 <span className="font-bold">Admin</span></div>
        <div className="text-[9px] tracking-[1.5px] text-[#7a7566] uppercase mt-0.5">관리자 콘솔</div>
      </div>
      {/* Search */}
      <div className="px-3 pt-3 pb-1 relative">
        <Search className="w-3.5 h-3.5 absolute left-[22px] top-1/2 -translate-y-1/2 text-[#7a7566]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="메뉴 검색"
          className="w-full bg-white/[0.06] border border-white/10 rounded-lg text-[12px] text-[#e9e6da] placeholder:text-[#7a7566] pl-8 pr-2.5 py-1.5 outline-none focus:border-gold/50"
        />
      </div>
      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2.5 pb-4">
        {groups.map((g, gi) => (
          <div key={g.title ?? `g${gi}`} className="mt-3.5 first:mt-2">
            {g.title && <div className="text-[10px] tracking-[1.2px] uppercase text-[#6f6a5c] font-semibold px-2.5 pb-1.5">{g.title}</div>}
            <div className="space-y-px">{g.items.map(renderItem)}</div>
          </div>
        ))}
        {groups.length === 0 && <p className="text-[12px] text-[#7a7566] px-2.5 py-4">검색 결과 없음</p>}
      </nav>
      {/* Utility */}
      <div className="border-t border-white/[0.08] px-2.5 py-2 space-y-px">
        {UTIL.map(renderItem)}
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [location] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const statsQ = trpc.admin.stats.useQuery(undefined, {
    enabled: !!user && (user.role === "admin" || user.role === "master"),
    staleTime: 60_000,
  });
  const inquiries = (statsQ.data as any)?.newInquiries as number | undefined;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-paper"><Loader2 className="w-7 h-7 animate-spin text-gold" /></div>;
  }
  if (!user || (user.role !== "admin" && user.role !== "master")) {
    if (typeof window !== "undefined") window.location.href = getLoginUrl();
    return null;
  }

  const crumb = LABEL_BY_HREF[location] ?? "관리자";
  const initial = (user.name ?? "관").slice(0, 1);

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[244px_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block sticky top-0 h-screen">
        <SidebarBody current={location} inquiries={inquiries} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-[260px] max-w-[80%] h-full shadow-xl">
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="메뉴 닫기"
              className="absolute -right-10 top-3 text-white/80 hover:text-white"
            ><X className="w-6 h-6" /></button>
            <SidebarBody current={location} inquiries={inquiries} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="min-w-0 flex flex-col">
        <header className="sticky top-0 z-10 bg-card border-b border-border flex items-center justify-between gap-3 px-4 lg:px-6 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="메뉴 열기"
              className="lg:hidden text-muted-foreground hover:text-ink"
            ><Menu className="w-5 h-5" /></button>
            <div className="text-[13px] text-muted-foreground truncate">
              관리자 <span className="mx-1 opacity-50">›</span> <b className="text-ink font-bold">{crumb}</b>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <NotificationCenter />
            <div className="hidden sm:flex items-center gap-2 text-[12px] text-muted-foreground">
              <span className="w-[30px] h-[30px] rounded-full bg-[#16150f] text-gold-light flex items-center justify-center text-[12px] font-bold">{initial}</span>
              <span>{user.name ?? "관리자"}</span>
            </div>
            <button onClick={logout} aria-label="로그아웃" className="text-muted-foreground hover:text-ink transition-colors">
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        </header>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
