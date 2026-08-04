import express from "express";
import fs from "node:fs";
import path from "node:path";
import { createSeoFallbackHandler, type DynamicMeta } from "../server/_core/vite";
import { classifyQaTrpcRequest } from "./seo-audit-helpers.mjs";

const port = Number(process.argv[2]);
if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
  throw new Error("A valid TCP port argument is required");
}

const publicDir = path.resolve(process.cwd(), "dist/public");
const indexPath = path.join(publicDir, "index.html");
if (!fs.existsSync(indexPath)) {
  throw new Error("dist/public/index.html is missing; run pnpm build first");
}

const qaKoreanInsightSlug = "사무실-이전-체크리스트";
const qaKoreanInsightPath = `/insights/${encodeURIComponent(qaKoreanInsightSlug)}`;

const dynamicMeta = new Map<string, DynamicMeta>([
  [
    "/portfolio/p/424242",
    {
      title: "QA 공개 포트폴리오 | 고객 사례 | 고감도 KOKAMDO",
      description: "QA 공개 포트폴리오 - 오피스 100㎡ 서울 사무실 인테리어 시공 사례",
    },
  ],
  [
    "/insights/qa-published-insight",
    {
      title: "QA 공개 인사이트 | 고감도 KOKAMDO",
      description: "QA 승인 메타 설명",
    },
  ],
  [
    qaKoreanInsightPath,
    {
      title: "사무실 이전 체크리스트 | 고감도 KOKAMDO",
      description: "QA 한국어 슬러그 승인 메타 설명",
    },
  ],
]);

const app = express();
const dynamicRequests: Array<{ procedure: string; input: unknown }> = [];
const unexpectedDynamicRequests: Array<{ procedure: string; input: unknown }> = [];
const parseInput = (raw: unknown, procedureCount: number) => {
  const value = JSON.parse(typeof raw === "string" ? raw : "null");
  if (procedureCount === 1) return value?.["0"]?.json ?? value?.json ?? null;
  return Array.from({ length: procedureCount }, (_, index) =>
    value?.[String(index)]?.json ?? null);
};
const trpcItem = (data: unknown) => ({ result: { data: { json: data } } });
const qaPortfolio = {
  id: 424242,
  title: "QA 공개 포트폴리오",
  status: "published",
  category: "오피스",
  area: "100㎡",
  location: "서울",
  description: "QA 포트폴리오 본문",
  images: [],
};
const qaInsight = {
  id: 424242,
  slug: "qa-published-insight",
  title: "QA 공개 인사이트",
  status: "published",
  excerpt: "QA 공개 요약",
  metaDescription: "QA 승인 메타 설명",
  content: "QA 인사이트 본문",
  category: "tip",
  tags: [],
  readTimeMinutes: 1,
  viewCount: 0,
  createdAt: "2026-07-29T00:00:00.000Z",
  publishedAt: "2026-07-29T00:00:00.000Z",
};
const qaKoreanInsight = {
  ...qaInsight,
  id: 424243,
  slug: qaKoreanInsightSlug,
  title: "사무실 이전 체크리스트",
  excerpt: "QA 한국어 슬러그 공개 요약",
  metaDescription: "QA 한국어 슬러그 승인 메타 설명",
};
const qaProcedureData = (procedure: string, input: any) => {
  if (procedure === "portfolio.detail") return qaPortfolio;
  if (procedure === "insight.bySlug") {
    return input?.slug === qaKoreanInsightSlug ? qaKoreanInsight : qaInsight;
  }
  if (["announcement.active", "popup.active", "portfolio.published", "insight.published", "portfolioReview.approved"].includes(procedure)) return [];
  if (procedure === "settings.aiEnabled") {
    return { enabled: false, estimator: false, chat: false, style: false, redesign: false };
  }
  if (procedure === "auth.me") return null;
  throw new Error(`No QA response fixture for ${procedure}`);
};

app.get("/api/trpc/:procedure", (req, res) => {
  const procedure = req.params.procedure;
  const procedures = procedure.split(",");
  let input: any;
  try {
    input = parseInput(req.query.input, procedures.length);
  } catch {
    unexpectedDynamicRequests.push({ procedure, input: req.query.input });
    res.status(400).json({ error: "invalid QA input" });
    return;
  }
  const record = { procedure, input };
  const classification = classifyQaTrpcRequest(procedure, input);
  const isTrackedDynamicRequest = classification === "unexpected"
    || procedures.some(name => ["portfolio.detail", "portfolioReview.approved", "insight.bySlug"].includes(name));
  if (isTrackedDynamicRequest) dynamicRequests.push(record);
  if (classification === "unexpected") {
    unexpectedDynamicRequests.push(record);
    res.status(404).json({ error: "QA request rejected" });
    return;
  }
  if (classification === "expected-missing") {
    res.status(404).json({ error: "QA record not found" });
    return;
  }
  res.json(procedures.map((name, index) => trpcItem(
    qaProcedureData(name, procedures.length === 1 ? input : input[index]),
  )));
});
app.get("/__qa/dynamic-requests", (_req, res) => {
  res.json({ dynamicRequests, unexpectedDynamicRequests });
});
app.use(express.static(publicDir, { index: false }));
app.use(createSeoFallbackHandler({
  readIndexHtml: () => fs.readFileSync(indexPath, "utf8"),
  resolveDynamicMeta: async pathname => dynamicMeta.get(pathname) ?? null,
}));

const server = app.listen(port, "127.0.0.1");
const shutdown = () => server.close(() => process.exit(0));
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
