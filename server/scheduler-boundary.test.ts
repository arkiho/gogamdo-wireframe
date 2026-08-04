import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createSchedulerAuthMiddleware, validateSchedulerSecret } from "./_core/schedulerAuth";

function responseMock() {
  const state = { status: 200, body: undefined as unknown };
  return {
    state,
    status(code: number) { state.status = code; return this; },
    json(body: unknown) { state.body = body; return this; },
  };
}

describe("scheduler execution boundary", () => {
  it("does not start an in-process scheduler from the web entrypoint", () => {
    const source = readFileSync(path.resolve(import.meta.dirname, "_core/index.ts"), "utf8");
    expect(source).not.toMatch(/startInsightScheduler|insightScheduler/);
  });

  it.each([undefined, "", "short-secret"])("rejects missing or weak scheduler secret", secret => {
    expect(() => validateSchedulerSecret(secret)).toThrow(/SCHEDULER_SECRET/);
  });

  it("rejects an invalid bearer credential", () => {
    const res = responseMock();
    const next = vi.fn();
    const middleware = createSchedulerAuthMiddleware(() => "scheduler-secret-0123456789abcdef012345");

    middleware({ headers: { authorization: "Bearer wrong" } } as never, res as never, next);

    expect(res.state.status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows the configured bearer credential", () => {
    const secret = "scheduler-secret-0123456789abcdef012345";
    const res = responseMock();
    const next = vi.fn();
    const middleware = createSchedulerAuthMiddleware(() => secret);

    middleware({ headers: { authorization: `Bearer ${secret}` } } as never, res as never, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
