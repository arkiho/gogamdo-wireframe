import { describe, it, expect } from "vitest";
import { generateReviewEmailHtml } from "./email";

describe("이메일 발송 유틸리티", () => {
  describe("generateReviewEmailHtml", () => {
    const baseData = {
      reviewerName: "홍길동",
      reviewerEmail: "hong@company.com",
      reviewerCompany: "(주)테스트",
      projectTitle: "테스트 프로젝트 사무실 인테리어",
      reviewUrl: "https://kokamdo.co.kr/review/abc123token",
      expiresAt: new Date("2026-03-15"),
    };

    it("HTML 이메일 템플릿을 생성해야 한다", () => {
      const html = generateReviewEmailHtml(baseData);
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("</html>");
    });

    it("담당자 이름이 포함되어야 한다", () => {
      const html = generateReviewEmailHtml(baseData);
      expect(html).toContain("홍길동");
    });

    it("프로젝트 제목이 포함되어야 한다", () => {
      const html = generateReviewEmailHtml(baseData);
      expect(html).toContain("테스트 프로젝트 사무실 인테리어");
    });

    it("리뷰 URL이 포함되어야 한다", () => {
      const html = generateReviewEmailHtml(baseData);
      expect(html).toContain("https://kokamdo.co.kr/review/abc123token");
    });

    it("회사명이 포함되어야 한다", () => {
      const html = generateReviewEmailHtml(baseData);
      expect(html).toContain("(주)테스트");
    });

    it("만료일이 포함되어야 한다", () => {
      const html = generateReviewEmailHtml(baseData);
      expect(html).toContain("2026");
      // toLocaleDateString("ko-KR") 결과에 따라 3월 또는 03월 등 다양한 형식 가능
      expect(html).toMatch(/3\s*월|03\s*월|March/);
    });

    it("고감도 브랜딩 요소가 포함되어야 한다", () => {
      const html = generateReviewEmailHtml(baseData);
      expect(html).toContain("KOKAMDO");
      expect(html).toContain("Office Interior Specialist");
      expect(html).toContain("고감도");
    });

    it("CTA 버튼이 포함되어야 한다", () => {
      const html = generateReviewEmailHtml(baseData);
      expect(html).toContain("리뷰 작성하기");
    });

    it("회사명 없이도 정상 생성되어야 한다", () => {
      const dataWithoutCompany = { ...baseData, reviewerCompany: undefined };
      const html = generateReviewEmailHtml(dataWithoutCompany);
      expect(html).toContain("홍길동");
      expect(html).not.toContain("undefined");
    });

    it("연락처 정보가 포함되어야 한다", () => {
      const html = generateReviewEmailHtml(baseData);
      expect(html).toContain("02-3487-6133");
      expect(html).toContain("contact@kokamdo.co.kr");
    });

    it("리뷰 작성 안내 정보가 포함되어야 한다", () => {
      const html = generateReviewEmailHtml(baseData);
      expect(html).toContain("리뷰 작성 기한");
      expect(html).toContain("약 3~5분 소요");
      expect(html).toContain("관리자 승인 후 공개");
    });
  });
});
