import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

const home = read("client/src/pages/Home.tsx");
const app = read("client/src/App.tsx");
const seo = read("client/src/components/SEOHead.tsx");

describe("confirmed B2B homepage positioning", () => {
  it("uses the approved office-specialist hero message", () => {
    expect(home).toContain("기업 이전부터 설계·시공·사후관리까지 책임지는");
    expect(home).toContain("오피스 전문기업");
    expect(home).toContain("기업의 일하는 방식부터 진단");
  });

  it("shows office and public-sector expertise in the first-screen content", () => {
    expect(home).toContain("오피스 인테리어");
    expect(home).toContain("학교·공공기관 관급공사");
  });

  it("makes the contract-before-area-check the primary conversion", () => {
    expect(home).toContain('href="/office-space-calculator"');
    expect(home).toContain("계약 전 필요 평수 무료 진단");
    expect(app).toContain('path="/office-space-calculator"');
  });

  it("states the end-to-end responsibility model", () => {
    for (const step of [
      "업무·면적 진단",
      "공간 기획",
      "설계",
      "시공·공정관리",
      "준공·사후관리",
    ]) {
      expect(home).toContain(step);
    }
  });

  it("targets office relocation and pre-contract area-intent in SEO", () => {
    expect(seo).toContain("사무실 이전");
    expect(seo).toContain("계약 전");
    expect(seo).toContain("필요 면적");
  });
});
