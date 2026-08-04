import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("Kakao SDK loading policy", () => {
  it("does not load the Kakao SDK globally on every route", () => {
    const html = readFileSync(path.join(root, "client/index.html"), "utf8");
    expect(html).not.toContain("t1.kakaocdn.net/kakao_js_sdk");
  });

  it("loads the SDK asynchronously from the share hook only", () => {
    const hook = readFileSync(path.join(root, "client/src/hooks/useKakaoShare.ts"), "utf8");
    expect(hook).toContain('document.createElement("script")');
    expect(hook).toContain("script.async = true");
    expect(hook).toContain("KAKAO_SDK_SRC");
  });
});