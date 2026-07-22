import { eq, desc, and, sql, or, inArray } from "drizzle-orm";
import { getDb } from "../db";
import {
  opsProjects, opsScheduleItems, opsWorkReports, opsMeetingNotes,
  opsApprovalLines, opsExpenses, opsApprovalSteps,
  opsSubcontractors, opsSubInvites, opsSubQuotes, opsSubWorkReports,
  opsEstimates, opsContracts, opsCostItems, opsClientInvites, opsCameras,
  opsVendors, type InsertOpsVendor,
  type InsertOpsProject, type InsertOpsScheduleItem, type InsertOpsWorkReport,
  type InsertOpsMeetingNote, type InsertOpsApprovalLine, type InsertOpsExpense,
  type InsertOpsApprovalStep, type InsertOpsSubcontractor, type InsertOpsSubInvite,
  type InsertOpsSubQuote, type InsertOpsSubWorkReport, type InsertOpsEstimate,
  type InsertOpsContract, type InsertOpsCostItem, type InsertOpsClientInvite,
  type InsertOpsCamera,
  opsNotifications, type InsertOpsNotification,
  opsSubEvaluations, type InsertOpsSubEvaluation,
  users,
} from "../../drizzle/schema";

// ============ OPS PROJECTS ============

/**
 * 프로젝트 문서번호 KKD-YYYYMMDD-N 다음 값 계산.
 * 그 날짜(YYYYMMDD) 접두사를 가진 기존 code 중 최대 순번 +1.
 * (삭제로 생긴 공백은 건너뛰고 항상 최대값 다음을 반환)
 */
export async function getNextProjectCode(now: Date = new Date()): Promise<string> {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const prefix = `KKD-${y}${m}${d}-`;
  const db = await getDb();
  if (!db) return `${prefix}1`;
  const rows = await db
    .select({ code: opsProjects.code })
    .from(opsProjects)
    .where(sql`${opsProjects.code} LIKE ${prefix + "%"}`);
  let maxN = 0;
  for (const r of rows) {
    const suffix = (r.code ?? "").slice(prefix.length);
    const n = parseInt(suffix, 10);
    if (Number.isFinite(n) && n > maxN) maxN = n;
  }
  return `${prefix}${maxN + 1}`;
}

export async function createOpsProject(data: InsertOpsProject) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(opsProjects).values(data).$returningId();
  return result;
}

export async function listOpsProjects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opsProjects).orderBy(desc(opsProjects.createdAt));
}

export async function getOpsProject(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(opsProjects).where(eq(opsProjects.id, id));
  return row ?? null;
}

export async function updateOpsProject(id: number, data: Partial<InsertOpsProject>) {
  const db = await getDb();
  if (!db) return;
  await db.update(opsProjects).set(data).where(eq(opsProjects.id, id));
}

export async function deleteOpsProject(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(opsProjects).where(eq(opsProjects.id, id));
}

// ============ 거래처 계좌 등록부 (STAFF_UI 4) ============
export async function listVendors() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opsVendors).orderBy(desc(opsVendors.isActive), opsVendors.name);
}

export async function getVendor(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(opsVendors).where(eq(opsVendors.id, id));
  return row ?? null;
}

export async function createVendor(data: InsertOpsVendor) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(opsVendors).values(data).$returningId();
  return result;
}

export async function updateVendor(id: number, data: Partial<InsertOpsVendor>) {
  const db = await getDb();
  if (!db) return;
  await db.update(opsVendors).set(data).where(eq(opsVendors.id, id));
}

export async function deleteVendor(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(opsVendors).where(eq(opsVendors.id, id));
}

// ============ SCHEDULE ITEMS ============
export async function createScheduleItem(data: InsertOpsScheduleItem) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(opsScheduleItems).values(data).$returningId();
  return result;
}

export async function listScheduleItems(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opsScheduleItems)
    .where(eq(opsScheduleItems.projectId, projectId))
    .orderBy(opsScheduleItems.sortOrder);
}

export async function updateScheduleItem(id: number, data: Partial<InsertOpsScheduleItem>) {
  const db = await getDb();
  if (!db) return;
  await db.update(opsScheduleItems).set(data).where(eq(opsScheduleItems.id, id));
}

export async function deleteScheduleItem(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(opsScheduleItems).where(eq(opsScheduleItems.id, id));
}

