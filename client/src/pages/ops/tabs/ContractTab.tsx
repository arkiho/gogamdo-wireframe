import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Plus, FileSignature } from "lucide-react";
import { toast } from "sonner";

const TYPE_LABELS: Record<string, string> = {
  main: "원도급", subcontract: "하도급", design: "설계", consulting: "컨설팅", other: "기타",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "초안", color: "bg-gray-100 text-gray-600" },
  reviewing: { label: "검토중", color: "bg-amber-100 text-amber-700" },
  signed: { label: "체결", color: "bg-green-100 text-green-700" },
  amended: { label: "변경", color: "bg-blue-100 text-blue-700" },
  terminated: { label: "해지", color: "bg-red-100 text-red-700" },
};

export default function ContractTab({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", contractType: "main", partyName: "", contractAmount: "",
    startDate: "", endDate: "", description: "", fileUrl: "",
  });

  const contracts = trpc.ops.contract.list.useQuery({ projectId });
  const createContract = trpc.ops.contract.create.useMutation({
    onSuccess: () => {
      contracts.refetch();
      setOpen(false);
      setForm({ title: "", contractType: "main", partyName: "", contractAmount: "", startDate: "", endDate: "", description: "", fileUrl: "" });
      toast.success("계약서가 등록되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!form.title || !form.partyName || !form.contractAmount) {
      toast.error("제목, 계약 상대방, 계약금액은 필수입니다.");
      return;
    }
    createContract.mutate({
      projectId,
      title: form.title,
      contractType: form.contractType,
      partyName: form.partyName,
      contractAmount: form.contractAmount,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      description: form.description || undefined,
      fileUrl: form.fileUrl || undefined,
    });
  };

  const totalContractAmount = contracts.data?.reduce((sum, c) => sum + Number(c.contractAmount), 0) ?? 0;

  return (
    <div className="space-y-4">
      {/* 요약 - 모바일 반응형 */}
      <Card>
        <CardContent className="pt-3 pb-2 sm:pt-4 sm:pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">총 계약금액</p>
              <p className="text-base sm:text-xl font-bold">{totalContractAmount.toLocaleString()}원</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] sm:text-xs text-muted-foreground">계약 건수</p>
              <p className="text-base sm:text-xl font-bold">{contracts.data?.length ?? 0}건</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <FileSignature className="w-5 h-5" />계약서
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-1" />계약서 등록</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>계약서 등록</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div>
                  <Label>제목 *</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="예: 원도급 계약서" className="h-11 sm:h-9" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>계약 유형</Label>
                    <Select value={form.contractType} onValueChange={v => setForm(f => ({ ...f, contractType: v }))}>
                      <SelectTrigger className="h-11 sm:h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(TYPE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>계약금액 (원) *</Label>
                    <Input value={form.contractAmount} onChange={e => setForm(f => ({ ...f, contractAmount: e.target.value }))} placeholder="100000000" className="h-11 sm:h-9" />
                  </div>
                </div>
                <div>
                  <Label>계약 상대방 *</Label>
                  <Input value={form.partyName} onChange={e => setForm(f => ({ ...f, partyName: e.target.value }))} placeholder="계약 상대방 회사명" className="h-11 sm:h-9" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>시작일</Label>
                    <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="h-11 sm:h-9" />
                  </div>
                  <div>
                    <Label>종료일</Label>
                    <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="h-11 sm:h-9" />
                  </div>
                </div>
                <div>
                  <Label>설명</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="계약 상세 설명" rows={3} />
                </div>
                <Button onClick={handleCreate} className="w-full h-12 sm:h-9 text-base sm:text-sm" disabled={createContract.isPending}>
                  {createContract.isPending ? "등록 중..." : "계약서 등록"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {contracts.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : !contracts.data?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileSignature className="w-10 h-10 mx-auto opacity-30 mb-2" />
              계약서가 없습니다.
            </div>
          ) : (
            <>
              {/* 데스크톱: 테이블 */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">제목</th>
                      <th className="text-left py-2 px-3 font-medium">유형</th>
                      <th className="text-left py-2 px-3 font-medium">상대방</th>
                      <th className="text-right py-2 px-3 font-medium">금액</th>
                      <th className="text-left py-2 px-3 font-medium">기간</th>
                      <th className="text-left py-2 px-3 font-medium">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.data.map(c => {
                      const s = STATUS_LABELS[c.status] ?? STATUS_LABELS.draft;
                      return (
                        <tr key={c.id} className="border-b hover:bg-accent/30">
                          <td className="py-2.5 px-3 font-medium">{c.title}</td>
                          <td className="py-2.5 px-3">
                            <Badge variant="outline" className="text-xs">{TYPE_LABELS[c.contractType] ?? c.contractType}</Badge>
                          </td>
                          <td className="py-2.5 px-3">{c.partyName}</td>
                          <td className="py-2.5 px-3 text-right font-semibold">{Number(c.contractAmount).toLocaleString()}원</td>
                          <td className="py-2.5 px-3 text-muted-foreground text-xs">
                            {c.startDate ? `${c.startDate} ~ ${c.endDate || "미정"}` : "-"}
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge className={`text-xs ${s.color} border-0`}>{s.label}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 모바일: 카드형 */}
              <div className="sm:hidden space-y-2">
                {contracts.data.map(c => {
                  const s = STATUS_LABELS[c.status] ?? STATUS_LABELS.draft;
                  return (
                    <div key={c.id} className="border rounded-lg p-3 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-sm">{c.title}</span>
                        <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[c.contractType] ?? c.contractType}</Badge>
                        <Badge className={`text-[10px] ${s.color} border-0`}>{s.label}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{c.partyName}</span>
                        <span className="font-semibold">{Number(c.contractAmount).toLocaleString()}원</span>
                      </div>
                      {c.startDate && (
                        <p className="text-[10px] text-muted-foreground">{c.startDate} ~ {c.endDate || "미정"}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
