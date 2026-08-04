import { describe, expect, it } from "vitest";
import { normalizePublicIntegrationId } from "../client/src/lib/publicIntegrationConfig";

describe("Google Ads public ID contract", () => {
  it("allows Google Ads to be disabled in non-production environments", () => {
    expect(normalizePublicIntegrationId(undefined, "googleAds")).toBeUndefined();
  });

  it("accepts the AW-numeric format", () => {
    expect(normalizePublicIntegrationId("AW-123456789", "googleAds")).toBe("AW-123456789");
  });

  it("rejects malformed values instead of loading them as script IDs", () => {
    expect(normalizePublicIntegrationId("G-ABC123", "googleAds")).toBeUndefined();
    expect(normalizePublicIntegrationId("AW-123<script>", "googleAds")).toBeUndefined();
  });
});
