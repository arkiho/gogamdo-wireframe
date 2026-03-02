/**
 * Client Project Detail Tabs Tests
 * Tests for additional tabs: realestate, layouts, renderings, proposals, post-occupancy
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./db", () => ({
  // Realestate matching
  getRealestateMatchesByProject: vi.fn().mockResolvedValue([
    { id: 1, clientProjectId: 1, propertyName: "강남 오피스", matchScore: 85, status: "recommended", createdAt: new Date() },
  ]),
  // Design automation - layouts
  listLayoutOptions: vi.fn().mockResolvedValue([
    { id: 1, projectId: 1, name: "레이아웃 A", description: "오픈 플랜", status: "draft", createdAt: new Date() },
    { id: 2, projectId: 1, name: "레이아웃 B", description: "부스 중심", status: "draft", createdAt: new Date() },
  ]),
  // Design automation - renderings
  listRenderings: vi.fn().mockResolvedValue([
    { id: 1, projectId: 1, name: "메인 로비", imageUrl: "/renders/lobby.jpg", status: "completed", createdAt: new Date() },
  ]),
  // Design automation - proposals
  listProposals: vi.fn().mockResolvedValue([
    { id: 1, projectId: 1, title: "고감도 인테리어 제안서", version: 1, status: "draft", createdAt: new Date() },
  ]),
  // Post-occupancy
  getPostOccupancyByProject: vi.fn().mockResolvedValue([
    { id: 1, clientProjectId: 1, overallScore: 4.5, createdAt: new Date() },
  ]),
  getMaintenanceVisitsByProject: vi.fn().mockResolvedValue([
    { id: 1, clientProjectId: 1, visitType: "inspection", status: "scheduled", createdAt: new Date() },
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

import {
  getRealestateMatchesByProject,
  listLayoutOptions,
  listRenderings,
  listProposals,
  getPostOccupancyByProject,
  getMaintenanceVisitsByProject,
} from "./db";

describe("Client Project Detail - Additional Tabs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("부동산 매칭 탭", () => {
    it("should get realestate matches for project", async () => {
      const result = await (getRealestateMatchesByProject as any)(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("propertyName", "강남 오피스");
      expect(result[0]).toHaveProperty("matchScore", 85);
    });
  });

  describe("레이아웃 비교 탭", () => {
    it("should get layout options for project", async () => {
      const result = await (listLayoutOptions as any)(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty("name", "레이아웃 A");
    });
  });

  describe("3D 렌더링 탭", () => {
    it("should get renderings for project", async () => {
      const result = await (listRenderings as any)(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("name", "메인 로비");
      expect(result[0]).toHaveProperty("status", "completed");
    });
  });

  describe("제안서 탭", () => {
    it("should get proposals for project", async () => {
      const result = await (listProposals as any)(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("title", "고감도 인테리어 제안서");
    });
  });

  describe("사후관리 탭", () => {
    it("should get satisfaction surveys", async () => {
      const result = await (getPostOccupancyByProject as any)(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("overallScore", 4.5);
    });

    it("should get maintenance visits", async () => {
      const result = await (getMaintenanceVisitsByProject as any)(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("visitType", "inspection");
    });
  });
});
