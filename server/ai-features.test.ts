import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    id: "test-id",
    created: Date.now(),
    model: "test-model",
    choices: [{
      index: 0,
      message: {
        role: "assistant",
        content: "안녕하세요! 고감도 AI 인테리어 상담사입니다. 무엇을 도와드릴까요?",
      },
      finish_reason: "stop",
    }],
  }),
}));

// Mock image generation
vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn().mockResolvedValue({
    url: "https://example.com/test-image.png",
  }),
}));

// Mock DB functions
vi.mock("./db", () => ({
  upsertChatSession: vi.fn().mockResolvedValue({ success: true }),
  listChatSessions: vi.fn().mockResolvedValue([]),
  createStyleRecommendation: vi.fn().mockResolvedValue({ success: true }),
  listStyleRecommendations: vi.fn().mockResolvedValue([]),
  addSubscriber: vi.fn().mockResolvedValue({ success: true }),
  // Other db functions needed by routers
  createInquiry: vi.fn().mockResolvedValue({ success: true }),
  listInquiries: vi.fn().mockResolvedValue([]),
  updateInquiryStatus: vi.fn().mockResolvedValue({ success: true }),
  listSubscribers: vi.fn().mockResolvedValue([]),
  toggleSubscriberActive: vi.fn().mockResolvedValue({ success: true }),
  createEstimate: vi.fn().mockResolvedValue({ success: true }),
  listEstimates: vi.fn().mockResolvedValue([]),
  createLeadDownload: vi.fn().mockResolvedValue({ success: true }),
  listLeadDownloads: vi.fn().mockResolvedValue([]),
  getDashboardStats: vi.fn().mockResolvedValue({ inquiries: 0, subscribers: 0, estimates: 0, newInquiries: 0 }),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { upsertChatSession, createStyleRecommendation, addSubscriber } from "./db";

describe("AI Chat API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call LLM with system prompt and user messages", async () => {
    const messages = [
      { role: "user" as const, content: "30평 사무실 인테리어 비용이 얼마나 드나요?" },
    ];

    const result = await (invokeLLM as any)({
      messages: [
        { role: "system", content: expect.stringContaining("고감도") },
        ...messages,
      ],
    });

    expect(invokeLLM).toHaveBeenCalled();
    expect(result.choices[0].message.content).toBeTruthy();
    expect(typeof result.choices[0].message.content).toBe("string");
  });

  it("should return assistant response content", async () => {
    const result = await (invokeLLM as any)({
      messages: [{ role: "user", content: "test" }],
    });

    expect(result.choices).toHaveLength(1);
    expect(result.choices[0].message.role).toBe("assistant");
    expect(result.choices[0].message.content).toContain("고감도");
  });

  it("should save chat session to DB", async () => {
    const sessionData = {
      sessionId: "test_session_123",
      messages: [
        { role: "user", content: "안녕하세요" },
        { role: "assistant", content: "안녕하세요! 고감도입니다." },
      ],
    };

    await (upsertChatSession as any)(sessionData);

    expect(upsertChatSession).toHaveBeenCalledWith(sessionData);
  });

  it("should save contact info with chat session", async () => {
    const contactData = {
      sessionId: "test_session_123",
      messages: [],
      contactEmail: "test@example.com",
      contactName: "홍길동",
      contactPhone: "010-1234-5678",
    };

    await (upsertChatSession as any)(contactData);

    expect(upsertChatSession).toHaveBeenCalledWith(
      expect.objectContaining({
        contactEmail: "test@example.com",
        contactName: "홍길동",
      })
    );
  });

  it("should also add subscriber when contact is saved", async () => {
    await (addSubscriber as any)({
      email: "test@example.com",
      source: "ai_chatbot",
    });

    expect(addSubscriber).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "test@example.com",
        source: "ai_chatbot",
      })
    );
  });
});

