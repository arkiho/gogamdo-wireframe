/**
 * 직원 가입 — 초대 전용으로 전환됨 (E-14).
 * 기존 자가신청(/staff-join)은 폐지. 이 페이지는 안내만 제공한다.
 */
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MailCheck, ArrowLeft } from "lucide-react";

export default function StaffJoin() {
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
                <MailCheck className="w-6 h-6 text-gold" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-ink">직원 가입은 초대 전용입니다</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 text-center">
            <p className="text-sm text-muted-foreground leading-relaxed">
              고감도 직원 콘솔은 관리자가 초대한 분만 가입할 수 있습니다.<br />
              담당 관리자에게 <strong className="text-ink">초대 이메일 발송</strong>을 요청해주세요.
              초대 메일의 링크로 접속하면 별도 승인 없이 바로 이용할 수 있습니다.
            </p>
            <div className="rounded-lg bg-[#faf8f2] border border-border px-4 py-3 text-[13px] text-muted-foreground">
              이미 직원 계정이 있으신가요?
            </div>
            <Link href="/auth/login">
              <Button className="w-full h-11">직원 로그인</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
