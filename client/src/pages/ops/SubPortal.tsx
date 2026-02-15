import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useParams } from "wouter";
import { Building, FileSpreadsheet, ClipboardList, Upload, CheckCircle, Clock, Send } from "lucide-react";
import { toast } from "sonner";

export default function SubPortal() {
  const { subId } = useParams<{ subId: string }>();
  const [activeTab, setActiveTab] = useState<"report" | "estimate">("report");
  const [reportForm, setReportForm] = useState({
    workDate: new Date().toISOString().split("T")[0],
    description: "", workers: "1", photoUrls: "",
  });
  const [estimateForm, setEstimateForm] = useState({
    title: "", totalAmount: "", description: "", fileUrl: "",
  });

  const subInfo = trpc.ops.subcontractor.getPublic.useQuery(
    { subId: subId || "" },
    { enabled: !!subId }
  );

  const submitReport = trpc.ops.subcontractor.submitReport.useMutation({
    onSuccess: () => {
      setReportForm({ workDate: new Date().toISOString().split("T")[0], description: "", workers: "1", photoUrls: "" });
      toast.success("작업 보고가 제출되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  const submitEstimate = trpc.ops.subcontractor.submitEstimate.useMutation({
    onSuccess: () => {
      setEstimateForm({ title: "", totalAmount: "", description: "", fileUrl: "" });
      toast.success("견적서가 제출되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  if (!subId) return <div className="p-8 text-center text-muted-foreground">잘못된 접근입니다.</div>;

  if (subInfo.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          로딩 중...
        </div>
      </div>
    );
  }

  if (subInfo.error || !subInfo.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-6 text-center">
            <Building className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-semibold mb-2">접근할 수 없습니다</h2>
            <p className="text-sm text-muted-foreground">유효하지 않은 링크이거나 비활성화된 초대입니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sub = subInfo.data;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold">{sub.companyName}</h1>
              <p className="text-sm text-muted-foreground">{sub.projectName} · 하도급 업체 포털</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 max-w-2xl">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "report" ? "default" : "outline"}
            onClick={() => setActiveTab("report")}
            className="flex-1"
          >
            <ClipboardList className="w-4 h-4 mr-2" />작업 보고
          </Button>
          <Button
            variant={activeTab === "estimate" ? "default" : "outline"}
            onClick={() => setActiveTab("estimate")}
            className="flex-1"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />견적서 제출
          </Button>
        </div>

        {activeTab === "report" ? (
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
                />
              </div>
              <div>
                <Label>작업 내용 *</Label>
                <Textarea
                  value={reportForm.description}
                  onChange={e => setReportForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="금일 수행한 작업 내용을 상세히 기재해주세요.&#10;&#10;예:&#10;- 1층 로비 바닥 타일 시공 완료 (50㎡)&#10;- 2층 사무실 천장 석고보드 설치 (30%)"
                  rows={6}
                />
              </div>
              <div>
                <Label>투입 인원 (명)</Label>
                <Input
                  type="number"
                  min="1"
                  value={reportForm.workers}
                  onChange={e => setReportForm(f => ({ ...f, workers: e.target.value }))}
                />
              </div>
              <Button
                onClick={() => {
                  if (!reportForm.description) {
                    toast.error("작업 내용을 입력해주세요.");
                    return;
                  }
                  submitReport.mutate({
                    subId: subId!,
                    workDate: reportForm.workDate,
                    description: reportForm.description,
                    workers: parseInt(reportForm.workers) || 1,
                  });
                }}
                className="w-full"
                disabled={submitReport.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {submitReport.isPending ? "제출 중..." : "작업 보고 제출"}
              </Button>
            </CardContent>
          </Card>
        ) : (
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
                />
              </div>
              <div>
                <Label>총 견적금액 (원) *</Label>
                <Input
                  value={estimateForm.totalAmount}
                  onChange={e => setEstimateForm(f => ({ ...f, totalAmount: e.target.value }))}
                  placeholder="10000000"
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
              <div>
                <Label>견적서 파일 (엑셀/PDF)</Label>
                <Input
                  type="file"
                  accept=".xlsx,.xls,.pdf"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const formData = new FormData();
                      formData.append("file", file);
                      const res = await fetch("/api/trpc/ops.estimate.upload", {
                        method: "POST",
                        body: formData,
                      });
                      if (!res.ok) throw new Error();
                      const data = await res.json();
                      setEstimateForm(f => ({ ...f, fileUrl: data.result?.data?.url || "" }));
                      toast.success("파일이 업로드되었습니다.");
                    } catch {
                      toast.error("파일 업로드에 실패했습니다.");
                    }
                  }}
                />
                {estimateForm.fileUrl && <p className="text-xs text-green-600 mt-1">파일 업로드 완료</p>}
              </div>
              <Button
                onClick={() => {
                  if (!estimateForm.title || !estimateForm.totalAmount) {
                    toast.error("제목과 금액은 필수입니다.");
                    return;
                  }
                  submitEstimate.mutate({
                    subId: subId!,
                    title: estimateForm.title,
                    totalAmount: estimateForm.totalAmount,
                    description: estimateForm.description || undefined,
                    fileUrl: estimateForm.fileUrl || undefined,
                  });
                }}
                className="w-full"
                disabled={submitEstimate.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {submitEstimate.isPending ? "제출 중..." : "견적서 제출"}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
