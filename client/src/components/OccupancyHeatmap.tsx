/**
 * OccupancyHeatmap - 평면도 위 구역별 재실 히트맵 오버레이
 * - 구역 폴리곤을 색상 그라데이션으로 표시 (파랑→빨강)
 * - 시간대별 필터 (일간/주간/월간)
 * - 구역 클릭 시 상세 정보 팝업
 * - 색상 범례 표시
 */
import { useState, useMemo, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Clock, Users, TrendingUp, Calendar } from "lucide-react";

export interface ZoneData {
  id: number;
  name: string;
  color: string;
  polygon: { x: number; y: number }[] | null;
  zoneType: string;
  capacity: number | null;
}

export interface HeatmapEntry {
  zoneId: number;
  totalMinutes: number;
  avgOccupancy: number;
  maxOccupancy: number;
  totalEnters: number;
  totalExits: number;
}

interface OccupancyHeatmapProps {
  floorPlanUrl: string;
  zones: ZoneData[];
  heatmapData: HeatmapEntry[];
  dateRange: "day" | "week" | "month";
  onDateRangeChange: (range: "day" | "week" | "month") => void;
  onZoneClick?: (zoneId: number) => void;
}

// 히트맵 색상: 파랑(낮음) → 초록 → 노랑 → 빨강(높음)
function getHeatColor(ratio: number): string {
  // ratio: 0~1 (0=사용 안 함, 1=최대 사용)
  const clamped = Math.max(0, Math.min(1, ratio));
  if (clamped < 0.25) {
    // 파랑 → 시안
    const t = clamped / 0.25;
    return `rgba(59, 130, 246, ${0.15 + t * 0.2})`;  // blue
  } else if (clamped < 0.5) {
    // 시안 → 초록
    const t = (clamped - 0.25) / 0.25;
    return `rgba(34, 197, 94, ${0.25 + t * 0.15})`;  // green
  } else if (clamped < 0.75) {
    // 초록 → 노랑
    const t = (clamped - 0.5) / 0.25;
    return `rgba(234, 179, 8, ${0.35 + t * 0.15})`;  // yellow
  } else {
    // 노랑 → 빨강
    const t = (clamped - 0.75) / 0.25;
    return `rgba(239, 68, 68, ${0.4 + t * 0.25})`;   // red
  }
}

function getHeatBorderColor(ratio: number): string {
  const clamped = Math.max(0, Math.min(1, ratio));
  if (clamped < 0.25) return "rgba(59, 130, 246, 0.6)";
  if (clamped < 0.5) return "rgba(34, 197, 94, 0.6)";
  if (clamped < 0.75) return "rgba(234, 179, 8, 0.6)";
  return "rgba(239, 68, 68, 0.7)";
}

const ZONE_TYPE_LABELS: Record<string, string> = {
  office: "사무실",
  meeting: "회의실",
  corridor: "복도",
  lounge: "휴게실",
  restroom: "화장실",
  kitchen: "탕비실",
  storage: "창고",
  other: "기타",
};

