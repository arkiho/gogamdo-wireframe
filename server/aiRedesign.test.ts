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

      // Create a small test base64 image (1x1 white pixel JPEG)
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
