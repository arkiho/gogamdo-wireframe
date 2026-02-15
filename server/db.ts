import { eq, desc, count, and, lte, gte, or, isNull, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, inquiries, subscribers, estimates, leadDownloads, chatSessions, styleRecommendations, announcements, portfolioDrafts, draftImages, driveSyncLog, spaceProjects, sensors, sensorData, spaceAnalysis, crmClients, crmInteractions, crmDeals, crmActivities, popups, notifications, portfolioReviews, insightArticles, newsletterSubscribers, newsletterCampaigns, type InsertInquiry, type InsertSubscriber, type InsertEstimate, type InsertLeadDownload, type InsertChatSession, type InsertStyleRecommendation, type InsertAnnouncement, type InsertPortfolioDraft, type InsertDraftImage, type InsertDriveSyncLog, type InsertSpaceProject, type InsertSensor, type InsertSensorData, type InsertSpaceAnalysis, type InsertCrmClient, type InsertCrmInteraction, type InsertCrmDeal, type InsertCrmActivity, type InsertPopup, type InsertNotification, type InsertPortfolioReview, type InsertInsightArticle, type InsertNewsletterSubscriber, type InsertNewsletterCampaign, subscriberSegments, subscriberTags, type InsertSubscriberSegment, type InsertSubscriberTag, clientProjects, clientFloorPlans, workSurveys, companyWideSurveys, companySurveyResponses, aiReports, meetingBookings, type InsertClientProject, type InsertClientFloorPlan, type InsertWorkSurvey, type InsertCompanyWideSurvey, type InsertCompanySurveyResponse, type InsertAiReport, type InsertMeetingBooking } from "../drizzle/schema";
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

// ============================================================
// 설계 자동화 시스템 (Design Automation Pipeline)
// ============================================================
import {
  designProjects, floorPlans, rfpData, layoutOptions, renderings, tourVideos, proposals, detailedEstimates,
  type InsertDesignProject, type InsertFloorPlan, type InsertRfpData, type InsertLayoutOption,
  type InsertRendering, type InsertTourVideo, type InsertProposal, type InsertDetailedEstimate,
} from "../drizzle/schema";

// --- Design Projects ---
export async function createDesignProject(data: Omit<InsertDesignProject, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(designProjects).values(data as any);
  return result[0].insertId;
}

export async function listDesignProjects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(designProjects).orderBy(desc(designProjects.createdAt));
}

export async function getDesignProject(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(designProjects).where(eq(designProjects.id, id));
  return rows[0] ?? null;
}

export async function updateDesignProject(id: number, data: Partial<InsertDesignProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(designProjects).set(data as any).where(eq(designProjects.id, id));
  return { success: true };
}

export async function deleteDesignProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(designProjects).where(eq(designProjects.id, id));
  return { success: true };
}

// --- Floor Plans ---
export async function addFloorPlan(data: Omit<InsertFloorPlan, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(floorPlans).values(data as any);
  return result[0].insertId;
}

export async function listFloorPlans(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(floorPlans).where(eq(floorPlans.projectId, projectId)).orderBy(floorPlans.sortOrder);
}

export async function getFloorPlan(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(floorPlans).where(eq(floorPlans.id, id));
  return rows[0] ?? null;
}

export async function updateFloorPlan(id: number, data: Partial<InsertFloorPlan>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(floorPlans).set(data as any).where(eq(floorPlans.id, id));
  return { success: true };
}

export async function deleteFloorPlan(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(floorPlans).where(eq(floorPlans.id, id));
  return { success: true };
}

// --- RFP Data ---
export async function createRfpData(data: Omit<InsertRfpData, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(rfpData).values(data as any);
  return result[0].insertId;
}

export async function getRfpData(projectId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(rfpData).where(eq(rfpData.projectId, projectId)).orderBy(desc(rfpData.updatedAt));
  return rows[0] ?? null;
}

export async function updateRfpData(id: number, data: Partial<InsertRfpData>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(rfpData).set(data as any).where(eq(rfpData.id, id));
  return { success: true };
}

// --- Layout Options ---
export async function createLayoutOption(data: Omit<InsertLayoutOption, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(layoutOptions).values(data as any);
  return result[0].insertId;
}

export async function listLayoutOptions(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(layoutOptions).where(eq(layoutOptions.projectId, projectId));
}

