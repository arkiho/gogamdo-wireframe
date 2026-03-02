/**
 * KPI/OKR System Tests
 * Tests for KPI definitions, records, OKR objectives, key results
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./db", () => ({
  createKpiDefinition: vi.fn().mockResolvedValue(1),
  getKpiDefinitions: vi.fn().mockResolvedValue([
    { id: 1, name: "프로젝트 완료율", category: "performance", department: "시공팀", metricType: "percentage", targetValue: 90, isActive: 1, createdAt: new Date() },
  ]),
  getKpiDefinitionById: vi.fn().mockResolvedValue({
    id: 1, name: "프로젝트 완료율", category: "performance", department: "시공팀", metricType: "percentage", targetValue: 90, isActive: 1,
  }),
  recordKpi: vi.fn().mockResolvedValue(1),
  getKpiRecordsByUser: vi.fn().mockResolvedValue([
    { id: 1, kpiDefinitionId: 1, userId: 1, period: "2026-Q1", actualValue: 85, notes: "진행 중", createdAt: new Date() },
  ]),
  getKpiRecordsByDefinition: vi.fn().mockResolvedValue([
    { id: 1, kpiDefinitionId: 1, userId: 1, period: "2026-Q1", actualValue: 85, notes: "진행 중", createdAt: new Date() },
  ]),
  createOkrObjective: vi.fn().mockResolvedValue(1),
  getOkrObjectivesByUser: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, title: "시공 품질 향상", description: "시공 품질 95% 달성", level: "team", period: "2026-Q1", status: "in_progress", progress: 60, createdAt: new Date() },
  ]),
  getOkrObjectiveById: vi.fn().mockResolvedValue({
    id: 1, userId: 1, title: "시공 품질 향상", description: "시공 품질 95% 달성", level: "team", period: "2026-Q1", status: "in_progress", progress: 60,
  }),
  addKeyResult: vi.fn().mockResolvedValue(1),
  getKeyResultsByObjective: vi.fn().mockResolvedValue([
    { id: 1, objectiveId: 1, title: "하자 발생률 5% 이하", metricType: "percentage", targetValue: 5, currentValue: 4, status: "on_track", createdAt: new Date() },
  ]),
  updateKeyResult: vi.fn().mockResolvedValue(true),
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
    choices: [{ message: { content: JSON.stringify({ analysis: "OKR 진행률 분석 결과", recommendations: ["추천1"] }) } }],
  }),
}));

import {
  createKpiDefinition,
  getKpiDefinitions,
  getKpiDefinitionById,
  recordKpi,
  getKpiRecordsByUser,
  getKpiRecordsByDefinition,
  createOkrObjective,
  getOkrObjectivesByUser,
  getOkrObjectiveById,
  addKeyResult,
  getKeyResultsByObjective,
  updateKeyResult,
} from "./db";

describe("KPI/OKR System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("KPI Definitions", () => {
    it("should create a KPI definition", async () => {
      const result = await (createKpiDefinition as any)({
        name: "프로젝트 완료율",
        category: "performance",
        department: "시공팀",
        metricType: "percentage",
        targetValue: 90,
      });
      expect(result).toBe(1);
      expect(createKpiDefinition).toHaveBeenCalledTimes(1);
    });

    it("should list KPI definitions", async () => {
      const result = await (getKpiDefinitions as any)({});
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("category");
      expect(result[0]).toHaveProperty("metricType");
    });

    it("should get KPI definition by id", async () => {
      const result = await (getKpiDefinitionById as any)(1);
      expect(result).toHaveProperty("name", "프로젝트 완료율");
      expect(result).toHaveProperty("targetValue", 90);
    });
  });

  describe("KPI Records", () => {
    it("should record a KPI value", async () => {
      const result = await (recordKpi as any)({
        kpiDefinitionId: 1,
        userId: 1,
        period: "2026-Q1",
        actualValue: 85,
        notes: "진행 중",
      });
      expect(result).toBe(1);
      expect(recordKpi).toHaveBeenCalledTimes(1);
    });

    it("should get KPI records by user", async () => {
      const result = await (getKpiRecordsByUser as any)(1, "2026-Q1");
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("actualValue", 85);
    });

    it("should get KPI records by definition", async () => {
      const result = await (getKpiRecordsByDefinition as any)(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("kpiDefinitionId", 1);
    });
  });

  describe("OKR Objectives", () => {
    it("should create an OKR objective", async () => {
      const result = await (createOkrObjective as any)({
        userId: 1,
        title: "시공 품질 향상",
        description: "시공 품질 95% 달성",
        level: "team",
        period: "2026-Q1",
      });
      expect(result).toBe(1);
      expect(createOkrObjective).toHaveBeenCalledTimes(1);
    });

    it("should list objectives by user", async () => {
      const result = await (getOkrObjectivesByUser as any)(1, "2026-Q1");
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("title", "시공 품질 향상");
      expect(result[0]).toHaveProperty("progress", 60);
    });

    it("should get objective by id", async () => {
      const result = await (getOkrObjectiveById as any)(1);
      expect(result).toHaveProperty("title", "시공 품질 향상");
      expect(result).toHaveProperty("status", "in_progress");
    });
  });

  describe("OKR Key Results", () => {
    it("should add a key result", async () => {
      const result = await (addKeyResult as any)({
        objectiveId: 1,
        title: "하자 발생률 5% 이하",
        metricType: "percentage",
        targetValue: 5,
      });
      expect(result).toBe(1);
      expect(addKeyResult).toHaveBeenCalledTimes(1);
    });

    it("should get key results by objective", async () => {
      const result = await (getKeyResultsByObjective as any)(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("title", "하자 발생률 5% 이하");
      expect(result[0]).toHaveProperty("targetValue", 5);
    });

    it("should update a key result", async () => {
      const result = await (updateKeyResult as any)(1, { currentValue: 4, status: "completed" });
      expect(result).toBe(true);
      expect(updateKeyResult).toHaveBeenCalledTimes(1);
    });
  });
});
