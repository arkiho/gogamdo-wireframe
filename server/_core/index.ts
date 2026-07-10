import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { storagePut } from "../storage";
import sensorApiRouter from "../routers/sensorApi";
import { generateInsightHandler } from "../routers/scheduledInsight";
import sitemapRouter from "../routers/sitemap";

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
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // File upload endpoint for portfolio images
  app.post("/api/upload", async (req, res) => {
    try {
      const contentType = req.headers["content-type"] || "";
      if (!contentType.startsWith("multipart/form-data") && !contentType.startsWith("application/octet-stream")) {
        // Handle base64 JSON upload
        const { data, filename, mimeType } = req.body;
        if (!data || !filename) {
          return res.status(400).json({ error: "Missing data or filename" });
        }
        const buffer = Buffer.from(data, "base64");
        const key = `portfolio/${Date.now()}-${filename}`;
        const result = await storagePut(key, buffer, mimeType || "image/jpeg");
        return res.json({ url: result.url, key: result.key });
      }
      // For multipart, collect raw body
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", async () => {
        const body = Buffer.concat(chunks);
        const key = `portfolio/${Date.now()}-upload.jpg`;
        const result = await storagePut(key, body, "image/jpeg");
        res.json({ url: result.url, key: result.key });
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      res.status(500).json({ error: err.message || "Upload failed" });
    }
  });
  // Email verification endpoint (GET for link clicks)
  app.get("/api/verify-email", async (req, res) => {
    const token = req.query.token as string;
    if (!token) {
      return res.status(400).send(`<html><body style="font-family:sans-serif;text-align:center;padding:60px">
        <h2>❌ 인증 토큰이 없습니다</h2>
        <p>유효한 인증 링크를 사용해주세요.</p></body></html>`);
    }
    try {
      const { getClientByVerifyToken, updateClient } = await import("../db");
      const client = await getClientByVerifyToken(token);
      if (!client || !client.emailVerifyExpires || client.emailVerifyExpires < new Date()) {
        return res.status(400).send(`<html><body style="font-family:sans-serif;text-align:center;padding:60px">
          <h2>❌ 유효하지 않거나 만료된 인증 토큰입니다</h2>
          <p>회원가입 페이지에서 인증 메일을 재발송해주세요.</p>
          <a href="/client/login" style="color:#B8860B">로그인 페이지로 이동</a></body></html>`);
      }
      await updateClient(client.id, {
        emailVerified: "yes",
        emailVerifyToken: null,
        emailVerifyExpires: null,
        status: "active",
      });
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

  // Dynamic sitemap.xml and robots.txt
  app.use(sitemapRouter);

  // Scheduled cron callbacks (must be before tRPC middleware)
  app.post("/api/scheduled/generateInsight", generateInsightHandler);

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

startServer().catch(console.error);
