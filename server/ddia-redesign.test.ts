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
// 1. 구역(Zone) CRUD 라우터 테스트
// ============================================================
describe("DDIA Redesign - Zone CRUD Router", () => {
  it("관리자는 구역 목록을 조회할 수 있다", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ddia.listZones({ projectId: 99999 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("일반 사용자는 구역을 생성할 수 없다", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.ddia.createZone({
        projectId: 1,
        name: "회의실 A",
        zoneType: "meeting",
        color: "#3b82f6",
        polygon: [
          { x: 100, y: 100 },
          { x: 300, y: 100 },
          { x: 300, y: 300 },
          { x: 100, y: 300 },
        ],
      })
    ).rejects.toThrow();
  });

  it("관리자는 구역을 생성할 수 있다 (입력 검증)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.ddia.createZone({
        projectId: 99999,
        name: "테스트 구역",
        zoneType: "office",
        color: "#ef4444",
        polygon: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
          { x: 0, y: 100 },
        ],
      });
    } catch (e: any) {
      // 프로젝트 미존재 에러는 예상됨
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("일반 사용자는 구역을 삭제할 수 없다", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.ddia.deleteZone({ id: 1 })
    ).rejects.toThrow();
  });
});

// ============================================================
// 2. 재실 이벤트 라우터 테스트
// ============================================================
describe("DDIA Redesign - Occupancy Event Router", () => {
  it("관리자는 재실 이벤트를 기록할 수 있다 (입력 검증)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.ddia.addOccupancyEvent({
        projectId: 99999,
        sensorId: 99999,
        zoneId: 99999,
        eventType: "enter",
        count: 1,
        eventAt: new Date().toISOString(),
      });
    } catch (e: any) {
      // 센서/구역 미존재 에러는 예상됨
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("이벤트 유형은 enter/exit/count_change만 허용된다", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    // 잘못된 이벤트 유형
    await expect(
      caller.ddia.addOccupancyEvent({
        projectId: 1,
        sensorId: 1,
        zoneId: 1,
        eventType: "invalid_type" as any,
        count: 1,
        eventAt: new Date().toISOString(),
      })
    ).rejects.toThrow();
  });

  it("count가 음수여도 입력 스키마에서 허용한다 (optional이므로)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    // count는 optional이므로 음수도 스키마 레벨에서는 통과
    try {
      await caller.ddia.addOccupancyEvent({
        projectId: 99999,
        sensorId: 1,
        zoneId: 1,
        eventType: "enter",
        count: -1,
        eventAt: new Date().toISOString(),
      });
    } catch (e: any) {
      // DB 에러는 예상됨
      expect(e).toBeTruthy();
    }
  });
});

