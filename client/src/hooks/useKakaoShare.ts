/*
 * 카카오톡 공유 유틸리티 훅
 * Kakao JavaScript SDK를 초기화하고 공유 기능을 제공합니다.
 */

import { useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    Kakao: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (settings: KakaoShareSettings) => void;
      };
    };
  }
}

interface KakaoShareLink {
  mobileWebUrl: string;
  webUrl: string;
}

interface KakaoShareContent {
  title: string;
  description: string;
  imageUrl?: string;
  link: KakaoShareLink;
}

interface KakaoShareButton {
  title: string;
  link: KakaoShareLink;
}

interface KakaoShareSettings {
  objectType: "feed" | "text" | "list" | "location" | "commerce";
  content: KakaoShareContent;
  buttons?: KakaoShareButton[];
  social?: {
    likeCount?: number;
    commentCount?: number;
    sharedCount?: number;
  };
}

export interface ShareReportParams {
  title: string;
  description: string;
  imageUrl?: string;
  pageUrl: string;
  buttonTitle?: string;
}

export interface ShareSurveyParams {
  title: string;
  description: string;
  surveyUrl: string;
  buttonTitle?: string;
}

export interface ShareContentParams {
  title: string;
  description: string;
  imageUrl?: string;
  pageUrl: string;
  buttonTitle?: string;
}

export function useKakaoShare() {
  const initialized = useRef(false);

  useEffect(() => {
    const kakaoKey = import.meta.env.VITE_KAKAO_JS_KEY;
    if (!kakaoKey) return;

    // SDK가 로드될 때까지 대기
    const initKakao = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(kakaoKey);
        initialized.current = true;
      } else if (window.Kakao && window.Kakao.isInitialized()) {
        initialized.current = true;
      }
    };

    if (window.Kakao) {
      initKakao();
    } else {
      // SDK 로드 대기
      const interval = setInterval(() => {
        if (window.Kakao) {
          initKakao();
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, []);

  const isReady = useCallback(() => {
    return initialized.current && window.Kakao?.isInitialized();
  }, []);

  /**
   * AI 분석 보고서를 카카오톡으로 공유
   */
  const shareReport = useCallback(({ title, description, imageUrl, pageUrl, buttonTitle }: ShareReportParams) => {
    if (!isReady()) {
      // SDK가 준비되지 않은 경우 URL 복사 폴백
      navigator.clipboard.writeText(pageUrl);
      return false;
    }

    const link = { mobileWebUrl: pageUrl, webUrl: pageUrl };

    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        description,
        imageUrl: imageUrl || `${window.location.origin}/og-image.jpg`,
        link,
      },
      buttons: [
        {
          title: buttonTitle || "보고서 확인하기",
          link,
        },
      ],
    });

    return true;
  }, [isReady]);

  /**
   * 전사 서베이 링크를 카카오톡으로 공유
   */
  const shareSurvey = useCallback(({ title, description, surveyUrl, buttonTitle }: ShareSurveyParams) => {
    if (!isReady()) {
      navigator.clipboard.writeText(surveyUrl);
      return false;
    }

    const link = { mobileWebUrl: surveyUrl, webUrl: surveyUrl };

    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        description,
        imageUrl: `${window.location.origin}/og-image.jpg`,
        link,
      },
      buttons: [
        {
          title: buttonTitle || "설문 참여하기",
          link,
        },
      ],
    });

    return true;
  }, [isReady]);

  /**
   * 일반 콘텐츠(인사이트 글, 고객 사례 등)를 카카오톡으로 공유
   */
  const shareContent = useCallback(({ title, description, imageUrl, pageUrl, buttonTitle }: ShareContentParams) => {
    if (!isReady()) {
      navigator.clipboard.writeText(pageUrl);
      return false;
    }

    const link = { mobileWebUrl: pageUrl, webUrl: pageUrl };

    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        description,
        imageUrl: imageUrl || `${window.location.origin}/og-image.jpg`,
        link,
      },
      buttons: [
        {
          title: buttonTitle || "자세히 보기",
          link,
        },
      ],
    });

    return true;
  }, [isReady]);

  return { isReady, shareReport, shareSurvey, shareContent };
}
