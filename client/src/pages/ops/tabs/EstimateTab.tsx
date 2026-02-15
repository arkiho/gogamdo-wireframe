import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef } from "react";
import { Plus, FileSpreadsheet, Download } from "lucide-react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "초안", color: "bg-gray-100 text-gray-600" },
  submitted: { label: "제출", color: "bg-blue-100 text-blue-700" },
  reviewing: { label: "검토중", color: "bg-amber-100 text-amber-700" },
  approved: { label: "승인", color: "bg-green-100 text-green-700" },
  rejected: { label: "반려", color: "bg-red-100 text-red-700" },
  revised: { label: "수정", color: "bg-purple-100 text-purple-700" },
};

export default function EstimateTab({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "", version: "1", totalAmount: "", description: "", fileUrl: "",
  });

  const estimates = trpc.ops.estimate.list.useQuery({ projectId });
  const createEstimate = trpc.ops.estimate.create.useMutation({
    onSuccess: () => {
      estimates.refetch();
      setOpen(false);
      setForm({ title: "", version: "1", totalAmount: "", description: "", fileUrl: "" });
      toast.success("견적서가 등록되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("엑셀(.xlsx, .xls) 또는 PDF 파일만 업로드 가능합니다.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/trpc/ops.estimate.upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("업로드 실패");
      const data = await res.json();
      setForm(f => ({ ...f, fileUrl: data.result?.data?.url || "" }));
      toast.success("파일이 업로드되었습니다.");
    } catch {
      toast.error("파일 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = () => {
    if (!form.title || !form.totalAmount) {
      toast.error("제목과 총액은 필수입니다.");
      return;
    }
    createEstimate.mutate({
      projectId,
      title: form.title,
      version: parseInt(form.version) || 1,
      totalAmount: form.totalAmount,
      description: form.description || undefined,
      fileUrl: form.fileUrl || undefined,
    });
  };

  return (
    <Card>
      <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />견적서
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-1" />견적서 등록</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>견적서 등록</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label>제목 *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="예: 1차 견적서" className="h-11 sm:h-9" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>버전</Label>
                  <Input type="number" min="1" value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} className="h-11 sm:h-9" />
                </div>
                <div>
                  <Label>총액 (원) *</Label>
                  <Input value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} placeholder="100000000" className="h-11 sm:h-9" />
                </div>
              </div>
              <div>
                <Label>설명</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="견적 상세 설명" rows={3} />
              </div>
              <div>
                <Label>견적서 파일 (엑셀/PDF)</Label>
                <Input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.pdf"
                  onChange={handleFileUpload}
                  className="h-11 sm:h-9"
                />
                {uploading && <p className="text-xs text-muted-foreground mt-1">업로드 중...</p>}
                {form.fileUrl && <p className="text-xs text-green-600 mt-1">파일 업로드 완료</p>}
              </div>
              <Button onClick={handleCreate} className="w-full h-12 sm:h-9 text-base sm:text-sm" disabled={createEstimate.isPending}>
                {createEstimate.isPending ? "등록 중..." : "견적서 등록"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {estimates.isLoading ? (
          <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
        ) : !estimates.data?.length ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileSpreadsheet className="w-10 h-10 mx-auto opacity-30 mb-2" />
            견적서가 없습니다.
          </div>
        ) : (
          <>
            {/* 데스크톱: 테이블 */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">제목</th>
                    <th className="text-left py-2 px-3 font-medium">버전</th>
                    <th className="text-right py-2 px-3 font-medium">총액</th>
                    <th className="text-left py-2 px-3 font-medium">상태</th>
                    <th className="text-left py-2 px-3 font-medium">등록일</th>
                    <th className="text-right py-2 px-3 font-medium">파일</th>
                  </tr>
                </thead>
                <tbody>
                  {estimates.data.map(e => {
                    const s = STATUS_LABELS[e.status] ?? STATUS_LABELS.draft;
                    return (
                      <tr key={e.id} className="border-b hover:bg-accent/30">
                        <td className="py-2.5 px-3 font-medium">{e.title}</td>
                        <td className="py-2.5 px-3">v{e.version}</td>
                        <td className="py-2.5 px-3 text-right font-semibold">{Number(e.totalAmount).toLocaleString()}원</td>
                        <td className="py-2.5 px-3">
                          <Badge className={`text-xs ${s.color} border-0`}>{s.label}</Badge>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">{new Date(e.createdAt).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3 text-right">
                          {e.fileUrl ? (
                            <Button size="sm" variant="ghost" asChild>
                              <a href={e.fileUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 모바일: 카드형 */}
            <div className="sm:hidden space-y-2">
              {estimates.data.map(e => {
                const s = STATUS_LABELS[e.status] ?? STATUS_LABELS.draft;
                return (
                  <div key={e.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-sm">{e.title}</span>
                        <Badge variant="outline" className="text-[10px]">v{e.version}</Badge>
                        <Badge className={`text-[10px] ${s.color} border-0`}>{s.label}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{new Date(e.createdAt).toLocaleDateString()}</span>
                      <span className="font-semibold">{Number(e.totalAmount).toLocaleString()}원</span>
                    </div>
                    {e.fileUrl && (
                      <Button size="sm" variant="outline" className="w-full h-9" asChild>
                        <a href={e.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="w-3.5 h-3.5 mr-1" />파일 다운로드
                        </a>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
