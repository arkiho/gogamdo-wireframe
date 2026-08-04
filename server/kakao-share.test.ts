import { describe, expect, it } from "vitest";
import { normalizePublicIntegrationId } from "../client/src/lib/publicIntegrationConfig";

describe("Kakao Share SDK public key contract", () => {
  it("allows sharing to use its clipboard fallback when the key is missing", () => {
    expect(normalizePublicIntegrationId(undefined, "kakaoJs")).toBeUndefined();
  });

  it("accepts a 32-character hexadecimal JavaScript key", () => {
    const fixture = "0123456789abcdef0123456789abcdef";
    expect(normalizePublicIntegrationId(fixture, "kakaoJs")).toBe(fixture);
  });

  it("rejects malformed keys", () => {
    expect(normalizePublicIntegrationId("not-a-key", "kakaoJs")).toBeUndefined();
    expect(normalizePublicIntegrationId("<script>0123456789abcdef", "kakaoJs")).toBeUndefined();
  });
});
