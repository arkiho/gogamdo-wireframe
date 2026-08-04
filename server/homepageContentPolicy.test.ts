import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const home = read("client/src/pages/Home.tsx");
const about = read("client/src/pages/About.tsx");
const seo = read("client/src/components/SEOHead.tsx");
const staticHtml = read("client/index.html");

describe("public homepage evidence policy", () => {
  it("does not publish unsupported performance statistics", () => {
    const unsupportedClaims = [
      "number: 100000",
      "number: 98",
      "number: 2800",
      "96.4%",
      "94.2%",
      "97.1%",
      "70개 이상 거래처",
      "44억원 규모",
      "대한민국 면적만큼",
    ];

    for (const claim of unsupportedClaims) {
      expect(`${home}\n${about}\n${seo}`).not.toContain(claim);
    }
  });

  it("does not present expired or unverified credentials as current badges", () => {
    expect(about).not.toMatch(/<BadgeCheck[\s\S]{0,220}이노비즈 인증/);
    expect(about).not.toContain("윤리경영 인증");
  });

  it("does not publish unapproved response, free-service, or warranty promises", () => {
    const contact = read("client/src/pages/Contact.tsx");

    for (const promise of [
      "24시간 내 연락",
      "24시간 내 회신",
      "무료 현장 상담",
      "1년간 무상 하자 보수",
      "100평 기준 설계 2~3주",
    ]) {
      expect(contact).not.toContain(promise);
    }
  });

  it("does not publish unsupported claims in static SEO metadata", () => {
    for (const unsupportedClaim of [
      "150건 이상의 프로젝트",
      "2,800건 이상 프로젝트",
      '"award": ["여성기업 인증", "이노비즈 인증"]',
      '"price": "24000000"',
      '"price": "800000"',
    ]) {
      expect(staticHtml).not.toContain(unsupportedClaim);
    }
  });

  it("uses one shared inquiry length limit in the form and server", () => {
    const contact = read("client/src/pages/Contact.tsx");
    const routers = read("server/routers.ts");
    expect(contact).toContain("maxLength={MAX_INQUIRY_FREEFORM_LENGTH}");
    expect(contact).toContain("MAX_INQUIRY_FREEFORM_LENGTH - formData.message.length");
    expect(routers).toContain("message: z.string().min(1).max(MAX_INQUIRY_MESSAGE_LENGTH)");
  });

  it("associates contact labels and FAQ controls for assistive technology", () => {
    const contact = read("client/src/pages/Contact.tsx");
    for (const id of [
      "contact-name",
      "contact-company",
      "contact-email",
      "contact-phone",
      "contact-purpose",
      "contact-role",
      "contact-location",
      "contact-target-date",
      "contact-budget",
      "contact-lease-status",
      "contact-decision-stage",
      "contact-message",
      "contact-referral-source",
    ]) {
      expect(contact).toContain(`htmlFor="${id}"`);
      expect(contact).toContain(`id="${id}"`);
    }
    expect(contact).toContain("aria-expanded={expandedFaq === i}");
    expect(contact).toContain('aria-controls={`contact-faq-panel-${i}`}');
    expect(contact).toContain('id={`contact-faq-panel-${i}`}');
  });

  it("marks each footer target and keeps the privacy link outside the consent label", () => {
    const layout = read("client/src/components/Layout.tsx");
    for (const testId of [
      "footer-employee-login",
      "footer-partner-login",
      "footer-privacy",
      "footer-terms",
    ]) {
      expect(layout).toContain(`data-testid="${testId}"`);
    }
    expect(layout).toContain('id="newsletter-privacy-consent"');
    expect(layout).toContain('htmlFor="newsletter-privacy-consent"');
    expect(layout).toContain('data-testid="newsletter-privacy-link"');
    expect(layout).not.toMatch(/<label[^>]*>[\s\S]*data-testid="newsletter-privacy-link"[\s\S]*<\/label>/);
  });

  it("allows browser zoom and names the key global controls", () => {
    const layout = read("client/src/components/Layout.tsx");
    const kakao = read("client/src/components/KakaoChat.tsx");
    expect(staticHtml).not.toContain("maximum-scale=1");
    expect(layout).toContain('href="https://blog.naver.com/kokamdodesign"');
    expect(layout).not.toContain('aria-label="네이버 블로그"');
    expect(layout).not.toContain('<span aria-hidden="true" className="flex items-center justify-center w-5 h-5 rounded bg-[#03C75A]');
    expect(kakao).toContain("카카오 상담 열기");
  });
});
