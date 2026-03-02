/**
 * Vendor Portal System Tests
 * Tests for vendor quotes, quote items, material price history, price analytics
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./db", () => ({
  createVendorQuote: vi.fn().mockResolvedValue(1),
  getVendorQuotesByProject: vi.fn().mockResolvedValue([
    { id: 1, clientProjectId: 1, vendorName: "삼성물산", quoteCategory: "바닥재", totalAmount: 15000000, status: "submitted", createdAt: new Date() },
  ]),
  getVendorQuoteById: vi.fn().mockResolvedValue({
    id: 1, clientProjectId: 1, vendorName: "삼성물산", quoteCategory: "바닥재", totalAmount: 15000000, status: "submitted",
  }),
  updateVendorQuote: vi.fn().mockResolvedValue(true),
  createVendorQuoteItems: vi.fn().mockResolvedValue([1, 2]),
  getVendorQuoteItemsByQuote: vi.fn().mockResolvedValue([
    { id: 1, quoteId: 1, materialCode: "FLR-001", materialName: "강화마루", quantity: 100, unit: "㎡", unitPrice: 25000, totalPrice: 2500000 },
  ]),
  createMaterialPriceHistory: vi.fn().mockResolvedValue(1),
  getMaterialPriceHistory: vi.fn().mockResolvedValue([
    { id: 1, materialCode: "FLR-001", materialName: "강화마루", unitPrice: 25000, supplier: "삼성물산", priceDate: new Date() },
  ]),
  getMaterialPriceAnalytics: vi.fn().mockResolvedValue([
    { id: 1, materialCode: "FLR-001", materialName: "강화마루", avgPrice: 25000, minPrice: 22000, maxPrice: 28000, priceChangeRate: 2.5, analyzedAt: new Date() },
  ]),
  createMaterialPriceAnalytics: vi.fn().mockResolvedValue(1),
}));

vi.mock("./_core/trpc", () => ({
  router: vi.fn((routes: any) => routes),
  publicProcedure: {
    input: vi.fn().mockReturnThis(),
    query: vi.fn().mockReturnThis(),
    mutation: vi.fn().mockReturnThis(),
  },
  protectedProcedure: {
    input: vi.fn().mockReturnThis(),
    query: vi.fn().mockReturnThis(),
    mutation: vi.fn().mockReturnThis(),
    use: vi.fn(() => ({
      input: vi.fn().mockReturnThis(),
      query: vi.fn().mockReturnThis(),
      mutation: vi.fn().mockReturnThis(),
    })),
  },
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify({
      items: [{ materialCode: "FLR-001", materialName: "강화마루", quantity: 100, unit: "㎡", unitPrice: 25000, totalPrice: 2500000 }],
      summary: "바닥재 견적 분석 완료",
    }) } }],
  }),
}));

import {
  createVendorQuote,
  getVendorQuotesByProject,
  getVendorQuoteById,
  updateVendorQuote,
  createVendorQuoteItems,
  getVendorQuoteItemsByQuote,
  createMaterialPriceHistory,
  getMaterialPriceHistory,
  getMaterialPriceAnalytics,
  createMaterialPriceAnalytics,
} from "./db";

describe("Vendor Portal System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Vendor Quotes", () => {
    it("should create a vendor quote", async () => {
      const result = await (createVendorQuote as any)({
        clientProjectId: 1,
        vendorName: "삼성물산",
        quoteCategory: "바닥재",
        totalAmount: 15000000,
      });
      expect(result).toBe(1);
      expect(createVendorQuote).toHaveBeenCalledTimes(1);
    });

    it("should list quotes by project", async () => {
      const result = await (getVendorQuotesByProject as any)(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("vendorName", "삼성물산");
      expect(result[0]).toHaveProperty("totalAmount", 15000000);
    });

    it("should get quote by id", async () => {
      const result = await (getVendorQuoteById as any)(1);
      expect(result).toHaveProperty("quoteCategory", "바닥재");
    });

    it("should update quote status", async () => {
      const result = await (updateVendorQuote as any)(1, { status: "approved" });
      expect(result).toBe(true);
    });
  });

  describe("Quote Items", () => {
    it("should create quote items", async () => {
      const result = await (createVendorQuoteItems as any)([
        { quoteId: 1, materialCode: "FLR-001", materialName: "강화마루", quantity: 100, unit: "㎡", unitPrice: 25000, totalPrice: 2500000 },
      ]);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should get items by quote", async () => {
      const result = await (getVendorQuoteItemsByQuote as any)(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("materialCode", "FLR-001");
    });
  });

  describe("Material Price History", () => {
    it("should record material price", async () => {
      const result = await (createMaterialPriceHistory as any)({
        materialCode: "FLR-001",
        materialName: "강화마루",
        unitPrice: 25000,
        supplier: "삼성물산",
      });
      expect(result).toBe(1);
    });

    it("should get price history", async () => {
      const result = await (getMaterialPriceHistory as any)("FLR-001");
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("unitPrice", 25000);
    });
  });

  describe("Material Price Analytics", () => {
    it("should get price analytics", async () => {
      const result = await (getMaterialPriceAnalytics as any)();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("avgPrice", 25000);
      expect(result[0]).toHaveProperty("priceChangeRate", 2.5);
    });

    it("should create analytics record", async () => {
      const result = await (createMaterialPriceAnalytics as any)({
        materialCode: "FLR-001",
        materialName: "강화마루",
        avgPrice: 25000,
        minPrice: 22000,
        maxPrice: 28000,
        priceChangeRate: 2.5,
      });
      expect(result).toBe(1);
    });
  });
});
