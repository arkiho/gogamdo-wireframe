import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

// @ts-expect-error The audit helper is intentionally plain ESM for direct Node execution.
import {
  classifyQaTrpcRequest,
  fetchWithTimeout,
  isProcessGroupAlive,
  readResponseBodyWithTimeout,
  stopProcessGroup,
  withTimeout,
  withTimeoutAndCancellation,
} from "../scripts/seo-audit-helpers.mjs";

describe("SEO audit fail-closed helpers", () => {
  it("classifies unapproved tRPC procedures as unexpected", () => {
    expect(classifyQaTrpcRequest("portfolio.detail", { id: 424242 })).toBe("mock");
    expect(classifyQaTrpcRequest("portfolio.detail", { id: 999999 })).toBe("expected-missing");
    expect(classifyQaTrpcRequest("portfolio.detail", { id: 7 })).toBe("unexpected");
    expect(classifyQaTrpcRequest("insight.bySlug", { slug: "사무실-이전-체크리스트" })).toBe("mock");
    expect(classifyQaTrpcRequest("insight.bySlug", { slug: "승인되지-않은-한국어" })).toBe("unexpected");
    expect(classifyQaTrpcRequest("announcement.active,auth.me,popup.active,settings.aiEnabled", [null, null, null, null]))
      .toBe("allowed-unmocked");
    expect(classifyQaTrpcRequest("portfolioReview.approved,insight.published", [{ portfolioId: 424242 }, null]))
      .toBe("allowed-unmocked");
    expect(classifyQaTrpcRequest("portfolioReview.approved,portfolioReview.approved", [
      { portfolioId: 424242 },
      { portfolioId: 424242 },
    ])).toBe("allowed-unmocked");
    expect(classifyQaTrpcRequest("portfolioReview.approved,portfolioReview.approved", [
      { portfolioId: 424242 },
      { portfolioId: 7 },
    ])).toBe("unexpected");
    expect(classifyQaTrpcRequest("portfolio.detail,auth.me", [{ id: 424242 }, null]))
      .toBe("allowed-unmocked");
    expect(classifyQaTrpcRequest("unapproved.procedure", {})).toBe("unexpected");
  });

  it("rejects an asynchronous operation that never settles", async () => {
    await expect(withTimeout(new Promise(() => {}), 25, "never-settling probe"))
      .rejects.toThrow("Timed out: never-settling probe");
  });

  it("waits for asynchronous cancellation before reporting a timeout", async () => {
    let cancellationCompleted = false;
    await expect(withTimeoutAndCancellation(
      new Promise(() => {}),
      10,
      "cancellable probe",
      async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        cancellationCompleted = true;
      },
      1_000,
    )).rejects.toThrow("Timed out: cancellable probe");
    expect(cancellationCompleted).toBe(true);
  });

  it("aborts a partial HTTP response when body reading times out", async () => {
    let socketClosedResolve: () => void;
    const socketClosed = new Promise<void>(resolve => {
      socketClosedResolve = resolve;
    });
    const server = createServer((req, res) => {
      req.socket.once("close", () => socketClosedResolve());
      res.writeHead(200, { "content-type": "text/plain" });
      res.write("partial");
    });
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("test server did not bind");
    try {
      const response = await fetchWithTimeout(`http://127.0.0.1:${address.port}/`, {}, 1_000, "partial response");
      await expect(readResponseBodyWithTimeout(response, "text", 25, "partial response body"))
        .rejects.toThrow("Timed out: partial response body");
      await expect(withTimeout(socketClosed, 1_000, "partial response socket close"))
        .resolves.toBeUndefined();
    } finally {
      server.closeAllConnections();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });

  it("kills and verifies a detached process group after its leader exits", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "gogamdo-process-group-test-"));
    const pidFile = path.join(dir, "grandchild.pid");
    const grandchildCode = `
      const fs = require("node:fs");
      fs.writeFileSync(${JSON.stringify(pidFile)}, String(process.pid));
      process.on("SIGTERM", () => {});
      setInterval(() => {}, 1000);
    `;
    const leaderCode = `
      const { spawn } = require("node:child_process");
      spawn(process.execPath, ["-e", ${JSON.stringify(grandchildCode)}], { stdio: "ignore" }).unref();
    `;
    const leader = spawn(process.execPath, ["-e", leaderCode], {
      detached: true,
      stdio: "ignore",
    });
    const finished = new Promise(resolve => leader.once("exit", resolve));
    try {
      await finished;
      for (let attempt = 0; attempt < 50; attempt += 1) {
        try {
          await readFile(pidFile, "utf8");
          break;
        } catch {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      const grandchildPid = Number(await readFile(pidFile, "utf8"));
      expect(isProcessGroupAlive(leader.pid!)).toBe(true);
      await stopProcessGroup({ pid: leader.pid!, finished: Promise.resolve() }, { graceMs: 25, killMs: 1_000 });
      expect(isProcessGroupAlive(leader.pid!)).toBe(false);
      expect(() => process.kill(grandchildPid, 0)).toThrow();
    } finally {
      try {
        process.kill(-leader.pid!, "SIGKILL");
      } catch {}
      await rm(dir, { recursive: true, force: true });
    }
  });
});
