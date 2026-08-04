export type PublicIntegrationIdKind =
  | "ga4"
  | "clarity"
  | "facebookPixel"
  | "googleAds"
  | "naverAnalytics"
  | "kakaoJs";

const PUBLIC_ID_PATTERNS: Record<PublicIntegrationIdKind, RegExp> = {
  ga4: /^G-[A-Z0-9]+$/,
  clarity: /^[a-z0-9]+$/i,
  facebookPixel: /^\d+$/,
  googleAds: /^AW-\d+$/,
  naverAnalytics: /^[A-Z0-9_-]+$/i,
  kakaoJs: /^[a-f0-9]{32}$/,
};

export const KAKAO_CHANNEL_FALLBACK_URL = "https://pf.kakao.com/_xnxlxkxj/chat";

/**
 * Public integration IDs are optional outside production. Empty or malformed
 * values disable the integration instead of being interpolated into a URL or
 * handed to a third-party SDK.
 */
export function normalizePublicIntegrationId(
  value: string | undefined,
  kind: PublicIntegrationIdKind
): string | undefined {
  const normalized = value?.trim();
  if (!normalized || !PUBLIC_ID_PATTERNS[kind].test(normalized)) {
    return undefined;
  }
  return normalized;
}

export function getKakaoChannelUrl(channelId: string | undefined): string {
  const normalized = channelId?.trim();
  if (!normalized || !/^_[A-Z0-9]+$/i.test(normalized)) {
    return KAKAO_CHANNEL_FALLBACK_URL;
  }
  return `https://pf.kakao.com/${normalized}/chat`;
}
