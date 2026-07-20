/**
 * 관리자 E2E 파이프라인 통합 현황판
 * 전체 비즈니스 프로세스 단계별 진행 상태를 한눈에 보여줌
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Users, MessageSquare, FileText, Layers,
  CheckCircle2, HeartHandshake, BarChart3, TrendingUp, TrendingDown,
  Clock, AlertCircle, ChevronRight, ChevronDown, Activity, Target, Loader2,
} from "lucide-react";
import { useState } from "react";
import { useLocation, Link } from "wouter";

/**
 * client_projects.status 진행 순서.
 * 퍼널의 "해당 단계 이상 도달" 판정 기준이 되므로 DB enum 순서와 일치해야 함.
 */
const STATUS_ORDER = [
  "created",
  "floor_plan_uploaded",
  "survey_completed",
  "report_generated",
  "report_sent",
  "company_survey_shared",
  "company_survey_done",
  "meeting_requested",
  "meeting_confirmed",
  "completed",
] as const;

const STATUS_LABELS: Record<string, string> = {
  created: "프로젝트 생성",
  floor_plan_uploaded: "도면 업로드",
  survey_completed: "설문 완료",
  report_generated: "리포트 생성",
  report_sent: "리포트 발송",
  company_survey_shared: "전사 설문 공유",
  company_survey_done: "전사 설문 완료",
  meeting_requested: "미팅 요청",
  meeting_confirmed: "미팅 확정",
  completed: "완료",
};

/**
 * 퍼널 단계 정의. 각 단계는 `from` 상태에 도달한 프로젝트를 집계한다.
 * (문의 → 설문 → 설계/제안 → 미팅 → 완료)
 */
