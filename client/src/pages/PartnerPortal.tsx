/**
 * 협력업체 대시보드 (파트너 포털)
 * 승인된 협력업체가 견적 요청 확인, 견적 제출, 계약 관리 등을 수행
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Handshake, FileText, ClipboardList, Bell,
  ArrowRight, CheckCircle2, Clock, AlertCircle,
  Building2, FileSignature
} from "lucide-react";
import { toast } from "sonner";

export default function PartnerPortal() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Card className="max-w-md w-full border-border/50">
          <CardContent className="p-8 text-center">
            <Handshake className="w-12 h-12 text-gold mx-auto mb-4" />
            <h2 className="font-heading text-xl font-bold text-ink mb-2">협력업체 포털</h2>
            <p className="text-sm text-muted-foreground mb-6">
              로그인 후 이용 가능합니다. 협력업체 등록이 필요한 경우 관리자에게 문의하세요.
            </p>
            <Button className="bg-gold text-ink hover:bg-gold-light" asChild>
              <a href="/login">로그인</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="bg-ink text-white">
        <div className="container py-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-gold/60 text-sm">파트너 포털</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold">
                협력업체 대시보드
              </h1>
              <p className="text-white/50 text-sm mt-1">
                {user?.name ?? "파트너"}님 환영합니다
              </p>
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              활성 파트너
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">0</p>
                <p className="text-xs text-muted-foreground">견적 요청</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">0</p>
                <p className="text-xs text-muted-foreground">제출 완료</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <FileSignature className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">0</p>
                <p className="text-xs text-muted-foreground">활성 계약</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">0</p>
                <p className="text-xs text-muted-foreground">만료 임박</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Navigation */}
        <h2 className="font-heading text-lg font-bold text-ink mb-4">메뉴</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "견적 요청 확인",
              desc: "발주서에 대한 견적 요청을 확인하고 견적서를 제출합니다.",
              icon: ClipboardList,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
              action: () => toast.info("견적 요청 기능이 준비 중입니다."),
            },
            {
              label: "계약 관리",
              desc: "현재 활성 계약 및 만료 예정 계약을 확인합니다.",
              icon: FileSignature,
              color: "text-amber-500",
              bg: "bg-amber-500/10",
              action: () => toast.info("계약 관리 기능이 준비 중입니다."),
            },
            {
              label: "업체 정보 관리",
              desc: "사업자등록증, 연락처 등 업체 정보를 업데이트합니다.",
              icon: Building2,
              color: "text-green-500",
              bg: "bg-green-500/10",
              action: () => toast.info("업체 정보 관리 기능이 준비 중입니다."),
            },
          ].map((item) => (
            <Card
              key={item.label}
              className="border-border/50 hover:border-gold/30 hover:shadow-sm transition-all cursor-pointer group"
              onClick={item.action}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-ink group-hover:text-gold transition-colors mb-1">
                      {item.label}
                    </h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <Card className="border-gold/20 bg-gold/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Bell className="w-6 h-6 text-gold flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-heading font-bold text-ink mb-1">파트너 포털 안내</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  이 포털에서 고감도로부터 받은 견적 요청을 확인하고, 견적서를 제출할 수 있습니다.
                  계약 관리, 업체 정보 업데이트 등의 기능을 이용하실 수 있습니다.
                  문의사항은 담당자에게 연락해 주세요.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
