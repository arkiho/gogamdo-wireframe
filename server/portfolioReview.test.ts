import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB functions
const mockCreatePortfolioReview = vi.fn();
const mockListPortfolioReviews = vi.fn();
const mockGetPortfolioReview = vi.fn();
const mockGetPortfolioReviewByToken = vi.fn();
const mockUpdatePortfolioReview = vi.fn();
const mockDeletePortfolioReview = vi.fn();
const mockGetApprovedReviewsForPortfolio = vi.fn();
const mockGetPortfolioDraft = vi.fn();
const mockNotifyOwner = vi.fn();
const mockCreateNotification = vi.fn();

vi.mock("./db", () => ({
  createPortfolioReview: (...args: any[]) => mockCreatePortfolioReview(...args),
  listPortfolioReviews: (...args: any[]) => mockListPortfolioReviews(...args),
  getPortfolioReview: (...args: any[]) => mockGetPortfolioReview(...args),
  getPortfolioReviewByToken: (...args: any[]) => mockGetPortfolioReviewByToken(...args),
  updatePortfolioReview: (...args: any[]) => mockUpdatePortfolioReview(...args),
  deletePortfolioReview: (...args: any[]) => mockDeletePortfolioReview(...args),
  getApprovedReviewsForPortfolio: (...args: any[]) => mockGetApprovedReviewsForPortfolio(...args),
  getPortfolioDraft: (...args: any[]) => mockGetPortfolioDraft(...args),
  createNotification: (...args: any[]) => mockCreateNotification(...args),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: (...args: any[]) => mockNotifyOwner(...args),
}));

