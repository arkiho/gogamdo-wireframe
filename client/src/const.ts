export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

type OAuthAccountKind = "staff" | "client";

function getOAuthStartUrl(provider: "google" | "naver" | "kakao", accountKind: OAuthAccountKind) {
  return `/api/auth/${provider}/start?accountKind=${encodeURIComponent(accountKind)}`;
}

export const getGoogleLoginUrl = (accountKind: OAuthAccountKind = "staff") =>
  getOAuthStartUrl("google", accountKind);

export const getNaverLoginUrl = (accountKind: OAuthAccountKind = "client") =>
  getOAuthStartUrl("naver", accountKind);

export const getKakaoLoginUrl = (accountKind: OAuthAccountKind = "client") =>
  getOAuthStartUrl("kakao", accountKind);

// Backward compatibility alias: staff login is the default.
export const getLoginUrl = () => getGoogleLoginUrl("staff");
