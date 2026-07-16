import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getGoogleLoginUrl } from "@/const";
import Logo from "@/components/Logo";

export default function AuthLogin() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login"
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, name: form.name };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "로그인에 실패했습니다.");
        return;
      }

      toast.success(mode === "login" ? "로그인 성공!" : "회원가입 완료!");
      window.location.href = "/admin";
    } catch {
      toast.error("서버 연결에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const googleUrl = getGoogleLoginUrl();

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Logo className="w-36 h-10 mx-auto mb-6" />
          <h1 className="font-heading text-2xl font-bold text-ink">
            {mode === "login" ? "로그인" : "회원가입"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {mode === "login" ? "관리자 계정으로 로그인하세요" : "새 계정을 만드세요"}
          </p>
        </div>

        {/* Google Login */}
        {googleUrl && (
          <>
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
              Google로 {mode === "login" ? "로그인" : "가입"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-surface px-3 text-muted-foreground">또는</span>
              </div>
            </div>
          </>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="홍길동"
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="name@company.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder={mode === "register" ? "8자 이상" : ""}
              minLength={mode === "register" ? 8 : undefined}
              required
            />
          </div>

          <Button type="submit" className="w-full bg-gold text-ink hover:bg-gold-light h-11" disabled={loading}>
            {loading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              계정이 없나요?{" "}
              <button onClick={() => setMode("register")} className="text-gold hover:underline font-medium">
                회원가입
              </button>
            </>
          ) : (
            <>
              이미 계정이 있나요?{" "}
              <button onClick={() => setMode("login")} className="text-gold hover:underline font-medium">
                로그인
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
