import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Users, Shield, Building2, UserCog, Search, Mail, UserPlus, UserMinus, CheckCircle2, XCircle, Clock, Send, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const DEPT_LABELS: Record<string, { label: string; color: string }> = {
  design: { label: "설계팀", color: "bg-blue-100 text-blue-700" },
  construction: { label: "시공팀", color: "bg-amber-100 text-amber-700" },
  accounting: { label: "경리부", color: "bg-green-100 text-green-700" },
  management: { label: "경영지원", color: "bg-purple-100 text-purple-700" },
  sales: { label: "영업팀", color: "bg-cyan-100 text-cyan-700" },
  none: { label: "미배정", color: "bg-gray-100 text-gray-500" },
};

const OPS_ROLE_LABELS: Record<string, string> = {
  pm: "프로젝트 매니저",
  designer: "설계 담당",
  site_manager: "현장 소장",
  accountant: "경리 담당",
  director: "이사/임원",
  staff: "일반 직원",
};

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin: { label: "관리자", color: "bg-red-100 text-red-700" },
  user: { label: "일반", color: "bg-slate-100 text-slate-600" },
};

// 부서별 접근 가능 기능 매핑
const DEPT_PERMISSIONS: Record<string, string[]> = {
  design: ["공정표", "작업보고서", "회의록", "견적서", "계약서", "고객사 초대", "현장 카메라"],
  construction: ["공정표", "작업보고서", "회의록", "하도급 관리", "현장 카메라", "원가관리"],
  accounting: ["지출결의서", "견적서", "계약서", "원가관리", "하도급 관리"],
  management: ["모든 기능"],
  sales: ["프로젝트 조회", "고객사 초대", "견적서"],
  none: ["접근 불가 (부서 배정 필요)"],
};

