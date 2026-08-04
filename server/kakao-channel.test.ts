import { describe, expect, it } from "vitest";
import { getKakaoChannelUrl } from "../client/src/lib/publicIntegrationConfig";

describe("Kakao Channel public configuration", () => {
  it("uses a safe public fallback when the channel ID is missing", () => {
    expect(getKakaoChannelUrl(undefined)).toBe("https://pf.kakao.com/_xnxlxkxj/chat");
  });

  it("builds a channel URL for a valid public channel ID", () => {
    expect(getKakaoChannelUrl("_Example123")).toBe("https://pf.kakao.com/_Example123/chat");
  });

  it("rejects malformed channel IDs and never emits an undefined URL", () => {
    expect(getKakaoChannelUrl("../bad")).toBe("https://pf.kakao.com/_xnxlxkxj/chat");
    expect(getKakaoChannelUrl(undefined)).not.toContain("undefined");
  });
});
