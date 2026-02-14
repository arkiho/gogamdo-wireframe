import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/Logo";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowLeft, Plus, Trash2, Upload, Activity, Thermometer, Droplets,
  Sun, Wind, Volume2, Users, Zap, BarChart3, Brain, Loader2, Eye,
  ChevronLeft, Settings, MapPin
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

const SENSOR_TYPES = [
  { value: "temperature", label: "온도", icon: Thermometer, unit: "°C", color: "#ef4444" },
  { value: "humidity", label: "습도", icon: Droplets, unit: "%", color: "#3b82f6" },
  { value: "illuminance", label: "조도", icon: Sun, unit: "lux", color: "#eab308" },
  { value: "co2", label: "CO₂", icon: Wind, unit: "ppm", color: "#22c55e" },
  { value: "noise", label: "소음", icon: Volume2, unit: "dB", color: "#a855f7" },
  { value: "occupancy", label: "재실", icon: Users, unit: "명", color: "#f97316" },
  { value: "motion", label: "동선", icon: Activity, unit: "", color: "#06b6d4" },
  { value: "air_quality", label: "공기질", icon: Wind, unit: "AQI", color: "#10b981" },
  { value: "power", label: "전력", icon: Zap, unit: "W", color: "#f59e0b" },
] as const;

function getSensorMeta(type: string) {
  return SENSOR_TYPES.find(s => s.value === type) || SENSOR_TYPES[0];
}

export default function AdminDDIA() {
  const { user, loading: authLoading } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>;
  if (!user || user.role !== "admin") {
    window.location.href = getLoginUrl();
    return null;
  }

  return selectedProjectId ? (
    <ProjectDetail projectId={selectedProjectId} onBack={() => setSelectedProjectId(null)} />
  ) : (
    <ProjectList onSelect={setSelectedProjectId} />
  );
}

