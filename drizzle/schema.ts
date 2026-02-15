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

/**
 * 팝업 알림(Popup Notifications)
 * 사이트 방문자에게 표시되는 팝업 (이벤트, 공지 등)
 */
export const popups = mysqlTable("popups", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  linkUrl: varchar("linkUrl", { length: 500 }),
  linkText: varchar("linkText", { length: 100 }),
  position: mysqlEnum("position", ["center", "bottom_right", "bottom_left"]).default("center").notNull(),
  showOnce: mysqlEnum("showOnce", ["yes", "no"]).default("no").notNull(),
  active: mysqlEnum("active", ["yes", "no"]).default("yes").notNull(),
  priority: int("priority").default(0),
  startsAt: timestamp("startsAt"),
  endsAt: timestamp("endsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PopupRow = typeof popups.$inferSelect;
export type InsertPopup = typeof popups.$inferInsert;

/**
 * 관리자 알림(Admin Notifications)
 * 문의, 견적, CRM 이벤트 등 관리자에게 전달되는 알림
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", [
    "inquiry", "estimate", "crm_deal", "crm_stage_change", "newsletter", "chat", "system"
  ]).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  message: text("message").notNull(),
  linkUrl: varchar("linkUrl", { length: 500 }),
  metadata: json("metadata"),
  isRead: mysqlEnum("isRead", ["yes", "no"]).default("no").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NotificationRow = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * ============================================================
 * 설계 자동화 시스템 (Design Automation Pipeline)
 * ============================================================
 */

/**
 * 설계 자동화: 프로젝트(Design Projects)
 * 도면 업로드 → RFP → 레이아웃 → 렌더링 → 제안서 → 견적서 전체 파이프라인 관리
 */
export const designProjects = mysqlTable("design_projects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 300 }).notNull(),
  clientId: int("clientId"),
  crmDealId: int("crmDealId"),
  companyName: varchar("companyName", { length: 200 }),
  contactName: varchar("contactName", { length: 100 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 30 }),
  stage: mysqlEnum("stage", [
    "floorplan", "rfp", "analysis", "layout", "rendering", "proposal", "estimate", "completed"
  ]).default("floorplan").notNull(),
  status: mysqlEnum("status", ["active", "paused", "completed", "archived"]).default("active").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DesignProject = typeof designProjects.$inferSelect;
export type InsertDesignProject = typeof designProjects.$inferInsert;

/**
 * 설계 자동화: 도면(Floor Plans)
 * 업로드된 PDF/이미지 도면 및 AI 분석 결과
 */
export const floorPlans = mysqlTable("floor_plans", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 500 }),
  fileName: varchar("fileName", { length: 300 }),
  fileType: varchar("fileType", { length: 50 }),
  fileSize: int("fileSize"),
  totalArea: varchar("totalArea", { length: 50 }),
  floors: int("floors"),
  roomCount: int("roomCount"),
  aiAnalysis: json("aiAnalysis"),
  analysisStatus: mysqlEnum("analysisStatus", ["pending", "analyzing", "done", "error"]).default("pending").notNull(),
  analysisError: text("analysisError"),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FloorPlan = typeof floorPlans.$inferSelect;
export type InsertFloorPlan = typeof floorPlans.$inferInsert;

/**
 * 설계 자동화: RFP 데이터(RFP Data)
 * 고객 요구사항 수집 결과 (직접 입력 / AI 생성 / 챗봇 수집)
 */
export const rfpData = mysqlTable("rfp_data", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  collectionMethod: mysqlEnum("collectionMethod", ["form", "ai_generator", "chatbot"]).default("form").notNull(),
  
  // 기본 정보
  companyName: varchar("companyName", { length: 200 }),
  industry: varchar("industry", { length: 100 }),
  foundedYear: int("foundedYear"),
  projectType: mysqlEnum("projectType", ["new_office", "relocation", "renovation", "expansion"]),
  currentAddress: text("currentAddress"),
  newAddress: text("newAddress"),
  
  // 공간 요구사항
  totalArea: varchar("totalArea", { length: 50 }),
  currentHeadcount: int("currentHeadcount"),
  plannedHeadcount1y: int("plannedHeadcount1y"),
  plannedHeadcount3y: int("plannedHeadcount3y"),
  departments: json("departments").$type<Array<{name: string; headcount: number; characteristics?: string}>>(),
  spaceRequirements: json("spaceRequirements").$type<{
    workstationType?: string;
    executiveRooms?: number;
    meetingRoomsSmall?: number;
    meetingRoomsMedium?: number;
    meetingRoomsLarge?: number;
    conferenceRoom?: boolean;
    lounge?: boolean;
    cafeteria?: boolean;
    phoneBooth?: number;
    focusRoom?: number;
    serverRoom?: boolean;
    storageRoom?: boolean;
    reception?: boolean;
    nursingRoom?: boolean;
    prayerRoom?: boolean;
    otherSpaces?: string;
  }>(),
  
  // 디자인 선호도
  preferredStyle: varchar("preferredStyle", { length: 100 }),
  brandColors: json("brandColors").$type<string[]>(),
  brandGuidelineUrl: text("brandGuidelineUrl"),
  referenceImages: json("referenceImages").$type<string[]>(),
  referenceUrls: json("referenceUrls").$type<string[]>(),
  preferredMaterials: json("preferredMaterials").$type<string[]>(),
  lightingPreference: varchar("lightingPreference", { length: 200 }),
  
  // 기능 요구사항
  avItRequirements: text("avItRequirements"),
  networkInfra: text("networkInfra"),
  securitySystem: text("securitySystem"),
  acousticPrivacy: varchar("acousticPrivacy", { length: 100 }),
  hvacRequirements: text("hvacRequirements"),
  esgRequirements: text("esgRequirements"),
  
  // 예산 및 일정
  budgetRange: varchar("budgetRange", { length: 100 }),
  budgetInclDesign: mysqlEnum("budgetInclDesign", ["yes", "no", "separate"]),
  priorityOrder: varchar("priorityOrder", { length: 200 }),
  desiredStartDate: timestamp("desiredStartDate"),
  desiredEndDate: timestamp("desiredEndDate"),
  occupiedDuringWork: mysqlEnum("occupiedDuringWork", ["yes", "no", "partial"]),
  
  // 기타
  buildingRestrictions: text("buildingRestrictions"),
  reuseExistingFurniture: mysqlEnum("reuseExistingFurniture", ["yes", "no", "partial"]),
  specialRequests: text("specialRequests"),
  competitorBenchmarks: text("competitorBenchmarks"),
  
  // AI 요약
  aiSummary: text("aiSummary"),
  completionRate: int("completionRate").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RfpDataRow = typeof rfpData.$inferSelect;
export type InsertRfpData = typeof rfpData.$inferInsert;

/**
 * 설계 자동화: AI 레이아웃(Layout Options)
 * AI가 생성한 공간 배치 옵션들
 */
export const layoutOptions = mysqlTable("layout_options", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  optionName: varchar("optionName", { length: 100 }).notNull(),
  concept: text("concept"),
  layoutImageUrl: text("layoutImageUrl"),
  layoutData: json("layoutData"),
  spaceAllocation: json("spaceAllocation").$type<Array<{
    zone: string;
    area: string;
    percentage: number;
    description: string;
  }>>(),
  pros: json("pros").$type<string[]>(),
  cons: json("cons").$type<string[]>(),
  aiScore: int("aiScore"),
  isSelected: mysqlEnum("isSelected", ["yes", "no"]).default("no").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LayoutOption = typeof layoutOptions.$inferSelect;
export type InsertLayoutOption = typeof layoutOptions.$inferInsert;

/**
 * 설계 자동화: AI 렌더링(Renderings)
 * 주요 공간별 포토리얼리스틱 렌더링 이미지
 */
export const renderings = mysqlTable("renderings", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  layoutId: int("layoutId"),
  spaceType: varchar("spaceType", { length: 100 }).notNull(),
  spaceName: varchar("spaceName", { length: 200 }),
  prompt: text("prompt"),
  imageUrl: text("imageUrl"),
  thumbnailUrl: text("thumbnailUrl"),
  style: varchar("style", { length: 100 }),
  status: mysqlEnum("status", ["pending", "generating", "done", "error"]).default("pending").notNull(),
  error: text("error"),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Rendering = typeof renderings.$inferSelect;
export type InsertRendering = typeof renderings.$inferInsert;

/**
 * 설계 자동화: 투어 영상(Tour Videos)
 * 렌더링 기반 워크스루 영상
 */
export const tourVideos = mysqlTable("tour_videos", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 300 }),
  videoUrl: text("videoUrl"),
  thumbnailUrl: text("thumbnailUrl"),
  duration: int("duration"),
  renderingIds: json("renderingIds").$type<number[]>(),
  status: mysqlEnum("status", ["pending", "generating", "done", "error"]).default("pending").notNull(),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TourVideo = typeof tourVideos.$inferSelect;
export type InsertTourVideo = typeof tourVideos.$inferInsert;

/**
 * 설계 자동화: 제안서(Proposals)
 * AI가 생성한 프로젝트 제안서
 */
export const proposals = mysqlTable("proposals", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  version: int("version").default(1),
  title: varchar("title", { length: 300 }).notNull(),
  
  // 제안서 구성 요소
  clientAnalysis: json("clientAnalysis"),
  designConcept: text("designConcept"),
  spaceProgram: json("spaceProgram"),
  materialPlan: json("materialPlan"),
  furniturePlan: json("furniturePlan"),
  projectTimeline: json("projectTimeline"),
  companyIntro: text("companyIntro"),
  differentiators: json("differentiators").$type<string[]>(),
  
  // 생성된 파일
  pdfUrl: text("pdfUrl"),
  pptUrl: text("pptUrl"),
  
  status: mysqlEnum("status", ["draft", "generating", "review", "final"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = typeof proposals.$inferInsert;

/**
 * 설계 자동화: 견적서(Detailed Estimates)
 * 공종별 상세 견적 산출
 */
export const detailedEstimates = mysqlTable("detailed_estimates", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  proposalId: int("proposalId"),
  version: int("version").default(1),
  title: varchar("title", { length: 300 }).notNull(),
  
  // 견적 항목
  items: json("items").$type<Array<{
    category: string;
    subcategory: string;
    item: string;
    specification: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    remarks?: string;
  }>>(),
  
  // 합계
  subtotal: int("subtotal"),
  vat: int("vat"),
  totalAmount: int("totalAmount"),
  
  // 옵션별 견적
  optionItems: json("optionItems").$type<Array<{
    name: string;
    description: string;
    amount: number;
  }>>(),
  
  // 생성된 파일
  pdfUrl: text("pdfUrl"),
  excelUrl: text("excelUrl"),
  
  notes: text("notes"),
  validUntil: timestamp("validUntil"),
  status: mysqlEnum("status", ["draft", "generating", "review", "final", "sent"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DetailedEstimate = typeof detailedEstimates.$inferSelect;
export type InsertDetailedEstimate = typeof detailedEstimates.$inferInsert;

/**
 * 포트폴리오 담당자 리뷰(Portfolio Reviews)
 * 프로젝트 담당자가 토큰 기반으로 접근하여 리뷰를 작성하고, 관리자가 승인하면 공개됨
 * 흐름: 관리자가 리뷰 요청 생성(토큰 발급) → 담당자에게 링크 전달 → 담당자 리뷰 작성 → 관리자 승인 → 공개
 */
export const portfolioReviews = mysqlTable("portfolio_reviews", {
  id: int("id").autoincrement().primaryKey(),
  portfolioId: int("portfolioId").notNull(), // portfolioDrafts.id
  
  // 담당자 정보
  reviewerName: varchar("reviewerName", { length: 100 }).notNull(),
  reviewerTitle: varchar("reviewerTitle", { length: 100 }), // 직책
  reviewerCompany: varchar("reviewerCompany", { length: 200 }), // 회사명
  reviewerEmail: varchar("reviewerEmail", { length: 320 }),
  reviewerPhone: varchar("reviewerPhone", { length: 30 }),
  reviewerPhotoUrl: text("reviewerPhotoUrl"), // 프로필 사진
  
  // 리뷰 내용
  rating: int("rating"), // 1~5점
  title: varchar("title", { length: 300 }), // 리뷰 제목
  content: text("content"), // 리뷰 본문
  highlights: json("highlights").$type<string[]>(), // 특히 좋았던 점 (태그형)
  
  // 토큰 기반 접근
  accessToken: varchar("accessToken", { length: 64 }).notNull().unique(), // 담당자 접근용 고유 토큰
  tokenExpiresAt: timestamp("tokenExpiresAt"), // 토큰 만료일
  
  // 승인 관리
  status: mysqlEnum("status", ["pending", "submitted", "approved", "rejected"]).default("pending").notNull(),
  adminNote: text("adminNote"), // 관리자 메모 (거절 사유 등)
  approvedAt: timestamp("approvedAt"),
  submittedAt: timestamp("submittedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PortfolioReview = typeof portfolioReviews.$inferSelect;
export type InsertPortfolioReview = typeof portfolioReviews.$inferInsert;

/**
 * 인사이트 아티클(Insight Articles)
 * 블로그/인사이트 콘텐츠 관리
 */
export const insightArticles = mysqlTable("insight_articles", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  title: varchar("title", { length: 500 }).notNull(),
  subtitle: varchar("subtitle", { length: 500 }),
  category: mysqlEnum("category", ["trend", "cost_guide", "case_study", "tip", "news"]).notNull(),
  
  // 콘텐츠
  excerpt: text("excerpt").notNull(), // 요약문
  content: text("content").notNull(), // 마크다운 본문
  coverImageUrl: text("coverImageUrl"), // 커버 이미지
  
  // 메타
  author: varchar("author", { length: 100 }).default("고감도 편집팀"),
  readTimeMinutes: int("readTimeMinutes").default(5),
  tags: json("tags").$type<string[]>(),
  
  // SEO
  metaTitle: varchar("metaTitle", { length: 200 }),
  metaDescription: text("metaDescription"),
  
  // 상태
  featured: boolean("featured").default(false),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  publishedAt: timestamp("publishedAt"),
  
  // 통계
  viewCount: int("viewCount").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InsightArticle = typeof insightArticles.$inferSelect;
export type InsertInsightArticle = typeof insightArticles.$inferInsert;

/**
 * 뉴스레터 구독자(Newsletter Subscribers)
 */
export const newsletterSubscribers = mysqlTable("newsletter_subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 100 }),
  company: varchar("company", { length: 200 }),
  
  // 구독 관리
  status: mysqlEnum("status", ["active", "unsubscribed", "bounced"]).default("active").notNull(),
  unsubscribeToken: varchar("unsubscribeToken", { length: 64 }).notNull().unique(),
  
  // 출처
  source: mysqlEnum("source", ["website", "contact_form", "manual", "lead_magnet"]).default("website"),
  
  subscribedAt: timestamp("subscribedAt").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;

/**
 * 뉴스레터 캠페인(Newsletter Campaigns)
 * 발송 이력 관리
 */
export const newsletterCampaigns = mysqlTable("newsletter_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(), // 이메일 제목
  previewText: varchar("previewText", { length: 300 }), // 미리보기 텍스트
  
  // 콘텐츠
  articleIds: json("articleIds").$type<number[]>(), // 포함할 아티클 ID 목록
  customContent: text("customContent"), // 추가 커스텀 콘텐츠 (마크다운)
  htmlContent: text("htmlContent"), // 생성된 HTML 이메일
  
  // 발송 정보
  status: mysqlEnum("status", ["draft", "scheduled", "sending", "sent", "failed"]).default("draft").notNull(),
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  
  // 통계
  recipientCount: int("recipientCount").default(0),
  openCount: int("openCount").default(0),
  clickCount: int("clickCount").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NewsletterCampaign = typeof newsletterCampaigns.$inferSelect;
export type InsertNewsletterCampaign = typeof newsletterCampaigns.$inferInsert;
