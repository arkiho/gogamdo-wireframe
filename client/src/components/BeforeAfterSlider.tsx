import { useState, useRef, useCallback, useEffect } from "react";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  aspectRatio?: string;
  className?: string;
}

/**
 * Before/After 이미지 비교 슬라이더
 * 드래그 또는 터치로 슬라이더를 움직여 시공 전/후를 비교할 수 있습니다.
 */
export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  aspectRatio = "16/9",
  className = "",
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateSliderPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateSliderPosition(e.clientX);
  }, [updateSliderPosition]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    updateSliderPosition(e.touches[0].clientX);
  }, [updateSliderPosition]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      updateSliderPosition(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      updateSliderPosition(e.touches[0].clientX);
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleTouchMove, { passive: true });
      window.addEventListener("touchend", handleEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, updateSliderPosition]);

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden group ${className}`}
      style={{ aspectRatio }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      role="slider"
      aria-label="Before/After 이미지 비교 슬라이더"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(sliderPosition)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") setSliderPosition(p => Math.max(0, p - 2));
        if (e.key === "ArrowRight") setSliderPosition(p => Math.min(100, p + 2));
      }}
    >
      {/* After Image (Full background) */}
      <img
        src={afterImage}
        alt={afterLabel}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Before Image (Clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : "100vw" }}
          draggable={false}
        />
      </div>

      {/* Slider Line */}
      <div
        className="absolute top-0 bottom-0 z-10"
        style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
      >
        {/* Vertical Line */}
        <div className="w-0.5 h-full bg-white shadow-[0_0_8px_rgba(0,0,0,0.3)]" />

        {/* Slider Handle */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center cursor-grab transition-transform duration-150 ${
            isDragging ? "scale-110 cursor-grabbing" : isHovering ? "scale-105" : ""
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-ink">
            <path d="M7 4L3 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13 4L17 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div
        className={`absolute top-4 left-4 z-20 px-3 py-1.5 text-xs font-bold tracking-widest uppercase transition-opacity duration-300 ${
          sliderPosition > 15 ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundColor: "rgba(30, 28, 25, 0.75)", color: "#fff" }}
      >
        {beforeLabel}
      </div>
      <div
        className={`absolute top-4 right-4 z-20 px-3 py-1.5 text-xs font-bold tracking-widest uppercase transition-opacity duration-300 ${
          sliderPosition < 85 ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundColor: "rgba(196, 167, 118, 0.85)", color: "#1e1c19" }}
      >
        {afterLabel}
      </div>

      {/* Instruction overlay (shows briefly) */}
      <div
        className={`absolute inset-0 z-30 flex items-center justify-center pointer-events-none transition-opacity duration-500 ${
          isDragging || isHovering ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="bg-black/50 text-white text-xs font-medium px-4 py-2 rounded-full backdrop-blur-sm animate-pulse">
          ← 드래그하여 비교 →
        </div>
      </div>
    </div>
  );
}

/**
 * Before/After 이미지 갤러리 (여러 쌍을 슬라이드로 표시)
 */
interface BeforeAfterPair {
  beforeImage: string;
  afterImage: string;
  caption?: string;
}

interface BeforeAfterGalleryProps {
  pairs: BeforeAfterPair[];
  beforeLabel?: string;
  afterLabel?: string;
}

export function BeforeAfterGallery({
  pairs,
  beforeLabel = "시공 전",
  afterLabel = "시공 후",
}: BeforeAfterGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (pairs.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Active Slider */}
      <BeforeAfterSlider
        beforeImage={pairs[activeIndex].beforeImage}
        afterImage={pairs[activeIndex].afterImage}
        beforeLabel={beforeLabel}
        afterLabel={afterLabel}
        className="rounded-sm"
      />

      {/* Caption */}
      {pairs[activeIndex].caption && (
        <p className="text-sm text-muted-foreground text-center">
          {pairs[activeIndex].caption}
        </p>
      )}

      {/* Thumbnail Navigation (only if multiple pairs) */}
      {pairs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {pairs.map((pair, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`relative flex-shrink-0 w-20 h-14 overflow-hidden border-2 transition-all duration-200 ${
                i === activeIndex
                  ? "border-gold ring-1 ring-gold/30"
                  : "border-border/50 hover:border-gold/50 opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={pair.afterImage}
                alt={`비교 ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white bg-black/40 px-1.5 py-0.5 rounded">
                  {i + 1}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
