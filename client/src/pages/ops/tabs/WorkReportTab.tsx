import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Plus, FileText, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function WorkReportTab({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    reportDate: new Date().toISOString().split("T")[0],
    title: "", content: "", workerCount: "0", issues: "",
  });

  const reports = trpc.ops.workReport.list.useQuery({ projectId });
  const createReport = trpc.ops.workReport.create.useMutation({
    onSuccess: () => {
      reports.refetch();
      setOpen(false);
      setForm({ reportDate: new Date().toISOString().split("T")[0], title: "", content: "", workerCount: "0", issues: "" });
      toast.success("작업보고서가 등록되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!form.title || !form.content) {
      toast.error("제목과 내용은 필수입니다.");
      return;
    }
    createReport.mutate({
      projectId,
      reportDate: form.reportDate,
      title: form.title,
      content: form.content,
      workerCount: parseInt(form.workerCount) || 0,
      issues: form.issues || undefined,
    });
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />작업보고서
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" />보고서 작성</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>작업보고서 작성</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>보고일 *</Label>
                  <Input type="date" value={form.reportDate} onChange={e => setForm(f => ({ ...f, reportDate: e.target.value }))} />
                </div>
                <div>
                  <Label>투입 인원</Label>
                  <Input type="number" min="0" value={form.workerCount} onChange={e => setForm(f => ({ ...f, workerCount: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>제목 *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="예: 2층 바닥 시공 완료" />
              </div>
              <div>
                <Label>작업 내용 *</Label>
                <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="금일 작업 내용을 상세히 기록해주세요." rows={5} />
              </div>
              <div>
                <Label>특이사항 / 이슈</Label>
                <Textarea value={form.issues} onChange={e => setForm(f => ({ ...f, issues: e.target.value }))} placeholder="문제 발생 시 기록" rows={3} />
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={createReport.isPending}>
                {createReport.isPending ? "등록 중..." : "보고서 등록"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {reports.isLoading ? (
          <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
        ) : !reports.data?.length ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto opacity-30 mb-2" />
            작업보고서가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {reports.data.map(r => (
              <div key={r.id} className="p-4 border rounded-lg hover:bg-accent/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{r.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="w-3 h-3 mr-1" />{r.reportDate}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">투입 {r.workerCount}명</span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.content}</p>
                {r.issues && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                    ⚠️ {r.issues}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
