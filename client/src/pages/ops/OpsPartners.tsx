import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { uploadFile } from "@/lib/uploadFile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useRef, useEffect } from "react";
import {
  Building2, Plus, FileText, ClipboardList, Send, Search,
  CheckCircle2, XCircle, Clock, UserCheck, Shield,
  PenTool, Upload, ArrowLeft, ShoppingCart, Eye, Landmark, Pencil, Trash2, Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import NotificationBell from "@/components/NotificationBell";

// ============ STATUS HELPERS ============
const REG_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "대기", color: "bg-yellow-100 text-yellow-700" },
  staff_approved: { label: "1차 승인", color: "bg-blue-100 text-blue-700" },
  approved: { label: "승인 완료", color: "bg-green-100 text-green-700" },
  rejected: { label: "반려", color: "bg-red-100 text-red-700" },
};

const CONTRACT_STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: "초안", color: "bg-slate-100 text-slate-700" },
  pending_b: { label: "을 서명 대기", color: "bg-yellow-100 text-yellow-700" },
  pending_a: { label: "갑 서명 대기", color: "bg-blue-100 text-blue-700" },
  active: { label: "체결 완료", color: "bg-green-100 text-green-700" },
  expired: { label: "만료", color: "bg-gray-100 text-gray-500" },
  terminated: { label: "해지", color: "bg-red-100 text-red-700" },
};

const PO_STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: "초안", color: "bg-slate-100 text-slate-700" },
  rfq_sent: { label: "견적요청 발송", color: "bg-blue-100 text-blue-700" },
  quotes_received: { label: "견적 수신", color: "bg-purple-100 text-purple-700" },
  quote_selected: { label: "견적 선정", color: "bg-green-100 text-green-700" },
  ordered: { label: "발주 완료", color: "bg-emerald-100 text-emerald-700" },
  delivered: { label: "납품 완료", color: "bg-teal-100 text-teal-700" },
  cancelled: { label: "취소", color: "bg-red-100 text-red-700" },
};

// ============ SIGNATURE PAD ============
function SignaturePad({ onSave }: { onSave: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => setDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL("image/png"));
  };

  return (
    <div className="space-y-3">
      <div className="border rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          className="w-full cursor-crosshair touch-none"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={clear}>지우기</Button>
        <Button size="sm" onClick={save}><PenTool className="w-4 h-4 mr-1" />서명 저장</Button>
      </div>
    </div>
  );
}

