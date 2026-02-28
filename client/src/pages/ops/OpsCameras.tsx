/**
 * 현장 카메라 관리 - CCTV/타임랩스 카메라 연동 + HLS 스트림 뷰어
 */

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import {
  Camera, Plus, ArrowLeft, Video, Wifi, WifiOff,
  Trash2, ExternalLink, AlertCircle, Maximize2, X, Play
} from "lucide-react";
import { toast } from "sonner";
import Hls from "hls.js";

// HLS Video Player Component
function HlsPlayer({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setError(false);

    // Check if it's an HLS stream
    if (src.includes(".m3u8") || src.startsWith("https://")) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            setError(true);
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari native HLS
        video.src = src;
      } else {
        setError(true);
      }
    } else {
      // Direct video URL (mp4, webm, etc.)
      video.src = src;
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
        </div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      poster={poster}
      className="w-full h-full object-contain bg-black"
      controls
      muted
      playsInline
    />
  );
}

export default function OpsCameras() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [showAddForm, setShowAddForm] = useState(false);
  const [fullscreenCam, setFullscreenCam] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    projectId: "",
    streamUrl: "",
    location: "",
  });

  // 카메라 목록 조회
  const camerasQuery = trpc.camera.list.useQuery();
  const addCamera = trpc.camera.create.useMutation({
    onSuccess: () => {
      toast.success("카메라가 등록되었습니다.");
      utils.camera.list.invalidate();
      setShowAddForm(false);
      setFormData({ name: "", projectId: "", streamUrl: "", location: "" });
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
                프로젝트별 CCTV 및 타임랩스 카메라를 관리합니다
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
        </div>
      </div>

      <div className="container py-8">
        {/* Add Camera Form */}
        {showAddForm && (
          <Card className="border-gold/30 mb-6">
            <CardHeader>
              <CardTitle className="text-lg">새 카메라 등록</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label className="text-sm font-medium">설치 위치</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="예: 1층 로비 천장"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">스트림 URL (HLS/MP4)</Label>
                  <Input
                    value={formData.streamUrl}
                    onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
                    placeholder="https://.../*.m3u8 또는 MP4 URL"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">HLS(.m3u8), MP4, WebM 형식을 지원합니다</p>
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
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => {
                    if (!formData.name.trim()) {
                      toast.error("카메라 이름을 입력해주세요.");
                      return;
                    }
                    if (!formData.projectId.trim()) {
                      toast.error("프로젝트 ID를 입력해주세요.");
                      return;
                    }
                    addCamera.mutate({
                      name: formData.name,
                      projectId: parseInt(formData.projectId),
                      streamUrl: formData.streamUrl || undefined,
                      location: formData.location || undefined,
                    });
                  }}
                  className="bg-gold text-ink hover:bg-gold-light"
                  disabled={addCamera.isPending}
                >
                  {addCamera.isPending ? "등록 중..." : "등록"}
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
                현장 카메라를 등록하여 실시간 모니터링을 시작하세요.
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
                        <Badge className={`absolute top-2 right-2 z-10 ${
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
                    <h3 className="font-heading font-bold text-ink text-sm mb-1">{cam.name}</h3>
                    {cam.location && (
                      <p className="text-xs text-muted-foreground mb-2">{cam.location}</p>
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

        {/* Integration Guide */}
        <Card className="border-gold/20 bg-gold/5 mt-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-gold flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-heading font-bold text-ink mb-1">카메라 연동 안내</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  HLS(.m3u8) 스트림 URL을 등록하면 브라우저에서 실시간 영상을 확인할 수 있습니다.
                  IP 카메라의 RTSP 스트림은 미디어 서버(예: MediaMTX, Nginx-RTMP)를 통해
                  HLS로 변환한 후 URL을 등록해 주세요.
                </p>
                <div className="flex gap-2 mt-3">
                  <Badge variant="outline" className="text-xs">HLS</Badge>
                  <Badge variant="outline" className="text-xs">MP4</Badge>
                  <Badge variant="outline" className="text-xs">WebM</Badge>
                  <Badge variant="outline" className="text-xs">ONVIF → HLS</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
