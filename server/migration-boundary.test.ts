import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

function source(relative: string) {
  return readFileSync(path.join(root, relative), "utf8");
}

describe("database migration boundary", () => {
  it("keeps schema mutation code out of the web entrypoint", () => {
    const webEntry = source("server/_core/index.ts");
    expect(webEntry).not.toMatch(/ensureTables|ensureExtendedTables|ensureColumnPatches/);
    expect(webEntry).not.toMatch(/CREATE\s+TABLE|ALTER\s+TABLE/i);
  });

  it("provides an explicit one-shot migration command", () => {
    const packageJson = JSON.parse(source("package.json"));
    expect(packageJson.scripts?.["db:migrate"]).toBe("tsx scripts/migrate.ts");
    expect(packageJson.scripts?.["db:push"]).toBeUndefined();
    expect(source("scripts/migrate.ts")).toMatch(/runMigrations/);
  });

  it("creates the inquiries status enum expected by the ORM", () => {
    const runner = source("server/db/runMigrations.ts");
    const inquiryDdl = runner.slice(
      runner.indexOf("CREATE TABLE IF NOT EXISTS inquiries"),
      runner.indexOf("// 문의 유입경로"),
    );
    expect(inquiryDdl).toContain("ENUM('new','contacted','in_progress','completed')");
    expect(inquiryDdl).not.toContain("'quoted'");
    expect(inquiryDdl).not.toContain("'closed'");
  });

  it("checksums the baseline and every imported DDL helper", () => {
    const runner = source("server/db/runMigrations.ts");
    expect(runner).toContain("EXTENDED_TABLE_MIGRATION_PAYLOAD");
    expect(runner).toContain("COLUMN_PATCH_MIGRATION_PAYLOAD");
    expect(runner).toContain("LEGACY_DATA_MIGRATION_PAYLOAD");
    expect(runner).toContain("BASELINE_VERIFICATION_PAYLOAD");
    expect(runner.indexOf("await ensureColumnPatches(conn)")).toBeLessThan(runner.indexOf("await applyLegacyDataMigration(conn)"));
    expect(runner).toContain("verify: verifyLegacyBaselineSchema");
  });

  it("runs all table creation before legacy and extended column patches", () => {
    const runner = source("server/db/runMigrations.ts");
    const createPositions = [...runner.matchAll(/CREATE TABLE IF NOT EXISTS/g)].map(match => match.index ?? -1);
    const extendedCreate = runner.indexOf("await ensureExtendedTables(conn)");
    const legacyPatchPositions = [...runner.matchAll(/await addColumnIfMissing\(/g)].map(match => match.index ?? -1);
    const extendedPatch = runner.indexOf("await ensureColumnPatches(conn)");

    expect(createPositions.length).toBeGreaterThan(0);
    expect(legacyPatchPositions.length).toBeGreaterThan(0);
    expect(Math.max(...createPositions, extendedCreate)).toBeLessThan(Math.min(...legacyPatchPositions));
    expect(Math.max(...legacyPatchPositions)).toBeLessThan(extendedPatch);
  });

  it("does not swallow migration failures", () => {
    const runner = source("server/db/runMigrations.ts");
    expect(runner).not.toMatch(/catch\s*\([^)]*\)\s*\{[^}]*console\.warn/s);
    expect(runner).toMatch(/throw|Promise\.reject/);
  });
});