export async function updateLayoutOption(id: number, data: Partial<InsertLayoutOption>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(layoutOptions).set(data as any).where(eq(layoutOptions.id, id));
  return { success: true };
}

export async function deleteLayoutOption(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(layoutOptions).where(eq(layoutOptions.id, id));
  return { success: true };
}

// --- Renderings ---
export async function createRendering(data: Omit<InsertRendering, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(renderings).values(data as any);
  return result[0].insertId;
}

export async function listRenderings(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(renderings).where(eq(renderings.projectId, projectId)).orderBy(renderings.sortOrder);
}

export async function updateRendering(id: number, data: Partial<InsertRendering>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(renderings).set(data as any).where(eq(renderings.id, id));
  return { success: true };
}

export async function deleteRendering(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(renderings).where(eq(renderings.id, id));
  return { success: true };
}

// --- Tour Videos ---
export async function createTourVideo(data: Omit<InsertTourVideo, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tourVideos).values(data as any);
  return result[0].insertId;
}

export async function listTourVideos(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tourVideos).where(eq(tourVideos.projectId, projectId));
}

export async function updateTourVideo(id: number, data: Partial<InsertTourVideo>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(tourVideos).set(data as any).where(eq(tourVideos.id, id));
  return { success: true };
}

// --- Proposals ---
export async function createProposal(data: Omit<InsertProposal, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(proposals).values(data as any);
  return result[0].insertId;
}

export async function listProposals(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(proposals).where(eq(proposals.projectId, projectId)).orderBy(desc(proposals.version));
}

export async function getProposal(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(proposals).where(eq(proposals.id, id));
  return rows[0] ?? null;
}

export async function updateProposal(id: number, data: Partial<InsertProposal>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(proposals).set(data as any).where(eq(proposals.id, id));
  return { success: true };
}

// --- Detailed Estimates ---
export async function createDetailedEstimate(data: Omit<InsertDetailedEstimate, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(detailedEstimates).values(data as any);
  return result[0].insertId;
}

export async function listDetailedEstimates(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(detailedEstimates).where(eq(detailedEstimates.projectId, projectId)).orderBy(desc(detailedEstimates.version));
}

export async function getDetailedEstimate(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(detailedEstimates).where(eq(detailedEstimates.id, id));
  return rows[0] ?? null;
}

export async function updateDetailedEstimate(id: number, data: Partial<InsertDetailedEstimate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(detailedEstimates).set(data as any).where(eq(detailedEstimates.id, id));
  return { success: true };
}

// ============================================================
// 포트폴리오 담당자 리뷰 (Portfolio Reviews)
// ============================================================

export async function createPortfolioReview(data: Partial<InsertPortfolioReview>) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(portfolioReviews).values(data as any);
  return result[0].insertId;
}

export async function listPortfolioReviews(portfolioId?: number, status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (portfolioId) conditions.push(eq(portfolioReviews.portfolioId, portfolioId));
  if (status) conditions.push(eq(portfolioReviews.status, status as any));
  if (conditions.length > 0) {
    return db.select().from(portfolioReviews).where(and(...conditions)).orderBy(desc(portfolioReviews.createdAt));
  }
  return db.select().from(portfolioReviews).orderBy(desc(portfolioReviews.createdAt));
}

export async function getPortfolioReview(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(portfolioReviews).where(eq(portfolioReviews.id, id));
  return rows[0] || null;
}

export async function getPortfolioReviewByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(portfolioReviews).where(eq(portfolioReviews.accessToken, token));
  return rows[0] || null;
}

export async function updatePortfolioReview(id: number, data: Partial<InsertPortfolioReview>) {
  const db = await getDb();
  if (!db) return false;
  await db.update(portfolioReviews).set(data as any).where(eq(portfolioReviews.id, id));
  return true;
}

export async function deletePortfolioReview(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(portfolioReviews).where(eq(portfolioReviews.id, id));
  return true;
}

export async function getApprovedReviewsForPortfolio(portfolioId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(portfolioReviews)
    .where(and(
      eq(portfolioReviews.portfolioId, portfolioId),
      eq(portfolioReviews.status, "approved")
    ))
    .orderBy(desc(portfolioReviews.approvedAt));
}

// ==================== 인사이트 아티클 ====================

export async function createInsightArticle(data: InsertInsightArticle) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(insightArticles).values(data);
  return result[0].insertId;
}

