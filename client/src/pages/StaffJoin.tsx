/**
 * 직원 가입 신청 페이지
 * 직원이 직접 가입 신청하고 관리자가 승인하는 방식
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Users, CheckCircle2, Send, ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function StaffJoin() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    message: "",
  });

  const submitApplication = trpc.staffManagement.submitApplication.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("가입 신청이 완료되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  if (submitted) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <Card className="max-w-md w-full border-green-500/30">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="font-heading text-xl font-bold text-ink mb-2">
              가입 신청이 완료되었습니다
            </h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              관리자가 신청 내용을 검토한 후 승인 여부를 알려드립니다.
              승인이 완료되면 이메일로 안내를 보내드립니다.
            </p>
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-1" />
                홈으로 돌아가기
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-12">
      <Card className="max-w-lg w-full border-border/50">
        <CardHeader className="text-center pb-2">
          <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7 text-gold" />
          </div>
          <CardTitle className="font-heading text-xl">직원 가입 신청</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            고감도 직원으로 가입을 신청합니다. 관리자 승인 후 이용 가능합니다.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">이름 *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="홍길동"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">이메일 *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="hong@example.com"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">연락처</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="010-1234-5678"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">희망 부서</Label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="mt-1 w-full h-10 px-3 rounded-md border border-border bg-background text-sm"
            >
              <option value="">선택해주세요</option>
              <option value="design">디자인팀</option>
              <option value="construction">시공팀</option>
              <option value="accounting">회계팀</option>
              <option value="management">경영관리팀</option>
              <option value="sales">영업팀</option>
            </select>
          </div>
          <div>
            <Label className="text-sm font-medium">메시지 (선택)</Label>
            <Textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="추가 전달 사항이 있으면 입력해주세요."
              className="mt-1"
              rows={3}
            />
          </div>
          <Button
            onClick={() => {
              if (!formData.name.trim() || !formData.email.trim()) {
                toast.error("이름과 이메일은 필수 입력 항목입니다.");
                return;
              }
              submitApplication.mutate({
                name: formData.name,
                email: formData.email,
                phone: formData.phone || undefined,
                department: formData.department || undefined,
                message: formData.message || undefined,
              });
            }}
            className="w-full bg-gold text-ink hover:bg-gold-light"
            disabled={submitApplication.isPending}
          >
            <Send className="w-4 h-4 mr-1" />
            {submitApplication.isPending ? "신청 중..." : "가입 신청"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link href="/" className="text-gold hover:underline">
              로그인
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