// ============ ALL SCHEDULE ITEMS (cross-project) ============
export async function listAllScheduleItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: opsScheduleItems.id,
    projectId: opsScheduleItems.projectId,
    name: opsScheduleItems.name,
    category: opsScheduleItems.category,
    startDate: opsScheduleItems.startDate,
    endDate: opsScheduleItems.endDate,
    progress: opsScheduleItems.progress,
    status: opsScheduleItems.status,
    assignedTo: opsScheduleItems.assignedTo,
    projectName: opsProjects.name,
    projectCode: opsProjects.code,
    projectStatus: opsProjects.status,
  }).from(opsScheduleItems)
    .leftJoin(opsProjects, eq(opsScheduleItems.projectId, opsProjects.id))
    .orderBy(desc(opsScheduleItems.createdAt));
}

// ============ ALL EXPENSES (cross-project) ============
export async function listAllExpenses() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: opsExpenses.id,
    projectId: opsExpenses.projectId,
    authorId: opsExpenses.authorId,
    expenseNumber: opsExpenses.expenseNumber,
    title: opsExpenses.title,
    category: opsExpenses.category,
    totalAmount: opsExpenses.totalAmount,
    status: opsExpenses.status,
    submittedAt: opsExpenses.submittedAt,
    approvedAt: opsExpenses.approvedAt,
    createdAt: opsExpenses.createdAt,
    projectName: opsProjects.name,
    projectCode: opsProjects.code,
    authorName: users.name,
  }).from(opsExpenses)
    .leftJoin(opsProjects, eq(opsExpenses.projectId, opsProjects.id))
    .leftJoin(users, eq(opsExpenses.authorId, users.id))
    .orderBy(desc(opsExpenses.createdAt));
}

// ============ WORK REPORTS ============
export async function createWorkReport(data: InsertOpsWorkReport) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(opsWorkReports).values(data).$returningId();
  return result;
}

export async function listWorkReports(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opsWorkReports)
    .where(eq(opsWorkReports.projectId, projectId))
    .orderBy(desc(opsWorkReports.reportDate));
}

export async function getWorkReport(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(opsWorkReports).where(eq(opsWorkReports.id, id));
  return row ?? null;
}

export async function updateWorkReport(id: number, data: Partial<InsertOpsWorkReport>) {
  const db = await getDb();
  if (!db) return;
  await db.update(opsWorkReports).set(data).where(eq(opsWorkReports.id, id));
}

export async function deleteWorkReport(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(opsWorkReports).where(eq(opsWorkReports.id, id));
}

// ============ MEETING NOTES ============
export async function createMeetingNote(data: InsertOpsMeetingNote) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(opsMeetingNotes).values(data).$returningId();
  return result;
}

export async function listMeetingNotes(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opsMeetingNotes)
    .where(eq(opsMeetingNotes.projectId, projectId))
    .orderBy(desc(opsMeetingNotes.meetingDate));
}

export async function getMeetingNote(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(opsMeetingNotes).where(eq(opsMeetingNotes.id, id));
  return row ?? null;
}

export async function updateMeetingNote(id: number, data: Partial<InsertOpsMeetingNote>) {
  const db = await getDb();
  if (!db) return;
  await db.update(opsMeetingNotes).set(data).where(eq(opsMeetingNotes.id, id));
}

export async function deleteMeetingNote(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(opsMeetingNotes).where(eq(opsMeetingNotes.id, id));
}

// ============ APPROVAL LINES ============
export async function createApprovalLine(data: InsertOpsApprovalLine) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(opsApprovalLines).values(data).$returningId();
  return result;
}

export async function listApprovalLines() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opsApprovalLines).orderBy(opsApprovalLines.name);
}

export async function getApprovalLine(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(opsApprovalLines).where(eq(opsApprovalLines.id, id));
  return row ?? null;
}

export async function updateApprovalLine(id: number, data: Partial<InsertOpsApprovalLine>) {
  const db = await getDb();
  if (!db) return;
  await db.update(opsApprovalLines).set(data).where(eq(opsApprovalLines.id, id));
}

export async function deleteApprovalLine(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(opsApprovalLines).where(eq(opsApprovalLines.id, id));
}

// ============ EXPENSES ============
export async function createExpense(data: InsertOpsExpense) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(opsExpenses).values(data).$returningId();
  return result;
}

export async function listExpenses(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opsExpenses)
    .where(eq(opsExpenses.projectId, projectId))
    .orderBy(desc(opsExpenses.createdAt));
}

export async function getExpense(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(opsExpenses).where(eq(opsExpenses.id, id));
  return row ?? null;
}

export async function updateExpense(id: number, data: Partial<InsertOpsExpense>) {
  const db = await getDb();
  if (!db) return;
  await db.update(opsExpenses).set(data).where(eq(opsExpenses.id, id));
}