// ============ REGISTRATION TAB ============
function RegistrationTab() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "master";
  const [openCreate, setOpenCreate] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const trades = trpc.ops.trade.list.useQuery();
  const registrations = trpc.ops.subRegistration.list.useQuery();
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    companyName: "", businessNumber: "", representativeName: "",
    contactName: "", contactPhone: "", contactEmail: "",
    address: "", tradeIds: [] as number[], specialty: "",
    bankName: "", bankAccount: "", bankHolder: "", notes: "",
  });

  const createReg = trpc.ops.subRegistration.create.useMutation({
    onSuccess: () => {
      utils.ops.subRegistration.list.invalidate();
      setOpenCreate(false);
      setForm({ companyName: "", businessNumber: "", representativeName: "", contactName: "", contactPhone: "", contactEmail: "", address: "", tradeIds: [], specialty: "", bankName: "", bankAccount: "", bankHolder: "", notes: "" });
      toast.success("업체 등록 요청이 접수되었습니다.");
    },
    onError: (e) => toast.error(e.message),
  });

  const staffApprove = trpc.ops.subRegistration.staffApprove.useMutation({
    onSuccess: () => { utils.ops.subRegistration.list.invalidate(); toast.success("1차 승인 완료"); setDetailId(null); },
    onError: (e) => toast.error(e.message),
  });

  const adminApprove = trpc.ops.subRegistration.adminApprove.useMutation({
    onSuccess: () => { utils.ops.subRegistration.list.invalidate(); toast.success("최종 승인 완료. 협력업체로 등록되었습니다."); setDetailId(null); },
    onError: (e) => toast.error(e.message),
  });

  const reject = trpc.ops.subRegistration.reject.useMutation({
    onSuccess: () => { utils.ops.subRegistration.list.invalidate(); toast.success("반려 처리되었습니다."); setRejectId(null); setRejectReason(""); },
    onError: (e) => toast.error(e.message),
  });

  const detail = trpc.ops.subRegistration.get.useQuery({ id: detailId! }, { enabled: !!detailId });

  const toggleTrade = (id: number) => {
    setForm(f => ({
      ...f,
      tradeIds: f.tradeIds.includes(id) ? f.tradeIds.filter(t => t !== id) : [...f.tradeIds, id],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">업체 등록 요청</h3>
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" />업체 등록 요청</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>협력업체 등록 요청</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>업체명 *</Label><Input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} /></div>
                <div><Label>사업자번호</Label><Input value={form.businessNumber} onChange={e => setForm(f => ({ ...f, businessNumber: e.target.value }))} placeholder="000-00-00000" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>대표자명</Label><Input value={form.representativeName} onChange={e => setForm(f => ({ ...f, representativeName: e.target.value }))} /></div>
                <div><Label>담당자명</Label><Input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>연락처</Label><Input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} /></div>
                <div><Label>이메일</Label><Input value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} /></div>
              </div>
              <div><Label>주소</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
              <div>
                <Label>공종 선택</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {trades.data?.map(t => (
                    <Badge
                      key={t.id}
                      variant={form.tradeIds.includes(t.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTrade(t.id)}
                    >{t.name}</Badge>
                  ))}
                  {!trades.data?.length && <span className="text-sm text-muted-foreground">공종이 등록되지 않았습니다.</span>}
                </div>
              </div>
              <div><Label>전문 분야 상세</Label><Input value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} placeholder="예: 전기공사, LED 조명 전문" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>은행명</Label><Input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} /></div>
                <div><Label>계좌번호</Label><Input value={form.bankAccount} onChange={e => setForm(f => ({ ...f, bankAccount: e.target.value }))} /></div>
                <div><Label>예금주</Label><Input value={form.bankHolder} onChange={e => setForm(f => ({ ...f, bankHolder: e.target.value }))} /></div>
              </div>
              <div><Label>비고</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
              <Button className="w-full" onClick={() => {
                if (!form.companyName) { toast.error("업체명은 필수입니다."); return; }
                createReg.mutate({ ...form, tradeIds: form.tradeIds.length > 0 ? form.tradeIds : undefined });
              }} disabled={createReg.isPending}>
                {createReg.isPending ? "처리 중..." : "등록 요청"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 등록 요청 목록 */}
      <div className="space-y-2">
        {registrations.data?.map(reg => (
          <Card key={reg.id} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setDetailId(reg.id)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{reg.companyName}</p>
                    <p className="text-sm text-muted-foreground">
                      {reg.specialty || "공종 미지정"} · {reg.requestedByName || "요청자"} · {new Date(reg.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                </div>
                <Badge className={REG_STATUS[reg.status]?.color}>{REG_STATUS[reg.status]?.label}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {!registrations.data?.length && (
          <div className="text-center py-12 text-muted-foreground">등록 요청이 없습니다.</div>
        )}
      </div>

      {/* 상세 보기 + 승인 다이얼로그 */}
      <Dialog open={!!detailId} onOpenChange={(o) => { if (!o) setDetailId(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>업체 등록 요청 상세</DialogTitle></DialogHeader>
          {detail.data && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">업체명:</span> <strong>{detail.data.companyName}</strong></div>
                <div><span className="text-muted-foreground">사업자번호:</span> {detail.data.businessNumber || "-"}</div>
                <div><span className="text-muted-foreground">대표자:</span> {detail.data.representativeName || "-"}</div>
                <div><span className="text-muted-foreground">담당자:</span> {detail.data.contactName || "-"}</div>
                <div><span className="text-muted-foreground">연락처:</span> {detail.data.contactPhone || "-"}</div>
                <div><span className="text-muted-foreground">이메일:</span> {detail.data.contactEmail || "-"}</div>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">전문 분야:</span> {detail.data.specialty || "-"}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">주소:</span> {detail.data.address || "-"}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">상태:</span>
                <Badge className={REG_STATUS[detail.data.status]?.color}>{REG_STATUS[detail.data.status]?.label}</Badge>
              </div>
              {detail.data.staffApprovedByName && (
                <div className="text-sm bg-blue-50 p-3 rounded">
                  <p className="font-medium text-blue-700">1차 승인: {detail.data.staffApprovedByName}</p>
                  {detail.data.staffComment && <p className="text-blue-600 mt-1">{detail.data.staffComment}</p>}
                </div>
              )}
              {detail.data.rejectionReason && (
                <div className="text-sm bg-red-50 p-3 rounded">
                  <p className="font-medium text-red-700">반려 사유: {detail.data.rejectionReason}</p>
                </div>
              )}
              <DialogFooter className="gap-2">
                {detail.data.status === "pending" && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => { setRejectId(detail.data!.id); setDetailId(null); }}>
                      <XCircle className="w-4 h-4 mr-1" />반려
                    </Button>
                    <Button size="sm" onClick={() => staffApprove.mutate({ id: detail.data!.id })} disabled={staffApprove.isPending}>
                      <UserCheck className="w-4 h-4 mr-1" />{staffApprove.isPending ? "처리 중..." : "1차 승인"}
                    </Button>
                  </>
                )}
                {detail.data.status === "staff_approved" && isAdmin && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => { setRejectId(detail.data!.id); setDetailId(null); }}>
                      <XCircle className="w-4 h-4 mr-1" />반려
                    </Button>
                    <Button size="sm" onClick={() => adminApprove.mutate({ id: detail.data!.id })} disabled={adminApprove.isPending}>
                      <Shield className="w-4 h-4 mr-1" />{adminApprove.isPending ? "처리 중..." : "최종 승인"}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 반려 다이얼로그 */}
      <Dialog open={!!rejectId} onOpenChange={(o) => { if (!o) { setRejectId(null); setRejectReason(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>등록 요청 반려</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label>반려 사유 *</Label><Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} /></div>
            <Button className="w-full" variant="destructive" onClick={() => {
              if (!rejectReason.trim()) { toast.error("반려 사유를 입력하세요."); return; }
              reject.mutate({ id: rejectId!, reason: rejectReason });
            }} disabled={reject.isPending}>{reject.isPending ? "처리 중..." : "반려 처리"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ CONTRACTS TAB ============
function ContractsTab() {
  const trades = trpc.ops.trade.list.useQuery();
  const contracts = trpc.ops.subContract.list.useQuery();
  const subs = trpc.ops.subcontractor.list.useQuery();
  const templates = trpc.ops.contractTemplate.list.useQuery();
  const utils = trpc.useUtils();
  const [openCreate, setOpenCreate] = useState(false);
  const [signId, setSignId] = useState<number | null>(null);
  const [signSide, setSignSide] = useState<"a" | "b">("a");
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "master";

  const [form, setForm] = useState({
    subcontractorId: 0, tradeCategoryId: 0, templateId: 0,
    title: "", content: "", partyB: "", startDate: "", endDate: "",
  });

  const createContract = trpc.ops.subContract.create.useMutation({
    onSuccess: () => {
      utils.ops.subContract.list.invalidate();
      setOpenCreate(false);
      toast.success("계약서가 생성되었습니다.");
    },
    onError: (e) => toast.error(e.message),
  });

  const signA = trpc.ops.subContract.signPartyA.useMutation({
    onSuccess: () => { utils.ops.subContract.list.invalidate(); setSignId(null); toast.success("서명이 저장되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const signB = trpc.ops.subContract.signPartyB.useMutation({
    onSuccess: () => { utils.ops.subContract.list.invalidate(); setSignId(null); toast.success("서명이 저장되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  // 템플릿 선택 시 내용 자동 채우기
  const handleTemplateSelect = (templateId: string) => {
    const tid = parseInt(templateId);
    const tmpl = templates.data?.find(t => t.id === tid);
    if (tmpl) {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + (tmpl.validityMonths ?? 12));
      setForm(f => ({
        ...f,
        templateId: tid,
        tradeCategoryId: tmpl.tradeCategoryId,
        title: tmpl.name,
        content: tmpl.content,
        startDate: now.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      }));
    }
  };

  const handleSignatureSave = async (dataUrl: string) => {
    // dataUrl → blob → S3 upload via server
    const blob = await (await fetch(dataUrl)).blob();
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    // For simplicity, we'll store the data URL directly (in production, upload to S3)
    if (signSide === "a" && signId) {
      signA.mutate({ id: signId, signatureUrl: dataUrl, signatureKey: `sig-a-${signId}` });
    } else if (signSide === "b" && signId) {
      signB.mutate({ id: signId, signerName: user?.name || "서명자", signatureUrl: dataUrl, signatureKey: `sig-b-${signId}` });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">공종별 계약서</h3>
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" />계약서 생성</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>공종별 계약서 생성</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>협력업체 *</Label>
                  <Select onValueChange={v => {
                    const sub = subs.data?.find(s => s.id === parseInt(v));
                    setForm(f => ({ ...f, subcontractorId: parseInt(v), partyB: sub?.companyName || "" }));
                  }}>
                    <SelectTrigger><SelectValue placeholder="업체 선택" /></SelectTrigger>
                    <SelectContent>
                      {subs.data?.filter(s => s.isActive).map(s => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.companyName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>계약서 템플릿</Label>
                  <Select onValueChange={handleTemplateSelect}>
                    <SelectTrigger><SelectValue placeholder="템플릿 선택" /></SelectTrigger>
                    <SelectContent>
                      {templates.data?.map(t => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>공종 *</Label>
                  <Select value={form.tradeCategoryId ? String(form.tradeCategoryId) : undefined} onValueChange={v => setForm(f => ({ ...f, tradeCategoryId: parseInt(v) }))}>
                    <SelectTrigger><SelectValue placeholder="공종 선택" /></SelectTrigger>
                    <SelectContent>
                      {trades.data?.map(t => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>계약서 제목 *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>계약 시작일 *</Label><Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></div>
                <div><Label>계약 종료일 *</Label><Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></div>
              </div>
              <div><Label>계약서 내용 *</Label><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={10} className="font-mono text-sm" /></div>
              <Button className="w-full" onClick={() => {
                if (!form.subcontractorId || !form.tradeCategoryId || !form.title || !form.content || !form.startDate || !form.endDate) {
                  toast.error("필수 항목을 모두 입력하세요."); return;
                }
                createContract.mutate({ ...form, templateId: form.templateId || undefined });
              }} disabled={createContract.isPending}>
                {createContract.isPending ? "생성 중..." : "계약서 생성"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 계약서 목록 */}
      <div className="space-y-2">
        {contracts.data?.map(c => (
          <Card key={c.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {c.contractNumber} · {c.partyB} · {c.startDate} ~ {c.endDate}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={CONTRACT_STATUS[c.status]?.color}>{CONTRACT_STATUS[c.status]?.label}</Badge>
                  {c.status === "draft" && isAdmin && (
                    <Button size="sm" variant="outline" onClick={() => { setSignId(c.id); setSignSide("a"); }}>
                      <PenTool className="w-3 h-3 mr-1" />갑 서명
                    </Button>
                  )}
                  {(c.status === "pending_b" || c.status === "draft") && (
                    <Button size="sm" variant="outline" onClick={() => { setSignId(c.id); setSignSide("b"); }}>
                      <PenTool className="w-3 h-3 mr-1" />을 서명
                    </Button>
                  )}
                  {c.status === "pending_a" && isAdmin && (
                    <Button size="sm" variant="outline" onClick={() => { setSignId(c.id); setSignSide("a"); }}>
                      <PenTool className="w-3 h-3 mr-1" />갑 서명
                    </Button>
                  )}
                </div>
              </div>
              {/* 서명 미리보기 */}
              <div className="flex gap-4 mt-3">
                {c.partyASignatureUrl && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">갑 서명</p>
                    <img src={c.partyASignatureUrl} alt="갑 서명" className="h-12 border rounded object-contain" />
                  </div>
                )}
                {c.partyBSignatureUrl && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">을 서명 ({c.partyBSignerName})</p>
                    <img src={c.partyBSignatureUrl} alt="을 서명" className="h-12 border rounded object-contain" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {!contracts.data?.length && (
          <div className="text-center py-12 text-muted-foreground">계약서가 없습니다.</div>
        )}
      </div>

      {/* 서명 다이얼로그 */}
      <Dialog open={!!signId} onOpenChange={(o) => { if (!o) setSignId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{signSide === "a" ? "갑(고감도)" : "을(협력업체)"} 서명/도장</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">아래 영역에 서명 또는 도장을 그려주세요.</p>
          <SignaturePad onSave={handleSignatureSave} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ PURCHASE ORDERS TAB ============
function PurchaseOrdersTab() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "master";
  const projects = trpc.ops.project.list.useQuery();
  const trades = trpc.ops.trade.list.useQuery();
  const pos = trpc.ops.purchaseOrder.list.useQuery();
  const utils = trpc.useUtils();
  const [openCreate, setOpenCreate] = useState(false);
  const [selectedPO, setSelectedPO] = useState<number | null>(null);
  const [openRfq, setOpenRfq] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState({
    projectId: 0, title: "", requiredDate: "", deliveryAddress: "", notes: "",
    items: [{ id: 1, tradeCategoryId: 0, tradeCategoryName: "", description: "", specification: "", unit: "식", quantity: 1, estimatedUnitPrice: 0, estimatedAmount: 0, remarks: "" }] as any[],
  });

  const createPO = trpc.ops.purchaseOrder.create.useMutation({
    onSuccess: () => {
      utils.ops.purchaseOrder.list.invalidate();
      setOpenCreate(false);
      toast.success("발주서가 생성되었습니다.");
    },
    onError: (e) => toast.error(e.message),
  });

  // 자동 매칭 - 발주서 항목의 공종별 업체 자동 추천
  const tradeCategoryIds = [...new Set(form.items.map(i => i.tradeCategoryId).filter(Boolean))];
  const autoMatch = trpc.ops.purchaseOrder.autoMatch.useQuery(
    { tradeCategoryIds },
    { enabled: tradeCategoryIds.length > 0 }
  );

  // 수동 검색
  const searchResult = trpc.ops.purchaseOrder.searchSubs.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length >= 2 }
  );

  // 선택된 발주서의 RFQ 목록
  const rfqList = trpc.ops.rfq.list.useQuery(
    { purchaseOrderId: selectedPO! },
    { enabled: !!selectedPO }
  );

  // RFQ 발송 상태
  const [rfqSubIds, setRfqSubIds] = useState<number[]>([]);
  const sendRfq = trpc.ops.rfq.send.useMutation({
    onSuccess: (data) => {
      utils.ops.rfq.list.invalidate();
      utils.ops.purchaseOrder.list.invalidate();
      setOpenRfq(false);
      setRfqSubIds([]);
      toast.success(`${data.sent}개 업체에 견적요청을 발송했습니다.`);
    },
    onError: (e) => toast.error(e.message),
  });

  const addItem = () => {
    setForm(f => ({
      ...f,
      items: [...f.items, { id: f.items.length + 1, tradeCategoryId: 0, tradeCategoryName: "", description: "", specification: "", unit: "식", quantity: 1, estimatedUnitPrice: 0, estimatedAmount: 0, remarks: "" }],
    }));
  };

  const updateItem = (idx: number, field: string, value: any) => {
    setForm(f => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: value };
      if (field === "quantity" || field === "estimatedUnitPrice") {
        items[idx].estimatedAmount = items[idx].quantity * items[idx].estimatedUnitPrice;
      }
      if (field === "tradeCategoryId") {
        const trade = trades.data?.find(t => t.id === value);
        items[idx].tradeCategoryName = trade?.name || "";
      }
      return { ...f, items };
    });
  };

  const removeItem = (idx: number) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const totalEstimate = form.items.reduce((s, i) => s + (i.estimatedAmount || 0), 0);

  const toggleRfqSub = (id: number) => {
    setRfqSubIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">발주서 / 견적요청</h3>
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" />발주서 생성</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>발주서 생성</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>프로젝트 *</Label>
                  <Select onValueChange={v => setForm(f => ({ ...f, projectId: parseInt(v) }))}>
                    <SelectTrigger><SelectValue placeholder="프로젝트 선택" /></SelectTrigger>
                    <SelectContent>
                      {projects.data?.map(p => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>발주서 제목 *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>납품 요청일</Label><Input type="date" value={form.requiredDate} onChange={e => setForm(f => ({ ...f, requiredDate: e.target.value }))} /></div>
                <div><Label>납품 주소</Label><Input value={form.deliveryAddress} onChange={e => setForm(f => ({ ...f, deliveryAddress: e.target.value }))} /></div>
              </div>

              {/* 발주 항목 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>발주 항목</Label>
                  <Button size="sm" variant="outline" onClick={addItem}><Plus className="w-3 h-3 mr-1" />항목 추가</Button>
                </div>
                <div className="space-y-3">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">항목 {idx + 1}</span>
                        {form.items.length > 1 && (
                          <Button size="sm" variant="ghost" className="h-6 text-red-500" onClick={() => removeItem(idx)}>삭제</Button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">공종 *</Label>
                          <Select value={item.tradeCategoryId ? String(item.tradeCategoryId) : undefined} onValueChange={v => updateItem(idx, "tradeCategoryId", parseInt(v))}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="공종" /></SelectTrigger>
                            <SelectContent>
                              {trades.data?.map(t => (
                                <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div><Label className="text-xs">품목 설명</Label><Input className="h-8 text-sm" value={item.description} onChange={e => updateItem(idx, "description", e.target.value)} /></div>
                        <div><Label className="text-xs">규격</Label><Input className="h-8 text-sm" value={item.specification} onChange={e => updateItem(idx, "specification", e.target.value)} /></div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div><Label className="text-xs">단위</Label><Input className="h-8 text-sm" value={item.unit} onChange={e => updateItem(idx, "unit", e.target.value)} /></div>
                        <div><Label className="text-xs">수량</Label><Input className="h-8 text-sm" type="number" value={item.quantity} onChange={e => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)} /></div>
                        <div><Label className="text-xs">예상 단가</Label><Input className="h-8 text-sm" type="number" value={item.estimatedUnitPrice} onChange={e => updateItem(idx, "estimatedUnitPrice", parseFloat(e.target.value) || 0)} /></div>
                        <div><Label className="text-xs">예상 금액</Label><Input className="h-8 text-sm" value={item.estimatedAmount.toLocaleString()} readOnly /></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-right mt-2 font-semibold">
                  예상 합계: {totalEstimate.toLocaleString()}원
                </div>
              </div>

              {/* 자동 매칭 업체 미리보기 */}
              {tradeCategoryIds.length > 0 && autoMatch.data && autoMatch.data.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-blue-700 mb-2">자동 매칭 업체 ({autoMatch.data.length}개)</p>
                  <div className="flex flex-wrap gap-2">
                    {autoMatch.data.map((m: any, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {m.companyName} ({m.tradeName})
                        {m.isPrimary ? " ★" : ""}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button className="w-full" onClick={() => {
                if (!form.projectId || !form.title) { toast.error("프로젝트와 제목은 필수입니다."); return; }
                createPO.mutate({
                  ...form,
                  estimatedTotal: String(totalEstimate),
                  requiredDate: form.requiredDate || undefined,
                  deliveryAddress: form.deliveryAddress || undefined,
                  notes: form.notes || undefined,
                });
              }} disabled={createPO.isPending}>
                {createPO.isPending ? "생성 중..." : "발주서 생성"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 발주서 목록 */}
      <div className="space-y-2">
        {pos.data?.map(po => (
          <Card key={po.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{po.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {po.poNumber} · {po.authorName} · {new Date(po.createdAt).toLocaleDateString("ko-KR")}
                    {po.estimatedTotal && ` · ${Number(po.estimatedTotal).toLocaleString()}원`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={PO_STATUS[po.status]?.color}>{PO_STATUS[po.status]?.label}</Badge>
                  {po.status === "draft" && (
                    <Button size="sm" variant="outline" onClick={() => { setSelectedPO(po.id); setOpenRfq(true); }}>
                      <Send className="w-3 h-3 mr-1" />견적요청
                    </Button>
                  )}
                  {po.status === "rfq_sent" && (
                    <Button size="sm" variant="outline" onClick={() => setSelectedPO(po.id)}>
                      <Eye className="w-3 h-3 mr-1" />견적 확인
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {!pos.data?.length && (
          <div className="text-center py-12 text-muted-foreground">발주서가 없습니다.</div>
        )}
      </div>

      {/* 견적요청 발송 다이얼로그 */}
      <Dialog open={openRfq} onOpenChange={(o) => { if (!o) { setOpenRfq(false); setRfqSubIds([]); setSearchQuery(""); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>견적요청 발송</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            {/* 자동 매칭 업체 */}
            {selectedPO && (() => {
              const po = pos.data?.find(p => p.id === selectedPO);
              const poTradeIds = [...new Set((po?.items as any[] || []).map((i: any) => i.tradeCategoryId).filter(Boolean))];
              return (
                <AutoMatchSection
                  tradeCategoryIds={poTradeIds}
                  rfqSubIds={rfqSubIds}
                  toggleRfqSub={toggleRfqSub}
                />
              );
            })()}

            {/* 수동 검색 */}
            <div>
              <Label>업체 검색 (카테고리/업체명)</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="업체명 또는 공종으로 검색..."
                />
                <Button variant="outline" size="sm"><Search className="w-4 h-4" /></Button>
              </div>
              {searchResult.data && searchResult.data.length > 0 && (
                <div className="mt-2 space-y-1">
                  {searchResult.data.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-2 border rounded text-sm">
                      <span>{s.companyName} ({s.specialty || "공종 미지정"})</span>
                      <Button
                        size="sm"
                        variant={rfqSubIds.includes(s.id) ? "default" : "outline"}
                        className="h-7"
                        onClick={() => toggleRfqSub(s.id)}
                      >
                        {rfqSubIds.includes(s.id) ? "선택됨" : "선택"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 선택된 업체 */}
            {rfqSubIds.length > 0 && (
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-green-700">선택된 업체: {rfqSubIds.length}개</p>
              </div>
            )}

            <Button className="w-full" onClick={() => {
              if (!selectedPO || rfqSubIds.length === 0) { toast.error("발송할 업체를 선택하세요."); return; }
              const po = pos.data?.find(p => p.id === selectedPO);
              const itemIds = (po?.items as any[] || []).map((i: any) => i.id);
              sendRfq.mutate({ purchaseOrderId: selectedPO, subcontractorIds: rfqSubIds, itemIds });
            }} disabled={sendRfq.isPending}>
              <Send className="w-4 h-4 mr-1" />{sendRfq.isPending ? "발송 중..." : `${rfqSubIds.length}개 업체에 견적요청 발송`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 견적 확인 다이얼로그 */}
      <Dialog open={!!selectedPO && !openRfq} onOpenChange={(o) => { if (!o) setSelectedPO(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>견적 현황</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            {rfqList.data?.map((r: any) => (
              <Card key={r.rfq.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{r.companyName}</p>
                      <p className="text-sm text-muted-foreground">{r.contactName} · {r.contactEmail}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{r.rfq.status === "quoted" ? "견적 제출" : r.rfq.status === "sent" ? "발송됨" : r.rfq.status === "viewed" ? "열람" : r.rfq.status}</Badge>
                      {r.rfq.quotedTotal && <p className="text-sm font-semibold mt-1">{Number(r.rfq.quotedTotal).toLocaleString()}원</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!rfqList.data?.length && <p className="text-center text-muted-foreground py-6">견적요청 내역이 없습니다.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Auto match section component
function AutoMatchSection({ tradeCategoryIds, rfqSubIds, toggleRfqSub }: {
  tradeCategoryIds: number[];
  rfqSubIds: number[];
  toggleRfqSub: (id: number) => void;
}) {
  const autoMatch = trpc.ops.purchaseOrder.autoMatch.useQuery(
    { tradeCategoryIds },
    { enabled: tradeCategoryIds.length > 0 }
  );

  if (!autoMatch.data || autoMatch.data.length === 0) return null;

  return (
    <div>
      <Label>자동 매칭 업체 (공종별)</Label>
      <div className="mt-2 space-y-1">
        {autoMatch.data.map((m: any, i: number) => (
          <div key={i} className="flex items-center justify-between p-2 border rounded text-sm">
            <span>
              {m.companyName} <Badge variant="outline" className="ml-1 text-xs">{m.tradeName}</Badge>
              {m.isPrimary ? <Badge className="ml-1 text-xs bg-amber-100 text-amber-700">주력</Badge> : null}
            </span>
            <Button
              size="sm"
              variant={rfqSubIds.includes(m.subcontractorId) ? "default" : "outline"}
              className="h-7"
              onClick={() => toggleRfqSub(m.subcontractorId)}
            >
              {rfqSubIds.includes(m.subcontractorId) ? "선택됨" : "선택"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ TRADE CATEGORIES TAB ============
function TradeCategoriesTab() {
  const trades = trpc.ops.trade.list.useQuery();
  const utils = trpc.useUtils();
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", description: "" });

  const createTrade = trpc.ops.trade.create.useMutation({
    onSuccess: () => {
      utils.ops.trade.list.invalidate();
      setOpenCreate(false);
      setForm({ name: "", code: "", description: "" });
      toast.success("공종이 등록되었습니다.");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">공종 분류 관리</h3>
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" />공종 추가</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>공종 추가</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div><Label>공종명 *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="예: 전기공사" /></div>
              <div><Label>코드 *</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="예: ELEC" /></div>
              <div><Label>설명</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
              <Button className="w-full" onClick={() => {
                if (!form.name || !form.code) { toast.error("공종명과 코드는 필수입니다."); return; }
                createTrade.mutate(form);
              }} disabled={createTrade.isPending}>{createTrade.isPending ? "등록 중..." : "공종 등록"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {trades.data?.map(t => (
          <Card key={t.id}>
            <CardContent className="p-3 text-center">
              <p className="font-medium">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.code}</p>
            </CardContent>
          </Card>
        ))}
        {!trades.data?.length && <p className="col-span-full text-center text-muted-foreground py-8">등록된 공종이 없습니다.</p>}
      </div>
    </div>
  );
}

// ============ 거래처 계좌 등록부 (STAFF_UI 4) ============
const EMPTY_VENDOR = { name: "", category: "", businessNumber: "", bankName: "", accountHolder: "", accountNumber: "", contactName: "", contactPhone: "", notes: "", bankbookUrl: "", businessCertUrl: "" };

function VendorsTab() {
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "master" || (user as any)?.department === "management";
  const vendors = trpc.ops.vendor.list.useQuery();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_VENDOR });
  const [uploading, setUploading] = useState<"bankbook" | "cert" | null>(null);
  const bankbookRef = useRef<HTMLInputElement>(null);
  const certRef = useRef<HTMLInputElement>(null);

  const reset = () => { setForm({ ...EMPTY_VENDOR }); setEditingId(null); };

  const handleVendorFile = async (kind: "bankbook" | "cert", file?: File | null) => {
    if (!file) return;
    setUploading(kind);
    try {
      const { url } = await uploadFile(file, kind === "bankbook" ? "bankbook" : "bizcert");
      setForm(f => ({ ...f, [kind === "bankbook" ? "bankbookUrl" : "businessCertUrl"]: url }));
      toast.success("파일이 첨부되었습니다.");
    } catch (e: any) { toast.error(e?.message ?? "업로드 실패"); }
    finally { setUploading(null); }
  };

  const createVendor = trpc.ops.vendor.create.useMutation({
    onSuccess: () => { utils.ops.vendor.list.invalidate(); setOpenForm(false); reset(); toast.success("거래처가 등록되었습니다."); },
    onError: (e) => toast.error(e.message),
  });
  const updateVendor = trpc.ops.vendor.update.useMutation({
    onSuccess: () => { utils.ops.vendor.list.invalidate(); setOpenForm(false); reset(); toast.success("거래처가 수정되었습니다."); },
    onError: (e) => toast.error(e.message),
  });
  const deleteVendor = trpc.ops.vendor.delete.useMutation({
    onSuccess: () => { utils.ops.vendor.list.invalidate(); toast.success("거래처가 삭제되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => { reset(); setOpenForm(true); };
  const openEdit = (v: any) => {
    setEditingId(v.id);
    setForm({
      name: v.name ?? "", category: v.category ?? "", businessNumber: v.businessNumber ?? "",
      bankName: v.bankName ?? "", accountHolder: v.accountHolder ?? "", accountNumber: v.accountNumber ?? "",
      contactName: v.contactName ?? "", contactPhone: v.contactPhone ?? "", notes: v.notes ?? "",
      bankbookUrl: v.bankbookUrl ?? "", businessCertUrl: v.businessCertUrl ?? "",
    });
    setOpenForm(true);
  };
  const submit = () => {
    if (!form.name.trim()) { toast.error("거래처명은 필수입니다."); return; }
    const payload: any = { ...form };
    Object.keys(payload).forEach(k => { if (payload[k] === "") payload[k] = undefined; });
    if (editingId) updateVendor.mutate({ id: editingId, ...payload });
    else createVendor.mutate(payload);
  };

  const filtered = (vendors.data ?? []).filter((v: any) =>
    !search || v.name?.toLowerCase().includes(search.toLowerCase()) || v.category?.toLowerCase().includes(search.toLowerCase()) || v.accountHolder?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="font-semibold flex items-center gap-2"><Landmark className="w-4 h-4" />거래처 계좌 등록부</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="거래처·예금주 검색" className="pl-8 h-9 w-48" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {canEdit && <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />거래처 추가</Button>}
        </div>
      </div>

      {!canEdit && <p className="text-xs text-muted-foreground">계좌 정보 열람만 가능합니다. 등록·수정은 경영지원/관리자 권한이 필요합니다.</p>}

      {vendors.isLoading ? (
        <p className="text-center text-muted-foreground py-8">로딩 중...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">{(vendors.data?.length ?? 0) === 0 ? "등록된 거래처가 없습니다." : "검색 결과가 없습니다."}</p>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">거래처명</th>
                <th className="px-3 py-2 text-left font-medium">분류</th>
                <th className="px-3 py-2 text-left font-medium">은행</th>
                <th className="px-3 py-2 text-left font-medium">예금주</th>
                <th className="px-3 py-2 text-left font-medium">계좌번호</th>
                <th className="px-3 py-2 text-left font-medium">연락처</th>
                <th className="px-3 py-2 text-left font-medium">첨부</th>
                <th className="px-3 py-2 text-left font-medium">평가</th>
                {canEdit && <th className="px-3 py-2 w-20"></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v: any) => (
                <tr key={v.id} className="border-t hover:bg-accent/30">
                  <td className="px-3 py-2 font-medium">{v.name}</td>
                  <td className="px-3 py-2">{v.category ? <Badge variant="outline" className="text-[11px]">{v.category}</Badge> : "-"}</td>
                  <td className="px-3 py-2">{v.bankName ?? "-"}</td>
                  <td className="px-3 py-2">{v.accountHolder ?? "-"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{v.accountNumber ?? "-"}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{v.contactPhone ?? v.contactName ?? "-"}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      {v.bankbookUrl && <a href={v.bankbookUrl} target="_blank" rel="noreferrer" title="통장사본"><Badge variant="outline" className="text-[10px] hover:bg-accent">통장</Badge></a>}
                      {v.businessCertUrl && <a href={v.businessCertUrl} target="_blank" rel="noreferrer" title="사업자등록증"><Badge variant="outline" className="text-[10px] hover:bg-accent">사업자</Badge></a>}
                      {!v.bankbookUrl && !v.businessCertUrl && <span className="text-xs text-muted-foreground">-</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {v.evalCount > 0 ? (
                      <Badge className={`text-[11px] ${v.evalAvg >= 80 ? "bg-emerald-100 text-emerald-700" : v.evalAvg >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`} variant="secondary">{v.evalAvg}점 <span className="opacity-60 ml-1">({v.evalCount})</span></Badge>
                    ) : <span className="text-xs text-muted-foreground">-</span>}
                  </td>
                  {canEdit && (
                    <td className="px-3 py-2">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(v)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => { if (confirm(`'${v.name}' 거래처를 삭제할까요?`)) deleteVendor.mutate({ id: v.id }); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={openForm} onOpenChange={(o) => { setOpenForm(o); if (!o) reset(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "거래처 수정" : "거래처 등록"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <div className="sm:col-span-2"><Label>거래처명 *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="예: 대한사무용가구" /></div>
            <div><Label>분류</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="예: 가구/전기/도장" /></div>
            <div><Label>사업자번호</Label><Input value={form.businessNumber} onChange={e => setForm(f => ({ ...f, businessNumber: e.target.value }))} /></div>
            <div><Label>은행</Label><Input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} placeholder="예: 국민은행" /></div>
            <div><Label>예금주</Label><Input value={form.accountHolder} onChange={e => setForm(f => ({ ...f, accountHolder: e.target.value }))} /></div>
            <div className="sm:col-span-2"><Label>계좌번호</Label><Input value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} placeholder="숫자만" /></div>
            <div><Label>담당자</Label><Input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} /></div>
            <div><Label>연락처</Label><Input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} /></div>
            <div className="sm:col-span-2"><Label>메모</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            <div className="sm:col-span-2 grid grid-cols-2 gap-3 pt-1 border-t">
              {([
                { kind: "bankbook" as const, label: "통장사본", url: form.bankbookUrl, ref: bankbookRef },
                { kind: "cert" as const, label: "사업자등록증", url: form.businessCertUrl, ref: certRef },
              ]).map(({ kind, label, url, ref }) => (
                <div key={kind} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  <input ref={ref} type="file" accept="image/*,.pdf" className="hidden" onChange={e => { handleVendorFile(kind, e.target.files?.[0]); e.target.value = ""; }} />
                  {url ? (
                    <div className="flex items-center gap-1">
                      <a href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline flex items-center gap-1 truncate flex-1"><Paperclip className="w-3 h-3 shrink-0" />첨부됨</a>
                      <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => ref.current?.click()} disabled={uploading === kind}>교체</Button>
                      <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => setForm(f => ({ ...f, [kind === "bankbook" ? "bankbookUrl" : "businessCertUrl"]: "" }))}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  ) : (
                    <Button type="button" size="sm" variant="outline" className="w-full h-8 text-xs" onClick={() => ref.current?.click()} disabled={uploading === kind}>
                      {uploading === kind ? "업로드 중..." : <><Upload className="w-3.5 h-3.5 mr-1" />파일 선택</>}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="mt-3">
            <Button className="w-full" onClick={submit} disabled={createVendor.isPending || updateVendor.isPending}>
              {createVendor.isPending || updateVendor.isPending ? "저장 중..." : editingId ? "수정 저장" : "거래처 등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ MAIN PAGE ============
export default function OpsPartners() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur sticky top-0 z-30">
        <div className="container py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/ops")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">협력업체 관리</h1>
              <p className="text-xs text-muted-foreground">등록 · 승인 · 계약 · 발주 · 견적요청</p>
            </div>
          </div>
          <NotificationBell />
        </div>
      </div>

      {/* Content */}
      <div className="container py-6">
        <Tabs defaultValue="registrations">
          <TabsList className="w-full grid grid-cols-3 sm:grid-cols-5 mb-6">
            <TabsTrigger value="registrations" className="text-xs sm:text-sm">
              <Building2 className="w-4 h-4 mr-1 hidden sm:inline" />업체 등록
            </TabsTrigger>
            <TabsTrigger value="contracts" className="text-xs sm:text-sm">
              <FileText className="w-4 h-4 mr-1 hidden sm:inline" />계약서
            </TabsTrigger>
            <TabsTrigger value="purchase-orders" className="text-xs sm:text-sm">
              <ShoppingCart className="w-4 h-4 mr-1 hidden sm:inline" />발주/견적
            </TabsTrigger>
            <TabsTrigger value="trades" className="text-xs sm:text-sm">
              <ClipboardList className="w-4 h-4 mr-1 hidden sm:inline" />공종 관리
            </TabsTrigger>
            <TabsTrigger value="vendors" className="text-xs sm:text-sm">
              <Landmark className="w-4 h-4 mr-1 hidden sm:inline" />거래처 계좌
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registrations"><RegistrationTab /></TabsContent>
          <TabsContent value="contracts"><ContractsTab /></TabsContent>
          <TabsContent value="purchase-orders"><PurchaseOrdersTab /></TabsContent>
          <TabsContent value="trades"><TradeCategoriesTab /></TabsContent>
          <TabsContent value="vendors"><VendorsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
