import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ============================================================
// Test Helpers
// ============================================================

type CookieCall = {
  name: string;
  value?: string;
  options: Record<string, unknown>;
};

function createAdminContext(): { ctx: TrpcContext; cookies: CookieCall[] } {
  const cookies: CookieCall[] = [];
  const ctx: TrpcContext = {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@kokamdo.co.kr",
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
      cookies: {},
      ip: "127.0.0.1",
    } as any,
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        cookies.push({ name, options });
      },
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        cookies.push({ name, value, options });
      },
    } as any,
  };
  return { ctx, cookies };
}

function createPublicContext(cookieOverrides?: Record<string, string>): { ctx: TrpcContext; cookies: CookieCall[] } {
  const cookies: CookieCall[] = [];
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
      cookies: cookieOverrides ?? {},
      ip: "192.168.1.100",
    } as any,
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        cookies.push({ name, options });
      },
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        cookies.push({ name, value, options });
      },
    } as any,
  };
  return { ctx, cookies };
}

// ============================================================
// 1. Sensor API Key Management Tests
// ============================================================
describe("센서 API 키 관리", () => {
  it("관리자가 센서 API 키를 생성할 수 있다", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sensorApiKeys.create({
      name: "테스트 센서 키",
      projectId: 1,
    });

    expect(result).toBeDefined();
    expect(result.name).toBe("테스트 센서 키");
    expect(result.apiKey).toBeDefined();
    expect(typeof result.apiKey).toBe("string");
    expect(result.apiKey.length).toBeGreaterThan(10);
  });

  it("관리자가 프로젝트별 API 키 목록을 조회할 수 있다", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sensorApiKeys.list({ projectId: 1 });

    expect(Array.isArray(result)).toBe(true);
  });



  it("관리자가 API 키를 폐기할 수 있다", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 먼저 키 생성
    await caller.sensorApiKeys.create({
      name: "폐기 테스트 키",
      projectId: 1,
    });

    // 목록에서 ID 확인
    const list = await caller.sensorApiKeys.list({ projectId: 1 });
    const target = list.find((k: any) => k.name === "폐기 테스트 키");
    expect(target).toBeDefined();

    // 폐기
    const result = await caller.sensorApiKeys.revoke({ id: target!.id });
    expect(result.success).toBe(true);
  });
});

// ============================================================
// 2. Client Auth Tests
// ============================================================
describe("고객 회원가입/로그인", () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = "TestPass123!";
  let testVerifyToken: string;

  it("고객이 회원가입할 수 있다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clientAuth.register({
      email: testEmail,
      password: testPassword,
      name: "테스트 고객",
      company: "테스트 회사",
      phone: "010-1234-5678",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("회원가입");
    testVerifyToken = result.emailVerifyToken!;
  });

  it("회원가입 후 이메일 인증을 완료한다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.clientAuth.verifyEmail({ token: testVerifyToken });
    expect(result.success).toBe(true);
  });

  it("중복 이메일로 회원가입 시 에러가 발생한다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clientAuth.register({
        email: testEmail,
        password: testPassword,
        name: "중복 고객",
      })
    ).rejects.toThrow();
  });

  it("고객이 로그인할 수 있다", async () => {
    const { ctx, cookies } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clientAuth.login({
      email: testEmail,
      password: testPassword,
    });

    expect(result.success).toBe(true);
    expect(result.client).toBeDefined();
    expect(result.client.email).toBe(testEmail);
    // JWT 쿠키가 설정되었는지 확인
    const clientTokenCookie = cookies.find((c) => c.name === "client_token");
    expect(clientTokenCookie).toBeDefined();
    expect(clientTokenCookie?.value).toBeDefined();
    expect(typeof clientTokenCookie?.value).toBe("string");
  });

  it("잘못된 비밀번호로 로그인 시 에러가 발생한다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clientAuth.login({
        email: testEmail,
        password: "WrongPassword123!",
      })
    ).rejects.toThrow();
  });

  it("존재하지 않는 이메일로 로그인 시 에러가 발생한다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clientAuth.login({
        email: "nonexistent@example.com",
        password: testPassword,
      })
    ).rejects.toThrow();
  });

  it("토큰 없이 me 조회 시 null을 반환한다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clientAuth.me();
    expect(result).toBeNull();
  });

  it("유효한 토큰으로 me 조회 시 고객 정보를 반환한다", async () => {
    // 먼저 로그인하여 토큰 획득
    const { ctx: loginCtx, cookies: loginCookies } = createPublicContext();
    const loginCaller = appRouter.createCaller(loginCtx);

    await loginCaller.clientAuth.login({
      email: testEmail,
      password: testPassword,
    });

    const clientTokenCookie = loginCookies.find((c) => c.name === "client_token");
    expect(clientTokenCookie?.value).toBeDefined();

    // 토큰으로 me 조회
    const { ctx: meCtx } = createPublicContext({
      client_token: clientTokenCookie!.value!,
    });
    const meCaller = appRouter.createCaller(meCtx);

    const result = await meCaller.clientAuth.me();
    expect(result).not.toBeNull();
    expect(result?.email).toBe(testEmail);
    expect(result?.name).toBe("테스트 고객");
  });

  it("고객이 로그아웃할 수 있다", async () => {
    const { ctx, cookies } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clientAuth.logout();
    expect(result.success).toBe(true);

    const clearCookie = cookies.find((c) => c.name === "client_token");
    expect(clearCookie).toBeDefined();
  });

  it("비밀번호가 8자 미만이면 회원가입 에러가 발생한다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clientAuth.register({
        email: "short@example.com",
        password: "short",
        name: "짧은 비밀번호",
      })
    ).rejects.toThrow();
  });

  it("비밀번호 재설정 토큰을 요청할 수 있다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clientAuth.requestPasswordReset({
      email: testEmail,
    });

    // 보안상 항상 성공 메시지 반환 (존재 여부 노출 방지)
    expect(result.success).toBe(true);
  });

  it("존재하지 않는 이메일로 비밀번호 재설정 요청 시에도 성공 메시지를 반환한다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clientAuth.requestPasswordReset({
      email: "nonexistent_reset@example.com",
    });

    expect(result.success).toBe(true);
  });
});

