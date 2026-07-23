/**
 * 인사이트 콘텐츠 캘린더 (발행 주제 큐 관리) — D-11
 * 목업: _mockups/gogamdo-content-calendar.html
 * 스케줄러가 평일마다 이 큐에서 주제를 꺼내 생성·발행한다(빈 큐면 랜덤 폴백).
 */
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Sparkles, Plus, Trash2, Loader2, ListChecks, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

type Cat = "trend" | "cost_guide" | "case_study" | "tip" | "news";
const CAT_META: Record<Cat, { label: string; cls: string; dot: string }> = {
  trend: { label: "트렌드", cls: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
  cost_guide: { label: "비용가이드", cls: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  case_study: { label: "사례", cls: "bg-green-100 text-green-700", dot: "bg-green-500" },
  tip: { label: "팁", cls: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  news: { label: "뉴스·미디어", cls: "bg-rose-100 text-rose-700", dot: "bg-rose-500" },
};
const STATUS_META: Record<string, { label: string; cls: string }> = {
  planned: { label: "계획", cls: "text-muted-foreground" },
  generating: { label: "생성중", cls: "text-amber-600" },
  published: { label: "발행", cls: "text-green-600" },
  skipped: { label: "건너뜀", cls: "text-muted-foreground line-through" },
};
// 요일 로테이션 기본값 (월~금)
const DOW_CAT: Cat[] = ["cost_guide", "trend", "case_study", "tip", "news"]; // 월화수목금
const DOW_LABEL = ["월", "화", "수", "목", "금"];

function ymd(d: Date) { return d.toISOString().slice(0, 10); }
function mondayOf(d: Date) { const x = new Date(d); const dow = (x.getDay() + 6) % 7; x.setDate(x.getDate() - dow); x.setHours(0, 0, 0, 0); return x; }
const WEEKS = 4;

export default function AdminContentCalendar() {
  const queueQ = trpc.insightQueue.list.useQuery();
  const utils = trpc.useUtils();
  const [dialog, setDialog] = useState<null | { id?: number; scheduledDate: string; category: Cat; title: string; keywords: string; sources: string }>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);

  const create = trpc.insightQueue.create.useMutation({ onSuccess: () => { utils.insightQueue.list.invalidate(); setDialog(null); toast.success("주제가 큐에 추가되었습니다."); }, onError: (e) => toast.error(e.message) });
  const update = trpc.insightQueue.update.useMutation({ onSuccess: () => { utils.insightQueue.list.invalidate(); setDialog(null); toast.success("주제가 수정되었습니다."); }, onError: (e) => toast.error(e.message) });
  const del = trpc.insightQueue.delete.useMutation({ onSuccess: () => { utils.insightQueue.list.invalidate(); toast.success("삭제되었습니다."); }, onError: (e) => toast.error(e.message) });
  const suggest = trpc.insightQueue.suggest.useMutation({ onSuccess: (d) => { setCandidates(d.candidates ?? []); }, onError: (e) => toast.error(e.message) });

  const items = queueQ.data ?? [];
  const byDate = useMemo(() => {
    const m: Record<string, any[]> = {};
    for (const it of items) { (m[it.scheduledDate] ??= []).push(it); }
    return m;
  }, [items]);

  const today = new Date();
  const weeks = useMemo(() => {
    const start = mondayOf(today);
    const out: Date[][] = [];
    for (let w = 0; w < WEEKS; w++) {
      const row: Date[] = [];
      for (let d = 0; d < 5; d++) { const x = new Date(start); x.setDate(start.getDate() + w * 7 + d); row.push(x); }
      out.push(row);
    }
    return out;
  }, [today]);

  // KPI
  const kpi = useMemo(() => {
    const planned = items.filter((i: any) => i.status === "planned");
    const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const publishedThisMonth = items.filter((i: any) => i.status === "published" && String(i.scheduledDate).slice(0, 7) === thisMonth).length;
    const wkStart = ymd(mondayOf(today)); const wkEnd = ymd(new Date(mondayOf(today).getTime() + 4 * 86400000));
    const thisWeek = planned.filter((i: any) => i.scheduledDate >= wkStart && i.scheduledDate <= wkEnd).length;
    const lastPlanned = planned.map((i: any) => i.scheduledDate).sort().pop();
    return { planned: planned.length, thisWeek, publishedThisMonth, lastPlanned };
  }, [items, today]);

  const openAdd = (date: string) => {
    const dow = (new Date(date).getDay() + 6) % 7; // 0=월
    setDialog({ scheduledDate: date, category: DOW_CAT[dow] ?? "trend", title: "", keywords: "", sources: "" });
  };
  const openEdit = (it: any) => setDialog({ id: it.id, scheduledDate: it.scheduledDate, category: it.category, title: it.title, keywords: (it.keywords ?? []).join(", "), sources: it.sources ?? "" });
  const save = () => {
    if (!dialog) return;
    if (!dialog.title.trim()) { toast.error("제목을 입력하세요."); return; }
    const payload = { scheduledDate: dialog.scheduledDate, category: dialog.category, title: dialog.title.trim(), keywords: dialog.keywords.split(",").map((s) => s.trim()).filter(Boolean), sources: dialog.sources || undefined };
    if (dialog.id) update.mutate({ id: dialog.id, ...payload });
    else create.mutate(payload);
  };

  const addCandidate = (c: any, date: string) => {
    create.mutate({ scheduledDate: date, category: (["trend", "cost_guide", "case_study", "tip", "news"].includes(c.category) ? c.category : "trend"), title: c.title, keywords: Array.isArray(c.keywords) ? c.keywords : [], sources: c.sources || undefined });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><CalendarDays className="w-5 h-5" />콘텐츠 캘린더</h1>
          <p className="text-sm text-muted-foreground mt-1">발행 주제 큐 · 스케줄러가 평일마다 다음 주제를 자동 생성·발행합니다.</p>
        </div>
        <Button onClick={() => { setSuggestOpen(true); setCandidates([]); suggest.mutate({ count: 5 }); }} variant="outline">
          <Sparkles className="w-4 h-4 mr-1" />AI 트렌드 주제 추천
        </Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 pb-3"><p className="text-[11px] text-muted-foreground flex items-center gap-1"><ListChecks className="w-3.5 h-3.5" />계획된 주제</p><p className="text-2xl font-bold mt-1">{kpi.planned}<span className="text-sm text-muted-foreground">개</span></p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><p className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5" />이번주 발행 예정</p><p className="text-2xl font-bold mt-1">{kpi.thisWeek}<span className="text-sm text-muted-foreground">건</span></p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><p className="text-[11px] text-muted-foreground flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />발행 완료(이번달)</p><p className="text-2xl font-bold mt-1 text-green-600">{kpi.publishedThisMonth}<span className="text-sm text-muted-foreground">편</span></p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><p className="text-[11px] text-muted-foreground">큐 소진 예상</p><p className="text-lg font-bold mt-1">{kpi.lastPlanned ?? "-"}</p></CardContent></Card>
      </div>

      {/* 캘린더 */}
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">발행 캘린더 (평일)</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {queueQ.isLoading ? (
            <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" /></div>
          ) : (
            <div className="min-w-[640px]">
              <div className="grid grid-cols-5 gap-2 mb-2">
                {DOW_LABEL.map((d, i) => <div key={i} className="text-center text-xs font-medium text-muted-foreground">{d}</div>)}
              </div>
              <div className="space-y-2">
                {weeks.map((row, wi) => (
                  <div key={wi} className="grid grid-cols-5 gap-2">
                    {row.map((date) => {
                      const key = ymd(date);
                      const isToday = key === ymd(today);
                      const cellItems = byDate[key] ?? [];
                      return (
                        <div key={key} className={`border rounded-lg p-1.5 min-h-[92px] ${isToday ? "border-gold bg-gold/5" : "border-border"}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[11px] ${isToday ? "font-bold text-gold-dark" : "text-muted-foreground"}`}>{date.getMonth() + 1}/{date.getDate()}</span>
                            <button onClick={() => openAdd(key)} className="text-muted-foreground/50 hover:text-gold"><Plus className="w-3.5 h-3.5" /></button>
                          </div>
                          <div className="space-y-1">
                            {cellItems.map((it: any) => {
                              const cm = CAT_META[it.category as Cat] ?? CAT_META.trend;
                              const sm = STATUS_META[it.status] ?? STATUS_META.planned;
                              return (
                                <button key={it.id} onClick={() => openEdit(it)} className="w-full text-left rounded px-1.5 py-1 bg-muted/50 hover:bg-muted transition-colors">
                                  <div className="flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cm.dot}`} /><span className="text-[10px] font-medium truncate">{it.title}</span></div>
                                  <div className={`text-[9px] ${sm.cls}`}>{cm.label} · {sm.label}</div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 추가/수정 다이얼로그 */}
      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dialog?.id ? "주제 수정" : "주제 추가"} — {dialog?.scheduledDate}</DialogTitle></DialogHeader>
          {dialog && (
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>발행일</Label><Input type="date" value={dialog.scheduledDate} onChange={(e) => setDialog({ ...dialog, scheduledDate: e.target.value })} /></div>
                <div><Label>카테고리</Label>
                  <Select value={dialog.category} onValueChange={(v) => setDialog({ ...dialog, category: v as Cat })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{(Object.keys(CAT_META) as Cat[]).map((k) => <SelectItem key={k} value={k}>{CAT_META[k].label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>제목/가제 *</Label><Input value={dialog.title} onChange={(e) => setDialog({ ...dialog, title: e.target.value })} placeholder="예: 하이브리드 오피스 좌석 최적화" /></div>
              <div><Label>키워드 <span className="text-[11px] text-muted-foreground">(쉼표 구분)</span></Label><Input value={dialog.keywords} onChange={(e) => setDialog({ ...dialog, keywords: e.target.value })} placeholder="데이터기반설계, 좌석배치, 공간효율" /></div>
              <div><Label>참고자료</Label><Textarea rows={2} value={dialog.sources} onChange={(e) => setDialog({ ...dialog, sources: e.target.value })} placeholder="참고 방향·출처" /></div>
            </div>
          )}
          <DialogFooter className="mt-2 gap-2">
            {dialog?.id && <Button variant="ghost" className="text-red-500 mr-auto" onClick={() => { if (confirm("삭제할까요?")) { del.mutate({ id: dialog.id! }); setDialog(null); } }}><Trash2 className="w-4 h-4 mr-1" />삭제</Button>}
            <Button onClick={save} disabled={create.isPending || update.isPending}>{create.isPending || update.isPending ? "저장 중..." : "저장"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI 추천 다이얼로그 */}
      <Dialog open={suggestOpen} onOpenChange={setSuggestOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="w-4 h-4" />AI 트렌드 주제 추천</DialogTitle></DialogHeader>
          {suggest.isPending ? (
            <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" /><p className="text-sm text-muted-foreground mt-2">트렌드 주제를 생성 중…</p></div>
          ) : candidates.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">추천 결과가 없습니다. 다시 시도해주세요.</p>
          ) : (
            <div className="space-y-2 mt-2">
              {candidates.map((c, i) => {
                const cat = (["trend", "cost_guide", "case_study", "tip", "news"].includes(c.category) ? c.category : "trend") as Cat;
                // 다음 빈 평일에 배치
                const target = ymd(new Date(Date.now() + (i + 1) * 86400000));
                return (
                  <div key={i} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0"><div className="flex items-center gap-1.5"><Badge className={`text-[10px] ${CAT_META[cat].cls} border-0`}>{CAT_META[cat].label}</Badge></div><p className="font-medium text-sm mt-1">{c.title}</p>{Array.isArray(c.keywords) && <p className="text-[11px] text-muted-foreground mt-0.5">{c.keywords.join(", ")}</p>}</div>
                      <Button size="sm" variant="outline" className="flex-shrink-0" onClick={() => addCandidate(c, target)}><Plus className="w-3.5 h-3.5 mr-1" />큐 추가</Button>
                    </div>
                  </div>
                );
              })}
              <Button variant="ghost" className="w-full" onClick={() => suggest.mutate({ count: 5 })}><Sparkles className="w-3.5 h-3.5 mr-1" />다시 추천</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
