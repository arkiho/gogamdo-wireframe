import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { authorizeStorageRead, isClientAvatarUrlOwnedByClient, storageKeyFromUrl } from "./_core/storageAuthorization";

const dependencies = {
  isPublishedReference: vi.fn(async (_key: string) => false),
  isClientProjectOwner: vi.fn(async (_projectId: number, _clientId: number) => false),
  isClientAvatar: vi.fn(async (_key: string, _clientId: number) => false),
};

describe("storage read authorization", () => {
  it.each([
    ["/uploads/generated/a.png", "generated/a.png"],
    ["https://kokamdo.co.kr/uploads/portfolio/12/a.jpg", "portfolio/12/a.jpg"],
    ["https://www.kokamdo.co.kr/uploads/portfolio/12/a.jpg", "portfolio/12/a.jpg"],
    ["https://evil.example/uploads/portfolio/12/a.jpg", null],
    ["generated/raw-key.png", "generated/raw-key.png"],
    ["https://example.com/not-uploads/a.png", null],
    [null, null],
  ])("extracts an exact normalized storage key from persisted URL %s", (value, expected) => {
    expect(storageKeyFromUrl(value)).toBe(expected);
  });

  it("accepts only an avatar URL scoped to the authenticated client", () => {
    expect(isClientAvatarUrlOwnedByClient("/uploads/avatar/client-9/mine.png", 9)).toBe(true);
    expect(isClientAvatarUrlOwnedByClient("/uploads/avatar/client-8/victim.png", 9)).toBe(false);
    expect(isClientAvatarUrlOwnedByClient("/uploads/avatar/client-90/lookalike.png", 9)).toBe(false);
    expect(isClientAvatarUrlOwnedByClient("/uploads/avatar/mine.png", 9)).toBe(false);
  });

  it("enforces client avatar ownership in the profile mutation", () => {
    const routers = readFileSync(path.join(import.meta.dirname, "routers.ts"), "utf8");
    const updateProfile = routers.slice(routers.indexOf("updateProfile: publicProcedure"), routers.indexOf("updateNotifPrefs: publicProcedure"));
    expect(updateProfile).toContain("isClientAvatarUrlOwnedByClient(input.avatarUrl, client.id)");
  });

  it("matches only an exact key among persisted record URLs", async () => {
    const { recordReferencesStorageKey } = await import("./_core/storageAuthorization");
    const values = [
      "https://kokamdo.co.kr/uploads/generated/published.png",
      "/uploads/portfolio/12/cover.jpg",
      null,
    ];
    expect(recordReferencesStorageKey("generated/published.png", values)).toBe(true);
    expect(recordReferencesStorageKey("generated/published.png.bak", values)).toBe(false);
  });

  it("allows anonymous reads only for an exact DB-confirmed published reference", async () => {
    const published = { ...dependencies, isPublishedReference: vi.fn(async key => key === "generated/published.png") };

    await expect(authorizeStorageRead("generated/published.png", null, published)).resolves.toBe("public");
    await expect(authorizeStorageRead("generated/private-render.png", null, published)).resolves.toBeNull();
    await expect(authorizeStorageRead("portfolio/12/draft.jpg", null, published)).resolves.toBeNull();
  });

  it("allows staff to read operational private objects", async () => {
    await expect(authorizeStorageRead("receipt/evidence.pdf", { kind: "staff", id: 7 }, dependencies)).resolves.toBe("private");
  });

  it("allows a client to read only a plan from their own project", async () => {
    const owned = { ...dependencies, isClientProjectOwner: vi.fn(async (projectId, clientId) => projectId === 42 && clientId === 9) };

    await expect(authorizeStorageRead("client-plans/42/plan.pdf", { kind: "client", id: 9 }, owned)).resolves.toBe("private");
    await expect(authorizeStorageRead("client-plans/43/plan.pdf", { kind: "client", id: 9 }, owned)).resolves.toBeNull();
  });

  it("denies a client avatar key owned by a different client even if the DB reference is poisoned", async () => {
    const deps = {
      ...dependencies,
      isClientAvatar: vi.fn(async () => true),
    };

    await expect(authorizeStorageRead("avatar/client-8/victim.png", { kind: "client", id: 9 }, deps)).resolves.toBeNull();
  });

  it("allows a client to read only their exact avatar reference", async () => {
    const owned = {
      ...dependencies,
      isClientAvatar: vi.fn(async (key, clientId) => key === "avatar/client-9/mine.png" && clientId === 9),
    };

    await expect(authorizeStorageRead("avatar/client-9/mine.png", { kind: "client", id: 9 }, owned)).resolves.toBe("private");
    await expect(authorizeStorageRead("avatar/client-9/other.png", { kind: "client", id: 9 }, owned)).resolves.toBeNull();
  });

  it("denies clients access to staff-only and unknown namespaces", async () => {
    for (const key of ["receipt/evidence.pdf", "vendor-quotes/project-1/q.pdf", "ai-redesign/original/a.png", "unknown/a.png"]) {
      await expect(authorizeStorageRead(key, { kind: "client", id: 9 }, dependencies)).resolves.toBeNull();
    }
  });
});
