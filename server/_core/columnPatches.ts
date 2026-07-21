/**
 * 컬럼 패치 (기존 테이블 스키마 드리프트 보정)
 *
 * ensureTables()의 옛 DDL로 만들어진 일부 테이블이 schema.ts와 어긋나,
 * 앱 코드(drizzle)가 기대하는 컬럼이 실제 DB에 없어 기능이 깨져 있던 문제를 보정한다.
 * (예: announcements가 active/priority/startsAt 없이 옛 content/type만 가진 상태 → 공지 기능 불가)
 *
 * ADD COLUMN 만 수행하며 기존 컬럼/데이터는 절대 건드리지 않는다(비파괴적).
 * 대상 7개 테이블 모두 0행이라 NOT NULL 추가도 안전.
 * information_schema로 이미 존재하는 컬럼은 건너뛰어 멱등하게 동작한다.
 * 출처: schema.ts vs 프로덕션 실제 DDL 대조 (2026-07-21).
 */
import type { Connection } from "mysql2/promise";

interface ColumnPatch { table: string; col: string; alter: string; }

const COLUMN_PATCHES: ColumnPatch[] = [
  {"table":"announcements","col":"message","alter":"ALTER TABLE `announcements` ADD COLUMN `message` text NOT NULL"},
  {"table":"announcements","col":"linkUrl","alter":"ALTER TABLE `announcements` ADD COLUMN `linkUrl` varchar(500)"},
  {"table":"announcements","col":"linkText","alter":"ALTER TABLE `announcements` ADD COLUMN `linkText` varchar(100)"},
  {"table":"announcements","col":"bgColor","alter":"ALTER TABLE `announcements` ADD COLUMN `bgColor` varchar(20) DEFAULT '#111111'"},
  {"table":"announcements","col":"textColor","alter":"ALTER TABLE `announcements` ADD COLUMN `textColor` varchar(20) DEFAULT '#ffffff'"},
  {"table":"announcements","col":"active","alter":"ALTER TABLE `announcements` ADD COLUMN `active` enum('yes','no') NOT NULL DEFAULT 'yes'"},
  {"table":"announcements","col":"priority","alter":"ALTER TABLE `announcements` ADD COLUMN `priority` int DEFAULT 0"},
  {"table":"announcements","col":"startsAt","alter":"ALTER TABLE `announcements` ADD COLUMN `startsAt` timestamp"},
  {"table":"announcements","col":"endsAt","alter":"ALTER TABLE `announcements` ADD COLUMN `endsAt` timestamp"},
  {"table":"estimates","col":"sessionId","alter":"ALTER TABLE `estimates` ADD COLUMN `sessionId` varchar(64)"},
  {"table":"estimates","col":"totalMin","alter":"ALTER TABLE `estimates` ADD COLUMN `totalMin` int"},
  {"table":"estimates","col":"totalMax","alter":"ALTER TABLE `estimates` ADD COLUMN `totalMax` int"},
  {"table":"estimates","col":"contactEmail","alter":"ALTER TABLE `estimates` ADD COLUMN `contactEmail` varchar(320)"},
  {"table":"estimates","col":"contactName","alter":"ALTER TABLE `estimates` ADD COLUMN `contactName` varchar(100)"},
  {"table":"inquiries","col":"budget","alter":"ALTER TABLE `inquiries` ADD COLUMN `budget` varchar(50)"},
  {"table":"newsletter_campaigns","col":"previewText","alter":"ALTER TABLE `newsletter_campaigns` ADD COLUMN `previewText` varchar(300)"},
  {"table":"newsletter_campaigns","col":"articleIds","alter":"ALTER TABLE `newsletter_campaigns` ADD COLUMN `articleIds` json"},
  {"table":"newsletter_campaigns","col":"customContent","alter":"ALTER TABLE `newsletter_campaigns` ADD COLUMN `customContent` text"},
  {"table":"newsletter_campaigns","col":"htmlContent","alter":"ALTER TABLE `newsletter_campaigns` ADD COLUMN `htmlContent` text"},
  {"table":"newsletter_campaigns","col":"scheduledAt","alter":"ALTER TABLE `newsletter_campaigns` ADD COLUMN `scheduledAt` timestamp"},
  {"table":"newsletter_campaigns","col":"openCount","alter":"ALTER TABLE `newsletter_campaigns` ADD COLUMN `openCount` int DEFAULT 0"},
  {"table":"newsletter_campaigns","col":"clickCount","alter":"ALTER TABLE `newsletter_campaigns` ADD COLUMN `clickCount` int DEFAULT 0"},
  {"table":"newsletter_subscribers","col":"subscribedAt","alter":"ALTER TABLE `newsletter_subscribers` ADD COLUMN `subscribedAt` timestamp NOT NULL DEFAULT (now())"},
  {"table":"newsletter_subscribers","col":"unsubscribedAt","alter":"ALTER TABLE `newsletter_subscribers` ADD COLUMN `unsubscribedAt` timestamp"},
  {"table":"site_settings","col":"description","alter":"ALTER TABLE `site_settings` ADD COLUMN `description` varchar(500)"},
  {"table":"subscribers","col":"name","alter":"ALTER TABLE `subscribers` ADD COLUMN `name` varchar(100)"},
  {"table":"subscribers","col":"active","alter":"ALTER TABLE `subscribers` ADD COLUMN `active` enum('yes','no') NOT NULL DEFAULT 'yes'"},
];

export async function ensureColumnPatches(conn: Connection): Promise<void> {
  const tables = [...new Set(COLUMN_PATCHES.map((p) => p.table))];
  // 대상 테이블들의 현재 컬럼 집합을 한 번에 조회
  const existing = new Map<string, Set<string>>();
  for (const t of tables) existing.set(t, new Set());
  const [rows] = await conn.query(
    `SELECT TABLE_NAME AS t, COLUMN_NAME AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (${tables.map(() => "?").join(",")})`,
    tables,
  );
  for (const r of rows as Array<{ t: string; c: string }>) {
    existing.get(r.t)?.add(r.c);
  }

  let added = 0;
  const failures: string[] = [];
  for (const p of COLUMN_PATCHES) {
    if (existing.get(p.table)?.has(p.col)) continue; // 이미 존재 → 스킵(멱등)
    try {
      await conn.query(p.alter);
      added++;
    } catch (err: any) {
      // 동시 부팅 등으로 중복이면(1060) 무시
      if (err?.errno === 1060) continue;
      failures.push(`${p.table}.${p.col}: ${err?.code ?? ""} ${err?.sqlMessage ?? err?.message ?? "unknown"}`);
    }
  }
  console.log(`[DB] Column patches applied (${added} added, ${COLUMN_PATCHES.length} total).`);
  if (failures.length) {
    console.warn("[DB] Column patch failures:\n" + failures.join("\n"));
  }
}
