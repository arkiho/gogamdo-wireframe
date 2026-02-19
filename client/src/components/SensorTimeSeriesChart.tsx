/**
 * SensorTimeSeriesChart - 센서 데이터 시계열 라인 차트
 * - 센서별 데이터 트렌드를 시각화
 * - 기간 선택 (1일/7일/30일)
 * - 이상치 하이라이트
 * - 미니 스파크라인 + 풀 차트 모드
 */
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, BarChart3 } from "lucide-react";

interface DataPoint {
  value: number;
  recordedAt: string | Date;
}

interface SeriesData {
  sensorId: number;
  sensorName: string;
  sensorType: string;
  zone: string | null;
  unit: string | null;
  data: DataPoint[];
}

interface SensorTimeSeriesChartProps {
  series: SeriesData[];
  period: "1d" | "7d" | "30d";
  onPeriodChange: (period: "1d" | "7d" | "30d") => void;
  isLoading?: boolean;
}

const SENSOR_COLORS: Record<string, string> = {
  temperature: "#ef4444",
  humidity: "#3b82f6",
  illuminance: "#eab308",
  co2: "#22c55e",
  noise: "#a855f7",
  occupancy: "#f97316",
  motion: "#06b6d4",
  air_quality: "#10b981",
  power: "#f59e0b",
};

function getSensorColor(type: string): string {
  return SENSOR_COLORS[type] || "#6b7280";
}

// SVG 라인 차트 렌더링
function MiniSparkline({ data, color, width = 120, height = 32 }: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return <div className="text-xs text-muted-foreground">데이터 부족</div>;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 마지막 점 강조 */}
      {data.length > 0 && (() => {
        const lastX = padding + ((data.length - 1) / (data.length - 1)) * (width - padding * 2);
        const lastY = height - padding - ((data[data.length - 1] - min) / range) * (height - padding * 2);
        return <circle cx={lastX} cy={lastY} r="2.5" fill={color} />;
      })()}
    </svg>
  );
}

// 풀 차트 (더 큰 SVG)
function FullLineChart({ series, color }: { series: DataPoint[]; color: string }) {
  if (series.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        데이터가 부족합니다 (최소 2개 포인트 필요)
      </div>
    );
  }

  const values = series.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 800;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // 데이터 포인트
  const points = series.map((d, i) => {
    const x = padding.left + (i / (series.length - 1)) * chartW;
    const y = padding.top + chartH - ((d.value - min) / range) * chartH;
    return { x, y, value: d.value, time: new Date(d.recordedAt) };
  });

  // 그라데이션 영역
  const areaPath = `M ${points[0].x} ${padding.top + chartH} ` +
    points.map(p => `L ${p.x} ${p.y}`).join(" ") +
    ` L ${points[points.length - 1].x} ${padding.top + chartH} Z`;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // Y축 눈금 (5개)
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = min + (range * i) / 4;
    const y = padding.top + chartH - (i / 4) * chartH;
    return { val, y };
  });

  // X축 시간 라벨 (최대 6개)
  const xLabelCount = Math.min(6, series.length);
  const xLabels = Array.from({ length: xLabelCount }, (_, i) => {
    const idx = Math.floor((i / (xLabelCount - 1)) * (series.length - 1));
    const time = new Date(series[idx].recordedAt);
    return {
      x: points[idx].x,
      label: `${time.getMonth() + 1}/${time.getDate()} ${time.getHours()}:${String(time.getMinutes()).padStart(2, "0")}`,
    };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* 그리드 라인 */}
      {yTicks.map((tick, i) => (
        <line key={i} x1={padding.left} y1={tick.y} x2={width - padding.right} y2={tick.y}
          stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="4 2" />
      ))}

      {/* Y축 라벨 */}
      {yTicks.map((tick, i) => (
        <text key={i} x={padding.left - 8} y={tick.y + 3} textAnchor="end" fontSize="9" fill="#9ca3af">
          {tick.val.toFixed(1)}
        </text>
      ))}

      {/* X축 라벨 */}
      {xLabels.map((label, i) => (
        <text key={i} x={label.x} y={height - 5} textAnchor="middle" fontSize="8" fill="#9ca3af">
          {label.label}
        </text>
      ))}

      {/* 영역 채우기 */}
      <path d={areaPath} fill={`url(#grad-${color.replace("#", "")})`} />

      {/* 라인 */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* 데이터 포인트 (간격 조정) */}
      {points.filter((_, i) => i % Math.max(1, Math.floor(points.length / 20)) === 0 || i === points.length - 1).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="white" stroke={color} strokeWidth="1.5" />
      ))}
    </svg>
  );
}

function getTrend(data: DataPoint[]): { direction: "up" | "down" | "flat"; percent: number } {
  if (data.length < 2) return { direction: "flat", percent: 0 };
  const recent = data.slice(-Math.ceil(data.length / 3));
  const earlier = data.slice(0, Math.ceil(data.length / 3));
  const recentAvg = recent.reduce((s, d) => s + d.value, 0) / recent.length;
  const earlierAvg = earlier.reduce((s, d) => s + d.value, 0) / earlier.length;
  if (earlierAvg === 0) return { direction: "flat", percent: 0 };
  const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;
  return {
    direction: Math.abs(change) < 2 ? "flat" : change > 0 ? "up" : "down",
    percent: Math.abs(change),
  };
}

