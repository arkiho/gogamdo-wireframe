/**
 * 현장 카메라 관리 - 프로젝트별 CCTV/타임랩스 카메라 연동 준비
 */

import { useState } from "react";
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
  Settings, Trash2, ExternalLink, AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export default function OpsCameras() {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    projectId: "",
    streamUrl: "",
    location: "",
  });

  // 카메라 목록 조회
  const camerasQuery = trpc.camera.list.useQuery();
  const addCamera = trpc.camera.add.useMutation({
    onSuccess: () => {
      toast.success("카메라가 등록되었습니다.");
      camerasQuery.refetch();
      setShowAddForm(false);
      setFormData({ name: "", projectId: "", streamUrl: "", location: "" });
    },
    onError: (err) => toast.error(err.message),
  });
  const removeCamera = trpc.camera.remove.useMutation({
    onSuccess: () => {
      toast.success("카메라가 삭제되었습니다.");
      camerasQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const cameras = camerasQuery.data ?? [];

  return (
    <div className="min-h-screen bg-paper">
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
                  <Label className="text-sm font-medium">스트림 URL</Label>
                  <Input
                    value={formData.streamUrl}
                    onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
                    placeholder="rtsp:// 또는 https:// 스트림 주소"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">프로젝트 ID</Label>
                  <Input
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    placeholder="연결할 프로젝트 ID (선택)"
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
                    addCamera.mutate({
                      name: formData.name,
                      streamUrl: formData.streamUrl || undefined,
                      location: formData.location || undefined,
                      projectId: formData.projectId ? parseInt(formData.projectId) : undefined,
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
              <Card key={cam.id} className="border-border/50 hover:border-gold/30 transition-colors">
                <CardContent className="p-0">
                  {/* Camera Preview Area */}
                  <div className="aspect-video bg-ink/5 flex items-center justify-center relative">
                    {cam.streamUrl ? (
                      <>
                        <Video className="w-10 h-10 text-muted-foreground" />
                        <Badge className={`absolute top-2 right-2 ${
                          cam.status === "online"
                            ? "bg-green-500/20 text-green-600 border-green-500/30"
                            : "bg-red-500/20 text-red-600 border-red-500/30"
                        }`}>
                          {cam.status === "online" ? (
                            <><Wifi className="w-3 h-3 mr-1" /> 온라인</>
                          ) : (
                            <><WifiOff className="w-3 h-3 mr-1" /> 오프라인</>
                          )}
                        </Badge>
                      </>
                    ) : (
                      <div className="text-center">
                        <Camera className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">스트림 미설정</p>
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
                            onClick={() => {
                              if (cam.streamUrl) {
                                window.open(cam.streamUrl, "_blank");
                              }
                            }}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            보기
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
                  현장 카메라 시스템이 연결되면 실시간 영상 스트리밍, 타임랩스 녹화,
                  이벤트 감지 알림 등의 기능을 사용할 수 있습니다.
                  RTSP, HLS, WebRTC 프로토콜을 지원하며, IP 카메라 또는 NVR 시스템과 연동 가능합니다.
                </p>
                <div className="flex gap-2 mt-3">
                  <Badge variant="outline" className="text-xs">RTSP</Badge>
                  <Badge variant="outline" className="text-xs">HLS</Badge>
                  <Badge variant="outline" className="text-xs">WebRTC</Badge>
                  <Badge variant="outline" className="text-xs">ONVIF</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
