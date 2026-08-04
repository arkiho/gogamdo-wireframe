import express, { type Express, type RequestHandler } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer, type UserConfig } from "vite";
import viteConfig from "../../vite.config";
import { getPublishedInsightArticleBySlug, getPortfolioDraft, listDraftImages } from "../db";
import { getStaticAssetCacheControl } from "./staticCachePolicy";

export async function resolveViteConfigForServer(mode: string): Promise<UserConfig> {
  if (typeof viteConfig === "function") {
    return await viteConfig({
      command: "serve",
      mode,
      isSsrBuild: false,
      isPreview: false,
    });
  }
  return await viteConfig;
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const resolvedViteConfig = await resolveViteConfigForServer("development");
  const vite = await createViteServer({
    ...resolvedViteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

// Route-specific meta tags for SEO (server-side injection)
const ROUTE_META: Record<string, { title: string; description: string }> = {
  "/": {
    title: "고감도 KOKAMDO | 기업 이전·오피스 인테리어 전문기업",
    description: "사무실 이전과 부동산 계약 전 필요한 면적을 먼저 진단하세요. 고감도는 오피스 기획·설계·시공·사후관리와 학교·공공기관 관급공사를 수행합니다.",
  },
  "/about": {
    title: "회사소개 | 고감도 KOKAMDO",
    description: "고감도는 기업의 요구와 현장 조건을 확인하고 사무공간의 기획·설계·시공 과정을 함께합니다.",
  },
  "/solutions": {
    title: "솔루션 | 고감도 KOKAMDO",
    description: "업무 방식과 현장 조건을 반영해 사무공간의 기획, 설계, 시공과 사후관리 과정을 안내합니다.",
  },
  "/portfolio": {
    title: "고객 사례 | 고감도 KOKAMDO",
    description: "고객사의 공개 승인을 받은 사무공간 인테리어 프로젝트를 선별해 소개합니다.",
  },
  "/estimator": {
    title: "예상 견적 | 고감도 KOKAMDO",
    description: "공간 정보와 공사 조건을 입력해 사무실 인테리어 예상 범위를 확인합니다.",
  },
  "/office-space-calculator": {
    title: "계약 전 필요 평수 진단 | 고감도 KOKAMDO",
    description: "사무실 이전 전 직원 수, 좌석 방식, 회의실과 지원공간을 입력해 필요한 사무실 면적 범위를 연락처 없이 바로 확인하세요.",
  },
  "/insights": {
    title: "인사이트 | 고감도 KOKAMDO",
    description: "사무공간 인테리어의 기획, 비용, 설계와 시공에 관한 정보를 확인하세요.",
  },
  "/resources": {
    title: "자료실 | 고감도 KOKAMDO",
    description: "사무실 이전과 인테리어 실무에 도움이 되는 자료를 확인하세요.",
  },
  "/contact": {
    title: "문의하기 | 고감도 KOKAMDO",
    description: "프로젝트 목적, 현재 단계, 일정과 공간 조건을 알려주시면 내용을 확인한 뒤 상담 범위를 안내합니다.",
  },
  "/faq": {
    title: "자주 묻는 질문 | 고감도 KOKAMDO",
    description: "사무실 인테리어 비용, 기간, 진행 과정에 관한 자주 묻는 질문을 확인하세요.",
  },
  "/how-we-work": {
    title: "진행 과정 | 고감도 KOKAMDO",
    description: "사무공간 프로젝트의 상담, 현장 확인, 기획, 설계와 시공 진행 과정을 안내합니다.",
  },
  "/ai-chat": {
    title: "공간 상담 도구 | 고감도 KOKAMDO",
    description: "사무공간 기획에 필요한 기본 정보를 대화형 도구로 확인하세요.",
  },
  "/ai-style": {
    title: "공간 스타일 탐색 | 고감도 KOKAMDO",
    description: "사무공간의 방향을 검토할 수 있는 스타일 자료를 확인하세요.",
  },
  "/ai-redesign": {
    title: "공간 리디자인 | 고감도 KOKAMDO",
    description: "현재 공간을 바탕으로 사무공간 개선 방향을 탐색하세요.",
  },
  "/privacy": {
    title: "개인정보처리방침 | 고감도 KOKAMDO",
    description: "(주)고감도의 개인정보처리방침입니다.",
  },
  "/terms": {
    title: "이용약관 | 고감도 KOKAMDO",
    description: "(주)고감도 홈페이지 이용약관입니다.",
  },
  ...Object.fromEntries(
    [
      ["seoul", "서울"],
      ["gangnam", "강남"],
      ["yeouido", "여의도"],
      ["pangyo", "판교"],
      ["gyeonggi", "경기"],
      ["incheon", "인천"],
    ].map(([slug, area]) => [
      `/office-interior/${slug}`,
      {
        title: `${area} 사무실 인테리어 | 고감도 KOKAMDO`,
        description: `${area} 지역의 사무공간 기획, 설계와 시공 상담 정보를 확인하세요.`,
      },
    ]),
  ),
};

function normalizeCanonicalPath(pathname: string): string | null {
  try {
    const decoded = decodeURIComponent(pathname);
    if (!decoded.startsWith("/") || /[\u0000-\u001f<>"'\\]/.test(decoded)) return null;

    const parsed = new URL(decoded, "https://kokamdo.co.kr");
    if (parsed.origin !== "https://kokamdo.co.kr" || parsed.search || parsed.hash) return null;
    return parsed.pathname;
  } catch {
    return null;
  }
}

const HOME_HERO_PRELOAD_PATTERN = /\s*<link\s+[^>]*data-home-hero-preload[^>]*\/?>/gi;

export function applyHomeHeroPreloadPolicy(html: string, pathname: string): string {
  return pathname === "/" ? html : html.replace(HOME_HERO_PRELOAD_PATTERN, "");
}

function injectNoIndex(html: string): string {
  html = applyHomeHeroPreloadPolicy(html, "");
  html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/, "");
  html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/, "");
  if (/<meta\s+name="robots"/i.test(html)) {
    return html.replace(
      /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
      '<meta name="robots" content="noindex, nofollow" />',
    );
  }
  return html.replace("</head>", '<meta name="robots" content="noindex, nofollow" />\n</head>');
}

export function injectMeta(html: string, pathname: string): string {
  const safePath = normalizeCanonicalPath(pathname);
  if (!safePath) return injectNoIndex(html);

  const decision = getSeoRouteDecision(safePath, true);
  if (!decision.indexable || !decision.canonicalPath || decision.redirectTo) {
    return injectNoIndex(html);
  }
  const canonicalPath = decision.canonicalPath;
  html = applyHomeHeroPreloadPolicy(html, canonicalPath);
  const meta = ROUTE_META[canonicalPath];

  // 공개 경로의 대표주소는 검증·정규화·HTML 속성 이스케이프 후 주입한다.
  const canonicalUrl = htmlEscapeAttr(`https://kokamdo.co.kr${canonicalPath === "/" ? "" : canonicalPath}`);
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${canonicalUrl}" />`
  );
  html = html.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${canonicalUrl}" />`
  );

  if (!meta) return html;

  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${meta.title}</title>`
  );
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${meta.description}" />`
  );
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${meta.title}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${meta.description}" />`
  );
  return html;
}

