import { eq, desc, count, and, lte, gte, or, isNull, isNotNull, ne, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, inquiries, subscribers, estimates, leadDownloads, chatSessions, styleRecommendations, announcements, portfolioDrafts, draftImages, driveSyncLog, spaceProjects, sensors, sensorData, spaceAnalysis, crmClients, crmInteractions, crmDeals, crmActivities, popups, notifications, portfolioReviews, insightArticles, newsletterSubscribers, newsletterCampaigns, type InsertInquiry, type InsertSubscriber, type InsertEstimate, type InsertLeadDownload, type InsertChatSession, type InsertStyleRecommendation, type InsertAnnouncement, type InsertPortfolioDraft, type InsertDraftImage, type InsertDriveSyncLog, type InsertSpaceProject, type InsertSensor, type InsertSensorData, type InsertSpaceAnalysis, type InsertCrmClient, type InsertCrmInteraction, type InsertCrmDeal, type InsertCrmActivity, type InsertPopup, type InsertNotification, type InsertPortfolioReview, type InsertInsightArticle, type InsertNewsletterSubscriber, type InsertNewsletterCampaign, subscriberSegments, subscriberTags, type InsertSubscriberSegment, type InsertSubscriberTag, clientProjects, clientFloorPlans, workSurveys, companyWideSurveys, companySurveyResponses, aiReports, meetingBookings, type InsertClientProject, type InsertClientFloorPlan, type InsertWorkSurvey, type InsertCompanyWideSurvey, type InsertCompanySurveyResponse, type InsertAiReport, type InsertMeetingBooking, downloadLogs, type InsertDownloadLog, spaceZones, type InsertSpaceZone, occupancyEvents, type InsertOccupancyEvent, zoneOccupancyStats, type InsertZoneOccupancyStat, sensorApiKeys, type InsertSensorApiKey, clients, type InsertClient, aiRedesigns, type InsertAiRedesign, siteSettings, type InsertSiteSetting, activityLogs, type InsertActivityLog, staffApplications, type InsertStaffApplication, staffInvitations, type InsertStaffInvitation, opsCameras, type InsertOpsCamera, opsCameraEvents, type InsertOpsCameraEvent, attendanceRecords, type InsertAttendanceRecord, leaveRequests, type InsertLeaveRequest, fieldMeasurementSessions, type InsertFieldMeasurementSession, panoramaImages, type InsertPanoramaImage, fieldMeasurements, type InsertFieldMeasurement, measurementReports, type InsertMeasurementReport, clientNotifications, type InsertClientNotification, workspaceJourneys, type InsertWorkspaceJourney, type WorkspaceJourney } from "../drizzle/schema";
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
    // 마스터 이메일 자동 승격 (최초 가입 시만)
    const MASTER_EMAIL = 'henrykkim@kokamdo.co.kr';
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.email?.toLowerCase() === MASTER_EMAIL.toLowerCase()) {
      values.role = 'master';
      // updateSet에는 role을 넣지 않아 이미 등록된 사용자의 역할을 덮어쓰지 않음
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

export async function bulkDeleteAnnouncements(ids: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (ids.length === 0) return { success: true, count: 0 };
  await db.delete(announcements).where(inArray(announcements.id, ids));
  return { success: true, count: ids.length };
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
  let drafts;
  if (status) {
    drafts = await db.select().from(portfolioDrafts)
      .where(eq(portfolioDrafts.status, status as any))
      .orderBy(portfolioDrafts.sortOrder, desc(portfolioDrafts.updatedAt));
  } else {
    drafts = await db.select().from(portfolioDrafts).orderBy(portfolioDrafts.sortOrder, desc(portfolioDrafts.updatedAt));
  }
  // Attach cover image URL for each draft
  const result = [];
  for (const draft of drafts) {
    const images = await db.select().from(draftImages)
      .where(eq(draftImages.draftId, draft.id))
      .orderBy(draftImages.sortOrder);
    const cover = images.find(img => img.isCover === "yes") || images[0];
    result.push({
      ...draft,
      coverImageUrl: cover?.processedUrl || cover?.originalUrl || null,
      imageCount: images.length,
      images: images.map(img => ({
        id: img.id,
        originalUrl: img.originalUrl,
        processedUrl: img.processedUrl,
        thumbnailUrl: img.thumbnailUrl,
        isCover: img.isCover,
        sortOrder: img.sortOrder,
        caption: img.caption,
      })),
    });
  }
  return result;
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

export async function reorderPortfolioDrafts(items: { id: number; sortOrder: number }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  for (const item of items) {
    await db.update(portfolioDrafts)
      .set({ sortOrder: item.sortOrder })
      .where(eq(portfolioDrafts.id, item.id));
  }
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
    .orderBy(portfolioDrafts.sortOrder, desc(portfolioDrafts.publishedAt));
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

export async function updateUserRole(userId: number, role: "user" | "admin" | "master") {
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

// ============================================================
// 다운로드 로깅 (지적재산권 보호)
// ============================================================

/**
 * 트래킹 코드 생성: 날짜 + 랜덤 해시
 */
export function generateTrackingCode(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `GGD-${datePart}-${randomPart}`;
}

/**
 * 다운로드 로그 기록
 */
export async function createDownloadLog(data: InsertDownloadLog) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(downloadLogs).values(data);
  return result[0]?.insertId ?? null;
}

/**
 * 다운로드 로그 목록 조회 (관리자용)
 */
export async function listDownloadLogs(opts: {
  fileType?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { logs: [], total: 0 };

  const conditions: any[] = [];
  if (opts.fileType) {
    conditions.push(eq(downloadLogs.fileType, opts.fileType as any));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalRows] = await Promise.all([
    db.select().from(downloadLogs)
      .where(where)
      .orderBy(desc(downloadLogs.createdAt))
      .limit(opts.limit ?? 50)
      .offset(opts.offset ?? 0),
    db.select({ count: count() }).from(downloadLogs).where(where),
  ]);

  return { logs: rows, total: totalRows[0]?.count ?? 0 };
}

/**
 * 트래킹 코드로 다운로드 로그 조회
 */
export async function getDownloadLogByTrackingCode(trackingCode: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(downloadLogs)
    .where(eq(downloadLogs.trackingCode, trackingCode))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * 특정 사용자의 다운로드 이력 조회
 */
export async function getDownloadLogsByUser(userEmail: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(downloadLogs)
    .where(eq(downloadLogs.userEmail, userEmail))
    .orderBy(desc(downloadLogs.createdAt));
}

/**
 * 다운로드 통계 (파일 유형별)
 */
export async function getDownloadStats() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    fileType: downloadLogs.fileType,
    count: count(),
  }).from(downloadLogs).groupBy(downloadLogs.fileType);
}

/**
 * 특정 시간 범위 내 사용자/IP별 다운로드 횟수 조회 (이상 감지용)
 */
export async function getRecentDownloadCount(opts: {
  userEmail?: string | null;
  ipAddress?: string | null;
  withinMinutes: number;
}) {
  const db = await getDb();
  if (!db) return 0;

  const cutoff = new Date(Date.now() - opts.withinMinutes * 60 * 1000);
  const conditions: any[] = [
    gte(downloadLogs.createdAt, cutoff),
  ];

  if (opts.userEmail) {
    conditions.push(eq(downloadLogs.userEmail, opts.userEmail));
  }
  if (opts.ipAddress) {
    conditions.push(eq(downloadLogs.ipAddress, opts.ipAddress));
  }

  const result = await db.select({ count: count() })
    .from(downloadLogs)
    .where(and(...conditions));

  return result[0]?.count ?? 0;
}

/**
 * 이상 감지 이력 조회 - 최근 N분 내 다운로드가 임계값을 초과한 사용자/IP 목록
 */
export async function getAnomalousDownloaders(opts: {
  withinMinutes: number;
  threshold: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const cutoff = new Date(Date.now() - opts.withinMinutes * 60 * 1000);

  // 이메일 기준 이상 감지
  const byEmail = await db.select({
    userEmail: downloadLogs.userEmail,
    userName: downloadLogs.userName,
    ipAddress: downloadLogs.ipAddress,
    count: count(),
  })
    .from(downloadLogs)
    .where(and(
      gte(downloadLogs.createdAt, cutoff),
      isNotNull(downloadLogs.userEmail),
    ))
    .groupBy(downloadLogs.userEmail, downloadLogs.userName, downloadLogs.ipAddress)
    .having(({ count: c }) => gte(c, opts.threshold));

  return byEmail;
}

// ========== DDIA: Space Zones ==========
export async function createSpaceZone(data: InsertSpaceZone) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(spaceZones).values(data).$returningId();
  return result;
}

export async function listSpaceZones(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(spaceZones).where(eq(spaceZones.projectId, projectId)).orderBy(spaceZones.name);
}

export async function updateSpaceZone(id: number, data: Partial<InsertSpaceZone>) {
  const db = await getDb();
  if (!db) return;
  await db.update(spaceZones).set(data).where(eq(spaceZones.id, id));
}

export async function deleteSpaceZone(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(spaceZones).where(eq(spaceZones.id, id));
}

// ========== DDIA: Occupancy Events ==========
export async function addOccupancyEvent(data: InsertOccupancyEvent) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(occupancyEvents).values(data).$returningId();
  return result;
}

export async function addOccupancyEventsBatch(rows: InsertOccupancyEvent[]) {
  const db = await getDb();
  if (!db) return;
  if (rows.length === 0) return;
  await db.insert(occupancyEvents).values(rows);
}

export async function getOccupancyEvents(projectId: number, from: Date, to: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(occupancyEvents)
    .where(and(
      eq(occupancyEvents.projectId, projectId),
      gte(occupancyEvents.eventAt, from),
      lte(occupancyEvents.eventAt, to),
    ))
    .orderBy(occupancyEvents.eventAt);
}

// ========== DDIA: Zone Occupancy Stats ==========
export async function upsertZoneOccupancyStat(data: InsertZoneOccupancyStat) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(zoneOccupancyStats).values(data).$returningId();
  return result;
}

