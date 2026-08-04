import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

vi.mock("../db", () => ({}));
vi.mock("./sdk", () => ({ sdk: {} }));

import { consumeOAuthState, createOAuthState } from "./oauth";

function requestWithCookie(name: string, value: string) {
  return {
    headers: { cookie: `${name}=${encodeURIComponent(value)}` },
    protocol: "https",
  } as any;
}

function responseDouble() {
  return { clearCookie: vi.fn() } as any;
}

describe("OAuth CSRF and staff registration boundaries", () => {
  it("creates unpredictable browser-bound state and Google PKCE material", () => {
    const first = createOAuthState("google", "client");
    const second = createOAuthState("google", "client");
    expect(first.state).not.toBe(second.state);
    expect(first.state.length).toBeGreaterThanOrEqual(40);
    expect(first.codeVerifier?.length).toBeGreaterThanOrEqual(43);
  });

  it("accepts only the exact provider state cookie and clears it on consumption", () => {
    const issued = createOAuthState("google", "client");
    const res = responseDouble();
    const accepted = consumeOAuthState(requestWithCookie("oauth_state_google", issued.value), res, "google", issued.state);
    expect(accepted).toMatchObject({ provider: "google", accountKind: "client", state: issued.state });
    expect(res.clearCookie).toHaveBeenCalledWith("oauth_state_google", expect.objectContaining({ httpOnly: true, sameSite: "lax" }));

    expect(consumeOAuthState(requestWithCookie("oauth_state_google", issued.value), responseDouble(), "google", "attacker-state")).toBeNull();
    expect(consumeOAuthState(requestWithCookie("oauth_state_google", issued.value), responseDouble(), "naver", issued.state)).toBeNull();
  });

  it("has no public staff registration route and uses server-initiated OAuth URLs", () => {
    const serverSource = readFileSync(path.join(process.cwd(), "server/_core/oauth.ts"), "utf8");
    const clientSource = readFileSync(path.join(process.cwd(), "client/src/const.ts"), "utf8");
    expect(serverSource).not.toContain('app.post("/api/auth/register"');
    expect(serverSource).toContain('app.get("/api/auth/:provider/start"');
    expect(serverSource).toContain("code_challenge_method");
    expect(serverSource).toContain("account.is_email_valid === true && account.is_email_verified === true");
    expect(serverSource).toContain("p.email && p.emailVerified");
    expect(clientSource).toContain("/api/auth/${provider}/start");
    expect(clientSource).not.toContain("accounts.google.com");
  });
});
