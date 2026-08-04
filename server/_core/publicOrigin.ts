const DEFAULT_PUBLIC_ORIGIN = "https://kokamdo.co.kr";

/**
 * Returns the operator-configured canonical origin for security-sensitive links.
 * Request Origin/Referer/Host headers must never influence verification or reset links.
 */
export function getTrustedPublicOrigin(
  raw = process.env.PUBLIC_BASE_URL || DEFAULT_PUBLIC_ORIGIN,
  nodeEnv = process.env.NODE_ENV,
): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("PUBLIC_BASE_URL must be an absolute URL");
  }
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("PUBLIC_BASE_URL must contain an origin only");
  }
  if (nodeEnv === "production" && url.protocol !== "https:") {
    throw new Error("PUBLIC_BASE_URL must use HTTPS in production");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("PUBLIC_BASE_URL must use HTTP or HTTPS");
  }
  return url.origin;
}