export async function getZoneOccupancyStats(projectId: number, from: Date, to: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(zoneOccupancyStats)
    .where(and(
      eq(zoneOccupancyStats.projectId, projectId),
      gte(zoneOccupancyStats.bucketHour, from),
      lte(zoneOccupancyStats.bucketHour, to),
    ))
    .orderBy(zoneOccupancyStats.bucketHour);
}

export async function getZoneHeatmapData(projectId: number, from: Date, to: Date) {
  const db = await getDb();
  if (!db) return [];
  // 구역별 집계: 총 재실시간, 평균 재실인원, 입장횟수
  return db.select({
    zoneId: zoneOccupancyStats.zoneId,
    totalMinutes: sql<number>`SUM(${zoneOccupancyStats.totalMinutesOccupied})`,
    avgOccupancy: sql<number>`AVG(${zoneOccupancyStats.avgOccupancy})`,
    maxOccupancy: sql<number>`MAX(${zoneOccupancyStats.maxOccupancy})`,
    totalEnters: sql<number>`SUM(${zoneOccupancyStats.enterCount})`,
    totalExits: sql<number>`SUM(${zoneOccupancyStats.exitCount})`,
  }).from(zoneOccupancyStats)
    .where(and(
      eq(zoneOccupancyStats.projectId, projectId),
      gte(zoneOccupancyStats.bucketHour, from),
      lte(zoneOccupancyStats.bucketHour, to),
    ))
    .groupBy(zoneOccupancyStats.zoneId);
}

export async function getHourlyOccupancyPattern(projectId: number, zoneId: number, from: Date, to: Date) {
  const db = await getDb();
  if (!db) return [];
  const hourExpr = sql`HOUR(${zoneOccupancyStats.bucketHour})`;
  return db.select({
    hour: hourExpr.mapWith(Number).as("h"),
    avgOccupancy: sql<number>`AVG(${zoneOccupancyStats.avgOccupancy})`,
    maxOccupancy: sql<number>`MAX(${zoneOccupancyStats.maxOccupancy})`,
    totalMinutes: sql<number>`SUM(${zoneOccupancyStats.totalMinutesOccupied})`,
  }).from(zoneOccupancyStats)
    .where(and(
      eq(zoneOccupancyStats.projectId, projectId),
      eq(zoneOccupancyStats.zoneId, zoneId),
      gte(zoneOccupancyStats.bucketHour, from),
      lte(zoneOccupancyStats.bucketHour, to),
    ))
    .groupBy(sql`h`)
    .orderBy(sql`h`);
}

// 동선 분석: 구역 간 이동 패턴 (연속 이벤트 기반)
export async function getZoneTransitions(projectId: number, from: Date, to: Date) {
  const db = await getDb();
  if (!db) return [];
  // 연속된 enter 이벤트를 기반으로 구역 간 이동 패턴 추출
  const events = await db.select().from(occupancyEvents)
    .where(and(
      eq(occupancyEvents.projectId, projectId),
      eq(occupancyEvents.eventType, "enter"),
      gte(occupancyEvents.eventAt, from),
      lte(occupancyEvents.eventAt, to),
      isNotNull(occupancyEvents.zoneId),
    ))
    .orderBy(occupancyEvents.sensorId, occupancyEvents.eventAt);
  
  // 센서별로 그룹핑하여 연속 이동 추출
  const transitions: { fromZoneId: number; toZoneId: number; count: number; avgMinutes: number }[] = [];
  const transMap = new Map<string, { count: number; totalMs: number }>();
  
  let prevEvent: typeof events[0] | null = null;
  for (const ev of events) {
    if (prevEvent && prevEvent.sensorId === ev.sensorId && prevEvent.zoneId !== ev.zoneId) {
      const timeDiff = new Date(ev.eventAt).getTime() - new Date(prevEvent.eventAt).getTime();
      // 30분 이내 이동만 유효한 동선으로 간주
      if (timeDiff > 0 && timeDiff < 30 * 60 * 1000) {
        const key = `${prevEvent.zoneId}->${ev.zoneId}`;
        const existing = transMap.get(key) || { count: 0, totalMs: 0 };
        existing.count++;
        existing.totalMs += timeDiff;
        transMap.set(key, existing);
      }
    }
    prevEvent = ev;
  }
  
  for (const [key, val] of transMap) {
    const [from, to] = key.split("->").map(Number);
    transitions.push({
      fromZoneId: from,
      toZoneId: to,
      count: val.count,
      avgMinutes: Math.round(val.totalMs / val.count / 60000),
    });
  }
  
  return transitions.sort((a, b) => b.count - a.count);
}


