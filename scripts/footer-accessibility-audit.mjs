import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  fetchWithTimeout,
  readResponseBodyWithTimeout,
  stopProcessGroup,
  withTimeout,
} from "./seo-audit-helpers.mjs";

async function getFreePort() {
  const server = createServer();
  await withTimeout(new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  }), 5_000, "allocate footer QA port", () => server.close());
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : null;
  await withTimeout(
    new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())),
    5_000,
    "close footer QA port allocator",
  );
  if (!port) throw new Error("Could not allocate a free local port");
  return port;
}

const appPort = process.env.QA_PORT ? Number(process.env.QA_PORT) : await getFreePort();
const cdpPort = process.env.QA_CDP_PORT ? Number(process.env.QA_CDP_PORT) : await getFreePort();
const appUrl = `http://127.0.0.1:${appPort}/`;
const chromeBin = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const userDataDir = await mkdtemp(path.join(tmpdir(), "gogamdo-footer-qa-"));
const children = [];

function launch(command, args, label) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    detached: true,
    stdio: "ignore",
  });
  child.qaLabel = label;
  child.spawnError = null;
  child.finished = new Promise(resolve => {
    child.once("error", error => {
      child.spawnError = error;
      resolve({ error });
    });
    child.once("exit", (code, signal) => resolve({ code, signal }));
  });
  child.unref();
  children.push(child);
  return child;
}

function assertChildRunning(child) {
  if (child.spawnError) throw new Error(`${child.qaLabel} failed to start: ${child.spawnError.message}`);
  if (child.exitCode !== null || child.signalCode !== null) {
    throw new Error(`${child.qaLabel} exited early: code=${child.exitCode} signal=${child.signalCode}`);
  }
}

function monitorChildren(promise, activeChildren) {
  const failures = activeChildren.map(child => child.finished.then(result => {
    if (result.error) throw new Error(`${child.qaLabel} failed: ${result.error.message}`);
    throw new Error(`${child.qaLabel} exited during audit: code=${result.code} signal=${result.signal}`);
  }));
  return Promise.race([promise, ...failures]);
}

async function waitForJson(url, child, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    assertChildRunning(child);
    try {
      const response = await fetchWithTimeout(url, {}, 2_000, url);
      if (response.ok) {
        return readResponseBodyWithTimeout(response, "json", 2_000, `read JSON from ${url}`);
      }
      await readResponseBodyWithTimeout(response, "text", 2_000, `read failed JSON readiness body from ${url}`);
      lastError = new Error(`${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error(`Timed out waiting for ${url}: ${lastError?.message || "unknown error"}`);
}

async function waitForHttp(url, child, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    assertChildRunning(child);
    try {
      const response = await fetchWithTimeout(url, {}, 2_000, url);
      if (response.ok) {
        await readResponseBodyWithTimeout(response, "text", 2_000, `read readiness body from ${url}`);
        return;
      }
      await readResponseBodyWithTimeout(response, "text", 2_000, `read failed readiness body from ${url}`);
      lastError = new Error(`${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error(`Timed out waiting for ${url}: ${lastError?.message || "unknown error"}`);
}

async function connectCdp(url) {
  const socket = new WebSocket(url);
  await withTimeout(
    new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", () => reject(new Error("CDP WebSocket connection failed")), { once: true });
    }),
    10_000,
    `connect CDP WebSocket ${url}`,
    () => socket.close(),
  );
  let nextId = 0;
  const pending = new Map();
  const rejectPending = error => {
    for (const waiter of pending.values()) waiter.reject(error);
    pending.clear();
  };
  socket.addEventListener("close", () => rejectPending(new Error("CDP WebSocket closed unexpectedly")), { once: true });
  socket.addEventListener("error", () => rejectPending(new Error("CDP WebSocket failed")), { once: true });
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const waiter = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) waiter.reject(new Error(message.error.message));
    else waiter.resolve(message.result);
  });
  return {
    call(method, params = {}) {
      const id = ++nextId;
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`Timed out: CDP command ${method}`));
        }, 10_000);
        pending.set(id, {
          resolve: value => {
            clearTimeout(timeout);
            resolve(value);
          },
          reject: error => {
            clearTimeout(timeout);
            reject(error);
          },
        });
        try {
          socket.send(JSON.stringify({ id, method, params }));
        } catch (error) {
          clearTimeout(timeout);
          pending.delete(id);
          reject(error);
        }
      });
    },
    close() {
      socket.close();
    },
  };
}

async function evaluate(cdp, expression) {
  const result = await cdp.call("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || "Browser evaluation failed");
  }
  return result.result.value;
}

