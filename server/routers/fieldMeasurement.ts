import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { storagePut } from "../storage";
import { invokeLLM } from "../_core/llm";
import {
  createMeasurementSession, listMeasurementSessions, getMeasurementSession,
  updateMeasurementSession, deleteMeasurementSession,
  createPanoramaImage, listPanoramaImages, getPanoramaImage,
  updatePanoramaImage, deletePanoramaImage,
  createFieldMeasurement, listFieldMeasurements, listSessionMeasurements,
  updateFieldMeasurement, deleteFieldMeasurement,
  createMeasurementReport, getMeasurementReport, updateMeasurementReport,
} from "../db";

export const fieldMeasurementRouter = router({
  // ===== 실측 세션 =====
  createSession: protectedProcedure
    .input(z.object({
      projectName: z.string().min(1),
      location: z.string().optional(),
      description: z.string().optional(),
      opsProjectId: z.number().optional(),
      clientProjectId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return createMeasurementSession({
        ...input,
        createdBy: ctx.user.id,
        createdByName: ctx.user.name || "Unknown",
      });
    }),

  listSessions: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      opsProjectId: z.number().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      return listMeasurementSessions({
        createdBy: ctx.user.role === "admin" || ctx.user.role === "master" ? undefined : ctx.user.id,
        status: input?.status,
        opsProjectId: input?.opsProjectId,
      });
    }),

  getSession: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const session = await getMeasurementSession(input.id);
      if (!session) throw new Error("세션을 찾을 수 없습니다.");
      return session;
    }),

  updateSession: protectedProcedure
    .input(z.object({
      id: z.number(),
      projectName: z.string().optional(),
      location: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["active", "completed", "archived"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateMeasurementSession(id, data);
      return { success: true };
    }),

  deleteSession: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteMeasurementSession(input.id);
      return { success: true };
    }),

  // ===== 파노라마 이미지 =====
  uploadPanorama: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      spotName: z.string().min(1),
      spotOrder: z.number().optional(),
      cameraHeight: z.string().optional(),
      imageBase64: z.string(),
      fileName: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Base64 → Buffer → S3
      const buffer = Buffer.from(input.imageBase64, "base64");
      const ext = input.fileName.split(".").pop() || "jpg";
      const key = `field-measurement/${input.sessionId}/panorama-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { url } = await storagePut(key, buffer, `image/${ext === "jpg" ? "jpeg" : ext}`);

      return createPanoramaImage({
        sessionId: input.sessionId,
        imageUrl: url,
        spotName: input.spotName,
        spotOrder: input.spotOrder || 0,
        cameraHeight: input.cameraHeight,
      });
    }),

  listPanoramas: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      return listPanoramaImages(input.sessionId);
    }),

  getPanorama: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const pano = await getPanoramaImage(input.id);
      if (!pano) throw new Error("파노라마 이미지를 찾을 수 없습니다.");
      return pano;
    }),

  updatePanorama: protectedProcedure
    .input(z.object({
      id: z.number(),
      spotName: z.string().optional(),
      spotOrder: z.number().optional(),
      cameraHeight: z.string().optional(),
      calibrationData: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updatePanoramaImage(id, data);
      return { success: true };
    }),

  deletePanorama: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deletePanoramaImage(input.id);
      return { success: true };
    }),

  // ===== 측정 데이터 =====
  createMeasurement: protectedProcedure
    .input(z.object({
      panoramaId: z.number(),
      sessionId: z.number(),
      type: z.enum(["distance", "height", "area", "reference"]),
      label: z.string().optional(),
      points: z.array(z.object({
        imgX: z.number(),
        imgY: z.number(),
        theta: z.number(),
        phi: z.number(),
      })),
      rawAngle: z.string().optional(),
      calibratedValue: z.string().optional(),
      unit: z.string().optional(),
      isReference: z.boolean().optional(),
      referenceRealValue: z.string().optional(),
      note: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return createFieldMeasurement({
        ...input,
        points: input.points,
      });
    }),

  listMeasurements: protectedProcedure
    .input(z.object({ panoramaId: z.number() }))
    .query(async ({ input }) => {
      return listFieldMeasurements(input.panoramaId);
    }),

  listSessionMeasurements: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      return listSessionMeasurements(input.sessionId);
    }),

  updateMeasurement: protectedProcedure
    .input(z.object({
      id: z.number(),
      label: z.string().optional(),
      calibratedValue: z.string().optional(),
      note: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateFieldMeasurement(id, data);
      return { success: true };
    }),

  deleteMeasurement: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteFieldMeasurement(input.id);
      return { success: true };
    }),

  // ===== 보정 (Calibration) =====
  calibrate: protectedProcedure
    .input(z.object({
      panoramaId: z.number(),
      referencePoints: z.array(z.object({
        point1: z.object({ imgX: z.number(), imgY: z.number(), theta: z.number(), phi: z.number() }),
        point2: z.object({ imgX: z.number(), imgY: z.number(), theta: z.number(), phi: z.number() }),
        realDistance: z.number(), // 실제 거리 (m)
      })),
    }))
    .mutation(async ({ input }) => {
      // 다중 기준점 기반 스케일 팩터 계산 (최소자승법)
      const scaleFactors: number[] = [];

      for (const ref of input.referencePoints) {
        const { point1, point2, realDistance } = ref;
        // Great Circle Distance (각도 거리)
        const angularDist = Math.acos(
          Math.sin(point1.phi) * Math.sin(point2.phi) +
          Math.cos(point1.phi) * Math.cos(point2.phi) * Math.cos(point2.theta - point1.theta)
        );
        if (angularDist > 0) {
          scaleFactors.push(realDistance / angularDist);
        }
      }

      // 평균 스케일 팩터
      const avgScaleFactor = scaleFactors.length > 0
        ? scaleFactors.reduce((a, b) => a + b, 0) / scaleFactors.length
        : 1;

      // 표준편차 (오차 범위)
      const stdDev = scaleFactors.length > 1
        ? Math.sqrt(scaleFactors.reduce((sum, sf) => sum + Math.pow(sf - avgScaleFactor, 2), 0) / (scaleFactors.length - 1))
        : 0;

      const calibrationData = {
        referencePoints: input.referencePoints,
        scaleFactor: avgScaleFactor,
        standardDeviation: stdDev,
        confidenceRange: {
          min: avgScaleFactor - 2 * stdDev,
          max: avgScaleFactor + 2 * stdDev,
        },
        calibratedAt: new Date().toISOString(),
      };

      await updatePanoramaImage(input.panoramaId, { calibrationData });

      return calibrationData;
    }),

  // ===== AI 분석 보고서 =====
  generateReport: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input }) => {
      const session = await getMeasurementSession(input.sessionId);
      if (!session) throw new Error("세션을 찾을 수 없습니다.");

      const measurements = await listSessionMeasurements(input.sessionId);
      const panoramas = await listPanoramaImages(input.sessionId);

      // 공간별 치수 요약 생성
      const spaceSummary = panoramas.map(pano => {
        const panoMeasurements = measurements.filter(m => m.panoramaId === pano.id);
        const distances = panoMeasurements.filter(m => m.type === "distance");
        const heights = panoMeasurements.filter(m => m.type === "height");
        const areas = panoMeasurements.filter(m => m.type === "area");

        return {
          name: pano.spotName,
          measurements: panoMeasurements.length,
          distances: distances.map(d => ({
            label: d.label,
            value: d.calibratedValue,
            unit: d.unit,
          })),
          heights: heights.map(h => ({
            label: h.label,
            value: h.calibratedValue,
            unit: h.unit,
          })),
          areas: areas.map(a => ({
            label: a.label,
            value: a.calibratedValue,
            unit: a.unit,
          })),
        };
      });

      // AI 분석
      const llmResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `당신은 사무실 인테리어 전문 공간 분석가입니다. 현장 실측 데이터를 분석하여 종합 보고서를 작성합니다.
