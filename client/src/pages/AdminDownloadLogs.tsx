/**
 * 관리자 다운로드 이력 대시보드
 * - 파일 다운로드 로그 조회
 * - 트래킹 코드 검색
 * - 파일 유형별 통계
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Shield, Search, Download, FileText, BarChart3, Eye,
  ChevronLeft, ChevronRight, AlertTriangle, ArrowLeft,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

const FILE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  estimate_pdf: { label: "견적서 PDF", color: "bg-blue-100 text-blue-700" },
  expense_pdf: { label: "지출결의서 PDF", color: "bg-green-100 text-green-700" },
  project_report_pdf: { label: "프로젝트 리포트", color: "bg-purple-100 text-purple-700" },
  proposal_pdf: { label: "제안서 PDF", color: "bg-amber-100 text-amber-700" },
  lead_magnet: { label: "리드마그넷", color: "bg-cyan-100 text-cyan-700" },
  ai_estimate_result: { label: "AI 견적 결과", color: "bg-pink-100 text-pink-700" },
  design_auto_result: { label: "설계자동화 결과", color: "bg-indigo-100 text-indigo-700" },
  other: { label: "기타", color: "bg-gray-100 text-gray-600" },
};

export default function AdminDownloadLogs() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"logs" | "search" | "stats" | "anomaly">("logs");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [searchCode, setSearchCode] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const pageSize = 20;

  // 다운로드 로그 목록
  const logsQuery = trpc.ipProtection.listLogs.useQuery({
    fileType: fileTypeFilter === "all" ? undefined : fileTypeFilter,
    limit: pageSize,
    offset: page * pageSize,
  }, { enabled: tab === "logs" && !!user });

  // 통계
  const statsQuery = trpc.ipProtection.stats.useQuery(undefined, {
    enabled: tab === "stats" && !!user,
  });

  // 트래킹 코드 검색
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const trackingLookup = trpc.ipProtection.lookupByTrackingCode.useQuery(
    { trackingCode: searchCode },
    { enabled: false }
  );

  // 이메일 검색
  const [emailResults, setEmailResults] = useState<any[]>([]);
  const emailLookup = trpc.ipProtection.userHistory.useQuery(
    { email: searchEmail },
    { enabled: false }
  );

  const handleTrackingSearch = async () => {
    if (!searchCode.trim()) return;
    try {
      const result = await trackingLookup.refetch();
      if (result.data) {
        setTrackingResult(result.data);
        toast.success("트래킹 코드를 찾았습니다.");
      }
    } catch {
      toast.error("해당 트래킹 코드를 찾을 수 없습니다.");
      setTrackingResult(null);
    }
  };

  const handleEmailSearch = async () => {
    if (!searchEmail.trim()) return;
    try {
      const result = await emailLookup.refetch();
      setEmailResults(result.data || []);
      if (!result.data?.length) {
        toast.info("해당 이메일의 다운로드 이력이 없습니다.");
      }
    } catch {
      toast.error("검색에 실패했습니다.");
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">로딩 중...</div>;
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Shield className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">관리자 권한이 필요합니다.</p>
        <Button onClick={() => { window.location.href = getLoginUrl(); }}>로그인</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />뒤로
              </Button>
            </Link>
            <Shield className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-bold">다운로드 이력 관리</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-[72px]">
            파일 다운로드 추적 및 지적재산권 보호 모니터링
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="container py-4">
        <div className="flex gap-2 mb-6">
          {[
            { id: "logs" as const, label: "다운로드 로그", icon: <FileText className="w-4 h-4" /> },
            { id: "search" as const, label: "추적 검색", icon: <Search className="w-4 h-4" /> },
            { id: "stats" as const, label: "통계", icon: <BarChart3 className="w-4 h-4" /> },
            { id: "anomaly" as const, label: "이상 감지", icon: <AlertTriangle className="w-4 h-4" /> },
          ].map((t) => (
            <Button
              key={t.id}
              variant={tab === t.id ? "default" : "outline"}
              size="sm"
              onClick={() => setTab(t.id)}
              className="gap-1"
            >
              {t.icon}
              {t.label}
            </Button>
          ))}
        </div>

        {/* === 다운로드 로그 탭 === */}
        {tab === "logs" && (
          <div className="space-y-4">
            {/* 필터 */}
            <div className="flex gap-2 items-center">
              <Select value={fileTypeFilter} onValueChange={(v) => { setFileTypeFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="파일 유형 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {Object.entries(FILE_TYPE_LABELS).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                총 {logsQuery.data?.total ?? 0}건
              </span>
            </div>

            {/* 테이블 (데스크톱) */}
            <div className="hidden md:block">
              <Card>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left py-2 px-3 font-medium">일시</th>
                        <th className="text-left py-2 px-3 font-medium">파일 유형</th>
                        <th className="text-left py-2 px-3 font-medium">파일명</th>
                        <th className="text-left py-2 px-3 font-medium">사용자</th>
                        <th className="text-left py-2 px-3 font-medium">트래킹 코드</th>
                        <th className="text-left py-2 px-3 font-medium">동의</th>
                        <th className="text-left py-2 px-3 font-medium">IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logsQuery.data?.logs.map((log: any) => {
                        const ft = FILE_TYPE_LABELS[log.fileType] || FILE_TYPE_LABELS.other;
                        return (
                          <tr key={log.id} className="border-b hover:bg-muted/30">
                            <td className="py-2 px-3 text-xs">
                              {new Date(log.createdAt).toLocaleString("ko-KR")}
                            </td>
                            <td className="py-2 px-3">
                              <Badge variant="secondary" className={`text-xs ${ft.color}`}>
                                {ft.label}
                              </Badge>
                            </td>
                            <td className="py-2 px-3 max-w-[200px] truncate" title={log.fileName}>
                              {log.fileName || "-"}
                            </td>
                            <td className="py-2 px-3">
                              <div className="text-xs">
                                <div>{log.userName || "비로그인"}</div>
                                <div className="text-muted-foreground">{log.userEmail || "-"}</div>
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">
                                {log.trackingCode}
                              </code>
                            </td>
                            <td className="py-2 px-3">
                              {log.consentGiven === "yes" ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">동의</Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">미동의</Badge>
                              )}
                            </td>
                            <td className="py-2 px-3 text-xs text-muted-foreground">
                              {log.ipAddress || "-"}
                            </td>
                          </tr>
                        );
                      })}
                      {(!logsQuery.data?.logs.length) && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-muted-foreground">
                            다운로드 이력이 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>

            {/* 카드 (모바일) */}
            <div className="md:hidden space-y-3">
              {logsQuery.data?.logs.map((log: any) => {
                const ft = FILE_TYPE_LABELS[log.fileType] || FILE_TYPE_LABELS.other;
                return (
                  <Card key={log.id}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className={`text-xs ${ft.color}`}>
                          {ft.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString("ko-KR")}
                        </span>
                      </div>
                      <div className="text-sm font-medium truncate">{log.fileName || "-"}</div>
                      <div className="flex items-center justify-between text-xs">
                        <span>{log.userName || "비로그인"} ({log.userEmail || "-"})</span>
                        {log.consentGiven === "yes" ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">동의</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">미동의</Badge>
                        )}
                      </div>
                      <div className="text-xs">
                        <code className="bg-muted px-1 py-0.5 rounded font-mono">{log.trackingCode}</code>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* 페이지네이션 */}
            {(logsQuery.data?.total ?? 0) > pageSize && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page + 1} / {Math.ceil((logsQuery.data?.total ?? 0) / pageSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(page + 1) * pageSize >= (logsQuery.data?.total ?? 0)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* === 추적 검색 탭 === */}
        {tab === "search" && (
          <div className="space-y-6">
            {/* 트래킹 코드 검색 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  트래킹 코드 검색
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="GGD-20260215-XXXXXXXX"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    className="font-mono"
                  />
                  <Button onClick={handleTrackingSearch} disabled={!searchCode.trim()}>
                    검색
                  </Button>
                </div>
                {trackingResult && (
                  <div className="p-3 bg-muted rounded-md space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold">추적 결과</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-muted-foreground">파일 유형:</span> {FILE_TYPE_LABELS[trackingResult.fileType]?.label}</div>
                      <div><span className="text-muted-foreground">파일명:</span> {trackingResult.fileName || "-"}</div>
                      <div><span className="text-muted-foreground">사용자:</span> {trackingResult.userName || "비로그인"}</div>
                      <div><span className="text-muted-foreground">이메일:</span> {trackingResult.userEmail || "-"}</div>
                      <div><span className="text-muted-foreground">IP:</span> {trackingResult.ipAddress || "-"}</div>
                      <div><span className="text-muted-foreground">일시:</span> {new Date(trackingResult.createdAt).toLocaleString("ko-KR")}</div>
                      <div><span className="text-muted-foreground">동의:</span> {trackingResult.consentGiven === "yes" ? "동의함" : "미동의"}</div>
                      <div><span className="text-muted-foreground">프로젝트:</span> {trackingResult.projectName || "-"}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 이메일 검색 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  사용자 이메일 검색
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="user@example.com"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                  />
                  <Button onClick={handleEmailSearch} disabled={!searchEmail.trim()}>
                    검색
                  </Button>
                </div>
                {emailResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{emailResults.length}건의 다운로드 이력</p>
                    {emailResults.map((log: any) => {
                      const ft = FILE_TYPE_LABELS[log.fileType] || FILE_TYPE_LABELS.other;
                      return (
                        <div key={log.id} className="p-2 bg-muted rounded text-xs flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={`text-xs ${ft.color}`}>{ft.label}</Badge>
                            <span>{log.fileName || "-"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="font-mono text-muted-foreground">{log.trackingCode}</code>
                            <span className="text-muted-foreground">
                              {new Date(log.createdAt).toLocaleDateString("ko-KR")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* === 통계 탭 === */}
        {tab === "stats" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  파일 유형별 다운로드 통계
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statsQuery.data && statsQuery.data.length > 0 ? (
                  <div className="space-y-3">
                    {statsQuery.data.map((stat: any) => {
                      const ft = FILE_TYPE_LABELS[stat.fileType] || FILE_TYPE_LABELS.other;
                      const maxCount = Math.max(...statsQuery.data.map((s: any) => s.count));
                      const pct = maxCount > 0 ? (stat.count / maxCount) * 100 : 0;
                      return (
                        <div key={stat.fileType} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <Badge variant="secondary" className={`text-xs ${ft.color}`}>
                              {ft.label}
                            </Badge>
                            <span className="font-semibold">{stat.count}건</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-amber-500 h-2 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    아직 다운로드 통계가 없습니다.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 보호 현황 요약 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  지적재산권 보호 현황
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-md text-center">
                    <div className="text-2xl font-bold text-amber-600">
                      {statsQuery.data?.reduce((sum: number, s: any) => sum + s.count, 0) || 0}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">총 다운로드</div>
                  </div>
                  <div className="p-4 bg-muted rounded-md text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {statsQuery.data?.length || 0}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">추적 파일 유형</div>
                  </div>
                  <div className="p-4 bg-muted rounded-md text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      <Shield className="w-6 h-6 mx-auto" />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">워터마크 활성</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {/* === 이상 감지 탭 === */}
        {tab === "anomaly" && (
          <AnomalyTab />
        )}
      </div>
    </div>
  );
}

/** 이상 감지 탭 컴포넌트 */
function AnomalyTab() {
  const [windowMinutes, setWindowMinutes] = useState(60);
  const [threshold, setThreshold] = useState(5);

  const anomalyQuery = trpc.ipProtection.anomalyReport.useQuery(
    { withinMinutes: windowMinutes, threshold },
    { refetchInterval: 30000 } // 30초마다 자동 갱신
  );

  return (
    <div className="space-y-4">
      {/* 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            이상 감지 설정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">감지 시간 범위 (분)</label>
              <Select value={String(windowMinutes)} onValueChange={(v) => setWindowMinutes(Number(v))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15분</SelectItem>
                  <SelectItem value="30">30분</SelectItem>
                  <SelectItem value="60">1시간</SelectItem>
                  <SelectItem value="120">2시간</SelectItem>
                  <SelectItem value="360">6시간</SelectItem>
                  <SelectItem value="1440">24시간</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">임계값 (회)</label>
              <Select value={String(threshold)} onValueChange={(v) => setThreshold(Number(v))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3회 이상</SelectItem>
                  <SelectItem value="5">5회 이상</SelectItem>
                  <SelectItem value="10">10회 이상</SelectItem>
                  <SelectItem value="20">20회 이상</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              자동 갱신: 30초마다 | 마지막 확인: {anomalyQuery.data?.checkedAt
                ? new Date(anomalyQuery.data.checkedAt).toLocaleString("ko-KR")
                : "-"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 이상 감지 결과 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {(anomalyQuery.data?.anomalies?.length ?? 0) > 0 ? (
              <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
            ) : (
              <Shield className="w-4 h-4 text-green-500" />
            )}
            감지 결과
            {(anomalyQuery.data?.anomalies?.length ?? 0) > 0 && (
              <Badge variant="destructive" className="ml-2">
                {anomalyQuery.data?.anomalies?.length}건 감지
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {anomalyQuery.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">조회 중...</div>
          ) : (anomalyQuery.data?.anomalies?.length ?? 0) === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-10 h-10 mx-auto text-green-400 mb-3" />
              <p className="text-muted-foreground">
                최근 {windowMinutes}분 내 이상 다운로드가 감지되지 않았습니다.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                임계값: {threshold}회 이상 다운로드 시 감지
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {anomalyQuery.data?.anomalies?.map((a: any, i: number) => (
                <div
                  key={i}
                  className="p-4 border border-red-200 bg-red-50 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-red-800 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {a.userName || a.userEmail || "미확인 사용자"}
                      </div>
                      <div className="text-sm text-red-600 mt-1">
                        이메일: {a.userEmail || "-"}
                      </div>
                      <div className="text-sm text-red-600">
                        IP: {a.ipAddress || "-"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-700">
                        {a.count}회
                      </div>
                      <div className="text-xs text-red-500">
                        {windowMinutes}분 내 다운로드
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 이상 감지 안내 */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">이상 감지 시스템 안내</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>동일 사용자/IP가 설정된 시간 내에 임계값 이상 다운로드 시 자동 감지됩니다.</li>
              <li>감지 시 관리자에게 자동 알림이 발송됩니다 (알림 센터 + 이메일).</li>
              <li>동일 사용자에 대해 30분 내 중복 알림은 발송되지 않습니다.</li>
              <li>모든 다운로드는 트래킹 코드와 함께 기록되며, 무단 유출 시 추적이 가능합니다.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