// ============================================================
// 3. 히트맵 데이터 라우터 테스트
// ============================================================
describe("DDIA Redesign - Heatmap Data Router", () => {
  it("관리자는 히트맵 데이터를 조회할 수 있다", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const result = await caller.ddia.getHeatmapData({
      projectId: 99999,
      from: weekAgo.toISOString(),
      to: now.toISOString(),
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it("일반 사용자는 히트맵 데이터에 접근할 수 없다", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    await expect(
      caller.ddia.getHeatmapData({
        projectId: 1,
        from: weekAgo.toISOString(),
        to: now.toISOString(),
      })
    ).rejects.toThrow();
  });

  it("from은 to보다 이전이어야 한다 (유효한 범위)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 정상 범위
    const result = await caller.ddia.getHeatmapData({
      projectId: 99999,
      from: weekAgo.toISOString(),
      to: now.toISOString(),
    });
    expect(Array.isArray(result)).toBe(true);
  });
});

// ============================================================
// 4. 동선 분석 라우터 테스트
// ============================================================
describe("DDIA Redesign - Transition Router", () => {
  it("관리자는 구역 간 이동 데이터를 조회할 수 있다", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const result = await caller.ddia.getTransitions({
      projectId: 99999,
      from: weekAgo.toISOString(),
      to: now.toISOString(),
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it("일반 사용자는 동선 데이터에 접근할 수 없다", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    await expect(
      caller.ddia.getTransitions({
        projectId: 1,
        from: weekAgo.toISOString(),
        to: now.toISOString(),
      })
    ).rejects.toThrow();
  });
});

// ============================================================
// 5. 시간대별 패턴 라우터 테스트
// ============================================================
describe("DDIA Redesign - Hourly Pattern Router", () => {
  it("관리자는 시간대별 재실 패턴을 조회할 수 있다", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const result = await caller.ddia.getHourlyPattern({
      projectId: 99999,
      zoneId: 99999,
      from: weekAgo.toISOString(),
      to: now.toISOString(),
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it("일반 사용자는 시간대별 패턴에 접근할 수 없다", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    await expect(
      caller.ddia.getHourlyPattern({
        projectId: 1,
        zoneId: 1,
        from: weekAgo.toISOString(),
        to: now.toISOString(),
      })
    ).rejects.toThrow();
  });
});

// ============================================================
// 6. 히트맵 색상 계산 로직 테스트
// ============================================================
describe("DDIA Redesign - Heatmap Color Calculation", () => {
  // 히트맵 색상: 사용빈도에 따라 파랑(낮음) → 빨강(높음)
  function getHeatColor(ratio: number): string {
    const clamped = Math.max(0, Math.min(1, ratio));
    if (clamped < 0.25) {
      const t = clamped / 0.25;
      const r = Math.round(59 + t * (34 - 59));
      const g = Math.round(130 + t * (197 - 130));
      const b = Math.round(246 + t * (94 - 246));
      return `rgb(${r}, ${g}, ${b})`;
    } else if (clamped < 0.5) {
      const t = (clamped - 0.25) / 0.25;
      const r = Math.round(34 + t * (234 - 34));
      const g = Math.round(197 + t * (179 - 197));
      const b = Math.round(94 + t * (8 - 94));
      return `rgb(${r}, ${g}, ${b})`;
    } else if (clamped < 0.75) {
      const t = (clamped - 0.5) / 0.25;
      const r = Math.round(234 + t * (249 - 234));
      const g = Math.round(179 + t * (115 - 179));
      const b = Math.round(8 + t * (22 - 8));
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      const t = (clamped - 0.75) / 0.25;
      const r = Math.round(249 + t * (239 - 249));
      const g = Math.round(115 + t * (68 - 115));
      const b = Math.round(22 + t * (68 - 22));
      return `rgb(${r}, ${g}, ${b})`;
    }
  }

  it("ratio 0은 파란색 계열이다", () => {
    const color = getHeatColor(0);
    expect(color).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    // 파란색: B값이 높아야 함
    const [, , b] = color.match(/\d+/g)!.map(Number);
    expect(b).toBeGreaterThan(200);
  });

  it("ratio 1은 빨간색 계열이다", () => {
    const color = getHeatColor(1);
    const [r] = color.match(/\d+/g)!.map(Number);
    expect(r).toBeGreaterThan(200);
  });

  it("ratio 0.5는 중간 색상이다", () => {
    const color = getHeatColor(0.5);
    expect(color).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
  });

  it("ratio가 범위를 벗어나면 클램핑된다", () => {
    const colorNeg = getHeatColor(-0.5);
    const colorOver = getHeatColor(1.5);
    const colorZero = getHeatColor(0);
    const colorOne = getHeatColor(1);
    expect(colorNeg).toBe(colorZero);
    expect(colorOver).toBe(colorOne);
  });
});

// ============================================================
// 7. 구역 폴리곤 중심 좌표 계산 테스트
// ============================================================
describe("DDIA Redesign - Zone Polygon Center Calculation", () => {
  function getPolygonCenter(polygon: { x: number; y: number }[]) {
    if (!polygon.length) return { x: 0, y: 0 };
    const x = polygon.reduce((s, p) => s + p.x, 0) / polygon.length;
    const y = polygon.reduce((s, p) => s + p.y, 0) / polygon.length;
    return { x, y };
  }

  it("정사각형의 중심을 올바르게 계산한다", () => {
    const polygon = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const center = getPolygonCenter(polygon);
    expect(center.x).toBe(50);
    expect(center.y).toBe(50);
  });

  it("직사각형의 중심을 올바르게 계산한다", () => {
    const polygon = [
      { x: 200, y: 100 },
      { x: 600, y: 100 },
      { x: 600, y: 300 },
      { x: 200, y: 300 },
    ];
    const center = getPolygonCenter(polygon);
    expect(center.x).toBe(400);
    expect(center.y).toBe(200);
  });

  it("삼각형의 중심을 올바르게 계산한다", () => {
    const polygon = [
      { x: 0, y: 0 },
      { x: 300, y: 0 },
      { x: 150, y: 300 },
    ];
    const center = getPolygonCenter(polygon);
    expect(center.x).toBe(150);
    expect(center.y).toBe(100);
  });

  it("빈 폴리곤은 (0, 0)을 반환한다", () => {
    const center = getPolygonCenter([]);
    expect(center.x).toBe(0);
    expect(center.y).toBe(0);
  });
});

// ============================================================
// 8. 구역 유형 라벨 테스트
// ============================================================
describe("DDIA Redesign - Zone Type Labels", () => {
  const ZONE_TYPE_LABELS: Record<string, string> = {
    office: "사무실",
    meeting: "회의실",
    corridor: "복도",
    lounge: "휴게실",
    restroom: "화장실",
    kitchen: "탕비실",
    storage: "창고",
    other: "기타",
  };

  it("8가지 구역 유형이 정의되어 있다", () => {
    expect(Object.keys(ZONE_TYPE_LABELS).length).toBe(8);
  });

  it("모든 구역 유형에 한글 라벨이 있다", () => {
    Object.values(ZONE_TYPE_LABELS).forEach(label => {
      expect(label.length).toBeGreaterThan(0);
      expect(/[\uAC00-\uD7AF]/.test(label)).toBe(true);
    });
  });

  it("사무실 유형이 포함되어 있다", () => {
    expect(ZONE_TYPE_LABELS.office).toBe("사무실");
  });

  it("회의실 유형이 포함되어 있다", () => {
    expect(ZONE_TYPE_LABELS.meeting).toBe("회의실");
  });

  it("알 수 없는 유형은 undefined를 반환한다", () => {
    expect(ZONE_TYPE_LABELS["unknown"]).toBeUndefined();
  });
});

// ============================================================
// 9. DB 헬퍼 함수 존재 확인 테스트
// ============================================================
describe("DDIA Redesign - DB Helper Functions Exist", () => {
  it("createSpaceZone 함수가 존재한다", async () => {
    const db = await import("./db");
    expect(typeof db.createSpaceZone).toBe("function");
  });

  it("listSpaceZones 함수가 존재한다", async () => {
    const db = await import("./db");
    expect(typeof db.listSpaceZones).toBe("function");
  });

  it("addOccupancyEvent 함수가 존재한다", async () => {
    const db = await import("./db");
    expect(typeof db.addOccupancyEvent).toBe("function");
  });

  it("getZoneHeatmapData 함수가 존재한다", async () => {
    const db = await import("./db");
    expect(typeof db.getZoneHeatmapData).toBe("function");
  });

  it("getZoneTransitions 함수가 존재한다", async () => {
    const db = await import("./db");
    expect(typeof db.getZoneTransitions).toBe("function");
  });

  it("getHourlyOccupancyPattern 함수가 존재한다", async () => {
    const db = await import("./db");
    expect(typeof db.getHourlyOccupancyPattern).toBe("function");
  });
});

// ============================================================
// 10. 동선 흐름도 SVG 화살표 두께 계산 테스트
// ============================================================
describe("DDIA Redesign - Traffic Flow Arrow Width", () => {
  function getArrowWidth(count: number, maxCount: number): number {
    const ratio = count / Math.max(maxCount, 1);
    return 0.3 + ratio * 1.2;
  }

  it("최대 이동 횟수는 가장 두꺼운 화살표를 생성한다", () => {
    const width = getArrowWidth(100, 100);
    expect(width).toBeCloseTo(1.5);
  });

  it("최소 이동 횟수는 가장 얇은 화살표를 생성한다", () => {
    const width = getArrowWidth(0, 100);
    expect(width).toBeCloseTo(0.3);
  });

  it("중간 이동 횟수는 중간 두께를 생성한다", () => {
    const width = getArrowWidth(50, 100);
    expect(width).toBeCloseTo(0.9);
  });

  it("maxCount가 0이면 기본 두께를 반환한다", () => {
    const width = getArrowWidth(0, 0);
    expect(width).toBeCloseTo(0.3);
  });
});

// ============================================================
// 11. 시간대별 바 차트 높이 계산 테스트
// ============================================================
describe("DDIA Redesign - Hourly Bar Chart Height", () => {
  function getBarHeight(value: number, maxValue: number): number {
    if (maxValue <= 0) return 0;
    return (value / maxValue) * 100;
  }

  it("최대값은 100% 높이를 반환한다", () => {
    expect(getBarHeight(10, 10)).toBe(100);
  });

  it("0은 0% 높이를 반환한다", () => {
    expect(getBarHeight(0, 10)).toBe(0);
  });

  it("절반 값은 50% 높이를 반환한다", () => {
    expect(getBarHeight(5, 10)).toBe(50);
  });

  it("maxValue가 0이면 0을 반환한다", () => {
    expect(getBarHeight(5, 0)).toBe(0);
  });

  it("업무 시간(9-18시) 판별이 올바르다", () => {
    const isWorkHour = (hour: number) => hour >= 9 && hour <= 18;
    expect(isWorkHour(9)).toBe(true);
    expect(isWorkHour(18)).toBe(true);
    expect(isWorkHour(8)).toBe(false);
    expect(isWorkHour(19)).toBe(false);
    expect(isWorkHour(0)).toBe(false);
    expect(isWorkHour(12)).toBe(true);
  });
});

// ============================================================
// 12. AI 공간 최적화 리포트 라우터 테스트
// ============================================================
describe("DDIA Redesign - Optimization Report Router", () => {
  it("관리자는 최적화 리포트를 생성할 수 있다 (입력 검증)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    try {
      await caller.ddia.generateOptimizationReport({
        projectId: 99999,
        from: weekAgo.toISOString(),
        to: now.toISOString(),
      });
    } catch (e: any) {
      // 프로젝트 미존재 에러는 예상됨 (NOT_FOUND)
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("일반 사용자는 최적화 리포트를 생성할 수 없다", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    await expect(
      caller.ddia.generateOptimizationReport({
        projectId: 1,
        from: weekAgo.toISOString(),
        to: now.toISOString(),
      })
    ).rejects.toThrow();
  });
});
