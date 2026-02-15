import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Plus, Camera, Video, Wifi, WifiOff, Maximize2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function CameraTab({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", location: "", streamUrl: "", cameraType: "ip",
  });

  const cameras = trpc.ops.camera.list.useQuery({ projectId });
  const createCamera = trpc.ops.camera.create.useMutation({
    onSuccess: () => {
      cameras.refetch();
      setOpen(false);
      setForm({ name: "", location: "", streamUrl: "", cameraType: "ip" });
      toast.success("카메라가 등록되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!form.name || !form.streamUrl) {
      toast.error("카메라명과 스트림 URL은 필수입니다.");
      return;
    }
    createCamera.mutate({
      projectId,
      name: form.name,
      location: form.location || undefined,
      streamUrl: form.streamUrl,
      cameraType: form.cameraType,
    });
  };

  const activeCam = cameras.data?.find(c => c.id === selectedCamera);

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
            <DialogContent>
              <DialogHeader><DialogTitle>현장 카메라 등록</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div>
                  <Label>카메라명 *</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="예: 1층 로비 카메라" />
                </div>
                <div>
                  <Label>설치 위치</Label>
                  <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="예: 1층 로비 입구" />
                </div>
                <div>
                  <Label>카메라 유형</Label>
                  <Select value={form.cameraType} onValueChange={v => setForm(f => ({ ...f, cameraType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ip">IP 카메라</SelectItem>
                      <SelectItem value="webcam">웹캠</SelectItem>
                      <SelectItem value="cctv">CCTV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>스트림 URL *</Label>
                  <Input value={form.streamUrl} onChange={e => setForm(f => ({ ...f, streamUrl: e.target.value }))} placeholder="rtsp:// 또는 https:// 스트림 주소" />
                  <p className="text-xs text-muted-foreground mt-1">
                    IP 카메라의 RTSP/HLS 스트림 URL 또는 웹캠 공유 URL을 입력하세요.
                  </p>
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
                    {activeCam.streamUrl.includes("http") ? (
                      <iframe
                        src={activeCam.streamUrl}
                        className="w-full h-full"
                        allow="autoplay; fullscreen"
                        title={activeCam.name}
                      />
                    ) : (
                      <div className="text-center text-white/60">
                        <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">RTSP 스트림은 별도 미디어 서버 연동이 필요합니다.</p>
                        <p className="text-xs mt-1 text-white/40">스트림 URL: {activeCam.streamUrl}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{activeCam.name}</span>
                      {activeCam.location && <span className="text-muted-foreground">· {activeCam.location}</span>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
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
