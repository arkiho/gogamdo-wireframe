import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

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
  "/how-we-work", "/opsx", "/ai-chat", "/ai-style", "/ai-redesign",
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
  app.use("*", (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    const pathname = req.originalUrl.split("?")[0];
    const statusCode = isSpaRoute(req.originalUrl) ? 200 : 404;

    // Inject route-specific meta tags for SEO
    try {
      let html = fs.readFileSync(indexPath, "utf-8");
      html = injectMeta(html, pathname);
      res.status(statusCode).set({ "Content-Type": "text/html" }).send(html);
    } catch {
      res.status(statusCode).sendFile(indexPath);
    }
  });
}
