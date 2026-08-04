import { describe, expect, it, beforeAll, vi } from "vitest";

const partnerFixture = vi.hoisted(() => ({
  nextId: 1,
  trades: [] as any[],
  registrations: [] as any[],
  subcontractors: [] as any[],
  subcontractorTrades: new Map<number, number[]>(),
  templates: [] as any[],
  contracts: [] as any[],
  projects: [] as any[],
  purchaseOrders: [] as any[],
}));

const nextFixtureId = () => partnerFixture.nextId++;

vi.mock("./_core/notification", () => ({ notifyOwner: vi.fn(async () => true) }));

vi.mock("./db/ops", async importOriginal => {
  const actual = await importOriginal<typeof import("./db/ops")>();
  return {
    ...actual,
    notifyAdminsAndPMs: vi.fn(async () => true),
    createTradeCategory: vi.fn(async (data: any) => {
      const row = { id: nextFixtureId(), ...data };
      partnerFixture.trades.push(row);
      return row;
    }),
    listTradeCategories: vi.fn(async () => [...partnerFixture.trades]),
    getTradeCategory: vi.fn(async (id: number) => partnerFixture.trades.find(row => row.id === id) ?? null),
    updateTradeCategory: vi.fn(async (id: number, data: any) => {
      Object.assign(partnerFixture.trades.find(row => row.id === id) ?? {}, data);
    }),
    deleteTradeCategory: vi.fn(async (id: number) => {
      partnerFixture.trades = partnerFixture.trades.filter(row => row.id !== id);
    }),
    createSubRegistration: vi.fn(async (data: any) => {
      const row = { id: nextFixtureId(), status: "pending", ...data };
      partnerFixture.registrations.push(row);
      return row;
    }),
    listSubRegistrations: vi.fn(async (status?: string) => status
      ? partnerFixture.registrations.filter(row => row.status === status)
      : [...partnerFixture.registrations]
    ),
    getSubRegistration: vi.fn(async (id: number) => partnerFixture.registrations.find(row => row.id === id) ?? null),
    updateSubRegistration: vi.fn(async (id: number, data: any) => {
      Object.assign(partnerFixture.registrations.find(row => row.id === id) ?? {}, data);
    }),
    createSubcontractor: vi.fn(async (data: any) => {
      const row = { id: nextFixtureId(), ...data };
      partnerFixture.subcontractors.push(row);
      return row;
    }),
    getSubcontractor: vi.fn(async (id: number) => partnerFixture.subcontractors.find(row => row.id === id) ?? null),
    setSubcontractorTrades: vi.fn(async (subcontractorId: number, tradeIds: number[]) => {
      partnerFixture.subcontractorTrades.set(subcontractorId, [...tradeIds]);
    }),
    getSubcontractorTrades: vi.fn(async (subcontractorId: number) =>
      partnerFixture.subcontractorTrades.get(subcontractorId) ?? []
    ),
    getSubcontractorsByTrade: vi.fn(async (tradeId: number) => partnerFixture.subcontractors.filter(row =>
      partnerFixture.subcontractorTrades.get(row.id)?.includes(tradeId)
    )),
    getSubcontractorsByTradeIds: vi.fn(async (tradeIds: number[]) => partnerFixture.subcontractors.filter(row =>
      partnerFixture.subcontractorTrades.get(row.id)?.some(id => tradeIds.includes(id))
    )),
    createTradeContractTemplate: vi.fn(async (data: any) => {
      const row = { id: nextFixtureId(), isActive: 1, ...data };
      partnerFixture.templates.push(row);
      return row;
    }),
    listTradeContractTemplates: vi.fn(async (tradeCategoryId?: number) => tradeCategoryId
      ? partnerFixture.templates.filter(row => row.tradeCategoryId === tradeCategoryId)
      : [...partnerFixture.templates]
    ),
    getTradeContractTemplate: vi.fn(async (id: number) => partnerFixture.templates.find(row => row.id === id) ?? null),
    updateTradeContractTemplate: vi.fn(async (id: number, data: any) => {
      Object.assign(partnerFixture.templates.find(row => row.id === id) ?? {}, data);
    }),
    createSubContract: vi.fn(async (data: any) => {
      const row = { id: nextFixtureId(), status: "draft", ...data };
      partnerFixture.contracts.push(row);
      return row;
    }),
    listSubContracts: vi.fn(async (subcontractorId?: number) => subcontractorId
      ? partnerFixture.contracts.filter(row => row.subcontractorId === subcontractorId)
      : [...partnerFixture.contracts]
    ),
    getSubContract: vi.fn(async (id: number) => partnerFixture.contracts.find(row => row.id === id) ?? null),
    updateSubContract: vi.fn(async (id: number, data: any) => {
      Object.assign(partnerFixture.contracts.find(row => row.id === id) ?? {}, data);
    }),
    createOpsProject: vi.fn(async (data: any) => {
      const row = { id: nextFixtureId(), ...data };
      partnerFixture.projects.push(row);
      return row;
    }),
    listOpsProjects: vi.fn(async () => [...partnerFixture.projects]),
    createPurchaseOrder: vi.fn(async (data: any) => {
      const row = { id: nextFixtureId(), status: "draft", ...data };
      partnerFixture.purchaseOrders.push(row);
      return row;
    }),
    listPurchaseOrders: vi.fn(async (projectId?: number) => projectId
      ? partnerFixture.purchaseOrders.filter(row => row.projectId === projectId)
      : [...partnerFixture.purchaseOrders]
    ),
    getPurchaseOrder: vi.fn(async (id: number) => partnerFixture.purchaseOrders.find(row => row.id === id) ?? null),
    updatePurchaseOrder: vi.fn(async (id: number, data: any) => {
      Object.assign(partnerFixture.purchaseOrders.find(row => row.id === id) ?? {}, data);
    }),
  };
});
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createStaffContext(role: "admin" | "user" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "staff-user",
    email: "staff@gogamdo.com",
    name: "테스트 직원",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    department: "construction",
    opsRole: "pm",
  } as any;
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return createStaffContext("admin");
}

