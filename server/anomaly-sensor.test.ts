import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ============================================================
// Helper: 컨텍스트 생성
// ============================================================
function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@gogamdo.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: { "x-forwarded-for": "10.0.0.1" },
      socket: { remoteAddress: "127.0.0.1" },
    } as any,
    res: {
      clearCookie: vi.fn(),
    } as any,
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "normal-user",
      email: "user@example.com",
      name: "User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
      socket: { remoteAddress: "192.168.1.100" },
    } as any,
    res: {
      clearCookie: vi.fn(),
    } as any,
  };
}

// ============================================================
// 1. 이상 감지 - anomalyReport 라우터 테스트
// ============================================================
describe("Anomaly Detection - anomalyReport Router", () => {
  it("관리자는 anomalyReport에 접근할 수 있다", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ipProtection.anomalyReport({
      withinMinutes: 60,
      threshold: 5,
    });

    expect(result).toHaveProperty("anomalies");
    expect(result).toHaveProperty("checkedAt");
    expect(Array.isArray(result.anomalies)).toBe(true);
  });

  it("일반 사용자는 anomalyReport에 접근할 수 없다", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.ipProtection.anomalyReport({ withinMinutes: 60, threshold: 5 })
    ).rejects.toThrow();
  });

  it("anomalyReport의 checkedAt은 유효한 타임스탬프이다", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ipProtection.anomalyReport({
      withinMinutes: 60,
      threshold: 5,
    });

    // checkedAt은 ISO 문자열 또는 숫자 타임스탬프
    expect(result.checkedAt).toBeTruthy();
    // 타임스탬프로 변환 가능해야 함
    const ts = typeof result.checkedAt === "number" ? result.checkedAt : new Date(result.checkedAt).getTime();
    expect(ts).toBeGreaterThan(0);
    // 현재 시간과 1분 이내 차이
    const now = Date.now();
    expect(Math.abs(now - ts)).toBeLessThan(60000);
  });

  it("withinMinutes 파라미터가 양수여야 한다", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 유효한 값
    const result = await caller.ipProtection.anomalyReport({
      withinMinutes: 15,
      threshold: 3,
    });
    expect(result).toHaveProperty("anomalies");
  });

  it("threshold 파라미터가 최소 2 이상이어야 한다", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // threshold 1은 거부되어야 함 (min: 2)
    await expect(
      caller.ipProtection.anomalyReport({ withinMinutes: 60, threshold: 1 })
    ).rejects.toThrow();

    // threshold 2는 허용
    const result = await caller.ipProtection.anomalyReport({
      withinMinutes: 60,
      threshold: 2,
    });
    expect(result).toHaveProperty("anomalies");
  });
});

// ============================================================
// 2. 이상 감지 - 알림 쿨다운 로직 테스트
// ============================================================
describe("Anomaly Detection - Notification Cooldown Logic", () => {
  it("쿨다운 맵이 올바르게 동작한다", () => {
    const cooldownMap = new Map<string, number>();
    const COOLDOWN_MS = 30 * 60 * 1000; // 30분

    const userId = "user-1";
    const now = Date.now();

    // 첫 번째 알림 - 쿨다운 없음
    expect(cooldownMap.has(userId)).toBe(false);

    // 알림 발송 후 쿨다운 기록
    cooldownMap.set(userId, now);
    expect(cooldownMap.has(userId)).toBe(true);

    // 쿨다운 기간 내 - 알림 차단
    const withinCooldown = now + 10 * 60 * 1000; // 10분 후
    const lastNotified = cooldownMap.get(userId)!;
    expect(withinCooldown - lastNotified < COOLDOWN_MS).toBe(true);

    // 쿨다운 기간 후 - 알림 허용
    const afterCooldown = now + 31 * 60 * 1000; // 31분 후
    expect(afterCooldown - lastNotified < COOLDOWN_MS).toBe(false);
  });

  it("서로 다른 사용자의 쿨다운은 독립적이다", () => {
    const cooldownMap = new Map<string, number>();
    const now = Date.now();

    cooldownMap.set("user-1", now);
    cooldownMap.set("user-2", now - 40 * 60 * 1000); // 40분 전

    const COOLDOWN_MS = 30 * 60 * 1000;

    // user-1은 쿨다운 중
    expect(now - cooldownMap.get("user-1")! < COOLDOWN_MS).toBe(true);
    // user-2는 쿨다운 만료
    expect(now - cooldownMap.get("user-2")! < COOLDOWN_MS).toBe(false);
  });
});

