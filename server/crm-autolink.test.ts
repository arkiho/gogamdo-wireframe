import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db functions
const mockCreateInquiry = vi.fn().mockResolvedValue([{ insertId: 1 }]);
const mockFindCrmClientByEmail = vi.fn();
const mockCreateCrmClient = vi.fn();
const mockCreateCrmDeal = vi.fn();
const mockCreateCrmActivity = vi.fn();
const mockNotifyOwner = vi.fn().mockResolvedValue(true);

vi.mock("./db", () => ({
  createInquiry: (...args: any[]) => mockCreateInquiry(...args),
  findCrmClientByEmail: (...args: any[]) => mockFindCrmClientByEmail(...args),
  createCrmClient: (...args: any[]) => mockCreateCrmClient(...args),
  createCrmDeal: (...args: any[]) => mockCreateCrmDeal(...args),
  createCrmActivity: (...args: any[]) => mockCreateCrmActivity(...args),
  listInquiries: vi.fn().mockResolvedValue([]),
  updateInquiryStatus: vi.fn(),
  addSubscriber: vi.fn(),
  listSubscribers: vi.fn().mockResolvedValue([]),
  toggleSubscriberActive: vi.fn(),
  createEstimate: vi.fn(),
  listEstimates: vi.fn().mockResolvedValue([]),
  createLeadDownload: vi.fn(),
  listLeadDownloads: vi.fn().mockResolvedValue([]),
  upsertChatSession: vi.fn(),
  listChatSessions: vi.fn().mockResolvedValue([]),
  createStyleRecommendation: vi.fn(),
  listStyleRecommendations: vi.fn().mockResolvedValue([]),
  createAnnouncement: vi.fn(),
  listAnnouncements: vi.fn().mockResolvedValue([]),
  getActiveAnnouncements: vi.fn().mockResolvedValue([]),
  updateAnnouncement: vi.fn(),
  deleteAnnouncement: vi.fn(),
  getDashboardStats: vi.fn().mockResolvedValue({}),
  createPortfolioDraft: vi.fn(),
  listPortfolioDrafts: vi.fn().mockResolvedValue([]),
  getPortfolioDraft: vi.fn(),
  updatePortfolioDraft: vi.fn(),
  publishPortfolioDraft: vi.fn(),
  archivePortfolioDraft: vi.fn(),
  deletePortfolioDraft: vi.fn(),
  addDraftImage: vi.fn(),
  listDraftImages: vi.fn().mockResolvedValue([]),
  updateDraftImage: vi.fn(),
  deleteDraftImage: vi.fn(),
  setCoverImage: vi.fn(),
  getPublishedPortfolios: vi.fn().mockResolvedValue([]),
  listSyncLogs: vi.fn().mockResolvedValue([]),
  createSpaceProject: vi.fn(),
  listSpaceProjects: vi.fn().mockResolvedValue([]),
  getSpaceProject: vi.fn(),
  updateSpaceProject: vi.fn(),
  deleteSpaceProject: vi.fn(),
  createSensor: vi.fn(),
  listSensors: vi.fn().mockResolvedValue([]),
  updateSensor: vi.fn(),
  deleteSensor: vi.fn(),
  addSensorData: vi.fn(),
  addSensorDataBatch: vi.fn(),
  getSensorDataRange: vi.fn().mockResolvedValue([]),
  getSensorLatestData: vi.fn().mockResolvedValue([]),
  createSpaceAnalysis: vi.fn(),
  listSpaceAnalyses: vi.fn().mockResolvedValue([]),
  listCrmClients: vi.fn().mockResolvedValue([]),
  getCrmClient: vi.fn(),
  updateCrmClient: vi.fn(),
  deleteCrmClient: vi.fn(),
  listCrmInteractions: vi.fn().mockResolvedValue([]),
  createCrmInteraction: vi.fn(),
  deleteCrmInteraction: vi.fn(),
  listCrmDeals: vi.fn().mockResolvedValue([]),
  getCrmDeal: vi.fn(),
  updateCrmDeal: vi.fn(),
  deleteCrmDeal: vi.fn(),
  listCrmActivities: vi.fn().mockResolvedValue([]),
  getCrmStats: vi.fn().mockResolvedValue({ totalClients: 0, activeDeals: 0, totalDealValue: 0, wonDeals: 0, lostDeals: 0 }),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: (...args: any[]) => mockNotifyOwner(...args),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({ choices: [{ message: { content: "test" } }] }),
}));

vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn().mockResolvedValue({ url: "https://example.com/image.png" }),
}));

vi.mock("./googleDrive", () => ({
  checkDriveConnection: vi.fn(),
  listFolders: vi.fn().mockResolvedValue([]),
  listImageFiles: vi.fn().mockResolvedValue([]),
  findCompletionPhotoFolders: vi.fn().mockResolvedValue([]),
}));

