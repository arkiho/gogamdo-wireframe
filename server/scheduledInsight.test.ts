import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

describe("Scheduled Insight Auto-Generation System", () => {
  // §5c Patch verification
  describe("§5c Patch - manusTypes.ts", () => {
    it("should have taskUid field in GetUserInfoWithJwtResponse", () => {
      const filePath = resolve(__dirname, "_core/types/manusTypes.ts");
      expect(existsSync(filePath)).toBe(true);
      const content = readFileSync(filePath, "utf-8");
      expect(content).toContain("taskUid?: string | null");
      expect(content).toContain("GetUserInfoWithJwtResponse");
    });
  });

  describe("§5c Patch - sdk.ts", () => {
    it("should have AuthenticatedUser type with isCron and taskUid", () => {
      const filePath = resolve(__dirname, "_core/sdk.ts");
      expect(existsSync(filePath)).toBe(true);
      const content = readFileSync(filePath, "utf-8");
      expect(content).toContain("export type AuthenticatedUser");
      expect(content).toContain("taskUid?: string");
      expect(content).toContain("isCron?: boolean");
    });

    it("should have CRON_OPEN_ID_PREFIX constant", () => {
      const filePath = resolve(__dirname, "_core/sdk.ts");
      const content = readFileSync(filePath, "utf-8");
      expect(content).toContain('CRON_OPEN_ID_PREFIX = "cron_"');
    });

    it("should have buildCronUser function", () => {
      const filePath = resolve(__dirname, "_core/sdk.ts");
      const content = readFileSync(filePath, "utf-8");
      expect(content).toContain("function buildCronUser");
      expect(content).toContain("Manus Scheduled Task");
    });

    it("should have cron short-circuit in authenticateRequest", () => {
      const filePath = resolve(__dirname, "_core/sdk.ts");
      const content = readFileSync(filePath, "utf-8");
      expect(content).toContain("session.openId.startsWith(CRON_OPEN_ID_PREFIX)");
      expect(content).toContain("Cron session missing task_uid");
      expect(content).toContain("return buildCronUser(userInfo)");
    });

    it("should return AuthenticatedUser from authenticateRequest", () => {
      const filePath = resolve(__dirname, "_core/sdk.ts");
      const content = readFileSync(filePath, "utf-8");
      expect(content).toContain("async authenticateRequest(req: Request): Promise<AuthenticatedUser>");
    });
  });

  // Callback handler verification
  describe("Scheduled Insight Handler", () => {
    it("should exist at server/routers/scheduledInsight.ts", () => {
      const filePath = resolve(__dirname, "routers/scheduledInsight.ts");
      expect(existsSync(filePath)).toBe(true);
    });

    it("should export generateInsightHandler function", () => {
      const filePath = resolve(__dirname, "routers/scheduledInsight.ts");
      const content = readFileSync(filePath, "utf-8");
      expect(content).toContain("export async function generateInsightHandler");
    });

    it("should authenticate with sdk.authenticateRequest", () => {
      const filePath = resolve(__dirname, "routers/scheduledInsight.ts");
      const content = readFileSync(filePath, "utf-8");
      expect(content).toContain("sdk.authenticateRequest(req)");
      expect(content).toContain("user.isCron");
    });

    it("should return 403 for non-cron requests", () => {
      const filePath = resolve(__dirname, "routers/scheduledInsight.ts");
      const content = readFileSync(filePath, "utf-8");
      expect(content).toContain("res.status(403)");
      expect(content).toContain("cron-only endpoint");
    });

    it("should use SEO-optimized keywords", () => {
      const filePath = resolve(__dirname, "routers/scheduledInsight.ts");
      const content = readFileSync(filePath, "utf-8");
      expect(content).toContain("사무실 인테리어");
      expect(content).toContain("오피스 리모델링");
      expect(content).toContain("사무공간 설계");
      expect(content).toContain("SEO_KEYWORDS");
    });

    it("should generate metaTitle and metaDescription", () => {
      const filePath = resolve(__dirname, "routers/scheduledInsight.ts");
      const content = readFileSync(filePath, "utf-8");
      expect(content).toContain("metaTitle");
      expect(content).toContain("metaDescription");
    });

    it("should save article as draft with isAiGenerated flag", () => {
      const filePath = resolve(__dirname, "routers/scheduledInsight.ts");
      const content = readFileSync(filePath, "utf-8");
      expect(content).toContain('status: "draft"');
      expect(content).toContain("isAiGenerated: true");
    });

    it("should include FAQ section instruction in prompt", () => {
      const filePath = resolve(__dirname, "routers/scheduledInsight.ts");
      const content = readFileSync(filePath, "utf-8");
      expect(content).toContain("FAQ");
      expect(content).toContain("AEO");
    });

    it("should include CTA instruction for lead generation", () => {
      const filePath = resolve(__dirname, "routers/scheduledInsight.ts");
      const content = readFileSync(filePath, "utf-8");
      expect(content).toContain("고감도 인테리어에서 무료 상담을 받아보세요");
      expect(content).toContain("리드 생성");
    });

    it("should handle errors with proper JSON response", () => {
      const filePath = resolve(__dirname, "routers/scheduledInsight.ts");
      const content = readFileSync(filePath, "utf-8");
      expect(content).toContain("res.status(500).json");
      expect(content).toContain("timestamp");
      expect(content).toContain("context");
    });

    it("should generate cover image", () => {
      const filePath = resolve(__dirname, "routers/scheduledInsight.ts");
      const content = readFileSync(filePath, "utf-8");
      expect(content).toContain("generateImage");
      expect(content).toContain("coverImageUrl");
    });

    it("should accept trend context from AGENT cron", () => {
      const filePath = resolve(__dirname, "routers/scheduledInsight.ts");
      const content = readFileSync(filePath, "utf-8");
      expect(content).toContain("trendContext");
      expect(content).toContain("최신 트렌드 리서치 결과");
    });
  });

  // Route registration verification
  describe("Route Registration", () => {
    it("should register /api/scheduled/generateInsight in index.ts", () => {
      const filePath = resolve(__dirname, "_core/index.ts");
      expect(existsSync(filePath)).toBe(true);
      const content = readFileSync(filePath, "utf-8");
      expect(content).toContain('/api/scheduled/generateInsight');
      expect(content).toContain("generateInsightHandler");
    });

    it("should register before tRPC middleware", () => {
      const filePath = resolve(__dirname, "_core/index.ts");
      const content = readFileSync(filePath, "utf-8");
      const scheduledIndex = content.indexOf("/api/scheduled/generateInsight");
      const trpcIndex = content.indexOf("/api/trpc");
      expect(scheduledIndex).toBeLessThan(trpcIndex);
    });
  });

  // SEO/AEO/GEO enhanced aiGenerate procedure
  describe("Enhanced aiGenerate Procedure", () => {
    it("should include SEO keywords in aiGenerate prompt", () => {
      const filePath = resolve(__dirname, "routers.ts");
      const content = readFileSync(filePath, "utf-8");
      // Find the aiGenerate section
      const aiGenerateSection = content.substring(
        content.indexOf("// 관리자: AI 아티클 자동 생성"),
        content.indexOf("// ===== 뉴스레터 구독 =====")
      );
      expect(aiGenerateSection).toContain("seoKeywords");
      expect(aiGenerateSection).toContain("사무실 인테리어");
      expect(aiGenerateSection).toContain("오피스 리모델링");
    });

    it("should include AEO FAQ instruction in aiGenerate", () => {
      const filePath = resolve(__dirname, "routers.ts");
      const content = readFileSync(filePath, "utf-8");
      const aiGenerateSection = content.substring(
        content.indexOf("// 관리자: AI 아티클 자동 생성"),
        content.indexOf("// ===== 뉴스레터 구독 =====")
      );
      expect(aiGenerateSection).toContain("FAQ");
      expect(aiGenerateSection).toContain("AEO");
    });

    it("should save metaTitle and metaDescription to DB", () => {
      const filePath = resolve(__dirname, "routers.ts");
      const content = readFileSync(filePath, "utf-8");
      const aiGenerateSection = content.substring(
        content.indexOf("// 관리자: AI 아티클 자동 생성"),
        content.indexOf("// ===== 뉴스레터 구독 =====")
      );
      expect(aiGenerateSection).toContain("metaTitle: parsed.metaTitle");
      expect(aiGenerateSection).toContain("metaDescription: parsed.metaDescription");
      expect(aiGenerateSection).toContain("isAiGenerated: true");
    });

    it("should include company branding instruction", () => {
      const filePath = resolve(__dirname, "routers.ts");
      const content = readFileSync(filePath, "utf-8");
      const aiGenerateSection = content.substring(
        content.indexOf("// 관리자: AI 아티클 자동 생성"),
        content.indexOf("// ===== 뉴스레터 구독 =====")
      );
      expect(aiGenerateSection).toContain("(주)고감도");
      expect(aiGenerateSection).toContain("kokamdo.co.kr");
    });
  });

  // DB schema verification
  describe("Database Schema", () => {
    it("should have SEO fields in insightArticles table", () => {
      const filePath = resolve(__dirname, "../drizzle/schema.ts");
      expect(existsSync(filePath)).toBe(true);
      const content = readFileSync(filePath, "utf-8");
      expect(content).toContain("metaTitle");
      expect(content).toContain("metaDescription");
      expect(content).toContain("isAiGenerated");
    });
  });
});