async function loadViewport(cdp, metrics) {
  await cdp.call("Emulation.setDeviceMetricsOverride", metrics);
  await cdp.call("Page.navigate", { url: appUrl });
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const ready = await evaluate(cdp, `document.readyState === "complete" && Boolean(document.querySelector('[data-testid="footer-terms"]'))`);
    if (ready) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("Footer did not render before timeout");
}

const targetIds = [
  "footer-employee-login",
  "footer-partner-login",
  "footer-privacy",
  "footer-terms",
  "newsletter-privacy-link",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const app = launch(
    process.execPath,
    [path.resolve(process.cwd(), "node_modules/vite/bin/vite.js"), "preview", "--host", "127.0.0.1", "--port", String(appPort), "--strictPort"],
    "Vite preview",
  );
  await waitForHttp(appUrl, app);

  const chrome = launch(chromeBin, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    "about:blank",
  ], "Chrome");
  const targets = await waitForJson(`http://127.0.0.1:${cdpPort}/json/list`, chrome);
  const page = targets.find(target => target.type === "page");
  assert(page, "No Chrome page target found");
  const cdp = await connectCdp(page.webSocketDebuggerUrl);
  await cdp.call("Page.enable");
  await cdp.call("Runtime.enable");
  const forcedExit = process.env.QA_FORCE_CHILD_EXIT_AFTER_CDP;
  if (forcedExit === "app" || forcedExit === "chrome") {
    const target = forcedExit === "app" ? app : chrome;
    process.kill(-target.pid, "SIGTERM");
  }

  await monitorChildren(loadViewport(cdp, {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
    screenWidth: 390,
    screenHeight: 844,
  }), [app, chrome]);
  const mobile = await monitorChildren(evaluate(cdp, `(() => {
    const ids = ${JSON.stringify(targetIds)};
    const targets = ids.map(id => {
      const element = document.querySelector('[data-testid="' + id + '"]');
      const rect = element?.getBoundingClientRect();
      return { id, found: Boolean(element), height: rect?.height ?? 0, minHeight: element ? getComputedStyle(element).minHeight : null };
    });
    const label = document.querySelector('label[for="newsletter-privacy-consent"]');
    targets.push({ id: "newsletter-consent-label", found: Boolean(label), height: label?.getBoundingClientRect().height ?? 0, minHeight: label ? getComputedStyle(label).minHeight : null });
    return targets;
  })()`), [app, chrome]);
  for (const target of mobile) {
    assert(target.found, `Mobile target missing: ${target.id}`);
    assert(target.height >= 44, `Mobile target ${target.id} is ${target.height}px, expected at least 44px`);
  }

  const interaction = await monitorChildren(evaluate(cdp, `(() => {
    const checkbox = document.querySelector('[data-testid="newsletter-privacy-consent"]');
    const label = document.querySelector('label[for="newsletter-privacy-consent"]');
    const link = document.querySelector('[data-testid="newsletter-privacy-link"]');
    checkbox.checked = false;
    link.addEventListener('click', event => event.preventDefault(), { once: true });
    link.click();
    const afterLink = checkbox.checked;
    label.click();
    return { afterLink, afterLabel: checkbox.checked };
  })()`), [app, chrome]);
  assert(interaction.afterLink === false, "Privacy-link click changed the newsletter checkbox");
  assert(interaction.afterLabel === true, "Consent-label click did not toggle the newsletter checkbox");

  await monitorChildren(loadViewport(cdp, {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: 1280,
    screenHeight: 900,
  }), [app, chrome]);
  const desktop = await monitorChildren(evaluate(cdp, `(() => {
    const ids = ${JSON.stringify(targetIds)};
    return ids.map(id => {
      const element = document.querySelector('[data-testid="' + id + '"]');
      const style = element ? getComputedStyle(element) : null;
      return { id, found: Boolean(element), height: element?.getBoundingClientRect().height ?? 0, minHeight: style?.minHeight ?? null };
    });
  })()`), [app, chrome]);
  for (const target of desktop) {
    assert(target.found, `Desktop target missing: ${target.id}`);
    assert(target.minHeight === "0px", `Desktop target ${target.id} kept min-height ${target.minHeight}, expected 0px`);
  }

  cdp.close();
  console.log(JSON.stringify({ passed: true, mobile, interaction, desktop }, null, 2));
} finally {
  const cleanupErrors = [];
  for (const child of children.reverse()) {
    try {
      await stopProcessGroup(child);
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  try {
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      try {
        await new Promise(resolve => setTimeout(resolve, 200 * attempt));
        await rm(userDataDir, { recursive: true, force: true });
        break;
      } catch (error) {
        if (attempt === 5 || !["ENOTEMPTY", "EBUSY"].includes(error.code)) throw error;
      }
    }
  } catch (error) {
    cleanupErrors.push(error);
  }
  if (cleanupErrors.length) {
    throw new AggregateError(cleanupErrors, "Footer accessibility audit cleanup failed");
  }
}
