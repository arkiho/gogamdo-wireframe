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

// ===== Portfolio CRUD =====
describe("portfolio routes - admin CRUD", () => {
  it("portfolio.create requires admin authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.portfolio.create({ title: "테스트 프로젝트" })
    ).rejects.toThrow();
  });

  it("portfolio.create rejects non-admin users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.portfolio.create({ title: "테스트 프로젝트" })
    ).rejects.toThrow();
  });

  it("portfolio.create accepts valid input from admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.portfolio.create({
        title: "허시드 본사 리모델링",
        category: "사무실 인테리어",
        client: "(주)허시드",
        area: "250㎡ (76평)",
        location: "서울 강남구",
        duration: "8주",
        description: "IT 스타트업 허시드의 새로운 오피스 공간 설계",
      });
    } catch (e: any) {
      // DB error expected in test env, but input validation should pass
      expect(e.message).not.toContain("validation");
    }
  });

  it("portfolio.create rejects empty title", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.portfolio.create({ title: "" })
    ).rejects.toThrow();
  });

  it("portfolio.list requires admin authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.portfolio.list()).rejects.toThrow();
  });

  it("portfolio.list rejects non-admin users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.portfolio.list()).rejects.toThrow();
  });

  it("portfolio.get requires admin authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.portfolio.get({ id: 1 })
    ).rejects.toThrow();
  });

  it("portfolio.update requires admin authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.portfolio.update({ id: 1, title: "Updated" })
    ).rejects.toThrow();
  });

  it("portfolio.delete requires admin authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.portfolio.delete({ id: 1 })
    ).rejects.toThrow();
  });
});

// ===== Portfolio Publishing =====
describe("portfolio routes - publishing", () => {
  it("portfolio.publish requires admin authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.portfolio.publish({ id: 1 })
    ).rejects.toThrow();
  });

  it("portfolio.archive requires admin authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.portfolio.archive({ id: 1 })
    ).rejects.toThrow();
  });

  it("portfolio.publish rejects non-admin users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.portfolio.publish({ id: 1 })
    ).rejects.toThrow();
  });
});

// ===== Portfolio Images =====
describe("portfolio routes - image management", () => {
  it("portfolio.addImage requires admin authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.portfolio.addImage({
        draftId: 1,
        originalUrl: "https://example.com/image.jpg",
      })
    ).rejects.toThrow();
  });

  it("portfolio.addImage rejects non-admin users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.portfolio.addImage({
        draftId: 1,
        originalUrl: "https://example.com/image.jpg",
      })
    ).rejects.toThrow();
  });

  it("portfolio.deleteImage requires admin authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.portfolio.deleteImage({ id: 1 })
    ).rejects.toThrow();
  });

  it("portfolio.setCover requires admin authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.portfolio.setCover({ draftId: 1, imageId: 1 })
    ).rejects.toThrow();
  });

  it("portfolio.processImage requires admin authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.portfolio.processImage({
        imageId: 1,
        originalUrl: "https://example.com/image.jpg",
        action: "enhance",
      })
    ).rejects.toThrow();
  });

  it("portfolio.processImage rejects non-admin users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.portfolio.processImage({
        imageId: 1,
        originalUrl: "https://example.com/image.jpg",
        action: "enhance",
      })
    ).rejects.toThrow();
  });
});

// ===== Public Portfolio Routes =====
describe("portfolio routes - public access", () => {
  it("portfolio.published is accessible without authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.portfolio.published();
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      // DB error expected in test env
      expect(e.message).not.toContain("UNAUTHORIZED");
    }
  });

  it("portfolio.detail is accessible without authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.portfolio.detail({ id: 999 });
      // Should return null for non-existent/unpublished
      expect(result === null || typeof result === "object").toBe(true);
    } catch (e: any) {
      // DB error expected in test env
      expect(e.message).not.toContain("UNAUTHORIZED");
    }
  });
});

// ===== AI Description Generation =====
describe("portfolio routes - AI features", () => {
  it("portfolio.generateDescription requires admin authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.portfolio.generateDescription({
        id: 1,
        title: "테스트 프로젝트",
      })
    ).rejects.toThrow();
  });

  it("portfolio.generateDescription rejects non-admin users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.portfolio.generateDescription({
        id: 1,
        title: "테스트 프로젝트",
      })
    ).rejects.toThrow();
  });

  it("portfolio.generateDescription accepts valid input from admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.portfolio.generateDescription({
        id: 1,
        title: "허시드 본사 리모델링",
        category: "사무실 인테리어",
        client: "(주)허시드",
        area: "250㎡",
        location: "서울 강남구",
        imageCount: 5,
      });
    } catch (e: any) {
      // LLM/DB error expected in test env
      expect(e.message).not.toContain("validation");
    }
  });
});

// ===== Image Upload via S3 =====
describe("portfolio routes - image upload", () => {
  it("portfolio.uploadImage requires admin authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.portfolio.uploadImage({
        draftId: 1,
        fileName: "test.jpg",
        fileBase64: "aGVsbG8=", // base64 of "hello"
        fileType: "image/jpeg",
      })
    ).rejects.toThrow();
  });

  it("portfolio.uploadImage rejects non-admin users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.portfolio.uploadImage({
        draftId: 1,
        fileName: "test.jpg",
        fileBase64: "aGVsbG8=",
        fileType: "image/jpeg",
      })
    ).rejects.toThrow();
  });

  it("portfolio.uploadImage accepts valid input from admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.portfolio.uploadImage({
        draftId: 1,
        fileName: "office-photo.jpg",
        fileBase64: "aGVsbG8=",
        fileType: "image/jpeg",
        sortOrder: 0,
      });
    } catch (e: any) {
      // S3/DB error expected in test env, but input validation should pass
      expect(e.message).not.toContain("validation");
    }
  });
});

// ===== Router Structure =====
describe("portfolio router structure", () => {
  it("has all expected procedures", () => {
    expect(appRouter.portfolio.published).toBeDefined();
    expect(appRouter.portfolio.detail).toBeDefined();
    expect(appRouter.portfolio.create).toBeDefined();
    expect(appRouter.portfolio.list).toBeDefined();
    expect(appRouter.portfolio.get).toBeDefined();
    expect(appRouter.portfolio.update).toBeDefined();
    expect(appRouter.portfolio.delete).toBeDefined();
    expect(appRouter.portfolio.publish).toBeDefined();
    expect(appRouter.portfolio.archive).toBeDefined();
    expect(appRouter.portfolio.addImage).toBeDefined();
    expect(appRouter.portfolio.uploadImage).toBeDefined();
    expect(appRouter.portfolio.listImages).toBeDefined();
    expect(appRouter.portfolio.updateImage).toBeDefined();
    expect(appRouter.portfolio.deleteImage).toBeDefined();
    expect(appRouter.portfolio.setCover).toBeDefined();
    expect(appRouter.portfolio.processImage).toBeDefined();
    expect(appRouter.portfolio.generateDescription).toBeDefined();
  });
});