const uniqueSuffix = () => Math.random().toString(36).slice(2, 8).toUpperCase();

describe("OpsX Partners - Trade Categories", () => {
  const adminCaller = appRouter.createCaller(createAdminContext());
  const staffCaller = appRouter.createCaller(createStaffContext());

  let tradeCategoryId: number;
  const code = `ELEC${uniqueSuffix()}`;

  it("admin can create a trade category", async () => {
    const result = await adminCaller.ops.trade.create({
      name: `전기공사-${code}`,
      code,
      description: "전기 배선 및 조명 공사",
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
    tradeCategoryId = result.id;
  });

  it("staff can list trade categories", async () => {
    const list = await staffCaller.ops.trade.list();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });

  it("admin can update a trade category", async () => {
    const result = await adminCaller.ops.trade.update({
      id: tradeCategoryId,
      description: "전기 배선, 조명, 콘센트 공사",
    });
    expect(result.success).toBe(true);
  });
});

describe("OpsX Partners - Sub Registration (2-step approval)", () => {
  const staffCaller = appRouter.createCaller(createStaffContext());
  const adminCaller = appRouter.createCaller(createAdminContext());

  let registrationId: number;

  it("staff can create a registration request", async () => {
    const result = await staffCaller.ops.subRegistration.create({
      companyName: "테스트전기(주)",
      businessNumber: "123-45-67890",
      representativeName: "홍길동",
      contactName: "김담당",
      contactPhone: "010-1234-5678",
      contactEmail: "test@elec.co.kr",
      specialty: "전기공사 전문",
    });
    expect(result).toHaveProperty("id");
    registrationId = result.id;
  });

  it("registration is in pending status", async () => {
    const reg = await staffCaller.ops.subRegistration.get({ id: registrationId });
    expect(reg.status).toBe("pending");
    expect(reg.companyName).toBe("테스트전기(주)");
  });

  it("staff can list registrations", async () => {
    const list = await staffCaller.ops.subRegistration.list();
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((r: any) => r.id === registrationId)).toBe(true);
  });

  it("staff can perform 1st approval", async () => {
    const result = await staffCaller.ops.subRegistration.staffApprove({
      id: registrationId,
      comment: "서류 확인 완료",
    });
    expect(result.success).toBe(true);

    const reg = await staffCaller.ops.subRegistration.get({ id: registrationId });
    expect(reg.status).toBe("staff_approved");
  });

  it("admin can perform final approval (creates subcontractor)", async () => {
    const result = await adminCaller.ops.subRegistration.adminApprove({
      id: registrationId,
      comment: "최종 승인",
    });
    expect(result.success).toBe(true);
    expect(result).toHaveProperty("subcontractorId");

    const reg = await adminCaller.ops.subRegistration.get({ id: registrationId });
    expect(reg.status).toBe("approved");
  });

  it("cannot approve already approved registration", async () => {
    await expect(
      staffCaller.ops.subRegistration.staffApprove({ id: registrationId })
    ).rejects.toThrow();
  });
});

describe("OpsX Partners - Sub Registration Rejection", () => {
  const staffCaller = appRouter.createCaller(createStaffContext());

  it("staff can reject a registration", async () => {
    const created = await staffCaller.ops.subRegistration.create({
      companyName: "반려테스트(주)",
      contactName: "이반려",
    });

    const result = await staffCaller.ops.subRegistration.reject({
      id: created.id,
      reason: "서류 미비",
    });
    expect(result.success).toBe(true);

    const reg = await staffCaller.ops.subRegistration.get({ id: created.id });
    expect(reg.status).toBe("rejected");
    expect(reg.rejectionReason).toBe("서류 미비");
  });
});

describe("OpsX Partners - Contract Templates", () => {
  const adminCaller = appRouter.createCaller(createAdminContext());
  const staffCaller = appRouter.createCaller(createStaffContext());

  let templateId: number;
  let tradeCategoryId: number;

  const paintCode = `PAINT${uniqueSuffix()}`;
  beforeAll(async () => {
    const trade = await adminCaller.ops.trade.create({ name: `도장공사-${paintCode}`, code: paintCode });
    tradeCategoryId = trade.id;
  });

  it("admin can create a contract template", async () => {
    const result = await adminCaller.ops.contractTemplate.create({
      tradeCategoryId,
      name: "도장공사 표준계약서",
      content: "제1조 (목적) 본 계약은 도장공사에 관한 사항을 정한다.\n제2조 (기간) 계약기간은 1년으로 한다.",
      validityMonths: 12,
    });
    expect(result).toHaveProperty("id");
    templateId = result.id;
  });

  it("staff can list contract templates", async () => {
    const list = await staffCaller.ops.contractTemplate.list();
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((t: any) => t.id === templateId)).toBe(true);
  });

  it("staff can get a specific template", async () => {
    const tmpl = await staffCaller.ops.contractTemplate.get({ id: templateId });
    expect(tmpl.name).toBe("도장공사 표준계약서");
    expect(tmpl.validityMonths).toBe(12);
  });
});

