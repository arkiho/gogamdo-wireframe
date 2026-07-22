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
  CheckCircle, XCircle, Clock, CreditCard, Banknote, GitBranch,
} from "lucide-react";
import { Loader2, Lock, FolderKanban, ArrowUpDown, CheckCircle2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

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

const TAB_STATUSES: Record<string, string[]> = {
  all: [],
  pending: ["draft", "submitted", "in_review", "rejected"], // 승인전(반려 포함)
  approved: ["approved"],
  paid: ["paid"],
};

export default function OpsApproval() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<string>("all"); // "all" | "internal" | projectId
  const [tab, setTab] = useState<string>("all");
  const [sort, setSort] = useState<"date" | "amount">("date");

  const expenses = trpc.ops.allExpenses.useQuery(undefined, { enabled: !!user });
  const projects = trpc.ops.project.list.useQuery(undefined, { enabled: !!user });
  const canInternal = user?.role === "admin" || user?.role === "master" || (user as any)?.department === "management";
  const isAdmin = user?.role === "admin" || user?.role === "master";

  const refetch = () => utils.ops.allExpenses.invalidate();
  const approveExpense = trpc.ops.expense.approve.useMutation({ onSuccess: () => { refetch(); toast.success("승인되었습니다."); }, onError: e => toast.error(e.message) });
  const rejectExpense = trpc.ops.expense.reject.useMutation({ onSuccess: () => { refetch(); toast.success("반려되었습니다."); }, onError: e => toast.error(e.message) });
  const markPaid = trpc.ops.expense.markPaid.useMutation({ onSuccess: () => { refetch(); toast.success("지급완료 처리되었습니다."); }, onError: e => toast.error(e.message) });
  const resubmit = trpc.ops.expense.resubmit.useMutation({ onSuccess: () => { refetch(); toast.success("재상신되었습니다."); }, onError: e => toast.error(e.message) });

  // 좌측 현장 리스트 (결의서가 있는 현장 + 내부 + 전체)
  const scopeList = useMemo(() => {
    const map = new Map<string, { key: string; label: string; code?: string; count: number }>();
    for (const e of expenses.data ?? []) {
      if (e.isInternal) continue;
      const key = String(e.projectId);
      const cur = map.get(key) ?? { key, label: e.projectName || `현장 #${e.projectId}`, code: e.projectCode ?? undefined, count: 0 };
      cur.count++;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [expenses.data]);

  const internalCount = useMemo(() => (expenses.data ?? []).filter((e: any) => e.isInternal).length, [expenses.data]);

  // 우측: scope + tab + 검색 + 정렬
  const filtered = useMemo(() => {
    let list = (expenses.data ?? []).filter((e: any) => {
      if (scope === "all") return true;
      if (scope === "internal") return !!e.isInternal;
      return String(e.projectId) === scope && !e.isInternal;
    });
    const allowed = TAB_STATUSES[tab] ?? [];
    if (allowed.length) list = list.filter((e: any) => allowed.includes(e.status));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e: any) =>
        e.title?.toLowerCase().includes(q) || e.expenseNumber?.toLowerCase().includes(q) ||
        e.projectName?.toLowerCase().includes(q) || e.authorName?.toLowerCase().includes(q));
    }
    list = [...list].sort((a: any, b: any) => sort === "amount"
      ? (Number(b.totalAmount) || 0) - (Number(a.totalAmount) || 0)
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }, [expenses.data, scope, tab, search, sort]);

  // 통계
  const stats = useMemo(() => {
    const data = expenses.data ?? [];
    const total = data.length;
    const pending = data.filter((e: any) => ["submitted", "in_review"].includes(e.status)).length;
    const approved = data.filter((e: any) => ["approved", "paid"].includes(e.status)).length;
    const totalAmount = data.filter((e: any) => ["approved", "paid"].includes(e.status)).reduce((s: number, e: any) => s + (Number(e.totalAmount) || 0), 0);
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
          <div className="flex items-center justify-between gap-3 mb-4">
            <Link href="/ops">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="w-4 h-4" /> 돌아가기
              </Button>
            </Link>
            <Link href="/ops/approval-lines">
              <Button variant="outline" size="sm" className="gap-1">
                <GitBranch className="w-4 h-4" /> 결재라인 관리
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

        {/* 마스터-디테일 */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-start">
          {/* 좌: 현장 리스트 */}
          <Card className="lg:sticky lg:top-4">
            <CardContent className="p-2 space-y-1 max-h-[70vh] overflow-y-auto">
              <button onClick={() => setScope("all")} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${scope === "all" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent/50"}`}>
                <span className="flex items-center gap-2"><FolderKanban className="w-4 h-4" />전체</span>
                <Badge variant="secondary" className="text-[10px]">{(expenses.data ?? []).filter((e:any)=>canInternal||!e.isInternal).length}</Badge>
              </button>
              {canInternal && (
                <button onClick={() => setScope("internal")} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${scope === "internal" ? "bg-amber-100 text-amber-800 font-medium" : "hover:bg-accent/50"}`}>
                  <span className="flex items-center gap-2"><Lock className="w-4 h-4" />고감도 내부</span>
                  <Badge variant="secondary" className="text-[10px]">{internalCount}</Badge>
                </button>
              )}
              <div className="h-px bg-border my-1" />
              {scopeList.map(s => (
                <button key={s.key} onClick={() => setScope(s.key)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${scope === s.key ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent/50"}`}>
                  <span className="min-w-0 truncate text-left">{s.code && <span className="font-mono text-[10px] text-muted-foreground mr-1">{s.code}</span>}{s.label}</span>
                  <Badge variant="secondary" className="text-[10px] flex-shrink-0">{s.count}</Badge>
                </button>
              ))}
              {scopeList.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">결의서가 있는 현장이 없습니다.</p>}
            </CardContent>
          </Card>

          {/* 우: 결의서 목록 */}
          <div className="space-y-3 min-w-0">
            {/* 분류 탭 + 정렬 + 검색 */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex gap-1 bg-muted rounded-lg p-1 flex-wrap">
                {[["all","전체"],["pending","승인전"],["approved","승인완료"],["paid","지급완료"]].map(([k,label]) => (
                  <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === k ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{label}</button>
                ))}
              </div>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => setSort(s => s === "date" ? "amount" : "date")}>
                <ArrowUpDown className="w-3.5 h-3.5 mr-1" />{sort === "date" ? "날짜순" : "금액순"}
              </Button>
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="제목·번호·작성자 검색" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
              </div>
            </div>

            {expenses.isLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground"><Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>해당 조건의 지출결의서가 없습니다.</p></div>
            ) : (
              <div className="space-y-2">
                {filtered.map((e: any) => {
                  const st = STATUS_MAP[e.status] || STATUS_MAP.draft;
                  const StIcon = st.icon;
                  const isPending = ["submitted", "in_review"].includes(e.status);
                  return (
                    <Card key={e.id}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/ops/project/${e.projectId}?tab=expenses`)}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium truncate">{e.title}</span>
                              <Badge className={`${st.color} text-[10px] gap-1`}><StIcon className="w-3 h-3" />{st.label}</Badge>
                              {e.isInternal ? <Badge className="bg-amber-100 text-amber-800 border-0 text-[10px]"><Lock className="w-3 h-3 mr-0.5" />내부</Badge> : null}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1 flex-wrap">
                              <span className="font-mono">{e.expenseNumber}</span>
                              {!e.isInternal && <span>{e.projectCode ? `[${e.projectCode}] ` : ""}{e.projectName}</span>}
                              <span>· {e.authorName || "-"}</span>
                              <span>· {formatDate(e.createdAt)}</span>
                            </div>
                            {e.status === "rejected" && e.rejectionReason && (
                              <p className="text-[11px] text-red-600 mt-1">반려사유: {e.rejectionReason}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-semibold">{formatAmount(e.totalAmount)}</p>
                          </div>
                        </div>
                        {/* 액션 */}
                        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t">
                          {isAdmin && isPending && (
                            <>
                              <Button size="sm" variant="outline" className="h-8 text-green-600 border-green-200" onClick={() => approveExpense.mutate({ id: e.id, comment: "" })}><CheckCircle className="w-3.5 h-3.5 mr-1" />승인</Button>
                              <Button size="sm" variant="outline" className="h-8 text-red-600 border-red-200" onClick={() => { const r = prompt("반려 사유를 입력하세요:"); if (r) rejectExpense.mutate({ id: e.id, comment: r }); }}><XCircle className="w-3.5 h-3.5 mr-1" />반려</Button>
                            </>
                          )}
                          {isAdmin && e.status === "approved" && (
                            <Button size="sm" variant="outline" className="h-8 text-emerald-600 border-emerald-200" onClick={() => markPaid.mutate({ id: e.id })}><CreditCard className="w-3.5 h-3.5 mr-1" />지급완료</Button>
                          )}
                          {e.status === "rejected" && (
                            <Button size="sm" variant="outline" className="h-8" onClick={() => { const c = prompt("보완 내용(선택):") ?? undefined; resubmit.mutate({ id: e.id, comment: c || undefined }); }}><RotateCcw className="w-3.5 h-3.5 mr-1" />보완 재상신</Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-8 ml-auto" onClick={() => navigate(`/ops/project/${e.projectId}?tab=expenses`)}>상세 →</Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