// 이상치 감지 (IQR 방식)
function detectAnomalies(data: DataPoint[]): DataPoint[] {
  if (data.length < 10) return [];
  const values = data.map(d => d.value).sort((a, b) => a - b);
  const q1 = values[Math.floor(values.length * 0.25)];
  const q3 = values[Math.floor(values.length * 0.75)];
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  return data.filter(d => d.value < lower || d.value > upper);
}

export function SensorTimeSeriesChart({ series, period, onPeriodChange, isLoading }: SensorTimeSeriesChartProps) {
  const [expandedSensor, setExpandedSensor] = useState<number | null>(null);

  const periodLabels = { "1d": "1일", "7d": "7일", "30d": "30일" };

  return (
    <div className="space-y-4">
      {/* 기간 선택 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">시계열 데이터</span>
        </div>
        <div className="flex gap-1">
          {(["1d", "7d", "30d"] as const).map(p => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              size="sm"
              className={period === p ? "bg-gold text-ink hover:bg-gold/90" : ""}
              onClick={() => onPeriodChange(p)}
            >
              {periodLabels[p]}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">데이터 로딩 중...</p>
          </CardContent>
        </Card>
      ) : !series.length ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">시계열 데이터가 없습니다</p>
            <p className="text-xs text-muted-foreground/60 mt-1">센서 데이터가 수집되면 트렌드 차트가 표시됩니다</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {series.map(s => {
            const color = getSensorColor(s.sensorType);
            const trend = getTrend(s.data);
            const anomalies = detectAnomalies(s.data);
            const isExpanded = expandedSensor === s.sensorId;
            const latestValue = s.data.length > 0 ? s.data[s.data.length - 1].value : null;
            const sparkData = s.data.map(d => d.value);

            return (
              <Card
                key={s.sensorId}
                className={`cursor-pointer transition-all duration-200 ${isExpanded ? "border-gold/50 shadow-sm" : "hover:border-border"}`}
                onClick={() => setExpandedSensor(isExpanded ? null : s.sensorId)}
              >
                <CardContent className="pt-4">
                  {/* 요약 행 */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-sm font-medium truncate">{s.sensorName}</span>
                        {s.zone && <Badge variant="outline" className="text-[10px] flex-shrink-0">{s.zone}</Badge>}
                        {anomalies.length > 0 && (
                          <Badge variant="destructive" className="text-[10px] flex-shrink-0">
                            <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                            이상치 {anomalies.length}건
                          </Badge>
                        )}
                      </div>
                    </div>

                    <MiniSparkline data={sparkData} color={color} />

                    <div className="text-right flex-shrink-0 min-w-[80px]">
                      <p className="text-lg font-bold" style={{ color }}>
                        {latestValue !== null ? latestValue.toFixed(1) : "—"}
                        {s.unit && <span className="text-xs font-normal text-muted-foreground ml-0.5">{s.unit}</span>}
                      </p>
                      <div className="flex items-center justify-end gap-1 text-[10px]">
                        {trend.direction === "up" && <TrendingUp className="w-3 h-3 text-red-500" />}
                        {trend.direction === "down" && <TrendingDown className="w-3 h-3 text-blue-500" />}
                        {trend.direction === "flat" && <Minus className="w-3 h-3 text-gray-400" />}
                        <span className={trend.direction === "up" ? "text-red-500" : trend.direction === "down" ? "text-blue-500" : "text-gray-400"}>
                          {trend.percent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 확장된 차트 */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <FullLineChart series={s.data} color={color} />

                      {/* 통계 요약 */}
                      <div className="grid grid-cols-4 gap-3 mt-4">
                        <div className="text-center p-2 rounded-lg bg-muted/30">
                          <p className="text-[10px] text-muted-foreground">최소</p>
                          <p className="text-sm font-bold">{Math.min(...s.data.map(d => d.value)).toFixed(1)}</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/30">
                          <p className="text-[10px] text-muted-foreground">최대</p>
                          <p className="text-sm font-bold">{Math.max(...s.data.map(d => d.value)).toFixed(1)}</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/30">
                          <p className="text-[10px] text-muted-foreground">평균</p>
                          <p className="text-sm font-bold">
                            {(s.data.reduce((sum, d) => sum + d.value, 0) / s.data.length).toFixed(1)}
                          </p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/30">
                          <p className="text-[10px] text-muted-foreground">데이터 수</p>
                          <p className="text-sm font-bold">{s.data.length}</p>
                        </div>
                      </div>

                      {/* 이상치 목록 */}
                      {anomalies.length > 0 && (
                        <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-100">
                          <p className="text-xs font-medium text-red-700 mb-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> 이상치 감지 ({anomalies.length}건)
                          </p>
                          <div className="space-y-1">
                            {anomalies.slice(0, 5).map((a, i) => (
                              <div key={i} className="text-[11px] text-red-600 flex items-center justify-between">
                                <span>{new Date(a.recordedAt).toLocaleString("ko-KR")}</span>
                                <span className="font-bold">{a.value.toFixed(1)} {s.unit}</span>
                              </div>
                            ))}
                            {anomalies.length > 5 && (
                              <p className="text-[10px] text-red-400">외 {anomalies.length - 5}건</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