// 검색에 공개할 정적 SPA 경로
const PUBLIC_SPA_ROUTES = new Set([
  "/", "/about", "/solutions", "/portfolio", "/contact",
  "/estimator", "/office-space-calculator", "/insights", "/resources", "/faq",
  "/how-we-work", "/ai-chat", "/ai-style", "/ai-redesign",
  "/privacy", "/terms",
  "/office-interior/seoul", "/office-interior/gangnam",
  "/office-interior/yeouido", "/office-interior/pangyo",
  "/office-interior/gyeonggi", "/office-interior/incheon",
]);

// 앱 동작에는 필요하지만 검색에는 공개하지 않을 SPA 경로
const PRIVATE_SPA_ROUTES = new Set([
  "/portal", "/my", "/offline",
  "/client/login", "/client/register", "/client/verify-email",
  "/client/forgot-password", "/client/reset-password", "/client/dashboard",
  "/auth/login", "/partner/login",
  "/survey/workspace", "/survey/interview", "/survey/report",
  "/staff/join", "/staff/pending",
]);

const PRIVATE_SPA_PREFIXES = [
  "/review/", "/unsubscribe/", "/my/project/", "/survey/",
  "/admin", "/ops", "/partner", "/employee",
];

function isPublicDynamicRoute(pathname: string): boolean {
  return /^\/portfolio\/p\/\d+\/?$/.test(pathname)
    || /^\/insights\/[^/]+\/?$/.test(pathname);
}

export interface SeoRouteDecision {
  statusCode: 200 | 404;
  indexable: boolean;
  canonicalPath: string | null;
  redirectTo: string | null;
}

