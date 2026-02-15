/**
 * 센서 하드웨어 연동 REST API
 * Express 라우터로 구현 (tRPC 외부) - 디바이스에서 직접 호출
 * 인증: API 키 기반 (Bearer 토큰)
 */
import { Router, Request, Response } from "express";
import {
  getSensorApiKeyByKey,
  incrementApiKeyUsage,
  addOccupancyEvent,
  addOccupancyEventsBatch,
  updateSensor,
  getSensorDataRange,
  addSensorData,
  addSensorDataBatch,
} from "../db";

const router = Router();

// ============================================================
// 미들웨어: API 키 인증
// ============================================================
async function authenticateApiKey(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid API key. Use: Authorization: Bearer <api_key>" });
  }

  const apiKey = authHeader.slice(7);
  const keyRecord = await getSensorApiKeyByKey(apiKey);

  if (!keyRecord) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  if (keyRecord.active !== "yes") {
    return res.status(403).json({ error: "API key has been revoked" });
  }

  // 사용량 기록
  await incrementApiKeyUsage(keyRecord.id);

  // req에 프로젝트 정보 주입
  (req as any).sensorApiKey = keyRecord;
  (req as any).projectId = keyRecord.projectId;
  next();
}

// ============================================================
// POST /api/sensor/event - 단건 재실 이벤트 수신
// ============================================================
router.post("/event", authenticateApiKey, async (req: Request, res: Response) => {
  try {
    const { sensorId, zoneId, eventType, count, eventAt, deviceId } = req.body;
    const projectId = (req as any).projectId;

    if (!sensorId || !eventType) {
      return res.status(400).json({ error: "sensorId and eventType are required" });
    }

    if (!["enter", "exit", "count_change"].includes(eventType)) {
      return res.status(400).json({ error: "eventType must be one of: enter, exit, count_change" });
    }

    await addOccupancyEvent({
      projectId,
      sensorId,
      zoneId: zoneId ?? null,
      eventType,
      count: count ?? (eventType === "enter" ? 1 : eventType === "exit" ? -1 : 0),
      eventAt: eventAt ? new Date(eventAt) : new Date(),
    });

    res.json({ success: true, message: "Event recorded" });
  } catch (err: any) {
    console.error("[SensorAPI] Event error:", err);
    res.status(500).json({ error: "Failed to record event", detail: err.message });
  }
});

// ============================================================
// POST /api/sensor/events/batch - 배치 이벤트 수신
// ============================================================
router.post("/events/batch", authenticateApiKey, async (req: Request, res: Response) => {
  try {
    const { events } = req.body;
    const projectId = (req as any).projectId;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: "events array is required and must not be empty" });
    }

    if (events.length > 1000) {
      return res.status(400).json({ error: "Maximum 1000 events per batch" });
    }

    const rows = events.map((ev: any) => ({
      projectId,
      sensorId: ev.sensorId,
      zoneId: ev.zoneId ?? null,
      eventType: ev.eventType,
      count: ev.count ?? 0,
      eventAt: ev.eventAt ? new Date(ev.eventAt) : new Date(),
    }));

    await addOccupancyEventsBatch(rows);

    res.json({ success: true, message: `${events.length} events recorded`, count: events.length });
  } catch (err: any) {
    console.error("[SensorAPI] Batch error:", err);
    res.status(500).json({ error: "Failed to record batch events", detail: err.message });
  }
});

// ============================================================
// POST /api/sensor/data - 센서 데이터 수신 (온도, 습도 등 범용)
// ============================================================
router.post("/data", authenticateApiKey, async (req: Request, res: Response) => {
  try {
    const { sensorId, value, recordedAt } = req.body;
    const projectId = (req as any).projectId;

    if (!sensorId || value === undefined) {
      return res.status(400).json({ error: "sensorId and value are required" });
    }

    await addSensorData({
      projectId,
      sensorId,
      value: String(value),
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
    });

    res.json({ success: true, message: "Data recorded" });
  } catch (err: any) {
    console.error("[SensorAPI] Data error:", err);
    res.status(500).json({ error: "Failed to record data", detail: err.message });
  }
});

// ============================================================
// POST /api/sensor/data/batch - 배치 센서 데이터 수신
// ============================================================
router.post("/data/batch", authenticateApiKey, async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    const projectId = (req as any).projectId;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "data array is required and must not be empty" });
    }

    if (data.length > 1000) {
      return res.status(400).json({ error: "Maximum 1000 data points per batch" });
    }

    const rows = data.map((d: any) => ({
      projectId,
      sensorId: d.sensorId,
      value: String(d.value),
      recordedAt: d.recordedAt ? new Date(d.recordedAt) : new Date(),
    }));

    await addSensorDataBatch(rows);

    res.json({ success: true, message: `${data.length} data points recorded`, count: data.length });
  } catch (err: any) {
    console.error("[SensorAPI] Batch data error:", err);
    res.status(500).json({ error: "Failed to record batch data", detail: err.message });
  }
});

// ============================================================
// POST /api/sensor/heartbeat - 센서 하트비트/상태 보고
// ============================================================
router.post("/heartbeat", authenticateApiKey, async (req: Request, res: Response) => {
  try {
    const { sensorId, status, firmware, battery, rssi } = req.body;
    const projectId = (req as any).projectId;

    if (!sensorId) {
      return res.status(400).json({ error: "sensorId is required" });
    }

    // 센서 메타데이터 업데이트
    const metadata: Record<string, any> = {};
    if (firmware) metadata.firmware = firmware;
    if (battery !== undefined) metadata.battery = battery;
    if (rssi !== undefined) metadata.rssi = rssi;
    if (status) metadata.lastStatus = status;
    metadata.lastHeartbeat = new Date().toISOString();

    await updateSensor(sensorId, { metadata });

    res.json({
      success: true,
      message: "Heartbeat received",
      serverTime: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[SensorAPI] Heartbeat error:", err);
    res.status(500).json({ error: "Failed to process heartbeat", detail: err.message });
  }
});

// ============================================================
// GET /api/sensor/status - API 키 상태 확인
// ============================================================
router.get("/status", authenticateApiKey, async (req: Request, res: Response) => {
  const keyRecord = (req as any).sensorApiKey;
  res.json({
    success: true,
    projectId: keyRecord.projectId,
    keyName: keyRecord.name,
    requestCount: keyRecord.requestCount,
    active: keyRecord.active === "yes",
    serverTime: new Date().toISOString(),
  });
});

export default router;
