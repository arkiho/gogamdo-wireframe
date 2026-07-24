import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, LogIn, ArrowLeft, Mail } from "lucide-react";
import { getGoogleLoginUrl, getNaverLoginUrl, getKakaoLoginUrl } from "@/const";

export default function ClientLogin() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const resendMutation = trpc.clientAuth.resendVerification.useMutation({
    onSuccess: () => { setResendSuccess(true); setTimeout(() => setResendSuccess(false), 5000); },
    onError: (err) => setError(err.message),
  });

  const loginMutation = trpc.clientAuth.login.useMutation({
    onSuccess: () => {
      setError("");
      setNeedsVerification(false);
      navigate("/portal");
    },
    onError: (err) => {
      if (err.message === "EMAIL_NOT_VERIFIED") {
        setNeedsVerification(true);
        setError("");
      } else {
        setNeedsVerification(false);
        setError(err.message);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate(form);
  };

  const googleUrl = getGoogleLoginUrl("client");
  const naverUrl = getNaverLoginUrl("client");
  const kakaoUrl = getKakaoLoginUrl("client");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/">
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            홈으로 돌아가기
          </span>
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center">
              <LogIn className="w-6 h-6 text-gold" />
            </div>
            <CardTitle className="text-2xl">고객 로그인</CardTitle>
            <CardDescription>
              고감도 고객 포털에 로그인하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="example@company.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">비밀번호</Label>
                  <Link href="/client/forgot-password">
                    <span className="text-xs text-gold hover:underline cursor-pointer">비밀번호를 잊으셨나요?</span>
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="비밀번호를 입력하세요"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {needsVerification && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium mb-1">이메일 인증이 필요합니다</p>
                      <p className="text-xs mb-2">회원가입 시 발송된 인증 메일의 링크를 클릭해주세요.</p>
                      <Button variant="outline" size="sm" className="h-7 text-xs"
                        disabled={resendMutation.isPending}
                        onClick={() => resendMutation.mutate({ email: form.email })}>
                        {resendMutation.isPending ? "발송 중..." : "인증 메일 재발송"}
                      </Button>
                      {resendSuccess && <p className="text-xs text-green-600 mt-1">인증 메일이 재발송되었습니다.</p>}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gold hover:bg-gold-light text-ink"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "로그인 중..." : "로그인"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                아직 계정이 없으신가요?{" "}
                <Link href="/client/register">
                  <span className="text-gold hover:underline cursor-pointer">회원가입</span>
                </Link>
              </p>
            </form>

            {(googleUrl || naverUrl || kakaoUrl) && (
              <>
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground">또는 소셜 계정으로</span></div>
                </div>
                <div className="space-y-2.5">
                  {googleUrl && (
                    <Button variant="outline" className="w-full h-11 gap-3 bg-white text-ink border-border hover:bg-gray-50" onClick={() => { window.location.href = googleUrl; }}>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      구글로 로그인
                    </Button>
                  )}
                  {naverUrl && (
                    <Button className="w-full h-11 gap-3 bg-[#03C75A] text-white hover:bg-[#02b350]" onClick={() => { window.location.href = naverUrl; }}>
                      <span className="font-extrabold text-lg leading-none">N</span> 네이버로 로그인
                    </Button>
                  )}
                  {kakaoUrl && (
                    <Button className="w-full h-11 gap-3 bg-[#FEE500] text-[#191600] hover:bg-[#f5dc00]" onClick={() => { window.location.href = kakaoUrl; }}>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.86 5.19 4.65 6.57-.15.54-.96 3.3-.99 3.51 0 0-.02.18.1.24.11.06.24.01.24.01.3-.04 3.48-2.28 4.05-2.67.63.09 1.28.14 1.95.14 5.52 0 10-3.48 10-7.8S17.52 3 12 3z"/></svg>
                      카카오로 로그인
                    </Button>
                  )}
                </div>
                <p className="text-center text-[11px] text-muted-foreground mt-3">소셜 최초 로그인 시 이메일 기준으로 기존 고객 계정과 연결되며, 없으면 새로 가입됩니다.</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
