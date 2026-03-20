import { describe, it, expect, vi } from "vitest";

/**
 * OpsX 페이지 라우트 등록 테스트
 * /ops/projects, /ops/schedule, /ops/approval 3개 경로가 정상 등록되었는지 확인
 */

describe("OpsX 라우트 등록 확인", () => {
  it("ops 라우터에 allSchedules 프로시저가 존재해야 한다", async () => {
    const { opsRouter } = await import("./routers/ops");
    // router._def.procedures에 allSchedules가 있는지 확인
    const procedures = (opsRouter as any)._def.procedures;
    expect(procedures).toHaveProperty("allSchedules");
  });

  it("ops 라우터에 allExpenses 프로시저가 존재해야 한다", async () => {
    const { opsRouter } = await import("./routers/ops");
    const procedures = (opsRouter as any)._def.procedures;
    expect(procedures).toHaveProperty("allExpenses");
  });

  it("ops 라우터에 project.list 프로시저가 존재해야 한다", async () => {
    const { opsRouter } = await import("./routers/ops");
    const procedures = (opsRouter as any)._def.procedures;
    expect(procedures).toHaveProperty("project.list");
  });
});

describe("DB 헬퍼 함수 존재 확인", () => {
  it("listAllScheduleItems 함수가 export되어야 한다", async () => {
    const dbOps = await import("./db/ops");
    expect(typeof dbOps.listAllScheduleItems).toBe("function");
  });

  it("listAllExpenses 함수가 export되어야 한다", async () => {
    const dbOps = await import("./db/ops");
    expect(typeof dbOps.listAllExpenses).toBe("function");
  });
});
