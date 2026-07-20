import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { getInsightArticleBySlug, getPortfolioDraft, listDraftImages } from "../db";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
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
    title: "고감도 KOKAMDO | 사무실 인테리어 설계·시공 전문기업 - AI 견적",
    description: "1991년 창업, 35년 경력의 사무공간 인테리어 전문기업 고감도. 2,800건 이상 프로젝트 완료. AI 예상 견적 서비스 제공.",
  },
  "/about": {
    title: "회사소개 | 고감도 KOKAMDO",
    description: "고감도는 1991년 창업 이래 35년간 대한민국 면적만큼의 공간을 설계하고 시공해 온 인테리어 전문기업입니다.",
  },
  "/solutions": {
    title: "솔루션 | 고감도 KOKAMDO",
    description: "공간 설계, 3D 렌더링, 시공 관리까지 원스톱 인테리어 솔루션.",
  },
  "/portfolio": {
    title: "고객 사례 | 고감도 KOKAMDO",
    description: "고감도가 완성한 사무공간 인테리어 프로젝트를 확인하세요.",
  },
  "/estimator": {
    title: "AI 예상 견적 | 고감도 KOKAMDO",
    description: "AI 기반 사무실 인테리어 예상 견적 서비스. 공간 정보를 입력하면 예상 비용을 즉시 확인할 수 있습니다.",
  },
  "/insights": {
    title: "인사이트 | 고감도 KOKAMDO",
    description: "사무공간 인테리어 트렌드, 비용 절감 팁, 공간 설계 노하우를 공유합니다.",
  },
  "/contact": {
    title: "문의하기 | 고감도 KOKAMDO",
    description: "사무실 인테리어 무료 상담을 신청하세요. 전문 컨설턴트가 최적의 솔루션을 제안합니다.",
  },
  "/faq": {
    title: "자주 묻는 질문 | 고감도 KOKAMDO",
    description: "사무실 인테리어 비용, 기간, 프로세스에 대한 자주 묻는 질문과 답변입니다.",
  },
  "/privacy": {
    title: "개인정보처리방침 | 고감도 KOKAMDO",
    description: "(주)고감도의 개인정보처리방침입니다.",
  },
  "/terms": {
    title: "이용약관 | 고감도 KOKAMDO",
    description: "(주)고감도 홈페이지 이용약관입니다.",
  },
  "/office-interior/seoul": {
    title: "서울 사무실 인테리어 전문 | 35년 경력 고감도 KOKAMDO",
    description: "서울 사무실 인테리어는 35년 경력·2,800건+ 프로젝트의 고감도. 서울 사무공간 설계·시공, AI 예상 견적까지 원스톱 제공. 데이터 기반 설계로 공간 효율을 극대화합니다.",
  },
  "/office-interior/gangnam": {
    title: "강남 사무실 인테리어 전문 | 35년 경력 고감도 KOKAMDO",
    description: "강남 사무실 인테리어는 35년 경력·2,800건+ 프로젝트의 고감도. 강남 사무공간 설계·시공, AI 예상 견적까지 원스톱 제공. 데이터 기반 설계로 공간 효율을 극대화합니다.",
  },
  "/office-interior/yeouido": {
    title: "여의도 사무실 인테리어 전문 | 35년 경력 고감도 KOKAMDO",
    description: "여의도 사무실 인테리어는 35년 경력·2,800건+ 프로젝트의 고감도. 여의도 사무공간 설계·시공, AI 예상 견적까지 원스톱 제공. 데이터 기반 설계로 공간 효율을 극대화합니다.",
  },
  "/office-interior/pangyo": {
    title: "판교 사무실 인테리어 전문 | 35년 경력 고감도 KOKAMDO",
    description: "판교 사무실 인테리어는 35년 경력·2,800건+ 프로젝트의 고감도. 판교 사무공간 설계·시공, AI 예상 견적까지 원스톱 제공. 데이터 기반 설계로 공간 효율을 극대화합니다.",
  },
  "/office-interior/gyeonggi": {
    title: "경기 사무실 인테리어 전문 | 35년 경력 고감도 KOKAMDO",
    description: "경기 사무실 인테리어는 35년 경력·2,800건+ 프로젝트의 고감도. 경기 사무공간 설계·시공, AI 예상 견적까지 원스톱 제공. 데이터 기반 설계로 공간 효율을 극대화합니다.",
  },
  "/office-interior/incheon": {
    title: "인천 사무실 인테리어 전문 | 35년 경력 고감도 KOKAMDO",
    description: "인천 사무실 인테리어는 35년 경력·2,800건+ 프로젝트의 고감도. 인천 사무공간 설계·시공, AI 예상 견적까지 원스톱 제공. 데이터 기반 설계로 공간 효율을 극대화합니다.",
  },
};

