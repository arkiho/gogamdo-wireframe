import "dotenv/config";
import type { Connection } from "mysql2/promise";
import { COLUMN_PATCH_MIGRATION_PAYLOAD, ensureColumnPatches } from "../_core/columnPatches";
import { ensureExtendedTables, EXTENDED_TABLE_MIGRATION_PAYLOAD } from "../_core/extendedTables";
import { BASELINE_VERIFICATION_PAYLOAD, verifyLegacyBaselineSchema } from "./baselineVerification";
import { applyLegacyDataMigration, LEGACY_DATA_MIGRATION_PAYLOAD, migrationTestFailpoint, preflightLegacyDataMigration } from "./legacyDataMigration";
import {
  applyMigrations,
  checksumMigrationSources,
  withMigrationLock,
  type VersionedMigration,
} from "./versionedMigrations";

async function applyLegacyBaseline(conn: Connection): Promise<void> {
    await preflightLegacyDataMigration(conn);
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
      } catch (error: any) {
        throw new Error(
          `[DB] Failed to add ${table}.${column}: ${error?.code ?? error?.message ?? "unknown error"}`,
          { cause: error },
        );
      }
    };
    // 직원 마이페이지 (E-13): 유선연락처·프로필사진·알림설정
    // 고객 마이페이지(E-13) + 소셜 로그인(F-16): clients_auth 확장
    // 4팀 조직 구조 (STAFF_UI): 대표자/경영지원/공사팀/설계팀
    // 지출결의서 세무유형·계산결과·지급일정·공정태깅 (STAFF_UI 3)
    // 내부지출·반려사유 (STAFF_UI 3-1)
    // 공정별 실행예산 (STAFF_UI 6)
    // 고객 수금 일정 (계약금·기성·잔금) — 결제·경비 현황 (C-7)
    // 거래처 첨부(통장사본·사업자등록증) + 현장별 평가
    await conn.execute(`CREATE TABLE IF NOT EXISTS ops_vendor_evaluations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      vendorId INT NOT NULL, projectId INT NOT NULL, evaluatorId INT, evaluatorName VARCHAR(100),
      quality INT NOT NULL, schedule INT NOT NULL, communication INT NOT NULL, price INT NOT NULL, reliability INT NOT NULL,
      totalScore INT NOT NULL, comment TEXT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_ve_vendor (vendorId), INDEX idx_ve_project (projectId)
    )`);
    // 유심 LTE 카메라 뷰어/회선 정보 (STAFF_UI 7)

    await conn.execute(`CREATE TABLE IF NOT EXISTS inquiries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL, company VARCHAR(200), email VARCHAR(320) NOT NULL,
      phone VARCHAR(30), type VARCHAR(50), area VARCHAR(50), message TEXT NOT NULL,
      status ENUM('new','contacted','in_progress','completed') NOT NULL DEFAULT 'new',
      notes TEXT, isDeleted TINYINT NOT NULL DEFAULT 0, deletedAt TIMESTAMP NULL, deletedBy VARCHAR(100), deleteReason TEXT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
    // 문의 유입경로 (AEO 귀속) — C-10
    // 인사이트 콘텐츠 큐 (발행 주제 캘린더) — D-11
    await conn.execute(`CREATE TABLE IF NOT EXISTS insight_content_queue (
      id INT AUTO_INCREMENT PRIMARY KEY,
      scheduledDate VARCHAR(20) NOT NULL,
      category ENUM('trend','cost_guide','case_study','tip','news') NOT NULL DEFAULT 'trend',
      title VARCHAR(300) NOT NULL,
      keywords JSON, sources TEXT,
      status ENUM('planned','generating','published','skipped') NOT NULL DEFAULT 'planned',
      generatedArticleId INT, createdBy INT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_queue_date (scheduledDate), INDEX idx_queue_status (status)
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS subscribers (
      id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(320) NOT NULL UNIQUE,
      source VARCHAR(50) DEFAULT 'website', company VARCHAR(200),
      isActive TINYINT NOT NULL DEFAULT 1, isDeleted TINYINT NOT NULL DEFAULT 0,
      deletedAt TIMESTAMP NULL, deletedBy VARCHAR(100), deleteReason TEXT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS estimates (
      id INT AUTO_INCREMENT PRIMARY KEY, spaceType VARCHAR(50), area INT,
 grade VARCHAR(30), estimatedCost DECIMAL(15,2), minCost DECIMAL(15,2), maxCost DECIMAL(15,2),
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
      id INT AUTO_INCREMENT PRIMARY KEY, draftId INT NOT NULL, originalUrl TEXT NOT NULL,
      beforeUrl TEXT, processedUrl TEXT, watermarkedUrl TEXT, thumbnailUrl TEXT,
      filename VARCHAR(300), driveFileId VARCHAR(200),
      aiProcessed ENUM('yes','no') NOT NULL DEFAULT 'no',
      processingStatus ENUM('pending','processing','done','error') NOT NULL DEFAULT 'pending',
      sortOrder INT DEFAULT 0, isCover ENUM('yes','no') NOT NULL DEFAULT 'no', caption TEXT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS insight_articles (
      id INT AUTO_INCREMENT PRIMARY KEY, slug VARCHAR(200) NOT NULL UNIQUE, title VARCHAR(500) NOT NULL,
      subtitle VARCHAR(500), category ENUM('trend','cost_guide','case_study','tip','news') NOT NULL,
      excerpt TEXT NOT NULL, content TEXT NOT NULL, coverImageUrl TEXT,
      author VARCHAR(100) DEFAULT '고감도 편집팀', readTimeMinutes INT DEFAULT 5, tags JSON,
      metaTitle VARCHAR(200), metaDescription TEXT,
      isAiGenerated TINYINT(1) DEFAULT 0, featured TINYINT(1) DEFAULT 0,
      status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
      publishedAt TIMESTAMP NULL, viewCount INT DEFAULT 0,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(320) NOT NULL UNIQUE,
      name VARCHAR(100), company VARCHAR(200),
      status ENUM('active','unsubscribed','bounced') NOT NULL DEFAULT 'active',
      unsubscribeToken VARCHAR(64) NOT NULL UNIQUE,
      source ENUM('website','contact_form','manual','lead_magnet','estimator','portfolio','insight','ai_chat','style_quiz'),
      subscribedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, unsubscribedAt TIMESTAMP NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS newsletter_campaigns (
      id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(500) NOT NULL, subject VARCHAR(500) NOT NULL,
      content LONGTEXT, segmentId INT, status ENUM('draft','scheduled','sending','sent','failed') NOT NULL DEFAULT 'draft',
      sentAt TIMESTAMP NULL, recipientCount INT DEFAULT 0,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS site_settings (
      id INT AUTO_INCREMENT PRIMARY KEY, \`key\` VARCHAR(100) NOT NULL UNIQUE,
      value TEXT NOT NULL, description VARCHAR(500),
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS announcements (
      id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(200) NOT NULL, content TEXT,
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

    // 거래처 계좌 등록부 (STAFF_UI 4)
    await conn.execute(`CREATE TABLE IF NOT EXISTS ops_vendors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      category VARCHAR(100),
      businessNumber VARCHAR(20),
      bankName VARCHAR(100),
      accountHolder VARCHAR(100),
      accountNumber VARCHAR(50),
      contactName VARCHAR(100),
      contactPhone VARCHAR(30),
      notes TEXT,
      isActive TINYINT NOT NULL DEFAULT 1,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_vendor_name (name)
    )`);

    // Extended tables (103): historical startup DDL extracted to this one-shot migration.
    await ensureExtendedTables(conn);
    migrationTestFailpoint("after-create");

    // 모든 121개 테이블 생성 이후 legacy 컬럼 패치 적용
    await addColumnIfMissing("users", "naverId", "naverId VARCHAR(128) UNIQUE");
    await addColumnIfMissing("users", "kakaoId", "kakaoId VARCHAR(128) UNIQUE");
    await addColumnIfMissing("users", "landline", "landline VARCHAR(20) NULL");
    await addColumnIfMissing("users", "avatarUrl", "avatarUrl TEXT NULL");
    await addColumnIfMissing("users", "notifPrefs", "notifPrefs JSON NULL");
    await addColumnIfMissing("clients_auth", "landline", "landline VARCHAR(20) NULL");
    await addColumnIfMissing("clients_auth", "avatarUrl", "avatarUrl TEXT NULL");
    await addColumnIfMissing("clients_auth", "notifPrefs", "notifPrefs JSON NULL");
    await addColumnIfMissing("clients_auth", "googleId", "googleId VARCHAR(128) NULL");
    await addColumnIfMissing("clients_auth", "naverId", "naverId VARCHAR(128) NULL");
    await addColumnIfMissing("clients_auth", "kakaoId", "kakaoId VARCHAR(128) NULL");
    await addColumnIfMissing("clients_auth", "loginMethod", "loginMethod VARCHAR(64) NULL");
    await addColumnIfMissing("users", "team", "team ENUM('executive','management','construction','design') NULL");
    await addColumnIfMissing("ops_expenses", "expenseType", "expenseType ENUM('tax_invoice','withholding','withholding_expense','daily_worker') NULL");
    await addColumnIfMissing("ops_expenses", "taxDetail", "taxDetail JSON NULL");
    await addColumnIfMissing("ops_expenses", "paymentSchedule", "paymentSchedule JSON NULL");
    await addColumnIfMissing("ops_expenses", "scheduleItemId", "scheduleItemId INT NULL");
    await addColumnIfMissing("ops_expenses", "isInternal", "isInternal TINYINT DEFAULT 0");
    await addColumnIfMissing("ops_expenses", "rejectionReason", "rejectionReason TEXT NULL");
    await addColumnIfMissing("ops_schedule_items", "budgetAmount", "budgetAmount DECIMAL(15,0) NULL");
    await addColumnIfMissing("ops_projects", "billingSchedule", "billingSchedule JSON NULL");
    await addColumnIfMissing("ops_vendors", "bankbookUrl", "bankbookUrl TEXT NULL");
    await addColumnIfMissing("ops_vendors", "businessCertUrl", "businessCertUrl TEXT NULL");
    await addColumnIfMissing("ops_cameras", "viewerUrl", "viewerUrl TEXT NULL");
    await addColumnIfMissing("ops_cameras", "simInfo", "simInfo VARCHAR(200) NULL");
    await addColumnIfMissing("ops_cameras", "notes", "notes TEXT NULL");
    await addColumnIfMissing("inquiries", "referralSource", "referralSource VARCHAR(50) NULL");

    // 기존 테이블 컬럼 드리프트 보정 (announcements 등 옛 DDL과 schema.ts 불일치)
    await ensureColumnPatches(conn);
    migrationTestFailpoint("after-add-column");
    await applyLegacyDataMigration(conn);

    console.log("[DB] Tables ensured successfully.");
}

const migrations: VersionedMigration[] = [
  {
    id: "20260730_001_legacy_baseline",
    checksum: checksumMigrationSources([
      applyLegacyBaseline,
      ensureExtendedTables,
      EXTENDED_TABLE_MIGRATION_PAYLOAD,
      ensureColumnPatches,
      COLUMN_PATCH_MIGRATION_PAYLOAD,
      LEGACY_DATA_MIGRATION_PAYLOAD,
      BASELINE_VERIFICATION_PAYLOAD,
    ]),
    up: applyLegacyBaseline,
    verify: verifyLegacyBaselineSchema,
  },
];

export async function runMigrations(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for migrations");
  }

  const { createConnection } = await import("mysql2/promise");
  const conn = await createConnection(databaseUrl);
  try {
    await withMigrationLock(conn, () => applyMigrations(conn, migrations));
  } finally {
    await conn.end();
  }
}
