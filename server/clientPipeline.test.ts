import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db functions
vi.mock("./db", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    createClientProject: vi.fn().mockResolvedValue({ id: 1 }),
    getClientProjectsByUser: vi.fn().mockResolvedValue([
      {
        id: 1,
        userId: 1,
        companyName: "테스트 회사",
        contactName: "홍길동",
        contactEmail: "test@test.com",
        status: "created",
        createdAt: new Date(),
      },
    ]),
    getClientProjectById: vi.fn().mockImplementation(async (id: number) => {
      if (id === 1) {
        return {
          id: 1,
          userId: 1,
          companyName: "테스트 회사",
          contactName: "홍길동",
          contactEmail: "test@test.com",
          status: "created",
          createdAt: new Date(),
        };
      }
      if (id === 999) return null;
      return null;
    }),
    getAllClientProjects: vi.fn().mockResolvedValue([
      {
        id: 1,
        userId: 1,
        companyName: "테스트 회사",
        contactName: "홍길동",
        contactEmail: "test@test.com",
        status: "created",
        createdAt: new Date(),
      },
    ]),
    updateClientProjectStatus: vi.fn().mockResolvedValue(undefined),
    getAllMeetings: vi.fn().mockResolvedValue([]),
    updateMeetingStatus: vi.fn().mockResolvedValue(undefined),
    getFloorPlansByProject: vi.fn().mockResolvedValue([]),
    getWorkSurveyByProject: vi.fn().mockResolvedValue(null),
    getReportsByProject: vi.fn().mockResolvedValue([]),
    getMeetingsByProject: vi.fn().mockResolvedValue([]),
    getCompanySurveysByProject: vi.fn().mockResolvedValue([]),
    getCompanySurveyByToken: vi.fn().mockImplementation(async (token: string) => {
      if (token === "valid-token") {
        return {
          id: 1,
          projectId: 1,
          token: "valid-token",
          isActive: true,
          totalQuestions: 10,
          responseCount: 0,
          createdAt: new Date(),
        };
      }
      return null;
    }),
    getSurveyResponseStats: vi.fn().mockResolvedValue({ total: 0, averages: {} }),
    getResponsesBySurvey: vi.fn().mockResolvedValue([]),
    createCompanySurveyResponse: vi.fn().mockResolvedValue({ id: 1 }),
    incrementSurveyResponseCount: vi.fn().mockResolvedValue(undefined),
  };
});

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/test.pdf", key: "test.pdf" }),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify({ summary: "테스트 보고서", recommendations: [] }) } }],
  }),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(role: "user" | "admin" = "user", userId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@test.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role,
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

function createAnonContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("clientPipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createProject", () => {
    it("creates a project for authenticated user", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.clientPipeline.createProject({
        companyName: "테스트 회사",
        contactName: "홍길동",
        contactEmail: "test@test.com",
        contactPhone: "010-1234-5678",
        employeeCount: 50,
      });

      expect(result).toHaveProperty("id");
      expect(result.id).toBe(1);
    });

    it("rejects unauthenticated users", async () => {
      const ctx = createAnonContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.clientPipeline.createProject({
          companyName: "테스트",
          contactName: "테스트",
          contactEmail: "test@test.com",
        })
      ).rejects.toThrow();
    });
  });

  describe("myProjects", () => {
    it("returns projects for the authenticated user", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.clientPipeline.myProjects();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getProject", () => {
    it("returns project for the owner", async () => {
      const ctx = createUserContext("user", 1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.clientPipeline.getProject({ id: 1 });

      expect(result).toHaveProperty("companyName", "테스트 회사");
    });

    it("throws NOT_FOUND for non-existent project", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.clientPipeline.getProject({ id: 999 })
      ).rejects.toThrow();
    });

    it("throws FORBIDDEN for non-owner non-admin", async () => {
      const ctx = createUserContext("user", 2);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.clientPipeline.getProject({ id: 1 })
      ).rejects.toThrow();
    });

    it("allows admin to view any project", async () => {
      const ctx = createUserContext("admin", 2);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.clientPipeline.getProject({ id: 1 });
      expect(result).toHaveProperty("companyName", "테스트 회사");
    });
  });

  describe("admin operations", () => {
    it("adminListProjects returns all projects for admin", async () => {
      const ctx = createUserContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.clientPipeline.adminListProjects();
      expect(Array.isArray(result)).toBe(true);
    });

    it("adminListProjects rejects non-admin", async () => {
      const ctx = createUserContext("user");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.clientPipeline.adminListProjects()
      ).rejects.toThrow();
    });

    it("adminListMeetings returns meetings for admin", async () => {
      const ctx = createUserContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.clientPipeline.adminListMeetings();
      expect(Array.isArray(result)).toBe(true);
    });

    it("adminUpdateProjectStatus works for admin", async () => {
      const ctx = createUserContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.clientPipeline.adminUpdateProjectStatus({
        id: 1,
        status: "floor_plan_uploaded",
      });
      expect(result).toHaveProperty("success", true);
    });
  });

  describe("company survey public access", () => {
    it("getCompanySurveyPublic returns survey for valid token", async () => {
      const ctx = createAnonContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.clientPipeline.getCompanySurveyPublic({
        token: "valid-token",
      });

      expect(result).toHaveProperty("title");
      expect(result).toHaveProperty("responseCount");
    });

    it("getCompanySurveyPublic throws for invalid token", async () => {
      const ctx = createAnonContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.clientPipeline.getCompanySurveyPublic({ token: "invalid" })
      ).rejects.toThrow();
    });

    it("submitCompanySurveyResponse works with valid token", async () => {
      const ctx = createAnonContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.clientPipeline.submitCompanySurveyResponse({
        token: "valid-token",
        department: "개발팀",
        role: "개발자",
        overallSatisfaction: 4,
        noiseSatisfaction: 3,
        lightingSatisfaction: 5,
      });

      expect(result).toHaveProperty("success", true);
    });
  });

  describe("getFloorPlans", () => {
    it("returns floor plans for project owner", async () => {
      const ctx = createUserContext("user", 1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.clientPipeline.getFloorPlans({ projectId: 1 });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getMeetings", () => {
    it("returns meetings for project owner", async () => {
      const ctx = createUserContext("user", 1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.clientPipeline.getMeetings({ projectId: 1 });
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
