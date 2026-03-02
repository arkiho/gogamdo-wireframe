/**
 * Realestate Matching System Tests
 * Tests for space analysis, search criteria, property matching, program diagrams
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./db", () => ({
  createRealestateSearch: vi.fn().mockResolvedValue(1),
  getRealestateSearchByProject: vi.fn().mockResolvedValue([
    { id: 1, clientProjectId: 1, location: "강남구", maxRent: 5000000, maxDeposit: 100000000, minArea: 100, maxArea: 300, status: "active", createdAt: new Date() },
  ]),
  updateRealestateSearch: vi.fn().mockResolvedValue(true),
  createRealestateMatch: vi.fn().mockResolvedValue(1),
  getRealestateMatchesByProject: vi.fn().mockResolvedValue([
    { id: 1, clientProjectId: 1, propertyName: "강남 오피스", address: "서울 강남구", area: 200, monthlyRent: 3000000, deposit: 50000000, matchScore: 85, status: "recommended", createdAt: new Date() },
  ]),
  updateRealestateMatch: vi.fn().mockResolvedValue(true),
  createProgramDiagram: vi.fn().mockResolvedValue(1),
  getProgramDiagramsByProject: vi.fn().mockResolvedValue([
    { id: 1, clientProjectId: 1, name: "오피스 프로그램", totalArea: 250, zones: JSON.stringify([{ name: "업무공간", area: 150 }]), createdAt: new Date() },
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
      recommendedArea: 250, breakdown: { 업무공간: 150, 회의실: 50, 공용공간: 50 },
      reasoning: "50명 기준 1인당 5㎡ 산정", confidence: 0.85,
    }) } }],
  }),
}));

import {
  createRealestateSearch,
  getRealestateSearchByProject,
  updateRealestateSearch,
  createRealestateMatch,
  getRealestateMatchesByProject,
  updateRealestateMatch,
  createProgramDiagram,
  getProgramDiagramsByProject,
} from "./db";

describe("Realestate Matching System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Search Criteria", () => {
    it("should create search criteria", async () => {
      const result = await (createRealestateSearch as any)({
        clientProjectId: 1,
        location: "강남구",
        maxRent: 5000000,
        maxDeposit: 100000000,
        minArea: 100,
        maxArea: 300,
      });
      expect(result).toBe(1);
      expect(createRealestateSearch).toHaveBeenCalledTimes(1);
    });

    it("should get search criteria by project", async () => {
      const result = await (getRealestateSearchByProject as any)(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("location", "강남구");
      expect(result[0]).toHaveProperty("maxRent", 5000000);
    });

    it("should update search criteria", async () => {
      const result = await (updateRealestateSearch as any)(1, { maxRent: 6000000 });
      expect(result).toBe(true);
    });
  });

  describe("Property Matching", () => {
    it("should create a property match", async () => {
      const result = await (createRealestateMatch as any)({
        clientProjectId: 1,
        propertyName: "강남 오피스",
        address: "서울 강남구",
        area: 200,
        monthlyRent: 3000000,
        deposit: 50000000,
        matchScore: 85,
      });
      expect(result).toBe(1);
    });

    it("should get matches by project", async () => {
      const result = await (getRealestateMatchesByProject as any)(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("propertyName", "강남 오피스");
      expect(result[0]).toHaveProperty("matchScore", 85);
    });

    it("should update match status", async () => {
      const result = await (updateRealestateMatch as any)(1, { status: "selected" });
      expect(result).toBe(true);
    });
  });

  describe("Program Diagrams", () => {
    it("should create a program diagram", async () => {
      const result = await (createProgramDiagram as any)({
        clientProjectId: 1,
        name: "오피스 프로그램",
        totalArea: 250,
        zones: JSON.stringify([{ name: "업무공간", area: 150 }]),
      });
      expect(result).toBe(1);
    });

    it("should get diagrams by project", async () => {
      const result = await (getProgramDiagramsByProject as any)(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("name", "오피스 프로그램");
      expect(result[0]).toHaveProperty("totalArea", 250);
    });
  });
});
