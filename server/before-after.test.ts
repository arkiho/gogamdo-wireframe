import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Before/After 비교 뷰어 테스트
 * - 포트폴리오 이미지에 beforeUrl 설정 (시공 전/후 비교)
 * - AI 리디자인 원본/결과 이미지 비교
 * - 이미지 업데이트 시 beforeUrl 필드 처리
 */

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({
    key: "portfolio/before/test.jpg",
    url: "https://cdn.example.com/portfolio/before/test.jpg",
  }),
}));

// Mock image generation
vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn().mockResolvedValue({
    url: "https://cdn.example.com/ai-redesign/result/test-result.jpg",
  }),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Modern office redesign prompt" } }],
  }),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Mock DB functions
const mockAddDraftImage = vi.fn().mockResolvedValue(1);
const mockUpdateDraftImage = vi.fn().mockResolvedValue(undefined);
const mockListDraftImages = vi.fn().mockResolvedValue([
  {
    id: 1,
    draftId: 10,
    originalUrl: "https://cdn.example.com/after.jpg",
    beforeUrl: "https://cdn.example.com/before.jpg",
    processedUrl: null,
    watermarkedUrl: null,
    thumbnailUrl: null,
    aiProcessed: "no",
    processingStatus: "done",
    sortOrder: 0,
    isCover: "yes",
    caption: "리셉션 공간",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    draftId: 10,
    originalUrl: "https://cdn.example.com/after2.jpg",
    beforeUrl: null,
    processedUrl: null,
    watermarkedUrl: null,
    thumbnailUrl: null,
    aiProcessed: "no",
    processingStatus: "done",
    sortOrder: 1,
    isCover: "no",
    caption: "회의실",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);
const mockDeleteDraftImage = vi.fn().mockResolvedValue(undefined);
const mockSetCoverImage = vi.fn().mockResolvedValue(undefined);
const mockCreateAiRedesign = vi.fn().mockResolvedValue(1);
const mockGetAiRedesign = vi.fn().mockResolvedValue({
  id: 1,
  originalImageUrl: "https://cdn.example.com/original-space.jpg",
  resultImageUrl: "https://cdn.example.com/redesigned-space.jpg",
  prompt: "모던한 스타일로 바꿔주세요",
  enhancedPrompt: "Modern office redesign prompt",
  status: "completed",
  spaceType: "office",
  createdAt: new Date(),
});
const mockUpdateAiRedesign = vi.fn().mockResolvedValue(undefined);
const mockListAiRedesigns = vi.fn().mockResolvedValue([
  {
    id: 1,
    originalImageUrl: "https://cdn.example.com/original-space.jpg",
    resultImageUrl: "https://cdn.example.com/redesigned-space.jpg",
    prompt: "모던한 스타일로 바꿔주세요",
    status: "completed",
    spaceType: "office",
    createdAt: new Date(),
  },
]);

vi.mock("./db", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    addDraftImage: (...args: any[]) => mockAddDraftImage(...args),
    updateDraftImage: (...args: any[]) => mockUpdateDraftImage(...args),
    listDraftImages: (...args: any[]) => mockListDraftImages(...args),
    deleteDraftImage: (...args: any[]) => mockDeleteDraftImage(...args),
    setCoverImage: (...args: any[]) => mockSetCoverImage(...args),
    createAiRedesign: (...args: any[]) => mockCreateAiRedesign(...args),
    getAiRedesign: (...args: any[]) => mockGetAiRedesign(...args),
    updateAiRedesign: (...args: any[]) => mockUpdateAiRedesign(...args),
    listAiRedesigns: (...args: any[]) => mockListAiRedesigns(...args),
    findCrmClientByEmail: vi.fn().mockResolvedValue(null),
    createCrmClient: vi.fn().mockResolvedValue(100),
    createCrmDeal: vi.fn().mockResolvedValue(200),
    createCrmActivity: vi.fn().mockResolvedValue(300),
    createNotification: vi.fn().mockResolvedValue(400),
  };
});

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@kokamdo.co.kr",
    name: "관리자",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "normal-user",
    email: "user@example.com",
    name: "일반 사용자",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("Before/After 비교 뷰어 - 포트폴리오 이미지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("포트폴리오 이미지 목록에서 beforeUrl이 있는 이미지와 없는 이미지를 모두 반환", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const images = await caller.portfolio.listImages({ draftId: 10 });

    expect(images).toHaveLength(2);
    // 첫 번째 이미지: beforeUrl이 있음 (Before/After 비교 가능)
    expect(images[0].beforeUrl).toBe("https://cdn.example.com/before.jpg");
    expect(images[0].originalUrl).toBe("https://cdn.example.com/after.jpg");
    // 두 번째 이미지: beforeUrl이 null (일반 이미지)
    expect(images[1].beforeUrl).toBeNull();
  });

  it("이미지에 beforeUrl을 설정하여 Before/After 비교 활성화", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await caller.portfolio.updateImage({
      id: 2,
      beforeUrl: "https://cdn.example.com/before2.jpg",
    });

    expect(mockUpdateDraftImage).toHaveBeenCalledWith(2, {
      beforeUrl: "https://cdn.example.com/before2.jpg",
    });
  });

  it("beforeUrl을 null로 설정하여 Before/After 비교 비활성화", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await caller.portfolio.updateImage({
      id: 1,
      beforeUrl: null,
    });

    expect(mockUpdateDraftImage).toHaveBeenCalledWith(1, {
      beforeUrl: null,
    });
  });

  it("커버 이미지에 beforeUrl이 있으면 히어로 섹션에서 Before/After 슬라이더 표시", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const images = await caller.portfolio.listImages({ draftId: 10 });
    const coverImage = images.find((img: any) => img.isCover === "yes");

    expect(coverImage).toBeDefined();
    expect(coverImage!.beforeUrl).toBeTruthy();
    expect(coverImage!.isCover).toBe("yes");
    // 커버 이미지에 beforeUrl이 있으므로 BeforeAfterSlider 렌더링 조건 충족
  });

  it("비관리자는 이미지 목록을 조회할 수 없음", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.portfolio.listImages({ draftId: 10 })
    ).rejects.toThrow();
  });

  it("비인증 사용자는 이미지를 수정할 수 없음", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.portfolio.updateImage({
        id: 1,
        beforeUrl: "https://cdn.example.com/hack.jpg",
      })
    ).rejects.toThrow();
  });
});

