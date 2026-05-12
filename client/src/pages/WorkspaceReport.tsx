/**
 * 업무환경 분석 보고서 열람 페이지
 * - reportToken 기반 공개 접근
 * - 담당자 설문 결과 요약
 * - AI 분석 요약
 * - 전사 인터뷰 링크 복사 기능
 * - 회원가입 유도 CTA
 */
import { useState } from "react";
import { useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Building2,
  Users,
  Ruler,
  ClipboardList,
  Copy,
  CheckCircle2,
  ArrowRight,
  FileText,
  Lightbulb,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";

const WORK_STYLE_LABELS: Record<string, string> = {
  collaborative: "협업 중심",
  focused: "집중 업무 중심",
  hybrid: "하이브리드",
  flexible: "유연 근무",
};

const DESIGN_STYLE_LABELS: Record<string, string> = {
  modern: "모던",
  minimal: "미니멀",
  warm: "따뜻한",
  industrial: "인더스트리얼",
  natural: "자연 친화",
  luxury: "럭셔리",
  creative: "크리에이티브",
};

export default function WorkspaceReport() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token") || "";
  const [copied, setCopied] = useState(false);

  const { data: report, isLoading, error } = trpc.workspaceJourney.getReport.useQuery(
    { token },
    { enabled: !!token }
  );

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-red-500 font-medium">유효하지 않은 링크입니다.</p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-muted-foreground">보고서를 불러오는 중...</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 font-medium">보고서를 찾을 수 없습니다.</p>
          <p className="text-sm text-muted-foreground mt-2">링크가 만료되었거나 존재하지 않습니다.</p>
        </Card>
      </div>
    );
  }

  const interviewLink = `${window.location.origin}/survey/interview?token=${report.companySurveyToken}`;

  function copyInterviewLink() {
    navigator.clipboard.writeText(interviewLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      {/* 헤더 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-amber-600" />
            <span className="font-bold text-gray-900">업무환경 분석 보고서</span>
          </div>
          <Link href="/client/register">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
              무료 상담 신청
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* 회사 정보 요약 */}
        <section>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {report.companyName} 업무환경 분석 결과
          </h1>
          <p className="text-muted-foreground">
            {report.contactName}님이 요청하신 업무환경 분석 보고서입니다.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Card className="p-4 text-center">
              <Users className="w-5 h-5 text-amber-600 mx-auto mb-2" />
              <div className="text-lg font-bold">{report.employeeCount}명</div>
              <div className="text-xs text-muted-foreground">직원 수</div>
            </Card>
            <Card className="p-4 text-center">
              <Ruler className="w-5 h-5 text-amber-600 mx-auto mb-2" />
              <div className="text-lg font-bold">{report.officeSizePyeong}평</div>
              <div className="text-xs text-muted-foreground">사무실 면적</div>
            </Card>
            <Card className="p-4 text-center">
              <ClipboardList className="w-5 h-5 text-amber-600 mx-auto mb-2" />
              <div className="text-lg font-bold">
                {WORK_STYLE_LABELS[report.workStyle || ""] || report.workStyle}
              </div>
              <div className="text-xs text-muted-foreground">업무 스타일</div>
            </Card>
            <Card className="p-4 text-center">
              <Sparkles className="w-5 h-5 text-amber-600 mx-auto mb-2" />
              <div className="text-lg font-bold">
                {DESIGN_STYLE_LABELS[report.designStyle || ""] || report.designStyle}
              </div>
              <div className="text-xs text-muted-foreground">선호 스타일</div>
            </Card>
          </div>
        </section>

        {/* AI 분석 요약 */}
        {report.analysisSummary && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-gray-900">AI 분석 요약</h2>
            </div>
            <Card className="p-6 bg-amber-50/50 border-amber-200">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {report.analysisSummary}
              </p>
            </Card>
          </section>
        )}

        {/* 불편사항 및 희망 공간 */}
        <div className="grid md:grid-cols-2 gap-6">
          {report.painPoints && report.painPoints.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                현재 불편사항
              </h3>
              <Card className="p-4">
                <ul className="space-y-2">
                  {report.painPoints.map((point: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          )}

          {report.desiredSpaces && report.desiredSpaces.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                희망 공간
              </h3>
              <Card className="p-4">
                <ul className="space-y-2">
                  {report.desiredSpaces.map((space: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      {space}
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          )}
        </div>

        {/* 도면 분석 결과 */}
        {report.floorPlanAnalysis && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-gray-900">도면 분석 결과</h2>
            </div>
            <Card className="p-6">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {report.floorPlanAnalysis.estimatedArea && (
                  <div>
                    <span className="text-muted-foreground">추정 면적:</span>{" "}
                    <strong>{report.floorPlanAnalysis.estimatedArea}</strong>
                  </div>
                )}
                {report.floorPlanAnalysis.roomCount && (
                  <div>
                    <span className="text-muted-foreground">공간 수:</span>{" "}
                    <strong>{report.floorPlanAnalysis.roomCount}개</strong>
                  </div>
                )}
              </div>
              {report.floorPlanAnalysis.spaceAnalysis && (
                <p className="mt-4 text-sm text-gray-700 leading-relaxed">
                  {report.floorPlanAnalysis.spaceAnalysis}
                </p>
              )}
              {report.floorPlanAnalysis.structuralNotes && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {report.floorPlanAnalysis.structuralNotes}
                </p>
              )}
            </Card>
          </section>
        )}

        {/* 전사 인터뷰 링크 */}
        <section className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-6 h-6 text-amber-700" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">전사 인터뷰 설문</h3>
              <p className="text-sm text-gray-600 mb-4">
                아래 링크를 직원들에게 공유하면, AI가 생성한 맞춤형 질문으로 업무환경에 대한
                의견을 수집할 수 있습니다. ({report.interviewQuestions?.length || 0}개 질문)
              </p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={interviewLink}
                  className="flex-1 px-3 py-2 text-xs bg-white border rounded-md text-gray-600 truncate"
                />
                <Button
                  onClick={copyInterviewLink}
                  size="sm"
                  variant={copied ? "default" : "outline"}
                  className={copied ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      복사됨
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      복사
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 회원가입 CTA */}
        <section className="text-center py-8">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            더 정밀한 분석이 필요하신가요?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            회원가입 후 전문 컨설턴트의 맞춤 상담과 3D 공간 설계를 받아보세요.
          </p>
          <Link href="/client/register">
            <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white px-8">
              무료 회원가입
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="border-t bg-white py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-xs text-muted-foreground">
          <p>(주)고감도 | 사무환경 전문 인테리어</p>
          <p className="mt-1">본 보고서는 AI 분석 결과이며, 정밀 진단을 위해 전문 상담을 권장합니다.</p>
        </div>
      </footer>
    </div>
  );
}
