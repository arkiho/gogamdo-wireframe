/**
 * 현장 카메라 관리 - go2rtc 연동 + HLS/WebRTC 스트림 뷰어 + 배터리 모니터링
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import {
  Camera, Plus, ArrowLeft, Wifi, WifiOff,
  Trash2, AlertCircle, Maximize2, X, Play,
  Battery, BatteryLow, BatteryWarning, BatteryCharging,
  Server, Radio, Settings2, RefreshCw, Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import Hls from "hls.js";

// ============================================================
// HLS Video Player Component
// ============================================================
function HlsPlayer({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setError(false);
    setLoading(true);

    if (src.includes(".m3u8")) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          maxBufferLength: 10,
          maxMaxBufferLength: 30,
        });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            setError(true);
            setLoading(false);
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        video.addEventListener("loadeddata", () => setLoading(false));
      } else {
        setError(true);
        setLoading(false);
      }
    } else {
      video.src = src;
      video.addEventListener("loadeddata", () => setLoading(false));
      video.addEventListener("error", () => {
        setError(true);
        setLoading(false);
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-ink/5">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">스트림 연결 실패</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">go2rtc 서버 상태를 확인하세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 text-gold animate-spin" />
            <p className="text-xs text-white/60">스트림 연결 중...</p>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full object-contain bg-black"
        controls
        muted
        playsInline
      />
    </div>
  );
}

// ============================================================
// Battery Level Indicator
// ============================================================
function BatteryIndicator({ level }: { level: number | null }) {
  if (level === null || level === undefined) {
    return (
      <Badge variant="outline" className="text-[10px] gap-1 border-border/50">
        <Server className="w-2.5 h-2.5" /> 유선
      </Badge>
    );
  }

  if (level <= 10) {
    return (
      <Badge className="text-[10px] gap-1 bg-red-500/20 text-red-600 border-red-500/30 animate-pulse">
        <BatteryLow className="w-3 h-3" /> {level}%
      </Badge>
    );
  }
  if (level <= 20) {
    return (
      <Badge className="text-[10px] gap-1 bg-orange-500/20 text-orange-600 border-orange-500/30">
        <BatteryWarning className="w-3 h-3" /> {level}%
      </Badge>
    );
  }
  if (level <= 50) {
    return (
      <Badge className="text-[10px] gap-1 bg-yellow-500/20 text-yellow-700 border-yellow-500/30">
        <Battery className="w-3 h-3" /> {level}%
      </Badge>
    );
  }
  return (
    <Badge className="text-[10px] gap-1 bg-green-500/20 text-green-600 border-green-500/30">
      <BatteryCharging className="w-3 h-3" /> {level}%
    </Badge>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function OpsCameras() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [showAddForm, setShowAddForm] = useState(false);
  const [fullscreenCam, setFullscreenCam] = useState<any>(null);
  const [addMode, setAddMode] = useState<"go2rtc" | "direct">("go2rtc");
  const [formData, setFormData] = useState({
    name: "",
    projectId: "",
    location: "",
    // go2rtc 모드
    go2rtcServerUrl: "",
    go2rtcStreamName: "",
    rtspUrl: "",
    // 직접 입력 모드
    streamUrl: "",
  });

  // 카메라 목록 조회
  const camerasQuery = trpc.camera.list.useQuery();

  const addCamera = trpc.camera.create.useMutation({
    onSuccess: () => {
      toast.success("카메라가 등록되었습니다.");
      utils.camera.list.invalidate();
      setShowAddForm(false);
      setFormData({
        name: "", projectId: "", location: "",
        go2rtcServerUrl: "", go2rtcStreamName: "", rtspUrl: "",
        streamUrl: "",
      });
    },
    onError: (err) => toast.error(err.message),
  });

  const removeCamera = trpc.camera.delete.useMutation({
    onSuccess: () => {
      toast.success("카메라가 삭제되었습니다.");
      utils.camera.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const cameras = camerasQuery.data ?? [];

  // 카메라 상태 통계
  const stats = useMemo(() => {
    const total = cameras.length;
    const online = cameras.filter((c: any) => c.isOnline).length;
    const lowBattery = cameras.filter((c: any) => c.batteryLevel !== null && c.batteryLevel <= 20).length;
    return { total, online, offline: total - online, lowBattery };
  }, [cameras]);

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("카메라 이름을 입력해주세요.");
      return;
    }
    if (!formData.projectId.trim()) {
      toast.error("프로젝트 ID를 입력해주세요.");
      return;
    }

    if (addMode === "go2rtc") {
      if (!formData.go2rtcServerUrl.trim() || !formData.go2rtcStreamName.trim()) {
        toast.error("go2rtc 서버 URL과 스트림 이름을 입력해주세요.");
        return;
      }
      addCamera.mutate({
        name: formData.name,
        projectId: parseInt(formData.projectId),
        location: formData.location || undefined,
        go2rtcServerUrl: formData.go2rtcServerUrl,
        go2rtcStreamName: formData.go2rtcStreamName,
        rtspUrl: formData.rtspUrl || undefined,
      });
    } else {
      if (!formData.streamUrl.trim()) {
        toast.error("스트림 URL을 입력해주세요.");
        return;
      }
      addCamera.mutate({
        name: formData.name,
        projectId: parseInt(formData.projectId),
        location: formData.location || undefined,
        streamUrl: formData.streamUrl,
      });
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* Fullscreen Modal */}
      {fullscreenCam && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-ink">
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-gold" />
              <span className="text-white font-medium">{fullscreenCam.name}</span>
              {fullscreenCam.location && (
                <span className="text-white/50 text-sm">· {fullscreenCam.location}</span>
              )}
              <BatteryIndicator level={fullscreenCam.batteryLevel} />
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={() => setFullscreenCam(null)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1">
            {fullscreenCam.streamUrl ? (
              <HlsPlayer src={fullscreenCam.streamUrl} poster={fullscreenCam.thumbnailUrl ?? undefined} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/40">스트림 URL이 설정되지 않았습니다</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-ink text-white">
        <div className="container py-8">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/ops">
              <span className="text-gold/60 hover:text-gold text-sm transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                OpsX
              </span>
            </Link>
            <span className="text-white/30">/</span>
            <span className="text-white/60 text-sm">현장 카메라</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold flex items-center gap-3">
                <Camera className="w-6 h-6 text-gold" />
                현장 카메라 관리
              </h1>
              <p className="text-white/50 text-sm mt-1">
                go2rtc 미디어 서버 연동 · 실시간 모니터링 · 배터리 알림
              </p>
            </div>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gold text-ink hover:bg-gold-light"
            >
              <Plus className="w-4 h-4 mr-1" />
              카메라 등록
            </Button>
          </div>

          {/* Status Bar */}
          {cameras.length > 0 && (
            <div className="flex gap-6 mt-6 pt-4 border-t border-white/10">
              <div className="text-center">
                <div className="text-xl font-bold text-gold">{stats.total}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-wider">전체</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-400">{stats.online}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-wider">온라인</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-400">{stats.offline}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-wider">오프라인</div>
              </div>
              {stats.lowBattery > 0 && (
                <div className="text-center">
                  <div className="text-xl font-bold text-orange-400">{stats.lowBattery}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider">배터리 부족</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="container py-8">
        {/* Add Camera Form */}
        {showAddForm && (
          <Card className="border-gold/30 mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-gold" />
                새 카메라 등록
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Connection Mode Tabs */}
              <Tabs value={addMode} onValueChange={(v) => setAddMode(v as "go2rtc" | "direct")} className="mb-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="go2rtc" className="flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5" />
                    go2rtc 연동
                  </TabsTrigger>
                  <TabsTrigger value="direct" className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5" />
                    직접 URL 입력
                  </TabsTrigger>
                </TabsList>

                {/* 공통 필드 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <Label className="text-sm font-medium">카메라 이름 *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="예: 1층 로비 카메라"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">프로젝트 ID *</Label>
                    <Input
                      value={formData.projectId}
                      onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                      placeholder="연결할 프로젝트 ID"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">설치 위치</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="예: 1층 로비 천장"
                      className="mt-1"
                    />
                  </div>
                </div>

                <TabsContent value="go2rtc" className="mt-4">
                  <div className="p-3 bg-gold/5 border border-gold/20 rounded-md mb-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong className="text-ink">go2rtc 연동 모드:</strong> go2rtc 미디어 서버의 URL과 스트림 이름을 입력하면
                      HLS 스트림 URL이 자동으로 생성됩니다. RTSP URL은 참고용으로 저장됩니다.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium">go2rtc 서버 URL *</Label>
                      <Input
                        value={formData.go2rtcServerUrl}
                        onChange={(e) => setFormData({ ...formData, go2rtcServerUrl: e.target.value })}
                        placeholder="http://서버IP:1984"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">스트림 이름 *</Label>
                      <Input
                        value={formData.go2rtcStreamName}
                        onChange={(e) => setFormData({ ...formData, go2rtcStreamName: e.target.value })}
                        placeholder="예: site1_cam1"
                        className="mt-1"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">go2rtc.yaml의 streams 섹션에 정의된 이름</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">RTSP URL (참고용)</Label>
                      <Input
                        value={formData.rtspUrl}
                        onChange={(e) => setFormData({ ...formData, rtspUrl: e.target.value })}
                        placeholder="rtsp://admin:pass@IP:554/11"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  {formData.go2rtcServerUrl && formData.go2rtcStreamName && (
                    <div className="mt-3 p-2 bg-ink/5 rounded text-xs text-muted-foreground">
                      <span className="font-medium text-ink">자동 생성 HLS URL: </span>
                      <code className="text-gold">
                        {formData.go2rtcServerUrl}/api/stream.m3u8?src={formData.go2rtcStreamName}
                      </code>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="direct" className="mt-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label className="text-sm font-medium">스트림 URL *</Label>
                      <Input
                        value={formData.streamUrl}
                        onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
                        placeholder="https://.../*.m3u8 또는 MP4 URL"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">HLS(.m3u8), MP4, WebM 형식을 지원합니다</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleSubmit}
                  className="bg-gold text-ink hover:bg-gold-light"
                  disabled={addCamera.isPending}
                >
                  {addCamera.isPending ? "등록 중..." : "카메라 등록"}
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  취소
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Camera List */}
        {cameras.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading text-lg font-bold text-ink mb-2">등록된 카메라가 없습니다</h3>
              <p className="text-sm text-muted-foreground mb-4">
                go2rtc 미디어 서버를 설정하고 카메라를 등록하여 실시간 모니터링을 시작하세요.
              </p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-gold text-ink hover:bg-gold-light"
              >
                <Plus className="w-4 h-4 mr-1" />
                첫 카메라 등록
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cameras.map((cam: any) => (
              <Card key={cam.id} className="border-border/50 hover:border-gold/30 transition-colors overflow-hidden">
                <CardContent className="p-0">
                  {/* Camera Preview Area */}
                  <div className="aspect-video relative group">
                    {cam.streamUrl ? (
                      <>
                        <HlsPlayer src={cam.streamUrl} poster={cam.thumbnailUrl ?? undefined} />
                        {/* Status overlay */}
                        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
                          <Badge className={`text-[10px] ${
                            cam.isOnline
                              ? "bg-green-500/20 text-green-600 border-green-500/30"
                              : "bg-red-500/20 text-red-600 border-red-500/30"
                          }`}>
                            {cam.isOnline ? (
                              <><Wifi className="w-3 h-3 mr-1" /> 온라인</>
                            ) : (
                              <><WifiOff className="w-3 h-3 mr-1" /> 오프라인</>
                            )}
                          </Badge>
                          <BatteryIndicator level={cam.batteryLevel} />
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 left-2 z-10 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setFullscreenCam(cam)}
                        >
                          <Maximize2 className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <div className="w-full h-full bg-ink/5 flex items-center justify-center">
                        <div className="text-center">
                          <Camera className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">스트림 미설정</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Camera Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-heading font-bold text-ink text-sm">{cam.name}</h3>
                      {cam.go2rtcStreamName && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Server className="w-2.5 h-2.5" /> go2rtc
                        </Badge>
                      )}
                    </div>
                    {cam.location && (
                      <p className="text-xs text-muted-foreground mb-2">{cam.location}</p>
                    )}

                    {/* go2rtc info */}
                    {cam.go2rtcStreamName && (
                      <div className="text-[10px] text-muted-foreground/70 mb-2 space-y-0.5">
                        <div>스트림: <code className="text-gold/80">{cam.go2rtcStreamName}</code></div>
                        {cam.go2rtcServerUrl && (
                          <div>서버: <code className="text-muted-foreground">{cam.go2rtcServerUrl}</code></div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {cam.streamUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => setFullscreenCam(cam)}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            전체화면
                          </Button>
                        )}
                        {cam.go2rtcServerUrl && cam.go2rtcStreamName && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              const snapshotUrl = `${cam.go2rtcServerUrl}/api/frame.jpeg?src=${cam.go2rtcStreamName}`;
                              window.open(snapshotUrl, "_blank");
                            }}
                          >
                            <ImageIcon className="w-3 h-3 mr-1" />
                            스냅샷
                          </Button>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (confirm("이 카메라를 삭제하시겠습니까?")) {
                            removeCamera.mutate({ id: cam.id });
                          }
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* go2rtc Integration Guide */}
        <Card className="border-gold/20 bg-gold/5 mt-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Server className="w-6 h-6 text-gold flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-heading font-bold text-ink mb-2">go2rtc 미디어 서버 연동 가이드</h3>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
                  <p>
                    <strong className="text-ink">1단계:</strong> 서버에 go2rtc를 Docker로 설치합니다.
                    <code className="ml-1 text-xs bg-ink/5 px-1.5 py-0.5 rounded">docker compose up -d</code>
                  </p>
                  <p>
                    <strong className="text-ink">2단계:</strong> go2rtc.yaml에 카메라 RTSP URL을 등록합니다.
                    <code className="ml-1 text-xs bg-ink/5 px-1.5 py-0.5 rounded">rtsp://admin:pass@카메라IP:554/11</code>
                  </p>
                  <p>
                    <strong className="text-ink">3단계:</strong> 위 폼에서 go2rtc 서버 URL과 스트림 이름을 입력하면 자동으로 HLS 스트림이 연결됩니다.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline" className="text-xs">HLS (3~10초 지연)</Badge>
                  <Badge variant="outline" className="text-xs">WebRTC (0.5초 지연)</Badge>
                  <Badge variant="outline" className="text-xs">스냅샷 캡처</Badge>
                  <Badge variant="outline" className="text-xs">RTSP/ONVIF</Badge>
                  <Badge variant="outline" className="text-xs">CamHi 호환</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Battery Alert Info */}
        <Card className="border-orange-200 bg-orange-50/50 mt-4">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <BatteryWarning className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-heading font-bold text-ink mb-1">배터리 및 연결 알림 시스템</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  태양광 카메라의 배터리 잔량과 연결 상태를 실시간으로 모니터링합니다.
                  배터리 20% 이하 또는 1분 이상 연결 끊김 시 현장 관리자에게 자동 알림이 발송됩니다.
                  외부 모니터링 스크립트에서 <code className="text-xs bg-ink/5 px-1.5 py-0.5 rounded">camera.heartbeat</code> API를 호출하여 상태를 업데이트할 수 있습니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
