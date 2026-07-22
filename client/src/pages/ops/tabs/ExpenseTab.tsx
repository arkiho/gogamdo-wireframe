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
import { useMemo, useRef, useState } from "react";
import { Plus, Receipt, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, FileDown, Trash2, Upload, Paperclip, X, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { generateExpensePdf } from "@/lib/expensePdf";
import { IPConsentModal } from "@/components/IPConsentModal";
import { uploadFile } from "@/lib/uploadFile";
import { parseAmountInput } from "@/lib/formula";
import { parseExpenseExcel } from "@/lib/parseExpenseExcel";
import {
  EXPENSE_TYPE_LABELS, type ExpenseType,
  calcTaxInvoice, calcWithholding, calcWithholdingWithExpense, calcDailyWorker,
} from "@/lib/expenseTax";

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

const GENERAL = "general"; // 유형 미선택(기존 항목 방식)

interface ExpenseItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  remarks?: string;
}

/** 수식 입력 가능한 금액 인풋. blur 시 =수식을 계산값으로 치환. */
function AmountInput({ value, onChange, onCommit, placeholder, className }: {
  value: string;
  onChange: (v: string) => void;
  onCommit?: () => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Input
      value={value}
      inputMode="text"
      placeholder={placeholder ?? "0 또는 =수식"}
      className={className}
      onChange={e => onChange(e.target.value)}
      onBlur={() => {
        const n = parseAmountInput(value);
        if (n != null && value.trim().startsWith("=")) onChange(String(n));
        onCommit?.();
      }}
    />
  );
}

