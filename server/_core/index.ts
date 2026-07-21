import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { storagePut, STORAGE_DIR } from "../storage";
import sensorApiRouter from "../routers/sensorApi";
import { generateInsightHandler } from "../routers/scheduledInsight";
import sitemapRouter from "../routers/sitemap";
import { startInsightScheduler } from "./insightScheduler";

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

async function ensureTables() {
  if (!process.env.DATABASE_URL) return;
  try {
    const { createConnection } = await import("mysql2/promise");
    const conn = await createConnection(process.env.DATABASE_URL);
    console.log("[DB] Ensuring tables exist...");

    // Create tables if not exist (idempotent)
    await conn.execute(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      openId VARCHAR(64) UNIQUE,
      googleId VARCHAR(128) UNIQUE,
      naverId VARCHAR(128) UNIQUE,
      kakaoId VARCHAR(128) UNIQUE,
      name TEXT,
      email VARCHAR(320) UNIQUE,
      passwordHash VARCHAR(256),
      loginMethod VARCHAR(64),
      role ENUM('user','admin','master') NOT NULL DEFAULT 'user',
      department ENUM('design','construction','accounting','management','sales','none') DEFAULT 'none',
      opsRole ENUM('pm','designer','site_manager','accountant','director','staff') DEFAULT 'staff',
      phone VARCHAR(20),
      isActive TINYINT NOT NULL DEFAULT 1,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      lastSignedIn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    // 기존 users 테이블에 소셜 로그인 컬럼이 없으면 추가 (배포된 DB 대응)
    const addColumnIfMissing = async (table: string, column: string, ddl: string) => {
      try {
        const [rows]: any = await conn.execute(
          `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
          [table, column]
        );
        if (rows?.[0]?.c === 0) {
          await conn.execute(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl}`);
          console.log(`[DB] Added column ${table}.${column}`);
        }
      } catch (e: any) {
        console.warn(`[DB] addColumn ${table}.${column} warning:`, e?.message || e);
      }
    };
    await addColumnIfMissing("users", "naverId", "naverId VARCHAR(128) UNIQUE");
    await addColumnIfMissing("users", "kakaoId", "kakaoId VARCHAR(128) UNIQUE");

    await conn.execute(`CREATE TABLE IF NOT EXISTS inquiries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL, company VARCHAR(200), email VARCHAR(320) NOT NULL,
      phone VARCHAR(20), type VARCHAR(50), area VARCHAR(50), message TEXT NOT NULL,
      status ENUM('new','contacted','quoted','closed') NOT NULL DEFAULT 'new',
      notes TEXT, isDeleted TINYINT NOT NULL DEFAULT 0, deletedAt TIMESTAMP NULL, deletedBy VARCHAR(100), deleteReason TEXT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS subscribers (
      id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(320) NOT NULL UNIQUE,
      source VARCHAR(50) DEFAULT 'website', company VARCHAR(200),
      isActive TINYINT NOT NULL DEFAULT 1, isDeleted TINYINT NOT NULL DEFAULT 0,
      deletedAt TIMESTAMP NULL, deletedBy VARCHAR(100), deleteReason TEXT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS estimates (
      id INT AUTO_INCREMENT PRIMARY KEY, spaceType VARCHAR(50), area DECIMAL(10,2),
      grade VARCHAR(50), estimatedCost DECIMAL(15,2), minCost DECIMAL(15,2), maxCost DECIMAL(15,2),
      resultJson JSON, isDeleted TINYINT NOT NULL DEFAULT 0, deletedAt TIMESTAMP NULL, deletedBy VARCHAR(100), deleteReason TEXT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS portfolio_drafts (
      id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(300) NOT NULL, projectName VARCHAR(200),
      category VARCHAR(100), client VARCHAR(200), area VARCHAR(50), location VARCHAR(200),
      duration VARCHAR(100), description TEXT, aiDescription TEXT, challenge TEXT, solution TEXT, \`result\` TEXT,
      tags JSON, sortOrder INT NOT NULL DEFAULT 0,
      status ENUM('draft','review','published','archived') NOT NULL DEFAULT 'draft',
      driveFolder VARCHAR(500), driveFolderId VARCHAR(200),
      publishedAt TIMESTAMP NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS draft_images (
      id INT AUTO_INCREMENT PRIMARY KEY, portfolioId INT NOT NULL, originalUrl TEXT NOT NULL,
      processedUrl TEXT, thumbnailUrl TEXT, beforeUrl TEXT,
      isCover ENUM('yes','no') NOT NULL DEFAULT 'no', sortOrder INT NOT NULL DEFAULT 0,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS insight_articles (
      id INT AUTO_INCREMENT PRIMARY KEY, slug VARCHAR(300) NOT NULL UNIQUE, title VARCHAR(500) NOT NULL,
      summary TEXT, content LONGTEXT, category VARCHAR(100), tags JSON, coverImage TEXT,
      author VARCHAR(200) DEFAULT '고감도', readingTime INT DEFAULT 5,
      status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
      publishedAt TIMESTAMP NULL, viewCount INT NOT NULL DEFAULT 0,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(320) NOT NULL UNIQUE,
      name VARCHAR(200), company VARCHAR(200), source VARCHAR(50) DEFAULT 'website',
      status ENUM('active','unsubscribed','bounced') NOT NULL DEFAULT 'active',
      unsubscribeToken VARCHAR(100) UNIQUE,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS newsletter_campaigns (
      id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(500) NOT NULL, subject VARCHAR(500) NOT NULL,
      content LONGTEXT, segmentId INT, status ENUM('draft','sent','failed') NOT NULL DEFAULT 'draft',
      sentAt TIMESTAMP NULL, recipientCount INT NOT NULL DEFAULT 0,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS site_settings (
      id INT AUTO_INCREMENT PRIMARY KEY, \`key\` VARCHAR(200) NOT NULL UNIQUE, value JSON,
      updatedBy INT, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS announcements (
      id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(300) NOT NULL, content TEXT,
      type ENUM('info','warning','success','error') NOT NULL DEFAULT 'info',
      isActive TINYINT NOT NULL DEFAULT 1, isDeleted TINYINT NOT NULL DEFAULT 0,
      deletedAt TIMESTAMP NULL, deletedBy VARCHAR(100), deleteReason TEXT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    // 사후관리(Post-Occupancy) — schema.ts에는 정의되어 있으나 마이그레이션이 없어 여기서 보장
    await conn.execute(`CREATE TABLE IF NOT EXISTS post_occupancy_surveys (
      id INT AUTO_INCREMENT PRIMARY KEY, clientProjectId INT NOT NULL, opsProjectId INT, surveyInstanceId INT,
      overallSatisfaction INT, designSatisfaction INT, constructionSatisfaction INT,
      communicationSatisfaction INT, timelineSatisfaction INT,
      issuesReported JSON, positiveComments TEXT, improvementSuggestions TEXT, wouldRecommend TINYINT,
      status ENUM('pending','sent','completed','follow_up_needed') NOT NULL DEFAULT 'pending',
      completedAt TIMESTAMP NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_poc_project (clientProjectId)
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS maintenance_visits (
      id INT AUTO_INCREMENT PRIMARY KEY, clientProjectId INT NOT NULL, opsProjectId INT,
      visitType ENUM('fine_tuning','warranty','optimization','inspection') NOT NULL,
      scheduledDate VARCHAR(20) NOT NULL, scheduledTime VARCHAR(10),
      technicianId INT, technicianName VARCHAR(200),
      description TEXT, workPerformed TEXT, issuesFound JSON, photoUrls JSON, clientSignature TEXT,
      status ENUM('scheduled','confirmed','in_progress','completed','cancelled','rescheduled') NOT NULL DEFAULT 'scheduled',
      completedAt TIMESTAMP NULL, clientFeedback TEXT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_mv_project (clientProjectId), INDEX idx_mv_status (status)
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS insight_subscriptions (
      id INT AUTO_INCREMENT PRIMARY KEY, clientProjectId INT NOT NULL, opsProjectId INT, clientUserId INT,
      plan ENUM('basic','standard','premium') NOT NULL DEFAULT 'basic',
      status ENUM('active','paused','cancelled','expired') NOT NULL DEFAULT 'active',
      startDate VARCHAR(20) NOT NULL, endDate VARCHAR(20), nextReportDate VARCHAR(20),
      monthlyFee DECIMAL(10,0), sensorProjectId INT, sensorsInstalled JSON,
      lastReportId INT, totalReports INT DEFAULT 0,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_is_project (clientProjectId)
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS space_optimization_reports (
      id INT AUTO_INCREMENT PRIMARY KEY, subscriptionId INT NOT NULL, clientProjectId INT NOT NULL,
      reportPeriod VARCHAR(50) NOT NULL,
      occupancyAnalysis JSON, environmentAnalysis JSON, trafficAnalysis JSON, optimizationSuggestions JSON,
      summary TEXT, fullReport LONGTEXT,
      status ENUM('generating','ready','sent','reviewed') NOT NULL DEFAULT 'generating',
      sentAt TIMESTAMP NULL, viewedAt TIMESTAMP NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_sor_subscription (subscriptionId)
    )`);

    // 확장 테이블(CRM/OpsX/설문/KPI 등 103개) — schema.ts엔 있으나 그동안 미생성되던 것들
    const { ensureExtendedTables } = await import("./extendedTables");
    await ensureExtendedTables(conn);

    await conn.end();
    console.log("[DB] Tables ensured successfully.");
  } catch (err: any) {
    console.warn("[DB] Table creation warning:", err?.message || "unknown error");
  }
}

async function startServer() {
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
  app.use("/uploads", express.static(STORAGE_DIR, {
    maxAge: "7d",
    fallthrough: true,
  }));

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
    // Run table creation in background after server is up
    ensureTables().catch((err) => console.warn("[DB] Background migration failed:", err));
    // 인사이트 자동 발행 스케줄러 (프로덕션에서만, 화·금 09:00 KST)
    startInsightScheduler();
  });
}

startServer().catch(console.error);
