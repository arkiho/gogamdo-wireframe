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
import { Plus, FileText, Calendar, Users } from "lucide-react";
import { toast } from "sonner";

const TYPE_LABELS: Record<string, string> = {
  kickoff: "킥오프", weekly: "주간회의", design_review: "설계검토",
  site_meeting: "현장회의", client_meeting: "고객미팅", other: "기타",
};

export default function MeetingTab({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    meetingDate: new Date().toISOString().split("T")[0],
    meetingType: "weekly",
    title: "", attendees: "", agenda: "", decisions: "", actionItems: "",
  });

  const meetings = trpc.ops.meeting.list.useQuery({ projectId });
  const createMeeting = trpc.ops.meeting.create.useMutation({
    onSuccess: () => {
      meetings.refetch();
      setOpen(false);
      setForm({ meetingDate: new Date().toISOString().split("T")[0], meetingType: "weekly", title: "", attendees: "", agenda: "", decisions: "", actionItems: "" });
      toast.success("회의록이 등록되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!form.title || !form.agenda) {
      toast.error("제목과 안건은 필수입니다.");
      return;
    }
    createMeeting.mutate({
      projectId,
      meetingDate: form.meetingDate,
      meetingType: form.meetingType,
      title: form.title,
      attendees: form.attendees || undefined,
      agenda: form.agenda,
      decisions: form.decisions || undefined,
      actionItems: form.actionItems || undefined,
    });
  };

  return (
    <Card>
      <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />회의록
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-1" />회의록 작성</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>회의록 작성</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>회의일 *</Label>
                  <Input type="date" value={form.meetingDate} onChange={e => setForm(f => ({ ...f, meetingDate: e.target.value }))} className="h-11 sm:h-9" />
                </div>
                <div>
                  <Label>회의 유형</Label>
                  <Select value={form.meetingType} onValueChange={v => setForm(f => ({ ...f, meetingType: v }))}>
                    <SelectTrigger className="h-11 sm:h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TYPE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>제목 *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="회의 제목" className="h-11 sm:h-9" />
              </div>
              <div>
                <Label>참석자</Label>
                <Input value={form.attendees} onChange={e => setForm(f => ({ ...f, attendees: e.target.value }))} placeholder="홍길동, 김철수, 이영희" className="h-11 sm:h-9" />
              </div>
              <div>
                <Label>안건 *</Label>
                <Textarea value={form.agenda} onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))} placeholder="회의 안건을 기록해주세요." rows={4} />
              </div>
              <div>
                <Label>결정사항</Label>
                <Textarea value={form.decisions} onChange={e => setForm(f => ({ ...f, decisions: e.target.value }))} placeholder="회의에서 결정된 사항" rows={3} />
              </div>
              <div>
                <Label>후속 조치 (Action Items)</Label>
                <Textarea value={form.actionItems} onChange={e => setForm(f => ({ ...f, actionItems: e.target.value }))} placeholder="담당자별 후속 조치 사항" rows={3} />
              </div>
              <Button onClick={handleCreate} className="w-full h-12 sm:h-9 text-base sm:text-sm" disabled={createMeeting.isPending}>
                {createMeeting.isPending ? "등록 중..." : "회의록 등록"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {meetings.isLoading ? (
          <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
        ) : !meetings.data?.length ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto opacity-30 mb-2" />
            회의록이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {meetings.data.map(m => (
              <div key={m.id} className="p-3 sm:p-4 border rounded-lg hover:bg-accent/30 active:bg-accent/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h4 className="font-semibold text-sm sm:text-base">{m.title}</h4>
                    <Badge variant="outline" className="text-[10px] sm:text-xs">{TYPE_LABELS[m.meetingType] ?? m.meetingType}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />{m.meetingDate}
                  </span>
                </div>
                {m.attendees && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <Users className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{m.attendees}</span>
                  </div>
                )}
                <div className="text-xs sm:text-sm space-y-2">
                  <div>
                    <span className="font-medium text-[10px] sm:text-xs text-muted-foreground">안건</span>
                    <p className="whitespace-pre-wrap line-clamp-3 sm:line-clamp-none">{m.agenda}</p>
                  </div>
                  {m.decisions && (
                    <div className="p-2 bg-green-50 rounded">
                      <span className="font-medium text-[10px] sm:text-xs text-green-700">결정사항</span>
                      <p className="text-green-800 whitespace-pre-wrap">{m.decisions}</p>
                    </div>
                  )}
                  {m.actionItems && (
                    <div className="p-2 bg-blue-50 rounded">
                      <span className="font-medium text-[10px] sm:text-xs text-blue-700">후속 조치</span>
                      <p className="text-blue-800 whitespace-pre-wrap">{m.actionItems}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
