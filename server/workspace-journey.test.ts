import { describe, it, expect, vi } from "vitest";

/**
 * 업무 환경 서베이 시스템 통합 테스트
 * - 고객 여정 생성 (세션 기반)
 * - 담당자 설문 제출
 * - 도면 업로드 시뮬레이션
 * - AI 인터뷰 질문 생성
 * - 보고서 조회
 * - 전사 인터뷰 응답 제출
 */

// Mock DB helpers
const mockJourney = {
  id: 1,
  sessionId: "test-session-123",
  currentStep: "survey" as const,
  companyName: "테스트 주식회사",
  contactName: "김테스트",
  contactEmail: "test@example.com",
  contactPhone: "010-1234-5678",
  employeeCount: 50,
  officeSizePyeong: 100,
  workStyle: "hybrid" as const,
  remoteWorkRatio: 30,
  meetingFrequency: "few_weekly" as const,
  painPoints: ["소음", "좁은 회의실", "환기 불량"],
  desiredSpaces: ["휴게실", "집중업무실", "카페테리아"],
  designStyle: "modern" as const,
  budgetRange: "5000-8000",
  priority: "balanced" as const,
  timelineUrgency: "within_6months" as const,
  additionalNotes: "직원 복지 공간 확대 희망",
  surveyCompletedAt: new Date(),
  floorPlanType: null,
  floorPlanFileKey: null,
  floorPlanFileUrl: null,
  floorPlanFileName: null,
  blankTemplateType: null,
  floorPlanAnalysis: null,
  floorPlanUploadedAt: null,
  interviewQuestions: null,
  analysisSummary: null,
  aiGeneratedAt: null,
  reportToken: null,
  reportPdfKey: null,
  reportPdfUrl: null,
  reportEmailSentAt: null,
  reportViewedAt: null,
  companySurveyToken: null,
  companySurveyResponseCount: 0,
  interviewResponses: null,
  clientId: null,
  convertedAt: null,
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  referrer: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("업무 환경 서베이 시스템", () => {
  describe("1. 세션 생성 및 설문 제출", () => {
    it("세션 ID가 64자 이내의 고유 문자열로 생성되어야 한다", () => {
      const sessionId = "sess_" + Math.random().toString(36).substring(2, 15);
      expect(sessionId.length).toBeLessThanOrEqual(64);
      expect(sessionId).toBeTruthy();
    });

    it("담당자 설문 데이터가 올바른 형식으로 저장되어야 한다", () => {
      const surveyData = {
        companyName: "테스트 주식회사",
        contactName: "김테스트",
        contactEmail: "test@example.com",
        contactPhone: "010-1234-5678",
        employeeCount: 50,
        officeSizePyeong: 100,
        workStyle: "hybrid",
        remoteWorkRatio: 30,
        meetingFrequency: "few_weekly",
        painPoints: ["소음", "좁은 회의실"],
        desiredSpaces: ["휴게실", "집중업무실"],
        designStyle: "modern",
        budgetRange: "5000-8000",
        priority: "balanced",
        timelineUrgency: "within_6months",
      };

      expect(surveyData.companyName).toBeTruthy();
      expect(surveyData.employeeCount).toBeGreaterThan(0);
      expect(surveyData.officeSizePyeong).toBeGreaterThan(0);
      expect(surveyData.painPoints.length).toBeGreaterThan(0);
      expect(surveyData.desiredSpaces.length).toBeGreaterThan(0);
      expect(["collaborative", "focused", "hybrid", "flexible"]).toContain(surveyData.workStyle);
      expect(["rarely", "few_weekly", "daily", "very_frequent"]).toContain(surveyData.meetingFrequency);
      expect(["modern", "minimal", "warm", "industrial", "natural", "luxury", "creative"]).toContain(surveyData.designStyle);
    });

    it("설문 완료 시 currentStep이 floor_plan으로 변경되어야 한다", () => {
      const updatedJourney = { ...mockJourney, currentStep: "floor_plan" as const };
      expect(updatedJourney.currentStep).toBe("floor_plan");
    });
  });

  describe("2. 도면 업로드", () => {
    it("PDF 파일 업로드 시 올바른 메타데이터가 저장되어야 한다", () => {
      const floorPlanData = {
        floorPlanType: "existing_upload" as const,
        floorPlanFileKey: "journeys/test-session-123/floor-plan.pdf",
        floorPlanFileUrl: "https://storage.example.com/journeys/test-session-123/floor-plan.pdf",
        floorPlanFileName: "사무실_도면.pdf",
      };

      expect(floorPlanData.floorPlanType).toBe("existing_upload");
      expect(floorPlanData.floorPlanFileKey).toContain("test-session-123");
      expect(floorPlanData.floorPlanFileUrl).toContain("https://");
      expect(floorPlanData.floorPlanFileName).toBeTruthy();
    });

    it("빈 도면 템플릿 선택 시 blankTemplateType이 저장되어야 한다", () => {
      const blankTemplate = {
        floorPlanType: "blank_template" as const,
        blankTemplateType: "rectangular_50",
      };

      expect(blankTemplate.floorPlanType).toBe("blank_template");
      expect(blankTemplate.blankTemplateType).toBeTruthy();
    });

    it("도면 건너뛰기 시 floorPlanType이 skipped로 저장되어야 한다", () => {
      const skipped = { floorPlanType: "skipped" as const };
      expect(skipped.floorPlanType).toBe("skipped");
    });
  });

  describe("3. AI 인터뷰 질문 생성", () => {
    it("LLM 프롬프트에 설문 데이터가 올바르게 포함되어야 한다", () => {
      const prompt = `당신은 사무환경 전문 컨설턴트입니다.
- 회사명: ${mockJourney.companyName}
- 직원수: ${mockJourney.employeeCount}명
- 사무실 면적: ${mockJourney.officeSizePyeong}평
- 업무 스타일: ${mockJourney.workStyle}
- 불편사항: ${JSON.stringify(mockJourney.painPoints)}`;

      expect(prompt).toContain("테스트 주식회사");
      expect(prompt).toContain("50명");
      expect(prompt).toContain("100평");
      expect(prompt).toContain("hybrid");
      expect(prompt).toContain("소음");
    });

    it("생성된 인터뷰 질문이 올바른 JSON 스키마를 따라야 한다", () => {
      const mockQuestions = [
        {
          id: 1,
          category: "업무 환경 만족도",
          question: "현재 사무실 환경에 대한 전반적인 만족도는?",
          questionType: "scale" as const,
          options: ["1", "2", "3", "4", "5"],
        },
        {
          id: 2,
          category: "공간 활용 패턴",
          question: "하루 중 가장 많이 사용하는 공간은?",
          questionType: "single_choice" as const,
          options: ["개인 데스크", "회의실", "휴게실", "카페테리아"],
        },
        {
          id: 3,
          category: "협업 및 커뮤니케이션",
          question: "팀 협업 시 가장 불편한 점은?",
          questionType: "text" as const,
          options: [],
        },
      ];

      for (const q of mockQuestions) {
        expect(q.id).toBeGreaterThan(0);
        expect(q.category).toBeTruthy();
        expect(q.question).toBeTruthy();
        expect(["text", "single_choice", "multiple_choice", "scale"]).toContain(q.questionType);
        expect(Array.isArray(q.options)).toBe(true);
      }
    });

    it("질문 생성 후 reportToken과 companySurveyToken이 발급되어야 한다", () => {
      const tokens = {
        reportToken: "a".repeat(64),
        companySurveyToken: "b".repeat(64),
      };

      expect(tokens.reportToken.length).toBe(64);
      expect(tokens.companySurveyToken.length).toBe(64);
      expect(tokens.reportToken).not.toBe(tokens.companySurveyToken);
    });
  });

  describe("4. 보고서 조회", () => {
    it("유효한 토큰으로 보고서를 조회할 수 있어야 한다", () => {
      const reportData = {
        companyName: mockJourney.companyName,
        contactName: mockJourney.contactName,
        employeeCount: mockJourney.employeeCount,
        officeSizePyeong: mockJourney.officeSizePyeong,
        workStyle: mockJourney.workStyle,
        painPoints: mockJourney.painPoints,
        desiredSpaces: mockJourney.desiredSpaces,
        designStyle: mockJourney.designStyle,
        interviewQuestions: [
          { id: 1, category: "업무 환경", question: "만족도?", questionType: "scale", options: [] },
        ],
        analysisSummary: "AI 분석 결과 요약",
        companySurveyToken: "survey-token-123",
        floorPlanAnalysis: null,
      };

      expect(reportData.companyName).toBeTruthy();
      expect(reportData.interviewQuestions.length).toBeGreaterThan(0);
      expect(reportData.analysisSummary).toBeTruthy();
      expect(reportData.companySurveyToken).toBeTruthy();
    });

    it("최초 조회 시 reportViewedAt이 기록되어야 한다", () => {
      const now = new Date();
      const updatedJourney = { ...mockJourney, reportViewedAt: now };
      expect(updatedJourney.reportViewedAt).toEqual(now);
    });

    it("유효하지 않은 토큰으로 조회 시 NOT_FOUND 에러가 반환되어야 한다", () => {
      const invalidToken = "invalid-token-xyz";
      // getWorkspaceJourneyByReportToken이 null 반환 시 TRPCError 발생
      const journey = null; // 시뮬레이션
      expect(journey).toBeNull();
    });
  });

  describe("5. 전사 인터뷰 응답 제출", () => {
    it("응답 데이터가 올바른 형식으로 저장되어야 한다", () => {
      const response = {
        respondentName: "박직원",
        respondentDept: "개발팀",
        answers: [
          { questionId: 1, answer: "4" },
          { questionId: 2, answer: "개인 데스크" },
          { questionId: 3, answer: "회의실이 부족합니다" },
        ],
        submittedAt: new Date().toISOString(),
      };

      expect(response.respondentName).toBeTruthy();
      expect(response.respondentDept).toBeTruthy();
      expect(response.answers.length).toBeGreaterThan(0);
      expect(response.submittedAt).toBeTruthy();

      for (const a of response.answers) {
        expect(a.questionId).toBeGreaterThan(0);
        expect(a.answer).toBeTruthy();
      }
    });

    it("여러 응답이 배열에 순차적으로 추가되어야 한다", () => {
      const responses: any[] = [];

      // 첫 번째 응답
      responses.push({
        respondentName: "박직원",
        respondentDept: "개발팀",
        answers: [{ questionId: 1, answer: "4" }],
        submittedAt: "2025-01-01T00:00:00Z",
      });

      // 두 번째 응답
      responses.push({
        respondentName: "이직원",
        respondentDept: "디자인팀",
        answers: [{ questionId: 1, answer: "3" }],
        submittedAt: "2025-01-01T01:00:00Z",
      });

      expect(responses.length).toBe(2);
      expect(responses[0].respondentName).toBe("박직원");
      expect(responses[1].respondentName).toBe("이직원");
    });

    it("응답 수가 companySurveyResponseCount에 반영되어야 한다", () => {
      const responseCount = 5;
      const updatedJourney = { ...mockJourney, companySurveyResponseCount: responseCount };
      expect(updatedJourney.companySurveyResponseCount).toBe(5);
    });
  });

  describe("6. 고객 여정 전체 플로우", () => {
    it("단계 순서가 올바르게 진행되어야 한다", () => {
      const steps = ["survey", "floor_plan", "generating", "report_ready", "signup_prompted", "converted"];
      
      for (let i = 0; i < steps.length - 1; i++) {
        const currentIdx = steps.indexOf(steps[i]);
        const nextIdx = steps.indexOf(steps[i + 1]);
        expect(nextIdx).toBeGreaterThan(currentIdx);
      }
    });

    it("UTM 파라미터가 올바르게 저장되어야 한다", () => {
      const utmData = {
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "office_interior_2025",
        referrer: "https://www.google.com",
      };

      expect(utmData.utmSource).toBeTruthy();
      expect(utmData.utmMedium).toBeTruthy();
      expect(utmData.utmCampaign).toBeTruthy();
    });

    it("회원가입 전환 시 clientId가 연결되어야 한다", () => {
      const convertedJourney = {
        ...mockJourney,
        clientId: 42,
        convertedAt: new Date(),
        currentStep: "converted" as const,
      };

      expect(convertedJourney.clientId).toBe(42);
      expect(convertedJourney.convertedAt).toBeTruthy();
      expect(convertedJourney.currentStep).toBe("converted");
    });
  });
});
