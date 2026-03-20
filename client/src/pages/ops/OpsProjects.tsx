import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  FolderOpen, Search, ArrowLeft, Building2, MapPin, Calendar,
  TrendingUp, Filter, LayoutGrid, List,
} from "lucide-react";
import { Loader2 } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  planning: { label: "기획", color: "bg-slate-100 text-slate-700" },
  designing: { label: "설계", color: "bg-blue-100 text-blue-700" },
  permit: { label: "인허가", color: "bg-purple-100 text-purple-700" },
  construction: { label: "시공중", color: "bg-amber-100 text-amber-700" },
  inspection: { label: "검수", color: "bg-cyan-100 text-cyan-700" },
  completed: { label: "완료", color: "bg-green-100 text-green-700" },
  warranty: { label: "하자보수", color: "bg-orange-100 text-orange-700" },
  closed: { label: "종료", color: "bg-gray-100 text-gray-500" },
};

export default function OpsProjects() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const projects = trpc.ops.project.list.useQuery(undefined, { enabled: !!user });

  const filtered = useMemo(() => {
    if (!projects.data) return [];
    return projects.data.filter((p: any) => {
      const matchSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.clientName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [projects.data, search, statusFilter]);

  const statusCounts = useMemo(() => {
    if (!projects.data) return {};
    const counts: Record<string, number> = {};
    projects.data.forEach((p: any) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return counts;
  }, [projects.data]);

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FolderOpen className="w-6 h-6 text-primary" />
                프로젝트 관리
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                전체 {projects.data?.length ?? 0}개 프로젝트
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        {/* Status Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
          {Object.entries(STATUS_MAP).map(([key, { label, color }]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                statusFilter === key
                  ? "ring-2 ring-primary border-primary"
                  : "border-border hover:border-primary/50"
              } ${color}`}
            >
              {label} ({statusCounts[key] || 0})
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="프로젝트명, 코드, 고객사 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="w-4 h-4 mr-1" />
              <SelectValue placeholder="상태 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {Object.entries(STATUS_MAP).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading */}
        {projects.isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty */}
        {!projects.isLoading && filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>프로젝트가 없습니다.</p>
          </div>
        )}

        {/* Grid View */}
        {viewMode === "grid" && filtered.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p: any) => {
              const st = STATUS_MAP[p.status] || STATUS_MAP.planning;
              return (
                <Link key={p.id} href={`/ops/project/${p.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground font-mono">{p.code}</p>
                          <CardTitle className="text-base mt-1 truncate">{p.name}</CardTitle>
                        </div>
                        <Badge className={`${st.color} text-[10px] shrink-0 ml-2`}>{st.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5" />
                        <span className="truncate">{p.clientName}</span>
                      </div>
                      {p.siteAddress && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="truncate">{p.siteAddress}</span>
                        </div>
                      )}
                      {(p.startDate || p.endDate) && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{p.startDate ?? "미정"} ~ {p.endDate ?? "미정"}</span>
                        </div>
                      )}
                      {p.totalArea && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>{Number(p.totalArea).toLocaleString()}㎡</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && filtered.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">코드</th>
                  <th className="text-left px-4 py-3 font-medium">프로젝트명</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">고객사</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">면적</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">기간</th>
                  <th className="text-left px-4 py-3 font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: any) => {
                  const st = STATUS_MAP[p.status] || STATUS_MAP.planning;
                  return (
                    <tr
                      key={p.id}
                      className="border-t hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/ops/project/${p.id}`)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.code}</td>
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{p.clientName}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                        {p.totalArea ? `${Number(p.totalArea).toLocaleString()}㎡` : "-"}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                        {p.startDate ?? "-"} ~ {p.endDate ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${st.color} text-[10px]`}>{st.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
