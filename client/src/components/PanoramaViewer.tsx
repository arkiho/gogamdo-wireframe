import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

interface MeasurePoint {
  imgX: number;
  imgY: number;
  theta: number;
  phi: number;
}

interface Measurement {
  id?: number;
  type: "distance" | "height" | "area" | "reference";
  label?: string;
  points: MeasurePoint[];
  rawAngle?: number;
  calibratedValue?: number;
  unit?: string;
  isReference?: boolean;
  referenceRealValue?: number;
}

interface PanoramaViewerProps {
  imageUrl: string;
  imageWidth?: number;
  imageHeight?: number;
  measurements?: Measurement[];
  calibrationData?: {
    scaleFactor: number;
    standardDeviation: number;
    confidenceRange: { min: number; max: number };
  } | null;
  mode: "view" | "measure" | "calibrate";
  measureType?: "distance" | "height" | "area" | "reference";
  onMeasurementComplete?: (measurement: {
    points: MeasurePoint[];
    rawAngle: number;
    calibratedValue: number;
    unit: string;
  }) => void;
  onCalibrationPoint?: (point1: MeasurePoint, point2: MeasurePoint, angularDist: number) => void;
  className?: string;
}

export default function PanoramaViewer({
  imageUrl,
  measurements = [],
  calibrationData,
  mode,
  measureType = "distance",
  onMeasurementComplete,
  onCalibrationPoint,
  className = "",
}: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const isUserInteracting = useRef(false);
  const onPointerDownMouseX = useRef(0);
  const onPointerDownMouseY = useRef(0);
  const lon = useRef(0);
  const lat = useRef(0);
  const onPointerDownLon = useRef(0);
  const onPointerDownLat = useRef(0);
  const phi = useRef(0);
  const theta = useRef(0);
  const animFrameRef = useRef<number>(0);

  const [currentPoints, setCurrentPoints] = useState<MeasurePoint[]>([]);
  const [hoverInfo, setHoverInfo] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // 이미지 좌표 → 구면 좌표 변환
  const imgToSpherical = useCallback((imgX: number, imgY: number, width: number, height: number) => {
    const thetaVal = (imgX / width) * 2 * Math.PI - Math.PI;
    const phiVal = (imgY / height) * Math.PI - Math.PI / 2;
    return { theta: thetaVal, phi: phiVal };
  }, []);

  // 두 점 사이 각도 거리 (Great Circle Distance)
  const angularDistance = useCallback((p1: MeasurePoint, p2: MeasurePoint) => {
    const sinPhi1 = Math.sin(p1.phi);
    const sinPhi2 = Math.sin(p2.phi);
    const cosPhi1 = Math.cos(p1.phi);
    const cosPhi2 = Math.cos(p2.phi);
    const cosDTheta = Math.cos(p2.theta - p1.theta);
    const val = sinPhi1 * sinPhi2 + cosPhi1 * cosPhi2 * cosDTheta;
    return Math.acos(Math.max(-1, Math.min(1, val)));
  }, []);

  // 보정된 실제 거리 계산
  const calibratedDistance = useCallback((rawAngle: number) => {
    if (!calibrationData || calibrationData.scaleFactor <= 0) return null;
    return rawAngle * calibrationData.scaleFactor;
  }, [calibrationData]);

  // Three.js 초기화
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Sphere geometry (inside-out)
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    // Texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      imageUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        setIsLoading(false);
      },
      undefined,
      () => {
        setIsLoading(false);
      }
    );

    // Animation loop
    function animate() {
      animFrameRef.current = requestAnimationFrame(animate);
      const latVal = Math.max(-85, Math.min(85, lat.current));
      phi.current = THREE.MathUtils.degToRad(90 - latVal);
      theta.current = THREE.MathUtils.degToRad(lon.current);

      const x = 500 * Math.sin(phi.current) * Math.cos(theta.current);
      const y = 500 * Math.cos(phi.current);
      const z = 500 * Math.sin(phi.current) * Math.sin(theta.current);

      camera.lookAt(x, y, z);
      renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [imageUrl]);

  // Mouse/Touch interaction
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onPointerDown = (e: PointerEvent) => {
      isUserInteracting.current = true;
      onPointerDownMouseX.current = e.clientX;
      onPointerDownMouseY.current = e.clientY;
      onPointerDownLon.current = lon.current;
      onPointerDownLat.current = lat.current;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isUserInteracting.current) return;
      lon.current = (onPointerDownMouseX.current - e.clientX) * 0.1 + onPointerDownLon.current;
      lat.current = (e.clientY - onPointerDownMouseY.current) * 0.1 + onPointerDownLat.current;
    };

    const onPointerUp = () => {
      isUserInteracting.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const camera = cameraRef.current;
      if (!camera) return;
      camera.fov = Math.max(30, Math.min(100, camera.fov + e.deltaY * 0.05));
      camera.updateProjectionMatrix();
    };

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("wheel", onWheel);
    };
  }, []);

  // 측정 모드 클릭 핸들러
  const handleMeasureClick = useCallback((e: React.MouseEvent) => {
    if (mode === "view") return;
    if (isUserInteracting.current) return;

    const container = containerRef.current;
    const camera = cameraRef.current;
    if (!container || !camera) return;

    const rect = container.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycaster로 구면 위 교차점 계산
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

    const scene = sceneRef.current;
    if (!scene) return;

    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length === 0) return;

    const point = intersects[0].point;

    // 3D 좌표 → 구면 좌표
    const r = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z);
    const phiVal = Math.acos(point.y / r) - Math.PI / 2;
    const thetaVal = Math.atan2(point.z, point.x);

    // 구면 좌표 → 이미지 좌표 (equirectangular)
    const imgX = ((thetaVal + Math.PI) / (2 * Math.PI)) * 6080;
    const imgY = ((phiVal + Math.PI / 2) / Math.PI) * 3040;

    const newPoint: MeasurePoint = {
      imgX,
      imgY,
      theta: thetaVal,
      phi: phiVal,
    };

    const updatedPoints = [...currentPoints, newPoint];
    setCurrentPoints(updatedPoints);

    // 두 점이 모이면 측정 완료
    if (updatedPoints.length === 2) {
      const [p1, p2] = updatedPoints;
      const rawAngle = angularDistance(p1, p2);
      const calibrated = calibratedDistance(rawAngle);

      if (mode === "calibrate" && onCalibrationPoint) {
        onCalibrationPoint(p1, p2, rawAngle);
      } else if (mode === "measure" && onMeasurementComplete) {
        onMeasurementComplete({
          points: updatedPoints,
          rawAngle,
          calibratedValue: calibrated || 0,
          unit: measureType === "height" ? "m" : "m",
        });
      }

      setCurrentPoints([]);
    }
  }, [mode, currentPoints, angularDistance, calibratedDistance, onMeasurementComplete, onCalibrationPoint, measureType]);

  // 마우스 이동 시 좌표 표시
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (mode === "view") {
      setHoverInfo("");
      return;
    }

    const container = containerRef.current;
    const camera = cameraRef.current;
    if (!container || !camera) return;

    const rect = container.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

    const scene = sceneRef.current;
    if (!scene) return;

    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
      const point = intersects[0].point;
      const r = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z);
      const phiVal = Math.acos(point.y / r) - Math.PI / 2;
      const thetaVal = Math.atan2(point.z, point.x);

      if (currentPoints.length === 1) {
        const rawAngle = angularDistance(currentPoints[0], { imgX: 0, imgY: 0, theta: thetaVal, phi: phiVal });
        const calibrated = calibratedDistance(rawAngle);
        if (calibrated) {
          setHoverInfo(`${calibrated.toFixed(2)}m (${(rawAngle * 180 / Math.PI).toFixed(1)}°)`);
        } else {
          setHoverInfo(`${(rawAngle * 180 / Math.PI).toFixed(1)}° (보정 필요)`);
        }
      } else {
        setHoverInfo("클릭하여 시작점 지정");
      }
    }
  }, [mode, currentPoints, angularDistance, calibratedDistance]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={containerRef}
        className="w-full h-full cursor-crosshair"
        onClick={handleMeasureClick}
        onMouseMove={handleMouseMove}
        style={{ minHeight: 400 }}
      />

      {/* 로딩 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white text-center">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
            <p>360° 이미지 로딩 중...</p>
          </div>
        </div>
      )}

      {/* 모드 표시 */}
      {mode !== "view" && (
        <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full">
          {mode === "calibrate" ? "보정 모드" : "측정 모드"} |{" "}
          {currentPoints.length === 0 ? "시작점을 클릭하세요" : "끝점을 클릭하세요"}
        </div>
      )}

      {/* 호버 정보 */}
      {hoverInfo && (
        <div className="absolute bottom-3 left-3 bg-black/70 text-white text-sm px-3 py-1.5 rounded">
          {hoverInfo}
        </div>
      )}

      {/* 보정 상태 */}
      {calibrationData && (
        <div className="absolute top-3 right-3 bg-emerald-600/80 text-white text-xs px-3 py-1.5 rounded-full">
          보정 완료 (SF: {calibrationData.scaleFactor.toFixed(3)} ± {calibrationData.standardDeviation.toFixed(3)})
        </div>
      )}

      {/* 측정 포인트 표시 */}
      {currentPoints.length > 0 && (
        <div className="absolute top-12 left-3 bg-amber-600/80 text-white text-xs px-3 py-1.5 rounded">
          포인트 {currentPoints.length}/2 선택됨
        </div>
      )}

      {/* 기존 측정 목록 오버레이 */}
      {measurements.length > 0 && (
        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs p-2 rounded max-h-40 overflow-y-auto">
          <div className="font-semibold mb-1">측정 기록 ({measurements.length})</div>
          {measurements.slice(-5).map((m, i) => (
            <div key={i} className="flex justify-between gap-3 py-0.5">
              <span>{m.label || m.type}</span>
              <span className="font-mono">
                {m.calibratedValue ? `${Number(m.calibratedValue).toFixed(2)}${m.unit || "m"}` : "-"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
