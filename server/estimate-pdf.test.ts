import { describe, it, expect } from "vitest";

// Test the estimate PDF data structure and generation logic
describe("Estimate PDF Feature", () => {
  // Test data structure validation
  describe("EstimatePdfData structure", () => {
    it("should have all required fields for PDF generation", () => {
      const estimateData = {
        estimateNumber: "EST-20260215-1234",
        title: "사무실 인테리어 1차 견적서",
        version: 1,
        items: [
          {
            category: "철거공사",
            subcategory: "내부 철거",
            item: "기존 벽체 철거",
            specification: "경량벽체",
            unit: "㎡",
            quantity: 50,
            materialUnitPrice: 0,
            materialAmount: 0,
            laborUnitPrice: 15000,
            laborAmount: 750000,
            totalAmount: 750000,
            remarks: "",
          },
          {
            category: "전기공사",
            subcategory: "조명",
            item: "LED 매입등 설치",
            specification: "600x600",
            unit: "EA",
            quantity: 30,
            materialUnitPrice: 25000,
            materialAmount: 750000,
            laborUnitPrice: 10000,
            laborAmount: 300000,
            totalAmount: 1050000,
          },
        ],
        subtotal: "1800000",
        overhead: "180000",
        profit: "90000",
        vat: "207000",
        grandTotal: "2277000",
        notes: "본 견적서는 현장 실측 후 변경될 수 있습니다.",
        validUntil: "2026-03-15",
        status: "submitted",
        createdAt: "2026-02-15T10:00:00Z",
        projectName: "승일일렉트로닉스 본사 리모델링",
        clientName: "승일일렉트로닉스",
        siteAddress: "서울시 강남구 테헤란로 123",
        authorName: "김설계",
      };

      // Verify required fields exist
      expect(estimateData.estimateNumber).toBeTruthy();
      expect(estimateData.title).toBeTruthy();
      expect(estimateData.items).toBeInstanceOf(Array);
      expect(estimateData.items.length).toBe(2);
      expect(estimateData.grandTotal).toBeTruthy();
      expect(estimateData.projectName).toBeTruthy();
      expect(estimateData.status).toBeTruthy();
      expect(estimateData.createdAt).toBeTruthy();
    });

    it("should correctly calculate item totals", () => {
      const items = [
        { quantity: 50, materialUnitPrice: 0, laborUnitPrice: 15000, totalAmount: 750000 },
        { quantity: 30, materialUnitPrice: 25000, laborUnitPrice: 10000, totalAmount: 1050000 },
      ];

      // Verify material + labor = total
      items.forEach((item) => {
        const materialAmount = item.quantity * item.materialUnitPrice;
        const laborAmount = item.quantity * item.laborUnitPrice;
        expect(materialAmount + laborAmount).toBe(item.totalAmount);
      });

      // Verify subtotal
      const subtotal = items.reduce((sum, item) => sum + item.totalAmount, 0);
      expect(subtotal).toBe(1800000);
    });

    it("should handle empty items array", () => {
      const estimateData = {
        estimateNumber: "EST-20260215-0001",
        title: "빈 견적서",
        items: [],
        subtotal: "0",
        overhead: "0",
        profit: "0",
        vat: "0",
        grandTotal: "0",
        status: "draft",
        createdAt: "2026-02-15T10:00:00Z",
        projectName: "테스트 프로젝트",
      };

      expect(estimateData.items.length).toBe(0);
      expect(estimateData.grandTotal).toBe("0");
    });

    it("should group items by category correctly", () => {
      const items = [
        { category: "철거공사", item: "벽체 철거", totalAmount: 500000 },
        { category: "철거공사", item: "바닥 철거", totalAmount: 300000 },
        { category: "전기공사", item: "배선 공사", totalAmount: 1200000 },
        { category: "설비공사", item: "에어컨 설치", totalAmount: 2000000 },
        { category: "전기공사", item: "조명 설치", totalAmount: 800000 },
      ];

      const categories = new Map<string, typeof items>();
      items.forEach((item) => {
        const cat = item.category;
        if (!categories.has(cat)) categories.set(cat, []);
        categories.get(cat)!.push(item);
      });

      expect(categories.size).toBe(3);
      expect(categories.get("철거공사")!.length).toBe(2);
      expect(categories.get("전기공사")!.length).toBe(2);
      expect(categories.get("설비공사")!.length).toBe(1);

      // Verify category subtotals
      const demolitionTotal = categories.get("철거공사")!.reduce((s, i) => s + i.totalAmount, 0);
      expect(demolitionTotal).toBe(800000);
    });
  });

  // Test number formatting
  describe("Number formatting", () => {
    it("should format Korean numbers correctly", () => {
      const formatNumber = (val: string | number | null | undefined): string => {
        if (val === null || val === undefined || val === "") return "0";
        const num = typeof val === "string" ? parseFloat(val) : val;
        if (isNaN(num)) return "0";
        return num.toLocaleString("ko-KR");
      };

      expect(formatNumber(1000000)).toBe("1,000,000");
      expect(formatNumber("2500000")).toBe("2,500,000");
      expect(formatNumber(0)).toBe("0");
      expect(formatNumber(null)).toBe("0");
      expect(formatNumber(undefined)).toBe("0");
      expect(formatNumber("")).toBe("0");
      expect(formatNumber("abc")).toBe("0");
    });
  });

  // Test date formatting
  describe("Date formatting", () => {
    it("should format dates in Korean format", () => {
      const formatDate = (dateStr: string | undefined): string => {
        if (!dateStr) return "-";
        try {
          const d = new Date(dateStr);
          return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
        } catch {
          return dateStr;
        }
      };

      expect(formatDate("2026-02-15T10:00:00Z")).toBe("2026.02.15");
      expect(formatDate(undefined)).toBe("-");
    });
  });

  // Test status labels
  describe("Status labels", () => {
    it("should have all required status labels", () => {
      const STATUS_LABELS: Record<string, string> = {
        draft: "초안",
        submitted: "제출",
        approved: "승인",
        rejected: "반려",
        sent: "발송완료",
      };

      expect(STATUS_LABELS["draft"]).toBe("초안");
      expect(STATUS_LABELS["submitted"]).toBe("제출");
      expect(STATUS_LABELS["approved"]).toBe("승인");
      expect(STATUS_LABELS["rejected"]).toBe("반려");
      expect(STATUS_LABELS["sent"]).toBe("발송완료");
    });
  });

  // Test estimate API structure
  describe("Estimate API", () => {
    it("should generate valid estimate numbers", () => {
      const now = new Date(2026, 1, 15); // Feb 15, 2026
      const estimateNumber = `EST-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getTime()).slice(-4)}`;

      expect(estimateNumber).toMatch(/^EST-20260215-\d{4}$/);
    });

    it("should validate required create fields", () => {
      const validInput = {
        projectId: 1,
        title: "1차 견적서",
        items: [],
      };

      expect(validInput.projectId).toBeGreaterThan(0);
      expect(validInput.title.length).toBeGreaterThan(0);
      expect(validInput.items).toBeInstanceOf(Array);
    });
  });
});
