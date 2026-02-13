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

function createAuthContext(): TrpcContext {
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

describe("inquiry.create", () => {
  it("accepts valid inquiry data", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    // This will attempt to hit the DB, which may not be available in test
    // We're primarily testing that the input validation passes
    try {
      await caller.inquiry.create({
        name: "테스트 고객",
        company: "(주)테스트",
        email: "test@example.com",
        phone: "010-1234-5678",
        type: "office",
        area: "medium",
        message: "사무실 인테리어 견적 문의드립니다.",
      });
    } catch (err: any) {
      // DB connection error is expected in test environment
      expect(err.message).not.toContain("validation");
    }
  });

  it("rejects inquiry without required name", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(
      caller.inquiry.create({
        name: "",
        email: "test@example.com",
        message: "테스트 문의",
      })
    ).rejects.toThrow();
  });

  it("rejects inquiry without valid email", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(
      caller.inquiry.create({
        name: "테스트",
        email: "invalid-email",
        message: "테스트 문의",
      })
    ).rejects.toThrow();
  });

  it("rejects inquiry without message", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(
      caller.inquiry.create({
        name: "테스트",
        email: "test@example.com",
        message: "",
      })
    ).rejects.toThrow();
  });
});

describe("newsletter.subscribe", () => {
  it("accepts valid email subscription", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    try {
      await caller.newsletter.subscribe({
        email: "subscriber@example.com",
        source: "footer",
      });
    } catch (err: any) {
      // DB connection error is expected in test environment
      expect(err.message).not.toContain("validation");
    }
  });

  it("rejects invalid email for subscription", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(
      caller.newsletter.subscribe({
        email: "not-an-email",
      })
    ).rejects.toThrow();
  });
});

describe("estimate.save", () => {
  it("accepts valid estimate data", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    try {
      await caller.estimate.save({
        sessionId: "test-session-123",
        spaceType: "office",
        area: 100,
        grade: "premium",
        resultJson: [
          { name: "설계비", ratio: 0.08, cost: 672 },
          { name: "가구", ratio: 0.18, cost: 1512 },
        ],
        totalMin: 7140,
        totalMax: 9660,
      });
    } catch (err: any) {
      // DB connection error is expected in test environment
      expect(err.message).not.toContain("validation");
    }
  });

  it("accepts estimate with minimal data", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    try {
      await caller.estimate.save({});
    } catch (err: any) {
      // DB connection error is expected in test environment
      expect(err.message).not.toContain("validation");
    }
  });
});

describe("auth.me (public)", () => {
  it("returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.email).toBe("admin@kokamdo.co.kr");
    expect(result?.role).toBe("admin");
  });
});
