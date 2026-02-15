import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Plus, Users, Building, Phone, Mail, CheckCircle, Copy } from "lucide-react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  invited: { label: "초대됨", color: "bg-blue-100 text-blue-700" },
  active: { label: "활성", color: "bg-green-100 text-green-700" },
  completed: { label: "완료", color: "bg-gray-100 text-gray-600" },
  suspended: { label: "중지", color: "bg-red-100 text-red-700" },
};

const TRADE_LABELS: Record<string, string> = {
  demolition: "철거", framing: "골조", electrical: "전기",
  plumbing: "설비", hvac: "공조", flooring: "바닥",
  ceiling: "천장", painting: "도장", furniture: "가구",
  it_network: "IT/네트워크", fire_safety: "소방", cleaning: "클리닝", other: "기타",
};

export default function SubcontractorTab({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    companyName: "", trade: "other", contactName: "",
    contactPhone: "", contactEmail: "", contractAmount: "",
  });

  const subs = trpc.ops.subcontractor.list.useQuery({ projectId });
  const createSub = trpc.ops.subcontractor.create.useMutation({
    onSuccess: () => {
      subs.refetch();
      setOpen(false);
      setForm({ companyName: "", trade: "other", contactName: "", contactPhone: "", contactEmail: "", contractAmount: "" });
      toast.success("하도급 업체가 등록되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  const approveSub = trpc.ops.subcontractor.approve.useMutation({
    onSuccess: () => {
      subs.refetch();
      toast.success("처리되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!form.companyName) {
      toast.error("업체명은 필수입니다.");
      return;
    }
    createSub.mutate({
      projectId,
      companyName: form.companyName,
      trade: form.trade,
      contactName: form.contactName || undefined,
      contactPhone: form.contactPhone || undefined,
      contactEmail: form.contactEmail || undefined,
      contractAmount: form.contractAmount || undefined,
    });
  };

  const handleCopyInviteLink = (subId: string) => {
    const link = `${window.location.origin}/ops/sub-portal/${subId}`;
    navigator.clipboard.writeText(link);
    toast.success("하도급 업체 포털 링크가 복사되었습니다.");
  };

  return (
    <Card>
      <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Users className="w-5 h-5" />하도급 관리
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-1" />업체 등록</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>하도급 업체 등록</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label>업체명 *</Label>
                <Input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} placeholder="업체명" className="h-11 sm:h-9" />
              </div>
              <div>
                <Label>공종</Label>
                <Select value={form.trade} onValueChange={v => setForm(f => ({ ...f, trade: v }))}>
                  <SelectTrigger className="h-11 sm:h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRADE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>담당자</Label>
                  <Input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} placeholder="담당자명" className="h-11 sm:h-9" />
                </div>
                <div>
                  <Label>연락처</Label>
                  <Input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} placeholder="010-0000-0000" className="h-11 sm:h-9" />
                </div>
              </div>
              <div>
                <Label>이메일</Label>
                <Input value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="email@company.com" className="h-11 sm:h-9" />
              </div>
              <div>
                <Label>계약금액 (원)</Label>
                <Input value={form.contractAmount} onChange={e => setForm(f => ({ ...f, contractAmount: e.target.value }))} placeholder="10000000" className="h-11 sm:h-9" />
              </div>
              <Button onClick={handleCreate} className="w-full h-12 sm:h-9 text-base sm:text-sm" disabled={createSub.isPending}>
                {createSub.isPending ? "등록 중..." : "업체 등록"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {subs.isLoading ? (
          <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
        ) : !subs.data?.length ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto opacity-30 mb-2" />
            등록된 하도급 업체가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {subs.data.map(s => {
              const st = STATUS_LABELS[s.status] ?? STATUS_LABELS.invited;
              return (
                <div key={s.id} className="p-3 sm:p-4 border rounded-lg hover:bg-accent/30 active:bg-accent/50 transition-colors">
                  {/* 상단: 업체명 + 배지 */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <Building className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <h4 className="font-semibold text-sm sm:text-base">{s.companyName}</h4>
                      <Badge variant="outline" className="text-[10px] sm:text-xs">{TRADE_LABELS[s.trade] ?? s.trade}</Badge>
                      <Badge className={`text-[10px] sm:text-xs ${st.color} border-0`}>{st.label}</Badge>
                    </div>
                    {/* 액션 버튼 - 모바일에서 풀 너비 */}
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button size="sm" variant="ghost" className="flex-1 sm:flex-initial h-9 sm:h-8" onClick={() => handleCopyInviteLink(s.id)}>
                        <Copy className="w-3.5 h-3.5 mr-1" />링크 복사
                      </Button>
                      {s.status === "invited" && (
                        <Button size="sm" variant="outline" className="flex-1 sm:flex-initial text-green-600 h-9 sm:h-8" onClick={() => approveSub.mutate({ id: s.id, action: "activate" })}>
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />활성화
                        </Button>
                      )}
                    </div>
                  </div>
                  {/* 연락처 정보 - 모바일에서 세로 스택 */}
                  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    {s.contactName && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{s.contactName}</span>}
                    {s.contactPhone && (
                      <a href={`tel:${s.contactPhone}`} className="flex items-center gap-1 text-blue-600 sm:text-muted-foreground">
                        <Phone className="w-3 h-3" />{s.contactPhone}
                      </a>
                    )}
                    {s.contactEmail && (
                      <a href={`mailto:${s.contactEmail}`} className="flex items-center gap-1 text-blue-600 sm:text-muted-foreground truncate">
                        <Mail className="w-3 h-3 flex-shrink-0" />{s.contactEmail}
                      </a>
                    )}
                    {s.contractAmount && <span className="font-medium text-foreground">{Number(s.contractAmount).toLocaleString()}원</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
