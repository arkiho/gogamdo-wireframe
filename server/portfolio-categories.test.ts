import { describe, it, expect } from "vitest";

/**
 * Portfolio category system tests
 * Tests the category mapping, filtering logic, and data integrity
 */

// Import the category data directly (these are pure data exports)
import {
  PROJECTS,
  MAJOR_CATEGORIES,
  CATEGORY_MAP,
  getSubCategories,
  type MajorCategory,
} from "../client/src/lib/images";

describe("Portfolio Category System", () => {
  describe("MAJOR_CATEGORIES", () => {
    it("should have 5 categories including '전체'", () => {
      expect(MAJOR_CATEGORIES).toHaveLength(5);
      expect(MAJOR_CATEGORIES[0]).toBe("전체");
    });

    it("should contain the expected major categories", () => {
      expect(MAJOR_CATEGORIES).toContain("사무 공간");
      expect(MAJOR_CATEGORIES).toContain("상업 공간");
      expect(MAJOR_CATEGORIES).toContain("의료·복지");
      expect(MAJOR_CATEGORIES).toContain("산업·공공");
    });
  });

  describe("CATEGORY_MAP", () => {
    it("should map all sub-categories to valid major categories", () => {
      const validMajors = MAJOR_CATEGORIES.filter(c => c !== "전체");
      for (const [sub, major] of Object.entries(CATEGORY_MAP)) {
        expect(validMajors).toContain(major);
      }
    });

    it("should map office-related categories to '사무 공간'", () => {
      expect(CATEGORY_MAP["사무실 인테리어"]).toBe("사무 공간");
      expect(CATEGORY_MAP["IT 오피스"]).toBe("사무 공간");
      expect(CATEGORY_MAP["글로벌 기업 오피스"]).toBe("사무 공간");
      expect(CATEGORY_MAP["크리에이티브 오피스"]).toBe("사무 공간");
      expect(CATEGORY_MAP["크리에이티브 스튜디오"]).toBe("사무 공간");
    });

    it("should map healthcare categories to '의료·복지'", () => {
      expect(CATEGORY_MAP["헬스케어 오피스"]).toBe("의료·복지");
      expect(CATEGORY_MAP["병원"]).toBe("의료·복지");
      expect(CATEGORY_MAP["클리닉"]).toBe("의료·복지");
    });

    it("should map public/industrial categories to '산업·공공'", () => {
      expect(CATEGORY_MAP["공공기관"]).toBe("산업·공공");
      expect(CATEGORY_MAP["산업시설"]).toBe("산업·공공");
    });

    it("should map commercial categories to '상업 공간'", () => {
      expect(CATEGORY_MAP["상업공간"]).toBe("상업 공간");
      expect(CATEGORY_MAP["F&B"]).toBe("상업 공간");
      expect(CATEGORY_MAP["리테일"]).toBe("상업 공간");
    });
  });

  describe("getSubCategories", () => {
    it("should return empty array for '전체'", () => {
      expect(getSubCategories("전체")).toEqual([]);
    });

    it("should return sub-categories for '사무 공간'", () => {
      const subs = getSubCategories("사무 공간");
      expect(subs.length).toBeGreaterThan(0);
      expect(subs).toContain("사무실 인테리어");
      expect(subs).toContain("IT 오피스");
    });

    it("should return sub-categories for '의료·복지'", () => {
      const subs = getSubCategories("의료·복지");
      expect(subs.length).toBeGreaterThan(0);
      expect(subs).toContain("헬스케어 오피스");
    });

    it("should not return categories from other major groups", () => {
      const officeSubs = getSubCategories("사무 공간");
      expect(officeSubs).not.toContain("공공기관");
      expect(officeSubs).not.toContain("헬스케어 오피스");
    });
  });

  describe("PROJECTS data integrity", () => {
    it("should have at least 12 projects", () => {
      expect(PROJECTS.length).toBeGreaterThanOrEqual(12);
    });

    it("every project should have a majorCategory field", () => {
      for (const project of PROJECTS) {
        expect(project.majorCategory).toBeDefined();
        expect(MAJOR_CATEGORIES).toContain(project.majorCategory);
      }
    });

    it("every project's category should map to its majorCategory", () => {
      for (const project of PROJECTS) {
        const expectedMajor = CATEGORY_MAP[project.category];
        if (expectedMajor) {
          expect(project.majorCategory).toBe(expectedMajor);
        }
      }
    });

    it("every project should have required fields", () => {
      for (const project of PROJECTS) {
        expect(project.slug).toBeTruthy();
        expect(project.name).toBeTruthy();
        expect(project.category).toBeTruthy();
        expect(project.majorCategory).toBeTruthy();
        expect(project.image).toBeTruthy();
        expect(project.area).toBeTruthy();
        expect(project.year).toBeTruthy();
      }
    });

    it("should have projects in multiple major categories", () => {
      const majors = new Set(PROJECTS.map(p => p.majorCategory));
      expect(majors.size).toBeGreaterThanOrEqual(3);
    });

    it("slugs should be unique", () => {
      const slugs = PROJECTS.map(p => p.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });
  });

  describe("Filtering logic", () => {
    it("should filter projects by major category correctly", () => {
      const officeProjects = PROJECTS.filter(p => p.majorCategory === "사무 공간");
      expect(officeProjects.length).toBeGreaterThan(0);
      for (const p of officeProjects) {
        expect(p.majorCategory).toBe("사무 공간");
      }
    });

    it("should filter projects by sub-category correctly", () => {
      const itOfficeProjects = PROJECTS.filter(p => p.category === "IT 오피스");
      expect(itOfficeProjects.length).toBeGreaterThan(0);
      for (const p of itOfficeProjects) {
        expect(p.category).toBe("IT 오피스");
        expect(p.majorCategory).toBe("사무 공간");
      }
    });

    it("'전체' filter should return all projects", () => {
      // Simulating the filter logic from Portfolio.tsx
      const activeMajor: MajorCategory = "전체";
      const filtered = activeMajor === "전체" ? PROJECTS : PROJECTS.filter(p => p.majorCategory === activeMajor);
      expect(filtered.length).toBe(PROJECTS.length);
    });

    it("combined major + sub filter should narrow results", () => {
      const major: MajorCategory = "사무 공간";
      const sub = "IT 오피스";
      const majorFiltered = PROJECTS.filter(p => p.majorCategory === major);
      const subFiltered = majorFiltered.filter(p => p.category === sub);
      expect(subFiltered.length).toBeLessThan(majorFiltered.length);
      expect(subFiltered.length).toBeGreaterThan(0);
    });
  });
});
