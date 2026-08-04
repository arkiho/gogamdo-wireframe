import { COOKIE_NAME } from "@shared/const";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getUserById: vi.fn() }));
vi.mock("./_core/sessionSecurity", () => ({
  verifyStaffSession: vi.fn(),
  signStaffSession: vi.fn(),
}));

import * as db from "./db";
import { sdk } from "./_core/sdk";
import { verifyStaffSession } from "./_core/sessionSecurity";

const request = { headers: { cookie: `${COOKIE_NAME}=valid` } } as any;

describe("staff request authentication", () => {
  beforeEach(() => {
    vi.mocked(verifyStaffSession).mockReset();
    vi.mocked(db.getUserById).mockReset();
    vi.mocked(verifyStaffSession).mockResolvedValue({
      userId: 7,
      name: "staff",
      email: "staff@example.com",
      type: "staff",
      iss: "kokamdo",
      aud: "kokamdo-staff",
      iat: 1,
      exp: 9999999999,
    });
  });

  it("rejects an inactive staff account even when its session is otherwise valid", async () => {
    vi.mocked(db.getUserById).mockResolvedValue({ id: 7, isActive: false } as never);

    await expect(sdk.authenticateRequest(request)).rejects.toThrow();
  });

  it("allows an active staff account with a valid session", async () => {
    const user = { id: 7, isActive: true };
    vi.mocked(db.getUserById).mockResolvedValue(user as never);

    await expect(sdk.authenticateRequest(request)).resolves.toEqual(user);
  });
});
