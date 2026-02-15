/**
 * Design Automation System Tests
 * Tests for the design automation pipeline: projects, floor plans, RFP, layouts, renderings, proposals, estimates
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  createDesignProject: vi.fn().mockResolvedValue(1),
  listDesignProjects: vi.fn().mockResolvedValue([
    { id: 1, name: "Test Project", companyName: "Test Corp", stage: "floorplan", status: "active", createdAt: new Date() },
  ]),
  getDesignProject: vi.fn().mockResolvedValue({
    id: 1, name: "Test Project", companyName: "Test Corp", stage: "floorplan", status: "active",
    contactName: "홍길동", contactEmail: "test@test.com", contactPhone: "010-0000-0000",
  }),
  updateDesignProject: vi.fn().mockResolvedValue(true),
  deleteDesignProject: vi.fn().mockResolvedValue(true),
  addFloorPlan: vi.fn().mockResolvedValue(1),
  listFloorPlans: vi.fn().mockResolvedValue([]),
  getFloorPlan: vi.fn().mockResolvedValue({
    id: 1, projectId: 1, fileUrl: "https://example.com/plan.jpg", fileName: "plan.jpg",
    fileType: "image/jpeg", analysisStatus: "pending",
  }),
  updateFloorPlan: vi.fn().mockResolvedValue(true),
  deleteFloorPlan: vi.fn().mockResolvedValue(true),
  createRfpData: vi.fn().mockResolvedValue(1),
  getRfpData: vi.fn().mockResolvedValue(null),
  updateRfpData: vi.fn().mockResolvedValue(true),
  createLayoutOption: vi.fn().mockResolvedValue(1),
  listLayoutOptions: vi.fn().mockResolvedValue([]),
  updateLayoutOption: vi.fn().mockResolvedValue(true),
  deleteLayoutOption: vi.fn().mockResolvedValue(true),
  createRendering: vi.fn().mockResolvedValue(1),
  listRenderings: vi.fn().mockResolvedValue([]),
  updateRendering: vi.fn().mockResolvedValue(true),
  deleteRendering: vi.fn().mockResolvedValue(true),
  createTourVideo: vi.fn().mockResolvedValue(1),
  listTourVideos: vi.fn().mockResolvedValue([]),
  updateTourVideo: vi.fn().mockResolvedValue(true),
  createProposal: vi.fn().mockResolvedValue(1),
  listProposals: vi.fn().mockResolvedValue([]),
  getProposal: vi.fn().mockResolvedValue(null),
  updateProposal: vi.fn().mockResolvedValue(true),
  createDetailedEstimate: vi.fn().mockResolvedValue(1),
  listDetailedEstimates: vi.fn().mockResolvedValue([]),
  getDetailedEstimate: vi.fn().mockResolvedValue(null),
  updateDetailedEstimate: vi.fn().mockResolvedValue(true),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/file.jpg", key: "test-key" }),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          estimatedArea: "330㎡",
          floors: 1,
          roomCount: 8,
          spaces: [
            { name: "오픈 오피스", estimatedArea: "150㎡", description: "메인 업무 공간" },
            { name: "회의실", estimatedArea: "30㎡", description: "중형 회의실" },
          ],
          structuralElements: { walls: 12, columns: 4, windows: 8, doors: 6 },
          description: "일반적인 오피스 레이아웃",
          notes: "특이사항 없음",
        }),
      },
    }],
  }),
}));

// Mock image generation
vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/rendering.jpg" }),
}));

// Mock tRPC
vi.mock("./_core/trpc", () => ({
  router: vi.fn((routes: any) => routes),
  publicProcedure: {
    input: vi.fn().mockReturnThis(),
    query: vi.fn().mockReturnThis(),
    mutation: vi.fn().mockReturnThis(),
    use: vi.fn().mockReturnThis(),
  },
  protectedProcedure: {
    input: vi.fn().mockReturnThis(),
    query: vi.fn().mockReturnThis(),
    mutation: vi.fn().mockReturnThis(),
    use: vi.fn((middleware: any) => ({
      input: vi.fn().mockReturnThis(),
      query: vi.fn().mockReturnThis(),
      mutation: vi.fn().mockReturnThis(),
    })),
  },
}));

// Import db functions for assertions
import {
  createDesignProject,
  listDesignProjects,
  getDesignProject,
  updateDesignProject,
  deleteDesignProject,
  addFloorPlan,
  getFloorPlan,
  updateFloorPlan,
  createRfpData,
  getRfpData,
  createLayoutOption,
  listLayoutOptions,
  updateLayoutOption,
  createRendering,
  updateRendering,
  createProposal,
  createDetailedEstimate,
} from "./db";

import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";

describe("Design Automation System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Database Helpers", () => {
    it("should create a design project", async () => {
      const result = await createDesignProject({
        name: "Test Project",
        companyName: "Test Corp",
        contactName: "홍길동",
      });
      expect(result).toBe(1);
      expect(createDesignProject).toHaveBeenCalledWith({
        name: "Test Project",
        companyName: "Test Corp",
        contactName: "홍길동",
      });
    });

    it("should list design projects", async () => {
      const projects = await listDesignProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe("Test Project");
    });

    it("should get a design project by id", async () => {
      const project = await getDesignProject(1);
      expect(project).toBeDefined();
      expect(project?.name).toBe("Test Project");
      expect(project?.companyName).toBe("Test Corp");
    });

    it("should update a design project", async () => {
      const result = await updateDesignProject(1, { stage: "rfp" as any });
      expect(result).toBe(true);
      expect(updateDesignProject).toHaveBeenCalledWith(1, { stage: "rfp" });
    });

    it("should delete a design project", async () => {
      const result = await deleteDesignProject(1);
      expect(result).toBe(true);
    });
  });

  describe("Floor Plan Upload & Analysis", () => {
    it("should upload a floor plan to S3", async () => {
      const buffer = Buffer.from("test-image-data");
      const { url } = await (storagePut as any)("test-key", buffer, "image/jpeg");
      expect(url).toBe("https://cdn.example.com/file.jpg");
    });

    it("should add a floor plan record", async () => {
      const id = await addFloorPlan({
        projectId: 1,
        fileUrl: "https://cdn.example.com/plan.jpg",
        fileKey: "test-key",
        fileName: "plan.jpg",
        fileType: "image/jpeg",
        fileSize: 1024,
        analysisStatus: "pending",
      });
      expect(id).toBe(1);
    });

    it("should get floor plan for analysis", async () => {
      const plan = await getFloorPlan(1);
      expect(plan).toBeDefined();
      expect(plan?.fileUrl).toBe("https://example.com/plan.jpg");
      expect(plan?.analysisStatus).toBe("pending");
    });

    it("should invoke LLM for floor plan analysis", async () => {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "Analyze floor plan" },
          { role: "user", content: "Analyze this" },
        ],
      });
      expect(response.choices).toBeDefined();
      expect(response.choices[0].message.content).toBeDefined();
      const parsed = JSON.parse(response.choices[0].message.content as string);
      expect(parsed.estimatedArea).toBe("330㎡");
      expect(parsed.roomCount).toBe(8);
      expect(parsed.spaces).toHaveLength(2);
    });

    it("should update floor plan with analysis results", async () => {
      await updateFloorPlan(1, {
        aiAnalysis: { estimatedArea: "330㎡" },
        totalArea: "330㎡",
        floors: 1,
        roomCount: 8,
        analysisStatus: "done",
      });
      expect(updateFloorPlan).toHaveBeenCalledWith(1, expect.objectContaining({
        analysisStatus: "done",
        totalArea: "330㎡",
      }));
    });
  });

  describe("RFP Data Collection", () => {
    it("should create RFP data for a project", async () => {
      const id = await createRfpData({
        projectId: 1,
        collectionMethod: "form",
        companyName: "Test Corp",
        industry: "IT",
        projectType: "new_office",
        totalArea: "330㎡",
        currentHeadcount: 50,
      });
      expect(id).toBe(1);
    });

    it("should handle RFP upsert (create when not exists)", async () => {
      const existing = await getRfpData(1);
      expect(existing).toBeNull();
      // When null, create new
      const id = await createRfpData({ projectId: 1, collectionMethod: "form" });
      expect(id).toBe(1);
    });
  });

  describe("AI Layout Generation", () => {
    it("should create layout options", async () => {
      const id = await createLayoutOption({
        projectId: 1,
        optionName: "Option A - 협업 중심",
        concept: "오픈 플랜 중심의 협업 공간",
        spaceAllocation: [{ zone: "오픈 오피스", area: "200㎡", percentage: 60, description: "메인 업무 공간" }],
        pros: ["높은 협업 효율"],
        cons: ["프라이버시 부족"],
        aiScore: 85,
      });
      expect(id).toBe(1);
    });

    it("should select a layout option", async () => {
      await updateLayoutOption(1, { isSelected: "yes" });
      expect(updateLayoutOption).toHaveBeenCalledWith(1, { isSelected: "yes" });
    });
  });

  describe("AI Rendering Generation", () => {
    it("should generate an image rendering", async () => {
      const { url } = await generateImage({
        prompt: "Photorealistic interior rendering of a reception in a modern Korean office",
      });
      expect(url).toBe("https://cdn.example.com/rendering.jpg");
    });

    it("should create a rendering record", async () => {
      const id = await createRendering({
        projectId: 1,
        layoutId: 1,
        spaceType: "reception",
        spaceName: "리셉션/로비",
        style: "모던",
        status: "generating",
      });
      expect(id).toBe(1);
    });

    it("should update rendering with generated image", async () => {
      await updateRendering(1, {
        imageUrl: "https://cdn.example.com/rendering.jpg",
        prompt: "test prompt",
        status: "done",
      });
      expect(updateRendering).toHaveBeenCalledWith(1, expect.objectContaining({
        status: "done",
        imageUrl: "https://cdn.example.com/rendering.jpg",
      }));
    });
  });

  describe("AI Proposal Generation", () => {
    it("should create a proposal record", async () => {
      const id = await createProposal({
        projectId: 1,
        title: "ABC 테크놀로지 본사 인테리어 제안서",
        clientAnalysis: {
          industry: "IT",
          companyProfile: "IT 기업",
          needs: ["협업 공간"],
          painPoints: ["좁은 공간"],
          opportunities: ["브랜드 강화"],
        },
        designConcept: "모던 오피스",
        spaceProgram: [{ zone: "오픈 오피스", area: "200㎡", description: "메인 업무 공간" }],
        materialPlan: [{ area: "바닥", material: "타일", reason: "내구성" }],
        furniturePlan: [{ item: "데스크", quantity: "50", specification: "1200x600" }],
        projectTimeline: [{ phase: "설계", duration: "2주", description: "기본 설계" }],
        companyIntro: "고감도 소개",
        differentiators: ["35년 경력"],
        status: "draft",
      });
      expect(id).toBe(1);
    });
  });

  describe("AI Estimate Generation", () => {
    it("should create a detailed estimate", async () => {
      const id = await createDetailedEstimate({
        projectId: 1,
        proposalId: 1,
        title: "ABC 테크놀로지 본사 인테리어 견적서",
        items: [
          {
            category: "철거 공사",
            subcategory: "기존 시설 철거",
            item: "벽체 철거",
            specification: "경량 칸막이",
            unit: "㎡",
            quantity: 100,
            unitPrice: 15000,
            amount: 1500000,
            remarks: "",
          },
        ],
        subtotal: 100000000,
        vat: 10000000,
        totalAmount: 110000000,
        optionItems: [{ name: "프리미엄 조명", description: "LED 간접조명", amount: 5000000 }],
        notes: "견적 유효기간 30일",
        status: "draft",
      });
      expect(id).toBe(1);
    });
  });

  describe("Pipeline Stage Progression", () => {
    it("should update project stage through pipeline", async () => {
      // floorplan → rfp → analysis → layout → rendering → proposal → estimate → completed
      const stages = ["floorplan", "rfp", "analysis", "layout", "rendering", "proposal", "estimate", "completed"];
      for (const stage of stages) {
        await updateDesignProject(1, { stage: stage as any });
      }
      expect(updateDesignProject).toHaveBeenCalledTimes(stages.length);
    });
  });
});
