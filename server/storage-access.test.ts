import { describe, expect, it } from "vitest";
import { classifyStorageKey } from "./_core/storageAccess";

describe("storage access classification", () => {
  it.each([
    "portfolio/12/cover.jpg",
    "generated/insight.png",
    "client-plans/7/plan.pdf",
    "vendor-quotes/project-1/quote.pdf",
    "field-measurement/8/panorama.jpg",
    "design-automation/2/floorplans/plan.png",
    "ai-redesign/original/customer-room.jpg",
    "receipt/expense.pdf",
    "bankbook/account.png",
    "bizcert/company.pdf",
    "client-avatar/person.png",
    "staff-avatar/person.png",
    "upload/unknown.png",
  ])("defaults operational and customer content to private: %s", key => {
    expect(classifyStorageKey(key)).toBe("private");
  });

  it.each([
    "portfolio-private/secret.jpg",
    "portfolio",
    "Portfolio/cover.jpg",
    "/portfolio/cover.jpg",
    "../portfolio/cover.jpg",
    "portfolio/../secret.jpg",
  ])("does not broaden the public prefix: %s", key => {
    expect(classifyStorageKey(key)).toBe("private");
  });
});
