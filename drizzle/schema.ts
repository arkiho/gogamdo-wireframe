import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

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
