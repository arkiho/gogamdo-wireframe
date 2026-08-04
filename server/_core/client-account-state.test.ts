import { beforeEach, describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({
  client: null as any,
  updateClient: vi.fn(),
  activatePending: vi.fn(),
  getClientByEmail: vi.fn(),
}));

vi.mock("../db", () => ({
  getClientByVerifyToken: vi.fn(async () => fixture.client),
  getClientByGoogleId: vi.fn(async () => fixture.client),
  getClientByNaverId: vi.fn(async () => null),
  getClientByKakaoId: vi.fn(async () => null),
  getClientByEmail: fixture.getClientByEmail,
  updateClient: fixture.updateClient,
  activatePendingClientByVerifyToken: fixture.activatePending,
}));

vi.mock("./sdk", () => ({ sdk: { createSessionToken: vi.fn() } }));
vi.mock("./sessionSecurity", () => ({ signClientSession: vi.fn() }));

import { activatePendingClientByVerificationToken } from "./clientVerification";
import { finishClientOAuth } from "./oauth";

describe("client account activation boundaries", () => {
  beforeEach(() => {
    fixture.updateClient.mockReset();
    fixture.activatePending.mockReset();
    fixture.getClientByEmail.mockReset();
    fixture.getClientByEmail.mockImplementation(async () => fixture.client);
    fixture.client = null;
  });

  it("activates only a still-pending email verification", async () => {
    fixture.client = {
      id: 1,
      status: "pending",
      emailVerified: "no",
      emailVerifyExpires: new Date(Date.now() + 60_000),
    };
    fixture.activatePending.mockResolvedValue(true);
    await expect(activatePendingClientByVerificationToken("pending-token")).resolves.toBe(true);
    expect(fixture.activatePending).toHaveBeenCalledWith("pending-token");
  });

  it.each(["suspended", "active"])("does not reactivate a %s account through email verification", async status => {
    fixture.client = {
      id: 2,
      status,
      emailVerified: "no",
      emailVerifyExpires: new Date(Date.now() + 60_000),
    };
    fixture.activatePending.mockResolvedValue(false);
    await expect(activatePendingClientByVerificationToken("retained-token")).resolves.toBe(false);
    expect(fixture.updateClient).not.toHaveBeenCalled();
  });

  it("does not reactivate or issue a session to a suspended OAuth client", async () => {
    fixture.client = {
      id: 3,
      email: "suspended@example.com",
      name: "Suspended",
      status: "suspended",
    };
    const res = { redirect: vi.fn(), cookie: vi.fn(), status: vi.fn(), json: vi.fn() } as any;
    await finishClientOAuth({} as any, res, {
      provider: "google",
      providerId: "google-suspended",
      email: fixture.client.email,
      emailVerified: true,
      name: fixture.client.name,
    });
    expect(res.redirect).toHaveBeenCalledWith(302, "/client/login?error=account_suspended");
    expect(res.cookie).not.toHaveBeenCalled();
    expect(fixture.updateClient).not.toHaveBeenCalled();
  });

  it("routes a successful clients_auth OAuth session to the clients_auth dashboard", async () => {
    fixture.client = {
      id: 4,
      email: "active@example.com",
      name: "Active",
      status: "active",
    };
    const res = { redirect: vi.fn(), cookie: vi.fn(), status: vi.fn(), json: vi.fn() } as any;
    await finishClientOAuth({} as any, res, {
      provider: "google",
      providerId: "google-active",
      email: fixture.client.email,
      emailVerified: true,
      name: fixture.client.name,
    });
    expect(res.cookie).toHaveBeenCalledWith("client_token", undefined, expect.objectContaining({ httpOnly: true }));
    expect(res.redirect).toHaveBeenCalledWith(302, "/client/dashboard");
  });

  it.each([false, undefined])("does not link a Kakao identity by email when verification is %s", async emailVerified => {
    fixture.client = { id: 5, email: "victim@example.com", name: "Victim", status: "active" };
    const res = { redirect: vi.fn(), cookie: vi.fn(), status: vi.fn(), json: vi.fn() } as any;
    await finishClientOAuth({} as any, res, {
      provider: "kakao",
      providerId: "attacker-kakao-id",
      email: fixture.client.email,
      emailVerified: emailVerified as boolean,
      name: "Attacker",
    });
    expect(fixture.getClientByEmail).not.toHaveBeenCalled();
    expect(fixture.updateClient).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(302, "/client/login?error=email_unverified");
  });
});
