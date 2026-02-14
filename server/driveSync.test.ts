import { describe, it, expect, vi, beforeEach } from "vitest";
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

function createUnauthContext(): TrpcContext {
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

const caller = appRouter.createCaller;

describe("driveSync router", () => {
  describe("checkConnection", () => {
    it("should require admin role", async () => {
      const ctx = createUserContext();
      await expect(caller(ctx).driveSync.checkConnection()).rejects.toThrow();
    });

    it("should reject unauthenticated users", async () => {
      const ctx = createUnauthContext();
      await expect(caller(ctx).driveSync.checkConnection()).rejects.toThrow();
    });

    it("should return connection status for admin (no service account configured)", async () => {
      const ctx = createAdminContext();
      const result = await caller(ctx).driveSync.checkConnection();
      expect(result).toHaveProperty("connected");
      // Without GOOGLE_SERVICE_ACCOUNT_JSON, it should return not connected
      expect(result.connected).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("listLogs", () => {
    it("should require admin role", async () => {
      const ctx = createUserContext();
      await expect(caller(ctx).driveSync.listLogs()).rejects.toThrow();
    });

    it("should reject unauthenticated users", async () => {
      const ctx = createUnauthContext();
      await expect(caller(ctx).driveSync.listLogs()).rejects.toThrow();
    });

    it("should return array for admin", async () => {
      const ctx = createAdminContext();
      const result = await caller(ctx).driveSync.listLogs();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("listProjectFolders", () => {
    it("should require admin role", async () => {
      const ctx = createUserContext();
      await expect(
        caller(ctx).driveSync.listProjectFolders({ rootFolderId: "test-folder-id" })
      ).rejects.toThrow();
    });

    it("should reject unauthenticated users", async () => {
      const ctx = createUnauthContext();
      await expect(
        caller(ctx).driveSync.listProjectFolders({ rootFolderId: "test-folder-id" })
      ).rejects.toThrow();
    });

    it("should fail without service account configured", async () => {
      const ctx = createAdminContext();
      await expect(
        caller(ctx).driveSync.listProjectFolders({ rootFolderId: "test-folder-id" })
      ).rejects.toThrow();
    });
  });

  describe("listFolders", () => {
    it("should require admin role", async () => {
      const ctx = createUserContext();
      await expect(
        caller(ctx).driveSync.listFolders({ parentFolderId: "test-folder-id" })
      ).rejects.toThrow();
    });
  });

  describe("listImages", () => {
    it("should require admin role", async () => {
      const ctx = createUserContext();
      await expect(
        caller(ctx).driveSync.listImages({ folderId: "test-folder-id" })
      ).rejects.toThrow();
    });
  });

  describe("syncFolder", () => {
    it("should require admin role", async () => {
      const ctx = createUserContext();
      await expect(
        caller(ctx).driveSync.syncFolder({
          folderId: "test-folder-id",
          projectName: "Test Project",
          folderPath: "test/path",
        })
      ).rejects.toThrow();
    });

    it("should reject unauthenticated users", async () => {
      const ctx = createUnauthContext();
      await expect(
        caller(ctx).driveSync.syncFolder({
          folderId: "test-folder-id",
          projectName: "Test Project",
          folderPath: "test/path",
        })
      ).rejects.toThrow();
    });
  });

  describe("syncAll", () => {
    it("should require admin role", async () => {
      const ctx = createUserContext();
      await expect(
        caller(ctx).driveSync.syncAll({ rootFolderId: "test-folder-id" })
      ).rejects.toThrow();
    });

    it("should reject unauthenticated users", async () => {
      const ctx = createUnauthContext();
      await expect(
        caller(ctx).driveSync.syncAll({ rootFolderId: "test-folder-id" })
      ).rejects.toThrow();
    });
  });
});

describe("driveSync input validation", () => {
  it("listProjectFolders requires rootFolderId string", async () => {
    const ctx = createAdminContext();
    // @ts-expect-error - testing invalid input
    await expect(caller(ctx).driveSync.listProjectFolders({})).rejects.toThrow();
  });

  it("syncFolder requires all required fields", async () => {
    const ctx = createAdminContext();
    // @ts-expect-error - testing invalid input
    await expect(caller(ctx).driveSync.syncFolder({ folderId: "test" })).rejects.toThrow();
  });

  it("syncAll requires rootFolderId", async () => {
    const ctx = createAdminContext();
    // @ts-expect-error - testing invalid input
    await expect(caller(ctx).driveSync.syncAll({})).rejects.toThrow();
  });
});
