import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateStorageRuntimeConfiguration } from "./storage";

describe("production storage runtime configuration", () => {
  it("fails when production would fall back to an ephemeral local directory", () => {
    expect(() => validateStorageRuntimeConfiguration({ NODE_ENV: "production" })).toThrow(/STORAGE_DIR/i);
  });

  it("allows Forge image generation credentials because storage remains local", () => {
    expect(() => validateStorageRuntimeConfiguration({
      NODE_ENV: "production",
      STORAGE_DIR: "/data/uploads",
      BUILT_IN_FORGE_API_URL: "https://storage.example.test",
      BUILT_IN_FORGE_API_KEY: "configured",
    })).not.toThrow();
  });

  it("accepts an explicit absolute local volume directory in production", () => {
    expect(() => validateStorageRuntimeConfiguration({
      NODE_ENV: "production",
      STORAGE_DIR: "/data/uploads",
    })).not.toThrow();
  });

  it("validates production storage before opening the web listener", () => {
    const source = readFileSync(path.join(import.meta.dirname, "_core/index.ts"), "utf8");
    expect(source.indexOf("validateStorageRuntimeConfiguration()")).toBeGreaterThan(-1);
    expect(source.indexOf("validateStorageRuntimeConfiguration()")).toBeLessThan(source.lastIndexOf("server.listen("));
  });

  it("permits the local development fallback outside production", () => {
    expect(() => validateStorageRuntimeConfiguration({ NODE_ENV: "development" })).not.toThrow();
  });
});
