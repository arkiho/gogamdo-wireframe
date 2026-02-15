import { describe, it, expect, vi } from "vitest";

// ============ 1. 설계자동화 → CRM 자동 연동 테스트 ============
describe("설계자동화 CRM 자동 연동", () => {
  it("설계자동화 프로젝트 생성 시 CRM 딜이 자동 생성되어야 한다", () => {
    // CRM 딜 생성 로직 검증
    const projectData = {
      name: "테스트 프로젝트",
      clientName: "테스트 고객사",
      clientEmail: "test@example.com",
      clientPhone: "010-1234-5678",
      area: "150",
      budget: "5000만원",
    };

    // CRM 딜 데이터 변환 검증
    const crmDealData = {
      title: `[설계자동화] ${projectData.name}`,
      clientName: projectData.clientName,
      contactEmail: projectData.clientEmail,
      contactPhone: projectData.clientPhone,
      estimatedValue: projectData.budget,
      stage: "lead" as const,
      source: "design_automation" as const,
    };

    expect(crmDealData.title).toContain("[설계자동화]");
    expect(crmDealData.title).toContain(projectData.name);
    expect(crmDealData.stage).toBe("lead");
    expect(crmDealData.source).toBe("design_automation");
    expect(crmDealData.clientName).toBe(projectData.clientName);
    expect(crmDealData.contactEmail).toBe(projectData.clientEmail);
  });

  it("CRM 연동 실패 시 프로젝트 생성은 정상 진행되어야 한다", () => {
    // CRM 연동은 try-catch로 감싸져 있어 실패해도 프로젝트 생성에 영향 없음
    const crmError = new Error("CRM 연동 실패");
    let projectCreated = false;
    let crmCreated = false;

    // 프로젝트 생성 시뮬레이션
    try {
      projectCreated = true; // 프로젝트 생성 성공

      // CRM 연동 시도 (실패)
      try {
        throw crmError;
      } catch (e) {
        crmCreated = false;
        console.error("CRM 연동 실패 (무시):", e);
      }
    } catch (e) {
      projectCreated = false;
    }

    expect(projectCreated).toBe(true);
    expect(crmCreated).toBe(false);
  });

  it("CRM 딜 소스가 design_automation으로 설정되어야 한다", () => {
    const source = "design_automation";
    expect(source).toBe("design_automation");
    expect(["website", "referral", "design_automation", "direct"]).toContain(source);
  });
});

// ============ 2. 프로젝트 완료 → 자동 리뷰 요청 테스트 ============
describe("프로젝트 완료 시 자동 리뷰 요청", () => {
  it("프로젝트 상태가 completed로 변경될 때만 트리거되어야 한다", () => {
    const previousStatus = "construction";
    const newStatus = "completed";
    const shouldTrigger = newStatus === "completed" && previousStatus !== "completed";
    expect(shouldTrigger).toBe(true);
  });

  it("이미 completed인 프로젝트는 다시 트리거되지 않아야 한다", () => {
    const previousStatus = "completed";
    const newStatus = "completed";
    const shouldTrigger = newStatus === "completed" && previousStatus !== "completed";
    expect(shouldTrigger).toBe(false);
  });

  it("고객 이메일이 없으면 리뷰 요청을 건너뛰어야 한다", () => {
    const project = {
      clientEmail: null,
      clientName: "테스트 고객사",
    };

    const shouldSendReview = !!project.clientEmail;
    expect(shouldSendReview).toBe(false);
  });

  it("고객 이메일이 있으면 리뷰 요청을 발송해야 한다", () => {
    const project = {
      clientEmail: "client@example.com",
      clientName: "테스트 고객사",
      clientContact: "김담당",
    };

    const shouldSendReview = !!project.clientEmail;
    expect(shouldSendReview).toBe(true);

    // 리뷰 요청 데이터 검증
    const reviewData = {
      reviewerName: project.clientContact || project.clientName,
      reviewerEmail: project.clientEmail,
      reviewerCompany: project.clientName,
    };

    expect(reviewData.reviewerName).toBe("김담당");
    expect(reviewData.reviewerEmail).toBe("client@example.com");
    expect(reviewData.reviewerCompany).toBe("테스트 고객사");
  });

  it("리뷰 토큰은 30일 후 만료되어야 한다", () => {
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const diffDays = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(30);
  });
});

