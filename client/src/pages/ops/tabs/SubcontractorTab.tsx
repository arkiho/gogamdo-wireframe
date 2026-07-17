import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Plus, Users, Building, Phone, Mail, CheckCircle, Copy, Star, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  invited: { label: "초대됨", color: "bg-blue-100 text-blue-700" },
  active: { label: "활성", color: "bg-green-100 text-green-700" },
  completed: { label: "완료", color: "bg-gray-100 text-gray-600" },
  suspended: { label: "중지", color: "bg-red-100 text-red-700" },
};

const TRADE_LABELS: Record<string, string> = {
  demolition: "철거", framing: "골조", electrical: "전기",
  plumbing: "설비", hvac: "공조", flooring: "바닥",
  ceiling: "천장", painting: "도장", furniture: "가구",
  it_network: "IT/네트워크", fire_safety: "소방", cleaning: "클리닝", other: "기타",
};

const RECOMMENDATION_LABELS: Record<string, { label: string; color: string }> = {
  highly_recommended: { label: "적극 추천", color: "text-green-600" },
  recommended: { label: "추천", color: "text-blue-600" },
  neutral: { label: "보통", color: "text-gray-600" },
  not_recommended: { label: "비추천", color: "text-red-600" },
};

function StarRating({ score, size = "sm" }: { score: number; size?: "sm" | "md" }) {
  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${iconSize} ${i <= Math.round(score) ? "text-amber-400 fill-amber-400" : "text-gray-200"}`}
        />
      ))}
      <span className={`ml-1 font-semibold ${size === "sm" ? "text-xs" : "text-sm"}`}>{score.toFixed(1)}</span>
    </div>
  );
}

function SubDetailModal({ sub, projectId, onClose }: { sub: any; projectId: string; onClose: () => void }) {
  const summary = trpc.ops.evaluation.summary.useQuery({ subcontractorId: sub.id });
  const evaluations = trpc.ops.evaluation.bySubcontractor.useQuery({ subcontractorId: sub.id });

  const st = STATUS_LABELS[sub.status] ?? STATUS_LABELS.invited;

  return (
    <div className="space-y-4">
      {/* 업체 기본 정보 */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Building className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-bold text-lg">{sub.companyName}</h3>
          <Badge variant="outline" className="text-xs">{TRADE_LABELS[sub.trade] ?? sub.trade}</Badge>
          <Badge className={`text-xs ${st.color} border-0`}>{st.label}</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {sub.contactName && (
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{sub.contactName}</span>
            </div>
          )}
          {sub.contactPhone && (
            <a href={`tel:${sub.contactPhone}`} className="flex items-center gap-2 text-blue-600">
              <Phone className="w-3.5 h-3.5" />
              <span>{sub.contactPhone}</span>
            </a>
          )}
          {sub.contactEmail && (
            <a href={`mailto:${sub.contactEmail}`} className="flex items-center gap-2 text-blue-600">
              <Mail className="w-3.5 h-3.5" />
              <span className="truncate">{sub.contactEmail}</span>
            </a>
          )}
          {sub.contractAmount && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">계약금액:</span>
              <span className="font-semibold">{Number(sub.contractAmount).toLocaleString()}원</span>
            </div>
          )}
        </div>
      </div>

      {/* 평가 요약 */}
      <div>
        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" />
          평가 요약
        </h4>
        {summary.isLoading ? (
          <div className="text-center py-4 text-muted-foreground text-sm">로딩 중...</div>
        ) : !summary.data || summary.data.totalEvaluations === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm border rounded-lg">
            아직 평가 이력이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="p-3 bg-amber-50 rounded-lg text-center">
                <p className="text-[10px] text-amber-600 font-medium">종합 평점</p>
                <p className="text-xl font-bold text-amber-700">{Number(summary.data.avgOverall).toFixed(1)}</p>
                <StarRating score={Number(summary.data.avgOverall)} size="sm" />
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-[10px] text-blue-600 font-medium">평가 횟수</p>
                <p className="text-xl font-bold text-blue-700">{summary.data.totalEvaluations}</p>
                <p className="text-[10px] text-blue-500">건</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center col-span-2 sm:col-span-1">
                <p className="text-[10px] text-green-600 font-medium">추천율</p>
                <p className="text-xl font-bold text-green-700">
                  {summary.data.totalEvaluations > 0
                    ? Math.round(((summary.data.recommendedCount ?? 0) / summary.data.totalEvaluations) * 100)
                    : 0}%
                </p>
              </div>
            </div>

            {/* 항목별 점수 */}
            <div className="space-y-2">
              {[
                { label: "시공 품질", value: summary.data.avgQuality },
                { label: "공정 준수", value: summary.data.avgSchedule },
                { label: "안전 관리", value: summary.data.avgSafety },
                { label: "소통/협업", value: summary.data.avgCommunication },
                { label: "현장 정리", value: summary.data.avgCleanup },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{item.label}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-amber-400 h-2 rounded-full transition-all"
                      style={{ width: `${(Number(item.value) / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-8 text-right">{Number(item.value).toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 평가 이력 */}
      <div>
        <h4 className="font-semibold text-sm mb-3">평가 이력</h4>
        {evaluations.isLoading ? (
          <div className="text-center py-4 text-muted-foreground text-sm">로딩 중...</div>
        ) : !evaluations.data?.length ? (
          <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
            평가 이력이 없습니다.
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {evaluations.data.map((ev: any) => {
              const rec = RECOMMENDATION_LABELS[ev.recommendation] ?? RECOMMENDATION_LABELS.neutral;
              return (
                <div key={ev.id} className="p-3 border rounded-lg text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <StarRating score={Number(ev.overallScore)} size="sm" />
                    <span className={`text-xs font-medium ${rec.color}`}>{rec.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-1">
                    {new Date(ev.createdAt).toLocaleDateString("ko-KR")}
                  </p>
                  {ev.strengths && (
                    <p className="text-xs"><span className="text-green-600 font-medium">강점:</span> {ev.strengths}</p>
                  )}
                  {ev.improvements && (
                    <p className="text-xs"><span className="text-amber-600 font-medium">개선:</span> {ev.improvements}</p>
                  )}
                  {ev.comment && (
                    <p className="text-xs text-muted-foreground mt-1">{ev.comment}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SubcontractorTab({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [detailSub, setDetailSub] = useState<any>(null);
  const [form, setForm] = useState({
    companyName: "", trade: "other", contactName: "",
    contactPhone: "", contactEmail: "", contractAmount: "",
  });

  const subs = trpc.ops.subcontractor.list.useQuery();
  const createSub = trpc.ops.subcontractor.create.useMutation({
    onSuccess: () => {
      subs.refetch();
      setOpen(false);
      setForm({ companyName: "", trade: "other", contactName: "", contactPhone: "", contactEmail: "", contractAmount: "" });
      toast.success("하도급 업체가 등록되었습니다.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!form.companyName) {
      toast.error("업체명은 필수입니다.");
      return;
    }
    createSub.mutate({
      companyName: form.companyName,
      specialty: form.trade,
      contactName: form.contactName || undefined,
      contactPhone: form.contactPhone || undefined,
      contactEmail: form.contactEmail || undefined,
    });
  };

  const handleCopyInviteLink = (subId: string) => {
    const link = `${window.location.origin}/ops/sub-portal/${subId}`;
    navigator.clipboard.writeText(link);
    toast.success("하도급 업체 포털 링크가 복사되었습니다.");
  };

  return (
    <Card>
      <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Users className="w-5 h-5" />하도급 관리
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-1" />업체 등록</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>하도급 업체 등록</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label>업체명 *</Label>
                <Input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} placeholder="업체명" className="h-11 sm:h-9" />
              </div>
              <div>
                <Label>공종</Label>
                <Select value={form.trade} onValueChange={v => setForm(f => ({ ...f, trade: v }))}>
                  <SelectTrigger className="h-11 sm:h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRADE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>담당자</Label>
                  <Input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} placeholder="담당자명" className="h-11 sm:h-9" />
                </div>
                <div>
                  <Label>연락처</Label>
                  <Input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} placeholder="010-0000-0000" className="h-11 sm:h-9" />
                </div>
              </div>
              <div>
                <Label>이메일</Label>
                <Input value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="email@company.com" className="h-11 sm:h-9" />
              </div>
              <div>
                <Label>계약금액 (원)</Label>
                <Input value={form.contractAmount} onChange={e => setForm(f => ({ ...f, contractAmount: e.target.value }))} placeholder="10000000" className="h-11 sm:h-9" />
              </div>
              <Button onClick={handleCreate} className="w-full h-12 sm:h-9 text-base sm:text-sm" disabled={createSub.isPending}>
                {createSub.isPending ? "등록 중..." : "업체 등록"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {subs.isLoading ? (
          <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
        ) : !subs.data?.length ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto opacity-30 mb-2" />
            등록된 하도급 업체가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {subs.data.map(s => {
              const st = STATUS_LABELS[s.isActive ? "active" : "suspended"];
              return (
                <div
                  key={s.id}
                  className="p-3 sm:p-4 border rounded-lg hover:bg-accent/30 active:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setDetailSub(s)}
                >
                  {/* 상단: 업체명 + 배지 + 평점 */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <Building className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <h4 className="font-semibold text-sm sm:text-base">{s.companyName}</h4>
                      <Badge variant="outline" className="text-[10px] sm:text-xs">{s.specialty ? (TRADE_LABELS[s.specialty] ?? s.specialty) : "기타"}</Badge>
                      <Badge className={`text-[10px] sm:text-xs ${st.color} border-0`}>{st.label}</Badge>
                      <SubRatingBadge subcontractorId={s.id} />
                    </div>
                    {/* 액션 버튼 */}
                    <div className="flex gap-2 w-full sm:w-auto" onClick={e => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" className="flex-1 sm:flex-initial h-9 sm:h-8" onClick={() => handleCopyInviteLink(String(s.id))}>
                        <Copy className="w-3.5 h-3.5 mr-1" />링크 복사
                      </Button>
                      <Button size="sm" variant="ghost" className="h-9 sm:h-8 px-2" onClick={() => setDetailSub(s)}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {/* 연락처 정보 */}
                  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    {s.contactName && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{s.contactName}</span>}
                    {s.contactPhone && (
                      <a href={`tel:${s.contactPhone}`} className="flex items-center gap-1 text-blue-600 sm:text-muted-foreground" onClick={e => e.stopPropagation()}>
                        <Phone className="w-3 h-3" />{s.contactPhone}
                      </a>
                    )}
                    {s.contactEmail && (
                      <a href={`mailto:${s.contactEmail}`} className="flex items-center gap-1 text-blue-600 sm:text-muted-foreground truncate" onClick={e => e.stopPropagation()}>
                        <Mail className="w-3 h-3 flex-shrink-0" />{s.contactEmail}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* 업체 상세 모달 */}
      <Dialog open={!!detailSub} onOpenChange={open => !open && setDetailSub(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>업체 상세 정보</DialogTitle>
          </DialogHeader>
          {detailSub && <SubDetailModal sub={detailSub} projectId={projectId} onClose={() => setDetailSub(null)} />}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/** 업체 평점 배지 - 인라인 표시 */
function SubRatingBadge({ subcontractorId }: { subcontractorId: number }) {
  const summary = trpc.ops.evaluation.summary.useQuery({ subcontractorId });

  if (summary.isLoading || !summary.data || summary.data.totalEvaluations === 0) {
    return null;
  }

  const score = Number(summary.data.avgOverall);
  const color = score >= 4 ? "text-green-600 bg-green-50" : score >= 3 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";

  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${color}`}>
      <Star className="w-2.5 h-2.5 fill-current" />
      {score.toFixed(1)}
    </span>
  );
}
