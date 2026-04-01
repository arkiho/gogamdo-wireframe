/**
 * 직원 승인 대기 페이지
 * 신청한 직원이 관리자 승인을 기다리는 상태를 표시
 * 승인 대기 중 상태, 예상 승인 시간, 문의 연락처 표시
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, Mail, Phone, CheckCircle2, AlertCircle } from "lucide-react";

export default function StaffPendingApproval() {
  const { user, loading } = useAuth();
  const [approvalStatus, setApprovalStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [submittedAt] = useState(new Date());

  useEffect(() => {
    // 사용자가 로그인하지 않았으면 로그인 페이지로 리다이렉트
    if (!loading && !user) {
      window.location.href = getLoginUrl();
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              {approvalStatus === "pending" && (
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-amber-600 animate-pulse" />
                </div>
              )}
              {approvalStatus === "approved" && (
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              )}
              {approvalStatus === "rejected" && (
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-ink">
              {approvalStatus === "pending" && "승인 대기 중"}
              {approvalStatus === "approved" && "승인 완료"}
              {approvalStatus === "rejected" && "승인 거절"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 상태 배지 */}
            <div className="flex justify-center">
              <Badge
                className={`px-4 py-2 text-sm font-semibold ${
                  approvalStatus === "pending"
                    ? "bg-amber-100 text-amber-700"
                    : approvalStatus === "approved"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {approvalStatus === "pending" && "검토 중"}
                {approvalStatus === "approved" && "승인됨"}
                {approvalStatus === "rejected" && "거절됨"}
              </Badge>
            </div>

            {/* 신청 정보 */}
            <div className="space-y-3 p-4 bg-background rounded-lg border border-border/50">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">신청자</span>
                <span className="font-semibold text-ink">{user.name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">이메일</span>
                <span className="font-semibold text-ink">{user.email}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">신청일</span>
                <span className="font-semibold text-ink">
                  {submittedAt.toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </span>
              </div>
            </div>

            {/* 상태별 메시지 */}
            {approvalStatus === "pending" && (
              <div className="space-y-3">
                <p className="text-center text-muted-foreground text-sm">
                  직원 계정 승인이 진행 중입니다. 관리자가 검토 후 승인 또는 거절 결정을 내립니다.
                </p>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700 font-medium">
                    💡 일반적으로 <strong>1~2 영업일</strong> 이내에 승인 결과를 알려드립니다.
                  </p>
                </div>
              </div>
            )}

            {approvalStatus === "approved" && (
              <div className="space-y-3">
                <p className="text-center text-muted-foreground text-sm">
                  축하합니다! 직원 계정이 승인되었습니다. 이제 직원 포털에 접근할 수 있습니다.
                </p>
                <Button className="w-full bg-gold text-ink hover:bg-gold-light font-semibold">
                  직원 포털로 이동
                </Button>
              </div>
            )}

            {approvalStatus === "rejected" && (
              <div className="space-y-3">
                <p className="text-center text-muted-foreground text-sm">
                  죄송하지만, 직원 계정 승인이 거절되었습니다. 자세한 사유는 아래 연락처로 문의해주세요.
                </p>
              </div>
            )}

            {/* 문의 정보 */}
            <div className="space-y-2 p-4 bg-gold/5 border border-gold/20 rounded-lg">
              <p className="text-sm font-semibold text-ink mb-3">문의 및 지원</p>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gold" />
                <span className="text-muted-foreground">
                  <a href="mailto:admin@kokamdo.com" className="text-gold hover:underline font-medium">
                    admin@kokamdo.com
                  </a>
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gold" />
                <span className="text-muted-foreground">
                  <a href="tel:02-1234-5678" className="text-gold hover:underline font-medium">
                    02-1234-5678
                  </a>
                </span>
              </div>
            </div>

            {/* 로그아웃 버튼 */}
            <Button
              variant="outline"
              className="w-full border-border/50 text-muted-foreground hover:bg-background"
              onClick={() => {
                // 로그아웃 처리
                window.location.href = "/";
              }}
            >
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>

        {/* 안내 문구 */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>
            이 페이지는 직원 계정 승인 대기 중인 사용자를 위한 페이지입니다.
          </p>
          <p className="mt-1">
            승인 완료 후 직원 포털에 자동으로 접근할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
