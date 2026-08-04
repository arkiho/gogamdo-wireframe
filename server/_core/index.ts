import "dotenv/config";
import express from "express";
import { parse as parseCookieHeader } from "cookie";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { storagePut, STORAGE_DIR, validateStorageRuntimeConfiguration } from "../storage";
import sensorApiRouter from "../routers/sensorApi";
import { generateInsightHandler } from "../routers/scheduledInsight";
import sitemapRouter from "../routers/sitemap";
import { getSessionSecretBytes, verifyClientSession } from "./sessionSecurity";
import { createUploadHandler } from "./uploadHandler";
import { createStorageAccessMiddleware } from "./storageAccess";
import { authorizeStorageRead } from "./storageAuthorization";
import { databaseStorageAuthorization } from "./storageAuthorizationDatabase";
import { createReadinessHandler, probeDatabase, probeLocalStorage } from "./readiness";
import { createSchedulerAuthMiddleware } from "./schedulerAuth";
import { sdk } from "./sdk";
import { getClientById } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  getSessionSecretBytes(process.env.JWT_SECRET);
  validateStorageRuntimeConfiguration();

  const app = express();
  const server = createServer(app);

  // Security headers
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  });

  app.get("/healthz", (_req, res) => {
    res.status(200).json({ status: "alive" });
  });

  app.get("/readyz", createReadinessHandler({
    database: () => probeDatabase(process.env.DATABASE_URL),
    storage: () => probeLocalStorage(STORAGE_DIR),
    timeoutMs: 3_000,
  }));

  const authenticateApplicationRequest = async (req: express.Request) => {
    try {
      const user = await sdk.authenticateRequest(req);
      return { kind: "staff" as const, id: user.id };
    } catch {
      const cookies = parseCookieHeader(req.headers.cookie || "");
      const token = cookies.client_token;
      if (!token) throw new Error("Authentication required");
      const claims = await verifyClientSession(token);
      const client = await getClientById(claims.clientId);
      if (!client || client.status !== "active") {
        throw new Error("Active client session required");
      }
      return { kind: "client" as const, id: client.id };
    }
  };

  const uploadHandler = createUploadHandler({
    authenticate: authenticateApplicationRequest,
    put: storagePut,
  });

  app.post("/api/upload", express.json({ limit: "14mb" }), uploadHandler);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);


  // Email verification endpoint (GET for link clicks)
  app.get("/api/verify-email", async (req, res) => {
    const token = req.query.token as string;
    if (!token) {
      return res.status(400).send(`<html><body style="font-family:sans-serif;text-align:center;padding:60px">
        <h2>❌ 인증 토큰이 없습니다</h2>
        <p>유효한 인증 링크를 사용해주세요.</p></body></html>`);
    }
    try {
      const { activatePendingClientByVerificationToken } = await import("./clientVerification");
      if (!await activatePendingClientByVerificationToken(token)) {
        return res.status(400).send(`<html><body style="font-family:sans-serif;text-align:center;padding:60px">
          <h2>❌ 유효하지 않거나 만료된 인증 토큰입니다</h2>
          <p>회원가입 페이지에서 인증 메일을 재발송해주세요.</p>
          <a href="/client/login" style="color:#B8860B">로그인 페이지로 이동</a></body></html>`);
      }
      return res.send(`<html><body style="font-family:sans-serif;text-align:center;padding:60px">
        <h2>✅ 이메일 인증이 완료되었습니다!</h2>
        <p>이제 로그인하실 수 있습니다.</p>
        <a href="/client/login" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#B8860B;color:#fff;text-decoration:none;border-radius:4px">로그인 하기</a></body></html>`);
    } catch (err: any) {
      return res.status(500).send(`<html><body style="font-family:sans-serif;text-align:center;padding:60px">
        <h2>❌ 오류가 발생했습니다</h2>
        <p>잠시 후 다시 시도해주세요.</p></body></html>`);
    }
  });

  // OG Image placeholder (replace with actual branded image later)
  app.get("/og-image.jpg", (_req, res) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <rect width="1200" height="630" fill="#1a1a2e"/>
      <text x="600" y="280" font-family="sans-serif" font-size="72" font-weight="bold" fill="#C8A96E" text-anchor="middle">KOKAMDO</text>
      <text x="600" y="350" font-family="sans-serif" font-size="28" fill="#ffffff" text-anchor="middle">고감도 — 사무실 인테리어 설계·시공 전문기업</text>
      <text x="600" y="400" font-family="sans-serif" font-size="20" fill="#999999" text-anchor="middle">공간이 달라지면 일하는 방식이 달라집니다</text>
    </svg>`;
    res.set("Content-Type", "image/svg+xml");
    res.set("Cache-Control", "public, max-age=86400");
    res.send(svg);
  });

  // Dynamic sitemap.xml and robots.txt
  // 로컬 디스크(Railway 볼륨)에 저장된 업로드 이미지 정적 서빙
  app.use("/uploads", createStorageAccessMiddleware({
    authenticate: authenticateApplicationRequest,
    authorize: (key, subject) => authorizeStorageRead(key, subject, databaseStorageAuthorization),
  }), express.static(STORAGE_DIR, {
    maxAge: 0,
    fallthrough: true,
  }));

  app.use(sitemapRouter);

  // Scheduled cron callbacks (must be before tRPC middleware)
  app.post(
    "/api/scheduled/generateInsight",
    createSchedulerAuthMiddleware(() => process.env.SCHEDULER_SECRET),
    generateInsightHandler,
  );

  // Sensor hardware API (REST, API-key auth)
  app.use("/api/sensor", sensorApiRouter);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(error => {
  console.error("[Startup] Fatal error:", error);
  process.exitCode = 1;
});
