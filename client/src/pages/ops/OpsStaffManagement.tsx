import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Users, Shield, Building2, UserCog, Search } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editDept, setEditDept] = useState("none");
  const [editOpsRole, setEditOpsRole] = useState("staff");

  const staff = trpc.ops.staff.list.useQuery();
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
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6" />직원 관리
        </h1>
        <p className="text-muted-foreground mt-1">부서 배정 및 역할 관리를 통해 OpsX 접근 권한을 설정합니다.</p>
      </div>

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
    </div>
  );
}
