import { describe, expect, it } from "vitest";
import { getStaticAssetCacheControl } from "./_core/staticCachePolicy";

describe("static asset cache policy", () => {
  it("caches fingerprinted Vite assets immutably for one year", () => {
    expect(getStaticAssetCacheControl("/srv/public/assets/index-CQMnZHvh.js"))
      .toBe("public, max-age=31536000, immutable");
    expect(getStaticAssetCacheControl("/srv/public/assets/index-Z5EP3dio.css"))
      .toBe("public, max-age=31536000, immutable");
  });

  it("keeps HTML immediately revalidatable", () => {
    expect(getStaticAssetCacheControl("/srv/public/index.html"))
      .toBe("public, max-age=0, must-revalidate");
  });

  it("uses a bounded cache for stable public images without immutable fingerprints", () => {
    expect(getStaticAssetCacheControl("/srv/public/images/office-hero.webp"))
      .toBe("public, max-age=86400, stale-while-revalidate=604800");
  });
});