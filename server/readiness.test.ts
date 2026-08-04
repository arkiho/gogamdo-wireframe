import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import { createReadinessHandler, probeLocalStorage } from "./_core/readiness";

function responseMock() {
  const state = { status: 200, body: undefined as unknown };
  return {
    state,
    status(code: number) { state.status = code; return this; },
    json(body: unknown) { state.body = body; return this; },
  };
}

describe("readiness", () => {
  it("returns 200 only when database and storage probes both pass", async () => {
    const res = responseMock();
    const handler = createReadinessHandler({
      database: vi.fn(async () => {}),
      storage: vi.fn(async () => {}),
      timeoutMs: 100,
    });

    await handler({} as never, res as never);

    expect(res.state.status).toBe(200);
    expect(res.state.body).toEqual({ status: "ready", checks: { database: true, storage: true } });
  });

  it("returns 503 without leaking internal database errors", async () => {
    const res = responseMock();
    const handler = createReadinessHandler({
      database: vi.fn(async () => { throw new Error("mysql://user:password@private-host"); }),
      storage: vi.fn(async () => {}),
      timeoutMs: 100,
    });

    await handler({} as never, res as never);

    expect(res.state.status).toBe(503);
    expect(JSON.stringify(res.state.body)).not.toContain("password");
    expect(res.state.body).toEqual({ status: "not_ready", checks: { database: false, storage: true } });
  });

  it("returns 503 when a probe exceeds the deadline", async () => {
    const res = responseMock();
    const handler = createReadinessHandler({
      database: vi.fn(() => new Promise<void>(() => {})),
      storage: vi.fn(async () => {}),
      timeoutMs: 5,
    });

    await handler({} as never, res as never);

    expect(res.state.status).toBe(503);
    expect(res.state.body).toEqual({ status: "not_ready", checks: { database: false, storage: true } });
  });

  it("proves local storage write, read, and cleanup", async () => {
    const parent = await fs.mkdtemp(path.join(os.tmpdir(), "kokamdo-readiness-"));
    const root = path.join(parent, "storage");
    try {
      await probeLocalStorage(root);
      const entries = await fs.readdir(root, { recursive: true });
      expect(entries).toEqual([]);
    } finally {
      await fs.rm(parent, { recursive: true, force: true });
    }
  });

  it("wires readiness to persistent local storage even when Forge image generation is configured", async () => {
    const source = await readFile(path.resolve("server/_core/index.ts"), "utf8");
    const readyBlock = source.slice(source.indexOf('app.get("/readyz"'), source.indexOf("const authenticateApplicationRequest"));
    expect(readyBlock).toContain("probeLocalStorage(STORAGE_DIR)");
    expect(readyBlock).not.toContain("BUILT_IN_FORGE_API");
    expect(readyBlock).not.toContain("Remote storage readiness probe");
  });
});
