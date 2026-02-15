import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";
import { storagePut } from "../storage";
import { getCalendarEvents } from "../db/calendar";
import { invokeLLM } from "../_core/llm";
import {
  listStaffMembers, updateUserDepartment, updateUserRole, getUserById,
  createPortfolioDraft, createPortfolioReview, getPortfolioDraft,
} from "../db";
import { sendReviewRequestEmail } from "../email";
import {
  createOpsProject, listOpsProjects, getOpsProject, updateOpsProject, deleteOpsProject,
  createScheduleItem, listScheduleItems, updateScheduleItem, deleteScheduleItem,
  createWorkReport, listWorkReports, getWorkReport, updateWorkReport, deleteWorkReport,
  createMeetingNote, listMeetingNotes, getMeetingNote, updateMeetingNote, deleteMeetingNote,
  createApprovalLine, listApprovalLines, getApprovalLine, updateApprovalLine, deleteApprovalLine,
  createExpense, listExpenses, getExpense, updateExpense, deleteExpense,
  createApprovalStep, listApprovalSteps, updateApprovalStep,
  createSubcontractor, listSubcontractors, getSubcontractor, updateSubcontractor, deleteSubcontractor,
  createSubInvite, getSubInviteByToken, listSubInvites,
  createSubQuote, listSubQuotes, getSubQuote, updateSubQuote,
  createSubWorkReport, listSubWorkReports, updateSubWorkReport,
  createOpsEstimate, listOpsEstimates, getOpsEstimate, updateOpsEstimate,
  createOpsContract, listOpsContracts, getOpsContract, updateOpsContract,
  createCostItem, listCostItems, updateCostItem, deleteCostItem,
  createClientInvite, getClientInviteByToken, listClientInvites, updateClientInvite,
  createCamera, listCameras, updateCamera, deleteCamera,
  getOpsStats,
  createNotification, listNotifications, getUnreadNotificationCount,
  markNotificationRead, markAllNotificationsRead, notifyAdminsAndPMs,
  getMonthlyExpenseTrend, getProjectStatusDistribution,
  getProjectCostExecution, getProjectScheduleProgress, getExpenseCategoryDistribution,
  createSubEvaluation, listSubEvaluations, listSubEvaluationsBySubcontractor,
  getSubEvaluationSummary, deleteSubEvaluation,
} from "../db/ops";

function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, "0")).join("");
}

// Admin check middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "관리자 권한이 필요합니다." });
  return next({ ctx });
});
// Staff or admin check - department 배정된 직원 또는 admin
const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
  const u = ctx.user as any;
  // admin은 항상 접근 가능
  if (u.role === "admin") return next({ ctx });
  // department가 배정된 직원만 접근 (none은 미배정)
  if (u.department && u.department !== "none") return next({ ctx });
  throw new TRPCError({ code: "FORBIDDEN", message: "부서 배정이 필요합니다. 관리자에게 문의하세요." });
});

// Department-specific procedure factories
function deptProcedure(allowedDepts: string[]) {
  return staffProcedure.use(({ ctx, next }) => {
    const u = ctx.user as any;
    if (u.role === "admin") return next({ ctx });
    if (allowedDepts.includes(u.department)) return next({ ctx });
    throw new TRPCError({ code: "FORBIDDEN", message: `이 기능은 ${allowedDepts.join(", ")} 부서만 접근 가능합니다.` });
  });
}

// 부서별 프로시저
const accountingProcedure = deptProcedure(["accounting", "management"]); // 경리부/경영지원
const constructionProcedure = deptProcedure(["construction", "design"]); // 시공팀/설계팀
const designProcedure = deptProcedure(["design"]); // 설계팀만;

