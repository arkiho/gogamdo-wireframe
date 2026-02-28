import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import {
  createInquiry, listInquiries, updateInquiryStatus,
  addSubscriber, listSubscribers, toggleSubscriberActive,
  createEstimate, listEstimates,
  createLeadDownload, listLeadDownloads,
  upsertChatSession, listChatSessions,
  createStyleRecommendation, listStyleRecommendations,
  createAnnouncement, listAnnouncements, getActiveAnnouncements, updateAnnouncement, deleteAnnouncement, bulkDeleteAnnouncements,
  getDashboardStats,
  createPortfolioDraft, listPortfolioDrafts, getPortfolioDraft, updatePortfolioDraft,
  publishPortfolioDraft, archivePortfolioDraft, deletePortfolioDraft,
  addDraftImage, listDraftImages, updateDraftImage, deleteDraftImage, setCoverImage,
  getPublishedPortfolios,
  listSyncLogs,
  createSpaceProject, listSpaceProjects, getSpaceProject, updateSpaceProject, deleteSpaceProject,
  createSensor, listSensors, updateSensor, deleteSensor,
  addSensorData, addSensorDataBatch, getSensorDataRange, getSensorLatestData,
  createSpaceAnalysis, listSpaceAnalyses,
  listCrmClients, getCrmClient, findCrmClientByEmail, createCrmClient, updateCrmClient, deleteCrmClient,
  listCrmInteractions, createCrmInteraction, deleteCrmInteraction,
  listCrmDeals, getCrmDeal, createCrmDeal, updateCrmDeal, deleteCrmDeal,
  listCrmActivities, createCrmActivity, getCrmStats,
  createPopup, listPopups, getActivePopups, updatePopup, deletePopup,
  createNotification, listNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead, deleteNotification,
  createPortfolioReview, listPortfolioReviews, getPortfolioReview, getPortfolioReviewByToken, updatePortfolioReview, deletePortfolioReview, getApprovedReviewsForPortfolio,
  createInsightArticle, getInsightArticleBySlug, getInsightArticleById, getPublishedArticles, getAllArticles, updateInsightArticle, incrementArticleViewCount, deleteInsightArticle,
  createNewsletterSubscriber, getSubscriberByEmail, getSubscriberByToken, getActiveSubscribers, getAllNewsletterSubscribers, updateNewsletterSubscriber, unsubscribeByToken,
  createNewsletterCampaign, getNewsletterCampaign, getAllCampaigns, updateCampaign, deleteCampaign,
  createSegment, getSegmentById, getAllSegments, updateSegment, deleteSegment,
  getSubscribersBySegment, updateSegmentMatchCount,
  addSubscriberTag, removeSubscriberTag, getSubscriberTags, getAllUniqueTags, bulkAddTags,
  createSpaceZone, listSpaceZones, updateSpaceZone, deleteSpaceZone,
  addOccupancyEvent, addOccupancyEventsBatch, getOccupancyEvents,
  upsertZoneOccupancyStat, getZoneOccupancyStats, getZoneHeatmapData,
  getHourlyOccupancyPattern, getZoneTransitions,
  createSensorApiKey, listSensorApiKeys, revokeSensorApiKey,
  createClient, getClientByEmail, getClientById, updateClient, listClients, getClientByVerifyToken, getClientByResetToken,
  getSiteSetting, setSiteSetting, listSiteSettings, deleteUser,
  listStaffMembers, updateUserRole, updateUserDepartment,
  createActivityLog, listActivityLogs, getSystemStats, resetSiteSettings, resetAllUserRoles,
  softDeleteRecord, bulkSoftDeleteRecords, listDeletionLogs, restoreDeletedRecord, getDeletionLogStats,
  createStaffApplication, listStaffApplications, reviewStaffApplication, getStaffApplicationById, getStaffApplicationByEmail,
  createStaffInvitation, listStaffInvitations, getStaffInvitationByToken, acceptStaffInvitation, cancelStaffInvitation,
  deactivateStaffMember,
  listCameras, createCamera, updateCamera, deleteCamera, getCameraById, listCameraEvents, createCameraEvent,
} from "./db";
import { checkDriveConnection, listFolders, listImageFiles, findCompletionPhotoFolders } from "./googleDrive";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email";
import { syncFolder, syncAllProjects } from "./driveSyncPipeline";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { designAutomationRouter } from "./routers/designAutomation";
import { clientPipelineRouter } from "./routers/clientPipeline";
import { opsRouter } from "./routers/ops";
import { ipProtectionRouter } from "./routers/ipProtection";
import { aiRedesignRouter } from "./routers/aiRedesign";
import { sendReviewRequestEmail } from "./email";
import { surveyAutomationRouter } from "./routers/surveyAutomation";
import { realestateMatchingRouter } from "./routers/realestateMatching";
import { vendorPortalRouter } from "./routers/vendorPortal";
import { postOccupancyRouter } from "./routers/postOccupancy";
import { employeePortalRouter } from "./routers/employeePortal";
import { hash, compare } from "bcryptjs";
import { randomBytes } from "crypto";

// Admin-only procedure (admin + master 모두 허용)
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "master") {
    throw new TRPCError({ code: "FORBIDDEN", message: "관리자 권한이 필요합니다." });
  }
  return next({ ctx });
});

// Master-only procedure (master만 허용)
const masterProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "master") {
    throw new TRPCError({ code: "FORBIDDEN", message: "마스터 권한이 필요합니다." });
  }
  return next({ ctx });
});

// 문의 유형을 CRM spaceType으로 매핑
function mapInquiryTypeToSpaceType(type?: string): "office" | "commercial" | "medical" | "education" | "residential" | "other" | undefined {
  if (!type) return undefined;
  const map: Record<string, "office" | "commercial" | "medical" | "education" | "residential" | "other"> = {
    "사무실": "office",
    "오피스": "office",
    "상업공간": "commercial",
    "매장": "commercial",
    "쇼룸": "commercial",
    "병원": "medical",
    "의료": "medical",
    "학교": "education",
    "교육": "education",
    "주거": "residential",
  };
  return map[type] || "other";
}

