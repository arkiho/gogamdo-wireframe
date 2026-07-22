import { describe, it, expect } from "vitest";
import { rowsToItems } from "@/lib/parseExpenseExcel";

describe("엑셀 내역 파싱 (rowsToItems)", () => {
  it("적요·수량·단가·금액 표준 헤더", () => {
    const rows = [
      ["지출결의서"],
      ["날짜", "적요", "수량", "단가", "금액", "비고"],
      ["2026-07-01", "바닥재", 10, 25000, 250000, "강마루"],
      ["2026-07-02", "페인트", 5, 12000, 60000, ""],
      ["", "합계", "", "", 310000, ""],
    ];
    const items = rowsToItems(rows);
    expect(items).toHaveLength(2); // 합계 행 제외
    expect(items[0]).toMatchObject({ description: "바닥재", quantity: 10, unitPrice: 25000, amount: 250000 });
    expect(items[0].remarks).toContain("강마루");
    expect(items[1]).toMatchObject({ description: "페인트", amount: 60000 });
  });

  it("금액만 있는 시트 → 수량 1, 단가=금액", () => {
    const rows = [
      ["내역", "금액"],
      ["자재 구매", "1,250,000"],
      ["운반비", 80000],
    ];
    const items = rowsToItems(rows);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ description: "자재 구매", quantity: 1, unitPrice: 1250000, amount: 1250000 });
  });

  it("수량·단가만 있고 금액 없으면 계산", () => {
    const rows = [
      ["품목", "수량", "단가"],
      ["합판", 20, 15000],
    ];
    const items = rowsToItems(rows);
    expect(items[0]).toMatchObject({ quantity: 20, unitPrice: 15000, amount: 300000 });
  });

  it("헤더가 없거나 인식 불가하면 빈 배열", () => {
    expect(rowsToItems([["아무거나", "값1"], ["x", "y"]])).toEqual([]);
    expect(rowsToItems([])).toEqual([]);
  });

  it("천단위 콤마·원 표기 금액 파싱", () => {
    const rows = [
      ["적요", "금액"],
      ["임대료", "₩1,500,000원"],
    ];
    const items = rowsToItems(rows);
    expect(items[0].amount).toBe(1500000);
  });

  it("소계/합계 행 및 빈 행 제외", () => {
    const rows = [
      ["적요", "금액"],
      ["항목A", 100000],
      ["소계", 100000],
      ["", ""],
      ["항목B", 200000],
      ["총계", 300000],
    ];
    const items = rowsToItems(rows);
    expect(items.map(i => i.description)).toEqual(["항목A", "항목B"]);
  });
});
