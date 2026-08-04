import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Info,
  Ruler,
  Users,
} from "lucide-react";
import SEOHead, { SEO_CONFIG } from "@/components/SEOHead";
import { analytics } from "@/lib/analytics";
import {
  calculateOfficeSpace,
  type OfficeSpaceInput,
  type OfficeSpaceResult,
  type SeatingMode,
  type SupportSpace,
} from "@/lib/officeSpaceCalculator";

const SUPPORT_OPTIONS: Array<{
  value: SupportSpace;
  label: string;
  description: string;
}> = [
  { value: "lounge", label: "라운지", description: "휴식·비공식 협업" },
  { value: "pantry", label: "탕비·카페", description: "음료·식사 지원" },
  { value: "server", label: "서버실", description: "서버·통신 장비" },
  { value: "storage", label: "창고·수납", description: "문서·물품 보관" },
  { value: "reception", label: "리셉션", description: "방문객 응대" },
  { value: "focus", label: "집중업무실", description: "통화·집중 업무" },
];

const DEFAULT_INPUT: OfficeSpaceInput = {
  employeeCount: 30,
  growthRatePercent: 20,
  seatingMode: "assigned",
  attendanceRatePercent: 100,
  smallMeetingRooms: 2,
  mediumMeetingRooms: 1,
  largeMeetingRooms: 0,
  supportSpaces: ["lounge", "pantry", "server", "storage"],
};

function NumberField({
  id,
  label,
  value,
  min = 0,
  max = 100,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block text-sm font-semibold text-ink">{label}</span>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-12 w-full border border-border bg-white px-4 text-ink outline-none transition-colors focus:border-gold"
      />
    </label>
  );
}

