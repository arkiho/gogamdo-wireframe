/**
 * 안전한 산술 수식 파서 (지출결의서 금액/수량 입력용).
 *
 * `=250000*10`, `=(1000+200)*3`, `= 5000 / 2` 같은 사칙연산 수식을 계산한다.
 * eval/Function 사용 금지 — 직접 토크나이즈 + 재귀 하강 파서.
 * 지원: + - * / , 괄호, 소수, 단항 부호. (셀 참조 a+b 는 후속 확장)
 */

/** 수식이면(=로 시작) 계산 결과를, 아니면 null을 반환. 파싱 실패 시 null. */
export function evaluateFormula(input: string): number | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed.startsWith("=")) return null;
  const expr = trimmed.slice(1);
  try {
    const parser = new Parser(expr);
    const value = parser.parseExpression();
    parser.expectEnd();
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * 입력값을 숫자로 해석한다.
 * - `=…` 수식이면 계산 결과
 * - 그 외에는 콤마 제거 후 숫자 파싱
 * 실패 시 null.
 */
export function parseAmountInput(input: string): number | null {
  const trimmed = (input ?? "").trim();
  if (trimmed === "") return null;
  if (trimmed.startsWith("=")) return evaluateFormula(trimmed);
  const n = Number(trimmed.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

type Tok = { type: "num"; value: number } | { type: "op"; value: string } | { type: "lparen" } | { type: "rparen" };

function tokenize(src: string): Tok[] {
  const tokens: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === " " || ch === "\t") { i++; continue; }
    if (ch === "(") { tokens.push({ type: "lparen" }); i++; continue; }
    if (ch === ")") { tokens.push({ type: "rparen" }); i++; continue; }
    if (ch === "+" || ch === "-" || ch === "*" || ch === "/") { tokens.push({ type: "op", value: ch }); i++; continue; }
    if (ch === "," ) { i++; continue; } // 천단위 콤마 허용
    if ((ch >= "0" && ch <= "9") || ch === ".") {
      let num = "";
      while (i < src.length && ((src[i] >= "0" && src[i] <= "9") || src[i] === "." || src[i] === ",")) {
        if (src[i] !== ",") num += src[i];
        i++;
      }
      const value = Number(num);
      if (!Number.isFinite(value)) throw new Error("invalid number");
      tokens.push({ type: "num", value });
      continue;
    }
    throw new Error("unexpected char: " + ch);
  }
  return tokens;
}

/** 재귀 하강 파서: expression → term → factor */
class Parser {
  private tokens: Tok[];
  private pos = 0;
  constructor(src: string) {
    this.tokens = tokenize(src);
  }
  private peek(): Tok | undefined { return this.tokens[this.pos]; }
  private next(): Tok | undefined { return this.tokens[this.pos++]; }

  parseExpression(): number {
    let value = this.parseTerm();
    for (;;) {
      const t = this.peek();
      if (t && t.type === "op" && (t.value === "+" || t.value === "-")) {
        this.next();
        const rhs = this.parseTerm();
        value = t.value === "+" ? value + rhs : value - rhs;
      } else break;
    }
    return value;
  }

  private parseTerm(): number {
    let value = this.parseFactor();
    for (;;) {
      const t = this.peek();
      if (t && t.type === "op" && (t.value === "*" || t.value === "/")) {
        this.next();
        const rhs = this.parseFactor();
        if (t.value === "/") {
          if (rhs === 0) throw new Error("divide by zero");
          value = value / rhs;
        } else {
          value = value * rhs;
        }
      } else break;
    }
    return value;
  }

  private parseFactor(): number {
    const t = this.peek();
    if (!t) throw new Error("unexpected end");
    // 단항 부호
    if (t.type === "op" && (t.value === "+" || t.value === "-")) {
      this.next();
      const v = this.parseFactor();
      return t.value === "-" ? -v : v;
    }
    if (t.type === "lparen") {
      this.next();
      const v = this.parseExpression();
      const close = this.next();
      if (!close || close.type !== "rparen") throw new Error("missing )");
      return v;
    }
    if (t.type === "num") {
      this.next();
      return t.value;
    }
    throw new Error("unexpected token");
  }

  expectEnd(): void {
    if (this.pos !== this.tokens.length) throw new Error("trailing tokens");
  }
}
