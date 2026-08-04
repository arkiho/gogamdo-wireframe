import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { signStaffSession, verifyStaffSession } from "./sessionSecurity";

export type AuthenticatedUser = User;

export type SessionPayload = {
  userId: number;
  email: string;
  name: string;
};

class SDKServer {
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) return new Map<string, string>();
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }


  async createSessionToken(
    userId: number,
    options: { expiresInMs?: number; name?: string; email?: string } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    return signStaffSession({
      userId,
      name: options.name || "",
      email: options.email || "",
    }, process.env.JWT_SECRET, expirationSeconds);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<SessionPayload | null> {
    if (!cookieValue) return null;

    try {
      const payload = await verifyStaffSession(cookieValue);

      return {
        userId: payload.userId,
        name: payload.name,
        email: payload.email,
      };
    } catch {
      // Invalid or expired session token — expected for unauthenticated users
      return null;
    }
  }

  async authenticateRequest(req: Request): Promise<AuthenticatedUser> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const user = await db.getUserById(session.userId);

    if (!user || !user.isActive) {
      throw ForbiddenError("User not found or inactive");
    }

    return user;
  }
}

export const sdk = new SDKServer();
