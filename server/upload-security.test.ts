import { describe, expect, it, vi } from "vitest";
import { createUploadHandler, MAX_UPLOAD_BYTES } from "./_core/uploadHandler";

function responseMock() {
  const state = { status: 200, body: undefined as unknown };
  const res = {
    status(code: number) {
      state.status = code;
      return res;
    },
    json(body: unknown) {
      state.body = body;
      return res;
    },
  };
  return { res: res as any, state };
}

function request(body: Record<string, unknown>) {
  return { body, headers: { "content-type": "application/json" } } as any;
}

const tinyPng = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
]);

describe("authenticated upload handler", () => {
  it("rejects anonymous uploads", async () => {
    const put = vi.fn();
    const handler = createUploadHandler({
      authenticate: vi.fn().mockRejectedValue(new Error("unauthorized")),
      put,
    });
    const { res, state } = responseMock();

    await handler(request({}), res);

    expect(state.status).toBe(401);
    expect(put).not.toHaveBeenCalled();
  });

  it.each([
    ["text/html", "payload.html", Buffer.from("<script>alert(1)</script>")],
    ["image/svg+xml", "payload.svg", Buffer.from("<svg><script/></svg>")],
    ["image/png", "fake.png", Buffer.from("<html>not a png</html>")],
  ])("rejects active content or MIME mismatch: %s", async (mimeType, filename, bytes) => {
    const put = vi.fn();
    const handler = createUploadHandler({
      authenticate: vi.fn().mockResolvedValue({ kind: "staff", id: 1 }),
      put,
    });
    const { res, state } = responseMock();

    await handler(request({ data: bytes.toString("base64"), filename, mimeType, prefix: "receipt" }), res);

    expect(state.status).toBe(415);
    expect(put).not.toHaveBeenCalled();
  });

  it("rejects malformed base64", async () => {
    const handler = createUploadHandler({
      authenticate: vi.fn().mockResolvedValue({ kind: "staff", id: 1 }),
      put: vi.fn(),
    });
    const { res, state } = responseMock();

    await handler(request({ data: "%%%%", filename: "x.png", mimeType: "image/png" }), res);

    expect(state.status).toBe(400);
  });

  it("rejects decoded payloads over the byte limit", async () => {
    const handler = createUploadHandler({
      authenticate: vi.fn().mockResolvedValue({ kind: "staff", id: 1 }),
      put: vi.fn(),
    });
    const { res, state } = responseMock();
    const bytes = Buffer.alloc(MAX_UPLOAD_BYTES + 1, 0x41);

    await handler(request({ data: bytes.toString("base64"), filename: "large.pdf", mimeType: "application/pdf" }), res);

    expect(state.status).toBe(413);
  });

  it("prevents a client from writing staff or public namespaces", async () => {
    for (const prefix of ["receipt", "bankbook", "bizcert", "upload", "portfolio", "generated", "unknown"]) {
      const put = vi.fn();
      const handler = createUploadHandler({
        authenticate: vi.fn().mockResolvedValue({ kind: "client", id: 9 }),
        put,
      });
      const { res, state } = responseMock();
      await handler(request({ data: tinyPng.toString("base64"), filename: "x.png", mimeType: "image/png", prefix }), res);
      expect(state.status).toBe(403);
      expect(put).not.toHaveBeenCalled();
    }
  });

  it("scopes a client avatar key to the authenticated client id", async () => {
    const put = vi.fn().mockResolvedValue({ key: "avatar/client-9/generated.png", url: "/uploads/avatar/client-9/generated.png" });
    const handler = createUploadHandler({
      authenticate: vi.fn().mockResolvedValue({ kind: "client", id: 9 }),
      put,
    });
    const { res, state } = responseMock();

    await handler(request({ data: tinyPng.toString("base64"), filename: "x.png", mimeType: "image/png", prefix: "avatar" }), res);

    expect(state.status).toBe(200);
    expect(put.mock.calls[0][0]).toMatch(/^avatar\/client-9\/[0-9a-f-]+\.png$/);
  });

  it("rejects a staff-selected unknown namespace", async () => {
    const put = vi.fn();
    const handler = createUploadHandler({
      authenticate: vi.fn().mockResolvedValue({ kind: "staff", id: 1 }),
      put,
    });
    const { res, state } = responseMock();

    await handler(request({ data: tinyPng.toString("base64"), filename: "x.png", mimeType: "image/png", prefix: "generated" }), res);

    expect(state.status).toBe(403);
    expect(put).not.toHaveBeenCalled();
  });

  it("stores a valid PNG under a server-generated key", async () => {
    const put = vi.fn().mockResolvedValue({ key: "receipt/generated.png", url: "/uploads/receipt/generated.png" });
    const handler = createUploadHandler({
      authenticate: vi.fn().mockResolvedValue({ kind: "staff", id: 1 }),
      put,
    });
    const { res, state } = responseMock();

    await handler(request({
      data: tinyPng.toString("base64"),
      filename: "../../attacker-name.html",
      mimeType: "image/png",
      prefix: "receipt",
    }), res);

    expect(state.status).toBe(200);
    expect(put).toHaveBeenCalledTimes(1);
    const [key, bytes, contentType] = put.mock.calls[0];
    expect(key).toMatch(/^receipt\/[0-9a-f-]+\.png$/);
    expect(key).not.toContain("attacker-name");
    expect(bytes).toEqual(tinyPng);
    expect(contentType).toBe("image/png");
  });
});