// ============================================================
// 센서 API 키 관리
// ============================================================
export async function createSensorApiKey(data: InsertSensorApiKey) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(sensorApiKeys).values(data);
  return result;
}

export async function listSensorApiKeys(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sensorApiKeys).where(eq(sensorApiKeys.projectId, projectId)).orderBy(desc(sensorApiKeys.createdAt));
}

export async function getSensorApiKeyByKey(apiKey: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(sensorApiKeys).where(eq(sensorApiKeys.apiKey, apiKey)).limit(1);
  return rows[0] ?? null;
}

export async function revokeSensorApiKey(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(sensorApiKeys).set({ active: "no" }).where(eq(sensorApiKeys.id, id));
}

export async function incrementApiKeyUsage(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(sensorApiKeys).set({
    requestCount: sql`${sensorApiKeys.requestCount} + 1`,
    lastUsedAt: new Date(),
  }).where(eq(sensorApiKeys.id, id));
}

// ============================================================
// 고객 계정 관리
// ============================================================
export async function createClient(data: InsertClient) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(clients).values(data);
  return result;
}

export async function getClientByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(clients).where(eq(clients.email, email)).limit(1);
  return rows[0] ?? null;
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateClient(id: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) return;
  await db.update(clients).set(data).where(eq(clients.id, id));
}

export async function listClients() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clients).orderBy(desc(clients.createdAt));
}

export async function getClientByVerifyToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(clients).where(eq(clients.emailVerifyToken, token)).limit(1);
  return rows[0] ?? null;
}

export async function getClientByResetToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(clients).where(eq(clients.passwordResetToken, token)).limit(1);
  return rows[0] ?? null;
}


// ─── AI 공간 리디자인 ───
export async function createAiRedesign(data: InsertAiRedesign) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(aiRedesigns).values(data);
  return result[0].insertId;
}
export async function getAiRedesign(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(aiRedesigns).where(eq(aiRedesigns.id, id)).limit(1);
  return rows[0] ?? null;
}
export async function updateAiRedesign(id: number, data: Partial<InsertAiRedesign>) {
  const db = await getDb();
  if (!db) return;
  await db.update(aiRedesigns).set(data).where(eq(aiRedesigns.id, id));
}
export async function listAiRedesigns(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiRedesigns).orderBy(desc(aiRedesigns.createdAt)).limit(limit);
}


// ===== Site Settings Queries =====

export async function getSiteSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
  return result.length > 0 ? result[0].value : null;
}

export async function setSiteSetting(key: string, value: string, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(siteSettings).values({ key, value, description: description ?? null }).onDuplicateKeyUpdate({ set: { value } });
  return { success: true };
}

export async function listSiteSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(siteSettings).orderBy(siteSettings.key);
}

// ===== Staff Management: Delete User =====

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(users).where(eq(users.id, userId));
  return { success: true };
}


// ===== Activity Logs (마스터 전용) =====

export async function createActivityLog(log: Omit<InsertActivityLog, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(activityLogs).values(log).$returningId();
  return result?.id ?? null;
}

export async function listActivityLogs(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
}

// ===== 마스터 전용: 시스템 통계 =====

export async function getSystemStats() {
  const db = await getDb();
  if (!db) return null;

  const [userCount] = await db.select({ count: count() }).from(users);
  const [inquiryCount] = await db.select({ count: count() }).from(inquiries);
  const [estimateCount] = await db.select({ count: count() }).from(estimates);
  const [portfolioCount] = await db.select({ count: count() }).from(portfolioDrafts);
  const [crmClientCount] = await db.select({ count: count() }).from(crmClients);
  const [articleCount] = await db.select({ count: count() }).from(insightArticles);
  const [subscriberCount] = await db.select({ count: count() }).from(newsletterSubscribers);
  const [redesignCount] = await db.select({ count: count() }).from(aiRedesigns);
  const [settingCount] = await db.select({ count: count() }).from(siteSettings);

  // 역할별 사용자 수
  const roleStats = await db.select({
    role: users.role,
    count: count(),
  }).from(users).groupBy(users.role);

  return {
    totalUsers: userCount?.count ?? 0,
    totalInquiries: inquiryCount?.count ?? 0,
    totalEstimates: estimateCount?.count ?? 0,
    totalPortfolios: portfolioCount?.count ?? 0,
    totalCrmClients: crmClientCount?.count ?? 0,
    totalArticles: articleCount?.count ?? 0,
    totalSubscribers: subscriberCount?.count ?? 0,
    totalRedesigns: redesignCount?.count ?? 0,
    totalSettings: settingCount?.count ?? 0,
    roleDistribution: roleStats,
  };
}

// ===== 마스터 전용: 사이트 설정 초기화 =====

export async function resetSiteSettings() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 기본 설정값으로 초기화
  const defaults = [
    { key: "ai_features_enabled", value: "true", description: "AI 서비스 전체 마스터 토글" },
    { key: "ai_estimator_enabled", value: "true", description: "AI 견적 활성화" },
    { key: "ai_chat_enabled", value: "true", description: "AI 상담 활성화" },
    { key: "ai_style_enabled", value: "true", description: "AI 스타일 활성화" },
    { key: "ai_redesign_enabled", value: "true", description: "AI 리디자인 활성화" },
  ];

  for (const setting of defaults) {
    await db.insert(siteSettings)
      .values(setting)
      .onDuplicateKeyUpdate({ set: { value: setting.value } });
  }

  return { success: true, resetCount: defaults.length };
}

// ===== 마스터 전용: 전체 사용자 역할 일괄 초기화 (master 제외) =====

export async function resetAllUserRoles() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role: "user" }).where(ne(users.role, "master"));
  return { success: true };
}


// ============================================================
// E2E 비즈니스 프로세스 시스템 DB 헬퍼
// ============================================================

