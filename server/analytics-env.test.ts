import { describe, expect, it } from "vitest";
import { normalizePublicIntegrationId } from "../client/src/lib/publicIntegrationConfig";

describe("Analytics public environment contract", () => {
  it("treats missing analytics IDs as disabled", () => {
    expect(normalizePublicIntegrationId(undefined, "ga4")).toBeUndefined();
    expect(normalizePublicIntegrationId("", "clarity")).toBeUndefined();
  });

  it("accepts valid GA4 and Clarity formats", () => {
    expect(normalizePublicIntegrationId("G-ABC123", "ga4")).toBe("G-ABC123");
    expect(normalizePublicIntegrationId("abc123xyz", "clarity")).toBe("abc123xyz");
  });

  it("rejects malformed analytics IDs", () => {
    expect(normalizePublicIntegrationId("UA-legacy", "ga4")).toBeUndefined();
    expect(normalizePublicIntegrationId("bad/id", "clarity")).toBeUndefined();
  });
});