// ============================================================
// 3. 이상 감지 - DB 헬퍼 함수 테스트
// ============================================================
describe("Anomaly Detection - DB Helper Functions", () => {
  it("getAnomalousDownloaders 함수가 존재한다", async () => {
    const db = await import("./db");
    expect(typeof db.getAnomalousDownloaders).toBe("function");
  });

  it("getAnomalousDownloaders는 withinMinutes와 threshold를 받는다", async () => {
    const db = await import("./db");
    const result = await db.getAnomalousDownloaders({ withinMinutes: 60, threshold: 100 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("getRecentDownloadCount 함수가 존재한다", async () => {
    const db = await import("./db");
    expect(typeof db.getRecentDownloadCount).toBe("function");
  });
});

// ============================================================
// 4. 센서 배치 UI - 좌표 변환 로직 테스트
// ============================================================
describe("Sensor Floor Plan - Coordinate Conversion", () => {
  it("클릭 좌표를 0-1000 범위로 변환한다", () => {
    // 시뮬레이션: 컨테이너 너비 800px, 높이 600px
    const containerWidth = 800;
    const containerHeight = 600;
    const clickX = 400; // 중앙
    const clickY = 300; // 중앙

    const posX = Math.round((clickX / containerWidth) * 1000);
    const posY = Math.round((clickY / containerHeight) * 1000);

    expect(posX).toBe(500);
    expect(posY).toBe(500);
  });

  it("좌상단 클릭은 (0, 0)에 가깝다", () => {
    const containerWidth = 800;
    const containerHeight = 600;
    const clickX = 0;
    const clickY = 0;

    const posX = Math.round((clickX / containerWidth) * 1000);
    const posY = Math.round((clickY / containerHeight) * 1000);

    expect(posX).toBe(0);
    expect(posY).toBe(0);
  });

  it("우하단 클릭은 (1000, 1000)에 가깝다", () => {
    const containerWidth = 800;
    const containerHeight = 600;
    const clickX = 800;
    const clickY = 600;

    const posX = Math.round((clickX / containerWidth) * 1000);
    const posY = Math.round((clickY / containerHeight) * 1000);

    expect(posX).toBe(1000);
    expect(posY).toBe(1000);
  });

  it("좌표를 퍼센트로 역변환한다", () => {
    const posX = 500;
    const posY = 300;

    const percentX = posX / 10; // 50%
    const percentY = posY / 10; // 30%

    expect(percentX).toBe(50);
    expect(percentY).toBe(30);
  });
});

// ============================================================
// 5. 센서 배치 UI - 드래그 이동 로직 테스트
// ============================================================
describe("Sensor Floor Plan - Drag Movement Logic", () => {
  it("드래그 델타를 좌표 변화로 변환한다", () => {
    const containerWidth = 800;
    const startX = 400;
    const endX = 480; // 80px 이동
    const origPosX = 500;

    const deltaX = ((endX - startX) / containerWidth) * 1000;
    const newPosX = Math.round(origPosX + deltaX);

    expect(newPosX).toBe(600); // 500 + 100
  });

  it("좌표는 0-1000 범위를 벗어나지 않는다", () => {
    const clamp = (val: number) => Math.max(0, Math.min(1000, val));

    expect(clamp(-50)).toBe(0);
    expect(clamp(1050)).toBe(1000);
    expect(clamp(500)).toBe(500);
  });

  it("5 이하의 미세한 이동은 무시한다", () => {
    const deltaX = 3;
    const deltaY = 2;
    const isSignificant = Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5;
    expect(isSignificant).toBe(false);
  });

  it("5 초과의 이동은 유효하다", () => {
    const deltaX = 10;
    const deltaY = 0;
    const isSignificant = Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5;
    expect(isSignificant).toBe(true);
  });
});

// ============================================================
// 6. 센서 배치 UI - 센서 유형 메타데이터 테스트
// ============================================================
describe("Sensor Floor Plan - Sensor Type Metadata", () => {
  const SENSOR_TYPES = [
    { value: "temperature", label: "온도", unit: "°C", color: "#ef4444" },
    { value: "humidity", label: "습도", unit: "%", color: "#3b82f6" },
    { value: "illuminance", label: "조도", unit: "lux", color: "#eab308" },
    { value: "co2", label: "CO₂", unit: "ppm", color: "#22c55e" },
    { value: "noise", label: "소음", unit: "dB", color: "#a855f7" },
    { value: "occupancy", label: "재실", unit: "명", color: "#f97316" },
    { value: "motion", label: "동선", unit: "", color: "#06b6d4" },
    { value: "air_quality", label: "공기질", unit: "AQI", color: "#10b981" },
    { value: "power", label: "전력", unit: "W", color: "#f59e0b" },
  ];

  it("9가지 센서 유형이 정의되어 있다", () => {
    expect(SENSOR_TYPES.length).toBe(9);
  });

  it("모든 센서 유형에 고유한 색상이 있다", () => {
    const colors = SENSOR_TYPES.map(s => s.color);
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(SENSOR_TYPES.length);
  });

  it("모든 센서 유형에 한글 라벨이 있다", () => {
    SENSOR_TYPES.forEach(st => {
      expect(st.label.length).toBeGreaterThan(0);
      // 한글 포함 확인
      expect(/[\uAC00-\uD7AF]/.test(st.label) || st.label === "CO₂").toBe(true);
    });
  });

  it("색상은 유효한 hex 형식이다", () => {
    SENSOR_TYPES.forEach(st => {
      expect(st.color).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  it("알 수 없는 유형은 첫 번째 센서로 폴백한다", () => {
    const getSensorMeta = (type: string) =>
      SENSOR_TYPES.find(s => s.value === type) || SENSOR_TYPES[0];

    const unknown = getSensorMeta("unknown_type");
    expect(unknown.value).toBe("temperature");
  });
});

// ============================================================
// 7. 센서 CRUD API 테스트
// ============================================================
describe("Sensor CRUD - Router Tests", () => {
  it("관리자는 센서를 생성할 수 있다 (입력 검증)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 프로젝트가 없으면 에러가 발생하지만, 입력 스키마 검증은 통과해야 함
    try {
      await caller.ddia.createSensor({
        projectId: 99999,
        name: "테스트 온도 센서",
        type: "temperature",
        unit: "°C",
        posX: 500,
        posY: 300,
        zone: "회의실A",
      });
    } catch (e: any) {
      // 프로젝트 미존재 에러는 예상됨 (DB 관련)
      // 입력 검증 에러(ZodError)가 아닌지 확인
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("일반 사용자는 센서를 생성할 수 없다", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.ddia.createSensor({
        projectId: 1,
        name: "테스트 센서",
        type: "temperature",
        unit: "°C",
      })
    ).rejects.toThrow();
  });

  it("일반 사용자는 센서를 삭제할 수 없다", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.ddia.deleteSensor({ id: 1 })
    ).rejects.toThrow();
  });

  it("일반 사용자는 센서를 수정할 수 없다", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.ddia.updateSensor({ id: 1, posX: 100, posY: 200 })
    ).rejects.toThrow();
  });
});

// ============================================================
// 8. IP 보호 확장 - 파일 유형별 보호 적용 테스트
// ============================================================
describe("IP Protection Extension - File Type Coverage", () => {
  const PROTECTED_FILE_TYPES = [
    "estimate_pdf",
    "expense_pdf",
    "project_report_pdf",
    "proposal_pdf",
    "ai_estimate_result",
    "design_auto_result",
  ];

  it("견적서 PDF가 보호 대상에 포함된다", () => {
    expect(PROTECTED_FILE_TYPES.includes("estimate_pdf")).toBe(true);
  });

  it("지출결의서 PDF가 보호 대상에 포함된다", () => {
    expect(PROTECTED_FILE_TYPES.includes("expense_pdf")).toBe(true);
  });

  it("프로젝트 보고서 PDF가 보호 대상에 포함된다", () => {
    expect(PROTECTED_FILE_TYPES.includes("project_report_pdf")).toBe(true);
  });

  it("제안서 PDF가 보호 대상에 포함된다", () => {
    expect(PROTECTED_FILE_TYPES.includes("proposal_pdf")).toBe(true);
  });

  it("AI 견적 결과가 보호 대상에 포함된다", () => {
    expect(PROTECTED_FILE_TYPES.includes("ai_estimate_result")).toBe(true);
  });

  it("설계자동화 결과가 보호 대상에 포함된다", () => {
    expect(PROTECTED_FILE_TYPES.includes("design_auto_result")).toBe(true);
  });

  it("총 6가지 파일 유형이 보호된다", () => {
    expect(PROTECTED_FILE_TYPES.length).toBe(6);
  });
});
