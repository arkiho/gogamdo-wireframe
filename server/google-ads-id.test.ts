import { describe, it, expect } from "vitest";

describe("Google Ads ID 환경변수 검증", () => {
  it("VITE_GOOGLE_ADS_ID가 설정되어 있어야 한다", () => {
    const googleAdsId = process.env.VITE_GOOGLE_ADS_ID;
    expect(googleAdsId).toBeDefined();
    expect(googleAdsId).not.toBe("");
  });

  it("VITE_GOOGLE_ADS_ID가 AW- 형식이어야 한다", () => {
    const googleAdsId = process.env.VITE_GOOGLE_ADS_ID;
    expect(googleAdsId).toMatch(/^AW-\d+$/);
  });
});