export async function getInsightArticleBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(insightArticles).where(eq(insightArticles.slug, slug)).limit(1);
  return result[0] || null;
}

export async function getInsightArticleById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(insightArticles).where(eq(insightArticles.id, id)).limit(1);
  return result[0] || null;
}

export async function getPublishedArticles(category?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(insightArticles.status, "published")];
  if (category && category !== "all") {
    conditions.push(eq(insightArticles.category, category as any));
  }
  return db.select().from(insightArticles)
    .where(and(...conditions))
    .orderBy(desc(insightArticles.publishedAt));
}

export async function getAllArticles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(insightArticles).orderBy(desc(insightArticles.createdAt));
}

export async function updateInsightArticle(id: number, data: Partial<InsertInsightArticle>) {
  const db = await getDb();
  if (!db) return;
  await db.update(insightArticles).set(data).where(eq(insightArticles.id, id));
}

export async function incrementArticleViewCount(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(insightArticles)
    .set({ viewCount: sql`${insightArticles.viewCount} + 1` })
    .where(eq(insightArticles.id, id));
}

export async function deleteInsightArticle(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(insightArticles).where(eq(insightArticles.id, id));
}

// ==================== 뉴스레터 구독자 ====================

export async function createNewsletterSubscriber(data: InsertNewsletterSubscriber) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(newsletterSubscribers).values(data);
  return result[0].insertId;
}

export async function getSubscriberByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, email)).limit(1);
  return result[0] || null;
}

export async function getSubscriberByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.unsubscribeToken, token)).limit(1);
  return result[0] || null;
}

export async function getActiveSubscribers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.status, "active"))
    .orderBy(desc(newsletterSubscribers.subscribedAt));
}

export async function getAllNewsletterSubscribers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.subscribedAt));
}

export async function updateNewsletterSubscriber(id: number, data: Partial<InsertNewsletterSubscriber>) {
  const db = await getDb();
  if (!db) return;
  await db.update(newsletterSubscribers).set(data).where(eq(newsletterSubscribers.id, id));
}

export async function unsubscribeByToken(token: string) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(newsletterSubscribers)
    .set({ status: "unsubscribed", unsubscribedAt: new Date() })
    .where(and(eq(newsletterSubscribers.unsubscribeToken, token), eq(newsletterSubscribers.status, "active")));
  return (result[0] as any).affectedRows > 0;
}

// ==================== 뉴스레터 캠페인 ====================

export async function createNewsletterCampaign(data: InsertNewsletterCampaign) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(newsletterCampaigns).values(data);
  return result[0].insertId;
}

export async function getNewsletterCampaign(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(newsletterCampaigns).where(eq(newsletterCampaigns.id, id)).limit(1);
  return result[0] || null;
}

export async function getAllCampaigns() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(newsletterCampaigns).orderBy(desc(newsletterCampaigns.createdAt));
}

export async function updateCampaign(id: number, data: Partial<InsertNewsletterCampaign>) {
  const db = await getDb();
  if (!db) return;
  await db.update(newsletterCampaigns).set(data).where(eq(newsletterCampaigns.id, id));
}

export async function deleteCampaign(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(newsletterCampaigns).where(eq(newsletterCampaigns.id, id));
}

// ===== 구독자 세그먼트 =====

export async function createSegment(data: InsertSubscriberSegment) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(subscriberSegments).values(data).$returningId();
  return result;
}

export async function getSegmentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(subscriberSegments).where(eq(subscriberSegments.id, id));
  return row || null;
}

export async function getAllSegments() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriberSegments).orderBy(desc(subscriberSegments.createdAt));
}

export async function updateSegment(id: number, data: Partial<InsertSubscriberSegment>) {
  const db = await getDb();
  if (!db) return;
  await db.update(subscriberSegments).set(data).where(eq(subscriberSegments.id, id));
}

export async function deleteSegment(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(subscriberSegments).where(eq(subscriberSegments.id, id));
}

/**
 * 세그먼트 조건에 맞는 활성 구독자 필터링
 */
