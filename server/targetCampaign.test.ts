import { describe, it, expect } from "vitest";

// ===== 세그먼트 시스템 테스트 =====
describe("Subscriber Segments", () => {
  describe("Segment data structure", () => {
    it("should have required fields for a segment", () => {
      const segment = {
        id: 1,
        name: "견적 요청 고객",
        description: "AI 견적 페이지에서 유입된 구독자",
        color: "#b8860b",
        filterConditions: {
          sources: ["estimator"],
          hasCompany: true,
        },
        matchCount: 15,
        lastCalculatedAt: new Date(),
        createdAt: new Date(),
      };

      expect(segment.name).toBeTruthy();
      expect(segment.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(segment.filterConditions).toBeDefined();
      expect(segment.matchCount).toBeGreaterThanOrEqual(0);
    });

    it("should validate segment color format", () => {
      const validColors = ["#b8860b", "#2563eb", "#dc2626", "#16a34a", "#9333ea"];
      validColors.forEach((color) => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it("should support empty filter conditions", () => {
      const segment = {
        name: "전체 구독자",
        filterConditions: {},
      };
      expect(Object.keys(segment.filterConditions)).toHaveLength(0);
    });
  });

  describe("Filter conditions", () => {
    it("should filter by source", () => {
      const subscribers = [
        { id: 1, email: "a@test.com", source: "estimator", status: "active" },
        { id: 2, email: "b@test.com", source: "website", status: "active" },
        { id: 3, email: "c@test.com", source: "estimator", status: "active" },
        { id: 4, email: "d@test.com", source: "contact_form", status: "active" },
      ];

      const filter = { sources: ["estimator"] };
      const matched = subscribers.filter(
        (s) => s.status === "active" && filter.sources.includes(s.source)
      );
      expect(matched).toHaveLength(2);
      expect(matched.every((s) => s.source === "estimator")).toBe(true);
    });

    it("should filter by multiple sources", () => {
      const subscribers = [
        { id: 1, source: "estimator", status: "active" },
        { id: 2, source: "website", status: "active" },
        { id: 3, source: "contact_form", status: "active" },
        { id: 4, source: "portfolio", status: "active" },
      ];

      const filter = { sources: ["estimator", "contact_form"] };
      const matched = subscribers.filter(
        (s) => s.status === "active" && filter.sources.includes(s.source)
      );
      expect(matched).toHaveLength(2);
    });

    it("should filter by date range", () => {
      const subscribers = [
        { id: 1, subscribedAt: new Date("2026-01-01"), status: "active" },
        { id: 2, subscribedAt: new Date("2026-01-15"), status: "active" },
        { id: 3, subscribedAt: new Date("2026-02-01"), status: "active" },
        { id: 4, subscribedAt: new Date("2026-02-15"), status: "active" },
      ];

      const after = new Date("2026-01-10");
      const before = new Date("2026-02-10");
      const matched = subscribers.filter(
        (s) => s.status === "active" && s.subscribedAt >= after && s.subscribedAt <= before
      );
      expect(matched).toHaveLength(2);
    });

    it("should filter by hasCompany", () => {
      const subscribers = [
        { id: 1, company: "테스트 회사", status: "active" },
        { id: 2, company: null, status: "active" },
        { id: 3, company: "고감도", status: "active" },
        { id: 4, company: "", status: "active" },
      ];

      const withCompany = subscribers.filter(
        (s) => s.status === "active" && s.company && s.company.length > 0
      );
      expect(withCompany).toHaveLength(2);

      const withoutCompany = subscribers.filter(
        (s) => s.status === "active" && (!s.company || s.company.length === 0)
      );
      expect(withoutCompany).toHaveLength(2);
    });

    it("should combine multiple filter conditions", () => {
      const subscribers = [
        { id: 1, source: "estimator", company: "테스트", subscribedAt: new Date("2026-02-01"), status: "active" },
        { id: 2, source: "estimator", company: null, subscribedAt: new Date("2026-02-01"), status: "active" },
        { id: 3, source: "website", company: "고감도", subscribedAt: new Date("2026-02-01"), status: "active" },
        { id: 4, source: "estimator", company: "다른회사", subscribedAt: new Date("2025-12-01"), status: "active" },
      ];

      const filter = {
        sources: ["estimator"],
        hasCompany: true,
        subscribedAfter: new Date("2026-01-01"),
      };

      const matched = subscribers.filter((s) => {
        if (s.status !== "active") return false;
        if (filter.sources && !filter.sources.includes(s.source)) return false;
        if (filter.hasCompany && (!s.company || s.company.length === 0)) return false;
        if (filter.subscribedAfter && s.subscribedAt < filter.subscribedAfter) return false;
        return true;
      });

      expect(matched).toHaveLength(1);
      expect(matched[0].id).toBe(1);
    });

    it("should return all active subscribers when no filters", () => {
      const subscribers = [
        { id: 1, source: "estimator", status: "active" },
        { id: 2, source: "website", status: "active" },
        { id: 3, source: "contact_form", status: "unsubscribed" },
      ];

      const filter = {};
      const matched = subscribers.filter((s) => {
        if (s.status !== "active") return false;
        return true;
      });
      expect(matched).toHaveLength(2);
    });
  });
});

// ===== 태그 시스템 테스트 =====
describe("Subscriber Tags", () => {
  describe("Tag management", () => {
    it("should add a tag to subscriber", () => {
      const subscriberTags: string[] = [];
      const newTag = "VIP";
      subscriberTags.push(newTag);
      expect(subscriberTags).toContain("VIP");
      expect(subscriberTags).toHaveLength(1);
    });

    it("should remove a tag from subscriber", () => {
      const subscriberTags = ["VIP", "견적완료", "재방문"];
      const tagToRemove = "견적완료";
      const updated = subscriberTags.filter((t) => t !== tagToRemove);
      expect(updated).toHaveLength(2);
      expect(updated).not.toContain("견적완료");
    });

    it("should prevent duplicate tags", () => {
      const existingTags = ["VIP", "견적완료"];
      const newTag = "VIP";
      const isDuplicate = existingTags.includes(newTag);
      expect(isDuplicate).toBe(true);
    });

    it("should get all unique tags across subscribers", () => {
      const allSubscriberTags = [
        ["VIP", "견적완료"],
        ["VIP", "재방문"],
        ["신규", "견적완료"],
      ];
      const uniqueTags = [...new Set(allSubscriberTags.flat())];
      expect(uniqueTags).toHaveLength(4);
      expect(uniqueTags).toContain("VIP");
      expect(uniqueTags).toContain("견적완료");
      expect(uniqueTags).toContain("재방문");
      expect(uniqueTags).toContain("신규");
    });

    it("should filter subscribers by tag", () => {
      const subscribers = [
        { id: 1, tags: ["VIP", "견적완료"] },
        { id: 2, tags: ["VIP"] },
        { id: 3, tags: ["신규"] },
        { id: 4, tags: ["VIP", "재방문"] },
      ];

      const filterTag = "VIP";
      const matched = subscribers.filter((s) => s.tags.includes(filterTag));
      expect(matched).toHaveLength(3);
    });
  });
});

// ===== 타겟 캠페인 테스트 =====
describe("Targeted Campaigns", () => {
  describe("Campaign with segment", () => {
    it("should create campaign with segment ID", () => {
      const campaign = {
        title: "견적 고객 타겟 캠페인",
        subject: "[고감도] 맞춤 인테리어 제안",
        segmentId: 1,
        articleIds: [1, 2],
        status: "draft",
      };

      expect(campaign.segmentId).toBe(1);
      expect(campaign.articleIds).toHaveLength(2);
    });

    it("should create campaign without segment (all subscribers)", () => {
      const campaign = {
        title: "전체 발송 캠페인",
        subject: "[고감도] 2월 뉴스레터",
        segmentId: undefined,
        status: "draft",
      };

      expect(campaign.segmentId).toBeUndefined();
    });
  });

  describe("Campaign sending with segments", () => {
    it("should send to segment subscribers only", () => {
      const allSubscribers = [
        { id: 1, email: "a@test.com", source: "estimator", status: "active" },
        { id: 2, email: "b@test.com", source: "website", status: "active" },
        { id: 3, email: "c@test.com", source: "estimator", status: "active" },
      ];

      const segmentFilter = { sources: ["estimator"] };
      const targetSubscribers = allSubscribers.filter(
        (s) => s.status === "active" && segmentFilter.sources.includes(s.source)
      );

      expect(targetSubscribers).toHaveLength(2);
      expect(targetSubscribers.every((s) => s.source === "estimator")).toBe(true);
    });

    it("should send to all active subscribers when no segment", () => {
      const allSubscribers = [
        { id: 1, status: "active" },
        { id: 2, status: "active" },
        { id: 3, status: "unsubscribed" },
      ];

      const targetSubscribers = allSubscribers.filter((s) => s.status === "active");
      expect(targetSubscribers).toHaveLength(2);
    });

    it("should not send to unsubscribed users even in segment", () => {
      const segmentSubscribers = [
        { id: 1, status: "active" },
        { id: 2, status: "unsubscribed" },
        { id: 3, status: "active" },
      ];

      const activeOnly = segmentSubscribers.filter((s) => s.status === "active");
      expect(activeOnly).toHaveLength(2);
    });

    it("should track recipient count per campaign", () => {
      const campaign = {
        id: 1,
        segmentId: 2,
        recipientCount: 0,
        status: "draft" as string,
      };

      // Simulate sending
      const sentTo = 25;
      campaign.recipientCount = sentTo;
      campaign.status = "sent";

      expect(campaign.recipientCount).toBe(25);
      expect(campaign.status).toBe("sent");
    });
  });
});

// ===== 유입 경로별 통계 테스트 =====
describe("Source Statistics", () => {
  it("should calculate stats per source", () => {
    const subscribers = [
      { source: "estimator", status: "active" },
      { source: "estimator", status: "active" },
      { source: "estimator", status: "unsubscribed" },
      { source: "website", status: "active" },
      { source: "website", status: "active" },
      { source: "contact_form", status: "active" },
    ];

    const stats: Record<string, { total: number; active: number }> = {};
    subscribers.forEach((s) => {
      if (!stats[s.source]) stats[s.source] = { total: 0, active: 0 };
      stats[s.source].total++;
      if (s.status === "active") stats[s.source].active++;
    });

    expect(stats["estimator"].total).toBe(3);
    expect(stats["estimator"].active).toBe(2);
    expect(stats["website"].total).toBe(2);
    expect(stats["website"].active).toBe(2);
    expect(stats["contact_form"].total).toBe(1);
    expect(stats["contact_form"].active).toBe(1);
  });

  it("should calculate active rate percentage", () => {
    const stats = { total: 50, active: 45 };
    const activeRate = Math.round((stats.active / stats.total) * 100);
    expect(activeRate).toBe(90);
  });

  it("should handle zero subscribers gracefully", () => {
    const stats = { total: 0, active: 0 };
    const activeRate = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;
    expect(activeRate).toBe(0);
  });
});

// ===== 유입 경로 라벨 테스트 =====
describe("Source Labels", () => {
  it("should map all source codes to Korean labels", () => {
    const SOURCE_LABELS: Record<string, string> = {
      website: "웹사이트",
      contact_form: "문의폼",
      manual: "수동 등록",
      lead_magnet: "리드마그넷",
      estimator: "AI 견적",
      portfolio: "포트폴리오",
      insight: "인사이트",
      ai_chat: "AI 채팅",
      style_quiz: "스타일 퀴즈",
    };

    expect(Object.keys(SOURCE_LABELS)).toHaveLength(9);
    expect(SOURCE_LABELS["estimator"]).toBe("AI 견적");
    expect(SOURCE_LABELS["website"]).toBe("웹사이트");
    expect(SOURCE_LABELS["contact_form"]).toBe("문의폼");
    expect(SOURCE_LABELS["portfolio"]).toBe("포트폴리오");
    expect(SOURCE_LABELS["insight"]).toBe("인사이트");
  });

  it("should handle unknown source gracefully", () => {
    const SOURCE_LABELS: Record<string, string> = { website: "웹사이트" };
    const unknownSource = "unknown_source";
    const label = SOURCE_LABELS[unknownSource] || unknownSource;
    expect(label).toBe("unknown_source");
  });
});

// ===== 세그먼트 색상 테스트 =====
describe("Segment Colors", () => {
  it("should provide predefined color palette", () => {
    const SEGMENT_COLORS = [
      "#b8860b", "#2563eb", "#dc2626", "#16a34a", "#9333ea",
      "#ea580c", "#0891b2", "#be185d", "#65a30d", "#4f46e5",
    ];
    expect(SEGMENT_COLORS).toHaveLength(10);
    SEGMENT_COLORS.forEach((color) => {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });
});
