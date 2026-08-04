import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { signClientSession } from "./sessionSecurity";
import { getTrustedPublicOrigin } from "./publicOrigin";
import bcrypt from "bcryptjs";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { parse as parseCookieHeader } from "cookie";
import axios from "axios";

type Provider = "google" | "naver" | "kakao";
type AccountKind = "staff" | "client";
type OAuthProfile = { provider: Provider; providerId: string; email?: string; emailVerified: boolean; name?: string };

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

function oauthStateCookieName(provider: Provider) {
  return `oauth_state_${provider}`;
}

function oauthCallbackUri(provider: Provider) {
  const configured = provider === "google" ? ENV.googleRedirectUri
    : provider === "naver" ? ENV.naverRedirectUri
      : ENV.kakaoRedirectUri;
  return configured || `${getTrustedPublicOrigin()}/api/auth/${provider}/callback`;
}

function oauthCookieOptions(req: Request) {
  return { ...getSessionCookieOptions(req), sameSite: "lax" as const, maxAge: OAUTH_STATE_TTL_MS };
}

export function createOAuthState(provider: Provider, accountKind: AccountKind) {
  const state = randomBytes(32).toString("base64url");
  const codeVerifier = provider === "google" ? randomBytes(48).toString("base64url") : undefined;
  const value = Buffer.from(JSON.stringify({ state, provider, accountKind, createdAt: Date.now(), codeVerifier })).toString("base64url");
  return { state, value, codeVerifier };
}

export function consumeOAuthState(req: Request, res: Response, provider: Provider, returnedState: string | undefined) {
  const cookieName = oauthStateCookieName(provider);
  const cookieOptions = oauthCookieOptions(req);
  const raw = parseCookieHeader(req.headers.cookie || "")[cookieName];
  const { maxAge: _maxAge, ...clearCookieOptions } = cookieOptions;
  res.clearCookie(cookieName, clearCookieOptions);
  if (!raw || !returnedState) return null;
  try {
    const record = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    const expected = Buffer.from(String(record.state));
    const actual = Buffer.from(returnedState);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    if (record.provider !== provider || !["staff", "client"].includes(record.accountKind)) return null;
    if (!Number.isFinite(record.createdAt) || Date.now() - record.createdAt > OAUTH_STATE_TTL_MS) return null;
    return record as { state: string; provider: Provider; accountKind: AccountKind; createdAt: number; codeVerifier?: string };
  } catch {
    return null;
  }
}

const MASTER_EMAIL = (ENV.masterEmail || "henrykkim@kokamdo.co.kr").toLowerCase();
const ID_KEY: Record<Provider, "googleId" | "naverId" | "kakaoId"> = {
  google: "googleId", naver: "naverId", kakao: "kakaoId",
};

async function findUserByProviderId(p: OAuthProfile) {
  if (p.provider === "google") return db.getUserByGoogleId(p.providerId);
  if (p.provider === "naver") return db.getUserByNaverId(p.providerId);
  return db.getUserByKakaoId(p.providerId);
}
async function findClientByProviderId(p: OAuthProfile) {
  if (p.provider === "google") return db.getClientByGoogleId(p.providerId);
  if (p.provider === "naver") return db.getClientByNaverId(p.providerId);
  return db.getClientByKakaoId(p.providerId);
}

// state=staff → 직원(users). 구글은 초대(staff_invitations) 이메일일 때만 신규 활성화. (F-15)
export async function finishStaffOAuth(req: Request, res: Response, p: OAuthProfile) {
  const idKey = ID_KEY[p.provider];
  let user = await findUserByProviderId(p);
  if (!user && p.email && p.emailVerified) user = await db.getUserByEmail(p.email);

  if (user) {
    if (!user.isActive) { res.redirect(302, "/auth/login?error=inactive"); return; }
    await db.upsertUser({ ...user, [idKey]: p.providerId, name: p.name || user.name, loginMethod: p.provider, lastSignedIn: new Date() } as any);
  } else {
    if (!p.email || !p.emailVerified) { res.redirect(302, "/auth/login?error=email_unverified"); return; }
    const isMaster = !!p.email && p.email.toLowerCase() === MASTER_EMAIL;
    const inv = p.email ? await db.getPendingStaffInvitationByEmail(p.email) : null;
    if (!inv && !isMaster) { res.redirect(302, "/auth/login?error=no_invite"); return; }
    await db.upsertUser({
      [idKey]: p.providerId,
      email: p.email,
      name: p.name || p.email?.split("@")[0] || "직원",
      loginMethod: p.provider,
      department: inv?.department ?? undefined,
      opsRole: inv?.opsRole ?? undefined,
      lastSignedIn: new Date(),
    } as any);
    user = await findUserByProviderId(p);
    if (user && inv) await db.acceptStaffInvitation(inv.token, user.id);
  }
  if (!user) { res.status(500).json({ error: "Failed to create user" }); return; }

  const sessionToken = await sdk.createSessionToken(user.id, { name: user.name || "", email: user.email || "" });
  res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
  const landing = (user.role === "admin" || user.role === "master") ? "/admin" : "/ops";
  res.redirect(302, landing);
}

