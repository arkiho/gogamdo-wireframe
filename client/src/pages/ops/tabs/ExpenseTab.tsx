import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Plus, Receipt, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, FileDown, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { generateExpensePdf } from "@/lib/expensePdf";

const CATEGORY_LABELS: Record<string, string> = {
  material: "자재비", labor: "인건비", equipment: "장비비",
  transportation: "운반비", subcontract: "하도급비", utility: "공과금",
  office: "사무용품", meal: "식대", other: "기타",
};

const APPROVAL_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  draft: { label: "작성중", icon: Clock, color: "bg-slate-100 text-slate-600" },
  submitted: { label: "상신됨", icon: Clock, color: "bg-blue-100 text-blue-700" },
  in_review: { label: "결재중", icon: Clock, color: "bg-amber-100 text-amber-700" },
  approved: { label: "승인", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  rejected: { label: "반려", icon: XCircle, color: "bg-red-100 text-red-700" },
  paid: { label: "지급완료", icon: CheckCircle, color: "bg-emerald-100 text-emerald-700" },
  pending: { label: "결재 대기", icon: Clock, color: "bg-amber-100 text-amber-700" },
  returned: { label: "반송", icon: XCircle, color: "bg-orange-100 text-orange-700" },
};

interface ExpenseItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  remarks?: string;
}

