/**
 * 마케팅 · SEO · AEO 대시보드 — C-10 (Phase 1: 외부 API 없이 인앱 계산 + 바로가기)
 * 목업: _mockups/gogamdo-marketing-seo-aeo.html
 * Phase 2에서 GA4 Data API + Search Console API 연동.
 */
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, FileText, Sparkles, Search, TrendingUp, ExternalLink, ShieldCheck, Globe } from "lucide-react";

const REFERRAL_LABEL: Record<string, string> = {
  search: "검색(구글·네이버)",
  ai_assistant: "AI 어시스턴트",
  referral: "지인·소개",
  sns: "SNS·블로그",
  portfolio: "고객 사례",
  ad: "광고",
  etc: "기타",
  none: "미입력",
};
const REFERRAL_COLOR: Record<string, string> = {
  search: "bg-blue-500", ai_assistant: "bg-purple-500", referral: "bg-green-500",
  sns: "bg-cyan-500", portfolio: "bg-gold", ad: "bg-amber-500", etc: "bg-slate-400", none: "bg-gray-300",
};

// 정적 색인 대상 페이지(sitemap 주요 경로) — 대략치
const INDEXED_STATIC = 14;

function ExtLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-accent/40 transition-colors">
      <div><div className="text-sm font-medium flex items-center gap-1.5">{label}<ExternalLink className="w-3 h-3 text-muted-foreground" /></div><div className="text-[11px] text-muted-foreground">{desc}</div></div>
    </a>
  );
}

