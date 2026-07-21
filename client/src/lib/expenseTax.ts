/**
 * 지출결의서 세무 자동계산 (4유형).
 *
 * STAFF_UI 계산식 기준. 모든 결과는 담당자가 덮어쓰기 가능(자동값 제안용).
 * 원천징수·세액은 원(1원) 단위 절사(Math.floor). 부가세는 반올림.
 *
 *  - tax_invoice        세금계산서:      소계 = 공급가 + 부가세(공급가×10%)
 *  - withholding        사업소득세:      3.3% 원천징수(사업소득세 3% + 지방소득세 0.3%)
 *  - withholding_expense 사업소득세(경비포함): 경비 제외한 소득분에만 3.3% 원천징수
 *  - daily_worker       일용직:          일용근로 원천징수(근로소득세·지방소득세·고용보험)
 */

export type ExpenseType = "tax_invoice" | "withholding" | "withholding_expense" | "daily_worker";

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  tax_invoice: "세금계산서",
  withholding: "사업소득세",
  withholding_expense: "사업소득세(경비포함)",
  daily_worker: "일용직",
};

/** 세금계산서: 공급가 → 부가세 10%, 소계 */
export interface TaxInvoiceResult {
  supplyAmount: number; // 공급가액
  vat: number;          // 부가세 (공급가×10%, 반올림)
  total: number;        // 소계 = 공급가 + 부가세
}
export function calcTaxInvoice(supplyAmount: number): TaxInvoiceResult {
  const supply = Math.max(0, Math.round(supplyAmount) || 0);
  const vat = Math.round(supply * 0.1);
  return { supplyAmount: supply, vat, total: supply + vat };
}

/** 사업소득세: 지급액 → 3% + 0.3%, 실지급 */
export interface WithholdingResult {
  paymentAmount: number;  // 지급액
  incomeTax: number;      // 사업소득세 3%
  localTax: number;       // 지방소득세 (사업소득세×10% = 지급액×0.3%)
  totalWithholding: number;
  netPayment: number;     // 실지급액
}
export function calcWithholding(paymentAmount: number): WithholdingResult {
  const pay = Math.max(0, Math.round(paymentAmount) || 0);
  const incomeTax = Math.floor(pay * 0.03);
  const localTax = Math.floor(incomeTax * 0.1);
  const totalWithholding = incomeTax + localTax;
  return { paymentAmount: pay, incomeTax, localTax, totalWithholding, netPayment: pay - totalWithholding };
}

/** 사업소득세(경비포함): 지급액 − 경비 = 소득분에만 원천징수 */
export interface WithholdingExpenseResult extends WithholdingResult {
  expenseAmount: number; // 경비 합계 (원천징수 제외)
  incomeAmount: number;  // 소득분 = 지급액 − 경비
}
export function calcWithholdingWithExpense(paymentAmount: number, expenseAmount: number): WithholdingExpenseResult {
  const pay = Math.max(0, Math.round(paymentAmount) || 0);
  const expense = Math.max(0, Math.round(expenseAmount) || 0);
  const income = Math.max(0, pay - expense);
  const incomeTax = Math.floor(income * 0.03);
  const localTax = Math.floor(incomeTax * 0.1);
  const totalWithholding = incomeTax + localTax;
  return {
    paymentAmount: pay,
    expenseAmount: expense,
    incomeAmount: income,
    incomeTax,
    localTax,
    totalWithholding,
    netPayment: pay - totalWithholding,
  };
}

/**
 * 일용직: 일급·일수 → 근로소득세·지방소득세·고용보험, 실지급.
 * - 일 과세표준 = max(0, 일급 − 150,000)
 * - 일 산출세액 = 과세표준 × 6% × (1 − 55% 근로소득세액공제) = 과세표준 × 0.027
 * - 소액부징수: 일 산출세액 1,000원 미만이면 0 (통상 일급 18.7만원 이하 0)
 * - 근로소득세 = 일 산출세액(절사) × 일수
 * - 지방소득세 = 근로소득세 × 10%
 * - 고용보험 = 일급 × 일수 × 0.9%
 */
export interface DailyWorkerResult {
  dailyWage: number;
  days: number;
  grossPay: number;            // 일급 × 일수
  perDayIncomeTax: number;     // 일 근로소득세(소액부징수 반영)
  incomeTax: number;           // 근로소득세 합계
  localTax: number;            // 지방소득세
  employmentInsurance: number; // 고용보험
  totalDeduction: number;
  netPayment: number;          // 실지급액
}
export function calcDailyWorker(dailyWage: number, days: number): DailyWorkerResult {
  const wage = Math.max(0, Math.round(dailyWage) || 0);
  const d = Math.max(0, Math.round(days) || 0);
  const grossPay = wage * d;

  const taxableBase = Math.max(0, wage - 150000);
  let perDayIncomeTax = Math.floor(taxableBase * 0.06 * 0.45); // = ×0.027
  if (perDayIncomeTax < 1000) perDayIncomeTax = 0; // 소액부징수

  const incomeTax = perDayIncomeTax * d;
  const localTax = Math.floor(incomeTax * 0.1);
  const employmentInsurance = Math.floor(grossPay * 0.009);
  const totalDeduction = incomeTax + localTax + employmentInsurance;

  return {
    dailyWage: wage,
    days: d,
    grossPay,
    perDayIncomeTax,
    incomeTax,
    localTax,
    employmentInsurance,
    totalDeduction,
    netPayment: grossPay - totalDeduction,
  };
}
