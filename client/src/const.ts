export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Google OAuth login URL
export const getGoogleLoginUrl = () => {
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
  return url.toString();
};

export const getNaverLoginUrl = () => {
  const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;
  if (!clientId) return "";
  const redirectUri = `${window.location.origin}/api/auth/naver/callback`;
  const state = Math.random().toString(36).slice(2);
  const url = new URL("https://nid.naver.com/oauth2.0/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  return url.toString();
};

export const getKakaoLoginUrl = () => {
  const clientId = import.meta.env.VITE_KAKAO_CLIENT_ID;
  if (!clientId) return "";
  const redirectUri = `${window.location.origin}/api/auth/kakao/callback`;
  const url = new URL("https://kauth.kakao.com/oauth/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  return url.toString();
};

// Backward compat alias
export const getLoginUrl = getGoogleLoginUrl;
