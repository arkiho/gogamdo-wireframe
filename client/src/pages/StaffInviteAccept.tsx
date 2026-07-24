/**
 * 직원 초대 수락 페이지 (E-14) — /staff/join?token=…
 * 토큰 검증 후 이름·휴대폰·비밀번호 입력 → 승인 없이 즉시 활성화·로그인.
 * 목업: _mockups/gogamdo-internal-shell-mypage.html (3 · 초대 전용 가입)
 */
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ArrowLeft, Lock } from "lucide-react";

export default function StaffInviteAccept() {
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") ?? "", []);
  const [form, setForm] = useState({ name: "", phone: "", password: "", confirm: "" });

  const verifyQ = trpc.staffManagement.verifyInvitation.useQuery({ token }, { enabled: !!token, retry: false });

  const accept = trpc.staffManagement.acceptInvitation.useMutation({
    onSuccess: (data) => {
      toast.success("가입이 완료되었습니다. 직원 콘솔로 이동합니다.");
      window.location.href = data.redirect || "/ops";
    },
    onError: (e) => toast.error(e.message),
  });

  const submit = () => {
    if (!form.name.trim()) { toast.error("이름을 입력해주세요."); return; }
    if (form.password.length < 8) { toast.error("비밀번호는 8자 이상이어야 합니다."); return; }
    if (form.password !== form.confirm) { toast.error("비밀번호가 일치하지 않습니다."); return; }
    accept.mutate({ token, name: form.name, phone: form.phone || undefined, password: form.password });
  };

  const invalid = !token || (verifyQ.data && !verifyQ.data.valid);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-gold/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />홈으로 돌아가기
        </Link>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-5 border-b border-border/50">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-gold" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-ink">직원 초대 가입</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">초대를 받으신 정보로 계정을 활성화합니다.</p>
          </CardHeader>

          <CardContent className="pt-6">
            {verifyQ.isLoading ? (
              <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>
            ) : invalid ? (
              <div className="py-6 text-center space-y-3">
                <p className="text-sm text-red-600 font-medium">{verifyQ.data?.message ?? "유효하지 않은 초대 링크입니다."}</p>
                <p className="text-xs text-muted-foreground">초대 링크가 만료되었거나 이미 사용되었습니다. 관리자에게 재발송을 요청해주세요.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-[#faf8f2] border border-border px-3.5 py-3 text-[13px] space-y-1">
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">이메일 (로그인 ID)</span><span className="font-medium flex items-center gap-1"><Lock className="w-3 h-3 opacity-50" />{verifyQ.data?.email}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">소속</span><span className="font-medium">{verifyQ.data?.departmentLabel} · {verifyQ.data?.opsRoleLabel}</span></div>
                </div>

                <div><Label>이름 *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="홍길동" /></div>
                <div><Label>휴대폰</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="010-0000-0000" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><Label>비밀번호 *</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="8자 이상" /></div>
                  <div><Label>비밀번호 확인 *</Label><Input type="password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} /></div>
                </div>
                <Button className="w-full h-11" onClick={submit} disabled={accept.isPending}>
                  {accept.isPending ? "가입 처리 중..." : "가입하고 시작하기"}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">가입 즉시 별도 승인 없이 직원 콘솔을 이용할 수 있습니다.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