// ============================================================
// 3. DDIA Zone Management Tests
// ============================================================
describe("DDIA 구역 관리", () => {
  it("관리자가 구역을 생성할 수 있다", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ddia.createZone({
      projectId: 1,
      name: "회의실 A",
      zoneType: "meeting",
      polygon: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
      capacity: 10,
      color: "#FF5733",
    });

    expect(result).toBeDefined();
    // createSpaceZone returns { id } from $returningId()
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("number");
  });

  it("관리자가 구역 목록을 조회할 수 있다", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ddia.listZones({ projectId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

// ============================================================
// 4. DDIA Occupancy Event Tests
// ============================================================
describe("DDIA 재실 이벤트", () => {
  it("재실 이벤트를 기록할 수 있다", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ddia.addOccupancyEvent({
      sensorId: 1,
      zoneId: 1,
      projectId: 1,
      eventType: "enter",
      count: 1,
      eventAt: new Date().toISOString(),
    });

    expect(result).toBeDefined();
  });

  it("히트맵 데이터를 조회할 수 있다", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const now = Date.now();
    const result = await caller.ddia.getHeatmapData({
      projectId: 1,
      from: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date(now).toISOString(),
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  // getTrafficFlow 프로시저가 없으므로 제거됨 (동선 분석은 AI 분석에 포함)

  it("시간대별 재실 패턴을 조회할 수 있다", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const now = Date.now();
    const result = await caller.ddia.getHourlyPattern({
      projectId: 1,
      zoneId: 1,
      from: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date(now).toISOString(),
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ============================================================
// 5. DDIA AI Optimization Report Tests
// ============================================================
describe("DDIA AI 최적화 리포트", () => {
  it("프로젝트가 없으면 NOT_FOUND 에러를 반환한다", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const now = Date.now();
    await expect(
      caller.ddia.generateOptimizationReport({
        projectId: 99999,
        from: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date(now).toISOString(),
      })
    ).rejects.toThrow();
  });
});

// ============================================================
// 6. Sensor API Key Validation Tests
// ============================================================
describe("센서 API 키 유효성 검증", () => {
  it("API 키 생성 시 이름이 필수이다", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.sensorApiKeys.create({
        name: "",
        projectId: 1,
      } as any)
    ).rejects.toThrow();
  });

  it("일반 사용자는 API 키를 생성할 수 없다", async () => {
    const { ctx } = createPublicContext();
    // user가 null인 상태에서 protectedProcedure 호출
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.sensorApiKeys.create({
        name: "일반 사용자 키",
        projectId: 1,
      } as any)
    ).rejects.toThrow();
  });
});

// ============================================================
// 7. Client Profile Update Tests
// ============================================================
describe("고객 프로필 관리", () => {
  const profileEmail = `profile_${Date.now()}@example.com`;
  const profilePassword = "ProfilePass123!";
  let clientToken: string;

  beforeAll(async () => {
    // 회원가입
    const { ctx: regCtx } = createPublicContext();
    const regCaller = appRouter.createCaller(regCtx);
    const regResult = await regCaller.clientAuth.register({
      email: profileEmail,
      password: profilePassword,
      name: "프로필 테스트",
      company: "원래 회사",
    });

    // 이메일 인증
    const { ctx: verifyCtx } = createPublicContext();
    const verifyCaller = appRouter.createCaller(verifyCtx);
    await verifyCaller.clientAuth.verifyEmail({ token: regResult.emailVerifyToken! });

    // 로그인하여 토큰 획득
    const { ctx: loginCtx, cookies } = createPublicContext();
    const loginCaller = appRouter.createCaller(loginCtx);
    await loginCaller.clientAuth.login({
      email: profileEmail,
      password: profilePassword,
    });
    const tokenCookie = cookies.find((c) => c.name === "client_token");
    clientToken = tokenCookie!.value!;
  });

  it("고객이 프로필을 수정할 수 있다", async () => {
    const { ctx } = createPublicContext({ client_token: clientToken });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clientAuth.updateProfile({
      name: "수정된 이름",
      company: "수정된 회사",
    });

    expect(result.success).toBe(true);
  });

  it("고객이 비밀번호를 변경할 수 있다", async () => {
    const { ctx } = createPublicContext({ client_token: clientToken });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clientAuth.changePassword({
      currentPassword: profilePassword,
      newPassword: "NewPassword456!",
    });

    expect(result.success).toBe(true);
  });

  it("잘못된 현재 비밀번호로 변경 시 에러가 발생한다", async () => {
    const { ctx } = createPublicContext({ client_token: clientToken });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clientAuth.changePassword({
        currentPassword: "WrongCurrent123!",
        newPassword: "NewPassword789!",
      })
    ).rejects.toThrow();
  });

  it("토큰 없이 프로필 수정 시 에러가 발생한다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clientAuth.updateProfile({
        name: "무인증 수정",
      })
    ).rejects.toThrow();
  });
});

// ============================================================
// 8. Zone Type Validation Tests
// ============================================================
describe("구역 유형 검증", () => {
  it("유효한 구역 유형으로 생성할 수 있다", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const types = ["office", "meeting", "lounge", "corridor", "restroom", "other"];
    for (const zoneType of types) {
      const result = await caller.ddia.createZone({
        projectId: 1,
        name: `${zoneType} 테스트`,
        zoneType,
        polygon: [
          { x: 0, y: 0 },
          { x: 50, y: 0 },
          { x: 50, y: 50 },
          { x: 0, y: 50 },
        ],
      });
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    }
  });
});

// ============================================================
// 9. Email Verification Tests
// ============================================================
describe("이메일 인증 플로우", () => {
  const verifyEmail = `verify_${Date.now()}@example.com`;
  const verifyPassword = "VerifyPass123!";
  let verifyToken: string;

  it("회원가입 시 인증 토큰이 반환된다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clientAuth.register({
      email: verifyEmail,
      password: verifyPassword,
      name: "인증 테스트",
    });

    expect(result.success).toBe(true);
    expect(result.emailVerifyToken).toBeDefined();
    expect(typeof result.emailVerifyToken).toBe("string");
    verifyToken = result.emailVerifyToken!;
  });

  it("미인증 사용자 로그인 시 EMAIL_NOT_VERIFIED 에러가 발생한다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clientAuth.login({
        email: verifyEmail,
        password: verifyPassword,
      })
    ).rejects.toThrow("EMAIL_NOT_VERIFIED");
  });

  it("유효한 토큰으로 이메일 인증이 성공한다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clientAuth.verifyEmail({
      token: verifyToken,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("인증");
  });

  it("인증 후 로그인이 가능하다", async () => {
    const { ctx, cookies } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clientAuth.login({
      email: verifyEmail,
      password: verifyPassword,
    });

    expect(result.success).toBe(true);
    expect(result.client.email).toBe(verifyEmail);
    const tokenCookie = cookies.find((c) => c.name === "client_token");
    expect(tokenCookie).toBeDefined();
  });

  it("이미 사용된 토큰으로 인증 시 에러가 발생한다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clientAuth.verifyEmail({
        token: verifyToken,
      })
    ).rejects.toThrow();
  });

  it("유효하지 않은 토큰으로 인증 시 에러가 발생한다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clientAuth.verifyEmail({
        token: "invalid-token-12345",
      })
    ).rejects.toThrow();
  });

  it("인증 메일을 재발송할 수 있다", async () => {
    // 새 사용자 생성
    const resendEmail = `resend_${Date.now()}@example.com`;
    const { ctx: regCtx } = createPublicContext();
    const regCaller = appRouter.createCaller(regCtx);
    await regCaller.clientAuth.register({
      email: resendEmail,
      password: "ResendPass123!",
      name: "재발송 테스트",
    });

    // 재발송
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.clientAuth.resendVerification({
      email: resendEmail,
    });

    expect(result.success).toBe(true);
    expect(result.emailVerifyToken).toBeDefined();
  });

  it("이미 인증된 사용자의 재발송 요청도 성공 메시지를 반환한다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clientAuth.resendVerification({
      email: verifyEmail, // 이미 인증된 이메일
    });

    expect(result.success).toBe(true);
  });

  it("존재하지 않는 이메일의 재발송 요청도 성공 메시지를 반환한다 (보안)", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clientAuth.resendVerification({
      email: "nonexistent_verify@example.com",
    });

    expect(result.success).toBe(true);
  });
});

