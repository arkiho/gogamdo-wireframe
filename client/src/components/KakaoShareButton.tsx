/*
 * 카카오톡 공유 버튼 컴포넌트
 * AI 보고서 및 전사 서베이 링크를 카카오톡으로 공유할 수 있는 버튼입니다.
 */

import { useKakaoShare, ShareReportParams, ShareSurveyParams, ShareContentParams } from "@/hooks/useKakaoShare";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface KakaoShareButtonProps {
  /** 공유 유형: report (보고서), survey (전사 서베이), content (일반 페이지) */
  type: "report" | "survey" | "content";
  /** 보고서 공유 시 필요한 파라미터 */
  reportParams?: ShareReportParams;
  /** 서베이 공유 시 필요한 파라미터 */
  surveyParams?: ShareSurveyParams;
  /** 일반 콘텐츠(인사이트/사례) 공유 시 필요한 파라미터 */
  contentParams?: ShareContentParams;
  /** 버튼 크기 */
  size?: "sm" | "default" | "lg" | "icon";
  /** 추가 클래스 */
  className?: string;
  /** 버튼 텍스트 (기본값: "카카오톡 공유") */
  label?: string;
}

export default function KakaoShareButton({
  type,
  reportParams,
  surveyParams,
  contentParams,
  size = "sm",
  className = "",
  label,
}: KakaoShareButtonProps) {
  const { isReady, shareReport, shareSurvey, shareContent } = useKakaoShare();

  const handleShare = () => {
    let success = false;

    if (type === "report" && reportParams) {
      success = shareReport(reportParams);
    } else if (type === "survey" && surveyParams) {
      success = shareSurvey(surveyParams);
    } else if (type === "content" && contentParams) {
      success = shareContent(contentParams);
    }

    if (!success) {
      // SDK가 준비되지 않은 경우 URL 복사 폴백
      const url =
        type === "report"
          ? reportParams?.pageUrl
          : type === "survey"
          ? surveyParams?.surveyUrl
          : contentParams?.pageUrl;
      if (url) {
        navigator.clipboard.writeText(url);
        toast.info("카카오톡 SDK를 불러오는 중입니다. 링크가 클립보드에 복사되었습니다.");
      }
    }
  };

  const buttonLabel = label || "카카오톡 공유";

  return (
    <Button
      size={size}
      variant="outline"
      className={`gap-1.5 border-[#FEE500] bg-[#FEE500] text-[#3C1E1E] hover:bg-[#FDD835] hover:text-[#3C1E1E] font-medium ${className}`}
      onClick={handleShare}
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="currentColor">
        <path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67-.15.54-.96 3.47-.99 3.69 0 0-.02.17.09.24.11.06.24.01.24.01.32-.04 3.7-2.44 4.28-2.85.56.08 1.14.12 1.72.12 5.52 0 10-3.58 10-7.88S17.52 3 12 3z" />
      </svg>
      {buttonLabel}
    </Button>
  );
}
