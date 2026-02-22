import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import {
  createDailySiteReport, getDailyReportsByUser, getDailyReportsByProject, getDailyReportById,
  updateDailyReport,
  createKpiDefinition, getKpiDefinitions, getKpiDefinitionsByDepartment,
  createKpiRecord, getKpiRecordsByUser, getKpiRecordsByDefinition,
  createOkrObjective, getOkrObjectivesByUser, getOkrObjectivesByPeriod,
  updateOkrObjective,
  createOkrKeyResult, getKeyResultsByObjective, updateOkrKeyResult,
} from "../db";

export const employeePortalRouter = router({
  // ============ Phase 8: 일일 현장 보고서 ============

  submitDailyReport: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      reportDate: z.number(),
      weatherCondition: z.string().optional(),
      workSummary: z.string().min(1),
      workDetails: z.string().optional(),
      workersOnSite: z.number().optional(),
      materialsUsed: z.string().optional(), // JSON
      issuesEncountered: z.string().optional(),
      safetyNotes: z.string().optional(),
      photosJson: z.string().optional(), // JSON array of photo URLs
      progressPercentage: z.number().optional(),
      tomorrowPlan: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await createDailySiteReport({
        ...input,
        userId: ctx.user.id,
        userName: ctx.user.name || "Unknown",
        status: "submitted",
      });
      
      if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return { id: result.id };
    }),

  getMyDailyReports: protectedProcedure
    .input(z.object({
      limit: z.number().default(30),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      return getDailyReportsByUser(ctx.user.id, input.limit, input.offset);
    }),

  getProjectDailyReports: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      limit: z.number().default(30),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      return getDailyReportsByProject(input.projectId, input.limit, input.offset);
    }),

  getDailyReport: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const report = await getDailyReportById(input.id);
      if (!report) throw new TRPCError({ code: "NOT_FOUND" });
      return report;
    }),

  updateDailyReport: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["submitted", "reviewed", "approved"]).optional(),
      reviewNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateDailyReport(id, { ...data, reviewedBy: ctx.user.id, reviewedAt: Date.now() });
      return { success: true };
    }),

  // AI 일일보고서 요약
  summarizeDailyReports: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      dateRange: z.object({ from: z.number(), to: z.number() }),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "master") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      
      const reports = await getDailyReportsByProject(input.projectId, 100, 0);
      const filtered = reports.filter(
        r => r.reportDate >= input.dateRange.from && r.reportDate <= input.dateRange.to
      );
      
      if (filtered.length === 0) return { summary: "해당 기간 보고서가 없습니다." };
      
      const llmResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "당신은 건설 현장 관리 전문가입니다. 일일 보고서들을 분석하여 주간/월간 요약 리포트를 작성하세요. 공정 진행률, 주요 이슈, 안전 사항, 자재 사용 현황을 포함하세요.",
          },
          {
            role: "user",
            content: `일일 보고서 ${filtered.length}건:\n${JSON.stringify(filtered.map(r => ({
              date: new Date(r.reportDate).toLocaleDateString("ko-KR"),
              summary: r.workSummary,
              issues: r.issuesEncountered,
              progress: r.progressPercentage,
              workers: r.workersOnSite,
            })))}`,
          },
        ],
      });
      
      return { summary: llmResponse.choices[0].message.content };
    }),

  // ============ KPI 관리 ============

  createKpiDefinition: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      category: z.enum(["sales", "project", "quality", "efficiency", "customer", "growth"]),
      unit: z.string(),
      targetValue: z.number(),
      weight: z.number().default(1),
      measurementPeriod: z.enum(["monthly", "quarterly", "yearly"]),
      department: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "master") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const result = await createKpiDefinition({ ...input, createdBy: ctx.user.id });
      if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return { id: result.id };
    }),

  getKpiDefinitions: protectedProcedure
    .input(z.object({ department: z.string().optional() }))
    .query(async ({ input }) => {
      if (input.department) return getKpiDefinitionsByDepartment(input.department);
      return getKpiDefinitions();
    }),

  recordKpi: protectedProcedure
    .input(z.object({
      kpiDefinitionId: z.number(),
      userId: z.number(),
      period: z.string(), // "2026-Q1", "2026-01" 등
      actualValue: z.number(),
      notes: z.string().optional(),
      evidenceUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await createKpiRecord({
        ...input,
        recordedBy: ctx.user.id,
      });
      if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return { id: result.id };
    }),

  getMyKpiRecords: protectedProcedure
    .input(z.object({ period: z.string().optional() }))
    .query(async ({ ctx }) => {
      return getKpiRecordsByUser(ctx.user.id);
    }),

  getKpiRecordsByDefinition: protectedProcedure
    .input(z.object({ kpiDefinitionId: z.number() }))
    .query(async ({ input }) => {
      return getKpiRecordsByDefinition(input.kpiDefinitionId);
    }),

  // ============ OKR 관리 ============

  createObjective: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      period: z.string(), // "2026-Q1"
      level: z.enum(["company", "department", "individual"]),
      department: z.string().optional(),
      parentObjectiveId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await createOkrObjective({
        ...input,
        ownerId: ctx.user.id,
        status: "on_track",
        progress: 0,
      });
      if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return { id: result.id };
    }),

  getMyObjectives: protectedProcedure
    .input(z.object({ period: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (input.period) return getOkrObjectivesByPeriod(input.period);
      return getOkrObjectivesByUser(ctx.user.id);
    }),

  updateObjective: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["on_track", "at_risk", "behind", "completed", "cancelled"]).optional(),
      progress: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateOkrObjective(id, data);
      return { success: true };
    }),

  addKeyResult: protectedProcedure
    .input(z.object({
      objectiveId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      metricType: z.enum(["number", "percentage", "currency", "boolean"]),
      targetValue: z.number(),
      unit: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await createOkrKeyResult({
        ...input,
        currentValue: 0,
        status: "not_started",
      });
      if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return { id: result.id };
    }),

  getKeyResults: protectedProcedure
    .input(z.object({ objectiveId: z.number() }))
    .query(async ({ input }) => {
      return getKeyResultsByObjective(input.objectiveId);
    }),

  updateKeyResult: protectedProcedure
    .input(z.object({
      id: z.number(),
      currentValue: z.number().optional(),
      status: z.enum(["not_started", "in_progress", "completed", "cancelled"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateOkrKeyResult(id, data);
      return { success: true };
    }),

  // AI OKR 진행 상황 분석
  analyzeOkrProgress: protectedProcedure
    .input(z.object({ period: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const objectives = await getOkrObjectivesByPeriod(input.period);
      
      if (objectives.length === 0) return { analysis: "해당 기간 OKR이 없습니다." };
      
      const objectivesWithKR = await Promise.all(
        objectives.map(async (obj) => ({
          ...obj,
          keyResults: await getKeyResultsByObjective(obj.id),
        }))
      );
      
      const llmResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "당신은 OKR 코치입니다. OKR 진행 상황을 분석하고 개선 제안을 해주세요. 각 목표별 달성률, 위험 요소, 다음 단계를 포함하세요.",
          },
          {
            role: "user",
            content: `${input.period} OKR 현황:\n${JSON.stringify(objectivesWithKR.map(o => ({
              title: o.title,
              level: o.level,
              status: o.status,
              progress: o.progress,
              keyResults: o.keyResults.map(kr => ({
                title: kr.title,
                target: kr.targetValue,
                current: kr.currentValue,
                status: kr.status,
              })),
            })))}`,
          },
        ],
      });
      
      return { analysis: llmResponse.choices[0].message.content };
    }),
});