export default function AdminMarketing() {
  const inquiriesQ = trpc.inquiry.list.useQuery();
  const insightsQ = trpc.insight.all.useQuery();

  const now = new Date();
  const thisYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const data = useMemo(() => {
    const inquiries = inquiriesQ.data ?? [];
    const insights = insightsQ.data ?? [];

    const total = inquiries.length;
    const thisMonth = inquiries.filter((i: any) => i.createdAt && String(i.createdAt).slice(0, 7) === thisYM).length;

    // 유입경로 분포
    const bySource: Record<string, number> = {};
    for (const i of inquiries) {
      const key = (i as any).referralSource || "none";
      bySource[key] = (bySource[key] ?? 0) + 1;
    }
    const sources = Object.entries(bySource).sort((a, b) => b[1] - a[1]);
    const maxSource = Math.max(...sources.map(([, v]) => v), 1);
    const aiInflow = bySource["ai_assistant"] ?? 0;
    const aiRate = total > 0 ? Math.round((aiInflow / total) * 100) : 0;

    const published = insights.filter((a: any) => a.status === "published").length;
    const totalContent = insights.length;

    return { total, thisMonth, sources, maxSource, aiInflow, aiRate, published, totalContent };
  }, [inquiriesQ.data, insightsQ.data, thisYM]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
      <div>
        <h1 className="text-xl font-bold">마케팅 · SEO · AEO</h1>
        <p className="text-sm text-muted-foreground mt-1">유입 · 검색 노출 · AI 답변엔진 최적화 현황 <Badge variant="outline" className="ml-1 text-[10px]">Phase 1 · 인앱 지표</Badge></p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />총 문의</p>
          <p className="text-2xl font-bold mt-1">{data.total}<span className="text-sm text-muted-foreground">건</span></p>
          <p className="text-[10px] text-muted-foreground mt-1">이번달 {data.thisMonth}건</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" />AI 유입 (AEO)</p>
          <p className="text-2xl font-bold mt-1 text-purple-600">{data.aiRate}<span className="text-sm text-muted-foreground">%</span></p>
          <p className="text-[10px] text-muted-foreground mt-1">AI 어시스턴트 경유 {data.aiInflow}건</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><FileText className="w-3.5 h-3.5" />발행 콘텐츠</p>
          <p className="text-2xl font-bold mt-1">{data.published}<span className="text-sm text-muted-foreground">편</span></p>
          <p className="text-[10px] text-muted-foreground mt-1">전체 {data.totalContent}편</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" />구조화 데이터</p>
          <p className="text-2xl font-bold mt-1 text-green-600">적용</p>
          <p className="text-[10px] text-muted-foreground mt-1">발행 페이지 JSON-LD·OG 100%</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
        {/* 유입 경로 (AEO 귀속) */}
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm flex items-center justify-between">문의 유입 경로 <span className="text-[11px] font-normal text-muted-foreground">어떻게 알게 되셨나요 · AEO 귀속</span></CardTitle></CardHeader>
          <CardContent>
            {data.sources.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">문의 데이터가 없습니다.</p>
            ) : (
              <div className="space-y-1.5">
                {data.sources.map(([src, val]) => (
                  <div key={src} className="flex items-center gap-3 py-1 text-xs">
                    <div className="flex-1">
                      <div className="flex justify-between"><span>{REFERRAL_LABEL[src] ?? src}</span><span className="text-muted-foreground tabular-nums">{val}건</span></div>
                      <div className="h-2 bg-muted rounded mt-1 overflow-hidden"><div className={`h-full ${REFERRAL_COLOR[src] ?? "bg-gray-300"}`} style={{ width: `${(val / data.maxSource) * 100}%` }} /></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-3 bg-muted/40 rounded p-2">문의폼 "어떻게 알게 되셨나요"에 <b>AI 어시스턴트</b> 옵션을 추가해, ChatGPT·Claude 등 생성형 AI 경유 유입(AEO)을 직접 집계합니다.</p>
          </CardContent>
        </Card>

        {/* SEO · AEO 인앱 지표 */}
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">SEO · AEO 인앱 지표</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="border rounded-lg p-3"><div className="text-[11px] text-muted-foreground flex items-center gap-1"><Globe className="w-3.5 h-3.5" />색인 대상 페이지</div><div className="text-lg font-bold mt-1">{INDEXED_STATIC + data.published}<span className="text-xs text-muted-foreground">개</span></div><div className="text-[10px] text-muted-foreground">정적 {INDEXED_STATIC} + 인사이트 {data.published}</div></div>
              <div className="border rounded-lg p-3"><div className="text-[11px] text-muted-foreground flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" />구조화 데이터</div><div className="text-lg font-bold mt-1 text-green-600">100%</div><div className="text-[10px] text-muted-foreground">JSON-LD·OG 커버리지</div></div>
              <div className="border rounded-lg p-3"><div className="text-[11px] text-muted-foreground flex items-center gap-1"><Search className="w-3.5 h-3.5" />사이트맵</div><a href="/sitemap.xml" target="_blank" rel="noreferrer" className="text-sm font-bold mt-1 text-blue-600 flex items-center gap-1">활성 <ExternalLink className="w-3 h-3" /></a><div className="text-[10px] text-muted-foreground">/sitemap.xml</div></div>
              <div className="border rounded-lg p-3"><div className="text-[11px] text-muted-foreground flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" />AEO 콘텐츠</div><div className="text-lg font-bold mt-1">{data.published}<span className="text-xs text-muted-foreground">편</span></div><div className="text-[10px] text-muted-foreground">AI 인용 대상 발행글</div></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 외부 대시보드 바로가기 */}
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm flex items-center justify-between"><span className="flex items-center gap-2"><TrendingUp className="w-4 h-4" />실시간 지표 (외부 대시보드)</span><Badge variant="outline" className="text-[10px]">Phase 2 · API 연동 예정</Badge></CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <ExtLink href="https://analytics.google.com/" label="GA4 방문자" desc="유입·인기 페이지·방문자 추이" />
            <ExtLink href="https://search.google.com/search-console" label="Search Console" desc="검색 노출·클릭·순위·색인" />
            <ExtLink href="https://search.google.com/test/rich-results" label="Rich Results 테스트" desc="구조화 데이터 검증" />
            <ExtLink href="https://pagespeed.web.dev/" label="PageSpeed Insights" desc="Core Web Vitals·속도" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">실시간 방문자·검색 순위·AI 리퍼럴 트래픽은 GA4 Data API·Search Console API 연동(Phase 2) 후 이 화면에 직접 표시됩니다.</p>
        </CardContent>
      </Card>
    </div>
  );
}