import {
  surveyTemplates, surveyQuestions, surveyQuestionOptions,
  surveyInstances, surveyResponses, surveyAnalysisReports,
  autoEmailLogs, realestateSearchCriteria, realestateMatches,
  programDiagrams, dailySiteReports, vendorQuotes, vendorQuoteItems,
  materialPriceHistory, materialPriceAnalytics,
  postOccupancySurveys, maintenanceVisits, insightSubscriptions,
  spaceOptimizationReports, kpiDefinitions, kpiRecords,
  okrObjectives, okrKeyResults, rewallProducts, rewallSubscriptions,
  type InsertSurveyTemplate, type InsertSurveyQuestion,
  type InsertSurveyQuestionOption, type InsertSurveyInstance,
  type InsertSurveyResponse, type InsertSurveyAnalysisReport,
  type InsertAutoEmailLog, type InsertRealestateSearchCriteria,
  type InsertRealestateMatch, type InsertProgramDiagram,
  type InsertDailySiteReport, type InsertVendorQuote,
  type InsertVendorQuoteItem, type InsertMaterialPriceHistory,
  type InsertMaterialPriceAnalytic, type InsertPostOccupancySurvey,
  type InsertMaintenanceVisit, type InsertInsightSubscription,
  type InsertSpaceOptimizationReport, type InsertKpiDefinition,
  type InsertKpiRecord, type InsertOkrObjective, type InsertOkrKeyResult,
} from "../drizzle/schema";

// ===== 설문 템플릿 =====

export async function createSurveyTemplate(data: InsertSurveyTemplate) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(surveyTemplates).values(data).$returningId();
  return result;
}

export async function getSurveyTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(surveyTemplates).where(eq(surveyTemplates.isActive, 1)).orderBy(surveyTemplates.createdAt);
}

export async function getSurveyTemplateById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.select().from(surveyTemplates).where(eq(surveyTemplates.id, id));
  return result ?? null;
}

// ===== 설문 질문 =====

export async function createSurveyQuestion(data: InsertSurveyQuestion) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(surveyQuestions).values(data).$returningId();
  return result;
}

export async function getQuestionsByTemplate(templateId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(surveyQuestions)
    .where(eq(surveyQuestions.templateId, templateId))
    .orderBy(surveyQuestions.sortOrder);
}

export async function updateSurveyQuestion(id: number, data: Partial<InsertSurveyQuestion>) {
  const db = await getDb();
  if (!db) return;
  await db.update(surveyQuestions).set(data).where(eq(surveyQuestions.id, id));
}

export async function deleteSurveyQuestion(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(surveyQuestionOptions).where(eq(surveyQuestionOptions.questionId, id));
  await db.delete(surveyQuestions).where(eq(surveyQuestions.id, id));
}

// ===== 설문 질문 선택지 =====

export async function createQuestionOptions(options: InsertSurveyQuestionOption[]) {
  const db = await getDb();
  if (!db) return;
  if (options.length > 0) await db.insert(surveyQuestionOptions).values(options);
}

export async function getOptionsByQuestion(questionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(surveyQuestionOptions)
    .where(eq(surveyQuestionOptions.questionId, questionId))
    .orderBy(surveyQuestionOptions.sortOrder);
}

// ===== 설문 인스턴스 =====

export async function createSurveyInstance(data: InsertSurveyInstance) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(surveyInstances).values(data).$returningId();
  return result;
}

export async function getSurveyInstanceByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.select().from(surveyInstances).where(eq(surveyInstances.token, token));
  return result ?? null;
}

export async function getSurveyInstancesByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(surveyInstances)
    .where(eq(surveyInstances.clientProjectId, projectId))
    .orderBy(desc(surveyInstances.createdAt));
}

export async function updateSurveyInstance(id: number, data: Partial<InsertSurveyInstance>) {
  const db = await getDb();
  if (!db) return;
  await db.update(surveyInstances).set(data).where(eq(surveyInstances.id, id));
}

// ===== 설문 응답 =====

export async function createSurveyResponse(data: InsertSurveyResponse) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(surveyResponses).values(data).$returningId();
  // 응답 수 증가
  await db.update(surveyInstances)
    .set({ responseCount: sql`${surveyInstances.responseCount} + 1` })
    .where(eq(surveyInstances.id, data.instanceId));
  return result;
}

export async function getResponsesByInstance(instanceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(surveyResponses)
    .where(eq(surveyResponses.instanceId, instanceId))
    .orderBy(surveyResponses.createdAt);
}

// ===== 설문 분석 리포트 =====

export async function createSurveyAnalysisReport(data: InsertSurveyAnalysisReport) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(surveyAnalysisReports).values(data).$returningId();
  return result;
}

export async function getAnalysisReportsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(surveyAnalysisReports)
    .where(eq(surveyAnalysisReports.clientProjectId, projectId))
    .orderBy(desc(surveyAnalysisReports.createdAt));
}

export async function getAnalysisReportById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.select().from(surveyAnalysisReports).where(eq(surveyAnalysisReports.id, id));
  return result ?? null;
}

// ===== 자동 이메일 로그 =====

export async function createAutoEmailLog(data: InsertAutoEmailLog) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(autoEmailLogs).values(data).$returningId();
  return result;
}

export async function getEmailLogsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(autoEmailLogs)
    .where(eq(autoEmailLogs.clientProjectId, projectId))
    .orderBy(desc(autoEmailLogs.createdAt));
}

// ===== 부동산 검색 조건 =====

export async function createRealestateSearch(data: InsertRealestateSearchCriteria) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(realestateSearchCriteria).values(data).$returningId();
  return result;
}

export async function getRealestateSearchByProject(projectId: number) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.select().from(realestateSearchCriteria)
    .where(eq(realestateSearchCriteria.clientProjectId, projectId));
  return result ?? null;
}

export async function updateRealestateSearch(id: number, data: Partial<InsertRealestateSearchCriteria>) {
  const db = await getDb();
  if (!db) return;
  await db.update(realestateSearchCriteria).set(data).where(eq(realestateSearchCriteria.id, id));
}

// ===== 부동산 매물 매칭 =====

export async function createRealestateMatch(data: InsertRealestateMatch) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(realestateMatches).values(data).$returningId();
  return result;
}

export async function getRealestateMatchesByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(realestateMatches)
    .where(eq(realestateMatches.clientProjectId, projectId))
    .orderBy(desc(realestateMatches.matchScore));
}

export async function updateRealestateMatch(id: number, data: Partial<InsertRealestateMatch>) {
  const db = await getDb();
  if (!db) return;
  await db.update(realestateMatches).set(data).where(eq(realestateMatches.id, id));
}

// ===== 프로그램 다이어그램 =====

export async function createProgramDiagram(data: InsertProgramDiagram) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(programDiagrams).values(data).$returningId();
  return result;
}

export async function getDiagramsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(programDiagrams)
    .where(eq(programDiagrams.clientProjectId, projectId))
    .orderBy(desc(programDiagrams.createdAt));
}

// ===== 일일 현장 보고서 =====

export async function createDailySiteReport(data: InsertDailySiteReport) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(dailySiteReports).values(data).$returningId();
  return result;
}

export async function getDailySiteReportsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dailySiteReports)
    .where(eq(dailySiteReports.projectId, projectId))
    .orderBy(desc(dailySiteReports.reportDate));
}

export async function getDailySiteReportById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.select().from(dailySiteReports).where(eq(dailySiteReports.id, id));
  return result ?? null;
}

export async function updateDailySiteReport(id: number, data: Partial<InsertDailySiteReport>) {
  const db = await getDb();
  if (!db) return;
  await db.update(dailySiteReports).set(data).where(eq(dailySiteReports.id, id));
}

