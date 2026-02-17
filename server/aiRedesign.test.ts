import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({
    key: "ai-redesign/original/test.jpg",
    url: "https://cdn.example.com/ai-redesign/original/test.jpg",
  }),
}));

// Mock image generation
vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn().mockResolvedValue({
    url: "https://cdn.example.com/ai-redesign/result/test-result.jpg",
  }),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: "Modern minimalist office redesign with warm wood tones, indirect lighting, and ergonomic furniture. Professional architectural rendering.",
        },
      },
    ],
  }),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Track CRM function calls
const mockCreateCrmClient = vi.fn().mockResolvedValue(100);
const mockFindCrmClientByEmail = vi.fn().mockResolvedValue(null);
const mockCreateCrmDeal = vi.fn().mockResolvedValue(200);
const mockCreateCrmActivity = vi.fn().mockResolvedValue(300);
const mockCreateNotification = vi.fn().mockResolvedValue(400);

// Mock DB functions
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    createAiRedesign: vi.fn().mockResolvedValue(1),
    getAiRedesign: vi.fn().mockResolvedValue({
      id: 1,
      originalImageUrl: "https://cdn.example.com/original.jpg",
      resultImageUrl: "https://cdn.example.com/result.jpg",
      prompt: "모던한 스타일로 바꿔주세요",
      status: "completed",
      spaceType: "office",
      createdAt: new Date(),
    }),
    updateAiRedesign: vi.fn().mockResolvedValue(undefined),
    listAiRedesigns: vi.fn().mockResolvedValue([
      {
        id: 1,
        originalImageUrl: "https://cdn.example.com/original.jpg",
        resultImageUrl: "https://cdn.example.com/result.jpg",
        prompt: "모던한 스타일로 바꿔주세요",
        status: "completed",
        spaceType: "office",
        createdAt: new Date(),
      },
    ]),
    findCrmClientByEmail: (...args: any[]) => mockFindCrmClientByEmail(...args),
    createCrmClient: (...args: any[]) => mockCreateCrmClient(...args),
    createCrmDeal: (...args: any[]) => mockCreateCrmDeal(...args),
    createCrmActivity: (...args: any[]) => mockCreateCrmActivity(...args),
    createNotification: (...args: any[]) => mockCreateNotification(...args),
  };
});

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
      socket: { remoteAddress: "127.0.0.1" },
    } as unknown as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@gogamdo.com",
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
      socket: { remoteAddress: "127.0.0.1" },
    } as unknown as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("aiRedesign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create an AI redesign request and return result", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const testBase64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AKwA//9k=";

      const result = await caller.aiRedesign.create({
        imageBase64: testBase64,
        imageMimeType: "image/jpeg",
        prompt: "모던한 스타일로 바꿔주세요",
        spaceType: "office",
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.originalImageUrl).toBeDefined();
      expect(result.resultImageUrl).toBeDefined();
      expect(result.status).toBe("completed");
    });

    it("should trigger CRM lead creation with customer email", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const testBase64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AKwA//9k=";

      const result = await caller.aiRedesign.create({
        imageBase64: testBase64,
        imageMimeType: "image/jpeg",
        prompt: "회의실을 밝은 분위기로 바꿔주세요",
        spaceType: "회의실",
        customerName: "김테스트",
        customerEmail: "test@company.com",
        customerPhone: "010-1234-5678",
      });

      expect(result.status).toBe("completed");

      // CRM 연동은 비동기로 실행되므로 약간의 대기 후 확인
      await new Promise(resolve => setTimeout(resolve, 100));

      // CRM 클라이언트 검색이 호출되었는지 확인
      expect(mockFindCrmClientByEmail).toHaveBeenCalledWith("test@company.com");

      // 새 CRM 클라이언트가 생성되었는지 확인
      expect(mockCreateCrmClient).toHaveBeenCalledWith(
        expect.objectContaining({
          contactName: "김테스트",
          email: "test@company.com",
          phone: "010-1234-5678",
          source: "website",
          tags: ["ai-redesign"],
        })
      );

      // CRM 딜이 생성되었는지 확인
      expect(mockCreateCrmDeal).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: 100,
          stage: "lead",
          tags: ["ai-redesign"],
        })
      );

      // CRM 활동 로그가 기록되었는지 확인
      expect(mockCreateCrmActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: 100,
          type: "note",
          title: "AI 공간 리디자인 요청",
          createdBy: "system",
        })
      );
    });

    it("should create anonymous CRM lead when no email provided", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const testBase64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AKwA//9k=";

      await caller.aiRedesign.create({
        imageBase64: testBase64,
        imageMimeType: "image/jpeg",
        prompt: "라운지를 카페 스타일로 바꿔주세요",
        spaceType: "라운지",
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // 이메일 없이도 CRM 클라이언트가 생성되는지 확인
      expect(mockCreateCrmClient).toHaveBeenCalledWith(
        expect.objectContaining({
          contactName: "AI 리디자인 고객",
          source: "website",
          tags: expect.arrayContaining(["ai-redesign", "anonymous"]),
        })
      );
    });

    it("should use existing CRM client if email already exists", async () => {
      // 기존 고객이 있는 경우를 시뮬레이션
      mockFindCrmClientByEmail.mockResolvedValueOnce({ id: 50, companyName: "기존회사", contactName: "기존고객" });

      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const testBase64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AKwA//9k=";

      await caller.aiRedesign.create({
        imageBase64: testBase64,
        imageMimeType: "image/jpeg",
        prompt: "임원실을 고급스럽게 바꿔주세요",
        spaceType: "임원실",
        customerEmail: "existing@company.com",
        customerName: "기존고객",
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // 기존 고객 검색
      expect(mockFindCrmClientByEmail).toHaveBeenCalledWith("existing@company.com");

      // 새 클라이언트를 생성하지 않아야 함 (기존 고객 사용)
      expect(mockCreateCrmClient).not.toHaveBeenCalled();

      // 기존 clientId(50)로 딜이 생성되어야 함
      expect(mockCreateCrmDeal).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: 50,
          stage: "lead",
        })
      );
    });

    it("should reject empty image", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.aiRedesign.create({
          imageBase64: "",
          imageMimeType: "image/jpeg",
          prompt: "모던한 스타일로 바꿔주세요",
        })
      ).rejects.toThrow();
    });

    it("should reject empty prompt", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.aiRedesign.create({
          imageBase64: "dGVzdA==",
          imageMimeType: "image/jpeg",
          prompt: "",
        })
      ).rejects.toThrow();
    });
  });

  describe("get", () => {
    it("should return a redesign record by id", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.aiRedesign.get({ id: 1 });

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.status).toBe("completed");
      expect(result.originalImageUrl).toBeDefined();
      expect(result.resultImageUrl).toBeDefined();
    });
  });

  describe("list", () => {
    it("should require authentication", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.aiRedesign.list()).rejects.toThrow();
    });

    it("should return list for authenticated users", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.aiRedesign.list();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
