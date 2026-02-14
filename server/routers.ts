import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import {
  createInquiry, listInquiries, updateInquiryStatus,
  addSubscriber, listSubscribers, toggleSubscriberActive,
  createEstimate, listEstimates,
  createLeadDownload, listLeadDownloads,
  upsertChatSession, listChatSessions,
  createStyleRecommendation, listStyleRecommendations,
  getDashboardStats,
} from "./db";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "관리자 권한이 필요합니다." });
  }
  return next({ ctx });
});

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
        await notifyOwner({
          title: `새 문의: ${input.name} (${input.company || "개인"})`,
          content: `이름: ${input.name}\n회사: ${input.company || "-"}\n이메일: ${input.email}\n전화: ${input.phone || "-"}\n유형: ${input.type || "-"}\n예산: ${input.budget || "-"}\n면적: ${input.area || "-"}\n\n내용:\n${input.message}`,
        });
        return result;
      }),
    list: adminProcedure.query(async () => {
      return listInquiries();
    }),
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["new", "contacted", "in_progress", "completed"]),
      }))
      .mutation(async ({ input }) => {
        return updateInquiryStatus(input.id, input.status);
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
    list: adminProcedure.query(async () => {
      return listSubscribers();
    }),
    toggleActive: adminProcedure
      .input(z.object({
        id: z.number(),
        active: z.enum(["yes", "no"]),
      }))
      .mutation(async ({ input }) => {
        return toggleSubscriberActive(input.id, input.active);
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
    list: adminProcedure.query(async () => {
      return listEstimates();
    }),
    // AI 견적 상세 분석 - LLM 기반
    aiAnalysis: publicProcedure
      .input(z.object({
        spaceType: z.string(),
        area: z.number(),
        grade: z.string(),
        options: z.array(z.string()),
        totalCost: z.number(),
        breakdown: z.array(z.object({
          name: z.string(),
          cost: z.number(),
        })),
      }))
      .mutation(async ({ input }) => {
        const pyeong = Math.round(input.area / 3.3);
        const prompt = `당신은 (주)고감도의 인테리어 견적 분석 전문가입니다.

## 고감도 실적 데이터 (거래처원장 기반)
- 총 70개 거래처, 총 매출 44억원
- 기업 프로젝트: 28건, 평균 8,877만원 (최대 6.9억, 최소 20만원)
- 교육기관: 21건, 평균 4,816만원
- 공공기관: 14건, 평균 5,980만원
- 주요 기업 고객: 피앤이시스템즈(6.9억), 세종리테일(3.7억), 카이젠인테리어(2.1억), 에드워드코리아(1.9억), 세종미디어그룹(1.8억)
- 주요 교육기관: 서울장곡초(1.5억), 서울언남초(1.2억), 서울영화초(8,600만)
- 주요 공공: 서울주택도시공사(1.3억), 서울교통공사(1.2억), 서울특별시(8,800만)

## 고객 입력 정보
- 공간 유형: ${input.spaceType}
- 면적: ${input.area}㎡ (약 ${pyeong}평)
- 마감 등급: ${input.grade}
- 추가 옵션: ${input.options.length > 0 ? input.options.join(", ") : "없음"}
- 예상 총 비용: ${input.totalCost}만원

## 공종별 비용 내역
${input.breakdown.map(b => `- ${b.name}: ${b.cost}만원`).join("\n")}

위 정보를 바탕으로 전문적인 견적 분석을 제공해주세요.`;

        const result = await invokeLLM({
          messages: [
            { role: "system", content: "당신은 인테리어 견적 분석 전문가입니다. 한국어로 응답하세요." },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "estimate_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  marketComparison: { type: "string", description: "시장 대비 비용 수준 평가 (1-2문장)" },
                  costSavingTips: {
                    type: "array",
                    items: { type: "string" },
                    description: "비용 절감 팁 3개",
                  },
                  qualityUpgradeTips: {
                    type: "array",
                    items: { type: "string" },
                    description: "같은 예산으로 품질을 높이는 팁 3개",
                  },
                  timeline: { type: "string", description: "예상 공사 일정 상세 설명" },
                  riskFactors: {
                    type: "array",
                    items: { type: "string" },
                    description: "주의해야 할 리스크 요인 2-3개",
                  },
                  benchmarkProjects: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "유사 프로젝트명" },
                        scale: { type: "string", description: "규모" },
                        cost: { type: "string", description: "비용 범위" },
                      },
                      required: ["name", "scale", "cost"],
                      additionalProperties: false,
                    },
                    description: "고감도 실적 기반 유사 프로젝트 벤치마크 2-3개",
                  },
                  recommendation: { type: "string", description: "종합 추천 의견 (2-3문장)" },
                },
                required: ["marketComparison", "costSavingTips", "qualityUpgradeTips", "timeline", "riskFactors", "benchmarkProjects", "recommendation"],
                additionalProperties: false,
              },
            },
          },
        });

        let analysis;
        try {
          const content = typeof result.choices[0]?.message?.content === "string"
            ? result.choices[0].message.content
            : "{}";
          analysis = JSON.parse(content);
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI 분석 응답 파싱 실패" });
        }

        return { analysis };
      }),
  }),

  // ===== 리드 마그넷 (Lead Magnet) =====
  leadMagnet: router({
    download: publicProcedure
      .input(z.object({
        email: z.string().email(),
        name: z.string().optional(),
        company: z.string().optional(),
        resourceId: z.string(),
        resourceTitle: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await createLeadDownload({
          email: input.email,
          name: input.name ?? null,
          company: input.company ?? null,
          resourceId: input.resourceId,
          resourceTitle: input.resourceTitle ?? null,
        });
        await notifyOwner({
          title: `리드 마그넷 다운로드: ${input.email}`,
          content: `이름: ${input.name || "-"}\n회사: ${input.company || "-"}\n이메일: ${input.email}\n자료: ${input.resourceTitle || input.resourceId}`,
        });
        return result;
      }),
    list: adminProcedure.query(async () => {
      return listLeadDownloads();
    }),
  }),

  // ===== AI 인테리어 상담 챗봇 (AI Chat) =====
  aiChat: router({
    send: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        messages: z.array(z.object({
          role: z.enum(["system", "user", "assistant"]),
          content: z.string(),
        })),
      }))
      .mutation(async ({ input }) => {
        const systemPrompt = `당신은 (주)고감도(KOKAMDO)의 AI 인테리어 상담 어시스턴트입니다.

## 회사 정보
- 회사명: (주)고감도 (KOKAMDO)
- 전문 분야: 사무실/상업공간 인테리어 설계 및 시공
- 업력: 12년, 150건 이상 프로젝트 완료
- 시공 면적: 50,000㎡ 이상
- 고객 만족도: 98%
- 서비스: 공간 설계, 디자인 & 3D 렌더링, 시공 관리 (원스톱 솔루션)

## 비용 가이드 (평당 기준, 3.3㎡)
- 스탠다드: 200~280만원 (기본 마감, 실용적 설계)
- 프리미엄: 280~400만원 (고급 마감재, 맞춤 가구)
- 럭셔리: 400~600만원+ (최고급 마감, 브랜드 가구, 특수 조명)

## 프로세스
1. 무료 상담 → 2. 현장 실측 → 3. 설계 & 3D → 4. 견적 확정 → 5. 시공 → 6. A/S

## 응답 규칙
- 친절하고 전문적인 톤으로 응답하세요
- 인테리어 관련 질문에 구체적이고 실용적인 조언을 제공하세요
- 정확한 견적은 현장 실측 후 가능하다고 안내하되, 대략적인 범위는 제공하세요
- 고감도의 강점(원스톱 솔루션, 투명한 견적, 체계적 관리)을 자연스럽게 언급하세요
- 상담이 깊어지면 무료 상담 신청(/contact)이나 AI 견적(/estimator)을 안내하세요
- 마크다운 형식으로 응답하세요
- 인테리어와 관련 없는 질문에는 정중히 인테리어 관련 상담으로 안내하세요
- 한국어로 응답하세요`;

        const llmMessages = [
          { role: "system" as const, content: systemPrompt },
          ...input.messages.filter(m => m.role !== "system"),
        ];

        const result = await invokeLLM({ messages: llmMessages });
        const assistantContent = typeof result.choices[0]?.message?.content === "string"
          ? result.choices[0].message.content
          : "죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해 주세요.";

        // Save to DB (non-blocking)
        const allMessages = [
          ...input.messages,
          { role: "assistant" as const, content: assistantContent },
        ];
        upsertChatSession({
          sessionId: input.sessionId,
          messages: allMessages,
        }).catch(err => console.error("[AI Chat] Failed to save session:", err));

        return { content: assistantContent };
      }),
    saveContact: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        email: z.string().email(),
        name: z.string().optional(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await upsertChatSession({
          sessionId: input.sessionId,
          messages: [],
          contactEmail: input.email,
          contactName: input.name,
          contactPhone: input.phone,
        });
        // Also add to subscribers
        try {
          await addSubscriber({
            email: input.email,
            name: input.name ?? null,
            source: "ai_chatbot",
          });
        } catch (_) { /* ignore duplicates */ }
        await notifyOwner({
          title: `AI 챗봇 리드: ${input.email}`,
          content: `이름: ${input.name || "-"}\n이메일: ${input.email}\n전화: ${input.phone || "-"}\n세션: ${input.sessionId}`,
        });
        return { success: true };
      }),
    list: adminProcedure.query(async () => {
      return listChatSessions();
    }),
  }),

  // ===== AI 공간 스타일 추천 (Style Recommendation) =====
  aiStyle: router({
    recommend: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        industry: z.string(),
        teamSize: z.string(),
        mood: z.string(),
        budget: z.string(),
        priorities: z.array(z.string()),
        contactEmail: z.string().email().optional(),
      }))
      .mutation(async ({ input }) => {
        const prompt = `당신은 전문 인테리어 디자인 컨설턴트입니다. 다음 조건에 맞는 사무실 인테리어 스타일을 추천해주세요.

## 고객 정보
- 업종: ${input.industry}
- 인원 규모: ${input.teamSize}
- 선호 분위기: ${input.mood}
- 예산 수준: ${input.budget}
- 우선순위: ${input.priorities.join(", ")}

## 응답 형식 (JSON)
다음 JSON 스키마에 맞춰 응답해주세요.`;

        const result = await invokeLLM({
          messages: [
            { role: "system", content: "당신은 전문 인테리어 디자인 컨설턴트입니다. 한국어로 응답하세요." },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "style_recommendation",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  styleName: { type: "string", description: "추천 스타일 이름 (예: 모던 미니멀, 내추럴 워크, 인더스트리얼 시크)" },
                  description: { type: "string", description: "스타일에 대한 2-3문장 설명" },
                  colorPalette: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "색상 이름" },
                        hex: { type: "string", description: "HEX 색상 코드" },
                        usage: { type: "string", description: "사용 위치 (예: 벽면, 가구, 포인트)" },
                      },
                      required: ["name", "hex", "usage"],
                      additionalProperties: false,
                    },
                    description: "5개의 추천 컬러 팔레트",
                  },
                  materials: {
                    type: "array",
                    items: { type: "string" },
                    description: "추천 마감재 목록 (3-5개)",
                  },
                  furniture: {
                    type: "array",
                    items: { type: "string" },
                    description: "추천 가구 스타일 (3-5개)",
                  },
                  lighting: { type: "string", description: "조명 추천 설명" },
                  layout: { type: "string", description: "공간 레이아웃 제안" },
                  estimatedCostRange: { type: "string", description: "예상 평당 비용 범위 (만원)" },
                  tips: {
                    type: "array",
                    items: { type: "string" },
                    description: "실용적인 인테리어 팁 3개",
                  },
                },
                required: ["styleName", "description", "colorPalette", "materials", "furniture", "lighting", "layout", "estimatedCostRange", "tips"],
                additionalProperties: false,
              },
            },
          },
        });

        let recommendation;
        try {
          const content = typeof result.choices[0]?.message?.content === "string"
            ? result.choices[0].message.content
            : "{}";
          recommendation = JSON.parse(content);
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI 응답 파싱 실패" });
        }

        // Generate AI image for the recommended style
        let imageUrl: string | null = null;
        try {
          const imagePrompt = `Professional interior design photograph of a modern ${input.industry} office space. Style: ${recommendation.styleName}. ${recommendation.description}. Color palette featuring ${recommendation.colorPalette?.map((c: any) => c.name).join(", ")}. ${recommendation.lighting}. High-end commercial interior photography, architectural digest quality, natural lighting, 4K resolution, photorealistic.`;
          const imageResult = await generateImage({ prompt: imagePrompt });
          imageUrl = imageResult.url ?? null;
        } catch (err) {
          console.error("[AI Style] Image generation failed:", err);
        }

        // Save to DB (non-blocking)
        createStyleRecommendation({
          sessionId: input.sessionId,
          industry: input.industry,
          teamSize: input.teamSize,
          mood: input.mood,
          budget: input.budget,
          priorities: input.priorities,
          resultJson: recommendation,
          imageUrl,
          contactEmail: input.contactEmail ?? null,
        }).catch(err => console.error("[AI Style] Failed to save:", err));

        if (input.contactEmail) {
          addSubscriber({
            email: input.contactEmail,
            source: "ai_style_recommend",
          }).catch(() => {});
          notifyOwner({
            title: `AI 스타일 추천 리드: ${input.contactEmail}`,
            content: `업종: ${input.industry}\n규모: ${input.teamSize}\n분위기: ${input.mood}\n예산: ${input.budget}\n추천 스타일: ${recommendation.styleName}`,
          }).catch(() => {});
        }

        return { recommendation, imageUrl };
      }),
    list: adminProcedure.query(async () => {
      return listStyleRecommendations();
    }),
  }),

  // ===== 관리자 대시보드 (Admin Dashboard) =====
  admin: router({
    stats: adminProcedure.query(async () => {
      return getDashboardStats();
    }),
  }),
});

export type AppRouter = typeof appRouter;