// ===== 납품사 견적 =====

export async function createVendorQuote(data: InsertVendorQuote) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(vendorQuotes).values(data).$returningId();
  return result;
}

export async function getVendorQuotesByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vendorQuotes)
    .where(eq(vendorQuotes.projectId, projectId))
    .orderBy(desc(vendorQuotes.createdAt));
}

export async function getVendorQuoteById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.select().from(vendorQuotes).where(eq(vendorQuotes.id, id));
  return result ?? null;
}

export async function updateVendorQuote(id: number, data: Partial<InsertVendorQuote>) {
  const db = await getDb();
  if (!db) return;
  await db.update(vendorQuotes).set(data).where(eq(vendorQuotes.id, id));
}

// ===== 납품사 견적 항목 =====

export async function createVendorQuoteItems(items: InsertVendorQuoteItem[]) {
  const db = await getDb();
  if (!db) return;
  if (items.length > 0) await db.insert(vendorQuoteItems).values(items);
}

export async function getQuoteItemsByQuote(quoteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vendorQuoteItems)
    .where(eq(vendorQuoteItems.quoteId, quoteId))
    .orderBy(vendorQuoteItems.sortOrder);
}

// ===== 자재 단가 이력 =====

export async function createMaterialPriceRecord(data: InsertMaterialPriceHistory) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(materialPriceHistory).values(data).$returningId();
  return result;
}

export async function getMaterialPriceHistoryByCode(materialCode: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(materialPriceHistory)
    .where(eq(materialPriceHistory.materialCode, materialCode))
    .orderBy(desc(materialPriceHistory.priceDate));
}

// ===== 자재 단가 분석 =====

export async function upsertMaterialPriceAnalytic(data: InsertMaterialPriceAnalytic) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(materialPriceAnalytics)
    .where(eq(materialPriceAnalytics.materialCode, data.materialCode));
  if (existing.length > 0) {
    await db.update(materialPriceAnalytics).set(data)
      .where(eq(materialPriceAnalytics.materialCode, data.materialCode));
    return existing[0];
  }
  const [result] = await db.insert(materialPriceAnalytics).values(data).$returningId();
  return result;
}

export async function getMaterialPriceAnalytics() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(materialPriceAnalytics).orderBy(materialPriceAnalytics.category);
}

// ===== 입주 후 만족도 =====

export async function createPostOccupancySurvey(data: InsertPostOccupancySurvey) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(postOccupancySurveys).values(data).$returningId();
  return result;
}

export async function getPostOccupancyByProject(projectId: number) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.select().from(postOccupancySurveys)
    .where(eq(postOccupancySurveys.clientProjectId, projectId));
  return result ?? null;
}

// ===== 유지보수 방문 =====

export async function createMaintenanceVisit(data: InsertMaintenanceVisit) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(maintenanceVisits).values(data).$returningId();
  return result;
}

export async function getMaintenanceVisitsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(maintenanceVisits)
    .where(eq(maintenanceVisits.clientProjectId, projectId))
    .orderBy(desc(maintenanceVisits.scheduledDate));
}

export async function updateMaintenanceVisit(id: number, data: Partial<InsertMaintenanceVisit>) {
  const db = await getDb();
  if (!db) return;
  await db.update(maintenanceVisits).set(data).where(eq(maintenanceVisits.id, id));
}

// ===== OpsX Insight 구독 =====

export async function createInsightSubscription(data: InsertInsightSubscription) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(insightSubscriptions).values(data).$returningId();
  return result;
}

export async function getInsightSubscriptionByProject(projectId: number) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.select().from(insightSubscriptions)
    .where(eq(insightSubscriptions.clientProjectId, projectId));
  return result ?? null;
}

export async function updateInsightSubscription(id: number, data: Partial<InsertInsightSubscription>) {
  const db = await getDb();
  if (!db) return;
  await db.update(insightSubscriptions).set(data).where(eq(insightSubscriptions.id, id));
}

// ===== 공간 최적화 리포트 =====

export async function createSpaceOptimizationReport(data: InsertSpaceOptimizationReport) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(spaceOptimizationReports).values(data).$returningId();
  return result;
}

export async function getOptimizationReportsBySubscription(subscriptionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(spaceOptimizationReports)
    .where(eq(spaceOptimizationReports.subscriptionId, subscriptionId))
    .orderBy(desc(spaceOptimizationReports.createdAt));
}

// ===== KPI 정의 =====

export async function createKpiDefinition(data: InsertKpiDefinition) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(kpiDefinitions).values(data).$returningId();
  return result;
}

export async function getKpiDefinitions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(kpiDefinitions)
    .where(eq(kpiDefinitions.isActive, 1))
    .orderBy(kpiDefinitions.category);
}

export async function updateKpiDefinition(id: number, data: Partial<InsertKpiDefinition>) {
  const db = await getDb();
  if (!db) return;
  await db.update(kpiDefinitions).set(data).where(eq(kpiDefinitions.id, id));
}

// ===== KPI 기록 =====

export async function createKpiRecord(data: InsertKpiRecord) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(kpiRecords).values(data).$returningId();
  return result;
}

export async function getKpiRecordsByUser(userId: number, period?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(kpiRecords.userId, userId)];
  if (period) conditions.push(eq(kpiRecords.period, period));
  return db.select().from(kpiRecords).where(and(...conditions)).orderBy(kpiRecords.period);
}

export async function updateKpiRecord(id: number, data: Partial<InsertKpiRecord>) {
  const db = await getDb();
  if (!db) return;
  await db.update(kpiRecords).set(data).where(eq(kpiRecords.id, id));
}

// ===== OKR 목표 =====

export async function createOkrObjective(data: InsertOkrObjective) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(okrObjectives).values(data).$returningId();
  return result;
}

export async function getOkrObjectivesByUser(userId: number, period?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(okrObjectives.userId, userId)];
  if (period) conditions.push(eq(okrObjectives.period, period));
  return db.select().from(okrObjectives).where(and(...conditions)).orderBy(okrObjectives.createdAt);
}

export async function updateOkrObjective(id: number, data: Partial<InsertOkrObjective>) {
  const db = await getDb();
  if (!db) return;
  await db.update(okrObjectives).set(data).where(eq(okrObjectives.id, id));
}

// ===== OKR 핵심 결과 =====

export async function createOkrKeyResult(data: InsertOkrKeyResult) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(okrKeyResults).values(data).$returningId();
  return result;
}

export async function getKeyResultsByObjective(objectiveId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(okrKeyResults)
    .where(eq(okrKeyResults.objectiveId, objectiveId))
    .orderBy(okrKeyResults.createdAt);
}

export async function updateOkrKeyResult(id: number, data: Partial<InsertOkrKeyResult>) {
  const db = await getDb();
  if (!db) return;
  await db.update(okrKeyResults).set(data).where(eq(okrKeyResults.id, id));
}

// ============ 누락된 DB 헬퍼 함수 추가 ============

export async function getKpiDefinitionsByDepartment(department: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(kpiDefinitions)
    .where(eq(kpiDefinitions.department, department))
    .orderBy(kpiDefinitions.category);
}

