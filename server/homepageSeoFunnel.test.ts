import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("office-space SEO and lead funnel", () => {
  it("publishes the calculator in the dynamic sitemap", () => {
    const sitemap = read("server/routers/sitemap.ts");
    expect(sitemap).toContain('path: "/office-space-calculator"');
  });

  it("adds structured data for the calculator", () => {
    const calculator = read("client/src/pages/OfficeSpaceCalculator.tsx");
    expect(calculator).toContain('"@type": "WebApplication"');
    expect(calculator).toContain('"applicationCategory": "BusinessApplication"');
  });

  it("defines the complete calculator-to-inquiry funnel", () => {
    const analytics = read("client/src/lib/analytics.ts");
    for (const eventName of [
      "space_calculator_start",
      "space_calculator_complete",
      "space_calculator_lead_click",
      "qualified_contact_view",
      "qualified_contact_submit",
    ]) {
      expect(analytics).toContain(eventName);
    }
  });
});