function injectMeta(html: string, pathname: string): string {
  const meta = ROUTE_META[pathname];
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
  const canonicalUrl = `https://kokamdo.co.kr${pathname === "/" ? "" : pathname}`;
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${canonicalUrl}" />`
  );
  html = html.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${canonicalUrl}" />`
  );
  return html;
}

// Known SPA routes that should serve index.html with 200
const SPA_ROUTES = new Set([
  "/", "/about", "/solutions", "/portfolio", "/contact",
  "/estimator", "/insights", "/resources", "/faq",
  "/how-we-work", "/ai-chat", "/ai-style", "/ai-redesign",
  "/privacy", "/terms", "/portal", "/my", "/404", "/offline",
  "/client/login", "/client/register", "/client/verify-email",
  "/client/forgot-password", "/client/reset-password",
  "/auth/login",
  "/partner/login",
  "/survey/workspace", "/survey/interview", "/survey/report",
  "/staff/join", "/staff/pending",
]);

// Route prefixes that match dynamic segments (e.g. /portfolio/p/:id)
const SPA_ROUTE_PREFIXES = [
  "/office-interior/",
  "/portfolio/p/", "/insights/", "/review/", "/unsubscribe/",
  "/my/project/", "/survey/",
  "/admin", "/ops", "/partner",
  "/employee",
];

function isSpaRoute(url: string): boolean {
  const pathname = url.split("?")[0];
  if (SPA_ROUTES.has(pathname)) return true;
  return SPA_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
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

/** 동적 상세 페이지(인사이트/포트폴리오)의 페이지별 메타를 DB에서 조회합니다. */
async function getDynamicMeta(
  pathname: string
): Promise<{ title?: string; description?: string; image?: string } | null> {
  try {
    const insightMatch = pathname.match(/^\/insights\/([^/]+)\/?$/);
    if (insightMatch) {
      const slug = decodeURIComponent(insightMatch[1]);
      const a = await getInsightArticleBySlug(slug);
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

  app.use(express.static(distPath));

  // Serve index.html for known SPA routes; return 404 for unknown paths
  app.use("*", async (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    const pathname = req.originalUrl.split("?")[0];
    const statusCode = isSpaRoute(req.originalUrl) ? 200 : 404;

    // Inject route-specific meta tags for SEO (정적 라우트 + 동적 상세 페이지)
    try {
      let html = fs.readFileSync(indexPath, "utf-8");
      html = injectMeta(html, pathname);

      // 인사이트/포트폴리오 상세: DB에서 페이지별 제목·설명·이미지 주입 (카카오/OG 스크래퍼 대응)
      const dyn = await getDynamicMeta(pathname);
      if (dyn) {
        html = injectTitleDesc(html, dyn.title, dyn.description);
        if (dyn.image) html = injectImageMeta(html, dyn.image);
      }

      res.status(statusCode).set({ "Content-Type": "text/html" }).send(html);
    } catch {
      res.status(statusCode).sendFile(indexPath);
    }
  });
}
