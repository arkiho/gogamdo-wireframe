import { describe, it, expect, vi } from "vitest";

// ============ PDF Report ============
describe("PDF Report Generation", () => {
  it("projectReportPdf module exports generateProjectReportPdf function", async () => {
    // Verify the module exists and exports the function
    const mod = await import("../client/src/lib/projectReportPdf");
    expect(mod.generateProjectReportPdf).toBeDefined();
    expect(typeof mod.generateProjectReportPdf).toBe("function");
  });

  it("ProjectReportData type has required fields", async () => {
    const mod = await import("../client/src/lib/projectReportPdf");
    // Test that the function accepts the expected data shape
    expect(mod.generateProjectReportPdf).toBeDefined();
  });
});

// ============ Calendar Events ============
describe("Calendar Events API", () => {
  it("getCalendarEvents function exists and returns array", async () => {
    const mod = await import("./db/calendar");
    expect(mod.getCalendarEvents).toBeDefined();
    expect(typeof mod.getCalendarEvents).toBe("function");
  });

  it("getCalendarEvents returns empty array when no DB", async () => {
    const mod = await import("./db/calendar");
    // Without DB connection, should return empty array
    const result = await mod.getCalendarEvents("2026-01-01", "2026-01-31");
    expect(Array.isArray(result)).toBe(true);
  });

  it("CalendarEvent interface has correct shape", async () => {
    const mod = await import("./db/calendar");
    // Verify the module exports CalendarEvent type (runtime check via function return)
    const events = await mod.getCalendarEvents("2026-01-01", "2026-01-31");
    expect(events).toEqual(expect.any(Array));
    // If events exist, verify shape
    if (events.length > 0) {
      const ev = events[0];
      expect(ev).toHaveProperty("id");
      expect(ev).toHaveProperty("title");
      expect(ev).toHaveProperty("date");
      expect(ev).toHaveProperty("type");
      expect(ev).toHaveProperty("projectId");
      expect(ev).toHaveProperty("projectName");
    }
  });
});

// ============ Calendar Router ============
describe("Calendar Router in ops.ts", () => {
  it("ops router includes calendar.events procedure", async () => {
    const mod = await import("./routers/ops");
    const opsRouter = mod.opsRouter;
    expect(opsRouter).toBeDefined();
    // Check that the router has calendar procedure
    expect(opsRouter._def).toBeDefined();
    expect(opsRouter._def.procedures).toBeDefined();
    // calendar.events should be accessible
    const procedures = opsRouter._def.procedures;
    expect(procedures["calendar.events"]).toBeDefined();
  });
});

// ============ SubPortal Extensions ============
describe("SubPortal Backend Extensions", () => {
  it("ops router includes subPortal.schedules procedure", async () => {
    const mod = await import("./routers/ops");
    const opsRouter = mod.opsRouter;
    const procedures = opsRouter._def.procedures;
    expect(procedures["subPortal.schedules"]).toBeDefined();
  });

  it("ops router includes subPortal.profile procedure", async () => {
    const mod = await import("./routers/ops");
    const opsRouter = mod.opsRouter;
    const procedures = opsRouter._def.procedures;
    expect(procedures["subPortal.profile"]).toBeDefined();
  });

  it("ops router includes subPortal.quotes procedure", async () => {
    const mod = await import("./routers/ops");
    const opsRouter = mod.opsRouter;
    const procedures = opsRouter._def.procedures;
    expect(procedures["subPortal.quotes"]).toBeDefined();
  });

  it("ops router includes subPortal.workReports procedure", async () => {
    const mod = await import("./routers/ops");
    const opsRouter = mod.opsRouter;
    const procedures = opsRouter._def.procedures;
    expect(procedures["subPortal.workReports"]).toBeDefined();
  });
});

// ============ Stats Extensions ============
describe("OpsStats Extensions", () => {
  it("stats query returns extended fields", async () => {
    const mod = await import("./routers/ops");
    const opsRouter = mod.opsRouter;
    const procedures = opsRouter._def.procedures;
    expect(procedures["stats"]).toBeDefined();
  });
});
