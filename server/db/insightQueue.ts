/**
 * 인사이트 콘텐츠 큐 DB 접근 (D-11)
 */
import { eq, and, lte, asc } from "drizzle-orm";
import { getDb } from "../db";
import { insightContentQueue, type InsertInsightContentQueue } from "../../drizzle/schema";

export async function listQueue() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(insightContentQueue).orderBy(asc(insightContentQueue.scheduledDate));
}

export async function createQueueItem(data: InsertInsightContentQueue) {
  const db = await getDb();
  if (!db) return null;
  const [r] = await db.insert(insightContentQueue).values(data).$returningId();
  return r;
}

export async function updateQueueItem(id: number, data: Partial<InsertInsightContentQueue>) {
  const db = await getDb();
  if (!db) return;
  await db.update(insightContentQueue).set(data).where(eq(insightContentQueue.id, id));
}

export async function deleteQueueItem(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(insightContentQueue).where(eq(insightContentQueue.id, id));
}

/** 오늘(또는 그 이전) 예정 & planned 인 항목 중 가장 이른 것 1개 (스케줄러용) */
export async function getNextPlannedQueueItem(today: string) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(insightContentQueue)
    .where(and(eq(insightContentQueue.status, "planned"), lte(insightContentQueue.scheduledDate, today)))
    .orderBy(asc(insightContentQueue.scheduledDate))
    .limit(1);
  return row ?? null;
}