describe("OpsX Partners - Sub Contracts", () => {
  const staffCaller = appRouter.createCaller(createStaffContext());
  const adminCaller = appRouter.createCaller(createAdminContext());

  let contractId: number;
  let subId: number;
  let tradeId: number;

  const mechCode = `MECH${uniqueSuffix()}`;
  beforeAll(async () => {
    // Create a subcontractor first
    const trade = await adminCaller.ops.trade.create({ name: `설비공사-${mechCode}`, code: mechCode });
    tradeId = trade.id;

    const reg = await staffCaller.ops.subRegistration.create({
      companyName: "계약테스트설비(주)",
      contactName: "박설비",
    });
    await staffCaller.ops.subRegistration.staffApprove({ id: reg.id });
    const approved = await adminCaller.ops.subRegistration.adminApprove({ id: reg.id });
    subId = approved.subcontractorId!;
  });

  it("staff can create a sub contract", async () => {
    const result = await staffCaller.ops.subContract.create({
      subcontractorId: subId,
      tradeCategoryId: tradeId,
      title: "설비공사 연간 계약",
      content: "제1조 (목적) ...",
      partyB: "계약테스트설비(주)",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("contractNumber");
    contractId = result.id;
  });

  it("contract is in draft status", async () => {
    const c = await staffCaller.ops.subContract.get({ id: contractId });
    expect(c.status).toBe("draft");
    expect(c.title).toBe("설비공사 연간 계약");
  });

  it("admin can sign as party A", async () => {
    const result = await adminCaller.ops.subContract.signPartyA({
      id: contractId,
      signatureUrl: "data:image/png;base64,test-sig-a",
      signatureKey: "sig-a-test",
    });
    expect(result.success).toBe(true);

    const c = await staffCaller.ops.subContract.get({ id: contractId });
    expect(c.partyASignatureUrl).toBeTruthy();
    expect(c.status).toBe("pending_b");
  });

  it("party B can sign (public procedure)", async () => {
    const publicCaller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
    });

    const result = await publicCaller.ops.subContract.signPartyB({
      id: contractId,
      signerName: "박설비",
      signatureUrl: "data:image/png;base64,test-sig-b",
      signatureKey: "sig-b-test",
    });
    expect(result.success).toBe(true);

    const c = await staffCaller.ops.subContract.get({ id: contractId });
    expect(c.partyBSignatureUrl).toBeTruthy();
    expect(c.status).toBe("active");
  });
});

