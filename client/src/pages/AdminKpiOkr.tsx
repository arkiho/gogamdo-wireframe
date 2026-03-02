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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  BarChart3, Target, Plus, TrendingUp, Users, Award, Brain,
  Briefcase, CheckCircle2, ArrowLeft
} from "lucide-react";
import { useLocation } from "wouter";

export default function AdminKpiOkr() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("kpi-defs");
  const [showCreateKpi, setShowCreateKpi] = useState(false);
  const [showRecordKpi, setShowRecordKpi] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [kpiForm, setKpiForm] = useState({
    name: "", description: "", category: "project" as const,
    unit: "", targetValue: 0, weight: 1,
    measurementPeriod: "quarterly" as const, department: "",
  });
  const [recordForm, setRecordForm] = useState({
    kpiDefinitionId: 0, userId: 0,
    period: `${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`,
    actualValue: 0, notes: "",
  });

  const kpiDefs = trpc.employee.getKpiDefinitions.useQuery(
    { department: selectedDepartment || undefined },
    { enabled: !!user }
  );

  const createKpiDef = trpc.employee.createKpiDefinition.useMutation({
    onSuccess: () => { kpiDefs.refetch(); setShowCreateKpi(false); toast.success("KPI가 등록되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const recordKpi = trpc.employee.recordKpi.useMutation({
    onSuccess: () => { toast.success("KPI 실적이 기록되었습니다."); setShowRecordKpi(false); },
    onError: (e) => toast.error(e.message),
  });

  const categoryLabels: Record<string, string> = {
    sales: "영업", project: "프로젝트", quality: "품질",
    efficiency: "효율", customer: "고객", growth: "성장",
  };

  const periodLabels: Record<string, string> = {
    monthly: "월간", quarterly: "분기", yearly: "연간",
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground font-heading">KPI / OKR 관리</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">전사 KPI 정의 및 직원별 실적 관리</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="kpi-defs" className="gap-1"><BarChart3 className="w-4 h-4" />KPI 정의</TabsTrigger>
          <TabsTrigger value="kpi-records" className="gap-1"><TrendingUp className="w-4 h-4" />실적 기록</TabsTrigger>
          <TabsTrigger value="okr-overview" className="gap-1"><Target className="w-4 h-4" />OKR 현황</TabsTrigger>
        </TabsList>

        {/* KPI 정의 */}
        <TabsContent value="kpi-defs" className="space-y-4">
          <div className="flex items-center justify-between">
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-48"><SelectValue placeholder="전체 부서" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 부서</SelectItem>
                <SelectItem value="design">설계팀</SelectItem>
                <SelectItem value="construction">시공팀</SelectItem>
                <SelectItem value="sales">영업팀</SelectItem>
                <SelectItem value="management">경영지원</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={showCreateKpi} onOpenChange={setShowCreateKpi}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" />KPI 등록</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>KPI 정의 등록</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input placeholder="KPI 이름 (예: 프로젝트 수주율)" value={kpiForm.name} onChange={e => setKpiForm(f => ({ ...f, name: e.target.value }))} />
                  <Textarea placeholder="설명" value={kpiForm.description} onChange={e => setKpiForm(f => ({ ...f, description: e.target.value }))} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select value={kpiForm.category} onValueChange={v => setKpiForm(f => ({ ...f, category: v as any }))}>
                      <SelectTrigger><SelectValue placeholder="카테고리" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={kpiForm.measurementPeriod} onValueChange={v => setKpiForm(f => ({ ...f, measurementPeriod: v as any }))}>
                      <SelectTrigger><SelectValue placeholder="측정 주기" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(periodLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input placeholder="단위 (건, %, 원)" value={kpiForm.unit} onChange={e => setKpiForm(f => ({ ...f, unit: e.target.value }))} />
                    <Input placeholder="목표값" type="number" value={kpiForm.targetValue || ""} onChange={e => setKpiForm(f => ({ ...f, targetValue: parseInt(e.target.value) || 0 }))} />
                    <Input placeholder="가중치" type="number" value={kpiForm.weight || ""} onChange={e => setKpiForm(f => ({ ...f, weight: parseFloat(e.target.value) || 1 }))} />
                  </div>
                  <Input placeholder="부서" value={kpiForm.department} onChange={e => setKpiForm(f => ({ ...f, department: e.target.value }))} />
                  <Button className="w-full" onClick={() => createKpiDef.mutate(kpiForm)} disabled={createKpiDef.isPending}>
                    {createKpiDef.isPending ? "등록 중..." : "KPI 등록"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {kpiDefs.data?.length ? (
            <div className="space-y-3">
              {kpiDefs.data.map((kpi: any) => (
                <Card key={kpi.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-sm sm:text-base">{kpi.name}</h4>
                          <Badge variant="outline" className="text-xs">{categoryLabels[kpi.category] || kpi.category}</Badge>
                          <Badge variant="secondary" className="text-xs">{periodLabels[kpi.measurementPeriod] || kpi.measurementPeriod}</Badge>
                        </div>
                        {kpi.description && <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>}
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold">{kpi.targetValue}</span>
                        <span className="text-xs text-muted-foreground ml-1">{kpi.unit}</span>
                        <p className="text-xs text-muted-foreground">가중치: {kpi.weight}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="pt-8 pb-8 text-center text-muted-foreground text-sm">등록된 KPI가 없습니다.</CardContent></Card>
          )}
        </TabsContent>

        {/* KPI 실적 기록 */}
        <TabsContent value="kpi-records" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showRecordKpi} onOpenChange={setShowRecordKpi}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" />실적 기록</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>KPI 실적 기록</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <Select onValueChange={v => setRecordForm(f => ({ ...f, kpiDefinitionId: parseInt(v) }))}>
                    <SelectTrigger><SelectValue placeholder="KPI 선택" /></SelectTrigger>
                    <SelectContent>
                      {kpiDefs.data?.map((kpi: any) => (
                        <SelectItem key={kpi.id} value={String(kpi.id)}>{kpi.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input placeholder="직원 ID" type="number" onChange={e => setRecordForm(f => ({ ...f, userId: parseInt(e.target.value) || 0 }))} />
                  <Input placeholder="기간 (예: 2026-Q1)" value={recordForm.period} onChange={e => setRecordForm(f => ({ ...f, period: e.target.value }))} />
                  <Input placeholder="실적값" type="number" onChange={e => setRecordForm(f => ({ ...f, actualValue: parseInt(e.target.value) || 0 }))} />
                  <Textarea placeholder="비고" onChange={e => setRecordForm(f => ({ ...f, notes: e.target.value }))} />
                  <Button className="w-full" onClick={() => recordKpi.mutate(recordForm)} disabled={recordKpi.isPending}>
                    {recordKpi.isPending ? "기록 중..." : "실적 기록"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">KPI 실적 현황</CardTitle>
              <CardDescription>직원별 KPI 달성률을 확인하고 실적을 기록합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              {kpiDefs.data?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">KPI</th>
                        <th className="text-left py-2 px-3">카테고리</th>
                        <th className="text-right py-2 px-3">목표</th>
                        <th className="text-right py-2 px-3">주기</th>
                        <th className="text-right py-2 px-3">가중치</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kpiDefs.data.map((kpi: any) => (
                        <tr key={kpi.id} className="border-b hover:bg-muted/30">
                          <td className="py-2 px-3 font-medium">{kpi.name}</td>
                          <td className="py-2 px-3"><Badge variant="outline" className="text-xs">{categoryLabels[kpi.category] || kpi.category}</Badge></td>
                          <td className="py-2 px-3 text-right">{kpi.targetValue} {kpi.unit}</td>
                          <td className="py-2 px-3 text-right">{periodLabels[kpi.measurementPeriod] || kpi.measurementPeriod}</td>
                          <td className="py-2 px-3 text-right">{kpi.weight}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">KPI를 먼저 등록해주세요.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* OKR 현황 */}
        <TabsContent value="okr-overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Target className="w-5 h-5" />전사 OKR 현황</CardTitle>
              <CardDescription>전사/부서/개인 OKR 진행 상황을 한눈에 확인합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {["company", "department", "individual"].map(level => (
                  <div key={level}>
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                      {level === "company" ? <Briefcase className="w-4 h-4" /> : level === "department" ? <Users className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                      {level === "company" ? "회사 목표" : level === "department" ? "부서 목표" : "개인 목표"}
                    </h4>
                    <div className="pl-6 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        직원 대시보드에서 등록된 OKR이 여기에 집계됩니다.
                        관리자는 각 직원의 OKR 진행률을 모니터링할 수 있습니다.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
