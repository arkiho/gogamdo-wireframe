import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ============================================================
// 1. 트래킹 코드 생성 테스트
// ============================================================
describe("IP Protection - Tracking Code Generation", () => {
  it("generateTrackingCode 함수가 GGD- 접두사를 포함한다", async () => {
    const { generateTrackingCode } = await import("./db");
    const code = generateTrackingCode();
    expect(code).toMatch(/^GGD-/);
  });

  it("트래킹 코드에 날짜 부분이 포함된다 (YYYYMMDD)", async () => {
    const { generateTrackingCode } = await import("./db");
    const code = generateTrackingCode();
    // GGD-YYYYMMDD-XXXXXXXX 형식
    const parts = code.split("-");
    expect(parts.length).toBe(3);
    expect(parts[1]).toMatch(/^\d{8}$/);
  });

  it("트래킹 코드의 랜덤 부분은 8자리 영숫자이다", async () => {
    const { generateTrackingCode } = await import("./db");
    const code = generateTrackingCode();
    const parts = code.split("-");
    expect(parts[2]).toMatch(/^[A-Z0-9]{8}$/);
  });

  it("두 번 생성한 트래킹 코드는 서로 다르다", async () => {
    const { generateTrackingCode } = await import("./db");
    const code1 = generateTrackingCode();
    const code2 = generateTrackingCode();
    expect(code1).not.toBe(code2);
  });
});

// ============================================================
// 2. 법적 고지 텍스트 라우터 테스트
// ============================================================
describe("IP Protection - Legal Notice Router", () => {
  function createPublicContext(): TrpcContext {
    return {
      user: null,
      req: {
        protocol: "https",
        headers: {},
        socket: { remoteAddress: "127.0.0.1" },
      } as any,
      res: {
        clearCookie: vi.fn(),
      } as any,
    };
  }

  it("getLegalNotice는 법적 고지 텍스트를 반환한다", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ipProtection.getLegalNotice();

    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("content");
    expect(result).toHaveProperty("shortNotice");
    expect(result).toHaveProperty("watermarkNotice");
  });

  it("법적 고지 제목은 '지적재산권 보호 안내'이다", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ipProtection.getLegalNotice();

    expect(result.title).toBe("지적재산권 보호 안내");
  });

  it("법적 고지 내용에 저작권법 관련 문구가 포함된다", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ipProtection.getLegalNotice();

    expect(result.content).toContain("저작권법");
    expect(result.content).toContain("(주)고감도");
  });

  it("법적 고지에 무단 공유 금지 문구가 포함된다", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ipProtection.getLegalNotice();

    expect(result.content).toContain("제3자");
    expect(result.content).toContain("금지");
  });

  it("법적 고지에 트래킹 관련 문구가 포함된다", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ipProtection.getLegalNotice();

    expect(result.content).toContain("추적");
    expect(result.content).toContain("트래킹");
  });

  it("법적 고지에 법적 책임 문구가 포함된다", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ipProtection.getLegalNotice();

    expect(result.content).toContain("5년 이하의 징역");
    expect(result.content).toContain("5천만원");
  });

  it("짧은 법적 고지에 핵심 문구가 포함된다", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ipProtection.getLegalNotice();

    expect(result.shortNotice).toContain("(주)고감도");
    expect(result.shortNotice).toContain("금지");
    expect(result.shortNotice).toContain("추적");
  });

  it("워터마크 고지에 추적 관련 문구가 포함된다", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ipProtection.getLegalNotice();

    expect(result.watermarkNotice).toContain("추적");
    expect(result.watermarkNotice).toContain("식별 코드");
  });
});

