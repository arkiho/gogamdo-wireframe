import { describe, expect, it } from "vitest";

describe("Analytics environment variables", () => {
  it("VITE_GA4_MEASUREMENT_ID is set and has correct format", () => {
    const ga4Id = process.env.VITE_GA4_MEASUREMENT_ID;
    // Should be set (even if empty placeholder, the env var exists)
    expect(ga4Id).toBeDefined();
    // If set with a real value, it should match G-XXXXXXXXXX format
    if (ga4Id && ga4Id.length > 0) {
      expect(ga4Id).toMatch(/^G-[A-Z0-9]+$/);
    }
  });

  it("VITE_CLARITY_PROJECT_ID is set", () => {
    const clarityId = process.env.VITE_CLARITY_PROJECT_ID;
    expect(clarityId).toBeDefined();
  });
});
