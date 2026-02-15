/**
 * 고객 공간 활용 대시보드 - 재실센서 기반 공간 분석 뷰
 * 고객이 자기 프로젝트의 공간 활용 현황을 확인하는 읽기 전용 대시보드
 */
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LayoutDashboard, FolderOpen, User, LogOut, Settings,
  Building2, MapPin, Activity, BarChart3, ChevronRight,
  Loader2, AlertCircle, Eye, EyeOff, Flame, Route, FileText,
  ArrowLeft, TrendingUp, Users, Clock
} from "lucide-react";

// ============================================================
// Client Auth Hook (reusable)
// ============================================================
function useClientAuth() {
  const meQuery = trpc.clientAuth.me.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  return {
    client: meQuery.data,
    isLoading: meQuery.isLoading,
    isAuthenticated: !!meQuery.data,
    refetch: meQuery.refetch,
  };
}

// ============================================================
// Portal Sidebar Layout
// ============================================================
function PortalLayout({ children, activeTab, onTabChange }: {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const [, navigate] = useLocation();
  const { client } = useClientAuth();
  const logoutMutation = trpc.clientAuth.logout.useMutation({
    onSuccess: () => navigate("/client/login"),
  });

  const navItems = [
    { id: "overview", label: "대시보드", icon: LayoutDashboard },
    { id: "projects", label: "내 프로젝트", icon: FolderOpen },
    { id: "heatmap", label: "히트맵", icon: Flame },
    { id: "traffic", label: "동선 분석", icon: Route },
    { id: "reports", label: "리포트", icon: FileText },
    { id: "profile", label: "내 정보", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col shrink-0">
        <div className="p-6 border-b border-border">
          <Link href="/">
            <span className="font-heading text-xl font-bold text-gold cursor-pointer tracking-wider">
              GOGAMDO
            </span>
          </Link>
          <p className="text-xs text-muted-foreground mt-1">공간 활용 포털</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? "bg-gold/10 text-gold"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gold/10 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{client?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{client?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="w-3 h-3 mr-2" />
            로그아웃
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

// ============================================================
// Overview Tab
// ============================================================
function OverviewTab() {
  const { client } = useClientAuth();
  const projectIds = client?.assignedProjectIds ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">안녕하세요, {client?.name}님</h1>
      <p className="text-muted-foreground mb-8">공간 활용 현황을 한눈에 확인하세요.</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{projectIds.length}</p>
                <p className="text-xs text-muted-foreground">프로젝트</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold">-</p>
                <p className="text-xs text-muted-foreground">활성 센서</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold">-</p>
                <p className="text-xs text-muted-foreground">평균 재실률</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold">-</p>
                <p className="text-xs text-muted-foreground">공간 효율</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {projectIds.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Building2 className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">아직 할당된 프로젝트가 없습니다</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              프로젝트가 시작되면 이곳에서 공간 활용 현황, 히트맵, 동선 분석 등을 확인할 수 있습니다.
              고감도 담당자에게 문의하세요.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">프로젝트 요약</h2>
          {projectIds.map((pid: number) => (
            <Card key={pid} className="hover:shadow-md transition-shadow">
              <CardContent className="py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-medium">프로젝트 #{pid}</h3>
                      <p className="text-sm text-muted-foreground">공간 활용 데이터 수집 중</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded">활성</span>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">구역</p>
                    <p className="text-sm font-medium">-</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">센서</p>
                    <p className="text-sm font-medium">-</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">재실률</p>
                    <p className="text-sm font-medium">-</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">체류시간</p>
                    <p className="text-sm font-medium">-</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Guide */}
      <Card className="mt-8 border-gold/20 bg-gradient-to-r from-gold/5 to-transparent">
        <CardContent className="py-6">
          <h3 className="font-semibold mb-3">공간 활용 분석 가이드</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-border shrink-0">
                <span className="text-xs font-bold text-gold">1</span>
              </div>
              <div>
                <p className="text-sm font-medium">히트맵 확인</p>
                <p className="text-xs text-muted-foreground">구역별 사용 빈도를 색상으로 확인하세요.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-border shrink-0">
                <span className="text-xs font-bold text-gold">2</span>
              </div>
              <div>
                <p className="text-sm font-medium">동선 분석</p>
                <p className="text-xs text-muted-foreground">구역 간 이동 패턴과 체류 시간을 분석하세요.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-border shrink-0">
                <span className="text-xs font-bold text-gold">3</span>
              </div>
              <div>
                <p className="text-sm font-medium">AI 리포트</p>
                <p className="text-xs text-muted-foreground">AI가 분석한 공간 최적화 제안을 확인하세요.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Heatmap Tab (Read-only view)
// ============================================================
function HeatmapTab() {
  const { client } = useClientAuth();
  const projectIds = client?.assignedProjectIds ?? [];

  if (projectIds.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">히트맵</h1>
        <EmptyState message="할당된 프로젝트가 없어 히트맵을 표시할 수 없습니다." />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">히트맵</h1>
      <p className="text-muted-foreground mb-6">구역별 사용 빈도를 색상으로 확인하세요. 빨간색일수록 사용 빈도가 높습니다.</p>

      <Card>
        <CardContent className="py-12 text-center">
          <Flame className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">히트맵 데이터 수집 중</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            재실센서 데이터가 충분히 수집되면 구역별 사용 빈도 히트맵이 이곳에 표시됩니다.
            일반적으로 1~2주 정도의 데이터가 필요합니다.
          </p>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm">히트맵 범례</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">낮음</span>
            <div className="flex-1 h-4 rounded-full bg-gradient-to-r from-blue-400 via-yellow-400 to-red-500" />
            <span className="text-xs text-muted-foreground">높음</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Traffic Tab (Read-only view)
// ============================================================
function TrafficTab() {
  const { client } = useClientAuth();
  const projectIds = client?.assignedProjectIds ?? [];

  if (projectIds.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">동선 분석</h1>
        <EmptyState message="할당된 프로젝트가 없어 동선 분석을 표시할 수 없습니다." />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">동선 분석</h1>
      <p className="text-muted-foreground mb-6">구역 간 이동 패턴과 체류 시간을 분석합니다.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">이동 흐름도</CardTitle>
            <CardDescription>구역 간 이동 빈도를 화살표로 표시합니다</CardDescription>
          </CardHeader>
          <CardContent className="py-8 text-center">
            <Route className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">데이터 수집 중...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">체류 시간 분석</CardTitle>
            <CardDescription>구역별 평균 체류 시간</CardDescription>
          </CardHeader>
          <CardContent className="py-8 text-center">
            <Clock className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">데이터 수집 중...</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">주요 이동 경로 (Top 10)</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">충분한 데이터가 수집되면 주요 이동 경로가 표시됩니다.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Reports Tab
// ============================================================
function ReportsTab() {
  const { client } = useClientAuth();
  const projectIds = client?.assignedProjectIds ?? [];

  if (projectIds.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">리포트</h1>
        <EmptyState message="할당된 프로젝트가 없어 리포트를 생성할 수 없습니다." />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">공간 활용 리포트</h1>
      <p className="text-muted-foreground mb-6">AI가 분석한 공간 최적화 제안을 확인하세요.</p>

      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">리포트 준비 중</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            충분한 공간 활용 데이터가 수집되면 AI가 자동으로 공간 최적화 리포트를 생성합니다.
            리포트에는 비효율 구역 식별, 공간 재배치 제안, 에너지 절감 방안 등이 포함됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Profile Tab
// ============================================================
function ProfileTab() {
  const { client, refetch } = useClientAuth();
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    company: "",
    phone: "",
  });
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    if (client) {
      setProfileForm({
        name: client.name || "",
        company: client.company || "",
        phone: client.phone || "",
      });
    }
  }, [client]);

  const updateProfileMutation = trpc.clientAuth.updateProfile.useMutation({
    onSuccess: () => {
      setProfileMsg("프로필이 업데이트되었습니다.");
      setEditing(false);
      refetch();
    },
    onError: (err) => setProfileMsg(err.message),
  });

  const changePwMutation = trpc.clientAuth.changePassword.useMutation({
    onSuccess: () => {
      setPwMsg("비밀번호가 변경되었습니다.");
      setPwError("");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (err) => {
      setPwError(err.message);
      setPwMsg("");
    },
  });

  const handleProfileSave = () => {
    updateProfileMutation.mutate({
      name: profileForm.name || undefined,
      company: profileForm.company || undefined,
      phone: profileForm.phone || undefined,
    });
  };

  const handlePwChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwMsg("");
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    changePwMutation.mutate({
      currentPassword: pwForm.currentPassword,
      newPassword: pwForm.newPassword,
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">내 정보</h1>

      <div className="space-y-6 max-w-lg">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">기본 정보</CardTitle>
              {!editing && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Settings className="w-3 h-3 mr-1" />
                  수정
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>이메일</Label>
              <Input value={client?.email || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>이름</Label>
              <Input
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                disabled={!editing}
                className={!editing ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>회사명</Label>
              <Input
                value={profileForm.company}
                onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                disabled={!editing}
                className={!editing ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>연락처</Label>
              <Input
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                disabled={!editing}
                className={!editing ? "bg-muted" : ""}
              />
            </div>

            {editing && (
              <div className="flex gap-2">
                <Button onClick={handleProfileSave} className="bg-gold hover:bg-gold-light text-ink" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? "저장 중..." : "저장"}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>취소</Button>
              </div>
            )}
            {profileMsg && <p className="text-sm text-green-600">{profileMsg}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">비밀번호 변경</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePwChange} className="space-y-4">
              <div className="space-y-2">
                <Label>현재 비밀번호</Label>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>새 비밀번호</Label>
                <Input
                  type="password"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  placeholder="8자 이상"
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label>새 비밀번호 확인</Label>
                <Input
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  required
                />
              </div>
              {pwError && <p className="text-sm text-red-600">{pwError}</p>}
              {pwMsg && <p className="text-sm text-green-600">{pwMsg}</p>}
              <Button type="submit" variant="outline" disabled={changePwMutation.isPending}>
                {changePwMutation.isPending ? "변경 중..." : "비밀번호 변경"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// Projects Tab
// ============================================================
function ProjectsTab() {
  const { client } = useClientAuth();
  const projectIds = client?.assignedProjectIds ?? [];

  if (projectIds.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">내 프로젝트</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">할당된 프로젝트가 없습니다</h3>
            <p className="text-sm text-muted-foreground">고감도 담당자에게 문의하세요.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">내 프로젝트</h1>
      <div className="grid gap-4">
        {projectIds.map((pid: number) => (
          <Card key={pid} className="hover:shadow-md transition-shadow">
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-medium">프로젝트 #{pid}</h3>
                    <p className="text-sm text-muted-foreground">공간 활용 데이터 확인</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded">활성</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Empty State Component
// ============================================================
function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function ClientSpaceDashboard() {
  const [, navigate] = useLocation();
  const { client, isLoading, isAuthenticated } = useClientAuth();
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">로그인이 필요합니다</h3>
            <p className="text-muted-foreground text-sm mb-6">
              공간 활용 대시보드를 이용하려면 고객 계정으로 로그인해 주세요.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate("/client/login")} className="bg-gold hover:bg-gold-light text-ink">
                로그인
              </Button>
              <Button variant="outline" onClick={() => navigate("/client/register")}>
                회원가입
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PortalLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "projects" && <ProjectsTab />}
      {activeTab === "heatmap" && <HeatmapTab />}
      {activeTab === "traffic" && <TrafficTab />}
      {activeTab === "reports" && <ReportsTab />}
      {activeTab === "profile" && <ProfileTab />}
    </PortalLayout>
  );
}

