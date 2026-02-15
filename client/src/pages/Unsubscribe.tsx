/*
 * Newsletter Unsubscribe Page
 * Token-based unsubscribe with confirmation
 */

import { useState } from "react";
import { useParams, Link } from "wouter";
import { MailX, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import SEOHead from "@/components/SEOHead";

export default function Unsubscribe() {
  const params = useParams<{ token: string }>();
  const token = params.token || "";
  const [confirmed, setConfirmed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const unsubscribeMutation = trpc.newsletter.unsubscribe.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setProcessing(false);
    },
    onError: (err) => {
      setResult({ success: false, message: err.message || "처리 중 오류가 발생했습니다." });
      setProcessing(false);
    },
  });

  const handleUnsubscribe = () => {
    setProcessing(true);
    unsubscribeMutation.mutate({ token });
  };

  return (
    <>
      <SEOHead title="뉴스레터 구독 해지 | 고감도" description="고감도 뉴스레터 구독 해지" />
      <div className="min-h-screen flex items-center justify-center bg-paper-warm">
        <div className="max-w-md w-full mx-4 p-8 bg-white border border-border/50">
          {result ? (
            <div className="text-center">
              {result.success ? (
                <>
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h1 className="font-heading text-2xl font-bold text-ink mb-2">구독이 해지되었습니다</h1>
                  <p className="text-muted-foreground mb-6">
                    더 이상 뉴스레터를 받지 않으실 겁니다. 언제든 다시 구독하실 수 있습니다.
                  </p>
                </>
              ) : (
                <>
                  <MailX className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h1 className="font-heading text-2xl font-bold text-ink mb-2">처리 실패</h1>
                  <p className="text-muted-foreground mb-6">{result.message}</p>
                </>
              )}
              <Link href="/">
                <span className="inline-flex items-center gap-2 text-gold hover:underline text-sm">
                  <ArrowLeft className="w-4 h-4" /> 홈으로 돌아가기
                </span>
              </Link>
            </div>
          ) : (
            <div className="text-center">
              <MailX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h1 className="font-heading text-2xl font-bold text-ink mb-2">뉴스레터 구독 해지</h1>
              <p className="text-muted-foreground mb-6">
                정말로 고감도 뉴스레터 구독을 해지하시겠습니까?
              </p>
              {!confirmed ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setConfirmed(true)}
                    className="w-full px-6 py-3 bg-red-50 text-red-600 font-medium text-sm hover:bg-red-100 transition-colors border border-red-200"
                  >
                    구독 해지하기
                  </button>
                  <Link href="/insights">
                    <span className="block w-full px-6 py-3 bg-ink text-white font-medium text-sm hover:bg-ink/90 transition-colors text-center">
                      계속 구독하기
                    </span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-red-600 font-medium mb-4">
                    한 번 더 확인합니다. 구독을 해지하시겠습니까?
                  </p>
                  <button
                    onClick={handleUnsubscribe}
                    disabled={processing}
                    className="w-full px-6 py-3 bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {processing ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> 처리 중...
                      </span>
                    ) : (
                      "네, 구독을 해지합니다"
                    )}
                  </button>
                  <button
                    onClick={() => setConfirmed(false)}
                    className="w-full px-6 py-3 text-muted-foreground text-sm hover:text-ink transition-colors"
                  >
                    취소
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
