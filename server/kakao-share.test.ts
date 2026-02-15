import { describe, it, expect } from "vitest";

describe("Kakao Share SDK", () => {
  it("VITE_KAKAO_JS_KEY should be set", () => {
    const key = process.env.VITE_KAKAO_JS_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(0);
  });

  it("VITE_KAKAO_JS_KEY should be a valid hex string", () => {
    const key = process.env.VITE_KAKAO_JS_KEY;
    // Kakao JS keys are 32-character hex strings
    expect(key).toMatch(/^[a-f0-9]{32}$/);
  });
});