export const appRouter = router({
  ipProtection: ipProtectionRouter,
  aiRedesign: aiRedesignRouter,
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

        // === CRM 자동 연동: 고객 + 딜 + 활동 자동 생성 ===
        try {
          // 1. 이메일로 기존 CRM 고객 검색, 없으면 새로 생성
          let existingClient = await findCrmClientByEmail(input.email);
          let clientId: number;

          if (existingClient) {
            clientId = existingClient.id;
          } else {
            const newClientId = await createCrmClient({
              companyName: input.company || `${input.name} (개인)`,
              contactName: input.name,
              email: input.email,
              phone: input.phone || undefined,
              source: "website",
              notes: `웹사이트 문의를 통해 자동 생성됨.\n문의 유형: ${input.type || "-"}\n예산: ${input.budget || "-"}\n면적: ${input.area || "-"}`,
            });
            clientId = newClientId!;
          }

          // 2. 딜(영업 기회) 자동 생성
          const dealTitle = `[웹문의] ${input.company || input.name} - ${input.type || "인테리어 문의"}`;
          const dealId = await createCrmDeal({
            clientId,
            title: dealTitle,
            stage: "lead",
            area: input.area || undefined,
            spaceType: mapInquiryTypeToSpaceType(input.type),
            description: input.message,
          });

          // 3. 활동 로그 기록
          await createCrmActivity({
            dealId: dealId || undefined,
            clientId,
            type: "note",
            title: "웹사이트 문의 접수",
            description: `문의 내용: ${input.message}\n유형: ${input.type || "-"}\n예산: ${input.budget || "-"}\n면적: ${input.area || "-"}`,
            createdBy: "system",
          });
        } catch (crmError) {
          // CRM 연동 실패해도 문의 접수는 정상 처리
          console.error("[CRM Auto-Link] Failed to create CRM records:", crmError);
        }

        await notifyOwner({
          title: `새 문의: ${input.name} (${input.company || "개인"})`,
          content: `이름: ${input.name}\n회사: ${input.company || "-"}\n이메일: ${input.email}\n전화: ${input.phone || "-"}\n유형: ${input.type || "-"}\n예산: ${input.budget || "-"}\n면적: ${input.area || "-"}\n\n내용:\n${input.message}\n\n[CRM] 고객 및 딜이 자동 생성되었습니다.`,
        });

        // 알림 센터에 기록
        try {
          await createNotification({
            type: "inquiry",
            title: `새 문의: ${input.name}`,
            message: `${input.company || "개인"} | ${input.type || "인테리어 문의"} | ${input.email}`,
            linkUrl: "/admin/inquiries",
          });
        } catch (e) { /* 알림 실패해도 문의는 정상 처리 */ }

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

  // (newsletter 라우터는 하단에 통합됨)

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
        const result = await createEstimate(input);

        // 연락처가 있는 견적은 CRM 자동 연동 + 관리자 알림
        if (input.contactEmail) {
          const pyeong = input.area ? Math.round(input.area / 3.3) : 0;

          // === CRM 자동 연동: 견적 리드 ===
          try {
            let existingClient = await findCrmClientByEmail(input.contactEmail);
            let clientId: number;

            if (existingClient) {
              clientId = existingClient.id;
            } else {
              const newClientId = await createCrmClient({
                companyName: `${input.contactName || input.contactEmail} (견적문의)`,
                contactName: input.contactName || input.contactEmail,
                email: input.contactEmail,
                source: "website",
                notes: `AI 견적을 통해 자동 생성됨.\n공간: ${input.spaceType || "-"}\n면적: ${input.area || "-"}㎡ (약 ${pyeong}평)\n등급: ${input.grade || "-"}`,
              });
              clientId = newClientId!;
            }

            const estimateRange = `${input.totalMin?.toLocaleString() || "?"} ~ ${input.totalMax?.toLocaleString() || "?"}만원`;
            const dealId = await createCrmDeal({
              clientId,
              title: `[AI견적] ${input.contactName || input.contactEmail} - ${input.spaceType || "인테리어"} ${pyeong}평`,
              stage: "lead",
              estimatedValue: input.totalMax || undefined,
              area: input.area ? `${input.area}㎡` : undefined,
              spaceType: mapInquiryTypeToSpaceType(input.spaceType),
              description: `AI 견적 결과: ${estimateRange}\n등급: ${input.grade || "-"}`,
            });

            await createCrmActivity({
              dealId: dealId || undefined,
              clientId,
              type: "note",
              title: "AI 견적 완료",
              description: `공간: ${input.spaceType || "-"}\n면적: ${input.area || "-"}㎡ (약 ${pyeong}평)\n등급: ${input.grade || "-"}\n예상 비용: ${estimateRange}`,
              createdBy: "system",
            });
          } catch (crmError) {
            console.error("[CRM Auto-Link] Failed to create CRM records from estimate:", crmError);
          }

          await notifyOwner({
            title: `새 견적 요청: ${input.contactName || input.contactEmail}`,
            content: `이름: ${input.contactName || "-"}\n이메일: ${input.contactEmail}\n공간: ${input.spaceType || "-"}\n면적: ${input.area || "-"}㎡ (약 ${pyeong}평)\n등급: ${input.grade || "-"}\n예상 비용: ${input.totalMin?.toLocaleString() || "-"} ~ ${input.totalMax?.toLocaleString() || "-"}만원\n\n[CRM] 고객 및 딜이 자동 생성되었습니다.`,
          }).catch(() => {});

          // 알림 센터에 기록
          try {
            await createNotification({
              type: "estimate",
              title: `새 견적: ${input.contactName || input.contactEmail}`,
              message: `${input.spaceType || "인테리어"} ${pyeong}평 | ${input.grade || "-"}등급 | ${input.totalMin?.toLocaleString() || "?"}~${input.totalMax?.toLocaleString() || "?"}만원`,
              linkUrl: "/admin/estimates",
            });
          } catch (e) { /* 알림 실패해도 견적은 정상 처리 */ }
        }
        return result;
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
- 업력: 35년 (1991년 창업), 2,800건 이상 프로젝트 완료
- 시공 면적: 대한민국 면적만큼 (100,000㎡ 이상)
- 고객 만족도: 98%
- 인증: 여성기업 인증, 이노비즈 인증, 윤리경영 인증
- 서비스: 공간 설계, 디자인 & 3D 렌더링, 시공 관리 (원스톱 솔루션)
- 자회사: OpsX (데이터 기반 사무환경 컨설팅, opsx.co.kr)

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

  // ===== 공지 배너 (Announcements) =====
  announcement: router({
    // 공개: 활성화된 공지만 반환
    active: publicProcedure.query(async () => {
      return getActiveAnnouncements();
    }),
    // 관리자: 전체 목록
    list: adminProcedure.query(async () => {
      return listAnnouncements();
    }),
    // 관리자: 생성
    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        message: z.string().min(1),
        linkUrl: z.string().optional(),
        linkText: z.string().optional(),
        bgColor: z.string().optional(),
        textColor: z.string().optional(),
        priority: z.number().optional(),
        startsAt: z.date().optional(),
        endsAt: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        return createAnnouncement({
          title: input.title,
          message: input.message,
          linkUrl: input.linkUrl ?? null,
          linkText: input.linkText ?? null,
          bgColor: input.bgColor ?? "#111111",
          textColor: input.textColor ?? "#ffffff",
          priority: input.priority ?? 0,
          startsAt: input.startsAt ?? null,
          endsAt: input.endsAt ?? null,
        });
      }),
    // 관리자: 수정
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        message: z.string().optional(),
        linkUrl: z.string().optional(),
        linkText: z.string().optional(),
        bgColor: z.string().optional(),
        textColor: z.string().optional(),
        active: z.enum(["yes", "no"]).optional(),
        priority: z.number().optional(),
        startsAt: z.date().nullable().optional(),
        endsAt: z.date().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateAnnouncement(id, data as any);
      }),
    // 관리자: 삭제
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteAnnouncement(input.id);
      }),
    // 관리자: 일괄 삭제
    bulkDelete: adminProcedure
      .input(z.object({ ids: z.array(z.number()).min(1) }))
      .mutation(async ({ input }) => {
        return bulkDeleteAnnouncements(input.ids);
      }),
  }),

  // ===== 포트폴리오 초안 관리 (Portfolio Drafts) =====
  portfolio: router({
    // 공개: 게시된 포트폴리오 목록
    published: publicProcedure.query(async () => {
      return getPublishedPortfolios();
    }),
    // 공개: 게시된 포트폴리오 상세 + 이미지
    detail: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const draft = await getPortfolioDraft(input.id);
        if (!draft || draft.status !== "published") return null;
        const images = await listDraftImages(input.id);
        return { ...draft, images };
      }),
    // 관리자: 초안 생성
    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        projectName: z.string().optional(),
        category: z.string().optional(),
        client: z.string().optional(),
        area: z.string().optional(),
        location: z.string().optional(),
        duration: z.string().optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        return createPortfolioDraft(input);
      }),
    // 관리자: 전체 초안 목록
    list: adminProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return listPortfolioDrafts(input?.status);
      }),
    // 관리자: 초안 상세 + 이미지
    get: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const draft = await getPortfolioDraft(input.id);
        if (!draft) throw new TRPCError({ code: "NOT_FOUND" });
        const images = await listDraftImages(input.id);
        return { ...draft, images };
      }),
    // 관리자: 초안 수정
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        projectName: z.string().optional(),
        category: z.string().optional(),
        client: z.string().optional(),
        area: z.string().optional(),
        location: z.string().optional(),
        duration: z.string().optional(),
        description: z.string().optional(),
        aiDescription: z.string().optional(),
        tags: z.array(z.string()).optional(),
        status: z.enum(["draft", "review", "published", "archived"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updatePortfolioDraft(id, data as any);
      }),
    // 관리자: 게시
    publish: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return publishPortfolioDraft(input.id);
      }),
    // 관리자: 보관
    archive: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return archivePortfolioDraft(input.id);
      }),
    // 관리자: 삭제
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deletePortfolioDraft(input.id);
      }),
    // 관리자: AI 설명 생성
    generateDescription: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string(),
        category: z.string().optional(),
        client: z.string().optional(),
        area: z.string().optional(),
        location: z.string().optional(),
        imageCount: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await invokeLLM({
          messages: [
            { role: "system", content: "당신은 (주)고감도의 포트폴리오 콘텐츠 작성 전문가입니다. 인테리어 프로젝트를 매력적으로 소개하는 글을 작성합니다. 전문적이면서도 따뜻한 톤으로 작성하세요." },
            { role: "user", content: `다음 프로젝트에 대한 포트폴리오 소개글을 작성해주세요.\n\n프로젝트명: ${input.title}\n카테고리: ${input.category || "사무실 인테리어"}\n고객사: ${input.client || "비공개"}\n면적: ${input.area || "미정"}\n위치: ${input.location || "미정"}\n사진 수: ${input.imageCount || 0}장\n\n3-4문장으로 프로젝트의 핵심 특징, 디자인 컨셉, 고객 니즈 해결 방식을 소개하는 글을 작성해주세요.` },
          ],
        });
        const rawContent = result.choices[0]?.message?.content;
        const description = typeof rawContent === "string" ? rawContent : "";
        await updatePortfolioDraft(input.id, { aiDescription: description });
        return { description };
      }),
    // ===== 이미지 관리 =====
    addImage: adminProcedure
      .input(z.object({
        draftId: z.number(),
        originalUrl: z.string(),
        filename: z.string().optional(),
        driveFileId: z.string().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return addDraftImage(input);
      }),
    // 관리자: base64 이미지 업로드 (S3 업로드 후 DB 저장)
    uploadImage: adminProcedure
      .input(z.object({
        draftId: z.number(),
        fileName: z.string(),
        fileBase64: z.string(),
        fileType: z.string(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileBase64, "base64");
        const suffix = Math.random().toString(36).substring(2, 10);
        const ext = input.fileName.split(".").pop() || "jpg";
        const fileKey = `portfolio/${input.draftId}/${suffix}.${ext}`;
        const { url } = await storagePut(fileKey, buffer, input.fileType);
        const image = await addDraftImage({
          draftId: input.draftId,
          originalUrl: url,
          filename: input.fileName,
          sortOrder: input.sortOrder ?? 0,
        });
        return { id: image?.id, url };
      }),
    listImages: adminProcedure
      .input(z.object({ draftId: z.number() }))
      .query(async ({ input }) => {
        return listDraftImages(input.draftId);
      }),
    updateImage: adminProcedure
      .input(z.object({
        id: z.number(),
        beforeUrl: z.string().nullable().optional(),
        processedUrl: z.string().optional(),
        watermarkedUrl: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        aiProcessed: z.enum(["yes", "no"]).optional(),
        processingStatus: z.enum(["pending", "processing", "done", "error"]).optional(),
        sortOrder: z.number().optional(),
        isCover: z.enum(["yes", "no"]).optional(),
        caption: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateDraftImage(id, data as any);
      }),
    deleteImage: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteDraftImage(input.id);
      }),
    setCover: adminProcedure
      .input(z.object({ draftId: z.number(), imageId: z.number() }))
      .mutation(async ({ input }) => {
        return setCoverImage(input.draftId, input.imageId);
      }),
    // AI 이미지 보정
    processImage: adminProcedure
      .input(z.object({
        imageId: z.number(),
        originalUrl: z.string(),
        action: z.enum(["enhance", "watermark", "addPeople", "all"]),
      }))
      .mutation(async ({ input }) => {
        await updateDraftImage(input.imageId, { processingStatus: "processing" });
        try {
          let processedUrl = input.originalUrl;
          if (input.action === "enhance" || input.action === "all") {
            const result = await generateImage({
              prompt: "Enhance this interior photo: improve lighting, color balance, and clarity. Make it look professional and magazine-quality. Keep the original composition and content exactly the same.",
              originalImages: [{ url: input.originalUrl, mimeType: "image/jpeg" }],
            });
            if (result.url) processedUrl = result.url;
          }
          if (input.action === "addPeople" || input.action === "all") {
            const result = await generateImage({
              prompt: "Add 1-2 professional business people naturally interacting in this office interior space. They should look like they are working or having a meeting. Keep the interior design exactly the same, only add realistic people.",
              originalImages: [{ url: processedUrl, mimeType: "image/jpeg" }],
            });
            if (result.url) processedUrl = result.url;
          }
          // 워터마크는 프론트에서 canvas로 처리하거나, 별도 서비스로 처리
          await updateDraftImage(input.imageId, {
            processedUrl,
            aiProcessed: "yes",
            processingStatus: "done",
          });
          return { success: true, processedUrl };
        } catch (err) {
          await updateDraftImage(input.imageId, { processingStatus: "error" });
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "이미지 처리 실패" });
        }
      }),
  }),

  // ===== 포트폴리오 담당자 리뷰 (Portfolio Reviews) =====
  portfolioReview: router({
    // 공개: 승인된 리뷰 조회 (포트폴리오 상세 페이지에서 사용)
    approved: publicProcedure
      .input(z.object({ portfolioId: z.number() }))
      .query(async ({ input }) => {
        return getApprovedReviewsForPortfolio(input.portfolioId);
      }),

    // 공개: 토큰으로 리뷰 정보 조회 (담당자 리뷰 작성 페이지)
    getByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const review = await getPortfolioReviewByToken(input.token);
        if (!review) throw new TRPCError({ code: "NOT_FOUND", message: "리뷰 요청을 찾을 수 없습니다." });
        // 토큰 만료 확인
        if (review.tokenExpiresAt && new Date(review.tokenExpiresAt) < new Date()) {
          throw new TRPCError({ code: "FORBIDDEN", message: "리뷰 작성 기간이 만료되었습니다. 관리자에게 문의해주세요." });
        }
        // 포트폴리오 정보도 함께 반환
        const portfolio = await getPortfolioDraft(review.portfolioId);
        return { review, portfolio };
      }),

    // 공개: 담당자가 토큰으로 리뷰 작성/수정
    submit: publicProcedure
      .input(z.object({
        token: z.string(),
        reviewerName: z.string().min(1),
        reviewerTitle: z.string().optional(),
        reviewerCompany: z.string().optional(),
        rating: z.number().min(1).max(5),
        title: z.string().optional(),
        content: z.string().min(10),
        highlights: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const review = await getPortfolioReviewByToken(input.token);
        if (!review) throw new TRPCError({ code: "NOT_FOUND", message: "리뷰 요청을 찾을 수 없습니다." });
        if (review.tokenExpiresAt && new Date(review.tokenExpiresAt) < new Date()) {
          throw new TRPCError({ code: "FORBIDDEN", message: "리뷰 작성 기간이 만료되었습니다." });
        }
        if (review.status === "approved") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "이미 승인된 리뷰는 수정할 수 없습니다." });
        }
        const { token, ...data } = input;
        await updatePortfolioReview(review.id, {
          ...data,
          status: "submitted",
          submittedAt: new Date(),
        } as any);
        // 관리자 알림
        await notifyOwner({
          title: "포트폴리오 리뷰 접수",
          content: `${input.reviewerName}님이 리뷰를 작성했습니다. 관리자 대시보드에서 승인해주세요.`,
        });
        await createNotification({
          type: "system",
          title: "포트폴리오 리뷰 접수",
          message: `${input.reviewerName}님이 리뷰를 작성했습니다. 승인 대기 중입니다.`,
          linkUrl: "/admin",
        });
        return { success: true };
      }),

    // 관리자: 리뷰 요청 생성 (토큰 발급)
    create: adminProcedure
      .input(z.object({
        portfolioId: z.number(),
        reviewerName: z.string().min(1),
        reviewerEmail: z.string().optional(),
        reviewerPhone: z.string().optional(),
        reviewerCompany: z.string().optional(),
        reviewerTitle: z.string().optional(),
        expiresInDays: z.number().default(30),
        origin: z.string().optional(),
        sendEmail: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        // 고유 토큰 생성
        const crypto = await import("crypto");
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);
        const id = await createPortfolioReview({
          portfolioId: input.portfolioId,
          reviewerName: input.reviewerName,
          reviewerEmail: input.reviewerEmail || undefined,
          reviewerPhone: input.reviewerPhone || undefined,
          reviewerCompany: input.reviewerCompany || undefined,
          reviewerTitle: input.reviewerTitle || undefined,
          accessToken: token,
          tokenExpiresAt: expiresAt,
          status: "pending",
        });

        // 이메일 자동 발송
        let emailResult = { sent: false, method: "none" };
        if (input.sendEmail && input.reviewerEmail) {
          const portfolio = await getPortfolioDraft(input.portfolioId);
          const projectTitle = portfolio?.title || "고감도 프로젝트";
          const baseUrl = input.origin || "https://kokamdo.co.kr";
          const reviewUrl = `${baseUrl}/review/${token}`;

          emailResult = await sendReviewRequestEmail({
            reviewerName: input.reviewerName,
            reviewerEmail: input.reviewerEmail,
            reviewerCompany: input.reviewerCompany,
            projectTitle,
            reviewUrl,
            expiresAt,
          });
        }

        return { id, token, emailSent: emailResult.sent, emailMethod: emailResult.method };
      }),

    // 관리자: 리뷰 목록 (전체 또는 포트폴리오별)
    list: adminProcedure
      .input(z.object({
        portfolioId: z.number().optional(),
        status: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return listPortfolioReviews(input?.portfolioId, input?.status);
      }),

    // 관리자: 리뷰 승인
    approve: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await updatePortfolioReview(input.id, {
          status: "approved",
          approvedAt: new Date(),
        } as any);
        return { success: true };
      }),

    // 관리자: 리뷰 거절
    reject: adminProcedure
      .input(z.object({ id: z.number(), adminNote: z.string().optional() }))
      .mutation(async ({ input }) => {
        await updatePortfolioReview(input.id, {
          status: "rejected",
          adminNote: input.adminNote || undefined,
        } as any);
        return { success: true };
      }),

    // 관리자: 리뷰 삭제
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deletePortfolioReview(input.id);
        return { success: true };
      }),
  }),

  // ===== 관리자 대시보드 (Admin Dashboard) =====
  admin: router({
    stats: adminProcedure.query(async () => {
      return getDashboardStats();
    }),
  }),

  // ===== 구글 드라이브 동기화 (Drive Sync) =====
  driveSync: router({
    // 드라이브 연결 상태 확인
    checkConnection: adminProcedure.query(async () => {
      return checkDriveConnection();
    }),

    // 루트 폴더 내 프로젝트 폴더 목록
    listProjectFolders: adminProcedure
      .input(z.object({ rootFolderId: z.string() }))
      .query(async ({ input }) => {
        const folders = await findCompletionPhotoFolders(input.rootFolderId);
        return folders;
      }),

    // 특정 폴더 내 하위 폴더 목록
    listFolders: adminProcedure
      .input(z.object({ parentFolderId: z.string() }))
      .query(async ({ input }) => {
        return listFolders(input.parentFolderId);
      }),

    // 특정 폴더 내 이미지 파일 목록
    listImages: adminProcedure
      .input(z.object({ folderId: z.string() }))
      .query(async ({ input }) => {
        return listImageFiles(input.folderId);
      }),

    // 단일 폴더 동기화 (Drive → S3 → 초안 생성)
    syncFolder: adminProcedure
      .input(z.object({
        folderId: z.string(),
        projectName: z.string(),
        folderPath: z.string(),
        category: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return syncFolder(input);
      }),

    // 전체 프로젝트 일괄 동기화
    syncAll: adminProcedure
      .input(z.object({ rootFolderId: z.string() }))
      .mutation(async ({ input }) => {
        return syncAllProjects(input.rootFolderId);
      }),

    // 동기화 로그 목록
    listLogs: adminProcedure.query(async () => {
      return listSyncLogs();
    }),
  }),

  // ===== DDIA: Data Driven Interior Architecture =====
  ddia: router({
    // --- Space Projects ---
    createProject: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        client: z.string().optional(),
        location: z.string().optional(),
        area: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return createSpaceProject(input);
      }),

    listProjects: adminProcedure.query(async () => {
      return listSpaceProjects();
    }),

    getProject: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getSpaceProject(input.id);
      }),

    updateProject: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        client: z.string().optional(),
        location: z.string().optional(),
        area: z.string().optional(),
        description: z.string().optional(),
        floorPlanUrl: z.string().optional(),
        floorPlanWidth: z.number().optional(),
        floorPlanHeight: z.number().optional(),
        status: z.enum(["setup", "collecting", "analyzing", "completed"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateSpaceProject(id, data);
      }),

    deleteProject: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteSpaceProject(input.id);
      }),

    // --- Sensors ---
    createSensor: adminProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string().min(1),
        type: z.enum(["temperature", "humidity", "illuminance", "co2", "noise", "occupancy", "motion", "air_quality", "power"]),
        unit: z.string().optional(),
        posX: z.number().optional(),
        posY: z.number().optional(),
        zone: z.string().optional(),
        deviceId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return createSensor(input);
      }),

    listSensors: adminProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return listSensors(input.projectId);
      }),

    updateSensor: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        type: z.enum(["temperature", "humidity", "illuminance", "co2", "noise", "occupancy", "motion", "air_quality", "power"]).optional(),
        unit: z.string().optional(),
        posX: z.number().optional(),
        posY: z.number().optional(),
        zone: z.string().optional(),
        deviceId: z.string().optional(),
        active: z.enum(["yes", "no"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateSensor(id, data);
      }),

    deleteSensor: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteSensor(input.id);
      }),

    // --- Sensor Data ---
    addData: adminProcedure
      .input(z.object({
        sensorId: z.number(),
        projectId: z.number(),
        value: z.string(),
        recordedAt: z.string().transform(s => new Date(s)),
      }))
      .mutation(async ({ input }) => {
        return addSensorData({ ...input, recordedAt: input.recordedAt });
      }),

    addDataBatch: adminProcedure
      .input(z.object({
        rows: z.array(z.object({
          sensorId: z.number(),
          projectId: z.number(),
          value: z.string(),
          recordedAt: z.string().transform(s => new Date(s)),
        })),
      }))
      .mutation(async ({ input }) => {
        return addSensorDataBatch(input.rows);
      }),

    getDataRange: adminProcedure
      .input(z.object({
        sensorId: z.number(),
        from: z.string().transform(s => new Date(s)),
        to: z.string().transform(s => new Date(s)),
      }))
      .query(async ({ input }) => {
        return getSensorDataRange(input.sensorId, input.from, input.to);
      }),

    getLatestData: adminProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return getSensorLatestData(input.projectId);
      }),
    sensorTimeSeries: adminProcedure
      .input(z.object({
        projectId: z.number(),
        period: z.enum(["1d", "7d", "30d"]).default("7d"),
      }))
      .query(async ({ input }) => {
        const now = new Date();
        const periodMs = input.period === "1d" ? 86400000 : input.period === "7d" ? 604800000 : 2592000000;
        const from = new Date(now.getTime() - periodMs);
        const sensorList = await listSensors(input.projectId);
        const series = [];
        for (const sensor of sensorList) {
          const data = await getSensorDataRange(sensor.id, from, now);
          series.push({
            sensorId: sensor.id,
            sensorName: sensor.name,
            sensorType: sensor.type,
            zone: sensor.zone,
            unit: sensor.unit,
            data: data.map((d: any) => ({
              value: parseFloat(d.value) || 0,
              recordedAt: d.recordedAt,
            })),
          });
        }
        return { projectId: input.projectId, period: input.period, from, to: now, series };
      }),

    // --- Space Analysis ---
    createAnalysis: adminProcedure
      .input(z.object({
        projectId: z.number(),
        zone: z.string().optional(),
        analysisType: z.enum(["occupancy_pattern", "environmental", "energy", "comfort", "traffic_flow"]),
        summary: z.string().optional(),
        dataJson: z.any().optional(),
        recommendations: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        return createSpaceAnalysis(input);
      }),

    listAnalyses: adminProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return listSpaceAnalyses(input.projectId);
      }),

    // --- AI Analysis ---
    analyzeData: adminProcedure
      .input(z.object({
        projectId: z.number(),
        analysisType: z.enum(["occupancy_pattern", "environmental", "energy", "comfort", "traffic_flow"]),
      }))
      .mutation(async ({ input }) => {
        const latestData = await getSensorLatestData(input.projectId);
        const project = await getSpaceProject(input.projectId);
        if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "프로젝트를 찾을 수 없습니다" });

        const sensorSummary = latestData.map(d => 
          `${d.sensor.name}(${d.sensor.type}${d.sensor.zone ? `, ${d.sensor.zone}` : ""}): ${d.latestValue ?? "N/A"} ${d.sensor.unit ?? ""}`
        ).join("\n");

        const analysisLabels: Record<string, string> = {
          occupancy_pattern: "재실 패턴 분석",
          environmental: "환경 쾌적도 분석",
          energy: "에너지 효율 분석",
          comfort: "공간 쾌적 지수 분석",
          traffic_flow: "동선 흐름 분석",
        };

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `당신은 Data Driven Interior Architecture 전문가입니다. 센서 데이터를 분석하여 공간 설계에 반영할 인사이트를 도출합니다. 분석 결과를 JSON으로 반환하세요.`,
            },
            {
              role: "user",
              content: `프로젝트: ${project.name}\n위치: ${project.location ?? "미정"}\n면적: ${project.area ?? "미정"}\n\n센서 데이터:\n${sensorSummary}\n\n${analysisLabels[input.analysisType]}을 수행하고, 공간 설계에 반영할 구체적인 권장사항을 제시하세요.`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "space_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "분석 요약 (2-3문장)" },
                  findings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        area: { type: "string" },
                        insight: { type: "string" },
                        severity: { type: "string", enum: ["info", "warning", "critical"] },
                      },
                      required: ["area", "insight", "severity"],
                      additionalProperties: false,
                    },
                  },
                  recommendations: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["summary", "findings", "recommendations"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices?.[0]?.message?.content as string;
        const parsed = JSON.parse(content);

        await createSpaceAnalysis({
          projectId: input.projectId,
          analysisType: input.analysisType,
          summary: parsed.summary,
          dataJson: parsed,
          recommendations: parsed.recommendations,
        });

        return parsed;
      }),

    // --- Space Zones ---
    createZone: adminProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string().min(1),
        color: z.string().optional(),
        polygon: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
        zoneType: z.enum(["office", "meeting", "corridor", "lounge", "restroom", "kitchen", "storage", "other"]).optional(),
        capacity: z.number().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return createSpaceZone(input);
      }),

    listZones: adminProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return listSpaceZones(input.projectId);
      }),

    updateZone: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        color: z.string().optional(),
        polygon: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
        zoneType: z.enum(["office", "meeting", "corridor", "lounge", "restroom", "kitchen", "storage", "other"]).optional(),
        capacity: z.number().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateSpaceZone(id, data);
      }),

    deleteZone: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteSpaceZone(input.id);
      }),

    // --- Occupancy Events ---
    addOccupancyEvent: adminProcedure
      .input(z.object({
        projectId: z.number(),
        sensorId: z.number(),
        zoneId: z.number().optional(),
        eventType: z.enum(["enter", "exit", "count_change"]),
        count: z.number().optional(),
        eventAt: z.string().transform(s => new Date(s)),
      }))
      .mutation(async ({ input }) => {
        return addOccupancyEvent({ ...input, eventAt: input.eventAt });
      }),

    addOccupancyEventsBatch: adminProcedure
      .input(z.object({
        rows: z.array(z.object({
          projectId: z.number(),
          sensorId: z.number(),
          zoneId: z.number().optional(),
          eventType: z.enum(["enter", "exit", "count_change"]),
          count: z.number().optional(),
          eventAt: z.string().transform(s => new Date(s)),
        })),
      }))
      .mutation(async ({ input }) => {
        return addOccupancyEventsBatch(input.rows);
      }),

    // --- Heatmap & Analytics ---
    getHeatmapData: adminProcedure
      .input(z.object({
        projectId: z.number(),
        from: z.string().transform(s => new Date(s)),
        to: z.string().transform(s => new Date(s)),
      }))
      .query(async ({ input }) => {
        return getZoneHeatmapData(input.projectId, input.from, input.to);
      }),

    getOccupancyStats: adminProcedure
      .input(z.object({
        projectId: z.number(),
        from: z.string().transform(s => new Date(s)),
        to: z.string().transform(s => new Date(s)),
      }))
      .query(async ({ input }) => {
        return getZoneOccupancyStats(input.projectId, input.from, input.to);
      }),

    getHourlyPattern: adminProcedure
      .input(z.object({
        projectId: z.number(),
        zoneId: z.number(),
        from: z.string().transform(s => new Date(s)),
        to: z.string().transform(s => new Date(s)),
      }))
      .query(async ({ input }) => {
        return getHourlyOccupancyPattern(input.projectId, input.zoneId, input.from, input.to);
      }),

    getTransitions: adminProcedure
      .input(z.object({
        projectId: z.number(),
        from: z.string().transform(s => new Date(s)),
        to: z.string().transform(s => new Date(s)),
      }))
      .query(async ({ input }) => {
        return getZoneTransitions(input.projectId, input.from, input.to);
      }),

    // --- AI Space Optimization Report ---
    generateOptimizationReport: adminProcedure
      .input(z.object({
        projectId: z.number(),
        from: z.string().transform(s => new Date(s)),
        to: z.string().transform(s => new Date(s)),
      }))
      .mutation(async ({ input }) => {
        const project = await getSpaceProject(input.projectId);
        if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "프로젝트를 찾을 수 없습니다" });

        const zones = await listSpaceZones(input.projectId);
        const heatmap = await getZoneHeatmapData(input.projectId, input.from, input.to);
        const transitions = await getZoneTransitions(input.projectId, input.from, input.to);

        const zoneStats = zones.map(z => {
          const heat = heatmap.find(h => h.zoneId === z.id);
          return `${z.name}(${z.zoneType}, 수용${z.capacity ?? '미정'}명): 재실시간 ${heat?.totalMinutes ?? 0}분, 평균 ${heat?.avgOccupancy ?? 0}명, 최대 ${heat?.maxOccupancy ?? 0}명, 입장 ${heat?.totalEnters ?? 0}회`;
        }).join("\n");

        const transStr = transitions.slice(0, 20).map(t => {
          const fromZ = zones.find(z => z.id === t.fromZoneId)?.name ?? `Zone${t.fromZoneId}`;
          const toZ = zones.find(z => z.id === t.toZoneId)?.name ?? `Zone${t.toZoneId}`;
          return `${fromZ} → ${toZ}: ${t.count}회 (평균 ${t.avgMinutes}분)`;
        }).join("\n");

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `당신은 Data Driven Interior Architecture 전문가입니다. 재실센서 데이터를 분석하여 공간 활용도를 최적화하는 인사이트를 도출합니다. 결과를 JSON으로 반환하세요.`,
            },
            {
              role: "user",
              content: `프로젝트: ${project.name}\n위치: ${project.location ?? "미정"}\n면적: ${project.area ?? "미정"}\n\n구역별 재실 데이터:\n${zoneStats}\n\n동선 패턴 (상위 20개):\n${transStr}\n\n위 데이터를 기반으로:\n1. 비효율 구역 식별 (수용 대비 실제 사용률 낮은 곳)\n2. 과밀 구역 식별 (수용 초과 빈번한 곳)\n3. 동선 병목 구간 분석\n4. 공간 재배치 및 설계 개선 제안\n5. 에너지 절감 방안 (비사용 구역 조명/공조 제어)\n을 분석해주세요.`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "space_optimization_report",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "분석 요약 (3-5문장)" },
                  inefficientZones: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        zoneName: { type: "string" },
                        issue: { type: "string" },
                        suggestion: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                      },
                      required: ["zoneName", "issue", "suggestion", "priority"],
                      additionalProperties: false,
                    },
                  },
                  overcrowdedZones: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        zoneName: { type: "string" },
                        issue: { type: "string" },
                        suggestion: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                      },
                      required: ["zoneName", "issue", "suggestion", "priority"],
                      additionalProperties: false,
                    },
                  },
                  trafficBottlenecks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        path: { type: "string" },
                        issue: { type: "string" },
                        suggestion: { type: "string" },
                      },
                      required: ["path", "issue", "suggestion"],
                      additionalProperties: false,
                    },
                  },
                  designRecommendations: {
                    type: "array",
                    items: { type: "string" },
                  },
                  energySavings: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["summary", "inefficientZones", "overcrowdedZones", "trafficBottlenecks", "designRecommendations", "energySavings"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices?.[0]?.message?.content as string;
        const parsed = JSON.parse(content);

        await createSpaceAnalysis({
          projectId: input.projectId,
          analysisType: "occupancy_pattern",
          summary: parsed.summary,
          dataJson: parsed,
          recommendations: parsed.designRecommendations,
        });

        return parsed;
      }),
  }),

  // ========== CRM ==========
  crm: router({
    stats: adminProcedure.query(async () => {
      return getCrmStats();
    }),

    // --- Clients ---
    listClients: adminProcedure.query(async () => {
      return listCrmClients();
    }),

    getClient: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const client = await getCrmClient(input.id);
        if (!client) throw new TRPCError({ code: "NOT_FOUND" });
        return client;
      }),

    createClient: adminProcedure
      .input(z.object({
        companyName: z.string().min(1),
        contactName: z.string().min(1),
        contactTitle: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        industry: z.string().optional(),
        companySize: z.string().optional(),
        source: z.enum(["website", "referral", "cold_call", "exhibition", "sns", "other"]).optional(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createCrmClient(input);
        return { id };
      }),

    updateClient: adminProcedure
      .input(z.object({
        id: z.number(),
        companyName: z.string().optional(),
        contactName: z.string().optional(),
        contactTitle: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        industry: z.string().optional(),
        companySize: z.string().optional(),
        source: z.enum(["website", "referral", "cold_call", "exhibition", "sns", "other"]).optional(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateCrmClient(id, data);
        return { success: true };
      }),

    deleteClient: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCrmClient(input.id);
        return { success: true };
      }),

    // --- Interactions ---
    listInteractions: adminProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return listCrmInteractions(input.clientId);
      }),

    createInteraction: adminProcedure
      .input(z.object({
        clientId: z.number(),
        type: z.enum(["phone_call", "email", "meeting", "site_visit", "video_call", "kakao", "note"]),
        subject: z.string().min(1),
        content: z.string().optional(),
        outcome: z.string().optional(),
        nextAction: z.string().optional(),
        nextActionDate: z.date().optional(),
        assignedTo: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createCrmInteraction(input);
        await createCrmActivity({
          clientId: input.clientId,
          type: "call_logged",
          title: `${input.type}: ${input.subject}`,
          description: input.content,
          createdBy: input.assignedTo,
        });
        return { id };
      }),

    deleteInteraction: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCrmInteraction(input.id);
        return { success: true };
      }),

    // --- Deals ---
    listDeals: adminProcedure
      .input(z.object({ clientId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return listCrmDeals(input?.clientId);
      }),

    getDeal: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const deal = await getCrmDeal(input.id);
        if (!deal) throw new TRPCError({ code: "NOT_FOUND" });
        return deal;
      }),

    createDeal: adminProcedure
      .input(z.object({
        clientId: z.number(),
        title: z.string().min(1),
        stage: z.enum(["lead", "consultation", "proposal", "negotiation", "contract", "design", "construction", "completed", "lost"]).optional(),
        estimatedValue: z.number().optional(),
        area: z.string().optional(),
        spaceType: z.enum(["office", "commercial", "medical", "education", "residential", "other"]).optional(),
        startDate: z.date().optional(),
        expectedEndDate: z.date().optional(),
        assignedTo: z.string().optional(),
        probability: z.number().min(0).max(100).optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createCrmDeal(input);
        await createCrmActivity({
          clientId: input.clientId,
          dealId: id ?? undefined,
          type: "stage_change",
          title: `새 딜 생성: ${input.title}`,
          description: `단계: ${input.stage || "lead"}`,
          createdBy: input.assignedTo,
        });
        return { id };
      }),

    updateDeal: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        stage: z.enum(["lead", "consultation", "proposal", "negotiation", "contract", "design", "construction", "completed", "lost"]).optional(),
        estimatedValue: z.number().optional(),
        actualValue: z.number().optional(),
        area: z.string().optional(),
        spaceType: z.enum(["office", "commercial", "medical", "education", "residential", "other"]).optional(),
        startDate: z.date().optional(),
        expectedEndDate: z.date().optional(),
        actualEndDate: z.date().optional(),
        assignedTo: z.string().optional(),
        probability: z.number().min(0).max(100).optional(),
        description: z.string().optional(),
        lostReason: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const oldDeal = await getCrmDeal(id);
        await updateCrmDeal(id, data);
        if (input.stage && oldDeal && input.stage !== oldDeal.stage) {
          // 활동 로그 기록
          await createCrmActivity({
            dealId: id,
            clientId: oldDeal.clientId,
            type: "stage_change",
            title: `단계 변경: ${oldDeal.stage} → ${input.stage}`,
            createdBy: input.assignedTo,
          });

          // 단계 변경 오너 알림
          const stageLabels: Record<string, string> = {
            lead: "리드",
            consultation: "상담",
            proposal: "제안",
            negotiation: "협상",
            contract: "계약",
            design: "설계",
            construction: "시공",
            completed: "완료",
            lost: "실주",
          };
          const oldLabel = stageLabels[oldDeal.stage] || oldDeal.stage;
          const newLabel = stageLabels[input.stage] || input.stage;

          // 고객 정보 조회
          let clientName = "알 수 없음";
          try {
            const client = await getCrmClient(oldDeal.clientId);
            if (client) clientName = `${client.companyName} (${client.contactName})`;
          } catch {}

          const valueStr = oldDeal.estimatedValue ? `${oldDeal.estimatedValue.toLocaleString()}만원` : "미정";

          await notifyOwner({
            title: `[CRM] 딜 단계 변경: ${oldLabel} → ${newLabel}`,
            content: `딜: ${oldDeal.title}\n고객: ${clientName}\n단계: ${oldLabel} → ${newLabel}\n예상 금액: ${valueStr}\n담당자: ${input.assignedTo || oldDeal.assignedTo || "-"}`,
          }).catch(() => {});
        }
        return { success: true };
      }),

    deleteDeal: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCrmDeal(input.id);
        return { success: true };
      }),

    // --- Activities ---
    listActivities: adminProcedure
      .input(z.object({
        dealId: z.number().optional(),
        clientId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return listCrmActivities(input || {});
      }),

    createActivity: adminProcedure
      .input(z.object({
        dealId: z.number().optional(),
        clientId: z.number().optional(),
        type: z.enum(["stage_change", "note", "task", "file_upload", "email_sent", "call_logged", "meeting_scheduled"]),
        title: z.string().min(1),
        description: z.string().optional(),
        metadata: z.any().optional(),
        createdBy: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createCrmActivity(input);
        return { id };
      }),
  }),

  // ===== 설계 자동화 시스템 (Design Automation) =====
  designAuto: designAutomationRouter,

  // ===== 고객 셀프서비스 파이프라인 (Client Pipeline) =====
  clientPipeline: clientPipelineRouter,

  // ===== 직원용 프로젝트 관리 대시보드 (OpsX) =====
  ops: opsRouter,

  // ===== E2E 설문 자동화 시스템 =====
  surveyAuto: surveyAutomationRouter,

  // ===== 부동산 매칭 + 프로그램 다이어그램 =====
  realestate: realestateMatchingRouter,

  // ===== 납품사 포털 + 원가 학습 =====
  vendor: vendorPortalRouter,

  // ===== 사후관리 + OpsX Insight 구독 =====
  postOccupancy: postOccupancyRouter,

  // ===== 직원 포털 (일일보고/KPI/OKR) =====
  employee: employeePortalRouter,

  // ===== 팝업 알림 관리 (Popups) =====
  popup: router({
    // 공개: 활성화된 팝업만 반환
    active: publicProcedure.query(async () => {
      return getActivePopups();
    }),
    // 관리자: 전체 목록
    list: adminProcedure.query(async () => {
      return listPopups();
    }),
    // 관리자: 생성
    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        imageUrl: z.string().optional(),
        linkUrl: z.string().optional(),
        linkText: z.string().optional(),
        position: z.enum(["center", "bottom_right", "bottom_left"]).optional(),
        showOnce: z.enum(["yes", "no"]).optional(),
        priority: z.number().optional(),
        startsAt: z.date().optional(),
        endsAt: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        return createPopup({
          title: input.title,
          content: input.content,
          imageUrl: input.imageUrl ?? null,
          linkUrl: input.linkUrl ?? null,
          linkText: input.linkText ?? null,
          position: input.position ?? "center",
          showOnce: input.showOnce ?? "no",
          priority: input.priority ?? 0,
          startsAt: input.startsAt ?? null,
          endsAt: input.endsAt ?? null,
        });
      }),
    // 관리자: 수정
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        imageUrl: z.string().nullable().optional(),
        linkUrl: z.string().nullable().optional(),
        linkText: z.string().nullable().optional(),
        position: z.enum(["center", "bottom_right", "bottom_left"]).optional(),
        showOnce: z.enum(["yes", "no"]).optional(),
        active: z.enum(["yes", "no"]).optional(),
        priority: z.number().optional(),
        startsAt: z.date().nullable().optional(),
        endsAt: z.date().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updatePopup(id, data as any);
      }),
    // 관리자: 삭제
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deletePopup(input.id);
      }),
  }),

  // ===== 관리자 알림 센터 (Notifications) =====
  notification: router({
    // 관리자: 알림 목록
    list: adminProcedure
      .input(z.object({
        unreadOnly: z.boolean().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return listNotifications(input || {});
      }),
    // 관리자: 읽지 않은 알림 수
    unreadCount: adminProcedure.query(async () => {
      return getUnreadNotificationCount();
    }),
    // 관리자: 알림 읽음 처리
    markRead: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return markNotificationRead(input.id);
      }),
    // 관리자: 모두 읽음 처리
    markAllRead: adminProcedure.mutation(async () => {
      return markAllNotificationsRead();
    }),
    // 관리자: 알림 삭제
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteNotification(input.id);
      }),
  }),

  // ===== 인사이트 아티클 =====
  insight: router({
    // 공개: 발행된 아티클 목록
    published: publicProcedure
      .input(z.object({ category: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return getPublishedArticles(input?.category);
      }),
    // 공개: 슬러그로 아티클 조회 + 조회수 증가
    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const article = await getInsightArticleBySlug(input.slug);
        if (!article) throw new TRPCError({ code: "NOT_FOUND", message: "아티클을 찾을 수 없습니다." });
        await incrementArticleViewCount(article.id);
        return article;
      }),
    // 관리자: 전체 아티클 목록
    all: adminProcedure.query(async () => {
      return getAllArticles();
    }),
    // 관리자: 아티클 생성
    create: adminProcedure
      .input(z.object({
        slug: z.string(),
        title: z.string(),
        subtitle: z.string().optional(),
        category: z.enum(["trend", "cost_guide", "case_study", "tip", "news"]),
        excerpt: z.string(),
        content: z.string(),
        coverImageUrl: z.string().optional(),
        author: z.string().optional(),
        readTimeMinutes: z.number().optional(),
        tags: z.array(z.string()).optional(),
        featured: z.boolean().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const data: any = { ...input };
        if (input.status === "published") data.publishedAt = new Date();
        return createInsightArticle(data);
      }),
    // 관리자: 아티클 수정
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        slug: z.string().optional(),
        title: z.string().optional(),
        subtitle: z.string().optional(),
        category: z.enum(["trend", "cost_guide", "case_study", "tip", "news"]).optional(),
        excerpt: z.string().optional(),
        content: z.string().optional(),
        coverImageUrl: z.string().optional(),
        author: z.string().optional(),
        readTimeMinutes: z.number().optional(),
        tags: z.array(z.string()).optional(),
        featured: z.boolean().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        if (data.status === "published") (data as any).publishedAt = new Date();
        return updateInsightArticle(id, data as any);
      }),
    // 관리자: 아티클 삭제
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteInsightArticle(input.id);
      }),
    // 관리자: AI 아티클 자동 생성
    aiGenerate: adminProcedure
      .input(z.object({
        topic: z.string().optional(),
        category: z.enum(["trend", "cost_guide", "case_study", "tip", "news"]).optional(),
        targetAudience: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const category = input.category || "trend";
        const categoryLabels: Record<string, string> = {
          trend: "인테리어 트렌드",
          cost_guide: "비용 가이드",
          case_study: "사례 연구",
          tip: "실용 팁",
          news: "업계 뉴스",
        };
        const catLabel = categoryLabels[category] || "인테리어";
        const audience = input.targetAudience || "사무실 인테리어를 계획 중인 기업 담당자";

        const topicPrompt = input.topic
          ? `주제: ${input.topic}`
          : `${catLabel} 분야에서 ${audience}에게 유용한 최신 주제를 선정해주세요.`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `당신은 고감도 인테리어의 전문 콘텐츠 에디터입니다. 사무실 인테리어, 상업공간 디자인, 공간 최적화 분야의 전문가입니다. B2B 독자를 위한 전문적이면서도 읽기 쉬운 아티클을 작성합니다. 마크다운 형식으로 작성하되, 소제목(##), 불릿 포인트, 강조(**) 등을 활용하여 가독성을 높여주세요. 분량은 1500~2500자 정도로 작성합니다.`,
            },
            {
              role: "user",
              content: `다음 조건으로 인테리어 인사이트 아티클을 작성해주세요.

카테고리: ${catLabel}
대상 독자: ${audience}
${topicPrompt}

반드시 아래 JSON 형식으로 응답해주세요:
{
  "title": "아티클 제목",
  "subtitle": "부제목",
  "excerpt": "2~3문장 요약",
  "content": "마크다운 본문 (1500~2500자)",
  "tags": ["태그1", "태그2", "태그3"],
  "readTimeMinutes": 숫자
}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "article_generation",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", description: "아티클 제목" },
                  subtitle: { type: "string", description: "부제목" },
                  excerpt: { type: "string", description: "2~3문장 요약" },
                  content: { type: "string", description: "마크다운 본문" },
                  tags: { type: "array", items: { type: "string" }, description: "태그 목록" },
                  readTimeMinutes: { type: "integer", description: "예상 읽기 시간(분)" },
                },
                required: ["title", "subtitle", "excerpt", "content", "tags", "readTimeMinutes"],
                additionalProperties: false,
              },
            },
          },
        });

        const parsed = JSON.parse(response.choices[0].message.content || "{}");

        // 슬러그 생성
        const slug = parsed.title
          .toLowerCase()
          .replace(/[^a-z0-9가-힣\s-]/g, "")
          .replace(/\s+/g, "-")
          .slice(0, 80)
          + "-" + Date.now().toString(36);

        // 커버 이미지 생성
        let coverImageUrl: string | undefined;
        try {
          const imgResult = await generateImage({
            prompt: `Professional editorial cover image for an interior design article titled "${parsed.title}". Modern office interior, architectural photography style, warm lighting, high-end commercial space. Minimalist composition with strong visual impact. No text overlay.`,
          });
          coverImageUrl = imgResult.url ?? undefined;
        } catch (err) {
          console.error("[AI Article] Cover image generation failed:", err);
        }

        // DB에 초안으로 저장
        const articleId = await createInsightArticle({
          slug,
          title: parsed.title,
          subtitle: parsed.subtitle,
          category,
          excerpt: parsed.excerpt,
          content: parsed.content,
          coverImageUrl: coverImageUrl || null,
          author: "고감도 AI 에디터",
          readTimeMinutes: parsed.readTimeMinutes || 5,
          tags: parsed.tags || [],
          featured: false,
          status: "draft",
        } as any);

        return {
          id: articleId,
          slug,
          title: parsed.title,
          excerpt: parsed.excerpt,
          category,
          status: "draft",
        };
      }),
  }),

  // ===== 뉴스레터 구독 =====
  newsletter: router({
    // 공개: 구독 신청
    subscribe: publicProcedure
      .input(z.object({
        email: z.string().email(),
        name: z.string().optional(),
        company: z.string().optional(),
        source: z.enum(["website", "contact_form", "manual", "lead_magnet", "estimator", "portfolio", "insight", "ai_chat", "style_quiz"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const existing = await getSubscriberByEmail(input.email);
        if (existing) {
          if (existing.status === "active") {
            return { success: true, message: "이미 구독 중입니다." };
          }
          // 재구독
          await updateNewsletterSubscriber(existing.id, { status: "active", unsubscribedAt: null as any });
          return { success: true, message: "구독이 재활성화되었습니다." };
        }
        const crypto = await import("crypto");
        const token = crypto.randomBytes(32).toString("hex");
        await createNewsletterSubscriber({
          ...input,
          unsubscribeToken: token,
        });
        await notifyOwner({ title: "새 뉴스레터 구독자", content: `${input.email}${input.name ? ` (${input.name})` : ""}${input.company ? ` - ${input.company}` : ""} | 유입: ${input.source || "website"}` });
        return { success: true, message: "구독이 완료되었습니다." };
      }),
    // 공개: 구독 해지
    unsubscribe: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        const result = await unsubscribeByToken(input.token);
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "유효하지 않은 구독 해지 링크입니다." });
        return { success: true, message: "구독이 해지되었습니다." };
      }),
    // 관리자: 구독자 목록 (legacy)
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
    // 관리자: 구독자 목록 (v2)
    subscribers: adminProcedure.query(async () => {
      return getAllNewsletterSubscribers();
    }),
    // 관리자: 활성 구독자 수
    activeCount: adminProcedure.query(async () => {
      const active = await getActiveSubscribers();
      return { count: active.length };
    }),
    // 관리자: 캠페인 목록
    campaigns: adminProcedure.query(async () => {
      return getAllCampaigns();
    }),
    // 관리자: 캠페인 생성
    createCampaign: adminProcedure
      .input(z.object({
        title: z.string(),
        subject: z.string(),
        previewText: z.string().optional(),
        articleIds: z.array(z.number()).optional(),
        customContent: z.string().optional(),
        segmentId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return createNewsletterCampaign(input);
      }),
    // 관리자: 캠페인 수정
    updateCampaign: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        subject: z.string().optional(),
        previewText: z.string().optional(),
        articleIds: z.array(z.number()).optional(),
        customContent: z.string().optional(),
        htmlContent: z.string().optional(),
        status: z.enum(["draft", "scheduled", "sending", "sent", "failed"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateCampaign(id, data as any);
      }),
    // 관리자: 캠페인 발송 (세그먼트 타겟팅 지원)
    sendCampaign: adminProcedure
      .input(z.object({
        campaignId: z.number(),
        origin: z.string(),
      }))
      .mutation(async ({ input }) => {
        const campaign = await getNewsletterCampaign(input.campaignId);
        if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });
        
        // 세그먼트가 설정되어 있으면 해당 세그먼트 구독자만, 아니면 전체 활성 구독자
        let activeSubscribers;
        let segmentName = "전체";
        if (campaign.segmentId) {
          activeSubscribers = await getSubscribersBySegment(campaign.segmentId);
          const seg = await getSegmentById(campaign.segmentId);
          if (seg) segmentName = seg.name;
        } else {
          activeSubscribers = await getActiveSubscribers();
        }
        if (activeSubscribers.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: `${segmentName} 세그먼트에 활성 구독자가 없습니다.` });

        // 아티클 정보 가져오기
        let articleContents: Array<{ title: string; excerpt: string; slug: string; coverImageUrl?: string | null }> = [];
        if (campaign.articleIds && campaign.articleIds.length > 0) {
          for (const aid of campaign.articleIds) {
            const article = await getInsightArticleById(aid);
            if (article) articleContents.push({ title: article.title, excerpt: article.excerpt, slug: article.slug, coverImageUrl: article.coverImageUrl });
          }
        }

        // HTML 이메일 생성
        const htmlContent = generateNewsletterHtml({
          subject: campaign.subject,
          previewText: campaign.previewText || "",
          articles: articleContents,
          customContent: campaign.customContent || "",
          origin: input.origin,
        });

        // 캠페인 상태 업데이트
        await updateCampaign(input.campaignId, {
          status: "sending",
          htmlContent,
          recipientCount: activeSubscribers.length,
        });

        // 발송 (비동기 - 실패해도 에러 안 던짐)
        let sentCount = 0;
        for (const sub of activeSubscribers) {
          try {
            await notifyOwner({
              title: `뉴스레터: ${campaign.subject}`,
              content: `수신자: ${sub.email} | 캠페인: ${campaign.title}`,
            });
            sentCount++;
          } catch (e) {
            console.error(`Newsletter send failed for ${sub.email}:`, e);
          }
        }

        await updateCampaign(input.campaignId, {
          status: "sent",
          sentAt: new Date(),
        });

        return { success: true, sentCount, totalRecipients: activeSubscribers.length };
      }),
    // 관리자: 캠페인 삭제
    deleteCampaign: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteCampaign(input.id);
      }),

    // ===== 세그먼트 관리 =====
    // 관리자: 세그먼트 목록
    segments: adminProcedure.query(async () => {
      return getAllSegments();
    }),
    // 관리자: 세그먼트 생성
    createSegment: adminProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        color: z.string().optional(),
        filterConditions: z.object({
          sources: z.array(z.string()).optional(),
          subscribedAfter: z.string().optional(),
          subscribedBefore: z.string().optional(),
          tags: z.array(z.string()).optional(),
          hasCompany: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        const result = await createSegment(input);
        if (result) {
          await updateSegmentMatchCount(result.id);
        }
        return result;
      }),
    // 관리자: 세그먼트 수정
    updateSegment: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        color: z.string().optional(),
        filterConditions: z.object({
          sources: z.array(z.string()).optional(),
          subscribedAfter: z.string().optional(),
          subscribedBefore: z.string().optional(),
          tags: z.array(z.string()).optional(),
          hasCompany: z.boolean().optional(),
        }).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateSegment(id, data as any);
        await updateSegmentMatchCount(id);
        return { success: true };
      }),
    // 관리자: 세그먼트 삭제
    deleteSegment: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteSegment(input.id);
      }),
    // 관리자: 세그먼트 미리보기 (매칭 구독자 수 + 목록)
    previewSegment: adminProcedure
      .input(z.object({ segmentId: z.number() }))
      .query(async ({ input }) => {
        const subscribers = await getSubscribersBySegment(input.segmentId);
        await updateSegmentMatchCount(input.segmentId);
        return { count: subscribers.length, subscribers: subscribers.slice(0, 20) };
      }),
    // 관리자: 세그먼트 매칭 수 갱신
    refreshSegmentCount: adminProcedure
      .input(z.object({ segmentId: z.number() }))
      .mutation(async ({ input }) => {
        const count = await updateSegmentMatchCount(input.segmentId);
        return { count };
      }),

    // ===== 구독자 태그 관리 =====
    // 관리자: 구독자 태그 조회
    subscriberTags: adminProcedure
      .input(z.object({ subscriberId: z.number() }))
      .query(async ({ input }) => {
        return getSubscriberTags(input.subscriberId);
      }),
    // 관리자: 태그 추가
    addTag: adminProcedure
      .input(z.object({ subscriberId: z.number(), tag: z.string() }))
      .mutation(async ({ input }) => {
        return addSubscriberTag(input.subscriberId, input.tag);
      }),
    // 관리자: 태그 제거
    removeTag: adminProcedure
      .input(z.object({ subscriberId: z.number(), tag: z.string() }))
      .mutation(async ({ input }) => {
        return removeSubscriberTag(input.subscriberId, input.tag);
      }),
    // 관리자: 전체 태그 목록
    allTags: adminProcedure.query(async () => {
      return getAllUniqueTags();
    }),
    // 관리자: 일괄 태그 추가
    bulkAddTag: adminProcedure
      .input(z.object({ subscriberIds: z.array(z.number()), tag: z.string() }))
      .mutation(async ({ input }) => {
        await bulkAddTags(input.subscriberIds, input.tag);
        return { success: true, count: input.subscriberIds.length };
      }),
    // 관리자: 유입 경로별 통계
    sourceStats: adminProcedure.query(async () => {
      const all = await getAllNewsletterSubscribers();
      const stats: Record<string, { total: number; active: number }> = {};
      for (const sub of all) {
        const src = sub.source || "website";
        if (!stats[src]) stats[src] = { total: 0, active: 0 };
        stats[src].total++;
        if (sub.status === "active") stats[src].active++;
      }
      return stats;
    }),
  }),

  // ============================================================
  // 센서 API 키 관리 (관리자용)
  // ============================================================
  sensorApiKeys: router({
    list: adminProcedure.input(z.object({ projectId: z.number() })).query(async ({ input }) => {
      return listSensorApiKeys(input.projectId);
    }),
    create: adminProcedure.input(z.object({
      projectId: z.number(),
      name: z.string().min(1).max(100),
    })).mutation(async ({ input }) => {
      const apiKey = randomBytes(32).toString("hex");
      await createSensorApiKey({ ...input, apiKey });
      return { apiKey, name: input.name };
    }),
    revoke: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await revokeSensorApiKey(input.id);
      return { success: true };
    }),
  }),

  // ============================================================
  // 고객 인증 (회원가입/로그인)
  // ============================================================
  clientAuth: router({
    register: publicProcedure.input(z.object({
      email: z.string().email(),
      password: z.string().min(8).max(100),
      name: z.string().min(1).max(100),
      company: z.string().max(200).optional(),
      phone: z.string().max(20).optional(),
    })).mutation(async ({ input, ctx }) => {
      const existing = await getClientByEmail(input.email);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "이미 등록된 이메일입니다." });
      }
      const passwordHash = await hash(input.password, 12);
      const emailVerifyToken = randomBytes(32).toString("hex");
      const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간
      await createClient({
        email: input.email,
        passwordHash,
        name: input.name,
        company: input.company ?? null,
        phone: input.phone ?? null,
        emailVerifyToken,
        emailVerifyExpires,
        status: "pending", // 이메일 인증 전까지 pending
      });
      // 이메일 인증 메일 발송 (Resend 또는 notifyOwner 폴백)
      const origin = ctx.req?.headers?.origin || ctx.req?.headers?.referer?.replace(/\/$/, "") || "https://gogamdo.com";
      try {
        await sendVerificationEmail({
          email: input.email,
          name: input.name,
          verifyToken: emailVerifyToken,
          origin,
        });
      } catch (emailErr) {
        console.warn("[Register] Email send failed:", emailErr);
        // 이메일 발송 실패해도 회원가입은 진행
      }
      // 관리자에게 신규 회원가입 알림
      try {
        await notifyOwner({
          title: `[고감도] 신규 고객 회원가입: ${input.name}`,
          content: `이메일: ${input.email}\n회사: ${input.company || '-'}\n전화: ${input.phone || '-'}`,
        });
      } catch { /* 알림 실패해도 진행 */ }
      return { success: true, message: "회원가입이 완료되었습니다. 이메일 인증을 완료해주세요.", emailVerifyToken };
    }),

    login: publicProcedure.input(z.object({
      email: z.string().email(),
      password: z.string(),
    })).mutation(async ({ input, ctx }) => {
      const client = await getClientByEmail(input.email);
      if (!client) {
        throw new TRPCError({ code: "NOT_FOUND", message: "이메일 또는 비밀번호가 올바르지 않습니다." });
      }
      if (client.status === "suspended") {
        throw new TRPCError({ code: "FORBIDDEN", message: "계정이 정지되었습니다. 관리자에게 문의하세요." });
      }
      if (client.status === "pending" && client.emailVerified === "no") {
        throw new TRPCError({ code: "FORBIDDEN", message: "EMAIL_NOT_VERIFIED" });
      }
      const valid = await compare(input.password, client.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "이메일 또는 비밀번호가 올바르지 않습니다." });
      }
      // 로그인 시간 업데이트
      await updateClient(client.id, { lastLoginAt: new Date() });
      // JWT 토큰 생성 (클라이언트용)
      const { SignJWT } = await import("jose");
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");
      const token = await new SignJWT({
        clientId: client.id,
        email: client.email,
        name: client.name,
        type: "client",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(secret);
      // 쿠키에 토큰 설정
      ctx.res.cookie("client_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
        path: "/",
      });
      return {
        success: true,
        client: { id: client.id, email: client.email, name: client.name, company: client.company },
      };
    }),

    me: publicProcedure.query(async ({ ctx }) => {
      const token = ctx.req.cookies?.client_token;
      if (!token) return null;
      try {
        const { jwtVerify } = await import("jose");
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");
        const { payload } = await jwtVerify(token, secret);
        if (payload.type !== "client" || !payload.clientId) return null;
        const client = await getClientById(payload.clientId as number);
        if (!client || client.status !== "active") return null;
        return {
          id: client.id,
          email: client.email,
          name: client.name,
          company: client.company,
          phone: client.phone,
          assignedProjectIds: client.assignedProjectIds ?? [],
        };
      } catch {
        return null;
      }
    }),

    logout: publicProcedure.mutation(async ({ ctx }) => {
      ctx.res.clearCookie("client_token", { path: "/" });
      return { success: true };
    }),

    updateProfile: publicProcedure.input(z.object({
      name: z.string().min(1).max(100).optional(),
      company: z.string().max(200).optional(),
      phone: z.string().max(20).optional(),
    })).mutation(async ({ input, ctx }) => {
      const token = ctx.req.cookies?.client_token;
      if (!token) throw new TRPCError({ code: "UNAUTHORIZED" });
      const { jwtVerify } = await import("jose");
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");
      const { payload } = await jwtVerify(token, secret);
      if (payload.type !== "client") throw new TRPCError({ code: "UNAUTHORIZED" });
      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      if (input.company !== undefined) updateData.company = input.company;
      if (input.phone !== undefined) updateData.phone = input.phone;
      await updateClient(payload.clientId as number, updateData);
      return { success: true };
    }),

    changePassword: publicProcedure.input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8).max(100),
    })).mutation(async ({ input, ctx }) => {
      const token = ctx.req.cookies?.client_token;
      if (!token) throw new TRPCError({ code: "UNAUTHORIZED" });
      const { jwtVerify } = await import("jose");
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");
      const { payload } = await jwtVerify(token, secret);
      if (payload.type !== "client") throw new TRPCError({ code: "UNAUTHORIZED" });
      const client = await getClientById(payload.clientId as number);
      if (!client) throw new TRPCError({ code: "NOT_FOUND" });
      const valid = await compare(input.currentPassword, client.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "현재 비밀번호가 올바르지 않습니다." });
      const newHash = await hash(input.newPassword, 12);
      await updateClient(client.id, { passwordHash: newHash });
      return { success: true };
    }),

    verifyEmail: publicProcedure.input(z.object({
      token: z.string(),
    })).mutation(async ({ input }) => {
      const client = await getClientByVerifyToken(input.token);
      if (!client || !client.emailVerifyExpires || client.emailVerifyExpires < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "유효하지 않거나 만료된 인증 토큰입니다." });
      }
      await updateClient(client.id, {
        emailVerified: "yes",
        emailVerifyToken: null,
        emailVerifyExpires: null,
        status: "active",
      });
      return { success: true, message: "이메일 인증이 완료되었습니다. 로그인해주세요." };
    }),

    resendVerification: publicProcedure.input(z.object({
      email: z.string().email(),
    })).mutation(async ({ input, ctx }) => {
      const client = await getClientByEmail(input.email);
      if (!client || client.emailVerified === "yes") {
        return { success: true, message: "인증 메일이 재발송되었습니다." };
      }
      const newToken = randomBytes(32).toString("hex");
      const newExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await updateClient(client.id, {
        emailVerifyToken: newToken,
        emailVerifyExpires: newExpires,
      });
      // 인증 이메일 재발송
      const origin = ctx.req?.headers?.origin || ctx.req?.headers?.referer?.replace(/\/$/, "") || "https://gogamdo.com";
      try {
        await sendVerificationEmail({
          email: client.email,
          name: client.name,
          verifyToken: newToken,
          origin,
        });
      } catch (emailErr) {
        console.warn("[ResendVerification] Email send failed:", emailErr);
      }
      return { success: true, message: "인증 메일이 재발송되었습니다.", emailVerifyToken: newToken };
    }),

    requestPasswordReset: publicProcedure.input(z.object({
      email: z.string().email(),
    })).mutation(async ({ input, ctx }) => {
      const client = await getClientByEmail(input.email);
      if (!client) {
        // 보안상 존재하지 않아도 성공 응답
        return { success: true, message: "비밀번호 재설정 안내가 발송되었습니다." };
      }
      const resetToken = randomBytes(32).toString("hex");
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1시간
      await updateClient(client.id, {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      });
      // 비밀번호 재설정 이메일 발송
      const origin = ctx.req?.headers?.origin || ctx.req?.headers?.referer?.replace(/\/$/, "") || "https://gogamdo.com";
      try {
        await sendPasswordResetEmail({
          email: client.email,
          name: client.name,
          resetToken,
          origin,
        });
      } catch (emailErr) {
        console.warn("[PasswordReset] Email send failed:", emailErr);
      }
      return { success: true, message: "비밀번호 재설정 안내가 발송되었습니다." };
    }),

    resetPassword: publicProcedure.input(z.object({
      token: z.string(),
      newPassword: z.string().min(8).max(100),
    })).mutation(async ({ input }) => {
      const client = await getClientByResetToken(input.token);
      if (!client || !client.passwordResetExpires || client.passwordResetExpires < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "유효하지 않거나 만료된 토큰입니다." });
      }
      const newHash = await hash(input.newPassword, 12);
      await updateClient(client.id, {
        passwordHash: newHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      });
      return { success: true };
    }),
  }),

  // 관리자: 고객 목록 관리
  clientManagement: router({
    list: adminProcedure.query(async () => {
      return listClients();
    }),
    updateStatus: adminProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["active", "suspended", "pending"]),
    })).mutation(async ({ input }) => {
      await updateClient(input.id, { status: input.status });
      return { success: true };
    }),
    assignProjects: adminProcedure.input(z.object({
      clientId: z.number(),
      projectIds: z.array(z.number()),
    })).mutation(async ({ input }) => {
      await updateClient(input.clientId, { assignedProjectIds: input.projectIds });
      return { success: true };
    }),

    // 수동 이메일 인증 처리 (관리자가 직접 인증)
    manualVerify: adminProcedure.input(z.object({
      clientId: z.number(),
    })).mutation(async ({ input }) => {
      const client = await getClientById(input.clientId);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "고객을 찾을 수 없습니다." });
      if (client.emailVerified === "yes") {
        return { success: true, message: "이미 인증된 계정입니다." };
      }
      await updateClient(input.clientId, {
        emailVerified: "yes",
        emailVerifyToken: null,
        emailVerifyExpires: null,
        status: "active",
      });
      return { success: true, message: "이메일 인증이 완료되었습니다." };
    }),

    // 개별 인증 메일 재발송
    resendVerification: adminProcedure.input(z.object({
      clientId: z.number(),
    })).mutation(async ({ input, ctx }) => {
      const client = await getClientById(input.clientId);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "고객을 찾을 수 없습니다." });
      if (client.emailVerified === "yes") {
        return { success: true, message: "이미 인증된 계정입니다." };
      }
      const newToken = randomBytes(32).toString("hex");
      const newExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await updateClient(input.clientId, {
        emailVerifyToken: newToken,
        emailVerifyExpires: newExpires,
      });
      const origin = ctx.req.headers.origin || ctx.req.headers.referer?.replace(/\/$/, "") || `${ctx.req.protocol}://${ctx.req.headers.host}`;
      try {
        await sendVerificationEmail({
          email: client.email,
          name: client.name,
          verifyToken: newToken,
          origin,
        });
      } catch { /* ignore */ }
      return { success: true, message: `${client.email}에 인증 메일을 재발송했습니다.` };
    }),

    // 미인증 고객 일괄 재발송
    bulkResendVerification: adminProcedure.mutation(async ({ ctx }) => {
      const clients = await listClients();
      const unverified = clients.filter(c => c.emailVerified === "no" && c.status === "pending");
      if (unverified.length === 0) {
        return { success: true, count: 0, message: "미인증 고객이 없습니다." };
      }
      const origin = ctx.req.headers.origin || ctx.req.headers.referer?.replace(/\/$/, "") || `${ctx.req.protocol}://${ctx.req.headers.host}`;
      let sentCount = 0;
      for (const client of unverified) {
        const newToken = randomBytes(32).toString("hex");
        const newExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await updateClient(client.id, {
          emailVerifyToken: newToken,
          emailVerifyExpires: newExpires,
        });
        try {
          await sendVerificationEmail({
            email: client.email,
            name: client.name,
            verifyToken: newToken,
            origin,
          });
          sentCount++;
        } catch { /* continue */ }
      }
      return { success: true, count: sentCount, total: unverified.length, message: `${sentCount}건의 인증 메일을 발송했습니다.` };
    }),
  }),

  // ===== 고객 포털 대시보드 =====
  clientDashboard: router({
    // 대시보드 요약 데이터
    overview: publicProcedure.query(async ({ ctx }) => {
      const token = ctx.req.cookies?.client_token;
      if (!token) throw new TRPCError({ code: "UNAUTHORIZED" });
      const { jwtVerify } = await import("jose");
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");
      const { payload } = await jwtVerify(token, secret);
      if (payload.type !== "client" || !payload.clientId) throw new TRPCError({ code: "UNAUTHORIZED" });
      const client = await getClientById(payload.clientId as number);
      if (!client || client.status !== "active") throw new TRPCError({ code: "UNAUTHORIZED" });

      const projectIds = client.assignedProjectIds ?? [];
      const projects = [];
      let totalSensors = 0;
      let activeSensors = 0;

      for (const pid of projectIds) {
        const project = await getSpaceProject(pid);
        if (!project) continue;
        const sensorList = await listSensors(pid);
        const active = sensorList.filter(s => s.active === "yes");
        totalSensors += sensorList.length;
        activeSensors += active.length;

        const latestData = await getSensorLatestData(pid);
        const zones = await listSpaceZones(pid);

        projects.push({
          id: project.id,
          name: project.name,
          location: project.location,
          area: project.area,
          status: project.status,
          sensorCount: sensorList.length,
          activeSensorCount: active.length,
          zoneCount: zones.length,
          latestReadings: latestData.map(d => ({
            sensorName: d.sensor.name,
            sensorType: d.sensor.type,
            zone: d.sensor.zone,
            value: d.latestValue,
            unit: d.sensor.unit,
            recordedAt: d.latestAt,
          })),
        });
      }

      // 견적 이력 (이메일 기준)
      const allEstimates = await listEstimates();
      const myEstimates = allEstimates.filter(e => e.contactEmail === client.email).slice(0, 10);

      return {
        client: { id: client.id, name: client.name, email: client.email, company: client.company },
        summary: {
          projectCount: projects.length,
          totalSensors,
          activeSensors,
        },
        projects,
        recentEstimates: myEstimates.map(e => ({
          id: e.id,
          spaceType: e.spaceType,
          area: e.area,
          grade: e.grade,
          totalMin: e.totalMin,
          totalMax: e.totalMax,
          createdAt: e.createdAt,
        })),
      };
    }),

    // 프로젝트별 센서 데이터 시계열 (차트용)
    sensorTimeSeries: publicProcedure.input(z.object({
      projectId: z.number(),
      sensorId: z.number().optional(),
      period: z.enum(["1d", "7d", "30d"]).default("7d"),
    })).query(async ({ input, ctx }) => {
      const token = ctx.req.cookies?.client_token;
      if (!token) throw new TRPCError({ code: "UNAUTHORIZED" });
      const { jwtVerify } = await import("jose");
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");
      const { payload } = await jwtVerify(token, secret);
      if (payload.type !== "client" || !payload.clientId) throw new TRPCError({ code: "UNAUTHORIZED" });
      const client = await getClientById(payload.clientId as number);
      if (!client || !client.assignedProjectIds?.includes(input.projectId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "접근 권한이 없습니다." });
      }

      const now = new Date();
      const periodMs = input.period === "1d" ? 86400000 : input.period === "7d" ? 604800000 : 2592000000;
      const from = new Date(now.getTime() - periodMs);

      const sensorList = await listSensors(input.projectId);
      const targetSensors = input.sensorId
        ? sensorList.filter(s => s.id === input.sensorId)
        : sensorList;

      const series = [];
      for (const sensor of targetSensors) {
        const data = await getSensorDataRange(sensor.id, from, now);
        series.push({
          sensorId: sensor.id,
          sensorName: sensor.name,
          sensorType: sensor.type,
          zone: sensor.zone,
          unit: sensor.unit,
          data: data.map(d => ({
            value: parseFloat(d.value) || 0,
            recordedAt: d.recordedAt,
          })),
        });
      }

      return { projectId: input.projectId, period: input.period, from, to: now, series };
    }),

    // 구역별 점유율 통계
    zoneStats: publicProcedure.input(z.object({
      projectId: z.number(),
      period: z.enum(["1d", "7d", "30d"]).default("7d"),
    })).query(async ({ input, ctx }) => {
      const token = ctx.req.cookies?.client_token;
      if (!token) throw new TRPCError({ code: "UNAUTHORIZED" });
      const { jwtVerify } = await import("jose");
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");
      const { payload } = await jwtVerify(token, secret);
      if (payload.type !== "client" || !payload.clientId) throw new TRPCError({ code: "UNAUTHORIZED" });
      const client = await getClientById(payload.clientId as number);
      if (!client || !client.assignedProjectIds?.includes(input.projectId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "접근 권한이 없습니다." });
      }

      const now = new Date();
      const periodMs = input.period === "1d" ? 86400000 : input.period === "7d" ? 604800000 : 2592000000;
      const from = new Date(now.getTime() - periodMs);

      const zones = await listSpaceZones(input.projectId);
      const stats = await getZoneOccupancyStats(input.projectId, from, now);
      const heatmap = await getZoneHeatmapData(input.projectId, from, now);

      return { zones, stats, heatmap };
    }),
  }),

  // ===== 사이트 설정 (Site Settings) =====
  settings: router({
    // 공개: 특정 설정값 조회
    get: publicProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        const value = await getSiteSetting(input.key);
        return { key: input.key, value };
      }),
    // 공개: AI 서비스 활성화 여부 조회 (개별 서비스별)
    aiEnabled: publicProcedure.query(async () => {
      const [master, estimator, chat, style, redesign] = await Promise.all([
        getSiteSetting("ai_features_enabled"),
        getSiteSetting("ai_estimator_enabled"),
        getSiteSetting("ai_chat_enabled"),
        getSiteSetting("ai_style_enabled"),
        getSiteSetting("ai_redesign_enabled"),
      ]);
      const masterEnabled = master !== "false"; // 기본값 true
      return {
        enabled: masterEnabled, // 전체 마스터 토글 (하위 서비스 중 하나라도 켜져있으면 true)
        estimator: masterEnabled && estimator !== "false", // 기본값 true
        chat: masterEnabled && chat !== "false",
        style: masterEnabled && style !== "false",
        redesign: masterEnabled && redesign !== "false",
      };
    }),
    // 관리자: 설정값 변경
    set: adminProcedure
      .input(z.object({ key: z.string(), value: z.string(), description: z.string().optional() }))
      .mutation(async ({ input }) => {
        return setSiteSetting(input.key, input.value, input.description);
      }),
    // 관리자: 전체 설정 목록
    list: adminProcedure.query(async () => {
      return listSiteSettings();
    }),
  }),

  // ===== 직원 관리 (Staff Management) =====
  staff: router({
    // 관리자: 전체 직원 목록
    list: adminProcedure.query(async () => {
      return listStaffMembers();
    }),
    // 직원 역할 변경 (master/admin/user)
    // master 역할 부여는 master만 가능, admin 역할 부여는 master만 가능
    updateRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "admin", "master"]) }))
      .mutation(async ({ ctx, input }) => {
        // master 또는 admin 역할 부여는 master만 가능
        if ((input.role === "master" || input.role === "admin") && ctx.user.role !== "master") {
          throw new TRPCError({ code: "FORBIDDEN", message: "마스터만 관리자/마스터 역할을 부여할 수 있습니다." });
        }
        // 자기 자신의 역할은 변경 불가
        if (input.userId === ctx.user.id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "자신의 역할은 변경할 수 없습니다." });
        }
        return updateUserRole(input.userId, input.role);
      }),
    // 관리자: 직원 부서/역할 변경
    updateDepartment: adminProcedure
      .input(z.object({ userId: z.number(), department: z.string(), opsRole: z.string() }))
      .mutation(async ({ input }) => {
        return updateUserDepartment(input.userId, input.department, input.opsRole);
      }),
    // 관리자: 직원 삭제
    delete: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        return deleteUser(input.userId);
      }),
  }),

  // ===== 마스터 전용 기능 =====
  master: router({
    // 시스템 통계 조회
    systemStats: masterProcedure.query(async () => {
      return getSystemStats();
    }),

    // 활동 로그 조회
    activityLogs: masterProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return listActivityLogs(input?.limit ?? 100);
      }),

    // 활동 로그 기록 (내부 사용)
    logActivity: masterProcedure
      .input(z.object({
        action: z.string(),
        target: z.string().optional(),
        details: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const ipAddress = ctx.req?.headers?.["x-forwarded-for"]?.toString()?.split(",")[0]?.trim()
          || ctx.req?.socket?.remoteAddress || "unknown";
        return createActivityLog({
          userId: ctx.user.id,
          userName: ctx.user.name ?? "Unknown",
          action: input.action,
          target: input.target ?? null,
          details: input.details ?? null,
          ipAddress,
        });
      }),

    // 사이트 설정 초기화
    resetSettings: masterProcedure.mutation(async ({ ctx }) => {
      const ipAddress = ctx.req?.headers?.["x-forwarded-for"]?.toString()?.split(",")[0]?.trim()
        || ctx.req?.socket?.remoteAddress || "unknown";
      const result = await resetSiteSettings();
      await createActivityLog({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "Unknown",
        action: "site_settings_reset",
        target: "site_settings",
        details: JSON.stringify({ resetCount: result.resetCount }),
        ipAddress,
      });
      return result;
    }),

    // 전체 사용자 역할 초기화 (master 제외)
    resetRoles: masterProcedure.mutation(async ({ ctx }) => {
      const ipAddress = ctx.req?.headers?.["x-forwarded-for"]?.toString()?.split(",")[0]?.trim()
        || ctx.req?.socket?.remoteAddress || "unknown";
      const result = await resetAllUserRoles();
      await createActivityLog({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "Unknown",
        action: "roles_reset",
        target: "all_users",
        details: "All non-master users reset to 'user' role",
        ipAddress,
      });
      return result;
    }),

    // 전체 설정 목록 조회
    allSettings: masterProcedure.query(async () => {
      return listSiteSettings();
    }),
  }),

  // ===== 삭제 관리 (Deletion Management) =====
  deletion: router({
    // Admin: 단일 소프트 삭제
    softDelete: adminProcedure
      .input(z.object({
        tableName: z.enum(["inquiries", "subscribers", "estimates", "lead_downloads", "chat_sessions", "style_recommendations", "ai_redesigns"]),
        recordId: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return softDeleteRecord(
          input.tableName,
          input.recordId,
          ctx.user.id,
          ctx.user.name ?? "Admin",
          input.reason
        );
      }),

    // Admin: 일괄 소프트 삭제
    bulkSoftDelete: adminProcedure
      .input(z.object({
        tableName: z.enum(["inquiries", "subscribers", "estimates", "lead_downloads", "chat_sessions", "style_recommendations", "ai_redesigns"]),
        recordIds: z.array(z.number()).min(1),
        reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return bulkSoftDeleteRecords(
          input.tableName,
          input.recordIds,
          ctx.user.id,
          ctx.user.name ?? "Admin",
          input.reason
        );
      }),

    // Admin: 삭제 로그 목록 조회
    logs: adminProcedure
      .input(z.object({
        tableName: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return listDeletionLogs(input ?? undefined);
      }),

    // Admin: 삭제된 레코드 복구
    restore: adminProcedure
      .input(z.object({ logId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return restoreDeletedRecord(input.logId, ctx.user.id);
      }),

    // Admin: 삭제 로그 통계
    stats: adminProcedure.query(async () => {
      return getDeletionLogStats();
    }),
  }),

  // ============================================================
  // 직원 가입신청 / 초대 관리
  // ============================================================
  staffManagement: router({
    // 공개: 직원 가입 신청
    submitApplication: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        department: z.enum(["design", "construction", "accounting", "management", "sales", "none"]).optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const existing = await getStaffApplicationByEmail(input.email);
        if (existing && existing.status === "pending") {
          throw new TRPCError({ code: "CONFLICT", message: "이미 가입 신청이 접수되어 있습니다." });
        }
        const result = await createStaffApplication(input);
        return { id: result?.id, message: "가입 신청이 접수되었습니다. 관리자 승인 후 이용 가능합니다." };
      }),

    // Admin: 가입 신청 목록
    listApplications: adminProcedure
      .input(z.object({ status: z.enum(["pending", "approved", "rejected"]).optional() }).optional())
      .query(async ({ input }) => {
        return listStaffApplications(input?.status);
      }),

    // Admin: 가입 신청 승인/거절
    reviewApplication: adminProcedure
      .input(z.object({
        id: z.number(),
        action: z.enum(["approved", "rejected"]),
        rejectReason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const app = await getStaffApplicationById(input.id);
        if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "신청을 찾을 수 없습니다." });
        if (app.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "이미 처리된 신청입니다." });
        await reviewStaffApplication(input.id, input.action, ctx.user.id, input.rejectReason);
        return { success: true, action: input.action };
      }),

    // Admin: 직원 초대 이메일 발송
    invite: adminProcedure
      .input(z.object({
        email: z.string().email(),
        department: z.enum(["design", "construction", "accounting", "management", "sales", "none"]).optional(),
        opsRole: z.enum(["pm", "designer", "site_manager", "accountant", "director", "staff"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7일
        await createStaffInvitation({
          email: input.email,
          invitedByUserId: ctx.user.id,
          token,
          department: input.department ?? "none",
          opsRole: input.opsRole ?? "staff",
          status: "pending",
          expiresAt,
        });
        // TODO: 실제 이메일 발송 연동 (Resend API)
        return { success: true, token, message: `${input.email}로 초대가 발송되었습니다.` };
      }),

    // Admin: 초대 목록
    listInvitations: adminProcedure
      .input(z.object({ status: z.enum(["pending", "accepted", "expired", "cancelled"]).optional() }).optional())
      .query(async ({ input }) => {
        return listStaffInvitations(input?.status);
      }),

    // Admin: 초대 취소
    cancelInvitation: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await cancelStaffInvitation(input.id);
        return { success: true };
      }),

    // Admin: 직원 비활성화 (접근 차단)
    deactivate: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (input.userId === ctx.user.id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "자기 자신은 비활성화할 수 없습니다." });
        }
        await deactivateStaffMember(input.userId);
        return { success: true };
      }),

    // 공개: 초대 토큰 확인
    verifyInvitation: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const inv = await getStaffInvitationByToken(input.token);
        if (!inv) return { valid: false, message: "유효하지 않은 초대입니다." };
        if (inv.status !== "pending") return { valid: false, message: "이미 처리된 초대입니다." };
        if (new Date() > inv.expiresAt) return { valid: false, message: "만료된 초대입니다." };
        return { valid: true, email: inv.email, department: inv.department, opsRole: inv.opsRole };
      }),
  }),

  // ============================================================
  // 현장 카메라 관리
  // ============================================================
  camera: router({
    // 카메라 목록
    list: protectedProcedure
      .input(z.object({ projectId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return listCameras(input?.projectId);
      }),

    // 카메라 등록
    create: adminProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string().min(1),
        location: z.string().optional(),
        streamUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await createCamera(input);
        return { id: result?.id };
      }),

    // 카메라 수정
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        location: z.string().optional(),
        streamUrl: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        isOnline: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateCamera(id, data);
        return { success: true };
      }),

    // 카메라 삭제
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCamera(input.id);
        return { success: true };
      }),

    // 카메라 이벤트 로그
    events: protectedProcedure
      .input(z.object({ cameraId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return listCameraEvents(input.cameraId, input.limit);
      }),

    // 카메라 이벤트 기록 (외부 시스템 연동용)
    recordEvent: protectedProcedure
      .input(z.object({
        cameraId: z.number(),
        eventType: z.enum(["online", "offline", "snapshot", "motion", "error"]),
        message: z.string().optional(),
        snapshotUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await createCameraEvent(input);
        // 카메라 온라인/오프라인 상태 업데이트
        if (input.eventType === "online") {
          await updateCamera(input.cameraId, { isOnline: 1, lastOnlineAt: new Date() });
        } else if (input.eventType === "offline") {
          await updateCamera(input.cameraId, { isOnline: 0 });
        } else if (input.eventType === "snapshot" && input.snapshotUrl) {
          await updateCamera(input.cameraId, { thumbnailUrl: input.snapshotUrl });
        }
        return { id: result?.id };
      }),
  }),
});

