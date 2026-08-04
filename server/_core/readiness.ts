import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { Request, Response } from "express";

type ReadinessDependencies = {
  database: () => Promise<void>;
  storage: () => Promise<void>;
  timeoutMs: number;
};

async function withinDeadline(probe: () => Promise<void>, timeoutMs: number): Promise<boolean> {
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      probe(),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error("Readiness probe timed out")), timeoutMs);
      }),
    ]);
    return true;
  } catch {
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function probeDatabase(databaseUrl: string | undefined): Promise<void> {
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const { createConnection } = await import("mysql2/promise");
  const connection = await createConnection(databaseUrl);
  try {
    await connection.query("SELECT 1");
  } finally {
    await connection.end();
  }
}

export async function probeLocalStorage(storageDir: string): Promise<void> {
  await fs.mkdir(storageDir, { recursive: true });
  const probePath = path.join(storageDir, `.readiness-${process.pid}-${randomUUID()}`);
  const expected = randomUUID();
  try {
    await fs.writeFile(probePath, expected, { encoding: "utf8", flag: "wx", mode: 0o600 });
    const actual = await fs.readFile(probePath, "utf8");
    if (actual !== expected) throw new Error("Storage readiness data mismatch");
  } finally {
    await fs.unlink(probePath).catch(error => {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    });
  }
}

export function createReadinessHandler(dependencies: ReadinessDependencies) {
  return async (_request: Request, response: Response): Promise<void> => {
    const [database, storage] = await Promise.all([
      withinDeadline(dependencies.database, dependencies.timeoutMs),
      withinDeadline(dependencies.storage, dependencies.timeoutMs),
    ]);
    const ready = database && storage;
    response.status(ready ? 200 : 503).json({
      status: ready ? "ready" : "not_ready",
      checks: { database, storage },
    });
  };
}
