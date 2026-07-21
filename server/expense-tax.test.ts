import { describe, it, expect } from "vitest";
import { evaluateFormula, parseAmountInput } from "@/lib/formula";
import {
  calcTaxInvoice, calcWithholding, calcWithholdingWithExpense, calcDailyWorker,
} from "@/lib/expenseTax";

describe("formula parser (안전 수식)", () => {
  it("= 없으면 null", () => {
    expect(evaluateFormula("250000")).toBeNull();
  });
  it("곱셈", () => {
    expect(evaluateFormula("=250000*10")).toBe(2500000);
  });
  it("사칙연산 우선순위", () => {
    expect(evaluateFormula("=1000+200*3")).toBe(1600);
  });
  it("괄호", () => {
    expect(evaluateFormula("=(1000+200)*3")).toBe(3600);
  });
  it("공백·단항부호", () => {
    expect(evaluateFormula("= -5 + 10")).toBe(5);
  });
  it("천단위 콤마 허용", () => {
    expect(evaluateFormula("=250,000*10")).toBe(2500000);
  });
  it("0으로 나누기 → null", () => {
    expect(evaluateFormula("=10/0")).toBeNull();
  });
  it("잘못된 수식 → null (eval 미사용)", () => {
    expect(evaluateFormula("=alert(1)")).toBeNull();
    expect(evaluateFormula("=1+")).toBeNull();
    expect(evaluateFormula("=1;2")).toBeNull();
  });
});

describe("parseAmountInput", () => {
  it("일반 숫자", () => expect(parseAmountInput("250000")).toBe(250000));
  it("콤마 숫자", () => expect(parseAmountInput("1,250,000")).toBe(1250000));
  it("수식", () => expect(parseAmountInput("=1000*3")).toBe(3000));
  it("빈값 → null", () => expect(parseAmountInput("")).toBeNull());
});

describe("세금계산서 (tax_invoice)", () => {
  it("공급가 1,000,000 → 부가세 100,000, 소계 1,100,000", () => {
    expect(calcTaxInvoice(1000000)).toEqual({ supplyAmount: 1000000, vat: 100000, total: 1100000 });
  });
});

describe("사업소득세 (withholding 3.3%)", () => {
  it("지급액 1,000,000 → 소득세 30,000 / 지방 3,000 / 실지급 967,000", () => {
    const r = calcWithholding(1000000);
    expect(r.incomeTax).toBe(30000);
    expect(r.localTax).toBe(3000);
    expect(r.totalWithholding).toBe(33000);
    expect(r.netPayment).toBe(967000);
  });
  it("원단위 절사", () => {
    // 333,333 × 3% = 9,999.99 → 9,999
    const r = calcWithholding(333333);
    expect(r.incomeTax).toBe(9999);
    expect(r.localTax).toBe(999); // 9999×10%=999.9 → 999
  });
});

describe("사업소득세(경비포함) (withholding_expense)", () => {
  it("지급 1,000,000 경비 400,000 → 소득분 600,000에만 원천징수", () => {
    const r = calcWithholdingWithExpense(1000000, 400000);
    expect(r.incomeAmount).toBe(600000);
    expect(r.incomeTax).toBe(18000); // 600,000×3%
    expect(r.localTax).toBe(1800);
    expect(r.netPayment).toBe(1000000 - 19800); // 지급액에서 원천징수만 차감
  });
});

describe("일용직 (daily_worker)", () => {
  it("일급 150,000 이하 → 근로소득세 0 (과세표준 0)", () => {
    const r = calcDailyWorker(150000, 10);
    expect(r.incomeTax).toBe(0);
    expect(r.localTax).toBe(0);
    expect(r.employmentInsurance).toBe(Math.floor(1500000 * 0.009)); // 13,500
  });
  it("일급 187,000 → 소액부징수로 근로소득세 0", () => {
    // (187,000-150,000)=37,000 ×0.027 = 999 < 1000 → 0
    const r = calcDailyWorker(187000, 5);
    expect(r.perDayIncomeTax).toBe(0);
    expect(r.incomeTax).toBe(0);
  });
  it("일급 200,000 → 일 산출세액 1,350 징수", () => {
    // (200,000-150,000)=50,000 ×0.027 = 1,350 ≥ 1000
    const r = calcDailyWorker(200000, 10);
    expect(r.perDayIncomeTax).toBe(1350);
    expect(r.incomeTax).toBe(13500);
    expect(r.localTax).toBe(1350);
    expect(r.employmentInsurance).toBe(Math.floor(2000000 * 0.009)); // 18,000
    expect(r.grossPay).toBe(2000000);
    expect(r.netPayment).toBe(2000000 - 13500 - 1350 - 18000);
  });
});
