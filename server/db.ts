import { eq, desc, count, and, lte, gte, or, isNull, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, inquiries, subscribers, estimates, leadDownloads, chatSessions, styleRecommendations, announcements, portfolioDrafts, draftImages, driveSyncLog, spaceProjects, sensors, sensorData, spaceAnalysis, crmClients, crmInteractions, crmDeals, crmActivities, popups, notifications, type InsertInquiry, type InsertSubscriber, type InsertEstimate, type InsertLeadDownload, type InsertChatSession, type InsertStyleRecommendation, type InsertAnnouncement, type InsertPortfolioDraft, type InsertDraftImage, type InsertDriveSyncLog, type InsertSpaceProject, type InsertSensor, type InsertSensorData, type InsertSpaceAnalysis, type InsertCrmClient, type InsertCrmInteraction, type InsertCrmDeal, type InsertCrmActivity, type InsertPopup, type InsertNotification } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== Inquiry Queries =====

export async function createInquiry(data: InsertInquiry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(inquiries).values(data);
  return { success: true };
}

export async function listInquiries() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
}

// ===== Subscriber Queries =====

export async function addSubscriber(data: InsertSubscriber) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.insert(subscribers).values(data);
    return { success: true, isNew: true };
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY") {
      return { success: true, isNew: false };
    }
    throw err;
  }
}

export async function listSubscribers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
}

// ===== Estimate Queries =====

export async function createEstimate(data: InsertEstimate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(estimates).values(data);
  return { success: true };
}

export async function listEstimates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(estimates).orderBy(desc(estimates.createdAt));
}

// ===== Admin Helpers =====

export async function updateInquiryStatus(id: number, status: "new" | "contacted" | "in_progress" | "completed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(inquiries).set({ status }).where(eq(inquiries.id, id));
  return { success: true };
}

export async function toggleSubscriberActive(id: number, active: "yes" | "no") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(subscribers).set({ active }).where(eq(subscribers.id, id));
  return { success: true };
}

// ===== Lead Magnet Queries =====

export async function createLeadDownload(data: InsertLeadDownload) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(leadDownloads).values(data);
  // Also add to subscribers if new
  try {
    await db.insert(subscribers).values({
      email: data.email,
      name: data.name,
      company: data.company,
      source: `lead_magnet_${data.resourceId}`,
    });
  } catch (err: any) {
    // Ignore duplicate entry
  }
  return { success: true };
}

export async function listLeadDownloads() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leadDownloads).orderBy(desc(leadDownloads.createdAt));
}

// ===== AI Chat Session Queries =====

export async function upsertChatSession(data: { sessionId: string; messages: Array<{ role: string; content: string }>; contactEmail?: string; contactName?: string; contactPhone?: string; summary?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.insert(chatSessions).values({
      sessionId: data.sessionId,
      messages: data.messages,
      contactEmail: data.contactEmail ?? null,
      contactName: data.contactName ?? null,
      contactPhone: data.contactPhone ?? null,
      summary: data.summary ?? null,
    }).onDuplicateKeyUpdate({
      set: {
        messages: data.messages,
        contactEmail: data.contactEmail ?? undefined,
        contactName: data.contactName ?? undefined,
        contactPhone: data.contactPhone ?? undefined,
        summary: data.summary ?? undefined,
      },
    });
    return { success: true };
  } catch (err) {
    console.error("[DB] Failed to upsert chat session:", err);
    throw err;
  }
}

export async function listChatSessions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatSessions).orderBy(desc(chatSessions.updatedAt));
}

// ===== Style Recommendation Queries =====

export async function createStyleRecommendation(data: InsertStyleRecommendation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(styleRecommendations).values(data);
  return { success: true };
}

export async function listStyleRecommendations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(styleRecommendations).orderBy(desc(styleRecommendations.createdAt));
}

// ===== Announcement Queries =====

export async function createAnnouncement(data: InsertAnnouncement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(announcements).values(data);
  return { success: true };
}

export async function listAnnouncements() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(announcements).orderBy(desc(announcements.priority), desc(announcements.createdAt));
}

export async function getActiveAnnouncements() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return db.select().from(announcements).where(
    and(
      eq(announcements.active, "yes"),
      or(isNull(announcements.startsAt), lte(announcements.startsAt, now)),
      or(isNull(announcements.endsAt), gte(announcements.endsAt, now)),
    )
  ).orderBy(desc(announcements.priority), desc(announcements.createdAt));
}

