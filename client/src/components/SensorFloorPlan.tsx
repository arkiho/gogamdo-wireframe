/**
 * SensorFloorPlan - 인터랙티브 센서 배치 컴포넌트
 * - 평면도 위에 센서 마커 표시
 * - 드래그&드롭으로 센서 위치 이동
 * - 클릭으로 새 센서 배치
 * - 센서 클릭 시 상세 정보 패널
 * - 센서 유형별 아이콘/색상 구분
 */
import { useState, useRef, useCallback, useEffect } from "react";
import {
  Thermometer, Droplets, Sun, Wind, Volume2, Users,
  Activity, Zap, X, GripVertical, Trash2, Edit2, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const SENSOR_TYPES = [
  { value: "temperature", label: "온도", icon: Thermometer, unit: "°C", color: "#ef4444", bgColor: "#fef2f2" },
  { value: "humidity", label: "습도", icon: Droplets, unit: "%", color: "#3b82f6", bgColor: "#eff6ff" },
  { value: "illuminance", label: "조도", icon: Sun, unit: "lux", color: "#eab308", bgColor: "#fefce8" },
  { value: "co2", label: "CO₂", icon: Wind, unit: "ppm", color: "#22c55e", bgColor: "#f0fdf4" },
  { value: "noise", label: "소음", icon: Volume2, unit: "dB", color: "#a855f7", bgColor: "#faf5ff" },
  { value: "occupancy", label: "재실", icon: Users, unit: "명", color: "#f97316", bgColor: "#fff7ed" },
  { value: "motion", label: "동선", icon: Activity, unit: "", color: "#06b6d4", bgColor: "#ecfeff" },
  { value: "air_quality", label: "공기질", icon: Wind, unit: "AQI", color: "#10b981", bgColor: "#ecfdf5" },
  { value: "power", label: "전력", icon: Zap, unit: "W", color: "#f59e0b", bgColor: "#fffbeb" },
] as const;

function getSensorMeta(type: string) {
  return SENSOR_TYPES.find(s => s.value === type) || SENSOR_TYPES[0];
}

export interface SensorData {
  id: number;
  name: string;
  type: string;
  unit: string;
  posX: number | null;
  posY: number | null;
  zone?: string | null;
  deviceId?: string | null;
  active?: string;
}

export interface SensorLatestData {
  sensor: SensorData;
  latestValue?: string | number | null;
  latestAt?: string | null;
}

interface SensorFloorPlanProps {
  floorPlanUrl: string;
  sensors: SensorData[];
  latestData: SensorLatestData[];
  placingType: string | null;
  onPlaceSensor: (posX: number, posY: number) => void;
  onMoveSensor: (sensorId: number, posX: number, posY: number) => void;
  onDeleteSensor: (sensorId: number) => void;
  onUpdateSensor?: (sensorId: number, data: Partial<SensorData>) => void;
  onUploadFloorPlan?: () => void;
}

export function SensorFloorPlan({
  floorPlanUrl,
  sensors,
  latestData,
  placingType,
  onPlaceSensor,
  onMoveSensor,
  onDeleteSensor,
  onUpdateSensor,
  onUploadFloorPlan,
}: SensorFloorPlanProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ sensorId: number; startX: number; startY: number; origPosX: number; origPosY: number } | null>(null);
  const [selectedSensor, setSelectedSensor] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");

  // 평면도 클릭 → 새 센서 배치 또는 선택 해제
  const handleFloorPlanClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (dragging) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const posX = Math.round(((e.clientX - rect.left) / rect.width) * 1000);
    const posY = Math.round(((e.clientY - rect.top) / rect.height) * 1000);

    if (placingType) {
      onPlaceSensor(posX, posY);
    } else {
      setSelectedSensor(null);
    }
  }, [placingType, onPlaceSensor, dragging]);

  // 드래그 시작
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, sensor: SensorData) => {
    e.stopPropagation();
    e.preventDefault();
    if (sensor.posX == null || sensor.posY == null) return;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    setDragging({
      sensorId: sensor.id,
      startX: clientX,
      startY: clientY,
      origPosX: sensor.posX,
      origPosY: sensor.posY,
    });
  }, []);

  // 드래그 이동 + 종료
  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current || !dragging) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const rect = containerRef.current.getBoundingClientRect();

      const deltaX = ((clientX - dragging.startX) / rect.width) * 1000;
      const deltaY = ((clientY - dragging.startY) / rect.height) * 1000;

      const newPosX = Math.max(0, Math.min(1000, Math.round(dragging.origPosX + deltaX)));
      const newPosY = Math.max(0, Math.min(1000, Math.round(dragging.origPosY + deltaY)));

      // 임시 위치 업데이트 (시각적 피드백)
      const el = document.getElementById(`sensor-marker-${dragging.sensorId}`);
      if (el) {
        el.style.left = `${newPosX / 10}%`;
        el.style.top = `${newPosY / 10}%`;
      }
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current || !dragging) return;
      const clientX = "changedTouches" in e ? e.changedTouches[0].clientX : e.clientX;
      const clientY = "changedTouches" in e ? e.changedTouches[0].clientY : e.clientY;
      const rect = containerRef.current.getBoundingClientRect();

      const deltaX = ((clientX - dragging.startX) / rect.width) * 1000;
      const deltaY = ((clientY - dragging.startY) / rect.height) * 1000;

      const newPosX = Math.max(0, Math.min(1000, Math.round(dragging.origPosX + deltaX)));
      const newPosY = Math.max(0, Math.min(1000, Math.round(dragging.origPosY + deltaY)));

      // 의미 있는 이동인 경우에만 업데이트
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        onMoveSensor(dragging.sensorId, newPosX, newPosY);
        toast.success("센서 위치가 업데이트되었습니다");
      }

      setDragging(null);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [dragging, onMoveSensor]);

  // 센서 클릭 → 상세 정보 패널
  const handleSensorClick = useCallback((e: React.MouseEvent, sensorId: number) => {
    e.stopPropagation();
    if (dragging) return;
    setSelectedSensor(prev => prev === sensorId ? null : sensorId);
  }, [dragging]);

  const selectedSensorData = sensors.find(s => s.id === selectedSensor);
  const selectedLatest = latestData.find(d => d.sensor.id === selectedSensor);

  return (
    <div className="space-y-4">
      {/* 평면도 + 센서 마커 */}
      <div className="relative">
        <div
          ref={containerRef}
          className={`relative select-none ${placingType ? "cursor-crosshair" : ""} ${dragging ? "cursor-grabbing" : ""}`}
          onClick={handleFloorPlanClick}
        >
          <img
            src={floorPlanUrl}
            alt="평면도"
            className="w-full rounded-lg"
            draggable={false}
          />

          {/* 센서 마커 */}
          {sensors.map((s) => {
            if (s.posX == null || s.posY == null) return null;
            const meta = getSensorMeta(s.type);
            const Icon = meta.icon;
            const latest = latestData.find(d => d.sensor.id === s.id);
            const isSelected = selectedSensor === s.id;
            const isDragging = dragging?.sensorId === s.id;

            return (
              <div
                key={s.id}
                id={`sensor-marker-${s.id}`}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 group z-10 ${isDragging ? "z-50" : ""}`}
                style={{ left: `${s.posX / 10}%`, top: `${s.posY / 10}%` }}
              >
                <div className="relative">
                  {/* 선택 링 */}
                  {isSelected && (
                    <div
                      className="absolute -inset-2 rounded-full border-2 animate-pulse"
                      style={{ borderColor: meta.color }}
                    />
                  )}

                  {/* 활성 센서 펄스 */}
                  {s.active !== "no" && !isDragging && (
                    <div
                      className="absolute inset-0 rounded-full animate-ping opacity-20"
                      style={{ backgroundColor: meta.color }}
                    />
                  )}

                  {/* 메인 마커 */}
                  <div
                    className={`relative w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 transition-all ${isDragging ? "scale-125 shadow-2xl" : "hover:scale-110"}`}
                    style={{
                      backgroundColor: meta.color,
                      borderColor: isSelected ? "#fff" : "rgba(255,255,255,0.8)",
                      cursor: isDragging ? "grabbing" : "grab",
                    }}
                    onClick={(e) => handleSensorClick(e, s.id)}
                    onMouseDown={(e) => handleDragStart(e, s)}
                    onTouchStart={(e) => handleDragStart(e, s)}
                  >
                    <Icon className="w-4.5 h-4.5 text-white" />
                  </div>

                  {/* 드래그 힌트 */}
                  {!isDragging && !placingType && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-2.5 h-2.5 text-muted-foreground" />
                    </div>
                  )}

                  {/* 호버 툴팁 */}
                  {!isSelected && !isDragging && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      <div className="bg-ink text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-xl">
                        <p className="font-semibold">{s.name}</p>
                        {s.zone && <p className="text-white/60">{s.zone}</p>}
                        {latest?.latestValue != null && (
                          <p className="font-bold mt-1" style={{ color: meta.color === "#eab308" ? "#fbbf24" : meta.color }}>
                            {latest.latestValue} {s.unit}
                          </p>
                        )}
                        <p className="text-white/40 text-[10px] mt-1">드래그하여 이동 · 클릭하여 상세</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* 평면도 변경 버튼 */}
          {onUploadFloorPlan && (
            <button
              onClick={(e) => { e.stopPropagation(); onUploadFloorPlan(); }}
              className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-md px-2 py-1 text-xs font-medium text-ink shadow-sm border border-border/50 z-20"
            >
              평면도 변경
            </button>
          )}

          {/* 배치 모드 안내 */}
          {placingType && (
            <div className="absolute top-3 left-3 bg-gold/90 text-ink px-3 py-1.5 rounded-md text-xs font-medium shadow-sm z-20 animate-pulse">
              {getSensorMeta(placingType).label} 센서 배치 중 — 위치를 클릭하세요
            </div>
          )}
        </div>
      </div>

      {/* 선택된 센서 상세 정보 패널 */}
      {selectedSensorData && (
        <SensorDetailPanel
          sensor={selectedSensorData}
          latestData={selectedLatest}
          onClose={() => setSelectedSensor(null)}
          onDelete={() => {
            onDeleteSensor(selectedSensorData.id);
            setSelectedSensor(null);
          }}
          onUpdate={onUpdateSensor}
          editingName={editingName}
          editNameValue={editNameValue}
          onStartEditName={() => {
            setEditingName(selectedSensorData.name);
            setEditNameValue(selectedSensorData.name);
          }}
          onSaveEditName={() => {
            if (onUpdateSensor && editNameValue.trim()) {
              onUpdateSensor(selectedSensorData.id, { name: editNameValue.trim() });
              toast.success("센서 이름이 변경되었습니다");
            }
            setEditingName(null);
          }}
          onCancelEditName={() => setEditingName(null)}
          onEditNameChange={setEditNameValue}
        />
      )}

      {/* 센서 범례 */}
      <div className="flex flex-wrap gap-2">
        {SENSOR_TYPES.map(st => {
          const count = sensors.filter(s => s.type === st.value && s.posX != null).length;
          if (count === 0) return null;
          const Icon = st.icon;
          return (
            <div
              key={st.value}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border"
              style={{ borderColor: `${st.color}40`, backgroundColor: st.bgColor }}
            >
              <Icon className="w-3 h-3" style={{ color: st.color }} />
              <span style={{ color: st.color }} className="font-medium">{st.label}</span>
              <span className="text-muted-foreground">×{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 센서 상세 정보 패널 */
function SensorDetailPanel({
  sensor,
  latestData,
  onClose,
  onDelete,
  onUpdate,
  editingName,
  editNameValue,
  onStartEditName,
  onSaveEditName,
  onCancelEditName,
  onEditNameChange,
}: {
  sensor: SensorData;
  latestData?: SensorLatestData;
  onClose: () => void;
  onDelete: () => void;
  onUpdate?: (sensorId: number, data: Partial<SensorData>) => void;
  editingName: string | null;
  editNameValue: string;
  onStartEditName: () => void;
  onSaveEditName: () => void;
  onCancelEditName: () => void;
  onEditNameChange: (v: string) => void;
}) {
  const meta = getSensorMeta(sensor.type);
  const Icon = meta.icon;

  return (
    <Card className="border-2 animate-in slide-in-from-bottom-2 duration-200" style={{ borderColor: `${meta.color}40` }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: meta.color }}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              {editingName !== null ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={editNameValue}
                    onChange={(e) => onEditNameChange(e.target.value)}
                    className="h-7 text-sm w-40"
                    onKeyDown={(e) => { if (e.key === "Enter") onSaveEditName(); if (e.key === "Escape") onCancelEditName(); }}
                    autoFocus
                  />
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onSaveEditName}>
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onCancelEditName}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <CardTitle className="text-base">{sensor.name}</CardTitle>
                  <button onClick={onStartEditName} className="text-muted-foreground hover:text-foreground">
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[10px]" style={{ borderColor: meta.color, color: meta.color }}>
                  {meta.label}
                </Badge>
                {sensor.zone && (
                  <span className="text-xs text-muted-foreground">{sensor.zone}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              onClick={() => { if (confirm(`"${sensor.name}" 센서를 삭제하시겠습니까?`)) onDelete(); }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* 최신 값 */}
          <div className="p-3 rounded-lg" style={{ backgroundColor: meta.bgColor }}>
            <p className="text-[10px] text-muted-foreground mb-1">최신 측정값</p>
            <p className="text-2xl font-bold" style={{ color: meta.color }}>
              {latestData?.latestValue ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground">{sensor.unit}</p>
          </div>

          {/* 마지막 수집 */}
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-[10px] text-muted-foreground mb-1">마지막 수집</p>
            <p className="text-sm font-medium">
              {latestData?.latestAt
                ? new Date(latestData.latestAt).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                : "—"}
            </p>
          </div>

          {/* 위치 좌표 */}
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-[10px] text-muted-foreground mb-1">위치 좌표</p>
            <p className="text-sm font-medium font-mono">
              ({sensor.posX != null ? (sensor.posX / 10).toFixed(1) : "—"}%, {sensor.posY != null ? (sensor.posY / 10).toFixed(1) : "—"}%)
            </p>
          </div>

          {/* 디바이스 ID */}
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-[10px] text-muted-foreground mb-1">디바이스 ID</p>
            <p className="text-sm font-medium truncate">
              {sensor.deviceId || "미등록"}
            </p>
          </div>
        </div>

        {/* 상태 표시 */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${sensor.active === "no" ? "bg-gray-400" : "bg-green-500 animate-pulse"}`} />
            <span className="text-xs text-muted-foreground">
              {sensor.active === "no" ? "비활성" : "활성"}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            드래그하여 위치를 변경할 수 있습니다
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export { SENSOR_TYPES, getSensorMeta };
