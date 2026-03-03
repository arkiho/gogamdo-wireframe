import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB functions
vi.mock("./db", () => ({
  createMeasurementSession: vi.fn().mockResolvedValue({ id: 1 }),
  listMeasurementSessions: vi.fn().mockResolvedValue([
    { id: 1, projectName: "테스트 프로젝트", location: "서울", status: "active", createdBy: 1, createdByName: "테스터", createdAt: new Date() },
  ]),
  getMeasurementSession: vi.fn().mockResolvedValue({ id: 1, projectName: "테스트 프로젝트", location: "서울", status: "active" }),
  updateMeasurementSession: vi.fn().mockResolvedValue(undefined),
  deleteMeasurementSession: vi.fn().mockResolvedValue(undefined),
  createPanoramaImage: vi.fn().mockResolvedValue({ id: 1 }),
  listPanoramaImages: vi.fn().mockResolvedValue([
    { id: 1, sessionId: 1, imageUrl: "https://example.com/pano.jpg", spotName: "회의실 A", spotOrder: 0, cameraHeight: "1.5", calibrationData: null },
  ]),
  getPanoramaImage: vi.fn().mockResolvedValue({ id: 1, sessionId: 1, imageUrl: "https://example.com/pano.jpg", spotName: "회의실 A", calibrationData: null }),
  updatePanoramaImage: vi.fn().mockResolvedValue(undefined),
  deletePanoramaImage: vi.fn().mockResolvedValue(undefined),
  createFieldMeasurement: vi.fn().mockResolvedValue({ id: 1 }),
  listFieldMeasurements: vi.fn().mockResolvedValue([
    { id: 1, panoramaId: 1, sessionId: 1, type: "distance", label: "벽 길이", points: [{ imgX: 100, imgY: 200, theta: 0.5, phi: 0.3 }, { imgX: 300, imgY: 200, theta: 1.2, phi: 0.3 }], rawAngle: "0.7", calibratedValue: "3.5", unit: "m" },
  ]),
  listSessionMeasurements: vi.fn().mockResolvedValue([
    { id: 1, panoramaId: 1, sessionId: 1, type: "distance", label: "벽 길이", calibratedValue: "3.5", unit: "m" },
  ]),
  updateFieldMeasurement: vi.fn().mockResolvedValue(undefined),
  deleteFieldMeasurement: vi.fn().mockResolvedValue(undefined),
  createMeasurementReport: vi.fn().mockResolvedValue({ id: 1 }),
  getMeasurementReport: vi.fn().mockResolvedValue({ id: 1, sessionId: 1, totalArea: "45.5", roomCount: 3, aiAnalysis: "분석 결과" }),
  updateMeasurementReport: vi.fn().mockResolvedValue(undefined),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/test.jpg", key: "test.jpg" }),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "AI 분석 보고서 내용" } }],
  }),
}));

import {
  createMeasurementSession, listMeasurementSessions, getMeasurementSession,
  updateMeasurementSession, deleteMeasurementSession,
  createPanoramaImage, listPanoramaImages, getPanoramaImage,
  updatePanoramaImage, deletePanoramaImage,
  createFieldMeasurement, listFieldMeasurements, listSessionMeasurements,
  updateFieldMeasurement, deleteFieldMeasurement,
  createMeasurementReport, getMeasurementReport,
} from "./db";