export async function updateAnnouncement(id: number, data: Partial<InsertAnnouncement>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(announcements).set(data).where(eq(announcements.id, id));
  return { success: true };
}

export async function deleteAnnouncement(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(announcements).where(eq(announcements.id, id));
  return { success: true };
}

// ===== Portfolio Draft Queries =====

export async function createPortfolioDraft(data: InsertPortfolioDraft) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(portfolioDrafts).values(data);
  return { success: true, id: result[0].insertId };
}

export async function listPortfolioDrafts(status?: string) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return db.select().from(portfolioDrafts)
      .where(eq(portfolioDrafts.status, status as any))
      .orderBy(desc(portfolioDrafts.updatedAt));
  }
  return db.select().from(portfolioDrafts).orderBy(desc(portfolioDrafts.updatedAt));
}

export async function getPortfolioDraft(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(portfolioDrafts).where(eq(portfolioDrafts.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updatePortfolioDraft(id: number, data: Partial<InsertPortfolioDraft>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(portfolioDrafts).set(data).where(eq(portfolioDrafts.id, id));
  return { success: true };
}

export async function publishPortfolioDraft(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(portfolioDrafts).set({ status: "published", publishedAt: new Date() }).where(eq(portfolioDrafts.id, id));
  return { success: true };
}

export async function archivePortfolioDraft(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(portfolioDrafts).set({ status: "archived" }).where(eq(portfolioDrafts.id, id));
  return { success: true };
}

export async function deletePortfolioDraft(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(draftImages).where(eq(draftImages.draftId, id));
  await db.delete(portfolioDrafts).where(eq(portfolioDrafts.id, id));
  return { success: true };
}

// ===== Draft Image Queries =====

export async function addDraftImage(data: InsertDraftImage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(draftImages).values(data);
  return { success: true, id: result[0].insertId };
}

export async function listDraftImages(draftId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(draftImages)
    .where(eq(draftImages.draftId, draftId))
    .orderBy(draftImages.sortOrder);
}

export async function updateDraftImage(id: number, data: Partial<InsertDraftImage>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(draftImages).set(data).where(eq(draftImages.id, id));
  return { success: true };
}

export async function deleteDraftImage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(draftImages).where(eq(draftImages.id, id));
  return { success: true };
}

export async function setCoverImage(draftId: number, imageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Reset all covers for this draft
  await db.update(draftImages).set({ isCover: "no" }).where(eq(draftImages.draftId, draftId));
  // Set new cover
  await db.update(draftImages).set({ isCover: "yes" }).where(eq(draftImages.id, imageId));
  return { success: true };
}

// ===== Drive Sync Log Queries =====

export async function createSyncLog(data: InsertDriveSyncLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(driveSyncLog).values(data);
  return { success: true, id: result[0].insertId };
}

export async function getSyncLogByFolderId(folderId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(driveSyncLog).where(eq(driveSyncLog.folderId, folderId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateSyncLog(id: number, data: Partial<InsertDriveSyncLog>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(driveSyncLog).set(data).where(eq(driveSyncLog.id, id));
  return { success: true };
}

export async function listSyncLogs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(driveSyncLog).orderBy(desc(driveSyncLog.lastSyncAt));
}

export async function getPublishedPortfolios() {
  const db = await getDb();
  if (!db) return [];
  const drafts = await db.select().from(portfolioDrafts)
    .where(eq(portfolioDrafts.status, "published"))
    .orderBy(desc(portfolioDrafts.publishedAt));
  // Attach cover image for each draft
  const result = [];
  for (const draft of drafts) {
    const images = await db.select().from(draftImages)
      .where(eq(draftImages.draftId, draft.id))
      .orderBy(draftImages.sortOrder);
    const cover = images.find(img => img.isCover === "yes") || images[0];
    result.push({
      ...draft,
      coverImage: cover?.processedUrl || cover?.originalUrl || null,
    });
  }
  return result;
}

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { inquiries: 0, subscribers: 0, estimates: 0, newInquiries: 0 };
  
  const [inqRows] = await db.select({ count: count() }).from(inquiries);
  const [subRows] = await db.select({ count: count() }).from(subscribers);
  const [estRows] = await db.select({ count: count() }).from(estimates);
  const [newInqRows] = await db.select({ count: count() }).from(inquiries).where(eq(inquiries.status, "new"));
  
  return {
    inquiries: inqRows?.count ?? 0,
    subscribers: subRows?.count ?? 0,
    estimates: estRows?.count ?? 0,
    newInquiries: newInqRows?.count ?? 0,
  };
}

// ===== DDIA: Space Project Queries =====

export async function createSpaceProject(data: InsertSpaceProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(spaceProjects).values(data);
  return { success: true, id: result[0].insertId };
}

export async function listSpaceProjects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(spaceProjects).orderBy(desc(spaceProjects.updatedAt));
}

export async function getSpaceProject(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(spaceProjects).where(eq(spaceProjects.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateSpaceProject(id: number, data: Partial<InsertSpaceProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(spaceProjects).set(data).where(eq(spaceProjects.id, id));
  return { success: true };
}

export async function deleteSpaceProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(sensorData).where(eq(sensorData.projectId, id));
  await db.delete(sensors).where(eq(sensors.projectId, id));
  await db.delete(spaceAnalysis).where(eq(spaceAnalysis.projectId, id));
  await db.delete(spaceProjects).where(eq(spaceProjects.id, id));
  return { success: true };
}

// ===== DDIA: Sensor Queries =====

export async function createSensor(data: InsertSensor) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sensors).values(data);
  return { success: true, id: result[0].insertId };
}

export async function listSensors(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sensors)
    .where(eq(sensors.projectId, projectId))
    .orderBy(sensors.name);
}

export async function updateSensor(id: number, data: Partial<InsertSensor>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(sensors).set(data).where(eq(sensors.id, id));
  return { success: true };
}

export async function deleteSensor(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(sensorData).where(eq(sensorData.sensorId, id));
  await db.delete(sensors).where(eq(sensors.id, id));
  return { success: true };
}

// ===== DDIA: Sensor Data Queries =====

export async function addSensorData(data: InsertSensorData) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(sensorData).values(data);
  return { success: true };
}

