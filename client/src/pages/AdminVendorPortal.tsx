import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Package, Upload, TrendingUp, TrendingDown, BarChart3, FileText,
  Plus, Brain, AlertTriangle, CheckCircle2, DollarSign
} from "lucide-react";

export default function AdminVendorPortal() {
  const { user } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [showUploadQuote, setShowUploadQuote] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    projectId: 0, vendorName: "", vendorContact: "", category: "furniture",
    totalAmount: 0, notes: "", items: [] as Array<{ materialName: string; materialCode: string; unit: string; quantity: number; unitPrice: number; }>,
  });
  const [newItem, setNewItem] = useState({ materialName: "", materialCode: "", unit: "EA", quantity: 0, unitPrice: 0 });

  const quotes = trpc.vendor.getQuotesByProject.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );
  const analytics = trpc.vendor.getMaterialAnalytics.useQuery(undefined, { enabled: !!user });

  const createQuote = trpc.vendor.submitQuote.useMutation({
    onSuccess: () => { quotes.refetch(); setShowUploadQuote(false); toast.success("견적이 등록되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const analyzeQuote = trpc.vendor.analyzePriceTrends.useMutation({
    onSuccess: () => { quotes.refetch(); analytics.refetch(); toast.success("AI 원가 분석이 완료되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const addItem = () => {
    if (!newItem.materialName || !newItem.unitPrice) return;
    setQuoteForm(f => ({
      ...f,
      items: [...f.items, { ...newItem }],
      totalAmount: f.totalAmount + (newItem.quantity * newItem.unitPrice),
    }));
    setNewItem({ materialName: "", materialCode: "", unit: "EA", quantity: 0, unitPrice: 0 });
  };

  const categoryLabels: Record<string, string> = {
    furniture: "가구", flooring: "바닥재", lighting: "조명", partition: "파티션",
    electrical: "전기", plumbing: "설비", painting: "도장", hvac: "공조",
    fire_safety: "소방", other: "기타",
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">납품사 견적 관리</h1>
          <p className="text-muted-foreground mt-1">견적 등록 → AI 파싱 → 원가 변동률 추적 → 자동 학습</p>
        </div>
        <Dialog open={showUploadQuote} onOpenChange={setShowUploadQuote}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />견적 등록</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>납품사 견적 등록</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="프로젝트 ID" type="number" onChange={e => setQuoteForm(f => ({ ...f, projectId: parseInt(e.target.value) || 0 }))} />
                <Input placeholder="납품사명" onChange={e => setQuoteForm(f => ({ ...f, vendorName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="담당자 연락처" onChange={e => setQuoteForm(f => ({ ...f, vendorContact: e.target.value }))} />
                <Select value={quoteForm.category} onValueChange={v => setQuoteForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 항목 추가 */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-sm">견적 항목</h4>
                <div className="grid grid-cols-5 gap-2">
                  <Input placeholder="자재명" value={newItem.materialName} onChange={e => setNewItem(i => ({ ...i, materialName: e.target.value }))} />
                  <Input placeholder="자재코드" value={newItem.materialCode} onChange={e => setNewItem(i => ({ ...i, materialCode: e.target.value }))} />
                  <Input placeholder="수량" type="number" value={newItem.quantity || ""} onChange={e => setNewItem(i => ({ ...i, quantity: parseInt(e.target.value) || 0 }))} />
                  <Input placeholder="단가" type="number" value={newItem.unitPrice || ""} onChange={e => setNewItem(i => ({ ...i, unitPrice: parseInt(e.target.value) || 0 }))} />
                  <Button variant="outline" onClick={addItem}><Plus className="w-4 h-4" /></Button>
                </div>
                {quoteForm.items.length > 0 && (
                  <div className="space-y-1">
                    {quoteForm.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                        <span>{item.materialName} ({item.materialCode})</span>
                        <span>{item.quantity} x {item.unitPrice.toLocaleString()} = {(item.quantity * item.unitPrice).toLocaleString()}원</span>
                      </div>
                    ))}
                    <div className="text-right font-semibold text-sm pt-2">
                      합계: {quoteForm.totalAmount.toLocaleString()}원
                    </div>
                  </div>
                )}
              </div>

              <Textarea placeholder="비고" onChange={e => setQuoteForm(f => ({ ...f, notes: e.target.value }))} />
              <Button className="w-full" onClick={() => createQuote.mutate(quoteForm)} disabled={createQuote.isPending}>
                {createQuote.isPending ? "등록 중..." : "견적 등록"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 원가 분석 대시보드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.data?.length || 0}</p>
                <p className="text-xs text-muted-foreground">학습된 자재 품목</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">
                  {analytics.data?.filter((a: any) => a.priceChangeRate > 5).length || 0}
                </p>
                <p className="text-xs text-muted-foreground">단가 상승 품목 (5%↑)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {analytics.data?.filter((a: any) => a.priceChangeRate < -5).length || 0}
                </p>
                <p className="text-xs text-muted-foreground">단가 하락 품목 (5%↓)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 프로젝트별 견적 조회 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">프로젝트별 견적 조회</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <Input
              placeholder="프로젝트 ID"
              type="number"
              className="max-w-xs"
              onChange={e => setSelectedProjectId(parseInt(e.target.value) || null)}
            />
          </div>
          {quotes.data?.length ? (
            <div className="space-y-3">
              {quotes.data.map((q: any) => (
                <div key={q.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{q.vendorName}</h4>
                      <Badge variant="outline">{categoryLabels[q.category] || q.category}</Badge>
                      <Badge variant={q.status === "approved" ? "default" : q.status === "rejected" ? "destructive" : "secondary"}>
                        {q.status === "submitted" ? "제출됨" : q.status === "reviewed" ? "검토중" : q.status === "approved" ? "승인" : q.status === "rejected" ? "반려" : q.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      <DollarSign className="w-3 h-3 inline" /> {q.totalAmount?.toLocaleString() || 0}원
                      {q.aiParsedData && <Badge variant="outline" className="ml-2 text-xs"><Brain className="w-3 h-3 mr-1" />AI 분석 완료</Badge>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm" variant="outline" className="gap-1"
                      onClick={() => analyzeQuote.mutate({ quoteId: q.id })}
                      disabled={analyzeQuote.isPending}
                    >
                      <Brain className="w-3 h-3" />AI 분석
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : selectedProjectId ? (
            <p className="text-sm text-muted-foreground text-center py-4">등록된 견적이 없습니다.</p>
          ) : null}
        </CardContent>
      </Card>

      {/* 원가 변동률 추적 */}
      {analytics.data?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5" />원가 변동률 추적</CardTitle>
            <CardDescription>AI가 학습한 자재별 단가 변동 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">자재코드</th>
                    <th className="text-left py-2 px-3">자재명</th>
                    <th className="text-right py-2 px-3">평균 단가</th>
                    <th className="text-right py-2 px-3">최저</th>
                    <th className="text-right py-2 px-3">최고</th>
                    <th className="text-right py-2 px-3">변동률</th>
                    <th className="text-right py-2 px-3">샘플 수</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.data.map((a: any) => (
                    <tr key={a.id} className="border-b hover:bg-muted/30">
                      <td className="py-2 px-3 font-mono text-xs">{a.materialCode}</td>
                      <td className="py-2 px-3">{a.materialName}</td>
                      <td className="py-2 px-3 text-right">{a.avgPrice?.toLocaleString()}원</td>
                      <td className="py-2 px-3 text-right text-green-600">{a.minPrice?.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-red-600">{a.maxPrice?.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right">
                        <span className={a.priceChangeRate > 0 ? "text-red-500" : a.priceChangeRate < 0 ? "text-green-500" : ""}>
                          {a.priceChangeRate > 0 ? "+" : ""}{a.priceChangeRate?.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">{a.sampleCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