export async function getKpiRecordsByDefinition(kpiDefinitionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(kpiRecords)
    .where(eq(kpiRecords.kpiDefinitionId, kpiDefinitionId))
    .orderBy(desc(kpiRecords.createdAt));
}

export async function getOkrObjectivesByPeriod(period: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(okrObjectives)
    .where(eq(okrObjectives.period, period))
    .orderBy(okrObjectives.level, okrObjectives.createdAt);
}

export async function getDailyReportsByUser(userId: number, limit: number = 30, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dailySiteReports)
    .where(eq(dailySiteReports.userId, userId))
    .orderBy(desc(dailySiteReports.reportDate))
    .limit(limit).offset(offset);
}

export async function getDailyReportsByProject(projectId: number, limit: number = 30, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dailySiteReports)
    .where(eq(dailySiteReports.projectId, projectId))
    .orderBy(desc(dailySiteReports.reportDate))
    .limit(limit).offset(offset);
}

export async function getDailyReportById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(dailySiteReports).where(eq(dailySiteReports.id, id));
  return rows[0] ?? null;
}

export async function updateDailyReport(id: number, data: Partial<InsertDailySiteReport> & { reviewedBy?: number; reviewedAt?: number }) {
  const db = await getDb();
  if (!db) return;
  await db.update(dailySiteReports).set(data).where(eq(dailySiteReports.id, id));
}


// ============================================================
// 소프트 삭제 & 복구 시스템 (Soft Delete & Restore)
// ============================================================

import { deletionLogs, type InsertDeletionLog } from "../drizzle/schema";

// 테이블 매핑: 삭제 대상 테이블 이름 → drizzle 테이블 참조
const SOFT_DELETE_TABLES: Record<string, any> = {
  inquiries,
  subscribers,
  estimates,
  lead_downloads: leadDownloads,
  chat_sessions: chatSessions,
  style_recommendations: styleRecommendations,
  ai_redesigns: aiRedesigns,
};

/** 소프트 삭제: 레코드를 삭제 로그에 백업 후 원본 삭제 */
export async function softDeleteRecord(
  tableName: string,
  recordId: number,
  deletedByUserId: number,
  deletedByUserName: string,
  reason?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const table = SOFT_DELETE_TABLES[tableName];
  if (!table) throw new Error(`Table "${tableName}" is not configured for soft delete`);
  
  // 1. 원본 데이터 조회
  const [record] = await db.select().from(table).where(eq(table.id, recordId));
  if (!record) throw new Error(`Record #${recordId} not found in ${tableName}`);
  
  // 2. 삭제 로그에 백업
  await db.insert(deletionLogs).values({
    tableName,
    recordId,
    recordData: record,
    deletedByUserId,
    deletedByUserName,
    reason: reason ?? null,
  });
  
  // 3. 원본 삭제
  await db.delete(table).where(eq(table.id, recordId));
  
  return { success: true, recordId };
}

/** 일괄 소프트 삭제: 여러 레코드를 한 번에 삭제 */
export async function bulkSoftDeleteRecords(
  tableName: string,
  recordIds: number[],
  deletedByUserId: number,
  deletedByUserName: string,
  reason?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const table = SOFT_DELETE_TABLES[tableName];
  if (!table) throw new Error(`Table "${tableName}" is not configured for soft delete`);
  
  // 1. 원본 데이터 일괄 조회
  const records = await db.select().from(table).where(inArray(table.id, recordIds));
  if (records.length === 0) return { success: true, deletedCount: 0 };
  
  // 2. 삭제 로그에 일괄 백업
  const logEntries = records.map((record: any) => ({
    tableName,
    recordId: record.id,
    recordData: record,
    deletedByUserId,
    deletedByUserName,
    reason: reason ?? null,
  }));
  
  await db.insert(deletionLogs).values(logEntries);
  
  // 3. 원본 일괄 삭제
  const foundIds = records.map((r: any) => r.id);
  await db.delete(table).where(inArray(table.id, foundIds));
  
  return { success: true, deletedCount: foundIds.length };
}

/** 삭제 로그 목록 조회 */
export async function listDeletionLogs(opts?: {
  tableName?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(deletionLogs).orderBy(desc(deletionLogs.createdAt));
  
  const conditions = [];
  if (opts?.tableName) {
    conditions.push(eq(deletionLogs.tableName, opts.tableName));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return query.limit(opts?.limit ?? 100).offset(opts?.offset ?? 0);
}

/** 삭제된 레코드 복구 */
export async function restoreDeletedRecord(
  logId: number,
  restoredByUserId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 1. 삭제 로그 조회
  const [log] = await db.select().from(deletionLogs).where(eq(deletionLogs.id, logId));
  if (!log) throw new Error(`Deletion log #${logId} not found`);
  if (log.restored === "yes") throw new Error("This record has already been restored");
  
  const table = SOFT_DELETE_TABLES[log.tableName];
  if (!table) throw new Error(`Table "${log.tableName}" is not configured for restore`);
  
  // 2. 원본 테이블에 데이터 복원
  const recordData = log.recordData as any;
  // id를 제거하여 새 레코드로 삽입 (auto-increment 충돌 방지)
  const { id: _id, ...restData } = recordData;
  
  try {
    // 원본 ID로 먼저 삽입 시도
    await db.insert(table).values(recordData);
  } catch {
    // ID 충돌 시 새 ID로 삽입
    await db.insert(table).values(restData);
  }
  
  // 3. 삭제 로그 업데이트 (복구 완료)
  await db.update(deletionLogs).set({
    restored: "yes",
    restoredByUserId,
    restoredAt: new Date(),
  }).where(eq(deletionLogs.id, logId));
  
  return { success: true, logId };
}

/** 삭제 로그 통계 */
export async function getDeletionLogStats() {
  const db = await getDb();
  if (!db) return { total: 0, restored: 0, byTable: [] };
  
  const [total] = await db.select({ count: count() }).from(deletionLogs);
  const [restored] = await db.select({ count: count() }).from(deletionLogs).where(eq(deletionLogs.restored, "yes"));
  
  return {
    total: total?.count ?? 0,
    restored: restored?.count ?? 0,
  };
}


// ============================================================
// 직원 가입신청 (Staff Applications)
// ============================================================

export async function createStaffApplication(data: Omit<InsertStaffApplication, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(staffApplications).values(data).$returningId();
  return result;
}

export async function listStaffApplications(status?: "pending" | "approved" | "rejected") {
  const db = await getDb();
  if (!db) return [];
  const conditions = status ? [eq(staffApplications.status, status)] : [];
  return db.select().from(staffApplications).where(conditions.length ? conditions[0] : undefined).orderBy(desc(staffApplications.createdAt));
}

export async function reviewStaffApplication(id: number, action: "approved" | "rejected", reviewedByUserId: number, rejectReason?: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(staffApplications).set({
    status: action,
    reviewedByUserId,
    reviewedAt: new Date(),
    rejectReason: rejectReason ?? null,
  }).where(eq(staffApplications.id, id));
}

export async function getStaffApplicationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [app] = await db.select().from(staffApplications).where(eq(staffApplications.id, id));
  return app ?? null;
}

export async function getStaffApplicationByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const [app] = await db.select().from(staffApplications).where(eq(staffApplications.email, email));
  return app ?? null;
}

