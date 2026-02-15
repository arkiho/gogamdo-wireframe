/**
 * TrafficFlowChart - 구역 간 동선 분석 시각화
 * - 구역 간 이동 패턴을 화살표/흐름으로 시각화
 * - 이동 빈도에 따른 선 굵기 변화
 * - 체류 시간 분석 차트
 */
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Route, Clock, TrendingUp, BarChart3 } from "lucide-react";

interface ZoneInfo {
  id: number;
  name: string;
  color: string;
  zoneType: string;
  polygon: { x: number; y: number }[] | null;
}

interface Transition {
  fromZoneId: number;
  toZoneId: number;
  count: number;
  avgMinutes: number;
}

interface HourlyData {
  hour: number;
  avgOccupancy: number;
  maxOccupancy: number;
  totalMinutes: number;
}

interface TrafficFlowChartProps {
  zones: ZoneInfo[];
  transitions: Transition[];
  hourlyData?: HourlyData[];
  selectedZoneName?: string;
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

export function TrafficFlowChart({ zones, transitions, hourlyData, selectedZoneName }: TrafficFlowChartProps) {
  const [viewMode, setViewMode] = useState<"flow" | "hourly">("flow");

  const maxCount = useMemo(() => {
    if (!transitions.length) return 1;
    return Math.max(...transitions.map(t => t.count), 1);
  }, [transitions]);

  // 구역 중심 좌표 계산
  const zoneCenters = useMemo(() => {
    const centers: Record<number, { x: number; y: number }> = {};
    zones.forEach(z => {
      if (z.polygon && z.polygon.length >= 3) {
        centers[z.id] = {
          x: z.polygon.reduce((s, p) => s + p.x, 0) / z.polygon.length / 10,
          y: z.polygon.reduce((s, p) => s + p.y, 0) / z.polygon.length / 10,
        };
      }
    });
    return centers;
  }, [zones]);

  // 시간별 차트 최대값
  const maxHourly = useMemo(() => {
    if (!hourlyData?.length) return 1;
    return Math.max(...hourlyData.map(h => h.avgOccupancy), 1);
  }, [hourlyData]);

  return (
    <div className="space-y-4">
      {/* 뷰 전환 */}
      <div className="flex gap-2">
        <button
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            viewMode === "flow" ? "bg-gold text-ink" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
          onClick={() => setViewMode("flow")}
        >
          <Route className="w-3 h-3" /> 동선 패턴
        </button>
        <button
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            viewMode === "hourly" ? "bg-gold text-ink" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
          onClick={() => setViewMode("hourly")}
        >
          <BarChart3 className="w-3 h-3" /> 시간대별 분석
        </button>
      </div>

      {viewMode === "flow" ? (
        <>
          {/* 동선 다이어그램 (SVG) */}
          {Object.keys(zoneCenters).length >= 2 && transitions.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Route className="w-4 h-4 text-gold" /> 구역 간 이동 흐름도
                </CardTitle>
              </CardHeader>
              <CardContent>
                <svg viewBox="0 0 100 100" className="w-full aspect-square bg-muted/20 rounded-lg">
                  <defs>
                    <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                      <polygon points="0 0, 6 2, 0 4" fill="#b8860b" />
                    </marker>
                  </defs>

                  {/* 이동 화살표 */}
                  {transitions.slice(0, 15).map((t, i) => {
                    const from = zoneCenters[t.fromZoneId];
                    const to = zoneCenters[t.toZoneId];
                    if (!from || !to) return null;

                    const ratio = t.count / maxCount;
                    const strokeWidth = 0.3 + ratio * 1.2;
                    const opacity = 0.3 + ratio * 0.5;

                    // 약간 커브를 줘서 양방향 화살표가 겹치지 않게
                    const midX = (from.x + to.x) / 2 + (from.y - to.y) * 0.1;
                    const midY = (from.y + to.y) / 2 + (to.x - from.x) * 0.1;

                    return (
                      <g key={`${t.fromZoneId}-${t.toZoneId}`}>
                        <path
                          d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                          fill="none"
                          stroke="#b8860b"
                          strokeWidth={strokeWidth}
                          strokeOpacity={opacity}
                          markerEnd="url(#arrowhead)"
                          className="transition-all duration-300"
                        />
                        {/* 이동 횟수 라벨 */}
                        <text
                          x={midX}
                          y={midY - 1}
                          textAnchor="middle"
                          fontSize="1.5"
                          fill="#b8860b"
                          fontWeight="bold"
                        >
                          {t.count}
                        </text>
                      </g>
                    );
                  })}

                  {/* 구역 노드 */}
                  {zones.map(z => {
                    const center = zoneCenters[z.id];
                    if (!center) return null;
                    return (
                      <g key={z.id}>
                        <circle
                          cx={center.x}
                          cy={center.y}
                          r="3"
                          fill={z.color}
                          stroke="#fff"
                          strokeWidth="0.3"
                          className="drop-shadow-sm"
                        />
                        <text
                          x={center.x}
                          y={center.y + 5}
                          textAnchor="middle"
                          fontSize="1.8"
                          fontWeight="600"
                          fill="#333"
                        >
                          {z.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </CardContent>
            </Card>
          )}

          {/* 동선 패턴 리스트 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gold" /> 주요 이동 경로 (상위 {Math.min(transitions.length, 10)}개)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transitions.length === 0 ? (
                <div className="py-8 text-center">
                  <Route className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">동선 데이터가 없습니다</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">재실센서 데이터가 수집되면 이동 패턴이 표시됩니다</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transitions.slice(0, 10).map((t, i) => {
                    const fromZone = zones.find(z => z.id === t.fromZoneId);
                    const toZone = zones.find(z => z.id === t.toZoneId);
                    const ratio = t.count / maxCount;

                    return (
                      <div key={`${t.fromZoneId}-${t.toZoneId}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                        <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fromZone?.color || "#ccc" }} />
                            <span className="text-sm font-medium truncate">{fromZone?.name || `Zone ${t.fromZoneId}`}</span>
                          </div>
                          <ArrowRight className="w-3 h-3 text-gold flex-shrink-0" />
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: toZone?.color || "#ccc" }} />
                            <span className="text-sm font-medium truncate">{toZone?.name || `Zone ${t.toZoneId}`}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-bold">{t.count}회</p>
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gold transition-all duration-500"
                                style={{ width: `${ratio * 100}%` }}
                              />
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            <Clock className="w-2.5 h-2.5 mr-0.5" />
                            {t.avgMinutes}분
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        /* 시간대별 분석 차트 */
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gold" />
              {selectedZoneName ? `${selectedZoneName} - 시간대별 재실 패턴` : "시간대별 재실 패턴"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!hourlyData?.length ? (
              <div className="py-8 text-center">
                <BarChart3 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">시간대별 데이터가 없습니다</p>
                <p className="text-xs text-muted-foreground/60 mt-1">구역을 선택하면 시간대별 재실 패턴이 표시됩니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* 바 차트 */}
                <div className="flex items-end gap-1 h-40">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const data = hourlyData.find(h => h.hour === hour);
                    const avg = data?.avgOccupancy ?? 0;
                    const height = maxHourly > 0 ? (avg / maxHourly) * 100 : 0;
                    const isWorkHour = hour >= 9 && hour <= 18;

                    return (
                      <div key={hour} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full relative" style={{ height: "100%" }}>
                          <div
                            className="absolute bottom-0 w-full rounded-t transition-all duration-500"
                            style={{
                              height: `${height}%`,
                              backgroundColor: isWorkHour ? "#b8860b" : "#d1d5db",
                              opacity: isWorkHour ? 0.8 : 0.4,
                            }}
                          />
                        </div>
                        {hour % 3 === 0 && (
                          <span className="text-[9px] text-muted-foreground">{hour}시</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 요약 통계 */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/50">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">피크 시간</p>
                    <p className="text-sm font-bold">
                      {hourlyData.length > 0
                        ? `${hourlyData.reduce((max, h) => h.avgOccupancy > max.avgOccupancy ? h : max, hourlyData[0]).hour}시`
                        : "-"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">평균 재실 인원</p>
                    <p className="text-sm font-bold">
                      {hourlyData.length > 0
                        ? `${Math.round(hourlyData.reduce((s, h) => s + h.avgOccupancy, 0) / hourlyData.length)}명`
                        : "-"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">총 재실 시간</p>
                    <p className="text-sm font-bold">
                      {hourlyData.length > 0
                        ? `${hourlyData.reduce((s, h) => s + h.totalMinutes, 0)}분`
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
