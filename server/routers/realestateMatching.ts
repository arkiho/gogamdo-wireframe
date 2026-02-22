import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import {
  createRealestateSearch, getRealestateSearchByProject, updateRealestateSearch,
  createRealestateMatch, getRealestateMatchesByProject, updateRealestateMatch,
  createProgramDiagram, getDiagramsByProject,
} from "../db";

export const realestateMatchingRouter = router({
  // ============ Phase 4: 이사/레노베이션 분기 + 면적 계산 ============

  analyzeSpaceNeeds: protectedProcedure
    .input(z.object({
      clientProjectId: z.number(),
      projectType: z.enum(["relocation", "renovation"]),
      employeeCount: z.number(),
      departmentBreakdown: z.string(), // JSON: { "부서명": 인원수 }
      surveyAnalysisId: z.number().optional(),
      currentArea: z.number().optional(), // 현재 면적 (평)
      insightData: z.string().optional(), // OpsX Insight 데이터 JSON
    }))
    .mutation(async ({ ctx, input }) => {
      const llmResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `당신은 오피스 공간 계획 전문가입니다. 직원 수, 부서 구성, 설문 분석 결과, 센서 데이터를 기반으로 최적 면적을 계산하세요.
JSON으로 반환: {
  "recommendedArea": 평수(숫자),
  "areaBreakdown": { "개인업무공간": 평수, "회의실": 평수, "휴게공간": 평수, "지원공간": 평수, "통로/공용": 평수 },
  "meetingRooms": { "대형(20인+)": 개수, "중형(8-20인)": 개수, "소형(4-8인)": 개수, "포커스부스": 개수 },
  "specialZones": ["필요한 특수 공간 목록"],
  "rationale": "산출 근거 설명"
}`,
          },
          {
            role: "user",
            content: `프로젝트 유형: ${input.projectType}
직원 수: ${input.employeeCount}명
부서 구성: ${input.departmentBreakdown}
현재 면적: ${input.currentArea ? input.currentArea + "평" : "미입력"}
${input.insightData ? "OpsX Insight 데이터: " + input.insightData : ""}`,
          },
        ],
      });

      const analysis = JSON.parse(llmResponse.choices[0].message.content || "{}");
      return { analysis };
    }),

  // ============ Phase 5: 부동산 매물 검색 조건 설정 ============

  setSearchCriteria: protectedProcedure
    .input(z.object({
      clientProjectId: z.number(),
      minArea: z.number().optional(),
      maxArea: z.number().optional(),
      preferredDistricts: z.string().optional(), // JSON array
      maxRent: z.number().optional(),
      maxDeposit: z.number().optional(),
      buildingGrade: z.string().optional(),
      nearSubway: z.number().optional(),
      parkingRequired: z.number().optional(),
      moveInDate: z.string().optional(),
      additionalRequirements: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getRealestateSearchByProject(input.clientProjectId);
      if (existing) {
        await updateRealestateSearch(existing.id, input);
        return { id: existing.id, updated: true };
      }
      const result = await createRealestateSearch(input);
      if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return { id: result.id, updated: false };
    }),

  getSearchCriteria: protectedProcedure
    .input(z.object({ clientProjectId: z.number() }))
    .query(async ({ input }) => {
      return getRealestateSearchByProject(input.clientProjectId);
    }),

  // ============ 부동산 매물 매칭 (OpsX DB 연동) ============

  searchMatches: protectedProcedure
    .input(z.object({ clientProjectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const criteria = await getRealestateSearchByProject(input.clientProjectId);
      if (!criteria) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "검색 조건을 먼저 설정하세요." });
      }

      // OpsX 부동산 DB에서 매물 검색 (향후 실제 API 연동)
      // 현재는 AI가 검색 조건 기반 매칭 시뮬레이션
      const llmResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `당신은 상업용 부동산 전문가입니다. 검색 조건에 맞는 가상의 매물 3~5개를 JSON 배열로 생성하세요.
각 매물: {
  "buildingName": "건물명",
  "address": "주소",
  "floor": "층",
  "area": 평수,
  "rentPerPyeong": 만원,
  "deposit": 만원,
  "managementFee": 만원,
  "buildingGrade": "A/B/C",
  "yearBuilt": 년도,
  "nearestStation": "역명 (도보 N분)",
  "parking": "대수",
  "matchScore": 0-100,
  "pros": ["장점"],
  "cons": ["단점"]
}`,
          },
          {
            role: "user",
            content: `검색 조건: ${JSON.stringify(criteria)}`,
          },
        ],
      });

      const matches = JSON.parse(llmResponse.choices[0].message.content || "[]");
      
      // 매칭 결과 저장
      const savedMatches = [];
      for (const match of matches) {
        const saved = await createRealestateMatch({
          clientProjectId: input.clientProjectId,
          searchCriteriaId: criteria.id,
          buildingName: match.buildingName,
          address: match.address,
          floor: match.floor,
          area: match.area,
          rentPerPyeong: match.rentPerPyeong,
          deposit: match.deposit,
          managementFee: match.managementFee,
          buildingGrade: match.buildingGrade,
          yearBuilt: match.yearBuilt,
          nearestStation: match.nearestStation,
          parking: match.parking,
          matchScore: match.matchScore,
          pros: JSON.stringify(match.pros),
          cons: JSON.stringify(match.cons),
          status: "new",
        });
        if (saved) savedMatches.push(saved);
      }

      return { count: savedMatches.length, matches };
    }),

  getMatches: protectedProcedure
    .input(z.object({ clientProjectId: z.number() }))
    .query(async ({ input }) => {
      return getRealestateMatchesByProject(input.clientProjectId);
    }),

  updateMatchStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["new", "shortlisted", "visited", "rejected", "selected"]),
      clientNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateRealestateMatch(id, data);
      return { success: true };
    }),

  // ============ 프로그램 다이어그램 생성 ============

  generateDiagram: protectedProcedure
    .input(z.object({
      clientProjectId: z.number(),
      matchId: z.number().optional(), // 부동산 매물 ID (이사인 경우)
      floorPlanId: z.number().optional(), // 기존 도면 ID (레노베이션인 경우)
      spaceNeeds: z.string(), // 면적 분석 결과 JSON
      surveyData: z.string().optional(), // 설문 데이터 JSON
    }))
    .mutation(async ({ ctx, input }) => {
      const llmResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `당신은 오피스 공간 프로그래밍 전문가입니다. 공간 요구사항을 기반으로 프로그램 다이어그램(공간 배치 계획)을 JSON으로 생성하세요.
{
  "zones": [
    { "name": "존 이름", "type": "work|meeting|support|amenity|circulation", "area": 평수, "capacity": 인원, "adjacencyRequirements": ["인접해야 할 존"], "description": "설명" }
  ],
  "adjacencyMatrix": { "존A-존B": "필수|권장|무관|분리" },
  "circulationPaths": ["주요 동선 설명"],
  "designNotes": "전체 배치 방향 설명"
}`,
          },
          {
            role: "user",
            content: `공간 요구사항: ${input.spaceNeeds}\n${input.surveyData ? "설문 데이터: " + input.surveyData : ""}`,
          },
        ],
      });

      const diagramData = llmResponse.choices[0].message.content || "{}";
      
      const result = await createProgramDiagram({
        clientProjectId: input.clientProjectId,
        matchId: input.matchId,
        floorPlanId: input.floorPlanId,
        diagramType: input.matchId ? "relocation" : "renovation",
        zonesJson: diagramData,
        totalArea: JSON.parse(input.spaceNeeds).recommendedArea || 0,
      });

      if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return { diagramId: result.id, diagram: JSON.parse(diagramData) };
    }),

  getDiagrams: protectedProcedure
    .input(z.object({ clientProjectId: z.number() }))
    .query(async ({ input }) => {
      return getDiagramsByProject(input.clientProjectId);
    }),
});
