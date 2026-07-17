/**
 * 협력업체 대시보드 (파트너 포털)
 * 승인된 협력업체가 견적 요청 확인, 견적 제출, 계약 관리 등을 수행
 */

import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Handshake, FileText, ClipboardList, Bell,
  ArrowRight, CheckCircle2, Clock, AlertCircle,
  Building2, FileSignature, Send, Eye
} from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

const RFQ_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  sent: { label: "미열람", color: "bg-blue-100 text-blue-700" },
  viewed: { label: "열람", color: "bg-amber-100 text-amber-700" },
  quoted: { label: "견적 제출", color: "bg-green-100 text-green-700" },
  accepted: { label: "채택", color: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "미채택", color: "bg-red-100 text-red-700" },
  expired: { label: "만료", color: "bg-gray-100 text-gray-500" },
};

export default function PartnerPortal() {
  const { user, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<"overview" | "rfqs">("overview");
  const [selectedRfq, setSelectedRfq] = useState<any>(null);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);

  // 로그인한 파트너의 RFQ 목록 조회
  const rfqsQuery = trpc.partnerPortal.myRfqs.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const rfqs = rfqsQuery.data ?? [];

  // RFQ 통계
  const stats = useMemo(() => {
    const pending = rfqs.filter((r: any) => r.rfq.status === "sent" || r.rfq.status === "viewed").length;
    const quoted = rfqs.filter((r: any) => r.rfq.status === "quoted").length;
    const accepted = rfqs.filter((r: any) => r.rfq.status === "accepted").length;
    const expired = rfqs.filter((r: any) => {
      if (r.rfq.expiresAt && new Date(r.rfq.expiresAt) < new Date()) return true;
      return r.rfq.status === "expired";
    }).length;
    return { pending, quoted, accepted, expired };
  }, [rfqs]);

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
              <a href={getLoginUrl()}>로그인</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Quote Submission Dialog */}
      {selectedRfq && (
        <QuoteDialog
          rfq={selectedRfq}
          open={quoteDialogOpen}
          onOpenChange={setQuoteDialogOpen}
          onSuccess={() => {
            rfqsQuery.refetch();
            setQuoteDialogOpen(false);
            setSelectedRfq(null);
          }}
        />
      )}

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
                <p className="text-2xl font-bold text-ink">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">대기 중 견적요청</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">{stats.quoted}</p>
                <p className="text-xs text-muted-foreground">제출 완료</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <FileSignature className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">{stats.accepted}</p>
                <p className="text-xs text-muted-foreground">채택됨</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">{stats.expired}</p>
                <p className="text-xs text-muted-foreground">만료</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 border-b border-border/50">
          {[
            { key: "overview", label: "개요", icon: Building2 },
            { key: "rfqs", label: "견적 요청", icon: ClipboardList },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? "border-gold text-gold"
                  : "border-transparent text-muted-foreground hover:text-ink"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.key === "rfqs" && stats.pending > 0 && (
                <Badge className="bg-red-500 text-white text-xs ml-1 px-1.5 py-0">{stats.pending}</Badge>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && (
          <>
            <h2 className="font-heading text-lg font-bold text-ink mb-4">메뉴</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
              {[
                {
                  label: "견적 요청 확인",
                  desc: "발주서에 대한 견적 요청을 확인하고 견적서를 제출합니다.",
                  icon: ClipboardList,
                  color: "text-blue-500",
                  bg: "bg-blue-500/10",
                  action: () => setTab("rfqs"),
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
          </>
        )}

        {/* RFQs Tab */}
        {tab === "rfqs" && (
          <div>
            {rfqsQuery.isLoading ? (
              <Card className="border-border/50">
                <CardContent className="p-8 text-center">
                  <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2 animate-spin" />
                  <p className="text-sm text-muted-foreground">견적 요청을 불러오는 중...</p>
                </CardContent>
              </Card>
            ) : rfqs.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="p-12 text-center">
                  <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-heading text-lg font-bold text-ink mb-2">견적 요청이 없습니다</h3>
                  <p className="text-sm text-muted-foreground">
                    아직 귀사에 도착한 견적 요청이 없습니다. 새로운 요청이 있으면 여기에 표시됩니다.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {rfqs.map((item: any) => {
                  const rfq = item.rfq;
                  const isExpired = rfq.expiresAt && new Date(rfq.expiresAt) < new Date();
                  const statusKey = isExpired ? "expired" : rfq.status;
                  const statusInfo = RFQ_STATUS_LABELS[statusKey] ?? { label: statusKey, color: "bg-gray-100 text-gray-500" };
                  const canSubmit = !isExpired && (rfq.status === "sent" || rfq.status === "viewed");

                  return (
                    <Card key={rfq.id} className="border-border/50 hover:border-gold/20 transition-colors">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-heading font-bold text-ink text-sm">
                                {item.poTitle ?? `발주서 #${rfq.purchaseOrderId}`}
                              </h3>
                              <Badge className={`text-xs ${statusInfo.color}`}>{statusInfo.label}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              요청일: {new Date(rfq.createdAt).toLocaleDateString("ko-KR")}
                              {rfq.expiresAt && (
                                <> · 마감: {new Date(rfq.expiresAt).toLocaleDateString("ko-KR")}</>
                              )}
                            </p>
                            {rfq.quotedTotal && (
                              <p className="text-sm text-ink font-medium">
                                제출 금액: {Number(rfq.quotedTotal).toLocaleString("ko-KR")}원
                              </p>
                            )}
                            {rfq.notes && (
                              <p className="text-xs text-muted-foreground mt-1">비고: {rfq.notes}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {canSubmit && (
                              <Button
                                size="sm"
                                className="bg-gold text-ink hover:bg-gold-light"
                                onClick={() => {
                                  setSelectedRfq(item);
                                  setQuoteDialogOpen(true);
                                }}
                              >
                                <Send className="w-3.5 h-3.5 mr-1" />
                                견적 제출
                              </Button>
                            )}
                            {rfq.status === "quoted" && (
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                제출 완료
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 견적 제출 다이얼로그
 */
function QuoteDialog({
  rfq,
  open,
  onOpenChange,
  onSuccess,
}: {
  rfq: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const token = rfq.rfq.token;
  const rfqDetail = trpc.ops.rfqPortal.validate.useQuery({ token }, { enabled: open && !!token });
  const submitQuote = trpc.ops.rfqPortal.submitQuote.useMutation({
    onSuccess: () => {
      toast.success("견적이 성공적으로 제출되었습니다.");
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const [quotedItems, setQuotedItems] = useState<any[]>([]);
  const [notes, setNotes] = useState("");

  // 항목이 로드되면 초기화
  const items = rfqDetail.data?.purchaseOrder?.items ?? [];
  if (items.length > 0 && quotedItems.length === 0 && open) {
    setQuotedItems(items.map((item: any) => ({
      itemId: item.id,
      unitPrice: 0,
      amount: 0,
      leadTime: "",
      remarks: "",
    })));
  }

  const totalAmount = quotedItems.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-gold" />
            견적서 제출
          </DialogTitle>
        </DialogHeader>

        {rfqDetail.isLoading ? (
          <div className="py-8 text-center">
            <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2 animate-spin" />
            <p className="text-sm text-muted-foreground">견적 요청 정보를 불러오는 중...</p>
          </div>
        ) : rfqDetail.error ? (
          <div className="py-8 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-500">{rfqDetail.error.message}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* PO Info */}
            <div className="p-4 bg-ink/5 rounded-lg">
              <p className="text-sm font-medium text-ink mb-1">
                발주서: {rfqDetail.data?.purchaseOrder?.title ?? `#${rfq.rfq.purchaseOrderId}`}
              </p>
              <p className="text-xs text-muted-foreground">
                마감: {rfq.rfq.expiresAt ? new Date(rfq.rfq.expiresAt).toLocaleDateString("ko-KR") : "미정"}
              </p>
            </div>

            {/* Items */}
            <div>
              <h3 className="font-heading font-bold text-ink text-sm mb-3">항목별 견적</h3>
              <div className="space-y-4">
                {items.map((item: any, idx: number) => (
                  <div key={item.id} className="p-4 border border-border/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-ink text-sm">{item.name}</p>
                        {item.specification && (
                          <p className="text-xs text-muted-foreground">{item.specification}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.quantity} {item.unit}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">단가 (원)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          className="mt-1 h-8 text-sm"
                          value={quotedItems[idx]?.unitPrice || ""}
                          onChange={(e) => {
                            const updated = [...quotedItems];
                            const unitPrice = Number(e.target.value) || 0;
                            updated[idx] = {
                              ...updated[idx],
                              unitPrice,
                              amount: unitPrice * (item.quantity || 1),
                            };
                            setQuotedItems(updated);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">금액 (원)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          className="mt-1 h-8 text-sm"
                          value={quotedItems[idx]?.amount || ""}
                          onChange={(e) => {
                            const updated = [...quotedItems];
                            updated[idx] = { ...updated[idx], amount: Number(e.target.value) || 0 };
                            setQuotedItems(updated);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">납기</Label>
                        <Input
                          placeholder="예: 2주"
                          className="mt-1 h-8 text-sm"
                          value={quotedItems[idx]?.leadTime || ""}
                          onChange={(e) => {
                            const updated = [...quotedItems];
                            updated[idx] = { ...updated[idx], leadTime: e.target.value };
                            setQuotedItems(updated);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">비고</Label>
                        <Input
                          placeholder="비고 사항"
                          className="mt-1 h-8 text-sm"
                          value={quotedItems[idx]?.remarks || ""}
                          onChange={(e) => {
                            const updated = [...quotedItems];
                            updated[idx] = { ...updated[idx], remarks: e.target.value };
                            setQuotedItems(updated);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-4 bg-gold/5 border border-gold/20 rounded-lg">
              <span className="font-heading font-bold text-ink">합계</span>
              <span className="font-heading text-xl font-bold text-gold">
                {totalAmount.toLocaleString("ko-KR")}원
              </span>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-sm font-medium">추가 메모</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="특이사항이나 조건을 기재해 주세요"
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Submit */}
            <Button
              className="w-full bg-gold text-ink hover:bg-gold-light"
              onClick={() => {
                if (quotedItems.some(i => !i.unitPrice || !i.leadTime)) {
                  toast.error("모든 항목의 단가와 납기를 입력해 주세요.");
                  return;
                }
                submitQuote.mutate({
                  token,
                  quotedItems: quotedItems.map(i => ({
                    ...i,
                    remarks: i.remarks || undefined,
                  })),
                  quotedTotal: String(totalAmount),
                  notes: notes || undefined,
                });
              }}
              disabled={submitQuote.isPending}
            >
              {submitQuote.isPending ? "제출 중..." : "견적서 제출"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
