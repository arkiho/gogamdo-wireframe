import type { Connection } from "mysql2/promise";
import { getTableConfig } from "drizzle-orm/mysql-core";
import * as ormSchema from "../../drizzle/schema";

type RequiredColumn = {
  table: string;
  column: string;
  type: string;
  nullable: "YES" | "NO";
  primary: boolean;
  unique: boolean;
};

function collectOrmSchemaContract(): RequiredColumn[] {
  const columns: RequiredColumn[] = [];
  for (const value of Object.values(ormSchema)) {
    try {
      const config = getTableConfig(value as never);
      if (!config?.name || !config.columns?.length) continue;
      for (const column of config.columns) {
        columns.push({
          table: config.name,
          column: column.name,
          type: column.getSQLType().toLowerCase(),
          nullable: column.notNull ? "NO" : "YES",
          primary: Boolean(column.primary),
          unique: Boolean(column.isUnique),
        });
      }
    } catch {
      // Non-table exports are intentionally ignored.
    }
  }
  return columns.sort((a, b) =>
    a.table.localeCompare(b.table) || a.column.localeCompare(b.column),
  );
}

export const ORM_SCHEMA_CONTRACT = collectOrmSchemaContract();
export const REQUIRED_TABLE_NAMES = [...new Set(ORM_SCHEMA_CONTRACT.map(column => column.table))].sort();

function typeMatches(actual: string, expected: string): boolean {
  const normalized = actual.toLowerCase();
  if (expected === "int") return /^int(?:\(\d+\))?$/.test(normalized);
  if (expected === "bigint") return /^bigint(?:\(\d+\))?$/.test(normalized);
  if (expected === "boolean") return normalized === "boolean" || normalized === "tinyint(1)";
  if (expected === "decimal") return /^decimal(?:\(\d+,\d+\))?$/.test(normalized);
  return normalized === expected;
}

const INVARIANT_QUERIES = [
  ["unsupported inquiry status", "SELECT COUNT(*) AS count FROM `inquiries` WHERE `status` NOT IN ('new','contacted','in_progress','completed')"],
  ["missing draft image owner", "SELECT COUNT(*) AS count FROM `draft_images` WHERE `draftId` IS NULL"],
  ["invalid insight rows", "SELECT COUNT(*) AS count FROM `insight_articles` WHERE `excerpt` IS NULL OR `content` IS NULL OR `category` NOT IN ('trend','cost_guide','case_study','tip','news')"],
] as const;

export const BASELINE_VERIFICATION_PAYLOAD = [
  JSON.stringify(ORM_SCHEMA_CONTRACT),
  JSON.stringify(INVARIANT_QUERIES),
  typeMatches.toString(),
  verifyLegacyBaselineSchema.toString(),
].join("\0");

export async function verifyLegacyBaselineSchema(connection: Connection): Promise<void> {
  const [tableRows] = await connection.query(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()",
  );
  const actualTables = new Set((tableRows as Array<{ TABLE_NAME: string }>).map(row => row.TABLE_NAME));
  const missingTables = REQUIRED_TABLE_NAMES.filter(table => !actualTables.has(table));
  if (missingTables.length) {
    throw new Error(`[DB] Baseline schema verification failed:\nmissing tables: ${missingTables.join(", ")}`);
  }

  const [rows] = await connection.query(
    `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()`,
  );
  const actual = new Map<string, { type: string; nullable: string; primary: boolean }>();
  for (const row of rows as Array<{
    TABLE_NAME: string;
    COLUMN_NAME: string;
    COLUMN_TYPE: string;
    IS_NULLABLE: string;
    COLUMN_KEY: string;
  }>) {
    actual.set(`${row.TABLE_NAME}.${row.COLUMN_NAME}`, {
      type: row.COLUMN_TYPE,
      nullable: row.IS_NULLABLE,
      primary: row.COLUMN_KEY === "PRI",
    });
  }

  const [uniqueRows] = await connection.query(
    `SELECT TABLE_NAME, MAX(COLUMN_NAME) AS COLUMN_NAME
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND NON_UNIQUE = 0 AND INDEX_NAME <> 'PRIMARY'
      GROUP BY TABLE_NAME, INDEX_NAME
     HAVING COUNT(*) = 1 AND MAX(SUB_PART) IS NULL`,
  );
  const actualUnique = new Set(
    (uniqueRows as Array<{ TABLE_NAME: string; COLUMN_NAME: string }>).map(
      row => `${row.TABLE_NAME}.${row.COLUMN_NAME}`,
    ),
  );

  const failures: string[] = [];
  for (const expected of ORM_SCHEMA_CONTRACT) {
    const key = `${expected.table}.${expected.column}`;
    const found = actual.get(key);
    if (!found) {
      failures.push(`${key} missing`);
      continue;
    }
    if (
      !typeMatches(found.type, expected.type) ||
      found.nullable !== expected.nullable ||
      found.primary !== expected.primary ||
      actualUnique.has(key) !== expected.unique
    ) {
      failures.push(
        `${key} expected ${expected.type}/${expected.nullable}/primary=${expected.primary}/unique=${expected.unique}, ` +
        `got ${found.type}/${found.nullable}/primary=${found.primary}/unique=${actualUnique.has(key)}`,
      );
    }
  }
  if (failures.length) {
    throw new Error(`[DB] Baseline schema verification failed:\n${failures.join("\n")}`);
  }

  for (const [label, sql] of INVARIANT_QUERIES) {
    const [countRows] = await connection.query(sql);
    const count = Number((countRows as Array<{ count: number }>)[0]?.count ?? 0);
    if (count !== 0) failures.push(`${label}: ${count} row(s)`);
  }
  if (failures.length) {
    throw new Error(`[DB] Baseline data verification failed:\n${failures.join("\n")}`);
  }
}