export function getSeoRouteDecision(
  pathname: string,
  dynamicExists: boolean,
): SeoRouteDecision {
  const safePath = normalizeCanonicalPath(pathname);
  if (!safePath || safePath !== pathname || safePath === "/404") {
    return { statusCode: 404, indexable: false, canonicalPath: null, redirectTo: null };
  }

  const withoutTrailingSlash = safePath.length > 1 && safePath.endsWith("/")
    ? safePath.slice(0, -1)
    : safePath;
  const isDynamic = isPublicDynamicRoute(safePath);

  if (safePath !== withoutTrailingSlash
      && (PUBLIC_SPA_ROUTES.has(withoutTrailingSlash) || (isDynamic && dynamicExists))) {
    return {
      statusCode: 200,
      indexable: false,
      canonicalPath: null,
      redirectTo: withoutTrailingSlash,
    };
  }

  if (PUBLIC_SPA_ROUTES.has(safePath)) {
    return { statusCode: 200, indexable: true, canonicalPath: safePath, redirectTo: null };
  }

  if (isDynamic) {
    return dynamicExists
      ? { statusCode: 200, indexable: true, canonicalPath: withoutTrailingSlash, redirectTo: null }
      : { statusCode: 404, indexable: false, canonicalPath: null, redirectTo: null };
  }

  if (PRIVATE_SPA_ROUTES.has(safePath)
      || PRIVATE_SPA_PREFIXES.some((prefix) => {
        const segment = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
        return safePath === segment || safePath.startsWith(`${segment}/`);
      })) {
    return { statusCode: 200, indexable: false, canonicalPath: null, redirectTo: null };
  }

  return { statusCode: 404, indexable: false, canonicalPath: null, redirectTo: null };
}

/**
 * 폐지된 공개 경로 → 대체 경로 301 영구 리다이렉트.
 * SPA fallback은 알 수 없는 경로에도 index.html을 200으로 내주므로(soft 404),
 * 색인된 구 경로는 여기서 명시적으로 넘겨야 검색 색인이 이전된다.
 */
const PERMANENT_REDIRECTS: Record<string, string> = {
  "/opsx": "/solutions",
  "/about/": "/about",
  "/contact/": "/contact",
  "/works/": "/portfolio",
  "/portfolio/lab543-office/": "/portfolio/p/3",
  "/portfolio/lab543": "/portfolio/p/3",
  "/portfolio/sba-setec": "/portfolio/p/8",
  "/portfolio/setec/": "/portfolio/p/8",
  "/portfolio/ggallery/": "/portfolio/p/720001",
  "/portfolio/기아자동차-중국-염성/": "/portfolio/p/9",
  "/portfolio/myung-jang-si-dae-gimhae/": "/portfolio/p/840001",
  "/portfolio/딜리/": "/portfolio/p/1170002",
  "/portfolio/mit-soft-office-seongsu/": "/portfolio/p/780001",
  "/portfolio/hanshin-medipia/": "/portfolio/p/930001",
  "/portfolio/the-paper-lab-seoul/": "/portfolio/p/5",
  "/portfolio/bbodek-factory/": "/portfolio/p/900001",
  "/portfolio/an-games-office/": "/portfolio/p/1050001",
  "/portfolio/angames-본사/": "/portfolio/p/1050001",
  "/portfolio/huxeed-office/": "/portfolio/p/2",
};

const ENCODED_PERMANENT_REDIRECTS: Record<string, string> = Object.fromEntries(
  Object.entries(PERMANENT_REDIRECTS)
    .filter(([pathname]) => /[^\x00-\x7f]/.test(pathname))
    .map(([pathname, destination]) => [encodeURI(pathname), destination]),
);

export function getPermanentRedirect(pathname: string): string | null {
  return PERMANENT_REDIRECTS[pathname]
    ?? ENCODED_PERMANENT_REDIRECTS[pathname]
    ?? null;
}

function htmlEscapeAttr(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** og:image / twitter:image 를 주어진 URL로 교체합니다 (카카오/OG 스크래퍼용). */
function injectImageMeta(html: string, imageUrl: string): string {
  const safe = htmlEscapeAttr(imageUrl);
  html = html.replace(
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:image" content="${safe}" />`
  );
  html = html.replace(
    /<meta\s+property="og:image:secure_url"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:image:secure_url" content="${safe}" />`
  );
  html = html.replace(
    /<meta\s+property="twitter:image"\s+content="[^"]*"\s*\/?>/,
    `<meta property="twitter:image" content="${safe}" />`
  );
  return html;
}

