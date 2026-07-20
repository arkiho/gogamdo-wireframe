import { z } from "zod";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";
import {
  createPostOccupancySurvey, getPostOccupancyByProject, getAllPostOccupancySurveys,
  createMaintenanceVisit, getMaintenanceVisitsByProject, getAllMaintenanceVisits, updateMaintenanceVisit,
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
        clientProjectId: input.clientProjectId,
        overallSatisfaction: input.overallScore,
        designSatisfaction: input.designScore,
        constructionSatisfaction: input.constructionScore,
        communicationSatisfaction: input.communicationScore,
        timelineSatisfaction: input.timelinessScore,
        positiveComments: input.positives,
        improvementSuggestions: input.improvements,
        wouldRecommend: input.wouldRecommend,
        status: "completed",
        // value/airQuality/lighting/noise/temperature 점수 및 additionalComments 전용 컬럼이 없어 issuesReported에 보존
        issuesReported: [{
          area: "추가 평가/코멘트",
          description: JSON.stringify({
            valueScore: input.valueScore,
            airQualityScore: input.airQualityScore,
            lightingScore: input.lightingScore,
            noiseScore: input.noiseScore,
            temperatureScore: input.temperatureScore,
            additionalComments: input.additionalComments,
          }),
          severity: "minor" as const,
        }],
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

  /** 관리자: 전체 만족도 조사 목록 (평균 산출·개별 응답 열람용) */
  adminListSurveys: adminProcedure.query(async () => {
    return getAllPostOccupancySurveys();
  }),

  /** 관리자: 만족도 조사 발송 — 응답 대기 레코드를 생성한다 */
  sendSatisfactionSurvey: adminProcedure
    .input(z.object({ clientProjectId: z.number() }))
    .mutation(async ({ input }) => {
      const existing = await getPostOccupancyByProject(input.clientProjectId);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: existing.status === "completed"
            ? "이미 응답이 완료된 조사입니다."
            : "이미 발송된 조사가 있습니다.",
        });
      }
      const result = await createPostOccupancySurvey({
        clientProjectId: input.clientProjectId,
        status: "sent",
      });
      if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await notifyOwner({
        title: "만족도 조사 발송",
        content: `프로젝트 #${input.clientProjectId} 만족도 조사가 발송되었습니다.`,
      });
      return { id: result.id };
    }),

  // ============ 유지보수 방문 관리 ============

  scheduleVisit: protectedProcedure
    .input(z.object({
      clientProjectId: z.number(),
      // maintenance_visits.visitType enum과 동일하게 유지할 것
      visitType: z.enum(["fine_tuning", "warranty", "optimization", "inspection"]),
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
        clientProjectId: input.clientProjectId,
        visitType: input.visitType,
        scheduledDate: new Date(input.scheduledDate).toISOString().slice(0, 10),
        technicianId: input.assignedStaffId,
        technicianName: input.assignedStaffName,
        // issueReported 전용 컬럼이 없어 description에 통합 보존
        description: [input.description, input.issueReported ? `[보고된 이슈] ${input.issueReported}` : ""].filter(Boolean).join("\n") || undefined,
        status: "scheduled",
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
      status: z.enum(["scheduled", "confirmed", "in_progress", "completed", "cancelled", "rescheduled"]).optional(),
      workPerformed: z.string().optional(),
      photoUrls: z.array(z.string()).optional(),
      completedAt: z.number().optional(),
      clientSignature: z.string().optional(),
      clientFeedback: z.string().optional(),
      technicianId: z.number().optional(),
      technicianName: z.string().optional(),
      issuesFound: z.array(z.object({
        area: z.string(),
        issue: z.string(),
        resolution: z.string(),
        status: z.enum(["resolved", "pending", "escalated"]),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, completedAt, ...rest } = input;
      // completedAt은 timestamp 컬럼이므로 epoch ms를 Date로 변환해야 한다.
      // status가 completed로 바뀌는데 시각이 없으면 현재 시각으로 채운다.
      const completedTs = completedAt != null
        ? new Date(completedAt)
        : rest.status === "completed" ? new Date() : undefined;
      await updateMaintenanceVisit(id, {
        ...rest,
        ...(completedTs ? { completedAt: completedTs } : {}),
      });
      return { success: true };
    }),

  /** 관리자: 전체 방문/하자보수 목록 */
  adminListVisits: adminProcedure.query(async () => {
    return getAllMaintenanceVisits();
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
        clientProjectId: input.clientProjectId,
        plan: input.plan,
        monthlyFee: String(input.monthlyFee),
        status: "active",
        startDate: new Date().toISOString().slice(0, 10),
        // sensorTypes는 sensorsInstalled에 보존, reportFrequency 전용 컬럼은 스키마에 없음(미저장)
        sensorsInstalled: input.sensorTypes ? JSON.parse(input.sensorTypes) : undefined,
      });
      
      if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      await notifyOwner({
        title: "정기 관리 구독 시작",
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
        summary: reportData.executiveSummary,
        occupancyAnalysis: reportData.zoneAnalysis,
        environmentAnalysis: reportData.environmentalIssues,
        optimizationSuggestions: reportData.layoutChanges,
        // overallEfficiency/costSavings/rewallRecommendations 전용 컬럼이 없어 전체 분석을 fullReport에 보존
        fullReport: JSON.stringify(reportData),
        status: "ready",
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