export async function deleteExpense(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(opsExpenses).where(eq(opsExpenses.id, id));
}

// ============ APPROVAL STEPS ============
export async function createApprovalStep(data: InsertOpsApprovalStep) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(opsApprovalSteps).values(data).$returningId();
  return result;
}

export async function listApprovalSteps(documentType: string, documentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opsApprovalSteps)
    .where(and(
      eq(opsApprovalSteps.documentType, documentType as any),
      eq(opsApprovalSteps.documentId, documentId),
    ))
    .orderBy(opsApprovalSteps.stepOrder);
}

export async function updateApprovalStep(id: number, data: Partial<InsertOpsApprovalStep>) {
  const db = await getDb();
  if (!db) return;
  await db.update(opsApprovalSteps).set(data).where(eq(opsApprovalSteps.id, id));
}

// ============ SUBCONTRACTORS ============
export async function createSubcontractor(data: InsertOpsSubcontractor) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(opsSubcontractors).values(data).$returningId();
  return result;
}

export async function listSubcontractors() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opsSubcontractors).orderBy(opsSubcontractors.companyName);
}

export async function getSubcontractor(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(opsSubcontractors).where(eq(opsSubcontractors.id, id));
  return row ?? null;
}

export async function updateSubcontractor(id: number, data: Partial<InsertOpsSubcontractor>) {
  const db = await getDb();
  if (!db) return;
  await db.update(opsSubcontractors).set(data).where(eq(opsSubcontractors.id, id));
}

export async function deleteSubcontractor(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(opsSubcontractors).where(eq(opsSubcontractors.id, id));
}

// ============ SUB INVITES ============
export async function createSubInvite(data: InsertOpsSubInvite) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(opsSubInvites).values(data).$returningId();
  return result;
}

export async function getSubInviteByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(opsSubInvites).where(eq(opsSubInvites.token, token));
  return row ?? null;
}

export async function listSubInvites(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opsSubInvites)
    .where(eq(opsSubInvites.projectId, projectId))
    .orderBy(desc(opsSubInvites.createdAt));
}

// ============ SUB QUOTES ============
export async function createSubQuote(data: InsertOpsSubQuote) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(opsSubQuotes).values(data).$returningId();
  return result;
}

export async function listSubQuotes(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opsSubQuotes)
    .where(eq(opsSubQuotes.projectId, projectId))
    .orderBy(desc(opsSubQuotes.createdAt));
}

export async function getSubQuote(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(opsSubQuotes).where(eq(opsSubQuotes.id, id));
  return row ?? null;
}

export async function updateSubQuote(id: number, data: Partial<InsertOpsSubQuote>) {
  const db = await getDb();
  if (!db) return;
  await db.update(opsSubQuotes).set(data).where(eq(opsSubQuotes.id, id));
}

// ============ SUB WORK REPORTS ============
export async function createSubWorkReport(data: InsertOpsSubWorkReport) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(opsSubWorkReports).values(data).$returningId();
  return result;
}

export async function listSubWorkReports(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opsSubWorkReports)
    .where(eq(opsSubWorkReports.projectId, projectId))
    .orderBy(desc(opsSubWorkReports.reportDate));
}

export async function updateSubWorkReport(id: number, data: Partial<InsertOpsSubWorkReport>) {
  const db = await getDb();
  if (!db) return;
  await db.update(opsSubWorkReports).set(data).where(eq(opsSubWorkReports.id, id));
}

// ============ ESTIMATES ============
export async function createOpsEstimate(data: InsertOpsEstimate) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(opsEstimates).values(data).$returningId();
  return result;
}

export async function listOpsEstimates(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opsEstimates)
    .where(eq(opsEstimates.projectId, projectId))
    .orderBy(desc(opsEstimates.createdAt));
}

export async function getOpsEstimate(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(opsEstimates).where(eq(opsEstimates.id, id));
  return row ?? null;
}

export async function updateOpsEstimate(id: number, data: Partial<InsertOpsEstimate>) {
  const db = await getDb();
  if (!db) return;
  await db.update(opsEstimates).set(data).where(eq(opsEstimates.id, id));
}

// ============ CONTRACTS ============
export async function createOpsContract(data: InsertOpsContract) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(opsContracts).values(data).$returningId();
  return result;
}

export async function listOpsContracts(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opsContracts)
    .where(eq(opsContracts.projectId, projectId))
    .orderBy(desc(opsContracts.createdAt));
}

export async function getOpsContract(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(opsContracts).where(eq(opsContracts.id, id));
  return row ?? null;
}