/** 제목/설명 계열 메타를 주어진 값으로 교체합니다. */
function injectTitleDesc(html: string, title?: string, description?: string): string {
  if (title) {
    const t = htmlEscapeAttr(title);
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`);
    html = html.replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
      `<meta property="og:title" content="${t}" />`
    );
    html = html.replace(
      /<meta\s+property="twitter:title"\s+content="[^"]*"\s*\/?>/,
      `<meta property="twitter:title" content="${t}" />`
    );
  }
  if (description) {
    const d = htmlEscapeAttr(description);
    html = html.replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${d}" />`
    );
    html = html.replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
      `<meta property="og:description" content="${d}" />`
    );
    html = html.replace(
      /<meta\s+property="twitter:description"\s+content="[^"]*"\s*\/?>/,
      `<meta property="twitter:description" content="${d}" />`
    );
  }
  return html;
}

export interface DynamicMeta {
  title?: string;
  description?: string;
  image?: string;
}

/** 동적 상세 페이지(인사이트/포트폴리오)의 페이지별 메타를 DB에서 조회합니다. */
export async function getDynamicMeta(pathname: string): Promise<DynamicMeta | null> {
  try {
    const insightMatch = pathname.match(/^\/insights\/([^/]+)\/?$/);
    if (insightMatch) {
      const slug = decodeURIComponent(insightMatch[1]);
      const a = await getPublishedInsightArticleBySlug(slug);
      if (!a) return null;
      return {
        title: `${a.title} | 고감도 KOKAMDO`,
        description: (a.metaDescription || a.excerpt || "") as string,
        image: (a.coverImageUrl || undefined) as string | undefined,
      };
    }
    const portfolioMatch = pathname.match(/^\/portfolio\/p\/(\d+)\/?$/);
    if (portfolioMatch) {
      const id = parseInt(portfolioMatch[1]);
      const d = await getPortfolioDraft(id);
      if (!d || d.status !== "published") return null;
      const images = await listDraftImages(id);
      const cover = images.find((img: any) => img.isCover === "yes") || images[0];
      const image = cover?.processedUrl || cover?.originalUrl || undefined;
      const parts = [d.category, d.area, d.location].filter(Boolean).join(" ");
      return {
        title: `${d.title} | 고객 사례 | 고감도 KOKAMDO`,
        description: `${d.title} - ${parts} 사무실 인테리어 시공 사례`,
        image,
      };
    }
    return null;
  } catch (err) {
    console.warn("[Meta] Dynamic meta lookup failed:", err);
    return null;
  }
}

export interface SeoFallbackOptions {
  readIndexHtml: () => string;
  resolveDynamicMeta?: (pathname: string) => Promise<DynamicMeta | null>;
}

export function createSeoFallbackHandler({
  readIndexHtml,
  resolveDynamicMeta = getDynamicMeta,
}: SeoFallbackOptions): RequestHandler {
  return async (req, res, next) => {
    const pathname = req.originalUrl.split("?")[0];

    try {
      const legacyRedirect = getPermanentRedirect(pathname);
      if (legacyRedirect) {
        const query = req.originalUrl.slice(pathname.length);
        res.redirect(301, legacyRedirect + query);
        return;
      }

      if (normalizeCanonicalPath(pathname) !== pathname) {
        res.status(404).send(injectNoIndex(readIndexHtml()));
        return;
      }

      const dyn = await resolveDynamicMeta(pathname);
      const decision = getSeoRouteDecision(pathname, Boolean(dyn));
      if (decision.redirectTo) {
        const query = req.originalUrl.slice(pathname.length);
        res.redirect(301, decision.redirectTo + query);
        return;
      }

      let html = readIndexHtml();
      html = decision.indexable && decision.canonicalPath
        ? injectMeta(html, decision.canonicalPath)
        : injectNoIndex(html);

      if (dyn && decision.indexable) {
        html = injectTitleDesc(html, dyn.title, dyn.description);
        if (dyn.image) html = injectImageMeta(html, dyn.image);
      }

      res.status(decision.statusCode).set({ "Content-Type": "text/html" }).send(html);
    } catch (error) {
      next(error);
    }
  };
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      res.setHeader("Cache-Control", getStaticAssetCacheControl(filePath));
    },
  }));

  // Serve index.html for known SPA routes; return 404 for unknown paths
  const indexPath = path.resolve(distPath, "index.html");
  app.use("*", createSeoFallbackHandler({
    readIndexHtml: () => fs.readFileSync(indexPath, "utf-8"),
  }));
}
