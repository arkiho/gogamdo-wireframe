import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Star, Plus, Award, TrendingUp, Shield, MessageSquare, Sparkles, Landmark, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

const RECOMMENDATION_LABELS: Record<string, { label: string; color: string }> = {
  highly_recommended: { label: "적극 추천", color: "bg-green-100 text-green-700" },
  recommended: { label: "추천", color: "bg-blue-100 text-blue-700" },
  neutral: { label: "보통", color: "bg-gray-100 text-gray-600" },
  not_recommended: { label: "비추천", color: "bg-red-100 text-red-700" },
};

function StarRating({ value, onChange, readonly = false, size = "md" }: { value: number; onChange?: (v: number) => void; readonly?: boolean; size?: "sm" | "md" }) {
  const starSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(i)}
          className={`${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform p-0.5`}
        >
          <Star
            className={`${starSize} ${i <= value ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
          />
        </button>
      ))}
    </div>
  );
}

function ScoreSummaryCard({ label, icon: Icon, score }: { label: string; icon: any; score: number }) {
  const color = score >= 4 ? "text-green-600" : score >= 3 ? "text-amber-600" : "text-red-600";
  return (
    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] sm:text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm sm:text-lg font-bold ${color}`}>{score.toFixed(1)}</p>
      </div>
      <div className="hidden sm:block">
        <StarRating value={Math.round(score)} readonly size="sm" />
      </div>
    </div>
  );
}

