/**
 * 결제 · 경비 현황 (회사 전체) — C-7
 * 목업: _mockups/gogamdo-finance-pipeline.html (섹션 1)
 * 프로젝트별 계약금/기성/잔금 수금·미수금, 월매출 추이, 공종별 경비.
 */
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Banknote, TrendingUp, Wallet, AlertCircle, Plus, X, Pencil } from "lucide-react";
import { toast } from "sonner";

type BillKind = "contract" | "progress" | "balance";
type BillStatus = "scheduled" | "billed" | "paid";
interface Bill { kind: BillKind; label?: string; amount: number; dueDate?: string; status: BillStatus; paidDate?: string }

const KIND_LABEL: Record<BillKind, string> = { contract: "계약금", progress: "기성", balance: "잔금" };
const STATUS_META: Record<BillStatus, { label: string; cls: string }> = {
  scheduled: { label: "예정", cls: "bg-muted text-muted-foreground" },
  billed: { label: "청구", cls: "bg-amber-100 text-amber-700" },
  paid: { label: "수금", cls: "bg-green-100 text-green-700" },
};
const CAT_LABEL: Record<string, string> = {
  material: "자재비", labor: "인건비", subcontract: "하도급비", equipment: "장비비",
  transportation: "운반비", utility: "공과금", office: "사무용품", meal: "식대", other: "기타",
};
const CAT_COLOR = ["bg-blue-500", "bg-gold", "bg-teal-500", "bg-purple-500", "bg-amber-500", "bg-rose-500", "bg-slate-500", "bg-cyan-500", "bg-gray-400"];
const ACTIVE = ["planning", "designing", "permit", "construction", "inspection"];

function eok(n: number) { return (n / 100000000).toFixed(n >= 100000000 ? 2 : 1); }
function man(n: number) { return Math.round(n / 10000).toLocaleString(); }
function ym(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }

