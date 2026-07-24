/**
 * 직원 로그인 (F-15) — 구글 전용. 초대(staff_invitations) 이메일만 활성화.
 * 이메일/비번·네이버·카카오 제거. 목업: _mockups/gogamdo-auth-providers.html
 */
import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { getGoogleLoginUrl } from "@/const";
import Logo from "@/components/Logo";
import { toast } from "sonner";
import { ShieldCheck, Lock } from "lucide-react";

export default function AuthLogin() {
  const googleUrl = getGoogleLoginUrl("staff");

  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get("error");
    if (err === "no_invite") toast.error("초대된 이메일만 직원으로 로그인할 수 있습니다. 관리자에게 초대를 요청해주세요.");
    else if (err === "inactive") toast.error("비활성화된 계정입니다. 관리자에게 문의해주세요.");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Logo className="w-36 h-10 mx-auto mb-6" />
          <h1 className="font-heading text-2xl font-bold text-ink">직원 로그인</h1>
          <p className="text-sm text-muted-foreground mt-2">회사 구글 계정으로 로그인하세요</p>
        </div>

        {googleUrl ? (
          <Button
            className="w-full bg-white text-ink border border-border hover:bg-gray-50 gap-3 h-11"
            onClick={() => { window.location.href = googleUrl; }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google 계정으로 로그인
          </Button>
        ) : (
          <p className="text-center text-sm text-red-600">구글 로그인이 설정되지 않았습니다. 관리자에게 문의하세요.</p>
        )}

        <div className="rounded-lg bg-[#fef7ec] border border-[#f0dcb8] text-[#8a6414] text-[12px] px-3.5 py-3 leading-relaxed flex gap-2">
          <Lock className="w-4 h-4 shrink-0 mt-0.5" />
          <span><b>초대 전용.</b> 관리자가 초대한 구글 이메일과 일치할 때만 직원으로 활성화됩니다. 초대가 없으면 <Link href="/staff-join" className="underline">초대 안내</Link>를 확인하세요.</span>
        </div>

        <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" /> 고객이신가요? <Link href="/client/login" className="text-gold hover:underline font-medium">고객 로그인</Link>
        </p>
      </div>
    </div>
  );
}
