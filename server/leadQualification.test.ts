import { describe, expect, it, vi } from "vitest";
import {
  buildQualifiedInquiryMessage,
  parseSpaceCalculatorSearch,
  submitQualifiedInquiryMessage,
  tryBuildQualifiedInquiryMessage,
} from "../client/src/lib/leadQualification";

describe("space calculator contact context", () => {
  it("accepts only bounded numeric calculator values", () => {
    expect(
      parseSpaceCalculatorSearch("?type=space-planning&employees=30&recommended=98"),
    ).toEqual({
      source: "space-planning",
      employeeCount: 30,
      recommendedPyeong: 98,
    });

    expect(
      parseSpaceCalculatorSearch("?type=other&employees=-1&recommended=999999"),
    ).toEqual({
      source: null,
      employeeCount: null,
      recommendedPyeong: null,
    });
  });

  it("builds a readable qualification block without inventing empty answers", () => {
    const message = buildQualifiedInquiryMessage({
      purpose: "office-relocation",
      role: "decision-maker",
      location: "서울 성동구",
      targetDate: "2026-11",
      budget: "200m-500m",
      decisionStage: "reviewing-buildings",
      leaseStatus: "not-signed",
      employeeCount: 30,
      recommendedPyeong: 98,
      message: "성장 인원을 반영한 배치 검토가 필요합니다.",
    });

    expect(message).toContain("[상담 자격 정보]");
    expect(message).toContain("프로젝트 목적: 사무실 이전");
    expect(message).toContain("담당자 역할: 의사결정권자");
    expect(message).toContain("무료진단 입력 인원: 30명");
    expect(message).toContain("무료진단 권장 면적: 98평");
    expect(message).toContain("[문의 내용]");
    expect(message).not.toContain("undefined");
  });

  it("preserves allowed free-form content and rejects oversized content", () => {
    const allowed = "가".repeat(8000);
    const message = buildQualifiedInquiryMessage({
      purpose: "",
      role: "",
      location: "",
      targetDate: "",
      budget: "",
      decisionStage: "",
      leaseStatus: "",
      employeeCount: null,
      recommendedPyeong: null,
      message: allowed,
    });

    expect(message).toContain(allowed);
    expect(message.endsWith(allowed)).toBe(true);
    expect(message.length).toBeGreaterThan(8000);
    expect(() => buildQualifiedInquiryMessage({
      purpose: "",
      role: "",
      location: "",
      targetDate: "",
      budget: "",
      decisionStage: "",
      leaseStatus: "",
      employeeCount: null,
      recommendedPyeong: null,
      message: "가".repeat(8001),
    })).toThrow("문의 내용은 8,000자 이하");
  });

  it("rejects oversized qualification fields without throwing from form submission", () => {
    const input = {
      purpose: "office-relocation",
      role: "decision-maker",
      location: "가".repeat(201),
      targetDate: "2026-11",
      budget: "200m-500m",
      decisionStage: "reviewing-buildings",
      leaseStatus: "not-signed",
      employeeCount: 30,
      recommendedPyeong: 98,
      message: "문의 내용",
    };

    expect(() => buildQualifiedInquiryMessage(input)).toThrow("희망 지역은 200자 이하");
    const result = tryBuildQualifiedInquiryMessage(input);
    expect(result).toEqual({
      ok: false,
      error: "희망 지역은 200자 이하로 작성해 주세요.",
    });
  });

  it("never submits invalid or over-limit composed messages", () => {
    const submit = vi.fn();
    const base = {
      purpose: "office-relocation",
      role: "project-owner",
      location: "서울",
      targetDate: "2027-01-01",
      budget: "undecided",
      decisionStage: "planning-budget",
      leaseStatus: "not-signed",
      employeeCount: 30,
      recommendedPyeong: 90,
      message: "정상 문의",
    };

    expect(submitQualifiedInquiryMessage({ ...base, location: "가".repeat(201) }, submit).ok).toBe(false);
    expect(submit).not.toHaveBeenCalled();

    const oversizedRuntimeNumber = { toString: () => "9".repeat(3000) } as unknown as number;
    expect(submitQualifiedInquiryMessage({
      ...base,
      employeeCount: oversizedRuntimeNumber,
      message: "문".repeat(8000),
    }, submit).ok).toBe(false);
    expect(submit).not.toHaveBeenCalled();

    const success = submitQualifiedInquiryMessage(base, submit);
    expect(success.ok).toBe(true);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit.mock.calls[0][0]).toContain("정상 문의");
  });
});
