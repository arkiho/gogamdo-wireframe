import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  BarChart3, Users, FileText, Eye, Mail, TrendingUp, Search,
  ArrowUpRight, Clock, CheckCircle2, AlertCircle, Loader2,
  Building2, ChevronDown, ChevronUp, ExternalLink, Copy
} from "lucide-react";

const STEP_LABELS: Record<string, string> = {
  survey_started: "설문 시작",
  survey_completed: "설문 완료",
  floor_plan_uploaded: "도면 업로드",
  ai_generating: "AI 분석 중",
  report_ready: "보고서 완료",
  interview_in_progress: "인터뷰 진행 중",
  completed: "완료",
};

const STEP_COLORS: Record<string, string> = {
  survey_started: "bg-gray-100 text-gray-700",
  survey_completed: "bg-blue-100 text-blue-700",
  floor_plan_uploaded: "bg-indigo-100 text-indigo-700",
  ai_generating: "bg-yellow-100 text-yellow-700",
  report_ready: "bg-green-100 text-green-700",
  interview_in_progress: "bg-purple-100 text-purple-700",
  completed: "bg-emerald-100 text-emerald-700",
};

export default function AdminJourneyAnalytics() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStep, setFilterStep] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  const journeys = trpc.workspaceJourney.listAll.useQuery(undefined, {
    enabled: !!user,
  });

  // 통계 계산
  const stats = useMemo(() => {
    const data = journeys.data || [];
    const total = data.length;
    const surveyCompleted = data.filter((j: any) => j.currentStep !== "survey_started").length;
    const floorPlanUploaded = data.filter((j: any) => j.floorPlanUrl).length;
    const reportReady = data.filter((j: any) => ["report_ready", "interview_in_progress", "completed"].includes(j.currentStep)).length;
    const reportViewed = data.filter((j: any) => j.reportViewedAt).length;
    const interviewStarted = data.filter((j: any) => j.interviewResponses && Object.keys(j.interviewResponses).length > 0).length;
    const registered = data.filter((j: any) => j.registeredAt).length;

    return {
      total,
      surveyCompleted,
      floorPlanUploaded,
      reportReady,
      reportViewed,
      interviewStarted,
      registered,
      surveyRate: total > 0 ? Math.round((surveyCompleted / total) * 100) : 0,
      floorPlanRate: surveyCompleted > 0 ? Math.round((floorPlanUploaded / surveyCompleted) * 100) : 0,
      reportViewRate: reportReady > 0 ? Math.round((reportViewed / reportReady) * 100) : 0,
      conversionRate: total > 0 ? Math.round((registered / total) * 100) : 0,
    };
  }, [journeys.data]);

  // 필터링 및 정렬
  const filteredJourneys = useMemo(() => {
    let data = journeys.data || [];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter((j: any) =>
        (j.companyName || "").toLowerCase().includes(q) ||
        (j.contactName || "").toLowerCase().includes(q) ||
        (j.contactEmail || "").toLowerCase().includes(q)
      );
    }
    if (filterStep !== "all") {
      data = data.filter((j: any) => j.currentStep === filterStep);
    }
    data = [...data].sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });
    return data;
  }, [journeys.data, searchQuery, filterStep, sortBy]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("클립보드에 복사되었습니다");
  };

  if (journeys.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">고객 여정 분석</h1>
        <p className="text-muted-foreground mt-1">업무환경 진단 설문 → 보고서 → 전환까지의 전체 퍼널을 분석합니다</p>
      </div>

      {/* 퍼널 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="border-l-4 border-l-gray-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-muted-foreground">총 유입</span>
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">설문 완료</span>
            </div>
            <div className="text-2xl font-bold">{stats.surveyCompleted}</div>
            <div className="text-xs text-muted-foreground">{stats.surveyRate}%</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-indigo-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-indigo-500" />
              <span className="text-xs text-muted-foreground">도면 업로드</span>
            </div>
            <div className="text-2xl font-bold">{stats.floorPlanUploaded}</div>
            <div className="text-xs text-muted-foreground">{stats.floorPlanRate}%</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">보고서 생성</span>
            </div>
            <div className="text-2xl font-bold">{stats.reportReady}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">보고서 열람</span>
            </div>
            <div className="text-2xl font-bold">{stats.reportViewed}</div>
            <div className="text-xs text-muted-foreground">{stats.reportViewRate}%</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">인터뷰 진행</span>
            </div>
            <div className="text-2xl font-bold">{stats.interviewStarted}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">회원 전환</span>
            </div>
            <div className="text-2xl font-bold">{stats.registered}</div>
            <div className="text-xs text-muted-foreground">{stats.conversionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* 전환율 퍼널 시각화 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            전환 퍼널
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: "설문 시작", count: stats.total, color: "bg-gray-400" },
              { label: "설문 완료", count: stats.surveyCompleted, color: "bg-blue-500" },
              { label: "도면 업로드", count: stats.floorPlanUploaded, color: "bg-indigo-500" },
              { label: "보고서 생성", count: stats.reportReady, color: "bg-green-500" },
              { label: "보고서 열람", count: stats.reportViewed, color: "bg-amber-500" },
              { label: "인터뷰 진행", count: stats.interviewStarted, color: "bg-purple-500" },
              { label: "회원 전환", count: stats.registered, color: "bg-emerald-500" },
            ].map((step, i) => {
              const maxCount = stats.total || 1;
              const width = Math.max((step.count / maxCount) * 100, 2);
              const dropoff = i > 0 && stats.total > 0
                ? Math.round(((stats.total - step.count) / stats.total) * 100)
                : 0;
              return (
                <div key={step.label} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-muted-foreground text-right shrink-0">{step.label}</div>
                  <div className="flex-1 h-8 bg-muted/30 relative overflow-hidden">
                    <div
                      className={`h-full ${step.color} transition-all duration-500`}
                      style={{ width: `${width}%` }}
                    />
                    <span className="absolute inset-0 flex items-center px-3 text-xs font-medium">
                      {step.count}명
                      {i > 0 && dropoff > 0 && (
                        <span className="ml-2 text-red-500/70">(-{dropoff}%)</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 필터 및 검색 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="회사명, 담당자명, 이메일 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStep} onValueChange={setFilterStep}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="단계 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 단계</SelectItem>
            {Object.entries(STEP_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as "newest" | "oldest")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">최신순</SelectItem>
            <SelectItem value="oldest">오래된순</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 여정 목록 */}
      <div className="space-y-2">
        {filteredJourneys.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || filterStep !== "all" ? "검색 결과가 없습니다" : "아직 고객 여정 데이터가 없습니다"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredJourneys.map((journey: any) => {
            const isExpanded = expandedId === journey.id;
            return (
              <Card key={journey.id} className="overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : journey.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-muted flex items-center justify-center text-sm font-bold">
                        {(journey.companyName || "?")[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{journey.companyName || "미입력"}</div>
                        <div className="text-xs text-muted-foreground">
                          {journey.contactName || "미입력"} · {journey.contactEmail || "이메일 없음"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={STEP_COLORS[journey.currentStep] || "bg-gray-100 text-gray-700"}>
                        {STEP_LABELS[journey.currentStep] || journey.currentStep}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {new Date(journey.createdAt).toLocaleDateString("ko-KR")}
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t px-4 pb-4 pt-3 bg-muted/10 space-y-4">
                    {/* 기본 정보 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">직원 수</span>
                        <div className="font-medium">{journey.employeeCount || "-"}명</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">사무실 면적</span>
                        <div className="font-medium">{journey.officeSizePyeong || "-"}평</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">업무 스타일</span>
                        <div className="font-medium">{journey.workStyle || "-"}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">예산</span>
                        <div className="font-medium">{journey.budgetRange || "-"}</div>
                      </div>
                    </div>

                    {/* 불편사항 */}
                    {journey.painPoints && Array.isArray(journey.painPoints) && journey.painPoints.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground">불편사항</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {journey.painPoints.map((p: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 타임라인 */}
                    <div>
                      <span className="text-xs text-muted-foreground">타임라인</span>
                      <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> 생성: {new Date(journey.createdAt).toLocaleString("ko-KR")}
                        </span>
                        {journey.surveyCompletedAt && (
                          <span className="flex items-center gap-1">
                            → 설문 완료: {new Date(journey.surveyCompletedAt).toLocaleString("ko-KR")}
                          </span>
                        )}
                        {journey.aiGeneratedAt && (
                          <span className="flex items-center gap-1">
                            → AI 생성: {new Date(journey.aiGeneratedAt).toLocaleString("ko-KR")}
                          </span>
                        )}
                        {journey.reportViewedAt && (
                          <span className="flex items-center gap-1">
                            → 보고서 열람: {new Date(journey.reportViewedAt).toLocaleString("ko-KR")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex gap-2 pt-2">
                      {journey.reportToken && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(`https://kokamdo.co.kr/survey/report?token=${journey.reportToken}`);
                          }}
                        >
                          <Copy className="w-3 h-3 mr-1" /> 보고서 링크
                        </Button>
                      )}
                      {journey.companySurveyToken && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(`https://kokamdo.co.kr/survey/interview?token=${journey.companySurveyToken}`);
                          }}
                        >
                          <Copy className="w-3 h-3 mr-1" /> 인터뷰 링크
                        </Button>
                      )}
                      {journey.reportToken && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/survey/report?token=${journey.reportToken}`, "_blank");
                          }}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" /> 보고서 보기
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* 총 건수 */}
      <div className="text-center text-sm text-muted-foreground">
        총 {filteredJourneys.length}건
        {(searchQuery || filterStep !== "all") && ` (전체 ${journeys.data?.length || 0}건 중)`}
      </div>
    </div>
  );
}
