import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { databaseStorageAuthorization, persistedStorageReferences } from "./_core/storageAuthorizationDatabase";

describe("database-backed public storage authorization", () => {
  it("builds a bounded exact-reference candidate set", () => {
    expect(persistedStorageReferences("portfolio/12/cover.jpg")).toEqual([
      "portfolio/12/cover.jpg",
      "/uploads/portfolio/12/cover.jpg",
      "https://kokamdo.co.kr/uploads/portfolio/12/cover.jpg",
      "https://www.kokamdo.co.kr/uploads/portfolio/12/cover.jpg",
    ]);
  });

  it("uses exact bounded DB queries instead of loading and scanning all published rows", () => {
    const source = readFileSync(
      path.join(import.meta.dirname, "_core/storageAuthorizationDatabase.ts"),
      "utf8",
    );
    expect(source).toMatch(/\.limit\(1\)/);
    expect(source).not.toMatch(/portfolioRows\.some|insightRows\.some/);
    expect(source).not.toContain("recordReferencesStorageKey");
    expect(source).toContain("styleRecommendations.imageUrl");
  });

  it("does not equate clients_auth IDs with client_projects users-table IDs", async () => {
    await expect(databaseStorageAuthorization.isClientProjectOwner(42, 7)).resolves.toBe(false);
    const source = readFileSync(
      path.join(import.meta.dirname, "_core/storageAuthorizationDatabase.ts"),
      "utf8",
    );
    expect(source).not.toContain("project.userId === clientId");
    expect(source).not.toContain("getClientProjectById");
  });
});
