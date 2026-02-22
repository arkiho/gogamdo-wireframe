import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";
import {
  createPostOccupancySurvey, getPostOccupancyByProject,
  createMaintenanceVisit, getMaintenanceVisitsByProject, updateMaintenanceVisit,
  createInsightSubscription, getInsightSubscriptionByProject, updateInsightSubscription,
  createSpaceOptimizationReport, getOptimizationReportsBySubscription,
} from "../db";

export const postOccupancyRouter = router({
  // ============ Phase 10: 입주 후 만족도 조사 ============

  submitSatisfaction: protectedProcedure
    .input(z.object({
      clientProjectId: z.number(),
      overallScore: z.number().min(1).max(10),
      designScore: z.number().min(1).max(10),
      constructionScore: z.number().min(1).max(10),
      communicationScore: z.number().min(1).max(10),
      timelinessScore: z.number().min(1).max(10),
      valueScore: z.number().min(1).max(10),
      airQualityScore: z.number().min(1).max(10).optional(),
      lightingScore: z.number().min(1).max(10).optional(),
      noiseScore: z.number().min(1).max(10).optional(),
      temperatureScore: z.number().min(1).max(10).optional(),
      positives: z.string().optional(),
      improvements: z.string().optional(),
      wouldRecommend: z.number().optional(),
      additionalComments: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await createPostOccupancySurvey({
        ...input,
        respondentId: ctx.user.id,
      });
      
      if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      await notifyOwner({
        title: "입주 후 만족도 조사 완료",
        content: `프로젝트 #${input.clientProjectId} 만족도: ${input.overallScore}/10`,
      });
      
      return { id: result.id };
    }),

  getSatisfaction: protectedProcedure
    .input(z.object({ clientProjectId: z.number() }))
    .query(async ({ input }) => {
      return getPostOccupancyByProject(input.clientProjectId);
    }),

  // ============ 유지보수 방문 관리 ============

  scheduleVisit: protectedProcedure
    .input(z.object({
      clientProjectId: z.number(),
      visitType: z.enum(["initial_inspection", "fine_tuning", "repair", "optimization", "quarterly_review"]),
      scheduledDate: z.number(),
      assignedStaffId: z.number().optional(),
      assignedStaffName: z.string().optional(),
      description: z.string().optional(),
      issueReported: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "master" && ctx.user.role !== "user") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      
      const result = await createMaintenanceVisit({
        ...input,
        status: "scheduled",
        createdBy: ctx.user.id,
      });
      
      if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      await notifyOwner({
        title: "유지보수 방문 예약",
        content: `프로젝트 #${input.clientProjectId} - ${input.visitType} 방문이 예약되었습니다.`,
      });
      
      return { id: result.id };
    }),

  getVisits: protectedProcedure
    .input(z.object({ clientProjectId: z.number() }))
    .query(async ({ input }) => {
      return getMaintenanceVisitsByProject(input.clientProjectId);
    }),

  updateVisit: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["scheduled", "confirmed", "in_progress", "completed", "cancelled"]).optional(),
      visitNotes: z.string().optional(),
      photosJson: z.string().optional(),
      completedDate: z.number().optional(),
      clientSignature: z.string().optional(),
      satisfactionScore: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateMaintenanceVisit(id, data);
      return { success: true };
    }),

  // ============ OpsX Insight 구독 관리 ============

  createSubscription: protectedProcedure
    .input(z.object({
      clientProjectId: z.number(),
      plan: z.enum(["basic", "standard", "premium"]),
      monthlyFee: z.number(),
      sensorTypes: z.string(), // JSON: ["air_quality", "temperature", "humidity", "light", "occupancy"]
      reportFrequency: z.enum(["weekly", "biweekly", "monthly", "quarterly"]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "master") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      
      const result = await createInsightSubscription({
        ...input,
        status: "active",
        startDate: Date.now(),
      });
      
      if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      await notifyOwner({
        title: "OpsX Insight 구독 시작",
        content: `프로젝트 #${input.clientProjectId} - ${input.plan} 플랜 구독이 시작되었습니다.`,
      });
      
      return { id: result.id };
    }),

  getSubscription: protectedProcedure
    .input(z.object({ clientProjectId: z.number() }))
    .query(async ({ input }) => {
      return getInsightSubscriptionByProject(input.clientProjectId);
    }),

  updateSubscription: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["active", "paused", "cancelled"]).optional(),
      plan: z.enum(["basic", "standard", "premium"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "master") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { id, ...data } = input;
      await updateInsightSubscription(id, data);
      return { success: true };
    }),

  // ============ 3개월 주기 공간 최적화 리포트 ============

  generateOptimizationReport: protectedProcedure
    .input(z.object({
      subscriptionId: z.number(),
      clientProjectId: z.number(),
      sensorDataSummary: z.string(), // JSON: 센서 데이터 요약
      occupancyData: z.string().optional(), // JSON: 점유율 데이터
      currentLayoutJson: z.string().optional(), // 현재 레이아웃
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "master") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      
      const llmResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `당신은 사무공간 최적화 전문가입니다. 센서 데이터와 점유율 데이터를 분석하여 공간 최적화 리포트를 JSON으로 생성하세요.
{
  "executiveSummary": "핵심 요약",
  "overallEfficiency": 0-100,
  "zoneAnalysis": [{ "zone": "존명", "utilization": %, "issue": "문제점", "recommendation": "개선안" }],
  "environmentalIssues": [{ "type": "공기질|조도|온도|습도|소음", "severity": "high|medium|low", "location": "위치", "recommendation": "개선안" }],
  "layoutChanges": [{ "change": "변경 내용", "impact": "예상 효과", "cost": "예상 비용", "rewallApplicable": true/false }],
  "costSavingOpportunities": [{ "area": "영역", "currentCost": 금액, "optimizedCost": 금액, "savings": 금액 }],
  "nextQuarterFocus": ["다음 분기 중점 사항"]
}`,
          },
          {
            role: "user",
            content: `센서 데이터 요약: ${input.sensorDataSummary}
${input.occupancyData ? "점유율 데이터: " + input.occupancyData : ""}
${input.currentLayoutJson ? "현재 레이아웃: " + input.currentLayoutJson : ""}`,
          },
        ],
      });

      const reportData = JSON.parse(llmResponse.choices[0].message.content || "{}");
      
      const result = await createSpaceOptimizationReport({
        subscriptionId: input.subscriptionId,
        clientProjectId: input.clientProjectId,
        reportPeriod: `${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`,
        overallEfficiency: reportData.overallEfficiency,
        zoneAnalysis: JSON.stringify(reportData.zoneAnalysis),
        environmentalIssues: JSON.stringify(reportData.environmentalIssues),
        layoutChanges: JSON.stringify(reportData.layoutChanges),
        costSavings: JSON.stringify(reportData.costSavingOpportunities),
        executiveSummary: reportData.executiveSummary,
        fullReportJson: JSON.stringify(reportData),
        rewallRecommendations: JSON.stringify(
          (reportData.layoutChanges || []).filter((c: any) => c.rewallApplicable)
        ),
      });
      
      if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      return { reportId: result.id, report: reportData };
    }),

  getOptimizationReports: protectedProcedure
    .input(z.object({ subscriptionId: z.number() }))
    .query(async ({ input }) => {
      return getOptimizationReportsBySubscription(input.subscriptionId);
    }),
});
