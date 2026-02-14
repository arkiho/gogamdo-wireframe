import { describe, it, expect } from "vitest";

describe("Kakao Channel ID", () => {
  it("VITE_KAKAO_CHANNEL_ID should be set", () => {
    const channelId = process.env.VITE_KAKAO_CHANNEL_ID;
    expect(channelId).toBeDefined();
    expect(channelId).not.toBe("");
  });

  it("VITE_KAKAO_CHANNEL_ID should start with underscore", () => {
    const channelId = process.env.VITE_KAKAO_CHANNEL_ID;
    expect(channelId).toMatch(/^_/);
  });

  it("Kakao channel URL should be valid", () => {
    const channelId = process.env.VITE_KAKAO_CHANNEL_ID;
    const url = `https://pf.kakao.com/${channelId}/chat`;
    expect(url).toBe("https://pf.kakao.com/_rzezX/chat");
  });
});