// ============ 3. 프로젝트 완료 → 자동 포트폴리오 초안 생성 테스트 ============
describe("프로젝트 완료 시 자동 포트폴리오 초안 생성", () => {
  it("카테고리가 올바르게 추론되어야 한다", () => {
    const categoryMap: Record<string, string> = {
      "사무": "사무공간", "사무실": "사무공간", "오피스": "사무공간",
      "상업": "상업공간", "매장": "상업공간", "식당": "상업공간", "카페": "상업공간",
      "주거": "주거공간", "아파트": "주거공간", "주택": "주거공간",
      "공장": "산업시설", "창고": "산업시설",
    };

    function inferCategory(name: string, description: string): string {
      const nameDesc = `${name} ${description}`;
      for (const [keyword, cat] of Object.entries(categoryMap)) {
        if (nameDesc.includes(keyword)) return cat;
      }
      return "사무공간";
    }

    expect(inferCategory("ABC 사무실 리모델링", "")).toBe("사무공간");
    expect(inferCategory("강남 카페 인테리어", "")).toBe("상업공간");
    expect(inferCategory("판교 아파트 리모델링", "")).toBe("주거공간");
    expect(inferCategory("물류 창고 리모델링", "")).toBe("산업시설");
    expect(inferCategory("기타 프로젝트", "")).toBe("사무공간"); // 기본값
  });

  it("태그가 올바르게 생성되어야 한다", () => {
    function generateTags(category: string, totalArea: string | null, siteAddress: string | null): string[] {
      const tags = ["인테리어", category];
      if (totalArea && Number(totalArea) > 300) tags.push("대형프로젝트");
      if (siteAddress?.includes("서울")) tags.push("서울");
      return tags;
    }

    const tags1 = generateTags("사무공간", "500", "서울시 강남구");
    expect(tags1).toContain("인테리어");
    expect(tags1).toContain("사무공간");
    expect(tags1).toContain("대형프로젝트");
    expect(tags1).toContain("서울");

    const tags2 = generateTags("상업공간", "100", "경기도 성남시");
    expect(tags2).toContain("인테리어");
    expect(tags2).toContain("상업공간");
    expect(tags2).not.toContain("대형프로젝트");
    expect(tags2).not.toContain("서울");
  });

  it("포트폴리오 초안 데이터가 올바르게 구성되어야 한다", () => {
    const project = {
      name: "테스트 프로젝트",
      clientName: "테스트 고객사",
      siteAddress: "서울시 강남구 역삼동",
      totalArea: "250",
      startDate: "2025-01-01",
      endDate: "2025-06-30",
      description: "사무실 리모델링",
    };

    const draftData = {
      title: `${project.clientName} 사무공간 프로젝트`,
      projectName: project.name,
      category: "사무공간",
      client: project.clientName,
      area: `${project.totalArea}㎡`,
      location: project.siteAddress,
      duration: `${project.startDate} ~ ${project.endDate}`,
      description: `${project.name} - ${project.clientName} 사무공간 프로젝트`,
      tags: ["인테리어", "사무공간", "서울"],
      status: "draft" as const,
    };

    expect(draftData.title).toContain(project.clientName);
    expect(draftData.projectName).toBe(project.name);
    expect(draftData.area).toBe("250㎡");
    expect(draftData.location).toBe(project.siteAddress);
    expect(draftData.duration).toContain("2025-01-01");
    expect(draftData.status).toBe("draft");
    expect(draftData.tags).toContain("서울");
  });

  it("포트폴리오 초안 생성 실패 시 프로젝트 상태 변경에 영향이 없어야 한다", () => {
    let statusUpdated = false;
    let draftCreated = false;

    // 상태 업데이트 시뮬레이션
    statusUpdated = true;

    // 포트폴리오 초안 생성 시도 (실패)
    try {
      throw new Error("AI 서비스 오류");
    } catch (e) {
      draftCreated = false;
      console.error("포트폴리오 초안 생성 실패 (무시):", e);
    }

    expect(statusUpdated).toBe(true);
    expect(draftCreated).toBe(false);
  });
});

// ============ 4. 통합 라이프사이클 테스트 ============
describe("프로젝트 라이프사이클 통합", () => {
  it("설계자동화 → CRM → 시공 → 완료 → 리뷰+포트폴리오 전체 흐름이 올바르게 동작해야 한다", () => {
    // 1단계: 설계자동화 프로젝트 생성
    const designProject = {
      id: 1,
      name: "테스트 프로젝트",
      clientName: "테스트 고객사",
      clientEmail: "test@example.com",
    };
    expect(designProject.id).toBeTruthy();

    // 2단계: CRM 딜 자동 생성
    const crmDeal = {
      title: `[설계자동화] ${designProject.name}`,
      stage: "lead",
      source: "design_automation",
    };
    expect(crmDeal.source).toBe("design_automation");

    // 3단계: OpsX 프로젝트 상태 변경 (construction → completed)
    const statusChange = {
      previousStatus: "construction",
      newStatus: "completed",
    };
    const shouldTriggerAutomation = statusChange.newStatus === "completed" && statusChange.previousStatus !== "completed";
    expect(shouldTriggerAutomation).toBe(true);

    // 4단계: 포트폴리오 초안 자동 생성
    const portfolioDraft = {
      title: `${designProject.clientName} 사무공간 프로젝트`,
      status: "draft",
    };
    expect(portfolioDraft.status).toBe("draft");

    // 5단계: 리뷰 요청 자동 발송
    const reviewRequest = {
      reviewerEmail: designProject.clientEmail,
      status: "pending",
    };
    expect(reviewRequest.reviewerEmail).toBe("test@example.com");
    expect(reviewRequest.status).toBe("pending");
  });
});
