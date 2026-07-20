/**
 * 서버 내부 인사이트 자동 발행 스케줄러 (의존성 없는 순수 타이머)
 *
 * 매주 화요일·금요일 09:00 (KST, Asia/Seoul, UTC+9 고정)에
 * 인사이트 아티클을 자동 생성 + 발행합니다.
 *
 * - 외부 핑거/크론 서비스가 필요 없습니다. 앱 프로세스가 스스로 예약합니다.
 * - 프로세스 재시작 시 다음 실행 시각을 다시 계산합니다.
 * - 비활성화하려면 env INSIGHT_SCHEDULER_DISABLED=true 를 설정하세요.
 */
import { generateAndSaveInsight } from "./insightGenerator";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000; // UTC+9 (한국은 서머타임 없음)
const FIRE_HOUR_KST = 9; // 09:00
const FIRE_DAYS = [2, 5]; // 0=일 ... 2=화, 5=금
const MAX_TIMEOUT_MS = 2 ** 31 - 1; // setTimeout 최대 지연

let started = false;

/** 지금(now) 이후의 다음 실행 UTC 타임스탬프(ms)를 계산합니다. */
export function computeNextFire(nowMs: number): number {
  // KST 벽시계로 환산 (shifted Date의 getUTC* 값이 KST 값이 됨)
  const kstNow = new Date(nowMs + KST_OFFSET_MS);
  const y = kstNow.getUTCFullYear();
  const m = kstNow.getUTCMonth();
  const d = kstNow.getUTCDate();

  for (let i = 0; i < 8; i++) {
    // i일 뒤 09:00 KST를 UTC ms로 환산
    const candidateKstMs = Date.UTC(y, m, d + i, FIRE_HOUR_KST, 0, 0, 0);
    const candidateUtcMs = candidateKstMs - KST_OFFSET_MS;
    const dow = new Date(candidateKstMs).getUTCDay(); // 해당 후보의 KST 요일
    if (FIRE_DAYS.includes(dow) && candidateUtcMs > nowMs) {
      return candidateUtcMs;
    }
  }
  // 안전장치: 이론상 도달하지 않음 (8일 내 화/금 반드시 존재)
  return nowMs + 24 * 60 * 60 * 1000;
}

async function runOnce() {
  try {
    console.log("[InsightScheduler] Firing scheduled insight generation…");
    const result = await generateAndSaveInsight({ publish: true });
    console.log(
      `[InsightScheduler] Done: id=${result.articleId}, status=${result.status}, title="${result.title}"`
    );
  } catch (err) {
    console.error("[InsightScheduler] Generation failed:", err);
  }
}

function scheduleNext() {
  const now = Date.now();
  const nextFire = computeNextFire(now);
  let delay = nextFire - now;
  if (delay < 0) delay = 0;

  const fireDate = new Date(nextFire);
  console.log(
    `[InsightScheduler] Next run at ${fireDate.toISOString()} (KST ${new Date(nextFire + KST_OFFSET_MS).toISOString().slice(0, 16).replace("T", " ")}), in ${Math.round(delay / 60000)} min`
  );

  // setTimeout 최대치를 넘으면 중간에 깨어나 다시 예약
  const wait = Math.min(delay, MAX_TIMEOUT_MS);
  const timer = setTimeout(async () => {
    if (wait < delay) {
      // 아직 목표 시각 전 — 재예약만
      scheduleNext();
      return;
    }
    await runOnce();
    scheduleNext();
  }, wait);
  // 프로세스 종료를 막지 않도록 (있을 경우)
  if (typeof timer.unref === "function") timer.unref();
}

/** 프로덕션에서 인사이트 자동 발행 스케줄러를 시작합니다. */
export function startInsightScheduler() {
  if (started) return;
  if (process.env.INSIGHT_SCHEDULER_DISABLED === "true") {
    console.log("[InsightScheduler] Disabled via INSIGHT_SCHEDULER_DISABLED=true");
    return;
  }
  if (process.env.NODE_ENV !== "production") {
    console.log("[InsightScheduler] Skipped (non-production)");
    return;
  }
  started = true;
  console.log("[InsightScheduler] Started — 매주 화·금 09:00 KST 자동 발행");
  scheduleNext();
}
