import { createHash } from "node:crypto";
import type { Connection, RowDataPacket } from "mysql2/promise";

export interface VersionedMigration {
  id: string;
  checksum: string;
  up: (connection: Connection) => Promise<void>;
  verify?: (connection: Connection) => Promise<void>;
}

interface AppliedMigration extends RowDataPacket {
  id: string;
  checksum: string;
}

export function checksumMigrationSources(sources: Array<Function | string>): string {
  const hash = createHash("sha256");
  for (const source of sources) {
    hash.update(typeof source === "string" ? source : source.toString());
    hash.update("\0");
  }
  return hash.digest("hex");
}

export async function withMigrationLock<T>(
  connection: Connection,
  task: () => Promise<T>,
): Promise<T> {
  const lockName = "kokamdo_schema_migration";
  const [lockRows] = await connection.execute<RowDataPacket[]>(
    "SELECT GET_LOCK(?, ?) AS acquired",
    [lockName, 30],
  );
  if (Number(lockRows[0]?.acquired) !== 1) {
    throw new Error("Could not acquire migration lock");
  }

  let result: T | undefined;
  let taskError: unknown;
  try {
    result = await task();
  } catch (error) {
    taskError = error;
  }

  let releaseError: unknown;
  try {
    const [releaseRows] = await connection.execute<RowDataPacket[]>(
      "SELECT RELEASE_LOCK(?) AS released",
      [lockName],
    );
    if (Number(releaseRows[0]?.released) !== 1) {
      throw new Error("Could not release migration lock");
    }
  } catch (error) {
    releaseError = error;
  }

  if (taskError && releaseError) {
    throw new AggregateError([taskError, releaseError], "Migration and lock release both failed");
  }
  if (taskError) throw taskError;
  if (releaseError) throw releaseError;
  return result as T;
}

export async function applyMigrations(
  connection: Connection,
  migrations: VersionedMigration[],
): Promise<void> {
  await connection.execute(`CREATE TABLE IF NOT EXISTS app_schema_migrations (
    id VARCHAR(100) PRIMARY KEY,
    checksum CHAR(64) NOT NULL,
    appliedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  const seen = new Set<string>();
  for (const migration of migrations) {
    if (seen.has(migration.id)) throw new Error(`Duplicate migration id: ${migration.id}`);
    seen.add(migration.id);
  }

  const [rows] = await connection.execute<AppliedMigration[]>(
    "SELECT id, checksum FROM app_schema_migrations ORDER BY appliedAt, id",
  );
  if (rows.length > migrations.length) {
    throw new Error("Migration history contains unknown or future migration IDs");
  }
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const declared = migrations[index];
    if (!declared || row.id !== declared.id) {
      throw new Error(`Migration history is not an ordered prefix at position ${index}`);
    }
    if (row.checksum !== declared.checksum) {
      throw new Error(`Migration checksum mismatch: ${row.id}`);
    }
  }

  for (let index = rows.length; index < migrations.length; index += 1) {
    const migration = migrations[index];
    await migration.up(connection);
    await migration.verify?.(connection);
    await connection.execute(
      "INSERT INTO app_schema_migrations (id, checksum) VALUES (?, ?)",
      [migration.id, migration.checksum],
    );
  }
}