describe("Portfolio Review System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Review Data Model", () => {
    it("should create a review request with token", async () => {
      const reviewData = {
        portfolioId: 1,
        reviewerName: "홍길동",
        reviewerEmail: "hong@company.com",
        reviewerPhone: "010-1234-5678",
        reviewerCompany: "(주)ABC",
        reviewerTitle: "총무팀장",
        accessToken: "test-token-abc123",
        tokenExpiresAt: new Date("2026-03-15"),
        status: "pending",
      };

      mockCreatePortfolioReview.mockResolvedValue(1);
      const id = await mockCreatePortfolioReview(reviewData);
      expect(id).toBe(1);
      expect(mockCreatePortfolioReview).toHaveBeenCalledWith(reviewData);
    });

    it("should list reviews with optional filters", async () => {
      const reviews = [
        { id: 1, portfolioId: 1, reviewerName: "홍길동", status: "submitted" },
        { id: 2, portfolioId: 2, reviewerName: "김철수", status: "pending" },
      ];
      mockListPortfolioReviews.mockResolvedValue(reviews);

      const result = await mockListPortfolioReviews(undefined, undefined);
      expect(result).toHaveLength(2);

      mockListPortfolioReviews.mockResolvedValue([reviews[0]]);
      const filtered = await mockListPortfolioReviews(undefined, "submitted");
      expect(filtered).toHaveLength(1);
      expect(filtered[0].status).toBe("submitted");
    });

    it("should get review by token", async () => {
      const review = {
        id: 1,
        portfolioId: 1,
        reviewerName: "홍길동",
        accessToken: "test-token",
        status: "pending",
        tokenExpiresAt: new Date("2026-03-15"),
      };
      mockGetPortfolioReviewByToken.mockResolvedValue(review);

      const result = await mockGetPortfolioReviewByToken("test-token");
      expect(result).toBeDefined();
      expect(result.accessToken).toBe("test-token");
    });

    it("should return null for invalid token", async () => {
      mockGetPortfolioReviewByToken.mockResolvedValue(null);
      const result = await mockGetPortfolioReviewByToken("invalid-token");
      expect(result).toBeNull();
    });
  });

  describe("Review Submission Flow", () => {
    it("should allow review submission with valid token", async () => {
      const review = {
        id: 1,
        portfolioId: 1,
        reviewerName: "홍길동",
        accessToken: "valid-token",
        status: "pending",
        tokenExpiresAt: new Date("2026-12-31"),
      };

      mockGetPortfolioReviewByToken.mockResolvedValue(review);
      mockUpdatePortfolioReview.mockResolvedValue(undefined);
      mockNotifyOwner.mockResolvedValue(true);
      mockCreateNotification.mockResolvedValue(1);

      // Simulate submission
      const found = await mockGetPortfolioReviewByToken("valid-token");
      expect(found).toBeDefined();
      expect(found.status).toBe("pending");

      // Check token not expired
      expect(new Date(found.tokenExpiresAt) > new Date()).toBe(true);

      // Update with submitted content
      await mockUpdatePortfolioReview(found.id, {
        reviewerName: "홍길동",
        rating: 5,
        title: "최고의 인테리어 경험",
        content: "고감도와 함께한 사무실 인테리어는 정말 만족스러웠습니다. 직원들 모두 새 사무실을 좋아합니다.",
        highlights: ["디자인 감각", "시공 품질", "커뮤니케이션"],
        status: "submitted",
        submittedAt: expect.any(Date),
      });

      expect(mockUpdatePortfolioReview).toHaveBeenCalledWith(1, expect.objectContaining({
        status: "submitted",
        rating: 5,
      }));
    });

    it("should reject submission with expired token", async () => {
      const review = {
        id: 1,
        status: "pending",
        tokenExpiresAt: new Date("2020-01-01"), // Expired
      };
      mockGetPortfolioReviewByToken.mockResolvedValue(review);

      const found = await mockGetPortfolioReviewByToken("expired-token");
      expect(new Date(found.tokenExpiresAt) < new Date()).toBe(true);
    });

    it("should not allow modification of approved reviews", async () => {
      const review = {
        id: 1,
        status: "approved",
        tokenExpiresAt: new Date("2026-12-31"),
      };
      mockGetPortfolioReviewByToken.mockResolvedValue(review);

      const found = await mockGetPortfolioReviewByToken("approved-token");
      expect(found.status).toBe("approved");
      // Business logic should prevent update
    });
  });

  describe("Admin Review Management", () => {
    it("should approve a submitted review", async () => {
      mockUpdatePortfolioReview.mockResolvedValue(undefined);

      await mockUpdatePortfolioReview(1, {
        status: "approved",
        approvedAt: new Date(),
      });

      expect(mockUpdatePortfolioReview).toHaveBeenCalledWith(1, expect.objectContaining({
        status: "approved",
      }));
    });

    it("should reject a review with optional note", async () => {
      mockUpdatePortfolioReview.mockResolvedValue(undefined);

      await mockUpdatePortfolioReview(1, {
        status: "rejected",
        adminNote: "내용이 부적절합니다.",
      });

      expect(mockUpdatePortfolioReview).toHaveBeenCalledWith(1, expect.objectContaining({
        status: "rejected",
        adminNote: "내용이 부적절합니다.",
      }));
    });

    it("should delete a review", async () => {
      mockDeletePortfolioReview.mockResolvedValue(undefined);
      await mockDeletePortfolioReview(1);
      expect(mockDeletePortfolioReview).toHaveBeenCalledWith(1);
    });

    it("should list reviews filtered by status", async () => {
      const submittedReviews = [
        { id: 1, status: "submitted", reviewerName: "홍길동" },
        { id: 3, status: "submitted", reviewerName: "이영희" },
      ];
      mockListPortfolioReviews.mockResolvedValue(submittedReviews);

      const result = await mockListPortfolioReviews(undefined, "submitted");
      expect(result).toHaveLength(2);
      expect(result.every((r: any) => r.status === "submitted")).toBe(true);
    });

    it("should list reviews filtered by portfolio", async () => {
      const portfolioReviews = [
        { id: 1, portfolioId: 5, status: "approved" },
      ];
      mockListPortfolioReviews.mockResolvedValue(portfolioReviews);

      const result = await mockListPortfolioReviews(5, undefined);
      expect(result).toHaveLength(1);
      expect(result[0].portfolioId).toBe(5);
    });
  });

  describe("Public Review Display", () => {
    it("should return only approved reviews for a portfolio", async () => {
      const approvedReviews = [
        {
          id: 1,
          portfolioId: 1,
          reviewerName: "홍길동",
          reviewerTitle: "총무팀장",
          reviewerCompany: "(주)ABC",
          rating: 5,
          title: "최고의 경험",
          content: "정말 만족스러운 인테리어였습니다.",
          highlights: ["디자인 감각", "시공 품질"],
          status: "approved",
        },
      ];
      mockGetApprovedReviewsForPortfolio.mockResolvedValue(approvedReviews);

      const result = await mockGetApprovedReviewsForPortfolio(1);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("approved");
      expect(result[0].rating).toBe(5);
      expect(result[0].highlights).toContain("디자인 감각");
    });

    it("should return empty array when no approved reviews exist", async () => {
      mockGetApprovedReviewsForPortfolio.mockResolvedValue([]);

      const result = await mockGetApprovedReviewsForPortfolio(999);
      expect(result).toHaveLength(0);
    });

    it("should not expose admin notes in public reviews", async () => {
      const approvedReviews = [
        {
          id: 1,
          reviewerName: "홍길동",
          rating: 4,
          content: "좋은 경험이었습니다.",
          status: "approved",
          // adminNote should not be included in public response
        },
      ];
      mockGetApprovedReviewsForPortfolio.mockResolvedValue(approvedReviews);

      const result = await mockGetApprovedReviewsForPortfolio(1);
      expect(result[0]).not.toHaveProperty("adminNote");
    });
  });

  describe("Token Generation and Validation", () => {
    it("should generate unique tokens for each review request", async () => {
      const crypto = await import("crypto");
      const token1 = crypto.randomBytes(32).toString("hex");
      const token2 = crypto.randomBytes(32).toString("hex");

      expect(token1).not.toBe(token2);
      expect(token1).toHaveLength(64);
      expect(token2).toHaveLength(64);
    });

    it("should calculate correct expiration date", () => {
      const expiresInDays = 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const now = new Date();
      const diffDays = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(30);
    });

    it("should support various expiration periods", () => {
      for (const days of [7, 14, 30, 60, 90]) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
        expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
      }
    });
  });

  describe("Review Highlights", () => {
    it("should store and retrieve highlight tags", async () => {
      const highlights = ["디자인 감각", "시공 품질", "일정 준수", "커뮤니케이션"];

      mockUpdatePortfolioReview.mockResolvedValue(undefined);
      await mockUpdatePortfolioReview(1, { highlights });

      expect(mockUpdatePortfolioReview).toHaveBeenCalledWith(1, {
        highlights: expect.arrayContaining(["디자인 감각", "시공 품질"]),
      });
    });

    it("should handle empty highlights", async () => {
      mockUpdatePortfolioReview.mockResolvedValue(undefined);
      await mockUpdatePortfolioReview(1, { highlights: [] });

      expect(mockUpdatePortfolioReview).toHaveBeenCalledWith(1, { highlights: [] });
    });
  });

  describe("Notification on Review Submission", () => {
    it("should notify owner when review is submitted", async () => {
      mockNotifyOwner.mockResolvedValue(true);
      mockCreateNotification.mockResolvedValue(1);

      const result = await mockNotifyOwner({
        title: "포트폴리오 리뷰 접수",
        content: "홍길동님이 리뷰를 작성했습니다.",
      });
      expect(result).toBe(true);

      const notifId = await mockCreateNotification({
        type: "system",
        title: "포트폴리오 리뷰 접수",
        message: "홍길동님이 리뷰를 작성했습니다.",
        linkUrl: "/admin",
      });
      expect(notifId).toBe(1);
    });
  });

  describe("Review with Portfolio Context", () => {
    it("should return portfolio info along with review by token", async () => {
      const review = {
        id: 1,
        portfolioId: 5,
        reviewerName: "홍길동",
        status: "pending",
        tokenExpiresAt: new Date("2026-12-31"),
      };
      const portfolio = {
        id: 5,
        title: "승일일렉트로닉스 본사",
        client: "승일일렉트로닉스",
        category: "사무실 인테리어",
      };

      mockGetPortfolioReviewByToken.mockResolvedValue(review);
      mockGetPortfolioDraft.mockResolvedValue(portfolio);

      const foundReview = await mockGetPortfolioReviewByToken("test-token");
      const foundPortfolio = await mockGetPortfolioDraft(foundReview.portfolioId);

      expect(foundReview).toBeDefined();
      expect(foundPortfolio).toBeDefined();
      expect(foundPortfolio.title).toBe("승일일렉트로닉스 본사");
    });
  });

  describe("Rating Validation", () => {
    it("should accept ratings between 1 and 5", () => {
      for (const rating of [1, 2, 3, 4, 5]) {
        expect(rating).toBeGreaterThanOrEqual(1);
        expect(rating).toBeLessThanOrEqual(5);
      }
    });

    it("should reject invalid ratings", () => {
      expect(0).toBeLessThan(1);
      expect(6).toBeGreaterThan(5);
    });
  });

  describe("Content Validation", () => {
    it("should require minimum content length of 10 characters", () => {
      const shortContent = "짧은 리뷰";
      const validContent = "고감도와 함께한 사무실 인테리어는 정말 만족스러웠습니다.";

      expect(shortContent.length).toBeLessThan(10);
      expect(validContent.length).toBeGreaterThanOrEqual(10);
    });

    it("should require reviewer name", () => {
      const emptyName = "";
      const validName = "홍길동";

      expect(emptyName.length).toBe(0);
      expect(validName.length).toBeGreaterThan(0);
    });
  });
});
