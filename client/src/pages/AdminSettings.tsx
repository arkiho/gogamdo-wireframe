/**
 * Admin Settings Page
 * - AI 서비스 ON/OFF 토글
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
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import Logo from "@/components/Logo";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<"ai" | "staff">("ai");

  // AI 설정 조회
  const aiSetting = trpc.settings.aiEnabled.useQuery(undefined, {
    staleTime: 5_000,
  });
  const setSetting = trpc.settings.set.useMutation({
    onSuccess: () => {
      aiSetting.refetch();
      toast.success("설정이 변경되었습니다.");
    },
    onError: () => toast.error("설정 변경에 실패했습니다."),
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
    onError: () => toast.error("역할 변경에 실패했습니다."),
  });
  const deleteStaff = trpc.staff.delete.useMutation({
    onSuccess: () => {
      staffList.refetch();
      toast.success("직원이 삭제되었습니다.");
    },
    onError: () => toast.error("직원 삭제에 실패했습니다."),
  });

  const aiEnabled = aiSetting.data?.enabled ?? true;

  const handleToggleAI = () => {
    setSetting.mutate({
      key: "ai_features_enabled",
      value: aiEnabled ? "false" : "true",
      description: "AI 서비스 기능 활성화 여부",
    });
  };

  const handleDeleteStaff = (userId: number, name: string) => {
    if (!confirm(`정말 "${name}" 직원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
    deleteStaff.mutate({ userId });
  };

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
                AI 서비스를 켜거나 끌 수 있습니다. OFF로 설정하면 홈페이지의 AI 관련 메뉴와 기능이 모두 숨겨집니다.
              </p>
            </div>

            <Card className="border-border/50">
              <CardContent className="py-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      aiEnabled ? "bg-emerald-100" : "bg-gray-100"
                    }`}>
                      <Bot className={`w-7 h-7 ${aiEnabled ? "text-emerald-600" : "text-gray-400"}`} />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-bold text-ink">AI 서비스</h3>
                      <p className="text-sm text-muted-foreground">
                        AI 견적, AI 상담, AI 스타일, AI 리디자인
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={aiEnabled ? "default" : "secondary"} className={aiEnabled ? "bg-emerald-500" : ""}>
                      {aiEnabled ? "ON" : "OFF"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleToggleAI}
                      disabled={setSetting.isPending}
                      className={`min-w-[120px] ${aiEnabled ? "border-red-300 text-red-600 hover:bg-red-50" : "border-emerald-300 text-emerald-600 hover:bg-emerald-50"}`}
                    >
                      {setSetting.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : aiEnabled ? (
                        <>
                          <ToggleRight className="w-4 h-4 mr-2" />
                          끄기
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 mr-2" />
                          켜기
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* 상태 안내 */}
                <div className={`mt-6 p-4 rounded-lg ${aiEnabled ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
                  {aiEnabled ? (
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-emerald-800">AI 서비스가 활성화되어 있습니다</p>
                        <p className="text-xs text-emerald-600 mt-1">
                          홈페이지 네비게이션, 히어로 CTA, AI Features 섹션, 푸터에 AI 서비스 메뉴가 표시됩니다.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">AI 서비스가 비활성화되어 있습니다</p>
                        <p className="text-xs text-amber-600 mt-1">
                          홈페이지에서 AI 관련 메뉴, 버튼, 섹션이 모두 숨겨집니다. 직접 URL로 접근은 가능합니다.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 영향 범위 안내 */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">AI 서비스 OFF 시 영향 범위</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2 text-sm text-ink/70">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    상단 네비게이션의 "AI 서비스" 드롭다운 메뉴 숨김
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    홈페이지 히어로 CTA "AI 예상 견적 받기" → "무료 상담 신청"으로 변경
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    홈페이지 AI Features 섹션 전체 숨김
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    푸터의 AI 관련 링크 숨김
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
                          {/* Avatar */}
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
                                variant={staff.role === "admin" ? "default" : "secondary"}
                                className={staff.role === "admin" ? "bg-gold text-ink" : ""}
                              >
                                {staff.role === "admin" ? "관리자" : "일반"}
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
                          {/* 역할 변경 */}
                          <Select
                            value={staff.role || "user"}
                            onValueChange={(value: string) => {
                              if (value !== staff.role) {
                                updateRole.mutate({ userId: staff.id, role: value as "user" | "admin" });
                              }
                            }}
                          >
                            <SelectTrigger className="w-[120px] h-9 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">일반 사용자</SelectItem>
                              <SelectItem value="admin">관리자</SelectItem>
                            </SelectContent>
                          </Select>

                          {/* 삭제 */}
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

            {/* 안내 */}
            <Card className="border-border/50 bg-blue-50/50">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">권한 안내</p>
                    <ul className="text-xs text-blue-600 mt-1 space-y-1">
                      <li><strong>관리자</strong>: 대시보드, 사이트 설정, 직원 관리, 콘텐츠 관리 등 모든 기능 접근 가능</li>
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