export async function updateOpsContract(id: number, data: Partial<InsertOpsContract>) {
  const db = await getDb();
  if (!db) return;
  await db.update(opsContracts).set(data).where(eq(opsContracts.id, id));
}

// ============ COST ITEMS ============
export async function createCostItem(data: InsertOpsCostItem) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(opsCostItems).values(data).$returningId();
  return result;
}

export async function listCostItems(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opsCostItems)
    .where(eq(opsCostItems.projectId, projectId))
    .orderBy(opsCostItems.category);
}

export async function updateCostItem(id: number, data: Partial<InsertOpsCostItem>) {
  const db = await getDb();
  if (!db) return;
  await db.update(opsCostItems).set(data).where(eq(opsCostItems.id, id));
}

export async function deleteCostItem(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(opsCostItems).where(eq(opsCostItems.id, id));
}

// ============ CLIENT INVITES ============
export async function createClientInvite(data: InsertOpsClientInvite) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(opsClientInvites).values(data).$returningId();
  return result;
}

export async function getClientInviteByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(opsClientInvites).where(eq(opsClientInvites.token, token));
  return row ?? null;
}

export async function listClientInvites(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opsClientInvites)
    .where(eq(opsClientInvites.projectId, projectId))
    .orderBy(desc(opsClientInvites.createdAt));
}

export async function updateClientInvite(id: number, data: Partial<InsertOpsClientInvite>) {
  const db = await getDb();
  if (!db) return;
  await db.update(opsClientInvites).set(data).where(eq(opsClientInvites.id, id));
}

// ============ CAMERAS ============
export async function createCamera(data: InsertOpsCamera) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(opsCameras).values(data).$returningId();
  return result;
}

export async function listCameras(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opsCameras)
    .where(eq(opsCameras.projectId, projectId))
    .orderBy(opsCameras.name);
}

export async function updateCamera(id: number, data: Partial<InsertOpsCamera>) {
  const db = await getDb();
  if (!db) return;
  await db.update(opsCameras).set(data).where(eq(opsCameras.id, id));
}

export async function deleteCamera(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(opsCameras).where(eq(opsCameras.id, id));
}

// ============ NOTIFICATIONS ============
export async function createNotification(data: InsertOpsNotification) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(opsNotifications).values(data).$returningId();
  return result;
}

export async function createBulkNotifications(data: InsertOpsNotification[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!db || data.length === 0) return;
  await db.insert(opsNotifications).values(data);
}

