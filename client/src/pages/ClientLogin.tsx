import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, LogIn, ArrowLeft, Mail } from "lucide-react";

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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