export default function OpsStaffManagement() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editDept, setEditDept] = useState("none");
  const [editOpsRole, setEditOpsRole] = useState("staff");
  const [activeTab, setActiveTab] = useState<"staff" | "applications" | "invitations">("staff");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteDept, setInviteDept] = useState("none");

  const staff = trpc.ops.staff.list.useQuery();
  const applications = trpc.staffManagement.listApplications.useQuery();
  const invitations = trpc.staffManagement.listInvitations.useQuery();

  const approveApp = trpc.staffManagement.approveApplication.useMutation({
    onSuccess: () => { applications.refetch(); staff.refetch(); toast.success("가입 신청이 승인되었습니다."); },
    onError: (err) => toast.error(err.message),
  });
  const rejectApp = trpc.staffManagement.rejectApplication.useMutation({
    onSuccess: () => { applications.refetch(); toast.success("가입 신청이 거절되었습니다."); },
    onError: (err) => toast.error(err.message),
  });
  const sendInvite = trpc.staffManagement.sendInvitation.useMutation({
    onSuccess: () => {
      invitations.refetch();
      setInviteEmail(""); setInviteName(""); setInviteDept("none");
      toast.success("초대 이메일이 발송되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });
  const deactivateStaff = trpc.staffManagement.deactivateStaff.useMutation({
    onSuccess: () => { staff.refetch(); toast.success("직원이 비활성화되었습니다."); },
    onError: (err) => toast.error(err.message),
  });
  const reactivateStaff = trpc.staffManagement.reactivateStaff.useMutation({
    onSuccess: () => { staff.refetch(); toast.success("직원이 재활성화되었습니다."); },
    onError: (err) => toast.error(err.message),
  });
  const updateDept = trpc.ops.staff.updateDepartment.useMutation({
    onSuccess: () => {
      staff.refetch();
      setEditingUser(null);
      toast.success("부서/역할이 변경되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });
  const updateRole = trpc.ops.staff.updateRole.useMutation({
    onSuccess: () => {
      staff.refetch();
      toast.success("권한이 변경되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = staff.data?.filter(m =>
    !search || m.name?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const deptCounts = staff.data?.reduce((acc, m) => {
    acc[m.department] = (acc[m.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};

  if (user?.role !== "admin" && user?.role !== "master") {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
        관리자만 접근 가능합니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Button variant="ghost" size="icon" onClick={() => navigate("/ops")} className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6" />직원 관리
          </h1>
        </div>
        <p className="text-muted-foreground mt-1">부서 배정 및 역할 관리를 통해 OpsX 접근 권한을 설정합니다.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b">
        {[
          { key: "staff" as const, label: "직원 목록", icon: Users, count: staff.data?.length ?? 0 },
          { key: "applications" as const, label: "가입 신청", icon: UserPlus, count: applications.data?.filter((a: any) => a.status === "pending").length ?? 0 },
          { key: "invitations" as const, label: "초대 관리", icon: Mail, count: invitations.data?.filter((i: any) => i.status === "pending").length ?? 0 },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count > 0 && (
              <Badge className="h-5 px-1.5 text-xs bg-primary/10 text-primary border-0">{tab.count}</Badge>
            )}
          </button>
        ))}
      </div>

      {activeTab === "staff" && (
      <>
      {/* Department Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(DEPT_LABELS).map(([key, { label, color }]) => (
          <Card key={key}>
            <CardContent className="pt-3 pb-2 text-center">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold">{deptCounts[key] ?? 0}명</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permission Guide */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4" />부서별 접근 권한 안내
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(DEPT_PERMISSIONS).map(([dept, perms]) => {
              const d = DEPT_LABELS[dept];
              return (
                <div key={dept} className="border rounded-lg p-3">
                  <Badge className={`${d.color} border-0 mb-2`}>{d.label}</Badge>
                  <div className="flex flex-wrap gap-1">
                    {perms.map(p => (
                      <span key={p} className="text-xs bg-muted px-2 py-0.5 rounded">{p}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCog className="w-5 h-5" />직원 목록
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="이름 또는 이메일 검색"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {staff.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">이름</th>
                    <th className="pb-2 font-medium">이메일</th>
                    <th className="pb-2 font-medium">시스템 권한</th>
                    <th className="pb-2 font-medium">부서</th>
                    <th className="pb-2 font-medium">OpsX 역할</th>
                    <th className="pb-2 font-medium">최근 접속</th>
                    <th className="pb-2 font-medium text-right">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => {
                    const dept = DEPT_LABELS[m.department] ?? DEPT_LABELS.none;
                    const role = ROLE_LABELS[m.role] ?? ROLE_LABELS.user;
                    return (
                      <tr key={m.id} className="border-b last:border-0 hover:bg-accent/30">
                        <td className="py-3 font-medium">{m.name ?? "이름 없음"}</td>
                        <td className="py-3 text-muted-foreground">{m.email ?? "-"}</td>
                        <td className="py-3">
                          <Badge className={`${role.color} border-0 text-xs`}>{role.label}</Badge>
                        </td>
                        <td className="py-3">
                          <Badge className={`${dept.color} border-0 text-xs`}>{dept.label}</Badge>
                        </td>
                        <td className="py-3 text-muted-foreground text-xs">
                          {OPS_ROLE_LABELS[m.opsRole] ?? m.opsRole}
                        </td>
                        <td className="py-3 text-muted-foreground text-xs">
                          {m.lastSignedIn ? new Date(m.lastSignedIn).toLocaleDateString() : "-"}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex gap-1 justify-end">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingUser(m);
                                    setEditDept(m.department);
                                    setEditOpsRole(m.opsRole);
                                  }}
                                >
                                  <Building2 className="w-3 h-3 mr-1" />부서
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{m.name ?? "직원"} - 부서/역할 변경</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 mt-2">
                                  <div>
                                    <Label>부서</Label>
                                    <Select value={editDept} onValueChange={setEditDept}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        {Object.entries(DEPT_LABELS).map(([k, v]) => (
                                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>OpsX 역할</Label>
                                    <Select value={editOpsRole} onValueChange={setEditOpsRole}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        {Object.entries(OPS_ROLE_LABELS).map(([k, v]) => (
                                          <SelectItem key={k} value={k}>{v}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  {editDept !== "none" && (
                                    <div className="bg-muted p-3 rounded-lg">
                                      <p className="text-xs font-medium mb-1">접근 가능 기능:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {(DEPT_PERMISSIONS[editDept] ?? []).map(p => (
                                          <span key={p} className="text-xs bg-background px-2 py-0.5 rounded">{p}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  <Button
                                    className="w-full"
                                    onClick={() => {
                                      if (editingUser) {
                                        updateDept.mutate({
                                          userId: editingUser.id,
                                          department: editDept as any,
                                          opsRole: editOpsRole as any,
                                        });
                                      }
                                    }}
                                    disabled={updateDept.isPending}
                                  >
                                    {updateDept.isPending ? "저장 중..." : "변경 저장"}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            {m.id !== user?.id && (
                              <>
                              <Button
                                size="sm"
                                variant={m.role === "admin" ? "destructive" : "outline"}
                                onClick={() => {
                                  const newRole = m.role === "admin" ? "user" : "admin";
                                  if (confirm(`${m.name}님을 ${newRole === "admin" ? "관리자" : "일반 사용자"}로 변경하시겠습니까?`)) {
                                    updateRole.mutate({ userId: m.id, role: newRole });
                                  }
                                }}
                              >
                                <Shield className="w-3 h-3 mr-1" />
                                {m.role === "admin" ? "권한 해제" : "관리자"}
                              </Button>
                              <Button
                                size="sm"
                                variant={m.isActive === false ? "outline" : "destructive"}
                                onClick={() => {
                                  if (m.isActive === false) {
                                    if (confirm(`${m.name}님을 재활성화하시겠습니까?`)) {
                                      reactivateStaff.mutate({ userId: m.id });
                                    }
                                  } else {
                                    if (confirm(`${m.name}님을 비활성화하시겠습니까? 로그인이 차단됩니다.`)) {
                                      deactivateStaff.mutate({ userId: m.id });
                                    }
                                  }
                                }}
                              >
                                <UserMinus className="w-3 h-3 mr-1" />
                                {m.isActive === false ? "재활성화" : "비활성화"}
                              </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
    )}

    {/* Applications Tab */}
    {activeTab === "applications" && (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="w-5 h-5" />가입 신청 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : !applications.data?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>가입 신청이 없습니다.</p>
              <p className="text-xs mt-1">직원이 <a href="/staff-join" className="text-primary underline">/staff-join</a> 페이지에서 신청할 수 있습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.data.map((app: any) => (
                <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{app.name}</p>
                    <p className="text-sm text-muted-foreground">{app.email}</p>
                    {app.phone && <p className="text-xs text-muted-foreground">{app.phone}</p>}
                    {app.department && <Badge className="mt-1 text-xs" variant="outline">{DEPT_LABELS[app.department]?.label ?? app.department}</Badge>}
                    {app.message && <p className="text-xs text-muted-foreground mt-1 italic">"{app.message}"</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(app.createdAt).toLocaleDateString("ko-KR")} 신청
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {app.status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => approveApp.mutate({ id: app.id })}
                          disabled={approveApp.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />승인
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectApp.mutate({ id: app.id })}
                          disabled={rejectApp.isPending}
                        >
                          <XCircle className="w-3 h-3 mr-1" />거절
                        </Button>
                      </>
                    ) : (
                      <Badge className={app.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                        {app.status === "approved" ? "승인됨" : "거절됨"}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )}

    {/* Invitations Tab */}
    {activeTab === "invitations" && (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="w-5 h-5" />직원 초대 이메일 발송
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-sm">이름 *</Label>
                <Input
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  placeholder="홍길동"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">이메일 *</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="hong@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">부서</Label>
                <Select value={inviteDept} onValueChange={setInviteDept}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(DEPT_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="mt-3"
              onClick={() => {
                if (!inviteName.trim() || !inviteEmail.trim()) {
                  toast.error("이름과 이메일을 입력해주세요.");
                  return;
                }
                sendInvite.mutate({
                  name: inviteName,
                  email: inviteEmail,
                  department: inviteDept !== "none" ? inviteDept : undefined,
                });
              }}
              disabled={sendInvite.isPending}
            >
              <Mail className="w-4 h-4 mr-1" />
              {sendInvite.isPending ? "발송 중..." : "초대 이메일 발송"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />초대 이력
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invitations.isLoading ? (
              <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
            ) : !invitations.data?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>발송된 초대가 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium">이름</th>
                      <th className="pb-2 font-medium">이메일</th>
                      <th className="pb-2 font-medium">부서</th>
                      <th className="pb-2 font-medium">상태</th>
                      <th className="pb-2 font-medium">발송일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.data.map((inv: any) => (
                      <tr key={inv.id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{inv.name}</td>
                        <td className="py-3 text-muted-foreground">{inv.email}</td>
                        <td className="py-3">
                          {inv.department ? (
                            <Badge className={`${DEPT_LABELS[inv.department]?.color ?? "bg-gray-100 text-gray-500"} border-0 text-xs`}>
                              {DEPT_LABELS[inv.department]?.label ?? inv.department}
                            </Badge>
                          ) : "-"}
                        </td>
                        <td className="py-3">
                          <Badge className={{
                            pending: "bg-amber-100 text-amber-700",
                            accepted: "bg-green-100 text-green-700",
                            expired: "bg-gray-100 text-gray-500",
                          }[inv.status as string] ?? "bg-gray-100 text-gray-500"}>
                            {{ pending: "대기 중", accepted: "수락", expired: "만료" }[inv.status as string] ?? inv.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-muted-foreground text-xs">
                          {new Date(inv.createdAt).toLocaleDateString("ko-KR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </>
    )}
    </div>
  );
}
