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

// Backward compat alias
export const getLoginUrl = getGoogleLoginUrl;
