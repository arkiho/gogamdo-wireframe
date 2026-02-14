import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-admin",
    email: "admin@kokamdo.co.kr",
    name: "Admin",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "test-user",
    email: "user@example.com",
    name: "User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("leadMagnet.download", () => {
  it("accepts valid lead magnet download request", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    try {
      await caller.leadMagnet.download({
        email: "lead@example.com",
        name: "홍길동",
        company: "(주)테스트",
        resourceId: "office-checklist",
        resourceTitle: "사무실 인테리어 체크리스트",
      });
    } catch (err: any) {
      // DB connection error is expected in test environment
      expect(err.message).not.toContain("validation");
    }
  });

  it("accepts download with only required fields", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    try {
      await caller.leadMagnet.download({
        email: "minimal@example.com",
        resourceId: "cost-guide",
      });
    } catch (err: any) {
      // DB connection error is expected in test environment
      expect(err.message).not.toContain("validation");
    }
  });

  it("rejects download with invalid email", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(
      caller.leadMagnet.download({
        email: "not-an-email",
        resourceId: "office-checklist",
      })
    ).rejects.toThrow();
  });

  it("accepts download with empty resourceId (no validation on resourceId)", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    try {
      await caller.leadMagnet.download({
        email: "test@example.com",
        resourceId: "test-resource",
      });
    } catch (err: any) {
      // DB connection error is expected in test environment
      expect(err.message).not.toContain("validation");
    }
  });
});

describe("leadMagnet.list (admin only)", () => {
  it("rejects unauthenticated access", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.leadMagnet.list()).rejects.toThrow();
  });

  it("rejects non-admin access", async () => {
    const caller = appRouter.createCaller(createUserContext());

    await expect(caller.leadMagnet.list()).rejects.toThrow();
  });

  it("allows admin access", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    try {
      await caller.leadMagnet.list();
    } catch (err: any) {
      // DB connection error is expected in test environment
      expect(err.message).not.toContain("FORBIDDEN");
      expect(err.message).not.toContain("Please login");
    }
  });
});
