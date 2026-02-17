import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createAiRedesign, getAiRedesign, updateAiRedesign, listAiRedesigns } from "../db";
import { storagePut } from "../storage";
import { generateImage } from "../_core/imageGeneration";
import { invokeLLM } from "../_core/llm";

export const aiRedesignRouter = router({
  /**
   * 사진 업로드 + AI 리디자인 요청
   * 고객이 사진(base64)과 설명 텍스트를 보내면 AI가 공간을 리디자인
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
              content: `You are an expert interior designer specializing in office and commercial spaces. 
Your task is to enhance the user's redesign request into a detailed, professional image generation prompt.
The prompt should be in English and describe the desired interior design changes in detail.
Focus on: layout, furniture, lighting, materials, colors, and atmosphere.
Keep the original architectural structure (walls, windows, doors) but transform the interior design.
Output ONLY the enhanced prompt, nothing else. Max 200 words.`
            },
            {
              role: "user",
              content: `Space type: ${spaceLabel}\nUser request: ${input.prompt}\n\nCreate a professional interior redesign prompt for this ${spaceLabel}. The result should look like a professional interior design rendering.`
            }
          ]
        });

        const enhancedPrompt = enhancedPromptResponse.choices?.[0]?.message?.content 
          || `Professional interior redesign of ${spaceLabel}: ${input.prompt}. Modern, elegant office interior design with high-quality materials, professional lighting, and contemporary furniture. Photorealistic architectural rendering.`;

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

        return {
          id: recordId,
          originalImageUrl,
          resultImageUrl,
          status: "completed" as const,
        };
      } catch (error: any) {
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