describe("AI Style Recommendation API", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Override LLM mock for style recommendation (JSON response)
    (invokeLLM as any).mockResolvedValue({
      id: "test-id",
      created: Date.now(),
      model: "test-model",
      choices: [{
        index: 0,
        message: {
          role: "assistant",
          content: JSON.stringify({
            styleName: "모던 미니멀",
            description: "깔끔하고 절제된 디자인으로 집중력을 높이는 공간",
            colorPalette: [
              { name: "화이트", hex: "#FFFFFF", usage: "벽면" },
              { name: "차콜", hex: "#333333", usage: "가구" },
              { name: "골드", hex: "#C8A96E", usage: "포인트" },
              { name: "라이트그레이", hex: "#F0F0F0", usage: "바닥" },
              { name: "네이비", hex: "#1A1A3E", usage: "액센트" },
            ],
            materials: ["마이크로시멘트", "오크 원목", "스틸"],
            furniture: ["허먼밀러 에어론", "USM 모듈러", "스탠딩 데스크"],
            lighting: "간접 조명 + LED 패널",
            layout: "오픈 플로어 + 집중 부스 혼합",
            estimatedCostRange: "280~350만원",
            tips: ["자연광 활용", "식물 배치", "소음 차단"],
          }),
        },
        finish_reason: "stop",
      }],
    });
  });

  it("should call LLM with structured response format", async () => {
    const result = await (invokeLLM as any)({
      messages: [
        { role: "system", content: "당신은 전문 인테리어 디자인 컨설턴트입니다." },
        { role: "user", content: "IT 스타트업, 10명, 모던 미니멀" },
      ],
      response_format: {
        type: "json_schema",
        json_schema: expect.any(Object),
      },
    });

    expect(invokeLLM).toHaveBeenCalled();
    const content = JSON.parse(result.choices[0].message.content);
    expect(content.styleName).toBe("모던 미니멀");
    expect(content.colorPalette).toHaveLength(5);
  });

  it("should parse recommendation JSON correctly", async () => {
    const result = await (invokeLLM as any)({
      messages: [{ role: "user", content: "test" }],
    });

    const recommendation = JSON.parse(result.choices[0].message.content);

    expect(recommendation).toHaveProperty("styleName");
    expect(recommendation).toHaveProperty("description");
    expect(recommendation).toHaveProperty("colorPalette");
    expect(recommendation).toHaveProperty("materials");
    expect(recommendation).toHaveProperty("furniture");
    expect(recommendation).toHaveProperty("lighting");
    expect(recommendation).toHaveProperty("layout");
    expect(recommendation).toHaveProperty("estimatedCostRange");
    expect(recommendation).toHaveProperty("tips");
  });

  it("should generate AI image for recommended style", async () => {
    await (generateImage as any)({
      prompt: "Professional interior design photograph of a modern IT office space",
    });

    expect(generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("interior"),
      })
    );
  });

  it("should save style recommendation to DB", async () => {
    const data = {
      sessionId: "style_test_123",
      industry: "IT / 스타트업",
      teamSize: "6~15명",
      mood: "모던 미니멀",
      budget: "프리미엄",
      priorities: ["직원 집중도 향상", "협업 공간 확보"],
      resultJson: { styleName: "모던 미니멀" },
      imageUrl: "https://example.com/test.png",
      contactEmail: "test@example.com",
    };

    await (createStyleRecommendation as any)(data);

    expect(createStyleRecommendation).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "style_test_123",
        industry: "IT / 스타트업",
        mood: "모던 미니멀",
      })
    );
  });

  it("should handle missing contact email gracefully", async () => {
    const data = {
      sessionId: "style_test_456",
      industry: "금융 / 보험",
      teamSize: "31~50명",
      mood: "럭셔리 클래식",
      budget: "럭셔리",
      priorities: ["브랜드 이미지 강화"],
      resultJson: { styleName: "럭셔리 클래식" },
      imageUrl: null,
      contactEmail: null,
    };

    await (createStyleRecommendation as any)(data);

    expect(createStyleRecommendation).toHaveBeenCalledWith(
      expect.objectContaining({
        contactEmail: null,
      })
    );
  });

  it("should add subscriber when email is provided", async () => {
    await (addSubscriber as any)({
      email: "test@example.com",
      source: "ai_style_recommend",
    });

    expect(addSubscriber).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "test@example.com",
        source: "ai_style_recommend",
      })
    );
  });
});
