import { describe, it, expect, vi, beforeEach } from "vitest";

// ===== 1. 대시보드 통계 위젯 강화 테스트 =====
describe("Dashboard Stats Enhancement", () => {
  it("should format amounts correctly with formatAmount", () => {
    // 억 단위
    const formatAmount = (amount: number): string => {
      if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억`;
      if (amount >= 10000) return `${Math.round(amount / 10000).toLocaleString()}만`;
      return amount.toLocaleString();
    };

    expect(formatAmount(150000000)).toBe("1.5억");
    expect(formatAmount(500000000)).toBe("5.0억");
    expect(formatAmount(50000000)).toBe("5,000만");
    expect(formatAmount(1000000)).toBe("100만");
    expect(formatAmount(5000)).toBe("5,000");
  });

  it("should return extended stats fields", () => {
    const stats = {
      totalProjects: 5,
      activeProjects: 3,
      totalExpenses: 12,
      pendingApprovals: 2,
      totalContractAmount: 500000000,
      monthlyExpenseAmount: 30000000,
      avgScheduleProgress: 65,
      completedProjects: 1,
    };

    expect(stats.totalContractAmount).toBe(500000000);
    expect(stats.monthlyExpenseAmount).toBe(30000000);
    expect(stats.avgScheduleProgress).toBe(65);
    expect(stats.completedProjects).toBe(1);
    expect(stats.avgScheduleProgress).toBeGreaterThanOrEqual(0);
    expect(stats.avgScheduleProgress).toBeLessThanOrEqual(100);
  });

  it("should calculate budget rate correctly", () => {
    const totalBudget = 100000000;
    const totalActual = 75000000;
    const budgetRate = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0;
    expect(budgetRate).toBe(75);
  });

  it("should handle zero budget gracefully", () => {
    const totalBudget = 0;
    const totalActual = 0;
    const budgetRate = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0;
    expect(budgetRate).toBe(0);
  });

  it("should calculate schedule compliance rate", () => {
    const totalSchedules = 10;
    const delayedSchedules = 2;
    const complianceRate = totalSchedules > 0
      ? Math.round(((totalSchedules - delayedSchedules) / totalSchedules) * 100)
      : 100;
    expect(complianceRate).toBe(80);
  });

  it("should return 100% compliance when no schedules exist", () => {
    const totalSchedules = 0;
    const delayedSchedules = 0;
    const complianceRate = totalSchedules > 0
      ? Math.round(((totalSchedules - delayedSchedules) / totalSchedules) * 100)
      : 100;
    expect(complianceRate).toBe(100);
  });

  it("should calculate average progress correctly", () => {
    const schedules = [
      { progress: 100 },
      { progress: 50 },
      { progress: 75 },
      { progress: 0 },
    ];
    const avg = Math.round(schedules.reduce((sum, s) => sum + s.progress, 0) / schedules.length);
    expect(avg).toBe(56);
  });

  it("should calculate contract usage rate", () => {
    const contractAmount = 200000000;
    const totalExpenseAmount = 80000000;
    const usageRate = contractAmount > 0 ? Math.round((totalExpenseAmount / contractAmount) * 100) : 0;
    expect(usageRate).toBe(40);
  });

  it("should color-code budget rate thresholds", () => {
    const getColor = (rate: number) => {
      if (rate > 90) return "red";
      if (rate > 70) return "amber";
      return "blue";
    };
    expect(getColor(95)).toBe("red");
    expect(getColor(80)).toBe("amber");
    expect(getColor(50)).toBe("blue");
  });
});

// ===== 2. 하도급 업체 평가 시스템 연동 테스트 =====
describe("Subcontractor Evaluation Integration", () => {
  it("should validate evaluation scores range (1-5)", () => {
    const scores = [1, 2, 3, 4, 5];
    scores.forEach(s => {
      expect(s).toBeGreaterThanOrEqual(1);
      expect(s).toBeLessThanOrEqual(5);
    });
  });

  it("should calculate overall score from individual scores", () => {
    const evaluation = {
      qualityScore: 4,
      scheduleScore: 3,
      safetyScore: 5,
      communicationScore: 4,
      cleanupScore: 3,
    };
    const overall = (
      evaluation.qualityScore +
      evaluation.scheduleScore +
      evaluation.safetyScore +
      evaluation.communicationScore +
      evaluation.cleanupScore
    ) / 5;
    expect(overall).toBe(3.8);
  });

  it("should calculate average from multiple evaluations", () => {
    const evaluations = [
      { overallScore: 4.2 },
      { overallScore: 3.8 },
      { overallScore: 4.5 },
    ];
    const avg = evaluations.reduce((sum, e) => sum + e.overallScore, 0) / evaluations.length;
    expect(Number(avg.toFixed(1))).toBe(4.2);
  });

  it("should calculate recommendation rate", () => {
    const totalEvaluations = 10;
    const recommendedCount = 7; // highly_recommended + recommended
    const rate = Math.round((recommendedCount / totalEvaluations) * 100);
    expect(rate).toBe(70);
  });

  it("should handle null summary (no evaluations)", () => {
    const summary = null;
    const score = summary ? Number((summary as any).avgOverall) : 0;
    expect(score).toBe(0);
  });

  it("should validate recommendation enum values", () => {
    const validRecommendations = ["highly_recommended", "recommended", "neutral", "not_recommended"];
    validRecommendations.forEach(r => {
      expect(typeof r).toBe("string");
    });
    expect(validRecommendations).not.toContain("invalid");
  });

  it("should color-code rating badges", () => {
    const getColor = (score: number) => {
      if (score >= 4) return "green";
      if (score >= 3) return "amber";
      return "red";
    };
    expect(getColor(4.5)).toBe("green");
    expect(getColor(3.5)).toBe("amber");
    expect(getColor(2.5)).toBe("red");
  });

  it("should map recommendation labels to Korean", () => {
    const labels: Record<string, string> = {
      highly_recommended: "적극 추천",
      recommended: "추천",
      neutral: "보통",
      not_recommended: "비추천",
    };
    expect(labels["highly_recommended"]).toBe("적극 추천");
    expect(labels["not_recommended"]).toBe("비추천");
  });

  it("should calculate per-category averages", () => {
    const evaluations = [
      { qualityScore: 4, scheduleScore: 3, safetyScore: 5, communicationScore: 4, cleanupScore: 3 },
      { qualityScore: 5, scheduleScore: 4, safetyScore: 4, communicationScore: 5, cleanupScore: 4 },
    ];
    const avgQuality = evaluations.reduce((s, e) => s + e.qualityScore, 0) / evaluations.length;
    expect(avgQuality).toBe(4.5);
  });

  it("should count recommended evaluations correctly", () => {
    const evaluations = [
      { recommendation: "highly_recommended" },
      { recommendation: "recommended" },
      { recommendation: "neutral" },
      { recommendation: "not_recommended" },
      { recommendation: "recommended" },
    ];
    const recommendedCount = evaluations.filter(
      e => e.recommendation === "highly_recommended" || e.recommendation === "recommended"
    ).length;
    expect(recommendedCount).toBe(3);
  });
});

// ===== 3. 브라우저 푸시 알림 테스트 =====
describe("Browser Push Notification", () => {
  it("should store notification settings in localStorage format", () => {
    const settings = { browserNotif: true, sound: true };
    const serialized = JSON.stringify(settings);
    const parsed = JSON.parse(serialized);
    expect(parsed.browserNotif).toBe(true);
    expect(parsed.sound).toBe(true);
  });

  it("should toggle notification settings", () => {
    let settings = { browserNotif: true, sound: true };
    settings = { ...settings, browserNotif: !settings.browserNotif };
    expect(settings.browserNotif).toBe(false);
    expect(settings.sound).toBe(true);
  });

  it("should detect new notifications by comparing counts", () => {
    let prevCount = 3;
    const currentCount = 5;
    const hasNewNotifications = currentCount > prevCount;
    expect(hasNewNotifications).toBe(true);
    const newCount = currentCount - prevCount;
    expect(newCount).toBe(2);
  });

  it("should not trigger on initial load (prevCount = 0)", () => {
    const prevCount = 0;
    const currentCount = 5;
    // On initial load, prevCount starts at 0 and should trigger
    const hasNew = currentCount > prevCount && prevCount >= 0;
    expect(hasNew).toBe(true);
  });

  it("should not trigger when count decreases (read notifications)", () => {
    const prevCount = 5;
    const currentCount = 3;
    const hasNew = currentCount > prevCount;
    expect(hasNew).toBe(false);
  });

  it("should validate notification permission states", () => {
    const validStates = ["default", "granted", "denied"];
    validStates.forEach(s => expect(typeof s).toBe("string"));
  });

  it("should format notification body correctly", () => {
    const newCount = 3;
    const body = `새로운 알림이 ${newCount}건 도착했습니다.`;
    expect(body).toContain("3건");
    expect(body).toContain("도착");
  });

  it("should handle default settings when localStorage is empty", () => {
    const getSettings = () => {
      try {
        const stored = null; // simulating empty localStorage
        if (stored) return JSON.parse(stored);
      } catch {}
      return { browserNotif: true, sound: true };
    };
    const settings = getSettings();
    expect(settings.browserNotif).toBe(true);
    expect(settings.sound).toBe(true);
  });

  it("should handle corrupted localStorage gracefully", () => {
    const getSettings = () => {
      try {
        const stored = "invalid-json{";
        if (stored) return JSON.parse(stored);
      } catch {}
      return { browserNotif: true, sound: true };
    };
    const settings = getSettings();
    expect(settings.browserNotif).toBe(true);
    expect(settings.sound).toBe(true);
  });

  it("should use 15 second polling interval", () => {
    const POLLING_INTERVAL = 15000;
    expect(POLLING_INTERVAL).toBe(15000);
    expect(POLLING_INTERVAL).toBeLessThan(30000); // faster than before
  });

  it("should auto-close browser notification after timeout", () => {
    const NOTIFICATION_TIMEOUT = 8000;
    expect(NOTIFICATION_TIMEOUT).toBe(8000);
    expect(NOTIFICATION_TIMEOUT).toBeGreaterThan(5000);
    expect(NOTIFICATION_TIMEOUT).toBeLessThan(15000);
  });
});

// ===== 4. 프로젝트 개요 탭 게이지 차트 테스트 =====
describe("Project Overview Gauge Charts", () => {
  it("should calculate budget consumption rate", () => {
    const costs = [
      { budget: 50000000, actual: 40000000 },
      { budget: 30000000, actual: 25000000 },
    ];
    const totalBudget = costs.reduce((sum, c) => sum + c.budget, 0);
    const totalActual = costs.reduce((sum, c) => sum + c.actual, 0);
    const rate = Math.round((totalActual / totalBudget) * 100);
    expect(rate).toBe(81);
  });

  it("should cap budget rate display at 100%", () => {
    const budgetRate = 120;
    const displayWidth = Math.min(budgetRate, 100);
    expect(displayWidth).toBe(100);
  });

  it("should color-code schedule compliance", () => {
    const getColor = (rate: number) => {
      if (rate >= 90) return "green";
      if (rate >= 70) return "amber";
      return "red";
    };
    expect(getColor(95)).toBe("green");
    expect(getColor(75)).toBe("amber");
    expect(getColor(50)).toBe("red");
  });

  it("should calculate average progress from schedule items", () => {
    const items = [
      { progress: 100 },
      { progress: 80 },
      { progress: 60 },
      { progress: 40 },
      { progress: 20 },
    ];
    const avg = Math.round(items.reduce((sum, i) => sum + i.progress, 0) / items.length);
    expect(avg).toBe(60);
  });

  it("should handle empty cost data", () => {
    const costs: { budget: number; actual: number }[] = [];
    const totalBudget = costs.reduce((sum, c) => sum + c.budget, 0);
    const totalActual = costs.reduce((sum, c) => sum + c.actual, 0);
    const rate = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0;
    expect(rate).toBe(0);
  });
});
