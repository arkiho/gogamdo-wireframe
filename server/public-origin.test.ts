import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getTrustedPublicOrigin } from "./_core/publicOrigin";

describe("trusted public origin", () => {
  it("uses the configured canonical origin and strips no request-derived data", () => {
    expect(getTrustedPublicOrigin("https://www.kokamdo.co.kr", "production"))
      .toBe("https://www.kokamdo.co.kr");
  });

  it("rejects insecure production and non-origin URLs", () => {
    expect(() => getTrustedPublicOrigin("http://kokamdo.co.kr", "production")).toThrow(/HTTPS/);
    expect(() => getTrustedPublicOrigin("https://kokamdo.co.kr/reset?token=bad", "production"))
      .toThrow(/origin only/);
    expect(() => getTrustedPublicOrigin("https://user:pass@kokamdo.co.kr", "production"))
      .toThrow(/origin only/);
  });

  it("does not construct authentication links from request headers", async () => {
    const source = await readFile(path.resolve("server/routers.ts"), "utf8");
    const authBlock = source.slice(source.indexOf("clientAuth: router"), source.indexOf("// ===== 고객 포털 대시보드"));
    expect(authBlock.match(/getTrustedPublicOrigin\(\)/g)).toHaveLength(5);
    expect(authBlock).not.toMatch(/headers\?\.(origin|referer|host)/);
  });
});
