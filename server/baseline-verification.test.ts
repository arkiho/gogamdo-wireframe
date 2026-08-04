import { describe, expect, it, vi } from "vitest";
import { ORM_SCHEMA_CONTRACT, REQUIRED_TABLE_NAMES, verifyLegacyBaselineSchema } from "./db/baselineVerification";

function connectionWithColumns(
  columns: Array<Record<string, string | boolean>>,
  tables = REQUIRED_TABLE_NAMES,
  invariantCount = 0,
  uniqueRows = ORM_SCHEMA_CONTRACT.filter(column => column.unique).map(column => ({
    TABLE_NAME: column.table,
    COLUMN_NAME: column.column,
  })),
) {
  return {
    query: vi.fn(async (sql: string) => {
      if (sql.includes("information_schema.TABLES")) {
        return [tables.map(TABLE_NAME => ({ TABLE_NAME }))];
      }
      if (sql.includes("information_schema.COLUMNS")) return [columns];
      if (sql.includes("information_schema.STATISTICS")) return [uniqueRows];
      return [[{ count: invariantCount }]];
    }),
  };
}

const requiredColumns = ORM_SCHEMA_CONTRACT.map(column => ({
  TABLE_NAME: column.table,
  COLUMN_NAME: column.column,
  COLUMN_TYPE: column.type,
  IS_NULLABLE: column.nullable,
  COLUMN_KEY: column.primary ? "PRI" : "",
}));

describe("legacy baseline schema verification", () => {
  it("derives the complete ORM table and column baseline", () => {
    expect(REQUIRED_TABLE_NAMES).toHaveLength(121);
    expect(ORM_SCHEMA_CONTRACT).toHaveLength(1668);
  });

  it("accepts the complete ORM schema contract", async () => {
    await expect(verifyLegacyBaselineSchema(connectionWithColumns(requiredColumns) as never)).resolves.toBeUndefined();
  });

  it("fails closed when any ORM column is missing", async () => {
    await expect(verifyLegacyBaselineSchema(connectionWithColumns(requiredColumns.slice(1)) as never))
      .rejects.toThrow(/missing/);
  });

  it("fails closed when any required table is missing", async () => {
    await expect(verifyLegacyBaselineSchema(
      connectionWithColumns(requiredColumns, REQUIRED_TABLE_NAMES.slice(1)) as never,
    )).rejects.toThrow(/missing tables/);
  });

  it("fails closed when a post-backfill data invariant is violated", async () => {
    await expect(verifyLegacyBaselineSchema(
      connectionWithColumns(requiredColumns, REQUIRED_TABLE_NAMES, 1) as never,
    )).rejects.toThrow(/Baseline data verification failed/);
  });

  it("fails closed when a type, nullability, or primary-key contract drifts", async () => {
    const drifted = requiredColumns.map(column =>
      column.TABLE_NAME === "inquiries" && column.COLUMN_NAME === "status"
        ? { ...column, COLUMN_TYPE: "enum('new','contacted','quoted','closed')" }
        : column,
    );
    await expect(verifyLegacyBaselineSchema(connectionWithColumns(drifted) as never))
      .rejects.toThrow(/inquiries\.status/);
  });

  it("fails closed when an ORM unique constraint is missing", async () => {
    await expect(verifyLegacyBaselineSchema(
      connectionWithColumns(requiredColumns, REQUIRED_TABLE_NAMES, 0, []) as never,
    )).rejects.toThrow(/unique=/);
  });

  it("does not accept prefix unique indexes as full-column ORM uniqueness", async () => {
    const { readFile } = await import("node:fs/promises");
    const verifierSource = await readFile(new URL("./db/baselineVerification.ts", import.meta.url), "utf8");
    const legacySource = await readFile(new URL("./db/legacyDataMigration.ts", import.meta.url), "utf8");
    expect(verifierSource).toContain("HAVING COUNT(*) = 1 AND MAX(SUB_PART) IS NULL");
    expect(legacySource).toContain("HAVING COUNT(*) = 1 AND MAX(COLUMN_NAME) = ? AND MAX(SUB_PART) IS NULL");
    expect(verifierSource).not.toContain("AND SUB_PART IS NULL\n      GROUP BY");
    expect(legacySource).not.toContain("AND SUB_PART IS NULL\n        GROUP BY");
  });
});
