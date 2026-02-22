import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";
import {
  createSurveyTemplate, getSurveyTemplates, getSurveyTemplateById,
  createSurveyQuestion, getQuestionsByTemplate, updateSurveyQuestion, deleteSurveyQuestion,
  createQuestionOptions, getOptionsByQuestion,
  createSurveyInstance, getSurveyInstanceByToken, getSurveyInstancesByProject, updateSurveyInstance,
  createSurveyResponse, getResponsesByInstance,
  createSurveyAnalysisReport, getAnalysisReportsByProject, getAnalysisReportById,
  createAutoEmailLog, getEmailLogsByProject,
} from "../db";

function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, "0")).join("");
}

export const surveyAutomationRouter = router({
  // ============ 설문 템플릿 관리 (관리자) ============
  
  createTemplate: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      type: z.enum(["initial_contact", "company_wide", "post_occupancy", "satisfaction"]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "master") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const result = await createSurveyTemplate(input);
      if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return { id: result.id };
    }),

  listTemplates: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "master") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return getSurveyTemplates();
  }),

  getTemplate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const template = await getSurveyTemplateById(input.id);
      if (!template) throw new TRPCError({ code: "NOT_FOUND" });
      const questions = await getQuestionsByTemplate(input.id);
      const questionsWithOptions = await Promise.all(
        questions.map(async (q) => ({
          ...q,
          options: await getOptionsByQuestion(q.id),
        }))
      );
      return { ...template, questions: questionsWithOptions };
    }),

  // ============ 설문 질문 관리 ============

  addQuestion: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      questionText: z.string().min(1),
      questionType: z.enum(["text", "textarea", "single_choice", "multiple_choice", "scale", "number"]),
      isRequired: z.number().default(1),
      sortOrder: z.number().default(0),
      options: z.array(z.object({
        optionText: z.string(),
        optionValue: z.string().optional(),
        sortOrder: z.number().default(0),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "master") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { options, ...questionData } = input;
      const result = await createSurveyQuestion(questionData);
      if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      if (options && options.length > 0) {
        await createQuestionOptions(
          options.map(o => ({ ...o, questionId: result.id }))
        );
      }
      return { id: result.id };
    }),

  updateQuestion: protectedProcedure
    .input(z.object({
      id: z.number(),
      questionText: z.string().optional(),
      questionType: z.enum(["text", "textarea", "single_choice", "multiple_choice", "scale", "number"]).optional(),
      isRequired: z.number().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "master") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { id, ...data } = input;
      await updateSurveyQuestion(id, data);
      return { success: true };
    }),

  deleteQuestion: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "master") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await deleteSurveyQuestion(input.id);
      return { success: true };
    }),

  // ============ Phase 1: 상담 요청 → 1차 설문 자동 발송 ============

  triggerInitialSurvey: protectedProcedure
    .input(z.object({
      clientProjectId: z.number(),
      recipientEmail: z.string().email(),
      recipientName: z.string(),
      templateId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "master") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7일
      
      const instance = await createSurveyInstance({
        templateId: input.templateId,
        clientProjectId: input.clientProjectId,
        token,
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName,
        status: "sent",
        expiresAt: expiresAt.getTime(),
      });
      
      if (!instance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      // 이메일 발송 로그 기록
      await createAutoEmailLog({
        clientProjectId: input.clientProjectId,
        emailType: "initial_survey",
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName,
        subject: "[고감도] 업무환경 진단 설문 안내",
        status: "sent",
        metadata: JSON.stringify({ instanceId: instance.id, token }),
      });
      
      await notifyOwner({
        title: "1차 설문 발송",
        content: `${input.recipientName}(${input.recipientEmail})에게 1차 설문이 발송되었습니다.`,
      });
      
      return { instanceId: instance.id, token, expiresAt: expiresAt.getTime() };
    }),

  // ============ Phase 2: 토큰 기반 설문 응답 (비로그인) ============

  getSurveyByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const instance = await getSurveyInstanceByToken(input.token);
      if (!instance) throw new TRPCError({ code: "NOT_FOUND", message: "설문을 찾을 수 없습니다." });
      if (instance.status === "expired" || (instance.expiresAt && instance.expiresAt < Date.now())) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "설문 기한이 만료되었습니다." });
      }
      
      const questions = await getQuestionsByTemplate(instance.templateId);
      const questionsWithOptions = await Promise.all(
        questions.map(async (q) => ({
          ...q,
          options: await getOptionsByQuestion(q.id),
        }))
      );
      
      return {
        instanceId: instance.id,
        templateId: instance.templateId,
        recipientName: instance.recipientName,
        status: instance.status,
        questions: questionsWithOptions,
      };
    }),

  submitSurveyResponse: publicProcedure
    .input(z.object({
      token: z.string(),
      respondentName: z.string().optional(),
      respondentEmail: z.string().optional(),
      respondentDepartment: z.string().optional(),
      answers: z.string(), // JSON string of answers
    }))
    .mutation(async ({ input }) => {
      const instance = await getSurveyInstanceByToken(input.token);
      if (!instance) throw new TRPCError({ code: "NOT_FOUND" });
      if (instance.status === "expired") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "설문 기한이 만료되었습니다." });
      }
      
      const result = await createSurveyResponse({
        instanceId: instance.id,
        respondentName: input.respondentName,
        respondentEmail: input.respondentEmail,
        respondentDepartment: input.respondentDepartment,
        answers: input.answers,
      });
      
      if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      // 인스턴스 상태를 in_progress로 업데이트
      if (instance.status === "sent") {
        await updateSurveyInstance(instance.id, { status: "in_progress" });
      }
      
      return { responseId: result.id };
    }),

  // ============ Phase 2: AI 분석 리포트 생성 ============

  generateAnalysisReport: protectedProcedure
    .input(z.object({
      clientProjectId: z.number(),
      instanceId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const responses = await getResponsesByInstance(input.instanceId);
      if (responses.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "응답 데이터가 없습니다." });
      }
      
      const responseSummary = responses.map(r => ({
        name: r.respondentName,
        department: r.respondentDepartment,
        answers: JSON.parse(r.answers || "{}"),
      }));
      
      const llmResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `당신은 사무공간 컨설팅 전문가입니다. 설문 응답 데이터를 분석하여 다음 항목을 포함한 JSON 리포트를 생성하세요:
{
  "executiveSummary": "핵심 요약 (200자 이내)",
  "overallScore": 0-100 점수,
  "categoryScores": { "업무환경": 점수, "소통협업": 점수, "시설만족도": 점수, "공간활용": 점수 },
  "painPoints": ["문제점1", "문제점2", ...],
  "recommendations": ["개선안1", "개선안2", ...],
  "spaceNeeds": { "estimatedArea": 평수(숫자), "departmentBreakdown": { "부서명": 면적 }, "meetingRooms": 개수, "focusZones": 개수 },
  "priorityActions": [{ "action": "조치", "impact": "high/medium/low", "timeline": "기간" }]
}`,
          },
          {
            role: "user",
            content: `설문 응답 데이터 (${responses.length}명):\n${JSON.stringify(responseSummary, null, 2)}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "survey_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                executiveSummary: { type: "string" },
                overallScore: { type: "number" },
                categoryScores: { type: "object", additionalProperties: { type: "number" } },
                painPoints: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } },
                spaceNeeds: {
                  type: "object",
                  properties: {
                    estimatedArea: { type: "number" },
                    departmentBreakdown: { type: "object", additionalProperties: { type: "number" } },
                    meetingRooms: { type: "number" },
                    focusZones: { type: "number" },
                  },
                  required: ["estimatedArea", "departmentBreakdown", "meetingRooms", "focusZones"],
                  additionalProperties: false,
                },
                priorityActions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      action: { type: "string" },
                      impact: { type: "string" },
                      timeline: { type: "string" },
                    },
                    required: ["action", "impact", "timeline"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["executiveSummary", "overallScore", "categoryScores", "painPoints", "recommendations", "spaceNeeds", "priorityActions"],
              additionalProperties: false,
            },
          },
        },
      });
      
      const analysisData = JSON.parse(llmResponse.choices[0].message.content || "{}");
      
      const report = await createSurveyAnalysisReport({
        clientProjectId: input.clientProjectId,
        instanceId: input.instanceId,
        reportType: "initial_analysis",
        overallScore: analysisData.overallScore,
        executiveSummary: analysisData.executiveSummary,
        categoryScores: JSON.stringify(analysisData.categoryScores),
        painPoints: JSON.stringify(analysisData.painPoints),
        recommendations: JSON.stringify(analysisData.recommendations),
        spaceNeeds: JSON.stringify(analysisData.spaceNeeds),
        fullReportJson: JSON.stringify(analysisData),
      });
      
      if (!report) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      // 인스턴스 상태를 completed로 업데이트
      await updateSurveyInstance(input.instanceId, { status: "completed" });
      
      return { reportId: report.id, analysis: analysisData };
    }),

  getAnalysisReports: protectedProcedure
    .input(z.object({ clientProjectId: z.number() }))
    .query(async ({ input }) => {
      return getAnalysisReportsByProject(input.clientProjectId);
    }),

  getAnalysisReport: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const report = await getAnalysisReportById(input.id);
      if (!report) throw new TRPCError({ code: "NOT_FOUND" });
      return report;
    }),

  // ============ Phase 3: 전사 설문 질문 수정/추가/삭제 + 링크 재생성 ============

  createCompanySurveyInstance: protectedProcedure
    .input(z.object({
      clientProjectId: z.number(),
      templateId: z.number(),
      recipientEmail: z.string().email(),
      recipientName: z.string(),
      customQuestions: z.string().optional(), // JSON: 수정된 질문 목록
    }))
    .mutation(async ({ ctx, input }) => {
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14일
      
      const instance = await createSurveyInstance({
        templateId: input.templateId,
        clientProjectId: input.clientProjectId,
        token,
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName,
        status: "sent",
        expiresAt: expiresAt.getTime(),
        customQuestions: input.customQuestions,
      });
      
      if (!instance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      await createAutoEmailLog({
        clientProjectId: input.clientProjectId,
        emailType: "company_wide_survey",
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName,
        subject: "[고감도] 전사 업무환경 설문 안내",
        status: "sent",
        metadata: JSON.stringify({ instanceId: instance.id, token }),
      });
      
      return { instanceId: instance.id, token, expiresAt: expiresAt.getTime() };
    }),

  // AI로 질문 재구성
  regenerateQuestions: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      modifications: z.string(), // 담당자가 수정/추가/삭제한 내용 JSON
    }))
    .mutation(async ({ ctx, input }) => {
      const existingQuestions = await getQuestionsByTemplate(input.templateId);
      
      const llmResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `당신은 사무공간 환경 설문 전문가입니다. 기존 질문 목록과 담당자의 수정 요청을 받아 최적화된 설문 질문 목록을 JSON 배열로 반환하세요.
각 질문은 { "questionText": "질문", "questionType": "single_choice|text|scale|multiple_choice", "options": ["선택지1", ...] } 형태입니다.
질문 수는 15~25개가 적당합니다. 중복을 제거하고 논리적 순서로 배치하세요.`,
          },
          {
            role: "user",
            content: `기존 질문:\n${JSON.stringify(existingQuestions.map(q => q.questionText))}\n\n수정 요청:\n${input.modifications}`,
          },
        ],
      });
      
      return {
        regeneratedQuestions: llmResponse.choices[0].message.content,
      };
    }),

  // 설문 인스턴스 목록 조회
  getInstancesByProject: protectedProcedure
    .input(z.object({ clientProjectId: z.number() }))
    .query(async ({ input }) => {
      return getSurveyInstancesByProject(input.clientProjectId);
    }),

  // 이메일 발송 로그 조회
  getEmailLogs: protectedProcedure
    .input(z.object({ clientProjectId: z.number() }))
    .query(async ({ input }) => {
      return getEmailLogsByProject(input.clientProjectId);
    }),
});
