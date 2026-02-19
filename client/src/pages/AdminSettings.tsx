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
  const [activeTab, setActiveTab] = useState<"ai" | "staff">("ai");
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
                              {staff.department && ` · ${staff.department}`}
                              {staff.opsRole && ` · ${staff.opsRole}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
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
      </div>
    </div>
  );
}
