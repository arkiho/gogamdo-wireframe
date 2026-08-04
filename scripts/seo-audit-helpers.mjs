import { execFileSync } from "node:child_process";

const QA_ALLOWED_PROCEDURES = new Set([
  "announcement.active",
  "auth.me",
  "popup.active",
  "settings.aiEnabled",
  "portfolio.published",
  "insight.published",
  "portfolioReview.approved",
  "portfolio.detail",
  "insight.bySlug",
]);

function classifyQaTrpcOperation(procedure, input) {
  if (!QA_ALLOWED_PROCEDURES.has(procedure)) return "unexpected";
  if (procedure === "portfolio.detail") {
    if (input?.id === 424242) return "mock";
    if (input?.id === 999999) return "expected-missing";
    return "unexpected";
  }
  if (procedure === "portfolioReview.approved") {
    return input?.portfolioId === 424242 ? "mock" : "unexpected";
  }
  if (procedure === "insight.bySlug") {
    if (["qa-published-insight", "사무실-이전-체크리스트"].includes(input?.slug)) return "mock";
    if (input?.slug === "qa-missing-insight") return "expected-missing";
    return "unexpected";
  }
  return "allowed-unmocked";
}

export function classifyQaTrpcRequest(procedure, input) {
  const procedures = procedure.split(",");
  const inputs = procedures.length === 1
    ? [Array.isArray(input) ? input[0] : input]
    : Array.isArray(input) && input.length === procedures.length
      ? input
      : null;
  if (!inputs) return "unexpected";
  const classifications = procedures.map((name, index) =>
    classifyQaTrpcOperation(name, inputs[index]));
  if (classifications.includes("unexpected")) return "unexpected";
  return procedures.length === 1 ? classifications[0] : "allowed-unmocked";
}

export function withTimeout(promise, timeoutMs, label, onTimeout = () => {}) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      try {
        onTimeout();
      } finally {
        reject(new Error(`Timed out: ${label}`));
      }
    }, timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export function withTimeoutAndCancellation(
  promise,
  timeoutMs,
  label,
  cancel,
  cancellationTimeoutMs = 5_000,
) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(async () => {
      if (settled) return;
      settled = true;
      const timeoutError = new Error(`Timed out: ${label}`);
      try {
        await withTimeout(
          Promise.resolve().then(cancel),
          cancellationTimeoutMs,
          `cancel ${label}`,
        );
        reject(timeoutError);
      } catch (cancelError) {
        reject(new AggregateError(
          [timeoutError, cancelError],
          `Timed out and cancellation failed: ${label}`,
        ));
      }
    }, timeoutMs);
    Promise.resolve(promise).then(
      value => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

const responseAborters = new WeakMap();

export async function fetchWithTimeout(input, init = {}, timeoutMs = 5_000, label = String(input)) {
  const controller = new AbortController();
  const signal = init.signal
    ? AbortSignal.any([init.signal, controller.signal])
    : controller.signal;
  const response = await withTimeout(
    fetch(input, { ...init, signal }),
    timeoutMs,
    `fetch ${label}`,
    () => controller.abort(),
  );
  responseAborters.set(response, () => controller.abort());
  return response;
}

export function readResponseBodyWithTimeout(response, format, timeoutMs, label) {
  if (format !== "text" && format !== "json") {
    throw new Error(`Unsupported response body format: ${format}`);
  }
  const abort = responseAborters.get(response) ?? (() => response.body?.cancel().catch(() => {}));
  return withTimeout(
    response[format](),
    timeoutMs,
    label,
    abort,
  ).finally(() => responseAborters.delete(response));
}

export function isProcessGroupAlive(groupId) {
  const output = execFileSync("/bin/ps", ["-axo", "pgid="], {
    encoding: "utf8",
    timeout: 1_000,
  });
  return output
    .split("\n")
    .some(value => Number(value.trim()) === groupId);
}

async function waitForProcessGroupExit(groupId, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!isProcessGroupAlive(groupId)) return true;
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  return !isProcessGroupAlive(groupId);
}

export async function stopProcessGroup(child, options = {}) {
  const graceMs = options.graceMs ?? 3_000;
  const killMs = options.killMs ?? 3_000;
  if (!child?.pid || !isProcessGroupAlive(child.pid)) return;

  try {
    process.kill(-child.pid, "SIGTERM");
  } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }
  if (await waitForProcessGroupExit(child.pid, graceMs)) return;

  try {
    process.kill(-child.pid, "SIGKILL");
  } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }
  if (!(await waitForProcessGroupExit(child.pid, killMs))) {
    throw new Error(`Process group ${child.pid} survived SIGKILL`);
  }
}
