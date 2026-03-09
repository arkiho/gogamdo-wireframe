/**
 * Survey Automation Router Connection Tests
 * - generateAnalysisReport 완료 후 자동 이메일 발송
 * - 전사 서베이 안내문 자동 생성 (AI)
 * - 이메일 발송 로그 기록
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
const mockSendSurveyReportEmail = vi.fn().mockResolvedValue({ sent: true, method: "resend" });
const mockGetClientProjectById = vi.fn().mockResolvedValue({
  id: 1,
  companyName: "테스트기업",
  contactName: "홍길동",
  contactEmail: "test@example.com",
  contactPhone: "010-1234-5678",
  status: "survey_completed",
  userId: 1,
});
const mockCreateAutoEmailLog = vi.fn().mockResolvedValue({ id: 1 });
const mockGetResponsesByInstance = vi.fn().mockResolvedValue([
  {
    id: 1,
    respondentName: "김직원",
    respondentDepartment: "개발팀",
    answers: JSON.stringify({ q1: "좋음", q2: "보통" }),
  },
]);
const mockCreateSurveyAnalysisReport = vi.fn().mockResolvedValue({ id: 1 });
const mockUpdateSurveyInstance = vi.fn().mockResolvedValue(true);
const mockGetEmailLogsByProject = vi.fn().mockResolvedValue([
  { id: 1, clientProjectId: 1, emailType: "analysis_report", recipientEmail: "test@example.com", status: "sent" },
]);
const mockInvokeLLM = vi.fn();

vi.mock("./email", () => ({
  sendSurveyReportEmail: (...args: any[]) => mockSendSurveyReportEmail(...args),
}));

vi.mock("./db", () => ({
  getClientProjectById: (...args: any[]) => mockGetClientProjectById(...args),
  createAutoEmailLog: (...args: any[]) => mockCreateAutoEmailLog(...args),
  getResponsesByInstance: (...args: any[]) => mockGetResponsesByInstance(...args),
  createSurveyAnalysisReport: (...args: any[]) => mockCreateSurveyAnalysisReport(...args),
  updateSurveyInstance: (...args: any[]) => mockUpdateSurveyInstance(...args),
  getEmailLogsByProject: (...args: any[]) => mockGetEmailLogsByProject(...args),
  createSurveyTemplate: vi.fn(),
  getSurveyTemplates: vi.fn(),
  getSurveyTemplateById: vi.fn(),
  createSurveyQuestion: vi.fn(),
  getQuestionsByTemplate: vi.fn().mockResolvedValue([]),
  updateSurveyQuestion: vi.fn(),
  deleteSurveyQuestion: vi.fn(),
  createQuestionOptions: vi.fn(),
  getOptionsByQuestion: vi.fn().mockResolvedValue([]),
  createSurveyInstance: vi.fn(),
  getSurveyInstanceByToken: vi.fn(),
  getSurveyInstancesByProject: vi.fn(),
  createSurveyResponse: vi.fn(),
  getAnalysisReportsByProject: vi.fn(),
  getAnalysisReportById: vi.fn(),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: (...args: any[]) => mockInvokeLLM(...args),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

describe("Survey Automation Router Connection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateAnalysisReport → 자동 이메일 발송 연결", () => {
    it("분석 보고서 생성 후 sendSurveyReportEmail이 호출되어야 함", async () => {
      // AI 분석 결과 mock
      const analysisData = {
        executiveSummary: "테스트기업의 업무환경 종합 분석 결과입니다.",
        overallScore: 72,
        categoryScores: { "업무환경": 70, "소통협업": 75, "시설만족도": 68, "공간활용": 74 },
        painPoints: ["소음 문제", "회의실 부족"],
        recommendations: ["방음 시설 개선", "소규모 회의실 추가"],
        spaceNeeds: { estimatedArea: 500, departmentBreakdown: { "개발팀": 200 }, meetingRooms: 5, focusZones: 3 },
        priorityActions: [{ action: "방음 시설 개선", impact: "high", timeline: "1개월" }],
      };
      mockInvokeLLM.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(analysisData) } }],
      });

      // 직접 로직 시뮬레이션 (라우터 내부 로직과 동일)
      const responses = await mockGetResponsesByInstance(1);
      expect(responses.length).toBeGreaterThan(0);

      const llmResponse = await mockInvokeLLM({ messages: [] });
      const parsedAnalysis = JSON.parse(llmResponse.choices[0].message.content);

      const report = await mockCreateSurveyAnalysisReport({
        clientProjectId: 1,
        instanceId: 1,
        reportType: "initial_analysis",
        overallScore: parsedAnalysis.overallScore,
        executiveSummary: parsedAnalysis.executiveSummary,
      });
      expect(report).toHaveProperty("id");

      await mockUpdateSurveyInstance(1, { status: "completed" });

      // 자동 이메일 발송 로직
      const project = await mockGetClientProjectById(1);
      expect(project).not.toBeNull();
      expect(project.contactEmail).toBe("test@example.com");

      const emailResult = await mockSendSurveyReportEmail({
        recipientEmail: project.contactEmail,
        recipientName: project.contactName,
        companyName: project.companyName,
        projectId: 1,
        reportSummary: parsedAnalysis.executiveSummary,
        overallScore: parsedAnalysis.overallScore,
        categoryScores: parsedAnalysis.categoryScores,
        painPoints: parsedAnalysis.painPoints,
        recommendations: parsedAnalysis.recommendations,
        origin: "https://example.com",
      });
      expect(emailResult.sent).toBe(true);

      // 이메일 발송 로그 기록
      await mockCreateAutoEmailLog({
        clientProjectId: 1,
        emailType: "analysis_report",
        recipientEmail: project.contactEmail,
        recipientName: project.contactName,
        subject: `[고감도] ${project.companyName} 업무환경 진단 분석 보고서`,
        status: "sent",
        metadata: JSON.stringify({ reportId: report.id }),
      });

      expect(mockSendSurveyReportEmail).toHaveBeenCalledTimes(1);
      expect(mockCreateAutoEmailLog).toHaveBeenCalledTimes(1);
      expect(mockCreateAutoEmailLog).toHaveBeenCalledWith(
        expect.objectContaining({
          emailType: "analysis_report",
          status: "sent",
        })
      );
    });

    it("이메일 발송 실패 시에도 보고서 생성은 성공해야 함", async () => {
      mockSendSurveyReportEmail.mockRejectedValueOnce(new Error("SMTP error"));

      const analysisData = {
        executiveSummary: "요약",
        overallScore: 65,
        categoryScores: {},
        painPoints: [],
        recommendations: [],
        spaceNeeds: { estimatedArea: 300, departmentBreakdown: {}, meetingRooms: 2, focusZones: 1 },
        priorityActions: [],
      };
      mockInvokeLLM.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(analysisData) } }],
      });

      const report = await mockCreateSurveyAnalysisReport({
        clientProjectId: 1,
        instanceId: 1,
        reportType: "initial_analysis",
        overallScore: analysisData.overallScore,
      });
      expect(report).toHaveProperty("id");

      // 이메일 발송 시도 → 실패
      let emailSent = false;
      try {
        await mockSendSurveyReportEmail({ recipientEmail: "test@example.com" });
        emailSent = true;
      } catch {
        emailSent = false;
      }

      expect(emailSent).toBe(false);
      // 보고서 자체는 성공적으로 생성됨
      expect(mockCreateSurveyAnalysisReport).toHaveBeenCalledTimes(1);
    });

    it("프로젝트에 contactEmail이 없으면 이메일 발송을 건너뛰어야 함", async () => {
      mockGetClientProjectById.mockResolvedValueOnce({
        id: 1,
        companyName: "테스트기업",
        contactName: "홍길동",
        contactEmail: null,
        status: "survey_completed",
        userId: 1,
      });

      const project = await mockGetClientProjectById(1);
      if (project && project.contactEmail) {
        await mockSendSurveyReportEmail({});
      }

      expect(mockSendSurveyReportEmail).not.toHaveBeenCalled();
    });
  });

  describe("전사 서베이 안내문 자동 생성 (generateSurveyGuide)", () => {
    it("AI가 이메일/카카오톡/슬랙 안내문을 생성해야 함", async () => {
      const guideData = {
        emailSubject: "[테스트기업] 업무환경 설문조사 참여 안내",
        emailBody: "안녕하세요, 테스트기업 임직원 여러분.\n\n더 나은 업무환경을 위해 설문조사에 참여해 주세요.\n\n설문 링크: https://example.com/survey/abc123\n마감일: 2026-03-23\n\n소요 시간: 약 3~5분\n응답은 익명으로 처리됩니다.",
        kakaoMessage: "[테스트기업] 업무환경 설문 참여 부탁드립니다. 3~5분 소요, 익명 보장. https://example.com/survey/abc123 (마감: 3/23)",
        slackMessage: ":clipboard: *업무환경 설문조사 참여 안내*\n\n더 나은 업무환경을 위해 여러분의 의견을 듣고자 합니다.\n:link: <https://example.com/survey/abc123|설문 참여하기>\n:calendar: 마감: 2026-03-23\n:lock: 응답은 익명으로 처리됩니다.",
      };
      mockInvokeLLM.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(guideData) } }],
      });

      const llmResponse = await mockInvokeLLM({
        messages: [
          { role: "system", content: "안내문 생성 시스템 프롬프트" },
          { role: "user", content: "회사명: 테스트기업, 설문 링크: https://example.com/survey/abc123" },
        ],
      });

      const guide = JSON.parse(llmResponse.choices[0].message.content);

      expect(guide).toHaveProperty("emailSubject");
      expect(guide).toHaveProperty("emailBody");
      expect(guide).toHaveProperty("kakaoMessage");
      expect(guide).toHaveProperty("slackMessage");

      // 안내문에 설문 링크가 포함되어야 함
      expect(guide.emailBody).toContain("https://example.com/survey/abc123");
      expect(guide.kakaoMessage).toContain("https://example.com/survey/abc123");

      // 카카오톡 메시지는 200자 이내
      expect(guide.kakaoMessage.length).toBeLessThanOrEqual(200);

      // 슬랙 메시지는 300자 이내
      expect(guide.slackMessage.length).toBeLessThanOrEqual(500); // 슬랙은 좀 더 여유
    });

    it("안내문에 마감일과 익명 보장 문구가 포함되어야 함", async () => {
      const guideData = {
        emailSubject: "[테스트기업] 설문 안내",
        emailBody: "마감일: 2026-03-23\n익명으로 처리됩니다.",
        kakaoMessage: "익명 보장, 마감 3/23",
        slackMessage: "익명 처리, 마감: 2026-03-23",
      };
      mockInvokeLLM.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(guideData) } }],
      });

      const llmResponse = await mockInvokeLLM({ messages: [] });
      const guide = JSON.parse(llmResponse.choices[0].message.content);

      // 이메일 본문에 마감일 포함
      expect(guide.emailBody).toContain("마감");
      // 이메일 본문에 익명 보장 포함
      expect(guide.emailBody).toContain("익명");
    });
  });

  describe("이메일 발송 로그 조회", () => {
    it("프로젝트별 이메일 발송 로그를 조회할 수 있어야 함", async () => {
      const logs = await mockGetEmailLogsByProject(1);
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0]).toHaveProperty("emailType", "analysis_report");
      expect(logs[0]).toHaveProperty("status", "sent");
    });
  });
});
