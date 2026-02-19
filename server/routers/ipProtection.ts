/**
 * 지적재산권 보호 라우터
 * - 다운로드 로그 기록/조회
 * - 트래킹 코드 생성/검증
 * - 법적 고지 동의 기록
 * - 이상 다운로드 감지 및 관리자 알림
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";
import {
  createDownloadLog,
  listDownloadLogs,
  getDownloadLogByTrackingCode,
  getDownloadLogsByUser,
  getDownloadStats,
  generateTrackingCode,
  getRecentDownloadCount,
  getAnomalousDownloaders,
} from "../db";

// ============================================================
// 이상 감지 설정
// ============================================================
const ANOMALY_CONFIG = {
  /** 감지 시간 범위 (분) */
  windowMinutes: 30,
  /** 임계값: 이 횟수 이상이면 이상 감지 */
  threshold: 5,
  /** 알림 쿨다운 (ms) - 동일 사용자에 대해 중복 알림 방지 */
  cooldownMs: 30 * 60 * 1000, // 30분
};

// 알림 쿨다운 캐시 (메모리)
const notificationCooldown = new Map<string, number>();

function shouldNotify(key: string): boolean {
  const lastNotified = notificationCooldown.get(key);
  if (lastNotified && Date.now() - lastNotified < ANOMALY_CONFIG.cooldownMs) {
    return false;
  }
  notificationCooldown.set(key, Date.now());
  return true;
}

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "master") {
    throw new TRPCError({ code: "FORBIDDEN", message: "관리자 권한이 필요합니다." });
  }
  return next({ ctx });
});