보고서에는 다음을 포함하세요:
1. 공간 구조 요약 (각 공간별 치수, 면적)
2. 공간 활용 효율성 분석
3. 동선 및 레이아웃 제안
4. 인테리어 설계 시 고려사항
5. 추정 총 면적 및 공간 비율
한국어로 작성하고, 전문적이면서도 이해하기 쉽게 작성하세요.`,
          },
          {
            role: "user",
            content: `프로젝트: ${session.projectName}
위치: ${session.location || "미지정"}
설명: ${session.description || "없음"}

촬영 지점 수: ${panoramas.length}
총 측정 수: ${measurements.length}

공간별 측정 데이터:
${JSON.stringify(spaceSummary, null, 2)}`,
          },
        ],
      });

      const aiAnalysis = llmResponse.choices[0]?.message?.content || "분석 결과를 생성할 수 없습니다.";

      // 총 면적 계산 (area 타입 측정값 합산)
      const totalArea = measurements
        .filter(m => m.type === "area" && m.calibratedValue)
        .reduce((sum, m) => sum + parseFloat(String(m.calibratedValue || "0")), 0);

      const report = await createMeasurementReport({
        sessionId: input.sessionId,
        totalArea: totalArea > 0 ? String(totalArea) : null,
        roomCount: panoramas.length,
        spaceSummary,
        aiAnalysis,
      });

      return { id: report.id, aiAnalysis, totalArea, spaceSummary };
    }),

  getReport: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      return getMeasurementReport(input.sessionId);
    }),
});
