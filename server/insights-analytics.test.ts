import { describe, it, expect } from "vitest";

/**
 * 인사이트 AI 생성 및 광고 픽셀 통합 테스트
 */

describe("Insight AI Article Generation", () => {
  it("should have aiGenerate procedure defined in insight router", async () => {
    const { appRouter } = await import("./routers");
    // Check that the insight router has aiGenerate mutation
    expect(appRouter._def.procedures).toHaveProperty("insight.aiGenerate");
  });

  it("should have all CRUD procedures for insights", async () => {
    const { appRouter } = await import("./routers");
    const procedures = appRouter._def.procedures;
    expect(procedures).toHaveProperty("insight.published");
    expect(procedures).toHaveProperty("insight.bySlug");
    expect(procedures).toHaveProperty("insight.all");
    expect(procedures).toHaveProperty("insight.create");
    expect(procedures).toHaveProperty("insight.update");
    expect(procedures).toHaveProperty("insight.delete");
    expect(procedures).toHaveProperty("insight.aiGenerate");
  });

  it("should have generateDescription procedure for portfolio", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("portfolio.generateDescription");
  });
});

describe("Analytics Pixel Integration", () => {
  it("should export all analytics init functions", async () => {
    // We can't test browser-side code in Node, but we can verify the module structure
    const analyticsPath = "../client/src/lib/analytics";
    // Verify the file exists and has expected exports by checking file content
    const fs = await import("fs");
    const content = fs.readFileSync(
      "/home/ubuntu/gogamdo-wireframe/client/src/lib/analytics.ts",
      "utf-8"
    );
    
    // Check all pixel init functions are exported
    expect(content).toContain("export function initGA4()");
    expect(content).toContain("export function initClarity()");
    expect(content).toContain("export function initFBPixel()");
    expect(content).toContain("export function initGoogleAds()");
    expect(content).toContain("export function initNaverAnalytics()");
    
    // Check environment variable references
    expect(content).toContain("VITE_GA4_MEASUREMENT_ID");
    expect(content).toContain("VITE_CLARITY_PROJECT_ID");
    expect(content).toContain("VITE_FB_PIXEL_ID");
    expect(content).toContain("VITE_GOOGLE_ADS_ID");
    expect(content).toContain("VITE_NAVER_ANALYTICS_ID");
  });

  it("should have AnalyticsProvider calling all init functions", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync(
      "/home/ubuntu/gogamdo-wireframe/client/src/components/AnalyticsProvider.tsx",
      "utf-8"
    );
    
    expect(content).toContain("initGA4()");
    expect(content).toContain("initClarity()");
    expect(content).toContain("initFBPixel()");
    expect(content).toContain("initGoogleAds()");
    expect(content).toContain("initNaverAnalytics()");
  });

  it("should have Facebook Pixel event forwarding in trackEvent", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync(
      "/home/ubuntu/gogamdo-wireframe/client/src/lib/analytics.ts",
      "utf-8"
    );
    
    expect(content).toContain("fbq(\"trackCustom\"");
  });
});

describe("Proposal PDF Generation", () => {
  it("should have proposalPdf utility file", async () => {
    const fs = await import("fs");
    const exists = fs.existsSync(
      "/home/ubuntu/gogamdo-wireframe/client/src/lib/proposalPdf.ts"
    );
    expect(exists).toBe(true);
  });

  it("should export generateProposalPdf function", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync(
      "/home/ubuntu/gogamdo-wireframe/client/src/lib/proposalPdf.ts",
      "utf-8"
    );
    expect(content).toContain("export function generateProposalPdf");
  });
});

describe("Admin Insights Page", () => {
  it("should have AdminInsights page component", async () => {
    const fs = await import("fs");
    const exists = fs.existsSync(
      "/home/ubuntu/gogamdo-wireframe/client/src/pages/AdminInsights.tsx"
    );
    expect(exists).toBe(true);
  });

  it("should have admin/insights route in App.tsx", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync(
      "/home/ubuntu/gogamdo-wireframe/client/src/App.tsx",
      "utf-8"
    );
    expect(content).toContain("/admin/insights");
    expect(content).toContain("AdminInsights");
  });

  it("should have insights link in AdminDashboard", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync(
      "/home/ubuntu/gogamdo-wireframe/client/src/pages/AdminDashboard.tsx",
      "utf-8"
    );
    expect(content).toContain("/admin/insights");
    expect(content).toContain("인사이트 관리");
  });
});

describe("PWA Configuration", () => {
  it("should have manifest.json", async () => {
    const fs = await import("fs");
    const exists = fs.existsSync(
      "/home/ubuntu/gogamdo-wireframe/client/public/manifest.json"
    );
    expect(exists).toBe(true);
  });

  it("should have service worker", async () => {
    const fs = await import("fs");
    const exists = fs.existsSync(
      "/home/ubuntu/gogamdo-wireframe/client/public/sw.js"
    );
    expect(exists).toBe(true);
  });

  it("should have manifest link in index.html", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync(
      "/home/ubuntu/gogamdo-wireframe/client/index.html",
      "utf-8"
    );
    expect(content).toContain("manifest.json");
  });
});
