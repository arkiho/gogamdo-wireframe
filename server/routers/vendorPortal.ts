import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import { storagePut } from "../storage";
import { notifyOwner } from "../_core/notification";
import {
  createVendorQuote, getVendorQuotesByProject, getVendorQuoteById, updateVendorQuote,
  createVendorQuoteItems, getQuoteItemsByQuote,
  createMaterialPriceRecord, getMaterialPriceHistoryByCode,
  upsertMaterialPriceAnalytic, getMaterialPriceAnalytics,
} from "../db";

export const vendorPortalRouter = router({
  // ============ Phase 9: 납품사 견적 입력 ============

  submitQuote: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      vendorName: z.string().min(1),
      vendorContact: z.string().optional(),
      vendorEmail: z.string().optional(),
      vendorPhone: z.string().optional(),
      quoteCategory: z.enum(["furniture", "partition", "flooring", "ceiling", "electrical", "plumbing", "hvac", "painting", "demolition", "other"]),
      totalAmount: z.number(),
      taxAmount: z.number().optional(),
      validUntil: z.number().optional(),
      notes: z.string().optional(),
      items: z.array(z.object({
        itemName: z.string(),
        specification: z.string().optional(),
        unit: z.string().optional(),
        quantity: z.number(),
        unitPrice: z.number(),
        amount: z.number(),
        materialCode: z.string().optional(),
        sortOrder: z.number().default(0),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { items, quoteCategory, totalAmount, taxAmount, validUntil, notes, ...quoteData } = input;
      
      const result = await createVendorQuote({
        ...quoteData,
        category: quoteCategory,
        totalAmount: String(totalAmount),
        vatAmount: taxAmount != null ? String(taxAmount) : undefined,
        validUntil: validUntil != null ? String(validUntil) : undefined,
        status: "submitted",
      });
      
      if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      // 견적 항목 저장
      if (items && items.length > 0) {
        await createVendorQuoteItems(
          items.map(item => ({
            ...item,
            quoteId: result.id,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            amount: String(item.amount),
          }))
        );
        
        // 자재 단가 이력 기록 (materialCode가 있는 항목만)
        for (const item of items) {
          if (item.materialCode) {
            await createMaterialPriceRecord({
              materialCode: item.materialCode,
              materialName: item.itemName,
              category: input.quoteCategory,
              vendorName: input.vendorName,
              unitPrice: String(item.unitPrice),
              unit: item.unit || "EA",
              specification: item.specification,
              projectId: input.projectId,
              priceDate: new Date().toISOString().slice(0, 10),
            });
          }
        }
      }
      
      await notifyOwner({
        title: "새 납품사 견적 접수",
        content: `${input.vendorName}에서 ${input.quoteCategory} 견적(${input.totalAmount.toLocaleString()}원)이 접수되었습니다.`,
      });
      
      return { quoteId: result.id };
    }),

  // ============ 견적서 파일 업로드 ============

  uploadQuoteFile: protectedProcedure
    .input(z.object({
      quoteId: z.number(),
      fileName: z.string(),
      fileBase64: z.string(),
      fileType: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const quote = await getVendorQuoteById(input.quoteId);
      if (!quote) throw new TRPCError({ code: "NOT_FOUND" });
      
      const buffer = Buffer.from(input.fileBase64, "base64");
      const ext = input.fileName.split(".").pop() || "pdf";
      const key = `vendor-quotes/project-${quote.projectId}/${input.quoteId}-${Date.now()}.${ext}`;
      const { url } = await storagePut(key, buffer, input.fileType);
      
      await updateVendorQuote(input.quoteId, { fileUrl: url, fileName: input.fileName });
      
      return { url };
    }),

  // ============ 견적 AI 파싱 (업로드된 파일에서 항목 추출) ============

  parseQuoteFile: protectedProcedure
    .input(z.object({
      quoteId: z.number(),
      fileUrl: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const llmResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `당신은 인테리어 견적서 분석 전문가입니다. 견적서 파일을 분석하여 항목별 정보를 JSON 배열로 추출하세요.
각 항목: { "itemName": "품명", "specification": "규격", "unit": "단위", "quantity": 수량, "unitPrice": 단가, "amount": 금액, "materialCode": "자재코드(추정)" }
총액, 부가세도 별도 반환: { "items": [...], "totalAmount": 총액, "taxAmount": 부가세 }`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "이 견적서의 항목을 분석해주세요." },
              { type: "image_url", image_url: { url: input.fileUrl } },
            ],
          },
        ],
      });

      const rawContent = llmResponse.choices[0].message.content;
      const parsed = JSON.parse((typeof rawContent === "string" ? rawContent : "") || "{}");
      
      // 파싱된 항목 저장
      if (parsed.items && parsed.items.length > 0) {
        await createVendorQuoteItems(
          parsed.items.map((item: any, idx: number) => ({
            ...item,
            quoteId: input.quoteId,
            sortOrder: idx,
          }))
        );
      }
      
      // 총액 업데이트
      if (parsed.totalAmount) {
        await updateVendorQuote(input.quoteId, {
          totalAmount: String(parsed.totalAmount),
          vatAmount: String(parsed.taxAmount || 0),
          aiParsedData: parsed,
          aiParsed: 1,
        });
      }
      
      return { parsed };
    }),

  // ============ 견적 목록/상세 조회 ============

  getQuotesByProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return getVendorQuotesByProject(input.projectId);
    }),

  getQuote: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const quote = await getVendorQuoteById(input.id);
      if (!quote) throw new TRPCError({ code: "NOT_FOUND" });
      const items = await getQuoteItemsByQuote(input.id);
      return { ...quote, items };
    }),

  updateQuoteStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["submitted", "reviewing", "accepted", "rejected", "revised"]),
      reviewNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "master") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { id, ...data } = input;
      await updateVendorQuote(id, data);
      return { success: true };
    }),

  // ============ 원가 변동률 분석 (AI 학습) ============

  analyzePriceTrends: protectedProcedure
    .input(z.object({ materialCode: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "master") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const allAnalytics = await getMaterialPriceAnalytics();
      
      if (input.materialCode) {
        const history = await getMaterialPriceHistoryByCode(input.materialCode);
        if (history.length < 2) return { message: "데이터가 부족합니다." };
        
        const prices = history.map(h => Number(h.unitPrice));
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const latestPrice = prices[0];
        const changeRate = history.length >= 2 ? ((prices[0] - prices[1]) / prices[1]) * 100 : 0;
        
        await upsertMaterialPriceAnalytic({
          materialCode: input.materialCode,
          materialName: history[0].materialName,
          category: history[0].category,
          avgPrice: String(Math.round(avgPrice)),
          minPrice: String(minPrice),
          maxPrice: String(maxPrice),
          priceChangeRate: String(changeRate.toFixed(2)),
          sampleCount: history.length,
          trendDirection: changeRate > 2 ? "rising" : changeRate < -2 ? "falling" : "stable",
        });
        
        return { materialCode: input.materialCode, avgPrice, minPrice, maxPrice, latestPrice, changeRate };
      }
      
      return { analytics: allAnalytics };
    }),

  getMaterialAnalytics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "master") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return getMaterialPriceAnalytics();
  }),

  getMaterialHistory: protectedProcedure
    .input(z.object({ materialCode: z.string() }))
    .query(async ({ input }) => {
      return getMaterialPriceHistoryByCode(input.materialCode);
    }),
});
