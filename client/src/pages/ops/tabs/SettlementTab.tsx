import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";
import { Wallet, AlertTriangle, TrendingUp } from "lucide-react";

/**
 * 실행정산표 (STAFF_UI 6)
 * 공정별 실행예산 vs 실제집행(승인·지급된 지출결의서 합)을 대비.
 * approved/paid 결의서만 실집행에 반영.
 */
export default function SettlementTab({ projectId }: { projectId: string }) {
  const pid = Number(projectId);
  const project = trpc.ops.project.get.useQuery({ id: pid });
  const schedule = trpc.ops.schedule.list.useQuery({ projectId: pid });
  const expenses = trpc.ops.expense.list.useQuery({ projectId: pid });

  const { rows, untagged, totalBudget, totalActual, contractAmount } = useMemo(() => {
    const items = schedule.data ?? [];
    const exps = (expenses.data ?? []).filter((e: any) => e.status === "approved" || e.status === "paid");

    // 공정별 실집행 합
    const actualByItem = new Map<number, number>();
    let untaggedActual = 0;
    for (const e of exps) {
      const amt = Number(e.totalAmount ?? 0);
      const sid = (e as any).scheduleItemId;
      if (sid) actualByItem.set(sid, (actualByItem.get(sid) ?? 0) + amt);
      else untaggedActual += amt;
    }

    const rows = items.map((it: any) => {
      const budget = Number(it.budgetAmount ?? 0);
      const actual = actualByItem.get(it.id) ?? 0;
      const rate = budget > 0 ? Math.round((actual / budget) * 100) : (actual > 0 ? Infinity : 0);
      return { id: it.id, name: it.name, category: it.category, budget, actual, remain: budget - actual, rate };
    });

    const totalBudget = rows.reduce((s: number, r: any) => s + r.budget, 0);
    const totalActual = rows.reduce((s: number, r: any) => s + r.actual, 0) + untaggedActual;
    const contractAmount = Number(project.data?.contractAmount ?? 0);
    return { rows, untagged: untaggedActual, totalBudget, totalActual, contractAmount };
  }, [schedule.data, expenses.data, project.data]);

  const executionRate = contractAmount > 0 ? Math.round((totalActual / contractAmount) * 100) : 0;

  const fmt = (n: number) => n.toLocaleString() + "원";
  const rateLabel = (rate: number) => rate === Infinity ? "예산없음" : `${rate}%`;

  return (
    <div className="space-y-4">
      {/* 요약 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <Card><CardContent className="pt-4 pb-3 text-center">
          <p className="text-[10px] sm:text-xs text-muted-foreground">계약금액</p>
          <p className="text-sm sm:text-base font-bold">{contractAmount ? fmt(contractAmount) : "-"}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 text-center">
          <p className="text-[10px] sm:text-xs text-muted-foreground">총 실행예산</p>
          <p className="text-sm sm:text-base font-bold">{fmt(totalBudget)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 text-center">
          <p className="text-[10px] sm:text-xs text-muted-foreground">총 실집행</p>
          <p className="text-sm sm:text-base font-bold text-amber-600">{fmt(totalActual)}</p>
        </CardContent></Card>
        <Card className={executionRate > 100 ? "border-red-300" : ""}><CardContent className="pt-4 pb-3 text-center">
          <p className="text-[10px] sm:text-xs text-muted-foreground">계약 대비 실행률</p>
          <p className={`text-sm sm:text-base font-bold ${executionRate > 100 ? "text-red-600" : "text-emerald-600"}`}>{contractAmount ? executionRate + "%" : "-"}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2"><Wallet className="w-5 h-5" />공정별 실행정산</CardTitle>
          <p className="text-xs text-muted-foreground">승인·지급된 지출결의서만 실집행에 반영됩니다. 결의서 작성 시 공정을 태깅하세요.</p>
        </CardHeader>
        <CardContent>
          {schedule.isLoading || expenses.isLoading ? (
            <p className="text-center text-muted-foreground py-8">로딩 중...</p>
          ) : rows.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <TrendingUp className="w-10 h-10 mx-auto opacity-30 mb-2" />
              공정표에 공정을 먼저 등록하고 실행예산을 입력하세요.
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">공정</th>
                    <th className="px-3 py-2 text-right font-medium">실행예산</th>
                    <th className="px-3 py-2 text-right font-medium">실집행</th>
                    <th className="px-3 py-2 text-right font-medium">잔액</th>
                    <th className="px-3 py-2 text-right font-medium w-24">집행률</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: any) => {
                    const over = r.rate === Infinity || r.rate > 100;
                    return (
                      <tr key={r.id} className={`border-t ${over ? "bg-red-50" : ""}`}>
                        <td className="px-3 py-2">
                          <span className="font-medium">{r.name}</span>
                          {r.category && <Badge variant="outline" className="ml-1.5 text-[10px]">{r.category}</Badge>}
                        </td>
                        <td className="px-3 py-2 text-right">{r.budget ? r.budget.toLocaleString() : "-"}</td>
                        <td className="px-3 py-2 text-right">{r.actual.toLocaleString()}</td>
                        <td className={`px-3 py-2 text-right ${r.remain < 0 ? "text-red-600 font-semibold" : ""}`}>{r.remain.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right">
                          <span className={`font-semibold ${over ? "text-red-600" : r.rate >= 80 ? "text-amber-600" : "text-emerald-600"}`}>
                            {over && <AlertTriangle className="w-3 h-3 inline mr-0.5" />}{rateLabel(r.rate)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {untagged > 0 && (
                    <tr className="border-t bg-muted/30 text-muted-foreground">
                      <td className="px-3 py-2 italic">공정 미태깅</td>
                      <td className="px-3 py-2 text-right">-</td>
                      <td className="px-3 py-2 text-right">{untagged.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">-</td>
                      <td className="px-3 py-2 text-right">-</td>
                    </tr>
                  )}
                  <tr className="border-t bg-muted font-bold">
                    <td className="px-3 py-2">합계</td>
                    <td className="px-3 py-2 text-right">{totalBudget.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{totalActual.toLocaleString()}</td>
                    <td className={`px-3 py-2 text-right ${totalBudget - totalActual < 0 ? "text-red-600" : ""}`}>{(totalBudget - totalActual).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) + "%" : "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