// ============================================================
// 직원 초대 (Staff Invitations)
// ============================================================

export async function createStaffInvitation(data: Omit<InsertStaffInvitation, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(staffInvitations).values(data).$returningId();
  return result;
}

export async function listStaffInvitations(status?: "pending" | "accepted" | "expired" | "cancelled") {
  const db = await getDb();
  if (!db) return [];
  const conditions = status ? [eq(staffInvitations.status, status)] : [];
  return db.select().from(staffInvitations).where(conditions.length ? conditions[0] : undefined).orderBy(desc(staffInvitations.createdAt));
}

export async function getStaffInvitationByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const [inv] = await db.select().from(staffInvitations).where(eq(staffInvitations.token, token));
  return inv ?? null;
}

export async function acceptStaffInvitation(token: string, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(staffInvitations).set({
    status: "accepted",
    acceptedUserId: userId,
    acceptedAt: new Date(),
  }).where(eq(staffInvitations.token, token));
}

export async function cancelStaffInvitation(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(staffInvitations).set({ status: "cancelled" }).where(eq(staffInvitations.id, id));
}

// ============================================================
// 직원 비활성화/제거
// ============================================================

export async function deactivateStaffMember(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({
    isActive: 0,
  }).where(eq(users.id, userId));
}

export async function reactivateStaffMember(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({
    isActive: 1,
  }).where(eq(users.id, userId));
}

// ============================================================
// 현장 카메라 관리 (Site Camera Management)
// ============================================================

export async function listCameras(projectId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = projectId ? [eq(opsCameras.projectId, projectId)] : [];
  return db.select().from(opsCameras).where(conditions.length ? conditions[0] : undefined).orderBy(desc(opsCameras.createdAt));
}

export async function createCamera(data: Omit<InsertOpsCamera, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(opsCameras).values(data).$returningId();
  return result;
}

export async function updateCamera(id: number, data: Partial<Omit<InsertOpsCamera, "id" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) return;
  await db.update(opsCameras).set(data).where(eq(opsCameras.id, id));
}

export async function deleteCamera(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(opsCameras).where(eq(opsCameras.id, id));
}

export async function getCameraById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [cam] = await db.select().from(opsCameras).where(eq(opsCameras.id, id));
  return cam ?? null;
}

export async function listCameraEvents(cameraId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opsCameraEvents).where(eq(opsCameraEvents.cameraId, cameraId)).orderBy(desc(opsCameraEvents.createdAt)).limit(limit);
}

export async function createCameraEvent(data: Omit<InsertOpsCameraEvent, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(opsCameraEvents).values(data).$returningId();
  return result;
}

// ============================================================
// 출퇴근 기록 (Attendance Records)
// ============================================================
export async function clockIn(userId: number, data: { workType?: string; siteName?: string; memo?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(attendanceRecords).values({
    userId,
    clockInAt: new Date(),
    workType: (data.workType ?? "office") as any,
    siteName: data.siteName,
    memo: data.memo,
  }).$returningId();
  return result;
}

export async function clockOut(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const clockOutTime = new Date();
  const [record] = await db.select().from(attendanceRecords).where(eq(attendanceRecords.id, id));
  if (!record) return null;
  const totalMinutes = Math.round((clockOutTime.getTime() - new Date(record.clockInAt).getTime()) / 60000);
  await db.update(attendanceRecords).set({
    clockOutAt: clockOutTime,
    totalMinutes,
  }).where(eq(attendanceRecords.id, id));
  return { totalMinutes };
}

export async function getActiveAttendance(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rows = await db.select().from(attendanceRecords)
    .where(and(
      eq(attendanceRecords.userId, userId),
      gte(attendanceRecords.clockInAt, today),
      isNull(attendanceRecords.clockOutAt),
    ))
    .orderBy(desc(attendanceRecords.clockInAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function listMyAttendance(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(attendanceRecords.userId, userId)];
  if (startDate) conditions.push(gte(attendanceRecords.clockInAt, startDate));
  if (endDate) conditions.push(lte(attendanceRecords.clockInAt, endDate));
  return db.select().from(attendanceRecords)
    .where(and(...conditions))
    .orderBy(desc(attendanceRecords.clockInAt));
}

export async function listAllAttendance(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (startDate) conditions.push(gte(attendanceRecords.clockInAt, startDate));
  if (endDate) conditions.push(lte(attendanceRecords.clockInAt, endDate));
  return db.select({
    attendance: attendanceRecords,
    userName: users.name,
    userEmail: users.email,
  }).from(attendanceRecords)
    .leftJoin(users, eq(attendanceRecords.userId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(attendanceRecords.clockInAt));
}

// ============================================================
// 휴가 신청 (Leave Requests)
// ============================================================
export async function createLeaveRequest(userId: number, data: {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(leaveRequests).values({
    userId,
    leaveType: data.leaveType as any,
    startDate: data.startDate,
    endDate: data.endDate,
    reason: data.reason,
  }).$returningId();
  return result;
}

export async function listMyLeaves(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leaveRequests)
    .where(eq(leaveRequests.userId, userId))
    .orderBy(desc(leaveRequests.createdAt));
}

export async function listAllLeaves() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    leave: leaveRequests,
    userName: users.name,
    userEmail: users.email,
  }).from(leaveRequests)
    .leftJoin(users, eq(leaveRequests.userId, users.id))
    .orderBy(desc(leaveRequests.createdAt));
}

export async function updateLeaveStatus(id: number, status: string, approvedBy: number, reviewComment?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(leaveRequests).set({
    status: status as any,
    approvedBy,
    reviewedAt: new Date(),
    reviewComment,
  }).where(eq(leaveRequests.id, id));
  return { success: true };
}

export async function cancelLeave(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(leaveRequests).set({ status: "cancelled" as any })
    .where(and(eq(leaveRequests.id, id), eq(leaveRequests.userId, userId)));
  return { success: true };
}

// ============================================================
// 협력업체 RFQ 조회 (by subcontractor)
// ============================================================
export async function listRfqsBySubcontractorEmail(email: string) {
  const db = await getDb();
  if (!db) return [];
  const { opsSubcontractors, rfqRequests, purchaseOrders } = await import("../drizzle/schema");
  // 이메일로 협력업체 찾기
  const [sub] = await db.select().from(opsSubcontractors).where(eq(opsSubcontractors.contactEmail, email));
  if (!sub) return [];
  // 해당 업체의 RFQ 목록
  return db.select({
    rfq: rfqRequests,
    poTitle: purchaseOrders.title,
    poProjectId: purchaseOrders.projectId,
  }).from(rfqRequests)
    .leftJoin(purchaseOrders, eq(rfqRequests.purchaseOrderId, purchaseOrders.id))
    .where(eq(rfqRequests.subcontractorId, sub.id))
    .orderBy(desc(rfqRequests.createdAt));
}


// ===== 360도 현장 실측 (Field Measurement) =====

// --- 실측 세션 ---
export async function createMeasurementSession(data: InsertFieldMeasurementSession) {
  const db = await getDb();
  const result = await db.insert(fieldMeasurementSessions).values(data);
  return { id: result[0].insertId };
}

export async function listMeasurementSessions(filters?: { createdBy?: number; status?: string; opsProjectId?: number }) {
  const db = await getDb();
  const conditions = [];
  if (filters?.createdBy) conditions.push(eq(fieldMeasurementSessions.createdBy, filters.createdBy));
  if (filters?.status) conditions.push(eq(fieldMeasurementSessions.status, filters.status as any));
  if (filters?.opsProjectId) conditions.push(eq(fieldMeasurementSessions.opsProjectId, filters.opsProjectId));
  return db.select().from(fieldMeasurementSessions)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(fieldMeasurementSessions.createdAt));
}

