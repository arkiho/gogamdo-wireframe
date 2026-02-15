import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Plus, ClipboardList } from "lucide-react";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<string, string> = {
  demolition: "철거", framing: "골조", electrical: "전기",
  plumbing: "설비", hvac: "공조", flooring: "바닥",
  ceiling: "천장", painting: "도장", furniture: "가구",
  it_network: "IT/네트워크", fire_safety: "소방", cleaning: "클리닝", other: "기타",
};

export default function ScheduleTab({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    taskName: "", category: "other", startDate: "", endDate: "",
    assignee: "", progress: "0", sortOrder: "0",
  });

  const schedules = trpc.ops.schedule.list.useQuery({ projectId });
  const createSchedule = trpc.ops.schedule.create.useMutation({
    onSuccess: () => {
      schedules.refetch();
      setOpen(false);
      setForm({ taskName: "", category: "other", startDate: "", endDate: "", assignee: "", progress: "0", sortOrder: "0" });
      toast.success("공정이 추가되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateProgress = trpc.ops.schedule.update.useMutation({
    onSuccess: () => {
      schedules.refetch();
      toast.success("진행률이 업데이트되었습니다.");
    },
  });

  const handleCreate = () => {
    if (!form.taskName || !form.startDate || !form.endDate) {
      toast.error("작업명, 시작일, 종료일은 필수입니다.");
      return;
    }
    createSchedule.mutate({
      projectId,
      taskName: form.taskName,
      category: form.category,
      startDate: form.startDate,
      endDate: form.endDate,
      assignee: form.assignee || undefined,
      progress: parseInt(form.progress) || 0,
      sortOrder: parseInt(form.sortOrder) || 0,
    });
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardList className="w-5 h-5" />공정표
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" />공정 추가</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>공정 추가</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label>작업명 *</Label>
                <Input value={form.taskName} onChange={e => setForm(f => ({ ...f, taskName: e.target.value }))} placeholder="예: 바닥 철거" />
              </div>
              <div>
                <Label>공종</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>시작일 *</Label>
                  <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <Label>종료일 *</Label>
                  <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>담당자</Label>
                  <Input value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))} placeholder="담당자명" />
                </div>
                <div>
                  <Label>진행률 (%)</Label>
                  <Input type="number" min="0" max="100" value={form.progress} onChange={e => setForm(f => ({ ...f, progress: e.target.value }))} />
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={createSchedule.isPending}>
                {createSchedule.isPending ? "추가 중..." : "공정 추가"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {schedules.isLoading ? (
          <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
        ) : !schedules.data?.length ? (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardList className="w-10 h-10 mx-auto opacity-30 mb-2" />
            공정이 없습니다. 공정을 추가해주세요.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">작업명</th>
                  <th className="text-left py-2 px-3 font-medium">공종</th>
                  <th className="text-left py-2 px-3 font-medium">기간</th>
                  <th className="text-left py-2 px-3 font-medium">담당자</th>
                  <th className="text-left py-2 px-3 font-medium w-40">진행률</th>
                </tr>
              </thead>
              <tbody>
                {schedules.data.map(s => (
                  <tr key={s.id} className="border-b hover:bg-accent/30">
                    <td className="py-2.5 px-3 font-medium">{s.taskName}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[s.category] ?? s.category}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">{s.startDate} ~ {s.endDate}</td>
                    <td className="py-2.5 px-3">{s.assignee || "-"}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${s.progress === 100 ? "bg-green-500" : s.progress >= 50 ? "bg-blue-500" : "bg-amber-500"}`}
                            style={{ width: `${s.progress}%` }}
                          />
                        </div>
                        <span className="text-xs w-8 text-right">{s.progress}%</span>
                        <select
                          className="text-xs border rounded px-1 py-0.5"
                          value={s.progress}
                          onChange={e => updateProgress.mutate({ id: s.id, progress: parseInt(e.target.value) })}
                        >
                          {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(v => (
                            <option key={v} value={v}>{v}%</option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