export default function ExpenseTab({ projectId, projectName }: { projectId: string; projectName?: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [items, setItems] = useState<ExpenseItem[]>([
    { description: "", quantity: 1, unitPrice: 0, amount: 0 },
  ]);
  const [form, setForm] = useState({
    title: "", category: "material",
    paymentMethod: "bank_transfer",
    payeeName: "", payeeBank: "", payeeAccount: "",
    notes: "",
  });

  const expenses = trpc.ops.expense.list.useQuery({ projectId: Number(projectId) });
  const createExpense = trpc.ops.expense.create.useMutation({
    onSuccess: () => {
      expenses.refetch();
      setOpen(false);
      setForm({ title: "", category: "material", paymentMethod: "bank_transfer", payeeName: "", payeeBank: "", payeeAccount: "", notes: "" });
      setItems([{ description: "", quantity: 1, unitPrice: 0, amount: 0 }]);
      toast.success("지출결의서가 상신되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  const approveExpense = trpc.ops.expense.approve.useMutation({
    onSuccess: () => {
      expenses.refetch();
      toast.success("결재가 처리되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  const addItem = () => {
    setItems(prev => [...prev, { description: "", quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ExpenseItem, value: string | number) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };
      if (field === "description" || field === "remarks") {
        (item as any)[field] = value;
      } else {
        (item as any)[field] = Number(value) || 0;
      }
      // Auto-calculate amount
      if (field === "quantity" || field === "unitPrice") {
        item.amount = item.quantity * item.unitPrice;
      }
      updated[index] = item;
      return updated;
    });
  };

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const handleCreate = () => {
    if (!form.title) {
      toast.error("제목은 필수입니다.");
      return;
    }
    if (items.some(i => !i.description)) {
      toast.error("모든 항목에 내역을 입력해주세요.");
      return;
    }
    createExpense.mutate({
      projectId: Number(projectId),
      title: form.title,
      category: form.category as any,
      items,
      totalAmount: String(totalAmount),
      paymentMethod: form.paymentMethod as any,
      payeeName: form.payeeName || undefined,
      payeeBank: form.payeeBank || undefined,
      payeeAccount: form.payeeAccount || undefined,
      notes: form.notes || undefined,
    });
  };

  const handleDownloadPdf = (e: any) => {
    try {
      generateExpensePdf({
        expenseNumber: e.expenseNumber ?? `EXP-${e.id}`,
        title: e.title,
        category: e.category ?? "other",
        items: e.items ?? [{ description: e.title, quantity: 1, unitPrice: Number(e.totalAmount ?? e.amount ?? 0), amount: Number(e.totalAmount ?? e.amount ?? 0) }],
        totalAmount: e.totalAmount ?? e.amount ?? 0,
        paymentMethod: e.paymentMethod,
        payeeName: e.payeeName,
        payeeBank: e.payeeBank,
        payeeAccount: e.payeeAccount,
        notes: e.notes,
        status: e.status ?? e.approvalStatus ?? "draft",
        authorName: user?.name ?? "작성자",
        projectName: projectName ?? "프로젝트",
        createdAt: e.createdAt,
        submittedAt: e.submittedAt,
        approvedAt: e.approvedAt,
        approvalSteps: [],
      });
      toast.success("PDF가 다운로드되었습니다.");
    } catch (err) {
      toast.error("PDF 생성에 실패했습니다.");
      console.error(err);
    }
  };

  const listTotalAmount = expenses.data?.reduce((sum, e) => sum + Number(e.totalAmount ?? e.amount ?? 0), 0) ?? 0;
  const approvedAmount = expenses.data?.filter(e => (e.status ?? e.approvalStatus) === "approved" || (e.status ?? e.approvalStatus) === "paid")
    .reduce((sum, e) => sum + Number(e.totalAmount ?? e.amount ?? 0), 0) ?? 0;
  const pendingCount = expenses.data?.filter(e => ["submitted", "in_review", "pending"].includes(e.status ?? e.approvalStatus ?? "")).length ?? 0;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-muted-foreground">총 결의금액</p>
            <p className="text-lg font-bold">{listTotalAmount.toLocaleString()}원</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-muted-foreground">승인 금액</p>
            <p className="text-lg font-bold text-green-600">{approvedAmount.toLocaleString()}원</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-muted-foreground">대기 건수</p>
            <p className="text-lg font-bold text-amber-600">{pendingCount}건</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5" />지출결의서
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" />결의서 작성</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>지출결의서 작성</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>제목 *</Label>
                    <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="예: 바닥재 구매" />
                  </div>
                  <div>
                    <Label>구분</Label>
                    <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>지출 항목</Label>
                    <Button type="button" size="sm" variant="outline" onClick={addItem}>
                      <Plus className="w-3 h-3 mr-1" />항목 추가
                    </Button>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-2 py-2 text-left font-medium">내역</th>
                          <th className="px-2 py-2 text-center font-medium w-16">수량</th>
                          <th className="px-2 py-2 text-right font-medium w-24">단가</th>
                          <th className="px-2 py-2 text-right font-medium w-24">금액</th>
                          <th className="px-2 py-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-1 py-1">
                              <Input
                                value={item.description}
                                onChange={e => updateItem(i, "description", e.target.value)}
                                placeholder="내역"
                                className="h-8 text-sm"
                              />
                            </td>
                            <td className="px-1 py-1">
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={e => updateItem(i, "quantity", e.target.value)}
                                className="h-8 text-sm text-center"
                              />
                            </td>
                            <td className="px-1 py-1">
                              <Input
                                type="number"
                                value={item.unitPrice || ""}
                                onChange={e => updateItem(i, "unitPrice", e.target.value)}
                                placeholder="0"
                                className="h-8 text-sm text-right"
                              />
                            </td>
                            <td className="px-2 py-1 text-right font-medium text-sm">
                              {item.amount.toLocaleString()}
                            </td>
                            <td className="px-1 py-1">
                              {items.length > 1 && (
                                <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => removeItem(i)}>
                                  <Trash2 className="w-3 h-3 text-muted-foreground" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t bg-muted/50">
                          <td colSpan={3} className="px-2 py-2 text-right font-bold">합계</td>
                          <td className="px-2 py-2 text-right font-bold">{totalAmount.toLocaleString()}원</td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>결제 방법</Label>
                    <Select value={form.paymentMethod} onValueChange={v => setForm(f => ({ ...f, paymentMethod: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">계좌이체</SelectItem>
                        <SelectItem value="card">카드</SelectItem>
                        <SelectItem value="cash">현금</SelectItem>
                        <SelectItem value="check">수표</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>수취인</Label>
                    <Input value={form.payeeName} onChange={e => setForm(f => ({ ...f, payeeName: e.target.value }))} placeholder="수취인명" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>은행명</Label>
                    <Input value={form.payeeBank} onChange={e => setForm(f => ({ ...f, payeeBank: e.target.value }))} placeholder="예: 국민은행" />
                  </div>
                  <div>
                    <Label>계좌번호</Label>
                    <Input value={form.payeeAccount} onChange={e => setForm(f => ({ ...f, payeeAccount: e.target.value }))} placeholder="계좌번호" />
                  </div>
                </div>
                <div>
                  <Label>비고</Label>
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="추가 메모" rows={2} />
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={createExpense.isPending}>
                  {createExpense.isPending ? "상신 중..." : "결의서 상신"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {expenses.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : !expenses.data?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="w-10 h-10 mx-auto opacity-30 mb-2" />
              지출결의서가 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.data.map(e => {
                const status = e.status ?? (e as any).approvalStatus ?? "draft";
                const a = APPROVAL_LABELS[status] ?? APPROVAL_LABELS.draft;
                const Icon = a.icon;
                const isExpanded = expandedId === String(e.id);
                const amount = Number(e.totalAmount ?? (e as any).amount ?? 0);
                return (
                  <div key={e.id} className="border rounded-lg">
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/30 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : String(e.id))}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{e.title}</span>
                          <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[e.category] ?? e.category}</Badge>
                          <Badge className={`text-xs ${a.color} border-0`}>
                            <Icon className="w-3 h-3 mr-1" />{a.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          {e.expenseNumber && <span className="font-mono">{e.expenseNumber}</span>}
                          <span>{new Date(e.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{amount.toLocaleString()}원</p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                    {isExpanded && (
                      <div className="px-3 pb-3 border-t pt-3 space-y-3">
                        {/* Items detail */}
                        {e.items && Array.isArray(e.items) && e.items.length > 0 && (
                          <div className="border rounded overflow-hidden">
                            <table className="w-full text-xs">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="px-2 py-1.5 text-left">내역</th>
                                  <th className="px-2 py-1.5 text-center w-12">수량</th>
                                  <th className="px-2 py-1.5 text-right w-20">단가</th>
                                  <th className="px-2 py-1.5 text-right w-20">금액</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(e.items as ExpenseItem[]).map((item, idx) => (
                                  <tr key={idx} className="border-t">
                                    <td className="px-2 py-1.5">{item.description}</td>
                                    <td className="px-2 py-1.5 text-center">{item.quantity}</td>
                                    <td className="px-2 py-1.5 text-right">{Number(item.unitPrice).toLocaleString()}</td>
                                    <td className="px-2 py-1.5 text-right">{Number(item.amount).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {e.notes && <p className="text-sm text-muted-foreground">{e.notes}</p>}

                        {/* Payment info */}
                        {(e.payeeName || e.payeeBank) && (
                          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                            <span className="font-medium">지급정보: </span>
                            {e.payeeName && <span>{e.payeeName} </span>}
                            {e.payeeBank && <span>| {e.payeeBank} {e.payeeAccount}</span>}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 flex-wrap">
                          {/* PDF Download */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(ev) => { ev.stopPropagation(); handleDownloadPdf(e); }}
                          >
                            <FileDown className="w-4 h-4 mr-1" />PDF 다운로드
                          </Button>

                          {/* Approval Actions */}
                          {["submitted", "in_review", "pending"].includes(status) && user?.role === "admin" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => approveExpense.mutate({ id: e.id, action: "approved", comment: "" })}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />승인
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => {
                                  const reason = prompt("반려 사유를 입력해주세요:");
                                  if (reason) approveExpense.mutate({ id: e.id, action: "rejected", comment: reason });
                                }}
                              >
                                <XCircle className="w-4 h-4 mr-1" />반려
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
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
