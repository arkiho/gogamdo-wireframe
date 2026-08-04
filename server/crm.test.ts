import { beforeEach, describe, it, expect, vi } from "vitest";

const crmFixture = vi.hoisted(() => ({
  nextClientId: 2,
  nextInteractionId: 2,
  nextDealId: 2,
  nextActivityId: 2,
  clients: [] as any[],
  interactions: [] as any[],
  deals: [] as any[],
  activities: [] as any[],
}));

vi.mock("./_core/notification", () => ({ notifyOwner: vi.fn(async () => true) }));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    listCrmClients: vi.fn(async () => [...crmFixture.clients]),
    getCrmClient: vi.fn(async (id: number) => crmFixture.clients.find(row => row.id === id) ?? null),
    createCrmClient: vi.fn(async (data: any) => {
      const id = crmFixture.nextClientId++;
      crmFixture.clients.push({ id, ...data });
      return id;
    }),
    updateCrmClient: vi.fn(async (id: number, data: any) => {
      const row = crmFixture.clients.find(item => item.id === id);
      if (row) Object.assign(row, data);
    }),
    deleteCrmClient: vi.fn(async (id: number) => {
      crmFixture.clients = crmFixture.clients.filter(item => item.id !== id);
    }),
    listCrmInteractions: vi.fn(async (clientId: number) =>
      crmFixture.interactions.filter(row => row.clientId === clientId)
    ),
    createCrmInteraction: vi.fn(async (data: any) => {
      const id = crmFixture.nextInteractionId++;
      crmFixture.interactions.push({ id, ...data });
      return id;
    }),
    deleteCrmInteraction: vi.fn(async (id: number) => {
      crmFixture.interactions = crmFixture.interactions.filter(item => item.id !== id);
    }),
    listCrmDeals: vi.fn(async (clientId?: number) => clientId
      ? crmFixture.deals.filter(row => row.clientId === clientId)
      : [...crmFixture.deals]
    ),
    getCrmDeal: vi.fn(async (id: number) => crmFixture.deals.find(row => row.id === id) ?? null),
    createCrmDeal: vi.fn(async (data: any) => {
      const id = crmFixture.nextDealId++;
      crmFixture.deals.push({ id, stage: "lead", ...data });
      return id;
    }),
    updateCrmDeal: vi.fn(async (id: number, data: any) => {
      const row = crmFixture.deals.find(item => item.id === id);
      if (row) Object.assign(row, data);
    }),
    deleteCrmDeal: vi.fn(async (id: number) => {
      crmFixture.deals = crmFixture.deals.filter(item => item.id !== id);
    }),
    listCrmActivities: vi.fn(async (filters: any = {}) => crmFixture.activities.filter(row =>
      (!filters.clientId || row.clientId === filters.clientId) &&
      (!filters.dealId || row.dealId === filters.dealId)
    )),
    createCrmActivity: vi.fn(async (data: any) => {
      const id = crmFixture.nextActivityId++;
      crmFixture.activities.push({ id, ...data });
      return id;
    }),
    getCrmStats: vi.fn(async () => ({
      totalClients: crmFixture.clients.length,
      activeDeals: crmFixture.deals.filter(row => !["completed", "lost"].includes(row.stage)).length,
      totalDealValue: crmFixture.deals.reduce((sum, row) => sum + (row.estimatedValue ?? 0), 0),
      wonDeals: crmFixture.deals.filter(row => row.stage === "completed").length,
      lostDeals: crmFixture.deals.filter(row => row.stage === "lost").length,
    })),
  };
});
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@kokamdo.co.kr",
    name: "Admin",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createAnonContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

const adminCaller = appRouter.createCaller(createAdminContext());
const userCaller = appRouter.createCaller(createUserContext());
const anonCaller = appRouter.createCaller(createAnonContext());

