/**
 * 설계 자동화 시스템 (Design Automation Pipeline) tRPC Router
 * 도면 업로드 → RFP 수집 → AI 레이아웃 → 렌더링 → 투어 영상 → 제안서 → 견적서
 */
import { router } from "../_core/trpc";
import { protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { generateImage } from "../_core/imageGeneration";
import { storagePut } from "../storage";
import {
  createDesignProject, listDesignProjects, getDesignProject, updateDesignProject, deleteDesignProject,
  addFloorPlan, listFloorPlans, getFloorPlan, updateFloorPlan, deleteFloorPlan,
  createRfpData, getRfpData, updateRfpData,
  createLayoutOption, listLayoutOptions, updateLayoutOption, deleteLayoutOption,
  createRendering, listRenderings, updateRendering, deleteRendering,
  createTourVideo, listTourVideos, updateTourVideo,
  createProposal, listProposals, getProposal, updateProposal,
  createDetailedEstimate, listDetailedEstimates, getDetailedEstimate, updateDetailedEstimate,
  createCrmClient, createCrmDeal, createCrmActivity,
} from "../db";
import { notifyOwner } from "../_core/notification";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "master") {
    throw new TRPCError({ code: "FORBIDDEN", message: "관리자 권한이 필요합니다." });
  }
  return next({ ctx });
});

