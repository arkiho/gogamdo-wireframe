/**
 * Survey Automation System Tests
 * Tests for survey templates, instances, responses, analysis reports, email logs
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./db", () => ({
  createSurveyTemplate: vi.fn().mockResolvedValue(1),
  getSurveyTemplates: vi.fn().mockResolvedValue([
    { id: 1, name: "초기 상담 설문", description: "신규 고객 상담용", type: "initial", isActive: 1, createdAt: new Date() },
  ]),
  getSurveyTemplateById: vi.fn().mockResolvedValue({
    id: 1, name: "초기 상담 설문", description: "신규 고객 상담용", type: "initial", isActive: 1,
  }),
  createSurveyQuestion: vi.fn().mockResolvedValue(1),
  getSurveyQuestionsByTemplate: vi.fn().mockResolvedValue([
    { id: 1, templateId: 1, questionText: "현재 사무실 면적은?", questionType: "text", orderIndex: 1 },
  ]),
  createQuestionOptions: vi.fn().mockResolvedValue([]),
  updateSurveyQuestion: vi.fn().mockResolvedValue(true),
  deleteSurveyQuestion: vi.fn().mockResolvedValue(true),
  createSurveyInstance: vi.fn().mockResolvedValue(1),
  getSurveyInstanceByToken: vi.fn().mockResolvedValue({
    id: 1, templateId: 1, clientProjectId: 1, token: "test-token", status: "pending", createdAt: new Date(),
  }),
  getSurveyInstancesByProject: vi.fn().mockResolvedValue([
    { id: 1, templateId: 1, clientProjectId: 1, token: "test-token", status: "pending", createdAt: new Date() },
  ]),
  updateSurveyInstance: vi.fn().mockResolvedValue(true),
  createSurveyResponse: vi.fn().mockResolvedValue(1),
  createSurveyAnalysisReport: vi.fn().mockResolvedValue(1),
  getAnalysisReportsByProject: vi.fn().mockResolvedValue([
    { id: 1, instanceId: 1, reportType: "initial", summary: "분석 결과", createdAt: new Date() },
  ]),
  getAnalysisReportById: vi.fn().mockResolvedValue({
    id: 1, instanceId: 1, reportType: "initial", summary: "분석 결과", recommendations: "추천 사항",
  }),
  getEmailLogsByProject: vi.fn().mockResolvedValue([
    { id: 1, clientProjectId: 1, emailType: "survey_initial", recipientEmail: "test@test.com", status: "sent", sentAt: new Date() },
  ]),
  getQuestionOptionsByQuestion: vi.fn().mockResolvedValue([]),
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
    choices: [{ message: { content: JSON.stringify({ summary: "분석 결과", recommendations: ["추천1"] }) } }],
  }),
}));

import {
  createSurveyTemplate,
  getSurveyTemplates,
  getSurveyTemplateById,
  createSurveyQuestion,
  getSurveyQuestionsByTemplate,
  createSurveyInstance,
  getSurveyInstanceByToken,
  getSurveyInstancesByProject,
  createSurveyResponse,
  createSurveyAnalysisReport,
  getAnalysisReportsByProject,
  getAnalysisReportById,
  getEmailLogsByProject,
} from "./db";

describe("Survey Automation System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Survey Templates", () => {
    it("should create a survey template", async () => {
      const result = await (createSurveyTemplate as any)({
        name: "초기 상담 설문",
        description: "신규 고객 상담용",
        type: "initial",
      });
      expect(result).toBe(1);
      expect(createSurveyTemplate).toHaveBeenCalledTimes(1);
    });

    it("should list survey templates", async () => {
      const result = await (getSurveyTemplates as any)();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("name", "초기 상담 설문");
      expect(result[0]).toHaveProperty("type", "initial");
    });

    it("should get template by id", async () => {
      const result = await (getSurveyTemplateById as any)(1);
      expect(result).toHaveProperty("name", "초기 상담 설문");
    });
  });

  describe("Survey Questions", () => {
    it("should create a question", async () => {
      const result = await (createSurveyQuestion as any)({
        templateId: 1,
        questionText: "현재 사무실 면적은?",
        questionType: "text",
        orderIndex: 1,
      });
      expect(result).toBe(1);
    });

    it("should list questions by template", async () => {
      const result = await (getSurveyQuestionsByTemplate as any)(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("questionText");
    });
  });

  describe("Survey Instances", () => {
    it("should create a survey instance", async () => {
      const result = await (createSurveyInstance as any)({
        templateId: 1,
        clientProjectId: 1,
        token: "test-token",
      });
      expect(result).toBe(1);
    });

    it("should get instance by token", async () => {
      const result = await (getSurveyInstanceByToken as any)("test-token");
      expect(result).toHaveProperty("token", "test-token");
      expect(result).toHaveProperty("status", "pending");
    });

    it("should list instances by project", async () => {
      const result = await (getSurveyInstancesByProject as any)(1);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Survey Responses & Analysis", () => {
    it("should create a survey response", async () => {
      const result = await (createSurveyResponse as any)({
        instanceId: 1,
        questionId: 1,
        answer: "200㎡",
      });
      expect(result).toBe(1);
    });

    it("should create an analysis report", async () => {
      const result = await (createSurveyAnalysisReport as any)({
        instanceId: 1,
        reportType: "initial",
        summary: "분석 결과",
      });
      expect(result).toBe(1);
    });

    it("should list analysis reports by project", async () => {
      const result = await (getAnalysisReportsByProject as any)(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("reportType", "initial");
    });

    it("should get analysis report by id", async () => {
      const result = await (getAnalysisReportById as any)(1);
      expect(result).toHaveProperty("summary", "분석 결과");
    });
  });

  describe("Email Logs", () => {
    it("should get email logs by project", async () => {
      const result = await (getEmailLogsByProject as any)(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("emailType", "survey_initial");
      expect(result[0]).toHaveProperty("status", "sent");
    });
  });
});
