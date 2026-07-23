import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, decimal, tinyint, longtext } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  googleId: varchar("googleId", { length: 128 }).unique(),
  naverId: varchar("naverId", { length: 128 }).unique(),
  kakaoId: varchar("kakaoId", { length: 128 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("passwordHash", { length: 256 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "master"]).default("user").notNull(),
  department: mysqlEnum("department", [
    "design",        // 설계팀
    "construction",  // 시공팀
    "accounting",    // 경리부
    "management",    // 경영지원
    "sales",         // 영업팀
    "none",          // 미배정
  ]).default("none"),
  // 4팀 조직 구조 (STAFF_UI). nullable — 미배정 허용.
  team: mysqlEnum("team", [
    "executive",     // 대표자
    "management",    // 경영지원
    "construction",  // 공사팀
    "design",        // 설계팀
  ]),
  opsRole: mysqlEnum("opsRole", [
    "pm",            // 프로젝트 매니저
    "designer",      // 설계 담당
    "site_manager",  // 현장 소장
    "accountant",    // 경리 담당
    "director",      // 이사/임원
    "staff",         // 일반 직원
  ]).default("staff"),
  phone: varchar("phone", { length: 20 }),
  isActive: tinyint("isActive").default(1).notNull(),
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
  // 유입 경로 (어떻게 알게 되셨나요) — AEO 귀속 추적 (C-10)
  referralSource: varchar("referralSource", { length: 50 }),
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
  challenge: text("challenge"),
  solution: text("solution"),
  result: text("result"),
  tags: json("tags").$type<string[]>(),
  sortOrder: int("sortOrder").default(0).notNull(),
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
 * DDIA: 구역 정의(Space Zones)
 * 평면도 위에 정의된 구역 영역 (폴리곤 좌표)
 */
export const spaceZones = mysqlTable("space_zones", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 20 }).default("#3b82f6"),
  /** 폴리곤 좌표 배열 [{x: 0-1000, y: 0-1000}, ...] */
  polygon: json("polygon").$type<{x: number; y: number}[]>(),
  /** 구역 유형: 사무실, 회의실, 복도, 휴게실, 기타 */
  zoneType: mysqlEnum("zoneType", ["office", "meeting", "corridor", "lounge", "restroom", "kitchen", "storage", "other"]).default("office"),
  capacity: int("capacity"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SpaceZone = typeof spaceZones.$inferSelect;
export type InsertSpaceZone = typeof spaceZones.$inferInsert;

/**
 * DDIA: 재실 이벤트(Occupancy Events)
 * 센서별 입장/퇴장 이벤트 기록 - 히트맵 및 동선 분석의 원시 데이터
 */
export const occupancyEvents = mysqlTable("occupancy_events", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  sensorId: int("sensorId").notNull(),
  zoneId: int("zoneId"),
  /** enter: 입장, exit: 퇴장, count_change: 인원수 변경 */
  eventType: mysqlEnum("eventType", ["enter", "exit", "count_change"]).notNull(),
  /** 인원수 (카운팅 센서용) */
  count: int("count").default(0),
  /** 이벤트 발생 시각 */
  eventAt: timestamp("eventAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OccupancyEvent = typeof occupancyEvents.$inferSelect;
export type InsertOccupancyEvent = typeof occupancyEvents.$inferInsert;

/**
 * DDIA: 구역별 재실 집계(Zone Occupancy Stats)
 * 시간대별 구역 재실 통계 - 히트맵 렌더링용 집계 데이터
 */
export const zoneOccupancyStats = mysqlTable("zone_occupancy_stats", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  zoneId: int("zoneId").notNull(),
  /** 집계 시간 (시간 단위 버킷) */
  bucketHour: timestamp("bucketHour").notNull(),
  /** 해당 시간 평균 재실 인원 */
  avgOccupancy: int("avgOccupancy").default(0),
  /** 해당 시간 최대 재실 인원 */
  maxOccupancy: int("maxOccupancy").default(0),
  /** 해당 시간 총 재실 시간(분) */
  totalMinutesOccupied: int("totalMinutesOccupied").default(0),
  /** 해당 시간 입장 횟수 */
  enterCount: int("enterCount").default(0),
  /** 해당 시간 퇴장 횟수 */
  exitCount: int("exitCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ZoneOccupancyStat = typeof zoneOccupancyStats.$inferSelect;
export type InsertZoneOccupancyStat = typeof zoneOccupancyStats.$inferInsert;

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
  
  // AI 생성 여부
  isAiGenerated: boolean("isAiGenerated").default(false),
  
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
 * 인사이트 콘텐츠 큐 (발행 주제 캘린더) — D-11
 * 관리자가 주제를 미리 쌓고, 스케줄러가 평일마다 큐에서 꺼내 생성·발행한다.
 */
export const insightContentQueue = mysqlTable("insight_content_queue", {
  id: int("id").autoincrement().primaryKey(),
  scheduledDate: varchar("scheduledDate", { length: 20 }).notNull(), // YYYY-MM-DD
  category: mysqlEnum("category", ["trend", "cost_guide", "case_study", "tip", "news"]).default("trend").notNull(),
  title: varchar("title", { length: 300 }).notNull(),      // 주제/가제
  keywords: json("keywords").$type<string[]>(),
  sources: text("sources"),                                 // 참고자료
  status: mysqlEnum("status", ["planned", "generating", "published", "skipped"]).default("planned").notNull(),
  generatedArticleId: int("generatedArticleId"),            // 발행 후 insight_articles 연결
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InsightContentQueue = typeof insightContentQueue.$inferSelect;
export type InsertInsightContentQueue = typeof insightContentQueue.$inferInsert;

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
  source: mysqlEnum("source", ["website", "contact_form", "manual", "lead_magnet", "estimator", "portfolio", "insight", "ai_chat", "style_quiz"]).default("website"),
  
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
  
  // 타겟 세그먼트 (null이면 전체 발송)
  segmentId: int("segmentId"),
  
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


/**
 * 뉴스레터 구독자 세그먼트(Subscriber Segments)
 * 유입 경로, 구독일, 태그 등 조건 기반으로 구독자를 그룹화
 */
export const subscriberSegments = mysqlTable("subscriber_segments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 20 }).default("#b8860b"), // 세그먼트 식별 색상
  
  // 필터 조건 (JSON)
  // { sources: ["website","contact_form"], subscribedAfter: "2026-01-01", subscribedBefore: "2026-12-31", tags: ["vip"] }
  filterConditions: json("filterConditions").$type<{
    sources?: string[];
    subscribedAfter?: string;
    subscribedBefore?: string;
    tags?: string[];
    hasCompany?: boolean;
  }>(),
  
  // 통계 (캐시)
  matchCount: int("matchCount").default(0),
  lastCalculatedAt: timestamp("lastCalculatedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubscriberSegment = typeof subscriberSegments.$inferSelect;
export type InsertSubscriberSegment = typeof subscriberSegments.$inferInsert;

/**
 * 구독자 태그(Subscriber Tags)
 * 구독자에게 수동/자동으로 부여하는 태그
 */
export const subscriberTags = mysqlTable("subscriber_tags", {
  id: int("id").autoincrement().primaryKey(),
  subscriberId: int("subscriberId").notNull(),
  tag: varchar("tag", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SubscriberTag = typeof subscriberTags.$inferSelect;
export type InsertSubscriberTag = typeof subscriberTags.$inferInsert;


// ============================================================
// 고객 셀프서비스 파이프라인 (Client Self-Service Pipeline)
// 회원가입 → 도면 업로드 → 업무환경 서베이 → AI 보고서/제안서 → 전사 서베이 → 미팅 예약
// ============================================================

/**
 * 고객 프로젝트(Client Projects)
 * 고객이 회원가입 후 생성하는 프로젝트 단위
 */
export const clientProjects = mysqlTable("client_projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyName: varchar("companyName", { length: 200 }).notNull(),
  contactName: varchar("contactName", { length: 100 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 30 }),
  employeeCount: int("employeeCount"),
  currentAddress: text("currentAddress"),
  desiredMoveDate: varchar("desiredMoveDate", { length: 50 }),
  budgetRange: varchar("budgetRange", { length: 100 }),
  status: mysqlEnum("status", [
    "created",           // 프로젝트 생성됨
    "floor_plan_uploaded", // 도면 업로드 완료
    "survey_completed",    // 업무환경 서베이 완료
    "report_generated",    // AI 보고서/제안서 생성됨
    "report_sent",         // 보고서 이메일 발송됨
    "company_survey_shared", // 전사 서베이 링크 공유됨
    "company_survey_done",   // 전사 서베이 완료
    "meeting_requested",     // 미팅 요청됨
    "meeting_confirmed",     // 미팅 확정됨
    "completed",             // 완료
  ]).default("created").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientProject = typeof clientProjects.$inferSelect;
export type InsertClientProject = typeof clientProjects.$inferInsert;

/**
 * 고객 도면 업로드(Client Floor Plans)
 */
export const clientFloorPlans = mysqlTable("client_floor_plans", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  fileName: varchar("fileName", { length: 500 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileType: varchar("fileType", { length: 50 }).notNull(), // pdf, image, cad
  fileSize: int("fileSize"), // bytes
  floorNumber: int("floorNumber"),
  floorName: varchar("floorName", { length: 100 }),
  totalArea: decimal("totalArea", { precision: 10, scale: 2 }),
  aiAnalysis: json("aiAnalysis"), // AI 도면 분석 결과
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClientFloorPlan = typeof clientFloorPlans.$inferSelect;
export type InsertClientFloorPlan = typeof clientFloorPlans.$inferInsert;

/**
 * 업무환경 서베이(Work Environment Survey)
 * 고객 담당자가 직접 작성하는 1차 서베이
 */
export const workSurveys = mysqlTable("work_surveys", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  respondentName: varchar("respondentName", { length: 100 }).notNull(),
  respondentRole: varchar("respondentRole", { length: 100 }),
  respondentEmail: varchar("respondentEmail", { length: 320 }),
  
  // 업무 스타일
  workStyle: mysqlEnum("workStyle", ["collaborative", "focused", "hybrid", "flexible"]),
  remoteWorkRatio: int("remoteWorkRatio"), // 재택근무 비율 (0-100%)
  meetingFrequency: mysqlEnum("meetingFrequency", ["rarely", "few_weekly", "daily", "very_frequent"]),
  
  // 공간 요구사항
  privateOfficeCount: int("privateOfficeCount"),
  meetingRoomCount: int("meetingRoomCount"),
  needsLounge: tinyint("needsLounge"),
  needsCafeteria: tinyint("needsCafeteria"),
  needsPhoneBooth: tinyint("needsPhoneBooth"),
  needsLibrary: tinyint("needsLibrary"),
  needsGym: tinyint("needsGym"),
  needsNapRoom: tinyint("needsNapRoom"),
  specialSpaces: text("specialSpaces"), // 기타 특수 공간 요구사항
  
  // 디자인 선호
  designStyle: mysqlEnum("designStyle", ["modern", "minimal", "warm", "industrial", "natural", "luxury", "creative"]),
  colorPreference: varchar("colorPreference", { length: 200 }),
  brandColors: varchar("brandColors", { length: 200 }),
  inspirationNotes: text("inspirationNotes"),
  
  // 현재 불편사항
  currentPainPoints: json("currentPainPoints"), // string[]
  priorityAreas: json("priorityAreas"), // string[] - 우선순위 영역
  
  // 기능 요구사항
  acRequirements: text("acRequirements"), // 냉난방
  lightingPreference: mysqlEnum("lightingPreference", ["natural", "warm", "cool", "mixed"]),
  noiseControl: mysqlEnum("noiseControl", ["critical", "important", "moderate", "not_important"]),
  storageNeeds: mysqlEnum("storageNeeds", ["minimal", "moderate", "extensive"]),
  techRequirements: text("techRequirements"), // IT/기술 요구사항
  
  // 예산/일정
  budgetPriority: mysqlEnum("budgetPriority", ["cost_saving", "balanced", "quality_first"]),
  timelineUrgency: mysqlEnum("timelineUrgency", ["flexible", "within_6months", "within_3months", "urgent"]),
  additionalNotes: text("additionalNotes"),
  
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WorkSurvey = typeof workSurveys.$inferSelect;
export type InsertWorkSurvey = typeof workSurveys.$inferInsert;

/**
 * 전사 서베이(Company-Wide Survey)
 * 고객사 전 직원이 참여하는 서베이
 */
export const companyWideSurveys = mysqlTable("company_wide_surveys", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  expiresAt: timestamp("expiresAt"),
  maxResponses: int("maxResponses"),
  isActive: tinyint("isActive").default(1).notNull(),
  responseCount: int("responseCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CompanyWideSurvey = typeof companyWideSurveys.$inferSelect;
export type InsertCompanyWideSurvey = typeof companyWideSurveys.$inferInsert;

/**
 * 전사 서베이 응답(Company Survey Responses)
 */
export const companySurveyResponses = mysqlTable("company_survey_responses", {
  id: int("id").autoincrement().primaryKey(),
  surveyId: int("surveyId").notNull(),
  department: varchar("department", { length: 100 }),
  role: varchar("role", { length: 100 }),
  tenure: mysqlEnum("tenure", ["less_1y", "1_3y", "3_5y", "5_10y", "over_10y"]),
  
  // 현재 공간 만족도 (1-5)
  overallSatisfaction: int("overallSatisfaction"),
  noiseSatisfaction: int("noiseSatisfaction"),
  lightingSatisfaction: int("lightingSatisfaction"),
  temperatureSatisfaction: int("temperatureSatisfaction"),
  spaceSatisfaction: int("spaceSatisfaction"),
  privacySatisfaction: int("privacySatisfaction"),
  
  // 업무 스타일
  deskUsageHours: int("deskUsageHours"), // 하루 평균 자리 사용 시간
  meetingHoursPerDay: decimal("meetingHoursPerDay", { precision: 3, scale: 1 }),
  collaborationFrequency: mysqlEnum("collaborationFrequency", ["rarely", "sometimes", "often", "always"]),
  focusWorkNeed: mysqlEnum("focusWorkNeed", ["low", "medium", "high", "critical"]),
  
  // 희망 공간
  desiredSpaces: json("desiredSpaces"), // string[]
  improvementSuggestions: text("improvementSuggestions"),
  
  // 추가 의견
  additionalComments: text("additionalComments"),
  
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
});

export type CompanySurveyResponse = typeof companySurveyResponses.$inferSelect;
export type InsertCompanySurveyResponse = typeof companySurveyResponses.$inferInsert;

/**
 * AI 분석 보고서(AI Analysis Reports)
 */
export const aiReports = mysqlTable("ai_reports", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  type: mysqlEnum("type", ["analysis", "proposal"]).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  content: longtext("content").notNull(), // 마크다운 형식 보고서 내용
  summary: text("summary"),
  emailSentAt: timestamp("emailSentAt"),
  emailSentTo: varchar("emailSentTo", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiReport = typeof aiReports.$inferSelect;
export type InsertAiReport = typeof aiReports.$inferInsert;

/**
 * 미팅 예약(Meeting Bookings)
 */
export const meetingBookings = mysqlTable("meeting_bookings", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  requestedDate: varchar("requestedDate", { length: 20 }).notNull(), // YYYY-MM-DD
  requestedTime: varchar("requestedTime", { length: 10 }).notNull(), // HH:mm
  duration: int("duration").default(60).notNull(), // 분
  meetingType: mysqlEnum("meetingType", ["online", "visit", "office"]).default("office").notNull(),
  location: text("location"),
  agenda: text("agenda"),
  status: mysqlEnum("status", ["requested", "confirmed", "rescheduled", "cancelled", "completed"]).default("requested").notNull(),
  confirmedDate: varchar("confirmedDate", { length: 20 }),
  confirmedTime: varchar("confirmedTime", { length: 10 }),
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MeetingBooking = typeof meetingBookings.$inferSelect;
export type InsertMeetingBooking = typeof meetingBookings.$inferInsert;


// ============================================================
// OpsX 직원용 프로젝트 관리 대시보드
// 프로젝트 관리, 공정표, 작업보고서, 회의록, 지출결의서(결재라인),
// 하도급 관리, 견적서, 계약서, 원가관리, 고객사/하도급 초대
// ============================================================

/**
 * OpsX 시공 프로젝트(Construction Projects)
 * 직원이 관리하는 시공 프로젝트 단위
 */
export const opsProjects = mysqlTable("ops_projects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 300 }).notNull(),
  code: varchar("code", { length: 50 }).notNull(), // 프로젝트 코드 (예: GGD-2026-001)
  clientName: varchar("clientName", { length: 200 }).notNull(),
  clientContact: varchar("clientContact", { length: 100 }),
  clientEmail: varchar("clientEmail", { length: 320 }),
  clientPhone: varchar("clientPhone", { length: 30 }),
  siteAddress: text("siteAddress"),
  totalArea: decimal("totalArea", { precision: 10, scale: 2 }), // ㎡
  contractAmount: decimal("contractAmount", { precision: 15, scale: 0 }), // 계약금액 (원)
  startDate: varchar("startDate", { length: 20 }), // YYYY-MM-DD
  endDate: varchar("endDate", { length: 20 }),
  status: mysqlEnum("status", [
    "planning",      // 기획
    "designing",     // 설계
    "permit",        // 인허가
    "construction",  // 시공중
    "inspection",    // 검수
    "completed",     // 완료
    "warranty",      // 하자보수
    "closed",        // 종료
  ]).default("planning").notNull(),
  managerId: int("managerId"), // 담당 PM (users.id)
  teamMembers: json("teamMembers").$type<number[]>(), // 팀원 user IDs
  description: text("description"),
  notes: text("notes"),
  // 고객 수금 일정 (계약금·기성·잔금) — 결제·경비 현황 (C-7)
  billingSchedule: json("billingSchedule").$type<Array<{
    kind: "contract" | "progress" | "balance"; // 계약금/기성/잔금
    label?: string;                              // 예: "기성 2차"
    amount: number;
    dueDate?: string;                            // 청구/예정일 YYYY-MM-DD
    status: "scheduled" | "billed" | "paid";     // 예정/청구/수금
    paidDate?: string;                           // 수금일
  }>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OpsProject = typeof opsProjects.$inferSelect;
export type InsertOpsProject = typeof opsProjects.$inferInsert;

/**
 * 공정표 항목(Schedule Items)
 * 간트차트 형태의 공정 관리
 */
export const opsScheduleItems = mysqlTable("ops_schedule_items", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  parentId: int("parentId"), // 상위 공정 (트리 구조)
  name: varchar("name", { length: 300 }).notNull(),
  category: varchar("category", { length: 100 }), // 공종 (철거, 전기, 설비, 목공, 도장 등)
  startDate: varchar("startDate", { length: 20 }),
  endDate: varchar("endDate", { length: 20 }),
  progress: int("progress").default(0), // 진행률 0-100%
  status: mysqlEnum("status", ["not_started", "in_progress", "delayed", "completed", "on_hold"]).default("not_started").notNull(),
  budgetAmount: decimal("budgetAmount", { precision: 15, scale: 0 }), // 실행예산 (STAFF_UI 6)
  assignedTo: varchar("assignedTo", { length: 200 }), // 담당자/업체명
  subcontractorId: int("subcontractorId"), // 하도급 업체 ID
  sortOrder: int("sortOrder").default(0),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OpsScheduleItem = typeof opsScheduleItems.$inferSelect;
export type InsertOpsScheduleItem = typeof opsScheduleItems.$inferInsert;

/**
 * 작업보고서(Work Reports)
 * 일일/주간 작업 보고
 */
export const opsWorkReports = mysqlTable("ops_work_reports", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  authorId: int("authorId").notNull(), // 작성자 (users.id)
  authorName: varchar("authorName", { length: 100 }),
  reportDate: varchar("reportDate", { length: 20 }).notNull(), // YYYY-MM-DD
  reportType: mysqlEnum("reportType", ["daily", "weekly", "special"]).default("daily").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  content: text("content").notNull(), // 마크다운
  weatherCondition: varchar("weatherCondition", { length: 50 }), // 날씨
  workersCount: int("workersCount"), // 투입 인원
  safetyIssues: text("safetyIssues"), // 안전 이슈
  photoUrls: json("photoUrls").$type<string[]>(), // 현장 사진
  attachmentUrls: json("attachmentUrls").$type<string[]>(), // 첨부파일
  status: mysqlEnum("status", ["draft", "submitted", "reviewed"]).default("draft").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OpsWorkReport = typeof opsWorkReports.$inferSelect;
export type InsertOpsWorkReport = typeof opsWorkReports.$inferInsert;

/**
 * 회의록(Meeting Notes)
 */
export const opsMeetingNotes = mysqlTable("ops_meeting_notes", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  authorId: int("authorId").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  meetingDate: varchar("meetingDate", { length: 20 }).notNull(),
  meetingTime: varchar("meetingTime", { length: 10 }),
  location: varchar("location", { length: 200 }),
  meetingType: mysqlEnum("meetingType", ["internal", "client", "subcontractor", "inspection"]).default("internal").notNull(),
  attendees: json("attendees").$type<Array<{ name: string; role?: string; company?: string }>>(),
  agenda: text("agenda"), // 안건
  content: text("content").notNull(), // 회의 내용 (마크다운)
  decisions: json("decisions").$type<string[]>(), // 결정사항
  actionItems: json("actionItems").$type<Array<{ task: string; assignee: string; dueDate?: string }>>(), // 후속 조치
  attachmentUrls: json("attachmentUrls").$type<string[]>(),
  status: mysqlEnum("status", ["draft", "finalized"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OpsMeetingNote = typeof opsMeetingNotes.$inferSelect;
export type InsertOpsMeetingNote = typeof opsMeetingNotes.$inferInsert;

/**
 * 결재라인 설정(Approval Line Templates)
 * 지출결의서 등의 결재 흐름 설정
 */
export const opsApprovalLines = mysqlTable("ops_approval_lines", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(), // 결재라인 이름 (예: "일반 지출결의", "긴급 결재")
  documentType: mysqlEnum("documentType", ["expense", "contract", "estimate", "general"]).default("expense").notNull(),
  steps: json("steps").$type<Array<{
    stepOrder: number;
    approverType: string; // "specific_user" | "role" | "manager"
    approverId?: number; // users.id (specific_user인 경우)
    approverRole?: string; // 역할명 (role인 경우)
    approverName: string; // 표시용 이름
    isRequired: boolean;
  }>>().notNull(),
  isDefault: tinyint("isDefault").default(0),
  isActive: tinyint("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OpsApprovalLine = typeof opsApprovalLines.$inferSelect;
export type InsertOpsApprovalLine = typeof opsApprovalLines.$inferInsert;

/**
 * 지출결의서(Expense Reports)
 */
export const opsExpenses = mysqlTable("ops_expenses", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  authorId: int("authorId").notNull(), // 작성자
  approvalLineId: int("approvalLineId"), // 사용된 결재라인
  expenseNumber: varchar("expenseNumber", { length: 50 }).notNull(), // 결의서 번호
  title: varchar("title", { length: 300 }).notNull(),
  category: mysqlEnum("category", [
    "material",       // 자재비
    "labor",          // 인건비
    "subcontract",    // 하도급비
    "equipment",      // 장비비
    "transportation", // 운반비
    "utility",        // 공과금
    "office",         // 사무용품
    "meal",           // 식대
    "other",          // 기타
  ]).default("other").notNull(),
  items: json("items").$type<Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    remarks?: string;
  }>>().notNull(),
  totalAmount: decimal("totalAmount", { precision: 15, scale: 0 }).notNull(),
  // 결의서 유형 + 세무 자동계산 (STAFF_UI 3). nullable — 기존 데이터 호환.
  expenseType: mysqlEnum("expenseType", [
    "tax_invoice",         // 세금계산서
    "withholding",         // 사업소득세(3.3%)
    "withholding_expense", // 사업소득세(경비포함)
    "daily_worker",        // 일용직
  ]),
  // 세무 계산 결과 보존(담당자 수정 가능). 유형별 필드 자유 저장.
  taxDetail: json("taxDetail").$type<Record<string, number>>(),
  // 지급 일정(계약금·중도금·잔금). 세금계산서 유형에서 특히 사용.
  paymentSchedule: json("paymentSchedule").$type<Array<{
    kind: "contract" | "interim" | "balance"; // 계약금/중도금/잔금
    amount: number;
    dueDate?: string;                           // 지급예정일 (YYYY-MM-DD)
    status: "scheduled" | "billed" | "paid";    // 예정/청구/지급
  }>>(),
  // 공정 태깅 — 실행정산(STAFF_UI 6) 연동
  scheduleItemId: int("scheduleItemId"),
  // 고감도 내부 지출(특정 현장 아님). true면 projectId=0. (STAFF_UI 3-1)
  isInternal: tinyint("isInternal").default(0),
  // 반려 사유 (반려·보완 재상신)
  rejectionReason: text("rejectionReason"),
  paymentMethod: mysqlEnum("paymentMethod", ["bank_transfer", "card", "cash", "check"]).default("bank_transfer"),
  payeeName: varchar("payeeName", { length: 200 }), // 수취인
  payeeBank: varchar("payeeBank", { length: 100 }), // 은행명
  payeeAccount: varchar("payeeAccount", { length: 50 }), // 계좌번호
  receiptUrls: json("receiptUrls").$type<string[]>(), // 증빙 첨부
  attachmentUrls: json("attachmentUrls").$type<string[]>(),
  notes: text("notes"),
  status: mysqlEnum("status", [
    "draft",      // 작성중
    "submitted",  // 상신됨
    "in_review",  // 결재중
    "approved",   // 승인됨
    "rejected",   // 반려됨
    "paid",       // 지급완료
  ]).default("draft").notNull(),
  submittedAt: timestamp("submittedAt"),
  approvedAt: timestamp("approvedAt"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OpsExpense = typeof opsExpenses.$inferSelect;
export type InsertOpsExpense = typeof opsExpenses.$inferInsert;

/**
 * 결재 단계(Approval Steps)
 * 각 지출결의서/계약서 등에 대한 결재 진행 상태
 */
export const opsApprovalSteps = mysqlTable("ops_approval_steps", {
  id: int("id").autoincrement().primaryKey(),
  documentType: mysqlEnum("documentType", ["expense", "contract", "estimate", "general"]).notNull(),
  documentId: int("documentId").notNull(), // 해당 문서 ID
  stepOrder: int("stepOrder").notNull(),
  approverId: int("approverId").notNull(), // users.id
  approverName: varchar("approverName", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "skipped"]).default("pending").notNull(),
  comment: text("comment"), // 결재 의견
  actionAt: timestamp("actionAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OpsApprovalStep = typeof opsApprovalSteps.$inferSelect;
export type InsertOpsApprovalStep = typeof opsApprovalSteps.$inferInsert;

/**
 * 하도급 업체(Subcontractors)
 */
export const opsSubcontractors = mysqlTable("ops_subcontractors", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 200 }).notNull(),
  businessNumber: varchar("businessNumber", { length: 20 }), // 사업자번호
  representativeName: varchar("representativeName", { length: 100 }),
  contactName: varchar("contactName", { length: 100 }),
  contactPhone: varchar("contactPhone", { length: 30 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  specialty: varchar("specialty", { length: 200 }), // 전문 분야 (전기, 설비, 목공 등)
  bankName: varchar("bankName", { length: 100 }),
  bankAccount: varchar("bankAccount", { length: 50 }),
  bankHolder: varchar("bankHolder", { length: 100 }),
  rating: int("rating"), // 평가 점수 1-5
  notes: text("notes"),
  isActive: tinyint("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OpsSubcontractor = typeof opsSubcontractors.$inferSelect;
export type InsertOpsSubcontractor = typeof opsSubcontractors.$inferInsert;

/**
 * 거래처 계좌 등록부 (STAFF_UI 4)
 * 지출결의서 지급처 자동입력용. 계좌번호=민감정보(공개 repo 커밋 금지).
 */
export const opsVendors = mysqlTable("ops_vendors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),       // 거래처명
  category: varchar("category", { length: 100 }),          // 분류(가구/전기/도장/블라인드 등)
  businessNumber: varchar("businessNumber", { length: 20 }),
  bankName: varchar("bankName", { length: 100 }),
  accountHolder: varchar("accountHolder", { length: 100 }), // 예금주
  accountNumber: varchar("accountNumber", { length: 50 }),  // 계좌번호(민감)
  contactName: varchar("contactName", { length: 100 }),
  contactPhone: varchar("contactPhone", { length: 30 }),
  notes: text("notes"),
  isActive: tinyint("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OpsVendor = typeof opsVendors.$inferSelect;
export type InsertOpsVendor = typeof opsVendors.$inferInsert;

/**
 * 하도급 초대(Subcontractor Invites)
 * 하도급 업체를 프로젝트에 초대하는 토큰
 */
export const opsSubInvites = mysqlTable("ops_sub_invites", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  subcontractorId: int("subcontractorId").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt"),
  isActive: tinyint("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OpsSubInvite = typeof opsSubInvites.$inferSelect;
export type InsertOpsSubInvite = typeof opsSubInvites.$inferInsert;

/**
 * 하도급 견적(Subcontractor Quotes)
 * 하도급 업체가 제출하는 견적
 */
export const opsSubQuotes = mysqlTable("ops_sub_quotes", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  subcontractorId: int("subcontractorId").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  items: json("items").$type<Array<{
    category: string;
    item: string;
    specification: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    remarks?: string;
  }>>(),
  totalAmount: decimal("totalAmount", { precision: 15, scale: 0 }),
  fileUrl: text("fileUrl"), // 엑셀 파일 URL
  fileKey: varchar("fileKey", { length: 500 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["submitted", "reviewing", "approved", "rejected", "revised"]).default("submitted").notNull(),
  reviewComment: text("reviewComment"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OpsSubQuote = typeof opsSubQuotes.$inferSelect;
export type InsertOpsSubQuote = typeof opsSubQuotes.$inferInsert;

/**
 * 하도급 작업보고(Subcontractor Work Reports)
 * 하도급 업체가 제출하는 일일 작업 보고
 */
export const opsSubWorkReports = mysqlTable("ops_sub_work_reports", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  subcontractorId: int("subcontractorId").notNull(),
  reportDate: varchar("reportDate", { length: 20 }).notNull(),
  workDescription: text("workDescription").notNull(),
  workersCount: int("workersCount"),
  materialsUsed: text("materialsUsed"),
  photoUrls: json("photoUrls").$type<string[]>(),
  issues: text("issues"),
  status: mysqlEnum("status", ["submitted", "acknowledged", "approved", "rejected"]).default("submitted").notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  approvalComment: text("approvalComment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OpsSubWorkReport = typeof opsSubWorkReports.$inferSelect;
export type InsertOpsSubWorkReport = typeof opsSubWorkReports.$inferInsert;

/**
 * 견적서(Project Estimates)
 * 엑셀 방식의 견적서 관리
 */
export const opsEstimates = mysqlTable("ops_estimates", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  authorId: int("authorId").notNull(),
  estimateNumber: varchar("estimateNumber", { length: 50 }).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  version: int("version").default(1),
  items: json("items").$type<Array<{
    category: string;      // 대분류 (철거공사, 전기공사, 설비공사 등)
    subcategory: string;   // 중분류
    item: string;          // 품목
    specification: string; // 규격
    unit: string;          // 단위
    quantity: number;      // 수량
    materialUnitPrice: number;  // 재료 단가
    materialAmount: number;     // 재료비
    laborUnitPrice: number;     // 노무 단가
    laborAmount: number;        // 노무비
    totalAmount: number;        // 합계
    remarks?: string;
  }>>(),
  subtotal: decimal("subtotal", { precision: 15, scale: 0 }),
  overhead: decimal("overhead", { precision: 15, scale: 0 }), // 경비
  profit: decimal("profit", { precision: 15, scale: 0 }), // 이윤
  vat: decimal("vat", { precision: 15, scale: 0 }),
  grandTotal: decimal("grandTotal", { precision: 15, scale: 0 }),
  fileUrl: text("fileUrl"), // 엑셀 파일 URL
  fileKey: varchar("fileKey", { length: 500 }),
  notes: text("notes"),
  validUntil: varchar("validUntil", { length: 20 }),
  status: mysqlEnum("status", ["draft", "submitted", "approved", "rejected", "sent"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OpsEstimate = typeof opsEstimates.$inferSelect;
export type InsertOpsEstimate = typeof opsEstimates.$inferInsert;

/**
 * 계약서(Contracts)
 */
export const opsContracts = mysqlTable("ops_contracts", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  authorId: int("authorId").notNull(),
  contractNumber: varchar("contractNumber", { length: 50 }).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  contractType: mysqlEnum("contractType", ["main", "subcontract", "design", "consulting", "maintenance", "other"]).default("main").notNull(),
  partyA: varchar("partyA", { length: 200 }).notNull(), // 갑 (발주자)
  partyB: varchar("partyB", { length: 200 }).notNull(), // 을 (수급자)
  contractAmount: decimal("contractAmount", { precision: 15, scale: 0 }),
  startDate: varchar("startDate", { length: 20 }),
  endDate: varchar("endDate", { length: 20 }),
  paymentTerms: text("paymentTerms"), // 대금 지급 조건
  specialTerms: text("specialTerms"), // 특약 사항
  fileUrl: text("fileUrl"), // 계약서 파일 URL
  fileKey: varchar("fileKey", { length: 500 }),
  attachmentUrls: json("attachmentUrls").$type<string[]>(),
  status: mysqlEnum("status", ["draft", "reviewing", "signed", "active", "completed", "terminated"]).default("draft").notNull(),
  signedAt: timestamp("signedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OpsContract = typeof opsContracts.$inferSelect;
export type InsertOpsContract = typeof opsContracts.$inferInsert;

/**
 * 원가관리 항목(Cost Management Items)
 * 프로젝트별 실제 비용 추적
 */
export const opsCostItems = mysqlTable("ops_cost_items", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  category: mysqlEnum("category", [
    "material",       // 자재비
    "labor",          // 인건비
    "subcontract",    // 하도급비
    "equipment",      // 장비비
    "overhead",       // 경비
    "design",         // 설계비
    "permit",         // 인허가비
    "other",          // 기타
  ]).notNull(),
  subcategory: varchar("subcategory", { length: 200 }),
  description: varchar("description", { length: 500 }).notNull(),
  budgetAmount: decimal("budgetAmount", { precision: 15, scale: 0 }), // 예산
  actualAmount: decimal("actualAmount", { precision: 15, scale: 0 }), // 실제 지출
  paidAmount: decimal("paidAmount", { precision: 15, scale: 0 }), // 지급 완료액
  vendor: varchar("vendor", { length: 200 }), // 거래처
  expenseId: int("expenseId"), // 관련 지출결의서
  invoiceDate: varchar("invoiceDate", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OpsCostItem = typeof opsCostItems.$inferSelect;
export type InsertOpsCostItem = typeof opsCostItems.$inferInsert;

/**
 * 고객사 초대(Client Invites)
 * 고객사에게 프로젝트 진행 현황을 공유하는 토큰
 */
export const opsClientInvites = mysqlTable("ops_client_invites", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  clientName: varchar("clientName", { length: 200 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }),
  token: varchar("token", { length: 64 }).notNull().unique(),
  permissions: json("permissions").$type<{
    viewSchedule: boolean;
    viewReports: boolean;
    viewPhotos: boolean;
    viewCamera: boolean;
    viewCost: boolean;
  }>(),
  expiresAt: timestamp("expiresAt"),
  isActive: tinyint("isActive").default(1).notNull(),
  lastAccessedAt: timestamp("lastAccessedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OpsClientInvite = typeof opsClientInvites.$inferSelect;
export type InsertOpsClientInvite = typeof opsClientInvites.$inferInsert;

/**
 * 현장 카메라(Site Cameras)
 * 실시간 현장 모니터링 카메라 정보
 */
export const opsCameras = mysqlTable("ops_cameras", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  location: varchar("location", { length: 300 }), // 설치 위치
  streamUrl: text("streamUrl"), // HLS 스트리밍 URL (go2rtc 자동 생성)
  rtspUrl: text("rtspUrl"), // 원본 RTSP URL (카메라 직접 접속)
  go2rtcStreamName: varchar("go2rtcStreamName", { length: 100 }), // go2rtc 스트림 이름
  go2rtcServerUrl: text("go2rtcServerUrl"), // go2rtc 서버 URL (예: http://서버:1984)
  thumbnailUrl: text("thumbnailUrl"), // 최근 스냅샷
  viewerUrl: text("viewerUrl"), // 제조사 웹 뷰어 URL (iframe 임베드/외부링크) - STAFF_UI 7
  simInfo: varchar("simInfo", { length: 200 }), // 유심/회선 정보 (통신사·번호 등)
  notes: text("notes"),
  isOnline: tinyint("isOnline").default(0),
  batteryLevel: int("batteryLevel"), // 배터리 잔량 (0~100, null이면 유선)
  lastOnlineAt: timestamp("lastOnlineAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OpsCamera = typeof opsCameras.$inferSelect;
export type InsertOpsCamera = typeof opsCameras.$inferInsert;

/**
 * 프로젝트 알림(Notifications)
 * 공정 지연, 결재 대기, 하도급 견적 제출 등 주요 이벤트 알림
 */
export const opsNotifications = mysqlTable("ops_notifications", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId"), // null이면 전체 알림
  recipientId: int("recipientId").notNull(), // users.id
  type: mysqlEnum("type", [
    "schedule_delay",       // 공정 지연
    "expense_submitted",    // 지출결의서 상신
    "expense_approved",     // 지출결의서 승인
    "expense_rejected",     // 지출결의서 반려
    "sub_quote_submitted",  // 하도급 견적 제출
    "sub_report_submitted", // 하도급 작업보고 제출
    "meeting_scheduled",    // 미팅 예약
    "meeting_reminder",     // 미팅 리마인더
    "project_status",       // 프로젝트 상태 변경
    "client_inquiry",       // 고객 문의
    "approval_pending",     // 결재 대기
    "general",              // 일반 알림
  ]).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  message: text("message"),
  link: varchar("link", { length: 500 }), // 클릭 시 이동할 경로
  isRead: tinyint("isRead").default(0).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type OpsNotification = typeof opsNotifications.$inferSelect;
export type InsertOpsNotification = typeof opsNotifications.$inferInsert;


// ======================== 하도급 업체 평가 시스템 ========================
export const opsSubEvaluations = mysqlTable("ops_sub_evaluations", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  subcontractorId: int("subcontractorId").notNull(),
  evaluatorId: int("evaluatorId").notNull(), // 평가자 (직원)
  // 평가 항목 (1-5점)
  qualityScore: int("qualityScore").notNull(),       // 시공 품질
  scheduleScore: int("scheduleScore").notNull(),      // 공정 준수
  safetyScore: int("safetyScore").notNull(),          // 안전 관리
  communicationScore: int("communicationScore").notNull(), // 소통/협업
  cleanupScore: int("cleanupScore").notNull(),        // 현장 정리
  overallScore: decimal("overallScore", { precision: 3, scale: 1 }), // 종합 점수 (자동 계산)
  // 서술형 평가
  strengths: text("strengths"),      // 강점
  improvements: text("improvements"), // 개선사항
  recommendation: mysqlEnum("recommendation", [
    "highly_recommended", // 적극 추천
    "recommended",        // 추천
    "neutral",            // 보통
    "not_recommended",    // 비추천
  ]).default("neutral").notNull(),
  comment: text("comment"),          // 추가 의견
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OpsSubEvaluation = typeof opsSubEvaluations.$inferSelect;
export type InsertOpsSubEvaluation = typeof opsSubEvaluations.$inferInsert;

// ============================================================
// 다운로드 로깅 (지적재산권 보호)
// ============================================================
export const downloadLogs = mysqlTable("download_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  userName: varchar("userName", { length: 255 }),
  userEmail: varchar("userEmail", { length: 255 }),
  fileType: mysqlEnum("fileType", [
    "estimate_pdf",
    "expense_pdf",
    "project_report_pdf",
    "proposal_pdf",
    "lead_magnet",
    "ai_estimate_result",
    "design_auto_result",
    "other",
  ]).notNull(),
  fileName: varchar("fileName", { length: 500 }),
  projectId: int("projectId"),
  projectName: varchar("projectName", { length: 255 }),
  trackingCode: varchar("trackingCode", { length: 64 }).notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  consentGiven: mysqlEnum("consentGiven", ["yes", "no"]).default("no").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DownloadLog = typeof downloadLogs.$inferSelect;
export type InsertDownloadLog = typeof downloadLogs.$inferInsert;

// ============================================================
// 센서 API 키 관리 (하드웨어 연동)
// ============================================================
export const sensorApiKeys = mysqlTable("sensor_api_keys", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 100 }).notNull(), // "1층 로비 게이트웨이" 등
  apiKey: varchar("apiKey", { length: 64 }).notNull().unique(),
  active: mysqlEnum("active", ["yes", "no"]).default("yes").notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  requestCount: int("requestCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SensorApiKey = typeof sensorApiKeys.$inferSelect;
export type InsertSensorApiKey = typeof sensorApiKeys.$inferInsert;

// ============================================================
// 고객 계정 (회원가입/로그인)
// ============================================================
export const clients = mysqlTable("clients_auth", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  company: varchar("company", { length: 200 }),
  phone: varchar("phone", { length: 20 }),
  /** 이메일 인증 여부 */
  emailVerified: mysqlEnum("emailVerified", ["yes", "no"]).default("no").notNull(),
  emailVerifyToken: varchar("emailVerifyToken", { length: 64 }),
  emailVerifyExpires: timestamp("emailVerifyExpires"),
  /** 비밀번호 재설정 */
  passwordResetToken: varchar("passwordResetToken", { length: 64 }),
  passwordResetExpires: timestamp("passwordResetExpires"),
  /** 상태 */
  status: mysqlEnum("status", ["active", "suspended", "pending"]).default("pending").notNull(),
  /** 프로젝트 접근 권한 (JSON 배열) */
  assignedProjectIds: json("assignedProjectIds").$type<number[]>(),
  lastLoginAt: timestamp("lastLoginAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;


/**
 * AI 공간 리디자인 이력
 */
export const aiRedesigns = mysqlTable("ai_redesigns", {
  id: int("id").autoincrement().primaryKey(),
  /** 원본 이미지 URL (S3) */
  originalImageUrl: text("originalImageUrl").notNull(),
  /** 고객 요청 텍스트 */
  prompt: text("prompt").notNull(),
  /** AI 생성 결과 이미지 URL (S3) */
  resultImageUrl: text("resultImageUrl"),
  /** 상태 */
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  /** 에러 메시지 (실패 시) */
  errorMessage: text("errorMessage"),
  /** 고객 이름 (선택) */
  customerName: varchar("customerName", { length: 100 }),
  /** 고객 이메일 (선택) */
  customerEmail: varchar("customerEmail", { length: 320 }),
  /** 고객 전화번호 (선택) */
  customerPhone: varchar("customerPhone", { length: 30 }),
  /** 공간 유형 (사무실, 회의실, 라운지 등) */
  spaceType: varchar("spaceType", { length: 50 }),
  /** 사용자 IP */
  userIp: varchar("userIp", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AiRedesign = typeof aiRedesigns.$inferSelect;
export type InsertAiRedesign = typeof aiRedesigns.$inferInsert;


/**
 * 사이트 설정 (Site Settings) - 관리자가 기능을 켜고 끌 수 있는 키-값 저장소
 */
export const siteSettings = mysqlTable("site_settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: varchar("description", { length: 500 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;


/**
 * 활동 로그 (Activity Logs) - 마스터 전용: 주요 관리 활동 기록
 */
export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 200 }),
  action: varchar("action", { length: 100 }).notNull(), // e.g. "role_change", "setting_update", "user_delete", "site_reset"
  target: varchar("target", { length: 200 }), // e.g. "user:123", "setting:ai_features_enabled"
  details: text("details"), // JSON string with additional context
  ipAddress: varchar("ipAddress", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;


// ============================================================
// E2E 비즈니스 프로세스 시스템
// Phase 1~3: 상담→설문→회원가입 유도 자동화
// Phase 4~5: 도면→이사/레노베이션→부동산 매칭
// Phase 8~9: 시공 일일보고 + 납품사 견적 AI 학습
// Phase 10: 사후관리 + OpsX Insight 구독
// 직원 포털: KPI/OKR
// ============================================================

/**
 * 설문 템플릿(Survey Templates)
 * 1차 담당자 설문, 전사 설문 등 다양한 설문 유형의 템플릿
 */
export const surveyTemplates = mysqlTable("survey_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 300 }).notNull(),
  type: mysqlEnum("type", [
    "initial_manager",     // 1차 담당자 설문
    "company_wide",        // 전사 설문
    "post_occupancy",      // 입주 후 만족도
    "custom",              // 커스텀
  ]).notNull(),
  description: text("description"),
  isDefault: tinyint("isDefault").default(0),
  isActive: tinyint("isActive").default(1).notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SurveyTemplate = typeof surveyTemplates.$inferSelect;
export type InsertSurveyTemplate = typeof surveyTemplates.$inferInsert;

/**
 * 설문 질문(Survey Questions)
 * 각 템플릿에 속하는 질문 목록
 */
export const surveyQuestions = mysqlTable("survey_questions", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(),
  sectionTitle: varchar("sectionTitle", { length: 200 }), // 섹션 제목 (예: "업무 환경", "공간 요구")
  questionText: text("questionText").notNull(),
  questionType: mysqlEnum("questionType", [
    "single_choice",    // 단일 선택
    "multiple_choice",  // 다중 선택
    "scale",            // 1~5 척도
    "text",             // 자유 텍스트
    "number",           // 숫자 입력
    "matrix",           // 매트릭스형
  ]).notNull(),
  isRequired: tinyint("isRequired").default(1).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  metadata: json("metadata").$type<{
    scaleMin?: number;
    scaleMax?: number;
    scaleLabels?: string[];
    placeholder?: string;
    matrixRows?: string[];
    matrixColumns?: string[];
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SurveyQuestion = typeof surveyQuestions.$inferSelect;
export type InsertSurveyQuestion = typeof surveyQuestions.$inferInsert;

/**
 * 설문 질문 선택지(Survey Question Options)
 * single_choice, multiple_choice 유형의 선택지
 */
export const surveyQuestionOptions = mysqlTable("survey_question_options", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("questionId").notNull(),
  optionText: varchar("optionText", { length: 500 }).notNull(),
  optionValue: varchar("optionValue", { length: 200 }), // 분석용 값
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SurveyQuestionOption = typeof surveyQuestionOptions.$inferSelect;
export type InsertSurveyQuestionOption = typeof surveyQuestionOptions.$inferInsert;

/**
 * 설문 인스턴스(Survey Instances)
 * 특정 프로젝트에 대해 발송된 설문 인스턴스 (토큰 기반 접근)
 */
export const surveyInstances = mysqlTable("survey_instances", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(),
  clientProjectId: int("clientProjectId"), // client_projects.id
  token: varchar("token", { length: 128 }).notNull().unique(),
  type: mysqlEnum("type", [
    "initial_manager",     // 1차 담당자 설문
    "company_wide",        // 전사 설문
    "post_occupancy",      // 입주 후 만족도
  ]).notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  recipientName: varchar("recipientName", { length: 200 }),
  status: mysqlEnum("status", [
    "pending",       // 발송 대기
    "sent",          // 이메일 발송됨
    "opened",        // 열람됨
    "in_progress",   // 응답 중
    "completed",     // 완료
    "expired",       // 만료
  ]).default("pending").notNull(),
  customQuestions: json("customQuestions").$type<Array<{
    id: number;
    questionText: string;
    questionType: string;
    options?: string[];
    isRequired: boolean;
    sortOrder: number;
    sectionTitle?: string;
  }>>(), // 담당자가 수정한 질문 (null이면 템플릿 원본 사용)
  responseCount: int("responseCount").default(0),
  sentAt: timestamp("sentAt"),
  completedAt: timestamp("completedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SurveyInstance = typeof surveyInstances.$inferSelect;
export type InsertSurveyInstance = typeof surveyInstances.$inferInsert;

/**
 * 설문 응답(Survey Responses)
 * 개별 응답자의 전체 응답 세트
 */
export const surveyResponses = mysqlTable("survey_responses", {
  id: int("id").autoincrement().primaryKey(),
  instanceId: int("instanceId").notNull(),
  respondentName: varchar("respondentName", { length: 200 }),
  respondentEmail: varchar("respondentEmail", { length: 320 }),
  respondentDepartment: varchar("respondentDepartment", { length: 200 }),
  respondentRole: varchar("respondentRole", { length: 200 }),
  answers: json("answers").$type<Array<{
    questionId: number;
    questionText: string;
    answer: string | string[] | number;
  }>>().notNull(),
  completedAt: timestamp("completedAt"),
  ipAddress: varchar("ipAddress", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertSurveyResponse = typeof surveyResponses.$inferInsert;

/**
 * 설문 분석 리포트(Survey Analysis Reports)
 * AI가 설문 결과를 분석하여 생성한 리포트
 */
export const surveyAnalysisReports = mysqlTable("survey_analysis_reports", {
  id: int("id").autoincrement().primaryKey(),
  instanceId: int("instanceId").notNull(),
  clientProjectId: int("clientProjectId"),
  reportType: mysqlEnum("reportType", [
    "initial_analysis",    // 1차 담당자 설문 분석
    "company_analysis",    // 전사 설문 종합 분석
    "space_requirement",   // 공간 요구사항 분석
    "optimization",        // 최적화 제안
  ]).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  summary: text("summary"), // 요약
  content: longtext("content").notNull(), // 전체 리포트 (마크다운)
  insights: json("insights").$type<Array<{
    category: string;
    finding: string;
    recommendation: string;
    priority: "high" | "medium" | "low";
  }>>(),
  spaceRequirements: json("spaceRequirements").$type<{
    totalAreaNeeded: number; // ㎡
    breakdown: Array<{
      spaceType: string;
      areaNeeded: number;
      headcount: number;
      notes: string;
    }>;
  }>(),
  isBlurred: tinyint("isBlurred").default(1).notNull(), // 비회원에게 블러 처리
  viewCount: int("viewCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SurveyAnalysisReport = typeof surveyAnalysisReports.$inferSelect;
export type InsertSurveyAnalysisReport = typeof surveyAnalysisReports.$inferInsert;

/**
 * 자동 이메일 발송 로그(Auto Email Logs)
 * 설문 발송, 리포트 공유, 리마인더 등 자동 이메일 추적
 */
export const autoEmailLogs = mysqlTable("auto_email_logs", {
  id: int("id").autoincrement().primaryKey(),
  clientProjectId: int("clientProjectId"),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  recipientName: varchar("recipientName", { length: 200 }),
  emailType: mysqlEnum("emailType", [
    "initial_survey",       // 1차 설문 발송
    "survey_reminder",      // 설문 리마인더
    "analysis_report",      // 분석 리포트 공유
    "company_survey_link",  // 전사 설문 링크
    "company_survey_updated", // 수정된 전사 설문 링크
    "realestate_matches",   // 부동산 매물 매칭 결과
    "proposal",             // 제안서 발송
    "post_occupancy",       // 입주 후 만족도 설문
    "optimization_report",  // 3개월 최적화 리포트
  ]).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  status: mysqlEnum("status", ["queued", "sent", "delivered", "failed", "bounced"]).default("queued").notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>(), // 추가 정보 (설문 토큰, 리포트 ID 등)
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AutoEmailLog = typeof autoEmailLogs.$inferSelect;
export type InsertAutoEmailLog = typeof autoEmailLogs.$inferInsert;

// ============================================================
// Phase 4~5: 부동산 매물 매칭 + 프로그램 다이어그램
// ============================================================

/**
 * 부동산 검색 조건(Real Estate Search Criteria)
 * 이사 시 고객의 부동산 매물 검색 조건
 */
export const realestateSearchCriteria = mysqlTable("realestate_search_criteria", {
  id: int("id").autoincrement().primaryKey(),
  clientProjectId: int("clientProjectId").notNull(),
  projectType: mysqlEnum("projectType", ["relocation", "renovation"]).notNull(),
  desiredArea: decimal("desiredArea", { precision: 10, scale: 2 }), // 희망 면적 (㎡)
  minArea: decimal("minArea", { precision: 10, scale: 2 }),
  maxArea: decimal("maxArea", { precision: 10, scale: 2 }),
  desiredLocation: text("desiredLocation"), // 희망 지역
  budgetMin: decimal("budgetMin", { precision: 15, scale: 0 }),
  budgetMax: decimal("budgetMax", { precision: 15, scale: 0 }),
  moveInDate: varchar("moveInDate", { length: 20 }),
  floorPreference: varchar("floorPreference", { length: 100 }), // 층수 선호
  buildingType: varchar("buildingType", { length: 100 }), // 건물 유형
  parkingNeeded: int("parkingNeeded"), // 필요 주차 대수
  additionalRequirements: text("additionalRequirements"),
  status: mysqlEnum("status", ["searching", "matched", "viewing", "selected", "closed"]).default("searching").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RealestateSearchCriteria = typeof realestateSearchCriteria.$inferSelect;
export type InsertRealestateSearchCriteria = typeof realestateSearchCriteria.$inferInsert;

/**
 * 부동산 매물 매칭(Real Estate Matches)
 * OpsX 부동산 DB에서 매칭된 매물 목록
 */
export const realestateMatches = mysqlTable("realestate_matches", {
  id: int("id").autoincrement().primaryKey(),
  searchCriteriaId: int("searchCriteriaId").notNull(),
  clientProjectId: int("clientProjectId").notNull(),
  propertyName: varchar("propertyName", { length: 300 }).notNull(),
  address: text("address").notNull(),
  totalArea: decimal("totalArea", { precision: 10, scale: 2 }), // ㎡
  usableArea: decimal("usableArea", { precision: 10, scale: 2 }),
  floor: varchar("floor", { length: 50 }),
  buildingName: varchar("buildingName", { length: 200 }),
  monthlyRent: decimal("monthlyRent", { precision: 15, scale: 0 }),
  deposit: decimal("deposit", { precision: 15, scale: 0 }),
  managementFee: decimal("managementFee", { precision: 15, scale: 0 }),
  floorPlanUrl: text("floorPlanUrl"), // 기본 평면도
  photoUrls: json("photoUrls").$type<string[]>(),
  matchScore: int("matchScore"), // 매칭 점수 (0~100)
  matchReasons: json("matchReasons").$type<string[]>(), // 매칭 이유
  status: mysqlEnum("status", ["matched", "shortlisted", "viewing_scheduled", "viewed", "selected", "rejected"]).default("matched").notNull(),
  clientNotes: text("clientNotes"),
  viewingDate: varchar("viewingDate", { length: 20 }),
  externalSource: varchar("externalSource", { length: 100 }), // OpsX, 직방, 다방 등
  externalId: varchar("externalId", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RealestateMatch = typeof realestateMatches.$inferSelect;
export type InsertRealestateMatch = typeof realestateMatches.$inferInsert;

/**
 * 프로그램 다이어그램(Program Diagrams)
 * 매물 평면도 위에 공간 프로그램 배치
 */
export const programDiagrams = mysqlTable("program_diagrams", {
  id: int("id").autoincrement().primaryKey(),
  clientProjectId: int("clientProjectId").notNull(),
  realestateMatchId: int("realestateMatchId"), // 특정 매물에 대한 다이어그램
  floorPlanId: int("floorPlanId"), // 기존 도면에 대한 다이어그램
  title: varchar("title", { length: 300 }).notNull(),
  diagramData: json("diagramData").$type<{
    zones: Array<{
      id: string;
      name: string;
      type: string; // "open_office" | "private_office" | "meeting" | "lounge" | "reception" | "utility" | "storage"
      area: number;
      headcount: number;
      x: number;
      y: number;
      width: number;
      height: number;
      color: string;
    }>;
    adjacencyMatrix?: Record<string, Record<string, number>>;
    totalArea: number;
    utilizationRate: number;
  }>().notNull(),
  aiAnalysis: text("aiAnalysis"), // AI 분석 코멘트
  version: int("version").default(1),
  isSelected: tinyint("isSelected").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ProgramDiagram = typeof programDiagrams.$inferSelect;
export type InsertProgramDiagram = typeof programDiagrams.$inferInsert;

// ============================================================
// Phase 8~9: 일일 보고서 + 납품사 견적 AI 학습
// ============================================================

/**
 * 일일 현장 보고서(Daily Site Reports)
 * 직원이 매일 작성하는 현장 보고서 (기존 opsWorkReports와 별도 — 표준화된 일일 양식)
 */
export const dailySiteReports = mysqlTable("daily_site_reports", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(), // ops_projects.id
  authorId: int("authorId").notNull(), // users.id
  reportDate: varchar("reportDate", { length: 20 }).notNull(), // YYYY-MM-DD
  // 날씨/기온
  weather: varchar("weather", { length: 50 }),
  temperature: varchar("temperature", { length: 20 }),
  // 인력 투입
  workersInternal: int("workersInternal").default(0), // 자사 인원
  workersExternal: int("workersExternal").default(0), // 외주 인원
  workerDetails: json("workerDetails").$type<Array<{
    company: string;
    trade: string;
    count: number;
  }>>(),
  // 작업 내용
  workCompleted: text("workCompleted").notNull(), // 금일 작업 내용
  workPlanned: text("workPlanned"), // 내일 작업 예정
  // 자재 입고
  materialsReceived: json("materialsReceived").$type<Array<{
    name: string;
    quantity: number;
    unit: string;
    supplier: string;
  }>>(),
  // 안전/품질
  safetyChecklist: json("safetyChecklist").$type<Array<{
    item: string;
    checked: boolean;
    note?: string;
  }>>(),
  qualityIssues: text("qualityIssues"),
  // 특이사항
  specialNotes: text("specialNotes"),
  clientRequests: text("clientRequests"), // 고객 요청사항
  // 사진
  photoUrls: json("photoUrls").$type<string[]>(),
  // 공정 진행률
  overallProgress: int("overallProgress"), // 0~100
  scheduleStatus: mysqlEnum("scheduleStatus", ["on_track", "ahead", "delayed"]).default("on_track"),
  // 상태
  status: mysqlEnum("status", ["draft", "submitted", "reviewed", "approved"]).default("draft").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DailySiteReport = typeof dailySiteReports.$inferSelect;
export type InsertDailySiteReport = typeof dailySiteReports.$inferInsert;

/**
 * 납품사 견적(Vendor Quotes)
 * 납품사가 제출한 견적서 메타데이터
 */
export const vendorQuotes = mysqlTable("vendor_quotes", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(), // ops_projects.id
  subcontractorId: int("subcontractorId"), // ops_subcontractors.id
  vendorName: varchar("vendorName", { length: 200 }).notNull(),
  vendorContact: varchar("vendorContact", { length: 200 }),
  vendorEmail: varchar("vendorEmail", { length: 320 }),
  vendorPhone: varchar("vendorPhone", { length: 30 }),
  quoteNumber: varchar("quoteNumber", { length: 100 }),
  quoteDate: varchar("quoteDate", { length: 20 }),
  validUntil: varchar("validUntil", { length: 20 }),
  // 파일
  fileUrl: text("fileUrl"), // 업로드된 견적서 파일 (PDF/Excel)
  fileKey: varchar("fileKey", { length: 500 }),
  fileName: varchar("fileName", { length: 300 }),
  fileType: varchar("fileType", { length: 50 }),
  // 금액
  totalAmount: decimal("totalAmount", { precision: 15, scale: 0 }),
  vatAmount: decimal("vatAmount", { precision: 15, scale: 0 }),
  // AI 파싱 결과
  aiParsed: tinyint("aiParsed").default(0), // AI가 파싱했는지
  aiParsedData: json("aiParsedData").$type<{
    items: Array<{
      name: string;
      specification: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      amount: number;
      category: string;
    }>;
    summary: string;
    confidence: number; // 0~1
  }>(),
  // 상태
  status: mysqlEnum("status", ["submitted", "reviewing", "accepted", "rejected", "revised"]).default("submitted").notNull(),
  reviewNotes: text("reviewNotes"),
  category: varchar("category", { length: 100 }), // 공종 (전기, 설비, 목공 등)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VendorQuote = typeof vendorQuotes.$inferSelect;
export type InsertVendorQuote = typeof vendorQuotes.$inferInsert;

/**
 * 납품사 견적 항목(Vendor Quote Items)
 * 견적서에서 파싱된 개별 항목 (수동 입력 또는 AI 파싱)
 */
export const vendorQuoteItems = mysqlTable("vendor_quote_items", {
  id: int("id").autoincrement().primaryKey(),
  quoteId: int("quoteId").notNull(), // vendor_quotes.id
  itemName: varchar("itemName", { length: 300 }).notNull(),
  specification: text("specification"),
  unit: varchar("unit", { length: 50 }),
  quantity: decimal("quantity", { precision: 10, scale: 2 }),
  unitPrice: decimal("unitPrice", { precision: 15, scale: 0 }),
  amount: decimal("amount", { precision: 15, scale: 0 }),
  category: varchar("category", { length: 100 }), // 자재 카테고리
  materialCode: varchar("materialCode", { length: 100 }), // 자재 코드 (표준화)
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type VendorQuoteItem = typeof vendorQuoteItems.$inferSelect;
export type InsertVendorQuoteItem = typeof vendorQuoteItems.$inferInsert;

/**
 * 자재 단가 이력(Material Price History)
 * 납품사 견적에서 추출된 자재별 단가 변동 추적
 */
export const materialPriceHistory = mysqlTable("material_price_history", {
  id: int("id").autoincrement().primaryKey(),
  materialCode: varchar("materialCode", { length: 100 }).notNull(),
  materialName: varchar("materialName", { length: 300 }).notNull(),
  category: varchar("category", { length: 100 }),
  specification: text("specification"),
  unit: varchar("unit", { length: 50 }),
  unitPrice: decimal("unitPrice", { precision: 15, scale: 0 }).notNull(),
  vendorName: varchar("vendorName", { length: 200 }),
  vendorQuoteId: int("vendorQuoteId"), // vendor_quotes.id
  projectId: int("projectId"),
  priceDate: varchar("priceDate", { length: 20 }).notNull(), // YYYY-MM-DD
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MaterialPriceHistory = typeof materialPriceHistory.$inferSelect;
export type InsertMaterialPriceHistory = typeof materialPriceHistory.$inferInsert;

/**
 * 자재 단가 분석(Material Price Analytics)
 * AI가 분석한 자재별 단가 트렌드 및 이상치
 */
export const materialPriceAnalytics = mysqlTable("material_price_analytics", {
  id: int("id").autoincrement().primaryKey(),
  materialCode: varchar("materialCode", { length: 100 }).notNull(),
  materialName: varchar("materialName", { length: 300 }).notNull(),
  category: varchar("category", { length: 100 }),
  // 통계
  avgPrice: decimal("avgPrice", { precision: 15, scale: 0 }),
  minPrice: decimal("minPrice", { precision: 15, scale: 0 }),
  maxPrice: decimal("maxPrice", { precision: 15, scale: 0 }),
  priceChangeRate: decimal("priceChangeRate", { precision: 5, scale: 2 }), // 변동률 (%)
  sampleCount: int("sampleCount").default(0),
  // AI 분석
  trendDirection: mysqlEnum("trendDirection", ["rising", "stable", "falling"]).default("stable"),
  aiInsight: text("aiInsight"), // AI 분석 코멘트
  alertLevel: mysqlEnum("alertLevel", ["normal", "watch", "alert"]).default("normal"),
  // 기간
  periodStart: varchar("periodStart", { length: 20 }),
  periodEnd: varchar("periodEnd", { length: 20 }),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MaterialPriceAnalytic = typeof materialPriceAnalytics.$inferSelect;
export type InsertMaterialPriceAnalytic = typeof materialPriceAnalytics.$inferInsert;

// ============================================================
// Phase 10: 사후관리 + OpsX Insight 구독
// ============================================================

/**
 * 입주 후 만족도 설문(Post-Occupancy Surveys)
 * 입주 1주 후 자동 발송되는 만족도 설문
 */
export const postOccupancySurveys = mysqlTable("post_occupancy_surveys", {
  id: int("id").autoincrement().primaryKey(),
  clientProjectId: int("clientProjectId").notNull(),
  opsProjectId: int("opsProjectId"), // ops_projects.id
  surveyInstanceId: int("surveyInstanceId"), // survey_instances.id
  overallSatisfaction: int("overallSatisfaction"), // 1~5
  designSatisfaction: int("designSatisfaction"),
  constructionSatisfaction: int("constructionSatisfaction"),
  communicationSatisfaction: int("communicationSatisfaction"),
  timelineSatisfaction: int("timelineSatisfaction"),
  issuesReported: json("issuesReported").$type<Array<{
    area: string;
    description: string;
    severity: "minor" | "moderate" | "major";
    photoUrl?: string;
  }>>(),
  positiveComments: text("positiveComments"),
  improvementSuggestions: text("improvementSuggestions"),
  wouldRecommend: tinyint("wouldRecommend"), // NPS
  status: mysqlEnum("status", ["pending", "sent", "completed", "follow_up_needed"]).default("pending").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PostOccupancySurvey = typeof postOccupancySurveys.$inferSelect;
export type InsertPostOccupancySurvey = typeof postOccupancySurveys.$inferInsert;

/**
 * 유지보수 방문(Maintenance Visits)
 * 입주 후 미세 조정 방문 예약 및 기록
 */
export const maintenanceVisits = mysqlTable("maintenance_visits", {
  id: int("id").autoincrement().primaryKey(),
  clientProjectId: int("clientProjectId").notNull(),
  opsProjectId: int("opsProjectId"),
  visitType: mysqlEnum("visitType", [
    "fine_tuning",     // 미세 조정
    "warranty",        // 하자보수
    "optimization",    // 공간 최적화
    "inspection",      // 정기 점검
  ]).notNull(),
  scheduledDate: varchar("scheduledDate", { length: 20 }).notNull(),
  scheduledTime: varchar("scheduledTime", { length: 10 }),
  technicianId: int("technicianId"), // 담당 기사 (users.id)
  technicianName: varchar("technicianName", { length: 200 }),
  description: text("description"),
  workPerformed: text("workPerformed"),
  issuesFound: json("issuesFound").$type<Array<{
    area: string;
    issue: string;
    resolution: string;
    status: "resolved" | "pending" | "escalated";
  }>>(),
  photoUrls: json("photoUrls").$type<string[]>(),
  clientSignature: text("clientSignature"), // 고객 서명 (base64)
  status: mysqlEnum("status", ["scheduled", "confirmed", "in_progress", "completed", "cancelled", "rescheduled"]).default("scheduled").notNull(),
  completedAt: timestamp("completedAt"),
  clientFeedback: text("clientFeedback"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MaintenanceVisit = typeof maintenanceVisits.$inferSelect;
export type InsertMaintenanceVisit = typeof maintenanceVisits.$inferInsert;

/**
 * OpsX Insight 구독(Insight Subscriptions)
 * 공간 데이터 수집 및 최적화 리포트 구독
 */
export const insightSubscriptions = mysqlTable("insight_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  clientProjectId: int("clientProjectId").notNull(),
  opsProjectId: int("opsProjectId"),
  clientUserId: int("clientUserId"), // 구독 고객 (users.id)
  plan: mysqlEnum("plan", ["basic", "standard", "premium"]).default("basic").notNull(),
  // basic: 분기별 리포트 / standard: 월별 리포트 + 실시간 대시보드 / premium: 주별 + AI 최적화 제안
  status: mysqlEnum("status", ["active", "paused", "cancelled", "expired"]).default("active").notNull(),
  startDate: varchar("startDate", { length: 20 }).notNull(),
  endDate: varchar("endDate", { length: 20 }),
  nextReportDate: varchar("nextReportDate", { length: 20 }),
  monthlyFee: decimal("monthlyFee", { precision: 10, scale: 0 }),
  // 센서 연동
  sensorProjectId: int("sensorProjectId"), // space_projects.id (DDIA)
  sensorsInstalled: json("sensorsInstalled").$type<Array<{
    type: string;
    location: string;
    sensorId: number;
  }>>(),
  // 리포트 이력
  lastReportId: int("lastReportId"),
  totalReports: int("totalReports").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InsightSubscription = typeof insightSubscriptions.$inferSelect;
export type InsertInsightSubscription = typeof insightSubscriptions.$inferInsert;

/**
 * 공간 최적화 리포트(Space Optimization Reports)
 * 3개월 주기 자동 생성되는 최적화 제안 리포트
 */
export const spaceOptimizationReports = mysqlTable("space_optimization_reports", {
  id: int("id").autoincrement().primaryKey(),
  subscriptionId: int("subscriptionId").notNull(), // insight_subscriptions.id
  clientProjectId: int("clientProjectId").notNull(),
  reportPeriod: varchar("reportPeriod", { length: 50 }).notNull(), // "2026-Q1" 등
  // 데이터 분석 결과
  occupancyAnalysis: json("occupancyAnalysis").$type<{
    avgOccupancy: number;
    peakOccupancy: number;
    underutilizedZones: Array<{ zone: string; utilization: number }>;
    overutilizedZones: Array<{ zone: string; utilization: number }>;
  }>(),
  environmentAnalysis: json("environmentAnalysis").$type<{
    avgTemperature: number;
    avgHumidity: number;
    avgAirQuality: number;
    avgLightLevel: number;
    problemAreas: Array<{ zone: string; issue: string; severity: string }>;
  }>(),
  trafficAnalysis: json("trafficAnalysis").$type<{
    hotspots: Array<{ zone: string; trafficCount: number }>;
    bottlenecks: Array<{ zone: string; description: string }>;
  }>(),
  // AI 최적화 제안
  optimizationSuggestions: json("optimizationSuggestions").$type<Array<{
    type: "wall_change" | "furniture" | "lighting" | "hvac" | "layout";
    zone: string;
    currentState: string;
    proposedChange: string;
    expectedImprovement: string;
    estimatedCost: number;
    priority: "high" | "medium" | "low";
    rewallCompatible: boolean; // Re:Wall로 가능한지
  }>>(),
  // 리포트 내용
  summary: text("summary"),
  fullReport: longtext("fullReport"), // 마크다운
  // 상태
  status: mysqlEnum("status", ["generating", "ready", "sent", "reviewed"]).default("generating").notNull(),
  sentAt: timestamp("sentAt"),
  viewedAt: timestamp("viewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SpaceOptimizationReport = typeof spaceOptimizationReports.$inferSelect;
export type InsertSpaceOptimizationReport = typeof spaceOptimizationReports.$inferInsert;

// ============================================================
// 직원 포털: KPI/OKR
// ============================================================

/**
 * KPI 정의(KPI Definitions)
 * 부서별/역할별 KPI 항목 정의
 */
export const kpiDefinitions = mysqlTable("kpi_definitions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 300 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }), // "project", "sales", "quality", "efficiency"
  department: varchar("department", { length: 100 }), // 대상 부서 (null이면 전사)
  measureUnit: varchar("measureUnit", { length: 50 }), // %, 건, 원, 점
  targetValue: decimal("targetValue", { precision: 15, scale: 2 }),
  weight: int("weight").default(100), // 가중치 (%)
  frequency: mysqlEnum("frequency", ["daily", "weekly", "monthly", "quarterly", "yearly"]).default("monthly").notNull(),
  calculationMethod: mysqlEnum("calculationMethod", [
    "manual",       // 수동 입력
    "auto_count",   // 자동 카운트 (DB 쿼리)
    "auto_sum",     // 자동 합계
    "auto_avg",     // 자동 평균
    "formula",      // 수식 기반
  ]).default("manual").notNull(),
  autoQuery: text("autoQuery"), // 자동 집계 시 사용할 쿼리 힌트
  isActive: tinyint("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type KpiDefinition = typeof kpiDefinitions.$inferSelect;
export type InsertKpiDefinition = typeof kpiDefinitions.$inferInsert;

/**
 * KPI 기록(KPI Records)
 * 직원별 KPI 실적 기록
 */
export const kpiRecords = mysqlTable("kpi_records", {
  id: int("id").autoincrement().primaryKey(),
  kpiId: int("kpiId").notNull(), // kpi_definitions.id
  userId: int("userId").notNull(), // users.id
  period: varchar("period", { length: 20 }).notNull(), // "2026-01", "2026-Q1" 등
  targetValue: decimal("targetValue", { precision: 15, scale: 2 }),
  actualValue: decimal("actualValue", { precision: 15, scale: 2 }),
  achievementRate: decimal("achievementRate", { precision: 5, scale: 2 }), // 달성률 (%)
  notes: text("notes"),
  evidence: json("evidence").$type<Array<{
    type: string;
    description: string;
    url?: string;
  }>>(),
  status: mysqlEnum("status", ["pending", "submitted", "approved", "rejected"]).default("pending").notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type KpiRecord = typeof kpiRecords.$inferSelect;
export type InsertKpiRecord = typeof kpiRecords.$inferInsert;

/**
 * OKR 목표(OKR Objectives)
 * 분기별 OKR 목표
 */
export const okrObjectives = mysqlTable("okr_objectives", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // users.id
  parentId: int("parentId"), // 상위 목표 (회사 → 부서 → 개인)
  level: mysqlEnum("level", ["company", "department", "team", "individual"]).default("individual").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  period: varchar("period", { length: 20 }).notNull(), // "2026-Q1"
  progress: int("progress").default(0), // 0~100
  status: mysqlEnum("status", ["draft", "active", "completed", "cancelled"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OkrObjective = typeof okrObjectives.$inferSelect;
export type InsertOkrObjective = typeof okrObjectives.$inferInsert;

/**
 * OKR 핵심 결과(OKR Key Results)
 * 각 목표에 대한 측정 가능한 핵심 결과
 */
export const okrKeyResults = mysqlTable("okr_key_results", {
  id: int("id").autoincrement().primaryKey(),
  objectiveId: int("objectiveId").notNull(), // okr_objectives.id
  title: varchar("title", { length: 500 }).notNull(),
  measureType: mysqlEnum("measureType", ["number", "percentage", "currency", "boolean"]).default("number").notNull(),
  startValue: decimal("startValue", { precision: 15, scale: 2 }).default("0"),
  targetValue: decimal("targetValue", { precision: 15, scale: 2 }).notNull(),
  currentValue: decimal("currentValue", { precision: 15, scale: 2 }).default("0"),
  progress: int("progress").default(0), // 0~100
  confidence: mysqlEnum("confidence", ["on_track", "at_risk", "off_track"]).default("on_track"),
  notes: text("notes"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type OkrKeyResult = typeof okrKeyResults.$inferSelect;
export type InsertOkrKeyResult = typeof okrKeyResults.$inferInsert;

// ============================================================
// Re:Wall 확장 포인트 (예약 — 법인 설립 후 활성화)
// ============================================================

/**
 * Re:Wall 제품 카탈로그 (예약)
 */
export const rewallProducts = mysqlTable("rewall_products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 300 }).notNull(),
  sku: varchar("sku", { length: 100 }),
  category: varchar("category", { length: 100 }), // "wall_panel", "partition", "door", "accessory"
  description: text("description"),
  specifications: json("specifications").$type<Record<string, string>>(),
  pricePerUnit: decimal("pricePerUnit", { precision: 15, scale: 0 }),
  unit: varchar("unit", { length: 50 }), // "㎡", "개", "m"
  imageUrls: json("imageUrls").$type<string[]>(),
  isActive: tinyint("isActive").default(0).notNull(), // 법인 설립 전 비활성
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RewallProduct = typeof rewallProducts.$inferSelect;
export type InsertRewallProduct = typeof rewallProducts.$inferInsert;

/**
 * Re:Wall 구독 계약 (예약)
 */
export const rewallSubscriptions = mysqlTable("rewall_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  clientProjectId: int("clientProjectId"),
  clientUserId: int("clientUserId"),
  plan: mysqlEnum("plan", ["purchase", "lease", "rental"]).default("rental").notNull(),
  monthlyFee: decimal("monthlyFee", { precision: 15, scale: 0 }),
  contractMonths: int("contractMonths"),
  totalValue: decimal("totalValue", { precision: 15, scale: 0 }),
  status: mysqlEnum("status", ["draft", "active", "paused", "cancelled", "expired"]).default("draft").notNull(),
  startDate: varchar("startDate", { length: 20 }),
  endDate: varchar("endDate", { length: 20 }),
  items: json("items").$type<Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RewallSubscription = typeof rewallSubscriptions.$inferSelect;
export type InsertRewallSubscription = typeof rewallSubscriptions.$inferInsert;


// ============================================================
// 하도급 업체 등록 승인 + 공종별 계약서 + 발주서/견적요청 시스템
// ============================================================

/**
 * 공종 카테고리(Trade Categories)
 * 하도급 업체의 전문 공종 분류 (전기, 설비, 목공, 도장 등)
 */
export const tradeCategories = mysqlTable("trade_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // 공종명 (전기공사, 설비공사, 목공사 등)
  code: varchar("code", { length: 20 }).notNull().unique(), // 코드 (ELEC, PLUM, WOOD 등)
  description: text("description"),
  parentId: int("parentId"), // 상위 카테고리 (대분류→중분류)
  sortOrder: int("sortOrder").default(0),
  isActive: tinyint("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TradeCategory = typeof tradeCategories.$inferSelect;
export type InsertTradeCategory = typeof tradeCategories.$inferInsert;

/**
 * 업체-공종 매핑(Subcontractor Trade Mappings)
 * 하도급 업체가 수행 가능한 공종 목록
 */
export const subcontractorTrades = mysqlTable("subcontractor_trades", {
  id: int("id").autoincrement().primaryKey(),
  subcontractorId: int("subcontractorId").notNull(),
  tradeCategoryId: int("tradeCategoryId").notNull(),
  isPrimary: tinyint("isPrimary").default(0).notNull(), // 주력 공종 여부
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SubcontractorTrade = typeof subcontractorTrades.$inferSelect;
export type InsertSubcontractorTrade = typeof subcontractorTrades.$inferInsert;

/**
 * 업체 등록 요청(Subcontractor Registration Requests)
 * 직원이 업체를 등록 요청 → 담당자 1차 승인 → 관리자 최종 승인
 */
export const subRegistrationRequests = mysqlTable("sub_registration_requests", {
  id: int("id").autoincrement().primaryKey(),
  // 업체 기본 정보
  companyName: varchar("companyName", { length: 200 }).notNull(),
  businessNumber: varchar("businessNumber", { length: 20 }),
  representativeName: varchar("representativeName", { length: 100 }),
  contactName: varchar("contactName", { length: 100 }),
  contactPhone: varchar("contactPhone", { length: 30 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  address: text("address"),
  // 공종 정보 (JSON으로 여러 공종 저장)
  tradeIds: json("tradeIds").$type<number[]>(), // trade_categories.id 배열
  specialty: varchar("specialty", { length: 500 }), // 상세 전문 분야 텍스트
  // 계좌 정보
  bankName: varchar("bankName", { length: 100 }),
  bankAccount: varchar("bankAccount", { length: 50 }),
  bankHolder: varchar("bankHolder", { length: 100 }),
  // 첨부 서류
  businessLicenseUrl: text("businessLicenseUrl"), // 사업자등록증 S3 URL
  businessLicenseKey: varchar("businessLicenseKey", { length: 500 }),
  // 등록 요청 상태
  status: mysqlEnum("status", [
    "pending",           // 등록 요청 대기
    "staff_approved",    // 담당자 1차 승인
    "approved",          // 관리자 최종 승인
    "rejected",          // 반려
  ]).default("pending").notNull(),
  // 요청자
  requestedBy: int("requestedBy").notNull(), // 등록 요청한 직원 users.id
  requestedByName: varchar("requestedByName", { length: 100 }),
  // 1차 승인 (담당자)
  staffApprovedBy: int("staffApprovedBy"),
  staffApprovedByName: varchar("staffApprovedByName", { length: 100 }),
  staffApprovedAt: timestamp("staffApprovedAt"),
  staffComment: text("staffComment"),
  // 최종 승인 (관리자)
  adminApprovedBy: int("adminApprovedBy"),
  adminApprovedByName: varchar("adminApprovedByName", { length: 100 }),
  adminApprovedAt: timestamp("adminApprovedAt"),
  adminComment: text("adminComment"),
  // 반려 정보
  rejectedBy: int("rejectedBy"),
  rejectedByName: varchar("rejectedByName", { length: 100 }),
  rejectedAt: timestamp("rejectedAt"),
  rejectionReason: text("rejectionReason"),
  // 승인 후 생성된 subcontractor ID
  subcontractorId: int("subcontractorId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SubRegistrationRequest = typeof subRegistrationRequests.$inferSelect;
export type InsertSubRegistrationRequest = typeof subRegistrationRequests.$inferInsert;

/**
 * 공종별 계약서 템플릿(Trade Contract Templates)
 * 공종별로 다른 계약서 양식을 관리
 */
export const tradeContractTemplates = mysqlTable("trade_contract_templates", {
  id: int("id").autoincrement().primaryKey(),
  tradeCategoryId: int("tradeCategoryId").notNull(),
  name: varchar("name", { length: 300 }).notNull(), // 계약서 템플릿 명
  content: longtext("content").notNull(), // 계약서 본문 (마크다운/HTML)
  validityMonths: int("validityMonths").default(12).notNull(), // 유효 기간 (기본 12개월)
  version: int("version").default(1),
  isActive: tinyint("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TradeContractTemplate = typeof tradeContractTemplates.$inferSelect;
export type InsertTradeContractTemplate = typeof tradeContractTemplates.$inferInsert;

/**
 * 하도급 계약(Subcontractor Contracts)
 * 승인된 업체와 공종별로 체결하는 1년 유효 계약
 */
export const subContracts = mysqlTable("sub_contracts", {
  id: int("id").autoincrement().primaryKey(),
  subcontractorId: int("subcontractorId").notNull(),
  tradeCategoryId: int("tradeCategoryId").notNull(),
  templateId: int("templateId"), // 사용된 템플릿
  contractNumber: varchar("contractNumber", { length: 50 }).notNull(), // 계약번호
  title: varchar("title", { length: 300 }).notNull(),
  content: longtext("content").notNull(), // 실제 계약서 내용
  // 계약 당사자
  partyA: varchar("partyA", { length: 200 }).notNull().default("주식회사 고감도"), // 갑
  partyB: varchar("partyB", { length: 200 }).notNull(), // 을 (협력사)
  // 유효 기간
  startDate: varchar("startDate", { length: 20 }).notNull(),
  endDate: varchar("endDate", { length: 20 }).notNull(),
  // 서명/도장
  partyASignatureUrl: text("partyASignatureUrl"), // 고감도 서명/도장 S3 URL
  partyASignatureKey: varchar("partyASignatureKey", { length: 500 }),
  partyBSignatureUrl: text("partyBSignatureUrl"), // 협력사 서명/도장 S3 URL
  partyBSignatureKey: varchar("partyBSignatureKey", { length: 500 }),
  partyASignedAt: timestamp("partyASignedAt"),
  partyBSignedAt: timestamp("partyBSignedAt"),
  partyASignedBy: int("partyASignedBy"), // 고감도 측 서명자
  partyBSignerName: varchar("partyBSignerName", { length: 100 }), // 협력사 측 서명자 이름
  // 계약서 PDF
  pdfUrl: text("pdfUrl"),
  pdfKey: varchar("pdfKey", { length: 500 }),
  // 상태
  status: mysqlEnum("status", [
    "draft",         // 초안
    "pending_b",     // 협력사 서명 대기
    "pending_a",     // 고감도 서명 대기
    "active",        // 체결 완료 (양측 서명)
    "expired",       // 만료
    "terminated",    // 해지
  ]).default("draft").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SubContract = typeof subContracts.$inferSelect;
export type InsertSubContract = typeof subContracts.$inferInsert;

/**
 * 발주서(Purchase Orders)
 * 내부 직원이 생성하는 발주서 (자재/공사 발주)
 */
export const purchaseOrders = mysqlTable("purchase_orders", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(), // ops_projects.id
  poNumber: varchar("poNumber", { length: 50 }).notNull(), // 발주번호 (PO-2026-0001)
  title: varchar("title", { length: 300 }).notNull(),
  // 발주 항목
  items: json("items").$type<Array<{
    id: number;
    tradeCategoryId: number;      // 공종 카테고리 ID
    tradeCategoryName: string;    // 공종명
    description: string;          // 품목 설명
    specification: string;        // 규격
    unit: string;                 // 단위
    quantity: number;             // 수량
    estimatedUnitPrice: number;   // 예상 단가
    estimatedAmount: number;      // 예상 금액
    remarks?: string;
  }>>(),
  estimatedTotal: decimal("estimatedTotal", { precision: 15, scale: 0 }),
  // 발주 정보
  requiredDate: varchar("requiredDate", { length: 20 }), // 납품 요청일
  deliveryAddress: text("deliveryAddress"),
  // 작성자
  authorId: int("authorId").notNull(),
  authorName: varchar("authorName", { length: 100 }),
  // 상태
  status: mysqlEnum("status", [
    "draft",              // 초안
    "rfq_sent",           // 견적요청 발송됨
    "quotes_received",    // 견적 수신 중
    "quote_selected",     // 견적 선정 완료
    "ordered",            // 발주 완료
    "delivered",          // 납품 완료
    "cancelled",          // 취소
  ]).default("draft").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;

/**
 * 견적요청(RFQ - Request for Quotation)
 * 발주서 항목에 대해 협력사에게 보내는 견적 요청
 */
export const rfqRequests = mysqlTable("rfq_requests", {
  id: int("id").autoincrement().primaryKey(),
  purchaseOrderId: int("purchaseOrderId").notNull(),
  subcontractorId: int("subcontractorId").notNull(),
  // 요청 항목 (발주서 항목 중 해당 업체에 해당하는 것만)
  itemIds: json("itemIds").$type<number[]>(), // purchaseOrders.items[].id 배열
  // 상태
  status: mysqlEnum("status", [
    "sent",         // 발송됨
    "viewed",       // 열람됨
    "quoted",       // 견적 제출됨
    "selected",     // 선정됨
    "not_selected", // 미선정
    "expired",      // 만료
  ]).default("sent").notNull(),
  // 견적 응답
  quotedItems: json("quotedItems").$type<Array<{
    itemId: number;
    unitPrice: number;
    amount: number;
    leadTime: string;   // 납기
    remarks?: string;
  }>>(),
  quotedTotal: decimal("quotedTotal", { precision: 15, scale: 0 }),
  quotedAt: timestamp("quotedAt"),
  // 토큰 (협력사 접근용)
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt"),
  sentAt: timestamp("sentAt"),
  viewedAt: timestamp("viewedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RfqRequest = typeof rfqRequests.$inferSelect;
export type InsertRfqRequest = typeof rfqRequests.$inferInsert;


// ============================================================
// 소프트 삭제 로그 (Deletion Log)
// Admin이 삭제한 항목의 전체 데이터를 보관하여 복구 가능
// ============================================================
export const deletionLogs = mysqlTable("deletion_logs", {
  id: int("id").autoincrement().primaryKey(),
  /** 원본 테이블 이름 */
  tableName: varchar("tableName", { length: 100 }).notNull(),
  /** 원본 레코드 ID */
  recordId: int("recordId").notNull(),
  /** 삭제 전 전체 데이터 (JSON) */
  recordData: json("recordData").notNull(),
  /** 삭제한 관리자 ID */
  deletedByUserId: int("deletedByUserId").notNull(),
  /** 삭제한 관리자 이름 */
  deletedByUserName: varchar("deletedByUserName", { length: 200 }),
  /** 삭제 사유 (선택) */
  reason: text("reason"),
  /** 복구 여부 */
  restored: mysqlEnum("restored", ["yes", "no"]).default("no").notNull(),
  /** 복구한 관리자 ID */
  restoredByUserId: int("restoredByUserId"),
  /** 복구 시각 */
  restoredAt: timestamp("restoredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DeletionLog = typeof deletionLogs.$inferSelect;
export type InsertDeletionLog = typeof deletionLogs.$inferInsert;


// ============================================================
// 직원 가입신청 / 초대 (Staff Applications & Invitations)
// ============================================================

/**
 * 직원 가입 신청 (자가 가입 → 관리자 승인)
 */
export const staffApplications = mysqlTable("staff_applications", {
  id: int("id").autoincrement().primaryKey(),
  /** 신청자 이름 */
  name: varchar("name", { length: 200 }).notNull(),
  /** 신청자 이메일 */
  email: varchar("email", { length: 320 }).notNull(),
  /** 신청자 전화번호 */
  phone: varchar("phone", { length: 30 }),
  /** 희망 부서 */
  department: mysqlEnum("department", [
    "design", "construction", "accounting", "management", "sales", "none",
  ]).default("none"),
  /** 자기소개 / 메모 */
  message: text("message"),
  /** 상태 */
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  /** 승인/거절한 관리자 ID */
  reviewedByUserId: int("reviewedByUserId"),
  /** 승인/거절 시각 */
  reviewedAt: timestamp("reviewedAt"),
  /** 거절 사유 */
  rejectReason: text("rejectReason"),
  /** 승인 후 생성된 사용자 ID */
  createdUserId: int("createdUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type StaffApplication = typeof staffApplications.$inferSelect;
export type InsertStaffApplication = typeof staffApplications.$inferInsert;

/**
 * 직원 초대 (관리자가 이메일 입력 → 초대 링크 발송)
 */
export const staffInvitations = mysqlTable("staff_invitations", {
  id: int("id").autoincrement().primaryKey(),
  /** 초대 이메일 */
  email: varchar("email", { length: 320 }).notNull(),
  /** 초대자(관리자) ID */
  invitedByUserId: int("invitedByUserId").notNull(),
  /** 초대 토큰 (URL에 포함) */
  token: varchar("token", { length: 128 }).notNull().unique(),
  /** 배정할 부서 */
  department: mysqlEnum("department", [
    "design", "construction", "accounting", "management", "sales", "none",
  ]).default("none"),
  /** 배정할 OpsX 역할 */
  opsRole: mysqlEnum("opsRole", [
    "pm", "designer", "site_manager", "accountant", "director", "staff",
  ]).default("staff"),
  /** 상태 */
  status: mysqlEnum("status", ["pending", "accepted", "expired", "cancelled"]).default("pending").notNull(),
  /** 수락 후 생성된 사용자 ID */
  acceptedUserId: int("acceptedUserId"),
  /** 수락 시각 */
  acceptedAt: timestamp("acceptedAt"),
  /** 만료 시각 (기본 7일) */
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type StaffInvitation = typeof staffInvitations.$inferSelect;
export type InsertStaffInvitation = typeof staffInvitations.$inferInsert;

// ============================================================
// 현장 카메라 관리 확장 (Site Camera Management)
// 기존 opsCameras 테이블 활용 + 카메라 이벤트 로그
// ============================================================

/**
 * 카메라 이벤트 로그 (접속, 오프라인, 스냅샷 등)
 */
export const opsCameraEvents = mysqlTable("ops_camera_events", {
  id: int("id").autoincrement().primaryKey(),
  cameraId: int("cameraId").notNull(),
  /** 이벤트 유형 */
  eventType: mysqlEnum("eventType", [
    "online",       // 카메라 온라인
    "offline",      // 카메라 오프라인
    "snapshot",     // 스냅샷 촬영
    "motion",       // 움직임 감지
    "error",        // 오류 발생
  ]).notNull(),
  /** 이벤트 상세 메시지 */
  message: text("message"),
  /** 스냅샷 URL (snapshot 이벤트 시) */
  snapshotUrl: text("snapshotUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type OpsCameraEvent = typeof opsCameraEvents.$inferSelect;
export type InsertOpsCameraEvent = typeof opsCameraEvents.$inferInsert;

// ============================================================
// 출퇴근 기록 (Attendance Records)
// ============================================================
export const attendanceRecords = mysqlTable("attendance_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** 출근 시각 */
  clockInAt: timestamp("clockInAt").notNull(),
  /** 퇴근 시각 */
  clockOutAt: timestamp("clockOutAt"),
  /** 근무 유형 */
  workType: mysqlEnum("workType", ["office", "site", "remote", "half_day"]).default("office").notNull(),
  /** 현장명 (현장 근무 시) */
  siteName: varchar("siteName", { length: 200 }),
  /** 메모 */
  memo: text("memo"),
  /** 총 근무 시간 (분) */
  totalMinutes: int("totalMinutes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = typeof attendanceRecords.$inferInsert;

// ============================================================
// 휴가 신청 (Leave Requests)
// ============================================================
export const leaveRequests = mysqlTable("leave_requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** 휴가 유형 */
  leaveType: mysqlEnum("leaveType", [
    "annual",       // 연차
    "half_am",      // 오전 반차
    "half_pm",      // 오후 반차
    "sick",         // 병가
    "special",      // 경조사
    "other",        // 기타
  ]).notNull(),
  /** 시작일 (YYYY-MM-DD) */
  startDate: varchar("startDate", { length: 10 }).notNull(),
  /** 종료일 (YYYY-MM-DD) */
  endDate: varchar("endDate", { length: 10 }).notNull(),
  /** 사유 */
  reason: text("reason"),
  /** 상태 */
  status: mysqlEnum("leaveStatus", ["pending", "approved", "rejected", "cancelled"]).default("pending").notNull(),
  /** 승인자 ID */
  approvedBy: int("approvedBy"),
  /** 승인/거절 시각 */
  reviewedAt: timestamp("reviewedAt"),
  /** 승인/거절 코멘트 */
  reviewComment: text("reviewComment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = typeof leaveRequests.$inferInsert;

// ============================================================
// Re:Wall 인벤토리 (Inventory)
// ============================================================
export const rewallInventory = mysqlTable("rewall_inventory", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  warehouseLocation: varchar("warehouseLocation", { length: 200 }),
  quantity: int("quantity").default(0).notNull(),
  reservedQuantity: int("reservedQuantity").default(0).notNull(),
  lastRestockedAt: timestamp("lastRestockedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RewallInventory = typeof rewallInventory.$inferSelect;
export type InsertRewallInventory = typeof rewallInventory.$inferInsert;

// ============================================================
// Re:Wall 예약 (Reservations)
// ============================================================
export const rewallReservations = mysqlTable("rewall_reservations", {
  id: int("id").autoincrement().primaryKey(),
  clientProjectId: int("clientProjectId"),
  userId: int("userId").notNull(),
  status: mysqlEnum("reservationStatus", ["draft", "confirmed", "in_progress", "completed", "cancelled"]).default("draft").notNull(),
  installDate: varchar("installDate", { length: 10 }),
  returnDate: varchar("returnDate", { length: 10 }),
  totalAmount: int("totalAmount").default(0),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RewallReservation = typeof rewallReservations.$inferSelect;
export type InsertRewallReservation = typeof rewallReservations.$inferInsert;

// ============================================================
// Re:Wall 예약 항목 (Reservation Items)
// ============================================================
export const rewallReservationItems = mysqlTable("rewall_reservation_items", {
  id: int("id").autoincrement().primaryKey(),
  reservationId: int("reservationId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  unitPrice: int("unitPrice").default(0).notNull(),
  subtotal: int("subtotal").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type RewallReservationItem = typeof rewallReservationItems.$inferSelect;
export type InsertRewallReservationItem = typeof rewallReservationItems.$inferInsert;

// ============================================================
// Re:Wall 가격 정책 (Pricing)
// ============================================================
export const rewallPricing = mysqlTable("rewall_pricing", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  pricingType: mysqlEnum("pricingType", ["daily", "weekly", "monthly", "purchase"]).default("monthly").notNull(),
  price: int("price").default(0).notNull(),
  discountPercent: int("discountPercent").default(0),
  validFrom: timestamp("validFrom"),
  validTo: timestamp("validTo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type RewallPricing = typeof rewallPricing.$inferSelect;
export type InsertRewallPricing = typeof rewallPricing.$inferInsert;

// ============================================================
// Re:Wall vs 일반 시공 비용 비교 (Comparisons)
// ============================================================
export const rewallComparisons = mysqlTable("rewall_comparisons", {
  id: int("id").autoincrement().primaryKey(),
  clientProjectId: int("clientProjectId"),
  userId: int("userId"),
  traditionalCost: int("traditionalCost").default(0),
  rewallCost: int("rewallCost").default(0),
  savingsAmount: int("savingsAmount").default(0),
  savingsPercent: int("savingsPercent").default(0),
  comparisonDetails: json("comparisonDetails"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type RewallComparison = typeof rewallComparisons.$inferSelect;
export type InsertRewallComparison = typeof rewallComparisons.$inferInsert;


/**
 * 360도 현장 실측 세션 (Field Measurement Sessions)
 * Insta360 RS1 기반 360도 파노라마 이미지를 이용한 공간 실측
 */
export const fieldMeasurementSessions = mysqlTable("field_measurement_sessions", {
  id: int("id").autoincrement().primaryKey(),
  projectName: varchar("projectName", { length: 200 }).notNull(),
  location: varchar("location", { length: 500 }),
  description: text("description"),
  // 연결된 OpsX 프로젝트 (선택)
  opsProjectId: int("opsProjectId"),
  // 연결된 고객 프로젝트 (선택)
  clientProjectId: int("clientProjectId"),
  // 촬영자 정보
  createdBy: int("createdBy"),
  createdByName: varchar("createdByName", { length: 100 }),
  status: mysqlEnum("status", ["active", "completed", "archived"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FieldMeasurementSession = typeof fieldMeasurementSessions.$inferSelect;
export type InsertFieldMeasurementSession = typeof fieldMeasurementSessions.$inferInsert;

/**
 * 360도 파노라마 이미지 (Panorama Images)
 * 각 촬영 지점별 equirectangular 이미지
 */
export const panoramaImages = mysqlTable("panorama_images", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  // 이미지 URL (S3)
  imageUrl: text("imageUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  // 촬영 위치 정보
  spotName: varchar("spotName", { length: 200 }).notNull(), // 예: "회의실 A", "로비 중앙"
  spotOrder: int("spotOrder").default(0), // 촬영 순서
  // 카메라 설정
  cameraHeight: decimal("cameraHeight", { precision: 6, scale: 3 }), // 카메라 높이 (m)
  // 기준 치수 보정 데이터
  calibrationData: json("calibrationData"), // { referencePoints: [{x1,y1,x2,y2,realDistance}], scaleFactor }
  // EXIF 메타데이터
  exifData: json("exifData"), // GPS, 방향 등
  // 이미지 크기
  imageWidth: int("imageWidth"),
  imageHeight: int("imageHeight"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PanoramaImage = typeof panoramaImages.$inferSelect;
export type InsertPanoramaImage = typeof panoramaImages.$inferInsert;

/**
 * 측정 데이터 (Measurements)
 * 360도 이미지에서 두 점을 클릭하여 측정한 거리/면적 데이터
 */
export const fieldMeasurements = mysqlTable("field_measurements", {
  id: int("id").autoincrement().primaryKey(),
  panoramaId: int("panoramaId").notNull(),
  sessionId: int("sessionId").notNull(),
  // 측정 유형
  type: mysqlEnum("type", ["distance", "height", "area", "reference"]).default("distance").notNull(),
  // 측정 라벨
  label: varchar("label", { length: 200 }),
  // 측정 포인트 데이터 (이미지 좌표 + 구면 좌표)
  points: json("points").notNull(), // [{imgX, imgY, theta, phi}, ...]
  // 측정 결과
  rawAngle: decimal("rawAngle", { precision: 10, scale: 6 }), // 보정 전 각도 거리 (rad)
  calibratedValue: decimal("calibratedValue", { precision: 10, scale: 3 }), // 보정 후 실제 값 (m or m²)
  unit: varchar("unit", { length: 10 }).default("m"), // m, m², cm
  // 기준 치수 여부 (보정용)
  isReference: boolean("isReference").default(false),
  referenceRealValue: decimal("referenceRealValue", { precision: 10, scale: 3 }), // 기준 실제 치수 (m)
  // 메모
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type FieldMeasurement = typeof fieldMeasurements.$inferSelect;
export type InsertFieldMeasurement = typeof fieldMeasurements.$inferInsert;

/**
 * 실측 보고서 (Measurement Reports)
 * 세션별 종합 실측 보고서
 */
export const measurementReports = mysqlTable("measurement_reports", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  // 보고서 데이터
  totalArea: decimal("totalArea", { precision: 10, scale: 2 }), // 총 면적 (m²)
  roomCount: int("roomCount"),
  // 공간별 치수 요약
  spaceSummary: json("spaceSummary"), // [{name, width, length, height, area}]
  // AI 분석 결과
  aiAnalysis: longtext("aiAnalysis"),
  // PDF URL
  pdfUrl: text("pdfUrl"),
  // 3D 디지털 트윈 데이터 (향후 확장)
  pointCloudData: json("pointCloudData"), // 3D 포인트 클라우드 메타데이터
  digitalTwinStatus: mysqlEnum("digitalTwinStatus", ["none", "processing", "ready"]).default("none"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MeasurementReport = typeof measurementReports.$inferSelect;
export type InsertMeasurementReport = typeof measurementReports.$inferInsert;

/**
 * 고객 포털 알림 (Client Notifications)
 * 프로젝트 상태 변경, 미팅 확정 등 고객에게 전달되는 알림
 */
export const clientNotifications = mysqlTable("client_notifications", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  projectId: int("projectId"),
  type: mysqlEnum("type", [
    "status_change",
    "meeting_confirmed",
    "meeting_cancelled",
    "report_ready",
    "survey_complete",
    "system",
  ]).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  message: text("message").notNull(),
  linkUrl: varchar("linkUrl", { length: 500 }),
  metadata: json("metadata"),
  isRead: mysqlEnum("isRead", ["yes", "no"]).default("no").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ClientNotification = typeof clientNotifications.$inferSelect;
export type InsertClientNotification = typeof clientNotifications.$inferInsert;

/**
 * 고객 여정 (Workspace Journeys)
 * 홈페이지 → 담당자 설문 → 도면 업로드 → AI 인터뷰 질문 생성 → 회원가입 유도
 * 로그인 없이 세션 기반으로 진행되는 고객 여정 데이터
 */
export const workspaceJourneys = mysqlTable("workspace_journeys", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull().unique(),
  
  // 현재 진행 단계
  currentStep: mysqlEnum("currentStep", [
    "survey",         // 1. 담당자 설문 진행 중
    "floor_plan",     // 2. 도면 업로드
    "generating",     // 3. AI 분석 중
    "report_ready",   // 4. 보고서 완성
    "signup_prompted", // 5. 회원가입 유도됨
    "converted",      // 6. 회원가입 완료
  ]).default("survey").notNull(),
  
  // === 단계 1: 담당자 설문 데이터 ===
  companyName: varchar("companyName", { length: 200 }),
  contactName: varchar("contactName", { length: 100 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 50 }),
  employeeCount: int("employeeCount"),
  officeSizePyeong: int("officeSizePyeong"),
  
  // 업무 스타일
  workStyle: mysqlEnum("workStyle", ["collaborative", "focused", "hybrid", "flexible"]),
  remoteWorkRatio: int("remoteWorkRatio"),
  meetingFrequency: mysqlEnum("meetingFrequency", ["rarely", "few_weekly", "daily", "very_frequent"]),
  
  // 불편사항 및 요구사항
  painPoints: json("painPoints").$type<string[]>(),
  desiredSpaces: json("desiredSpaces").$type<string[]>(),
  designStyle: mysqlEnum("designStyle", ["modern", "minimal", "warm", "industrial", "natural", "luxury", "creative"]),
  budgetRange: varchar("budgetRange", { length: 50 }),
  priority: mysqlEnum("priority", ["design", "functionality", "cost", "balanced"]),
  timelineUrgency: mysqlEnum("timelineUrgency", ["flexible", "within_6months", "within_3months", "urgent"]),
  additionalNotes: text("additionalNotes"),
  
  surveyCompletedAt: timestamp("surveyCompletedAt"),
  
  // === 단계 2: 도면 업로드 데이터 ===
  floorPlanType: mysqlEnum("floorPlanType", ["blank_template", "existing_upload", "skipped"]),
  floorPlanFileKey: varchar("floorPlanFileKey", { length: 500 }),
  floorPlanFileUrl: varchar("floorPlanFileUrl", { length: 1000 }),
  floorPlanFileName: varchar("floorPlanFileName", { length: 300 }),
  blankTemplateType: varchar("blankTemplateType", { length: 50 }),
  floorPlanAnalysis: json("floorPlanAnalysis").$type<{
    estimatedArea?: string;
    roomCount?: string;
    structuralNotes?: string;
    spaceAnalysis?: string;
  }>(),
  
  floorPlanUploadedAt: timestamp("floorPlanUploadedAt"),
  
  // === 단계 3: AI 인터뷰 질문 생성 ===
  interviewQuestions: json("interviewQuestions").$type<Array<{
    id: number;
    category: string;
    question: string;
    questionType: "text" | "single_choice" | "multiple_choice" | "scale";
    options?: string[];
  }>>(),
  analysisSummary: text("analysisSummary"),
  
  aiGeneratedAt: timestamp("aiGeneratedAt"),
  
  // === 단계 4: 보고서 ===
  reportToken: varchar("reportToken", { length: 64 }),
  reportPdfKey: varchar("reportPdfKey", { length: 500 }),
  reportPdfUrl: varchar("reportPdfUrl", { length: 1000 }),
  reportEmailSentAt: timestamp("reportEmailSentAt"),
  reportViewedAt: timestamp("reportViewedAt"),
  
  // === 단계 5: 전사 인터뷰 설문 ===
  companySurveyToken: varchar("companySurveyToken", { length: 64 }),
  companySurveyResponseCount: int("companySurveyResponseCount").default(0),
  interviewResponses: json("interviewResponses").$type<Array<{
    respondentName: string;
    respondentDept: string;
    answers: Array<{ questionId: number; answer: string }>;
    submittedAt: string;
  }>>(),
  
  // === 회원가입 연결 ===
  clientId: int("clientId"),
  convertedAt: timestamp("convertedAt"),
  
  // 메타
  utmSource: varchar("utmSource", { length: 100 }),
  utmMedium: varchar("utmMedium", { length: 100 }),
  utmCampaign: varchar("utmCampaign", { length: 100 }),
  referrer: varchar("referrer", { length: 500 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type WorkspaceJourney = typeof workspaceJourneys.$inferSelect;
export type InsertWorkspaceJourney = typeof workspaceJourneys.$inferInsert;
