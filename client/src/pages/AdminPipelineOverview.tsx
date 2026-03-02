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
  ArrowLeft, Users, MessageSquare, FileText, Building2, Layers,
  Box, CheckCircle2, HeartHandshake, BarChart3, TrendingUp,
  Clock, AlertCircle, ChevronRight, Activity, Target, Loader2,
} from "lucide-react";
import { useLocation, Link } from "wouter";

// 파이프라인 단계 정의
const PIPELINE_STAGES = [
  { id: "inquiry", label: "상담 문의", icon: MessageSquare, color: "bg-blue-500", lightColor: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "survey", label: "설문 분석", icon: FileText, color: "bg-purple-500", lightColor: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "realestate", label: "부동산 매칭", icon: Building2, color: "bg-emerald-500", lightColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "design", label: "설계/레이아웃", icon: Layers, color: "bg-amber-500", lightColor: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "rendering", label: "3D/제안서", icon: Box, color: "bg-pink-500", lightColor: "bg-pink-50 text-pink-700 border-pink-200" },
  { id: "construction", label: "시공 관리", icon: Activity, color: "bg-orange-500", lightColor: "bg-orange-50 text-orange-700 border-orange-200" },
  { id: "postcare", label: "사후관리", icon: HeartHandshake, color: "bg-rose-500", lightColor: "bg-rose-50 text-rose-700 border-rose-200" },
];

function formatNumber(n: number | null | undefined) {
  if (n == null) return "0";
  return n.toLocaleString("ko-KR");
}

export default function AdminPipelineOverview() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

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

  // 프로젝트 단계별 분류
  const projects = clientProjects.data || [];
  const stageMap: Record<string, typeof projects> = {};
  projects.forEach((p: any) => {
    const stage = p.status || "inquiry";
    if (!stageMap[stage]) stageMap[stage] = [];
    stageMap[stage].push(p);
  });

  // 단계별 카운트 계산
  const stageCounts = {
    inquiry: (inquiries.data?.length || 0),
    survey: projects.filter((p: any) => p.status === "survey_sent" || p.status === "survey_completed" || p.status === "report_generated").length,
    realestate: projects.filter((p: any) => p.status === "realestate_matching" || p.status === "realestate_selected").length,
    design: projects.filter((p: any) => p.status === "design" || p.status === "layout_review").length,
    rendering: projects.filter((p: any) => p.status === "rendering" || p.status === "proposal_sent").length,
    construction: opsStats.data?.activeProjects || 0,
    postcare: projects.filter((p: any) => p.status === "completed" || p.status === "post_occupancy").length,
  };

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p: any) => p.status !== "completed" && p.status !== "cancelled").length;
  const completedProjects = projects.filter((p: any) => p.status === "completed").length;
  const conversionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  <p className="text-xs text-muted-foreground">전환율</p>
                  <p className="text-2xl font-heading font-bold text-ink">{conversionRate}%</p>
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
                  <p className="text-xs text-gold">즉시 대응</p>
                  <p className="text-2xl font-heading font-bold text-gold">{formatNumber(adminStats.data?.newInquiries)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 파이프라인 단계별 현황 - 퍼널 뷰 */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-gold" />
              파이프라인 퍼널
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {PIPELINE_STAGES.map((stage, idx) => {
                const count = stageCounts[stage.id as keyof typeof stageCounts] || 0;
                const maxCount = Math.max(...Object.values(stageCounts), 1);
                const width = Math.max((count / maxCount) * 100, 8);
                const Icon = stage.icon;
                return (
                  <div key={stage.id} className="flex items-center gap-4">
                    <div className="w-24 sm:w-32 flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stage.color} text-white`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-ink">{stage.label}</span>
                    </div>
                    <div className="flex-1">
                      <div className="relative h-10 bg-muted/30 rounded-lg overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 ${stage.color} rounded-lg flex items-center justify-end pr-3 transition-all duration-500`}
                          style={{ width: `${width}%` }}
                        >
                          <span className="text-sm font-bold text-white">{count}</span>
                        </div>
                      </div>
                    </div>
                    {idx < PIPELINE_STAGES.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* OpsX 시공 현황 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-orange-500" />
                  OpsX 시공 현황
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
                          {p.status === "inquiry" ? "상담" :
                           p.status === "survey_sent" ? "설문 발송" :
                           p.status === "survey_completed" ? "설문 완료" :
                           p.status === "report_generated" ? "리포트 생성" :
                           p.status === "design" ? "설계" :
                           p.status === "construction" ? "시공" :
                           p.status === "completed" ? "완료" :
                           p.status || "진행중"}
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
            { label: "부동산 매칭", desc: "매물 검색 · 프로그램 다이어그램", href: "/admin/realestate", icon: Building2, color: "emerald" },
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
