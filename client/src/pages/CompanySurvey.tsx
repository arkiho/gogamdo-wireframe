/**
 * 전사 업무환경 설문조사 - 공개 페이지
 * 토큰 기반 접근, 로그인 불필요, 익명 응답
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRoute } from "wouter";
import {
  Loader2, CheckCircle2, ClipboardList, Send, Building2,
} from "lucide-react";
import Logo from "@/components/Logo";

function RatingRow({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
      <span className="text-sm text-ink font-medium flex-1">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
              n <= value
                ? "bg-gold text-ink shadow-sm"
                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CompanySurvey() {
  const [, params] = useRoute("/survey/:token");
  const token = params?.token || "";
  const [submitted, setSubmitted] = useState(false);

  const surveyInfo = trpc.clientPipeline.getCompanySurveyPublic.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const [form, setForm] = useState({
    department: "", role: "", tenure: "" as any,
    overallSatisfaction: 0, noiseSatisfaction: 0, lightingSatisfaction: 0,
    temperatureSatisfaction: 0, spaceSatisfaction: 0, privacySatisfaction: 0,
    deskUsageHours: 8,
    meetingHoursPerDay: "",
    collaborationFrequency: "" as any,
    focusWorkNeed: "" as any,
    desiredSpaces: [] as string[],
    improvementSuggestions: "",
    additionalComments: "",
  });

  const submitResponse = trpc.clientPipeline.submitCompanySurveyResponse.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("설문이 제출되었습니다. 감사합니다!");
    },
    onError: (err) => toast.error(err.message || "제출에 실패했습니다."),
  });

  const DESIRED_SPACES = [
    "집중 업무 공간", "협업 공간", "라운지", "카페테리아", "폰부스",
    "수면실", "피트니스", "라이브러리", "야외 테라스", "게임룸",
    "명상실", "수유실", "샤워실", "개인 사물함",
  ];

  if (surveyInfo.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (surveyInfo.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-12 text-center space-y-4">
            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto" />
            <h2 className="font-heading text-xl font-bold text-ink">설문을 찾을 수 없습니다</h2>
            <p className="text-muted-foreground text-sm">
              {surveyInfo.error.message || "유효하지 않은 설문 링크입니다."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-ink">감사합니다!</h2>
            <p className="text-muted-foreground">
              소중한 의견이 제출되었습니다.<br />
              더 나은 업무환경을 만드는 데 큰 도움이 됩니다.
            </p>
            <div className="pt-4">
              <Logo className="h-6 mx-auto opacity-30" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper py-8 lg:py-16">
      <div className="container max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo className="h-8 mx-auto mb-6" />
          <h1 className="font-heading text-2xl lg:text-3xl font-bold text-ink mb-2">
            {surveyInfo.data?.title || "업무환경 설문조사"}
          </h1>
          <p className="text-muted-foreground">
            {surveyInfo.data?.description || "더 나은 업무환경을 위한 설문조사입니다."}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            현재 {surveyInfo.data?.responseCount || 0}명 참여 · 익명으로 진행됩니다
          </p>
        </div>

        <Card>
          <CardContent className="py-8 space-y-8">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-ink text-lg border-b pb-2">기본 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>부서</Label><Input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="예: 마케팅팀" /></div>
                <div><Label>직급</Label><Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="예: 과장" /></div>
              </div>
              <div>
                <Label>근속 기간</Label>
                <Select value={form.tenure} onValueChange={v => setForm(f => ({ ...f, tenure: v }))}>
                  <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="less_1y">1년 미만</SelectItem>
                    <SelectItem value="1_3y">1~3년</SelectItem>
                    <SelectItem value="3_5y">3~5년</SelectItem>
                    <SelectItem value="5_10y">5~10년</SelectItem>
                    <SelectItem value="over_10y">10년 이상</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 현재 공간 만족도 */}
            <div className="space-y-2">
              <h3 className="font-heading font-semibold text-ink text-lg border-b pb-2">현재 공간 만족도</h3>
              <p className="text-xs text-muted-foreground mb-2">1(매우 불만족) ~ 5(매우 만족)</p>
              <RatingRow label="전체 만족도" value={form.overallSatisfaction} onChange={v => setForm(f => ({ ...f, overallSatisfaction: v }))} />
              <RatingRow label="소음 환경" value={form.noiseSatisfaction} onChange={v => setForm(f => ({ ...f, noiseSatisfaction: v }))} />
              <RatingRow label="조명 환경" value={form.lightingSatisfaction} onChange={v => setForm(f => ({ ...f, lightingSatisfaction: v }))} />
              <RatingRow label="온도/냉난방" value={form.temperatureSatisfaction} onChange={v => setForm(f => ({ ...f, temperatureSatisfaction: v }))} />
              <RatingRow label="공간 크기" value={form.spaceSatisfaction} onChange={v => setForm(f => ({ ...f, spaceSatisfaction: v }))} />
              <RatingRow label="프라이버시" value={form.privacySatisfaction} onChange={v => setForm(f => ({ ...f, privacySatisfaction: v }))} />
            </div>

            {/* 업무 스타일 */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-ink text-lg border-b pb-2">업무 스타일</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>하루 평균 자리 사용 시간</Label>
                  <Input type="number" min="0" max="24" value={form.deskUsageHours} onChange={e => setForm(f => ({ ...f, deskUsageHours: parseInt(e.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>하루 평균 회의 시간</Label>
                  <Select value={form.meetingHoursPerDay} onValueChange={v => setForm(f => ({ ...f, meetingHoursPerDay: v }))}>
                    <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">30분 미만</SelectItem>
                      <SelectItem value="1">약 1시간</SelectItem>
                      <SelectItem value="2">약 2시간</SelectItem>
                      <SelectItem value="3">약 3시간</SelectItem>
                      <SelectItem value="4">4시간 이상</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>협업 빈도</Label>
                  <Select value={form.collaborationFrequency} onValueChange={v => setForm(f => ({ ...f, collaborationFrequency: v }))}>
                    <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rarely">거의 없음</SelectItem>
                      <SelectItem value="sometimes">가끔</SelectItem>
                      <SelectItem value="often">자주</SelectItem>
                      <SelectItem value="always">항상</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>집중 업무 필요도</Label>
                  <Select value={form.focusWorkNeed} onValueChange={v => setForm(f => ({ ...f, focusWorkNeed: v }))}>
                    <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">낮음</SelectItem>
                      <SelectItem value="medium">보통</SelectItem>
                      <SelectItem value="high">높음</SelectItem>
                      <SelectItem value="critical">매우 높음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 희망 공간 */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-ink text-lg border-b pb-2">희망 공간 (복수 선택)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DESIRED_SPACES.map(space => (
                  <label key={space} className="flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.desiredSpaces.includes(space)}
                      onChange={e => {
                        setForm(f => ({
                          ...f,
                          desiredSpaces: e.target.checked
                            ? [...f.desiredSpaces, space]
                            : f.desiredSpaces.filter(s => s !== space),
                        }));
                      }}
                      className="accent-gold"
                    />
                    <span className="text-sm">{space}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 자유 의견 */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-ink text-lg border-b pb-2">자유 의견</h3>
              <div>
                <Label>개선 제안</Label>
                <Textarea value={form.improvementSuggestions} onChange={e => setForm(f => ({ ...f, improvementSuggestions: e.target.value }))} placeholder="현재 업무환경에서 개선되었으면 하는 점을 자유롭게 작성해주세요." rows={3} />
              </div>
              <div>
                <Label>추가 의견</Label>
                <Textarea value={form.additionalComments} onChange={e => setForm(f => ({ ...f, additionalComments: e.target.value }))} placeholder="기타 의견이 있으시면 작성해주세요." rows={3} />
              </div>
            </div>

            <Button
              className="w-full bg-gold text-ink hover:bg-gold-light font-semibold h-12 text-base gap-2"
              onClick={() => {
                submitResponse.mutate({
                  token,
                  ...form,
                  meetingHoursPerDay: form.meetingHoursPerDay || undefined,
                  tenure: form.tenure || undefined,
                  collaborationFrequency: form.collaborationFrequency || undefined,
                  focusWorkNeed: form.focusWorkNeed || undefined,
                });
              }}
              disabled={submitResponse.isPending}
            >
              {submitResponse.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              설문 제출
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by <span className="font-heading font-semibold">KOKAMDO</span> · 고감도 오피스 인테리어
        </p>
      </div>
    </div>
  );
}
