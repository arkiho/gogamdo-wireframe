export type SeatingMode = "assigned" | "hybrid" | "hotdesk";
export type SupportSpace =
  | "lounge"
  | "pantry"
  | "server"
  | "storage"
  | "reception"
  | "focus";

export interface OfficeSpaceInput {
  employeeCount: number;
  growthRatePercent: number;
  seatingMode: SeatingMode;
  attendanceRatePercent: number;
  smallMeetingRooms: number;
  mediumMeetingRooms: number;
  largeMeetingRooms: number;
  supportSpaces: SupportSpace[];
}

export interface SpaceBreakdownItem {
  key: string;
  label: string;
  squareMeters: number;
  pyeong: number;
}

export interface OfficeSpaceResult {
  plannedHeadcount: number;
  plannedSeats: number;
  minimumPyeong: number;
  recommendedPyeong: number;
  comfortablePyeong: number;
  breakdown: SpaceBreakdownItem[];
  assumptions: string[];
}

const SQM_PER_PYEONG = 3.305785;
const SEATING_MODES = new Set<SeatingMode>(["assigned", "hybrid", "hotdesk"]);

function assertIntegerRange(label: string, value: number, minimum: number, maximum: number) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${label} 값은 ${minimum}~${maximum} 범위의 정수여야 합니다.`);
  }
}

function toPyeong(squareMeters: number) {
  return Math.round((squareMeters / SQM_PER_PYEONG) * 10) / 10;
}

function roundedPlanningPyeong(squareMeters: number) {
  return Math.ceil(squareMeters / SQM_PER_PYEONG);
}

export function calculateOfficeSpace(input: OfficeSpaceInput): OfficeSpaceResult {
  assertIntegerRange("직원 수", input.employeeCount, 1, 5000);
  assertIntegerRange("성장률", input.growthRatePercent, 0, 200);
  assertIntegerRange("출근율", input.attendanceRatePercent, 0, 100);
  assertIntegerRange("소회의실 수", input.smallMeetingRooms, 0, 100);
  assertIntegerRange("중회의실 수", input.mediumMeetingRooms, 0, 100);
  assertIntegerRange("대회의실 수", input.largeMeetingRooms, 0, 100);
  if (!SEATING_MODES.has(input.seatingMode)) {
    throw new Error("좌석 방식 값이 올바르지 않습니다.");
  }

  const plannedHeadcount = Math.ceil(
    input.employeeCount * (1 + input.growthRatePercent / 100),
  );

  const attendanceRatio = input.attendanceRatePercent / 100;
  const seatRatio =
    input.seatingMode === "assigned"
      ? 1
      : input.seatingMode === "hybrid"
        ? Math.max(0.55, attendanceRatio)
        : Math.max(0.45, attendanceRatio * 0.9);
  const plannedSeats = Math.max(1, Math.ceil(plannedHeadcount * seatRatio));

  const rawBreakdown: Array<[string, string, number]> = [
    ["workstations", "업무 좌석", plannedSeats * 4.8],
    [
      "meetings",
      "회의 공간",
      input.smallMeetingRooms * 8 +
        input.mediumMeetingRooms * 14 +
        input.largeMeetingRooms * 24,
    ],
    ["shared", "복합기·공용 지원", Math.max(6, plannedHeadcount * 0.18)],
  ];

  const supportArea: Record<SupportSpace, () => number> = {
    lounge: () => Math.max(12, plannedHeadcount * 0.6),
    pantry: () => Math.max(8, plannedHeadcount * 0.25),
    server: () => 6,
    storage: () => Math.max(5, plannedHeadcount * 0.15),
    reception: () => 10,
    focus: () => Math.max(6, plannedSeats * 0.3),
  };
  const supportLabels: Record<SupportSpace, string> = {
    lounge: "라운지",
    pantry: "탕비·카페",
    server: "서버실",
    storage: "창고·수납",
    reception: "리셉션",
    focus: "집중업무실",
  };

  for (const space of input.supportSpaces) {
    if (!Object.prototype.hasOwnProperty.call(supportArea, space)) {
      throw new Error("지원공간 값이 올바르지 않습니다.");
    }
  }

  for (const space of Array.from(new Set(input.supportSpaces))) {
    rawBreakdown.push([space, supportLabels[space], supportArea[space]()]);
  }

  const netArea = rawBreakdown.reduce((sum, [, , squareMeters]) => sum + squareMeters, 0);
  const circulationAndServiceArea = netArea * 0.28;
  rawBreakdown.push(["circulation", "동선·벽체·설비 여유", circulationAndServiceArea]);

  const recommendedSquareMeters = netArea + circulationAndServiceArea;
  const breakdown = rawBreakdown
    .filter(([, , squareMeters]) => squareMeters > 0)
    .map(([key, label, squareMeters]) => ({
      key,
      label,
      squareMeters: Math.round(squareMeters * 10) / 10,
      pyeong: toPyeong(squareMeters),
    }));

  return {
    plannedHeadcount,
    plannedSeats,
    minimumPyeong: roundedPlanningPyeong(recommendedSquareMeters * 0.9),
    recommendedPyeong: roundedPlanningPyeong(recommendedSquareMeters),
    comfortablePyeong: roundedPlanningPyeong(recommendedSquareMeters * 1.12),
    breakdown,
    assumptions: [
      "업무 좌석은 좌석당 4.8㎡의 계획 면적을 적용했습니다.",
      "회의실은 소형 8㎡, 중형 14㎡, 대형 24㎡를 적용했습니다.",
      "동선·벽체·기본 설비 여유로 순면적의 28%를 반영했습니다.",
      "건물 코어, 전용률, 기둥, 법정 설비와 현장 조건에 따라 실제 필요면적은 달라질 수 있습니다.",
      "본 결과는 부동산 계약 전 검토를 위한 계획 범위이며 설계·견적 또는 계약상 보장값이 아닙니다.",
    ],
  };
}
