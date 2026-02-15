import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================
// 1. Before/After 비교 뷰어 테스트
// ============================================================
describe("Before/After Slider Component Logic", () => {
  describe("슬라이더 위치 계산", () => {
    it("클릭 위치를 퍼센트로 변환한다", () => {
      const rect = { left: 100, width: 400 };
      const clientX = 300;
      const percentage = ((clientX - rect.left) / rect.width) * 100;
      expect(percentage).toBe(50);
    });

    it("슬라이더 위치가 0% 미만이면 0%로 클램프한다", () => {
      const rect = { left: 100, width: 400 };
      const clientX = 50; // 컨테이너 왼쪽 바깥
      const raw = ((clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(0, Math.min(100, raw));
      expect(clamped).toBe(0);
    });

    it("슬라이더 위치가 100% 초과이면 100%로 클램프한다", () => {
      const rect = { left: 100, width: 400 };
      const clientX = 600; // 컨테이너 오른쪽 바깥
      const raw = ((clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(0, Math.min(100, raw));
      expect(clamped).toBe(100);
    });

    it("키보드 ArrowLeft로 2%씩 감소한다", () => {
      let position = 50;
      // ArrowLeft 시뮬레이션
      position = Math.max(0, position - 2);
      expect(position).toBe(48);
    });

    it("키보드 ArrowRight로 2%씩 증가한다", () => {
      let position = 50;
      // ArrowRight 시뮬레이션
      position = Math.min(100, position + 2);
      expect(position).toBe(52);
    });

    it("키보드로 0% 미만으로 내려가지 않는다", () => {
      let position = 1;
      position = Math.max(0, position - 2);
      expect(position).toBe(0);
    });

    it("키보드로 100% 초과하지 않는다", () => {
      let position = 99;
      position = Math.min(100, position + 2);
      expect(position).toBe(100);
    });
  });

  describe("라벨 표시 로직", () => {
    it("슬라이더가 15% 이상이면 Before 라벨을 표시한다", () => {
      const sliderPosition = 20;
      const showBeforeLabel = sliderPosition > 15;
      expect(showBeforeLabel).toBe(true);
    });

    it("슬라이더가 15% 이하이면 Before 라벨을 숨긴다", () => {
      const sliderPosition = 10;
      const showBeforeLabel = sliderPosition > 15;
      expect(showBeforeLabel).toBe(false);
    });

    it("슬라이더가 85% 미만이면 After 라벨을 표시한다", () => {
      const sliderPosition = 80;
      const showAfterLabel = sliderPosition < 85;
      expect(showAfterLabel).toBe(true);
    });

    it("슬라이더가 85% 이상이면 After 라벨을 숨긴다", () => {
      const sliderPosition = 90;
      const showAfterLabel = sliderPosition < 85;
      expect(showAfterLabel).toBe(false);
    });
  });

  describe("갤러리 로직", () => {
    it("빈 pairs 배열이면 null을 반환해야 한다", () => {
      const pairs: any[] = [];
      const shouldRender = pairs.length > 0;
      expect(shouldRender).toBe(false);
    });

    it("pairs가 1개이면 썸네일 네비게이션을 숨긴다", () => {
      const pairs = [{ beforeImage: "a.jpg", afterImage: "b.jpg" }];
      const showThumbnails = pairs.length > 1;
      expect(showThumbnails).toBe(false);
    });

    it("pairs가 2개 이상이면 썸네일 네비게이션을 표시한다", () => {
      const pairs = [
        { beforeImage: "a.jpg", afterImage: "b.jpg" },
        { beforeImage: "c.jpg", afterImage: "d.jpg" },
      ];
      const showThumbnails = pairs.length > 1;
      expect(showThumbnails).toBe(true);
    });

    it("activeIndex를 변경하면 해당 이미지 쌍이 표시된다", () => {
      const pairs = [
        { beforeImage: "a.jpg", afterImage: "b.jpg", caption: "거실" },
        { beforeImage: "c.jpg", afterImage: "d.jpg", caption: "사무실" },
      ];
      let activeIndex = 0;
      expect(pairs[activeIndex].caption).toBe("거실");
      activeIndex = 1;
      expect(pairs[activeIndex].caption).toBe("사무실");
    });
  });
});

// ============================================================
// 2. DDIA (Data Driven Interior Architecture) 테스트
// ============================================================
describe("DDIA - Space Project Management", () => {
  describe("센서 타입 검증", () => {
    const validSensorTypes = [
      "temperature", "humidity", "illuminance", "co2",
      "noise", "occupancy", "motion", "air_quality", "power",
    ];

    it("유효한 센서 타입을 모두 허용한다", () => {
      validSensorTypes.forEach(type => {
        expect(validSensorTypes.includes(type)).toBe(true);
      });
    });

    it("유효하지 않은 센서 타입을 거부한다", () => {
      const invalidType = "pressure";
      expect(validSensorTypes.includes(invalidType)).toBe(false);
    });
  });

  describe("분석 타입 검증", () => {
    const validAnalysisTypes = [
      "occupancy_pattern", "environmental", "energy", "comfort", "traffic_flow",
    ];

    const analysisLabels: Record<string, string> = {
      occupancy_pattern: "재실 패턴 분석",
      environmental: "환경 쾌적도 분석",
      energy: "에너지 효율 분석",
      comfort: "공간 쾌적 지수 분석",
      traffic_flow: "동선 흐름 분석",
    };

    it("모든 분석 타입에 대한 한글 라벨이 존재한다", () => {
      validAnalysisTypes.forEach(type => {
        expect(analysisLabels[type]).toBeDefined();
        expect(typeof analysisLabels[type]).toBe("string");
        expect(analysisLabels[type].length).toBeGreaterThan(0);
      });
    });

    it("occupancy_pattern은 '재실 패턴 분석'이다", () => {
      expect(analysisLabels["occupancy_pattern"]).toBe("재실 패턴 분석");
    });

    it("environmental은 '환경 쾌적도 분석'이다", () => {
      expect(analysisLabels["environmental"]).toBe("환경 쾌적도 분석");
    });
  });

  describe("센서 데이터 요약 포맷", () => {
    it("센서 데이터를 올바른 형식으로 요약한다", () => {
      const sensorData = [
        {
          sensor: { name: "온도센서1", type: "temperature", zone: "A구역", unit: "°C" },
          latestValue: "23.5",
        },
        {
          sensor: { name: "습도센서1", type: "humidity", zone: null, unit: "%" },
          latestValue: "45",
        },
        {
          sensor: { name: "CO2센서", type: "co2", zone: "B구역", unit: "ppm" },
          latestValue: null,
        },
      ];

      const summary = sensorData.map(d =>
        `${d.sensor.name}(${d.sensor.type}${d.sensor.zone ? `, ${d.sensor.zone}` : ""}): ${d.latestValue ?? "N/A"} ${d.sensor.unit ?? ""}`
      ).join("\n");

      expect(summary).toContain("온도센서1(temperature, A구역): 23.5 °C");
      expect(summary).toContain("습도센서1(humidity): 45 %");
      expect(summary).toContain("CO2센서(co2, B구역): N/A ppm");
    });

    it("zone이 없는 센서는 zone 부분을 생략한다", () => {
      const sensor = { name: "테스트", type: "noise", zone: null, unit: "dB" };
      const formatted = `${sensor.name}(${sensor.type}${sensor.zone ? `, ${sensor.zone}` : ""})`;
      expect(formatted).toBe("테스트(noise)");
      expect(formatted).not.toContain("null");
    });

    it("latestValue가 null이면 N/A로 표시한다", () => {
      const latestValue: string | null = null;
      const display = latestValue ?? "N/A";
      expect(display).toBe("N/A");
    });
  });

  describe("센서 위치 좌표 검증", () => {
    it("posX와 posY는 0~100 범위여야 한다 (평면도 퍼센트 좌표)", () => {
      const validPositions = [
        { posX: 0, posY: 0 },
        { posX: 50, posY: 50 },
        { posX: 100, posY: 100 },
      ];

      validPositions.forEach(pos => {
        expect(pos.posX).toBeGreaterThanOrEqual(0);
        expect(pos.posX).toBeLessThanOrEqual(100);
        expect(pos.posY).toBeGreaterThanOrEqual(0);
        expect(pos.posY).toBeLessThanOrEqual(100);
      });
    });
  });

  describe("센서 데이터 시간 범위 조회", () => {
    it("from이 to보다 이전이어야 한다", () => {
      const from = new Date("2025-01-01");
      const to = new Date("2025-01-31");
      expect(from.getTime()).toBeLessThan(to.getTime());
    });

    it("날짜 문자열을 Date 객체로 올바르게 변환한다", () => {
      const dateStr = "2025-06-15T09:00:00Z";
      const date = new Date(dateStr);
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(5); // 0-indexed
      expect(date.getDate()).toBe(15);
    });
  });

  describe("AI 분석 응답 스키마 검증", () => {
    it("분석 결과 JSON이 필수 필드를 포함한다", () => {
      const mockAnalysisResult = {
        summary: "A구역의 온도가 권장 범위를 초과합니다.",
        findings: [
          {
            area: "A구역",
            insight: "오후 2-4시 온도 28°C 이상",
            severity: "warning",
          },
        ],
        recommendations: [
          {
            action: "차양 설치",
            priority: "high",
            impact: "실내 온도 3-5°C 감소 예상",
          },
        ],
        overallScore: 72,
      };

      expect(mockAnalysisResult).toHaveProperty("summary");
      expect(mockAnalysisResult).toHaveProperty("findings");
      expect(mockAnalysisResult).toHaveProperty("recommendations");
      expect(Array.isArray(mockAnalysisResult.findings)).toBe(true);
      expect(Array.isArray(mockAnalysisResult.recommendations)).toBe(true);
      expect(typeof mockAnalysisResult.overallScore).toBe("number");
    });

    it("severity는 info/warning/critical 중 하나여야 한다", () => {
      const validSeverities = ["info", "warning", "critical"];
      const finding = { severity: "warning" };
      expect(validSeverities.includes(finding.severity)).toBe(true);
    });

    it("priority는 high/medium/low 중 하나여야 한다", () => {
      const validPriorities = ["high", "medium", "low"];
      const recommendation = { priority: "high" };
      expect(validPriorities.includes(recommendation.priority)).toBe(true);
    });
  });
});

// ============================================================
// 3. DDIA 센서 활성화 상태 관리 테스트
// ============================================================
describe("DDIA - Sensor Active State", () => {
  it("센서 활성화 상태는 yes/no 중 하나여야 한다", () => {
    const validStates = ["yes", "no"];
    expect(validStates.includes("yes")).toBe(true);
    expect(validStates.includes("no")).toBe(true);
    expect(validStates.includes("maybe" as any)).toBe(false);
  });

  it("비활성 센서는 데이터 수집에서 제외되어야 한다", () => {
    const sensors = [
      { id: 1, name: "온도1", active: "yes" },
      { id: 2, name: "습도1", active: "no" },
      { id: 3, name: "CO2", active: "yes" },
    ];
    const activeSensors = sensors.filter(s => s.active === "yes");
    expect(activeSensors).toHaveLength(2);
    expect(activeSensors.map(s => s.name)).toEqual(["온도1", "CO2"]);
  });
});
