/**
 * 고객 공간 활용 대시보드 - 재실센서 기반 공간 분석 뷰
 * 실제 데이터 연동: 프로젝트 진행 상황, 센서 데이터 차트, 견적 이력, 알림
 */
import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard, FolderOpen, User, LogOut, Settings,
  Building2, MapPin, Activity, BarChart3, ChevronRight,
  Loader2, AlertCircle, Eye, EyeOff, Flame, Route, FileText,
  ArrowLeft, TrendingUp, Users, Clock, Thermometer, Droplets,
  Wind, Zap, Receipt, Bell, RefreshCw, ChevronDown
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

// ============================================================
// Client Auth Hook (reusable)
// ============================================================
function useClientAuth() {
  const meQuery = trpc.clientAuth.me.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  return {
    client: meQuery.data,
    isLoading: meQuery.isLoading,
    isAuthenticated: !!meQuery.data,
    refetch: meQuery.refetch,
  };
}

// ============================================================
// Sensor Type Config
// ============================================================
const SENSOR_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  temperature: { icon: <Thermometer className="w-4 h-4" />, color: "#ef4444", label: "온도" },
  humidity: { icon: <Droplets className="w-4 h-4" />, color: "#3b82f6", label: "습도" },
  co2: { icon: <Wind className="w-4 h-4" />, color: "#8b5cf6", label: "CO₂" },
  illuminance: { icon: <Zap className="w-4 h-4" />, color: "#f59e0b", label: "조도" },
  noise: { icon: <Activity className="w-4 h-4" />, color: "#10b981", label: "소음" },
  occupancy: { icon: <Users className="w-4 h-4" />, color: "#06b6d4", label: "재실" },
  motion: { icon: <Activity className="w-4 h-4" />, color: "#ec4899", label: "동작" },
  air_quality: { icon: <Wind className="w-4 h-4" />, color: "#14b8a6", label: "공기질" },
  power: { icon: <Zap className="w-4 h-4" />, color: "#f97316", label: "전력" },
};

