import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ClientForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const requestReset = trpc.clientAuth.requestPasswordReset.useMutation({
    onSuccess: () => setSent(true),
    onError: (err) => toast.error(err.message || "요청 처리 중 오류가 발생했습니다."),
  });

  if (sent) {
    return (
      <div className="min-h-screen bg-[#f5f3ef] flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-ink">이메일을 확인해주세요</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>{email}</strong>으로<br />
              비밀번호 재설정 링크를 발송했습니다.<br />
              메일함을 확인해주세요.
            </p>
            <p className="text-xs text-muted-foreground">
              메일이 도착하지 않으면 스팸함을 확인하시거나,<br />
              잠시 후 다시 시도해주세요.
            </p>
            <div className="pt-4 space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { setSent(false); setEmail(""); }}
              >
                다른 이메일로 다시 시도
              </Button>
              <Link href="/client/login">
                <Button variant="ghost" className="w-full text-gold hover:text-gold-light">
                  로그인으로 돌아가기
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
            <Mail className="w-6 h-6 text-gold" />
          </div>
          <CardTitle className="font-heading text-xl">비밀번호 찾기</CardTitle>
          <p className="text-sm text-muted-foreground">
            가입하신 이메일 주소를 입력하시면<br />
            비밀번호 재설정 링크를 보내드립니다.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && email) requestReset.mutate({ email });
              }}
            />
          </div>
          <Button
            className="w-full bg-gold text-ink hover:bg-gold-light font-semibold"
            onClick={() => {
              if (!email) { toast.error("이메일을 입력해주세요."); return; }
              requestReset.mutate({ email });
            }}
            disabled={requestReset.isPending}
          >
            {requestReset.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            재설정 링크 발송
          </Button>
          <Link href="/client/login">
            <Button variant="ghost" className="w-full text-muted-foreground hover:text-ink gap-2">
              <ArrowLeft className="w-4 h-4" />
              로그인으로 돌아가기
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
