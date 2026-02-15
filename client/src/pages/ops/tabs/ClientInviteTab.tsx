import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Plus, UserPlus, Copy, Link2, Mail, Eye, EyeOff, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const PERMISSION_LABELS: Record<string, string> = {
  view_progress: "공정 현황 열람",
  view_reports: "보고서 열람",
  view_photos: "현장 사진 열람",
  view_camera: "실시간 카메라",
  view_all: "전체 열람",
};

export default function ClientInviteTab({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    clientName: "", clientEmail: "", clientPhone: "",
    companyName: "", permission: "view_progress",
  });

  const invites = trpc.ops.clientInvite.list.useQuery({ projectId });
  const createInvite = trpc.ops.clientInvite.create.useMutation({
    onSuccess: () => {
      invites.refetch();
      setOpen(false);
      setForm({ clientName: "", clientEmail: "", clientPhone: "", companyName: "", permission: "view_progress" });
      toast.success("고객사 초대 링크가 생성되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleInvite = trpc.ops.clientInvite.toggle.useMutation({
    onSuccess: () => {
      invites.refetch();
      toast.success("초대 상태가 변경되었습니다.");
    },
  });

  const handleCreate = () => {
    if (!form.clientName) {
      toast.error("고객명은 필수입니다.");
      return;
    }
    createInvite.mutate({
      projectId,
      clientName: form.clientName,
      clientEmail: form.clientEmail || undefined,
      clientPhone: form.clientPhone || undefined,
      companyName: form.companyName || undefined,
      permission: form.permission,
    });
  };

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/ops/client-view/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("고객 열람 링크가 복사되었습니다.");
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <UserPlus className="w-5 h-5" />고객사 초대
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" />초대 생성</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>고객사 초대 링크 생성</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label>고객명 *</Label>
                <Input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} placeholder="담당자명" />
              </div>
              <div>
                <Label>회사명</Label>
                <Input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} placeholder="고객사명" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>이메일</Label>
                  <Input value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} placeholder="email@company.com" />
                </div>
                <div>
                  <Label>연락처</Label>
                  <Input value={form.clientPhone} onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))} placeholder="010-0000-0000" />
                </div>
              </div>
              <div>
                <Label>열람 권한</Label>
                <Select value={form.permission} onValueChange={v => setForm(f => ({ ...f, permission: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PERMISSION_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={createInvite.isPending}>
                {createInvite.isPending ? "생성 중..." : "초대 링크 생성"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {invites.isLoading ? (
          <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
        ) : !invites.data?.length ? (
          <div className="text-center py-12 text-muted-foreground">
            <UserPlus className="w-10 h-10 mx-auto opacity-30 mb-2" />
            초대된 고객사가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {invites.data.map(inv => (
              <div key={inv.id} className="p-4 border rounded-lg hover:bg-accent/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{inv.clientName}</h4>
                    {inv.companyName && <span className="text-sm text-muted-foreground">({inv.companyName})</span>}
                    <Badge variant="outline" className="text-xs">{PERMISSION_LABELS[inv.permission] ?? inv.permission}</Badge>
                    <Badge className={`text-xs border-0 ${inv.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {inv.isActive ? "활성" : "비활성"}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleCopyLink(inv.token)}>
                      <Copy className="w-3.5 h-3.5 mr-1" />링크 복사
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleInvite.mutate({ id: inv.id, isActive: !inv.isActive })}
                    >
                      {inv.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {inv.clientEmail && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{inv.clientEmail}</span>}
                  <span>생성: {new Date(inv.createdAt).toLocaleDateString()}</span>
                  {inv.lastAccessedAt && <span>최근 접속: {new Date(inv.lastAccessedAt).toLocaleDateString()}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
