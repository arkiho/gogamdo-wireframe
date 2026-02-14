import { describe, it, expect, vi } from "vitest";

// Mock LLM for estimate analysis
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          marketComparison: "해당 견적은 서울 지역 사무실 인테리어 시장 평균 대비 적정 수준입니다.",
          costSavingTips: [
            "LPL 마감재를 활용하면 목공 비용을 15% 절감할 수 있습니다.",
            "기존 천장을 활용한 노출 천장 디자인으로 철거 비용을 줄일 수 있습니다.",
            "표준 사이즈 유리 파티션을 사용하면 맞춤 제작 대비 20% 절감됩니다.",
          ],
          qualityUpgradeTips: [
            "바닥재를 타일에서 포세린으로 변경하면 내구성이 크게 향상됩니다.",
            "간접 조명을 추가하면 공간 분위기가 크게 달라집니다.",
            "로비 영역에만 고급 마감재를 집중 투자하면 전체 인상이 달라집니다.",
          ],
          timeline: "설계 2주 → 인허가 1주 → 시공 6주 → 마무리 1주, 총 약 10주 소요 예상",
          riskFactors: [
            "건물 노후도에 따라 전기/배관 추가 공사가 발생할 수 있습니다.",
            "마감재 수급 상황에 따라 일정이 1-2주 지연될 수 있습니다.",
          ],
          benchmarkProjects: [
            { name: "IT기업 본사 리모델링", scale: "330㎡ (100평)", cost: "2.5억~3억원" },
            { name: "스타트업 오피스", scale: "200㎡ (60평)", cost: "1.2억~1.5억원" },
          ],
          recommendation: "프리미엄 등급의 선택은 해당 규모와 용도에 적합합니다. 로비와 회의실에 고급 마감을 집중하고, 일반 업무 공간은 실용적 마감으로 예산을 효율적으로 배분하시길 권장합니다.",
        }),
      },
    }],
  }),
}));

// Mock image generation
vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn().mockResolvedValue({ url: "https://example.com/test.jpg" }),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Mock DB
vi.mock("./db", () => ({
  createInquiry: vi.fn().mockResolvedValue({ success: true }),
  listInquiries: vi.fn().mockResolvedValue([]),
  updateInquiryStatus: vi.fn().mockResolvedValue({ success: true }),
  addSubscriber: vi.fn().mockResolvedValue({ success: true, isNew: true }),
  listSubscribers: vi.fn().mockResolvedValue([]),
  toggleSubscriberActive: vi.fn().mockResolvedValue({ success: true }),
  createEstimate: vi.fn().mockResolvedValue({ success: true }),
  listEstimates: vi.fn().mockResolvedValue([]),
  createLeadDownload: vi.fn().mockResolvedValue({ success: true }),
  listLeadDownloads: vi.fn().mockResolvedValue([]),
  upsertChatSession: vi.fn().mockResolvedValue({ success: true }),
  listChatSessions: vi.fn().mockResolvedValue([]),
  createStyleRecommendation: vi.fn().mockResolvedValue({ success: true }),
  listStyleRecommendations: vi.fn().mockResolvedValue([]),
  getDashboardStats: vi.fn().mockResolvedValue({ inquiries: 0, subscribers: 0, estimates: 0, newInquiries: 0 }),
}));

describe("AI Estimate Analysis", () => {
  it("should return structured analysis from LLM", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.estimate.aiAnalysis({
      spaceType: "사무실",
      area: 330,
      grade: "프리미엄",
      options: ["스마트 오피스", "방음 강화"],
      totalCost: 25000,
      breakdown: [
        { name: "설계/감리", cost: 2000 },
        { name: "목공/벽체", cost: 3750 },
        { name: "전기/통신", cost: 2750 },
        { name: "냉난방/환기", cost: 3250 },
        { name: "바닥재", cost: 2250 },
        { name: "가구/집기", cost: 3750 },
      ],
    });

    expect(result).toBeDefined();
    expect(result.analysis).toBeDefined();
    expect(result.analysis.marketComparison).toBeTruthy();
    expect(result.analysis.costSavingTips).toHaveLength(3);
    expect(result.analysis.qualityUpgradeTips).toHaveLength(3);
    expect(result.analysis.timeline).toBeTruthy();
    expect(result.analysis.riskFactors.length).toBeGreaterThanOrEqual(2);
    expect(result.analysis.benchmarkProjects.length).toBeGreaterThanOrEqual(2);
    expect(result.analysis.recommendation).toBeTruthy();
  });

  it("benchmark projects should have required fields", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.estimate.aiAnalysis({
      spaceType: "교육/공공",
      area: 200,
      grade: "스탠다드",
      options: [],
      totalCost: 9000,
      breakdown: [
        { name: "설계/감리", cost: 720 },
        { name: "목공/벽체", cost: 1350 },
      ],
    });

    for (const project of result.analysis.benchmarkProjects) {
      expect(project.name).toBeTruthy();
      expect(project.scale).toBeTruthy();
      expect(project.cost).toBeTruthy();
    }
  });
});
