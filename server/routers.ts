import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import { createInquiry, listInquiries, addSubscriber, listSubscribers, createEstimate, listEstimates } from "./db";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ===== 문의 (Inquiries) =====
  inquiry: router({
    create: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        company: z.string().optional(),
        email: z.string().email(),
        phone: z.string().optional(),
        type: z.string().optional(),
        budget: z.string().optional(),
        area: z.string().optional(),
        message: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const result = await createInquiry(input);
        // 대표님에게 알림 발송
        await notifyOwner({
          title: `새 문의: ${input.name} (${input.company || "개인"})`,
          content: `이름: ${input.name}\n회사: ${input.company || "-"}\n이메일: ${input.email}\n전화: ${input.phone || "-"}\n유형: ${input.type || "-"}\n예산: ${input.budget || "-"}\n면적: ${input.area || "-"}\n\n내용:\n${input.message}`,
        });
        return result;
      }),
    list: protectedProcedure.query(async () => {
      return listInquiries();
    }),
  }),

  // ===== 뉴스레터 구독 (Newsletter) =====
  newsletter: router({
    subscribe: publicProcedure
      .input(z.object({
        email: z.string().email(),
        name: z.string().optional(),
        company: z.string().optional(),
        source: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return addSubscriber({
          email: input.email,
          name: input.name ?? null,
          company: input.company ?? null,
          source: input.source ?? "footer",
        });
      }),
    list: protectedProcedure.query(async () => {
      return listSubscribers();
    }),
  }),

  // ===== AI 견적 (Estimates) =====
  estimate: router({
    save: publicProcedure
      .input(z.object({
        sessionId: z.string().optional(),
        spaceType: z.string().optional(),
        area: z.number().optional(),
        grade: z.string().optional(),
        resultJson: z.any().optional(),
        totalMin: z.number().optional(),
        totalMax: z.number().optional(),
        contactEmail: z.string().optional(),
        contactName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return createEstimate(input);
      }),
    list: protectedProcedure.query(async () => {
      return listEstimates();
    }),
  }),
});

export type AppRouter = typeof appRouter;