// 뉴스레터 HTML 생성 헬퍼
function generateNewsletterHtml(opts: {
  subject: string;
  previewText: string;
  articles: Array<{ title: string; excerpt: string; slug: string; coverImageUrl?: string | null }>;
  customContent: string;
  origin: string;
}) {
  const articleCards = opts.articles.map(a => `
    <tr><td style="padding:20px 0;border-bottom:1px solid #eee;">
      <h3 style="margin:0 0 8px;font-size:18px;color:#1a1a1a;"><a href="${opts.origin}/insights/${a.slug}" style="color:#1a1a1a;text-decoration:none;">${a.title}</a></h3>
      <p style="margin:0;color:#666;font-size:14px;line-height:1.6;">${a.excerpt}</p>
      <a href="${opts.origin}/insights/${a.slug}" style="display:inline-block;margin-top:12px;color:#b8860b;font-size:13px;font-weight:600;text-decoration:none;">자세히 읽기 →</a>
    </td></tr>
  `).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="padding:32px;background:#1a1a1a;text-align:center;">
    <h1 style="margin:0;color:#b8860b;font-size:24px;letter-spacing:2px;">고감도</h1>
    <p style="margin:8px 0 0;color:#999;font-size:12px;letter-spacing:1px;">GOGAMDO INTERIOR</p>
  </div>
  <div style="padding:32px;">
    <h2 style="margin:0 0 24px;font-size:22px;color:#1a1a1a;">${opts.subject}</h2>
    ${opts.customContent ? `<div style="margin-bottom:24px;color:#333;font-size:15px;line-height:1.7;">${opts.customContent}</div>` : ""}
    ${articleCards ? `<table width="100%" cellpadding="0" cellspacing="0">${articleCards}</table>` : ""}
    <div style="margin-top:32px;text-align:center;">
      <a href="${opts.origin}/insights" style="display:inline-block;padding:12px 32px;background:#b8860b;color:#fff;text-decoration:none;font-weight:600;font-size:14px;">더 많은 인사이트 보기</a>
    </div>
  </div>
  <div style="padding:24px 32px;background:#f5f5f0;text-align:center;">
    <p style="margin:0;color:#999;font-size:12px;">© 2026 (주)고감도. All rights reserved.</p>
    <p style="margin:8px 0 0;color:#999;font-size:11px;">이 메일은 고감도 뉴스레터를 구독하신 분께 발송됩니다.</p>
  </div>
</div>
</body></html>`;
}

export type AppRouter = typeof appRouter;