export async function listNotifications(recipientId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(opsNotifications)
    .where(eq(opsNotifications.recipientId, recipientId))
    .orderBy(desc(opsNotifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(recipientId: number) {
  const db = await getDb();
  if (!db) return 0;
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(opsNotifications)
    .where(
      and(
        eq(opsNotifications.recipientId, recipientId),
        eq(opsNotifications.isRead, 0)
      )
    );
  return result?.count ?? 0;
}

export async function markNotificationRead(id: number, recipientId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(opsNotifications)
    .set({ isRead: 1, readAt: new Date() })
    .where(
      and(
        eq(opsNotifications.id, id),
        eq(opsNotifications.recipientId, recipientId)
      )
    );
}

export async function markAllNotificationsRead(recipientId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(opsNotifications)
    .set({ isRead: 1, readAt: new Date() })
    .where(
      and(
        eq(opsNotifications.recipientId, recipientId),
        eq(opsNotifications.isRead, 0)
      )
    );
}

export async function notifyAdminsAndPMs(data: Omit<InsertOpsNotification, "recipientId">) {
  const db = await getDb();
  if (!db) return;
  const admins = await db
    .select({ id: users.id })
    .from(users)
    .where(
      or(
        eq(users.role, "admin"),
        eq(users.opsRole, "pm"),
        eq(users.opsRole, "director")
      )
    );
  if (admins.length === 0) return;
  const notifications = admins.map(a => ({
    ...data,
    recipientId: a.id,
  }));
  await createBulkNotifications(notifications);
}

// ============ NOTIFY ACCOUNTANTS ============
export async function notifyAccountants(data: Omit<InsertOpsNotification, "recipientId">) {
  const db = await getDb();
  if (!db) return;
  const accountants = await db
    .select({ id: users.id })
    .from(users)
    .where(
      or(
        eq(users.department, "accounting"),
        eq(users.opsRole, "accountant")
      )
    );
  if (accountants.length === 0) return;
  const notifs = accountants.map(a => ({
    ...data,
    recipientId: a.id,
  }));
  await createBulkNotifications(notifs);
}

// ============ STATS ============
export async function getOpsStats() {
  const db = await getDb();
  if (!db) return { totalProjects: 0, activeProjects: 0, totalExpenses: 0, pendingApprovals: 0, totalContractAmount: 0, monthlyExpenseAmount: 0, avgScheduleProgress: 0, completedProjects: 0 };
  
  const [projectCount] = await db.select({ count: sql<number>`count(*)` }).from(opsProjects);
  const [activeCount] = await db.select({ count: sql<number>`count(*)` }).from(opsProjects)
    .where(eq(opsProjects.status, "construction"));
  const [expenseCount] = await db.select({ count: sql<number>`count(*)` }).from(opsExpenses);
  const [pendingCount] = await db.select({ count: sql<number>`count(*)` }).from(opsExpenses)
    .where(eq(opsExpenses.status, "submitted"));
  
  // 총 계약금액
  const [contractSum] = await db.select({
    total: sql<number>`COALESCE(SUM(CAST(contractAmount AS SIGNED)), 0)`,
  }).from(opsProjects);
  
  // 이번달 지출 합계
  const [monthlyExpense] = await db.select({
    total: sql<number>`COALESCE(SUM(CAST(totalAmount AS SIGNED)), 0)`,
  }).from(opsExpenses)
    .where(sql`YEAR(createdAt) = YEAR(NOW()) AND MONTH(createdAt) = MONTH(NOW())`);
  
  // 평균 공정 진행률 (전체 활성 프로젝트)
  const [avgProgress] = await db.select({
    avg: sql<number>`COALESCE(AVG(progress), 0)`,
  }).from(opsScheduleItems);
  
  // 완료 프로젝트 수
  const [completedCount] = await db.select({ count: sql<number>`count(*)` }).from(opsProjects)
    .where(eq(opsProjects.status, "completed"));
  
  return {
    totalProjects: projectCount?.count ?? 0,
    activeProjects: activeCount?.count ?? 0,
    totalExpenses: expenseCount?.count ?? 0,
    pendingApprovals: pendingCount?.count ?? 0,
    totalContractAmount: contractSum?.total ?? 0,
    monthlyExpenseAmount: monthlyExpense?.total ?? 0,
    avgScheduleProgress: Math.round(avgProgress?.avg ?? 0),
    completedProjects: completedCount?.count ?? 0,
  };
}

// ============ CHART STATISTICS ============

/** 월별 지출 추이 (최근 12개월) */
export async function getMonthlyExpenseTrend() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    month: sql<string>`DATE_FORMAT(createdAt, '%Y-%m')`,
    total: sql<number>`COALESCE(SUM(CAST(totalAmount AS SIGNED)), 0)`,
    count: sql<number>`COUNT(*)`,
  }).from(opsExpenses)
    .where(sql`createdAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)`)
    .groupBy(sql`DATE_FORMAT(createdAt, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(createdAt, '%Y-%m')`);
  return rows;
}

/** 프로젝트 상태 분포 */
export async function getProjectStatusDistribution() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    status: opsProjects.status,
    count: sql<number>`COUNT(*)`,
  }).from(opsProjects)
    .groupBy(opsProjects.status);
  return rows;
}

/** 프로젝트별 원가 집행률 (예산 vs 실적) */
export async function getProjectCostExecution(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    category: opsCostItems.category,
    budget: sql<number>`COALESCE(SUM(CAST(budgetAmount AS SIGNED)), 0)`,
    actual: sql<number>`COALESCE(SUM(CAST(actualAmount AS SIGNED)), 0)`,
    paid: sql<number>`COALESCE(SUM(CAST(paidAmount AS SIGNED)), 0)`,
  }).from(opsCostItems)
    .where(eq(opsCostItems.projectId, projectId))
    .groupBy(opsCostItems.category);
  return rows;
}

/** 프로젝트별 공정 진행률 요약 */
export async function getProjectScheduleProgress(projectId: number) {
  const db = await getDb();
  if (!db) return { total: 0, completed: 0, inProgress: 0, delayed: 0, avgProgress: 0 };
  const [totals] = await db.select({
    total: sql<number>`COUNT(*)`,
    completed: sql<number>`SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)`,
    inProgress: sql<number>`SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)`,
    delayed: sql<number>`SUM(CASE WHEN status = 'delayed' THEN 1 ELSE 0 END)`,
    avgProgress: sql<number>`COALESCE(AVG(progress), 0)`,
  }).from(opsScheduleItems)
    .where(eq(opsScheduleItems.projectId, projectId));
  return {
    total: totals?.total ?? 0,
    completed: totals?.completed ?? 0,
    inProgress: totals?.inProgress ?? 0,
    delayed: totals?.delayed ?? 0,
    avgProgress: Math.round(totals?.avgProgress ?? 0),
  };
}