export async function addSensorDataBatch(rows: InsertSensorData[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (rows.length === 0) return { success: true, count: 0 };
  await db.insert(sensorData).values(rows);
  return { success: true, count: rows.length };
}

export async function getSensorDataRange(sensorId: number, from: Date, to: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sensorData)
    .where(and(
      eq(sensorData.sensorId, sensorId),
      gte(sensorData.recordedAt, from),
      lte(sensorData.recordedAt, to),
    ))
    .orderBy(sensorData.recordedAt);
}

export async function getSensorLatestData(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  // Get latest reading per sensor for a project
  const allSensors = await db.select().from(sensors).where(eq(sensors.projectId, projectId));
  const results = [];
  for (const s of allSensors) {
    const latest = await db.select().from(sensorData)
      .where(eq(sensorData.sensorId, s.id))
      .orderBy(desc(sensorData.recordedAt))
      .limit(1);
    results.push({
      sensor: s,
      latestValue: latest[0]?.value ?? null,
      latestAt: latest[0]?.recordedAt ?? null,
    });
  }
  return results;
}

// ===== DDIA: Space Analysis Queries =====

export async function createSpaceAnalysis(data: InsertSpaceAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(spaceAnalysis).values(data);
  return { success: true, id: result[0].insertId };
}

export async function listSpaceAnalyses(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(spaceAnalysis)
    .where(eq(spaceAnalysis.projectId, projectId))
    .orderBy(desc(spaceAnalysis.createdAt));
}

// ========== CRM: Clients ==========

export async function listCrmClients() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(crmClients).orderBy(desc(crmClients.updatedAt));
}

export async function getCrmClient(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(crmClients).where(eq(crmClients.id, id));
  return rows[0] || null;
}

export async function findCrmClientByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(crmClients).where(eq(crmClients.email, email));
  return rows[0] || null;
}

export async function createCrmClient(data: Omit<InsertCrmClient, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(crmClients).values(data);
  return result[0].insertId;
}

export async function updateCrmClient(id: number, data: Partial<InsertCrmClient>) {
  const db = await getDb();
  if (!db) return;
  await db.update(crmClients).set(data).where(eq(crmClients.id, id));
}

export async function deleteCrmClient(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(crmClients).where(eq(crmClients.id, id));
}

// ========== CRM: Interactions ==========

export async function listCrmInteractions(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(crmInteractions)
    .where(eq(crmInteractions.clientId, clientId))
    .orderBy(desc(crmInteractions.createdAt));
}

export async function createCrmInteraction(data: Omit<InsertCrmInteraction, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(crmInteractions).values(data);
  return result[0].insertId;
}

export async function deleteCrmInteraction(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(crmInteractions).where(eq(crmInteractions.id, id));
}

// ========== CRM: Deals ==========

