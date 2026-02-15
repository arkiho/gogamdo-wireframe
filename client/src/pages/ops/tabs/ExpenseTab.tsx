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
import { Plus, Receipt, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<string, string> = {
  material: "자재비", labor: "인건비", equipment: "장비비",
  transport: "운반비", subcontract: "외주비", overhead: "경비", other: "기타",
};

const APPROVAL_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: "결재 대기", icon: Clock, color: "bg-amber-100 text-amber-700" },
  approved: { label: "승인", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  rejected: { label: "반려", icon: XCircle, color: "bg-red-100 text-red-700" },
  returned: { label: "반송", icon: XCircle, color: "bg-orange-100 text-orange-700" },
};

export default function ExpenseTab({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", category: "material", amount: "", vendor: "",
    description: "", receiptUrl: "",
  });

  const expenses = trpc.ops.expense.list.useQuery({ projectId });
  const createExpense = trpc.ops.expense.create.useMutation({
    onSuccess: () => {
      expenses.refetch();
      setOpen(false);
      setForm({ title: "", category: "material", amount: "", vendor: "", description: "", receiptUrl: "" });
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

  const handleCreate = () => {
    if (!form.title || !form.amount) {
      toast.error("제목과 금액은 필수입니다.");
      return;
    }
    createExpense.mutate({
      projectId,
      title: form.title,
      category: form.category,
      amount: form.amount,
      vendor: form.vendor || undefined,
      description: form.description || undefined,
      receiptUrl: form.receiptUrl || undefined,
    });
  };

  const totalAmount = expenses.data?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;
  const approvedAmount = expenses.data?.filter(e => e.approvalStatus === "approved").reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-muted-foreground">총 결의금액</p>
            <p className="text-lg font-bold">{totalAmount.toLocaleString()}원</p>
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
            <p className="text-lg font-bold text-amber-600">{expenses.data?.filter(e => e.approvalStatus === "pending").length ?? 0}건</p>
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
            <DialogContent>
              <DialogHeader><DialogTitle>지출결의서 작성</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div>
                  <Label>제목 *</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="예: 바닥재 구매" />
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                  <div>
                    <Label>금액 (원) *</Label>
                    <Input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="1000000" />
                  </div>
                </div>
                <div>
                  <Label>거래처</Label>
                  <Input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} placeholder="거래처명" />
                </div>
                <div>
                  <Label>내역 설명</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="지출 상세 내역" rows={3} />
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
                const a = APPROVAL_LABELS[e.approvalStatus] ?? APPROVAL_LABELS.pending;
                const Icon = a.icon;
                const isExpanded = expandedId === e.id;
                return (
                  <div key={e.id} className="border rounded-lg">
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/30 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : e.id)}
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
                          {e.vendor && <span>{e.vendor}</span>}
                          <span>{new Date(e.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{Number(e.amount).toLocaleString()}원</p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                    {isExpanded && (
                      <div className="px-3 pb-3 border-t pt-3 space-y-3">
                        {e.description && <p className="text-sm text-muted-foreground">{e.description}</p>}

                        {/* Approval Actions */}
                        {e.approvalStatus === "pending" && user?.role === "admin" && (
                          <div className="flex gap-2">
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
                          </div>
                        )}
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
