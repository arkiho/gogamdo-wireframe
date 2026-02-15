import { eq, desc, and, sql, or } from "drizzle-orm";
import { getDb } from "../db";
import {
  opsProjects, opsScheduleItems, opsWorkReports, opsMeetingNotes,
  opsApprovalLines, opsExpenses, opsApprovalSteps,
  opsSubcontractors, opsSubInvites, opsSubQuotes, opsSubWorkReports,
  opsEstimates, opsContracts, opsCostItems, opsClientInvites, opsCameras,
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
  return db.select().from(opsSubEvaluations)
    .where(eq(opsSubEvaluations.projectId, projectId))
    .orderBy(desc(opsSubEvaluations.createdAt));
}

export async function listSubEvaluationsBySubcontractor(subcontractorId: number) {
  const db = await getDb();
  return db.select().from(opsSubEvaluations)
    .where(eq(opsSubEvaluations.subcontractorId, subcontractorId))
    .orderBy(desc(opsSubEvaluations.createdAt));
}

export async function getSubEvaluationSummary(subcontractorId: number) {
  const db = await getDb();
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
  return db.delete(opsSubEvaluations).where(eq(opsSubEvaluations.id, id));
}
