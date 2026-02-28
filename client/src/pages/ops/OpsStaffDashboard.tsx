/**
 * 직원용 대시보드 - 출퇴근 + 휴가 신청 + 업무 현황
 */

import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link } from "wouter";
import {
  LayoutDashboard, FolderOpen, ClipboardList, Bell,
  ArrowRight, HardHat, Users, Camera, FileText,
  Calendar, CheckCircle2, Clock, AlertCircle,
  LogIn, LogOut, CalendarDays, Palmtree
} from "lucide-react";
import { toast } from "sonner";

const WORK_TYPE_LABELS: Record<string, string> = {
  office: "사무실",
  site: "현장",
  remote: "재택",
  half_day: "반일",
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: "연차",
  half_am: "오전 반차",
  half_pm: "오후 반차",
  sick: "병가",
  special: "경조사",
  other: "기타",
};

const LEAVE_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "대기", color: "bg-amber-100 text-amber-700" },
  approved: { label: "승인", color: "bg-green-100 text-green-700" },
  rejected: { label: "반려", color: "bg-red-100 text-red-700" },
  cancelled: { label: "취소", color: "bg-gray-100 text-gray-500" },
};

export default function OpsStaffDashboard() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // 출퇴근 상태
  const activeAttendance = trpc.attendance.active.useQuery();
  const myAttendance = trpc.attendance.myList.useQuery();
  const doClockIn = trpc.attendance.clockIn.useMutation({
    onSuccess: () => {
      toast.success("출근 처리되었습니다.");
      utils.attendance.active.invalidate();
      utils.attendance.myList.invalidate();
      setClockInOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });
  const doClockOut = trpc.attendance.clockOut.useMutation({
    onSuccess: (data) => {
      const hours = Math.floor((data.totalMinutes ?? 0) / 60);
      const mins = (data.totalMinutes ?? 0) % 60;
      toast.success(`퇴근 처리되었습니다. 근무시간: ${hours}시간 ${mins}분`);
      utils.attendance.active.invalidate();
      utils.attendance.myList.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // 휴가 신청
  const myLeaves = trpc.leave.myList.useQuery();
  const createLeave = trpc.leave.create.useMutation({
    onSuccess: () => {
      toast.success("휴가 신청이 완료되었습니다.");
      utils.leave.myList.invalidate();
      setLeaveOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });
  const cancelLeave = trpc.leave.cancel.useMutation({
    onSuccess: () => {
      toast.success("휴가가 취소되었습니다.");
      utils.leave.myList.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // OpsX 통계
  const opsStats = trpc.ops.getStats.useQuery();

  // UI 상태
  const [clockInOpen, setClockInOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [tab, setTab] = useState<"overview" | "attendance" | "leave">("overview");
  const [clockInForm, setClockInForm] = useState({ workType: "office", siteName: "", memo: "" });
  const [leaveForm, setLeaveForm] = useState({ leaveType: "annual", startDate: "", endDate: "", reason: "" });

  const departmentLabel: Record<string, string> = {
    design: "디자인팀", construction: "시공팀", accounting: "회계팀",
    management: "경영관리팀", sales: "영업팀", none: "미배정",
  };
  const roleLabel: Record<string, string> = {
    pm: "프로젝트 매니저", designer: "디자이너", site_manager: "현장 소장",
    accountant: "회계 담당", director: "이사", staff: "일반 직원",
  };

  const dept = (user as any)?.department ?? "none";
  const role = (user as any)?.opsRole ?? "staff";
  const isActive = !!activeAttendance.data;

  // 이번 달 근무 통계
  const monthStats = useMemo(() => {
    const records = myAttendance.data ?? [];
    const now = new Date();
    const thisMonth = records.filter((r: any) => {
      const d = new Date(r.clockInAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const totalMinutes = thisMonth.reduce((sum: number, r: any) => sum + (r.totalMinutes ?? 0), 0);
    return { days: thisMonth.length, hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
  }, [myAttendance.data]);

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="bg-ink text-white">
        <div className="container py-8">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/ops">
              <span className="text-gold/60 hover:text-gold text-sm transition-colors">OpsX</span>
            </Link>
            <span className="text-white/30">/</span>
            <span className="text-white/60 text-sm">직원 대시보드</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold">
                안녕하세요, {user?.name ?? "직원"}님
              </h1>
              <p className="text-white/50 text-sm mt-1">
                {departmentLabel[dept]} · {roleLabel[role]}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isActive ? (
                <Button
                  onClick={() => doClockOut.mutate({ id: activeAttendance.data!.id })}
                  disabled={doClockOut.isPending}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  {doClockOut.isPending ? "처리 중..." : "퇴근"}
                </Button>
              ) : (
                <Dialog open={clockInOpen} onOpenChange={setClockInOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gold text-ink hover:bg-gold-light">
                      <LogIn className="w-4 h-4 mr-1" />
                      출근
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>출근 등록</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>근무 유형</Label>
                        <Select value={clockInForm.workType} onValueChange={(v) => setClockInForm({ ...clockInForm, workType: v })}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="office">사무실</SelectItem>
                            <SelectItem value="site">현장</SelectItem>
                            <SelectItem value="remote">재택</SelectItem>
                            <SelectItem value="half_day">반일</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {clockInForm.workType === "site" && (
                        <div>
                          <Label>현장명</Label>
                          <Input
                            value={clockInForm.siteName}
                            onChange={(e) => setClockInForm({ ...clockInForm, siteName: e.target.value })}
                            placeholder="현장 이름 입력"
                            className="mt-1"
                          />
                        </div>
                      )}
                      <div>
                        <Label>메모 (선택)</Label>
                        <Textarea
                          value={clockInForm.memo}
                          onChange={(e) => setClockInForm({ ...clockInForm, memo: e.target.value })}
                          placeholder="오늘의 업무 메모"
                          className="mt-1"
                          rows={2}
                        />
                      </div>
                      <Button
                        className="w-full bg-gold text-ink hover:bg-gold-light"
                        onClick={() => doClockIn.mutate({
                          workType: clockInForm.workType as any,
                          siteName: clockInForm.siteName || undefined,
                          memo: clockInForm.memo || undefined,
                        })}
                        disabled={doClockIn.isPending}
                      >
                        {doClockIn.isPending ? "처리 중..." : "출근 등록"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <Badge className={`${isActive ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>
                {isActive ? "근무 중" : "미출근"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 border-b border-border/50">
          {[
            { key: "overview", label: "개요", icon: LayoutDashboard },
            { key: "attendance", label: "출퇴근 기록", icon: Clock },
            { key: "leave", label: "휴가 관리", icon: Palmtree },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? "border-gold text-gold"
                  : "border-transparent text-muted-foreground hover:text-ink"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ===== Overview Tab ===== */}
        {tab === "overview" && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-ink">{monthStats.days}</p>
                    <p className="text-xs text-muted-foreground">이번 달 출근일</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-ink">{monthStats.hours}h {monthStats.minutes}m</p>
                    <p className="text-xs text-muted-foreground">이번 달 근무시간</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-ink">{opsStats.data?.activeProjects ?? 0}</p>
                    <p className="text-xs text-muted-foreground">진행 중 프로젝트</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Palmtree className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-ink">
                      {(myLeaves.data ?? []).filter((l: any) => l.status === "pending").length}
                    </p>
                    <p className="text-xs text-muted-foreground">대기 중 휴가</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Navigation */}
            <h2 className="font-heading text-lg font-bold text-ink mb-4">빠른 이동</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "프로젝트 관리", href: "/ops/projects", icon: FolderOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
                { label: "공정 관리", href: "/ops/schedule", icon: ClipboardList, color: "text-green-500", bg: "bg-green-500/10" },
                { label: "현장 카메라", href: "/ops/cameras", icon: Camera, color: "text-purple-500", bg: "bg-purple-500/10" },
                { label: "결재 관리", href: "/ops/approval", icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10" },
                { label: "직원 관리", href: "/ops/staff", icon: Users, color: "text-teal-500", bg: "bg-teal-500/10" },
                { label: "협력업체", href: "/ops/partners", icon: HardHat, color: "text-orange-500", bg: "bg-orange-500/10" },
                { label: "일정 관리", href: "/ops/calendar", icon: Calendar, color: "text-pink-500", bg: "bg-pink-500/10" },
                { label: "OpsX 홈", href: "/ops", icon: LayoutDashboard, color: "text-gold", bg: "bg-gold/10" },
              ].map((item) => (
                <Link key={item.href} href={item.href}>
                  <Card className="border-border/50 hover:border-gold/30 hover:shadow-sm transition-all cursor-pointer group h-full">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center`}>
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <span className="text-sm font-medium text-ink group-hover:text-gold transition-colors">{item.label}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* ===== Attendance Tab ===== */}
        {tab === "attendance" && (
          <div>
            {/* Active attendance info */}
            {isActive && activeAttendance.data && (
              <Card className="border-green-500/30 bg-green-50 mb-6">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <div>
                      <p className="font-medium text-ink">현재 근무 중</p>
                      <p className="text-sm text-muted-foreground">
                        출근: {new Date(activeAttendance.data.clockInAt).toLocaleTimeString("ko-KR")} ·{" "}
                        {WORK_TYPE_LABELS[activeAttendance.data.workType] ?? activeAttendance.data.workType}
                        {activeAttendance.data.siteName && ` · ${activeAttendance.data.siteName}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => doClockOut.mutate({ id: activeAttendance.data!.id })}
                    disabled={doClockOut.isPending}
                    size="sm"
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    퇴근
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Attendance History */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">출퇴근 기록</CardTitle>
              </CardHeader>
              <CardContent>
                {(myAttendance.data ?? []).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">출퇴근 기록이 없습니다.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">날짜</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">출근</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">퇴근</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">근무유형</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">근무시간</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(myAttendance.data ?? []).slice(0, 30).map((record: any) => (
                          <tr key={record.id} className="border-b border-border/30">
                            <td className="py-2 px-3">{new Date(record.clockInAt).toLocaleDateString("ko-KR")}</td>
                            <td className="py-2 px-3">{new Date(record.clockInAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</td>
                            <td className="py-2 px-3">
                              {record.clockOutAt
                                ? new Date(record.clockOutAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
                                : <Badge className="bg-green-100 text-green-700 text-xs">근무 중</Badge>}
                            </td>
                            <td className="py-2 px-3">{WORK_TYPE_LABELS[record.workType] ?? record.workType}</td>
                            <td className="py-2 px-3">
                              {record.totalMinutes != null
                                ? `${Math.floor(record.totalMinutes / 60)}h ${record.totalMinutes % 60}m`
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== Leave Tab ===== */}
        {tab === "leave" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-bold text-ink">휴가 관리</h2>
              <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gold text-ink hover:bg-gold-light">
                    <Palmtree className="w-4 h-4 mr-1" />
                    휴가 신청
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>휴가 신청</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>휴가 유형</Label>
                      <Select value={leaveForm.leaveType} onValueChange={(v) => setLeaveForm({ ...leaveForm, leaveType: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="annual">연차</SelectItem>
                          <SelectItem value="half_am">오전 반차</SelectItem>
                          <SelectItem value="half_pm">오후 반차</SelectItem>
                          <SelectItem value="sick">병가</SelectItem>
                          <SelectItem value="special">경조사</SelectItem>
                          <SelectItem value="other">기타</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>시작일</Label>
                        <Input
                          type="date"
                          value={leaveForm.startDate}
                          onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>종료일</Label>
                        <Input
                          type="date"
                          value={leaveForm.endDate}
                          onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>사유</Label>
                      <Textarea
                        value={leaveForm.reason}
                        onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                        placeholder="휴가 사유를 입력하세요"
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <Button
                      className="w-full bg-gold text-ink hover:bg-gold-light"
                      onClick={() => {
                        if (!leaveForm.startDate || !leaveForm.endDate) {
                          toast.error("시작일과 종료일을 입력하세요.");
                          return;
                        }
                        createLeave.mutate({
                          leaveType: leaveForm.leaveType as any,
                          startDate: leaveForm.startDate,
                          endDate: leaveForm.endDate,
                          reason: leaveForm.reason || undefined,
                        });
                      }}
                      disabled={createLeave.isPending}
                    >
                      {createLeave.isPending ? "신청 중..." : "휴가 신청"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="border-border/50">
              <CardContent className="pt-6">
                {(myLeaves.data ?? []).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">휴가 신청 내역이 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {(myLeaves.data ?? []).map((leave: any) => {
                      const statusInfo = LEAVE_STATUS_LABELS[leave.status] ?? { label: leave.status, color: "bg-gray-100 text-gray-500" };
                      return (
                        <div key={leave.id} className="flex items-center justify-between p-4 border border-border/30 rounded-lg">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-ink">{LEAVE_TYPE_LABELS[leave.leaveType] ?? leave.leaveType}</span>
                              <Badge className={`text-xs ${statusInfo.color}`}>{statusInfo.label}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {leave.startDate} ~ {leave.endDate}
                              {leave.reason && ` · ${leave.reason}`}
                            </p>
                            {leave.reviewComment && (
                              <p className="text-xs text-muted-foreground mt-1">검토 의견: {leave.reviewComment}</p>
                            )}
                          </div>
                          {leave.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => {
                                if (confirm("이 휴가 신청을 취소하시겠습니까?")) {
                                  cancelLeave.mutate({ id: leave.id });
                                }
                              }}
                            >
                              취소
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