/** 카테고리별 지출 분포 */
export async function getExpenseCategoryDistribution(projectId?: number) {
  const db = await getDb();
  if (!db) return [];
  const q = db.select({
    category: opsExpenses.category,
    total: sql<number>`COALESCE(SUM(CAST(totalAmount AS SIGNED)), 0)`,
    count: sql<number>`COUNT(*)`,
  }).from(opsExpenses);
  
  const rows = projectId
    ? await q.where(eq(opsExpenses.projectId, projectId)).groupBy(opsExpenses.category)
    : await q.groupBy(opsExpenses.category);
  return rows;
}


// ============ SUB EVALUATIONS ============
export async function createSubEvaluation(data: InsertOpsSubEvaluation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // 자동 종합 점수 계산
  const overall = (
    (data.qualityScore + data.scheduleScore + data.safetyScore +
     data.communicationScore + data.cleanupScore) / 5
  ).toFixed(1);
  const result = await db.insert(opsSubEvaluations).values({
    ...data,
    overallScore: overall,
  });
  return result[0].insertId;
}

export async function listSubEvaluations(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(opsSubEvaluations)
    .where(eq(opsSubEvaluations.projectId, projectId))
    .orderBy(desc(opsSubEvaluations.createdAt));
}

export async function listSubEvaluationsBySubcontractor(subcontractorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(opsSubEvaluations)
    .where(eq(opsSubEvaluations.subcontractorId, subcontractorId))
    .orderBy(desc(opsSubEvaluations.createdAt));
}

export async function getSubEvaluationSummary(subcontractorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const evals = await db.select().from(opsSubEvaluations)
    .where(eq(opsSubEvaluations.subcontractorId, subcontractorId));

  if (!evals.length) return null;

  const avg = (field: keyof typeof evals[0]) => {
    const sum = evals.reduce((s, e) => s + Number(e[field] ?? 0), 0);
    return Number((sum / evals.length).toFixed(1));
  };

  const recommendedCount = evals.filter(e => e.recommendation === "highly_recommended" || e.recommendation === "recommended").length;

  return {
    totalEvaluations: evals.length,
    avgQuality: avg("qualityScore"),
    avgSchedule: avg("scheduleScore"),
    avgSafety: avg("safetyScore"),
    avgCommunication: avg("communicationScore"),
    avgCleanup: avg("cleanupScore"),
    avgOverall: avg("overallScore"),
    recommendedCount,
    recommendations: {
      highly_recommended: evals.filter(e => e.recommendation === "highly_recommended").length,
      recommended: evals.filter(e => e.recommendation === "recommended").length,
      neutral: evals.filter(e => e.recommendation === "neutral").length,
      not_recommended: evals.filter(e => e.recommendation === "not_recommended").length,
    },
  };
}

export async function deleteSubEvaluation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(opsSubEvaluations).where(eq(opsSubEvaluations.id, id));
}


// ============ TRADE CATEGORIES ============
import {
  tradeCategories, type InsertTradeCategory,
  subcontractorTrades, type InsertSubcontractorTrade,
  subRegistrationRequests, type InsertSubRegistrationRequest,
  tradeContractTemplates, type InsertTradeContractTemplate,
  subContracts, type InsertSubContract,
  purchaseOrders, type InsertPurchaseOrder,
  rfqRequests, type InsertRfqRequest,
} from "../../drizzle/schema";

export async function createTradeCategory(data: InsertTradeCategory) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(tradeCategories).values(data).$returningId();
  return result;
}

export async function listTradeCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tradeCategories).where(eq(tradeCategories.isActive, 1)).orderBy(tradeCategories.sortOrder);
}

export async function getTradeCategory(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(tradeCategories).where(eq(tradeCategories.id, id));
  return row ?? null;
}

export async function updateTradeCategory(id: number, data: Partial<InsertTradeCategory>) {
  const db = await getDb();
  if (!db) return;
  await db.update(tradeCategories).set(data).where(eq(tradeCategories.id, id));
}

export async function deleteTradeCategory(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(tradeCategories).set({ isActive: 0 }).where(eq(tradeCategories.id, id));
}

