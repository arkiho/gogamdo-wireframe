import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const home = fs.readFileSync(
  path.join(process.cwd(), "client/src/pages/Home.tsx"),
  "utf8",
);

describe("homepage portfolio image loading policy", () => {
  it("does not assign large portfolio image URLs before the card approaches the viewport", () => {
    expect(home).toContain("function ViewportImage(");
    expect(home).toContain("new IntersectionObserver(");
    expect(home).toContain('rootMargin: "128px 0px"');
    expect(home).toContain("shouldLoad && (");
    expect(home).toContain("<ViewportImage");
    expect(home).not.toMatch(/<img[\s\S]{0,120}src=\{project\.coverImage\}/);
  });

  it("keeps a safe fallback for browsers without IntersectionObserver", () => {
    expect(home).toContain('if (!("IntersectionObserver" in window))');
    expect(home).toContain("setShouldLoad(true)");
  });
});
