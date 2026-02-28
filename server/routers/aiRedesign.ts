import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createAiRedesign, getAiRedesign, updateAiRedesign, listAiRedesigns,
  findCrmClientByEmail, createCrmClient, createCrmDeal, createCrmActivity,
  createNotification,
} from "../db";
import { storagePut } from "../storage";
import { generateImage } from "../_core/imageGeneration";
import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";

/**
 * AI 리디자인 요청 → CRM 리드 자동 등록 헬퍼
 * 고객 이메일이 있으면 CRM에 고객 + 딜 + 활동을 자동 생성
 */
async function linkToCrm(opts: {
  redesignId: number;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  spaceType?: string | null;
  prompt: string;
  originalImageUrl: string;
  resultImageUrl?: string | null;
}) {
  // 이메일이 없어도 익명 리드로 CRM에 기록
  const contactName = opts.customerName || "AI 리디자인 고객";
  const contactEmail = opts.customerEmail || undefined;

  try {
    let clientId: number | null = null;

    // 1. 이메일이 있으면 기존 고객 검색, 없으면 새로 생성
    if (contactEmail) {
      const existing = await findCrmClientByEmail(contactEmail);
      if (existing) {
        clientId = existing.id;
      } else {
        clientId = await createCrmClient({
          companyName: `${contactName} (AI 리디자인)`,
          contactName,
          email: contactEmail,
          phone: opts.customerPhone || undefined,
          source: "website",
          notes: `AI 공간 리디자인을 통해 자동 생성됨.\n공간 유형: ${opts.spaceType || "미지정"}\n요청 내용: ${opts.prompt.slice(0, 200)}`,
          tags: ["ai-redesign"],
        });
      }
    } else {
      // 이메일 없는 익명 요청도 CRM에 기록 (추후 연락처 확보 시 병합 가능)
      clientId = await createCrmClient({
        companyName: `익명 고객 #${opts.redesignId}`,
        contactName: contactName,
        phone: opts.customerPhone || undefined,
        source: "website",
        notes: `AI 공간 리디자인 익명 요청.\n공간 유형: ${opts.spaceType || "미지정"}\n요청 내용: ${opts.prompt.slice(0, 200)}`,
        tags: ["ai-redesign", "anonymous"],
      });
    }

    if (!clientId) return;

    // 2. 딜(영업 기회) 자동 생성 — stage: lead
    const spaceLabel = opts.spaceType || "사무공간";
    const dealTitle = `[AI리디자인] ${contactName} - ${spaceLabel} 리디자인 요청`;
    const dealId = await createCrmDeal({
      clientId,
      title: dealTitle,
      stage: "lead",
      spaceType: mapSpaceType(opts.spaceType),
      description: `AI 공간 리디자인 요청을 통해 자동 생성된 리드입니다.\n\n요청 내용: ${opts.prompt}\n\n원본 이미지: ${opts.originalImageUrl}\n결과 이미지: ${opts.resultImageUrl || "(생성 중)"}`,
      tags: ["ai-redesign"],
    });

    // 3. 활동 로그 기록
    await createCrmActivity({
      dealId: dealId || undefined,
      clientId,
      type: "note",
      title: "AI 공간 리디자인 요청",
      description: `고객이 AI 공간 리디자인 기능을 사용했습니다.\n\n공간 유형: ${spaceLabel}\n요청 내용: ${opts.prompt}\n원본 이미지: ${opts.originalImageUrl}\n결과 이미지: ${opts.resultImageUrl || "(생성 중)"}`,
      createdBy: "system",
    });

    // 4. 알림 센터에 기록
    await createNotification({
      type: "inquiry",
      title: `AI 리디자인 리드: ${contactName}`,
      message: `${spaceLabel} 리디자인 요청 | ${contactEmail || "이메일 미제공"} | ${opts.customerPhone || "연락처 미제공"}`,
      linkUrl: "/admin/crm",
    });

    // 5. 관리자에게 푸시 알림
    await notifyOwner({
      title: `🎨 새 AI 리디자인 리드: ${contactName}`,
      content: `이름: ${contactName}\n이메일: ${contactEmail || "미제공"}\n전화: ${opts.customerPhone || "미제공"}\n공간: ${spaceLabel}\n\n요청 내용:\n${opts.prompt}\n\n[CRM] 고객 및 딜이 자동 생성되었습니다. 관리자 페이지에서 확인하세요.`,
    });

    return { clientId, dealId };
  } catch (crmError) {
    // CRM 연동 실패해도 리디자인 기능은 정상 작동
    console.error("[CRM Auto-Link] AI Redesign → CRM failed:", crmError);
    return null;
  }
}

/** 공간 유형 문자열을 CRM spaceType enum으로 매핑 */
function mapSpaceType(spaceType?: string | null): "office" | "commercial" | "medical" | "education" | "residential" | "other" | undefined {
  if (!spaceType) return "office"; // 기본값: 사무공간
  const map: Record<string, "office" | "commercial" | "medical" | "education" | "residential" | "other"> = {
    "사무실": "office",
    "오피스": "office",
    "회의실": "office",
    "임원실": "office",
    "라운지": "commercial",
    "리셉션": "commercial",
    "카페테리아": "commercial",
    "상업공간": "commercial",
    "병원": "medical",
    "학교": "education",
    "주거": "residential",
  };
  return map[spaceType] || "office";
}

