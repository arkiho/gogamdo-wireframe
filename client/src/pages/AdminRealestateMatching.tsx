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
  Building2, MapPin, Search, LayoutGrid, ArrowRight, Plus, Eye, RefreshCw,
  Ruler, Users, Zap, CheckCircle2
} from "lucide-react";

export default function AdminRealestateMatching() {
  const { user } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [showCreateSearch, setShowCreateSearch] = useState(false);
  const [searchForm, setSearchForm] = useState({
    clientProjectId: 0,
    relocationType: "relocation" as "relocation" | "renovation",
    minArea: 0, maxArea: 0, preferredDistricts: "",
    maxRent: 0, maxDeposit: 0, additionalRequirements: "",
  });

  const searchCriteria = trpc.realestate.getSearchCriteria.useQuery(
    { clientProjectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );
  const matches = trpc.realestate.getMatches.useQuery(
    { clientProjectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );
  const diagrams = trpc.realestate.getDiagrams.useQuery(
    { clientProjectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );

  const createSearch = trpc.realestate.setSearchCriteria.useMutation({
    onSuccess: () => { searchCriteria.refetch(); setShowCreateSearch(false); toast.success("검색 조건이 등록되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const runMatching = trpc.realestate.searchMatches.useMutation({
    onSuccess: () => { matches.refetch(); toast.success("매물 매칭이 완료되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const generateDiagram = trpc.realestate.generateDiagram.useMutation({
    onSuccess: () => { diagrams.refetch(); toast.success("프로그램 다이어그램이 생성되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground font-heading">부동산 매칭</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">이사 예정 고객을 위한 매물 탐색 + 프로그램 다이어그램 자동 생성</p>
        </div>
        <Dialog open={showCreateSearch} onOpenChange={setShowCreateSearch}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />검색 조건 등록</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>부동산 검색 조건 등록</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <Input placeholder="프로젝트 ID" type="number" onChange={e => setSearchForm(f => ({ ...f, clientProjectId: parseInt(e.target.value) || 0 }))} />
              <Select value={searchForm.relocationType} onValueChange={v => setSearchForm(f => ({ ...f, relocationType: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="relocation">이사 (신규 공간)</SelectItem>
                  <SelectItem value="renovation">레노베이션 (현재 공간)</SelectItem>
                </SelectContent>
              </Select>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="최소 면적 (㎡)" type="number" onChange={e => setSearchForm(f => ({ ...f, minArea: parseInt(e.target.value) || 0 }))} />
                <Input placeholder="최대 면적 (㎡)" type="number" onChange={e => setSearchForm(f => ({ ...f, maxArea: parseInt(e.target.value) || 0 }))} />
              </div>
              <Input placeholder="선호 지역 (강남구, 서초구, ...)" onChange={e => setSearchForm(f => ({ ...f, preferredDistricts: e.target.value }))} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="최대 임대료 (만원/평)" type="number" onChange={e => setSearchForm(f => ({ ...f, maxRent: parseInt(e.target.value) || 0 }))} />
                <Input placeholder="최대 보증금 (만원)" type="number" onChange={e => setSearchForm(f => ({ ...f, maxDeposit: parseInt(e.target.value) || 0 }))} />
              </div>
              <Textarea placeholder="추가 요구사항 (주차, 층수, 엘리베이터 등)" onChange={e => setSearchForm(f => ({ ...f, additionalRequirements: e.target.value }))} />
              <Button className="w-full" onClick={() => createSearch.mutate(searchForm)} disabled={createSearch.isPending}>
                {createSearch.isPending ? "등록 중..." : "등록"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 프로젝트 선택 */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <Input
              placeholder="프로젝트 ID 입력"
              type="number"
              className="max-w-xs"
              onChange={e => setSelectedProjectId(parseInt(e.target.value) || null)}
            />
            <Button variant="outline" onClick={() => { searchCriteria.refetch(); matches.refetch(); diagrams.refetch(); }}>
              <Search className="w-4 h-4 mr-1" />조회
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedProjectId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 검색 조건 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Search className="w-5 h-5" />검색 조건</CardTitle>
            </CardHeader>
            <CardContent>
              {searchCriteria.data ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">유형</span>
                    <Badge>{searchCriteria.data.projectType === "relocation" ? "이사" : "레노베이션"}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">면적</span>
                    <span>{searchCriteria.data.minArea}~{searchCriteria.data.maxArea} ㎡</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">선호 지역</span>
                    <span>{searchCriteria.data.desiredLocation || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">예산</span>
                    <span>{searchCriteria.data.budgetMax ? Number(searchCriteria.data.budgetMax).toLocaleString() : "-"} 만원</span>
                  </div>
                  <Button className="w-full mt-4 gap-2" onClick={() => runMatching.mutate({ clientProjectId: selectedProjectId! })} disabled={runMatching.isPending}>
                    <Zap className="w-4 h-4" />{runMatching.isPending ? "매칭 중..." : "AI 매물 매칭 실행"}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">등록된 검색 조건이 없습니다.</p>
              )}
            </CardContent>
          </Card>

          {/* 매칭 결과 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Building2 className="w-5 h-5" />매칭 매물</CardTitle>
            </CardHeader>
            <CardContent>
              {matches.data?.length ? (
                <div className="space-y-3">
                  {matches.data.map((m: any) => (
                    <div key={m.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-sm">{m.propertyName || `매물 #${m.id}`}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3 inline mr-1" />{m.address || "주소 미정"}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="text-xs"><Ruler className="w-3 h-3 mr-1" />{m.area || 0}㎡</Badge>
                            <Badge variant="outline" className="text-xs">{m.monthlyRent?.toLocaleString() || 0}만원/월</Badge>
                          </div>
                        </div>
                        <Badge className={m.matchScore >= 80 ? "bg-green-500" : m.matchScore >= 60 ? "bg-amber-500" : "bg-red-500"}>
                          {m.matchScore || 0}점
                        </Badge>
                      </div>
                      <Button
                        size="sm" variant="outline" className="w-full mt-3 gap-1"
                        onClick={() => generateDiagram.mutate({ clientProjectId: selectedProjectId!, matchId: m.id, spaceNeeds: '{}' })}
                        disabled={generateDiagram.isPending}
                      >
                        <LayoutGrid className="w-3 h-3" />프로그램 다이어그램 생성
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">매칭된 매물이 없습니다. 매칭을 실행해 주세요.</p>
              )}
            </CardContent>
          </Card>

          {/* 프로그램 다이어그램 */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><LayoutGrid className="w-5 h-5" />프로그램 다이어그램</CardTitle>
              <CardDescription>매물 평면 위에 공간 프로그램을 자동 배치한 결과입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              {diagrams.data?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {diagrams.data.map((d: any) => (
                    <div key={d.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm">{d.diagramName || `다이어그램 #${d.id}`}</h4>
                        <Badge variant="secondary">{d.status}</Badge>
                      </div>
                      {d.diagramData && (
                        <div className="bg-muted/50 rounded p-3 text-xs font-mono max-h-40 overflow-auto">
                          {typeof d.diagramData === "string" ? d.diagramData : JSON.stringify(d.diagramData, null, 2)}
                        </div>
                      )}
                      <div className="flex gap-2 mt-3 text-xs text-muted-foreground">
                        <span><Users className="w-3 h-3 inline mr-1" />수용 인원: {d.totalCapacity || "-"}명</span>
                        <span><Ruler className="w-3 h-3 inline mr-1" />총 면적: {d.totalArea || "-"}㎡</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">생성된 다이어그램이 없습니다.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