export default function EvaluationTab({ projectId }: { projectId: string }) {
  const pid = Number(projectId);
  const [open, setOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<number | null>(null);
  const [form, setForm] = useState({
    subcontractorId: 0,
    qualityScore: 3,
    scheduleScore: 3,
    safetyScore: 3,
    communicationScore: 3,
    cleanupScore: 3,
    strengths: "",
    improvements: "",
    recommendation: "neutral" as const,
    comment: "",
  });

  const evaluations = trpc.ops.evaluation.list.useQuery({ projectId: pid });
  const subs = trpc.ops.subcontractor.list.useQuery();
  const summary = trpc.ops.evaluation.summary.useQuery(
    { subcontractorId: selectedSub! },
    { enabled: !!selectedSub }
  );

  const createEval = trpc.ops.evaluation.create.useMutation({
    onSuccess: () => {
      evaluations.refetch();
      if (selectedSub) summary.refetch();
      setOpen(false);
      setForm({
        subcontractorId: 0, qualityScore: 3, scheduleScore: 3,
        safetyScore: 3, communicationScore: 3, cleanupScore: 3,
        strengths: "", improvements: "", recommendation: "neutral", comment: "",
      });
      toast.success("평가가 등록되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!form.subcontractorId) {
      toast.error("업체를 선택해주세요.");
      return;
    }
    createEval.mutate({ ...form, projectId: pid });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <Award className="w-5 h-5" />하도급 업체 평가
        </h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-1" />평가 작성</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>하도급 업체 평가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>업체 선택 *</Label>
                <Select
                  value={form.subcontractorId ? String(form.subcontractorId) : ""}
                  onValueChange={v => setForm(f => ({ ...f, subcontractorId: Number(v) }))}
                >
                  <SelectTrigger className="h-11 sm:h-9"><SelectValue placeholder="업체를 선택하세요" /></SelectTrigger>
                  <SelectContent>
                    {subs.data?.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.companyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Score Fields */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5 text-xs sm:text-sm"><Sparkles className="w-4 h-4" />시공 품질</Label>
                  <StarRating value={form.qualityScore} onChange={v => setForm(f => ({ ...f, qualityScore: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5 text-xs sm:text-sm"><TrendingUp className="w-4 h-4" />공정 준수</Label>
                  <StarRating value={form.scheduleScore} onChange={v => setForm(f => ({ ...f, scheduleScore: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5 text-xs sm:text-sm"><Shield className="w-4 h-4" />안전 관리</Label>
                  <StarRating value={form.safetyScore} onChange={v => setForm(f => ({ ...f, safetyScore: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5 text-xs sm:text-sm"><MessageSquare className="w-4 h-4" />소통/협업</Label>
                  <StarRating value={form.communicationScore} onChange={v => setForm(f => ({ ...f, communicationScore: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5 text-xs sm:text-sm"><Sparkles className="w-4 h-4" />현장 정리</Label>
                  <StarRating value={form.cleanupScore} onChange={v => setForm(f => ({ ...f, cleanupScore: v }))} />
                </div>
              </div>

              <div>
                <Label>추천 여부</Label>
                <Select
                  value={form.recommendation}
                  onValueChange={v => setForm(f => ({ ...f, recommendation: v as any }))}
                >
                  <SelectTrigger className="h-11 sm:h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="highly_recommended">적극 추천</SelectItem>
                    <SelectItem value="recommended">추천</SelectItem>
                    <SelectItem value="neutral">보통</SelectItem>
                    <SelectItem value="not_recommended">비추천</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>강점</Label>
                <Textarea
                  value={form.strengths}
                  onChange={e => setForm(f => ({ ...f, strengths: e.target.value }))}
                  placeholder="이 업체의 강점을 작성해주세요"
                  rows={2}
                />
              </div>
              <div>
                <Label>개선사항</Label>
                <Textarea
                  value={form.improvements}
                  onChange={e => setForm(f => ({ ...f, improvements: e.target.value }))}
                  placeholder="개선이 필요한 부분을 작성해주세요"
                  rows={2}
                />
              </div>
              <div>
                <Label>추가 의견</Label>
                <Textarea
                  value={form.comment}
                  onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                  placeholder="기타 의견을 작성해주세요"
                  rows={2}
                />
              </div>

              <Button onClick={handleSubmit} className="w-full h-12 sm:h-9 text-base sm:text-sm" disabled={createEval.isPending}>
                {createEval.isPending ? "등록 중..." : "평가 등록"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sub Selector for Summary */}
      {subs.data && subs.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xs sm:text-sm">업체별 종합 평가</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
              {subs.data.map(s => (
                <Button
                  key={s.id}
                  variant={selectedSub === s.id ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => setSelectedSub(s.id)}
                >
                  {s.companyName}
                </Button>
              ))}
            </div>

            {selectedSub && summary.data && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-amber-500">{summary.data.avgOverall}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">종합 점수</p>
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    총 {summary.data.totalEvaluations}건 평가
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(summary.data.recommendations).map(([key, count]) => {
                      const r = RECOMMENDATION_LABELS[key];
                      return count > 0 ? (
                        <Badge key={key} className={`${r?.color} border-0 text-[10px] sm:text-xs`}>
                          {r?.label} {count}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  <ScoreSummaryCard label="시공 품질" icon={Sparkles} score={summary.data.avgQuality} />
                  <ScoreSummaryCard label="공정 준수" icon={TrendingUp} score={summary.data.avgSchedule} />
                  <ScoreSummaryCard label="안전 관리" icon={Shield} score={summary.data.avgSafety} />
                  <ScoreSummaryCard label="소통/협업" icon={MessageSquare} score={summary.data.avgCommunication} />
                  <ScoreSummaryCard label="현장 정리" icon={Sparkles} score={summary.data.avgCleanup} />
                </div>
              </div>
            )}

            {selectedSub && !summary.data && !summary.isLoading && (
              <p className="text-center text-muted-foreground text-sm py-4">
                아직 평가 기록이 없습니다.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Evaluation List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xs sm:text-sm">평가 이력</CardTitle>
        </CardHeader>
        <CardContent>
          {evaluations.isLoading ? (
            <p className="text-center text-muted-foreground py-4">로딩 중...</p>
          ) : !evaluations.data?.length ? (
            <div className="text-center py-8">
              <Award className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground text-sm">아직 평가 기록이 없습니다.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">프로젝트 완료 후 하도급 업체를 평가해주세요.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {evaluations.data.map(ev => {
                const sub = subs.data?.find(s => s.id === ev.subcontractorId);
                const rec = RECOMMENDATION_LABELS[ev.recommendation] ?? { label: ev.recommendation, color: "bg-gray-100" };
                return (
                  <div key={ev.id} className="p-3 sm:p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="font-semibold text-sm">{sub?.companyName ?? "업체"}</span>
                        <Badge className={`${rec.color} border-0 text-[10px] sm:text-xs`}>{rec.label}</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-sm">{Number(ev.overallScore).toFixed(1)}</span>
                      </div>
                    </div>
                    {/* 모바일: 2열+3열 그리드, 데스크톱: 5열 */}
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                      <div>품질 <span className="font-semibold text-foreground">{ev.qualityScore}</span></div>
                      <div>공정 <span className="font-semibold text-foreground">{ev.scheduleScore}</span></div>
                      <div>안전 <span className="font-semibold text-foreground">{ev.safetyScore}</span></div>
                      <div>소통 <span className="font-semibold text-foreground">{ev.communicationScore}</span></div>
                      <div>정리 <span className="font-semibold text-foreground">{ev.cleanupScore}</span></div>
                    </div>
                    {ev.strengths && (
                      <p className="text-xs sm:text-sm"><span className="text-green-600 font-medium">강점:</span> {ev.strengths}</p>
                    )}
                    {ev.improvements && (
                      <p className="text-xs sm:text-sm"><span className="text-amber-600 font-medium">개선:</span> {ev.improvements}</p>
                    )}
                    {ev.comment && (
                      <p className="text-xs sm:text-sm text-muted-foreground">{ev.comment}</p>
                    )}
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {new Date(ev.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 거래처(계좌 등록부) 평가 — 100점 만점 */}
      <VendorEvaluationSection projectId={pid} />
    </div>
  );
}

const VENDOR_CRITERIA: { key: "quality" | "schedule" | "communication" | "price" | "reliability"; label: string; icon: any }[] = [
  { key: "quality", label: "품질", icon: Sparkles },
  { key: "schedule", label: "납기·일정", icon: TrendingUp },
  { key: "communication", label: "소통", icon: MessageSquare },
  { key: "price", label: "가격·정산", icon: Award },
  { key: "reliability", label: "신뢰·재거래", icon: Shield },
];

const EMPTY_VENDOR_EVAL = { vendorId: 0, quality: 15, schedule: 15, communication: 15, price: 15, reliability: 15, comment: "" };

function VendorEvaluationSection({ projectId }: { projectId: number }) {
  const { user } = useAuth();
  const canEdit = !!user;
  const canDelete = user?.role === "admin" || user?.role === "master";
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_VENDOR_EVAL });

  const vendors = trpc.ops.vendor.list.useQuery();
  const evals = trpc.ops.vendor.evalByProject.useQuery({ projectId });

  const total = form.quality + form.schedule + form.communication + form.price + form.reliability;

  const createEval = trpc.ops.vendor.evalCreate.useMutation({
    onSuccess: () => {
      evals.refetch();
      utils.ops.vendor.list.invalidate();
      setOpen(false);
      setForm({ ...EMPTY_VENDOR_EVAL });
      toast.success("거래처 평가가 등록되었습니다.");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteEval = trpc.ops.vendor.evalDelete.useMutation({
    onSuccess: () => { evals.refetch(); utils.ops.vendor.list.invalidate(); toast.success("평가가 삭제되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const submit = () => {
    if (!form.vendorId) { toast.error("거래처를 선택해주세요."); return; }
    createEval.mutate({ projectId, ...form, comment: form.comment || undefined });
  };

  const vendorName = (id: number) => vendors.data?.find((v: any) => v.id === id)?.name ?? "거래처";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-xs sm:text-sm flex items-center gap-2"><Landmark className="w-4 h-4" />거래처 평가 <span className="font-normal text-muted-foreground">(100점 만점)</span></CardTitle>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" />거래처 평가</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>거래처 평가 (현장 완료 후)</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>거래처 선택 *</Label>
                  <Select value={form.vendorId ? String(form.vendorId) : ""} onValueChange={v => setForm(f => ({ ...f, vendorId: Number(v) }))}>
                    <SelectTrigger className="h-11 sm:h-9"><SelectValue placeholder="거래처를 선택하세요" /></SelectTrigger>
                    <SelectContent>
                      {vendors.data?.map((v: any) => (
                        <SelectItem key={v.id} value={String(v.id)}>{v.name}{v.category ? ` · ${v.category}` : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  {VENDOR_CRITERIA.map(({ key, label, icon: Icon }) => (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-1.5 text-xs sm:text-sm"><Icon className="w-4 h-4" />{label}</Label>
                        <span className="text-sm font-bold tabular-nums w-10 text-right">{form[key]}<span className="text-muted-foreground font-normal text-xs">/20</span></span>
                      </div>
                      <input type="range" min={0} max={20} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))} className="w-full accent-amber-500" />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                  <span className="text-sm font-medium">총점</span>
                  <span className={`text-2xl font-extrabold tabular-nums ${total >= 80 ? "text-emerald-600" : total >= 60 ? "text-amber-600" : "text-red-600"}`}>{total}<span className="text-sm text-muted-foreground font-normal">/100</span></span>
                </div>

                <div>
                  <Label>의견</Label>
                  <Textarea value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} placeholder="평가 사유·특이사항을 작성해주세요" rows={2} />
                </div>

                <Button onClick={submit} className="w-full h-12 sm:h-9" disabled={createEval.isPending}>
                  {createEval.isPending ? "등록 중..." : "평가 등록"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {evals.isLoading ? (
          <p className="text-center text-muted-foreground py-4">로딩 중...</p>
        ) : !evals.data?.length ? (
          <div className="text-center py-8">
            <Landmark className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground text-sm">아직 거래처 평가가 없습니다.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">현장 완료 후 사용한 거래처를 100점 만점으로 평가해주세요.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {evals.data.map((ev: any) => (
              <div key={ev.id} className="p-3 sm:p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm">{vendorName(ev.vendorId)}</span>
                    {ev.evaluatorName && <span className="text-[11px] text-muted-foreground">평가: {ev.evaluatorName}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-extrabold text-lg tabular-nums ${ev.totalScore >= 80 ? "text-emerald-600" : ev.totalScore >= 60 ? "text-amber-600" : "text-red-600"}`}>{ev.totalScore}<span className="text-xs text-muted-foreground font-normal">/100</span></span>
                    {canDelete && <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => { if (confirm("이 평가를 삭제할까요?")) deleteEval.mutate({ id: ev.id }); }}><Trash2 className="w-3.5 h-3.5" /></Button>}
                  </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                  <div>품질 <span className="font-semibold text-foreground">{ev.quality}</span></div>
                  <div>납기 <span className="font-semibold text-foreground">{ev.schedule}</span></div>
                  <div>소통 <span className="font-semibold text-foreground">{ev.communication}</span></div>
                  <div>가격 <span className="font-semibold text-foreground">{ev.price}</span></div>
                  <div>신뢰 <span className="font-semibold text-foreground">{ev.reliability}</span></div>
                </div>
                {ev.comment && <p className="text-xs sm:text-sm text-muted-foreground">{ev.comment}</p>}
                <p className="text-[10px] sm:text-xs text-muted-foreground">{new Date(ev.createdAt).toLocaleDateString("ko-KR")}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
