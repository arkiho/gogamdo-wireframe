import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, LogOut, Plus, Search, Users, TrendingUp, DollarSign, Phone,
  Mail, Building2, Calendar, ChevronRight, MessageSquare, FileText,
  Video, MapPin, Edit, Trash2, BarChart3, Activity, Clock, User,
  ShieldCheck, Send, CheckCircle, AlertCircle, Filter,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

// Stage configuration
const STAGES = [
  { value: "lead", label: "리드", color: "bg-slate-100 text-slate-700" },
  { value: "consultation", label: "상담", color: "bg-blue-100 text-blue-700" },
  { value: "proposal", label: "제안", color: "bg-indigo-100 text-indigo-700" },
  { value: "negotiation", label: "협상", color: "bg-purple-100 text-purple-700" },
  { value: "contract", label: "계약", color: "bg-amber-100 text-amber-700" },
  { value: "design", label: "설계", color: "bg-cyan-100 text-cyan-700" },
  { value: "construction", label: "시공", color: "bg-orange-100 text-orange-700" },
  { value: "completed", label: "완료", color: "bg-green-100 text-green-700" },
  { value: "lost", label: "실패", color: "bg-red-100 text-red-700" },
] as const;

const INTERACTION_TYPES = [
  { value: "phone_call", label: "전화", icon: <Phone className="w-3.5 h-3.5" /> },
  { value: "email", label: "이메일", icon: <Mail className="w-3.5 h-3.5" /> },
  { value: "meeting", label: "미팅", icon: <Users className="w-3.5 h-3.5" /> },
  { value: "site_visit", label: "현장방문", icon: <MapPin className="w-3.5 h-3.5" /> },
  { value: "video_call", label: "화상회의", icon: <Video className="w-3.5 h-3.5" /> },
  { value: "kakao", label: "카카오톡", icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { value: "note", label: "메모", icon: <FileText className="w-3.5 h-3.5" /> },
] as const;

const SOURCE_LABELS: Record<string, string> = {
  website: "웹사이트", referral: "소개", cold_call: "콜드콜",
  exhibition: "전시회", sns: "SNS", other: "기타",
};

const SPACE_LABELS: Record<string, string> = {
  office: "사무실", commercial: "상업공간", medical: "의료",
  education: "교육", residential: "주거", other: "기타",
};

function formatDate(d: any) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

function formatCurrency(v: number | null | undefined) {
  if (!v) return "-";
  if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억`;
  if (v >= 10000) return `${(v / 10000).toFixed(0)}만`;
  return v.toLocaleString() + "원";
}

type CrmView = "dashboard" | "clients" | "deals" | "client-detail" | "portal-members";

export default function AdminCRM() {
  const { user, logout } = useAuth();
  const [view, setView] = useState<CrmView>("dashboard");
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Data queries
  const stats = trpc.crm.stats.useQuery();
  const clients = trpc.crm.listClients.useQuery();
  const deals = trpc.crm.listDeals.useQuery();
  const activities = trpc.crm.listActivities.useQuery();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <span className="flex items-center gap-2 text-sm text-muted-foreground hover:text-ink transition-colors">
                <ArrowLeft className="w-4 h-4" />
                관리자
              </span>
            </Link>
            <div className="h-5 w-px bg-border" />
            <Logo className="w-24 h-6" color="#111" />
            <span className="text-xs font-medium tracking-widest uppercase text-gold">CRM</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user.name || user.email}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="flex gap-1 mb-8 bg-white rounded-lg p-1 border border-border/50 w-fit">
          {[
            { id: "dashboard" as CrmView, label: "대시보드", icon: <BarChart3 className="w-4 h-4" /> },
            { id: "clients" as CrmView, label: "고객", icon: <Users className="w-4 h-4" /> },
            { id: "deals" as CrmView, label: "딜 파이프라인", icon: <TrendingUp className="w-4 h-4" /> },
            { id: "portal-members" as CrmView, label: "포털 회원", icon: <ShieldCheck className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setView(tab.id); setSelectedClientId(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                view === tab.id ? "bg-ink text-white" : "text-muted-foreground hover:text-ink hover:bg-paper-warm"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard View */}
        {view === "dashboard" && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" /> 총 고객
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-heading font-bold text-ink">{stats.data?.totalClients || 0}</div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> 진행 중 딜
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-heading font-bold text-ink">{stats.data?.activeDeals || 0}</div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> 파이프라인 금액
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-heading font-bold text-gold">{formatCurrency(stats.data?.totalDealValue)}</div>
                </CardContent>
              </Card>
              <Card className="border-border/50 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
                    수주 완료
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-heading font-bold text-green-600">{stats.data?.wonDeals || 0}</div>
                </CardContent>
              </Card>
              <Card className="border-border/50 border-red-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-500 flex items-center gap-2">
                    실패
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-heading font-bold text-red-500">{stats.data?.lostDeals || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-heading">최근 활동</CardTitle>
              </CardHeader>
              <CardContent>
                {!activities.data?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-8">아직 활동 기록이 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {activities.data.slice(0, 10).map((act: any) => (
                      <div key={act.id} className="flex items-start gap-3 p-3 rounded-lg bg-paper-warm">
                        <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Activity className="w-4 h-4 text-gold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink">{act.title}</p>
                          {act.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{act.description}</p>}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(act.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Clients View */}
        {view === "clients" && !selectedClientId && (
          <ClientsListView
            clients={clients.data || []}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelectClient={(id) => { setSelectedClientId(id); setView("client-detail"); }}
          />
        )}

        {/* Client Detail View */}
        {view === "client-detail" && selectedClientId && (
          <ClientDetailView
            clientId={selectedClientId}
            onBack={() => { setView("clients"); setSelectedClientId(null); }}
          />
        )}

        {/* Portal Members View */}
        {view === "portal-members" && (
          <PortalMembersView />
        )}

        {/* Deals Pipeline View */}
        {view === "deals" && (
          <DealsPipelineView
            deals={deals.data || []}
            clients={clients.data || []}
          />
        )}
      </div>
    </div>
  );
}

// ========== Clients List ==========
function ClientsListView({ clients, searchQuery, setSearchQuery, onSelectClient }: {
  clients: any[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSelectClient: (id: number) => void;
}) {
  const utils = trpc.useUtils();
  const createClient = trpc.crm.createClient.useMutation({
    onSuccess: () => utils.crm.listClients.invalidate(),
  });
  const deleteClient = trpc.crm.deleteClient.useMutation({
    onSuccess: () => utils.crm.listClients.invalidate(),
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    companyName: "", contactName: "", contactTitle: "", email: "", phone: "",
    industry: "", source: "website" as const,
  });

  const filtered = useMemo(() => {
    if (!searchQuery) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter((c: any) =>
      c.companyName?.toLowerCase().includes(q) ||
      c.contactName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  }, [clients, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-ink">고객 관리</h2>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="bg-gold text-ink hover:bg-gold/90">
              <Plus className="w-4 h-4 mr-2" /> 고객 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>새 고객 등록</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="회사명 *" value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} />
                <Input placeholder="담당자명 *" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="직함" value={form.contactTitle} onChange={e => setForm(f => ({ ...f, contactTitle: e.target.value }))} />
                <Input placeholder="이메일" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="전화번호" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                <Input placeholder="업종" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} />
              </div>
              <Select value={form.source} onValueChange={(v: any) => setForm(f => ({ ...f, source: v }))}>
                <SelectTrigger><SelectValue placeholder="유입경로" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">취소</Button></DialogClose>
              <Button
                className="bg-gold text-ink hover:bg-gold/90"
                disabled={!form.companyName || !form.contactName || createClient.isPending}
                onClick={async () => {
                  await createClient.mutateAsync(form);
                  setShowForm(false);
                  setForm({ companyName: "", contactName: "", contactTitle: "", email: "", phone: "", industry: "", source: "website" });
                }}
              >
                {createClient.isPending ? "등록 중..." : "등록"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="회사명, 담당자, 이메일로 검색..."
          className="pl-10"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            {searchQuery ? "검색 결과가 없습니다." : "등록된 고객이 없습니다. 새 고객을 추가해보세요."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((client: any) => (
            <Card key={client.id} className="border-border/50 hover:border-gold/30 transition-colors cursor-pointer" onClick={() => onSelectClient(client.id)}>
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="font-medium text-ink">{client.companyName}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {client.contactName}</span>
                      {client.industry && <span>· {client.industry}</span>}
                      {client.source && <Badge variant="secondary" className="text-[10px]">{SOURCE_LABELS[client.source] || client.source}</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{formatDate(client.createdAt)}</span>
                  <Button
                    variant="ghost" size="sm"
                    onClick={(e) => { e.stopPropagation(); if (confirm("이 고객을 삭제하시겠습니까?")) deleteClient.mutate({ id: client.id }); }}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ========== Client Detail ==========
function ClientDetailView({ clientId, onBack }: { clientId: number; onBack: () => void }) {
  const client = trpc.crm.getClient.useQuery({ id: clientId });
  const interactions = trpc.crm.listInteractions.useQuery({ clientId });
  const clientDeals = trpc.crm.listDeals.useQuery({ clientId });
  const clientActivities = trpc.crm.listActivities.useQuery({ clientId });
  const utils = trpc.useUtils();

  const createInteraction = trpc.crm.createInteraction.useMutation({
    onSuccess: () => {
      utils.crm.listInteractions.invalidate({ clientId });
      utils.crm.listActivities.invalidate({ clientId });
    },
  });

  const createDeal = trpc.crm.createDeal.useMutation({
    onSuccess: () => {
      utils.crm.listDeals.invalidate({ clientId });
      utils.crm.listActivities.invalidate({ clientId });
      utils.crm.stats.invalidate();
    },
  });

  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [interactionForm, setInteractionForm] = useState({
    type: "phone_call" as const, subject: "", content: "", outcome: "",
  });

  const [showDealForm, setShowDealForm] = useState(false);
  const [dealForm, setDealForm] = useState({
    title: "", estimatedValue: "", area: "", spaceType: "office" as const, description: "",
  });

  if (client.isLoading) return <div className="text-center py-12 text-muted-foreground">로딩 중...</div>;
  if (!client.data) return <div className="text-center py-12 text-muted-foreground">고객을 찾을 수 없습니다.</div>;

  const c = client.data;

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> 목록으로
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Client Info */}
        <div className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gold" />
                {c.companyName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /> {c.contactName} {c.contactTitle && `(${c.contactTitle})`}</div>
              {c.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /> {c.email}</div>}
              {c.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> {c.phone}</div>}
              {c.industry && <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground" /> {c.industry}</div>}
              {c.source && <Badge variant="secondary">{SOURCE_LABELS[c.source] || c.source}</Badge>}
              {c.notes && <p className="text-muted-foreground mt-2 border-t pt-2">{c.notes}</p>}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-2">
            <Dialog open={showInteractionForm} onOpenChange={setShowInteractionForm}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="w-4 h-4 mr-2" /> 상담 기록 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>상담 기록 추가</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Select value={interactionForm.type} onValueChange={(v: any) => setInteractionForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INTERACTION_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input placeholder="제목 *" value={interactionForm.subject} onChange={e => setInteractionForm(f => ({ ...f, subject: e.target.value }))} />
                  <Textarea placeholder="내용" rows={3} value={interactionForm.content} onChange={e => setInteractionForm(f => ({ ...f, content: e.target.value }))} />
                  <Input placeholder="결과/후속조치" value={interactionForm.outcome} onChange={e => setInteractionForm(f => ({ ...f, outcome: e.target.value }))} />
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">취소</Button></DialogClose>
                  <Button
                    className="bg-gold text-ink hover:bg-gold/90"
                    disabled={!interactionForm.subject || createInteraction.isPending}
                    onClick={async () => {
                      await createInteraction.mutateAsync({ clientId, ...interactionForm });
                      setShowInteractionForm(false);
                      setInteractionForm({ type: "phone_call", subject: "", content: "", outcome: "" });
                    }}
                  >
                    {createInteraction.isPending ? "저장 중..." : "저장"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showDealForm} onOpenChange={setShowDealForm}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" /> 새 딜 생성
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>새 딜 생성</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="딜 제목 *" value={dealForm.title} onChange={e => setDealForm(f => ({ ...f, title: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="예상 금액 (원)" type="number" value={dealForm.estimatedValue} onChange={e => setDealForm(f => ({ ...f, estimatedValue: e.target.value }))} />
                    <Input placeholder="면적 (㎡)" value={dealForm.area} onChange={e => setDealForm(f => ({ ...f, area: e.target.value }))} />
                  </div>
                  <Select value={dealForm.spaceType} onValueChange={(v: any) => setDealForm(f => ({ ...f, spaceType: v }))}>
                    <SelectTrigger><SelectValue placeholder="공간 유형" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(SPACE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea placeholder="설명" rows={2} value={dealForm.description} onChange={e => setDealForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">취소</Button></DialogClose>
                  <Button
                    className="bg-gold text-ink hover:bg-gold/90"
                    disabled={!dealForm.title || createDeal.isPending}
                    onClick={async () => {
                      await createDeal.mutateAsync({
                        clientId,
                        title: dealForm.title,
                        estimatedValue: dealForm.estimatedValue ? parseInt(dealForm.estimatedValue) : undefined,
                        area: dealForm.area || undefined,
                        spaceType: dealForm.spaceType,
                        description: dealForm.description || undefined,
                      });
                      setShowDealForm(false);
                      setDealForm({ title: "", estimatedValue: "", area: "", spaceType: "office", description: "" });
                    }}
                  >
                    {createDeal.isPending ? "생성 중..." : "생성"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Center: Deals + Interactions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deals */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gold" /> 딜 ({clientDeals.data?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!clientDeals.data?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">진행 중인 딜이 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {clientDeals.data.map((deal: any) => {
                    const stage = STAGES.find(s => s.value === deal.stage);
                    return (
                      <div key={deal.id} className="p-4 rounded-lg bg-paper-warm border border-border/30">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-ink">{deal.title}</h4>
                          <Badge className={stage?.color || ""}>{stage?.label || deal.stage}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {deal.estimatedValue && <span className="font-medium text-gold">{formatCurrency(deal.estimatedValue)}</span>}
                          {deal.area && <span>{deal.area}</span>}
                          {deal.spaceType && <span>{SPACE_LABELS[deal.spaceType] || deal.spaceType}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interactions */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gold" /> 상담 이력 ({interactions.data?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!interactions.data?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">상담 기록이 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {interactions.data.map((int: any) => {
                    const typeInfo = INTERACTION_TYPES.find(t => t.value === int.type);
                    return (
                      <div key={int.id} className="p-4 rounded-lg bg-paper-warm border border-border/30">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {typeInfo?.icon}
                            <span className="text-xs font-medium text-muted-foreground">{typeInfo?.label || int.type}</span>
                            <span className="font-medium text-ink">{int.subject}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDate(int.createdAt)}</span>
                        </div>
                        {int.content && <p className="text-sm text-muted-foreground mt-1">{int.content}</p>}
                        {int.outcome && <p className="text-xs text-gold mt-1">결과: {int.outcome}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Clock className="w-5 h-5 text-gold" /> 활동 타임라인
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!clientActivities.data?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">활동 기록이 없습니다.</p>
              ) : (
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
                  {clientActivities.data.map((act: any) => (
                    <div key={act.id} className="relative">
                      <div className="absolute -left-4 top-1 w-4 h-4 rounded-full bg-gold/20 border-2 border-gold" />
                      <div className="ml-2">
                        <p className="text-sm font-medium text-ink">{act.title}</p>
                        {act.description && <p className="text-xs text-muted-foreground mt-0.5">{act.description}</p>}
                        <span className="text-xs text-muted-foreground">{formatDate(act.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ========== Deals Pipeline (Kanban) ==========
function DealsPipelineView({ deals, clients }: { deals: any[]; clients: any[] }) {
  const utils = trpc.useUtils();
  const updateDeal = trpc.crm.updateDeal.useMutation({
    onSuccess: () => {
      utils.crm.listDeals.invalidate();
      utils.crm.stats.invalidate();
      utils.crm.listActivities.invalidate();
    },
  });

  const clientMap = useMemo(() => {
    const map: Record<number, string> = {};
    clients.forEach((c: any) => { map[c.id] = c.companyName; });
    return map;
  }, [clients]);

  // Pipeline stages (exclude completed and lost for kanban)
  const pipelineStages = STAGES.filter(s => s.value !== "completed" && s.value !== "lost");

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-bold text-ink">딜 파이프라인</h2>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {pipelineStages.map(stage => {
          const stageDeals = deals.filter((d: any) => d.stage === stage.value);
          return (
            <div key={stage.value} className="flex-shrink-0 w-64">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={stage.color}>{stage.label}</Badge>
                  <span className="text-xs text-muted-foreground">{stageDeals.length}</span>
                </div>
              </div>
              <div className="space-y-2 min-h-[200px] bg-paper-warm/50 rounded-lg p-2">
                {stageDeals.map((deal: any) => (
                  <Card key={deal.id} className="border-border/50 bg-white cursor-pointer hover:border-gold/30 transition-colors">
                    <CardContent className="p-3">
                      <p className="font-medium text-sm text-ink mb-1 line-clamp-1">{deal.title}</p>
                      <p className="text-xs text-muted-foreground mb-2">{clientMap[deal.clientId] || "미지정"}</p>
                      <div className="flex items-center justify-between">
                        {deal.estimatedValue ? (
                          <span className="text-xs font-medium text-gold">{formatCurrency(deal.estimatedValue)}</span>
                        ) : <span />}
                        {deal.spaceType && (
                          <span className="text-[10px] text-muted-foreground">{SPACE_LABELS[deal.spaceType]}</span>
                        )}
                      </div>
                      {/* Stage navigation */}
                      <div className="flex gap-1 mt-2 pt-2 border-t border-border/30">
                        {stage.value !== "lead" && (
                          <Button
                            variant="ghost" size="sm" className="text-[10px] h-6 px-2"
                            onClick={() => {
                              const idx = pipelineStages.findIndex(s => s.value === stage.value);
                              if (idx > 0) updateDeal.mutate({ id: deal.id, stage: pipelineStages[idx - 1].value as any });
                            }}
                          >
                            ← 이전
                          </Button>
                        )}
                        <div className="flex-1" />
                        {stage.value !== "construction" && (
                          <Button
                            variant="ghost" size="sm" className="text-[10px] h-6 px-2"
                            onClick={() => {
                              const idx = pipelineStages.findIndex(s => s.value === stage.value);
                              if (idx < pipelineStages.length - 1) updateDeal.mutate({ id: deal.id, stage: pipelineStages[idx + 1].value as any });
                            }}
                          >
                            다음 →
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {stageDeals.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground">비어 있음</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completed & Lost */}
      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">수주 완료</CardTitle>
          </CardHeader>
          <CardContent>
            {deals.filter((d: any) => d.stage === "completed").length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">없음</p>
            ) : (
              <div className="space-y-2">
                {deals.filter((d: any) => d.stage === "completed").map((deal: any) => (
                  <div key={deal.id} className="flex items-center justify-between p-2 rounded bg-green-50">
                    <div>
                      <p className="text-sm font-medium">{deal.title}</p>
                      <p className="text-xs text-muted-foreground">{clientMap[deal.clientId]}</p>
                    </div>
                    {deal.actualValue && <span className="text-sm font-medium text-green-600">{formatCurrency(deal.actualValue)}</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-500">실패</CardTitle>
          </CardHeader>
          <CardContent>
            {deals.filter((d: any) => d.stage === "lost").length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">없음</p>
            ) : (
              <div className="space-y-2">
                {deals.filter((d: any) => d.stage === "lost").map((deal: any) => (
                  <div key={deal.id} className="flex items-center justify-between p-2 rounded bg-red-50">
                    <div>
                      <p className="text-sm font-medium">{deal.title}</p>
                      <p className="text-xs text-muted-foreground">{clientMap[deal.clientId]}</p>
                    </div>
                    {deal.lostReason && <span className="text-xs text-red-400">{deal.lostReason}</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ========== Portal Members (고객 포털 회원 관리) ==========
function PortalMembersView() {
  const utils = trpc.useUtils();
  const members = trpc.clientManagement.list.useQuery();
  const manualVerify = trpc.clientManagement.manualVerify.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.clientManagement.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  const resendVerification = trpc.clientManagement.resendVerification.useMutation({
    onSuccess: (data) => toast.success(data.message),
    onError: (err) => toast.error(err.message),
  });
  const bulkResend = trpc.clientManagement.bulkResendVerification.useMutation({
    onSuccess: (data) => toast.success(data.message),
    onError: (err) => toast.error(err.message),
  });
  const updateStatus = trpc.clientManagement.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("상태가 변경되었습니다.");
      utils.clientManagement.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterVerified, setFilterVerified] = useState<"all" | "verified" | "unverified">("all");

  const memberList = members.data || [];

  const filtered = useMemo(() => {
    let list = memberList;
    if (filterVerified === "verified") list = list.filter((m: any) => m.emailVerified === "yes");
    if (filterVerified === "unverified") list = list.filter((m: any) => m.emailVerified !== "yes");
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((m: any) =>
        m.name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.company?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [memberList, filterVerified, searchQuery]);

  const totalCount = memberList.length;
  const verifiedCount = memberList.filter((m: any) => m.emailVerified === "yes").length;
  const unverifiedCount = totalCount - verifiedCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-ink">고객 포털 회원 관리</h2>
          <p className="text-sm text-muted-foreground mt-1">고객 포털에 가입한 회원의 이메일 인증 상태를 관리합니다.</p>
        </div>
        {unverifiedCount > 0 && (
          <Button
            className="bg-gold text-ink hover:bg-gold/90"
            disabled={bulkResend.isPending}
            onClick={() => {
              if (confirm(`미인증 회원 ${unverifiedCount}명에게 인증 메일을 일괄 발송하시겠습니까?`)) {
                bulkResend.mutate();
              }
            }}
          >
            <Send className="w-4 h-4 mr-2" />
            {bulkResend.isPending ? "발송 중..." : `미인증 ${unverifiedCount}명 일괄 발송`}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-heading font-bold text-ink">{totalCount}</div>
              <div className="text-xs text-muted-foreground">전체 회원</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-heading font-bold text-green-600">{verifiedCount}</div>
              <div className="text-xs text-muted-foreground">인증 완료</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-heading font-bold text-amber-600">{unverifiedCount}</div>
              <div className="text-xs text-muted-foreground">미인증</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="이름, 이메일, 회사명으로 검색..."
            className="pl-10"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1 bg-white rounded-lg p-1 border border-border/50">
          {[
            { id: "all" as const, label: "전체" },
            { id: "verified" as const, label: "인증" },
            { id: "unverified" as const, label: "미인증" },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterVerified(f.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filterVerified === f.id ? "bg-ink text-white" : "text-muted-foreground hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      {members.isLoading ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            로딩 중...
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            {searchQuery || filterVerified !== "all" ? "검색 결과가 없습니다." : "등록된 포털 회원이 없습니다."}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-paper-warm/50">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">회원</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">이메일</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">회사</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">인증 상태</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">계정 상태</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">가입일</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">작업</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((member: any) => {
                  const isVerified = member.emailVerified === "yes";
                  return (
                    <tr key={member.id} className="border-b last:border-0 hover:bg-paper-warm/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-gold" />
                          </div>
                          <span className="font-medium text-ink">{member.name || "-"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{member.email}</td>
                      <td className="py-3 px-4 text-muted-foreground">{member.company || "-"}</td>
                      <td className="py-3 px-4 text-center">
                        {isVerified ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" /> 인증됨
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700">
                            <AlertCircle className="w-3 h-3 mr-1" /> 미인증
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Select
                          value={member.status || "pending"}
                          onValueChange={(v: any) => updateStatus.mutate({ id: member.id, status: v })}
                        >
                          <SelectTrigger className="h-7 text-xs w-24 mx-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">활성</SelectItem>
                            <SelectItem value="pending">대기</SelectItem>
                            <SelectItem value="suspended">정지</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {formatDate(member.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!isVerified && (
                            <>
                              <Button
                                variant="ghost" size="sm"
                                className="h-7 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                                disabled={manualVerify.isPending}
                                onClick={() => {
                                  if (confirm(`${member.name || member.email}의 이메일을 수동 인증하시겠습니까?`)) {
                                    manualVerify.mutate({ clientId: member.id });
                                  }
                                }}
                                title="수동 인증"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost" size="sm"
                                className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                disabled={resendVerification.isPending}
                                onClick={() => resendVerification.mutate({ clientId: member.id })}
                                title="인증 메일 재발송"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
