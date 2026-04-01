import { useEffect, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from "lucide-react";

export default function ClientVerifyEmail() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const verifyMutation = trpc.clientAuth.verifyEmail.useMutation({
    onSuccess: (data) => {
      setStatus("success");
      setMessage(data.message);
    },
    onError: (err) => {
      setStatus("error");
      setMessage(err.message);
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      setMessage("인증 토큰이 없습니다. 유효한 인증 링크를 사용해주세요.");
      return;
    }
    verifyMutation.mutate({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <CardContent className="pt-8 pb-8 text-center">
            {status === "loading" && (
              <>
                <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold mb-2">이메일 인증 중...</h2>
                <p className="text-muted-foreground">잠시만 기다려주세요.</p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">이메일 인증 완료!</h2>
                <p className="text-muted-foreground mb-6">{message}</p>
                <Link href="/client/login">
                  <Button className="w-full bg-gold hover:bg-gold-light text-ink">
                    로그인 하기
                  </Button>
                </Link>
              </>
            )}

            {status === "error" && (
              <>
                <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">인증 실패</h2>
                <p className="text-muted-foreground mb-6">{message}</p>
                <div className="space-y-2">
                  <Link href="/client/login">
                    <Button className="w-full bg-gold hover:bg-gold-light text-ink">
                      로그인 페이지로 이동
                    </Button>
                  </Link>
                  <Link href="/client/register">
                    <Button variant="outline" className="w-full">
                      회원가입 다시 하기
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
