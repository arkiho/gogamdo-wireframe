/**
 * Admin Settings Page
 * - AI 서비스 개별 ON/OFF 토글 (견적, 상담, 스타일, 리디자인)
 * - 직원(회원) 관리: 역할 변경, 삭제
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Settings, Bot, Users, Shield, Trash2, Loader2,
  ToggleLeft, ToggleRight, AlertCircle, CheckCircle2,
  Calculator, MessageCircle, Palette, RefreshCw, Power,
  Crown, Activity, BarChart3, RotateCcw, Database,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import Logo from "@/components/Logo";
import { useAuth } from "@/_core/hooks/useAuth";

const AI_SERVICES = [
  {
    key: "ai_estimator_enabled",
    label: "AI 견적",
    description: "30초 만에 예상 인테리어 비용을 산출합니다",
    icon: Calculator,
    href: "/estimator",
  },
  {
    key: "ai_chat_enabled",
    label: "AI 상담",
    description: "24시간 AI 인테리어 상담사와 대화할 수 있습니다",
    icon: MessageCircle,
    href: "/ai-chat",
  },
  {
    key: "ai_style_enabled",
    label: "AI 스타일",
    description: "맞춤 인테리어 스타일을 추천받습니다",
    icon: Palette,
    href: "/ai-style",
  },
  {
    key: "ai_redesign_enabled",
    label: "AI 리디자인",
    description: "기존 공간을 AI로 리디자인합니다",
    icon: RefreshCw,
    href: "/ai-redesign",
  },
] as const;

type AiSettingData = {
  enabled: boolean;
  estimator: boolean;
  chat: boolean;
  style: boolean;
  redesign: boolean;
};

const SERVICE_KEY_MAP: Record<string, keyof Omit<AiSettingData, "enabled">> = {
  ai_estimator_enabled: "estimator",
  ai_chat_enabled: "chat",
  ai_style_enabled: "style",
  ai_redesign_enabled: "redesign",
};

const ROLE_CONFIG: Record<string, { label: string; color: string; bgColor: string; order: number }> = {
  master: { label: "마스터", color: "text-red-700", bgColor: "bg-red-100 text-red-700 border-red-200", order: 0 },
  admin: { label: "관리자", color: "text-gold-dark", bgColor: "bg-gold/20 text-gold-dark", order: 1 },
  user: { label: "일반", color: "text-gray-600", bgColor: "", order: 2 },
};

export default function AdminSettings() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"ai" | "staff" | "master">("ai");
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const isMaster = currentUser?.role === "master";

  // AI 설정 조회
  const aiSetting = trpc.settings.aiEnabled.useQuery(undefined, {
    staleTime: 5_000,
  });
  const setSetting = trpc.settings.set.useMutation({
    onSuccess: () => {
      aiSetting.refetch();
      setTogglingKey(null);
      toast.success("설정이 변경되었습니다.");
    },
    onError: () => {
      setTogglingKey(null);
      toast.error("설정 변경에 실패했습니다.");
    },
  });

  // 직원 목록 조회
  const staffList = trpc.staff.list.useQuery(undefined, {
    staleTime: 10_000,
  });
  const updateRole = trpc.staff.updateRole.useMutation({
    onSuccess: () => {
      staffList.refetch();
      toast.success("역할이 변경되었습니다.");
    },
    onError: (err) => toast.error(err.message || "역할 변경에 실패했습니다."),
  });
  const updateDepartment = trpc.staff.updateDepartment.useMutation({
    onSuccess: () => {
      staffList.refetch();
      toast.success("부서/직책이 변경되었습니다.");
    },
    onError: () => toast.error("부서/직책 변경에 실패했습니다."),
  });
  const deleteStaff = trpc.staff.delete.useMutation({
    onSuccess: () => {
      staffList.refetch();
      toast.success("직원이 삭제되었습니다.");
    },
    onError: () => toast.error("직원 삭제에 실패했습니다."),
  });

  const ai = (aiSetting.data as AiSettingData | undefined) ?? {
    enabled: true,
    estimator: true,
    chat: true,
    style: true,
    redesign: true,
  };

  const masterEnabled = ai.enabled;

  const handleToggleMaster = () => {
    setTogglingKey("master");
    setSetting.mutate({
      key: "ai_features_enabled",
      value: masterEnabled ? "false" : "true",
      description: "AI 서비스 전체 마스터 토글",
    });
  };

  const handleToggleService = (settingKey: string, currentEnabled: boolean) => {
    setTogglingKey(settingKey);
    setSetting.mutate({
      key: settingKey,
      value: currentEnabled ? "false" : "true",
      description: `${AI_SERVICES.find((s) => s.key === settingKey)?.label} 활성화 여부`,
    });
  };

  const handleDeleteStaff = (userId: number, name: string) => {
    if (!confirm(`정말 "${name}" 직원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
    deleteStaff.mutate({ userId });
  };

  const activeCount = AI_SERVICES.filter((s) => ai[SERVICE_KEY_MAP[s.key]]).length;

  return (
    <div className="min-h-screen bg-paper-warm">
      {/* Header */}
      <header className="bg-ink text-white border-b border-white/10">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <span className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
                <ArrowLeft className="w-4 h-4" />
                대시보드
              </span>
            </Link>
            <div className="w-px h-6 bg-white/20" />
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gold" />
              <span className="font-heading font-bold text-lg">사이트 설정</span>
            </div>
          </div>
          <Logo variant="full" color="#ffffff" height={20} />
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border/50 bg-white">
        <div className="container flex gap-0">
          <button
            onClick={() => setActiveTab("ai")}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "ai"
                ? "border-gold text-gold"
                : "border-transparent text-muted-foreground hover:text-ink"
            }`}
          >
            <Bot className="w-4 h-4 inline mr-2" />
            AI 서비스 설정
          </button>
          <button
            onClick={() => setActiveTab("staff")}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "staff"
                ? "border-gold text-gold"
                : "border-transparent text-muted-foreground hover:text-ink"
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            직원 관리
          </button>
          {isMaster && (
            <button
              onClick={() => setActiveTab("master")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "master"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-muted-foreground hover:text-ink"
              }`}
            >
              <Crown className="w-4 h-4 inline mr-2" />
              마스터 전용
            </button>
          )}
        </div>
      </div>

      <div className="container py-8 max-w-4xl">
        {/* AI 서비스 설정 탭 */}
        {activeTab === "ai" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-heading text-xl font-bold text-ink mb-2">AI 서비스 설정</h2>
              <p className="text-sm text-muted-foreground">
                AI 서비스를 개별적으로 켜거나 끌 수 있습니다. 전체 마스터 스위치를 끄면 모든 AI 서비스가 비활성화됩니다.
              </p>
            </div>

            {/* 마스터 토글 */}
            <Card className={`border-2 ${masterEnabled ? "border-emerald-200" : "border-red-200"}`}>
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      masterEnabled ? "bg-emerald-100" : "bg-red-50"
                    }`}>
                      <Power className={`w-7 h-7 ${masterEnabled ? "text-emerald-600" : "text-red-400"}`} />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-bold text-ink">전체 AI 서비스</h3>
                      <p className="text-sm text-muted-foreground">
                        {masterEnabled
                          ? `${activeCount}개 서비스 활성화 중`
                          : "모든 AI 서비스가 비활성화되어 있습니다"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={masterEnabled ? "default" : "destructive"}
                      className={masterEnabled ? "bg-emerald-500" : ""}
                    >
                      {masterEnabled ? "ON" : "OFF"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleToggleMaster}
                      disabled={setSetting.isPending}
                      className={`min-w-[120px] ${
                        masterEnabled
                          ? "border-red-300 text-red-600 hover:bg-red-50"
                          : "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      {togglingKey === "master" && setSetting.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : masterEnabled ? (
                        <>
                          <ToggleRight className="w-4 h-4 mr-2" />
                          전체 끄기
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 mr-2" />
                          전체 켜기
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 개별 AI 서비스 토글 */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">개별 서비스 설정</h3>
              {AI_SERVICES.map((service) => {
                const fieldKey = SERVICE_KEY_MAP[service.key];
                const isEnabled = ai[fieldKey];
                const Icon = service.icon;
                const isToggling = togglingKey === service.key && setSetting.isPending;

                return (
                  <Card
                    key={service.key}
                    className={`border-border/50 transition-opacity ${!masterEnabled ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    <CardContent className="py-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${
                            isEnabled ? "bg-gold/10" : "bg-gray-100"
                          }`}>
                            <Icon className={`w-5 h-5 ${isEnabled ? "text-gold" : "text-gray-400"}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-heading font-semibold text-ink">{service.label}</h4>
                              <Badge
                                variant={isEnabled ? "default" : "secondary"}
                                className={`text-[10px] px-1.5 py-0 ${isEnabled ? "bg-emerald-500" : ""}`}
                              >
                                {isEnabled ? "ON" : "OFF"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleService(service.key, isEnabled)}
                          disabled={setSetting.isPending || !masterEnabled}
                          className={`min-w-[80px] text-xs ${
                            isEnabled
                              ? "border-red-200 text-red-500 hover:bg-red-50"
                              : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {isToggling ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : isEnabled ? (
                            "끄기"
                          ) : (
                            "켜기"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* 상태 안내 */}
            {!masterEnabled && (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">전체 AI 서비스가 비활성화되어 있습니다</p>
                    <p className="text-xs text-amber-600 mt-1">
                      홈페이지에서 AI 관련 메뉴, 버튼, 섹션이 모두 숨겨집니다. 개별 서비스를 설정하려면 먼저 전체 AI 서비스를 켜주세요.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {masterEnabled && (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800">
                      AI 서비스 {activeCount}개 활성화 중
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">
                      활성화된 서비스만 홈페이지 네비게이션, AI Features 섹션, 푸터에 표시됩니다.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 영향 범위 안내 */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">서비스 OFF 시 영향 범위</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2 text-sm text-ink/70">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    해당 서비스가 상단 네비게이션 "AI 서비스" 드롭다운에서 숨겨집니다
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    홈페이지 AI Features 섹션에서 해당 서비스 카드가 숨겨집니다
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    푸터 및 관련 페이지 링크에서 해당 서비스가 숨겨집니다
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    모든 서비스를 끄면 전체 AI 섹션이 숨겨집니다
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 직원 관리 탭 */}
        {activeTab === "staff" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-heading text-xl font-bold text-ink mb-2">직원 관리</h2>
              <p className="text-sm text-muted-foreground">
                회원가입한 직원들의 역할(권한)을 변경하거나 삭제할 수 있습니다.
                직원이 회원가입하면 기본 역할은 "일반 사용자"입니다.
              </p>
            </div>

            {staffList.isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">직원 목록을 불러오는 중...</p>
              </div>
            ) : (staffList.data?.length ?? 0) === 0 ? (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">등록된 직원이 없습니다.</p>
                  <p className="text-xs text-muted-foreground mt-1">직원이 홈페이지에서 회원가입하면 여기에 표시됩니다.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {staffList.data?.map((staff: any) => (
                  <Card key={staff.id} className="border-border/50 overflow-hidden">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-ink/10 flex items-center justify-center">
                            {staff.avatarUrl ? (
                              <img src={staff.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-ink/50">
                                {(staff.name || staff.displayName || "?")[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-ink">{staff.name || staff.displayName || "이름 없음"}</span>
                              <Badge
                                variant={staff.role === "master" ? "destructive" : staff.role === "admin" ? "default" : "secondary"}
                                className={ROLE_CONFIG[staff.role]?.bgColor || ""}
                              >
                                {ROLE_CONFIG[staff.role]?.label || "일반"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {staff.email || "이메일 없음"}
                              {staff.phone && ` · ${staff.phone}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Select
                            value={staff.department || "none"}
                            onValueChange={(value: string) => {
                              updateDepartment.mutate({ userId: staff.id, department: value, opsRole: staff.opsRole || "staff" });
                            }}
                          >
                            <SelectTrigger className="w-[100px] h-8 text-xs">
                              <SelectValue placeholder="부서" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">미배정</SelectItem>
                              <SelectItem value="design">설계팀</SelectItem>
                              <SelectItem value="construction">시공팀</SelectItem>
                              <SelectItem value="accounting">경리부</SelectItem>
                              <SelectItem value="management">경영지원</SelectItem>
                              <SelectItem value="sales">영업팀</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={staff.opsRole || "staff"}
                            onValueChange={(value: string) => {
                              updateDepartment.mutate({ userId: staff.id, department: staff.department || "none", opsRole: value });
                            }}
                          >
                            <SelectTrigger className="w-[110px] h-8 text-xs">
                              <SelectValue placeholder="직책" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="staff">일반 직원</SelectItem>
                              <SelectItem value="pm">PM</SelectItem>
                              <SelectItem value="designer">설계 담당</SelectItem>
                              <SelectItem value="site_manager">현장 소장</SelectItem>
                              <SelectItem value="accountant">경리 담당</SelectItem>
                              <SelectItem value="director">이사/임원</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={staff.role || "user"}
                            onValueChange={(value: string) => {
                              if (value !== staff.role) {
                                updateRole.mutate({ userId: staff.id, role: value as "user" | "admin" | "master" });
                              }
                            }}
                            disabled={staff.id === currentUser?.id || (staff.role === "master" && !isMaster)}
                          >
                            <SelectTrigger className="w-[120px] h-9 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">일반 사용자</SelectItem>
                              {isMaster && <SelectItem value="admin">관리자</SelectItem>}
                              {!isMaster && staff.role === "admin" && <SelectItem value="admin">관리자</SelectItem>}
                              {isMaster && <SelectItem value="master">마스터</SelectItem>}
                            </SelectContent>
                          </Select>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteStaff(staff.id, staff.name || staff.displayName || "이름 없음")}
                            disabled={deleteStaff.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Card className="border-border/50 bg-blue-50/50">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">권한 안내 (3단계)</p>
                    <ul className="text-xs text-blue-600 mt-1 space-y-1">
                      <li><strong>마스터</strong>: 모든 관리자 기능 + 관리자/마스터 역할 부여 권한 (최고 권한)</li>
                      <li><strong>관리자</strong>: 대시보드, 사이트 설정, 콘텐츠 관리, 직원 관리 (일반 사용자로만 변경 가능)</li>
                      <li><strong>일반 사용자</strong>: OpsX 직원 대시보드, 프로젝트 관리 등 기본 기능만 접근 가능</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 마스터 전용 탭 */}
        {activeTab === "master" && isMaster && <MasterPanel />}
      </div>
    </div>
  );
}

// ===== 마스터 전용 패널 컴포넌트 =====
function MasterPanel() {
  const systemStats = trpc.master.systemStats.useQuery(undefined, { staleTime: 30_000 });
  const activityLogs = trpc.master.activityLogs.useQuery({ limit: 50 }, { staleTime: 10_000 });
  const resetSettings = trpc.master.resetSettings.useMutation({
    onSuccess: () => {
      toast.success("사이트 설정이 초기화되었습니다.");
      systemStats.refetch();
      activityLogs.refetch();
    },
    onError: () => toast.error("설정 초기화에 실패했습니다."),
  });
  const resetRoles = trpc.master.resetRoles.useMutation({
    onSuccess: () => {
      toast.success("모든 사용자 역할이 초기화되었습니다.");
      systemStats.refetch();
      activityLogs.refetch();
    },
    onError: () => toast.error("역할 초기화에 실패했습니다."),
  });

  const stats = systemStats.data;

  const ACTION_LABELS: Record<string, string> = {
    role_change: "역할 변경",
    setting_update: "설정 변경",
    user_delete: "사용자 삭제",
    site_settings_reset: "설정 초기화",
    roles_reset: "역할 일괄 초기화",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-ink mb-2 flex items-center gap-2">
          <Crown className="w-5 h-5 text-red-500" />
          마스터 전용 관리
        </h2>
        <p className="text-sm text-muted-foreground">
          시스템 통계, 활동 로그, 위험 작업(초기화) 등 마스터만 접근할 수 있는 기능입니다.
        </p>
      </div>

      {/* 시스템 통계 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-5 h-5 text-gold" />
            시스템 통계
          </CardTitle>
        </CardHeader>
        <CardContent>
          {systemStats.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "총 사용자", value: stats.totalUsers, icon: Users },
                { label: "문의 건수", value: stats.totalInquiries, icon: MessageCircle },
                { label: "AI 견적", value: stats.totalEstimates, icon: Calculator },
                { label: "포트폴리오", value: stats.totalPortfolios, icon: Palette },
                { label: "CRM 고객", value: stats.totalCrmClients, icon: Database },
                { label: "인사이트", value: stats.totalArticles, icon: Activity },
                { label: "구독자", value: stats.totalSubscribers, icon: Users },
                { label: "AI 리디자인", value: stats.totalRedesigns, icon: RefreshCw },
              ].map((item) => (
                <div key={item.label} className="p-4 bg-paper-warm rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className="w-4 h-4 text-gold" />
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                  <span className="font-heading text-2xl font-bold text-ink">{item.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">통계를 불러올 수 없습니다.</p>
          )}

          {/* 역할 분포 */}
          {stats?.roleDistribution && stats.roleDistribution.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">역할 분포</p>
              <div className="flex gap-4">
                {stats.roleDistribution.map((r: any) => (
                  <div key={r.role} className="flex items-center gap-2">
                    <Badge
                      variant={r.role === "master" ? "destructive" : r.role === "admin" ? "default" : "secondary"}
                      className={ROLE_CONFIG[r.role]?.bgColor || ""}
                    >
                      {ROLE_CONFIG[r.role]?.label || r.role}
                    </Badge>
                    <span className="font-semibold text-ink">{r.count}명</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 위험 작업 */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-red-700">
            <AlertCircle className="w-5 h-5" />
            위험 작업
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium text-red-800 text-sm">사이트 설정 초기화</p>
              <p className="text-xs text-red-600 mt-1">모든 AI 서비스 설정을 기본값(전체 ON)으로 복원합니다.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-300 text-red-600 hover:bg-red-100"
              onClick={() => {
                if (confirm("정말 사이트 설정을 초기화하시겠습니까? 모든 AI 서비스가 켜집니다.")) {
                  resetSettings.mutate();
                }
              }}
              disabled={resetSettings.isPending}
            >
              {resetSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-1" />}
              초기화
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium text-red-800 text-sm">전체 역할 초기화</p>
              <p className="text-xs text-red-600 mt-1">마스터를 제외한 모든 사용자를 "일반 사용자"로 초기화합니다.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-300 text-red-600 hover:bg-red-100"
              onClick={() => {
                if (confirm("정말 모든 사용자 역할을 초기화하시겠습니까? 마스터를 제외한 모든 관리자가 일반 사용자로 변경됩니다.")) {
                  resetRoles.mutate();
                }
              }}
              disabled={resetRoles.isPending}
            >
              {resetRoles.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-1" />}
              초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 활동 로그 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="w-5 h-5 text-gold" />
            활동 로그
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activityLogs.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (activityLogs.data?.length ?? 0) === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">기록된 활동이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {activityLogs.data?.map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-paper-warm rounded-lg text-sm">
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Activity className="w-4 h-4 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink">{log.userName || "Unknown"}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {ACTION_LABELS[log.action] || log.action}
                      </Badge>
                    </div>
                    {log.target && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">대상: {log.target}</p>
                    )}
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {new Date(log.createdAt).toLocaleString("ko-KR")} · IP: {log.ipAddress || "-"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
