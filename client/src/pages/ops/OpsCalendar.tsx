import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  ArrowLeft, Layers, Clock, MapPin,
} from "lucide-react";

type ViewMode = "month" | "week";

const EVENT_TYPE_LABELS: Record<string, string> = {
  schedule: "공정",
  meeting: "회의",
  deadline: "마감",
  project_start: "착공",
  project_end: "준공",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  schedule: "bg-amber-100 text-amber-800 border-amber-200",
  meeting: "bg-violet-100 text-violet-800 border-violet-200",
  deadline: "bg-red-100 text-red-800 border-red-200",
  project_start: "bg-blue-100 text-blue-800 border-blue-200",
  project_end: "bg-rose-100 text-rose-800 border-rose-200",
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month fill
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, isCurrentMonth: false });
  }

  // Current month
  for (let i = 1; i <= totalDays; i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }

  // Next month fill
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }

  return days;
}

function getWeekDays(baseDate: Date) {
  const start = new Date(baseDate);
  start.setDate(start.getDate() - start.getDay());
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function OpsCalendar() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calculate date range for API
  const dateRange = useMemo(() => {
    if (viewMode === "month") {
      const start = new Date(year, month, 1);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(year, month + 1, 0);
      end.setDate(end.getDate() + (6 - end.getDay()));
      return { startDate: formatDate(start), endDate: formatDate(end) };
    } else {
      const weekDays = getWeekDays(currentDate);
      return { startDate: formatDate(weekDays[0]), endDate: formatDate(weekDays[6]) };
    }
  }, [year, month, viewMode, currentDate]);

  const events = trpc.ops.calendar.events.useQuery(dateRange);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const ev of events.data ?? []) {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    }
    return map;
  }, [events.data]);

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (viewMode === "month") {
      d.setMonth(d.getMonth() + dir);
    } else {
      d.setDate(d.getDate() + dir * 7);
    }
    setCurrentDate(d);
  };

  const goToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(formatDate(new Date()));
  };

  const today = formatDate(new Date());

  // Selected date events
  const selectedEvents = selectedDate ? eventsByDate[selectedDate] ?? [] : [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setLocation("/ops")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors py-1 w-fit"
        >
          <ArrowLeft className="w-4 h-4" />OpsX 대시보드
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            프로젝트 캘린더
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToday} className="h-9">
              오늘
            </Button>
            <div className="flex border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "month" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                월간
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "week" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                주간
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold">
          {viewMode === "month"
            ? `${year}년 ${month + 1}월`
            : (() => {
                const weekDays = getWeekDays(currentDate);
                return `${weekDays[0].getMonth() + 1}/${weekDays[0].getDate()} - ${weekDays[6].getMonth() + 1}/${weekDays[6].getDate()}`;
              })()
          }
        </h2>
        <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Calendar Grid */}
        <Card className="flex-1">
          <CardContent className="p-2 sm:p-4">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((day, i) => (
                <div
                  key={day}
                  className={`text-center text-xs font-medium py-1.5 ${
                    i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted-foreground"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {viewMode === "month" ? (
              /* Month View */
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {getMonthDays(year, month).map((day, i) => {
                  const dateStr = formatDate(day.date);
                  const dayEvents = eventsByDate[dateStr] ?? [];
                  const isToday = dateStr === today;
                  const isSelected = dateStr === selectedDate;
                  const dayOfWeek = day.date.getDay();

                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`min-h-[60px] sm:min-h-[80px] p-1 sm:p-1.5 text-left transition-colors ${
                        day.isCurrentMonth ? "bg-card" : "bg-muted/30"
                      } ${isSelected ? "ring-2 ring-primary ring-inset" : ""} hover:bg-accent/50`}
                    >
                      <div className={`text-xs sm:text-sm font-medium mb-0.5 ${
                        isToday
                          ? "w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px]"
                          : !day.isCurrentMonth
                            ? "text-muted-foreground/40"
                            : dayOfWeek === 0
                              ? "text-red-500"
                              : dayOfWeek === 6
                                ? "text-blue-500"
                                : ""
                      }`}>
                        {day.date.getDate()}
                      </div>
                      {/* Event dots / mini labels */}
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((ev: any) => (
                          <div
                            key={ev.id}
                            className={`text-[9px] sm:text-[10px] leading-tight px-1 py-0.5 rounded truncate border ${
                              EVENT_TYPE_COLORS[ev.type] ?? "bg-gray-100 text-gray-700 border-gray-200"
                            }`}
                          >
                            <span className="hidden sm:inline">{ev.title}</span>
                            <span className="sm:hidden">{EVENT_TYPE_LABELS[ev.type] ?? ""}</span>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-[9px] text-muted-foreground text-center">
                            +{dayEvents.length - 3}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Week View */
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {getWeekDays(currentDate).map((day, i) => {
                  const dateStr = formatDate(day);
                  const dayEvents = eventsByDate[dateStr] ?? [];
                  const isToday = dateStr === today;
                  const isSelected = dateStr === selectedDate;

                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`min-h-[200px] p-1.5 sm:p-2 text-left transition-colors bg-card ${
                        isSelected ? "ring-2 ring-primary ring-inset" : ""
                      } hover:bg-accent/50`}
                    >
                      <div className={`text-sm font-medium mb-2 ${
                        isToday
                          ? "w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                          : i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : ""
                      }`}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.map((ev: any) => (
                          <div
                            key={ev.id}
                            className={`text-[10px] sm:text-xs leading-tight px-1.5 py-1 rounded border ${
                              EVENT_TYPE_COLORS[ev.type] ?? "bg-gray-100 text-gray-700 border-gray-200"
                            }`}
                          >
                            <div className="font-medium truncate">{ev.title}</div>
                            <div className="text-[9px] opacity-70 truncate">{ev.projectName}</div>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Detail Panel */}
        <div className="w-full lg:w-80 space-y-3">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3">
                {selectedDate
                  ? (() => {
                      const d = new Date(selectedDate + "T00:00:00");
                      return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
                    })()
                  : "날짜를 선택하세요"
                }
              </h3>
              {selectedDate && selectedEvents.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-6">
                  <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  일정이 없습니다
                </div>
              )}
              <div className="space-y-2">
                {selectedEvents.map((ev: any) => (
                  <div
                    key={ev.id}
                    className="border rounded-lg p-3 hover:bg-accent/30 transition-colors cursor-pointer"
                    onClick={() => {
                      if (ev.projectId) setLocation(`/ops/project/${ev.projectId}`);
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: ev.color ?? "#6b7280" }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1.5 py-0 ${
                              EVENT_TYPE_COLORS[ev.type] ?? ""
                            } border`}
                          >
                            {EVENT_TYPE_LABELS[ev.type] ?? ev.type}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium truncate">{ev.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{ev.projectName}</p>
                        {ev.progress !== undefined && ev.type === "schedule" && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full"
                                style={{ width: `${Math.min(ev.progress, 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground">{ev.progress}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardContent className="p-4">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">범례</h4>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                      style={{
                        backgroundColor:
                          key === "schedule" ? "#f59e0b"
                            : key === "meeting" ? "#8b5cf6"
                              : key === "deadline" ? "#ef4444"
                                : key === "project_start" ? "#3b82f6"
                                  : "#ef4444",
                      }}
                    />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