const CHART_COLORS = ["#c8a97e", "#3b82f6", "#ef4444", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4"];

// ============================================================
// Portal Sidebar Layout
// ============================================================
function PortalLayout({ children, activeTab, onTabChange }: {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const [, navigate] = useLocation();
  const { client } = useClientAuth();
  const logoutMutation = trpc.clientAuth.logout.useMutation({
    onSuccess: () => navigate("/client/login"),
  });

  const navItems = [
    { id: "overview", label: "대시보드", icon: LayoutDashboard },
    { id: "projects", label: "내 프로젝트", icon: FolderOpen },
    { id: "sensors", label: "센서 데이터", icon: Activity },
    { id: "estimates", label: "견적 이력", icon: Receipt },
    { id: "heatmap", label: "히트맵", icon: Flame },
    { id: "traffic", label: "동선 분석", icon: Route },
    { id: "reports", label: "리포트", icon: FileText },
    { id: "profile", label: "내 정보", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col shrink-0">
        <div className="p-6 border-b border-border">
          <Link href="/">
            <span className="font-heading text-xl font-bold text-gold cursor-pointer tracking-wider">
              GOGAMDO
            </span>
          </Link>
          <p className="text-xs text-muted-foreground mt-1">공간 활용 포털</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? "bg-gold/10 text-gold"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gold/10 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{client?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{client?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="w-3 h-3 mr-2" />
            로그아웃
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

// ============================================================
// Overview Tab (Enhanced with real data)
// ============================================================
function OverviewTab() {
  const { client } = useClientAuth();
  const dashboardQuery = trpc.clientDashboard.overview.useQuery(undefined, {
    retry: false,
    staleTime: 30 * 1000,
  });

  if (dashboardQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gold mr-2" />
        <span className="text-muted-foreground">대시보드 데이터를 불러오는 중...</span>
      </div>
    );
  }

  if (dashboardQuery.error) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">안녕하세요, {client?.name}님</h1>
        <p className="text-muted-foreground mb-8">공간 활용 현황을 한눈에 확인하세요.</p>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">데이터를 불러올 수 없습니다.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => dashboardQuery.refetch()}>
              <RefreshCw className="w-3 h-3 mr-2" />
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = dashboardQuery.data;
  if (!data) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">안녕하세요, {data.client.name}님</h1>
          <p className="text-muted-foreground">공간 활용 현황을 한눈에 확인하세요.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => dashboardQuery.refetch()}>
          <RefreshCw className="w-3 h-3 mr-2" />
          새로고침
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{data.summary.projectCount}</p>
                <p className="text-xs text-muted-foreground">프로젝트</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold">
                  {data.summary.activeSensors}
                  <span className="text-sm font-normal text-muted-foreground">/{data.summary.totalSensors}</span>
                </p>
                <p className="text-xs text-muted-foreground">활성 센서</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{data.recentEstimates.length}</p>
                <p className="text-xs text-muted-foreground">견적 이력</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold">
                  {data.projects.reduce((sum, p) => sum + p.zoneCount, 0)}
                </p>
                <p className="text-xs text-muted-foreground">관리 구역</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects with Latest Readings */}
      {data.projects.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Building2 className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">아직 할당된 프로젝트가 없습니다</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              프로젝트가 시작되면 이곳에서 공간 활용 현황, 센서 데이터, 히트맵 등을 확인할 수 있습니다.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">프로젝트 현황</h2>
          {data.projects.map((project) => (
            <Card key={project.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{project.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        {project.location && <><MapPin className="w-3 h-3" />{project.location}</>}
                        {project.area && <span>· {project.area}</span>}
                      </CardDescription>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded ${
                    project.status === "completed" ? "bg-green-50 text-green-700" :
                    project.status === "analyzing" ? "bg-blue-50 text-blue-700" :
                    project.status === "collecting" ? "bg-amber-50 text-amber-700" :
                    "bg-gray-50 text-gray-700"
                  }`}>
                    {project.status === "completed" ? "완료" :
                     project.status === "analyzing" ? "분석 중" :
                     project.status === "collecting" ? "데이터 수집" : "설정 중"}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {/* Project Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-border">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">구역</p>
                    <p className="text-sm font-semibold">{project.zoneCount}개</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">센서</p>
                    <p className="text-sm font-semibold">{project.activeSensorCount}/{project.sensorCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">상태</p>
                    <p className="text-sm font-semibold text-green-600">정상</p>
                  </div>
                </div>

                {/* Latest Readings */}
                {project.latestReadings.length > 0 ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-3">최근 측정값</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {project.latestReadings.slice(0, 8).map((reading, idx) => {
                        const config = SENSOR_TYPE_CONFIG[reading.sensorType] || { icon: <Activity className="w-4 h-4" />, color: "#666", label: reading.sensorType };
                        return (
                          <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <span style={{ color: config.color }}>{config.icon}</span>
                              <span className="text-xs text-muted-foreground truncate">{reading.sensorName}</span>
                            </div>
                            <p className="text-lg font-bold">
                              {reading.value ?? "-"}
                              <span className="text-xs font-normal text-muted-foreground ml-1">{reading.unit}</span>
                            </p>
                            {reading.zone && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">{reading.zone}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">센서 데이터 수집 대기 중</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Estimates */}
      {data.recentEstimates.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">최근 견적 이력</h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 font-medium text-muted-foreground">공간유형</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">면적</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">등급</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">예상 견적</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">일자</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentEstimates.slice(0, 5).map((est) => (
                      <tr key={est.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="p-3">{est.spaceType || "-"}</td>
                        <td className="p-3">{est.area ? `${est.area}㎡` : "-"}</td>
                        <td className="p-3">{est.grade || "-"}</td>
                        <td className="p-3 text-right font-medium">
                          {est.totalMin && est.totalMax
                            ? `${(est.totalMin / 10000).toFixed(0)}~${(est.totalMax / 10000).toFixed(0)}만원`
                            : "-"}
                        </td>
                        <td className="p-3 text-right text-muted-foreground">
                          {est.createdAt ? new Date(est.createdAt).toLocaleDateString("ko-KR") : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Guide */}
      <Card className="mt-8 border-gold/20 bg-gradient-to-r from-gold/5 to-transparent">
        <CardContent className="py-6">
          <h3 className="font-semibold mb-3">공간 활용 분석 가이드</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-border shrink-0">
                <span className="text-xs font-bold text-gold">1</span>
              </div>
              <div>
                <p className="text-sm font-medium">센서 데이터 확인</p>
                <p className="text-xs text-muted-foreground">시간대별 온도/습도/CO₂ 추이를 차트로 확인하세요.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-border shrink-0">
                <span className="text-xs font-bold text-gold">2</span>
              </div>
              <div>
                <p className="text-sm font-medium">히트맵 분석</p>
                <p className="text-xs text-muted-foreground">구역별 사용 빈도를 색상으로 확인하세요.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-border shrink-0">
                <span className="text-xs font-bold text-gold">3</span>
              </div>
              <div>
                <p className="text-sm font-medium">AI 리포트</p>
                <p className="text-xs text-muted-foreground">AI가 분석한 공간 최적화 제안을 확인하세요.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Sensor Data Tab (Charts)
// ============================================================
function SensorDataTab() {
  const { client } = useClientAuth();
  const projectIds = client?.assignedProjectIds ?? [];
  const [selectedProject, setSelectedProject] = useState<number | null>(projectIds[0] ?? null);
  const [period, setPeriod] = useState<"1d" | "7d" | "30d">("7d");
  const [selectedSensorType, setSelectedSensorType] = useState<string>("all");

  const timeSeriesQuery = trpc.clientDashboard.sensorTimeSeries.useQuery(
    { projectId: selectedProject!, period },
    { enabled: !!selectedProject, staleTime: 60 * 1000, refetchInterval: 5 * 60 * 1000 }
  );

  useEffect(() => {
    if (projectIds.length > 0 && !selectedProject) {
      setSelectedProject(projectIds[0]);
    }
  }, [projectIds, selectedProject]);

  if (projectIds.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">센서 데이터</h1>
        <EmptyState message="할당된 프로젝트가 없어 센서 데이터를 표시할 수 없습니다." />
      </div>
    );
  }

  const filteredSeries = timeSeriesQuery.data?.series?.filter(
    s => selectedSensorType === "all" || s.sensorType === selectedSensorType
  ) ?? [];

  // Group sensors by type for chart rendering
  const sensorTypes = [...new Set(timeSeriesQuery.data?.series?.map(s => s.sensorType) ?? [])];

  // Format chart data for combined view
  const chartDataByType = useMemo(() => {
    const result: Record<string, any[]> = {};
    for (const series of filteredSeries) {
      const type = series.sensorType;
      if (!result[type]) result[type] = [];
      // Merge data points by time
      for (const point of series.data) {
        const timeKey = new Date(point.recordedAt).toISOString();
        let existing = result[type].find(d => d.time === timeKey);
        if (!existing) {
          existing = { time: timeKey, timestamp: new Date(point.recordedAt).getTime() };
          result[type].push(existing);
        }
        existing[series.sensorName] = point.value;
      }
    }
    // Sort each type by time
    for (const type of Object.keys(result)) {
      result[type].sort((a, b) => a.timestamp - b.timestamp);
    }
    return result;
  }, [filteredSeries]);

  const formatTime = (time: string) => {
    const d = new Date(time);
    if (period === "1d") return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">센서 데이터</h1>
          <p className="text-muted-foreground text-sm">시간대별 환경 데이터 추이를 확인하세요.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => timeSeriesQuery.refetch()}>
          <RefreshCw className={`w-3 h-3 mr-2 ${timeSeriesQuery.isFetching ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {projectIds.length > 1 && (
          <Select value={String(selectedProject)} onValueChange={(v) => setSelectedProject(Number(v))}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="프로젝트 선택" />
            </SelectTrigger>
            <SelectContent>
              {projectIds.map((pid: number) => (
                <SelectItem key={pid} value={String(pid)}>프로젝트 #{pid}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex bg-muted rounded-md p-0.5">
          {(["1d", "7d", "30d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                period === p ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "1d" ? "1일" : p === "7d" ? "7일" : "30일"}
            </button>
          ))}
        </div>

        <Select value={selectedSensorType} onValueChange={setSelectedSensorType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="센서 유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 센서</SelectItem>
            {sensorTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {SENSOR_TYPE_CONFIG[type]?.label || type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Charts */}
      {timeSeriesQuery.isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gold mr-2" />
          <span className="text-muted-foreground">센서 데이터를 불러오는 중...</span>
        </div>
      ) : filteredSeries.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Activity className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">센서 데이터가 없습니다</h3>
            <p className="text-sm text-muted-foreground">
              선택한 기간에 수집된 센서 데이터가 없습니다. 센서가 정상 작동 중인지 확인해주세요.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(chartDataByType).map(([type, data]) => {
            const config = SENSOR_TYPE_CONFIG[type] || { label: type, color: "#666" };
            const sensorNames = filteredSeries.filter(s => s.sensorType === type).map(s => s.sensorName);
            const unit = filteredSeries.find(s => s.sensorType === type)?.unit || "";

            return (
              <Card key={type}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <span style={{ color: config.color }}>{SENSOR_TYPE_CONFIG[type]?.icon}</span>
                    <CardTitle className="text-base">{config.label}</CardTitle>
                    <span className="text-xs text-muted-foreground">({unit})</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={data}>
                      <defs>
                        {sensorNames.map((name, i) => (
                          <linearGradient key={name} id={`gradient-${type}-${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis
                        dataKey="time"
                        tickFormatter={formatTime}
                        tick={{ fontSize: 11 }}
                        stroke="#999"
                      />
                      <YAxis tick={{ fontSize: 11 }} stroke="#999" />
                      <Tooltip
                        labelFormatter={(label) => new Date(label).toLocaleString("ko-KR")}
                        formatter={(value: number) => [`${value} ${unit}`, ""]}
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e5e5" }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      {sensorNames.map((name, i) => (
                        <Area
                          key={name}
                          type="monotone"
                          dataKey={name}
                          stroke={CHART_COLORS[i % CHART_COLORS.length]}
                          fill={`url(#gradient-${type}-${i})`}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Estimates Tab
// ============================================================
function EstimatesTab() {
  const dashboardQuery = trpc.clientDashboard.overview.useQuery(undefined, {
    retry: false,
    staleTime: 60 * 1000,
  });

  if (dashboardQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gold" />
      </div>
    );
  }

  const estimates = dashboardQuery.data?.recentEstimates ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">견적 이력</h1>
          <p className="text-muted-foreground text-sm">AI 예상 견적 기록을 확인하세요.</p>
        </div>
        <Link href="/estimator">
          <Button className="bg-gold hover:bg-gold-light text-ink">
            새 견적 받기
          </Button>
        </Link>
      </div>

      {estimates.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Receipt className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">견적 이력이 없습니다</h3>
            <p className="text-sm text-muted-foreground mb-4">
              AI 예상 견적 서비스를 이용해보세요.
            </p>
            <Link href="/estimator">
              <Button variant="outline">견적 받으러 가기</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {estimates.map((est) => (
            <Card key={est.id}>
              <CardContent className="py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-medium">{est.spaceType || "일반"} · {est.grade || "표준"}</h3>
                      <p className="text-sm text-muted-foreground">
                        {est.area ? `${est.area}㎡` : "-"} · {est.createdAt ? new Date(est.createdAt).toLocaleDateString("ko-KR") : "-"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      {est.totalMin && est.totalMax
                        ? `${(est.totalMin / 10000).toLocaleString()}~${(est.totalMax / 10000).toLocaleString()}만원`
                        : "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">예상 견적</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Heatmap Tab (Read-only view)
// ============================================================
function HeatmapTab() {
  const { client } = useClientAuth();
  const projectIds = client?.assignedProjectIds ?? [];

  if (projectIds.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">히트맵</h1>
        <EmptyState message="할당된 프로젝트가 없어 히트맵을 표시할 수 없습니다." />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">히트맵</h1>
      <p className="text-muted-foreground mb-6">구역별 사용 빈도를 색상으로 확인하세요. 빨간색일수록 사용 빈도가 높습니다.</p>

      <Card>
        <CardContent className="py-12 text-center">
          <Flame className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">히트맵 데이터 수집 중</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            재실센서 데이터가 충분히 수집되면 구역별 사용 빈도 히트맵이 이곳에 표시됩니다.
            일반적으로 1~2주 정도의 데이터가 필요합니다.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm">히트맵 범례</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">낮음</span>
            <div className="flex-1 h-4 rounded-full bg-gradient-to-r from-blue-400 via-yellow-400 to-red-500" />
            <span className="text-xs text-muted-foreground">높음</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Traffic Tab (Read-only view)
// ============================================================
function TrafficTab() {
  const { client } = useClientAuth();
  const projectIds = client?.assignedProjectIds ?? [];

  if (projectIds.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">동선 분석</h1>
        <EmptyState message="할당된 프로젝트가 없어 동선 분석을 표시할 수 없습니다." />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">동선 분석</h1>
      <p className="text-muted-foreground mb-6">구역 간 이동 패턴과 체류 시간을 분석합니다.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">이동 흐름도</CardTitle>
            <CardDescription>구역 간 이동 빈도를 화살표로 표시합니다</CardDescription>
          </CardHeader>
          <CardContent className="py-8 text-center">
            <Route className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">데이터 수집 중...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">체류 시간 분석</CardTitle>
            <CardDescription>구역별 평균 체류 시간</CardDescription>
          </CardHeader>
          <CardContent className="py-8 text-center">
            <Clock className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">데이터 수집 중...</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">주요 이동 경로 (Top 10)</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">충분한 데이터가 수집되면 주요 이동 경로가 표시됩니다.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Reports Tab
// ============================================================
function ReportsTab() {
  const { client } = useClientAuth();
  const projectIds = client?.assignedProjectIds ?? [];

  if (projectIds.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">리포트</h1>
        <EmptyState message="할당된 프로젝트가 없어 리포트를 생성할 수 없습니다." />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">공간 활용 리포트</h1>
      <p className="text-muted-foreground mb-6">AI가 분석한 공간 최적화 제안을 확인하세요.</p>

      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">리포트 준비 중</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            충분한 공간 활용 데이터가 수집되면 AI가 자동으로 공간 최적화 리포트를 생성합니다.
            리포트에는 비효율 구역 식별, 공간 재배치 제안, 에너지 절감 방안 등이 포함됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Projects Tab
// ============================================================
function ProjectsTab() {
  const dashboardQuery = trpc.clientDashboard.overview.useQuery(undefined, {
    retry: false,
    staleTime: 30 * 1000,
  });

  if (dashboardQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gold" />
      </div>
    );
  }

  const projects = dashboardQuery.data?.projects ?? [];

  if (projects.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">내 프로젝트</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">할당된 프로젝트가 없습니다</h3>
            <p className="text-sm text-muted-foreground">고감도 담당자에게 문의하세요.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">내 프로젝트</h1>
      <div className="grid gap-4">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-medium">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {project.location && <>{project.location} · </>}
                      {project.area && <>{project.area} · </>}
                      센서 {project.activeSensorCount}/{project.sensorCount} · 구역 {project.zoneCount}개
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded ${
                  project.status === "completed" ? "bg-green-50 text-green-700" :
                  project.status === "analyzing" ? "bg-blue-50 text-blue-700" :
                  project.status === "collecting" ? "bg-amber-50 text-amber-700" :
                  "bg-gray-50 text-gray-700"
                }`}>
                  {project.status === "completed" ? "완료" :
                   project.status === "analyzing" ? "분석 중" :
                   project.status === "collecting" ? "데이터 수집" : "설정 중"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Profile Tab
// ============================================================
function ProfileTab() {
  const { client, refetch } = useClientAuth();
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    company: "",
    phone: "",
  });
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    if (client) {
      setProfileForm({
        name: client.name || "",
        company: client.company || "",
        phone: client.phone || "",
      });
    }
  }, [client]);

  const updateProfileMutation = trpc.clientAuth.updateProfile.useMutation({
    onSuccess: () => {
      setProfileMsg("프로필이 업데이트되었습니다.");
      setEditing(false);
      refetch();
    },
    onError: (err) => setProfileMsg(err.message),
  });

  const changePwMutation = trpc.clientAuth.changePassword.useMutation({
    onSuccess: () => {
      setPwMsg("비밀번호가 변경되었습니다.");
      setPwError("");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (err) => {
      setPwError(err.message);
      setPwMsg("");
    },
  });

  const handleProfileSave = () => {
    updateProfileMutation.mutate({
      name: profileForm.name || undefined,
      company: profileForm.company || undefined,
      phone: profileForm.phone || undefined,
    });
  };

  const handlePwChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwMsg("");
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    changePwMutation.mutate({
      currentPassword: pwForm.currentPassword,
      newPassword: pwForm.newPassword,
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">내 정보</h1>

      <div className="space-y-6 max-w-lg">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">기본 정보</CardTitle>
              {!editing && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Settings className="w-3 h-3 mr-1" />
                  수정
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>이메일</Label>
              <Input value={client?.email || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>이름</Label>
              <Input
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                disabled={!editing}
                className={!editing ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>회사명</Label>
              <Input
                value={profileForm.company}
                onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                disabled={!editing}
                className={!editing ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>연락처</Label>
              <Input
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                disabled={!editing}
                className={!editing ? "bg-muted" : ""}
              />
            </div>

            {editing && (
              <div className="flex gap-2">
                <Button onClick={handleProfileSave} className="bg-gold hover:bg-gold-light text-ink" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? "저장 중..." : "저장"}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>취소</Button>
              </div>
            )}
            {profileMsg && <p className="text-sm text-green-600">{profileMsg}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">비밀번호 변경</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePwChange} className="space-y-4">
              <div className="space-y-2">
                <Label>현재 비밀번호</Label>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>새 비밀번호</Label>
                <Input
                  type="password"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  placeholder="8자 이상"
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label>새 비밀번호 확인</Label>
                <Input
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  required
                />
              </div>
              {pwError && <p className="text-sm text-red-600">{pwError}</p>}
              {pwMsg && <p className="text-sm text-green-600">{pwMsg}</p>}
              <Button type="submit" variant="outline" disabled={changePwMutation.isPending}>
                {changePwMutation.isPending ? "변경 중..." : "비밀번호 변경"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// Empty State Component
// ============================================================
function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function ClientSpaceDashboard() {
  const [, navigate] = useLocation();
  const { client, isLoading, isAuthenticated } = useClientAuth();
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">로그인이 필요합니다</h3>
            <p className="text-muted-foreground text-sm mb-6">
              공간 활용 대시보드를 이용하려면 고객 계정으로 로그인해 주세요.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate("/client/login")} className="bg-gold hover:bg-gold-light text-ink">
                로그인
              </Button>
              <Button variant="outline" onClick={() => navigate("/client/register")}>
                회원가입
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PortalLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "projects" && <ProjectsTab />}
      {activeTab === "sensors" && <SensorDataTab />}
      {activeTab === "estimates" && <EstimatesTab />}
      {activeTab === "heatmap" && <HeatmapTab />}
      {activeTab === "traffic" && <TrafficTab />}
      {activeTab === "reports" && <ReportsTab />}
      {activeTab === "profile" && <ProfileTab />}
    </PortalLayout>
  );
}