export async function listCrmDeals(clientId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (clientId) {
    return db.select().from(crmDeals)
      .where(eq(crmDeals.clientId, clientId))
      .orderBy(desc(crmDeals.updatedAt));
  }
  return db.select().from(crmDeals).orderBy(desc(crmDeals.updatedAt));
}

export async function getCrmDeal(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(crmDeals).where(eq(crmDeals.id, id));
  return rows[0] || null;
}

export async function createCrmDeal(data: Omit<InsertCrmDeal, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(crmDeals).values(data);
  return result[0].insertId;
}

export async function updateCrmDeal(id: number, data: Partial<InsertCrmDeal>) {
  const db = await getDb();
  if (!db) return;
  await db.update(crmDeals).set(data).where(eq(crmDeals.id, id));
}

export async function deleteCrmDeal(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(crmDeals).where(eq(crmDeals.id, id));
}

// ========== CRM: Activities ==========

export async function listCrmActivities(opts: { dealId?: number; clientId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts.dealId) conditions.push(eq(crmActivities.dealId, opts.dealId));
  if (opts.clientId) conditions.push(eq(crmActivities.clientId, opts.clientId));
  if (conditions.length === 0) return db.select().from(crmActivities).orderBy(desc(crmActivities.createdAt)).limit(50);
  return db.select().from(crmActivities)
    .where(conditions.length === 1 ? conditions[0] : or(...conditions))
    .orderBy(desc(crmActivities.createdAt));
}

export async function createCrmActivity(data: Omit<InsertCrmActivity, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(crmActivities).values(data);
  return result[0].insertId;
}

// ========== CRM: Stats ==========

export async function getCrmStats() {
  const db = await getDb();
  if (!db) return { totalClients: 0, activeDeals: 0, totalDealValue: 0, wonDeals: 0, lostDeals: 0 };
  const [clientCount] = await db.select({ count: count() }).from(crmClients);
  const [activeCount] = await db.select({ count: count() }).from(crmDeals)
    .where(and(
      ne(crmDeals.stage, "completed"),
      ne(crmDeals.stage, "lost")
    ));
  const [totalValue] = await db.select({ total: sql<number>`COALESCE(SUM(estimatedValue), 0)` }).from(crmDeals)
    .where(and(
      ne(crmDeals.stage, "completed"),
      ne(crmDeals.stage, "lost")
    ));
  const [wonCount] = await db.select({ count: count() }).from(crmDeals).where(eq(crmDeals.stage, "completed"));
  const [lostCount] = await db.select({ count: count() }).from(crmDeals).where(eq(crmDeals.stage, "lost"));
  return {
    totalClients: clientCount.count,
    activeDeals: activeCount.count,
    totalDealValue: totalValue.total || 0,
    wonDeals: wonCount.count,
    lostDeals: lostCount.count,
  };
}

// ========== Popup Queries ==========

export async function createPopup(data: InsertPopup) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(popups).values(data);
  return { success: true, id: result[0].insertId };
}

export async function listPopups() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(popups).orderBy(desc(popups.priority), desc(popups.createdAt));
}

export async function getActivePopups() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return db.select().from(popups).where(
    and(
      eq(popups.active, "yes"),
      or(isNull(popups.startsAt), lte(popups.startsAt, now)),
      or(isNull(popups.endsAt), gte(popups.endsAt, now)),
    )
  ).orderBy(desc(popups.priority), desc(popups.createdAt));
}

export async function updatePopup(id: number, data: Partial<InsertPopup>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(popups).set(data).where(eq(popups.id, id));
  return { success: true };
}

export async function deletePopup(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(popups).where(eq(popups.id, id));
  return { success: true };
}

// ========== Notification Queries ==========

export async function createNotification(data: Omit<InsertNotification, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(notifications).values(data);
  return result[0].insertId;
}

export async function listNotifications(opts?: { unreadOnly?: boolean; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const limit = opts?.limit ?? 50;
  if (opts?.unreadOnly) {
    return db.select().from(notifications)
      .where(eq(notifications.isRead, "no"))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }
  return db.select().from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount() {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db.select({ count: count() }).from(notifications)
    .where(eq(notifications.isRead, "no"));
  return row?.count ?? 0;
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: "yes" }).where(eq(notifications.id, id));
  return { success: true };
}

export async function markAllNotificationsRead() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: "yes" }).where(eq(notifications.isRead, "no"));
  return { success: true };
}

export async function deleteNotification(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(notifications).where(eq(notifications.id, id));
  return { success: true };
}
