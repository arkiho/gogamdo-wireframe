import type { Connection } from "mysql2/promise";

async function getColumns(connection: Connection, table: string): Promise<Set<string>> {
  const [rows] = await connection.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table],
  );
  return new Set((rows as Array<{ COLUMN_NAME: string }>).map(row => row.COLUMN_NAME));
}

async function addColumn(
  connection: Connection,
  table: string,
  columns: Set<string>,
  column: string,
  definition: string,
): Promise<void> {
  if (columns.has(column)) return;
  await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  columns.add(column);
}

async function scalarCount(connection: Connection, sql: string): Promise<number> {
  const [rows] = await connection.query(sql);
  return Number((rows as Array<{ count: number }>)[0]?.count ?? 0);
}

async function assertNoRows(connection: Connection, label: string, sql: string): Promise<void> {
  const count = await scalarCount(connection, sql);
  if (count !== 0) throw new Error(`[DB] ${label}: ${count} row(s)`);
}

async function hasSingleColumnUnique(
  connection: Connection,
  table: string,
  column: string,
): Promise<boolean> {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count FROM (
       SELECT INDEX_NAME
         FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
          AND NON_UNIQUE = 0 AND INDEX_NAME <> 'PRIMARY'
        GROUP BY INDEX_NAME
       HAVING COUNT(*) = 1 AND MAX(COLUMN_NAME) = ? AND MAX(SUB_PART) IS NULL
     ) AS unique_indexes`,
    [table, column],
  );
  return Number((rows as Array<{ count: number }>)[0]?.count ?? 0) > 0;
}

export function migrationTestFailpoint(name: string): void {
  if (
    process.env.NODE_ENV === "test" &&
    process.env.ALLOW_MIGRATION_TEST_FAILPOINTS === "true" &&
    process.env.MIGRATION_TEST_FAILPOINT === name
  ) {
    throw new Error(`[DB] Injected migration test failure: ${name}`);
  }
}

export async function preflightLegacyDataMigration(connection: Connection): Promise<void> {
  const inquiryColumns = await getColumns(connection, "inquiries");
  if (inquiryColumns.has("status")) {
    await assertNoRows(connection, "unsupported inquiries.status value", "SELECT COUNT(*) AS count FROM `inquiries` WHERE `status` NOT IN ('new','contacted','quoted','closed','in_progress','completed') OR `status` IS NULL");
  }

  const estimateColumns = await getColumns(connection, "estimates");
  for (const column of ["minCost", "maxCost"] as const) {
    if (estimateColumns.has(column)) {
      await assertNoRows(connection, `${column} cannot be represented as INT`, `SELECT COUNT(*) AS count FROM \`estimates\` WHERE \`${column}\` IS NOT NULL AND (\`${column}\` <> ROUND(\`${column}\`) OR \`${column}\` < -2147483648 OR \`${column}\` > 2147483647)`);
    }
  }
  if (estimateColumns.has("area")) {
    await assertNoRows(connection, "estimates.area cannot be represented as INT", "SELECT COUNT(*) AS count FROM `estimates` WHERE `area` IS NOT NULL AND (`area` <> ROUND(`area`) OR `area` < -2147483648 OR `area` > 2147483647)");
  }

  const insightColumns = await getColumns(connection, "insight_articles");
  if (insightColumns.has("content")) {
    await assertNoRows(connection, "insight content exceeds TEXT capacity", "SELECT COUNT(*) AS count FROM `insight_articles` WHERE OCTET_LENGTH(`content`) > 65535");
  }

  const newsletterColumns = await getColumns(connection, "newsletter_subscribers");
  if (newsletterColumns.has("name")) await assertNoRows(connection, "newsletter subscriber name exceeds 100 characters", "SELECT COUNT(*) AS count FROM `newsletter_subscribers` WHERE CHAR_LENGTH(`name`) > 100");
  if (newsletterColumns.has("unsubscribeToken")) {
    await assertNoRows(connection, "newsletter unsubscribe token exceeds 64 characters", "SELECT COUNT(*) AS count FROM `newsletter_subscribers` WHERE CHAR_LENGTH(`unsubscribeToken`) > 64");
    await assertNoRows(connection, "duplicate newsletter unsubscribe token", "SELECT COUNT(*) AS count FROM (SELECT `unsubscribeToken` FROM `newsletter_subscribers` WHERE `unsubscribeToken` IS NOT NULL GROUP BY `unsubscribeToken` HAVING COUNT(*) > 1) AS duplicate_tokens");
  }
  if (newsletterColumns.has("source")) await assertNoRows(connection, "unsupported newsletter source", "SELECT COUNT(*) AS count FROM `newsletter_subscribers` WHERE `source` IS NOT NULL AND `source` NOT IN ('website','contact_form','manual','lead_magnet','estimator','portfolio','insight','ai_chat','style_quiz')");

  const campaignColumns = await getColumns(connection, "newsletter_campaigns");
  if (campaignColumns.has("content")) await assertNoRows(connection, "newsletter campaign content exceeds TEXT capacity", "SELECT COUNT(*) AS count FROM `newsletter_campaigns` WHERE OCTET_LENGTH(`content`) > 65535");

  const settingColumns = await getColumns(connection, "site_settings");
  if (settingColumns.has("key")) await assertNoRows(connection, "site setting key exceeds 100 characters", "SELECT COUNT(*) AS count FROM `site_settings` WHERE CHAR_LENGTH(`key`) > 100");
  if (settingColumns.has("value")) await assertNoRows(connection, "site setting value contains NULL", "SELECT COUNT(*) AS count FROM `site_settings` WHERE `value` IS NULL");
}