// ============================================================
// 관리자 고객 포털 회원 관리 테스트
// ============================================================

describe("clientManagement - 이메일 인증 관리", () => {
  let unverifiedClientId: number;
  const testEmail = `mgmt_${Date.now()}@example.com`;

  beforeAll(async () => {
    // 미인증 고객 생성
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await caller.clientAuth.register({
      email: testEmail,
      password: "MgmtTest123!",
      name: "관리테스트",
    });

    // 관리자로 목록 조회하여 ID 확인
    const { ctx: adminCtx } = createAdminContext();
    const adminCaller = appRouter.createCaller(adminCtx);
    const list = await adminCaller.clientManagement.list();
    const found = list.find((m: any) => m.email === testEmail);
    expect(found).toBeDefined();
    unverifiedClientId = found!.id;
  });

  it("관리자가 고객 목록을 조회할 수 있다", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const list = await caller.clientManagement.list();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });

  it("관리자가 수동으로 이메일 인증을 처리할 수 있다", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.clientManagement.manualVerify({
      clientId: unverifiedClientId,
    });
    expect(result.success).toBe(true);
    expect(result.message).toContain("인증");
  });

  it("이미 인증된 고객에 대한 수동 인증은 안내 메시지를 반환한다", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.clientManagement.manualVerify({
      clientId: unverifiedClientId,
    });
    expect(result.success).toBe(true);
    expect(result.message).toContain("이미 인증");
  });

  it("존재하지 않는 고객 ID로 수동 인증 시 에러가 발생한다", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.clientManagement.manualVerify({ clientId: 999999 })
    ).rejects.toThrow();
  });

  it("관리자가 개별 인증 메일을 재발송할 수 있다", async () => {
    // 새 미인증 고객 생성
    const newEmail = `resend_mgmt_${Date.now()}@example.com`;
    const { ctx: regCtx } = createPublicContext();
    const regCaller = appRouter.createCaller(regCtx);
    await regCaller.clientAuth.register({
      email: newEmail,
      password: "ResendMgmt123!",
      name: "재발송관리",
    });

    const { ctx: adminCtx } = createAdminContext();
    const adminCaller = appRouter.createCaller(adminCtx);
    const list = await adminCaller.clientManagement.list();
    const found = list.find((m: any) => m.email === newEmail);
    expect(found).toBeDefined();

    const result = await adminCaller.clientManagement.resendVerification({
      clientId: found!.id,
    });
    expect(result.success).toBe(true);
    expect(result.message).toContain("재발송");
  });

  it("관리자가 미인증 고객에게 일괄 재발송할 수 있다", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.clientManagement.bulkResendVerification();
    expect(result.success).toBe(true);
    expect(typeof result.count).toBe("number");
  });

  it("관리자가 고객 상태를 변경할 수 있다", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.clientManagement.updateStatus({
      id: unverifiedClientId,
      status: "suspended",
    });
    expect(result.success).toBe(true);
  });

  it("비관리자는 고객 관리 기능에 접근할 수 없다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.clientManagement.list()).rejects.toThrow();
  });
});
