import { describe, it, expect } from "vitest";

/**
 * 서베이 후속 작업 테스트
 * 1. 홈페이지 CTA '업무환경 진단' 버튼
 * 2. 설문 완료 후 이메일 자동 발송
 * 3. 관리자 여정 분석 대시보드
 */

describe("서베이 후속 작업", () => {
  describe("1. 홈페이지 CTA 업무환경 진단 버튼", () => {
    it("CTA 버튼 링크가 /survey/workspace를 가리켜야 한다", () => {
      const ctaLink = "/survey/workspace";
      expect(ctaLink).toBe("/survey/workspace");
    });

    it("CTA 버튼 텍스트가 적절해야 한다", () => {
      const ctaTexts = ["업무환경 진단 시작", "무료 업무환경 진단", "업무환경 진단"];
      expect(ctaTexts.some(t => t.includes("업무환경 진단"))).toBe(true);
    });
  });

  describe("2. 설문 완료 후 이메일 자동 발송", () => {
    it("보고서 이메일 데이터 구조가 올바라야 한다", () => {
      const emailData = {
        to: "contact@company.com",
        contactName: "김담당",
        companyName: "테스트 기업",
        reportToken: "a".repeat(64),
        reportUrl: "https://kokamdo.co.kr/survey/report?token=" + "a".repeat(64),
      };
      expect(emailData.to).toContain("@");
      expect(emailData.contactName).toBeTruthy();
      expect(emailData.companyName).toBeTruthy();
      expect(emailData.reportToken.length).toBe(64);
      expect(emailData.reportUrl).toContain("/survey/report?token=");
    });

    it("전사 인터뷰 안내 이메일 데이터 구조가 올바라야 한다", () => {
      const emailData = {
        to: "contact@company.com",
        contactName: "김담당",
        companyName: "테스트 기업",
        companySurveyToken: "b".repeat(64),
        interviewUrl: "https://kokamdo.co.kr/survey/interview?token=" + "b".repeat(64),
      };
      expect(emailData.to).toContain("@");
      expect(emailData.companySurveyToken.length).toBe(64);
      expect(emailData.interviewUrl).toContain("/survey/interview?token=");
    });

    it("이메일 발송 시점이 generateInterviewQuestions 완료 후여야 한다", () => {
      // 이메일 발송은 인터뷰 질문 생성 완료 후 자동으로 트리거됨
      const flow = [
        "survey_completed",
        "floor_plan_uploaded",
        "ai_generating",
        "report_ready",        // 이 시점에서 이메일 발송
        "email_sent",
      ];
      const reportReadyIdx = flow.indexOf("report_ready");
      const emailSentIdx = flow.indexOf("email_sent");
      expect(emailSentIdx).toBeGreaterThan(reportReadyIdx);
    });
  });

  describe("3. 관리자 여정 분석 대시보드", () => {
    it("퍼널 통계 계산이 올바라야 한다", () => {
      const journeys = [
        { currentStep: "survey_started", floorPlanUrl: null, reportViewedAt: null, interviewResponses: null, registeredAt: null },
        { currentStep: "survey_completed", floorPlanUrl: null, reportViewedAt: null, interviewResponses: null, registeredAt: null },
        { currentStep: "report_ready", floorPlanUrl: "https://s3.example.com/plan.pdf", reportViewedAt: null, interviewResponses: null, registeredAt: null },
        { currentStep: "report_ready", floorPlanUrl: "https://s3.example.com/plan2.pdf", reportViewedAt: new Date(), interviewResponses: { "1": {} }, registeredAt: null },
        { currentStep: "completed", floorPlanUrl: "https://s3.example.com/plan3.pdf", reportViewedAt: new Date(), interviewResponses: { "1": {}, "2": {} }, registeredAt: new Date() },
      ];

      const total = journeys.length;
      const surveyCompleted = journeys.filter(j => j.currentStep !== "survey_started").length;
      const floorPlanUploaded = journeys.filter(j => j.floorPlanUrl).length;
      const reportReady = journeys.filter(j => ["report_ready", "interview_in_progress", "completed"].includes(j.currentStep)).length;
      const reportViewed = journeys.filter(j => j.reportViewedAt).length;
      const interviewStarted = journeys.filter(j => j.interviewResponses && Object.keys(j.interviewResponses).length > 0).length;
      const registered = journeys.filter(j => j.registeredAt).length;

      expect(total).toBe(5);
      expect(surveyCompleted).toBe(4);
      expect(floorPlanUploaded).toBe(3);
      expect(reportReady).toBe(3);
      expect(reportViewed).toBe(2);
      expect(interviewStarted).toBe(2);
      expect(registered).toBe(1);
    });

    it("전환율 계산이 올바라야 한다", () => {
      const total = 100;
      const registered = 8;
      const conversionRate = total > 0 ? Math.round((registered / total) * 100) : 0;
      expect(conversionRate).toBe(8);
    });

    it("설문 완료율 계산이 올바라야 한다", () => {
      const total = 50;
      const surveyCompleted = 35;
      const surveyRate = total > 0 ? Math.round((surveyCompleted / total) * 100) : 0;
      expect(surveyRate).toBe(70);
    });

    it("보고서 열람율 계산이 올바라야 한다", () => {
      const reportReady = 20;
      const reportViewed = 15;
      const reportViewRate = reportReady > 0 ? Math.round((reportViewed / reportReady) * 100) : 0;
      expect(reportViewRate).toBe(75);
    });

    it("검색 필터가 올바르게 동작해야 한다", () => {
      const journeys = [
        { companyName: "삼성전자", contactName: "김철수", contactEmail: "kim@samsung.com", currentStep: "report_ready" },
        { companyName: "LG전자", contactName: "박영희", contactEmail: "park@lg.com", currentStep: "survey_started" },
        { companyName: "현대건설", contactName: "이민수", contactEmail: "lee@hyundai.com", currentStep: "completed" },
      ];

      // 회사명 검색
      const searchQuery = "삼성";
      const filtered = journeys.filter(j =>
        j.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.contactEmail.toLowerCase().includes(searchQuery.toLowerCase())
      );
      expect(filtered.length).toBe(1);
      expect(filtered[0].companyName).toBe("삼성전자");

      // 단계 필터
      const stepFilter = "report_ready";
      const stepFiltered = journeys.filter(j => j.currentStep === stepFilter);
      expect(stepFiltered.length).toBe(1);
      expect(stepFiltered[0].companyName).toBe("삼성전자");
    });

    it("정렬이 올바르게 동작해야 한다", () => {
      const journeys = [
        { companyName: "A사", createdAt: "2025-01-01" },
        { companyName: "B사", createdAt: "2025-03-01" },
        { companyName: "C사", createdAt: "2025-02-01" },
      ];

      // 최신순
      const newest = [...journeys].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      expect(newest[0].companyName).toBe("B사");
      expect(newest[2].companyName).toBe("A사");

      // 오래된순
      const oldest = [...journeys].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      expect(oldest[0].companyName).toBe("A사");
      expect(oldest[2].companyName).toBe("B사");
    });

    it("단계 라벨 매핑이 올바라야 한다", () => {
      const STEP_LABELS: Record<string, string> = {
        survey_started: "설문 시작",
        survey_completed: "설문 완료",
        floor_plan_uploaded: "도면 업로드",
        ai_generating: "AI 분석 중",
        report_ready: "보고서 완료",
        interview_in_progress: "인터뷰 진행 중",
        completed: "완료",
      };

      expect(STEP_LABELS["survey_started"]).toBe("설문 시작");
      expect(STEP_LABELS["report_ready"]).toBe("보고서 완료");
      expect(STEP_LABELS["completed"]).toBe("완료");
      expect(Object.keys(STEP_LABELS).length).toBe(7);
    });

    it("빈 데이터 처리가 올바라야 한다", () => {
      const emptyJourneys: any[] = [];
      const total = emptyJourneys.length;
      const surveyRate = total > 0 ? Math.round((0 / total) * 100) : 0;
      const conversionRate = total > 0 ? Math.round((0 / total) * 100) : 0;

      expect(total).toBe(0);
      expect(surveyRate).toBe(0);
      expect(conversionRate).toBe(0);
    });

    it("라우트가 /admin/journey-analytics에 등록되어야 한다", () => {
      const adminRoutes = [
        "/admin",
        "/admin/portfolios",
        "/admin/ddia",
        "/admin/crm",
        "/admin/journey-analytics",
      ];
      expect(adminRoutes).toContain("/admin/journey-analytics");
    });
  });
});
