/**
 * Scheduled Insight Article Generation Handler
 *
 * 외부 트리거(예: cron-job.org, 수동 테스트)가 이 엔드포인트를 호출하여
 * 인사이트 아티클을 생성/발행합니다. 서버 내부 스케줄러(insightScheduler.ts)와
 * 동일한 생성 로직(insightGenerator.ts)을 공유합니다.
 *
 * 경로: POST /api/scheduled/generateInsight
 * 인증: 공유 시크릿 토큰 (env SCHEDULED_TASK_SECRET)
 *   - 헤더: Authorization: Bearer <secret>  또는  x-cron-secret: <secret>
 * 기본 동작: 즉시 발행(published). body에 draft:true 또는 autoPublish:false면 초안 저장.
 */
import type { Request, Response } from "express";
import { timingSafeEqual } from "crypto";
import { ENV } from "../_core/env";
import { generateAndSaveInsight } from "../_core/insightGenerator";

/** 상수 시간 비교로 시크릿 토큰을 검증합니다. */
function verifyScheduledSecret(req: Request): boolean {
  const expected = ENV.scheduledTaskSecret;
  if (!expected) return false; // 시크릿 미설정 시 항상 거부
  const auth = req.headers["authorization"];
  const bearer = typeof auth === "string" && auth.startsWith("Bearer ")
    ? auth.slice(7)
    : "";
  const headerToken = (req.headers["x-cron-secret"] as string) || bearer || "";
  if (!headerToken) return false;
  const a = Buffer.from(headerToken);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function generateInsightHandler(req: Request, res: Response) {
  try {
    // 인증: 공유 시크릿 토큰 확인 (Railway 환경변수 SCHEDULED_TASK_SECRET)
    if (!ENV.scheduledTaskSecret) {
      return res.status(503).json({ error: "scheduler-not-configured: SCHEDULED_TASK_SECRET 미설정" });
    }
    if (!verifyScheduledSecret(req)) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const {
      topic,
      category,
      targetAudience,
      trendContext,
      keywords,
      draft,       // true면 초안으로만 저장 (기본: 자동 발행)
      autoPublish, // 명시적으로 false를 주면 초안 유지
    } = req.body || {};

    const publishNow = !(draft === true || autoPublish === false);

    const result = await generateAndSaveInsight({
      topic,
      category,
      targetAudience,
      trendContext,
      keywords,
      publish: publishNow,
    });

    return res.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("[Scheduled Insight] Error:", err);
    return res.status(500).json({
      error: err.message || "Unknown error",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      context: {
        url: req.url,
        taskUid: (req.headers["x-cron-task-id"] as string) || null,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
