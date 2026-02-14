import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Admin context helper
function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@kokamdo.co.kr",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// Public (unauthenticated) context helper
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

// Regular user context helper
function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@test.com",
      name: "Regular User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Announcement Banner System", () => {
  it("public user can fetch active announcements", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.announcement.active();
    expect(Array.isArray(result)).toBe(true);
  });

  it("admin can create an announcement", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.announcement.create({
      title: "테스트 공지",
      message: "테스트 공지사항입니다",
      linkUrl: "https://kokamdo.co.kr/contact",
      linkText: "자세히 보기",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("admin can list all announcements", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.announcement.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("regular user cannot create an announcement", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.announcement.create({
        title: "해킹",
        message: "해킹 시도",
      })
    ).rejects.toThrow();
  });

  it("admin can toggle announcement active status", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create first
    await caller.announcement.create({
      title: "토글 테스트",
      message: "토글 테스트 메시지",
    });

    // Get the created announcement id from list
    const list = await caller.announcement.list();
    const target = list.find((a: any) => a.title === "토글 테스트");
    expect(target).toBeDefined();

    // Toggle off via update
    const toggled = await caller.announcement.update({
      id: target!.id,
      active: "no",
    });

    expect(toggled.success).toBe(true);
  });

  it("admin can delete an announcement", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create first
    await caller.announcement.create({
      title: "삭제 테스트",
      message: "삭제 테스트 메시지",
    });

    // Get the created announcement id from list
    const list = await caller.announcement.list();
    const target = list.find((a: any) => a.title === "삭제 테스트");
    expect(target).toBeDefined();

    // Delete
    const deleted = await caller.announcement.delete({ id: target!.id });
    expect(deleted.success).toBe(true);
  });
});