export const opsRouter = router({
  // ============ STATS ============
  stats: staffProcedure.query(async () => {
    return getOpsStats();
  }),
  // ============ CHART STATISTICS ============
  charts: router({
    monthlyExpense: staffProcedure.query(async () => {
      return getMonthlyExpenseTrend();
    }),
    projectStatus: staffProcedure.query(async () => {
      return getProjectStatusDistribution();
    }),
    costExecution: staffProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return getProjectCostExecution(input.projectId);
      }),
    scheduleProgress: staffProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return getProjectScheduleProgress(input.projectId);
      }),
    expenseCategory: staffProcedure
      .input(z.object({ projectId: z.number().optional() }))
      .query(async ({ input }) => {
        return getExpenseCategoryDistribution(input.projectId);
      }),
  }),

  // ============ PROJECTS ============
  project: router({
    list: staffProcedure.query(async () => {
      return listOpsProjects();
    }),

    get: staffProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const p = await getOpsProject(input.id);
        if (!p) throw new TRPCError({ code: "NOT_FOUND" });
        return p;
      }),

    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        code: z.string().min(1),
        clientName: z.string().min(1),
        clientContact: z.string().optional(),
        clientEmail: z.string().optional(),
        clientPhone: z.string().optional(),
        siteAddress: z.string().optional(),
        totalArea: z.string().optional(),
        contractAmount: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: z.enum(["planning", "designing", "permit", "construction", "inspection", "completed", "warranty", "closed"]).optional(),
        managerId: z.number().optional(),
        teamMembers: z.array(z.number()).optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await createOpsProject(input as any);
        if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return { id: result.id };
      }),

    update: staffProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        code: z.string().optional(),
        clientName: z.string().optional(),
        clientContact: z.string().optional(),
        clientEmail: z.string().optional(),
        clientPhone: z.string().optional(),
        siteAddress: z.string().optional(),
        totalArea: z.string().optional(),
        contractAmount: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: z.enum(["planning", "designing", "permit", "construction", "inspection", "completed", "warranty", "closed"]).optional(),
        managerId: z.number().optional(),
        teamMembers: z.array(z.number()).optional(),
        description: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;

        // 상태 변경 전 기존 프로젝트 정보 조회
        let previousProject: any = null;
        if (data.status === "completed") {
          previousProject = await getOpsProject(id);
        }

        await updateOpsProject(id, data as any);

        // === 프로젝트 완료 시 자동화 트리거 ===
        if (data.status === "completed" && previousProject && previousProject.status !== "completed") {
          const project = previousProject;

          // 1) 자동 포트폴리오 초안 생성
          try {
            const aiResult = await invokeLLM({
              messages: [
                {
                  role: "system",
                  content: "당신은 인테리어 회사의 포트폴리오 작성 전문가입니다. 주어진 프로젝트 정보로 포트폴리오 설명문을 작성해주세요. 3~5문장으로 간결하게, 프로젝트의 핵심 가치와 특징을 강조해주세요."
                },
                {
                  role: "user",
                  content: `프로젝트명: ${project.name}\n고객사: ${project.clientName}\n위치: ${project.siteAddress || "미지정"}\n면적: ${project.totalArea || "미지정"}㎡\n기간: ${project.startDate || ""} ~ ${project.endDate || ""}\n설명: ${project.description || "없음"}`
                }
              ],
            });

            const aiDescription = aiResult?.choices?.[0]?.message?.content || "";

            // 카테고리 추론
            const categoryMap: Record<string, string> = {
              "사무": "사무공간", "사무실": "사무공간", "오피스": "사무공간",
              "상업": "상업공간", "매장": "상업공간", "식당": "상업공간", "카페": "상업공간",
              "주거": "주거공간", "아파트": "주거공간", "주택": "주거공간",
              "공장": "산업시설", "창고": "산업시설",
            };
            let category = "사무공간";
            const nameDesc = `${project.name} ${project.description || ""}`;
            for (const [keyword, cat] of Object.entries(categoryMap)) {
              if (nameDesc.includes(keyword)) { category = cat; break; }
            }

            // 태그 생성
            const tags = ["인테리어", category];
            if (project.totalArea && Number(project.totalArea) > 300) tags.push("대형프로젝트");
            if (project.siteAddress?.includes("서울")) tags.push("서울");

            const draftResult = await createPortfolioDraft({
              title: `${project.clientName} ${category} 프로젝트`,
              projectName: project.name,
              category,
              client: project.clientName,
              area: project.totalArea ? `${project.totalArea}㎡` : undefined,
              location: project.siteAddress || undefined,
              duration: project.startDate && project.endDate
                ? `${project.startDate} ~ ${project.endDate}`
                : undefined,
              description: `${project.name} - ${project.clientName} ${category} 프로젝트`,
              aiDescription,
              tags,
              status: "draft",
            });

            const portfolioId = draftResult?.id;

            // 2) 자동 리뷰 요청 발송 (고객 이메일이 있는 경우)
            if (portfolioId && project.clientEmail) {
              try {
                const crypto = await import("crypto");
                const token = crypto.randomBytes(32).toString("hex");
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 30);

                await createPortfolioReview({
                  portfolioId,
                  reviewerName: project.clientContact || project.clientName,
                  reviewerEmail: project.clientEmail,
                  reviewerCompany: project.clientName,
                  accessToken: token,
                  tokenExpiresAt: expiresAt,
                  status: "pending",
                });

                await sendReviewRequestEmail({
                  reviewerName: project.clientContact || project.clientName,
                  reviewerEmail: project.clientEmail,
                  reviewerCompany: project.clientName,
                  projectTitle: project.name,
                  reviewUrl: `https://kokamdo.co.kr/review/${token}`,
                  expiresAt,
                });

                await notifyOwner({
                  title: "프로젝트 완료 → 리뷰 요청 자동 발송",
                  content: `프로젝트 "${project.name}"이 완료되어 ${project.clientEmail}로 리뷰 요청이 자동 발송되었습니다.`,
                });
              } catch (reviewError) {
                console.error("자동 리뷰 요청 실패:", reviewError);
              }
            }

            // 오너 알림 - 포트폴리오 초안 생성
            await notifyOwner({
              title: "프로젝트 완료 → 포트폴리오 초안 자동 생성",
              content: `프로젝트 "${project.name}"이 완료되어 포트폴리오 초안이 자동 생성되었습니다. 관리자 대시보드에서 확인해주세요.`,
            });

            // OpsX 내부 알림
            await notifyAdminsAndPMs({
              projectId: id,
              type: "system",
              title: "프로젝트 완료 자동화 실행",
              message: `"${project.name}" 프로젝트가 완료되어 포트폴리오 초안이 생성되었습니다.${project.clientEmail ? " 리뷰 요청도 자동 발송되었습니다." : " (고객 이메일 미등록으로 리뷰 요청은 수동 처리 필요)"}`,
            });
          } catch (autoError) {
            console.error("프로젝트 완료 자동화 실패:", autoError);
          }
        }

        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteOpsProject(input.id);
        return { success: true };
      }),
  }),

  // ============ SCHEDULE ============
  schedule: router({
    list: staffProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return listScheduleItems(input.projectId);
      }),

    create: staffProcedure
      .input(z.object({
        projectId: z.number(),
        parentId: z.number().optional(),
        name: z.string().min(1),
        category: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        progress: z.number().min(0).max(100).optional(),
        status: z.enum(["not_started", "in_progress", "delayed", "completed", "on_hold"]).optional(),
        assignedTo: z.string().optional(),
        subcontractorId: z.number().optional(),
        sortOrder: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await createScheduleItem(input as any);
        if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return { id: result.id };
      }),

    update: staffProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        category: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        progress: z.number().min(0).max(100).optional(),
        status: z.enum(["not_started", "in_progress", "delayed", "completed", "on_hold"]).optional(),
        assignedTo: z.string().optional(),
        subcontractorId: z.number().optional(),
        sortOrder: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateScheduleItem(id, data as any);
        return { success: true };
      }),

    delete: staffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteScheduleItem(input.id);
        return { success: true };
      }),
  }),

  // ============ WORK REPORTS ============
  workReport: router({
    list: staffProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return listWorkReports(input.projectId);
      }),

    get: staffProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const r = await getWorkReport(input.id);
        if (!r) throw new TRPCError({ code: "NOT_FOUND" });
        return r;
      }),

    create: staffProcedure
      .input(z.object({
        projectId: z.number(),
        reportDate: z.string(),
        reportType: z.enum(["daily", "weekly", "special"]).optional(),
        title: z.string().min(1),
        content: z.string().min(1),
        weatherCondition: z.string().optional(),
        workersCount: z.number().optional(),
        safetyIssues: z.string().optional(),
        photoUrls: z.array(z.string()).optional(),
        attachmentUrls: z.array(z.string()).optional(),
        status: z.enum(["draft", "submitted", "reviewed"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await createWorkReport({
          ...input,
          authorId: ctx.user.id,
          authorName: ctx.user.name ?? undefined,
        } as any);
        if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return { id: result.id };
      }),

    update: staffProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        weatherCondition: z.string().optional(),
        workersCount: z.number().optional(),
        safetyIssues: z.string().optional(),
        photoUrls: z.array(z.string()).optional(),
        attachmentUrls: z.array(z.string()).optional(),
        status: z.enum(["draft", "submitted", "reviewed"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateWorkReport(id, data as any);
        return { success: true };
      }),

    delete: staffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteWorkReport(input.id);
        return { success: true };
      }),
  }),

  // ============ MEETING NOTES ============
  meetingNote: router({
    list: staffProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return listMeetingNotes(input.projectId);
      }),

    get: staffProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const n = await getMeetingNote(input.id);
        if (!n) throw new TRPCError({ code: "NOT_FOUND" });
        return n;
      }),

    create: staffProcedure
      .input(z.object({
        projectId: z.number(),
        title: z.string().min(1),
        meetingDate: z.string(),
        meetingTime: z.string().optional(),
        location: z.string().optional(),
        meetingType: z.enum(["internal", "client", "subcontractor", "inspection"]).optional(),
        attendees: z.array(z.object({
          name: z.string(),
          role: z.string().optional(),
          company: z.string().optional(),
        })).optional(),
        agenda: z.string().optional(),
        content: z.string().min(1),
        decisions: z.array(z.string()).optional(),
        actionItems: z.array(z.object({
          task: z.string(),
          assignee: z.string(),
          dueDate: z.string().optional(),
        })).optional(),
        attachmentUrls: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await createMeetingNote({
          ...input,
          authorId: ctx.user.id,
        } as any);
        if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return { id: result.id };
      }),

    update: staffProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        meetingDate: z.string().optional(),
        meetingTime: z.string().optional(),
        location: z.string().optional(),
        meetingType: z.enum(["internal", "client", "subcontractor", "inspection"]).optional(),
        attendees: z.array(z.object({
          name: z.string(),
          role: z.string().optional(),
          company: z.string().optional(),
        })).optional(),
        agenda: z.string().optional(),
        content: z.string().optional(),
        decisions: z.array(z.string()).optional(),
        actionItems: z.array(z.object({
          task: z.string(),
          assignee: z.string(),
          dueDate: z.string().optional(),
        })).optional(),
        attachmentUrls: z.array(z.string()).optional(),
        status: z.enum(["draft", "finalized"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateMeetingNote(id, data as any);
        return { success: true };
      }),

    delete: staffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteMeetingNote(input.id);
        return { success: true };
      }),
  }),

  // ============ APPROVAL LINES ============
  approvalLine: router({
    list: staffProcedure.query(async () => {
      return listApprovalLines();
    }),

    get: staffProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const l = await getApprovalLine(input.id);
        if (!l) throw new TRPCError({ code: "NOT_FOUND" });
        return l;
      }),

    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        documentType: z.enum(["expense", "contract", "estimate", "general"]).optional(),
        steps: z.array(z.object({
          stepOrder: z.number(),
          approverType: z.string(),
          approverId: z.number().optional(),
          approverRole: z.string().optional(),
          approverName: z.string(),
          isRequired: z.boolean(),
        })),
        isDefault: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await createApprovalLine(input as any);
        if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return { id: result.id };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        documentType: z.enum(["expense", "contract", "estimate", "general"]).optional(),
        steps: z.array(z.object({
          stepOrder: z.number(),
          approverType: z.string(),
          approverId: z.number().optional(),
          approverRole: z.string().optional(),
          approverName: z.string(),
          isRequired: z.boolean(),
        })).optional(),
        isDefault: z.number().optional(),
        isActive: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateApprovalLine(id, data as any);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteApprovalLine(input.id);
        return { success: true };
      }),
  }),

  // ============ EXPENSES ============
  expense: router({
    list: staffProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return listExpenses(input.projectId);
      }),

    get: staffProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const e = await getExpense(input.id);
        if (!e) throw new TRPCError({ code: "NOT_FOUND" });
        return e;
      }),

    create: staffProcedure
      .input(z.object({
        projectId: z.number(),
        approvalLineId: z.number().optional(),
        title: z.string().min(1),
        category: z.enum(["material", "labor", "subcontract", "equipment", "transportation", "utility", "office", "meal", "other"]).optional(),
        items: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          amount: z.number(),
          remarks: z.string().optional(),
        })),
        totalAmount: z.string(),
        paymentMethod: z.enum(["bank_transfer", "card", "cash", "check"]).optional(),
        payeeName: z.string().optional(),
        payeeBank: z.string().optional(),
        payeeAccount: z.string().optional(),
        receiptUrls: z.array(z.string()).optional(),
        attachmentUrls: z.array(z.string()).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Auto-generate expense number
        const now = new Date();
        const expenseNumber = `EXP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getTime()).slice(-4)}`;
        
        const result = await createExpense({
          ...input,
          expenseNumber,
          authorId: ctx.user.id,
        } as any);
        if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // If approval line is set, create approval steps
        if (input.approvalLineId) {
          const line = await getApprovalLine(input.approvalLineId);
          if (line?.steps) {
            for (const step of line.steps) {
              await createApprovalStep({
                documentType: "expense",
                documentId: result.id,
                stepOrder: step.stepOrder,
                approverId: step.approverId ?? ctx.user.id,
                approverName: step.approverName,
              });
            }
          }
        }

        return { id: result.id, expenseNumber };
      }),

    update: staffProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        category: z.enum(["material", "labor", "subcontract", "equipment", "transportation", "utility", "office", "meal", "other"]).optional(),
        items: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          amount: z.number(),
          remarks: z.string().optional(),
        })).optional(),
        totalAmount: z.string().optional(),
        paymentMethod: z.enum(["bank_transfer", "card", "cash", "check"]).optional(),
        payeeName: z.string().optional(),
        payeeBank: z.string().optional(),
        payeeAccount: z.string().optional(),
        receiptUrls: z.array(z.string()).optional(),
        notes: z.string().optional(),
        status: z.enum(["draft", "submitted", "in_review", "approved", "rejected", "paid"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateExpense(id, data as any);
        return { success: true };
      }),

    submit: staffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await updateExpense(input.id, { status: "submitted", submittedAt: new Date() } as any);
        await notifyOwner({ title: "지출결의서 상신", content: `지출결의서 #${input.id}가 상신되었습니다.` });
        // 관리자/PM에게 알림
        await notifyAdminsAndPMs({
          type: "expense_submitted",
          title: "지출결의서 상신",
          message: `지출결의서 #${input.id}가 상신되었습니다. 결재가 필요합니다.`,
          link: `/ops/project/${(await getExpense(input.id))?.projectId}?tab=expenses`,
        });
        return { success: true };
      }),

    approve: adminProcedure
      .input(z.object({ id: z.number(), comment: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const expense = await getExpense(input.id);
        await updateExpense(input.id, { status: "approved", approvedAt: new Date() } as any);
        // Update approval steps
        const steps = await listApprovalSteps("expense", input.id);
        for (const step of steps) {
          if (step.approverId === ctx.user.id && step.status === "pending") {
            await updateApprovalStep(step.id, {
              status: "approved",
              comment: input.comment ?? null,
              actionAt: new Date(),
            });
            break;
          }
        }
        // 작성자에게 승인 알림
        if (expense?.authorId) {
          await createNotification({
            recipientId: expense.authorId,
            type: "expense_approved",
            title: "지출결의서 승인",
            message: `지출결의서 "${expense.title}"이 승인되었습니다.`,
            link: `/ops/project/${expense.projectId}?tab=expenses`,
            projectId: expense.projectId,
          });
        }
        return { success: true };
      }),

    reject: adminProcedure
      .input(z.object({ id: z.number(), comment: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const rejExpense = await getExpense(input.id);
        await updateExpense(input.id, { status: "rejected" } as any);
        const rejSteps = await listApprovalSteps("expense", input.id);
        for (const step of rejSteps) {
          if (step.approverId === ctx.user.id && step.status === "pending") {
            await updateApprovalStep(step.id, {
              status: "rejected",
              comment: input.comment ?? null,
              actionAt: new Date(),
            });
            break;
          }
        }
        // 작성자에게 반려 알림
        if (rejExpense?.authorId) {
          await createNotification({
            recipientId: rejExpense.authorId,
            type: "expense_rejected",
            title: "지출결의서 반려",
            message: `지출결의서 "${rejExpense.title}"이 반려되었습니다.${input.comment ? ` 사유: ${input.comment}` : ""}`,
            link: `/ops/project/${rejExpense.projectId}?tab=expenses`,
            projectId: rejExpense.projectId,
          });
        }
        return { success: true };
      }),

    markPaid: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await updateExpense(input.id, { status: "paid", paidAt: new Date() } as any);
        return { success: true };
      }),

    delete: staffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteExpense(input.id);
        return { success: true };
      }),

    approvalSteps: staffProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return listApprovalSteps("expense", input.id);
      }),
  }),

  // ============ SUBCONTRACTORS ============
  subcontractor: router({
    list: staffProcedure.query(async () => {
      return listSubcontractors();
    }),

    get: staffProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const s = await getSubcontractor(input.id);
        if (!s) throw new TRPCError({ code: "NOT_FOUND" });
        return s;
      }),

    create: staffProcedure
      .input(z.object({
        companyName: z.string().min(1),
        businessNumber: z.string().optional(),
        representativeName: z.string().optional(),
        contactName: z.string().optional(),
        contactPhone: z.string().optional(),
        contactEmail: z.string().optional(),
        specialty: z.string().optional(),
        bankName: z.string().optional(),
        bankAccount: z.string().optional(),
        bankHolder: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await createSubcontractor(input as any);
        if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return { id: result.id };
      }),

    update: staffProcedure
      .input(z.object({
        id: z.number(),
        companyName: z.string().optional(),
        businessNumber: z.string().optional(),
        representativeName: z.string().optional(),
        contactName: z.string().optional(),
        contactPhone: z.string().optional(),
        contactEmail: z.string().optional(),
        specialty: z.string().optional(),
        bankName: z.string().optional(),
        bankAccount: z.string().optional(),
        bankHolder: z.string().optional(),
        rating: z.number().optional(),
        notes: z.string().optional(),
        isActive: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateSubcontractor(id, data as any);
        return { success: true };
      }),

    delete: staffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteSubcontractor(input.id);
        return { success: true };
      }),

    // Invite subcontractor to project
    invite: staffProcedure
      .input(z.object({
        projectId: z.number(),
        subcontractorId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const token = generateToken();
        const result = await createSubInvite({
          ...input,
          token,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일
        });
        if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return { token };
      }),

    invites: staffProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return listSubInvites(input.projectId);
      }),
  }),

  // ============ SUB PORTAL (Token-based, public) ============
  subPortal: router({
    // Validate token and get project info
    validate: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const invite = await getSubInviteByToken(input.token);
        if (!invite || !invite.isActive) throw new TRPCError({ code: "NOT_FOUND", message: "유효하지 않은 초대입니다." });
        if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
          throw new TRPCError({ code: "FORBIDDEN", message: "초대가 만료되었습니다." });
        }
        const project = await getOpsProject(invite.projectId);
        const sub = await getSubcontractor(invite.subcontractorId);
        return { project, subcontractor: sub };
      }),

    // Submit quote
    submitQuote: publicProcedure
      .input(z.object({
        token: z.string(),
        title: z.string().min(1),
        items: z.array(z.object({
          category: z.string(),
          item: z.string(),
          specification: z.string(),
          unit: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          amount: z.number(),
          remarks: z.string().optional(),
        })).optional(),
        totalAmount: z.string().optional(),
        fileUrl: z.string().optional(),
        fileKey: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const invite = await getSubInviteByToken(input.token);
        if (!invite || !invite.isActive) throw new TRPCError({ code: "NOT_FOUND" });
        
        const result = await createSubQuote({
          projectId: invite.projectId,
          subcontractorId: invite.subcontractorId,
          title: input.title,
          items: input.items,
          totalAmount: input.totalAmount,
          fileUrl: input.fileUrl,
          fileKey: input.fileKey,
          notes: input.notes,
        } as any);
        if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        await notifyOwner({ title: "하도급 견적 제출", content: `프로젝트에 새 견적이 제출되었습니다.` });
        await notifyAdminsAndPMs({
          type: "sub_quote_submitted",
          title: "하도급 견적 제출",
          message: `프로젝트에 새 하도급 견적이 제출되었습니다. 확인이 필요합니다.`,
          link: `/ops/project/${invite.projectId}?tab=subcontractors`,
          projectId: invite.projectId,
        });
        return { id: result.id };
      }),

    // Submit work report
    submitWorkReport: publicProcedure
      .input(z.object({
        token: z.string(),
        reportDate: z.string(),
        workDescription: z.string().min(1),
        workersCount: z.number().optional(),
        materialsUsed: z.string().optional(),
        photoUrls: z.array(z.string()).optional(),
        issues: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const invite = await getSubInviteByToken(input.token);
        if (!invite || !invite.isActive) throw new TRPCError({ code: "NOT_FOUND" });
        
        const result = await createSubWorkReport({
          projectId: invite.projectId,
          subcontractorId: invite.subcontractorId,
          reportDate: input.reportDate,
          workDescription: input.workDescription,
          workersCount: input.workersCount,
          materialsUsed: input.materialsUsed,
          photoUrls: input.photoUrls,
          issues: input.issues,
        } as any);
        if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await notifyAdminsAndPMs({
          type: "sub_report_submitted",
          title: "하도급 작업보고 제출",
          message: `프로젝트에 새 하도급 작업보고가 제출되었습니다.`,
          link: `/ops/project/${invite.projectId}?tab=subcontractors`,
          projectId: invite.projectId,
        });
        return { id: result.id };
      }),

    // List own quotes
    quotes: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const invite = await getSubInviteByToken(input.token);
        if (!invite || !invite.isActive) return [];
        return listSubQuotes(invite.projectId);
      }),

    // List own work reports
    workReports: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const invite = await getSubInviteByToken(input.token);
        if (!invite || !invite.isActive) return [];
        return listSubWorkReports(invite.projectId);
      }),

    // List project schedules for subcontractor
    schedules: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const invite = await getSubInviteByToken(input.token);
        if (!invite || !invite.isActive) return [];
        return listScheduleItems(invite.projectId);
      }),

    // Get subcontractor profile + evaluation summary
    profile: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const invite = await getSubInviteByToken(input.token);
        if (!invite || !invite.isActive) throw new TRPCError({ code: "NOT_FOUND" });
        const sub = await getSubcontractor(invite.subcontractorId);
        const evaluations = await listSubEvaluationsBySubcontractor(invite.subcontractorId);
        const summary = await getSubEvaluationSummary(invite.subcontractorId);
        return { subcontractor: sub, evaluations, summary };
      }),
  }),

  // ============ SUB QUOTES (Admin view) ============
  subQuote: router({
    list: staffProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return listSubQuotes(input.projectId);
      }),

    get: staffProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const q = await getSubQuote(input.id);
        if (!q) throw new TRPCError({ code: "NOT_FOUND" });
        return q;
      }),

    review: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["approved", "rejected", "revised"]),
        reviewComment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateSubQuote(input.id, {
          status: input.status,
          reviewComment: input.reviewComment,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
        } as any);
        return { success: true };
      }),
  }),

  // ============ SUB WORK REPORTS (Admin view) ============
  subWorkReport: router({
    list: staffProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return listSubWorkReports(input.projectId);
      }),

    approve: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["acknowledged", "approved", "rejected"]),
        approvalComment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateSubWorkReport(input.id, {
          status: input.status,
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
          approvalComment: input.approvalComment,
        } as any);
        return { success: true };
      }),
  }),

  // ============ ESTIMATES ============
  estimate: router({
    list: staffProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return listOpsEstimates(input.projectId);
      }),

    get: staffProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const e = await getOpsEstimate(input.id);
        if (!e) throw new TRPCError({ code: "NOT_FOUND" });
        return e;
      }),

    create: staffProcedure
      .input(z.object({
        projectId: z.number(),
        title: z.string().min(1),
        items: z.array(z.object({
          category: z.string(),
          subcategory: z.string(),
          item: z.string(),
          specification: z.string(),
          unit: z.string(),
          quantity: z.number(),
          materialUnitPrice: z.number(),
          materialAmount: z.number(),
          laborUnitPrice: z.number(),
          laborAmount: z.number(),
          totalAmount: z.number(),
          remarks: z.string().optional(),
        })).optional(),
        subtotal: z.string().optional(),
        overhead: z.string().optional(),
        profit: z.string().optional(),
        vat: z.string().optional(),
        grandTotal: z.string().optional(),
        fileUrl: z.string().optional(),
        fileKey: z.string().optional(),
        notes: z.string().optional(),
        validUntil: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const now = new Date();
        const estimateNumber = `EST-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getTime()).slice(-4)}`;
        
        const result = await createOpsEstimate({
          ...input,
          estimateNumber,
          authorId: ctx.user.id,
        } as any);
        if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return { id: result.id, estimateNumber };
      }),

    update: staffProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        items: z.array(z.object({
          category: z.string(),
          subcategory: z.string(),
          item: z.string(),
          specification: z.string(),
          unit: z.string(),
          quantity: z.number(),
          materialUnitPrice: z.number(),
          materialAmount: z.number(),
          laborUnitPrice: z.number(),
          laborAmount: z.number(),
          totalAmount: z.number(),
          remarks: z.string().optional(),
        })).optional(),
        subtotal: z.string().optional(),
        overhead: z.string().optional(),
        profit: z.string().optional(),
        vat: z.string().optional(),
        grandTotal: z.string().optional(),
        fileUrl: z.string().optional(),
        fileKey: z.string().optional(),
        notes: z.string().optional(),
        validUntil: z.string().optional(),
        status: z.enum(["draft", "submitted", "approved", "rejected", "sent"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateOpsEstimate(id, data as any);
        return { success: true };
      }),
  }),

  // ============ CONTRACTS ============
  contract: router({
    list: staffProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return listOpsContracts(input.projectId);
      }),

    get: staffProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const c = await getOpsContract(input.id);
        if (!c) throw new TRPCError({ code: "NOT_FOUND" });
        return c;
      }),

    create: staffProcedure
      .input(z.object({
        projectId: z.number(),
        title: z.string().min(1),
        contractType: z.enum(["main", "subcontract", "design", "consulting", "maintenance", "other"]).optional(),
        partyA: z.string().min(1),
        partyB: z.string().min(1),
        contractAmount: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        paymentTerms: z.string().optional(),
        specialTerms: z.string().optional(),
        fileUrl: z.string().optional(),
        fileKey: z.string().optional(),
        attachmentUrls: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const now = new Date();
        const contractNumber = `CON-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getTime()).slice(-4)}`;
        
        const result = await createOpsContract({
          ...input,
          contractNumber,
          authorId: ctx.user.id,
        } as any);
        if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return { id: result.id, contractNumber };
      }),

    update: staffProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        contractType: z.enum(["main", "subcontract", "design", "consulting", "maintenance", "other"]).optional(),
        partyA: z.string().optional(),
        partyB: z.string().optional(),
        contractAmount: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        paymentTerms: z.string().optional(),
        specialTerms: z.string().optional(),
        fileUrl: z.string().optional(),
        fileKey: z.string().optional(),
        attachmentUrls: z.array(z.string()).optional(),
        status: z.enum(["draft", "reviewing", "signed", "active", "completed", "terminated"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateOpsContract(id, data as any);
        return { success: true };
      }),
  }),

  // ============ COST MANAGEMENT ============
  cost: router({
    list: staffProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return listCostItems(input.projectId);
      }),

    create: staffProcedure
      .input(z.object({
        projectId: z.number(),
        category: z.enum(["material", "labor", "subcontract", "equipment", "overhead", "design", "permit", "other"]),
        subcategory: z.string().optional(),
        description: z.string().min(1),
        budgetAmount: z.string().optional(),
        actualAmount: z.string().optional(),
        paidAmount: z.string().optional(),
        vendor: z.string().optional(),
        expenseId: z.number().optional(),
        invoiceDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await createCostItem(input as any);
        if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return { id: result.id };
      }),

    update: staffProcedure
      .input(z.object({
        id: z.number(),
        category: z.enum(["material", "labor", "subcontract", "equipment", "overhead", "design", "permit", "other"]).optional(),
        subcategory: z.string().optional(),
        description: z.string().optional(),
        budgetAmount: z.string().optional(),
        actualAmount: z.string().optional(),
        paidAmount: z.string().optional(),
        vendor: z.string().optional(),
        expenseId: z.number().optional(),
        invoiceDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateCostItem(id, data as any);
        return { success: true };
      }),

    delete: staffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCostItem(input.id);
        return { success: true };
      }),
  }),

  // ============ CLIENT INVITES ============
  clientInvite: router({
    list: staffProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return listClientInvites(input.projectId);
      }),

    create: staffProcedure
      .input(z.object({
        projectId: z.number(),
        clientName: z.string().min(1),
        clientEmail: z.string().optional(),
        permissions: z.object({
          viewSchedule: z.boolean(),
          viewReports: z.boolean(),
          viewPhotos: z.boolean(),
          viewCamera: z.boolean(),
          viewCost: z.boolean(),
        }).optional(),
      }))
      .mutation(async ({ input }) => {
        const token = generateToken();
        const result = await createClientInvite({
          ...input,
          token,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90일
        } as any);
        if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return { token };
      }),

    deactivate: staffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await updateClientInvite(input.id, { isActive: 0 } as any);
        return { success: true };
      }),
  }),

  // ============ CLIENT VIEW (Token-based, public) ============
  clientView: router({
    validate: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const invite = await getClientInviteByToken(input.token);
        if (!invite || !invite.isActive) throw new TRPCError({ code: "NOT_FOUND", message: "유효하지 않은 링크입니다." });
        if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
          throw new TRPCError({ code: "FORBIDDEN", message: "링크가 만료되었습니다." });
        }
        // Update last accessed
        await updateClientInvite(invite.id, { lastAccessedAt: new Date() } as any);
        
        const project = await getOpsProject(invite.projectId);
        return { project, permissions: invite.permissions, clientName: invite.clientName };
      }),

    schedule: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const invite = await getClientInviteByToken(input.token);
        if (!invite || !invite.isActive) return [];
        if (!invite.permissions || !(invite.permissions as any).viewSchedule) return [];
        return listScheduleItems(invite.projectId);
      }),

    cameras: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const invite = await getClientInviteByToken(input.token);
        if (!invite || !invite.isActive) return [];
        if (!invite.permissions || !(invite.permissions as any).viewCamera) return [];
        return listCameras(invite.projectId);
      }),
  }),

  // ============ CAMERAS ============
  camera: router({
    list: staffProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return listCameras(input.projectId);
      }),

    create: staffProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string().min(1),
        location: z.string().optional(),
        streamUrl: z.string().optional(),
        thumbnailUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await createCamera(input as any);
        if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return { id: result.id };
      }),

    update: staffProcedure
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
        await updateCamera(id, data as any);
        return { success: true };
      }),

    delete: staffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCamera(input.id);
        return { success: true };
      }),
  }),

  // ============ STAFF MANAGEMENT ============
  staff: router({
    list: adminProcedure.query(async () => {
      const members = await listStaffMembers();
      return members.map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        department: (m as any).department ?? "none",
        opsRole: (m as any).opsRole ?? "staff",
        phone: (m as any).phone ?? null,
        lastSignedIn: m.lastSignedIn,
        createdAt: m.createdAt,
      }));
    }),
    updateDepartment: adminProcedure
      .input(z.object({
        userId: z.number(),
        department: z.enum(["design", "construction", "accounting", "management", "sales", "none"]),
        opsRole: z.enum(["pm", "designer", "site_manager", "accountant", "director", "staff"]),
      }))
      .mutation(async ({ input }) => {
        await updateUserDepartment(input.userId, input.department, input.opsRole);
        return { success: true };
      }),
    updateRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["user", "admin"]),
      }))
      .mutation(async ({ input }) => {
        await updateUserRole(input.userId, input.role);
        return { success: true };
      }),
    get: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const u = await getUserById(input.userId);
        if (!u) throw new TRPCError({ code: "NOT_FOUND" });
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          department: (u as any).department ?? "none",
          opsRole: (u as any).opsRole ?? "staff",
          phone: (u as any).phone ?? null,
          lastSignedIn: u.lastSignedIn,
          createdAt: u.createdAt,
        };
      }),
    // 현재 사용자의 부서/역할 정보
    me: staffProcedure.query(async ({ ctx }) => {
      const u = await getUserById(ctx.user.id);
      return {
        department: (u as any)?.department ?? "none",
        opsRole: (u as any)?.opsRole ?? "staff",
      };
    }),
  }),

  // ============ NOTIFICATIONS ============
  notification: router({
    list: staffProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return listNotifications(ctx.user.id, input.limit ?? 50);
      }),
    unreadCount: staffProcedure.query(async ({ ctx }) => {
      return getUnreadNotificationCount(ctx.user.id);
    }),
    markRead: staffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await markNotificationRead(input.id, ctx.user.id);
        return { success: true };
      }),
    markAllRead: staffProcedure.mutation(async ({ ctx }) => {
      await markAllNotificationsRead(ctx.user.id);
      return { success: true };
    }),
    send: adminProcedure
      .input(z.object({
        recipientId: z.number(),
        type: z.enum(["schedule_delay", "expense_submitted", "expense_approved", "expense_rejected",
          "sub_quote_submitted", "sub_report_submitted", "meeting_scheduled", "meeting_reminder",
          "project_status", "client_inquiry", "approval_pending", "general"]),
        title: z.string().min(1),
        message: z.string().optional(),
        link: z.string().optional(),
        projectId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await createNotification({
          recipientId: input.recipientId,
          type: input.type,
          title: input.title,
          message: input.message,
          link: input.link,
          projectId: input.projectId,
        });
        return { success: true };
      }),
    broadcast: adminProcedure
      .input(z.object({
        type: z.enum(["schedule_delay", "expense_submitted", "expense_approved", "expense_rejected",
          "sub_quote_submitted", "sub_report_submitted", "meeting_scheduled", "meeting_reminder",
          "project_status", "client_inquiry", "approval_pending", "general"]),
        title: z.string().min(1),
        message: z.string().optional(),
        link: z.string().optional(),
        projectId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await notifyAdminsAndPMs({
          type: input.type,
          title: input.title,
          message: input.message,
          link: input.link,
          projectId: input.projectId,
        });
        return { success: true };
      }),
  }),

  // ============ SUB EVALUATIONS ============
  evaluation: router({
    list: staffProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return listSubEvaluations(input.projectId);
      }),

    bySubcontractor: staffProcedure
      .input(z.object({ subcontractorId: z.number() }))
      .query(async ({ input }) => {
        return listSubEvaluationsBySubcontractor(input.subcontractorId);
      }),

    summary: staffProcedure
      .input(z.object({ subcontractorId: z.number() }))
      .query(async ({ input }) => {
        return getSubEvaluationSummary(input.subcontractorId);
      }),

    create: staffProcedure
      .input(z.object({
        projectId: z.number(),
        subcontractorId: z.number(),
        qualityScore: z.number().min(1).max(5),
        scheduleScore: z.number().min(1).max(5),
        safetyScore: z.number().min(1).max(5),
        communicationScore: z.number().min(1).max(5),
        cleanupScore: z.number().min(1).max(5),
        strengths: z.string().optional(),
        improvements: z.string().optional(),
        recommendation: z.enum(["highly_recommended", "recommended", "neutral", "not_recommended"]),
        comment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createSubEvaluation({
          ...input,
          evaluatorId: ctx.user.id,
        });
        return { id };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteSubEvaluation(input.id);
        return { success: true };
      }),
  }),

  // ============ CALENDAR EVENTS ============
  calendar: router({
    events: staffProcedure
      .input(z.object({
        startDate: z.string(), // YYYY-MM-DD
        endDate: z.string(),
      }))
      .query(async ({ input }) => {
        return getCalendarEvents(input.startDate, input.endDate);
      }),
  }),
});
