import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, Pencil, Trash2, GitBranch, ArrowDown, X, Star } from "lucide-react";
import { toast } from "sonner";

type ApproverType = "specific_user" | "role" | "manager";
interface Step {
  stepOrder: number;
  approverType: ApproverType;
  approverId?: number;
  approverRole?: string;
  approverName: string;
  isRequired: boolean;
}

const ROLE_OPTIONS = ["대표자", "경영지원", "공사팀장", "설계팀장"];

export default function OpsApprovalLines() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const lines = trpc.ops.approvalLine.list.useQuery();
  const staff = trpc.ops.staff.list.useQuery(undefined, { enabled: user?.role === "admin" || user?.role === "master" });

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  const isAdmin = user?.role === "admin" || user?.role === "master";

  const reset = () => { setEditingId(null); setName(""); setIsDefault(false); setSteps([]); };

  const createLine = trpc.ops.approvalLine.create.useMutation({
    onSuccess: () => { utils.ops.approvalLine.list.invalidate(); setOpen(false); reset(); toast.success("결재라인이 등록되었습니다."); },
    onError: (e) => toast.error(e.message),
  });
  const updateLine = trpc.ops.approvalLine.update.useMutation({
    onSuccess: () => { utils.ops.approvalLine.list.invalidate(); setOpen(false); reset(); toast.success("결재라인이 수정되었습니다."); },
    onError: (e) => toast.error(e.message),
  });
  const deleteLine = trpc.ops.approvalLine.delete.useMutation({
    onSuccess: () => { utils.ops.approvalLine.list.invalidate(); toast.success("결재라인이 삭제되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => { reset(); setSteps([{ stepOrder: 1, approverType: "specific_user", approverName: "", isRequired: true }]); setOpen(true); };
  const openEdit = (l: any) => {
    setEditingId(l.id);
    setName(l.name ?? "");
    setIsDefault(!!l.isDefault);
    setSteps((l.steps ?? []).map((s: any, i: number) => ({
      stepOrder: s.stepOrder ?? i + 1,
      approverType: (s.approverType ?? "specific_user") as ApproverType,
      approverId: s.approverId,
      approverRole: s.approverRole,
      approverName: s.approverName ?? "",
      isRequired: s.isRequired ?? true,
    })));
    setOpen(true);
  };

  const addStep = () => setSteps(prev => [...prev, { stepOrder: prev.length + 1, approverType: "specific_user", approverName: "", isRequired: true }]);
  const removeStep = (idx: number) => setSteps(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepOrder: i + 1 })));
  const updateStep = (idx: number, patch: Partial<Step>) => setSteps(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));

  const submit = () => {
    if (!name.trim()) { toast.error("결재라인 이름은 필수입니다."); return; }
    if (steps.length === 0) { toast.error("결재 단계를 1개 이상 추가하세요."); return; }
    for (const s of steps) {
      if (s.approverType === "specific_user" && !s.approverId) { toast.error("특정 결재자를 선택하세요."); return; }
      if (s.approverType === "role" && !s.approverRole) { toast.error("결재 역할을 선택하세요."); return; }
    }
    const payload = {
      name: name.trim(),
      documentType: "expense" as const,
      steps: steps.map((s, i) => ({
        stepOrder: i + 1,
        approverType: s.approverType,
        approverId: s.approverType === "specific_user" ? s.approverId : undefined,
        approverRole: s.approverType === "role" ? s.approverRole : undefined,
        approverName: s.approverName || (s.approverType === "manager" ? "현장 담당자" : s.approverRole || ""),
        isRequired: s.isRequired,
      })),
      isDefault: isDefault ? 1 : 0,
    };
    if (editingId) updateLine.mutate({ id: editingId, ...payload });
    else createLine.mutate(payload);
  };

  const expenseLines = (lines.data ?? []).filter((l: any) => (l.documentType ?? "expense") === "expense");

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/ops/approval")}><ArrowLeft className="w-4 h-4" /></Button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2"><GitBranch className="w-5 h-5" />결재라인 관리</h1>
              <p className="text-xs text-muted-foreground">지출결의서 결재 단계 템플릿. 예) 작성 → 경영지원 → 대표자</p>
            </div>
          </div>
          {isAdmin && <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />결재라인 추가</Button>}
        </div>
      </div>

      <div className="container py-6 space-y-3">
        {!isAdmin && <p className="text-sm text-muted-foreground">결재라인 등록·수정은 관리자만 가능합니다.</p>}
        {lines.isLoading ? (
          <p className="text-center text-muted-foreground py-8">로딩 중...</p>
        ) : expenseLines.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <GitBranch className="w-10 h-10 mx-auto opacity-30 mb-2" />등록된 결재라인이 없습니다.
            {isAdmin && <div className="mt-3"><Button size="sm" variant="outline" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />첫 결재라인 만들기</Button></div>}
          </CardContent></Card>
        ) : (
          expenseLines.map((l: any) => (
            <Card key={l.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{l.name}</span>
                      {l.isDefault ? <Badge className="bg-gold/20 text-gold-dark border-0 text-[11px]"><Star className="w-3 h-3 mr-0.5" />기본</Badge> : null}
                      {!(l.isActive ?? 1) && <Badge variant="outline" className="text-[11px]">비활성</Badge>}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="text-[11px]">작성</Badge>
                      {(l.steps ?? []).map((s: any, i: number) => (
                        <span key={i} className="flex items-center gap-1.5">
                          <ArrowDown className="w-3 h-3 text-muted-foreground rotate-[-90deg]" />
                          <Badge variant="secondary" className="text-[11px]">
                            {s.approverName || s.approverRole || "결재자"}{s.isRequired === false ? " (선택)" : ""}
                          </Badge>
                        </span>
                      ))}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(l)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={() => { if (confirm(`'${l.name}' 결재라인을 삭제할까요?`)) deleteLine.mutate({ id: l.id }); }}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "결재라인 수정" : "결재라인 등록"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>결재라인 이름 *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="예: 일반 지출결의" /></div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} />
              기본 결재라인으로 설정
            </label>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>결재 단계</Label>
                <Button type="button" size="sm" variant="outline" onClick={addStep}><Plus className="w-3 h-3 mr-1" />단계 추가</Button>
              </div>
              <div className="space-y-2">
                {steps.map((s, idx) => (
                  <div key={idx} className="border rounded-lg p-3 space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">{idx + 1}단계</span>
                      <Button type="button" size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => removeStep(idx)}><X className="w-3.5 h-3.5" /></Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">결재자 유형</Label>
                        <Select value={s.approverType} onValueChange={(v) => updateStep(idx, { approverType: v as ApproverType, approverId: undefined, approverRole: undefined, approverName: v === "manager" ? "현장 담당자" : "" })}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="specific_user">특정 직원</SelectItem>
                            <SelectItem value="role">역할</SelectItem>
                            <SelectItem value="manager">현장 담당자</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {s.approverType === "specific_user" && (
                        <div>
                          <Label className="text-xs">직원</Label>
                          <Select value={s.approverId ? String(s.approverId) : ""} onValueChange={(v) => {
                            const m = staff.data?.find((x: any) => String(x.id) === v);
                            updateStep(idx, { approverId: Number(v), approverName: m?.name ?? "" });
                          }}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="선택" /></SelectTrigger>
                            <SelectContent>
                              {staff.data?.map((m: any) => <SelectItem key={m.id} value={String(m.id)}>{m.name ?? m.email}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {s.approverType === "role" && (
                        <div>
                          <Label className="text-xs">역할</Label>
                          <Select value={s.approverRole ?? ""} onValueChange={(v) => updateStep(idx, { approverRole: v, approverName: v })}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="선택" /></SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="checkbox" checked={s.isRequired} onChange={e => updateStep(idx, { isRequired: e.target.checked })} />
                      필수 결재 단계
                    </label>
                  </div>
                ))}
                {steps.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">단계를 추가하세요.</p>}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-3">
            <Button className="w-full" onClick={submit} disabled={createLine.isPending || updateLine.isPending}>
              {createLine.isPending || updateLine.isPending ? "저장 중..." : editingId ? "수정 저장" : "결재라인 등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
