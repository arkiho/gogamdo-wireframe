import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import axios from "axios";

type Provider = "google" | "naver" | "kakao";
type OAuthProfile = { provider: Provider; providerId: string; email?: string; name?: string };

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
async function finishStaffOAuth(req: Request, res: Response, p: OAuthProfile) {
  const idKey = ID_KEY[p.provider];
  let user = await findUserByProviderId(p);
  if (!user && p.email) user = await db.getUserByEmail(p.email);

  if (user) {
    if (!user.isActive) { res.redirect(302, "/auth/login?error=inactive"); return; }
    await db.upsertUser({ ...user, [idKey]: p.providerId, name: p.name || user.name, loginMethod: p.provider, lastSignedIn: new Date() } as any);
  } else {
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

// state=client → 고객(clients_auth). 이메일 매칭·연결 또는 신규 가입 후 /my. (F-16)
async function finishClientOAuth(req: Request, res: Response, p: OAuthProfile) {
  const idKey = ID_KEY[p.provider];
  let client = await findClientByProviderId(p);
  if (!client && p.email) client = await db.getClientByEmail(p.email);

  if (client) {
    await db.updateClient(client.id, { [idKey]: p.providerId, loginMethod: p.provider, status: "active", emailVerified: "yes", lastLoginAt: new Date() } as any);
  } else {
    if (!p.email) { res.redirect(302, "/client/login?error=no_email"); return; }
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

  const { SignJWT } = await import("jose");
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");
  const token = await new SignJWT({ clientId: client.id, email: client.email, name: client.name, type: "client" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
  res.cookie("client_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
  res.redirect(302, "/my");
}

// state 로 분기해 올바른 계정 흐름으로 위임
async function dispatchOAuth(req: Request, res: Response, state: string | undefined, p: OAuthProfile) {
  if ((state || "").startsWith("client")) return finishClientOAuth(req, res, p);
  return finishStaffOAuth(req, res, p);
}

export function registerOAuthRoutes(app: Express) {
  // ========== Google OAuth Callback ==========
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string;
    if (!code) {
      res.status(400).json({ error: "Authorization code is required" });
      return;
    }

    try {
      // Exchange code for tokens
      const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
        code,
        client_id: ENV.googleClientId,
        client_secret: ENV.googleClientSecret,
        redirect_uri: ENV.googleRedirectUri || `${req.protocol}://${req.get("host")}/api/auth/google/callback`,
        grant_type: "authorization_code",
      });

      const { access_token } = tokenRes.data;

      // Get user info from Google
      const userInfoRes = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const { id: googleId, email, name } = userInfoRes.data;
      await dispatchOAuth(req, res, req.query.state as string | undefined, {
        provider: "google", providerId: googleId, email, name,
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

      await dispatchOAuth(req, res, state, { provider: "naver", providerId: naverId, email, name });
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

    try {
      const params = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: ENV.kakaoClientId,
        redirect_uri: ENV.kakaoRedirectUri || `${req.protocol}://${req.get("host")}/api/auth/kakao/callback`,
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

      await dispatchOAuth(req, res, req.query.state as string | undefined, { provider: "kakao", providerId: kakaoId, email, name });
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

  // ========== Email/Password Register ==========
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: "이름, 이메일, 비밀번호를 모두 입력하세요." });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: "비밀번호는 8자 이상이어야 합니다." });
      return;
    }

    try {
      // Check if user already exists
      const existing = await db.getUserByEmail(email);
      if (existing) {
        res.status(409).json({ error: "이미 등록된 이메일입니다." });
        return;
      }

      // Hash password and create user
      const passwordHash = await bcrypt.hash(password, 10);
      await db.upsertUser({
        email,
        name,
        passwordHash,
        loginMethod: "email",
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByEmail(email);
      if (!user) {
        res.status(500).json({ error: "회원가입에 실패했습니다." });
        return;
      }

      // Auto login after register
      const sessionToken = await sdk.createSessionToken(user.id, {
        name: user.name || "",
        email: user.email || "",
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department } });
    } catch (error: any) {
      console.error("[Auth] Register failed:", error);
      res.status(500).json({ error: "회원가입에 실패했습니다." });
    }
  });

  // ========== Logout ==========
  app.post("/api/auth/logout", (_req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME);
    res.json({ success: true });
  });
}