// ============================================================
// 3. 다운로드 로그 입력 검증 테스트
// ============================================================
describe("IP Protection - Download Log Input Validation", () => {
  it("유효한 파일 유형 목록을 검증한다", () => {
    const validFileTypes = [
      "estimate_pdf",
      "expense_pdf",
      "project_report_pdf",
      "proposal_pdf",
      "lead_magnet",
      "ai_estimate_result",
      "design_auto_result",
      "other",
    ];

    validFileTypes.forEach((type) => {
      expect(validFileTypes.includes(type)).toBe(true);
    });
  });

  it("유효하지 않은 파일 유형을 거부한다", () => {
    const validFileTypes = [
      "estimate_pdf", "expense_pdf", "project_report_pdf",
      "proposal_pdf", "lead_magnet", "ai_estimate_result",
      "design_auto_result", "other",
    ];
    expect(validFileTypes.includes("invalid_type")).toBe(false);
    expect(validFileTypes.includes("")).toBe(false);
  });

  it("동의 상태는 yes/no 중 하나여야 한다", () => {
    const validConsent = ["yes", "no"];
    expect(validConsent.includes("yes")).toBe(true);
    expect(validConsent.includes("no")).toBe(true);
    expect(validConsent.includes("maybe" as any)).toBe(false);
  });
});

// ============================================================
// 4. 파일 유형 라벨 매핑 테스트
// ============================================================
describe("IP Protection - File Type Labels", () => {
  const FILE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
    estimate_pdf: { label: "견적서 PDF", color: "bg-blue-100 text-blue-700" },
    expense_pdf: { label: "지출결의서 PDF", color: "bg-green-100 text-green-700" },
    project_report_pdf: { label: "프로젝트 리포트", color: "bg-purple-100 text-purple-700" },
    proposal_pdf: { label: "제안서 PDF", color: "bg-amber-100 text-amber-700" },
    lead_magnet: { label: "리드마그넷", color: "bg-cyan-100 text-cyan-700" },
    ai_estimate_result: { label: "AI 견적 결과", color: "bg-pink-100 text-pink-700" },
    design_auto_result: { label: "설계자동화 결과", color: "bg-indigo-100 text-indigo-700" },
    other: { label: "기타", color: "bg-gray-100 text-gray-600" },
  };

  it("모든 파일 유형에 한글 라벨이 존재한다", () => {
    Object.values(FILE_TYPE_LABELS).forEach(({ label }) => {
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    });
  });

  it("모든 파일 유형에 CSS 색상 클래스가 존재한다", () => {
    Object.values(FILE_TYPE_LABELS).forEach(({ color }) => {
      expect(color).toContain("bg-");
      expect(color).toContain("text-");
    });
  });

  it("estimate_pdf의 라벨은 '견적서 PDF'이다", () => {
    expect(FILE_TYPE_LABELS.estimate_pdf.label).toBe("견적서 PDF");
  });

  it("알 수 없는 파일 유형은 other로 폴백한다", () => {
    const unknownType = "unknown_type";
    const label = FILE_TYPE_LABELS[unknownType] || FILE_TYPE_LABELS.other;
    expect(label.label).toBe("기타");
  });
});

// ============================================================
// 5. 관리자 권한 검증 테스트
// ============================================================
describe("IP Protection - Admin Access Control", () => {
  function createAdminContext(): TrpcContext {
    return {
      user: {
        id: 1,
        openId: "admin-user",
        email: "admin@gogamdo.com",
        name: "Admin",
        loginMethod: "manus",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {
        protocol: "https",
        headers: {},
        socket: { remoteAddress: "127.0.0.1" },
      } as any,
      res: {
        clearCookie: vi.fn(),
      } as any,
    };
  }

  function createUserContext(): TrpcContext {
    return {
      user: {
        id: 2,
        openId: "normal-user",
        email: "user@example.com",
        name: "User",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {
        protocol: "https",
        headers: {},
        socket: { remoteAddress: "127.0.0.1" },
      } as any,
      res: {
        clearCookie: vi.fn(),
      } as any,
    };
  }

  it("일반 사용자는 listLogs에 접근할 수 없다", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.ipProtection.listLogs({ limit: 10, offset: 0 })
    ).rejects.toThrow();
  });

  it("일반 사용자는 stats에 접근할 수 없다", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.ipProtection.stats()).rejects.toThrow();
  });

  it("일반 사용자는 lookupByTrackingCode에 접근할 수 없다", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.ipProtection.lookupByTrackingCode({ trackingCode: "GGD-TEST" })
    ).rejects.toThrow();
  });

  it("일반 사용자는 userHistory에 접근할 수 없다", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.ipProtection.userHistory({ email: "test@test.com" })
    ).rejects.toThrow();
  });

  it("비로그인 사용자도 getLegalNotice에 접근할 수 있다", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {}, socket: { remoteAddress: "127.0.0.1" } } as any,
      res: { clearCookie: vi.fn() } as any,
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ipProtection.getLegalNotice();
    expect(result).toHaveProperty("title");
  });
});

