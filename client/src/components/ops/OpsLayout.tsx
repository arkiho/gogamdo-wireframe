/**
 * 직원 콘솔 공용 레이아웃 (E-12) — 모든 /ops/* 페이지를 공용 상단 셸로 감싼다.
 * 목업: _mockups/gogamdo-internal-shell-mypage.html (직원 콘솔 상단바)
 */
import { ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import InternalTopbar from "@/components/InternalTopbar";
import { Loader2 } from "lucide-react";

const CRUMB_BY_PATH: { match: (p: string) => boolean; label: string }[] = [
  { match: (p) => p === "/ops", label: "내 현장" },
  { match: (p) => p.startsWith("/ops/project/"), label: "현장 상세" },
  { match: (p) => p === "/ops/my", label: "마이페이지" },
  { match: (p) => p.startsWith("/ops/staff-dashboard"), label: "직원 대시보드" },
  { match: (p) => p.startsWith("/ops/staff"), label: "직원 관리" },
  { match: (p) => p.startsWith("/ops/partners"), label: "협력업체" },
  { match: (p) => p.startsWith("/ops/cameras"), label: "현장 CCTV" },
  { match: (p) => p.startsWith("/ops/field-measure"), label: "360° 실측" },
  { match: (p) => p.startsWith("/ops/calendar"), label: "캘린더" },
  { match: (p) => p.startsWith("/ops/projects"), label: "프로젝트 목록" },
  { match: (p) => p.startsWith("/ops/schedule"), label: "일정" },
  { match: (p) => p.startsWith("/ops/approval-lines"), label: "결재라인" },
  { match: (p) => p.startsWith("/ops/approval"), label: "결재" },
];

export default function OpsLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-paper"><Loader2 className="w-7 h-7 animate-spin text-gold" /></div>;
  }
  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/auth/login";
    return null;
  }

  const crumb = CRUMB_BY_PATH.find((c) => c.match(location))?.label;

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <InternalTopbar consoleLabel="직원 콘솔" crumb={crumb} />
      <main className="flex-1 min-w-0 w-full max-w-7xl mx-auto px-4 lg:px-6 py-5">
        {children}
      </main>
    </div>
  );
}