const PIPELINE_STAGES = [
  { id: "inquiry", label: "문의 접수", from: "created", icon: MessageSquare, color: "bg-blue-500", text: "text-blue-600", bg: "bg-blue-100" },
  { id: "survey", label: "설문 분석", from: "survey_completed", icon: FileText, color: "bg-purple-500", text: "text-purple-600", bg: "bg-purple-100" },
  { id: "design", label: "설계/제안", from: "report_generated", icon: Layers, color: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-100" },
  { id: "meeting", label: "미팅/계약", from: "meeting_requested", icon: Users, color: "bg-orange-500", text: "text-orange-600", bg: "bg-orange-100" },
  { id: "completed", label: "완료/사후관리", from: "completed", icon: HeartHandshake, color: "bg-rose-500", text: "text-rose-600", bg: "bg-rose-100" },
] as const;

function statusIndex(status: string | null | undefined) {
  const idx = STATUS_ORDER.indexOf((status || "created") as (typeof STATUS_ORDER)[number]);
  return idx < 0 ? 0 : idx;
}

function formatNumber(n: number | null | undefined) {
  if (n == null) return "0";
  return n.toLocaleString("ko-KR");
}

function formatDays(days: number | null) {
  if (days == null) return "-";
  if (days < 1) return "1일 미만";
  return `${Math.round(days)}일`;
}

export default function AdminPipelineOverview() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [openStage, setOpenStage] = useState<string | null>(null);

  // 데이터 가져오기
  const adminStats = trpc.admin.stats.useQuery(undefined, { enabled: !!user && (user.role === "admin" || user.role === "master") });
  const opsStats = trpc.ops.stats.useQuery(undefined, { enabled: !!user && (user.role === "admin" || user.role === "master") });
  const clientProjects = trpc.clientPipeline.adminListProjects.useQuery(undefined, { enabled: !!user && (user.role === "admin" || user.role === "master") });
  const inquiries = trpc.inquiry.list.useQuery(undefined, { enabled: !!user && (user.role === "admin" || user.role === "master") });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "master")) {
    window.location.href = getLoginUrl();
    return null;
  }

  const projects = clientProjects.data || [];

  /**
   * 단계별 도달 프로젝트. 퍼널이므로 "그 단계 이상 진행된" 프로젝트를 누적 집계한다.
   * (완료된 프로젝트도 설문 단계를 거쳤으므로 설문 단계에 포함)
   */
  const stages = PIPELINE_STAGES.map((stage, idx) => {
    const threshold = statusIndex(stage.from);
    const reached = projects.filter((p: any) => statusIndex(p.status) >= threshold);
    // 현재 이 구간에 머물러 있는(다음 단계로 못 넘어간) 프로젝트
    const nextThreshold = idx < PIPELINE_STAGES.length - 1 ? statusIndex(PIPELINE_STAGES[idx + 1].from) : Infinity;
    const current = reached.filter((p: any) => statusIndex(p.status) < nextThreshold);
    return { ...stage, reached, current, count: reached.length };
  });

  const entryCount = stages[0]?.count || 0;

  // 직전 단계 대비 전환율 — 병목 판정 기준
  const stagesWithRate = stages.map((s, idx) => {
    const prev = idx === 0 ? null : stages[idx - 1];
    const stepRate = prev == null ? 100 : prev.count > 0 ? Math.round((s.count / prev.count) * 100) : 0;
    const overallRate = entryCount > 0 ? Math.round((s.count / entryCount) * 100) : 0;
    return { ...s, stepRate, overallRate, isFirst: idx === 0 };
  });

  // 병목: 전환율이 가장 낮은 단계(첫 단계 제외, 유입이 있을 때만)
  const bottleneck = stagesWithRate
    .filter((s) => !s.isFirst && s.stepRate < 100)
    .sort((a, b) => a.stepRate - b.stepRate)[0] || null;

  const totalProjects = projects.length;
  const completedList = projects.filter((p: any) => p.status === "completed");
  const completedProjects = completedList.length;
  const activeProjects = totalProjects - completedProjects;
  const conversionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

  // 평균 전환 시간 — 완료 프로젝트의 생성~완료 소요일 평균
  const leadTimes = completedList
    .map((p: any) => {
      if (!p.createdAt || !p.updatedAt) return null;
      const ms = new Date(p.updatedAt).getTime() - new Date(p.createdAt).getTime();
      return ms >= 0 ? ms / 86_400_000 : null;
    })
    .filter((d: number | null): d is number => d != null);
  const avgLeadTime = leadTimes.length > 0 ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length : null;

  // 이번 달 완료 건수
  const now = new Date();
  const monthlyCompleted = completedList.filter((p: any) => {
    if (!p.updatedAt) return false;
    const d = new Date(p.updatedAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="border-b border-border/50 bg-white">
        <div className="container py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="text-muted-foreground hover:text-ink">
                <ArrowLeft className="w-4 h-4 mr-1" /> 뒤로
              </Button>
              <div>
                <h1 className="font-heading text-xl sm:text-2xl font-bold text-ink">E2E 파이프라인 현황판</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">상담 → 설문 → 부동산 → 설계 → 시공 → 사후관리</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                실시간
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8 space-y-8">
        {/* 핵심 KPI 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">전체 프로젝트</p>
                  <p className="text-2xl font-heading font-bold text-ink">{formatNumber(totalProjects)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">진행 중</p>
                  <p className="text-2xl font-heading font-bold text-ink">{formatNumber(activeProjects)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">완료</p>
                  <p className="text-2xl font-heading font-bold text-ink">{formatNumber(completedProjects)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">전체 전환율</p>
                  <p className="text-2xl font-heading font-bold text-ink">{conversionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">평균 전환 시간</p>
                  <p className="text-2xl font-heading font-bold text-ink">{formatDays(avgLeadTime)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">이번 달 완료</p>
                  <p className="text-2xl font-heading font-bold text-ink">{formatNumber(monthlyCompleted)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-gold/30 bg-gold/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-xs text-gold">신규 문의</p>
                  <p className="text-2xl font-heading font-bold text-gold">{formatNumber(adminStats.data?.newInquiries)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 파이프라인 단계별 현황 - 퍼널 뷰 */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-gold" />
                파이프라인 퍼널
              </CardTitle>
              {bottleneck && bottleneck.stepRate < 100 && (
                <Badge variant="outline" className="text-xs border-red-200 bg-red-50 text-red-700 self-start">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  병목: {bottleneck.label} ({bottleneck.stepRate}%)
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {clientProjects.isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">로딩 중...</div>
            ) : totalProjects === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">집계할 프로젝트가 없습니다.</div>
            ) : (
              <div className="space-y-2">
                {stagesWithRate.map((stage) => {
                  const width = Math.max(stage.overallRate, 6);
                  const Icon = stage.icon;
                  const isBottleneck = bottleneck?.id === stage.id;
                  const isOpen = openStage === stage.id;
                  return (
                    <div key={stage.id}>
                      <button
                        type="button"
                        onClick={() => setOpenStage(isOpen ? null : stage.id)}
                        className={`w-full flex items-center gap-3 sm:gap-4 p-2 rounded-lg text-left transition-colors hover:bg-muted/40 ${isBottleneck ? "bg-red-50/60" : ""}`}
                      >
                        <div className="w-28 sm:w-36 flex items-center gap-2 flex-shrink-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stage.color} text-white flex-shrink-0`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-ink truncate">{stage.label}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="relative h-10 bg-muted/30 rounded-lg overflow-hidden">
                            <div
                              className={`absolute inset-y-0 left-0 ${stage.color} rounded-lg flex items-center justify-end pr-3 transition-all duration-500`}
                              style={{ width: `${width}%` }}
                            >
                              <span className="text-sm font-bold text-white">{stage.count}</span>
                            </div>
                          </div>
                        </div>
                        <div className="w-24 sm:w-32 flex-shrink-0 text-right">
                          {stage.isFirst ? (
                            <span className="text-xs text-muted-foreground">유입 기준</span>
                          ) : (
                            <>
                              <p className={`text-sm font-bold ${isBottleneck ? "text-red-600" : "text-ink"}`}>
                                {stage.stepRate}%
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                누적 {stage.overallRate}% · 대기 {stage.current.length}
                              </p>
                            </>
                          )}
                        </div>
                        {isOpen ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="ml-2 sm:ml-10 mb-2 mt-1 border-l-2 border-border/60 pl-3 sm:pl-4">
                          <p className="text-xs text-muted-foreground mb-2">
                            이 단계에 머물러 있는 프로젝트 {stage.current.length}건
                            {stage.count !== stage.current.length && ` (도달 ${stage.count}건)`}
                          </p>
                          {stage.current.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-2">대기 중인 프로젝트가 없습니다.</p>
                          ) : (
                            <div className="space-y-1.5 max-h-64 overflow-y-auto">
                              {stage.current.map((p: any) => (
                                <div
                                  key={p.id}
                                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-ink truncate">{p.companyName || "미정"}</p>
                                    <p className="text-xs text-muted-foreground truncate">{p.contactName}</p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <Badge variant="outline" className="text-[11px]">
                                      {STATUS_LABELS[p.status] || p.status}
                                    </Badge>
                                    <p className="text-[11px] text-muted-foreground mt-1">
                                      {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString("ko-KR") : "-"}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 시공 현황 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-orange-500" />
                  시공 현황
                </CardTitle>
                <Link href="/ops">
                  <Button variant="ghost" size="sm" className="text-gold hover:text-gold-dark">
                    상세 보기 <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">총 프로젝트</p>
                  <p className="text-xl font-heading font-bold text-ink">{formatNumber(opsStats.data?.totalProjects)}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">진행 중</p>
                  <p className="text-xl font-heading font-bold text-ink">{formatNumber(opsStats.data?.activeProjects)}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">완료</p>
                  <p className="text-xl font-heading font-bold text-ink">{formatNumber(opsStats.data?.completedProjects)}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">평균 공정률</p>
                  <p className="text-xl font-heading font-bold text-ink">{opsStats.data?.avgScheduleProgress || 0}%</p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">전체 평균 공정률</span>
                  <span className="text-sm font-bold text-ink">{opsStats.data?.avgScheduleProgress || 0}%</span>
                </div>
                <Progress value={opsStats.data?.avgScheduleProgress || 0} className="h-3" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">총 계약금액</p>
                  <p className="text-lg font-heading font-bold text-ink">{formatNumber(opsStats.data?.totalContractAmount)}원</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">이번달 지출</p>
                  <p className="text-lg font-heading font-bold text-ink">{formatNumber(opsStats.data?.monthlyExpenseAmount)}원</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 최근 프로젝트 목록 */}
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-500" />
                  최근 고객 프로젝트
                </CardTitle>
                <Badge variant="outline" className="text-xs">{projects.length}건</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {clientProjects.isLoading ? (
                <div className="text-sm text-muted-foreground py-8 text-center">로딩 중...</div>
              ) : projects.length === 0 ? (
                <div className="text-sm text-muted-foreground py-8 text-center">등록된 프로젝트가 없습니다.</div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {projects.slice(0, 10).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-gold" />
                        <div>
                          <p className="text-sm font-medium text-ink">{p.companyName || "미정"}</p>
                          <p className="text-xs text-muted-foreground">{p.contactName} · {p.spaceType || "사무실"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {STATUS_LABELS[p.status] || p.status || "진행중"}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString("ko-KR") : "-"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 바로가기 카드 */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "설문 자동화", desc: "설문 템플릿 · 분석 리포트", href: "/admin/survey", icon: FileText, color: "purple" },
            { label: "CRM", desc: "고객 · 상담 이력 · 딜", href: "/admin/crm", icon: Users, color: "blue" },
            { label: "납품사 관리", desc: "견적 파싱 · 원가 분석", href: "/admin/vendor", icon: BarChart3, color: "indigo" },
            { label: "KPI / OKR", desc: "전사 KPI · 직원 OKR", href: "/admin/kpi-okr", icon: Target, color: "amber" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.href}
                className={`border-${item.color}-300/30 cursor-pointer hover:border-${item.color}-400/50 transition-colors`}
                onClick={() => navigate(item.href)}
              >
                <CardContent className="pt-6 pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={`w-5 h-5 text-${item.color}-600`} />
                    <span className="font-heading font-bold text-ink text-sm">{item.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
