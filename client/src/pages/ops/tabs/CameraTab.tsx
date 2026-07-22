import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Plus, Camera, Video, Wifi, WifiOff, Maximize2, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";

const EMPTY = { name: "", location: "", viewerUrl: "", streamUrl: "", simInfo: "", notes: "" };

/** http(s)로 임베드/재생 가능한 URL인지 (RTSP는 브라우저 재생 불가) */
function isEmbeddable(url?: string | null): boolean {
  return !!url && /^https?:\/\//i.test(url);
}

export default function CameraTab({ projectId }: { projectId: string }) {
  const numericProjectId = Number(projectId);
  const [open, setOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY });

  const cameras = trpc.ops.camera.list.useQuery({ projectId: numericProjectId });
  const deleteCamera = trpc.ops.camera.delete.useMutation({
    onSuccess: () => {
      cameras.refetch();
      setSelectedCamera(null);
      toast.success("카메라가 삭제되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });
  const createCamera = trpc.ops.camera.create.useMutation({
    onSuccess: () => {
      cameras.refetch();
      setOpen(false);
      setForm({ ...EMPTY });
      toast.success("카메라가 등록되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!form.name) { toast.error("카메라명은 필수입니다."); return; }
    if (!form.viewerUrl && !form.streamUrl) { toast.error("뷰어 URL 또는 스트림 URL 중 하나는 입력하세요."); return; }
    createCamera.mutate({
      projectId: numericProjectId,
      name: form.name,
      location: form.location || undefined,
      viewerUrl: form.viewerUrl || undefined,
      streamUrl: form.streamUrl || undefined,
      simInfo: form.simInfo || undefined,
      notes: form.notes || undefined,
    });
  };

  const activeCam: any = cameras.data?.find(c => c.id === selectedCamera);
  // 재생 소스: 뷰어 URL(제조사 웹뷰어) 우선, 없으면 http 스트림(HLS 등)
  const embedUrl = activeCam ? (isEmbeddable(activeCam.viewerUrl) ? activeCam.viewerUrl : (isEmbeddable(activeCam.streamUrl) ? activeCam.streamUrl : "")) : "";

  return (
    <div className="space-y-4">
      {/* Camera Viewer */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Video className="w-5 h-5" />현장 실시간 카메라
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" />카메라 등록</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>현장 카메라 등록</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>카메라명 *</Label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="예: 1층 로비 카메라" />
                  </div>
                  <div>
                    <Label>설치 위치</Label>
                    <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="예: 1층 로비 입구" />
                  </div>
                </div>
                <div>
                  <Label>웹 뷰어 URL <span className="text-[11px] text-muted-foreground font-normal">(권장)</span></Label>
                  <Input value={form.viewerUrl} onChange={e => setForm(f => ({ ...f, viewerUrl: e.target.value }))} placeholder="제조사 웹 뷰어 https:// 주소" />
                  <p className="text-xs text-muted-foreground mt-1">유심(LTE) 카메라 제조사가 제공하는 웹 뷰어 링크. 브라우저에 임베드됩니다.</p>
                </div>
                <div>
                  <Label>스트림 URL <span className="text-[11px] text-muted-foreground font-normal">(HLS/WebRTC)</span></Label>
                  <Input value={form.streamUrl} onChange={e => setForm(f => ({ ...f, streamUrl: e.target.value }))} placeholder="https:// .m3u8 등" />
                  <p className="text-xs text-muted-foreground mt-1">RTSP는 브라우저 직접재생 불가 — HLS(.m3u8)/WebRTC URL 또는 위 웹 뷰어를 사용하세요.</p>
                </div>
                <div>
                  <Label>유심/회선 정보</Label>
                  <Input value={form.simInfo} onChange={e => setForm(f => ({ ...f, simInfo: e.target.value }))} placeholder="예: SKT 010-1234-5678, 월 데이터 요금제" />
                </div>
                <div>
                  <Label>메모</Label>
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="설치 메모, 계정 정보 등" />
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={createCamera.isPending}>
                  {createCamera.isPending ? "등록 중..." : "카메라 등록"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {cameras.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : !cameras.data?.length ? (
            <div className="text-center py-16 text-muted-foreground">
              <Camera className="w-16 h-16 mx-auto opacity-20 mb-4" />
              <h3 className="text-lg font-medium mb-2">등록된 카메라가 없습니다</h3>
              <p className="text-sm max-w-md mx-auto">
                현장에 설치된 IP 카메라, 웹캠, CCTV의 스트림 URL을 등록하면
                이 페이지에서 실시간으로 현장을 확인할 수 있습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Camera Selector */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {cameras.data.map(cam => (
                  <Button
                    key={cam.id}
                    size="sm"
                    variant={selectedCamera === cam.id ? "default" : "outline"}
                    onClick={() => setSelectedCamera(cam.id)}
                    className="flex-shrink-0"
                  >
                    <Camera className="w-3.5 h-3.5 mr-1.5" />
                    {cam.name}
                    <Badge className={`ml-2 text-xs border-0 ${cam.isOnline ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {cam.isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    </Badge>
                  </Button>
                ))}
              </div>

              {/* Stream Viewer */}
              {activeCam ? (
                <div className="relative">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                    {embedUrl ? (
                      <iframe
                        src={embedUrl}
                        className="w-full h-full"
                        allow="autoplay; fullscreen"
                        title={activeCam.name}
                      />
                    ) : (
                      <div className="text-center text-white/60 px-4">
                        <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">브라우저에서 직접 재생할 수 없는 스트림입니다.</p>
                        <p className="text-xs mt-1 text-white/40">RTSP는 웹 뷰어 URL 또는 HLS/WebRTC 변환이 필요합니다.</p>
                        {activeCam.streamUrl && <p className="text-xs mt-1 text-white/40 break-all">스트림: {activeCam.streamUrl}</p>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium truncate">{activeCam.name}</span>
                      {activeCam.location && <span className="text-muted-foreground truncate">· {activeCam.location}</span>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {(activeCam.viewerUrl || activeCam.streamUrl) && (
                        <a href={activeCam.viewerUrl || activeCam.streamUrl} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="ghost"><ExternalLink className="w-3.5 h-3.5 mr-1" />새 창</Button>
                        </a>
                      )}
                      {embedUrl && (
                        <a href={embedUrl} target="_blank" rel="noreferrer"><Button size="sm" variant="ghost"><Maximize2 className="w-3.5 h-3.5" /></Button></a>
                      )}
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => { if (confirm(`'${activeCam.name}' 카메라를 삭제할까요?`)) deleteCamera.mutate({ id: activeCam.id }); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  {(activeCam.simInfo || activeCam.notes) && (
                    <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded p-2 space-y-0.5">
                      {activeCam.simInfo && <p><span className="font-medium">유심/회선: </span>{activeCam.simInfo}</p>}
                      {activeCam.notes && <p><span className="font-medium">메모: </span>{activeCam.notes}</p>}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">카메라를 선택하세요</p>
                </div>
              )}

              {/* Camera Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {cameras.data.map(cam => (
                  <div
                    key={cam.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedCamera === cam.id ? "border-primary bg-primary/5" : "hover:bg-accent/30"}`}
                    onClick={() => setSelectedCamera(cam.id)}
                  >
                    <div className="aspect-video bg-black/90 rounded mb-2 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white/30" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium truncate">{cam.name}</span>
                      <span className={`w-2 h-2 rounded-full ${cam.isOnline ? "bg-green-500" : "bg-red-500"}`} />
                    </div>
                    {cam.location && <p className="text-xs text-muted-foreground truncate">{cam.location}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
