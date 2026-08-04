import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const HTML = `<!doctype html><html><head>
<title>고감도</title>
<meta name="description" content="default" />
<meta property="og:title" content="default" />
<meta property="og:description" content="default" />
<meta property="og:url" content="https://kokamdo.co.kr" />
<link rel="canonical" href="https://kokamdo.co.kr" />
</head><body></body></html>`;

describe("Search Console SEO regressions", () => {
  it("gives every public dynamic detail page its own canonical URL", async () => {
    const viteModule = await import("./_core/vite");
    const injectMeta = (viteModule as any).injectMeta;
    expect(injectMeta).toBeTypeOf("function");

    for (const pathname of [
      "/portfolio/p/1170006",
      "/insights/2026-office-interior-trends-hybrid-workspace",
      "/resources",
      "/how-we-work",
    ]) {
      const html = injectMeta(HTML, pathname);
      expect(html).toContain(
        `<link rel="canonical" href="https://kokamdo.co.kr${pathname}" />`,
      );
      expect(html).toContain(
        `<meta property="og:url" content="https://kokamdo.co.kr${pathname}" />`,
      );
    }
  });

  it("rejects malicious canonical paths instead of reflecting executable markup", async () => {
    const { injectMeta } = await import("./_core/vite");
    const maliciousPath = '/\"><script>alert(1)</script>';
    const html = injectMeta(HTML, maliciousPath);

    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain(`https://kokamdo.co.kr${maliciousPath}`);
    expect(html).toContain('name="robots" content="noindex, nofollow"');
  });

  it("suppresses canonicals for private, missing, and duplicate paths", async () => {
    const { injectMeta } = await import("./_core/vite");
    for (const pathname of [
      "/auth/login",
      "/admin",
      "/404",
      "/unknown-page",
      "/office-space-calculator/",
    ]) {
      const html = injectMeta(HTML, pathname);
      expect(html).not.toContain('rel="canonical"');
      expect(html).toContain('name="robots" content="noindex, nofollow"');
    }
  });

  it("classifies public, private, missing, and dynamic SPA routes before rendering", async () => {
    const { getSeoRouteDecision } = await import("./_core/vite");

    expect(getSeoRouteDecision("/office-space-calculator", false)).toEqual({
      statusCode: 200,
      indexable: true,
      canonicalPath: "/office-space-calculator",
      redirectTo: null,
    });
    expect(getSeoRouteDecision("/auth/login", false)).toEqual({
      statusCode: 200,
      indexable: false,
      canonicalPath: null,
      redirectTo: null,
    });
    expect(getSeoRouteDecision("/admin/settings", false).statusCode).toBe(200);
    expect(getSeoRouteDecision("/partner/login", false).statusCode).toBe(200);
    expect(getSeoRouteDecision("/client/dashboard", false)).toMatchObject({ statusCode: 200, indexable: false });
    expect(getSeoRouteDecision("/administrator", false).statusCode).toBe(404);
    expect(getSeoRouteDecision("/partnerfoo", false).statusCode).toBe(404);
    expect(getSeoRouteDecision("/employee-directory", false).statusCode).toBe(404);
    expect(getSeoRouteDecision("/404", false).statusCode).toBe(404);
    expect(getSeoRouteDecision("/unknown-page", false).statusCode).toBe(404);
    expect(getSeoRouteDecision("/portfolio/p/999999999", false).statusCode).toBe(404);
    expect(getSeoRouteDecision("/portfolio/p/1170006", true)).toMatchObject({
      statusCode: 200,
      indexable: true,
      canonicalPath: "/portfolio/p/1170006",
    });
    expect(getSeoRouteDecision("/portfolio/p/1170006/", true).redirectTo).toBe(
      "/portfolio/p/1170006",
    );
  });

  it("redirects only confirmed legacy URLs to matching current pages", async () => {
    const viteModule = await import("./_core/vite");
    const getPermanentRedirect = (viteModule as any).getPermanentRedirect;
    expect(getPermanentRedirect).toBeTypeOf("function");

    expect(getPermanentRedirect("/about/")).toBe("/about");
    expect(getPermanentRedirect("/contact/")).toBe("/contact");
    expect(getPermanentRedirect("/works/")).toBe("/portfolio");
    for (const nonEquivalentArchive of [
      "/works/education/",
      "/works/corporation",
      "/works/corporation/",
      "/works/commercial/",
      "/works/clinic/",
      "/works/exhibition/",
      "/works/other/",
      "/category/press/",
      "/press/",
    ]) {
      expect(getPermanentRedirect(nonEquivalentArchive)).toBeNull();
    }
    expect(getPermanentRedirect("/portfolio/lab543-office/")).toBe("/portfolio/p/3");
    expect(getPermanentRedirect("/portfolio/sba-setec")).toBe("/portfolio/p/8");
    expect(getPermanentRedirect("/portfolio/ggallery/")).toBe("/portfolio/p/720001");
    expect(getPermanentRedirect("/portfolio/기아자동차-중국-염성/")).toBe("/portfolio/p/9");
    expect(getPermanentRedirect("/portfolio/%EA%B8%B0%EC%95%84%EC%9E%90%EB%8F%99%EC%B0%A8-%EC%A4%91%EA%B5%AD-%EC%97%BC%EC%84%B1/")).toBe("/portfolio/p/9");
    expect(getPermanentRedirect("/portfolio/딜리/")).toBe("/portfolio/p/1170002");
    expect(getPermanentRedirect("/portfolio/%EB%94%9C%EB%A6%AC/")).toBe("/portfolio/p/1170002");
    expect(getPermanentRedirect("/%70ortfolio/%EA%B8%B0%EC%95%84%EC%9E%90%EB%8F%99%EC%B0%A8-%EC%A4%91%EA%B5%AD-%EC%97%BC%EC%84%B1/")).toBeNull();
    expect(getPermanentRedirect("/portfolio%2F%EA%B8%B0%EC%95%84%EC%9E%90%EB%8F%99%EC%B0%A8-%EC%A4%91%EA%B5%AD-%EC%97%BC%EC%84%B1/")).toBeNull();
    expect(getPermanentRedirect("/portfolio/unknown-project/")).toBeNull();
    expect(getPermanentRedirect("/about")).toBeNull();
  });

  it("serves safe production HTTP responses for SEO routes and redirects", async () => {
    const express = (await import("express")).default;
    const { createSeoFallbackHandler } = await import("./_core/vite");
    const app = express();
    app.use(createSeoFallbackHandler({
      readIndexHtml: () => HTML,
      resolveDynamicMeta: async (pathname: string) =>
        /^\/portfolio\/p\/(9|1170006)$/.test(pathname)
          ? { title: "공개 사례", description: "공개 사례 설명" }
          : null,
    }));

    const server = await new Promise<import("node:http").Server>((resolve) => {
      const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("test server did not bind");
    const base = `http://127.0.0.1:${address.port}`;
    const request = (pathname: string) => fetch(`${base}${pathname}`, { redirect: "manual" });

    try {
      const calculator = await request("/office-space-calculator");
      expect(calculator.status).toBe(200);
      expect(await calculator.text()).toContain(
        '<link rel="canonical" href="https://kokamdo.co.kr/office-space-calculator" />',
      );

      const privatePage = await request("/auth/login");
      expect(privatePage.status).toBe(200);
      const privateHtml = await privatePage.text();
      expect(privateHtml).toContain('name="robots" content="noindex, nofollow"');
      expect(privateHtml).not.toContain('rel="canonical"');

      const missing = await request("/portfolio/p/999999999");
      expect(missing.status).toBe(404);
      expect(await missing.text()).toContain('name="robots" content="noindex, nofollow"');

      const malicious = await request("/%22%3E%3Cscript%3Ealert(1)%3C/script%3E");
      expect(malicious.status).toBe(404);
      expect(await malicious.text()).not.toContain("<script>alert(1)</script>");

      for (const encodedAlias of [
        "/%61bout",
        "/office-space-calculator%2F",
        "/office-space-calculator%252F",
        "/%70ortfolio/%EA%B8%B0%EC%95%84%EC%9E%90%EB%8F%99%EC%B0%A8-%EC%A4%91%EA%B5%AD-%EC%97%BC%EC%84%B1/",
        "/portfolio%2F%EA%B8%B0%EC%95%84%EC%9E%90%EB%8F%99%EC%B0%A8-%EC%A4%91%EA%B5%AD-%EC%97%BC%EC%84%B1/",
      ]) {
        const response = await request(encodedAlias);
        expect(response.status).toBe(404);
        expect(response.headers.get("location")).toBeNull();
        const html = await response.text();
        expect(html).toContain('name="robots" content="noindex, nofollow"');
        expect(html).not.toContain('rel="canonical"');
        expect(html).not.toContain('property="og:url"');
      }

      const slash = await request("/office-space-calculator/?source=test");
      expect(slash.status).toBe(301);
      expect(slash.headers.get("location")).toBe("/office-space-calculator?source=test");

      const legacy = await request(
        "/portfolio/%EA%B8%B0%EC%95%84%EC%9E%90%EB%8F%99%EC%B0%A8-%EC%A4%91%EA%B5%AD-%EC%97%BC%EC%84%B1/?utm_source=test",
      );
      expect(legacy.status).toBe(301);
      expect(legacy.headers.get("location")).toBe("/portfolio/p/9?utm_source=test");
      const destination = await request(legacy.headers.get("location")!);
      expect(destination.status).toBe(200);
      expect(destination.headers.get("location")).toBeNull();
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });

  it("serves approved metadata without stale marketing claims", async () => {
    const viteSource = read("server/_core/vite.ts");
    const clientSeoSource = read("client/src/components/SEOHead.tsx");
    const pagesDir = path.join(process.cwd(), "client/src/pages");
    const pageSeoSources = fs.readdirSync(pagesDir, { recursive: true, encoding: "utf8" })
      .filter((entry) => typeof entry === "string" && entry.endsWith(".tsx"))
      .flatMap((entry) => {
        const source = fs.readFileSync(path.join(pagesDir, entry), "utf8");
        return source.match(/<SEOHead[\s\S]*?\/>/g) ?? [];
      })
      .join("\n");
    for (const staleClaim of ["2,800", "35년", "AI 기반", "무료 상담"]) {
      expect(viteSource).not.toContain(staleClaim);
      expect(clientSeoSource).not.toContain(staleClaim);
      expect(pageSeoSources).not.toContain(staleClaim);
    }

    const { injectMeta } = await import("./_core/vite");
    const calculatorHtml = injectMeta(HTML, "/office-space-calculator");
    expect(calculatorHtml).toContain("계약 전 필요 평수 진단 | 고감도 KOKAMDO");
    expect(calculatorHtml).toContain("연락처 없이 바로 확인");

    const homeHtml = injectMeta(HTML, "/");
    expect(homeHtml).toContain("기업 이전·오피스 인테리어 전문기업");
    expect(homeHtml).not.toContain("AI 견적");
  });

  it("keeps dynamic client titles identical to approved server titles", () => {
    const portfolioDetail = read("client/src/pages/PortfolioDbDetail.tsx");
    const insightDetail = read("client/src/pages/InsightDetail.tsx");
    expect(portfolioDetail).toContain("${project.title} | 고객 사례 | 고감도 KOKAMDO");
    expect(insightDetail).toContain("${article.title} | 고감도 KOKAMDO");
    expect(insightDetail).not.toContain("\\\\uace0\\\\uac10");
  });

  it("does not claim that every static sitemap page changed today", () => {
    const sitemap = read("server/routers/sitemap.ts");
    expect(sitemap).not.toContain("const today = new Date()");
    expect(sitemap).not.toContain("<lastmod>${today}</lastmod>");
    expect(sitemap).not.toContain("if (!date) return new Date()");
    expect(sitemap).toContain("formatDate(insight.updatedAt || insight.publishedAt)");
    expect(sitemap).not.toContain("formatDate(insight.publishedAt || insight.updatedAt)");
  });

  it("does not ship unresolved analytics placeholders", () => {
    const indexHtml = read("client/index.html");
    expect(indexHtml).not.toContain("%VITE_ANALYTICS_ENDPOINT%");
    expect(indexHtml).not.toContain("%VITE_ANALYTICS_WEBSITE_ID%");
  });

  it("resolves a functional Vite config before starting the development server", async () => {
    const viteModule = await import("./_core/vite");
    const resolveViteConfigForServer = (viteModule as any).resolveViteConfigForServer;
    expect(resolveViteConfigForServer).toBeTypeOf("function");

    const resolved = await resolveViteConfigForServer("development");
    expect(resolved.root).toBe(path.join(process.cwd(), "client"));
    expect(Array.isArray(resolved.plugins)).toBe(true);
    expect(resolved.plugins.length).toBeGreaterThan(0);
  });
});
