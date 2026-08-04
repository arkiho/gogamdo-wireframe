import { beforeEach, describe, expect, it, vi } from "vitest";

const getPublishedInsightArticleBySlug = vi.fn();
const incrementArticleViewCount = vi.fn();

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getPublishedInsightArticleBySlug,
    incrementArticleViewCount,
  };
});

describe("public insight publication boundary", () => {
  beforeEach(() => {
    getPublishedInsightArticleBySlug.mockReset();
    incrementArticleViewCount.mockReset();
  });

  it("serves and counts only records returned by the published-only lookup", async () => {
    const article = {
      id: 71,
      slug: "published-article",
      title: "공개 글",
      status: "published",
      excerpt: "공개 설명",
    };
    getPublishedInsightArticleBySlug.mockResolvedValue(article);

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({} as any);
    await expect(caller.insight.bySlug({ slug: article.slug })).resolves.toEqual(article);
    expect(getPublishedInsightArticleBySlug).toHaveBeenCalledWith(article.slug);
    expect(incrementArticleViewCount).toHaveBeenCalledWith(article.id);
  });

  it("returns not found and does not count when no published record exists", async () => {
    getPublishedInsightArticleBySlug.mockResolvedValue(null);

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({} as any);
    await expect(caller.insight.bySlug({ slug: "draft-article" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(getPublishedInsightArticleBySlug).toHaveBeenCalledWith("draft-article");
    expect(incrementArticleViewCount).not.toHaveBeenCalled();
  });

  it("does not create dynamic SEO metadata without a published record", async () => {
    getPublishedInsightArticleBySlug.mockResolvedValue(null);
    const { getDynamicMeta } = await import("./_core/vite");
    await expect(getDynamicMeta("/insights/draft-article")).resolves.toBeNull();
    expect(getPublishedInsightArticleBySlug).toHaveBeenCalledWith("draft-article");
  });
});