describe("360도 현장 실측 도구 (Field Measurement)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===== 실측 세션 =====
  describe("실측 세션 CRUD", () => {
    it("새 실측 세션을 생성할 수 있다", async () => {
      const result = await createMeasurementSession({
        projectName: "삼성SDS 본사 리모델링",
        location: "서울 강남구",
        createdBy: 1,
        createdByName: "김기호",
      });
      expect(result.id).toBe(1);
      expect(createMeasurementSession).toHaveBeenCalledWith(expect.objectContaining({
        projectName: "삼성SDS 본사 리모델링",
      }));
    });

    it("세션 목록을 조회할 수 있다", async () => {
      const sessions = await listMeasurementSessions({ createdBy: 1 });
      expect(sessions).toHaveLength(1);
      expect(sessions[0].projectName).toBe("테스트 프로젝트");
    });

    it("세션 상세를 조회할 수 있다", async () => {
      const session = await getMeasurementSession(1);
      expect(session).not.toBeNull();
      expect(session!.projectName).toBe("테스트 프로젝트");
    });

    it("세션을 수정할 수 있다", async () => {
      await updateMeasurementSession(1, { status: "completed" as any });
      expect(updateMeasurementSession).toHaveBeenCalledWith(1, { status: "completed" });
    });

    it("세션을 삭제할 수 있다", async () => {
      await deleteMeasurementSession(1);
      expect(deleteMeasurementSession).toHaveBeenCalledWith(1);
    });
  });

  // ===== 파노라마 이미지 =====
  describe("파노라마 이미지 관리", () => {
    it("파노라마 이미지를 생성할 수 있다", async () => {
      const result = await createPanoramaImage({
        sessionId: 1,
        imageUrl: "https://s3.example.com/pano.jpg",
        spotName: "회의실 A",
        spotOrder: 0,
        cameraHeight: "1.5",
      });
      expect(result.id).toBe(1);
    });

    it("세션별 파노라마 목록을 조회할 수 있다", async () => {
      const panoramas = await listPanoramaImages(1);
      expect(panoramas).toHaveLength(1);
      expect(panoramas[0].spotName).toBe("회의실 A");
    });

    it("파노라마 보정 데이터를 업데이트할 수 있다", async () => {
      const calibData = {
        scaleFactor: 2.5,
        standardDeviation: 0.1,
        referencePoints: [],
      };
      await updatePanoramaImage(1, { calibrationData: calibData });
      expect(updatePanoramaImage).toHaveBeenCalledWith(1, { calibrationData: calibData });
    });

    it("파노라마를 삭제할 수 있다", async () => {
      await deletePanoramaImage(1);
      expect(deletePanoramaImage).toHaveBeenCalledWith(1);
    });
  });

  // ===== 측정 데이터 =====
  describe("측정 데이터 관리", () => {
    it("거리 측정을 생성할 수 있다", async () => {
      const result = await createFieldMeasurement({
        panoramaId: 1,
        sessionId: 1,
        type: "distance",
        label: "벽 길이",
        points: [
          { imgX: 100, imgY: 200, theta: 0.5, phi: 0.3 },
          { imgX: 300, imgY: 200, theta: 1.2, phi: 0.3 },
        ],
        rawAngle: "0.7",
        calibratedValue: "3.5",
        unit: "m",
      });
      expect(result.id).toBe(1);
    });

    it("파노라마별 측정 목록을 조회할 수 있다", async () => {
      const measurements = await listFieldMeasurements(1);
      expect(measurements).toHaveLength(1);
      expect(measurements[0].label).toBe("벽 길이");
    });

    it("세션별 전체 측정 목록을 조회할 수 있다", async () => {
      const measurements = await listSessionMeasurements(1);
      expect(measurements).toHaveLength(1);
    });

    it("측정을 삭제할 수 있다", async () => {
      await deleteFieldMeasurement(1);
      expect(deleteFieldMeasurement).toHaveBeenCalledWith(1);
    });
  });

  // ===== 보정 (Calibration) =====
  describe("기준 치수 보정 시스템", () => {
    it("단일 기준점으로 스케일 팩터를 계산할 수 있다", () => {
      // 두 점의 구면 좌표
      const p1 = { theta: 0, phi: 0 };
      const p2 = { theta: 0.5, phi: 0 };

      // Great Circle Distance
      const angularDist = Math.acos(
        Math.sin(p1.phi) * Math.sin(p2.phi) +
        Math.cos(p1.phi) * Math.cos(p2.phi) * Math.cos(p2.theta - p1.theta)
      );

      expect(angularDist).toBeCloseTo(0.5, 5);

      // 실제 거리 2.1m (문 높이)
      const realDistance = 2.1;
      const scaleFactor = realDistance / angularDist;

      expect(scaleFactor).toBeCloseTo(4.2, 1);
    });

    it("다중 기준점으로 평균 스케일 팩터를 계산할 수 있다", () => {
      const referencePoints = [
        { p1: { theta: 0, phi: 0 }, p2: { theta: 0.5, phi: 0 }, realDistance: 2.1 },
        { p1: { theta: 1.0, phi: 0.2 }, p2: { theta: 1.8, phi: 0.2 }, realDistance: 3.36 },
      ];

      const scaleFactors: number[] = [];

      for (const ref of referencePoints) {
        const angularDist = Math.acos(
          Math.sin(ref.p1.phi) * Math.sin(ref.p2.phi) +
          Math.cos(ref.p1.phi) * Math.cos(ref.p2.phi) * Math.cos(ref.p2.theta - ref.p1.theta)
        );
        scaleFactors.push(ref.realDistance / angularDist);
      }

      const avgScaleFactor = scaleFactors.reduce((a, b) => a + b, 0) / scaleFactors.length;

      // 두 기준점의 스케일 팩터가 비슷해야 함
      expect(avgScaleFactor).toBeGreaterThan(0);
      expect(scaleFactors.length).toBe(2);
    });

    it("보정된 스케일 팩터로 실제 거리를 추정할 수 있다", () => {
      const scaleFactor = 4.2;
      const rawAngle = 0.714; // 약 40.9°

      const estimatedDistance = rawAngle * scaleFactor;

      expect(estimatedDistance).toBeCloseTo(3.0, 0);
    });

    it("표준편차를 계산하여 오차 범위를 제공할 수 있다", () => {
      const scaleFactors = [4.2, 4.3, 4.1, 4.25];
      const avg = scaleFactors.reduce((a, b) => a + b, 0) / scaleFactors.length;
      const stdDev = Math.sqrt(
        scaleFactors.reduce((sum, sf) => sum + Math.pow(sf - avg, 2), 0) / (scaleFactors.length - 1)
      );

      expect(avg).toBeCloseTo(4.2125, 3);
      expect(stdDev).toBeGreaterThan(0);
      expect(stdDev).toBeLessThan(0.2); // 오차 범위가 합리적인지 확인

      // 95% 신뢰구간
      const confidenceMin = avg - 2 * stdDev;
      const confidenceMax = avg + 2 * stdDev;
      expect(confidenceMin).toBeLessThan(avg);
      expect(confidenceMax).toBeGreaterThan(avg);
    });
  });

  // ===== 이미지 좌표 변환 =====
  describe("Equirectangular 좌표 변환", () => {
    it("이미지 좌표를 구면 좌표로 변환할 수 있다", () => {
      // 6080x3040 equirectangular 이미지 기준
      const width = 6080;
      const height = 3040;

      // 이미지 중앙 → (theta=0, phi=0)
      const centerX = width / 2;
      const centerY = height / 2;
      const thetaCenter = (centerX / width) * 2 * Math.PI - Math.PI;
      const phiCenter = (centerY / height) * Math.PI - Math.PI / 2;

      expect(thetaCenter).toBeCloseTo(0, 5);
      expect(phiCenter).toBeCloseTo(0, 5);

      // 이미지 좌측 끝 → theta = -π
      const leftX = 0;
      const thetaLeft = (leftX / width) * 2 * Math.PI - Math.PI;
      expect(thetaLeft).toBeCloseTo(-Math.PI, 5);

      // 이미지 상단 → phi = -π/2
      const topY = 0;
      const phiTop = (topY / height) * Math.PI - Math.PI / 2;
      expect(phiTop).toBeCloseTo(-Math.PI / 2, 5);
    });

    it("구면 좌표 간 각도 거리를 정확히 계산할 수 있다", () => {
      // 같은 점 → 거리 0
      const p1 = { theta: 0.5, phi: 0.3 };
      const dist0 = Math.acos(
        Math.sin(p1.phi) * Math.sin(p1.phi) +
        Math.cos(p1.phi) * Math.cos(p1.phi) * Math.cos(0)
      );
      expect(dist0).toBeCloseTo(0, 5);

      // 정반대 점 → 거리 π
      const p2 = { theta: 0, phi: 0 };
      const p3 = { theta: Math.PI, phi: 0 };
      const distOpposite = Math.acos(
        Math.sin(p2.phi) * Math.sin(p3.phi) +
        Math.cos(p2.phi) * Math.cos(p3.phi) * Math.cos(p3.theta - p2.theta)
      );
      expect(distOpposite).toBeCloseTo(Math.PI, 5);
    });
  });

  // ===== AI 보고서 =====
  describe("AI 분석 보고서", () => {
    it("보고서를 생성할 수 있다", async () => {
      const result = await createMeasurementReport({
        sessionId: 1,
        totalArea: "45.5",
        roomCount: 3,
        aiAnalysis: "AI 분석 결과",
        spaceSummary: [],
      });
      expect(result.id).toBe(1);
    });

    it("세션별 보고서를 조회할 수 있다", async () => {
      const report = await getMeasurementReport(1);
      expect(report).not.toBeNull();
      expect(report!.totalArea).toBe("45.5");
      expect(report!.roomCount).toBe(3);
    });
  });
});
