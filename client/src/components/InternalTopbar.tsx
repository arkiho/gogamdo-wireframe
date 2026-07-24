/**
 * 공용 내부 상단 셸 (E-12) — 모든 /admin/* · /ops/* 콘솔 공통 상단바.
 * 좌상단 "고감도 홈" → / · 우상단 역할기반 콘솔 전환 드롭다운 + 알림 + 아바타(마이페이지/설정/로그아웃).
 * 목업: _mockups/gogamdo-internal-shell-mypage.html
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import NotificationCenter from "@/components/NotificationCenter";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home, Menu, ChevronDown, Globe, HardHat, Shield, User as UserIcon,
  Settings, LogOut, Lock,
} from "lucide-react";

function roleLabel(user: any): string {
  if (user?.role === "master") return "대표";
  if (user?.role === "admin") return "관리자";
  const dep: Record<string, string> = {
    design: "설계팀", construction: "공사팀", accounting: "회계팀",
    management: "경영지원", sales: "영업팀",
  };
  return dep[user?.department] ?? "직원";
}

export default function InternalTopbar({
  consoleLabel,
  crumb,
  onMobileMenu,
}: {
  consoleLabel: string;
  crumb?: string;
  onMobileMenu?: () => void;
}) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const isAdmin = user?.role === "admin" || user?.role === "master";
  const initial = (user?.name ?? "직").slice(0, 1);

  return (
    <header className="sticky top-0 z-20 bg-card border-b border-border flex items-center justify-between gap-3 px-4 lg:px-6 py-2.5">
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        {onMobileMenu && (
          <button
            onClick={onMobileMenu}
            aria-label="메뉴 열기"
            className="lg:hidden text-muted-foreground hover:text-ink"
          ><Menu className="w-5 h-5" /></button>
        )}
        <Link href="/" className="flex items-center gap-1.5 bg-[#16150f] text-white rounded-lg px-3 py-1.5 text-[12.5px] font-semibold hover:bg-[#241f16] transition-colors flex-shrink-0">
          <Home className="w-3.5 h-3.5" /> 고<span className="text-gold-light font-extrabold">감</span>도 홈
        </Link>
        <div className="hidden sm:block w-px h-5 bg-border" />
        <div className="hidden sm:block text-[13px] text-muted-foreground truncate">
          {consoleLabel}
          {crumb && <><span className="mx-1 opacity-50">›</span><b className="text-ink font-bold">{crumb}</b></>}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* 콘솔 전환 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 bg-[#faf8f2] border border-border rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-ink hover:bg-[#f3ede1] transition-colors">
              <span className="text-gold">{consoleLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-[10px] tracking-wider uppercase text-muted-foreground">이동 가능한 화면</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setLocation("/")}>
              <Globe className="w-4 h-4 opacity-70" /> 메인 홈페이지
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/ops")}>
              <HardHat className="w-4 h-4 opacity-70" /> 직원 콘솔
              {consoleLabel === "직원 콘솔" && <span className="ml-auto text-[10px] text-gold font-bold">현재</span>}
            </DropdownMenuItem>
            {isAdmin ? (
              <DropdownMenuItem onClick={() => setLocation("/admin")}>
                <Shield className="w-4 h-4 opacity-70" /> 관리자 콘솔
                {consoleLabel === "관리자 콘솔" && <span className="ml-auto text-[10px] text-gold font-bold">현재</span>}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem disabled className="opacity-40">
                <Shield className="w-4 h-4 opacity-70" /> 관리자 콘솔
                <Lock className="w-3 h-3 ml-auto" />
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLocation("/ops/my")}>
              <UserIcon className="w-4 h-4 opacity-70" /> 마이페이지
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <NotificationCenter />

        {/* 아바타 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 pl-0.5 pr-2 py-0.5 rounded-full border border-border bg-[#faf8f2] hover:bg-[#f3ede1] transition-colors">
              <span className="w-7 h-7 rounded-full bg-[#16150f] text-gold-light flex items-center justify-center text-[12px] font-bold">{initial}</span>
              <span className="hidden sm:inline text-[12px] text-muted-foreground"><b className="text-ink">{user?.name ?? "직원"}</b> · {roleLabel(user)}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-[12px]">{user?.name ?? "직원"} · {roleLabel(user)}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLocation("/ops/my")}>
              <UserIcon className="w-4 h-4 opacity-70" /> 마이페이지
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem onClick={() => setLocation("/admin/settings")}>
                <Settings className="w-4 h-4 opacity-70" /> 사이트 설정
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()} className="text-red-600 focus:text-red-600">
              <LogOut className="w-4 h-4" /> 로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
