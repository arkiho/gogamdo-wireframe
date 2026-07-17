import { useState, useCallback, lazy, Suspense } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  ArrowLeft, Plus, Camera, Ruler, Target, FileText,
  Trash2, MapPin, Upload, Download, RotateCcw, CheckCircle2,
  AlertTriangle, Eye, Pencil
} from "lucide-react";
import { Link } from "wouter";

const PanoramaViewer = lazy(() => import("@/components/PanoramaViewer"));

type ViewMode = "sessions" | "session-detail" | "panorama-viewer";
type MeasureMode = "view" | "measure" | "calibrate";

export default function OpsFieldMeasure() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("sessions");
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [selectedPanoramaId, setSelectedPanoramaId] = useState<number | null>(null);
  const [measureMode, setMeasureMode] = useState<MeasureMode>("view");
  const [measureType, setMeasureType] = useState<"distance" | "height" | "area" | "reference">("distance");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCalibDialog, setShowCalibDialog] = useState(false);
  const [calibRealDistance, setCalibRealDistance] = useState("");
  const [pendingCalibPoints, setPendingCalibPoints] = useState<any>(null);
  const [calibrationPoints, setCalibrationPoints] = useState<any[]>([]);

  // tRPC queries
  const sessionsQuery = trpc.fieldMeasurement.listSessions.useQuery();
  const sessionDetailQuery = trpc.fieldMeasurement.getSession.useQuery(
    { id: selectedSessionId! },
    { enabled: !!selectedSessionId }
  );
  const panoramasQuery = trpc.fieldMeasurement.listPanoramas.useQuery(
    { sessionId: selectedSessionId! },
    { enabled: !!selectedSessionId }
  );
  const panoramaQuery = trpc.fieldMeasurement.getPanorama.useQuery(
    { id: selectedPanoramaId! },
    { enabled: !!selectedPanoramaId }
  );
  const measurementsQuery = trpc.fieldMeasurement.listMeasurements.useQuery(
    { panoramaId: selectedPanoramaId! },
    { enabled: !!selectedPanoramaId }
  );
  const reportQuery = trpc.fieldMeasurement.getReport.useQuery(
    { sessionId: selectedSessionId! },
    { enabled: !!selectedSessionId && viewMode === "session-detail" }
  );

  // tRPC mutations
  const createSession = trpc.fieldMeasurement.createSession.useMutation({
    onSuccess: () => {
      sessionsQuery.refetch();
      setShowCreateDialog(false);
      toast.success("실측 세션이 생성되었습니다.");
    },
  });
  const deleteSession = trpc.fieldMeasurement.deleteSession.useMutation({
    onSuccess: () => {
      sessionsQuery.refetch();
      toast.success("세션이 삭제되었습니다.");
    },
  });
  const uploadPanorama = trpc.fieldMeasurement.uploadPanorama.useMutation({
    onSuccess: () => {
      panoramasQuery.refetch();
      setShowUploadDialog(false);
      toast.success("파노라마 이미지가 업로드되었습니다.");
    },
  });
  const deletePanorama = trpc.fieldMeasurement.deletePanorama.useMutation({
    onSuccess: () => {
      panoramasQuery.refetch();
      toast.success("이미지가 삭제되었습니다.");
    },
  });
  const createMeasurement = trpc.fieldMeasurement.createMeasurement.useMutation({
    onSuccess: () => {
      measurementsQuery.refetch();
      toast.success("측정이 저장되었습니다.");
    },
  });
  const deleteMeasurement = trpc.fieldMeasurement.deleteMeasurement.useMutation({
    onSuccess: () => {
      measurementsQuery.refetch();
      toast.success("측정이 삭제되었습니다.");
    },
  });
  const calibrateMutation = trpc.fieldMeasurement.calibrate.useMutation({
    onSuccess: (data) => {
      panoramaQuery.refetch();
      setCalibrationPoints([]);
      toast.success(`보정 완료! 스케일 팩터: ${data.scaleFactor.toFixed(3)}`);
    },
  });
  const generateReport = trpc.fieldMeasurement.generateReport.useMutation({
    onSuccess: () => {
      reportQuery.refetch();
      toast.success("AI 분석 보고서가 생성되었습니다.");
    },
  });

  // 파노라마 업로드 핸들러
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSessionId) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      const spotName = prompt("촬영 위치 이름을 입력하세요 (예: 회의실 A, 로비)") || "미지정";
      const cameraHeight = prompt("카메라 높이를 입력하세요 (m, 예: 1.5)") || "";

      uploadPanorama.mutate({
        sessionId: selectedSessionId,
        spotName,
        cameraHeight: cameraHeight || undefined,
        imageBase64: base64,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  }, [selectedSessionId, uploadPanorama]);

  // 측정 완료 핸들러
  const handleMeasurementComplete = useCallback((measurement: any) => {
    if (!selectedPanoramaId || !selectedSessionId) return;

    const label = prompt(`측정 라벨을 입력하세요 (예: 벽 길이, 문 높이)`) || "";

    createMeasurement.mutate({
      panoramaId: selectedPanoramaId,
      sessionId: selectedSessionId,
      type: measureType,
      label,
      points: measurement.points,
      rawAngle: String(measurement.rawAngle),
      calibratedValue: String(measurement.calibratedValue),
      unit: measurement.unit,
    });
  }, [selectedPanoramaId, selectedSessionId, measureType, createMeasurement]);

  // 보정 포인트 핸들러
  const handleCalibrationPoint = useCallback((point1: any, point2: any, angularDist: number) => {
    setPendingCalibPoints({ point1, point2, angularDist });
    setShowCalibDialog(true);
  }, []);

  // 보정 확정
  const confirmCalibration = useCallback(() => {
    if (!pendingCalibPoints || !calibRealDistance) return;

    const newCalibPoint = {
      point1: pendingCalibPoints.point1,
      point2: pendingCalibPoints.point2,
      realDistance: parseFloat(calibRealDistance),
    };

    const updatedPoints = [...calibrationPoints, newCalibPoint];
    setCalibrationPoints(updatedPoints);
    setShowCalibDialog(false);
    setCalibRealDistance("");
    setPendingCalibPoints(null);

    toast.success(`기준점 ${updatedPoints.length}개 등록됨. 2개 이상 등록 후 보정을 실행하세요.`);
  }, [pendingCalibPoints, calibRealDistance, calibrationPoints]);

  // 보정 실행
  const executeCalibration = useCallback(() => {
    if (!selectedPanoramaId || calibrationPoints.length < 1) {
      toast.error("최소 1개의 기준점이 필요합니다.");
      return;
    }
    calibrateMutation.mutate({
      panoramaId: selectedPanoramaId,
      referencePoints: calibrationPoints,
    });
  }, [selectedPanoramaId, calibrationPoints, calibrateMutation]);

  // ===== 세션 목록 뷰 =====
  if (viewMode === "sessions") {
    return (
      <div className="min-h-screen bg-background">
        <Toaster />
        <div className="container max-w-6xl py-8">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Link href="/ops">
                <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">360° 현장 실측</h1>
                <p className="text-sm text-muted-foreground">Insta360 RS1 기반 공간 치수 측정 도구</p>
              </div>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />새 실측 세션</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>새 실측 세션 생성</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  createSession.mutate({
                    projectName: fd.get("projectName") as string,
                    location: fd.get("location") as string || undefined,
                    description: fd.get("description") as string || undefined,
                  });
                }} className="space-y-4">
                  <div>
                    <Label>프로젝트명 *</Label>
                    <Input name="projectName" required placeholder="예: 삼성SDS 본사 리모델링" />
                  </div>
                  <div>
                    <Label>현장 위치</Label>
                    <Input name="location" placeholder="예: 서울 강남구 삼성동" />
                  </div>
                  <div>
                    <Label>설명</Label>
                    <Textarea name="description" placeholder="실측 목적 및 참고사항" />
                  </div>
                  <Button type="submit" className="w-full" disabled={createSession.isPending}>
                    {createSession.isPending ? "생성 중..." : "세션 생성"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* 사용 안내 */}
          <Card className="mb-6 border-blue-200 bg-blue-50/50">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Camera className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">사용 방법</p>
                  <ol className="text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Insta360 RS1으로 현장 각 지점에서 360° 사진 촬영</li>
                    <li>세션 생성 후 촬영한 파노라마 이미지 업로드</li>
                    <li>기준 치수 보정 (문 높이, 벽 길이 등 알려진 치수 입력)</li>
                    <li>두 점을 클릭하여 거리/높이/면적 측정</li>
                    <li>AI 분석 보고서 생성으로 종합 실측 결과 확인</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 세션 목록 */}
          {sessionsQuery.isLoading ? (
            <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
          ) : !sessionsQuery.data?.length ? (
            <Card className="text-center py-12">
              <CardContent>
                <Ruler className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">아직 실측 세션이 없습니다</p>
                <p className="text-sm text-muted-foreground mb-4">새 실측 세션을 생성하여 현장 측정을 시작하세요.</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />첫 실측 세션 만들기
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sessionsQuery.data.map((session) => (
                <Card key={session.id} className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => { setSelectedSessionId(session.id); setViewMode("session-detail"); }}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{session.projectName}</CardTitle>
                      <Badge variant={session.status === "completed" ? "default" : session.status === "archived" ? "secondary" : "outline"}>
                        {session.status === "active" ? "진행중" : session.status === "completed" ? "완료" : "보관"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {session.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <MapPin className="w-3 h-3" />{session.location}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {session.createdByName} · {new Date(session.createdAt).toLocaleDateString("ko-KR")}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("이 세션을 삭제하시겠습니까?")) deleteSession.mutate({ id: session.id });
                      }}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== 세션 상세 뷰 =====
  if (viewMode === "session-detail" && selectedSessionId) {
    const session = sessionDetailQuery.data;
    const panoramas = panoramasQuery.data || [];
    const report = reportQuery.data;

    return (
      <div className="min-h-screen bg-background">
        <Toaster />
        <div className="container max-w-6xl py-8">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => { setViewMode("sessions"); setSelectedSessionId(null); }}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{session?.projectName || "로딩 중..."}</h1>
                <p className="text-sm text-muted-foreground">{session?.location}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => generateReport.mutate({ sessionId: selectedSessionId })}
                disabled={generateReport.isPending || panoramas.length === 0}>
                <FileText className="w-4 h-4 mr-2" />
                {generateReport.isPending ? "생성 중..." : "AI 보고서 생성"}
              </Button>
            </div>
          </div>

          {/* 파노라마 이미지 목록 */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">촬영 지점 ({panoramas.length})</CardTitle>
              <div>
                <input type="file" accept="image/*" id="pano-upload" className="hidden"
                  onChange={handleFileUpload} />
                <Button size="sm" onClick={() => document.getElementById("pano-upload")?.click()}
                  disabled={uploadPanorama.isPending}>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadPanorama.isPending ? "업로드 중..." : "파노라마 업로드"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {panoramas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Camera className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>Insta360 RS1으로 촬영한 360° 이미지를 업로드하세요.</p>
                  <p className="text-xs mt-1">지원 포맷: JPG, PNG (equirectangular 2:1 비율 권장)</p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {panoramas.map((pano) => (
                    <div key={pano.id} className="border rounded-lg overflow-hidden group cursor-pointer hover:shadow-md transition"
                      onClick={() => { setSelectedPanoramaId(pano.id); setViewMode("panorama-viewer"); }}>
                      <div className="aspect-video relative bg-muted">
                        <img src={pano.imageUrl} alt={pano.spotName} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                          <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition" />
                        </div>
                        {(pano.calibrationData as any)?.scaleFactor && (
                          <Badge className="absolute top-2 right-2 bg-emerald-600">보정됨</Badge>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="font-medium text-sm">{pano.spotName}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          {pano.cameraHeight && <span>높이: {pano.cameraHeight}m</span>}
                          <span>순서: {pano.spotOrder}</span>
                        </div>
                        <div className="flex gap-1 mt-2">
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("이 이미지를 삭제하시겠습니까?")) deletePanorama.mutate({ id: pano.id });
                          }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI 분석 보고서 */}
          {report && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />AI 분석 보고서
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.totalArea && (
                  <div className="flex gap-4 mb-4">
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <div className="text-xs text-muted-foreground">총 면적</div>
                      <div className="text-lg font-bold">{Number(report.totalArea).toFixed(1)} m²</div>
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <div className="text-xs text-muted-foreground">촬영 지점</div>
                      <div className="text-lg font-bold">{report.roomCount}개</div>
                    </div>
                  </div>
                )}
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {report.aiAnalysis}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // ===== 파노라마 뷰어 + 측정 뷰 =====
  if (viewMode === "panorama-viewer" && selectedPanoramaId) {
    const pano = panoramaQuery.data;
    const measurements = measurementsQuery.data || [];
    const calibData = pano?.calibrationData as any;

    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Toaster />

        {/* 상단 툴바 */}
        <div className="bg-zinc-900 border-b border-zinc-700 px-4 py-2 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-white hover:bg-zinc-700"
              onClick={() => { setViewMode("session-detail"); setSelectedPanoramaId(null); setMeasureMode("view"); }}>
              <ArrowLeft className="w-4 h-4 mr-1" />돌아가기
            </Button>
            <span className="text-white text-sm font-medium">{pano?.spotName || "..."}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* 모드 선택 */}
            <div className="flex bg-zinc-800 rounded-lg p-0.5">
              <Button size="sm" variant={measureMode === "view" ? "default" : "ghost"}
                className={measureMode !== "view" ? "text-zinc-400 hover:text-white hover:bg-zinc-700" : ""}
                onClick={() => setMeasureMode("view")}>
                <Eye className="w-4 h-4 mr-1" />보기
              </Button>
              <Button size="sm" variant={measureMode === "calibrate" ? "default" : "ghost"}
                className={measureMode !== "calibrate" ? "text-zinc-400 hover:text-white hover:bg-zinc-700" : ""}
                onClick={() => setMeasureMode("calibrate")}>
                <Target className="w-4 h-4 mr-1" />보정
              </Button>
              <Button size="sm" variant={measureMode === "measure" ? "default" : "ghost"}
                className={measureMode !== "measure" ? "text-zinc-400 hover:text-white hover:bg-zinc-700" : ""}
                onClick={() => setMeasureMode("measure")}>
                <Ruler className="w-4 h-4 mr-1" />측정
              </Button>
            </div>

            {/* 측정 유형 */}
            {measureMode === "measure" && (
              <Select value={measureType} onValueChange={(v) => setMeasureType(v as any)}>
                <SelectTrigger className="w-28 h-8 bg-zinc-800 border-zinc-600 text-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">거리</SelectItem>
                  <SelectItem value="height">높이</SelectItem>
                  <SelectItem value="area">면적</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* 보정 실행 버튼 */}
            {measureMode === "calibrate" && calibrationPoints.length > 0 && (
              <Button size="sm" variant="default" className="bg-emerald-600 hover:bg-emerald-700"
                onClick={executeCalibration} disabled={calibrateMutation.isPending}>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                보정 실행 ({calibrationPoints.length}점)
              </Button>
            )}

            {/* 보정 초기화 */}
            {calibrationPoints.length > 0 && (
              <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-white"
                onClick={() => setCalibrationPoints([])}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* 보정 안내 */}
        {measureMode === "calibrate" && !calibData?.scaleFactor && (
          <div className="bg-amber-900/50 border-b border-amber-700 px-4 py-2 text-amber-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>보정이 필요합니다. 알려진 치수(문 높이, 벽 길이 등)의 두 끝점을 클릭하고 실제 거리를 입력하세요. 기준점이 많을수록 정확도가 높아집니다.</span>
          </div>
        )}

        {/* 360도 뷰어 */}
        <div className="flex-1 relative">
          {pano?.imageUrl && (
            <Suspense fallback={<div className="flex items-center justify-center h-full text-white">로딩 중...</div>}>
              <PanoramaViewer
                imageUrl={pano.imageUrl}
                measurements={measurements.map(m => ({
                  ...m,
                  points: m.points as any[],
                  calibratedValue: m.calibratedValue ? Number(m.calibratedValue) : undefined,
                })) as any}
                calibrationData={calibData?.scaleFactor ? calibData : null}
                mode={measureMode}
                measureType={measureType}
                onMeasurementComplete={handleMeasurementComplete}
                onCalibrationPoint={handleCalibrationPoint}
                className="w-full h-full"
              />
            </Suspense>
          )}
        </div>

        {/* 하단 측정 기록 패널 */}
        {measurements.length > 0 && (
          <div className="bg-zinc-900 border-t border-zinc-700 px-4 py-3 max-h-48 overflow-y-auto">
            <div className="text-white text-xs font-semibold mb-2">측정 기록 ({measurements.length})</div>
            <div className="grid gap-1">
              {measurements.map((m) => (
                <div key={m.id} className="flex items-center justify-between bg-zinc-800 rounded px-3 py-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] border-zinc-600 text-zinc-300">
                      {m.type === "distance" ? "거리" : m.type === "height" ? "높이" : m.type === "area" ? "면적" : "기준"}
                    </Badge>
                    <span className="text-zinc-300">{m.label || "미지정"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-white">
                      {m.calibratedValue ? `${Number(m.calibratedValue).toFixed(2)} ${m.unit || "m"}` : "보정 필요"}
                    </span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-zinc-500 hover:text-red-400"
                      onClick={() => deleteMeasurement.mutate({ id: m.id })}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 보정 거리 입력 다이얼로그 */}
        <Dialog open={showCalibDialog} onOpenChange={setShowCalibDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>기준 치수 입력</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                선택한 두 점 사이의 실제 거리를 입력하세요.
                {pendingCalibPoints && (
                  <span className="block mt-1 text-xs">
                    각도 거리: {(pendingCalibPoints.angularDist * 180 / Math.PI).toFixed(2)}°
                  </span>
                )}
              </p>
              <div>
                <Label>실제 거리 (m)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={calibRealDistance}
                  onChange={(e) => setCalibRealDistance(e.target.value)}
                  placeholder="예: 2.10 (문 높이)"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setShowCalibDialog(false); setCalibRealDistance(""); }}>
                  취소
                </Button>
                <Button className="flex-1" onClick={confirmCalibration} disabled={!calibRealDistance}>
                  등록
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return null;
}
