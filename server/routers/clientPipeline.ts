import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";
import { storagePut } from "../storage";
import {
  createClientProject, getClientProjectsByUser, getClientProjectById,
  updateClientProjectStatus, updateClientProject, getAllClientProjects,
  createClientFloorPlan, getFloorPlansByProject, updateFloorPlanAnalysis,
  createWorkSurvey, getWorkSurveyByProject, completeWorkSurvey,
  createCompanyWideSurvey, getCompanySurveyByToken, getCompanySurveysByProject,
  incrementSurveyResponseCount,
  createCompanySurveyResponse, getResponsesBySurvey, getSurveyResponseStats,
  createAiReport, getReportsByProject, markReportSent,
  createMeetingBooking, getMeetingsByProject, getAllMeetings, updateMeetingStatus,
} from "../db";

function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, "0")).join("");
}

export const clientPipelineRouter = router({
  // ============ Client Projects ============
  createProject: protectedProcedure
    .input(z.object({
      companyName: z.string().min(1),
      contactName: z.string().min(1),
      contactEmail: z.string().email(),
      contactPhone: z.string().optional(),
      employeeCount: z.number().optional(),
      currentAddress: z.string().optional(),
      desiredMoveDate: z.string().optional(),
      budgetRange: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await createClientProject({
        userId: ctx.user.id,
        ...input,
      });
      if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      await notifyOwner({
        title: "새 고객 프로젝트 생성",
        content: `${input.companyName} - ${input.contactName}님이 새 프로젝트를 생성했습니다.`,
      });
      
      return { id: result.id };
    }),

  myProjects: protectedProcedure.query(async ({ ctx }) => {
    return getClientProjectsByUser(ctx.user.id);
  }),

  getProject: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const project = await getClientProjectById(input.id);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      if (project.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return project;
    }),

  // ============ Floor Plan Upload ============
  uploadFloorPlan: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      fileName: z.string(),
      fileBase64: z.string(),
      fileType: z.string(),
      fileSize: z.number(),
      floorNumber: z.number().optional(),
      floorName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const project = await getClientProjectById(input.projectId);
      if (!project || (project.userId !== ctx.user.id && ctx.user.role !== "admin")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const buffer = Buffer.from(input.fileBase64, "base64");
      const suffix = Math.random().toString(36).substring(2, 10);
      const ext = input.fileName.split(".").pop() || "pdf";
      const fileKey = `client-plans/${input.projectId}/${suffix}.${ext}`;
      
      const { url } = await storagePut(fileKey, buffer, input.fileType);

      const plan = await createClientFloorPlan({
        projectId: input.projectId,
        fileName: input.fileName,
        fileUrl: url,
        fileKey,
        fileType: ext === "pdf" ? "pdf" : ["dwg", "dxf"].includes(ext) ? "cad" : "image",
        fileSize: input.fileSize,
        floorNumber: input.floorNumber,
        floorName: input.floorName,
      });

      await updateClientProjectStatus(input.projectId, "floor_plan_uploaded");

      return { id: plan?.id, url };
    }),

  getFloorPlans: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const project = await getClientProjectById(input.projectId);
      if (!project || (project.userId !== ctx.user.id && ctx.user.role !== "admin")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getFloorPlansByProject(input.projectId);
    }),

  analyzeFloorPlan: protectedProcedure
    .input(z.object({ floorPlanId: z.number(), projectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const project = await getClientProjectById(input.projectId);
      if (!project || (project.userId !== ctx.user.id && ctx.user.role !== "admin")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const plans = await getFloorPlansByProject(input.projectId);
      const plan = plans.find(p => p.id === input.floorPlanId);
      if (!plan) throw new TRPCError({ code: "NOT_FOUND" });

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `당신은 오피스 인테리어 전문 도면 분석가입니다. 도면 이미지/PDF를 분석하여 다음 정보를 JSON으로 반환하세요:
{
  "estimatedArea": "추정 면적(㎡)",
  "roomCount": "방 수",
  "hasReception": true/false,
  "hasMeetingRoom": true/false,
  "hasOpenOffice": true/false,
  "hasKitchen": true/false,
  "hasRestroom": true/false,
  "structuralNotes": "구조적 특이사항",
  "spaceAnalysis": "공간 분석 요약",
  "recommendations": ["개선 제안1", "개선 제안2"]
}`
          },
          {
            role: "user",
            content: [
              { type: "text", text: `이 도면을 분석해주세요. 파일명: ${plan.fileName}` },
              { type: "image_url", image_url: { url: plan.fileUrl, detail: "high" } }
            ]
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "floor_plan_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                estimatedArea: { type: "string" },
                roomCount: { type: "string" },
                hasReception: { type: "boolean" },
                hasMeetingRoom: { type: "boolean" },
                hasOpenOffice: { type: "boolean" },
                hasKitchen: { type: "boolean" },
                hasRestroom: { type: "boolean" },
                structuralNotes: { type: "string" },
                spaceAnalysis: { type: "string" },
                recommendations: { type: "array", items: { type: "string" } },
              },
              required: ["estimatedArea", "roomCount", "hasReception", "hasMeetingRoom", "hasOpenOffice", "hasKitchen", "hasRestroom", "structuralNotes", "spaceAnalysis", "recommendations"],
              additionalProperties: false,
            }
          }
        }
      });

      const analysis = JSON.parse(response.choices[0].message.content || "{}");
      await updateFloorPlanAnalysis(input.floorPlanId, analysis);
      return analysis;
    }),

  // ============ Work Environment Survey ============
  submitWorkSurvey: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      respondentName: z.string().min(1),
      respondentRole: z.string().optional(),
      respondentEmail: z.string().email().optional(),
      workStyle: z.enum(["collaborative", "focused", "hybrid", "flexible"]).optional(),
      remoteWorkRatio: z.number().min(0).max(100).optional(),
      meetingFrequency: z.enum(["rarely", "few_weekly", "daily", "very_frequent"]).optional(),
      privateOfficeCount: z.number().optional(),
      meetingRoomCount: z.number().optional(),
      needsLounge: z.number().optional(),
      needsCafeteria: z.number().optional(),
      needsPhoneBooth: z.number().optional(),
      needsLibrary: z.number().optional(),
      needsGym: z.number().optional(),
      needsNapRoom: z.number().optional(),
      specialSpaces: z.string().optional(),
      designStyle: z.enum(["modern", "minimal", "warm", "industrial", "natural", "luxury", "creative"]).optional(),
      colorPreference: z.string().optional(),
      brandColors: z.string().optional(),
      inspirationNotes: z.string().optional(),
      currentPainPoints: z.array(z.string()).optional(),
      priorityAreas: z.array(z.string()).optional(),
      acRequirements: z.string().optional(),
      lightingPreference: z.enum(["natural", "warm", "cool", "mixed"]).optional(),
      noiseControl: z.enum(["critical", "important", "moderate", "not_important"]).optional(),
      storageNeeds: z.enum(["minimal", "moderate", "extensive"]).optional(),
      techRequirements: z.string().optional(),
      budgetPriority: z.enum(["cost_saving", "balanced", "quality_first"]).optional(),
      timelineUrgency: z.enum(["flexible", "within_6months", "within_3months", "urgent"]).optional(),
      additionalNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const project = await getClientProjectById(input.projectId);
      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const result = await createWorkSurvey({
        ...input,
        completedAt: new Date(),
      });
      if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await completeWorkSurvey(result.id);
      await updateClientProjectStatus(input.projectId, "survey_completed");

      return { id: result.id };
    }),

  getWorkSurvey: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const project = await getClientProjectById(input.projectId);
      if (!project || (project.userId !== ctx.user.id && ctx.user.role !== "admin")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getWorkSurveyByProject(input.projectId);
    }),

  // ============ AI Report Generation ============
  generateReport: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const project = await getClientProjectById(input.projectId);
      if (!project || (project.userId !== ctx.user.id && ctx.user.role !== "admin")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const survey = await getWorkSurveyByProject(input.projectId);
      const floorPlans = await getFloorPlansByProject(input.projectId);

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `당신은 고감도(KOKAMDO)의 수석 인테리어 컨설턴트입니다. 고객의 업무환경 서베이 결과와 도면 분석 데이터를 바탕으로 전문적인 분석 보고서와 제안서를 작성합니다.

보고서는 마크다운 형식으로 다음 구조를 따릅니다:
1. 경영진 요약 (Executive Summary)
2. 현재 공간 분석
3. 업무환경 진단 결과
4. 핵심 개선 영역
5. 공간 설계 방향 제안
6. 디자인 컨셉 제안
7. 예상 일정 및 프로세스
8. 고감도의 차별화 포인트
9. 다음 단계 안내

전문적이면서도 이해하기 쉬운 톤으로 작성하세요. 고감도의 12년 경험과 150+ 프로젝트 실적을 자연스럽게 녹여주세요.`
          },
          {
            role: "user",
            content: `다음 데이터를 바탕으로 분석 보고서와 제안서를 작성해주세요.

## 고객 정보
- 회사명: ${project.companyName}
- 담당자: ${project.contactName}
- 직원수: ${project.employeeCount ?? "미입력"}
- 예산 범위: ${project.budgetRange ?? "미입력"}
- 희망 이전일: ${project.desiredMoveDate ?? "미입력"}

## 도면 분석 결과
${floorPlans.map(fp => `- ${fp.floorName || fp.fileName}: ${JSON.stringify(fp.aiAnalysis || "분석 전")}`).join("\n")}

## 업무환경 서베이 결과
${survey ? JSON.stringify(survey, null, 2) : "서베이 미완료"}`
          }
        ]
      });

      const content = response.choices[0].message.content || "";

      // 분석 보고서 저장
      const analysisReport = await createAiReport({
        projectId: input.projectId,
        type: "analysis",
        title: `${project.companyName} 업무환경 분석 보고서`,
        content,
        summary: content.substring(0, 500),
      });

      // 제안서 생성
      const proposalResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `당신은 고감도(KOKAMDO)의 영업 전문가입니다. 분석 보고서를 바탕으로 구매를 유도하는 설득력 있는 제안서를 작성합니다.

제안서 구조:
1. 인사말 (고객사 맞춤)
2. 프로젝트 비전
3. 고감도만의 솔루션
4. 설계 컨셉 방향 (2-3가지 옵션)
5. 프로젝트 로드맵
6. 투자 가치 분석
7. 고감도 실적 및 신뢰도
8. 특별 혜택 (첫 미팅 시 3D 렌더링 무료 제공 등)
9. 다음 단계 (미팅 예약 유도)

구매를 일으키는 핵심: 고객의 Pain Point를 정확히 짚고, 고감도의 솔루션이 어떻게 해결하는지 구체적으로 보여주세요.`
          },
          {
            role: "user",
            content: `다음 분석 보고서를 바탕으로 제안서를 작성해주세요.\n\n${content}`
          }
        ]
      });

      const proposalContent = proposalResponse.choices[0].message.content || "";
      const proposalReport = await createAiReport({
        projectId: input.projectId,
        type: "proposal",
        title: `${project.companyName} 맞춤 인테리어 제안서`,
        content: proposalContent,
        summary: proposalContent.substring(0, 500),
      });

      await updateClientProjectStatus(input.projectId, "report_generated");

      await notifyOwner({
        title: "AI 보고서/제안서 생성 완료",
        content: `${project.companyName} 프로젝트의 분석 보고서와 제안서가 자동 생성되었습니다.`,
      });

      return { analysisId: analysisReport?.id, proposalId: proposalReport?.id };
    }),

  sendReportEmail: protectedProcedure
    .input(z.object({ reportId: z.number(), projectId: z.number(), origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await getClientProjectById(input.projectId);
      if (!project || (project.userId !== ctx.user.id && ctx.user.role !== "admin")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const reports = await getReportsByProject(input.projectId);
      const report = reports.find(r => r.id === input.reportId);
      if (!report) throw new TRPCError({ code: "NOT_FOUND" });

      await markReportSent(input.reportId, project.contactEmail);
      await updateClientProjectStatus(input.projectId, "report_sent");

      await notifyOwner({
        title: "보고서 이메일 발송",
        content: `${project.companyName}의 ${report.title}이 ${project.contactEmail}로 발송되었습니다.`,
      });

      return { success: true };
    }),

  getReports: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const project = await getClientProjectById(input.projectId);
      if (!project || (project.userId !== ctx.user.id && ctx.user.role !== "admin")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getReportsByProject(input.projectId);
    }),

  // ============ Company-Wide Survey ============
  createCompanySurvey: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      maxResponses: z.number().optional(),
      expiresInDays: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const project = await getClientProjectById(input.projectId);
      if (!project || (project.userId !== ctx.user.id && ctx.user.role !== "admin")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const token = generateToken();
      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 86400000)
        : new Date(Date.now() + 14 * 86400000); // 기본 14일

      const result = await createCompanyWideSurvey({
        projectId: input.projectId,
        token,
        title: input.title || `${project.companyName} 업무환경 설문조사`,
        description: input.description || "더 나은 업무환경을 위한 설문조사입니다. 솔직한 의견을 부탁드립니다.",
        expiresAt,
        maxResponses: input.maxResponses,
      });

      await updateClientProjectStatus(input.projectId, "company_survey_shared");

      return { id: result?.id, token };
    }),

  getCompanySurveyPublic: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const survey = await getCompanySurveyByToken(input.token);
      if (!survey) throw new TRPCError({ code: "NOT_FOUND" });
      if (!survey.isActive) throw new TRPCError({ code: "BAD_REQUEST", message: "설문이 마감되었습니다." });
      if (survey.expiresAt && new Date(survey.expiresAt) < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "설문 기한이 만료되었습니다." });
      }
      return { title: survey.title, description: survey.description, responseCount: survey.responseCount };
    }),

  submitCompanySurveyResponse: publicProcedure
    .input(z.object({
      token: z.string(),
      department: z.string().optional(),
      role: z.string().optional(),
      tenure: z.enum(["less_1y", "1_3y", "3_5y", "5_10y", "over_10y"]).optional(),
      overallSatisfaction: z.number().min(1).max(5).optional(),
      noiseSatisfaction: z.number().min(1).max(5).optional(),
      lightingSatisfaction: z.number().min(1).max(5).optional(),
      temperatureSatisfaction: z.number().min(1).max(5).optional(),
      spaceSatisfaction: z.number().min(1).max(5).optional(),
      privacySatisfaction: z.number().min(1).max(5).optional(),
      deskUsageHours: z.number().optional(),
      meetingHoursPerDay: z.string().optional(),
      collaborationFrequency: z.enum(["rarely", "sometimes", "often", "always"]).optional(),
      focusWorkNeed: z.enum(["low", "medium", "high", "critical"]).optional(),
      desiredSpaces: z.array(z.string()).optional(),
      improvementSuggestions: z.string().optional(),
      additionalComments: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const survey = await getCompanySurveyByToken(input.token);
      if (!survey || !survey.isActive) throw new TRPCError({ code: "BAD_REQUEST", message: "유효하지 않은 설문입니다." });
      if (survey.expiresAt && new Date(survey.expiresAt) < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "설문 기한이 만료되었습니다." });
      }
      if (survey.maxResponses && survey.responseCount >= survey.maxResponses) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "최대 응답 수에 도달했습니다." });
      }

      const { token, ...responseData } = input;
      await createCompanySurveyResponse({
        surveyId: survey.id,
        ...responseData,
        meetingHoursPerDay: input.meetingHoursPerDay || undefined,
      });
      await incrementSurveyResponseCount(survey.id);

      return { success: true };
    }),

  getCompanySurveys: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const project = await getClientProjectById(input.projectId);
      if (!project || (project.userId !== ctx.user.id && ctx.user.role !== "admin")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getCompanySurveysByProject(input.projectId);
    }),

  getSurveyResponses: protectedProcedure
    .input(z.object({ surveyId: z.number(), projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const project = await getClientProjectById(input.projectId);
      if (!project || (project.userId !== ctx.user.id && ctx.user.role !== "admin")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getResponsesBySurvey(input.surveyId);
    }),

  getSurveyStats: protectedProcedure
    .input(z.object({ surveyId: z.number(), projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const project = await getClientProjectById(input.projectId);
      if (!project || (project.userId !== ctx.user.id && ctx.user.role !== "admin")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getSurveyResponseStats(input.surveyId);
    }),

  // ============ Meeting Booking ============
  requestMeeting: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      requestedDate: z.string(),
      requestedTime: z.string(),
      duration: z.number().optional(),
      meetingType: z.enum(["online", "visit", "office"]).optional(),
      location: z.string().optional(),
      agenda: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const project = await getClientProjectById(input.projectId);
      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const result = await createMeetingBooking({
        projectId: input.projectId,
        requestedDate: input.requestedDate,
        requestedTime: input.requestedTime,
        duration: input.duration || 60,
        meetingType: input.meetingType || "office",
        location: input.location,
        agenda: input.agenda,
      });

      await updateClientProjectStatus(input.projectId, "meeting_requested");

      await notifyOwner({
        title: "미팅 예약 요청",
        content: `${project.companyName} - ${project.contactName}님이 ${input.requestedDate} ${input.requestedTime} 미팅을 요청했습니다.`,
      });

      return { id: result?.id };
    }),

  getMeetings: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const project = await getClientProjectById(input.projectId);
      if (!project || (project.userId !== ctx.user.id && ctx.user.role !== "admin")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getMeetingsByProject(input.projectId);
    }),

  // ============ Admin APIs ============
  adminListProjects: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    return getAllClientProjects();
  }),

  adminListMeetings: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    return getAllMeetings();
  }),

  adminUpdateMeeting: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["requested", "confirmed", "rescheduled", "cancelled", "completed"]),
      adminNotes: z.string().optional(),
      confirmedDate: z.string().optional(),
      confirmedTime: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      await updateMeetingStatus(input.id, input.status, input.adminNotes, input.confirmedDate, input.confirmedTime);
      return { success: true };
    }),

  adminUpdateProjectStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      await updateClientProjectStatus(input.id, input.status);
      return { success: true };
    }),
});
