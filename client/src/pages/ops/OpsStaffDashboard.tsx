/**
 * 직원용 대시보드 - 직원 개인 업무 현황 요약
 * 내 프로젝트, 내 일정, 알림, 빠른 링크
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  LayoutDashboard, FolderOpen, ClipboardList, Bell,
  ArrowRight, HardHat, Users, Camera, FileText,
  Calendar, CheckCircle2, Clock, AlertCircle
} from "lucide-react";

export default function OpsStaffDashboard() {
  const { user } = useAuth();

  // 직원 프로젝트 현황 (OpsX 통계 활용)
  const opsStats = trpc.ops.getStats.useQuery();

  const departmentLabel: Record<string, string> = {
    design: "디자인팀",
    construction: "시공팀",
    accounting: "회계팀",
    management: "경영관리팀",
    sales: "영업팀",
    none: "미배정",
  };

  const roleLabel: Record<string, string> = {
    pm: "프로젝트 매니저",
    designer: "디자이너",
    site_manager: "현장 소장",
    accountant: "회계 담당",
    director: "이사",
    staff: "일반 직원",
  };

  const dept = (user as any)?.department ?? "none";
  const role = (user as any)?.opsRole ?? "staff";

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="bg-ink text-white">
        <div className="container py-8">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/ops">
              <span className="text-gold/60 hover:text-gold text-sm transition-colors">
                OpsX
              </span>
            </Link>
            <span className="text-white/30">/</span>
            <span className="text-white/60 text-sm">직원 대시보드</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold">
                안녕하세요, {user?.name ?? "직원"}님
              </h1>
              <p className="text-white/50 text-sm mt-1">
                {departmentLabel[dept]} · {roleLabel[role]}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-gold/20 text-gold border-gold/30">
                {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">{opsStats.data?.activeProjects ?? 0}</p>
                <p className="text-xs text-muted-foreground">진행 중 프로젝트</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">{opsStats.data?.completedProjects ?? 0}</p>
                <p className="text-xs text-muted-foreground">완료 프로젝트</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">{opsStats.data?.pendingApprovals ?? 0}</p>
                <p className="text-xs text-muted-foreground">승인 대기</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">{opsStats.data?.overdueItems ?? 0}</p>
                <p className="text-xs text-muted-foreground">지연 항목</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Navigation */}
        <h2 className="font-heading text-lg font-bold text-ink mb-4">빠른 이동</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "프로젝트 관리", href: "/ops/projects", icon: FolderOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "공정 관리", href: "/ops/schedule", icon: ClipboardList, color: "text-green-500", bg: "bg-green-500/10" },
            { label: "현장 카메라", href: "/ops/cameras", icon: Camera, color: "text-purple-500", bg: "bg-purple-500/10" },
            { label: "결재 관리", href: "/ops/approval", icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "직원 관리", href: "/ops/staff", icon: Users, color: "text-teal-500", bg: "bg-teal-500/10" },
            { label: "협력업체", href: "/ops/partners", icon: HardHat, color: "text-orange-500", bg: "bg-orange-500/10" },
            { label: "일정 관리", href: "/ops/calendar", icon: Calendar, color: "text-pink-500", bg: "bg-pink-500/10" },
            { label: "OpsX 홈", href: "/ops", icon: LayoutDashboard, color: "text-gold", bg: "bg-gold/10" },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="border-border/50 hover:border-gold/30 hover:shadow-sm transition-all cursor-pointer group h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <span className="text-sm font-medium text-ink group-hover:text-gold transition-colors">{item.label}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Info Card */}
        <Card className="border-gold/20 bg-gold/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Bell className="w-6 h-6 text-gold flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-heading font-bold text-ink mb-1">직원 대시보드</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  이 페이지는 직원 개인의 업무 현황을 한눈에 볼 수 있는 대시보드입니다.
                  프로젝트 진행 상황, 승인 대기 항목, 일정 등을 확인할 수 있습니다.
                  각 메뉴를 클릭하여 상세 페이지로 이동하세요.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