// ============ SUBCONTRACTOR TRADES ============
export async function setSubcontractorTrades(subcontractorId: number, tradeIds: number[], primaryTradeId?: number) {
  const db = await getDb();
  if (!db) return;
  // 기존 매핑 삭제
  await db.delete(subcontractorTrades).where(eq(subcontractorTrades.subcontractorId, subcontractorId));
  // 새 매핑 삽입
  if (tradeIds.length > 0) {
    await db.insert(subcontractorTrades).values(
      tradeIds.map(tid => ({
        subcontractorId,
        tradeCategoryId: tid,
        isPrimary: tid === primaryTradeId ? 1 : 0,
      }))
    );
  }
}

export async function getSubcontractorTrades(subcontractorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: subcontractorTrades.id,
    tradeCategoryId: subcontractorTrades.tradeCategoryId,
    isPrimary: subcontractorTrades.isPrimary,
    tradeName: tradeCategories.name,
    tradeCode: tradeCategories.code,
  }).from(subcontractorTrades)
    .leftJoin(tradeCategories, eq(subcontractorTrades.tradeCategoryId, tradeCategories.id))
    .where(eq(subcontractorTrades.subcontractorId, subcontractorId));
}

/** 특정 공종에 해당하는 승인된 활성 업체 목록 (계약 유효한 업체 우선) */
export async function getSubcontractorsByTrade(tradeCategoryId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    subcontractorId: subcontractorTrades.subcontractorId,
    isPrimary: subcontractorTrades.isPrimary,
    companyName: opsSubcontractors.companyName,
    contactName: opsSubcontractors.contactName,
    contactEmail: opsSubcontractors.contactEmail,
    contactPhone: opsSubcontractors.contactPhone,
    specialty: opsSubcontractors.specialty,
    rating: opsSubcontractors.rating,
  }).from(subcontractorTrades)
    .innerJoin(opsSubcontractors, eq(subcontractorTrades.subcontractorId, opsSubcontractors.id))
    .where(
      and(
        eq(subcontractorTrades.tradeCategoryId, tradeCategoryId),
        eq(opsSubcontractors.isActive, 1)
      )
    )
    .orderBy(desc(subcontractorTrades.isPrimary), desc(opsSubcontractors.rating));
  return rows;
}

/** 여러 공종 ID에 대해 매칭되는 업체 목록 반환 */
export async function getSubcontractorsByTradeIds(tradeCategoryIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!db || tradeCategoryIds.length === 0) return [];
  const rows = await db.select({
    tradeCategoryId: subcontractorTrades.tradeCategoryId,
    tradeName: tradeCategories.name,
    subcontractorId: subcontractorTrades.subcontractorId,
    isPrimary: subcontractorTrades.isPrimary,
    companyName: opsSubcontractors.companyName,
    contactName: opsSubcontractors.contactName,
    contactEmail: opsSubcontractors.contactEmail,
    contactPhone: opsSubcontractors.contactPhone,
    rating: opsSubcontractors.rating,
  }).from(subcontractorTrades)
    .innerJoin(opsSubcontractors, eq(subcontractorTrades.subcontractorId, opsSubcontractors.id))
    .innerJoin(tradeCategories, eq(subcontractorTrades.tradeCategoryId, tradeCategories.id))
    .where(
      and(
        inArray(subcontractorTrades.tradeCategoryId, tradeCategoryIds),
        eq(opsSubcontractors.isActive, 1)
      )
    )
    .orderBy(desc(subcontractorTrades.isPrimary), desc(opsSubcontractors.rating));
  return rows;
}

// ============ SUB REGISTRATION REQUESTS ============
export async function createSubRegistration(data: InsertSubRegistrationRequest) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(subRegistrationRequests).values(data).$returningId();
  return result;
}

export async function listSubRegistrations(statusFilter?: string) {
  const db = await getDb();
  if (!db) return [];
  const q = db.select().from(subRegistrationRequests).orderBy(desc(subRegistrationRequests.createdAt));
  if (statusFilter) {
    return q.where(eq(subRegistrationRequests.status, statusFilter as any));
  }
  return q;
}

export async function getSubRegistration(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(subRegistrationRequests).where(eq(subRegistrationRequests.id, id));
  return row ?? null;
}

export async function updateSubRegistration(id: number, data: Partial<InsertSubRegistrationRequest>) {
  const db = await getDb();
  if (!db) return;
  await db.update(subRegistrationRequests).set(data).where(eq(subRegistrationRequests.id, id));
}

// ============ TRADE CONTRACT TEMPLATES ============
export async function createTradeContractTemplate(data: InsertTradeContractTemplate) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(tradeContractTemplates).values(data).$returningId();
  return result;
}

