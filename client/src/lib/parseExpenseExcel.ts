/**
 * 지출결의서 엑셀(.xlsx/.xls) 내역 파서.
 *
 * 결의서 엑셀을 올리면 내역표(날짜·적요·수량·단가·금액·비고)를 읽어
 * 지출 항목(items)으로 변환한다. 헤더 위치·컬럼명이 제각각이라 키워드로 자동 매핑한다.
 * xlsx(SheetJS)는 무거워서 동적 import로 코드 스플릿한다.
 */

export interface ParsedExpenseItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  remarks?: string;
}

// 컬럼 헤더 키워드 → 필드
const HEADER_KEYS: Record<keyof ParsedExpenseItem | "date", string[]> = {
  description: ["적요", "내역", "품목", "내용", "항목", "품명", "item", "description", "desc"],
  quantity: ["수량", "qty", "quantity", "개수"],
  unitPrice: ["단가", "unitprice", "unit price", "unit_price", "가격"],
  amount: ["금액", "합계금액", "공급가", "공급가액", "amount", "total", "가액"],
  remarks: ["비고", "메모", "remark", "remarks", "note", "적요2"],
  date: ["날짜", "일자", "date", "거래일"],
};

function normalize(v: unknown): string {
  return String(v ?? "").trim().toLowerCase().replace(/\s+/g, "");
}

function toNumber(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v ?? "").replace(/[,\s₩원]/g, "").trim();
  if (s === "" || s === "-") return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function matchColumn(headerCell: string, keys: string[]): boolean {
  const h = normalize(headerCell);
  if (!h) return false;
  return keys.some(k => h.includes(normalize(k)));
}

const TOTAL_ROW_RE = /^(합\s*계|소\s*계|총\s*계|계|total|합계금액)$/i;

/**
 * 파일에서 지출 항목을 파싱한다.
 * @returns 파싱된 items (빈 배열이면 인식 실패)
 */
export async function parseExpenseExcel(file: File): Promise<ParsedExpenseItem[]> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return [];

  // 배열-of-배열로 읽기 (빈 행 제거, 기본값 "")
  const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, blankrows: false, defval: "" });
  return rowsToItems(rows);
}

/**
 * 시트의 배열-of-배열 → 지출 항목 변환 (순수 함수, 테스트 대상).
 * 헤더 행을 자동 탐지하고 키워드로 컬럼을 매핑한다.
 */
export function rowsToItems(rows: any[][]): ParsedExpenseItem[] {
  if (rows.length === 0) return [];

  // 헤더 행 탐지: 적요/금액/단가/수량 중 2개 이상 매칭되는 첫 행
  let headerIdx = -1;
  let colMap: Partial<Record<keyof ParsedExpenseItem | "date", number>> = {};
  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const row = rows[r];
    const map: Partial<Record<keyof ParsedExpenseItem | "date", number>> = {};
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      for (const key of Object.keys(HEADER_KEYS) as (keyof typeof HEADER_KEYS)[]) {
        if (map[key] === undefined && matchColumn(cell, HEADER_KEYS[key])) {
          map[key] = c;
        }
      }
    }
    const matched = Object.keys(map).length;
    if (matched >= 2 && (map.description !== undefined || map.amount !== undefined)) {
      headerIdx = r;
      colMap = map;
      break;
    }
  }

  if (headerIdx === -1) return [];

  const items: ParsedExpenseItem[] = [];
  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    const cell = (key: keyof typeof colMap) => (colMap[key] !== undefined ? row[colMap[key]!] : "");

    const description = String(cell("description") ?? "").trim();
    let quantity = toNumber(cell("quantity"));
    let unitPrice = toNumber(cell("unitPrice"));
    let amount = toNumber(cell("amount"));

    // 합계/소계 행 제외
    if (TOTAL_ROW_RE.test(description.replace(/\s/g, ""))) continue;

    // 금액만 있고 수량·단가 없으면 수량 1
    if (amount > 0 && unitPrice === 0 && quantity === 0) { quantity = 1; unitPrice = amount; }
    // 수량·단가만 있고 금액 없으면 계산
    if (amount === 0 && unitPrice > 0) { if (quantity === 0) quantity = 1; amount = quantity * unitPrice; }
    if (quantity === 0 && amount > 0) quantity = 1;

    // 완전 빈 행(내역도 금액도 없음) 스킵
    if (!description && amount === 0) continue;

    const dateVal = String(cell("date") ?? "").trim();
    const remarkVal = String(cell("remarks") ?? "").trim();
    const remarks = [dateVal, remarkVal].filter(Boolean).join(" ") || undefined;

    items.push({
      description: description || "(내역 미상)",
      quantity: quantity || 1,
      unitPrice: unitPrice || amount,
      amount: amount || (quantity * unitPrice),
      remarks,
    });
  }

  return items;
}