export const aiRedesignRouter = router({
  /**
   * 사진 업로드 + AI 리디자인 요청
   * 고객이 사진(base64)과 설명 텍스트를 보내면 AI가 공간을 리디자인
   * → 완료 후 CRM에 자동으로 리드 등록
   */
  create: publicProcedure
    .input(z.object({
      imageBase64: z.string().min(1, "이미지가 필요합니다"),
      imageMimeType: z.string().default("image/jpeg"),
      prompt: z.string().min(1, "변경 사항을 설명해 주세요"),
      spaceType: z.string().optional(),
      customerName: z.string().optional(),
      customerEmail: z.string().optional(),
      customerPhone: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. 원본 이미지를 S3에 업로드
      const timestamp = Date.now();
      const ext = input.imageMimeType.includes("png") ? "png" : "jpg";
      const originalKey = `ai-redesign/original/${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const originalBuffer = Buffer.from(input.imageBase64, "base64");
      
      const { url: originalImageUrl } = await storagePut(
        originalKey,
        originalBuffer,
        input.imageMimeType
      );

      // 2. DB에 요청 기록 생성
      const userIp = ctx.req?.headers?.["x-forwarded-for"]?.toString()?.split(",")[0]?.trim() 
        || ctx.req?.socket?.remoteAddress || "unknown";
      
      const recordId = await createAiRedesign({
        originalImageUrl,
        prompt: input.prompt,
        status: "processing",
        spaceType: input.spaceType ?? null,
        customerName: input.customerName ?? null,
        customerEmail: input.customerEmail ?? null,
        customerPhone: input.customerPhone ?? null,
        userIp,
      });

      if (!recordId) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "요청 생성에 실패했습니다" });
      }

      try {
        // 3. LLM으로 프롬프트 보강
        const spaceLabel = input.spaceType || "사무공간";
        const enhancedPromptResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an expert interior designer specializing in TARGETED, PARTIAL modifications of office and commercial spaces.

CRITICAL RULES:
1. You MUST preserve the ENTIRE existing space exactly as-is — walls, floors, ceiling, windows, doors, ALL existing furniture, lighting, and decorations.
2. You MUST ONLY modify the SPECIFIC element(s) the user mentions. Nothing else changes.
3. If the user says "change the light fixture", ONLY the light fixture changes. Everything else in the room stays IDENTICAL.
4. If the user says "change the desk", ONLY the desk changes. All other furniture, walls, floors, lighting remain EXACTLY the same.
5. The output prompt MUST explicitly state: "Keep everything else in the room exactly the same. Only modify [specific element]."
6. NEVER use words like "transform", "redesign the space", "reimagine", or "overhaul". Use "replace", "swap", "change only".

Your task: Convert the user's request into a precise, targeted image editing prompt in English.
The prompt must clearly identify WHAT to change and emphasize that EVERYTHING ELSE stays identical.
Output ONLY the enhanced prompt. Max 150 words.`
            },
            {
              role: "user",
              content: `Space type: ${spaceLabel}\nUser request: ${input.prompt}\n\nCreate a TARGETED modification prompt that changes ONLY the specific element(s) mentioned above. Everything else in the ${spaceLabel} must remain exactly the same. Do NOT redesign the entire space.`
            }
          ]
        });

        const enhancedPrompt = enhancedPromptResponse.choices?.[0]?.message?.content 
          || `In this ${spaceLabel} photo, make ONLY this specific change: ${input.prompt}. Keep everything else in the room exactly the same - same walls, floors, ceiling, other furniture, and overall layout. Only modify the specific element mentioned. Photorealistic result.`;

        // 4. AI 이미지 생성 (원본 이미지 기반 편집)
        const { url: resultImageUrl } = await generateImage({
          prompt: enhancedPrompt,
          originalImages: [{
            url: originalImageUrl,
            mimeType: input.imageMimeType,
          }],
        });

        // 5. DB 업데이트 (성공)
        await updateAiRedesign(recordId, {
          resultImageUrl: resultImageUrl ?? null,
          status: "completed",
        });

        // 6. CRM 자동 리드 등록 (비동기 — 실패해도 리디자인 결과에 영향 없음)
        linkToCrm({
          redesignId: recordId,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          spaceType: input.spaceType,
          prompt: input.prompt,
          originalImageUrl,
          resultImageUrl,
        }).catch(err => console.error("[CRM Link] Background error:", err));

        return {
          id: recordId,
          originalImageUrl,
          resultImageUrl,
          status: "completed" as const,
        };
      } catch (error: any) {
        // 실패 시에도 CRM에 리드 등록 (관심 고객이므로)
        linkToCrm({
          redesignId: recordId,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          spaceType: input.spaceType,
          prompt: input.prompt,
          originalImageUrl,
          resultImageUrl: null,
        }).catch(err => console.error("[CRM Link] Background error:", err));

        // 실패 시 DB 업데이트
        await updateAiRedesign(recordId, {
          status: "failed",
          errorMessage: error?.message || "AI 이미지 생성에 실패했습니다",
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "AI 이미지 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        });
      }
    }),

  /**
   * 리디자인 결과 조회
   */
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const record = await getAiRedesign(input.id);
      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND", message: "결과를 찾을 수 없습니다" });
      }
      return record;
    }),

  /**
   * 관리자: 전체 리디자인 이력 조회
   */
  list: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return listAiRedesigns(input?.limit ?? 50);
    }),
});