export default function AdminFinance() {
  const projectsQ = trpc.ops.project.list.useQuery();
  const expensesQ = trpc.ops.allExpenses.useQuery();
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState<any | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);

  const updateProject = trpc.ops.project.update.useMutation({
    onSuccess: () => { utils.ops.project.list.invalidate(); setEditing(null); toast.success("수금 일정이 저장되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const now = new Date();
  const thisYM = ym(now);

  const data = useMemo(() => {
    const projects = projectsQ.data ?? [];
    const expenses = expensesQ.data ?? [];
    const active = projects.filter((p: any) => ACTIVE.includes(p.status));

    // 프로젝트별 수금
    const rows = active.map((p: any) => {
      const contract = Number(p.contractAmount ?? 0);
      const sched: Bill[] = Array.isArray(p.billingSchedule) ? p.billingSchedule : [];
      const paid = sched.filter((b) => b.status === "paid").reduce((s, b) => s + Number(b.amount || 0), 0);
      const receivable = Math.max(0, contract - paid);
      const rate = contract > 0 ? Math.round((paid / contract) * 100) : 0;
      const chip = (kind: BillKind) => {
        const b = sched.find((x) => x.kind === kind);
        return b ? b.status : null;
      };
      return { id: p.id, name: p.name, code: p.code, contract, paid, receivable, rate, sched,
        contractChip: chip("contract"), progressChip: chip("progress"), balanceChip: chip("balance") };
    });

    const totalContract = active.reduce((s: number, p: any) => s + Number(p.contractAmount ?? 0), 0);
    const totalPaid = rows.reduce((s, r) => s + r.paid, 0);
    const totalReceivable = rows.reduce((s, r) => s + r.receivable, 0);

    // 이번달 수금 (paid & paidDate this month)
    let monthPaid = 0;
    const monthlyPaid: Record<string, number> = {};
    for (const p of projects) {
      const sched: Bill[] = Array.isArray(p.billingSchedule) ? p.billingSchedule : [];
      for (const b of sched) {
        if (b.status === "paid" && b.paidDate) {
          const key = b.paidDate.slice(0, 7);
          monthlyPaid[key] = (monthlyPaid[key] ?? 0) + Number(b.amount || 0);
          if (key === thisYM) monthPaid += Number(b.amount || 0);
        }
      }
    }
    // 최근 6개월
    const months: { label: string; key: string; val: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = ym(d);
      months.push({ label: `${d.getMonth() + 1}월`, key, val: monthlyPaid[key] ?? 0 });
    }
    const maxMonth = Math.max(...months.map((m) => m.val), 1);

    // 이번달 경비 (승인·지급, createdAt this month)
    const approvedExp = expenses.filter((e: any) => (e.status === "approved" || e.status === "paid"));
    let monthExpense = 0;
    const byCat: Record<string, number> = {};
    for (const e of approvedExp) {
      const created = e.createdAt ? new Date(e.createdAt) : null;
      if (created && ym(created) === thisYM) {
        const amt = Number(e.totalAmount ?? 0);
        monthExpense += amt;
        byCat[e.category] = (byCat[e.category] ?? 0) + amt;
      }
    }
    const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const maxCat = Math.max(...cats.map(([, v]) => v), 1);

    return { rows, totalContract, totalPaid, totalReceivable, monthPaid, months, maxMonth, monthExpense, cats, maxCat, activeCount: active.length };
  }, [projectsQ.data, expensesQ.data, thisYM]);

  const openEdit = (p: any) => {
    setEditing(p);
    setBills(Array.isArray(p.billingSchedule) && p.billingSchedule.length ? p.billingSchedule : [
      { kind: "contract", amount: 0, status: "scheduled" },
      { kind: "progress", amount: 0, status: "scheduled" },
      { kind: "balance", amount: 0, status: "scheduled" },
    ]);
  };
  const saveBills = () => {
    if (!editing) return;
    updateProject.mutate({ id: editing.id, billingSchedule: bills.map((b) => ({ ...b, amount: Number(b.amount) || 0 })) });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
      <div>
        <h1 className="text-xl font-bold">결제 · 경비 현황</h1>
        <p className="text-sm text-muted-foreground mt-1">프로젝트별 수금 · 미수금 · 월매출 · 경비 (경영지원 · 대표자)</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />이번달 수금</p>
          <p className="text-2xl font-bold mt-1">{eok(data.monthPaid)}<span className="text-sm text-muted-foreground">억</span></p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />미수금 총액</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">{eok(data.totalReceivable)}<span className="text-sm text-muted-foreground">억</span></p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Banknote className="w-3.5 h-3.5" />진행 계약금액</p>
          <p className="text-2xl font-bold mt-1">{eok(data.totalContract)}<span className="text-sm text-muted-foreground">억</span></p>
          <p className="text-[10px] text-muted-foreground mt-1">진행중 {data.activeCount}개 현장</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Wallet className="w-3.5 h-3.5" />이번달 경비 집행</p>
          <p className="text-2xl font-bold mt-1">{eok(data.monthExpense)}<span className="text-sm text-muted-foreground">억</span></p>
          <p className="text-[10px] text-muted-foreground mt-1">승인 결의서 기준</p>
        </CardContent></Card>
      </div>

      {/* 수금 현황 table */}
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm flex items-center justify-between">프로젝트별 수금 현황 <span className="text-[11px] font-normal text-muted-foreground">계약금 · 기성 · 잔금</span></CardTitle></CardHeader>
        <CardContent className="p-0">
          {data.rows.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">진행 중인 프로젝트가 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-3 py-2">프로젝트</th>
                    <th className="text-right font-medium px-3">계약금액</th>
                    <th className="text-center font-medium px-2">계약금</th>
                    <th className="text-center font-medium px-2">기성</th>
                    <th className="text-center font-medium px-2">잔금</th>
                    <th className="text-right font-medium px-3">수금액</th>
                    <th className="text-right font-medium px-3">미수금</th>
                    <th className="text-left font-medium px-3 w-24">수금률</th>
                    <th className="px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r.id} className="border-t hover:bg-accent/30">
                      <td className="px-3 py-2"><div className="font-medium">{r.name}</div><div className="text-[10px] text-muted-foreground font-mono">{r.code}</div></td>
                      <td className="px-3 text-right tabular-nums">{r.contract.toLocaleString()}</td>
                      {[r.contractChip, r.progressChip, r.balanceChip].map((c, i) => (
                        <td key={i} className="px-2 text-center">{c ? <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${STATUS_META[c].cls}`}>{STATUS_META[c].label}</span> : <span className="text-muted-foreground/40">-</span>}</td>
                      ))}
                      <td className="px-3 text-right tabular-nums font-medium">{r.paid.toLocaleString()}</td>
                      <td className="px-3 text-right tabular-nums text-amber-700">{r.receivable.toLocaleString()}</td>
                      <td className="px-3"><div className="flex items-center gap-1.5"><div className="h-1.5 bg-muted rounded overflow-hidden flex-1 min-w-[40px]"><div className={`h-full ${r.rate >= 80 ? "bg-green-500" : r.rate >= 50 ? "bg-blue-500" : "bg-amber-500"}`} style={{ width: `${r.rate}%` }} /></div><span className="text-[10px] text-muted-foreground w-7">{r.rate}%</span></div></td>
                      <td className="px-2 text-right"><Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(r)}><Pencil className="w-3.5 h-3.5" /></Button></td>
                    </tr>
                  ))}
                  <tr className="border-t-2 font-bold bg-muted/40">
                    <td className="px-3 py-2">합계 (진행 {data.activeCount})</td>
                    <td className="px-3 text-right tabular-nums">{data.totalContract.toLocaleString()}</td>
                    <td colSpan={3} className="text-center text-muted-foreground font-medium text-[10px]">회차별 수금 상태 →</td>
                    <td className="px-3 text-right tabular-nums">{data.totalPaid.toLocaleString()}</td>
                    <td className="px-3 text-right tabular-nums text-amber-700">{data.totalReceivable.toLocaleString()}</td>
                    <td className="px-3 text-[10px] text-muted-foreground">{data.totalContract > 0 ? Math.round((data.totalPaid / data.totalContract) * 100) : 0}%</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        {/* 월별 매출 추이 */}
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm flex items-center justify-between">월별 매출 추이 <span className="text-[11px] font-normal text-muted-foreground">최근 6개월 (수금 기준)</span></CardTitle></CardHeader>
          <CardContent>
            {data.months.every((m) => m.val === 0) ? (
              <p className="text-center text-sm text-muted-foreground py-10">수금 데이터가 없습니다. 수금 일정에서 '수금' 상태와 수금일을 입력하세요.</p>
            ) : (
              <div className="flex items-end gap-3 h-40 pt-2">
                {data.months.map((m) => (
                  <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 justify-end h-full">
                    <span className="text-[10px] font-bold">{m.val > 0 ? eok(m.val) + "억" : ""}</span>
                    <div className="w-3/5 rounded-t bg-gradient-to-b from-gold-light to-gold" style={{ height: `${Math.max((m.val / data.maxMonth) * 100, 2)}%` }} />
                    <span className="text-[10px] text-muted-foreground">{m.label}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 공종별 경비 */}
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">이번달 경비 (공종별)</CardTitle></CardHeader>
          <CardContent>
            {data.cats.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">이번달 승인 경비가 없습니다.</p>
            ) : (
              <div className="space-y-1">
                {data.cats.map(([cat, val], i) => (
                  <div key={cat} className="flex items-center gap-3 py-1.5 border-b last:border-0 text-xs">
                    <div className="flex-1">
                      <div>{CAT_LABEL[cat] ?? cat}</div>
                      <div className="h-2 bg-muted rounded mt-1 overflow-hidden"><div className={`h-full ${CAT_COLOR[i % CAT_COLOR.length]}`} style={{ width: `${(val / data.maxCat) * 100}%` }} /></div>
                    </div>
                    <span className="font-bold tabular-nums">{man(val)}만</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 수금 일정 편집 다이얼로그 */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.name} — 수금 일정</DialogTitle></DialogHeader>
          <div className="space-y-2 mt-2">
            {bills.map((b, i) => (
              <div key={i} className="grid grid-cols-[80px_1fr_100px_90px_auto] gap-1.5 items-center">
                <Select value={b.kind} onValueChange={(v) => setBills((prev) => prev.map((x, idx) => idx === i ? { ...x, kind: v as BillKind } : x))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="contract">계약금</SelectItem><SelectItem value="progress">기성</SelectItem><SelectItem value="balance">잔금</SelectItem></SelectContent>
                </Select>
                <Input type="number" placeholder="금액" value={b.amount || ""} onChange={(e) => setBills((prev) => prev.map((x, idx) => idx === i ? { ...x, amount: Number(e.target.value) } : x))} className="h-9 text-right" />
                <Select value={b.status} onValueChange={(v) => setBills((prev) => prev.map((x, idx) => idx === i ? { ...x, status: v as BillStatus } : x))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="scheduled">예정</SelectItem><SelectItem value="billed">청구</SelectItem><SelectItem value="paid">수금</SelectItem></SelectContent>
                </Select>
                <Input type="date" value={b.paidDate ?? ""} onChange={(e) => setBills((prev) => prev.map((x, idx) => idx === i ? { ...x, paidDate: e.target.value } : x))} className="h-9 text-[11px]" title="수금일" />
                <Button size="sm" variant="ghost" className="h-9 w-9 p-0" onClick={() => setBills((prev) => prev.filter((_, idx) => idx !== i))}><X className="w-4 h-4" /></Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => setBills((prev) => [...prev, { kind: "progress", amount: 0, status: "scheduled" }])}><Plus className="w-3 h-3 mr-1" />회차 추가</Button>
          </div>
          <DialogFooter className="mt-3">
            <Button className="w-full" onClick={saveBills} disabled={updateProject.isPending}>{updateProject.isPending ? "저장 중..." : "저장"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
