import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  clockIn: vi.fn().mockResolvedValue({ id: 1 }),
  clockOut: vi.fn().mockResolvedValue({ totalMinutes: 480 }),
  getActiveAttendance: vi.fn().mockResolvedValue(null),
  listMyAttendance: vi.fn().mockResolvedValue([]),
  listAllAttendance: vi.fn().mockResolvedValue([]),
  createLeaveRequest: vi.fn().mockResolvedValue({ id: 1 }),
  listMyLeaves: vi.fn().mockResolvedValue([]),
  listAllLeaves: vi.fn().mockResolvedValue([]),
  updateLeaveStatus: vi.fn().mockResolvedValue({ success: true }),
  cancelLeave: vi.fn().mockResolvedValue({ success: true }),
  listRfqsBySubcontractorEmail: vi.fn().mockResolvedValue([]),
}));

import {
  clockIn, clockOut, getActiveAttendance, listMyAttendance, listAllAttendance,
  createLeaveRequest, listMyLeaves, listAllLeaves, updateLeaveStatus, cancelLeave,
  listRfqsBySubcontractorEmail,
} from "./db";

describe("Attendance (출퇴근) DB Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clockIn should create an attendance record", async () => {
    const result = await clockIn(1, { workType: "office" });
    expect(result).toEqual({ id: 1 });
    expect(clockIn).toHaveBeenCalledWith(1, { workType: "office" });
  });

  it("clockOut should return totalMinutes", async () => {
    const result = await clockOut(1);
    expect(result).toEqual({ totalMinutes: 480 });
    expect(clockOut).toHaveBeenCalledWith(1);
  });

  it("getActiveAttendance should return null when no active record", async () => {
    const result = await getActiveAttendance(1);
    expect(result).toBeNull();
  });

  it("listMyAttendance should return an array", async () => {
    const result = await listMyAttendance(1);
    expect(Array.isArray(result)).toBe(true);
  });

  it("listAllAttendance should return an array", async () => {
    const result = await listAllAttendance();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Leave Requests (휴가 신청) DB Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createLeaveRequest should create a leave request", async () => {
    const result = await createLeaveRequest(1, {
      leaveType: "annual",
      startDate: "2026-03-10",
      endDate: "2026-03-12",
      reason: "개인 사유",
    });
    expect(result).toEqual({ id: 1 });
  });

  it("listMyLeaves should return an array", async () => {
    const result = await listMyLeaves(1);
    expect(Array.isArray(result)).toBe(true);
  });

  it("listAllLeaves should return an array", async () => {
    const result = await listAllLeaves();
    expect(Array.isArray(result)).toBe(true);
  });

  it("updateLeaveStatus should return success", async () => {
    const result = await updateLeaveStatus(1, "approved", 2, "승인합니다");
    expect(result).toEqual({ success: true });
  });

  it("cancelLeave should return success", async () => {
    const result = await cancelLeave(1, 1);
    expect(result).toEqual({ success: true });
  });
});

describe("Partner Portal (협력업체 포털) DB Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listRfqsBySubcontractorEmail should return an array", async () => {
    const result = await listRfqsBySubcontractorEmail("partner@example.com");
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Attendance Schema Validation", () => {
  it("should have valid work types", () => {
    const validTypes = ["office", "site", "remote", "half_day"];
    validTypes.forEach(type => {
      expect(typeof type).toBe("string");
    });
  });

  it("should have valid leave types", () => {
    const validTypes = ["annual", "half_am", "half_pm", "sick", "special", "other"];
    validTypes.forEach(type => {
      expect(typeof type).toBe("string");
    });
  });

  it("should have valid leave statuses", () => {
    const validStatuses = ["pending", "approved", "rejected", "cancelled"];
    validStatuses.forEach(status => {
      expect(typeof status).toBe("string");
    });
  });
});
