import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("B2B portfolio story structure", () => {
  const detail = read("client/src/pages/PortfolioDbDetail.tsx");
  const admin = read("client/src/pages/AdminPortfolioDetail.tsx");
  const review = read("client/src/pages/ReviewWrite.tsx");

  it("frames cases around the buyer problem, key decision, and change", () => {
    for (const label of ["고객의 문제", "진단과 핵심 결정", "완공 후 변화"]) {
      expect(detail).toContain(label);
      expect(admin).toContain(label);
    }
  });

  it("does not suggest fabricated percentage outcomes to administrators", () => {
    expect(admin).not.toContain("직원 만족도 35% 향상");
    expect(admin).not.toContain("공간 활용률 40% 개선");
  });

  it("collects the evidence needed for a useful customer review", () => {
    for (const prompt of [
      "공사 전 가장 큰 문제",
      "고감도를 선택한 이유",
      "진행 과정",
      "완공 후",
      "추천",
    ]) {
      expect(review).toContain(prompt);
    }
  });
});