export async function getMeasurementSession(id: number) {
  const db = await getDb();
  const rows = await db.select().from(fieldMeasurementSessions).where(eq(fieldMeasurementSessions.id, id));
  return rows[0] || null;
}

export async function updateMeasurementSession(id: number, data: Partial<InsertFieldMeasurementSession>) {
  const db = await getDb();
  await db.update(fieldMeasurementSessions).set(data).where(eq(fieldMeasurementSessions.id, id));
}

export async function deleteMeasurementSession(id: number) {
  const db = await getDb();
  await db.delete(fieldMeasurements).where(eq(fieldMeasurements.sessionId, id));
  await db.delete(panoramaImages).where(eq(panoramaImages.sessionId, id));
  await db.delete(measurementReports).where(eq(measurementReports.sessionId, id));
  await db.delete(fieldMeasurementSessions).where(eq(fieldMeasurementSessions.id, id));
}

// --- 파노라마 이미지 ---
export async function createPanoramaImage(data: InsertPanoramaImage) {
  const db = await getDb();
  const result = await db.insert(panoramaImages).values(data);
  return { id: result[0].insertId };
}

export async function listPanoramaImages(sessionId: number) {
  const db = await getDb();
  return db.select().from(panoramaImages)
    .where(eq(panoramaImages.sessionId, sessionId))
    .orderBy(panoramaImages.spotOrder);
}

export async function getPanoramaImage(id: number) {
  const db = await getDb();
  const rows = await db.select().from(panoramaImages).where(eq(panoramaImages.id, id));
  return rows[0] || null;
}

export async function updatePanoramaImage(id: number, data: Partial<InsertPanoramaImage>) {
  const db = await getDb();
  await db.update(panoramaImages).set(data).where(eq(panoramaImages.id, id));
}

export async function deletePanoramaImage(id: number) {
  const db = await getDb();
  await db.delete(fieldMeasurements).where(eq(fieldMeasurements.panoramaId, id));
  await db.delete(panoramaImages).where(eq(panoramaImages.id, id));
}

// --- 측정 데이터 ---
export async function createFieldMeasurement(data: InsertFieldMeasurement) {
  const db = await getDb();
  const result = await db.insert(fieldMeasurements).values(data);
  return { id: result[0].insertId };
}

export async function listFieldMeasurements(panoramaId: number) {
  const db = await getDb();
  return db.select().from(fieldMeasurements)
    .where(eq(fieldMeasurements.panoramaId, panoramaId))
    .orderBy(fieldMeasurements.createdAt);
}

export async function listSessionMeasurements(sessionId: number) {
  const db = await getDb();
  return db.select().from(fieldMeasurements)
    .where(eq(fieldMeasurements.sessionId, sessionId))
    .orderBy(fieldMeasurements.createdAt);
}

export async function updateFieldMeasurement(id: number, data: Partial<InsertFieldMeasurement>) {
  const db = await getDb();
  await db.update(fieldMeasurements).set(data).where(eq(fieldMeasurements.id, id));
}

export async function deleteFieldMeasurement(id: number) {
  const db = await getDb();
  await db.delete(fieldMeasurements).where(eq(fieldMeasurements.id, id));
}

// --- 실측 보고서 ---
export async function createMeasurementReport(data: InsertMeasurementReport) {
  const db = await getDb();
  const result = await db.insert(measurementReports).values(data);
  return { id: result[0].insertId };
}

export async function getMeasurementReport(sessionId: number) {
  const db = await getDb();
  const rows = await db.select().from(measurementReports)
    .where(eq(measurementReports.sessionId, sessionId))
    .orderBy(desc(measurementReports.createdAt));
  return rows[0] || null;
}

export async function updateMeasurementReport(id: number, data: Partial<InsertMeasurementReport>) {
  const db = await getDb();
  await db.update(measurementReports).set(data).where(eq(measurementReports.id, id));
}

// ===== Client Notification Queries =====

export async function createClientNotification(data: InsertClientNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(clientNotifications).values(data);
  return { success: true };
}

export async function listClientNotifications(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientNotifications)
    .where(eq(clientNotifications.clientId, clientId))
    .orderBy(desc(clientNotifications.createdAt));
}

export async function getUnreadClientNotificationCount(clientId: number) {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db.select({ count: count() }).from(clientNotifications)
    .where(and(eq(clientNotifications.clientId, clientId), eq(clientNotifications.isRead, "no")));
  return row?.count ?? 0;
}

export async function markClientNotificationRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clientNotifications).set({ isRead: "yes" }).where(eq(clientNotifications.id, id));
}

export async function markAllClientNotificationsRead(clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clientNotifications).set({ isRead: "yes" })
    .where(and(eq(clientNotifications.clientId, clientId), eq(clientNotifications.isRead, "no")));
}

export async function deleteClientNotification(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clientNotifications).where(eq(clientNotifications.id, id));
}

// ===== Workspace Journey (고객 여정) =====

export async function createWorkspaceJourney(data: InsertWorkspaceJourney) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(workspaceJourneys).values(data);
  return { success: true };
}

export async function getWorkspaceJourneyBySession(sessionId: string): Promise<WorkspaceJourney | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(workspaceJourneys).where(eq(workspaceJourneys.sessionId, sessionId)).limit(1);
  return rows[0];
}

export async function updateWorkspaceJourney(sessionId: string, data: Partial<InsertWorkspaceJourney>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(workspaceJourneys).set(data).where(eq(workspaceJourneys.sessionId, sessionId));
  return { success: true };
}

export async function getWorkspaceJourneyByReportToken(token: string): Promise<WorkspaceJourney | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(workspaceJourneys).where(eq(workspaceJourneys.reportToken, token)).limit(1);
  return rows[0];
}

export async function getWorkspaceJourneyBySurveyToken(token: string): Promise<WorkspaceJourney | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(workspaceJourneys).where(eq(workspaceJourneys.companySurveyToken, token)).limit(1);
  return rows[0];
}

export async function listWorkspaceJourneys() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workspaceJourneys).orderBy(desc(workspaceJourneys.createdAt));
}
