import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  FileCheck, Search, ArrowLeft, Filter, Receipt,
  CheckCircle, XCircle, Clock, CreditCard, Banknote,
} from "lucide-react";
import { Loader2 } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "작성중", color: "bg-slate-100 text-slate-600", icon: Clock },
  submitted: { label: "상신됨", color: "bg-blue-100 text-blue-700", icon: Clock },
  in_review: { label: "결재중", color: "bg-amber-100 text-amber-700", icon: Clock },
  approved: { label: "승인", color: "bg-green-100 text-green-700", icon: CheckCircle },
  rejected: { label: "반려", color: "bg-red-100 text-red-700", icon: XCircle },
  paid: { label: "지급완료", color: "bg-emerald-100 text-emerald-700", icon: CreditCard },
};

const CATEGORY_LABELS: Record<string, string> = {
  material: "자재비", labor: "인건비", subcontract: "하도급비",
  equipment: "장비비", transportation: "운반비", utility: "공과금",
  office: "사무용품", meal: "식대", other: "기타",
};

function formatAmount(amount: string | number | null | undefined): string {
  if (!amount) return "-";
  return Number(amount).toLocaleString() + "원";
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default function OpsApproval() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");

  const expenses = trpc.ops.allExpenses.useQuery(undefined, { enabled: !!user });
  const projects = trpc.ops.project.list.useQuery(undefined, { enabled: !!user });

  const filtered = useMemo(() => {
    if (!expenses.data) return [];
    return expenses.data.filter((e: any) => {
      const matchSearch = !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.expenseNumber.toLowerCase().includes(search.toLowerCase()) ||
        (e.projectName && e.projectName.toLowerCase().includes(search.toLowerCase())) ||
        (e.authorName && e.authorName.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === "all" || e.status === statusFilter;
      const matchProject = projectFilter === "all" || String(e.projectId) === projectFilter;
      return matchSearch && matchStatus && matchProject;
    });
  }, [expenses.data, search, statusFilter, projectFilter]);

  // 통계
  const stats = useMemo(() => {
    if (!expenses.data) return { total: 0, pending: 0, approved: 0, totalAmount: 0 };
    const total = expenses.data.length;
    const pending = expenses.data.filter((e: any) => ["submitted", "in_review"].includes(e.status)).length;
    const approved = expenses.data.filter((e: any) => ["approved", "paid"].includes(e.status)).length;
    const totalAmount = expenses.data
      .filter((e: any) => ["approved", "paid"].includes(e.status))
      .reduce((sum: number, e: any) => sum + (Number(e.totalAmount) || 0), 0);
    return { total, pending, approved, totalAmount };
  }, [expenses.data]);

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
            <FileCheck className="w-6 h-6 text-primary" />
            결재 관리
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            전체 프로젝트의 지출결의서 및 결재 현황을 관리합니다.
          </p>
        </div>
      </div>

      <div className="container py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">전체 결의서</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">결재 대기</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              <p className="text-xs text-muted-foreground">승인/지급</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-lg font-bold text-primary">
                <Banknote className="w-4 h-4 inline mr-1" />
                {stats.totalAmount > 0 ? formatAmount(stats.totalAmount) : "-"}
              </p>
              <p className="text-xs text-muted-foreground">승인 총액</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="결의서 제목, 번호, 프로젝트, 작성자 검색..."
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
        {expenses.isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty */}
        {!expenses.isLoading && filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>등록된 지출결의서가 없습니다.</p>
          </div>
        )}

        {/* Expense List */}
        {filtered.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">결의번호</th>
                  <th className="text-left px-4 py-3 font-medium">제목</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">프로젝트</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">작성자</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">분류</th>
                  <th className="text-right px-4 py-3 font-medium">금액</th>
                  <th className="text-left px-4 py-3 font-medium">상태</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">일자</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e: any) => {
                  const st = STATUS_MAP[e.status] || STATUS_MAP.draft;
                  const StIcon = st.icon;
                  return (
                    <tr
                      key={e.id}
                      className="border-t hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/ops/project/${e.projectId}?tab=expenses`)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {e.expenseNumber}
                      </td>
                      <td className="px-4 py-3 font-medium max-w-[200px] truncate">
                        {e.title}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">
                        {e.projectCode && `[${e.projectCode}]`} {e.projectName || "-"}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                        {e.authorName || "-"}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge variant="outline" className="text-[10px]">
                          {CATEGORY_LABELS[e.category] || e.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatAmount(e.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${st.color} text-[10px] gap-1`}>
                          <StIcon className="w-3 h-3" />
                          {st.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                        {formatDate(e.createdAt)}
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
