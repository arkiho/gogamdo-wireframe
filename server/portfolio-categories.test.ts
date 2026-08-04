import { describe, expect, it } from "vitest";
import {
  PROJECTS,
  MAJOR_CATEGORIES,
  CATEGORY_MAP,
  getSubCategories,
  type MajorCategory,
} from "../client/src/lib/images";

const EXPECTED_MAJOR_CATEGORIES = [
  "전체",
  "오피스",
  "산업시설",
  "병원",
  "관급공사",
  "커머셜",
] as const;

describe("Portfolio Category System", () => {
  describe("current category contract", () => {
    it("exposes the current business categories with '전체' first", () => {
      expect(MAJOR_CATEGORIES).toEqual(EXPECTED_MAJOR_CATEGORIES);
    });

    it("maps every sub-category to a valid major category", () => {
      const validMajors = MAJOR_CATEGORIES.filter(category => category !== "전체");
      for (const major of Object.values(CATEGORY_MAP)) {
        expect(validMajors).toContain(major);
      }
    });

    it("maps office categories to '오피스'", () => {
      for (const category of [
        "사무실 인테리어",
        "IT 오피스",
        "글로벌 기업 오피스",
        "크리에이티브 오피스",
        "크리에이티브 스튜디오",
      ]) {
        expect(CATEGORY_MAP[category]).toBe("오피스");
      }
    });

    it("keeps public projects separate from industrial facilities", () => {
      expect(CATEGORY_MAP["공공기관"]).toBe("관급공사");
      expect(CATEGORY_MAP["교육시설"]).toBe("관급공사");
      expect(CATEGORY_MAP["산업시설"]).toBe("산업시설");
    });

    it("maps healthcare and commercial categories", () => {
      expect(CATEGORY_MAP["헬스케어 오피스"]).toBe("병원");
      expect(CATEGORY_MAP["클리닉"]).toBe("병원");
      expect(CATEGORY_MAP["상업공간"]).toBe("커머셜");
      expect(CATEGORY_MAP["F&B"]).toBe("커머셜");
    });
  });

  describe("getSubCategories", () => {
    it("returns no sub-filter for '전체'", () => {
      expect(getSubCategories("전체")).toEqual([]);
    });

    it("returns only sub-categories belonging to the selected major", () => {
      for (const major of MAJOR_CATEGORIES.filter(category => category !== "전체")) {
        const subCategories = getSubCategories(major);
        expect(subCategories.length).toBeGreaterThan(0);
        for (const subCategory of subCategories) {
          expect(CATEGORY_MAP[subCategory]).toBe(major);
        }
      }
    });
  });

  describe("PROJECTS data integrity", () => {
    it("contains verified projects without requiring fabricated minimum counts", () => {
      expect(PROJECTS.length).toBeGreaterThan(0);
    });

    it("keeps category mapping and required fields consistent", () => {
      for (const project of PROJECTS) {
        expect(project.slug).toBeTruthy();
        expect(project.name).toBeTruthy();
        expect(project.category).toBeTruthy();
        expect(project.image).toBeTruthy();
        expect(project.area).toBeTruthy();
        expect(project.year).toBeTruthy();
        expect(MAJOR_CATEGORIES).toContain(project.majorCategory);
        expect(CATEGORY_MAP[project.category]).toBe(project.majorCategory);
      }
    });

    it("uses unique slugs", () => {
      const slugs = PROJECTS.map(project => project.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    });

    it("represents multiple major categories", () => {
      expect(new Set(PROJECTS.map(project => project.majorCategory)).size).toBeGreaterThanOrEqual(3);
    });
  });

  describe("filtering", () => {
    const filterProjects = (major: MajorCategory, subCategory?: string) => {
      const byMajor = major === "전체"
        ? PROJECTS
        : PROJECTS.filter(project => project.majorCategory === major);
      return subCategory
        ? byMajor.filter(project => project.category === subCategory)
        : byMajor;
    };

    it("returns all projects for '전체'", () => {
      expect(filterProjects("전체")).toEqual(PROJECTS);
    });

    it("filters by major category", () => {
      const officeProjects = filterProjects("오피스");
      expect(officeProjects.length).toBeGreaterThan(0);
      expect(officeProjects.every(project => project.majorCategory === "오피스")).toBe(true);
    });

    it("applies a compatible sub-category after the major filter", () => {
      const officeProjects = filterProjects("오피스");
      const itOfficeProjects = filterProjects("오피스", "IT 오피스");
      expect(itOfficeProjects.length).toBeGreaterThan(0);
      expect(itOfficeProjects.length).toBeLessThan(officeProjects.length);
      expect(itOfficeProjects.every(project =>
        project.majorCategory === "오피스" && project.category === "IT 오피스"
      )).toBe(true);
    });
  });
});