describe("Before/After 비교 뷰어 - AI 리디자인", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("AI 리디자인 결과에서 원본과 결과 이미지를 비교할 수 있음", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const redesigns = await caller.aiRedesign.list({ limit: 10, offset: 0 });

    expect(redesigns).toHaveLength(1);
    const redesign = redesigns[0];
    // 원본 이미지 (Before)
    expect(redesign.originalImageUrl).toBe("https://cdn.example.com/original-space.jpg");
    // 결과 이미지 (After)
    expect(redesign.resultImageUrl).toBe("https://cdn.example.com/redesigned-space.jpg");
    // 두 URL이 다름 (비교 가능)
    expect(redesign.originalImageUrl).not.toBe(redesign.resultImageUrl);
  });

  it("AI 리디자인 상세 조회는 공개 접근 가능 (publicProcedure)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const redesign = await caller.aiRedesign.get({ id: 1 });

    expect(redesign).toBeDefined();
    expect(redesign.originalImageUrl).toBeTruthy();
    expect(redesign.resultImageUrl).toBeTruthy();
    expect(redesign.status).toBe("completed");
  });

  it("AI 리디자인 목록은 로그인 사용자만 조회 가능 (protectedProcedure)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.aiRedesign.list({ limit: 10, offset: 0 })
    ).rejects.toThrow();
  });

  it("로그인한 사용자는 AI 리디자인 목록 조회 가능", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const redesigns = await caller.aiRedesign.list({ limit: 10, offset: 0 });
    expect(redesigns).toHaveLength(1);
  });
});

describe("Before/After 비교 뷰어 - 이미지 관리 워크플로우", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("이미지 추가 시 beforeUrl 없이도 정상 동작", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const imageId = await caller.portfolio.addImage({
      draftId: 10,
      originalUrl: "https://cdn.example.com/new-after.jpg",
    });

    expect(mockAddDraftImage).toHaveBeenCalledWith({
      draftId: 10,
      originalUrl: "https://cdn.example.com/new-after.jpg",
    });
    expect(imageId).toBe(1);
  });

  it("이미지 삭제 시 beforeUrl 데이터도 함께 삭제", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await caller.portfolio.deleteImage({ id: 1 });

    expect(mockDeleteDraftImage).toHaveBeenCalledWith(1);
  });

  it("커버 이미지 설정이 정상 동작", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await caller.portfolio.setCover({ draftId: 10, imageId: 2 });

    expect(mockSetCoverImage).toHaveBeenCalledWith(10, 2);
  });

  it("이미지 업데이트 시 여러 필드를 동시에 변경 가능", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await caller.portfolio.updateImage({
      id: 1,
      beforeUrl: "https://cdn.example.com/new-before.jpg",
      processedUrl: "https://cdn.example.com/processed.jpg",
      caption: "리셉션 공간 리모델링",
    });

    expect(mockUpdateDraftImage).toHaveBeenCalledWith(1, {
      beforeUrl: "https://cdn.example.com/new-before.jpg",
      processedUrl: "https://cdn.example.com/processed.jpg",
      caption: "리셉션 공간 리모델링",
    });
  });
});
