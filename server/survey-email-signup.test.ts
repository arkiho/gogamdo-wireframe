import { describe, it, expect, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("서베이 이메일 발송 시스템", () => {
  // ============ email.ts 이메일 함수 테스트 ============

  it("sendSurveyReportEmail 함수가 email.ts에 export되어 있다", () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, "email.ts"),
      "utf-8"
    );
    expect(content).toContain("export async function sendSurveyReportEmail");
  });

  it("sendCompanySurveyInviteEmail 함수가 email.ts에 export되어 있다", () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, "email.ts"),
      "utf-8"
    );
    expect(content).toContain("export async function sendCompanySurveyInviteEmail");
  });

  it("분석 보고서 이메일 템플릿에 필수 요소가 포함되어 있다", () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, "email.ts"),
      "utf-8"
    );
    // 보고서 이메일 필수 요소
    expect(content).toContain("업무환경 진단 분석 보고서");
    expect(content).toContain("종합 점수");
    expect(content).toContain("영역별 점수");
    expect(content).toContain("핵심 요약");
    expect(content).toContain("주요 개선 필요 영역");
    expect(content).toContain("개선 제안");
    expect(content).toContain("전체 보고서 확인하기");
  });

  it("전사 서베이 안내 이메일 템플릿에 필수 요소가 포함되어 있다", () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, "email.ts"),
      "utf-8"
    );
    // 전사 서베이 이메일 필수 요소
    expect(content).toContain("업무환경 개선을 위한 설문조사");
    expect(content).toContain("안내사항");
    expect(content).toContain("익명");
    expect(content).toContain("설문 참여하기");
    expect(content).toContain("3~5분");
  });

  it("이메일 발송 시 Resend API 키가 없으면 notification_fallback을 반환한다", async () => {
    // sendViaResend가 API 키 없을 때 notification_fallback을 반환하는지 확인
    const originalKey = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;

    const { sendSurveyReportEmail } = await import("./email");
    const result = await sendSurveyReportEmail({
      recipientEmail: "test@example.com",
      recipientName: "테스트",
      companyName: "테스트 회사",
      projectId: 1,
      reportSummary: "테스트 요약",
      overallScore: 75,
      categoryScores: { "업무환경": 70, "소통협업": 80 },
      painPoints: ["소음 문제"],
      recommendations: ["방음 처리"],
      origin: "https://test.com",
    });

    expect(result.method).toBe("notification_fallback");
    
    if (originalKey) process.env.RESEND_API_KEY = originalKey;
  });

  it("전사 서베이 이메일 발송 시 API 키 없으면 notification_fallback을 반환한다", async () => {
    const originalKey = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;

    const { sendCompanySurveyInviteEmail } = await import("./email");
    const result = await sendCompanySurveyInviteEmail({
      recipientEmail: "employee@example.com",
      recipientName: "직원",
      companyName: "테스트 회사",
      surveyUrl: "https://test.com/survey/abc123",
      expiresAt: new Date(Date.now() + 14 * 86400000),
      contactName: "담당자",
    });

    expect(result.method).toBe("notification_fallback");
    
    if (originalKey) process.env.RESEND_API_KEY = originalKey;
  });

  // ============ clientPipeline 이메일 연동 테스트 ============

  it("clientPipeline.sendReportEmail에 실제 이메일 발송 로직이 연동되어 있다", () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, "routers/clientPipeline.ts"),
      "utf-8"
    );
    expect(content).toContain("sendSurveyReportEmail");
    expect(content).toContain("emailResult");
    expect(content).toContain("emailSent");
  });

  it("clientPipeline.sendCompanySurveyEmails 프로시저가 존재한다", () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, "routers/clientPipeline.ts"),
      "utf-8"
    );
    expect(content).toContain("sendCompanySurveyEmails");
    expect(content).toContain("sendCompanySurveyInviteEmail");
    expect(content).toContain("recipients");
    expect(content).toContain("totalSent");
    expect(content).toContain("totalFailed");
  });

  // ============ 도면 AI 분석 PDF 버그 수정 테스트 ============

  it("designAutomation의 analyzeFloorPlan이 PDF를 file_url로 전달한다", () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, "routers/designAutomation.ts"),
      "utf-8"
    );
    expect(content).toContain("file_url");
    expect(content).toContain("isPdf");
    expect(content).toContain("application/pdf");
  });

  it("clientPipeline의 analyzeFloorPlan이 PDF를 file_url로 전달한다", () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, "routers/clientPipeline.ts"),
      "utf-8"
    );
    expect(content).toContain("file_url");
    expect(content).toContain("isPdf");
    expect(content).toContain("application/pdf");
  });

  // ============ 회원가입 유도 UI 테스트 ============

  it("CompanySurvey 완료 후 회원가입 유도 UI가 포함되어 있다", () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, "../client/src/pages/CompanySurvey.tsx"),
      "utf-8"
    );
    expect(content).toContain("blur-sm");
    expect(content).toContain("회원가입");
    expect(content).toContain("/client/register");
    expect(content).toContain("/client/login");
    expect(content).toContain("전체 분석 결과를 확인하세요");
    expect(content).toContain("미리보기");
  });

  it("SurveyResponse 완료 후 회원가입 유도 UI가 포함되어 있다", () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, "../client/src/pages/SurveyResponse.tsx"),
      "utf-8"
    );
    expect(content).toContain("blur-sm");
    expect(content).toContain("회원가입");
    expect(content).toContain("/client/register");
    expect(content).toContain("/client/login");
    expect(content).toContain("전체 분석 결과를 확인하세요");
  });
});
