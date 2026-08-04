import {
  MAX_INQUIRY_FREEFORM_LENGTH,
  MAX_INQUIRY_MESSAGE_LENGTH,
  MAX_INQUIRY_QUALIFICATION_FIELD_LENGTH,
} from "@shared/inquiryLimits";

export interface SpaceCalculatorContext {
  source: "space-planning" | null;
  employeeCount: number | null;
  recommendedPyeong: number | null;
}

export interface LeadQualificationInput {
  purpose: string;
  role: string;
  location: string;
  targetDate: string;
  budget: string;
  decisionStage: string;
  leaseStatus: string;
  employeeCount: number | null;
  recommendedPyeong: number | null;
  message: string;
}

const LABELS: Record<string, string> = {
  "office-relocation": "사무실 이전",
  "office-renewal": "기존 사무실 리뉴얼",
  "public-project": "학교·공공기관 관급공사",
  "space-review": "부동산 계약 전 면적 검토",
  other: "기타",
  "decision-maker": "의사결정권자",
  "project-owner": "프로젝트 실무 책임자",
  "researcher": "정보 수집·비교 담당자",
  broker: "부동산·외부 파트너",
  "reviewing-buildings": "후보 건물 검토 중",
  "planning-budget": "예산·일정 기획 중",
  "selecting-vendor": "업체 비교·선정 중",
  "ready-to-start": "즉시 추진 가능",
  "not-signed": "부동산 계약 전",
  negotiating: "계약 협의 중",
  signed: "계약 완료",
  existing: "기존 공간 리뉴얼",
  "under-100m": "1억원 미만",
  "100m-200m": "1억~2억원",
  "200m-500m": "2억~5억원",
  "over-500m": "5억원 이상",
  undecided: "미정",
};

function boundedInteger(value: string | null, min: number, max: number) {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= min && parsed <= max
    ? parsed
    : null;
}

function display(value: string) {
  return LABELS[value] ?? value.trim();
}

export function parseSpaceCalculatorSearch(search: string): SpaceCalculatorContext {
  const params = new URLSearchParams(search);
  return {
    source: params.get("type") === "space-planning" ? "space-planning" : null,
    employeeCount: boundedInteger(params.get("employees"), 1, 5000),
    recommendedPyeong: boundedInteger(params.get("recommended"), 1, 10000),
  };
}

export function buildQualifiedInquiryMessage(input: LeadQualificationInput) {
  if (input.message.length > MAX_INQUIRY_FREEFORM_LENGTH) {
    throw new Error("문의 내용은 8,000자 이하로 작성해 주세요.");
  }

  const boundedFields: Array<[string, string]> = [
    ["프로젝트 목적", input.purpose],
    ["담당자 역할", input.role],
    ["희망 지역", input.location],
    ["희망 착수·입주 시기", input.targetDate],
    ["예산 범위", input.budget],
    ["의사결정 단계", input.decisionStage],
    ["부동산 계약 상태", input.leaseStatus],
  ];
  for (const [label, value] of boundedFields) {
    if (value.length > MAX_INQUIRY_QUALIFICATION_FIELD_LENGTH) {
      throw new Error(`${label}은 ${MAX_INQUIRY_QUALIFICATION_FIELD_LENGTH}자 이하로 작성해 주세요.`);
    }
  }

  const lines: string[] = ["[상담 자격 정보]"];
  const fields: Array<[string, string | number | null]> = [
    ["프로젝트 목적", input.purpose ? display(input.purpose) : null],
    ["담당자 역할", input.role ? display(input.role) : null],
    ["희망 지역", input.location.trim() || null],
    ["희망 착수·입주 시기", input.targetDate.trim() || null],
    ["예산 범위", input.budget ? display(input.budget) : null],
    ["의사결정 단계", input.decisionStage ? display(input.decisionStage) : null],
    ["부동산 계약 상태", input.leaseStatus ? display(input.leaseStatus) : null],
    ["무료진단 입력 인원", input.employeeCount ? `${input.employeeCount}명` : null],
    ["무료진단 권장 면적", input.recommendedPyeong ? `${input.recommendedPyeong}평` : null],
  ];

  for (const [label, value] of fields) {
    if (value !== null) lines.push(`${label}: ${value}`);
  }

  lines.push("", "[문의 내용]", input.message);
  const message = lines.join("\n");
  if (message.length > MAX_INQUIRY_MESSAGE_LENGTH) {
    throw new Error("자격 정보를 포함한 문의 내용이 10,000자를 초과했습니다.");
  }
  return message;
}

export function tryBuildQualifiedInquiryMessage(input: LeadQualificationInput):
  | { ok: true; value: string }
  | { ok: false; error: string } {
  try {
    return { ok: true, value: buildQualifiedInquiryMessage(input) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "문의 내용을 확인해 주세요.",
    };
  }
}

export function submitQualifiedInquiryMessage(
  input: LeadQualificationInput,
  submit: (message: string) => void,
) {
  const result = tryBuildQualifiedInquiryMessage(input);
  if (result.ok) submit(result.value);
  return result;
}