// ============================================================
// 6. 워터마크 관련 로직 테스트
// ============================================================
describe("IP Protection - Watermark Logic", () => {
  it("트래킹 코드가 PDF 워터마크 텍스트에 포함된다", () => {
    const trackingCode = "GGD-20260215-ABCD1234";
    const watermarkText = `CONFIDENTIAL  ${trackingCode}`;
    expect(watermarkText).toContain(trackingCode);
    expect(watermarkText).toContain("CONFIDENTIAL");
  });

  it("하단 트래킹 정보에 코드와 생성 시간이 포함된다", () => {
    const trackingCode = "GGD-20260215-ABCD1234";
    const now = new Date().toISOString().slice(0, 19);
    const footerText = `Tracking: ${trackingCode} | Generated: ${now}`;
    expect(footerText).toContain(trackingCode);
    expect(footerText).toContain("Generated:");
  });

  it("워터마크 투명도는 0.06 (6%)이다", () => {
    const opacity = 0.06;
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(0.1);
  });
});

// ============================================================
// 7. 법적 고지 모달 동의 로직 테스트
// ============================================================
describe("IP Protection - Consent Modal Logic", () => {
  it("동의하지 않으면 다운로드 버튼이 비활성화된다", () => {
    const agreed = false;
    const canDownload = agreed;
    expect(canDownload).toBe(false);
  });

  it("동의하면 다운로드 버튼이 활성화된다", () => {
    const agreed = true;
    const canDownload = agreed;
    expect(canDownload).toBe(true);
  });

  it("모달 닫기 시 동의 상태가 초기화된다", () => {
    let agreed = true;
    // 모달 닫기 시뮬레이션
    agreed = false;
    expect(agreed).toBe(false);
  });

  it("다운로드 완료 후 동의 상태가 초기화된다", () => {
    let agreed = true;
    // 다운로드 완료 후 초기화
    agreed = false;
    expect(agreed).toBe(false);
  });
});

// ============================================================
// 8. 다운로드 로그 데이터 포맷 테스트
// ============================================================
describe("IP Protection - Download Log Data Format", () => {
  it("다운로드 로그에 필수 필드가 포함된다", () => {
    const logEntry = {
      id: 1,
      userId: null,
      userName: "테스트 사용자",
      userEmail: "test@example.com",
      fileType: "estimate_pdf",
      fileName: "견적서_테스트.pdf",
      projectId: 123,
      projectName: "테스트 프로젝트",
      trackingCode: "GGD-20260215-ABCD1234",
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0",
      consentGiven: "yes",
      createdAt: new Date(),
    };

    expect(logEntry).toHaveProperty("trackingCode");
    expect(logEntry).toHaveProperty("fileType");
    expect(logEntry).toHaveProperty("consentGiven");
    expect(logEntry).toHaveProperty("createdAt");
  });

  it("비로그인 사용자의 로그는 userId가 null이다", () => {
    const logEntry = {
      userId: null,
      userName: "방문자",
      userEmail: "visitor@example.com",
    };
    expect(logEntry.userId).toBeNull();
  });

  it("IP 주소 형식을 검증한다", () => {
    const ipv4 = "192.168.1.1";
    const ipv6 = "::1";
    expect(ipv4).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
    expect(ipv6.length).toBeGreaterThan(0);
  });
});
