import { describe, expect, it, vi } from "vitest";
import { createStorageAccessMiddleware } from "./_core/storageAccess";

function responseMock() {
  const state = { status: 200, headers: new Map<string, string>(), body: undefined as unknown };
  return {
    state,
    status(code: number) { state.status = code; return this; },
    setHeader(name: string, value: string) { state.headers.set(name.toLowerCase(), value); },
    json(body: unknown) { state.body = body; return this; },
  };
}

describe("storage delivery access", () => {
  it("serves an exact DB-authorized public asset to an anonymous request", async () => {
    const authenticate = vi.fn(async () => { throw new Error("anonymous"); });
    const authorize = vi.fn(async () => "public" as const);
    const next = vi.fn();
    const res = responseMock();
    const middleware = createStorageAccessMiddleware({ authenticate, authorize });

    await middleware({ path: "/portfolio/12/cover.jpg" } as never, res as never, next);

    expect(authorize).toHaveBeenCalledWith("portfolio/12/cover.jpg", null);
    expect(next).toHaveBeenCalledOnce();
    expect(res.state.headers.get("cache-control")).toBe("public, max-age=0, must-revalidate");
  });

  it("conceals a non-published asset even under a formerly public prefix", async () => {
    const next = vi.fn();
    const res = responseMock();
    const middleware = createStorageAccessMiddleware({
      authenticate: vi.fn(async () => { throw new Error("anonymous"); }),
      authorize: vi.fn(async () => null),
    });

    await middleware({ path: "/generated/private-render.png" } as never, res as never, next);

    expect(res.state.status).toBe(404);
    expect(next).not.toHaveBeenCalled();
    expect(res.state.headers.get("cache-control")).toBe("private, no-store");
  });

  it("allows a DB-authorized private read without shared caching", async () => {
    const subject = { kind: "staff" as const, id: 1 };
    const next = vi.fn();
    const res = responseMock();
    const middleware = createStorageAccessMiddleware({
      authenticate: vi.fn(async () => subject),
      authorize: vi.fn(async () => "private" as const),
    });

    await middleware({ path: "/receipt/expense.pdf" } as never, res as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.state.headers.get("cache-control")).toBe("private, no-store");
  });

  it("rejects encoded traversal before authorization", async () => {
    const authorize = vi.fn();
    const next = vi.fn();
    const res = responseMock();
    const middleware = createStorageAccessMiddleware({
      authenticate: vi.fn(async () => { throw new Error("anonymous"); }),
      authorize,
    });

    await middleware({ path: "/portfolio/%2e%2e/secret.pdf" } as never, res as never, next);

    expect(res.state.status).toBe(404);
    expect(authorize).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
