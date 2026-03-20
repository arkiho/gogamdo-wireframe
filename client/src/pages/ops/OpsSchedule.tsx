import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  ClipboardList, Search, ArrowLeft, Filter, Calendar,
  CheckCircle2, Clock, AlertTriangle, Pause, PlayCircle,
} from "lucide-react";
import { Loader2 } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  not_started: { label: "미착수", color: "bg-slate-100 text-slate-600", icon: Clock },
  in_progress: { label: "진행중", color: "bg-blue-100 text-blue-700", icon: PlayCircle },
  delayed: { label: "지연", color: "bg-red-100 text-red-700", icon: AlertTriangle },
  completed: { label: "완료", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  on_hold: { label: "보류", color: "bg-amber-100 text-amber-700", icon: Pause },
};

const CATEGORY_LABELS: Record<string, string> = {
  demolition: "철거", framing: "골조", electrical: "전기",
  plumbing: "설비", hvac: "공조", flooring: "바닥",
  ceiling: "천장", painting: "도장", furniture: "가구",
  it_network: "IT/네트워크", fire_safety: "소방", cleaning: "클리닝", other: "기타",
};

export default function OpsSchedule() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");

  const schedules = trpc.ops.allSchedules.useQuery(undefined, { enabled: !!user });
  const projects = trpc.ops.project.list.useQuery(undefined, { enabled: !!user });

  const filtered = useMemo(() => {
    if (!schedules.data) return [];
    return schedules.data.filter((s: any) => {
      const matchSearch = !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.projectName && s.projectName.toLowerCase().includes(search.toLowerCase())) ||
        (s.assignedTo && s.assignedTo.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      const matchProject = projectFilter === "all" || String(s.projectId) === projectFilter;
      return matchSearch && matchStatus && matchProject;
    });
  }, [schedules.data, search, statusFilter, projectFilter]);

  // 통계
  const stats = useMemo(() => {
    if (!schedules.data) return { total: 0, completed: 0, delayed: 0, avgProgress: 0 };
    const total = schedules.data.length;
    const completed = schedules.data.filter((s: any) => s.status === "completed").length;
    const delayed = schedules.data.filter((s: any) => s.status === "delayed").length;
    const avgProgress = total > 0
      ? Math.round(schedules.data.reduce((sum: number, s: any) => sum + (s.progress ?? 0), 0) / total)
      : 0;
    return { total, completed, delayed, avgProgress };
  }, [schedules.data]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    navigate("/ops");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/ops">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="w-4 h-4" /> 돌아가기
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            공정관리
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            전체 프로젝트의 공정 현황을 한눈에 확인합니다.
          </p>
        </div>
      </div>

      <div className="container py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">전체 공정</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">완료</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{stats.delayed}</p>
              <p className="text-xs text-muted-foreground">지연</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.avgProgress}%</p>
              <p className="text-xs text-muted-foreground">평균 진행률</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="공정명, 프로젝트, 담당자 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-36">
              <Filter className="w-4 h-4 mr-1" />
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              {Object.entries(STATUS_MAP).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="프로젝트" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 프로젝트</SelectItem>
              {projects.data?.map((p: any) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading */}
        {schedules.isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty */}
        {!schedules.isLoading && filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>등록된 공정이 없습니다.</p>
          </div>
        )}

        {/* Schedule List */}
        {filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((s: any) => {
              const st = STATUS_MAP[s.status] || STATUS_MAP.not_started;
              const StIcon = st.icon;
              return (
                <Card key={s.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Left: Status + Info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg ${st.color}`}>
                          <StIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium truncate">{s.name}</h3>
                            {s.category && (
                              <Badge variant="outline" className="text-[10px]">
                                {CATEGORY_LABELS[s.category] || s.category}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                            <Link href={`/ops/project/${s.projectId}`}>
                              <span className="hover:text-primary cursor-pointer">
                                {s.projectCode && `[${s.projectCode}]`} {s.projectName || "프로젝트"}
                              </span>
                            </Link>
                            {s.assignedTo && (
                              <span className="flex items-center gap-1">
                                담당: {s.assignedTo}
                              </span>
                            )}
                            {(s.startDate || s.endDate) && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {s.startDate ?? "?"} ~ {s.endDate ?? "?"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Right: Progress */}
                      <div className="flex items-center gap-3 sm:w-48">
                        <Progress value={s.progress ?? 0} className="h-2 flex-1" />
                        <span className="text-sm font-medium w-10 text-right">
                          {s.progress ?? 0}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
