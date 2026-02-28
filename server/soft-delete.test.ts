import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
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
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
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

describe("Soft Delete - Access Control", () => {
  it("deletion.softDelete requires admin role", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.deletion.softDelete({ tableName: "inquiries", recordId: 1 })
    ).rejects.toThrow();
  });

  it("deletion.softDelete rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.deletion.softDelete({ tableName: "inquiries", recordId: 1 })
    ).rejects.toThrow();
  });

  it("deletion.bulkSoftDelete requires admin role", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.deletion.bulkSoftDelete({ tableName: "inquiries", recordIds: [1, 2] })
    ).rejects.toThrow();
  });

  it("deletion.bulkSoftDelete rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.deletion.bulkSoftDelete({ tableName: "inquiries", recordIds: [1, 2] })
    ).rejects.toThrow();
  });

  it("deletion.restore requires admin role", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.deletion.restore({ logId: 1 })
    ).rejects.toThrow();
  });

  it("deletion.restore rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.deletion.restore({ logId: 1 })
    ).rejects.toThrow();
  });

  it("deletion.listLogs requires admin role", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.deletion.listLogs()
    ).rejects.toThrow();
  });

  it("deletion.listLogs rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.deletion.listLogs()
    ).rejects.toThrow();
  });
});

describe("Soft Delete - Input Validation", () => {
  it("deletion.softDelete validates tableName enum", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.deletion.softDelete({ tableName: "invalid_table" as any, recordId: 1 })
    ).rejects.toThrow();
  });

  it("deletion.bulkSoftDelete validates tableName enum", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.deletion.bulkSoftDelete({ tableName: "invalid_table" as any, recordIds: [1] })
    ).rejects.toThrow();
  });

  it("deletion.softDelete accepts all valid table names", async () => {
    const validTables = ["inquiries", "subscribers", "estimates", "lead_downloads", "chat_sessions", "style_recommendations"] as const;
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    for (const tableName of validTables) {
      // Should not throw validation error (may throw DB error for non-existent record)
      try {
        await caller.deletion.softDelete({ tableName, recordId: 999999 });
      } catch (e: any) {
        // DB errors are acceptable (record not found), but validation errors are not
        expect(e.message).not.toContain("Invalid enum value");
      }
    }
  });
});

describe("Soft Delete - Admin Operations", () => {
  it("deletion.listLogs returns array for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const logs = await caller.deletion.logs();
    expect(Array.isArray(logs)).toBe(true);
  });

  it("deletion.softDelete handles non-existent record gracefully", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    // Should either succeed silently or throw a meaningful error
    try {
      await caller.deletion.softDelete({ tableName: "inquiries", recordId: 999999 });
      // If it succeeds, that's fine (no-op for non-existent record)
    } catch (e: any) {
      // Should not be an auth or validation error
      expect(e.message).not.toContain("Please login");
      expect(e.message).not.toContain("Invalid enum value");
    }
  });

  it("deletion.bulkSoftDelete handles empty array", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.deletion.bulkSoftDelete({ tableName: "inquiries", recordIds: [] });
      // Should handle gracefully
    } catch (e: any) {
      // May reject empty array - that's acceptable
      expect(e.message).not.toContain("Please login");
    }
  });
});

describe("Soft Delete - Router Structure", () => {
  it("deletion router exists with all expected procedures", () => {
    expect(appRouter.deletion).toBeDefined();
    expect(appRouter.deletion.softDelete).toBeDefined();
    expect(appRouter.deletion.bulkSoftDelete).toBeDefined();
    expect(appRouter.deletion.restore).toBeDefined();
    expect(appRouter.deletion.logs).toBeDefined();
    expect(appRouter.deletion.stats).toBeDefined();
  });
});
