import { spawn } from "node:child_process";
import { context as createBuildContext } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  fetchWithTimeout,
  readResponseBodyWithTimeout,
  stopProcessGroup,
  withTimeout,
  withTimeoutAndCancellation,
} from "./seo-audit-helpers.mjs";

async function getFreePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : null;
  await new Promise(resolve => server.close(resolve));
  if (!port) throw new Error("Could not allocate a free local port");
  return port;
}

const appPort = await getFreePort();
const cdpPort = await getFreePort();
const origin = `http://127.0.0.1:${appPort}`;
const qaKoreanInsightPath = `/insights/${encodeURIComponent("사무실-이전-체크리스트")}`;
const qaKoreanInsightCanonical = `https://kokamdo.co.kr${qaKoreanInsightPath}`;
const chromeBin = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const userDataDir = await mkdtemp(path.join(tmpdir(), "gogamdo-seo-qa-"));
const children = [];
const qaServerBundle = path.resolve(process.cwd(), `dist/.seo-fallback-qa-server-${process.pid}.mjs`);

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

async function waitFor(url, parseJson = false, timeoutMs = 20_000, child = null) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    if (child) assertChildRunning(child);
    try {
      const response = await fetchWithTimeout(url, {}, 2_000, url);
      if (response.ok) {
        return parseJson
          ? readResponseBodyWithTimeout(response, "json", 2_000, `read JSON from ${url}`)
          : readResponseBodyWithTimeout(response, "text", 2_000, `read readiness body from ${url}`).then(() => undefined);
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
  const eventWaiters = new Map();
  const eventHandlers = new Map();
  const rejectPending = error => {
    for (const waiter of pending.values()) waiter.reject(error);
    pending.clear();
    for (const waiters of eventWaiters.values()) {
      for (const waiter of waiters) waiter.reject(error);
    }
    eventWaiters.clear();
  };
  socket.addEventListener("close", () => rejectPending(new Error("CDP WebSocket closed unexpectedly")), { once: true });
  socket.addEventListener("error", () => rejectPending(new Error("CDP WebSocket failed")), { once: true });
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.method && eventWaiters.has(message.method)) {
      const waiters = eventWaiters.get(message.method);
      eventWaiters.delete(message.method);
      for (const waiter of waiters) waiter.resolve(message.params);
    }
    if (message.method && eventHandlers.has(message.method)) {
      for (const handler of eventHandlers.get(message.method)) handler(message.params);
    }
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
    once(method, timeoutMs = 15_000) {
      return new Promise((resolve, reject) => {
        const waiter = { resolve: null, reject };
        const waiters = eventWaiters.get(method) || [];
        waiters.push(waiter);
        eventWaiters.set(method, waiters);
        const timeout = setTimeout(() => {
          const current = eventWaiters.get(method) || [];
          const remaining = current.filter(item => item !== waiter);
          if (remaining.length) eventWaiters.set(method, remaining);
          else eventWaiters.delete(method);
          reject(new Error(`Timed out waiting for CDP event ${method}`));
        }, timeoutMs);
        waiter.resolve = value => {
          clearTimeout(timeout);
          resolve(value);
        };
      });
    },
    on(method, handler) {
      const handlers = eventHandlers.get(method) || [];
      handlers.push(handler);
      eventHandlers.set(method, handlers);
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

async function inspectPath(cdp, pathname, expectation) {
  const loaded = cdp.once("Page.loadEventFired");
  await Promise.all([
    cdp.call("Page.navigate", { url: `${origin}${pathname}` }),
    loaded,
  ]);
  const deadline = Date.now() + 15_000;
  let ready = false;
  while (Date.now() < deadline) {
    ready = await evaluate(cdp, `document.readyState === "complete" && Boolean(document.querySelector("#root")) && document.querySelector("#root").textContent.trim().length > 0`);
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert(ready, `${pathname} did not finish rendering`);
  return waitForExpectedMetadata(cdp, pathname, expectation);
}

async function readMetadata(cdp) {
  return evaluate(cdp, `({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content ?? null,
    robots: document.querySelector('meta[name="robots"]')?.content ?? null,
    canonical: document.querySelector('link[rel="canonical"]')?.href ?? null,
    ogUrl: document.querySelector('meta[property="og:url"]')?.content ?? null
  })`);
}

function metadataMatches(actual, expectation) {
  if (expectation.noindex) {
    return actual.canonical === null
      && actual.ogUrl === null
      && actual.robots === "noindex, nofollow";
  }
  return actual.canonical === expectation.canonical
    && actual.ogUrl === expectation.canonical
    && actual.title === expectation.title
    && actual.description === expectation.description
    && actual.robots !== "noindex, nofollow";
}

async function waitForExpectedMetadata(cdp, pathname, expectation, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  let actual = await readMetadata(cdp);
  while (!metadataMatches(actual, expectation) && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 100));
    actual = await readMetadata(cdp);
  }
  const root = await evaluate(cdp, "document.querySelector('#root')?.textContent?.slice(0, 500) ?? ''");
  assert(
    metadataMatches(actual, expectation),
    `${pathname} metadata did not settle before timeout: actual=${JSON.stringify(actual)} root=${JSON.stringify(root)}`,
  );
  return actual;
}

async function inspectClientNavigation(cdp, fromPath, toPath, fromExpectation, toExpectation) {
  await inspectPath(cdp, fromPath, fromExpectation);
  await evaluate(cdp, `(() => {
    history.pushState({}, "", ${JSON.stringify(toPath)});
    window.dispatchEvent(new PopStateEvent("popstate"));
    return window.location.pathname;
  })()`);
  return waitForExpectedMetadata(cdp, toPath, toExpectation);
}

async function stopChild(child) {
  await stopProcessGroup(child);
}

function monitorChildren(promise, activeChildren) {
  const failures = activeChildren.map(child => child.finished.then(result => {
    if (result.error) throw new Error(`${child.qaLabel} failed: ${result.error.message}`);
    throw new Error(`${child.qaLabel} exited during audit: code=${result.code} signal=${result.signal}`);
  }));
  return Promise.race([promise, ...failures]);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const expectations = [
  {
    path: "/unknown-review-path",
    noindex: true,
  },
  {
    path: "/404",
    noindex: true,
  },
  {
    path: "/auth/login",
    noindex: true,
  },
  {
    path: "/admin",
    noindex: true,
  },
  {
    path: "/administrator",
    noindex: true,
  },
  {
    path: "/partnerfoo",
    noindex: true,
  },
  {
    path: "/employeehandbook",
    noindex: true,
  },
  {
    path: "/office-space-calculator/",
    noindex: true,
  },
  {
    path: "/%61bout",
    noindex: true,
  },
  {
    path: "/office-space-calculator%2F",
    noindex: true,
  },
  {
    path: "/office-space-calculator%252F",
    noindex: true,
  },
  {
    path: "/office-space-calculator%3Csvg%20onload%3Dalert(1)%3E",
    noindex: true,
  },
  {
    path: "/portfolio/p/999999",
    noindex: true,
  },
  {
    path: "/insights/qa-missing-insight",
    noindex: true,
  },
  {
    path: "/portfolio/p/424242",
    canonical: "https://kokamdo.co.kr/portfolio/p/424242",
    title: "QA 공개 포트폴리오 | 고객 사례 | 고감도 KOKAMDO",
    description: "QA 공개 포트폴리오 - 오피스 100㎡ 서울 사무실 인테리어 시공 사례",
  },
  {
    path: "/insights/qa-published-insight",
    canonical: "https://kokamdo.co.kr/insights/qa-published-insight",
    title: "QA 공개 인사이트 | 고감도 KOKAMDO",
    description: "QA 승인 메타 설명",
  },
  {
    path: qaKoreanInsightPath,
    canonical: qaKoreanInsightCanonical,
    title: "사무실 이전 체크리스트 | 고감도 KOKAMDO",
    description: "QA 한국어 슬러그 승인 메타 설명",
  },
  {
    path: "/office-space-calculator",
    canonical: "https://kokamdo.co.kr/office-space-calculator",
    title: "계약 전 필요 평수 진단 | 고감도 KOKAMDO",
    description: "사무실 이전 전 직원 수, 좌석 방식, 회의실과 지원공간을 입력해 필요한 사무실 면적 범위를 연락처 없이 바로 확인하세요.",
  },
  {
    path: "/",
    canonical: "https://kokamdo.co.kr/",
    title: "고감도 KOKAMDO | 기업 이전·오피스 인테리어 전문기업",
    description: "사무실 이전과 부동산 계약 전 필요한 면적을 먼저 진단하세요. 고감도는 오피스 기획·설계·시공·사후관리와 학교·공공기관 관급공사를 수행합니다.",
  },
  {
    path: "/about",
    canonical: "https://kokamdo.co.kr/about",
    title: "회사소개 | 고감도 KOKAMDO",
    description: "고감도는 기업의 요구와 현장 조건을 확인하고 사무공간의 기획·설계·시공 과정을 함께합니다.",
  },
  {
    path: "/solutions",
    canonical: "https://kokamdo.co.kr/solutions",
    title: "솔루션 | 고감도 KOKAMDO",
    description: "업무 방식과 현장 조건을 반영해 사무공간의 기획, 설계, 시공과 사후관리 과정을 안내합니다.",
  },
  {
    path: "/portfolio",
    canonical: "https://kokamdo.co.kr/portfolio",
    title: "고객 사례 | 고감도 KOKAMDO",
    description: "고객사의 공개 승인을 받은 사무공간 인테리어 프로젝트를 선별해 소개합니다.",
  },
  {
    path: "/estimator",
    canonical: "https://kokamdo.co.kr/estimator",
    title: "예상 견적 | 고감도 KOKAMDO",
    description: "공간 정보와 공사 조건을 입력해 사무실 인테리어 예상 범위를 확인합니다.",
  },
  {
    path: "/insights",
    canonical: "https://kokamdo.co.kr/insights",
    title: "인사이트 | 고감도 KOKAMDO",
    description: "사무공간 인테리어의 기획, 비용, 설계와 시공에 관한 정보를 확인하세요.",
  },
  {
    path: "/resources",
    canonical: "https://kokamdo.co.kr/resources",
    title: "자료실 | 고감도 KOKAMDO",
    description: "사무실 이전과 인테리어 실무에 도움이 되는 자료를 확인하세요.",
  },
  {
    path: "/contact",
    canonical: "https://kokamdo.co.kr/contact",
    title: "문의하기 | 고감도 KOKAMDO",
    description: "프로젝트 목적, 현재 단계, 일정과 공간 조건을 알려주시면 내용을 확인한 뒤 상담 범위를 안내합니다.",
  },
  {
    path: "/how-we-work",
    canonical: "https://kokamdo.co.kr/how-we-work",
    title: "진행 과정 | 고감도 KOKAMDO",
    description: "사무공간 프로젝트의 상담, 현장 확인, 기획, 설계와 시공 진행 과정을 안내합니다.",
  },
  {
    path: "/office-interior/seoul",
    canonical: "https://kokamdo.co.kr/office-interior/seoul",
    title: "서울 사무실 인테리어 | 고감도 KOKAMDO",
    description: "서울 지역의 사무공간 기획, 설계와 시공 상담 정보를 확인하세요.",
  },
  {
    path: "/faq",
    canonical: "https://kokamdo.co.kr/faq",
    title: "자주 묻는 질문 | 고감도 KOKAMDO",
    description: "사무실 인테리어 비용, 기간, 진행 과정에 관한 자주 묻는 질문을 확인하세요.",
  },
  {
    path: "/privacy",
    canonical: "https://kokamdo.co.kr/privacy",
    title: "개인정보처리방침 | 고감도 KOKAMDO",
    description: "(주)고감도의 개인정보처리방침입니다.",
  },
  {
    path: "/terms",
    canonical: "https://kokamdo.co.kr/terms",
    title: "이용약관 | 고감도 KOKAMDO",
    description: "(주)고감도 홈페이지 이용약관입니다.",
  },
  {
    path: "/ai-chat",
    canonical: "https://kokamdo.co.kr/ai-chat",
    title: "공간 상담 도구 | 고감도 KOKAMDO",
    description: "사무공간 기획에 필요한 기본 정보를 대화형 도구로 확인하세요.",
  },
  {
    path: "/ai-style",
    canonical: "https://kokamdo.co.kr/ai-style",
    title: "공간 스타일 탐색 | 고감도 KOKAMDO",
    description: "사무공간의 방향을 검토할 수 있는 스타일 자료를 확인하세요.",
  },
  {
    path: "/ai-redesign",
    canonical: "https://kokamdo.co.kr/ai-redesign",
    title: "공간 리디자인 | 고감도 KOKAMDO",
    description: "현재 공간을 바탕으로 사무공간 개선 방향을 탐색하세요.",
  },
  ...[
    ["gangnam", "강남"],
    ["yeouido", "여의도"],
    ["pangyo", "판교"],
    ["gyeonggi", "경기"],
    ["incheon", "인천"],
  ].map(([slug, area]) => ({
    path: `/office-interior/${slug}`,
    canonical: `https://kokamdo.co.kr/office-interior/${slug}`,
    title: `${area} 사무실 인테리어 | 고감도 KOKAMDO`,
    description: `${area} 지역의 사무공간 기획, 설계와 시공 상담 정보를 확인하세요.`,
  })),
];

try {
  const forceBuildTimeout = process.env.QA_FORCE_BUILD_TIMEOUT === "1";
  const buildContext = await withTimeout(createBuildContext({
      entryPoints: [path.resolve(process.cwd(), "scripts/seo-fallback-qa-server.ts")],
      outfile: qaServerBundle,
      bundle: true,
      format: "esm",
      platform: "node",
      packages: "external",
      logLevel: "silent",
      plugins: forceBuildTimeout ? [{
        name: "qa-force-build-timeout",
        setup(build) {
          build.onStart(() => new Promise(resolve => setTimeout(resolve, 500)));
        },
      }] : [],
    }), 5_000, "create SEO fallback QA build context");
  try {
    await withTimeoutAndCancellation(
      buildContext.rebuild(),
      forceBuildTimeout ? 25 : 30_000,
      "bundle SEO fallback QA server",
      () => buildContext.cancel(),
      5_000,
    );
  } finally {
    await withTimeout(buildContext.dispose(), 5_000, "dispose SEO fallback QA build context");
  }
  const app = launch(
    process.execPath,
    [qaServerBundle, String(appPort)],
    "SEO fallback QA server",
  );
  await waitFor(`${origin}/`, false, 20_000, app);
  const unapprovedProcedureProbe = {
    procedure: "__qa.unapproved-probe",
    input: { probe: true },
  };
  const probeInput = encodeURIComponent(JSON.stringify({ json: unapprovedProcedureProbe.input }));
  const probeResponse = await monitorChildren(
    fetchWithTimeout(
      `${origin}/api/trpc/${unapprovedProcedureProbe.procedure}?input=${probeInput}`,
      {},
      5_000,
      "unapproved tRPC procedure probe",
    ),
    [app],
  );
  assert(probeResponse.status === 404, `Unapproved tRPC probe status=${probeResponse.status}`);
  await monitorChildren(readResponseBodyWithTimeout(probeResponse, "text", 2_000, "read unapproved probe response"), [app]);

  const invalidBatchProbe = {
    procedure: "portfolioReview.approved,portfolioReview.approved",
    input: [{ portfolioId: 424242 }, { portfolioId: 7 }],
  };
  const invalidBatchInput = encodeURIComponent(JSON.stringify({
    "0": { json: invalidBatchProbe.input[0] },
    "1": { json: invalidBatchProbe.input[1] },
  }));
  const invalidBatchResponse = await monitorChildren(
    fetchWithTimeout(
      `${origin}/api/trpc/${invalidBatchProbe.procedure}?batch=1&input=${invalidBatchInput}`,
      {},
      5_000,
      "invalid tRPC batch input probe",
    ),
    [app],
  );
  assert(invalidBatchResponse.status === 404, `Invalid tRPC batch probe status=${invalidBatchResponse.status}`);
  await monitorChildren(readResponseBodyWithTimeout(invalidBatchResponse, "text", 2_000, "read invalid batch probe response"), [app]);

  const validMixedBatchProbe = {
    procedure: "portfolio.detail,auth.me",
    input: [{ id: 424242 }, null],
  };
  const validMixedBatchInput = encodeURIComponent(JSON.stringify({
    "0": { json: validMixedBatchProbe.input[0] },
    "1": { json: validMixedBatchProbe.input[1] },
  }));
  const validMixedBatchResponse = await monitorChildren(
    fetchWithTimeout(
      `${origin}/api/trpc/${validMixedBatchProbe.procedure}?batch=1&input=${validMixedBatchInput}`,
      {},
      5_000,
      "valid mixed tRPC batch input probe",
    ),
    [app],
  );
  assert(validMixedBatchResponse.status === 200, `Valid mixed tRPC batch probe status=${validMixedBatchResponse.status}`);
  const validMixedBatchBody = await monitorChildren(
    readResponseBodyWithTimeout(validMixedBatchResponse, "json", 2_000, "read valid mixed batch response"),
    [app],
  );
  assert(Array.isArray(validMixedBatchBody) && validMixedBatchBody.length === 2, "Valid mixed tRPC batch response shape is invalid");
  assert(validMixedBatchBody[0]?.result?.data?.json?.id === 424242, "Valid mixed batch portfolio result is invalid");
  assert(validMixedBatchBody[1]?.result?.data?.json === null, "Valid mixed batch auth result is invalid");

  const unapprovedMixedBatchProbe = {
    procedure: "portfolio.detail,__qa.unapproved-mixed",
    input: [{ id: 424242 }, null],
  };
  const unapprovedMixedBatchInput = encodeURIComponent(JSON.stringify({
    "0": { json: unapprovedMixedBatchProbe.input[0] },
    "1": { json: unapprovedMixedBatchProbe.input[1] },
  }));
  const unapprovedMixedBatchResponse = await monitorChildren(
    fetchWithTimeout(
      `${origin}/api/trpc/${unapprovedMixedBatchProbe.procedure}?batch=1&input=${unapprovedMixedBatchInput}`,
      {},
      5_000,
      "unapproved mixed tRPC batch probe",
    ),
    [app],
  );
  assert(unapprovedMixedBatchResponse.status === 404, `Unapproved mixed tRPC batch status=${unapprovedMixedBatchResponse.status}`);
  await monitorChildren(
    readResponseBodyWithTimeout(unapprovedMixedBatchResponse, "text", 2_000, "read unapproved mixed batch response"),
    [app],
  );

  const serverHttpExpectations = [
    { path: "/office-space-calculator", status: 200, canonical: "https://kokamdo.co.kr/office-space-calculator" },
    { path: "/office-space-calculator/", status: 301, location: "/office-space-calculator" },
    { path: "/%61bout", status: 404, noindex: true },
    { path: "/office-space-calculator%2F", status: 404, noindex: true },
    { path: "/office-space-calculator%252F", status: 404, noindex: true },
    { path: "/%70ortfolio/%EA%B8%B0%EC%95%84%EC%9E%90%EB%8F%99%EC%B0%A8-%EC%A4%91%EA%B5%AD-%EC%97%BC%EC%84%B1/", status: 404, noindex: true },
    { path: "/portfolio%2F%EA%B8%B0%EC%95%84%EC%9E%90%EB%8F%99%EC%B0%A8-%EC%A4%91%EA%B5%AD-%EC%97%BC%EC%84%B1/", status: 404, noindex: true },
    { path: "/office-space-calculator%3Csvg%20onload%3Dalert(1)%3E", status: 404, noindex: true },
    { path: "/portfolio/p/999999", status: 404, noindex: true },
    { path: "/insights/qa-missing-insight", status: 404, noindex: true },
    { path: "/portfolio/p/424242", status: 200, canonical: "https://kokamdo.co.kr/portfolio/p/424242" },
    { path: "/insights/qa-published-insight", status: 200, canonical: "https://kokamdo.co.kr/insights/qa-published-insight" },
    { path: qaKoreanInsightPath, status: 200, canonical: qaKoreanInsightCanonical },
    {
      path: "/portfolio/%EA%B8%B0%EC%95%84%EC%9E%90%EB%8F%99%EC%B0%A8-%EC%A4%91%EA%B5%AD-%EC%97%BC%EC%84%B1/",
      status: 301,
      location: "/portfolio/p/9",
    },
  ];
  const serverResults = [];
  for (const expectation of serverHttpExpectations) {
    const response = await monitorChildren(
      fetchWithTimeout(`${origin}${expectation.path}`, { redirect: "manual" }, 5_000, expectation.path),
      [app],
    );
    const responseText = await monitorChildren(
      readResponseBodyWithTimeout(response, "text", 5_000, `read HTML ${expectation.path}`),
      [app],
    );
    const html = expectation.location ? "" : responseText;
    const result = {
      path: expectation.path,
      status: response.status,
      location: response.headers.get("location"),
    };
    serverResults.push(result);
    assert(response.status === expectation.status, `${expectation.path} server status=${response.status}`);
    if (expectation.location) {
      assert(result.location === expectation.location, `${expectation.path} server location=${result.location}`);
    }
    if (expectation.noindex) {
      assert(html.includes('name="robots" content="noindex, nofollow"'), `${expectation.path} server omitted noindex`);
      assert(!html.includes('rel="canonical"'), `${expectation.path} server restored canonical`);
      assert(!html.includes('property="og:url"'), `${expectation.path} server restored og:url`);
    }
    if (expectation.canonical) {
      assert(html.includes(`rel="canonical" href="${expectation.canonical}"`), `${expectation.path} server canonical mismatch`);
      assert(html.includes(`property="og:url" content="${expectation.canonical}"`), `${expectation.path} server og:url mismatch`);
    }
  }

  const chrome = launch(chromeBin, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    "about:blank",
  ], "Chrome");
  const targets = await waitFor(`http://127.0.0.1:${cdpPort}/json/list`, true, 20_000, chrome);
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

  const results = [];
  for (const expectation of expectations) {
    const actual = await monitorChildren(
      inspectPath(cdp, expectation.path, expectation),
      [app, chrome],
    );
    results.push({ path: expectation.path, ...actual });
    if (expectation.noindex) {
      assert(actual.canonical === null, `${expectation.path} restored canonical ${actual.canonical}`);
      assert(actual.ogUrl === null, `${expectation.path} restored og:url ${actual.ogUrl}`);
      assert(actual.robots === "noindex, nofollow", `${expectation.path} robots=${actual.robots}`);
    } else {
      assert(actual.canonical === expectation.canonical, `${expectation.path} canonical=${actual.canonical}`);
      assert(actual.ogUrl === expectation.canonical, `${expectation.path} og:url=${actual.ogUrl}`);
      assert(actual.title === expectation.title, `${expectation.path} title=${actual.title}`);
      assert(actual.description === expectation.description, `${expectation.path} description=${actual.description}`);
      assert(actual.robots !== "noindex, nofollow", `${expectation.path} remained noindex`);
    }
  }

  const clientNavigationResults = [];
  for (const toPath of [
    "/unknown-client-navigation",
    "/office-space-calculator/",
    "/%61bout",
    "/office-space-calculator%2F",
    "/office-space-calculator%252F",
    "/office-space-calculator%3Csvg%20onload%3Dalert(1)%3E",
  ]) {
    const fromExpectation = expectations.find(item => item.path === "/how-we-work");
    const toExpectation = { noindex: true };
    const actual = await monitorChildren(
      inspectClientNavigation(cdp, "/how-we-work", toPath, fromExpectation, toExpectation),
      [app, chrome],
    );
    clientNavigationResults.push({ from: "/how-we-work", to: toPath, ...actual });
    assert(actual.canonical === null, `${toPath} client navigation restored canonical ${actual.canonical}`);
    assert(actual.ogUrl === null, `${toPath} client navigation restored og:url ${actual.ogUrl}`);
    assert(actual.robots === "noindex, nofollow", `${toPath} client navigation robots=${actual.robots}`);
  }
  const qaRequestResponse = await monitorChildren(
    fetchWithTimeout(`${origin}/__qa/dynamic-requests`, {}, 5_000, "QA dynamic request log"),
    [app],
  );
  assert(qaRequestResponse.ok, `QA request log status=${qaRequestResponse.status}`);
  const { dynamicRequests, unexpectedDynamicRequests: recordedUnexpectedRequests } = await monitorChildren(
    readResponseBodyWithTimeout(qaRequestResponse, "json", 5_000, "read QA dynamic request log"),
    [app],
  );
  const matchingProcedureProbes = recordedUnexpectedRequests.filter(request =>
    request.procedure === unapprovedProcedureProbe.procedure
      && request.input?.probe === true);
  assert(matchingProcedureProbes.length === 1, `Unapproved tRPC probe was not recorded exactly once: ${JSON.stringify(recordedUnexpectedRequests)}`);
  const matchingInvalidBatchProbes = recordedUnexpectedRequests.filter(request =>
    request.procedure === invalidBatchProbe.procedure
      && Array.isArray(request.input)
      && request.input[0]?.portfolioId === 424242
      && request.input[1]?.portfolioId === 7);
  assert(matchingInvalidBatchProbes.length === 1, `Invalid per-operation batch input was not recorded exactly once: ${JSON.stringify(recordedUnexpectedRequests)}`);
  const matchingUnapprovedMixedBatchProbes = recordedUnexpectedRequests.filter(request =>
    request.procedure === unapprovedMixedBatchProbe.procedure
      && Array.isArray(request.input)
      && request.input[0]?.id === 424242
      && request.input[1] === null);
  assert(matchingUnapprovedMixedBatchProbes.length === 1, `Unapproved mixed batch was not recorded exactly once: ${JSON.stringify(recordedUnexpectedRequests)}`);
  const validMixedBatchWasRejected = recordedUnexpectedRequests.some(request =>
    request.procedure === validMixedBatchProbe.procedure
      && Array.isArray(request.input)
      && request.input[0]?.id === 424242);
  assert(!validMixedBatchWasRejected, `Valid mixed tRPC batch was falsely rejected: ${JSON.stringify(recordedUnexpectedRequests)}`);
  const unexpectedDynamicRequests = recordedUnexpectedRequests.filter(request =>
    (request.procedure !== unapprovedProcedureProbe.procedure || request.input?.probe !== true)
      && !(request.procedure === invalidBatchProbe.procedure
        && Array.isArray(request.input)
        && request.input[0]?.portfolioId === 424242
        && request.input[1]?.portfolioId === 7)
      && !(request.procedure === unapprovedMixedBatchProbe.procedure
        && Array.isArray(request.input)
        && request.input[0]?.id === 424242
        && request.input[1] === null));
  assert(unexpectedDynamicRequests.length === 0, `Unexpected dynamic API requests: ${JSON.stringify(unexpectedDynamicRequests)}`);
  cdp.close();
  console.log(JSON.stringify({
    passed: true,
    serverResults,
    results,
    clientNavigationResults,
    unapprovedProcedureProbeRecorded: true,
    invalidBatchInputProbeRecorded: true,
    unapprovedMixedBatchProbeRecorded: true,
    validMixedBatchAccepted: true,
    dynamicRequests,
    unexpectedDynamicRequests,
  }, null, 2));
} finally {
  const cleanupErrors = [];
  for (const child of children.reverse()) {
    try {
      await stopChild(child);
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
  try {
    await rm(qaServerBundle, { force: true });
  } catch (error) {
    cleanupErrors.push(error);
  }
  if (cleanupErrors.length) {
    throw new AggregateError(cleanupErrors, "SEO audit cleanup failed");
  }
}
