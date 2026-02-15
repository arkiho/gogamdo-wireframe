import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Plus, Calculator } from "lucide-react";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<string, string> = {
  material: "자재비", labor: "인건비", equipment: "장비비",
  subcontract: "외주비", overhead: "경비", design: "설계비",
  permit: "인허가비", other: "기타",
};

export default function CostTab({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    category: "material", itemName: "", budgetAmount: "",
    actualAmount: "0", description: "",
  });

  const costs = trpc.ops.cost.list.useQuery({ projectId });
  const createCost = trpc.ops.cost.create.useMutation({
    onSuccess: () => {
      costs.refetch();
      setOpen(false);
      setForm({ category: "material", itemName: "", budgetAmount: "", actualAmount: "0", description: "" });
      toast.success("원가 항목이 등록되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateActual = trpc.ops.cost.update.useMutation({
    onSuccess: () => {
      costs.refetch();
      toast.success("실행금액이 업데이트되었습니다.");
    },
  });

  const handleCreate = () => {
    if (!form.itemName || !form.budgetAmount) {
      toast.error("항목명과 예산금액은 필수입니다.");
      return;
    }
    createCost.mutate({
      projectId,
      category: form.category,
      itemName: form.itemName,
      budgetAmount: form.budgetAmount,
      actualAmount: form.actualAmount || "0",
      description: form.description || undefined,
    });
  };

  const totalBudget = costs.data?.reduce((sum, c) => sum + Number(c.budgetAmount), 0) ?? 0;
  const totalActual = costs.data?.reduce((sum, c) => sum + Number(c.actualAmount), 0) ?? 0;
  const diff = totalBudget - totalActual;

  const grouped = costs.data?.reduce((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(c);
    return acc;
  }, {} as Record<string, typeof costs.data>) ?? {};

  return (
    <div className="space-y-4">
      {/* Summary - 모바일에서 세로 스택 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <Card>
          <CardContent className="pt-3 pb-2 sm:pt-4 sm:pb-3 text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground">총 예산</p>
            <p className="text-base sm:text-lg font-bold">{totalBudget.toLocaleString()}원</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2 sm:pt-4 sm:pb-3 text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground">실행금액</p>
            <p className="text-base sm:text-lg font-bold">{totalActual.toLocaleString()}원</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2 sm:pt-4 sm:pb-3 text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground">잔액</p>
            <p className={`text-base sm:text-lg font-bold ${diff >= 0 ? "text-green-600" : "text-red-600"}`}>
              {diff >= 0 ? "+" : ""}{diff.toLocaleString()}원
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget vs Actual Bar */}
      {totalBudget > 0 && (
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>예산 대비 실행률</span>
              <span>{((totalActual / totalBudget) * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${totalActual / totalBudget > 1 ? "bg-red-500" : totalActual / totalBudget > 0.8 ? "bg-amber-500" : "bg-green-500"}`}
                style={{ width: `${Math.min((totalActual / totalBudget) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5" />원가관리
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-1" />항목 추가</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>원가 항목 추가</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div>
                  <Label>구분</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger className="h-11 sm:h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>항목명 *</Label>
                  <Input value={form.itemName} onChange={e => setForm(f => ({ ...f, itemName: e.target.value }))} placeholder="예: 바닥재 (타일)" className="h-11 sm:h-9" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>예산금액 (원) *</Label>
                    <Input value={form.budgetAmount} onChange={e => setForm(f => ({ ...f, budgetAmount: e.target.value }))} placeholder="5000000" className="h-11 sm:h-9" />
                  </div>
                  <div>
                    <Label>실행금액 (원)</Label>
                    <Input value={form.actualAmount} onChange={e => setForm(f => ({ ...f, actualAmount: e.target.value }))} placeholder="0" className="h-11 sm:h-9" />
                  </div>
                </div>
                <Button onClick={handleCreate} className="w-full h-12 sm:h-9 text-base sm:text-sm" disabled={createCost.isPending}>
                  {createCost.isPending ? "추가 중..." : "항목 추가"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {costs.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : !costs.data?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calculator className="w-10 h-10 mx-auto opacity-30 mb-2" />
              원가 항목이 없습니다.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([cat, items]) => {
                const catBudget = items!.reduce((s, i) => s + Number(i.budgetAmount), 0);
                const catActual = items!.reduce((s, i) => s + Number(i.actualAmount), 0);
                return (
                  <div key={cat}>
                    {/* 카테고리 헤더 - 모바일 반응형 */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-2">
                      <h4 className="font-semibold text-sm">{CATEGORY_LABELS[cat] ?? cat}</h4>
                      <div className="flex flex-wrap gap-2 sm:gap-4 text-[10px] sm:text-xs">
                        <span>예산: {catBudget.toLocaleString()}원</span>
                        <span>실행: {catActual.toLocaleString()}원</span>
                        <span className={catBudget - catActual >= 0 ? "text-green-600" : "text-red-600"}>
                          잔액: {(catBudget - catActual).toLocaleString()}원
                        </span>
                      </div>
                    </div>

                    {/* 데스크톱: 테이블 */}
                    <div className="hidden sm:block">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-1.5 px-2 font-medium text-xs">항목</th>
                            <th className="text-right py-1.5 px-2 font-medium text-xs">예산</th>
                            <th className="text-right py-1.5 px-2 font-medium text-xs">실행</th>
                            <th className="text-right py-1.5 px-2 font-medium text-xs">잔액</th>
                            <th className="text-right py-1.5 px-2 font-medium text-xs w-28">실행금액 수정</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items!.map(item => {
                            const itemDiff = Number(item.budgetAmount) - Number(item.actualAmount);
                            return (
                              <tr key={item.id} className="border-b hover:bg-accent/30">
                                <td className="py-2 px-2">{item.itemName}</td>
                                <td className="py-2 px-2 text-right">{Number(item.budgetAmount).toLocaleString()}</td>
                                <td className="py-2 px-2 text-right">{Number(item.actualAmount).toLocaleString()}</td>
                                <td className={`py-2 px-2 text-right font-medium ${itemDiff >= 0 ? "text-green-600" : "text-red-600"}`}>
                                  {itemDiff.toLocaleString()}
                                </td>
                                <td className="py-2 px-2 text-right">
                                  <Input
                                    type="number"
                                    className="w-28 h-7 text-xs text-right ml-auto"
                                    defaultValue={item.actualAmount}
                                    onBlur={e => {
                                      const val = e.target.value;
                                      if (val !== String(item.actualAmount)) {
                                        updateActual.mutate({ id: item.id, actualAmount: val });
                                      }
                                    }}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* 모바일: 카드형 */}
                    <div className="sm:hidden space-y-2">
                      {items!.map(item => {
                        const itemDiff = Number(item.budgetAmount) - Number(item.actualAmount);
                        return (
                          <div key={item.id} className="border rounded-lg p-3 space-y-2">
                            <div className="font-medium text-sm">{item.itemName}</div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground block">예산</span>
                                <span className="font-medium">{Number(item.budgetAmount).toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block">실행</span>
                                <span className="font-medium">{Number(item.actualAmount).toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block">잔액</span>
                                <span className={`font-medium ${itemDiff >= 0 ? "text-green-600" : "text-red-600"}`}>
                                  {itemDiff.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <Label className="text-[10px] text-muted-foreground">실행금액 수정</Label>
                              <Input
                                type="number"
                                className="h-10 text-sm"
                                defaultValue={item.actualAmount}
                                onBlur={e => {
                                  const val = e.target.value;
                                  if (val !== String(item.actualAmount)) {
                                    updateActual.mutate({ id: item.id, actualAmount: val });
                                  }
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
