export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// OAuth 로그인 URL — state 로 사용자 타입(staff|client) 을 실어 보낸다 (F-15/F-16).
export const getGoogleLoginUrl = (state = "staff") => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) return "";
  const redirectUri = `${window.location.origin}/api/auth/google/callback`;
  const scope = "openid profile email";
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("state", state);
  return url.toString();
};

export const getNaverLoginUrl = (state = "client") => {
  const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;
  if (!clientId) return "";
  const redirectUri = `${window.location.origin}/api/auth/naver/callback`;
  const url = new URL("https://nid.naver.com/oauth2.0/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  return url.toString();
};

export const getKakaoLoginUrl = (state = "client") => {
  const clientId = import.meta.env.VITE_KAKAO_CLIENT_ID;
  if (!clientId) return "";
  const redirectUri = `${window.location.origin}/api/auth/kakao/callback`;
  const url = new URL("https://kauth.kakao.com/oauth/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  return url.toString();
};

// Backward compat alias (직원 로그인 기본)
export const getLoginUrl = () => getGoogleLoginUrl("staff");
