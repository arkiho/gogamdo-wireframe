import { describe, expect, it, vi } from "vitest";
import {
  applyMigrations,
  checksumMigrationSources,
  withMigrationLock,
  type VersionedMigration,
} from "./db/versionedMigrations";
import { EXTENDED_TABLE_MIGRATION_PAYLOAD } from "./_core/extendedTables";
import { COLUMN_PATCH_MIGRATION_PAYLOAD } from "./_core/columnPatches";
import { BASELINE_VERIFICATION_PAYLOAD, verifyLegacyBaselineSchema } from "./db/baselineVerification";
import { LEGACY_DATA_MIGRATION_PAYLOAD } from "./db/legacyDataMigration";

function fakeConnection(applied: Array<{ id: string; checksum: string }> = []) {
  const execute = vi.fn(async (sql: string, params?: unknown[]) => {
    if (sql.includes("SELECT id, checksum")) return [applied, []];
    return [[], []];
  });
  return { execute, params: () => execute.mock.calls.map(call => call[1]) };
}

function migration(id: string, checksum: string, up = vi.fn(async () => {})): VersionedMigration {
  return { id, checksum, up };
}

describe("versioned migration runner", () => {
  it("changes the checksum when any migration helper source changes", () => {
    const baseline = () => "baseline";
    const extended = () => "extended-v1";
    const patches = () => "patch-v1";

    const original = checksumMigrationSources([baseline, extended, patches]);
    const helperChanged = checksumMigrationSources([baseline, () => "extended-v2", patches]);

    expect(helperChanged).not.toBe(original);
    expect(original).toMatch(/^[a-f0-9]{64}$/);
  });

  it("changes when real DDL, patch, verifier, or indirect backfill payload changes", () => {
    const payloads = [
      EXTENDED_TABLE_MIGRATION_PAYLOAD,
      COLUMN_PATCH_MIGRATION_PAYLOAD,
      BASELINE_VERIFICATION_PAYLOAD,
      LEGACY_DATA_MIGRATION_PAYLOAD,
    ];
    const original = checksumMigrationSources(payloads);
    for (let index = 0; index < payloads.length; index++) {
      const changed = [...payloads];
      changed[index] += "\ncontract-change";
      expect(checksumMigrationSources(changed)).not.toBe(original);
    }
  });

  it("hashes the executable schema verifier implementation", () => {
    expect(BASELINE_VERIFICATION_PAYLOAD).toContain(verifyLegacyBaselineSchema.toString());
    const original = checksumMigrationSources([BASELINE_VERIFICATION_PAYLOAD]);
    const changedVerifier = BASELINE_VERIFICATION_PAYLOAD.replace("Baseline schema verification failed", "weakened verifier");
    expect(changedVerifier).not.toBe(BASELINE_VERIFICATION_PAYLOAD);
    expect(checksumMigrationSources([changedVerifier])).not.toBe(original);
  });

  it("applies an unapplied migration and records it only after success", async () => {
    const conn = fakeConnection();
    const item = migration("20260730_001", "abc");

    await applyMigrations(conn as never, [item]);

    expect(item.up).toHaveBeenCalledOnce();
    expect(conn.execute.mock.calls.some(call => String(call[0]).includes("INSERT INTO app_schema_migrations"))).toBe(true);
    expect(conn.params()).toContainEqual([item.id, item.checksum]);
  });

  it("skips an already applied migration with the same checksum", async () => {
    const item = migration("20260730_001", "abc");
    const conn = fakeConnection([{ id: item.id, checksum: item.checksum }]);

    await applyMigrations(conn as never, [item]);

    expect(item.up).not.toHaveBeenCalled();
  });

  it("fails closed when an applied migration checksum changed", async () => {
    const item = migration("20260730_001", "new");
    const conn = fakeConnection([{ id: item.id, checksum: "old" }]);

    await expect(applyMigrations(conn as never, [item])).rejects.toThrow(/checksum/i);
    expect(item.up).not.toHaveBeenCalled();
  });

  it("rejects unknown future migration history", async () => {
    const first = migration("001", "a");
    const conn = fakeConnection([{ id: "999", checksum: "future" }]);
    await expect(applyMigrations(conn as never, [first])).rejects.toThrow(/prefix|unknown|future/i);
    expect(first.up).not.toHaveBeenCalled();
  });

  it("rejects a gapped or reordered migration history", async () => {
    const first = migration("001", "a");
    const second = migration("002", "b");
    const conn = fakeConnection([{ id: "002", checksum: "b" }]);
    await expect(applyMigrations(conn as never, [first, second])).rejects.toThrow(/prefix/i);
    expect(first.up).not.toHaveBeenCalled();
    expect(second.up).not.toHaveBeenCalled();
  });

  it("rejects a ledger longer than the declared migration chain", async () => {
    const first = migration("001", "a");
    const conn = fakeConnection([{ id: "001", checksum: "a" }, { id: "002", checksum: "b" }]);
    await expect(applyMigrations(conn as never, [first])).rejects.toThrow(/unknown|future/i);
    expect(first.up).not.toHaveBeenCalled();
  });

  it("verifies the resulting schema before recording migration history", async () => {
    const events: string[] = [];
    const conn = fakeConnection();
    const item = migration("20260730_001", "abc", vi.fn(async () => { events.push("up"); }));
    item.verify = vi.fn(async () => { events.push("verify"); });
    conn.execute.mockImplementation(async (sql: string) => {
      if (sql.includes("SELECT id, checksum")) return [[]];
      if (sql.includes("INSERT INTO app_schema_migrations")) events.push("insert");
      return [[]];
    });

    await applyMigrations(conn as never, [item]);

    expect(events).toEqual(["up", "verify", "insert"]);
  });

  it("does not record a migration when schema verification fails", async () => {
    const conn = fakeConnection();
    const item = migration("20260730_001", "abc");
    item.verify = vi.fn(async () => { throw new Error("schema drift"); });

    await expect(applyMigrations(conn as never, [item])).rejects.toThrow("schema drift");
    expect(conn.execute.mock.calls.some(call => String(call[0]).includes("INSERT INTO app_schema_migrations"))).toBe(false);
  });

  it("does not record a migration that failed", async () => {
    const item = migration("20260730_001", "abc", vi.fn(async () => { throw new Error("ddl failed"); }));
    const conn = fakeConnection();

    await expect(applyMigrations(conn as never, [item])).rejects.toThrow("ddl failed");
    expect(conn.execute.mock.calls.some(call => String(call[0]).includes("INSERT INTO app_schema_migrations"))).toBe(false);
  });

  it("holds and releases a MySQL advisory lock around migration execution", async () => {
    const execute = vi.fn(async (sql: string) => {
      if (sql.includes("GET_LOCK")) return [[{ acquired: 1 }]];
      if (sql.includes("RELEASE_LOCK")) return [[{ released: 1 }]];
      return [[]];
    });
    const task = vi.fn(async () => "done");

    await expect(withMigrationLock({ execute } as never, task)).resolves.toBe("done");

    expect(task).toHaveBeenCalledOnce();
    expect(execute.mock.calls[0][0]).toContain("GET_LOCK");
    expect(execute.mock.calls.at(-1)?.[0]).toContain("RELEASE_LOCK");
  });

  it("fails closed when the migration lock cannot be acquired", async () => {
    const execute = vi.fn(async () => [[{ acquired: 0 }]]);
    const task = vi.fn();

    await expect(withMigrationLock({ execute } as never, task)).rejects.toThrow(/lock/i);
    expect(task).not.toHaveBeenCalled();
  });

  it("releases the migration lock when the migration task fails", async () => {
    const execute = vi.fn(async (sql: string) => sql.includes("GET_LOCK") ? [[{ acquired: 1 }]] : [[{ released: 1 }]]);

    await expect(withMigrationLock(
      { execute } as never,
      async () => { throw new Error("migration failed"); },
    )).rejects.toThrow("migration failed");

    expect(execute.mock.calls.at(-1)?.[0]).toContain("RELEASE_LOCK");
  });
});
