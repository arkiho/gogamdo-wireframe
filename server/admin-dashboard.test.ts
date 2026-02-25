import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@gogamdo.com",
    name: "관리자",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    department: "management",
    opsRole: "director",
  } as any;
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@gogamdo.com",
    name: "일반 사용자",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    department: "none",
    opsRole: "staff",
  } as any;
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("Admin Dashboard - Integrated Stats", () => {
  const adminCaller = appRouter.createCaller(createAdminContext());
  const userCaller = appRouter.createCaller(createUserContext());

  describe("Client Stats", () => {
    it("admin can fetch client dashboard stats", async () => {
      const result = await adminCaller.ops.adminDashboard.clientStats();
      expect(result).toHaveProperty("totalClients");
      expect(result).toHaveProperty("activeDeals");
      expect(result).toHaveProperty("wonDeals");
      expect(result).toHaveProperty("portalTotal");
      expect(result).toHaveProperty("portalActive");
      expect(result).toHaveProperty("portalPending");
      expect(result).toHaveProperty("recentClients");
      expect(typeof result.totalClients).toBe("number");
      expect(Array.isArray(result.recentClients)).toBe(true);
    });

    it("non-admin cannot fetch client stats", async () => {
      await expect(userCaller.ops.adminDashboard.clientStats()).rejects.toThrow();
    });
  });

  describe("Staff Stats", () => {
    it("admin can fetch staff dashboard stats", async () => {
      const result = await adminCaller.ops.adminDashboard.staffStats();
      expect(result).toHaveProperty("totalStaff");
      expect(result).toHaveProperty("activeStaff");
      expect(result).toHaveProperty("byDepartment");
      expect(result).toHaveProperty("byRole");
      expect(result).toHaveProperty("recentStaff");
      expect(typeof result.totalStaff).toBe("number");
      expect(Array.isArray(result.byDepartment)).toBe(true);
      expect(Array.isArray(result.byRole)).toBe(true);
      expect(Array.isArray(result.recentStaff)).toBe(true);

      // byDepartment should have label and count
      for (const d of result.byDepartment) {
        expect(d).toHaveProperty("department");
        expect(d).toHaveProperty("label");
        expect(d).toHaveProperty("count");
        expect(typeof d.count).toBe("number");
      }

      // byRole should have label and count
      for (const r of result.byRole) {
        expect(r).toHaveProperty("role");
        expect(r).toHaveProperty("label");
        expect(r).toHaveProperty("count");
        expect(typeof r.count).toBe("number");
      }
    });

    it("non-admin cannot fetch staff stats", async () => {
      await expect(userCaller.ops.adminDashboard.staffStats()).rejects.toThrow();
    });
  });

  describe("Partner Stats", () => {
    it("admin can fetch partner dashboard stats", async () => {
      const result = await adminCaller.ops.adminDashboard.partnerStats();
      expect(result).toHaveProperty("totalPartners");
      expect(result).toHaveProperty("activePartners");
      expect(result).toHaveProperty("pendingRegistrations");
      expect(result).toHaveProperty("activeContracts");
      expect(result).toHaveProperty("expiringContracts");
      expect(result).toHaveProperty("totalPurchaseOrders");
      expect(result).toHaveProperty("pendingPurchaseOrders");
      expect(result).toHaveProperty("recentPartners");
      expect(result).toHaveProperty("pendingRegs");
      expect(typeof result.totalPartners).toBe("number");
      expect(typeof result.activePartners).toBe("number");
      expect(Array.isArray(result.recentPartners)).toBe(true);
      expect(Array.isArray(result.pendingRegs)).toBe(true);
    });

    it("non-admin cannot fetch partner stats", async () => {
      await expect(userCaller.ops.adminDashboard.partnerStats()).rejects.toThrow();
    });
  });
});