export async function getSubscribersBySegment(segmentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const segment = await getSegmentById(segmentId);
  if (!segment || !segment.filterConditions) return [];
  
  const conditions = segment.filterConditions;
  const filters: any[] = [eq(newsletterSubscribers.status, "active")];
  
  // 유입 경로 필터
  if (conditions.sources && conditions.sources.length > 0) {
    filters.push(
      or(...conditions.sources.map((s: string) => eq(newsletterSubscribers.source, s as any)))
    );
  }
  
  // 구독일 범위 필터
  if (conditions.subscribedAfter) {
    filters.push(gte(newsletterSubscribers.subscribedAt, new Date(conditions.subscribedAfter)));
  }
  if (conditions.subscribedBefore) {
    filters.push(lte(newsletterSubscribers.subscribedAt, new Date(conditions.subscribedBefore)));
  }
  
  // 회사 유무 필터
  if (conditions.hasCompany === true) {
    filters.push(and(
      ne(newsletterSubscribers.company, ""),
      sql`${newsletterSubscribers.company} IS NOT NULL`
    ));
  }
  
  const baseSubscribers = await db.select().from(newsletterSubscribers).where(and(...filters));
  
  // 태그 필터 (있는 경우)
  if (conditions.tags && conditions.tags.length > 0) {
    const subscriberIds = baseSubscribers.map(s => s.id);
    if (subscriberIds.length === 0) return [];
    
    const taggedSubs = await db.select().from(subscriberTags)
      .where(and(
        or(...conditions.tags.map((t: string) => eq(subscriberTags.tag, t))),
        or(...subscriberIds.map(id => eq(subscriberTags.subscriberId, id)))
      ));
    
    const taggedIds = new Set(taggedSubs.map(t => t.subscriberId));
    return baseSubscribers.filter(s => taggedIds.has(s.id));
  }
  
  return baseSubscribers;
}

/**
 * 세그먼트 매칭 구독자 수 업데이트
 */
export async function updateSegmentMatchCount(segmentId: number) {
  const matched = await getSubscribersBySegment(segmentId);
  await updateSegment(segmentId, { 
    matchCount: matched.length, 
    lastCalculatedAt: new Date() 
  });
  return matched.length;
}

// ===== 구독자 태그 =====

export async function addSubscriberTag(subscriberId: number, tag: string) {
  const db = await getDb();
  if (!db) return null;
  // 중복 방지
  const existing = await db.select().from(subscriberTags)
    .where(and(eq(subscriberTags.subscriberId, subscriberId), eq(subscriberTags.tag, tag)));
  if (existing.length > 0) return existing[0];
  const [result] = await db.insert(subscriberTags).values({ subscriberId, tag }).$returningId();
  return result;
}

export async function removeSubscriberTag(subscriberId: number, tag: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(subscriberTags)
    .where(and(eq(subscriberTags.subscriberId, subscriberId), eq(subscriberTags.tag, tag)));
}

export async function getSubscriberTags(subscriberId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriberTags).where(eq(subscriberTags.subscriberId, subscriberId));
}

export async function getAllUniqueTags() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.selectDistinct({ tag: subscriberTags.tag }).from(subscriberTags);
  return rows.map(r => r.tag);
}

export async function bulkAddTags(subscriberIds: number[], tag: string) {
  const db = await getDb();
  if (!db) return;
  for (const subId of subscriberIds) {
    await addSubscriberTag(subId, tag);
  }
}


// ============================================================
// 고객 셀프서비스 파이프라인 DB 헬퍼
// ============================================================

// --- Client Projects ---
export async function createClientProject(data: InsertClientProject) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(clientProjects).values(data).$returningId();
  return result;
}

export async function getClientProjectsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientProjects).where(eq(clientProjects.userId, userId)).orderBy(desc(clientProjects.createdAt));
}

export async function getClientProjectById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(clientProjects).where(eq(clientProjects.id, id));
  return rows[0] ?? null;
}

export async function updateClientProjectStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(clientProjects).set({ status: status as any }).where(eq(clientProjects.id, id));
}

export async function updateClientProject(id: number, data: Partial<InsertClientProject>) {
  const db = await getDb();
  if (!db) return;
  await db.update(clientProjects).set(data).where(eq(clientProjects.id, id));
}

export async function getAllClientProjects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientProjects).orderBy(desc(clientProjects.createdAt));
}

// --- Client Floor Plans ---
export async function createClientFloorPlan(data: InsertClientFloorPlan) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(clientFloorPlans).values(data).$returningId();
  return result;
}

export async function getFloorPlansByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientFloorPlans).where(eq(clientFloorPlans.projectId, projectId)).orderBy(clientFloorPlans.floorNumber);
}