export default function OfficeSpaceCalculator() {
  const [input, setInput] = useState<OfficeSpaceInput>(DEFAULT_INPUT);
  const [result, setResult] = useState<OfficeSpaceResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    analytics.spaceCalculatorStart();
  }, []);

  const seatModeDescription = useMemo(() => {
    const descriptions: Record<SeatingMode, string> = {
      assigned: "전 직원에게 고정 좌석을 배정합니다.",
      hybrid: "평균 출근율을 기준으로 일부 좌석을 공유합니다.",
      hotdesk: "좌석 예약·공유를 전제로 계획합니다.",
    };
    return descriptions[input.seatingMode];
  }, [input.seatingMode]);

  function update<K extends keyof OfficeSpaceInput>(
    key: K,
    value: OfficeSpaceInput[K],
  ) {
    setInput((current) => ({ ...current, [key]: value }));
    setResult(null);
  }

  function toggleSupportSpace(space: SupportSpace) {
    update(
      "supportSpaces",
      input.supportSpaces.includes(space)
        ? input.supportSpaces.filter((item) => item !== space)
        : [...input.supportSpaces, space],
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const nextResult = calculateOfficeSpace(input);
      setResult(nextResult);
      analytics.spaceCalculatorComplete(
        input.employeeCount,
        input.seatingMode,
        nextResult.recommendedPyeong,
      );
      requestAnimationFrame(() => {
        document.getElementById("space-result")?.focus();
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "입력값을 확인해 주세요.");
    }
  }

  return (
    <>
      <SEOHead {...SEO_CONFIG.officeSpaceCalculator} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "고감도 계약 전 필요 평수 무료 진단",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "url": "https://kokamdo.co.kr/office-space-calculator",
            "description": "사무실 이전 전 인원, 좌석 방식, 회의실과 지원공간을 입력해 필요 면적 범위를 익명으로 확인하는 도구",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "KRW" },
          }),
        }}
      />
      <main className="min-h-screen bg-paper-warm pb-20 pt-28 lg:pt-36">
        <div className="container max-w-6xl">
          <Link href="/">
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-ink">
              <ArrowLeft className="h-4 w-4" /> 홈페이지로 돌아가기
            </span>
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_0.82fr] lg:items-start">
            <section>
              <p className="text-xs font-semibold tracking-[0.18em] text-gold">BEFORE YOU LEASE</p>
              <h1 className="mt-3 font-heading text-4xl font-bold leading-tight text-ink lg:text-5xl">
                계약 전 필요 평수 무료 진단
              </h1>
              <p className="mt-5 max-w-2xl leading-relaxed text-muted-foreground">
                회사명이나 연락처 없이 인원, 좌석 방식, 회의실과 지원공간을 입력하면
                부동산 계약 전에 검토할 권장 면적 범위를 바로 확인할 수 있습니다.
              </p>

              <div className="mt-6 flex items-start gap-3 border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <Info className="mt-0.5 h-5 w-5 shrink-0" />
                <p>
                  익명 계산 단계에서는 운영 DB나 CRM에 개인정보를 저장하지 않습니다.
                  상세 PDF·상담을 요청할 때만 연락처를 입력합니다.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-8 border border-border/70 bg-white p-6 shadow-sm lg:p-8">
                <fieldset>
                  <legend className="flex items-center gap-2 font-heading text-xl font-bold text-ink">
                    <Users className="h-5 w-5 text-gold" /> 인원과 좌석
                  </legend>
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <NumberField
                      id="employee-count"
                      label="현재 직원 수"
                      value={input.employeeCount}
                      min={1}
                      max={5000}
                      onChange={(value) => update("employeeCount", value)}
                    />
                    <NumberField
                      id="growth-rate"
                      label="계획 기간 내 예상 증가율 (%)"
                      value={input.growthRatePercent}
                      min={0}
                      max={200}
                      onChange={(value) => update("growthRatePercent", value)}
                    />
                  </div>

                  <div className="mt-5">
                    <span className="mb-2 block text-sm font-semibold text-ink">좌석 운영 방식</span>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {([
                        ["assigned", "고정석"],
                        ["hybrid", "하이브리드"],
                        ["hotdesk", "핫데스크"],
                      ] as Array<[SeatingMode, string]>).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={input.seatingMode === value}
                          onClick={() => update("seatingMode", value)}
                          className={`border px-4 py-3 text-sm font-semibold transition-colors ${
                            input.seatingMode === value
                              ? "border-gold bg-gold/10 text-ink"
                              : "border-border text-muted-foreground hover:border-gold/50"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{seatModeDescription}</p>
                  </div>

                  {input.seatingMode !== "assigned" && (
                    <div className="mt-5">
                      <label htmlFor="attendance-rate" className="flex items-center justify-between text-sm font-semibold text-ink">
                        <span>평균 최대 출근율</span>
                        <span>{input.attendanceRatePercent}%</span>
                      </label>
                      <input
                        id="attendance-rate"
                        type="range"
                        min="40"
                        max="100"
                        step="5"
                        value={input.attendanceRatePercent}
                        onChange={(event) => update("attendanceRatePercent", Number(event.target.value))}
                        className="mt-3 w-full accent-gold"
                      />
                    </div>
                  )}
                </fieldset>

                <fieldset>
                  <legend className="flex items-center gap-2 font-heading text-xl font-bold text-ink">
                    <Building2 className="h-5 w-5 text-gold" /> 회의실
                  </legend>
                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    <NumberField id="small-meeting" label="소회의실 (2~4인)" value={input.smallMeetingRooms} onChange={(value) => update("smallMeetingRooms", value)} />
                    <NumberField id="medium-meeting" label="중회의실 (6~8인)" value={input.mediumMeetingRooms} onChange={(value) => update("mediumMeetingRooms", value)} />
                    <NumberField id="large-meeting" label="대회의실 (10인+)" value={input.largeMeetingRooms} onChange={(value) => update("largeMeetingRooms", value)} />
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="font-heading text-xl font-bold text-ink">필요한 지원공간</legend>
                  <p className="mt-2 text-sm text-muted-foreground">필요한 공간을 모두 선택하세요.</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {SUPPORT_OPTIONS.map((option) => {
                      const selected = input.supportSpaces.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleSupportSpace(option.value)}
                          className={`flex items-start gap-3 border p-4 text-left transition-colors ${
                            selected ? "border-gold bg-gold/10" : "border-border hover:border-gold/50"
                          }`}
                        >
                          <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border ${selected ? "border-gold bg-gold text-ink" : "border-border"}`}>
                            {selected && <Check className="h-3.5 w-3.5" />}
                          </span>
                          <span>
                            <strong className="block text-sm text-ink">{option.label}</strong>
                            <span className="mt-1 block text-xs text-muted-foreground">{option.description}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 bg-gold px-6 py-4 text-sm font-semibold text-ink transition-colors hover:bg-gold-light"
                >
                  권장 면적 바로 확인
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </section>

            <aside className="lg:sticky lg:top-28">
              {result ? (
                <section
                  id="space-result"
                  tabIndex={-1}
                  aria-live="polite"
                  className="border border-ink bg-ink p-6 text-white outline-none lg:p-8"
                >
                  <p className="text-xs font-semibold tracking-[0.18em] text-gold">BASIC RESULT</p>
                  <h2 className="mt-3 font-heading text-2xl font-bold">우리 회사의 권장 검토 범위</h2>

                  <div className="mt-7 grid grid-cols-3 gap-2 text-center">
                    <div className="border border-white/15 p-3">
                      <span className="block text-xs text-white/45">최소</span>
                      <strong className="mt-1 block text-2xl text-white">{result.minimumPyeong}</strong>
                      <span className="text-xs text-white/45">평</span>
                    </div>
                    <div className="border border-gold bg-gold/10 p-3">
                      <span className="block text-xs text-gold">권장</span>
                      <strong className="mt-1 block text-3xl text-gold">{result.recommendedPyeong}</strong>
                      <span className="text-xs text-gold/70">평</span>
                    </div>
                    <div className="border border-white/15 p-3">
                      <span className="block text-xs text-white/45">여유</span>
                      <strong className="mt-1 block text-2xl text-white">{result.comfortablePyeong}</strong>
                      <span className="text-xs text-white/45">평</span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="bg-white/5 p-4">
                      <span className="text-xs text-white/45">성장 반영 인원</span>
                      <strong className="mt-1 block text-xl">{result.plannedHeadcount}명</strong>
                    </div>
                    <div className="bg-white/5 p-4">
                      <span className="text-xs text-white/45">계획 좌석</span>
                      <strong className="mt-1 block text-xl">{result.plannedSeats}석</strong>
                    </div>
                  </div>

                  <h3 className="mt-7 font-heading text-lg font-bold">공간별 계획 면적</h3>
                  <div className="mt-3 space-y-2">
                    {result.breakdown.map((item) => (
                      <div key={item.key} className="flex items-center justify-between border-b border-white/10 py-2 text-sm">
                        <span className="text-white/65">{item.label}</span>
                        <strong>{item.pyeong.toLocaleString()}평</strong>
                      </div>
                    ))}
                  </div>

                  <div className="mt-7 border border-white/15 p-4">
                    <h3 className="text-sm font-semibold text-white">계산 기준과 주의사항</h3>
                    <ul className="mt-3 space-y-2 text-xs leading-relaxed text-white/50">
                      {result.assumptions.map((assumption) => (
                        <li key={assumption}>• {assumption}</li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href={`/contact?type=space-planning&employees=${input.employeeCount}&recommended=${result.recommendedPyeong}`}
                    onClick={() => analytics.spaceCalculatorLeadClick(result.recommendedPyeong)}
                  >
                    <span className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-gold px-6 py-4 text-sm font-semibold text-ink hover:bg-gold-light">
                      상세 PDF·상담 요청
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                  <p className="mt-3 text-center text-xs text-white/40">이 단계에서만 연락처를 입력합니다.</p>
                </section>
              ) : (
                <section className="border border-border/70 bg-white p-7 lg:p-8">
                  <Ruler className="h-8 w-8 text-gold" />
                  <h2 className="mt-5 font-heading text-2xl font-bold text-ink">입력을 완료하면 결과가 여기에 표시됩니다</h2>
                  <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
                    {["최소·권장·여유 면적 범위", "성장률을 반영한 인원과 좌석", "회의실·지원공간별 면적 배분", "적용한 계산 가정과 주의사항"].map((item) => (
                      <li key={item} className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
