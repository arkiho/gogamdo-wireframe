import { describe, expect, it } from "vitest";
import {
  calculateOfficeSpace,
  type OfficeSpaceInput,
} from "../client/src/lib/officeSpaceCalculator";

const baseInput: OfficeSpaceInput = {
  employeeCount: 30,
  growthRatePercent: 20,
  seatingMode: "assigned",
  attendanceRatePercent: 100,
  smallMeetingRooms: 2,
  mediumMeetingRooms: 1,
  largeMeetingRooms: 0,
  supportSpaces: ["lounge", "pantry", "server", "storage"],
};

describe("anonymous office space calculator", () => {
  it("returns a transparent planning range and breakdown", () => {
    const result = calculateOfficeSpace(baseInput);

    expect(result.plannedHeadcount).toBe(36);
    expect(result.plannedSeats).toBe(36);
    expect(result.minimumPyeong).toBeGreaterThan(0);
    expect(result.recommendedPyeong).toBeGreaterThanOrEqual(result.minimumPyeong);
    expect(result.comfortablePyeong).toBeGreaterThanOrEqual(result.recommendedPyeong);
    expect(result.breakdown.length).toBeGreaterThanOrEqual(3);
    expect(result.assumptions.length).toBeGreaterThan(0);
  });

  it("requires only anonymous workplace inputs", () => {
    expect(Object.keys(baseInput).sort()).toEqual([
      "attendanceRatePercent",
      "employeeCount",
      "growthRatePercent",
      "largeMeetingRooms",
      "mediumMeetingRooms",
      "seatingMode",
      "smallMeetingRooms",
      "supportSpaces",
    ]);
  });

  it("plans fewer seats for hybrid seating than assigned seating", () => {
    const assigned = calculateOfficeSpace(baseInput);
    const hybrid = calculateOfficeSpace({
      ...baseInput,
      seatingMode: "hybrid",
      attendanceRatePercent: 70,
    });

    expect(hybrid.plannedSeats).toBeLessThan(assigned.plannedSeats);
    expect(hybrid.recommendedPyeong).toBeLessThan(assigned.recommendedPyeong);
  });

  it("increases the recommendation when growth or support spaces increase", () => {
    const lean = calculateOfficeSpace({
      ...baseInput,
      growthRatePercent: 0,
      supportSpaces: [],
    });
    const expanded = calculateOfficeSpace({
      ...baseInput,
      growthRatePercent: 30,
      supportSpaces: ["lounge", "pantry", "server", "storage", "reception", "focus"],
    });

    expect(expanded.recommendedPyeong).toBeGreaterThan(lean.recommendedPyeong);
  });

  it("rejects non-integer room counts and unknown support spaces", () => {
    expect(() => calculateOfficeSpace({ ...baseInput, employeeCount: 30.5 })).toThrow();
    expect(() => calculateOfficeSpace({ ...baseInput, smallMeetingRooms: 1.5 })).toThrow();
    expect(() =>
      calculateOfficeSpace({
        ...baseInput,
        supportSpaces: [...baseInput.supportSpaces, "unknown" as any],
      }),
    ).toThrow();
  });

  it("rejects unknown seating modes at runtime", () => {
    expect(() => calculateOfficeSpace({
      ...baseInput,
      seatingMode: "bogus" as any,
    })).toThrow("좌석 방식 값이 올바르지 않습니다.");
  });

  it("accepts documented numeric boundaries", () => {
    expect(() => calculateOfficeSpace({
      ...baseInput,
      employeeCount: 1,
      growthRatePercent: 0,
      attendanceRatePercent: 0,
      smallMeetingRooms: 0,
      mediumMeetingRooms: 0,
      largeMeetingRooms: 0,
    })).not.toThrow();
    expect(() => calculateOfficeSpace({
      ...baseInput,
      employeeCount: 5000,
      growthRatePercent: 200,
      attendanceRatePercent: 100,
      smallMeetingRooms: 100,
      mediumMeetingRooms: 100,
      largeMeetingRooms: 100,
    })).not.toThrow();
  });

  it("rejects out-of-range and non-integer values for every numeric field", () => {
    const invalidValues: Array<[keyof OfficeSpaceInput, number[]]> = [
      ["employeeCount", [0, 5001, 1.5, Number.NaN]],
      ["growthRatePercent", [-1, 201, 10.5, Number.POSITIVE_INFINITY]],
      ["attendanceRatePercent", [-1, 101, 70.5]],
      ["smallMeetingRooms", [-1, 101, 1.5]],
      ["mediumMeetingRooms", [-1, 101, 1.5]],
      ["largeMeetingRooms", [-1, 101, 1.5]],
    ];

    for (const [field, values] of invalidValues) {
      for (const value of values) {
        expect(() => calculateOfficeSpace({ ...baseInput, [field]: value })).toThrow();
      }
    }
  });

  it("counts duplicate support-space selections only once", () => {
    const single = calculateOfficeSpace({ ...baseInput, supportSpaces: ["lounge"] });
    const duplicate = calculateOfficeSpace({
      ...baseInput,
      supportSpaces: ["lounge", "lounge"],
    });
    expect(duplicate).toEqual(single);
  });

  it("rejects impossible employee and percentage inputs", () => {
    expect(() => calculateOfficeSpace({ ...baseInput, employeeCount: 0 })).toThrow();
    expect(() => calculateOfficeSpace({ ...baseInput, growthRatePercent: -1 })).toThrow();
    expect(() => calculateOfficeSpace({ ...baseInput, attendanceRatePercent: 101 })).toThrow();
  });
});