export async function applyLegacyDataMigration(connection: Connection): Promise<void> {
  const inquiryColumns = await getColumns(connection, "inquiries");
  if (inquiryColumns.has("status")) {
    if (await scalarCount(
      connection,
      "SELECT COUNT(*) AS count FROM `inquiries` WHERE `status` NOT IN ('new','contacted','quoted','closed','in_progress','completed') OR `status` IS NULL",
    )) {
      throw new Error("[DB] Unsupported inquiries.status value; migration aborted before ALTER");
    }
    await connection.query(
      "ALTER TABLE `inquiries` MODIFY COLUMN `status` ENUM('new','contacted','quoted','closed','in_progress','completed') NOT NULL DEFAULT 'new'",
    );
    await connection.query("UPDATE `inquiries` SET `status` = 'in_progress' WHERE `status` = 'quoted'");
    await connection.query("UPDATE `inquiries` SET `status` = 'completed' WHERE `status` = 'closed'");
    await connection.query(
      "ALTER TABLE `inquiries` MODIFY COLUMN `status` ENUM('new','contacted','in_progress','completed') NOT NULL DEFAULT 'new'",
    );
  }

  const announcementColumns = await getColumns(connection, "announcements");
  if (announcementColumns.has("content") && announcementColumns.has("message")) {
    await connection.query(
      "UPDATE `announcements` SET `message` = `content` WHERE (`message` IS NULL OR `message` = '') AND `content` IS NOT NULL",
    );
  }
  if (announcementColumns.has("isActive") && announcementColumns.has("active")) {
    await connection.query(
      "UPDATE `announcements` SET `active` = IF(`isActive` = 1, 'yes', 'no')",
    );
  }
  if (announcementColumns.has("message")) {
    await connection.query("UPDATE `announcements` SET `message` = '' WHERE `message` IS NULL");
    await connection.query("ALTER TABLE `announcements` MODIFY COLUMN `message` TEXT NOT NULL");
  }

  const subscriberColumns = await getColumns(connection, "subscribers");
  if (subscriberColumns.has("isActive") && subscriberColumns.has("active")) {
    await connection.query("UPDATE `subscribers` SET `active` = IF(`isActive` = 1, 'yes', 'no')");
  }

  const estimateColumns = await getColumns(connection, "estimates");
  if (estimateColumns.has("minCost") || estimateColumns.has("maxCost")) {
    const rangePredicates = [
      estimateColumns.has("minCost") ? "`minCost` < -2147483648 OR `minCost` > 2147483647" : "FALSE",
      estimateColumns.has("maxCost") ? "`maxCost` < -2147483648 OR `maxCost` > 2147483647" : "FALSE",
    ];
    if (await scalarCount(
      connection,
      `SELECT COUNT(*) AS count FROM \`estimates\` WHERE (${rangePredicates.join(") OR (")})`,
    )) {
      throw new Error("[DB] Estimate amount exceeds INT range; migration aborted before backfill");
    }
  }
  if (estimateColumns.has("minCost") && estimateColumns.has("totalMin")) {
    await connection.query("UPDATE `estimates` SET `totalMin` = ROUND(`minCost`) WHERE `totalMin` IS NULL AND `minCost` IS NOT NULL");
  }
  if (estimateColumns.has("maxCost") && estimateColumns.has("totalMax")) {
    await connection.query("UPDATE `estimates` SET `totalMax` = ROUND(`maxCost`) WHERE `totalMax` IS NULL AND `maxCost` IS NOT NULL");
  }
  migrationTestFailpoint("after-backfill");

  const draftColumns = await getColumns(connection, "draft_images");
  await addColumn(connection, "draft_images", draftColumns, "draftId", "INT NULL");
  await addColumn(connection, "draft_images", draftColumns, "watermarkedUrl", "TEXT NULL");
  await addColumn(connection, "draft_images", draftColumns, "filename", "VARCHAR(300) NULL");
  await addColumn(connection, "draft_images", draftColumns, "driveFileId", "VARCHAR(200) NULL");
  await addColumn(connection, "draft_images", draftColumns, "aiProcessed", "ENUM('yes','no') NOT NULL DEFAULT 'no'");
  await addColumn(connection, "draft_images", draftColumns, "processingStatus", "ENUM('pending','processing','done','error') NOT NULL DEFAULT 'pending'");
  await addColumn(connection, "draft_images", draftColumns, "caption", "TEXT NULL");
  await addColumn(connection, "draft_images", draftColumns, "updatedAt", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
  if (draftColumns.has("portfolioId")) {
    await connection.query("UPDATE `draft_images` SET `draftId` = `portfolioId` WHERE `draftId` IS NULL");
  }
  if (await scalarCount(connection, "SELECT COUNT(*) AS count FROM `draft_images` WHERE `draftId` IS NULL")) {
    throw new Error("[DB] Cannot backfill draft_images.draftId");
  }
  await connection.query("ALTER TABLE `draft_images` MODIFY COLUMN `draftId` INT NOT NULL");

  const insightColumns = await getColumns(connection, "insight_articles");
  await addColumn(connection, "insight_articles", insightColumns, "subtitle", "VARCHAR(500) NULL");
  await addColumn(connection, "insight_articles", insightColumns, "excerpt", "TEXT NULL");
  await addColumn(connection, "insight_articles", insightColumns, "coverImageUrl", "TEXT NULL");
  await addColumn(connection, "insight_articles", insightColumns, "readTimeMinutes", "INT DEFAULT 5");
  await addColumn(connection, "insight_articles", insightColumns, "metaTitle", "VARCHAR(200) NULL");
  await addColumn(connection, "insight_articles", insightColumns, "metaDescription", "TEXT NULL");
  await addColumn(connection, "insight_articles", insightColumns, "isAiGenerated", "TINYINT(1) DEFAULT 0");
  await addColumn(connection, "insight_articles", insightColumns, "featured", "TINYINT(1) DEFAULT 0");
  if (insightColumns.has("summary")) {
    await connection.query("UPDATE `insight_articles` SET `excerpt` = `summary` WHERE `excerpt` IS NULL AND `summary` IS NOT NULL");
  }
  if (insightColumns.has("coverImage")) {
    await connection.query("UPDATE `insight_articles` SET `coverImageUrl` = `coverImage` WHERE `coverImageUrl` IS NULL AND `coverImage` IS NOT NULL");
  }
  if (insightColumns.has("readingTime")) {
    await connection.query("UPDATE `insight_articles` SET `readTimeMinutes` = `readingTime` WHERE `readingTime` IS NOT NULL");
  }
  await connection.query("UPDATE `insight_articles` SET `excerpt` = '' WHERE `excerpt` IS NULL");
  await connection.query("UPDATE `insight_articles` SET `content` = '' WHERE `content` IS NULL");
  if (await scalarCount(connection, "SELECT COUNT(*) AS count FROM `insight_articles` WHERE `category` NOT IN ('trend','cost_guide','case_study','tip','news') OR `category` IS NULL")) {
    throw new Error("[DB] Cannot safely map insight_articles.category");
  }
  if (await scalarCount(connection, "SELECT COUNT(*) AS count FROM `insight_articles` WHERE CHAR_LENGTH(`slug`) > 200")) {
    throw new Error("[DB] Cannot safely shrink insight_articles.slug");
  }
  await connection.query("ALTER TABLE `insight_articles` MODIFY COLUMN `slug` VARCHAR(200) NOT NULL");
  await connection.query("ALTER TABLE `insight_articles` MODIFY COLUMN `category` ENUM('trend','cost_guide','case_study','tip','news') NOT NULL");
  await connection.query("ALTER TABLE `insight_articles` MODIFY COLUMN `excerpt` TEXT NOT NULL");
  await connection.query("ALTER TABLE `insight_articles` MODIFY COLUMN `content` TEXT NOT NULL");

  await addColumn(connection, "inquiries", inquiryColumns, "company", "VARCHAR(200) NULL");
  await addColumn(connection, "inquiries", inquiryColumns, "type", "VARCHAR(50) NULL");
  await addColumn(connection, "inquiries", inquiryColumns, "area", "VARCHAR(50) NULL");

  const portfolioColumns = await getColumns(connection, "portfolio_drafts");
  const portfolioPatches: Array<[string, string]> = [
    ["projectName", "VARCHAR(200) NULL"], ["category", "VARCHAR(100) NULL"],
    ["client", "VARCHAR(200) NULL"], ["area", "VARCHAR(50) NULL"],
    ["location", "VARCHAR(200) NULL"], ["duration", "VARCHAR(100) NULL"],
    ["description", "TEXT NULL"], ["aiDescription", "TEXT NULL"],
    ["challenge", "TEXT NULL"], ["solution", "TEXT NULL"], ["result", "TEXT NULL"],
    ["tags", "JSON NULL"], ["sortOrder", "INT NOT NULL DEFAULT 0"],
    ["driveFolder", "VARCHAR(500) NULL"], ["driveFolderId", "VARCHAR(200) NULL"],
    ["publishedAt", "TIMESTAMP NULL"],
    ["createdAt", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"],
    ["updatedAt", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"],
  ];
  for (const [column, definition] of portfolioPatches) {
    await addColumn(connection, "portfolio_drafts", portfolioColumns, column, definition);
  }

  await assertNoRows(connection, "announcements.title exceeds 200 characters", "SELECT COUNT(*) AS count FROM `announcements` WHERE CHAR_LENGTH(`title`) > 200");
  await assertNoRows(connection, "announcements timestamps contain NULL", "SELECT COUNT(*) AS count FROM `announcements` WHERE `createdAt` IS NULL OR `updatedAt` IS NULL");
  await assertNoRows(connection, "draft_images canonical non-null columns contain NULL", "SELECT COUNT(*) AS count FROM `draft_images` WHERE `isCover` IS NULL OR `createdAt` IS NULL");
  await assertNoRows(connection, "estimates.area cannot be represented as INT", "SELECT COUNT(*) AS count FROM `estimates` WHERE `area` IS NOT NULL AND (`area` <> ROUND(`area`) OR `area` < -2147483648 OR `area` > 2147483647)");
  await assertNoRows(connection, "estimates.grade exceeds 30 characters", "SELECT COUNT(*) AS count FROM `estimates` WHERE CHAR_LENGTH(`grade`) > 30");
  await assertNoRows(connection, "estimates.createdAt contains NULL", "SELECT COUNT(*) AS count FROM `estimates` WHERE `createdAt` IS NULL");
  await assertNoRows(connection, "inquiries.phone exceeds 30 characters", "SELECT COUNT(*) AS count FROM `inquiries` WHERE CHAR_LENGTH(`phone`) > 30");
  await assertNoRows(connection, "inquiries timestamps contain NULL", "SELECT COUNT(*) AS count FROM `inquiries` WHERE `createdAt` IS NULL OR `updatedAt` IS NULL");
  await assertNoRows(connection, "insight author exceeds 100 characters", "SELECT COUNT(*) AS count FROM `insight_articles` WHERE CHAR_LENGTH(`author`) > 100");
  await assertNoRows(connection, "insight canonical non-null columns contain NULL", "SELECT COUNT(*) AS count FROM `insight_articles` WHERE `status` IS NULL OR `createdAt` IS NULL OR `updatedAt` IS NULL");
  await assertNoRows(connection, "portfolio status contains NULL", "SELECT COUNT(*) AS count FROM `portfolio_drafts` WHERE `status` IS NULL");
  await assertNoRows(connection, "subscriber timestamps contain NULL", "SELECT COUNT(*) AS count FROM `subscribers` WHERE `createdAt` IS NULL OR `updatedAt` IS NULL");

  const newsletterColumns = await getColumns(connection, "newsletter_subscribers");
  await addColumn(connection, "newsletter_subscribers", newsletterColumns, "subscribedAt", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
  await addColumn(connection, "newsletter_subscribers", newsletterColumns, "unsubscribedAt", "TIMESTAMP NULL");
  if (newsletterColumns.has("unsubscribeToken")) {
    await connection.query("UPDATE `newsletter_subscribers` SET `unsubscribeToken` = LOWER(HEX(RANDOM_BYTES(32))) WHERE `unsubscribeToken` IS NULL OR `unsubscribeToken` = ''");
    await connection.query("ALTER TABLE `newsletter_subscribers` MODIFY COLUMN `unsubscribeToken` VARCHAR(64) NOT NULL");
    if (!await hasSingleColumnUnique(connection, "newsletter_subscribers", "unsubscribeToken")) {
      await connection.query("ALTER TABLE `newsletter_subscribers` ADD UNIQUE INDEX `newsletter_subscribers_unsubscribeToken_unique` (`unsubscribeToken`)");
    }
  }
  if (newsletterColumns.has("name")) await connection.query("ALTER TABLE `newsletter_subscribers` MODIFY COLUMN `name` VARCHAR(100) NULL");
  if (newsletterColumns.has("source")) await connection.query("ALTER TABLE `newsletter_subscribers` MODIFY COLUMN `source` ENUM('website','contact_form','manual','lead_magnet','estimator','portfolio','insight','ai_chat','style_quiz') NULL DEFAULT 'website'");

  const campaignColumns = await getColumns(connection, "newsletter_campaigns");
  const campaignPatches: Array<[string, string]> = [
    ["previewText", "VARCHAR(300) NULL"], ["articleIds", "JSON NULL"],
    ["customContent", "TEXT NULL"], ["htmlContent", "TEXT NULL"],
    ["scheduledAt", "TIMESTAMP NULL"], ["openCount", "INT NULL DEFAULT 0"],
    ["clickCount", "INT NULL DEFAULT 0"],
  ];
  for (const [column, definition] of campaignPatches) await addColumn(connection, "newsletter_campaigns", campaignColumns, column, definition);
  if (campaignColumns.has("content") && campaignColumns.has("customContent")) {
    await connection.query("UPDATE `newsletter_campaigns` SET `customContent` = `content` WHERE `customContent` IS NULL AND `content` IS NOT NULL");
  }
  if (campaignColumns.has("status")) await connection.query("ALTER TABLE `newsletter_campaigns` MODIFY COLUMN `status` ENUM('draft','scheduled','sending','sent','failed') NOT NULL DEFAULT 'draft'");
  if (campaignColumns.has("recipientCount")) await connection.query("ALTER TABLE `newsletter_campaigns` MODIFY COLUMN `recipientCount` INT NULL DEFAULT 0");

  const settingColumns = await getColumns(connection, "site_settings");
  await addColumn(connection, "site_settings", settingColumns, "description", "VARCHAR(500) NULL");
  if (settingColumns.has("key")) await connection.query("ALTER TABLE `site_settings` MODIFY COLUMN `key` VARCHAR(100) NOT NULL");
  if (settingColumns.has("value")) await connection.query("ALTER TABLE `site_settings` MODIFY COLUMN `value` TEXT NOT NULL");

  await connection.query("ALTER TABLE `announcements` MODIFY COLUMN `title` VARCHAR(200) NOT NULL, MODIFY COLUMN `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, MODIFY COLUMN `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
  await connection.query("ALTER TABLE `draft_images` MODIFY COLUMN `isCover` ENUM('yes','no') NOT NULL DEFAULT 'no', MODIFY COLUMN `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
  await connection.query("ALTER TABLE `estimates` MODIFY COLUMN `area` INT NULL, MODIFY COLUMN `grade` VARCHAR(30) NULL, MODIFY COLUMN `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
  await connection.query("ALTER TABLE `inquiries` MODIFY COLUMN `phone` VARCHAR(30) NULL, MODIFY COLUMN `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, MODIFY COLUMN `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
  await connection.query("ALTER TABLE `insight_articles` MODIFY COLUMN `author` VARCHAR(100) NULL DEFAULT '고감도', MODIFY COLUMN `status` ENUM('draft','published','archived') NOT NULL DEFAULT 'draft', MODIFY COLUMN `viewCount` INT NULL DEFAULT 0, MODIFY COLUMN `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, MODIFY COLUMN `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
  await connection.query("ALTER TABLE `portfolio_drafts` MODIFY COLUMN `status` ENUM('draft','review','published','archived') NOT NULL DEFAULT 'draft'");
  await connection.query("ALTER TABLE `subscribers` MODIFY COLUMN `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, MODIFY COLUMN `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
  migrationTestFailpoint("after-canonical-alter");
}

export const LEGACY_DATA_MIGRATION_PAYLOAD = [
  getColumns,
  addColumn,
  scalarCount,
  assertNoRows,
  hasSingleColumnUnique,
  migrationTestFailpoint,
  preflightLegacyDataMigration,
  applyLegacyDataMigration,
].map(source => source.toString()).join("\0");