/* ===== Project List ===== */
function ProjectList({ onSelect }: { onSelect: (id: number) => void }) {
  const projects = trpc.ddia.listProjects.useQuery();
  const createProject = trpc.ddia.createProject.useMutation({
    onSuccess: () => { projects.refetch(); toast.success("프로젝트가 생성되었습니다"); },
  });
  const deleteProject = trpc.ddia.deleteProject.useMutation({
    onSuccess: () => { projects.refetch(); toast.success("프로젝트가 삭제되었습니다"); },
  });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", client: "", location: "", area: "", description: "" });

  const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    setup: { label: "설정 중", variant: "outline" },
    collecting: { label: "데이터 수집 중", variant: "default" },
    analyzing: { label: "분석 중", variant: "secondary" },
    completed: { label: "완료", variant: "destructive" },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-white">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/admin"><ChevronLeft className="w-5 h-5 text-muted-foreground hover:text-ink cursor-pointer" /></Link>
            <Logo />
            <div className="h-6 w-px bg-border/50" />
            <h1 className="font-heading text-lg font-bold text-ink flex items-center gap-2">
              <Activity className="w-5 h-5 text-gold" />
              DDIA 공간 분석
            </h1>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-heading font-bold text-ink">공간 분석 프로젝트</h2>
            <p className="text-sm text-muted-foreground mt-1">센서를 설치하고 데이터를 수집하여 공간을 분석합니다</p>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)} className="bg-gold text-ink hover:bg-gold/90">
            <Plus className="w-4 h-4 mr-1" /> 새 프로젝트
          </Button>
        </div>

        {showCreate && (
          <Card className="mb-6 border-gold/30">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="프로젝트명 *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="border border-border rounded-md px-3 py-2 text-sm" />
                <input placeholder="고객사" value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} className="border border-border rounded-md px-3 py-2 text-sm" />
                <input placeholder="위치" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="border border-border rounded-md px-3 py-2 text-sm" />
                <input placeholder="면적 (㎡)" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} className="border border-border rounded-md px-3 py-2 text-sm" />
              </div>
              <textarea placeholder="설명" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border border-border rounded-md px-3 py-2 text-sm mt-4" rows={2} />
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowCreate(false)}>취소</Button>
                <Button className="bg-gold text-ink hover:bg-gold/90" disabled={!form.name || createProject.isPending}
                  onClick={() => { createProject.mutate(form); setShowCreate(false); setForm({ name: "", client: "", location: "", area: "", description: "" }); }}>
                  {createProject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "생성"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {projects.isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
        ) : !projects.data?.length ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">아직 프로젝트가 없습니다</p>
              <p className="text-xs text-muted-foreground/60 mt-1">새 프로젝트를 생성하여 센서 데이터 수집을 시작하세요</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.data.map((p: any) => {
              const st = statusLabels[p.status] || statusLabels.setup;
              return (
                <Card key={p.id} className="hover:border-gold/40 transition-colors cursor-pointer group" onClick={() => onSelect(p.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base font-heading group-hover:text-gold transition-colors">{p.name}</CardTitle>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {p.client && <p>고객: {p.client}</p>}
                      {p.location && <p className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.location}</p>}
                      {p.area && <p>면적: {p.area}</p>}
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("ko-KR")}</span>
                      <Button variant="ghost" size="sm" className="text-destructive h-7 px-2 opacity-0 group-hover:opacity-100"
                        onClick={e => { e.stopPropagation(); if (confirm("이 프로젝트를 삭제하시겠습니까?")) deleteProject.mutate({ id: p.id }); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== Project Detail with Floor Plan & Sensors ===== */
function ProjectDetail({ projectId, onBack }: { projectId: number; onBack: () => void }) {
  const project = trpc.ddia.getProject.useQuery({ id: projectId });
  const sensorsList = trpc.ddia.listSensors.useQuery({ projectId });
  const latestData = trpc.ddia.getLatestData.useQuery({ projectId });
  const analyses = trpc.ddia.listAnalyses.useQuery({ projectId });
  const updateProject = trpc.ddia.updateProject.useMutation({ onSuccess: () => project.refetch() });
  const createSensor = trpc.ddia.createSensor.useMutation({
    onSuccess: () => { sensorsList.refetch(); latestData.refetch(); toast.success("센서가 추가되었습니다"); },
  });
  const updateSensor = trpc.ddia.updateSensor.useMutation({
    onSuccess: () => { sensorsList.refetch(); latestData.refetch(); },
  });
  const deleteSensor = trpc.ddia.deleteSensor.useMutation({
    onSuccess: () => { sensorsList.refetch(); latestData.refetch(); toast.success("센서가 삭제되었습니다"); },
  });
  const analyzeData = trpc.ddia.analyzeData.useMutation({
    onSuccess: () => { analyses.refetch(); toast.success("AI 분석이 완료되었습니다"); },
  });

  const [tab, setTab] = useState<"floorplan" | "sensors" | "data" | "analysis">("floorplan");
  const [placingType, setPlacingType] = useState<string | null>(null);
  const [placingZone, setPlacingZone] = useState("");
  const floorPlanRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const p = project.data;
  if (project.isLoading || !p) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>;

  const handleFloorPlanUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload-image", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        // Get image dimensions
        const img = new Image();
        img.onload = () => {
          updateProject.mutate({
            id: projectId,
            floorPlanUrl: data.url,
            floorPlanWidth: img.naturalWidth,
            floorPlanHeight: img.naturalHeight,
          });
        };
        img.src = data.url;
        toast.success("평면도가 업로드되었습니다");
      }
    } catch {
      toast.error("업로드 실패");
    }
  };

  const handleFloorPlanClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!placingType || !floorPlanRef.current) return;
    const rect = floorPlanRef.current.getBoundingClientRect();
    const posX = Math.round(((e.clientX - rect.left) / rect.width) * 1000);
    const posY = Math.round(((e.clientY - rect.top) / rect.height) * 1000);
    const meta = getSensorMeta(placingType);
    createSensor.mutate({
      projectId,
      name: `${meta.label} ${(sensorsList.data?.length ?? 0) + 1}`,
      type: placingType as any,
      unit: meta.unit,
      posX,
      posY,
      zone: placingZone || undefined,
    });
    setPlacingType(null);
    setPlacingZone("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-white">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-muted-foreground hover:text-ink"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <h1 className="font-heading text-lg font-bold text-ink">{p.name}</h1>
              <p className="text-xs text-muted-foreground">{p.client}{p.location ? ` · ${p.location}` : ""}{p.area ? ` · ${p.area}` : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={p.status === "collecting" ? "default" : "outline"}>
              {p.status === "setup" ? "설정 중" : p.status === "collecting" ? "수집 중" : p.status === "analyzing" ? "분석 중" : "완료"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border/50 bg-white">
        <div className="container flex gap-6">
          {[
            { key: "floorplan", label: "평면도 & 센서", icon: MapPin },
            { key: "sensors", label: "센서 목록", icon: Settings },
            { key: "data", label: "실시간 데이터", icon: BarChart3 },
            { key: "analysis", label: "AI 분석", icon: Brain },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-1.5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-ink"}`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container py-6">
        {/* Floor Plan Tab */}
        {tab === "floorplan" && (
          <div className="space-y-6">
            {/* Sensor placement toolbar */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">센서 배치</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">센서 유형을 선택한 후 평면도에서 설치 위치를 클릭하세요</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {SENSOR_TYPES.map(st => {
                    const Icon = st.icon;
                    return (
                      <button key={st.value} onClick={() => setPlacingType(placingType === st.value ? null : st.value)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${placingType === st.value ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground hover:border-gold/40"}`}>
                        <Icon className="w-3.5 h-3.5" />{st.label}
                      </button>
                    );
                  })}
                </div>
                {placingType && (
                  <div className="flex items-center gap-2">
                    <input placeholder="존 이름 (예: 회의실A, 오픈오피스)" value={placingZone} onChange={e => setPlacingZone(e.target.value)}
                      className="border border-border rounded-md px-3 py-1.5 text-xs flex-1 max-w-xs" />
                    <span className="text-xs text-gold font-medium animate-pulse">평면도에서 위치를 클릭하세요</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Floor Plan */}
            <Card>
              <CardContent className="p-4">
                {!p.floorPlanUrl ? (
                  <div className="border-2 border-dashed border-border/50 rounded-lg p-16 text-center cursor-pointer hover:border-gold/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFloorPlanUpload(e.target.files)} />
                    <Upload className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">평면도를 업로드하세요</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG, SVG 지원</p>
                  </div>
                ) : (
                  <div ref={floorPlanRef} className={`relative ${placingType ? "cursor-crosshair" : ""}`} onClick={handleFloorPlanClick}>
                    <img src={p.floorPlanUrl} alt="평면도" className="w-full rounded-lg" />
                    {/* Sensor markers */}
                    {sensorsList.data?.map((s: any) => {
                      if (s.posX == null || s.posY == null) return null;
                      const meta = getSensorMeta(s.type);
                      const Icon = meta.icon;
                      const latest = latestData.data?.find((d: any) => d.sensor.id === s.id);
                      return (
                        <div key={s.id}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                          style={{ left: `${s.posX / 10}%`, top: `${s.posY / 10}%` }}>
                          <div className="relative">
                            {/* Pulse ring */}
                            <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: meta.color }} />
                            {/* Marker */}
                            <div className="relative w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                              style={{ backgroundColor: meta.color }}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              <div className="bg-ink text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-xl">
                                <p className="font-semibold">{s.name}</p>
                                {s.zone && <p className="text-white/60">{s.zone}</p>}
                                {latest?.latestValue && (
                                  <p className="text-gold font-bold mt-1">{latest.latestValue} {s.unit}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {/* Upload new floor plan button */}
                    <button onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-md px-2 py-1 text-xs font-medium text-ink shadow-sm border border-border/50">
                      <Upload className="w-3 h-3 inline mr-1" />평면도 변경
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFloorPlanUpload(e.target.files)} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sensors List Tab */}
        {tab === "sensors" && (
          <div className="space-y-4">
            {!sensorsList.data?.length ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Settings className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">등록된 센서가 없습니다</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">평면도 탭에서 센서를 배치하세요</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sensorsList.data.map((s: any) => {
                  const meta = getSensorMeta(s.type);
                  const Icon = meta.icon;
                  const latest = latestData.data?.find((d: any) => d.sensor.id === s.id);
                  return (
                    <Card key={s.id} className="hover:border-gold/30 transition-colors">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${meta.color}15` }}>
                              <Icon className="w-5 h-5" style={{ color: meta.color }} />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{s.name}</p>
                              <p className="text-xs text-muted-foreground">{meta.label}{s.zone ? ` · ${s.zone}` : ""}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-destructive h-7 w-7 p-0"
                            onClick={() => { if (confirm("이 센서를 삭제하시겠습니까?")) deleteSensor.mutate({ id: s.id }); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground">최신 값</p>
                          <p className="text-2xl font-bold" style={{ color: meta.color }}>
                            {latest?.latestValue ?? "—"} <span className="text-sm font-normal text-muted-foreground">{s.unit}</span>
                          </p>
                          {latest?.latestAt && (
                            <p className="text-[10px] text-muted-foreground mt-1">{new Date(latest.latestAt).toLocaleString("ko-KR")}</p>
                          )}
                        </div>
                        {s.deviceId && <p className="text-[10px] text-muted-foreground mt-2">Device: {s.deviceId}</p>}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Data Tab */}
        {tab === "data" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-gold" /> 실시간 센서 데이터
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!latestData.data?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-8">센서 데이터가 없습니다. 센서를 배치하고 데이터를 수집하세요.</p>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {latestData.data.map((d: any) => {
                      const meta = getSensorMeta(d.sensor.type);
                      const Icon = meta.icon;
                      return (
                        <div key={d.sensor.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${meta.color}15` }}>
                            <Icon className="w-5 h-5" style={{ color: meta.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground truncate">{d.sensor.name}</p>
                            <p className="text-lg font-bold" style={{ color: meta.color }}>
                              {d.latestValue ?? "—"} <span className="text-xs font-normal text-muted-foreground">{d.sensor.unit}</span>
                            </p>
                          </div>
                          {d.sensor.zone && <Badge variant="outline" className="text-[10px] flex-shrink-0">{d.sensor.zone}</Badge>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Heatmap-style zone summary */}
            {latestData.data && latestData.data.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">존별 환경 요약</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const zones = new Map<string, any[]>();
                    latestData.data.forEach((d: any) => {
                      const zone = d.sensor.zone || "미지정";
                      if (!zones.has(zone)) zones.set(zone, []);
                      zones.get(zone)!.push(d);
                    });
                    return (
                      <div className="grid md:grid-cols-2 gap-4">
                        {Array.from(zones.entries()).map(([zone, items]) => (
                          <div key={zone} className="p-4 rounded-lg border border-border/50 bg-muted/20">
                            <h4 className="font-medium text-sm mb-3 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-gold" />{zone}
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {items.map((d: any) => {
                                const meta = getSensorMeta(d.sensor.type);
                                return (
                                  <div key={d.sensor.id} className="text-center">
                                    <p className="text-[10px] text-muted-foreground">{meta.label}</p>
                                    <p className="text-sm font-bold" style={{ color: meta.color }}>{d.latestValue ?? "—"}{d.sensor.unit ? ` ${d.sensor.unit}` : ""}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Analysis Tab */}
        {tab === "analysis" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="w-4 h-4 text-gold" /> AI 공간 분석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">센서 데이터를 기반으로 AI가 공간 설계에 반영할 인사이트를 도출합니다</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { type: "occupancy_pattern", label: "재실 패턴 분석" },
                    { type: "environmental", label: "환경 쾌적도 분석" },
                    { type: "energy", label: "에너지 효율 분석" },
                    { type: "comfort", label: "공간 쾌적 지수" },
                    { type: "traffic_flow", label: "동선 흐름 분석" },
                  ].map(a => (
                    <Button key={a.type} variant="outline" size="sm"
                      disabled={analyzeData.isPending}
                      onClick={() => analyzeData.mutate({ projectId, analysisType: a.type as any })}>
                      {analyzeData.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Brain className="w-3 h-3 mr-1" />}
                      {a.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            {analyses.data?.map((a: any) => (
              <Card key={a.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {a.analysisType === "occupancy_pattern" ? "재실 패턴" :
                       a.analysisType === "environmental" ? "환경 쾌적도" :
                       a.analysisType === "energy" ? "에너지 효율" :
                       a.analysisType === "comfort" ? "공간 쾌적 지수" : "동선 흐름"}
                    </CardTitle>
                    <span className="text-[10px] text-muted-foreground">{new Date(a.createdAt).toLocaleString("ko-KR")}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  {a.summary && <p className="text-sm text-ink/80 mb-4">{a.summary}</p>}
                  {a.dataJson?.findings && (
                    <div className="space-y-2 mb-4">
                      {a.dataJson.findings.map((f: any, i: number) => (
                        <div key={i} className={`p-3 rounded-lg border text-sm ${f.severity === "critical" ? "border-red-200 bg-red-50" : f.severity === "warning" ? "border-yellow-200 bg-yellow-50" : "border-blue-200 bg-blue-50"}`}>
                          <span className="font-medium">{f.area}:</span> {f.insight}
                        </div>
                      ))}
                    </div>
                  )}
                  {a.recommendations?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">설계 권장사항</p>
                      <ul className="space-y-1">
                        {a.recommendations.map((r: string, i: number) => (
                          <li key={i} className="text-sm text-ink/70 flex items-start gap-2">
                            <span className="text-gold mt-0.5">•</span>{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