export const designAutomationRouter = router({
  // ===== Projects =====
  createProject: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      companyName: z.string().optional(),
      contactName: z.string().optional(),
      contactEmail: z.string().optional(),
      contactPhone: z.string().optional(),
      clientId: z.number().optional(),
      crmDealId: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = await createDesignProject(input);

      // === CRM 자동 연동: 설계자동화 프로젝트 생성 시 CRM 딜 자동 생성 ===
      try {
        let clientId = input.clientId;

        // 기존 CRM 클라이언트가 없으면 새로 생성
        if (!clientId && input.companyName) {
          clientId = await createCrmClient({
            companyName: input.companyName,
            contactName: input.contactName || "담당자 미정",
            email: input.contactEmail || undefined,
            phone: input.contactPhone || undefined,
            source: "website" as const,
            notes: `설계자동화 프로젝트(#${id})에서 자동 생성`,
          }) ?? undefined;
        }

        // CRM 딜 생성
        if (clientId) {
          const dealId = await createCrmDeal({
            clientId,
            title: `[설계자동화] ${input.name}`,
            stage: "consultation" as const,
            description: `설계자동화 시스템에서 자동 생성된 딜\n프로젝트: ${input.name}\n비고: ${input.notes || "없음"}`,
          });

          if (dealId) {
            await updateDesignProject(id, { crmDealId: dealId, clientId } as any);
            await createCrmActivity({
              clientId,
              dealId,
              type: "note" as const,
              title: "설계자동화 프로젝트 생성",
              description: `설계자동화 시스템에서 프로젝트 "${input.name}"이 생성되었습니다.`,
            });
          }

          await notifyOwner({
            title: "설계자동화 → CRM 자동 연동",
            content: `설계자동화 프로젝트 "${input.name}"이 생성되어 CRM 딜이 자동 등록되었습니다. (고객: ${input.companyName || "미지정"})`,
          });
        }
      } catch (crmError) {
        console.error("CRM 자동 연동 실패:", crmError);
      }

      return { id };
    }),

  listProjects: adminProcedure.query(async () => {
    return listDesignProjects();
  }),

  getProject: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const project = await getDesignProject(input.id);
      if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "프로젝트를 찾을 수 없습니다" });
      return project;
    }),

  updateProject: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      companyName: z.string().optional(),
      contactName: z.string().optional(),
      contactEmail: z.string().optional(),
      contactPhone: z.string().optional(),
      stage: z.enum(["floorplan", "rfp", "analysis", "layout", "rendering", "proposal", "estimate", "completed"]).optional(),
      status: z.enum(["active", "paused", "completed", "archived"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return updateDesignProject(id, data);
    }),

  deleteProject: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return deleteDesignProject(input.id);
    }),

  // ===== Floor Plans =====
  uploadFloorPlan: adminProcedure
    .input(z.object({
      projectId: z.number(),
      fileBase64: z.string(),
      fileName: z.string(),
      fileType: z.string(),
      fileSize: z.number(),
    }))
    .mutation(async ({ input }) => {
      // Decode base64 and upload to S3
      const buffer = Buffer.from(input.fileBase64, "base64");
      const randomSuffix = Math.random().toString(36).substring(2, 10);
      const fileKey = `design-automation/${input.projectId}/floorplans/${input.fileName}-${randomSuffix}`;
      const { url } = await storagePut(fileKey, buffer, input.fileType);

      const id = await addFloorPlan({
        projectId: input.projectId,
        fileUrl: url,
        fileKey: fileKey,
        fileName: input.fileName,
        fileType: input.fileType,
        fileSize: input.fileSize,
        analysisStatus: "pending",
      });

      return { id, url };
    }),

  listFloorPlans: adminProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return listFloorPlans(input.projectId);
    }),

  deleteFloorPlan: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return deleteFloorPlan(input.id);
    }),

  // AI 도면 분석
  analyzeFloorPlan: adminProcedure
    .input(z.object({ floorPlanId: z.number() }))
    .mutation(async ({ input }) => {
      const plan = await getFloorPlan(input.floorPlanId);
      if (!plan) throw new TRPCError({ code: "NOT_FOUND" });

      await updateFloorPlan(input.floorPlanId, { analysisStatus: "analyzing" });

      try {
        // PDF 파일은 file_url 타입으로, 이미지 파일은 image_url 타입으로 전달
        const isPdf = plan.fileType?.includes("pdf") || plan.fileName?.toLowerCase().endsWith(".pdf");
        const fileContent = isPdf
          ? { type: "file_url" as const, file_url: { url: plan.fileUrl, mime_type: "application/pdf" as const } }
          : { type: "image_url" as const, image_url: { url: plan.fileUrl, detail: "high" as const } };

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `당신은 건축/인테리어 도면 분석 전문가입니다. 업로드된 도면 이미지 또는 PDF를 분석하여 공간 구조를 파악합니다.
PDF 파일인 경우에도 내용을 최대한 분석하여 공간 구조를 파악하세요.
결과를 JSON으로 반환하세요. 도면이 명확하지 않더라도 최선을 다해 분석하세요.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text" as const,
                  text: `이 도면을 분석해주세요. 파일명: ${plan.fileName}. 파일 형식: ${isPdf ? 'PDF' : '이미지'}. 다음 정보를 추출해주세요:
1. 총 면적 (추정)
2. 층수
3. 방/공간 개수
4. 벽체, 기둥, 창문, 문 위치
5. 공간 구조 설명
6. 특이사항`,
                },
                fileContent,
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "floor_plan_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  estimatedArea: { type: "string", description: "추정 총 면적 (㎡)" },
                  floors: { type: "number", description: "층수" },
                  roomCount: { type: "number", description: "방/공간 개수" },
                  spaces: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        estimatedArea: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["name", "estimatedArea", "description"],
                      additionalProperties: false,
                    },
                  },
                  structuralElements: {
                    type: "object",
                    properties: {
                      walls: { type: "number" },
                      columns: { type: "number" },
                      windows: { type: "number" },
                      doors: { type: "number" },
                    },
                    required: ["walls", "columns", "windows", "doors"],
                    additionalProperties: false,
                  },
                  description: { type: "string", description: "전체 공간 구조 설명" },
                  notes: { type: "string", description: "특이사항" },
                },
                required: ["estimatedArea", "floors", "roomCount", "spaces", "structuralElements", "description", "notes"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices?.[0]?.message?.content as string;
        const parsed = JSON.parse(content);

        await updateFloorPlan(input.floorPlanId, {
          aiAnalysis: parsed,
          totalArea: parsed.estimatedArea,
          floors: parsed.floors,
          roomCount: parsed.roomCount,
          analysisStatus: "done",
        });

        return parsed;
      } catch (error: any) {
        await updateFloorPlan(input.floorPlanId, {
          analysisStatus: "error",
          analysisError: error.message || "분석 중 오류가 발생했습니다",
        });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "도면 분석 중 오류가 발생했습니다" });
      }
    }),

  // ===== RFP Data =====
  saveRfp: adminProcedure
    .input(z.object({
      projectId: z.number(),
      collectionMethod: z.enum(["form", "ai_generator", "chatbot"]).optional(),
      companyName: z.string().optional(),
      industry: z.string().optional(),
      foundedYear: z.number().optional(),
      projectType: z.enum(["new_office", "relocation", "renovation", "expansion"]).optional(),
      currentAddress: z.string().optional(),
      newAddress: z.string().optional(),
      totalArea: z.string().optional(),
      currentHeadcount: z.number().optional(),
      plannedHeadcount1y: z.number().optional(),
      plannedHeadcount3y: z.number().optional(),
      departments: z.array(z.object({
        name: z.string(),
        headcount: z.number(),
        characteristics: z.string().optional(),
      })).optional(),
      spaceRequirements: z.any().optional(),
      preferredStyle: z.string().optional(),
      brandColors: z.array(z.string()).optional(),
      brandGuidelineUrl: z.string().optional(),
      referenceImages: z.array(z.string()).optional(),
      referenceUrls: z.array(z.string()).optional(),
      preferredMaterials: z.array(z.string()).optional(),
      lightingPreference: z.string().optional(),
      avItRequirements: z.string().optional(),
      networkInfra: z.string().optional(),
      securitySystem: z.string().optional(),
      acousticPrivacy: z.string().optional(),
      hvacRequirements: z.string().optional(),
      esgRequirements: z.string().optional(),
      budgetRange: z.string().optional(),
      budgetInclDesign: z.enum(["yes", "no", "separate"]).optional(),
      priorityOrder: z.string().optional(),
      desiredStartDate: z.date().optional(),
      desiredEndDate: z.date().optional(),
      occupiedDuringWork: z.enum(["yes", "no", "partial"]).optional(),
      buildingRestrictions: z.string().optional(),
      reuseExistingFurniture: z.enum(["yes", "no", "partial"]).optional(),
      specialRequests: z.string().optional(),
      competitorBenchmarks: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const existing = await getRfpData(input.projectId);
      if (existing) {
        const { projectId, ...data } = input;
        await updateRfpData(existing.id, data);
        return { id: existing.id, updated: true };
      } else {
        const id = await createRfpData(input);
        return { id, updated: false };
      }
    }),

  getRfp: adminProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return getRfpData(input.projectId);
    }),

  // AI RFP 생성기 (대화형)
  generateRfpFromChat: adminProcedure
    .input(z.object({
      projectId: z.number(),
      messages: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `당신은 오피스 인테리어 프로젝트의 RFP(제안요청서)를 작성하기 위한 전문 컨설턴트입니다.
고객과의 대화를 통해 필요한 정보를 수집합니다.

수집해야 할 핵심 정보:
1. 기본 정보: 회사명, 업종, 프로젝트 유형(신규/이전/리모델링)
2. 공간 요구사항: 면적, 인원수, 부서 구성, 필요 공간 유형
3. 디자인 선호도: 스타일, 브랜드 컬러, 참고 이미지
4. 기능 요구사항: IT/AV, 보안, 음향 등
5. 예산 및 일정: 예산 범위, 착공/완공 희망일
6. 기타: 건물 제약, 기존 가구 재활용 등

아직 수집하지 못한 정보가 있으면 자연스럽게 질문하세요.
충분한 정보가 수집되면 "RFP_COMPLETE" 태그와 함께 JSON 형태의 RFP 데이터를 반환하세요.
한국어로 대화하세요.`,
          },
          ...input.messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        ],
      });

      const content = response.choices?.[0]?.message?.content as string;

      // RFP가 완성되었는지 확인
      if (content.includes("RFP_COMPLETE")) {
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const rfpJson = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            await createRfpData({
              projectId: input.projectId,
              collectionMethod: "ai_generator",
              ...rfpJson,
            });
            return { message: content.replace(/RFP_COMPLETE[\s\S]*$/, "").trim(), rfpCompleted: true, rfpData: rfpJson };
          } catch {
            return { message: content, rfpCompleted: false };
          }
        }
      }

      return { message: content, rfpCompleted: false };
    }),

  // ===== AI Layout Generation =====
  generateLayouts: adminProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input }) => {
      const project = await getDesignProject(input.projectId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const rfp = await getRfpData(input.projectId);
      const floorPlansList = await listFloorPlans(input.projectId);

      // Build context from RFP and floor plan analysis
      let context = `프로젝트: ${project.name}\n회사: ${project.companyName || "미정"}\n`;
      if (rfp) {
        context += `업종: ${rfp.industry || "미정"}\n`;
        context += `총 면적: ${rfp.totalArea || "미정"}\n`;
        context += `현재 인원: ${rfp.currentHeadcount || "미정"}명\n`;
        context += `선호 스타일: ${rfp.preferredStyle || "미정"}\n`;
        context += `예산: ${rfp.budgetRange || "미정"}\n`;
        if (rfp.departments) context += `부서: ${JSON.stringify(rfp.departments)}\n`;
        if (rfp.spaceRequirements) context += `공간 요구사항: ${JSON.stringify(rfp.spaceRequirements)}\n`;
      }
      if (floorPlansList.length > 0 && floorPlansList[0].aiAnalysis) {
        context += `도면 분석: ${JSON.stringify(floorPlansList[0].aiAnalysis)}\n`;
      }

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `당신은 오피스 인테리어 공간 설계 전문가입니다. 주어진 정보를 바탕으로 최적의 공간 레이아웃을 3가지 옵션으로 제안합니다.
각 옵션은 서로 다른 컨셉으로 차별화되어야 합니다.
결과를 JSON으로 반환하세요.`,
          },
          {
            role: "user",
            content: `다음 정보를 바탕으로 3가지 레이아웃 옵션을 제안해주세요:\n\n${context}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "layout_options",
            strict: true,
            schema: {
              type: "object",
              properties: {
                options: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "옵션명 (예: Option A - 협업 중심)" },
                      concept: { type: "string", description: "설계 컨셉 설명 (3-5문장)" },
                      spaceAllocation: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            zone: { type: "string" },
                            area: { type: "string" },
                            percentage: { type: "number" },
                            description: { type: "string" },
                          },
                          required: ["zone", "area", "percentage", "description"],
                          additionalProperties: false,
                        },
                      },
                      pros: { type: "array", items: { type: "string" } },
                      cons: { type: "array", items: { type: "string" } },
                      score: { type: "number", description: "추천 점수 (1-100)" },
                    },
                    required: ["name", "concept", "spaceAllocation", "pros", "cons", "score"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["options"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices?.[0]?.message?.content as string;
      const parsed = JSON.parse(content);

      // Save each layout option
      const savedIds: number[] = [];
      for (const opt of parsed.options) {
        const id = await createLayoutOption({
          projectId: input.projectId,
          optionName: opt.name,
          concept: opt.concept,
          spaceAllocation: opt.spaceAllocation,
          pros: opt.pros,
          cons: opt.cons,
          aiScore: opt.score,
        });
        if (id) savedIds.push(id);
      }

      // Update project stage
      await updateDesignProject(input.projectId, { stage: "layout" });

      return { options: parsed.options, savedIds };
    }),

  listLayouts: adminProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return listLayoutOptions(input.projectId);
    }),

  selectLayout: adminProcedure
    .input(z.object({ layoutId: z.number(), projectId: z.number() }))
    .mutation(async ({ input }) => {
      // Deselect all other layouts for this project
      const allLayouts = await listLayoutOptions(input.projectId);
      for (const layout of allLayouts) {
        await updateLayoutOption(layout.id, { isSelected: "no" });
      }
      await updateLayoutOption(input.layoutId, { isSelected: "yes" });
      return { success: true };
    }),

  deleteLayout: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return deleteLayoutOption(input.id);
    }),

  // ===== AI Rendering =====
  generateRendering: adminProcedure
    .input(z.object({
      projectId: z.number(),
      layoutId: z.number().optional(),
      spaceType: z.string(),
      spaceName: z.string().optional(),
      style: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const project = await getDesignProject(input.projectId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const rfp = await getRfpData(input.projectId);
      const style = input.style || rfp?.preferredStyle || "모던";
      const brandColors = rfp?.brandColors?.join(", ") || "";
      const materials = rfp?.preferredMaterials?.join(", ") || "";

      const renderingId = await createRendering({
        projectId: input.projectId,
        layoutId: input.layoutId ?? null,
        spaceType: input.spaceType,
        spaceName: input.spaceName ?? input.spaceType,
        style,
        status: "generating",
      });

      try {
        const prompt = `Photorealistic interior rendering of a ${input.spaceType} in a modern Korean office.
Style: ${style}. ${brandColors ? `Brand colors: ${brandColors}.` : ""} ${materials ? `Materials: ${materials}.` : ""}
Company: ${project.companyName || "Korean tech company"}.
High-end professional office interior, natural lighting, 8K quality, architectural photography style.
Space: ${input.spaceName || input.spaceType}.`;

        const { url: imageUrl } = await generateImage({ prompt });

        await updateRendering(renderingId!, {
          imageUrl,
          prompt,
          status: "done",
        });

        return { id: renderingId, imageUrl };
      } catch (error: any) {
        await updateRendering(renderingId!, {
          status: "error",
          error: error.message,
        });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "렌더링 생성 중 오류가 발생했습니다" });
      }
    }),

  listRenderings: adminProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return listRenderings(input.projectId);
    }),

  deleteRendering: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return deleteRendering(input.id);
    }),

  // ===== Tour Video Generation =====
  generateTourVideo: adminProcedure
    .input(z.object({
      projectId: z.number(),
      title: z.string().optional(),
      renderingIds: z.array(z.number()).min(1),
      style: z.enum(["walkthrough", "cinematic", "presentation"]).default("walkthrough"),
    }))
    .mutation(async ({ input }) => {
      const project = await getDesignProject(input.projectId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const renderingsList = await listRenderings(input.projectId);
      const selectedRenderings = renderingsList.filter(r => input.renderingIds.includes(r.id) && r.status === "done" && r.imageUrl);

      if (selectedRenderings.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "\uc644\ub8cc\ub41c \ub80c\ub354\ub9c1 \uc774\ubbf8\uc9c0\uac00 \ud544\uc694\ud569\ub2c8\ub2e4" });
      }

      const tourId = await createTourVideo({
        projectId: input.projectId,
        title: input.title || `${project.name} \uac00\uc0c1 \ud22c\uc5b4`,
        renderingIds: input.renderingIds,
        status: "generating",
      });

      try {
        // AI\ub85c \uac01 \ub80c\ub354\ub9c1 \uc774\ubbf8\uc9c0\uc5d0 \ub300\ud55c \ub0b4\ub808\uc774\uc158 \uc2a4\ud06c\ub9bd\ud2b8 \uc0dd\uc131
        const rfp = await getRfpData(input.projectId);
        const narrationResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `\ub2f9\uc2e0\uc740 (\uc8fc)\uace0\uac10\ub3c4\uc758 \uc778\ud14c\ub9ac\uc5b4 \ud22c\uc5b4 \ub0b4\ub808\uc774\uc158 \uc791\uac00\uc785\ub2c8\ub2e4.
\uac01 \uacf5\uac04\uc5d0 \ub300\ud55c \uc804\ubb38\uc801\uc774\uba74\uc11c \uce5c\uadfc\ud55c \ub0b4\ub808\uc774\uc158\uc744 \uc791\uc131\ud558\uc138\uc694.
\uac01 \uc2ac\ub77c\uc774\ub4dc\ub294 15-20\ucd08 \ubd84\ub7c9\uc73c\ub85c \uc791\uc131\ud558\uc138\uc694.`,
            },
            {
              role: "user",
              content: `\ub2e4\uc74c \uacf5\uac04\ub4e4\uc5d0 \ub300\ud55c \ud22c\uc5b4 \ub0b4\ub808\uc774\uc158\uc744 \uc791\uc131\ud574\uc8fc\uc138\uc694:\n${selectedRenderings.map((r, i) => `${i + 1}. ${r.spaceName || r.spaceType} (\uc2a4\ud0c0\uc77c: ${r.style || "\ubaa8\ub358"})`).join("\n")}\n\n\uace0\uac1d\uc0ac: ${project.companyName || "\ubbf8\uc815"}\n\uc2a4\ud0c0\uc77c: ${rfp?.preferredStyle || "\ubaa8\ub358"}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "tour_narration",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  intro: { type: "string", description: "\ud22c\uc5b4 \uc2dc\uc791 \uc778\uc0ac\ub9d0 (5\ucd08)" },
                  slides: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        spaceName: { type: "string" },
                        narration: { type: "string", description: "15-20\ucd08 \ubd84\ub7c9 \ub0b4\ub808\uc774\uc158" },
                        highlights: { type: "array", items: { type: "string" }, description: "\uc8fc\uc694 \ud3ec\uc778\ud2b8 2-3\uac1c" },
                      },
                      required: ["spaceName", "narration", "highlights"],
                      additionalProperties: false,
                    },
                  },
                  outro: { type: "string", description: "\ub9c8\ubb34\ub9ac \uba58\ud2b8 (5\ucd08)" },
                },
                required: ["intro", "slides", "outro"],
                additionalProperties: false,
              },
            },
          },
        });

        const narrationContent = narrationResponse.choices?.[0]?.message?.content as string;
        const narration = JSON.parse(narrationContent);

        // \ud22c\uc5b4 \ub370\uc774\ud130 \uc800\uc7a5 (\ub80c\ub354\ub9c1 \uc774\ubbf8\uc9c0 + \ub0b4\ub808\uc774\uc158 \uc2a4\ud06c\ub9bd\ud2b8)
        const tourData = {
          narration,
          renderings: selectedRenderings.map(r => ({
            id: r.id,
            spaceName: r.spaceName || r.spaceType,
            imageUrl: r.imageUrl,
            style: r.style,
          })),
          style: input.style,
          estimatedDuration: selectedRenderings.length * 18 + 10, // 18\ucd08/\uc2ac\ub77c\uc774\ub4dc + 10\ucd08 \uc778\ud2b8\ub85c/\uc544\uc6c3\ud2b8\ub85c
        };

        await updateTourVideo(tourId!, {
          status: "done",
          duration: tourData.estimatedDuration,
          thumbnailUrl: selectedRenderings[0]?.imageUrl || null,
        });

        return { id: tourId, tourData };
      } catch (error: any) {
        await updateTourVideo(tourId!, {
          status: "error",
          error: error.message,
        });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "\ud22c\uc5b4 \uc601\uc0c1 \uc0dd\uc131 \uc911 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4" });
      }
    }),

  listTourVideos: adminProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return listTourVideos(input.projectId);
    }),

  // ===== AI Proposal Generation =====
  generateProposal: adminProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input }) => {
      const project = await getDesignProject(input.projectId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const rfp = await getRfpData(input.projectId);
      const layouts = await listLayoutOptions(input.projectId);
      const renderingsList = await listRenderings(input.projectId);
      const selectedLayout = layouts.find(l => l.isSelected === "yes") || layouts[0];

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `당신은 (주)고감도의 인테리어 제안서 작성 전문가입니다.
고감도는 1991년 창업 이래 35년간 대한민국 면적만큼의 인테리어를 시공해 온 여성기업 인증 기업입니다.
연간 80건 이상의 프로젝트를 수행하며, 데이터 기반 설계를 통해 차별화된 공간 솔루션을 제공합니다.

제안서는 다음 구성으로 작성하세요:
1. 고객사 분석 (업종, 규모, 문화, 니즈)
2. 설계 컨셉 (선택된 레이아웃 기반)
3. 공간 프로그램 (공간별 면적 배분)
4. 마감재 계획
5. 가구 계획
6. 프로젝트 타임라인
7. 고감도 소개 및 차별점

구매를 일으키는 설득력 있는 제안서를 작성하세요. 고객의 pain point를 정확히 짚고, 고감도만의 해결책을 제시하세요.
결과를 JSON으로 반환하세요.`,
          },
          {
            role: "user",
            content: `다음 정보를 바탕으로 제안서를 작성해주세요:

프로젝트: ${project.name}
회사: ${project.companyName || "미정"}
${rfp ? `업종: ${rfp.industry || "미정"}
면적: ${rfp.totalArea || "미정"}
인원: ${rfp.currentHeadcount || "미정"}명
스타일: ${rfp.preferredStyle || "미정"}
예산: ${rfp.budgetRange || "미정"}
프로젝트 유형: ${rfp.projectType || "미정"}
부서: ${rfp.departments ? JSON.stringify(rfp.departments) : "미정"}
공간 요구사항: ${rfp.spaceRequirements ? JSON.stringify(rfp.spaceRequirements) : "미정"}
특별 요청: ${rfp.specialRequests || "없음"}` : "RFP 데이터 없음"}

선택된 레이아웃: ${selectedLayout ? `${selectedLayout.optionName} - ${selectedLayout.concept}` : "없음"}
렌더링 ${renderingsList.length}건 생성됨`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "proposal",
            strict: true,
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                clientAnalysis: {
                  type: "object",
                  properties: {
                    industry: { type: "string" },
                    companyProfile: { type: "string" },
                    needs: { type: "array", items: { type: "string" } },
                    painPoints: { type: "array", items: { type: "string" } },
                    opportunities: { type: "array", items: { type: "string" } },
                  },
                  required: ["industry", "companyProfile", "needs", "painPoints", "opportunities"],
                  additionalProperties: false,
                },
                designConcept: { type: "string" },
                spaceProgram: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      zone: { type: "string" },
                      area: { type: "string" },
                      description: { type: "string" },
                    },
                    required: ["zone", "area", "description"],
                    additionalProperties: false,
                  },
                },
                materialPlan: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      area: { type: "string" },
                      material: { type: "string" },
                      reason: { type: "string" },
                    },
                    required: ["area", "material", "reason"],
                    additionalProperties: false,
                  },
                },
                furniturePlan: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      item: { type: "string" },
                      quantity: { type: "string" },
                      specification: { type: "string" },
                    },
                    required: ["item", "quantity", "specification"],
                    additionalProperties: false,
                  },
                },
                timeline: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      phase: { type: "string" },
                      duration: { type: "string" },
                      description: { type: "string" },
                    },
                    required: ["phase", "duration", "description"],
                    additionalProperties: false,
                  },
                },
                companyIntro: { type: "string" },
                differentiators: { type: "array", items: { type: "string" } },
              },
              required: ["title", "clientAnalysis", "designConcept", "spaceProgram", "materialPlan", "furniturePlan", "timeline", "companyIntro", "differentiators"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices?.[0]?.message?.content as string;
      const parsed = JSON.parse(content);

      const proposalId = await createProposal({
        projectId: input.projectId,
        title: parsed.title,
        clientAnalysis: parsed.clientAnalysis,
        designConcept: parsed.designConcept,
        spaceProgram: parsed.spaceProgram,
        materialPlan: parsed.materialPlan,
        furniturePlan: parsed.furniturePlan,
        projectTimeline: parsed.timeline,
        companyIntro: parsed.companyIntro,
        differentiators: parsed.differentiators,
        status: "draft",
      });

      await updateDesignProject(input.projectId, { stage: "proposal" });

      return { id: proposalId, proposal: parsed };
    }),

  listProposals: adminProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return listProposals(input.projectId);
    }),

  getProposal: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const proposal = await getProposal(input.id);
      if (!proposal) throw new TRPCError({ code: "NOT_FOUND" });
      return proposal;
    }),

  // ===== AI Estimate Generation =====
  generateEstimate: adminProcedure
    .input(z.object({ projectId: z.number(), proposalId: z.number().optional() }))
    .mutation(async ({ input }) => {
      const project = await getDesignProject(input.projectId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const rfp = await getRfpData(input.projectId);
      const proposal = input.proposalId ? await getProposal(input.proposalId) : null;
      const layouts = await listLayoutOptions(input.projectId);
      const selectedLayout = layouts.find(l => l.isSelected === "yes") || layouts[0];

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `당신은 (주)고감도의 인테리어 견적 전문가입니다.
고감도는 35년 경력의 인테리어 전문 기업으로, 정확하고 투명한 견적을 제공합니다.

다음 공종별로 상세 견적을 산출하세요:
1. 철거 공사
2. 경량 칸막이 공사
3. 목공사
4. 도장 공사
5. 바닥재 공사
6. 천장 공사
7. 타일 공사
8. 유리/창호 공사
9. 전기 공사
10. 설비 공사 (소방/기계)
11. 가구 공사
12. 네트워크/IT 공사
13. 사인물/그래픽 공사
14. 기타 공사

각 항목에 대해 세부 항목, 규격, 단위, 수량, 단가, 금액을 산출하세요.
한국 인테리어 시장 기준 현실적인 단가를 적용하세요.
결과를 JSON으로 반환하세요.`,
          },
          {
            role: "user",
            content: `다음 정보를 바탕으로 상세 견적서를 작성해주세요:

프로젝트: ${project.name}
면적: ${rfp?.totalArea || "100㎡"}
스타일: ${rfp?.preferredStyle || "모던"}
예산 범위: ${rfp?.budgetRange || "미정"}
${selectedLayout ? `레이아웃: ${selectedLayout.optionName}\n공간 배분: ${JSON.stringify(selectedLayout.spaceAllocation)}` : ""}
${proposal ? `제안서 마감재: ${JSON.stringify(proposal.materialPlan)}\n가구 계획: ${JSON.stringify(proposal.furniturePlan)}` : ""}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "detailed_estimate",
            strict: true,
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string" },
                      subcategory: { type: "string" },
                      item: { type: "string" },
                      specification: { type: "string" },
                      unit: { type: "string" },
                      quantity: { type: "number" },
                      unitPrice: { type: "number" },
                      amount: { type: "number" },
                      remarks: { type: "string" },
                    },
                    required: ["category", "subcategory", "item", "specification", "unit", "quantity", "unitPrice", "amount", "remarks"],
                    additionalProperties: false,
                  },
                },
                subtotal: { type: "number" },
                vat: { type: "number" },
                totalAmount: { type: "number" },
                optionItems: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      amount: { type: "number" },
                    },
                    required: ["name", "description", "amount"],
                    additionalProperties: false,
                  },
                },
                notes: { type: "string" },
              },
              required: ["title", "items", "subtotal", "vat", "totalAmount", "optionItems", "notes"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices?.[0]?.message?.content as string;
      const parsed = JSON.parse(content);

      const estimateId = await createDetailedEstimate({
        projectId: input.projectId,
        proposalId: input.proposalId ?? null,
        title: parsed.title,
        items: parsed.items,
        subtotal: parsed.subtotal,
        vat: parsed.vat,
        totalAmount: parsed.totalAmount,
        optionItems: parsed.optionItems,
        notes: parsed.notes,
        status: "draft",
      });

      await updateDesignProject(input.projectId, { stage: "estimate" });

      return { id: estimateId, estimate: parsed };
    }),

  listEstimates: adminProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return listDetailedEstimates(input.projectId);
    }),

  getEstimate: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const estimate = await getDetailedEstimate(input.id);
      if (!estimate) throw new TRPCError({ code: "NOT_FOUND" });
      return estimate;
    }),

  // ===== Pipeline Summary =====
  getProjectSummary: adminProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const project = await getDesignProject(input.projectId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const floorPlansList = await listFloorPlans(input.projectId);
      const rfp = await getRfpData(input.projectId);
      const layouts = await listLayoutOptions(input.projectId);
      const renderingsList = await listRenderings(input.projectId);
      const tourVideosList = await listTourVideos(input.projectId);
      const proposalsList = await listProposals(input.projectId);
      const estimatesList = await listDetailedEstimates(input.projectId);

      return {
        project,
        floorPlans: floorPlansList,
        rfp,
        layouts,
        renderings: renderingsList,
        tourVideos: tourVideosList,
        proposals: proposalsList,
        estimates: estimatesList,
        progress: {
          floorplan: floorPlansList.length > 0,
          rfp: !!rfp,
          layout: layouts.length > 0,
          rendering: renderingsList.some(r => r.status === "done"),
          proposal: proposalsList.length > 0,
          estimate: estimatesList.length > 0,
        },
      };
    }),
});