vi.mock("./driveSyncPipeline", () => ({
  syncFolder: vi.fn(),
  syncAllProjects: vi.fn(),
}));

// Mock trpc context
vi.mock("./_core/trpc", () => {
  const mockProcedure = {
    input: () => mockProcedure,
    output: () => mockProcedure,
    query: (fn: any) => fn,
    mutation: (fn: any) => fn,
    use: () => mockProcedure,
  };
  return {
    publicProcedure: mockProcedure,
    protectedProcedure: mockProcedure,
    router: (routes: any) => routes,
  };
});

vi.mock("./_core/systemRouter", () => ({
  systemRouter: {},
}));

vi.mock("./_core/cookies", () => ({
  getSessionCookieOptions: vi.fn(),
  COOKIE_NAME: "session",
}));

describe("CRM Auto-Link on Inquiry Creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create new CRM client and deal when inquiry is from new customer", async () => {
    mockFindCrmClientByEmail.mockResolvedValue(null);
    mockCreateCrmClient.mockResolvedValue(42);
    mockCreateCrmDeal.mockResolvedValue(100);
    mockCreateCrmActivity.mockResolvedValue(1);

    // Import after mocks are set up
    const { appRouter } = await import("./routers");
    const createFn = (appRouter as any).inquiry.create;

    await createFn({
      input: {
        name: "김철수",
        company: "테스트기업",
        email: "test@example.com",
        phone: "010-1234-5678",
        type: "사무실",
        budget: "1억~2억",
        area: "100㎡",
        message: "사무실 인테리어 견적 문의합니다.",
      },
    });

    // Verify inquiry was created
    expect(mockCreateInquiry).toHaveBeenCalledOnce();

    // Verify CRM client was searched by email
    expect(mockFindCrmClientByEmail).toHaveBeenCalledWith("test@example.com");

    // Verify new CRM client was created (since email not found)
    expect(mockCreateCrmClient).toHaveBeenCalledWith(
      expect.objectContaining({
        companyName: "테스트기업",
        contactName: "김철수",
        email: "test@example.com",
        source: "website",
      })
    );

    // Verify deal was created
    expect(mockCreateCrmDeal).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 42,
        title: expect.stringContaining("테스트기업"),
        stage: "lead",
        spaceType: "office",
      })
    );

    // Verify activity was logged
    expect(mockCreateCrmActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 42,
        type: "note",
        title: "웹사이트 문의 접수",
        createdBy: "system",
      })
    );

    // Verify owner notification includes CRM info
    expect(mockNotifyOwner).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("[CRM]"),
      })
    );
  });

  it("should reuse existing CRM client when email already exists", async () => {
    mockFindCrmClientByEmail.mockResolvedValue({ id: 99, companyName: "기존회사", contactName: "기존담당자", email: "existing@example.com" });
    mockCreateCrmDeal.mockResolvedValue(200);
    mockCreateCrmActivity.mockResolvedValue(2);

    const { appRouter } = await import("./routers");
    const createFn = (appRouter as any).inquiry.create;

    await createFn({
      input: {
        name: "박영희",
        company: "기존회사",
        email: "existing@example.com",
        message: "추가 문의입니다.",
      },
    });

    // Should NOT create a new client
    expect(mockCreateCrmClient).not.toHaveBeenCalled();

    // Should create deal with existing client ID
    expect(mockCreateCrmDeal).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 99,
        stage: "lead",
      })
    );
  });

  it("should still create inquiry even if CRM auto-link fails", async () => {
    mockFindCrmClientByEmail.mockRejectedValue(new Error("DB connection error"));

    const { appRouter } = await import("./routers");
    const createFn = (appRouter as any).inquiry.create;

    // Should not throw
    await expect(
      createFn({
        input: {
          name: "이에러",
          email: "error@example.com",
          message: "문의합니다.",
        },
      })
    ).resolves.toBeDefined();

    // Inquiry should still be created
    expect(mockCreateInquiry).toHaveBeenCalledOnce();
  });

  it("should create client with personal label when no company provided", async () => {
    mockFindCrmClientByEmail.mockResolvedValue(null);
    mockCreateCrmClient.mockResolvedValue(55);
    mockCreateCrmDeal.mockResolvedValue(150);
    mockCreateCrmActivity.mockResolvedValue(3);

    const { appRouter } = await import("./routers");
    const createFn = (appRouter as any).inquiry.create;

    await createFn({
      input: {
        name: "홍길동",
        email: "hong@example.com",
        message: "개인 문의입니다.",
      },
    });

    expect(mockCreateCrmClient).toHaveBeenCalledWith(
      expect.objectContaining({
        companyName: "홍길동 (개인)",
        contactName: "홍길동",
      })
    );
  });
});
