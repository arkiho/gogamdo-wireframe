import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@gogamdo.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    department: "management",
    opsRole: "admin",
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createStaffContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "staff-user",
    email: "staff@gogamdo.com",
    name: "Staff User",
    loginMethod: "manus",
    role: "user",
    department: "construction",
    opsRole: "staff",
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("ops router", () => {
  describe("ops.stats", () => {
    it("requires authentication", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(caller.ops.stats()).rejects.toThrow();
    });

    it("returns stats for authenticated staff", async () => {
      const caller = appRouter.createCaller(createStaffContext());
      const stats = await caller.ops.stats();
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("totalProjects");
      expect(stats).toHaveProperty("activeProjects");
      expect(stats).toHaveProperty("totalExpenses");
      expect(stats).toHaveProperty("pendingApprovals");
      expect(typeof stats.totalProjects).toBe("number");
      expect(typeof stats.activeProjects).toBe("number");
    });
  });

  describe("ops.project", () => {
    it("list requires authentication", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(caller.ops.project.list()).rejects.toThrow();
    });

    it("list returns array for staff", async () => {
      const caller = appRouter.createCaller(createStaffContext());
      const projects = await caller.ops.project.list();
      expect(Array.isArray(projects)).toBe(true);
    });

    it("create requires admin role", async () => {
      const caller = appRouter.createCaller(createStaffContext());
      // Staff (non-admin) should be rejected for project creation
      await expect(
        caller.ops.project.create({
          name: "Test Project",
          code: "TP-001",
          clientName: "Test Client",
        })
      ).rejects.toThrow();
    });

    it("create succeeds for admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const project = await caller.ops.project.create({
        name: "Test Project " + Date.now(),
        code: "TP-" + Date.now(),
        clientName: "Test Client",
        siteAddress: "서울시 강남구",
        totalArea: "500",
        contractAmount: "100000000",
      });
      expect(project).toBeDefined();
      expect(project).toHaveProperty("id");
    });
  });

  describe("ops.schedule", () => {
    it("list requires projectId and auth", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(caller.ops.schedule.list({ projectId: 1 })).rejects.toThrow();
    });

    it("list returns array for staff", async () => {
      const caller = appRouter.createCaller(createStaffContext());
      const schedules = await caller.ops.schedule.list({ projectId: 1 });
      expect(Array.isArray(schedules)).toBe(true);
    });
  });

  describe("ops.workReport", () => {
    it("list requires auth", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(caller.ops.workReport.list({ projectId: 1 })).rejects.toThrow();
    });

    it("list returns array for staff", async () => {
      const caller = appRouter.createCaller(createStaffContext());
      const reports = await caller.ops.workReport.list({ projectId: 1 });
      expect(Array.isArray(reports)).toBe(true);
    });
  });

  describe("ops.meetingNote", () => {
    it("list requires auth", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(caller.ops.meetingNote.list({ projectId: 1 })).rejects.toThrow();
    });

    it("list returns array for staff", async () => {
      const caller = appRouter.createCaller(createStaffContext());
      const notes = await caller.ops.meetingNote.list({ projectId: 1 });
      expect(Array.isArray(notes)).toBe(true);
    });
  });

  describe("ops.expense", () => {
    it("list requires auth", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(caller.ops.expense.list({ projectId: 1 })).rejects.toThrow();
    });

    it("list returns array for staff", async () => {
      const caller = appRouter.createCaller(createStaffContext());
      const expenses = await caller.ops.expense.list({ projectId: 1 });
      expect(Array.isArray(expenses)).toBe(true);
    });
  });

  describe("ops.subcontractor", () => {
    it("list requires auth", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(caller.ops.subcontractor.list({ projectId: 1 })).rejects.toThrow();
    });

    it("list returns array for staff", async () => {
      const caller = appRouter.createCaller(createStaffContext());
      const subs = await caller.ops.subcontractor.list({ projectId: 1 });
      expect(Array.isArray(subs)).toBe(true);
    });
  });

  describe("ops.estimate", () => {
    it("list requires auth", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(caller.ops.estimate.list({ projectId: 1 })).rejects.toThrow();
    });

    it("list returns array for staff", async () => {
      const caller = appRouter.createCaller(createStaffContext());
      const estimates = await caller.ops.estimate.list({ projectId: 1 });
      expect(Array.isArray(estimates)).toBe(true);
    });
  });

  describe("ops.contract", () => {
    it("list requires auth", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(caller.ops.contract.list({ projectId: 1 })).rejects.toThrow();
    });

    it("list returns array for staff", async () => {
      const caller = appRouter.createCaller(createStaffContext());
      const contracts = await caller.ops.contract.list({ projectId: 1 });
      expect(Array.isArray(contracts)).toBe(true);
    });
  });

  describe("ops.cost", () => {
    it("list requires auth", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(caller.ops.cost.list({ projectId: 1 })).rejects.toThrow();
    });

    it("list returns array for staff", async () => {
      const caller = appRouter.createCaller(createStaffContext());
      const costs = await caller.ops.cost.list({ projectId: 1 });
      expect(Array.isArray(costs)).toBe(true);
    });
  });

  describe("ops.clientInvite", () => {
    it("list requires auth", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(caller.ops.clientInvite.list({ projectId: 1 })).rejects.toThrow();
    });

    it("list returns array for staff", async () => {
      const caller = appRouter.createCaller(createStaffContext());
      const invites = await caller.ops.clientInvite.list({ projectId: 1 });
      expect(Array.isArray(invites)).toBe(true);
    });
  });

  describe("ops.camera", () => {
    it("list requires auth", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(caller.ops.camera.list({ projectId: 1 })).rejects.toThrow();
    });

    it("list returns array for staff", async () => {
      const caller = appRouter.createCaller(createStaffContext());
      const cameras = await caller.ops.camera.list({ projectId: 1 });
      expect(Array.isArray(cameras)).toBe(true);
    });
  });

  describe("ops.approvalLine", () => {
    it("list requires auth", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(caller.ops.approvalLine.list({ projectId: 1 })).rejects.toThrow();
    });

    it("list returns array for staff", async () => {
      const caller = appRouter.createCaller(createStaffContext());
      const lines = await caller.ops.approvalLine.list({ projectId: 1 });
      expect(Array.isArray(lines)).toBe(true);
    });
  });
});
