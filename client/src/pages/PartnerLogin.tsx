/**
 * 협력사 포털 로그인 페이지
 * 협력사(건설사, 시공업체 등)가 로그인하는 페이지
 * 이메일 + 비밀번호 기반 인증
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft, Loader2, Building2 } from "lucide-react";
import { Link } from "wouter";

export default function PartnerLogin() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const loginMutation = trpc.partnerAuth.login.useMutation({
    onSuccess: (data) => {
      toast.success("로그인 성공!");
      // 협력사 포털 대시보드로 이동
      navigate("/partner/dashboard");
    },
    onError: (err) => {
      toast.error(err.message || "로그인에 실패했습니다.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("유효한 이메일 주소를 입력해주세요.");
      return;
    }

    loginMutation.mutate({
      email,
      password,
      rememberMe,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-gold/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 뒤로가기 링크 */}
        <Link href="/">
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            홈으로 돌아가기
          </span>
        </Link>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-6 border-b border-border/50">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-gold" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-ink">협력사 포털</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              협력업체 전용 관리 시스템에 로그인하세요.
            </p>
          </CardHeader>

          <CardContent className="pt-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 이메일 입력 */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  이메일
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="partner@company.com"
                  className="h-10 border-border/50"
                  disabled={loginMutation.isPending}
                />
              </div>

              {/* 비밀번호 입력 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    비밀번호
                  </Label>
                  <Link href="/partner/forgot-password">
                    <span className="text-xs text-gold hover:underline cursor-pointer font-medium">
                      비밀번호 찾기
                    </span>
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-10 border-border/50 pr-10"
                    disabled={loginMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* 로그인 상태 유지 */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={loginMutation.isPending}
                />
                <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                  로그인 상태 유지
                </Label>
              </div>

              {/* 로그인 버튼 */}
              <Button
                type="submit"
                className="w-full h-10 bg-gold text-ink hover:bg-gold-light font-semibold"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    로그인 중...
                  </>
                ) : (
                  "로그인"
                )}
              </Button>
            </form>

            {/* 구분선 */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-muted-foreground">또는</span>
              </div>
            </div>

            {/* 가입 유도 */}
            <div className="space-y-3">
              <p className="text-center text-sm text-muted-foreground">
                협력사 계정이 없으신가요?
              </p>
              <Link href="/partner/register">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 border-border/50 text-ink hover:bg-background"
                >
                  협력사 가입하기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 안내 문구 */}
        <div className="mt-6 text-center text-xs text-muted-foreground space-y-1">
          <p>협력사 포털은 고감도의 협력업체 전용 관리 시스템입니다.</p>
          <p>
            문의사항은{" "}
            <a href="mailto:partner@kokamdo.com" className="text-gold hover:underline font-medium">
              partner@kokamdo.com
            </a>
            으로 연락주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
