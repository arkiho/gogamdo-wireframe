import { useState, useMemo } from "react";
import { Link, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, CheckCircle2, Loader2, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function ClientResetPassword() {
  const searchString = useSearch();
  const token = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return params.get("token") || "";
  }, [searchString]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const resetMutation = trpc.clientAuth.resetPassword.useMutation({
    onSuccess: () => setDone(true),
    onError: (err) => toast.error(err.message || "비밀번호 재설정에 실패했습니다."),
  });

  const passwordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  if (!token) {
    return (
      <div className="min-h-screen bg-[#f5f3ef] flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-ink">유효하지 않은 링크</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              비밀번호 재설정 링크가 유효하지 않습니다.<br />
              이메일의 링크를 다시 확인하시거나,<br />
              비밀번호 찾기를 다시 요청해주세요.
            </p>
            <div className="pt-4 space-y-2">
              <Link href="/client/forgot-password">
                <Button className="w-full bg-gold text-ink hover:bg-gold-light font-semibold">
                  비밀번호 찾기
                </Button>
              </Link>
              <Link href="/client/login">
                <Button variant="ghost" className="w-full text-muted-foreground">
                  로그인으로 돌아가기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#f5f3ef] flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-ink">비밀번호가 변경되었습니다</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              새로운 비밀번호로 로그인해주세요.
            </p>
            <div className="pt-4">
              <Link href="/client/login">
                <Button className="w-full bg-gold text-ink hover:bg-gold-light font-semibold">
                  로그인하기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3ef] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2 pb-2">
          <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-2">
            <KeyRound className="w-6 h-6 text-gold" />
          </div>
          <CardTitle className="font-heading text-xl">새 비밀번호 설정</CardTitle>
          <p className="text-sm text-muted-foreground">
            새로운 비밀번호를 입력해주세요.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">새 비밀번호</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="8자 이상 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {password.length > 0 && !passwordValid && (
              <p className="text-xs text-red-500">비밀번호는 8자 이상이어야 합니다.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="비밀번호를 다시 입력"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && passwordValid && passwordsMatch) {
                    resetMutation.mutate({ token, newPassword: password });
                  }
                }}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>
            )}
          </div>

          <Button
            className="w-full bg-gold text-ink hover:bg-gold-light font-semibold"
            onClick={() => {
              if (!passwordValid) { toast.error("비밀번호는 8자 이상이어야 합니다."); return; }
              if (!passwordsMatch) { toast.error("비밀번호가 일치하지 않습니다."); return; }
              resetMutation.mutate({ token, newPassword: password });
            }}
            disabled={!passwordValid || !passwordsMatch || resetMutation.isPending}
          >
            {resetMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            비밀번호 변경
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
