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

// Known SPA routes that should serve index.html with 200
const SPA_ROUTES = new Set([
  "/", "/about", "/solutions", "/portfolio", "/contact",
  "/estimator", "/insights", "/resources", "/faq",
  "/how-we-work", "/opsx", "/ai-chat", "/ai-style", "/ai-redesign",
  "/privacy", "/terms", "/portal", "/my", "/404", "/offline",
  "/client/login", "/client/register", "/client/verify-email",
  "/client/forgot-password", "/client/reset-password",
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
    if (isSpaRoute(req.originalUrl)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).sendFile(indexPath);
    }
  });
}
