import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";
import bcrypt from "bcryptjs";
import axios from "axios";

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

      const { id: googleId, email, name, picture } = userInfoRes.data;

      // Find or create user
      let user = await db.getUserByGoogleId(googleId);
      if (!user && email) {
        user = await db.getUserByEmail(email);
      }

      if (user) {
        // Update existing user with Google ID
        await db.upsertUser({
          ...user,
          googleId,
          name: name || user.name,
          loginMethod: "google",
          lastSignedIn: new Date(),
        });
      } else {
        // Create new user
        await db.upsertUser({
          googleId,
          email,
          name: name || email?.split("@")[0] || "User",
          loginMethod: "google",
          lastSignedIn: new Date(),
        });
        user = await db.getUserByGoogleId(googleId);
      }

      if (!user) {
        res.status(500).json({ error: "Failed to create user" });
        return;
      }

      // Create session
      const sessionToken = await sdk.createSessionToken(user.id, {
        name: user.name || "",
        email: user.email || "",
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
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

      let user = await db.getUserByNaverId(naverId);
      if (!user && email) user = await db.getUserByEmail(email);

      if (user) {
        await db.upsertUser({ ...user, naverId, name: name || user.name, loginMethod: "naver", lastSignedIn: new Date() });
      } else {
        await db.upsertUser({ naverId, email, name: name || email?.split("@")[0] || "User", loginMethod: "naver", lastSignedIn: new Date() });
        user = await db.getUserByNaverId(naverId);
      }

      if (!user) {
        res.status(500).json({ error: "Failed to create user" });
        return;
      }

      const sessionToken = await sdk.createSessionToken(user.id, {
        name: user.name || "",
        email: user.email || "",
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
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

      let user = await db.getUserByKakaoId(kakaoId);
      if (!user && email) user = await db.getUserByEmail(email);

      if (user) {
        await db.upsertUser({ ...user, kakaoId, name: name || user.name, loginMethod: "kakao", lastSignedIn: new Date() });
      } else {
        await db.upsertUser({ kakaoId, email, name: name || (email ? email.split("@")[0] : "User"), loginMethod: "kakao", lastSignedIn: new Date() });
        user = await db.getUserByKakaoId(kakaoId);
      }

      if (!user) {
        res.status(500).json({ error: "Failed to create user" });
        return;
      }

      const sessionToken = await sdk.createSessionToken(user.id, {
        name: user.name || "",
        email: user.email || "",
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
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
      res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
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
      res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
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
