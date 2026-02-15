import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useMemo } from "react";
import { useParams, useSearch } from "wouter";
import {
  Building, FileSpreadsheet, ClipboardList, Upload, CheckCircle, Clock, Send,
  Calendar, Star, User, ChevronRight, AlertCircle, BarChart3,
} from "lucide-react";
import { toast } from "sonner";

type TabType = "report" | "estimate" | "schedule" | "history" | "profile";

const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  delayed: "bg-red-100 text-red-700",
};
const STATUS_LABELS: Record<string, string> = {
  not_started: "미착수",
  in_progress: "진행중",
  completed: "완료",
  delayed: "지연",
};

export default function SubPortal() {
  const { subId } = useParams<{ subId: string }>();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token") || subId || "";

  const [activeTab, setActiveTab] = useState<TabType>("report");
  const [reportForm, setReportForm] = useState({
    workDate: new Date().toISOString().split("T")[0],
    description: "",
    workers: "1",
    materials: "",
    issues: "",
  });
  const [estimateForm, setEstimateForm] = useState({
    title: "",
    totalAmount: "",
    description: "",
    fileUrl: "",
  });

  // ===== API Queries =====
  const subInfo = trpc.ops.subPortal.validate.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const quotes = trpc.ops.subPortal.quotes.useQuery(
    { token },
    { enabled: !!token && (activeTab === "history" || activeTab === "estimate") }
  );

  const workReports = trpc.ops.subPortal.workReports.useQuery(
    { token },
    { enabled: !!token && (activeTab === "history" || activeTab === "report") }
  );

  const schedules = trpc.ops.subPortal.schedules.useQuery(
    { token },
    { enabled: !!token && activeTab === "schedule" }
  );

  const profile = trpc.ops.subPortal.profile.useQuery(
    { token },
    { enabled: !!token && activeTab === "profile" }
  );

  // ===== Mutations =====
  const submitReport = trpc.ops.subPortal.submitWorkReport.useMutation({
    onSuccess: () => {
      setReportForm({ workDate: new Date().toISOString().split("T")[0], description: "", workers: "1", materials: "", issues: "" });
      workReports.refetch();
      toast.success("작업 보고가 제출되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  const submitEstimate = trpc.ops.subPortal.submitQuote.useMutation({
    onSuccess: () => {
      setEstimateForm({ title: "", totalAmount: "", description: "", fileUrl: "" });
      quotes.refetch();
      toast.success("견적서가 제출되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  // ===== Loading / Error States =====
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive/50 mb-4" />
            <h2 className="text-lg font-semibold mb-2">잘못된 접근입니다</h2>
            <p className="text-sm text-muted-foreground">유효한 초대 링크를 통해 접속해주세요.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (subInfo.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          인증 확인 중...
        </div>
      </div>
    );
  }

  if (subInfo.error || !subInfo.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-6 text-center">
            <Building className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-semibold mb-2">접근할 수 없습니다</h2>
            <p className="text-sm text-muted-foreground">
              유효하지 않은 링크이거나 만료된 초대입니다.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { project, subcontractor: sub } = subInfo.data;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "report", label: "작업 보고", icon: <ClipboardList className="w-4 h-4" /> },
    { id: "estimate", label: "견적 제출", icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: "schedule", label: "일정 확인", icon: <Calendar className="w-4 h-4" /> },
    { id: "history", label: "제출 이력", icon: <Clock className="w-4 h-4" /> },
    { id: "profile", label: "업체 정보", icon: <User className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold truncate">{sub?.companyName ?? "업체"}</h1>
              <p className="text-sm text-muted-foreground truncate">{project?.name ?? "프로젝트"} · 하도급 업체 포털</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation - 수평 스크롤 */}
      <div className="border-b bg-card/50">
        <div className="container">
          <div className="flex overflow-x-auto no-scrollbar -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="container py-4 sm:py-6 max-w-3xl">
        {/* ===== 작업 보고 탭 ===== */}
        {activeTab === "report" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />일일 작업 보고
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>작업일 *</Label>
                <Input
                  type="date"
                  value={reportForm.workDate}
                  onChange={e => setReportForm(f => ({ ...f, workDate: e.target.value }))}
                  className="h-11"
                />
              </div>
              <div>
                <Label>작업 내용 *</Label>
                <Textarea
                  value={reportForm.description}
                  onChange={e => setReportForm(f => ({ ...f, description: e.target.value }))}
                  placeholder={"금일 수행한 작업 내용을 상세히 기재해주세요.\n\n예:\n- 1층 로비 바닥 타일 시공 완료 (50㎡)\n- 2층 사무실 천장 석고보드 설치 (30%)"}
                  rows={6}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>투입 인원 (명)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={reportForm.workers}
                    onChange={e => setReportForm(f => ({ ...f, workers: e.target.value }))}
                    className="h-11"
                  />
                </div>
                <div>
                  <Label>사용 자재</Label>
                  <Input
                    value={reportForm.materials}
                    onChange={e => setReportForm(f => ({ ...f, materials: e.target.value }))}
                    placeholder="타일 200장, 시멘트 5포"
                    className="h-11"
                  />
                </div>
              </div>
              <div>
                <Label>특이사항 / 이슈</Label>
                <Textarea
                  value={reportForm.issues}
                  onChange={e => setReportForm(f => ({ ...f, issues: e.target.value }))}
                  placeholder="안전 이슈, 자재 부족, 일정 지연 사유 등"
                  rows={3}
                />
              </div>
              <Button
                onClick={() => {
                  if (!reportForm.description) {
                    toast.error("작업 내용을 입력해주세요.");
                    return;
                  }
                  submitReport.mutate({
                    token,
                    reportDate: reportForm.workDate,
                    workDescription: reportForm.description,
                    workersCount: parseInt(reportForm.workers) || 1,
                    materialsUsed: reportForm.materials || undefined,
                    issues: reportForm.issues || undefined,
                  });
                }}
                className="w-full h-11"
                disabled={submitReport.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {submitReport.isPending ? "제출 중..." : "작업 보고 제출"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ===== 견적 제출 탭 ===== */}
        {activeTab === "estimate" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />견적서 제출
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>견적서 제목 *</Label>
                <Input
                  value={estimateForm.title}
                  onChange={e => setEstimateForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="예: 바닥 타일 시공 견적서"
                  className="h-11"
                />
              </div>
              <div>
                <Label>총 견적금액 (원) *</Label>
                <Input
                  value={estimateForm.totalAmount}
                  onChange={e => setEstimateForm(f => ({ ...f, totalAmount: e.target.value }))}
                  placeholder="10000000"
                  className="h-11"
                />
              </div>
              <div>
                <Label>견적 상세</Label>
                <Textarea
                  value={estimateForm.description}
                  onChange={e => setEstimateForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="견적 항목별 상세 내역을 기재해주세요."
                  rows={4}
                />
              </div>
              <Button
                onClick={() => {
                  if (!estimateForm.title || !estimateForm.totalAmount) {
                    toast.error("제목과 금액은 필수입니다.");
                    return;
                  }
                  submitEstimate.mutate({
                    token,
                    title: estimateForm.title,
                    totalAmount: estimateForm.totalAmount,
                    notes: estimateForm.description || undefined,
                    fileUrl: estimateForm.fileUrl || undefined,
                  });
                }}
                className="w-full h-11"
                disabled={submitEstimate.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {submitEstimate.isPending ? "제출 중..." : "견적서 제출"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ===== 일정 확인 탭 ===== */}
        {activeTab === "schedule" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5" />프로젝트 일정
              </h2>
            </div>
            {schedules.isLoading ? (
              <div className="text-center py-8 text-muted-foreground">일정 로딩 중...</div>
            ) : !schedules.data?.length ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  등록된 일정이 없습니다.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {schedules.data.map((item: any) => {
                  const statusColor = STATUS_COLORS[item.status] ?? "bg-gray-100 text-gray-700";
                  const statusLabel = STATUS_LABELS[item.status] ?? item.status;
                  return (
                    <Card key={item.id}>
                      <CardContent className="py-3 sm:py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-sm truncate">{item.taskName}</h3>
                              <Badge variant="outline" className={`text-[10px] ${statusColor} border-0`}>
                                {statusLabel}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              {item.startDate && <span>시작: {new Date(item.startDate).toLocaleDateString("ko-KR")}</span>}
                              {item.endDate && <span>종료: {new Date(item.endDate).toLocaleDateString("ko-KR")}</span>}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-lg font-bold text-primary">{item.progress ?? 0}%</div>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${Math.min(item.progress ?? 0, 100)}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== 제출 이력 탭 ===== */}
        {activeTab === "history" && (
          <div className="space-y-6">
            {/* 작업보고 이력 */}
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
                <ClipboardList className="w-5 h-5" />작업보고 이력
              </h2>
              {workReports.isLoading ? (
                <div className="text-center py-4 text-muted-foreground">로딩 중...</div>
              ) : !workReports.data?.length ? (
                <Card>
                  <CardContent className="py-6 text-center text-muted-foreground text-sm">
                    제출된 작업보고가 없습니다.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {(workReports.data as any[]).slice(0, 10).map((r: any) => (
                    <Card key={r.id}>
                      <CardContent className="py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{r.workDescription?.slice(0, 60) ?? "작업보고"}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {r.reportDate} · 투입 {r.workersCount ?? 1}명
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px] flex-shrink-0">
                            {r.status === "approved" ? "승인" : r.status === "rejected" ? "반려" : "검토중"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* 견적서 이력 */}
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
                <FileSpreadsheet className="w-5 h-5" />견적서 이력
              </h2>
              {quotes.isLoading ? (
                <div className="text-center py-4 text-muted-foreground">로딩 중...</div>
              ) : !quotes.data?.length ? (
                <Card>
                  <CardContent className="py-6 text-center text-muted-foreground text-sm">
                    제출된 견적서가 없습니다.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {(quotes.data as any[]).slice(0, 10).map((q: any) => (
                    <Card key={q.id}>
                      <CardContent className="py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{q.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {q.totalAmount ? `${Number(q.totalAmount).toLocaleString()}원` : "-"}
                              {q.createdAt && ` · ${new Date(q.createdAt).toLocaleDateString("ko-KR")}`}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px] flex-shrink-0">
                            {q.status === "accepted" ? "채택" : q.status === "rejected" ? "미채택" : "검토중"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== 업체 정보 탭 ===== */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            {profile.isLoading ? (
              <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
            ) : !profile.data ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  업체 정보를 불러올 수 없습니다.
                </CardContent>
              </Card>
            ) : (
              <>
                {/* 기본 정보 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="w-5 h-5" />업체 기본 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">회사명</span>
                        <p className="font-medium">{profile.data.subcontractor?.companyName ?? "-"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">대표자</span>
                        <p className="font-medium">{profile.data.subcontractor?.representativeName ?? "-"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">전문분야</span>
                        <p className="font-medium">{profile.data.subcontractor?.specialty ?? "-"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">담당자</span>
                        <p className="font-medium">{profile.data.subcontractor?.contactName ?? "-"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">연락처</span>
                        <p className="font-medium">{profile.data.subcontractor?.contactPhone ?? "-"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">이메일</span>
                        <p className="font-medium">{profile.data.subcontractor?.contactEmail ?? "-"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 평가 요약 */}
                {profile.data.summary && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Star className="w-5 h-5" />평가 요약
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">
                            {Number(profile.data.summary.avgOverall ?? 0).toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground">종합 평점</div>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star
                              key={s}
                              className={`w-5 h-5 ${
                                s <= Math.round(Number(profile.data.summary?.avgOverall ?? 0))
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground/20"
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ({profile.data.summary.totalCount ?? 0}건 평가)
                        </div>
                      </div>

                      {/* 항목별 점수 */}
                      <div className="space-y-2">
                        {[
                          { label: "품질", key: "avgQuality" },
                          { label: "일정", key: "avgSchedule" },
                          { label: "안전", key: "avgSafety" },
                          { label: "협업", key: "avgCommunication" },
                          { label: "정리", key: "avgCleanup" },
                        ].map(item => {
                          const val = Number((profile.data.summary as any)?.[item.key] ?? 0);
                          return (
                            <div key={item.key} className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground w-10">{item.label}</span>
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${(val / 5) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium w-8 text-right">{val.toFixed(1)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 평가 이력 */}
                {profile.data.evaluations && profile.data.evaluations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />평가 이력
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(profile.data.evaluations as any[]).map((ev: any) => (
                          <div key={ev.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">
                                종합 {Number(ev.overallScore ?? 0).toFixed(1)}점
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {ev.createdAt ? new Date(ev.createdAt).toLocaleDateString("ko-KR") : "-"}
                              </span>
                            </div>
                            {ev.comments && (
                              <p className="text-xs text-muted-foreground mt-1">{ev.comments}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
