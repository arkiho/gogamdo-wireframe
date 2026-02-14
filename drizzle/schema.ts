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
