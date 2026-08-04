import { describe, expect, it } from "vitest";
import {
  getProductionManualChunks,
  isManusDevelopmentToolingEnabled,
} from "../client/src/config/buildPolicy";

describe("production build policy", () => {
  it("keeps Manus diagnostics in development", () => {
    expect(isManusDevelopmentToolingEnabled("development")).toBe(true);
  });

  it("excludes Manus runtime and debug collectors from production", () => {
    expect(isManusDevelopmentToolingEnabled("production")).toBe(false);
    expect(isManusDevelopmentToolingEnabled("staging")).toBe(false);
  });

  it("does not force route-only UI, chart, or motion libraries into the entry preload graph", () => {
    const chunks = getProductionManualChunks();

    expect(chunks).toEqual({
      vendor: ["react", "react-dom"],
    });
    expect(Object.keys(chunks)).not.toContain("charts");
    expect(Object.keys(chunks)).not.toContain("ui");
    expect(Object.keys(chunks)).not.toContain("motion");
  });
});
