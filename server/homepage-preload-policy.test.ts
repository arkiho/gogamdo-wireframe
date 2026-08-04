import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import express from "express";
import { createSeoFallbackHandler, injectMeta } from "./_core/vite";

const indexHtml = readFileSync(
  path.join(process.cwd(), "client/index.html"),
  "utf8",
);

function preloadCount(html: string) {
  return html.match(/data-home-hero-preload/g)?.length ?? 0;
}

describe("home hero preload policy", () => {
  it("uses mutually exclusive mobile and desktop preload media queries", () => {
    expect(indexHtml).toMatch(/<link\s+data-home-hero-preload\s+media="\(max-width: 767px\)"/);
    expect(indexHtml).toMatch(/<link\s+data-home-hero-preload\s+media="\(min-width: 768px\)"/);
    expect(preloadCount(indexHtml)).toBe(2);
  });

  it("retains hero preloads only for the canonical home route", () => {
    expect(preloadCount(injectMeta(indexHtml, "/"))).toBe(2);
    for (const pathname of ["/about", "/privacy", "/auth/login", "/admin", "/404"]) {
      expect(preloadCount(injectMeta(indexHtml, pathname))).toBe(0);
    }
  });

  it("enforces the same boundary in real Express HTML responses", async () => {
    const app = express();
    app.use(createSeoFallbackHandler({
      readIndexHtml: () => indexHtml,
      resolveDynamicMeta: async () => null,
    }));
    const server = await new Promise<import("node:http").Server>((resolve) => {
      const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("test server did not bind");
    const base = `http://127.0.0.1:${address.port}`;

    try {
      for (const [pathname, expectedStatus, expectedPreloads] of [
        ["/", 200, 2],
        ["/about", 200, 0],
        ["/auth/login", 200, 0],
        ["/admin", 200, 0],
        ["/not-a-real-page", 404, 0],
      ] as const) {
        const response = await fetch(`${base}${pathname}`);
        expect(response.status).toBe(expectedStatus);
        expect(preloadCount(await response.text())).toBe(expectedPreloads);
      }
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
});