export async function listTradeContractTemplates(tradeCategoryId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (tradeCategoryId) {
    return db.select().from(tradeContractTemplates)
      .where(and(eq(tradeContractTemplates.tradeCategoryId, tradeCategoryId), eq(tradeContractTemplates.isActive, 1)))
      .orderBy(desc(tradeContractTemplates.version));
  }
  return db.select().from(tradeContractTemplates)
    .where(eq(tradeContractTemplates.isActive, 1))
    .orderBy(tradeContractTemplates.tradeCategoryId, desc(tradeContractTemplates.version));
}

export async function getTradeContractTemplate(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(tradeContractTemplates).where(eq(tradeContractTemplates.id, id));
  return row ?? null;
}

export async function updateTradeContractTemplate(id: number, data: Partial<InsertTradeContractTemplate>) {
  const db = await getDb();
  if (!db) return;
  await db.update(tradeContractTemplates).set(data).where(eq(tradeContractTemplates.id, id));
}

// ============ SUB CONTRACTS ============
export async function createSubContract(data: InsertSubContract) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(subContracts).values(data).$returningId();
  return result;
}

export async function listSubContracts(subcontractorId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (subcontractorId) {
    return db.select().from(subContracts)
      .where(eq(subContracts.subcontractorId, subcontractorId))
      .orderBy(desc(subContracts.createdAt));
  }
  return db.select().from(subContracts).orderBy(desc(subContracts.createdAt));
}

export async function getSubContract(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(subContracts).where(eq(subContracts.id, id));
  return row ?? null;
}

export async function updateSubContract(id: number, data: Partial<InsertSubContract>) {
  const db = await getDb();
  if (!db) return;
  await db.update(subContracts).set(data).where(eq(subContracts.id, id));
}

/** 특정 업체의 유효한(active) 계약 목록 */
export async function getActiveSubContracts(subcontractorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subContracts)
    .where(
      and(
        eq(subContracts.subcontractorId, subcontractorId),
        eq(subContracts.status, "active")
      )
    );
}

// ============ PURCHASE ORDERS ============
export async function createPurchaseOrder(data: InsertPurchaseOrder) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(purchaseOrders).values(data).$returningId();
  return result;
}

export async function listPurchaseOrders(projectId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (projectId) {
    return db.select().from(purchaseOrders)
      .where(eq(purchaseOrders.projectId, projectId))
      .orderBy(desc(purchaseOrders.createdAt));
  }
  return db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt));
}

export async function getPurchaseOrder(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
  return row ?? null;
}

export async function updatePurchaseOrder(id: number, data: Partial<InsertPurchaseOrder>) {
  const db = await getDb();
  if (!db) return;
  await db.update(purchaseOrders).set(data).where(eq(purchaseOrders.id, id));
}

export async function deletePurchaseOrder(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
}

// ============ RFQ REQUESTS ============
export async function createRfqRequest(data: InsertRfqRequest) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(rfqRequests).values(data).$returningId();
  return result;
}

export async function listRfqRequests(purchaseOrderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    rfq: rfqRequests,
    companyName: opsSubcontractors.companyName,
    contactName: opsSubcontractors.contactName,
    contactEmail: opsSubcontractors.contactEmail,
  }).from(rfqRequests)
    .leftJoin(opsSubcontractors, eq(rfqRequests.subcontractorId, opsSubcontractors.id))
    .where(eq(rfqRequests.purchaseOrderId, purchaseOrderId))
    .orderBy(rfqRequests.createdAt);
}

export async function getRfqRequest(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(rfqRequests).where(eq(rfqRequests.id, id));
  return row ?? null;
}

export async function getRfqByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(rfqRequests).where(eq(rfqRequests.token, token));
  return row ?? null;
}

export async function updateRfqRequest(id: number, data: Partial<InsertRfqRequest>) {
  const db = await getDb();
  if (!db) return;
  await db.update(rfqRequests).set(data).where(eq(rfqRequests.id, id));
}

/** 업체명 또는 공종으로 업체 검색 */
export async function searchSubcontractors(query: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opsSubcontractors)
    .where(
      and(
        eq(opsSubcontractors.isActive, 1),
        or(
          sql`${opsSubcontractors.companyName} LIKE ${`%${query}%`}`,
          sql`${opsSubcontractors.specialty} LIKE ${`%${query}%`}`,
          sql`${opsSubcontractors.contactName} LIKE ${`%${query}%`}`
        )
      )
    )
    .orderBy(desc(opsSubcontractors.rating))
    .limit(20);
}