export const ipProtectionRouter = router({
  /**
   * 다운로드 로그 기록 (파일 다운로드 시 호출)
   * + 이상 감지: 단기간 다수 다운로드 시 관리자 알림
   */
  logDownload: publicProcedure
    .input(z.object({
      fileType: z.enum([
        "estimate_pdf", "expense_pdf", "project_report_pdf",
        "proposal_pdf", "lead_magnet", "ai_estimate_result",
        "design_auto_result", "other",
      ]),
      fileName: z.string().optional(),
      projectId: z.number().optional(),
      projectName: z.string().optional(),
      userName: z.string().optional(),
      userEmail: z.string().optional(),
      consentGiven: z.enum(["yes", "no"]).default("no"),
    }))
    .mutation(async ({ input, ctx }) => {
      const trackingCode = generateTrackingCode();
      const userId = ctx.user?.id ?? null;
      const userName = input.userName || ctx.user?.name || null;
      const userEmail = input.userEmail || ctx.user?.email || null;

      // IP와 User-Agent 추출
      const ipAddress = (ctx.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
        || ctx.req.socket?.remoteAddress || null;
      const userAgent = ctx.req.headers["user-agent"] || null;

      const logId = await createDownloadLog({
        userId,
        userName,
        userEmail,
        fileType: input.fileType,
        fileName: input.fileName,
        projectId: input.projectId,
        projectName: input.projectName,
        trackingCode,
        ipAddress,
        userAgent,
        consentGiven: input.consentGiven,
      });

      // ===== 이상 감지 =====
      // 비동기로 실행하여 다운로드 응답 지연 방지
      (async () => {
        try {
          const recentCount = await getRecentDownloadCount({
            userEmail,
            ipAddress,
            withinMinutes: ANOMALY_CONFIG.windowMinutes,
          });

          if (recentCount >= ANOMALY_CONFIG.threshold) {
            const cooldownKey = `${userEmail || ""}:${ipAddress || ""}`;
            if (shouldNotify(cooldownKey)) {
              const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
              await notifyOwner({
                title: `⚠️ 비정상 다운로드 감지 - ${userName || userEmail || ipAddress || "알 수 없음"}`,
                content: [
                  `[이상 다운로드 감지 알림]`,
                  ``,
                  `사용자: ${userName || "미확인"} (${userEmail || "이메일 없음"})`,
                  `IP 주소: ${ipAddress || "알 수 없음"}`,
                  `최근 ${ANOMALY_CONFIG.windowMinutes}분간 다운로드: ${recentCount}건`,
                  `임계값: ${ANOMALY_CONFIG.threshold}건`,
                  `최근 다운로드 파일: ${input.fileName || input.fileType}`,
                  `프로젝트: ${input.projectName || "미지정"}`,
                  `감지 시각: ${now}`,
                  ``,
                  `해당 사용자의 다운로드 이력을 관리자 대시보드에서 확인해 주세요.`,
                  `관리자 페이지: /admin/download-logs`,
                ].join("\n"),
              });
              console.warn(`[IP Protection] Anomaly detected: ${userEmail || ipAddress} - ${recentCount} downloads in ${ANOMALY_CONFIG.windowMinutes}min`);
            }
          }
        } catch (err) {
          console.error("[IP Protection] Anomaly detection error:", err);
        }
      })();

      return { trackingCode, logId };
    }),

  /**
   * 트래킹 코드로 다운로드 이력 조회 (관리자용)
   */
  lookupByTrackingCode: adminProcedure
    .input(z.object({ trackingCode: z.string() }))
    .query(async ({ input }) => {
      const log = await getDownloadLogByTrackingCode(input.trackingCode);
      if (!log) {
        throw new TRPCError({ code: "NOT_FOUND", message: "해당 트래킹 코드를 찾을 수 없습니다." });
      }
      return log;
    }),

  /**
   * 다운로드 로그 목록 조회 (관리자용)
   */
  listLogs: adminProcedure
    .input(z.object({
      fileType: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      return listDownloadLogs(input);
    }),

  /**
   * 특정 사용자의 다운로드 이력 조회 (관리자용)
   */
  userHistory: adminProcedure
    .input(z.object({ email: z.string() }))
    .query(async ({ input }) => {
      return getDownloadLogsByUser(input.email);
    }),

  /**
   * 다운로드 통계 (관리자용)
   */
  stats: adminProcedure.query(async () => {
    return getDownloadStats();
  }),

  /**
   * 이상 감지 현황 조회 (관리자용)
   * - 최근 N분 내 임계값 초과 다운로드 사용자/IP 목록
   */
  anomalyReport: adminProcedure
    .input(z.object({
      withinMinutes: z.number().min(5).max(1440).default(60),
      threshold: z.number().min(2).max(100).default(5),
    }).optional())
    .query(async ({ input }) => {
      const opts = {
        withinMinutes: input?.withinMinutes ?? 60,
        threshold: input?.threshold ?? ANOMALY_CONFIG.threshold,
      };
      const anomalies = await getAnomalousDownloaders(opts);
      return {
        config: {
          windowMinutes: opts.withinMinutes,
          threshold: opts.threshold,
        },
        anomalies,
        checkedAt: new Date().toISOString(),
      };
    }),

  /**
   * 법적 고지 텍스트 조회 (공개)
   */
  getLegalNotice: publicProcedure.query(() => {
    return {
      title: "지적재산권 보호 안내",
      content: LEGAL_NOTICE_TEXT,
      shortNotice: SHORT_LEGAL_NOTICE,
      watermarkNotice: WATERMARK_NOTICE,
    };
  }),
});

// ============================================================
// 법적 고지 문구
// ============================================================

const LEGAL_NOTICE_TEXT = `
본 문서는 (주)고감도(이하 "회사")의 지적재산으로서, 저작권법 및 관련 법률에 의해 보호됩니다.

1. 저작권 및 소유권
본 문서에 포함된 설계안, 견적서, 제안서, 3D 렌더링, 도면 및 기타 모든 자료(이하 "자료")의 저작권 및 지적재산권은 (주)고감도에 있습니다.

2. 사용 제한
본 자료는 귀하와 (주)고감도 간의 프로젝트 검토 목적으로만 제공됩니다. 다음 행위는 엄격히 금지됩니다:
  - 제3자에게 자료의 전부 또는 일부를 공유, 배포, 전달하는 행위
  - 다른 인테리어 업체에 비교 견적 또는 시공 의뢰 목적으로 자료를 제공하는 행위
  - 자료를 복제, 수정, 변형하여 사용하는 행위
  - 자료를 온라인 또는 오프라인에 게시하는 행위

3. 추적 및 모니터링
본 자료에는 고유 식별 코드(트래킹 워터마크)가 삽입되어 있으며, 무단 유출 시 유출 경로를 추적할 수 있습니다. 모든 다운로드 이력은 기록됩니다.

4. 법적 책임
위 제한 사항을 위반할 경우, 저작권법 제136조에 따라 5년 이하의 징역 또는 5천만원 이하의 벌금에 처해질 수 있으며, 민사상 손해배상 청구의 대상이 됩니다.

5. 동의
본 자료를 다운로드함으로써 위 조건에 동의하는 것으로 간주됩니다.

© ${new Date().getFullYear()} (주)고감도. All rights reserved.
`.trim();

const SHORT_LEGAL_NOTICE = "본 자료는 (주)고감도의 지적재산으로, 무단 복제·배포·제3자 공유가 금지됩니다. 고유 추적 코드가 삽입되어 있으며, 위반 시 법적 책임이 따릅니다.";

const WATERMARK_NOTICE = "본 문서에는 추적 가능한 고유 식별 코드가 포함되어 있습니다. 무단 유출 시 법적 조치가 취해질 수 있습니다.";
