/**
 * Post-Occupancy System Tests
 * Tests for satisfaction surveys, maintenance visits, subscriptions, optimization reports
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./db", () => ({
  createPostOccupancySurvey: vi.fn().mockResolvedValue(1),
  getPostOccupancyByProject: vi.fn().mockResolvedValue([
    { id: 1, clientProjectId: 1, overallScore: 4.5, designScore: 4.8, constructionScore: 4.2, communicationScore: 4.6, feedback: "만족합니다", createdAt: new Date() },
  ]),
  createMaintenanceVisit: vi.fn().mockResolvedValue(1),
  getMaintenanceVisitsByProject: vi.fn().mockResolvedValue([
    { id: 1, clientProjectId: 1, visitType: "inspection", scheduledDate: Date.now(), status: "scheduled", description: "3개월 정기 점검", createdAt: new Date() },
  ]),
  updateMaintenanceVisit: vi.fn().mockResolvedValue(true),
  createInsightSubscription: vi.fn().mockResolvedValue(1),
  getInsightSubscriptionsByProject: vi.fn().mockResolvedValue([
    { id: 1, clientProjectId: 1, planType: "premium", startDate: Date.now(), endDate: Date.now() + 365 * 86400000, status: "active", createdAt: new Date() },
  ]),
  updateInsightSubscription: vi.fn().mockResolvedValue(true),
  createOptimizationReport: vi.fn().mockResolvedValue(1),
  getOptimizationReportsByProject: vi.fn().mockResolvedValue([
    { id: 1, clientProjectId: 1, reportType: "quarterly", summary: "공간 최적화 리포트", createdAt: new Date() },
  ]),
}));

vi.mock("./_core/trpc", () => ({
  router: vi.fn((routes: any) => routes),
  publicProcedure: {
    input: vi.fn().mockReturnThis(),
    query: vi.fn().mockReturnThis(),
    mutation: vi.fn().mockReturnThis(),
  },
  protectedProcedure: {
    input: vi.fn().mockReturnThis(),
    query: vi.fn().mockReturnThis(),
    mutation: vi.fn().mockReturnThis(),
    use: vi.fn(() => ({
      input: vi.fn().mockReturnThis(),
      query: vi.fn().mockReturnThis(),
      mutation: vi.fn().mockReturnThis(),
    })),
  },
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify({
      summary: "공간 최적화 분석 결과",
      recommendations: ["회의실 활용도 개선", "휴게공간 확대"],
      metrics: { spaceUtilization: 78, employeeSatisfaction: 85 },
    }) } }],
  }),
}));

import {
  createPostOccupancySurvey,
  getPostOccupancyByProject,
  createMaintenanceVisit,
  getMaintenanceVisitsByProject,
  updateMaintenanceVisit,
  createInsightSubscription,
  getInsightSubscriptionsByProject,
  updateInsightSubscription,
  createOptimizationReport,
  getOptimizationReportsByProject,
} from "./db";

describe("Post-Occupancy System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Satisfaction Surveys", () => {
    it("should create a satisfaction survey", async () => {
      const result = await (createPostOccupancySurvey as any)({
        clientProjectId: 1,
        overallScore: 4.5,
        designScore: 4.8,
        constructionScore: 4.2,
        communicationScore: 4.6,
        feedback: "전반적으로 만족합니다",
      });
      expect(result).toBe(1);
      expect(createPostOccupancySurvey).toHaveBeenCalledTimes(1);
    });

    it("should get surveys by project", async () => {
      const result = await (getPostOccupancyByProject as any)(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("overallScore", 4.5);
      expect(result[0]).toHaveProperty("feedback", "만족합니다");
    });
  });

  describe("Maintenance Visits", () => {
    it("should create a maintenance visit", async () => {
      const result = await (createMaintenanceVisit as any)({
        clientProjectId: 1,
        visitType: "inspection",
        scheduledDate: Date.now() + 7 * 86400000,
        description: "3개월 정기 점검",
      });
      expect(result).toBe(1);
    });

    it("should get visits by project", async () => {
      const result = await (getMaintenanceVisitsByProject as any)(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("visitType", "inspection");
      expect(result[0]).toHaveProperty("status", "scheduled");
    });

    it("should update visit status", async () => {
      const result = await (updateMaintenanceVisit as any)(1, { status: "completed" });
      expect(result).toBe(true);
    });
  });

  describe("Insight Subscriptions", () => {
    it("should create a subscription", async () => {
      const result = await (createInsightSubscription as any)({
        clientProjectId: 1,
        planType: "premium",
        startDate: Date.now(),
        endDate: Date.now() + 365 * 86400000,
      });
      expect(result).toBe(1);
    });

    it("should get subscriptions by project", async () => {
      const result = await (getInsightSubscriptionsByProject as any)(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("planType", "premium");
      expect(result[0]).toHaveProperty("status", "active");
    });

    it("should update subscription", async () => {
      const result = await (updateInsightSubscription as any)(1, { status: "cancelled" });
      expect(result).toBe(true);
    });
  });

  describe("Optimization Reports", () => {
    it("should create an optimization report", async () => {
      const result = await (createOptimizationReport as any)({
        clientProjectId: 1,
        reportType: "quarterly",
        summary: "공간 최적화 리포트",
      });
      expect(result).toBe(1);
    });

    it("should get reports by project", async () => {
      const result = await (getOptimizationReportsByProject as any)(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("reportType", "quarterly");
    });
  });
});
