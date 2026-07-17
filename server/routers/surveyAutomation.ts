import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";
import { sendSurveyReportEmail } from "../email";
import {
  createSurveyTemplate, getSurveyTemplates, getSurveyTemplateById,
  createSurveyQuestion, getQuestionsByTemplate, updateSurveyQuestion, deleteSurveyQuestion,
  createQuestionOptions, getOptionsByQuestion,
  createSurveyInstance, getSurveyInstanceByToken, getSurveyInstancesByProject, updateSurveyInstance,
  createSurveyResponse, getResponsesByInstance,
  createSurveyAnalysisReport, getAnalysisReportsByProject, getAnalysisReportById,
  createAutoEmailLog, getEmailLogsByProject,
  getClientProjectById,
} from "../db";

function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, "0")).join("");
}

// 클라이언트 어휘 -> DB 스키마 enum 매핑 (DB enum이 강제되므로 경계에서 변환)
const TEMPLATE_TYPE_MAP: Record<string, "initial_manager" | "company_wide" | "post_occupancy" | "custom"> = {
  initial_contact: "initial_manager",
  company_wide: "company_wide",
  post_occupancy: "post_occupancy",
  satisfaction: "custom",
};
const QUESTION_TYPE_MAP: Record<string, "single_choice" | "multiple_choice" | "scale" | "text" | "number" | "matrix"> = {
  text: "text",
  textarea: "text",
  single_choice: "single_choice",
  multiple_choice: "multiple_choice",
  scale: "scale",
  number: "number",
  matrix: "matrix",
};

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
      const result = await createSurveyTemplate({ ...input, type: TEMPLATE_TYPE_MAP[input.type] });
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
      const result = await createSurveyQuestion({ ...questionData, questionType: QUESTION_TYPE_MAP[questionData.questionType] });
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
      await updateSurveyQuestion(id, { ...data, questionType: data.questionType ? QUESTION_TYPE_MAP[data.questionType] : undefined });
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
        type: "initial_manager",
        templateId: input.templateId,
        clientProjectId: input.clientProjectId,
        token,
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName,
        status: "sent",
        expiresAt,
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
        metadata: { instanceId: instance.id, token },
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
      if (instance.status === "expired" || (instance.expiresAt && instance.expiresAt.getTime() < Date.now())) {
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
        answers: JSON.parse(input.answers),
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
      origin: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const responses = await getResponsesByInstance(input.instanceId);
      if (responses.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "응답 데이터가 없습니다." });
      }
      
      const responseSummary = responses.map(r => ({
        name: r.respondentName,
        department: r.respondentDepartment,
        answers: r.answers ?? [],
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
      
      const analysisContent = llmResponse.choices[0].message.content;
      const analysisData = JSON.parse((typeof analysisContent === "string" ? analysisContent : "") || "{}");
      
      const report = await createSurveyAnalysisReport({
        clientProjectId: input.clientProjectId,
        instanceId: input.instanceId,
        reportType: "initial_analysis",
        title: "업무환경 진단 분석 리포트",
        summary: analysisData.executiveSummary,
        // overallScore/categoryScores 전용 컬럼은 스키마에 없어 전체 분석 JSON을 content에 보존
        content: JSON.stringify(analysisData),
        insights: (analysisData.painPoints || []).map((p: string, i: number) => ({
          category: "진단",
          finding: p,
          recommendation: (analysisData.recommendations || [])[i] || "",
          priority: "medium" as const,
        })),
        spaceRequirements: analysisData.spaceNeeds
          ? {
              totalAreaNeeded: Number(analysisData.spaceNeeds.estimatedArea) || 0,
              breakdown: Object.entries(analysisData.spaceNeeds.departmentBreakdown || {}).map(([spaceType, areaNeeded]) => ({
                spaceType,
                areaNeeded: Number(areaNeeded) || 0,
                headcount: 0,
                notes: "",
              })),
            }
          : undefined,
      });
      
      if (!report) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      // 인스턴스 상태를 completed로 업데이트
      await updateSurveyInstance(input.instanceId, { status: "completed" });

      // ===== 자동 이메일 발송: 분석 보고서를 담당자에게 전송 =====
      let emailSent = false;
      try {
        const project = await getClientProjectById(input.clientProjectId);
        if (project && project.contactEmail) {
          const emailResult = await sendSurveyReportEmail({
            recipientEmail: project.contactEmail,
            recipientName: project.contactName,
            companyName: project.companyName,
            projectId: input.clientProjectId,
            reportSummary: analysisData.executiveSummary || "",
            overallScore: analysisData.overallScore || 0,
            categoryScores: analysisData.categoryScores || {},
            painPoints: analysisData.painPoints || [],
            recommendations: analysisData.recommendations || [],
            origin: input.origin || "",
          });
          emailSent = emailResult.sent;

          // 이메일 발송 로그 기록
          await createAutoEmailLog({
            clientProjectId: input.clientProjectId,
            emailType: "analysis_report",
            recipientEmail: project.contactEmail,
            recipientName: project.contactName,
            subject: `[고감도] ${project.companyName} 업무환경 진단 분석 보고서`,
            status: emailSent ? "sent" : "failed",
            metadata: { reportId: report.id },
          });
        }
      } catch (e) {
        // 이메일 발송 실패해도 보고서 생성은 성공으로 처리
        console.error("분석 보고서 이메일 자동 발송 실패:", e);
      }

      await notifyOwner({
        title: "AI 분석 리포트 생성 완료",
        content: `프로젝트 #${input.clientProjectId}의 AI 분석 리포트가 생성되었습니다. (점수: ${analysisData.overallScore}/100, 이메일 발송: ${emailSent ? "성공" : "실패/미발송"})`,
      });
      
      return { reportId: report.id, analysis: analysisData, emailSent };
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
        type: "company_wide",
        templateId: input.templateId,
        clientProjectId: input.clientProjectId,
        token,
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName,
        status: "sent",
        expiresAt,
        customQuestions: input.customQuestions ? JSON.parse(input.customQuestions) : undefined,
      });
      
      if (!instance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      await createAutoEmailLog({
        clientProjectId: input.clientProjectId,
        emailType: "company_survey_link",
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName,
        subject: "[고감도] 전사 업무환경 설문 안내",
        status: "sent",
        metadata: { instanceId: instance.id, token },
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

  // ============ 전사 서베이 안내문 자동 생성 (AI) ============
  generateSurveyGuide: protectedProcedure
    .input(z.object({
      companyName: z.string(),
      contactName: z.string(),
      surveyUrl: z.string(),
      expiresDate: z.string(),
      surveyTitle: z.string().optional(),
      additionalContext: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const llmResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `당신은 기업 내부 커뮤니케이션 전문가입니다. 전사 업무환경 설문조사를 직원들에게 안내하는 메시지를 작성합니다.

다음 형식의 JSON을 반환하세요:
{
  "emailSubject": "이메일 제목",
  "emailBody": "이메일 본문 (HTML 없이 순수 텍스트, 줄바꿈은 \\n 사용)",
  "kakaoMessage": "카카오톡/메신저용 짧은 안내 메시지 (200자 이내)",
  "slackMessage": "슬랙/팀즈용 안내 메시지 (300자 이내)"
}

톤: 친근하면서도 전문적, 참여를 독려하되 강제하지 않는 느낌
핵심 포인트: 익명 보장, 소요 시간(3~5분), 실제 공간 개선에 반영됨, 마감일`,
          },
          {
            role: "user",
            content: `회사명: ${input.companyName}\n담당자: ${input.contactName}\n설문 제목: ${input.surveyTitle || "업무환경 설문조사"}\n설문 링크: ${input.surveyUrl}\n마감일: ${input.expiresDate}${input.additionalContext ? `\n추가 맥락: ${input.additionalContext}` : ""}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "survey_guide",
            strict: true,
            schema: {
              type: "object",
              properties: {
                emailSubject: { type: "string" },
                emailBody: { type: "string" },
                kakaoMessage: { type: "string" },
                slackMessage: { type: "string" },
              },
              required: ["emailSubject", "emailBody", "kakaoMessage", "slackMessage"],
              additionalProperties: false,
            },
          },
        },
      });

      const guideContent = llmResponse.choices[0].message.content;
      const guide = JSON.parse((typeof guideContent === "string" ? guideContent : "") || "{}");
      return guide;
    }),
});