export default function ExpenseTab({ projectId, projectName }: { projectId: string; projectName?: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [consentTarget, setConsentTarget] = useState<any | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const logDownload = trpc.ipProtection.logDownload.useMutation();
  const fileRef = useRef<HTMLInputElement>(null);
  const excelRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [parsingExcel, setParsingExcel] = useState(false);

  const [items, setItems] = useState<ExpenseItem[]>([
    { description: "", quantity: 1, unitPrice: 0, amount: 0 },
  ]);
  const [form, setForm] = useState({
    title: "", category: "material",
    paymentMethod: "bank_transfer",
    payeeName: "", payeeBank: "", payeeAccount: "",
    notes: "",
  });
  const [expenseType, setExpenseType] = useState<string>(GENERAL);
  const [approvalLineId, setApprovalLineId] = useState<string>("");
  const [receiptUrls, setReceiptUrls] = useState<string[]>([]);

  // 세무 유형별 입력값(문자열 — 수식 허용)
  const [tax, setTax] = useState({ supplyAmount: "", paymentAmount: "", expenseAmount: "", dailyWage: "", days: "" });
  // 자동계산 결과(담당자 수정 가능한 편집 상태)
  const [taxResult, setTaxResult] = useState<Record<string, number>>({});

  const expenses = trpc.ops.expense.list.useQuery({ projectId: Number(projectId) });
  const approvalLines = trpc.ops.approvalLine.list.useQuery();

  const createExpense = trpc.ops.expense.create.useMutation({
    onSuccess: () => {
      expenses.refetch();
      resetForm();
      setOpen(false);
      toast.success(approvalLineId ? "지출결의서가 상신되었습니다." : "지출결의서가 저장되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });
  const approveExpense = trpc.ops.expense.approve.useMutation({
    onSuccess: () => { expenses.refetch(); toast.success("결재가 처리되었습니다."); },
    onError: (err) => toast.error(err.message),
  });
  const rejectExpense = trpc.ops.expense.reject.useMutation({
    onSuccess: () => { expenses.refetch(); toast.success("반려 처리되었습니다."); },
    onError: (err) => toast.error(err.message),
  });

  function resetForm() {
    setForm({ title: "", category: "material", paymentMethod: "bank_transfer", payeeName: "", payeeBank: "", payeeAccount: "", notes: "" });
    setItems([{ description: "", quantity: 1, unitPrice: 0, amount: 0 }]);
    setExpenseType(GENERAL);
    setApprovalLineId("");
    setReceiptUrls([]);
    setTax({ supplyAmount: "", paymentAmount: "", expenseAmount: "", dailyWage: "", days: "" });
    setTaxResult({});
  }

  const addItem = () => setItems(prev => [...prev, { description: "", quantity: 1, unitPrice: 0, amount: 0 }]);
  const removeItem = (index: number) => { if (items.length > 1) setItems(prev => prev.filter((_, i) => i !== index)); };
  const updateItem = (index: number, field: keyof ExpenseItem, value: string | number) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };
      if (field === "description" || field === "remarks") {
        (item as any)[field] = value;
      } else {
        // 수량/단가에 수식 허용
        const parsed = parseAmountInput(String(value));
        (item as any)[field] = parsed ?? 0;
      }
      if (field === "quantity" || field === "unitPrice") item.amount = item.quantity * item.unitPrice;
      updated[index] = item;
      return updated;
    });
  };

  const itemsTotal = items.reduce((sum, item) => sum + item.amount, 0);

  // 세무 유형별 자동계산 (입력 변경 시 결과 갱신) — 담당자 수정 전 기본값
  const computed = useMemo(() => {
    const n = (s: string) => parseAmountInput(s) ?? 0;
    if (expenseType === "tax_invoice") return calcTaxInvoice(n(tax.supplyAmount)) as unknown as Record<string, number>;
    if (expenseType === "withholding") return calcWithholding(n(tax.paymentAmount)) as unknown as Record<string, number>;
    if (expenseType === "withholding_expense") return calcWithholdingWithExpense(n(tax.paymentAmount), n(tax.expenseAmount)) as unknown as Record<string, number>;
    if (expenseType === "daily_worker") return calcDailyWorker(n(tax.dailyWage), n(tax.days)) as unknown as Record<string, number>;
    return {};
  }, [expenseType, tax]);

  // 기저 입력이 바뀌면 자동값으로 결과 재설정(수정 초기화)
  const recalc = (next: typeof tax) => {
    const n = (s: string) => parseAmountInput(s) ?? 0;
    let r: Record<string, number> = {};
    if (expenseType === "tax_invoice") r = calcTaxInvoice(n(next.supplyAmount)) as any;
    else if (expenseType === "withholding") r = calcWithholding(n(next.paymentAmount)) as any;
    else if (expenseType === "withholding_expense") r = calcWithholdingWithExpense(n(next.paymentAmount), n(next.expenseAmount)) as any;
    else if (expenseType === "daily_worker") r = calcDailyWorker(n(next.dailyWage), n(next.days)) as any;
    setTaxResult(r);
  };
  const setTaxInput = (field: keyof typeof tax, value: string) => {
    const next = { ...tax, [field]: value };
    setTax(next);
    recalc(next);
  };
  const res = (k: string) => taxResult[k] ?? (computed as any)[k] ?? 0;
  const setRes = (k: string, v: string) => setTaxResult(r => ({ ...r, [k]: parseAmountInput(v) ?? 0 }));

  // 유형별 총 결의금액
  const typedTotal = useMemo(() => {
    if (expenseType === "tax_invoice") return res("total");
    if (expenseType === "withholding" || expenseType === "withholding_expense") return res("paymentAmount");
    if (expenseType === "daily_worker") return res("grossPay");
    return itemsTotal;
  }, [expenseType, taxResult, computed, itemsTotal]);

  const handleFilePick = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        const { url } = await uploadFile(f, "receipt");
        urls.push(url);
      }
      setReceiptUrls(prev => [...prev, ...urls]);
      toast.success(`${urls.length}개 증빙이 첨부되었습니다.`);
    } catch (err: any) {
      toast.error(err?.message ?? "업로드 실패");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleExcelPick = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setParsingExcel(true);
    try {
      const parsed = await parseExpenseExcel(file);
      if (parsed.length === 0) {
        toast.error("엑셀에서 내역표를 인식하지 못했습니다. 적요·금액 컬럼이 있는지 확인하세요.");
        return;
      }
      setItems(parsed.map(p => ({ description: p.description, quantity: p.quantity, unitPrice: p.unitPrice, amount: p.amount, remarks: p.remarks })));
      toast.success(`${parsed.length}개 항목을 불러왔습니다. 확인 후 수정하세요.`);
    } catch (err: any) {
      toast.error(err?.message ?? "엑셀 파싱 실패");
    } finally {
      setParsingExcel(false);
      if (excelRef.current) excelRef.current.value = "";
    }
  };

  const handleCreate = () => {
    if (!form.title) { toast.error("제목은 필수입니다."); return; }

    let payload: any = {
      projectId: Number(projectId),
      title: form.title,
      category: form.category,
      paymentMethod: form.paymentMethod,
      payeeName: form.payeeName || undefined,
      payeeBank: form.payeeBank || undefined,
      payeeAccount: form.payeeAccount || undefined,
      notes: form.notes || undefined,
      receiptUrls: receiptUrls.length ? receiptUrls : undefined,
      approvalLineId: approvalLineId ? Number(approvalLineId) : undefined,
    };

    if (expenseType === GENERAL) {
      if (items.some(i => !i.description)) { toast.error("모든 항목에 내역을 입력해주세요."); return; }
      payload.items = items;
      payload.totalAmount = String(itemsTotal);
    } else {
      const total = Math.round(typedTotal);
      if (total <= 0) { toast.error("금액을 입력해주세요."); return; }
      payload.expenseType = expenseType as ExpenseType;
      payload.taxDetail = taxResult && Object.keys(taxResult).length ? taxResult : (computed as Record<string, number>);
      // 호환용 대표 항목 1줄
      payload.items = [{ description: `${EXPENSE_TYPE_LABELS[expenseType as ExpenseType]} - ${form.title}`, quantity: 1, unitPrice: total, amount: total }];
      payload.totalAmount = String(total);
    }

    createExpense.mutate(payload);
  };

  // PDF 다운로드
  const handleDownloadPdf = (e: any) => setConsentTarget(e);
  const handleConsentAndDownload = async () => {
    if (!consentTarget) return;
    const e = consentTarget;
    setGeneratingPdf(true);
    setConsentTarget(null);
    try {
      const logResult = await logDownload.mutateAsync({
        fileType: "expense_pdf" as const,
        fileName: `지출결의서_${e.expenseNumber ?? e.id}`,
        projectId: parseInt(projectId) || undefined,
        projectName: projectName || undefined,
        consentGiven: "yes",
      });
      generateExpensePdf({
        expenseNumber: e.expenseNumber ?? `EXP-${e.id}`,
        title: e.title,
        category: e.category ?? "other",
        items: e.items ?? [{ description: e.title, quantity: 1, unitPrice: Number(e.totalAmount ?? 0), amount: Number(e.totalAmount ?? 0) }],
        totalAmount: e.totalAmount ?? e.amount ?? 0,
        paymentMethod: e.paymentMethod,
        payeeName: e.payeeName,
        payeeBank: e.payeeBank,
        payeeAccount: e.payeeAccount,
        notes: e.notes,
        status: e.status ?? "draft",
        authorName: user?.name ?? "작성자",
        projectName: projectName ?? "프로젝트",
        createdAt: e.createdAt,
        submittedAt: e.submittedAt,
        approvedAt: e.approvedAt,
        approvalSteps: [],
      }, logResult.trackingCode);
      toast.success(`PDF가 다운로드되었습니다. (트래킹: ${logResult.trackingCode})`);
    } catch (err) {
      toast.error("PDF 생성에 실패했습니다.");
      console.error(err);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const listTotalAmount = expenses.data?.reduce((sum, e) => sum + Number(e.totalAmount ?? 0), 0) ?? 0;
  const approvedAmount = expenses.data?.filter(e => e.status === "approved" || e.status === "paid")
    .reduce((sum, e) => sum + Number(e.totalAmount ?? 0), 0) ?? 0;
  const pendingCount = expenses.data?.filter(e => ["submitted", "in_review", "pending"].includes(e.status ?? "")).length ?? 0;

  const expenseLines = (approvalLines.data ?? []).filter((l: any) => (l.documentType ?? "expense") === "expense" && (l.isActive ?? 1));

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <Card><CardContent className="pt-3 pb-2 sm:pt-4 sm:pb-3 text-center">
          <p className="text-[10px] sm:text-xs text-muted-foreground">총 결의금액</p>
          <p className="text-base sm:text-lg font-bold">{listTotalAmount.toLocaleString()}원</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-2 sm:pt-4 sm:pb-3 text-center">
          <p className="text-[10px] sm:text-xs text-muted-foreground">승인 금액</p>
          <p className="text-base sm:text-lg font-bold text-green-600">{approvedAmount.toLocaleString()}원</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-2 sm:pt-4 sm:pb-3 text-center">
          <p className="text-[10px] sm:text-xs text-muted-foreground">대기 건수</p>
          <p className="text-base sm:text-lg font-bold text-amber-600">{pendingCount}건</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5" />지출결의서
          </CardTitle>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-1" />결의서 작성</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>지출결의서 작성</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                {/* 유형 + 제목 + 구분 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label>결의서 유형</Label>
                    <Select value={expenseType} onValueChange={(v) => { setExpenseType(v); setTaxResult({}); }}>
                      <SelectTrigger className="h-11 sm:h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={GENERAL}>일반</SelectItem>
                        {(Object.keys(EXPENSE_TYPE_LABELS) as ExpenseType[]).map(k => (
                          <SelectItem key={k} value={k}>{EXPENSE_TYPE_LABELS[k]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>제목 *</Label>
                    <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="예: 바닥재 구매" className="h-11 sm:h-9" />
                  </div>
                  <div>
                    <Label>구분</Label>
                    <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger className="h-11 sm:h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 일반: 지출 항목 테이블 */}
                {expenseType === GENERAL && (
                  <div>
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <Label>지출 항목 <span className="text-[11px] text-muted-foreground font-normal">(수량·단가에 =수식 입력 가능)</span></Label>
                      <div className="flex gap-1.5">
                        <input ref={excelRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => handleExcelPick(e.target.files)} />
                        <Button type="button" size="sm" variant="outline" onClick={() => excelRef.current?.click()} disabled={parsingExcel}>
                          <FileSpreadsheet className="w-3 h-3 mr-1" />{parsingExcel ? "불러오는 중..." : "엑셀 불러오기"}
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={addItem}><Plus className="w-3 h-3 mr-1" />항목 추가</Button>
                      </div>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-2 py-2 text-left font-medium">내역</th>
                            <th className="px-2 py-2 text-center font-medium w-20">수량</th>
                            <th className="px-2 py-2 text-right font-medium w-28">단가</th>
                            <th className="px-2 py-2 text-right font-medium w-28">금액</th>
                            <th className="px-2 py-2 w-8"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, i) => (
                            <tr key={i} className="border-t">
                              <td className="px-1 py-1"><Input value={item.description} onChange={e => updateItem(i, "description", e.target.value)} placeholder="내역" className="h-8 text-sm" /></td>
                              <td className="px-1 py-1"><AmountInput value={String(item.quantity)} onChange={v => updateItem(i, "quantity", v)} className="h-8 text-sm text-center" placeholder="1" /></td>
                              <td className="px-1 py-1"><AmountInput value={String(item.unitPrice)} onChange={v => updateItem(i, "unitPrice", v)} className="h-8 text-sm text-right" /></td>
                              <td className="px-2 py-1 text-right font-medium text-sm">{item.amount.toLocaleString()}</td>
                              <td className="px-1 py-1">{items.length > 1 && (<Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => removeItem(i)}><Trash2 className="w-3 h-3 text-muted-foreground" /></Button>)}</td>
                            </tr>
                          ))}
                          <tr className="border-t bg-muted/50">
                            <td colSpan={3} className="px-2 py-2 text-right font-bold">합계</td>
                            <td className="px-2 py-2 text-right font-bold">{itemsTotal.toLocaleString()}원</td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 세금계산서 */}
                {expenseType === "tax_invoice" && (
                  <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
                    <div>
                      <Label>공급가액 <span className="text-[11px] text-muted-foreground font-normal">(=수식 가능)</span></Label>
                      <AmountInput value={tax.supplyAmount} onChange={v => setTaxInput("supplyAmount", v)} className="h-10" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs">부가세 (10%)</Label><AmountInput value={String(res("vat"))} onChange={v => setRes("vat", v)} className="h-9 text-right" /></div>
                      <div><Label className="text-xs">소계</Label><AmountInput value={String(res("total"))} onChange={v => setRes("total", v)} className="h-9 text-right font-semibold" /></div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">자동계산값이며 필요 시 직접 수정할 수 있습니다.</p>
                  </div>
                )}

                {/* 사업소득세 / 경비포함 */}
                {(expenseType === "withholding" || expenseType === "withholding_expense") && (
                  <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div><Label>지급액 <span className="text-[11px] text-muted-foreground font-normal">(=수식)</span></Label><AmountInput value={tax.paymentAmount} onChange={v => setTaxInput("paymentAmount", v)} className="h-10" /></div>
                      {expenseType === "withholding_expense" && (
                        <div><Label>경비 (원천징수 제외)</Label><AmountInput value={tax.expenseAmount} onChange={v => setTaxInput("expenseAmount", v)} className="h-10" /></div>
                      )}
                    </div>
                    {expenseType === "withholding_expense" && (
                      <div><Label className="text-xs">소득분 (지급액 − 경비)</Label><AmountInput value={String(res("incomeAmount"))} onChange={v => setRes("incomeAmount", v)} className="h-9 text-right" /></div>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                      <div><Label className="text-xs">사업소득세 3%</Label><AmountInput value={String(res("incomeTax"))} onChange={v => setRes("incomeTax", v)} className="h-9 text-right" /></div>
                      <div><Label className="text-xs">지방소득세 0.3%</Label><AmountInput value={String(res("localTax"))} onChange={v => setRes("localTax", v)} className="h-9 text-right" /></div>
                      <div><Label className="text-xs">실지급액</Label><AmountInput value={String(res("netPayment"))} onChange={v => setRes("netPayment", v)} className="h-9 text-right font-semibold" /></div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">3.3% 원천징수 자동계산. 원 단위 절사, 직접 수정 가능.</p>
                  </div>
                )}

                {/* 일용직 */}
                {expenseType === "daily_worker" && (
                  <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>일급</Label><AmountInput value={tax.dailyWage} onChange={v => setTaxInput("dailyWage", v)} className="h-10" /></div>
                      <div><Label>일수</Label><AmountInput value={tax.days} onChange={v => setTaxInput("days", v)} className="h-10" placeholder="일" /></div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div><Label className="text-xs">근로소득세</Label><AmountInput value={String(res("incomeTax"))} onChange={v => setRes("incomeTax", v)} className="h-9 text-right" /></div>
                      <div><Label className="text-xs">지방소득세</Label><AmountInput value={String(res("localTax"))} onChange={v => setRes("localTax", v)} className="h-9 text-right" /></div>
                      <div><Label className="text-xs">고용보험 0.9%</Label><AmountInput value={String(res("employmentInsurance"))} onChange={v => setRes("employmentInsurance", v)} className="h-9 text-right" /></div>
                      <div><Label className="text-xs">실지급액</Label><AmountInput value={String(res("netPayment"))} onChange={v => setRes("netPayment", v)} className="h-9 text-right font-semibold" /></div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">총 지급 {Math.round(res("grossPay")).toLocaleString()}원. 일급 15만원 초과분만 과세(소액부징수 반영).</p>
                  </div>
                )}

                {/* 총 결의금액 */}
                {expenseType !== GENERAL && (
                  <div className="flex items-center justify-between px-1">
                    <span className="text-sm text-muted-foreground">총 결의금액</span>
                    <span className="text-lg font-bold">{Math.round(typedTotal).toLocaleString()}원</span>
                  </div>
                )}

                {/* 증빙 첨부 */}
                <div>
                  <Label>증빙 첨부 <span className="text-[11px] text-muted-foreground font-normal">(이미지·PDF, 다중 가능)</span></Label>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <input ref={fileRef} type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={e => handleFilePick(e.target.files)} />
                    <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                      <Upload className="w-4 h-4 mr-1" />{uploading ? "업로드 중..." : "파일 선택"}
                    </Button>
                    {receiptUrls.map((url, i) => (
                      <div key={i} className="flex items-center gap-1 bg-muted rounded px-2 py-1 text-xs">
                        <Paperclip className="w-3 h-3" />
                        <a href={url} target="_blank" rel="noreferrer" className="underline max-w-[120px] truncate">증빙 {i + 1}</a>
                        <button type="button" onClick={() => setReceiptUrls(prev => prev.filter((_, idx) => idx !== i))}><X className="w-3 h-3 text-muted-foreground" /></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 지급 정보 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>결제 방법</Label>
                    <Select value={form.paymentMethod} onValueChange={v => setForm(f => ({ ...f, paymentMethod: v }))}>
                      <SelectTrigger className="h-11 sm:h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">계좌이체</SelectItem>
                        <SelectItem value="card">카드</SelectItem>
                        <SelectItem value="cash">현금</SelectItem>
                        <SelectItem value="check">수표</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>수취인</Label><Input value={form.payeeName} onChange={e => setForm(f => ({ ...f, payeeName: e.target.value }))} placeholder="수취인명" className="h-11 sm:h-9" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><Label>은행명</Label><Input value={form.payeeBank} onChange={e => setForm(f => ({ ...f, payeeBank: e.target.value }))} placeholder="예: 국민은행" className="h-11 sm:h-9" /></div>
                  <div><Label>계좌번호</Label><Input value={form.payeeAccount} onChange={e => setForm(f => ({ ...f, payeeAccount: e.target.value }))} placeholder="계좌번호" className="h-11 sm:h-9" /></div>
                </div>

                {/* 결재라인 */}
                <div>
                  <Label>결재라인 <span className="text-[11px] text-muted-foreground font-normal">(선택 시 상신, 미선택 시 작성 저장)</span></Label>
                  <Select value={approvalLineId || "none"} onValueChange={v => setApprovalLineId(v === "none" ? "" : v)}>
                    <SelectTrigger className="h-11 sm:h-9"><SelectValue placeholder="결재라인 선택" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">결재라인 없이 저장</SelectItem>
                      {expenseLines.map((l: any) => (
                        <SelectItem key={l.id} value={String(l.id)}>{l.name}{l.isDefault ? " (기본)" : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {expenseLines.length === 0 && <p className="text-[11px] text-muted-foreground mt-1">등록된 결재라인이 없습니다. 관리자가 결재라인을 먼저 등록하세요.</p>}
                </div>

                <div><Label>비고</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="추가 메모" rows={2} /></div>

                <Button onClick={handleCreate} className="w-full h-12 sm:h-9 text-base sm:text-sm" disabled={createExpense.isPending || uploading}>
                  {createExpense.isPending ? "저장 중..." : approvalLineId ? "결의서 상신" : "결의서 저장"}
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
              <Receipt className="w-10 h-10 mx-auto opacity-30 mb-2" />지출결의서가 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.data.map(e => {
                const status = e.status ?? (e as any).approvalStatus ?? "draft";
                const a = APPROVAL_LABELS[status] ?? APPROVAL_LABELS.draft;
                const Icon = a.icon;
                const isExpanded = expandedId === String(e.id);
                const amount = Number(e.totalAmount ?? (e as any).amount ?? 0);
                const etype = (e as any).expenseType as ExpenseType | undefined;
                return (
                  <div key={e.id} className="border rounded-lg">
                    <div className="flex items-center gap-2 sm:gap-3 p-3 cursor-pointer hover:bg-accent/30 active:bg-accent/50 transition-colors" onClick={() => setExpandedId(isExpanded ? null : String(e.id))}>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                          <span className="font-medium text-sm truncate">{e.title}</span>
                          {etype && <Badge variant="secondary" className="text-[10px]">{EXPENSE_TYPE_LABELS[etype]}</Badge>}
                          <Badge variant="outline" className="text-[10px] sm:text-xs">{CATEGORY_LABELS[e.category] ?? e.category}</Badge>
                          <Badge className={`text-[10px] sm:text-xs ${a.color} border-0`}><Icon className="w-3 h-3 mr-0.5" />{a.label}</Badge>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground mt-1">
                          {e.expenseNumber && <span className="font-mono">{e.expenseNumber}</span>}
                          <span>{new Date(e.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0"><p className="font-semibold text-sm">{amount.toLocaleString()}원</p></div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
                    </div>
                    {isExpanded && (
                      <div className="px-3 pb-3 border-t pt-3 space-y-3">
                        {e.items && Array.isArray(e.items) && e.items.length > 0 && (
                          <div className="border rounded overflow-hidden">
                            <table className="w-full text-xs">
                              <thead className="bg-muted"><tr>
                                <th className="px-2 py-1.5 text-left">내역</th>
                                <th className="px-2 py-1.5 text-center w-12">수량</th>
                                <th className="px-2 py-1.5 text-right w-20">단가</th>
                                <th className="px-2 py-1.5 text-right w-20">금액</th>
                              </tr></thead>
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

                        {/* 세무 계산 상세 */}
                        {etype && (e as any).taxDetail && (
                          <div className="bg-muted/40 rounded p-2 text-xs space-y-1">
                            <p className="font-medium">{EXPENSE_TYPE_LABELS[etype]} 세무 내역</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-0.5 text-muted-foreground">
                              {Object.entries((e as any).taxDetail as Record<string, number>).map(([k, v]) => (
                                <div key={k} className="flex justify-between"><span>{TAX_FIELD_LABELS[k] ?? k}</span><span className="font-mono text-foreground">{Number(v).toLocaleString()}</span></div>
                              ))}
                            </div>
                          </div>
                        )}

                        {e.notes && <p className="text-xs sm:text-sm text-muted-foreground">{e.notes}</p>}

                        {/* 증빙 첨부 목록 */}
                        {Array.isArray((e as any).receiptUrls) && (e as any).receiptUrls.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {((e as any).receiptUrls as string[]).map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-muted rounded px-2 py-1 text-xs underline"><Paperclip className="w-3 h-3" />증빙 {i + 1}</a>
                            ))}
                          </div>
                        )}

                        {(e.payeeName || e.payeeBank) && (
                          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                            <span className="font-medium">지급정보: </span>
                            {e.payeeName && <span>{e.payeeName} </span>}
                            {e.payeeBank && <span>| {e.payeeBank} {e.payeeAccount}</span>}
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2 sm:flex-wrap">
                          <Button size="sm" variant="outline" className="w-full sm:w-auto h-10 sm:h-8" onClick={(ev) => { ev.stopPropagation(); handleDownloadPdf(e); }}>
                            <FileDown className="w-4 h-4 mr-1" />PDF 다운로드
                          </Button>
                          {["submitted", "in_review", "pending"].includes(status) && user?.role === "admin" && (
                            <div className="flex gap-2 w-full sm:w-auto">
                              <Button size="sm" variant="outline" className="flex-1 sm:flex-initial text-green-600 border-green-200 hover:bg-green-50 active:bg-green-100 h-10 sm:h-8" onClick={() => approveExpense.mutate({ id: e.id, comment: "" })}>
                                <CheckCircle className="w-4 h-4 mr-1" />승인
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1 sm:flex-initial text-red-600 border-red-200 hover:bg-red-50 active:bg-red-100 h-10 sm:h-8" onClick={() => { const reason = prompt("반려 사유를 입력해주세요:"); if (reason) rejectExpense.mutate({ id: e.id, comment: reason }); }}>
                                <XCircle className="w-4 h-4 mr-1" />반려
                              </Button>
                            </div>
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

      <IPConsentModal
        open={!!consentTarget}
        onClose={() => setConsentTarget(null)}
        onConsent={handleConsentAndDownload}
        fileName={consentTarget ? `지출결의서_${consentTarget.expenseNumber ?? consentTarget.id}.pdf` : undefined}
        isLoading={generatingPdf}
      />
    </div>
  );
}

const TAX_FIELD_LABELS: Record<string, string> = {
  supplyAmount: "공급가액", vat: "부가세", total: "소계",
  paymentAmount: "지급액", incomeTax: "소득세", localTax: "지방세",
  totalWithholding: "원천징수 계", netPayment: "실지급액",
  expenseAmount: "경비", incomeAmount: "소득분",
  dailyWage: "일급", days: "일수", grossPay: "총 지급", perDayIncomeTax: "일 소득세",
  employmentInsurance: "고용보험", totalDeduction: "공제 계",
};