describe("OpsX Partners - Purchase Orders", () => {
  const staffCaller = appRouter.createCaller(createStaffContext());
  const adminCaller = appRouter.createCaller(createAdminContext());

  let poId: number;
  let projectId: number;
  let tradeId: number;

  const woodCode = `WOOD${uniqueSuffix()}`;
  const poCode = `PO-TEST-${uniqueSuffix()}`;
  beforeAll(async () => {
    const project = await staffCaller.ops.project.create({
      name: `PO 테스트 프로젝트 ${poCode}`,
      code: poCode,
      clientName: "테스트 고객",
    });
    projectId = project.id;

    const trade = await adminCaller.ops.trade.create({ name: `목공사-${woodCode}`, code: woodCode });
    tradeId = trade.id;
  });

  it("staff can create a purchase order", async () => {
    const result = await staffCaller.ops.purchaseOrder.create({
      projectId,
      title: "목공사 자재 발주",
      items: [{
        id: 1,
        tradeCategoryId: tradeId,
        tradeCategoryName: "목공사",
        description: "합판 12mm",
        specification: "1220x2440mm",
        unit: "매",
        quantity: 100,
        estimatedUnitPrice: 15000,
        estimatedAmount: 1500000,
      }],
      estimatedTotal: "1500000",
    });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("poNumber");
    poId = result.id;
  });

  it("purchase order is in draft status", async () => {
    const po = await staffCaller.ops.purchaseOrder.get({ id: poId });
    expect(po.status).toBe("draft");
    expect(po.title).toBe("목공사 자재 발주");
  });

  it("staff can list purchase orders", async () => {
    const list = await staffCaller.ops.purchaseOrder.list();
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((p: any) => p.id === poId)).toBe(true);
  });

  it("auto match returns subcontractors by trade", async () => {
    const result = await staffCaller.ops.purchaseOrder.autoMatch({
      tradeCategoryIds: [tradeId],
    });
    expect(Array.isArray(result)).toBe(true);
    // May be empty if no subs registered for this trade
  });
});
