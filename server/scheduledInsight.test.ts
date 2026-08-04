import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Request, Response } from "express";

const { generateAndSaveInsightMock } = vi.hoisted(() => ({
  generateAndSaveInsightMock: vi.fn(),
}));

vi.mock("./_core/env", () => ({
  ENV: { scheduledTaskSecret: "test-scheduled-secret" },
}));

vi.mock("./_core/insightGenerator", () => ({
  generateAndSaveInsight: generateAndSaveInsightMock,
}));

import { ENV } from "./_core/env";
import { generateInsightHandler } from "./routers/scheduledInsight";

const TEST_SECRET = "test-scheduled-secret";

type ResponseState = {
  statusCode: number;
  payload: unknown;
};

function createRequest(options: {
  authorization?: string;
  cronSecret?: string;
  taskId?: string;
  body?: Record<string, unknown>;
} = {}): Request {
  return {
    headers: {
      ...(options.authorization ? { authorization: options.authorization } : {}),
      ...(options.cronSecret ? { "x-cron-secret": options.cronSecret } : {}),
      ...(options.taskId ? { "x-cron-task-id": options.taskId } : {}),
    },
    body: options.body ?? {},
    url: "/api/scheduled/generateInsight",
  } as unknown as Request;
}

function createResponse(): { response: Response; state: ResponseState } {
  const state: ResponseState = { statusCode: 200, payload: undefined };
  const response = {
    status(code: number) {
      state.statusCode = code;
      return response;
    },
    json(payload: unknown) {
      state.payload = payload;
      return response;
    },
  } as unknown as Response;
  return { response, state };
}

async function invoke(request: Request) {
  const { response, state } = createResponse();
  await generateInsightHandler(request, response);
  return state;
}

describe("Scheduled Insight handler", () => {
  beforeEach(() => {
    ENV.scheduledTaskSecret = TEST_SECRET;
    generateAndSaveInsightMock.mockReset();
    generateAndSaveInsightMock.mockResolvedValue({ articleId: 42, slug: "qa-insight" });
  });

  it("fails closed with 503 when the scheduler secret is not configured", async () => {
    ENV.scheduledTaskSecret = "";

    const state = await invoke(createRequest({ cronSecret: TEST_SECRET }));

    expect(state.statusCode).toBe(503);
    expect(state.payload).toEqual(expect.objectContaining({
      error: expect.stringContaining("scheduler-not-configured"),
    }));
    expect(generateAndSaveInsightMock).not.toHaveBeenCalled();
  });

  it.each([
    ["missing secret", createRequest()],
    ["wrong bearer secret", createRequest({ authorization: "Bearer wrong-secret" })],
    ["wrong x-cron-secret", createRequest({ cronSecret: "wrong-secret" })],
  ])("rejects %s with 401", async (_label, request) => {
    const state = await invoke(request);

    expect(state.statusCode).toBe(401);
    expect(state.payload).toEqual({ error: "unauthorized" });
    expect(generateAndSaveInsightMock).not.toHaveBeenCalled();
  });

  it.each([
    ["Bearer", createRequest({ authorization: `Bearer ${TEST_SECRET}` })],
    ["x-cron-secret", createRequest({ cronSecret: TEST_SECRET })],
  ])("accepts the %s authentication form", async (_label, request) => {
    const state = await invoke(request);

    expect(state.statusCode).toBe(200);
    expect(state.payload).toEqual({ ok: true, articleId: 42, slug: "qa-insight" });
    expect(generateAndSaveInsightMock).toHaveBeenCalledOnce();
  });

  it("forwards generation inputs and publishes by default", async () => {
    const body = {
      topic: "오피스 이전 체크리스트",
      category: "tip",
      targetAudience: "사무실 이전 예정 기업",
      trendContext: "검증된 최신 자료",
      keywords: ["사무실 이전", "오피스 인테리어"],
    };

    await invoke(createRequest({ cronSecret: TEST_SECRET, body }));

    expect(generateAndSaveInsightMock).toHaveBeenCalledWith({
      ...body,
      publish: true,
    });
  });

  it.each([
    ["draft flag", { draft: true }],
    ["autoPublish flag", { autoPublish: false }],
  ])("keeps the article as a draft for the %s", async (_label, body) => {
    await invoke(createRequest({ cronSecret: TEST_SECRET, body }));

    expect(generateAndSaveInsightMock).toHaveBeenCalledWith(expect.objectContaining({
      publish: false,
    }));
  });

  it("returns a bounded error payload with request context", async () => {
    generateAndSaveInsightMock.mockRejectedValueOnce(new Error("generation failed"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const state = await invoke(createRequest({
      cronSecret: TEST_SECRET,
      taskId: "qa-task-1",
    }));

    expect(state.statusCode).toBe(500);
    expect(state.payload).toEqual(expect.objectContaining({
      error: "generation failed",
      context: {
        url: "/api/scheduled/generateInsight",
        taskUid: "qa-task-1",
      },
      timestamp: expect.any(String),
    }));
    consoleError.mockRestore();
  });
});

describe("Scheduled Insight route registration", () => {
  const indexSource = readFileSync(resolve(__dirname, "_core/index.ts"), "utf8");

  it("registers the handler", () => {
    expect(indexSource).toContain("/api/scheduled/generateInsight");
    expect(indexSource).toContain("generateInsightHandler");
  });

  it("registers the scheduled endpoint before the tRPC middleware", () => {
    const scheduledIndex = indexSource.indexOf("/api/scheduled/generateInsight");
    const trpcIndex = indexSource.indexOf("/api/trpc");
    expect(scheduledIndex).toBeGreaterThanOrEqual(0);
    expect(trpcIndex).toBeGreaterThan(scheduledIndex);
  });
});