// state=client → 고객(clients_auth). 이메일 매칭·연결 또는 신규 가입 후 고객 대시보드. (F-16)
export async function finishClientOAuth(req: Request, res: Response, p: OAuthProfile) {
  const idKey = ID_KEY[p.provider];
  let client = await findClientByProviderId(p);
  if (!client && p.email && p.emailVerified) client = await db.getClientByEmail(p.email);

  if (client) {
    if (client.status !== "active" && client.status !== "pending") {
      res.redirect(302, "/client/login?error=account_suspended");
      return;
    }
    await db.updateClient(client.id, { [idKey]: p.providerId, loginMethod: p.provider, status: "active", emailVerified: "yes", lastLoginAt: new Date() } as any);
  } else {
    if (!p.email || !p.emailVerified) { res.redirect(302, "/client/login?error=email_unverified"); return; }
    const randomHash = await bcrypt.hash(randomBytes(24).toString("hex"), 10);
    await db.createClient({
      email: p.email,
      name: p.name || p.email.split("@")[0],
      passwordHash: randomHash,
      [idKey]: p.providerId,
      loginMethod: p.provider,
      status: "active",
      emailVerified: "yes",
    } as any);
    client = await db.getClientByEmail(p.email);
  }
  if (!client) { res.status(500).json({ error: "Failed to create client" }); return; }

  const token = await signClientSession({
    clientId: client.id,
    email: client.email,
    name: client.name,
  });
  res.cookie("client_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
  res.redirect(302, "/client/dashboard");
}

// state 로 분기해 올바른 계정 흐름으로 위임
async function dispatchOAuth(req: Request, res: Response, accountKind: AccountKind, p: OAuthProfile) {
  if (accountKind === "client") return finishClientOAuth(req, res, p);
  return finishStaffOAuth(req, res, p);
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/auth/:provider/start", (req: Request, res: Response) => {
    const provider = req.params.provider as Provider;
    const accountKind = req.query.accountKind as AccountKind;
    if (!(["google", "naver", "kakao"] as string[]).includes(provider) || !(["staff", "client"] as string[]).includes(accountKind)) {
      res.status(400).json({ error: "Invalid OAuth request" });
      return;
    }
    const clientId = provider === "google" ? ENV.googleClientId : provider === "naver" ? ENV.naverClientId : ENV.kakaoClientId;
    if (!clientId) {
      res.status(503).json({ error: "OAuth provider is not configured" });
      return;
    }
    const record = createOAuthState(provider, accountKind);
    res.cookie(oauthStateCookieName(provider), record.value, oauthCookieOptions(req));
    const redirectUri = oauthCallbackUri(provider);
    let url: URL;
    if (provider === "google") {
      url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.searchParams.set("scope", "openid profile email");
      url.searchParams.set("access_type", "offline");
      url.searchParams.set("prompt", "select_account");
      url.searchParams.set("code_challenge", createHash("sha256").update(record.codeVerifier!).digest("base64url"));
      url.searchParams.set("code_challenge_method", "S256");
    } else if (provider === "naver") {
      url = new URL("https://nid.naver.com/oauth2.0/authorize");
    } else {
      url = new URL("https://kauth.kakao.com/oauth/authorize");
    }
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", record.state);
    res.redirect(302, url.toString());
  });

  // ========== Google OAuth Callback ==========
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string;
    if (!code) {
      res.status(400).json({ error: "Authorization code is required" });
      return;
    }
    const oauthState = consumeOAuthState(req, res, "google", req.query.state as string | undefined);
    if (!oauthState) {
      res.status(400).json({ error: "Invalid or expired OAuth state" });
      return;
    }

    try {
      // Exchange code for tokens
      const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
        code,
        client_id: ENV.googleClientId,
        client_secret: ENV.googleClientSecret,
        redirect_uri: oauthCallbackUri("google"),
        grant_type: "authorization_code",
        code_verifier: oauthState.codeVerifier,
      });

      const { access_token } = tokenRes.data;

      // Get user info from Google
      const userInfoRes = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const { id: googleId, email, name, verified_email } = userInfoRes.data;
      await dispatchOAuth(req, res, oauthState.accountKind, {
        provider: "google", providerId: googleId, email, emailVerified: verified_email === true, name,
      });
    } catch (error: any) {
      console.error("[Google OAuth] Failed:", error.response?.data || error.message);
      res.status(500).json({ error: "Google login failed" });
    }
  });

  // ========== Naver OAuth Callback ==========
  app.get("/api/auth/naver/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const state = req.query.state as string;
    if (!code) {
      res.status(400).json({ error: "Authorization code is required" });
      return;
    }
    const oauthState = consumeOAuthState(req, res, "naver", state);
    if (!oauthState) {
      res.status(400).json({ error: "Invalid or expired OAuth state" });
      return;
    }

    try {
      const tokenRes = await axios.post("https://nid.naver.com/oauth2.0/token", null, {
        params: {
          grant_type: "authorization_code",
          client_id: ENV.naverClientId,
          client_secret: ENV.naverClientSecret,
          code,
          state: state || "",
        },
      });

      const { access_token } = tokenRes.data;

      const userInfoRes = await axios.get("https://openapi.naver.com/v1/nid/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const profile = userInfoRes.data.response;
      const naverId = profile.id as string;
      const email = profile.email as string | undefined;
      const name = (profile.name || profile.nickname) as string | undefined;
      const emailVerified = profile.email_verified === true;

      await dispatchOAuth(req, res, oauthState.accountKind, { provider: "naver", providerId: naverId, email, emailVerified, name });
    } catch (error: any) {
      console.error("[Naver OAuth] Failed:", error.response?.data || error.message);
      res.status(500).json({ error: "Naver login failed" });
    }
  });

  // ========== Kakao OAuth Callback ==========
  app.get("/api/auth/kakao/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string;
    if (!code) {
      res.status(400).json({ error: "Authorization code is required" });
      return;
    }
    const oauthState = consumeOAuthState(req, res, "kakao", req.query.state as string | undefined);
    if (!oauthState) {
      res.status(400).json({ error: "Invalid or expired OAuth state" });
      return;
    }

    try {
      const params = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: ENV.kakaoClientId,
        redirect_uri: oauthCallbackUri("kakao"),
        code,
      });
      if (ENV.kakaoClientSecret) params.append("client_secret", ENV.kakaoClientSecret);

      const tokenRes = await axios.post("https://kauth.kakao.com/oauth/token", params.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const { access_token } = tokenRes.data;

      const userInfoRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const kakaoId = String(userInfoRes.data.id);
      const account = userInfoRes.data.kakao_account || {};
      const email = account.email as string | undefined;
      const name = account.profile?.nickname as string | undefined;
      const emailVerified = account.is_email_valid === true && account.is_email_verified === true;

      await dispatchOAuth(req, res, oauthState.accountKind, { provider: "kakao", providerId: kakaoId, email, emailVerified, name });
    } catch (error: any) {
      console.error("[Kakao OAuth] Failed:", error.response?.data || error.message);
      res.status(500).json({ error: "Kakao login failed" });
    }
  });

  // ========== Email/Password Login ==========
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "이메일과 비밀번호를 입력하세요." });
      return;
    }

    try {
      const user = await db.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        res.status(401).json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." });
        return;
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." });
        return;
      }

      // Update last sign in
      await db.upsertUser({ ...user, lastSignedIn: new Date() });

      // Create session
      const sessionToken = await sdk.createSessionToken(user.id, {
        name: user.name || "",
        email: user.email || "",
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department } });
    } catch (error: any) {
      console.error("[Auth] Login failed:", error);
      res.status(500).json({ error: "로그인에 실패했습니다." });
    }
  });

  // ========== Logout ==========
  app.post("/api/auth/logout", (_req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME);
    res.json({ success: true });
  });
}
