import { describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  getInvitation: vi.fn(),
  upsertUser: vi.fn(),
}));

vi.mock("../db", () => ({
  getUserByGoogleId: vi.fn(async () => null),
  getUserByNaverId: vi.fn(async () => null),
  getUserByKakaoId: vi.fn(async () => null),
  getUserByEmail: fixture.getUserByEmail,
  getPendingStaffInvitationByEmail: fixture.getInvitation,
  upsertUser: fixture.upsertUser,
}));
vi.mock("./sdk", () => ({ sdk: { createSessionToken: vi.fn() } }));
vi.mock("./sessionSecurity", () => ({ signClientSession: vi.fn() }));

import { finishStaffOAuth } from "./oauth";

describe("staff OAuth verified-email boundary", () => {
  it.each([false, undefined])("does not link, invite-match, or create from an unverified Kakao email (%s)", async emailVerified => {
    fixture.getUserByEmail.mockReset();
    fixture.getInvitation.mockReset();
    fixture.upsertUser.mockReset();
    const res = { redirect: vi.fn(), cookie: vi.fn(), status: vi.fn(), json: vi.fn() } as any;

    await finishStaffOAuth({} as any, res, {
      provider: "kakao",
      providerId: "attacker-kakao-id",
      email: "staff-victim@kokamdo.co.kr",
      emailVerified: emailVerified as boolean,
      name: "Attacker",
    });

    expect(fixture.getUserByEmail).not.toHaveBeenCalled();
    expect(fixture.getInvitation).not.toHaveBeenCalled();
    expect(fixture.upsertUser).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(302, "/auth/login?error=email_unverified");
  });
});