export async function updateFloorPlanAnalysis(id: number, analysis: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(clientFloorPlans).set({ aiAnalysis: analysis }).where(eq(clientFloorPlans.id, id));
}

// --- Work Surveys ---
export async function createWorkSurvey(data: InsertWorkSurvey) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(workSurveys).values(data).$returningId();
  return result;
}

export async function getWorkSurveyByProject(projectId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(workSurveys).where(eq(workSurveys.projectId, projectId));
  return rows[0] ?? null;
}

export async function completeWorkSurvey(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(workSurveys).set({ completedAt: new Date() }).where(eq(workSurveys.id, id));
}

// --- Company-Wide Surveys ---
export async function createCompanyWideSurvey(data: InsertCompanyWideSurvey) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(companyWideSurveys).values(data).$returningId();
  return result;
}

export async function getCompanySurveyByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(companyWideSurveys).where(eq(companyWideSurveys.token, token));
  return rows[0] ?? null;
}

export async function getCompanySurveysByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companyWideSurveys).where(eq(companyWideSurveys.projectId, projectId)).orderBy(desc(companyWideSurveys.createdAt));
}

export async function incrementSurveyResponseCount(surveyId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(companyWideSurveys).set({ responseCount: sql`${companyWideSurveys.responseCount} + 1` }).where(eq(companyWideSurveys.id, surveyId));
}

// --- Company Survey Responses ---
export async function createCompanySurveyResponse(data: InsertCompanySurveyResponse) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(companySurveyResponses).values(data).$returningId();
  return result;
}

export async function getResponsesBySurvey(surveyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companySurveyResponses).where(eq(companySurveyResponses.surveyId, surveyId)).orderBy(desc(companySurveyResponses.submittedAt));
}

export async function getSurveyResponseStats(surveyId: number) {
  const db = await getDb();
  if (!db) return null;
  const responses = await getResponsesBySurvey(surveyId);
  if (responses.length === 0) return null;
  
  const avg = (field: keyof typeof responses[0]) => {
    const vals = responses.map(r => r[field]).filter(v => v != null) as number[];
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };
  
  return {
    totalResponses: responses.length,
    avgOverallSatisfaction: avg("overallSatisfaction"),
    avgNoiseSatisfaction: avg("noiseSatisfaction"),
    avgLightingSatisfaction: avg("lightingSatisfaction"),
    avgTemperatureSatisfaction: avg("temperatureSatisfaction"),
    avgSpaceSatisfaction: avg("spaceSatisfaction"),
    avgPrivacySatisfaction: avg("privacySatisfaction"),
    avgDeskUsageHours: avg("deskUsageHours"),
    departments: [...new Set(responses.map(r => r.department).filter(Boolean))],
  };
}

// --- AI Reports ---
export async function createAiReport(data: InsertAiReport) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(aiReports).values(data).$returningId();
  return result;
}

export async function getReportsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiReports).where(eq(aiReports.projectId, projectId)).orderBy(desc(aiReports.createdAt));
}

export async function markReportSent(id: number, email: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(aiReports).set({ emailSentAt: new Date(), emailSentTo: email }).where(eq(aiReports.id, id));
}

// --- Meeting Bookings ---
export async function createMeetingBooking(data: InsertMeetingBooking) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(meetingBookings).values(data).$returningId();
  return result;
}

export async function getMeetingsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(meetingBookings).where(eq(meetingBookings.projectId, projectId)).orderBy(desc(meetingBookings.createdAt));
}

export async function getAllMeetings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(meetingBookings).orderBy(desc(meetingBookings.createdAt));
}

export async function updateMeetingStatus(id: number, status: string, adminNotes?: string, confirmedDate?: string, confirmedTime?: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(meetingBookings).set({ 
    status: status as any, 
    adminNotes: adminNotes ?? undefined,
    confirmedDate: confirmedDate ?? undefined,
    confirmedTime: confirmedTime ?? undefined,
  }).where(eq(meetingBookings.id, id));
}

// ============ STAFF MANAGEMENT ============

export async function listStaffMembers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(users.name);
}

export async function updateUserDepartment(userId: number, department: string, opsRole: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ department: department as any, opsRole: opsRole as any }).where(eq(users.id, userId));
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return rows[0] ?? null;
}
