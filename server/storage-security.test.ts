import path from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeStorageKey, resolveLocalStoragePath } from "./storage";

describe("storage path safety", () => {
  it("keeps valid nested and Korean object keys", () => {
    expect(normalizeStorageKey("portfolio/123-사무실 사진.jpg")).toBe(
      "portfolio/123-사무실 사진.jpg",
    );
  });

  it.each([
    "../outside.txt",
    "portfolio/../../outside.txt",
    "portfolio/123-../../outside.txt",
    "portfolio/..\\..\\outside.txt",
    "portfolio/\0outside.txt",
  ])("rejects traversal key %s", (key) => {
    expect(() => normalizeStorageKey(key)).toThrow(/invalid storage key/i);
  });

  it("resolves valid keys strictly below the configured storage root", () => {
    const root = path.resolve("/tmp/kokamdo-storage-root");
    const resolved = resolveLocalStoragePath(root, "portfolio/image.jpg");

    expect(resolved).toBe(path.join(root, "portfolio/image.jpg"));
    expect(resolved.startsWith(`${root}${path.sep}`)).toBe(true);
  });

  it("never resolves traversal input outside the configured storage root", () => {
    const root = path.resolve("/tmp/kokamdo-storage-root");

    expect(() => resolveLocalStoragePath(root, "../../outside.txt")).toThrow(
      /invalid storage key/i,
    );
  });
});