describe("CRM Router", () => {
  beforeEach(() => {
    crmFixture.nextClientId = 2;
    crmFixture.nextInteractionId = 2;
    crmFixture.nextDealId = 2;
    crmFixture.nextActivityId = 2;
    crmFixture.clients = [{ id: 1, companyName: "Fixture 회사", contactName: "Fixture 고객" }];
    crmFixture.interactions = [{ id: 1, clientId: 1, type: "phone_call", subject: "Fixture 상담" }];
    crmFixture.deals = [{ id: 1, clientId: 1, title: "Fixture 딜", stage: "lead", estimatedValue: 1000 }];
    crmFixture.activities = [{ id: 1, clientId: 1, dealId: 1, type: "note", title: "Fixture 활동" }];
  });
  // ===== Client CRUD =====
  describe("crm.createClient", () => {
    it("should allow admin to create a client", async () => {
      const client = await adminCaller.crm.createClient({
        companyName: "테스트 회사",
        contactName: "홍길동",
        contactTitle: "대표",
        email: "hong@test.com",
        phone: "010-1234-5678",
        industry: "IT",
        source: "website",
      });
      expect(client).toBeDefined();
      expect(client.id).toBeDefined();
    });

    it("should reject unauthenticated users", async () => {
      await expect(
        anonCaller.crm.createClient({
          companyName: "테스트",
          contactName: "테스트",
        })
      ).rejects.toThrow();
    });

    it("should reject non-admin users", async () => {
      await expect(
        userCaller.crm.createClient({
          companyName: "테스트",
          contactName: "테스트",
        })
      ).rejects.toThrow();
    });
  });

  describe("crm.listClients", () => {
    it("should return client list for admin", async () => {
      const clients = await adminCaller.crm.listClients();
      expect(Array.isArray(clients)).toBe(true);
      expect(clients.length).toBeGreaterThan(0);
    });

    it("should reject non-admin users", async () => {
      await expect(userCaller.crm.listClients()).rejects.toThrow();
    });
  });

  describe("crm.getClient", () => {
    it("should return client details for admin", async () => {
      const clients = await adminCaller.crm.listClients();
      if (clients.length > 0) {
        const client = await adminCaller.crm.getClient({ id: clients[0].id });
        expect(client).toBeDefined();
        expect(client!.companyName).toBeDefined();
      }
    });
  });

  describe("crm.updateClient", () => {
    it("should allow admin to update a client", async () => {
      const clients = await adminCaller.crm.listClients();
      if (clients.length > 0) {
        const updated = await adminCaller.crm.updateClient({
          id: clients[0].id,
          companyName: "업데이트된 회사",
          notes: "테스트 메모",
        });
        expect(updated).toBeDefined();
      }
    });
  });

  // ===== Interactions =====
  describe("crm.createInteraction", () => {
    it("should allow admin to create an interaction", async () => {
      const clients = await adminCaller.crm.listClients();
      if (clients.length > 0) {
        const interaction = await adminCaller.crm.createInteraction({
          clientId: clients[0].id,
          type: "phone_call",
          subject: "초기 상담",
          content: "사무실 인테리어 문의",
          outcome: "견적 요청",
        });
        expect(interaction).toBeDefined();
        expect(interaction.id).toBeDefined();
      }
    });
  });

  describe("crm.listInteractions", () => {
    it("should return interactions for a client", async () => {
      const clients = await adminCaller.crm.listClients();
      if (clients.length > 0) {
        const interactions = await adminCaller.crm.listInteractions({ clientId: clients[0].id });
        expect(Array.isArray(interactions)).toBe(true);
      }
    });
  });

  // ===== Deals =====
  describe("crm.createDeal", () => {
    it("should allow admin to create a deal", async () => {
      const clients = await adminCaller.crm.listClients();
      if (clients.length > 0) {
        const deal = await adminCaller.crm.createDeal({
          clientId: clients[0].id,
          title: "사무실 리모델링",
          estimatedValue: 50000000,
          area: "150㎡",
          spaceType: "office",
          description: "본사 사무실 전체 리모델링",
        });
        expect(deal).toBeDefined();
        expect(deal.id).toBeDefined();
      }
    });
  });

  describe("crm.listDeals", () => {
    it("should return deal list for admin", async () => {
      const deals = await adminCaller.crm.listDeals();
      expect(Array.isArray(deals)).toBe(true);
    });

    it("should filter deals by clientId", async () => {
      const clients = await adminCaller.crm.listClients();
      if (clients.length > 0) {
        const deals = await adminCaller.crm.listDeals({ clientId: clients[0].id });
        expect(Array.isArray(deals)).toBe(true);
      }
    });
  });

  describe("crm.updateDeal", () => {
    it("should allow admin to update deal stage", async () => {
      const deals = await adminCaller.crm.listDeals();
      if (deals.length > 0) {
        const updated = await adminCaller.crm.updateDeal({
          id: deals[0].id,
          stage: "consultation",
        });
        expect(updated).toBeDefined();
      }
    });
  });

  // ===== Activities =====
  describe("crm.listActivities", () => {
    it("should return activity list for admin", async () => {
      const activities = await adminCaller.crm.listActivities();
      expect(Array.isArray(activities)).toBe(true);
    });

    it("should filter activities by clientId", async () => {
      const clients = await adminCaller.crm.listClients();
      if (clients.length > 0) {
        const activities = await adminCaller.crm.listActivities({ clientId: clients[0].id });
        expect(Array.isArray(activities)).toBe(true);
      }
    });
  });

  // ===== Stats =====
  describe("crm.stats", () => {
    it("should return CRM statistics for admin", async () => {
      const stats = await adminCaller.crm.stats();
      expect(stats).toBeDefined();
      expect(typeof stats.totalClients).toBe("number");
      expect(typeof stats.activeDeals).toBe("number");
      // totalDealValue may be returned as string from SQL SUM
      expect(stats.totalDealValue).toBeDefined();
      expect(typeof stats.wonDeals).toBe("number");
      expect(typeof stats.lostDeals).toBe("number");
    });

    it("should reject non-admin users", async () => {
      await expect(userCaller.crm.stats()).rejects.toThrow();
    });
  });

  // ===== Delete =====
  describe("crm.deleteClient", () => {
    it("should allow admin to delete a client", async () => {
      // Create a client to delete
      const client = await adminCaller.crm.createClient({
        companyName: "삭제할 회사",
        contactName: "삭제 테스트",
      });
      const result = await adminCaller.crm.deleteClient({ id: client.id });
      expect(result).toBeDefined();
    });
  });
});
