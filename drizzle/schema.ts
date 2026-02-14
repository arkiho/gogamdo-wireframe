import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 문의(Contact Inquiries)
 */
export const inquiries = mysqlTable("inquiries", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  company: varchar("company", { length: 200 }),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  type: varchar("type", { length: 50 }),
  budget: varchar("budget", { length: 50 }),
  area: varchar("area", { length: 50 }),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["new", "contacted", "in_progress", "completed"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;

/**
 * 뉴스레터 구독자(Newsletter Subscribers)
 */
export const subscribers = mysqlTable("subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 100 }),
  company: varchar("company", { length: 200 }),
  source: varchar("source", { length: 50 }).default("footer"),
  active: mysqlEnum("active", ["yes", "no"]).default("yes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = typeof subscribers.$inferInsert;

/**
 * AI 견적 기록(Estimate Records)
 */
export const estimates = mysqlTable("estimates", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }),
  spaceType: varchar("spaceType", { length: 50 }),
  area: int("area"),
  grade: varchar("grade", { length: 30 }),
  resultJson: json("resultJson"),
  totalMin: int("totalMin"),
  totalMax: int("totalMax"),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactName: varchar("contactName", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Estimate = typeof estimates.$inferSelect;
export type InsertEstimate = typeof estimates.$inferInsert;

/**
 * 리드 마그넷 다운로드 기록(Lead Magnet Downloads)
 */
export const leadDownloads = mysqlTable("lead_downloads", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 100 }),
  company: varchar("company", { length: 200 }),
  resourceId: varchar("resourceId", { length: 50 }).notNull(),
  resourceTitle: varchar("resourceTitle", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LeadDownload = typeof leadDownloads.$inferSelect;
export type InsertLeadDownload = typeof leadDownloads.$inferInsert;

/**
 * AI 상담 챗봇 세션(AI Chat Sessions)
 */
export const chatSessions = mysqlTable("chat_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull().unique(),
  messages: json("messages").$type<Array<{ role: string; content: string }>>(),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactName: varchar("contactName", { length: 100 }),
  contactPhone: varchar("contactPhone", { length: 30 }),
  summary: text("summary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;

/**
 * AI 공간 스타일 추천 기록(Style Recommendations)
 */
export const styleRecommendations = mysqlTable("style_recommendations", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  industry: varchar("industry", { length: 100 }),
  teamSize: varchar("teamSize", { length: 50 }),
  mood: varchar("mood", { length: 100 }),
  budget: varchar("budget", { length: 50 }),
  priorities: json("priorities").$type<string[]>(),
  resultJson: json("resultJson"),
  imageUrl: text("imageUrl"),
  contactEmail: varchar("contactEmail", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StyleRecommendation = typeof styleRecommendations.$inferSelect;
export type InsertStyleRecommendation = typeof styleRecommendations.$inferInsert;

/**
 * 공지 배너(Announcement Banners)
 */
export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  linkUrl: varchar("linkUrl", { length: 500 }),
  linkText: varchar("linkText", { length: 100 }),
  bgColor: varchar("bgColor", { length: 20 }).default("#111111"),
  textColor: varchar("textColor", { length: 20 }).default("#ffffff"),
  active: mysqlEnum("active", ["yes", "no"]).default("yes").notNull(),
  priority: int("priority").default(0),
  startsAt: timestamp("startsAt"),
  endsAt: timestamp("endsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

/**
 * 포트폴리오 초안(Portfolio Drafts)
 * 구글 드라이브에서 자동 생성되거나 수동으로 만든 포트폴리오 초안
 * status: draft(초안) → review(검토중) → published(게시됨) → archived(보관)
 */
export const portfolioDrafts = mysqlTable("portfolio_drafts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  projectName: varchar("projectName", { length: 200 }),
  category: varchar("category", { length: 100 }),
  client: varchar("client", { length: 200 }),
  area: varchar("area", { length: 50 }),
  location: varchar("location", { length: 200 }),
  duration: varchar("duration", { length: 100 }),
  description: text("description"),
  aiDescription: text("aiDescription"),
  tags: json("tags").$type<string[]>(),
  status: mysqlEnum("status", ["draft", "review", "published", "archived"]).default("draft").notNull(),
  driveFolder: varchar("driveFolder", { length: 500 }),
  driveFolderId: varchar("driveFolderId", { length: 200 }),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PortfolioDraft = typeof portfolioDrafts.$inferSelect;
export type InsertPortfolioDraft = typeof portfolioDrafts.$inferInsert;

/**
 * 포트폴리오 초안 이미지(Draft Images)
 * 각 초안에 연결된 이미지들 (원본 + AI 보정본)
 */
export const draftImages = mysqlTable("draft_images", {
  id: int("id").autoincrement().primaryKey(),
  draftId: int("draftId").notNull(),
  originalUrl: text("originalUrl").notNull(),
  beforeUrl: text("beforeUrl"),
  processedUrl: text("processedUrl"),
  watermarkedUrl: text("watermarkedUrl"),
  thumbnailUrl: text("thumbnailUrl"),
  filename: varchar("filename", { length: 300 }),
  driveFileId: varchar("driveFileId", { length: 200 }),
  aiProcessed: mysqlEnum("aiProcessed", ["yes", "no"]).default("no").notNull(),
  processingStatus: mysqlEnum("processingStatus", ["pending", "processing", "done", "error"]).default("pending").notNull(),
  sortOrder: int("sortOrder").default(0),
  isCover: mysqlEnum("isCover", ["yes", "no"]).default("no").notNull(),
  caption: text("caption"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DraftImage = typeof draftImages.$inferSelect;
export type InsertDraftImage = typeof draftImages.$inferInsert;

/**
 * 구글 드라이브 동기화 기록(Drive Sync Log)
 * 어떤 폴더/파일이 이미 동기화되었는지 추적
 */
export const driveSyncLog = mysqlTable("drive_sync_log", {
  id: int("id").autoincrement().primaryKey(),
  folderId: varchar("folderId", { length: 200 }).notNull(),
  folderPath: varchar("folderPath", { length: 500 }),
  fileCount: int("fileCount").default(0),
  draftId: int("draftId"),
  syncStatus: mysqlEnum("syncStatus", ["syncing", "done", "error"]).default("syncing").notNull(),
  lastSyncAt: timestamp("lastSyncAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DriveSyncLog = typeof driveSyncLog.$inferSelect;
export type InsertDriveSyncLog = typeof driveSyncLog.$inferInsert;

/**
 * DDIA: 공간 분석 프로젝트(Space Analysis Projects)
 * 센서 데이터 수집 및 공간 분석을 위한 프로젝트 단위
 */
export const spaceProjects = mysqlTable("space_projects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 300 }).notNull(),
  client: varchar("client", { length: 200 }),
  location: varchar("location", { length: 300 }),
  area: varchar("area", { length: 50 }),
  floorPlanUrl: text("floorPlanUrl"),
  floorPlanWidth: int("floorPlanWidth"),
  floorPlanHeight: int("floorPlanHeight"),
  description: text("description"),
  status: mysqlEnum("status", ["setup", "collecting", "analyzing", "completed"]).default("setup").notNull(),
  analysisReport: json("analysisReport"),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SpaceProject = typeof spaceProjects.$inferSelect;
export type InsertSpaceProject = typeof spaceProjects.$inferInsert;

/**
 * DDIA: 센서 정의(Sensors)
 * 평면도에 배치된 개별 센서 (온도, 습도, 조도, CO2, 소음, 동선 등)
 */
export const sensors = mysqlTable("sensors", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: mysqlEnum("type", [
    "temperature", "humidity", "illuminance", "co2", "noise",
    "occupancy", "motion", "air_quality", "power"
  ]).notNull(),
  unit: varchar("unit", { length: 20 }),
  posX: int("posX"),
  posY: int("posY"),
  zone: varchar("zone", { length: 100 }),
  deviceId: varchar("deviceId", { length: 100 }),
  active: mysqlEnum("active", ["yes", "no"]).default("yes").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Sensor = typeof sensors.$inferSelect;
export type InsertSensor = typeof sensors.$inferInsert;

/**
 * DDIA: 센서 데이터(Sensor Data)
 * 각 센서에서 수집된 시계열 데이터
 */
export const sensorData = mysqlTable("sensor_data", {
  id: int("id").autoincrement().primaryKey(),
  sensorId: int("sensorId").notNull(),
  projectId: int("projectId").notNull(),
  value: varchar("value", { length: 50 }).notNull(),
  recordedAt: timestamp("recordedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SensorDataRow = typeof sensorData.$inferSelect;
export type InsertSensorData = typeof sensorData.$inferInsert;

/**
 * DDIA: 공간 분석 결과(Space Analysis)
 * 센서 데이터를 기반으로 AI가 분석한 공간 인사이트
 */
export const spaceAnalysis = mysqlTable("space_analysis", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  zone: varchar("zone", { length: 100 }),
  analysisType: mysqlEnum("analysisType", [
    "occupancy_pattern", "environmental", "energy", "comfort", "traffic_flow"
  ]).notNull(),
  summary: text("summary"),
  dataJson: json("dataJson"),
  recommendations: json("recommendations").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SpaceAnalysisRow = typeof spaceAnalysis.$inferSelect;
export type InsertSpaceAnalysis = typeof spaceAnalysis.$inferInsert;

/**
 * CRM: 고객(Clients)
 * 인테리어 프로젝트 고객 정보 관리
 */
export const crmClients = mysqlTable("crm_clients", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 200 }).notNull(),
  contactName: varchar("contactName", { length: 100 }).notNull(),
  contactTitle: varchar("contactTitle", { length: 100 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  address: text("address"),
  industry: varchar("industry", { length: 100 }),
  companySize: varchar("companySize", { length: 50 }),
  source: mysqlEnum("source", [
    "website", "referral", "cold_call", "exhibition", "sns", "other"
  ]).default("website"),
  notes: text("notes"),
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CrmClientRow = typeof crmClients.$inferSelect;
export type InsertCrmClient = typeof crmClients.$inferInsert;

/**
 * CRM: 상담 이력(Interactions)
 * 고객과의 모든 커뮤니케이션 기록
 */
export const crmInteractions = mysqlTable("crm_interactions", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  type: mysqlEnum("type", [
    "phone_call", "email", "meeting", "site_visit", "video_call", "kakao", "note"
  ]).notNull(),
  subject: varchar("subject", { length: 300 }).notNull(),
  content: text("content"),
  outcome: text("outcome"),
  nextAction: text("nextAction"),
  nextActionDate: timestamp("nextActionDate"),
  assignedTo: varchar("assignedTo", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CrmInteractionRow = typeof crmInteractions.$inferSelect;
export type InsertCrmInteraction = typeof crmInteractions.$inferInsert;

/**
 * CRM: 프로젝트 파이프라인(Deals)
 * 영업 기회 및 프로젝트 진행 상태 추적
 */
export const crmDeals = mysqlTable("crm_deals", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  stage: mysqlEnum("stage", [
    "lead", "consultation", "proposal", "negotiation", "contract", "design", "construction", "completed", "lost"
  ]).default("lead").notNull(),
  estimatedValue: int("estimatedValue"),
  actualValue: int("actualValue"),
  area: varchar("area", { length: 50 }),
  spaceType: mysqlEnum("spaceType", [
    "office", "commercial", "medical", "education", "residential", "other"
  ]),
  startDate: timestamp("startDate"),
  expectedEndDate: timestamp("expectedEndDate"),
  actualEndDate: timestamp("actualEndDate"),
  assignedTo: varchar("assignedTo", { length: 100 }),
  probability: int("probability"),
  description: text("description"),
  lostReason: text("lostReason"),
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CrmDealRow = typeof crmDeals.$inferSelect;
export type InsertCrmDeal = typeof crmDeals.$inferInsert;

/**
 * CRM: 활동 로그(Activities)
 * 딜/고객 관련 모든 활동 타임라인
 */
export const crmActivities = mysqlTable("crm_activities", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId"),
  clientId: int("clientId"),
  type: mysqlEnum("type", [
    "stage_change", "note", "task", "file_upload", "email_sent", "call_logged", "meeting_scheduled"
  ]).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  metadata: json("metadata"),
  createdBy: varchar("createdBy", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CrmActivityRow = typeof crmActivities.$inferSelect;
export type InsertCrmActivity = typeof crmActivities.$inferInsert;