export function OccupancyHeatmap({
  floorPlanUrl,
  zones,
  heatmapData,
  dateRange,
  onDateRangeChange,
  onZoneClick,
}: OccupancyHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredZone, setHoveredZone] = useState<number | null>(null);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);

  // 최대값 계산 (정규화용)
  const maxMinutes = useMemo(() => {
    if (!heatmapData.length) return 1;
    return Math.max(...heatmapData.map(h => h.totalMinutes), 1);
  }, [heatmapData]);

  const maxEnters = useMemo(() => {
    if (!heatmapData.length) return 1;
    return Math.max(...heatmapData.map(h => h.totalEnters), 1);
  }, [heatmapData]);

  // 폴리곤 좌표를 SVG path로 변환
  const polygonToPath = useCallback((polygon: { x: number; y: number }[]) => {
    if (!polygon || polygon.length < 3) return "";
    const points = polygon.map((p, i) => {
      const x = p.x / 10; // 0-1000 → 0-100%
      const y = p.y / 10;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    });
    return points.join(" ") + " Z";
  }, []);

  const handleZoneClick = useCallback((zoneId: number) => {
    setSelectedZone(prev => prev === zoneId ? null : zoneId);
    onZoneClick?.(zoneId);
  }, [onZoneClick]);

  const selectedZoneData = zones.find(z => z.id === selectedZone);
  const selectedHeat = heatmapData.find(h => h.zoneId === selectedZone);

  return (
    <div className="space-y-4">
      {/* 기간 필터 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">분석 기간</span>
        </div>
        <div className="flex gap-1">
          {([
            { key: "day", label: "일간" },
            { key: "week", label: "주간" },
            { key: "month", label: "월간" },
          ] as const).map(opt => (
            <Button
              key={opt.key}
              variant={dateRange === opt.key ? "default" : "outline"}
              size="sm"
              className={dateRange === opt.key ? "bg-gold text-ink hover:bg-gold/90" : ""}
              onClick={() => onDateRangeChange(opt.key)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 히트맵 평면도 */}
      <div className="relative rounded-lg overflow-hidden border border-border/50">
        <div ref={containerRef} className="relative">
          <img
            src={floorPlanUrl}
            alt="평면도 히트맵"
            className="w-full"
            draggable={false}
          />

          {/* SVG 오버레이 */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {zones.map(zone => {
              if (!zone.polygon || zone.polygon.length < 3) return null;
              const heat = heatmapData.find(h => h.zoneId === zone.id);
              const ratio = heat ? heat.totalMinutes / maxMinutes : 0;
              const isHovered = hoveredZone === zone.id;
              const isSelected = selectedZone === zone.id;

              return (
                <g key={zone.id}>
                  <path
                    d={polygonToPath(zone.polygon)}
                    fill={getHeatColor(ratio)}
                    stroke={isSelected ? "#fff" : getHeatBorderColor(ratio)}
                    strokeWidth={isSelected ? 0.5 : isHovered ? 0.3 : 0.15}
                    className="cursor-pointer transition-all duration-200"
                    style={{
                      filter: isHovered ? "brightness(1.2)" : undefined,
                    }}
                    onMouseEnter={() => setHoveredZone(zone.id)}
                    onMouseLeave={() => setHoveredZone(null)}
                    onClick={() => handleZoneClick(zone.id)}
                  />
                  {/* 구역 라벨 */}
                  {zone.polygon.length >= 3 && (() => {
                    const cx = zone.polygon.reduce((s, p) => s + p.x, 0) / zone.polygon.length / 10;
                    const cy = zone.polygon.reduce((s, p) => s + p.y, 0) / zone.polygon.length / 10;
                    return (
                      <text
                        x={cx}
                        y={cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="pointer-events-none select-none"
                        fontSize="1.8"
                        fontWeight="600"
                        fill={ratio > 0.5 ? "#fff" : "#1a1a1a"}
                        style={{ textShadow: ratio > 0.5 ? "0 0 3px rgba(0,0,0,0.5)" : "0 0 3px rgba(255,255,255,0.8)" }}
                      >
                        {zone.name}
                      </text>
                    );
                  })()}
                </g>
              );
            })}
          </svg>

          {/* 호버 툴팁 */}
          {hoveredZone && !selectedZone && (() => {
            const zone = zones.find(z => z.id === hoveredZone);
            const heat = heatmapData.find(h => h.zoneId === hoveredZone);
            if (!zone) return null;
            return (
              <div className="absolute top-3 left-3 bg-ink/90 text-white px-3 py-2 rounded-lg text-xs shadow-xl z-20 backdrop-blur-sm">
                <p className="font-semibold">{zone.name}</p>
                <p className="text-white/60">{ZONE_TYPE_LABELS[zone.zoneType] || zone.zoneType}</p>
                {heat && (
                  <div className="mt-1 space-y-0.5">
                    <p>재실 시간: <span className="font-bold text-gold">{heat.totalMinutes}분</span></p>
                    <p>평균 인원: <span className="font-bold">{Math.round(heat.avgOccupancy)}명</span></p>
                    <p>입장 횟수: <span className="font-bold">{heat.totalEnters}회</span></p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* 색상 범례 */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground font-medium">사용 빈도</span>
        <div className="flex items-center gap-0.5">
          <span className="text-[10px] text-muted-foreground">낮음</span>
          <div className="flex h-3">
            {[0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1].map((v, i) => (
              <div
                key={i}
                className="w-6 h-full"
                style={{ backgroundColor: getHeatColor(v) }}
              />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">높음</span>
        </div>
      </div>

      {/* 선택된 구역 상세 정보 */}
      {selectedZoneData && (
        <Card className="border-2 border-gold/30 animate-in slide-in-from-bottom-2 duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedZoneData.color }} />
                <CardTitle className="text-base">{selectedZoneData.name}</CardTitle>
                <Badge variant="outline" className="text-[10px]">
                  {ZONE_TYPE_LABELS[selectedZoneData.zoneType] || selectedZoneData.zoneType}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedZone(null)} className="h-7 text-xs">
                닫기
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-orange-50">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3 h-3 text-orange-500" />
                  <p className="text-[10px] text-muted-foreground">총 재실 시간</p>
                </div>
                <p className="text-xl font-bold text-orange-600">
                  {selectedHeat?.totalMinutes ?? 0}<span className="text-xs font-normal ml-0.5">분</span>
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="w-3 h-3 text-blue-500" />
                  <p className="text-[10px] text-muted-foreground">평균 인원</p>
                </div>
                <p className="text-xl font-bold text-blue-600">
                  {Math.round(selectedHeat?.avgOccupancy ?? 0)}<span className="text-xs font-normal ml-0.5">명</span>
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <div className="flex items-center gap-1.5 mb-1">
                  <Flame className="w-3 h-3 text-red-500" />
                  <p className="text-[10px] text-muted-foreground">최대 인원</p>
                </div>
                <p className="text-xl font-bold text-red-600">
                  {selectedHeat?.maxOccupancy ?? 0}<span className="text-xs font-normal ml-0.5">명</span>
                  {selectedZoneData.capacity && (
                    <span className="text-xs font-normal text-muted-foreground ml-1">/ {selectedZoneData.capacity}</span>
                  )}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <p className="text-[10px] text-muted-foreground">입장 횟수</p>
                </div>
                <p className="text-xl font-bold text-green-600">
                  {selectedHeat?.totalEnters ?? 0}<span className="text-xs font-normal ml-0.5">회</span>
                </p>
              </div>
            </div>
            {/* 수용률 바 */}
            {selectedZoneData.capacity && selectedHeat && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">수용률 (최대 기준)</span>
                  <span className="font-medium">
                    {Math.round((selectedHeat.maxOccupancy / selectedZoneData.capacity) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (selectedHeat.maxOccupancy / selectedZoneData.capacity) * 100)}%`,
                      backgroundColor: (selectedHeat.maxOccupancy / selectedZoneData.capacity) > 0.9 ? "#ef4444" :
                        (selectedHeat.maxOccupancy / selectedZoneData.capacity) > 0.7 ? "#eab308" : "#22c55e",
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 구역별 요약 테이블 */}
      {heatmapData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Flame className="w-4 h-4 text-gold" /> 구역별 활용도 순위
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...heatmapData]
                .sort((a, b) => b.totalMinutes - a.totalMinutes)
                .map((heat, i) => {
                  const zone = zones.find(z => z.id === heat.zoneId);
                  if (!zone) return null;
                  const ratio = heat.totalMinutes / maxMinutes;
                  return (
                    <div
                      key={heat.zoneId}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => handleZoneClick(heat.zoneId)}
                    >
                      <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: zone.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{zone.name}</span>
                          <Badge variant="outline" className="text-[9px] flex-shrink-0">
                            {ZONE_TYPE_LABELS[zone.zoneType] || zone.zoneType}
                          </Badge>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${ratio * 100}%`,
                              backgroundColor: getHeatBorderColor(ratio),
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold">{heat.totalMinutes}분</p>
                        <p className="text-[10px] text-muted-foreground">평균 {Math.round(heat.avgOccupancy)}명</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 데이터 없음 */}
      {!heatmapData.length && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Flame className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">히트맵 데이터가 없습니다</p>
            <p className="text-xs text-muted-foreground/60 mt-1">재실센서 데이터가 수집되면 구역별 활용도가 표시됩니다</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
