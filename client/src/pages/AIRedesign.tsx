/**
 * AI 공간 리디자인 페이지
 * 고객이 사진을 업로드하고 원하는 변경 사항을 텍스트로 설명하면
 * AI가 해당 공간을 리디자인한 이미지를 생성
 */

import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Camera,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Download,
  ChevronDown,
  ImageIcon,
  Loader2,
  X,
  Check,
  ArrowLeftRight,
} from "lucide-react";

const SPACE_TYPES = [
  { value: "office", label: "사무실" },
  { value: "meeting", label: "회의실" },
  { value: "lounge", label: "라운지/휴게실" },
  { value: "reception", label: "리셉션/로비" },
  { value: "executive", label: "임원실" },
  { value: "coworking", label: "코워킹 스페이스" },
  { value: "other", label: "기타" },
];

const PROMPT_SUGGESTIONS = [
  "모던하고 미니멀한 스타일로 바꿔주세요",
  "따뜻한 우드톤으로 리디자인해 주세요",
  "스타트업 느낌의 활기찬 공간으로 변경해 주세요",
  "고급스러운 임원실 분위기로 바꿔주세요",
  "자연 친화적인 바이오필릭 디자인으로 변경해 주세요",
  "협업이 활발한 오픈 오피스로 바꿔주세요",
];

export default function AIRedesign() {
  const [step, setStep] = useState<"upload" | "describe" | "result">("upload");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageBase64, setImageBase64] = useState<string>("");
  const [imageMimeType, setImageMimeType] = useState<string>("image/jpeg");
  const [prompt, setPrompt] = useState("");
  const [spaceType, setSpaceType] = useState("office");
  const [resultData, setResultData] = useState<{
    originalImageUrl: string;
    resultImageUrl: string | null | undefined;
  } | null>(null);
  const [compareMode, setCompareMode] = useState<"slider" | "side">("side");
  const [sliderPos, setSliderPos] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const redesignMutation = trpc.aiRedesign.create.useMutation({
    onSuccess: (data) => {
      setResultData({
        originalImageUrl: data.originalImageUrl,
        resultImageUrl: data.resultImageUrl,
      });
      setStep("result");
      toast.success("AI 리디자인이 완료되었습니다!");
    },
    onError: (error) => {
      toast.error(error.message || "AI 리디자인에 실패했습니다. 다시 시도해 주세요.");
    },
  });

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("파일 크기는 10MB 이하여야 합니다.");
      return;
    }

    setImageFile(file);
    setImageMimeType(file.type);

    // Preview
    const previewReader = new FileReader();
    previewReader.onload = (e) => setImagePreview(e.target?.result as string);
    previewReader.readAsDataURL(file);

    // Base64
    const base64Reader = new FileReader();
    base64Reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64 = result.split(",")[1];
      setImageBase64(base64);
    };
    base64Reader.readAsDataURL(file);

    setStep("describe");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleSubmit = () => {
    if (!imageBase64 || !prompt.trim()) {
      toast.error("사진과 변경 사항 설명을 모두 입력해 주세요.");
      return;
    }
    redesignMutation.mutate({
      imageBase64,
      imageMimeType,
      prompt: prompt.trim(),
      spaceType,
    });
  };

  const handleReset = () => {
    setStep("upload");
    setImageFile(null);
    setImagePreview("");
    setImageBase64("");
    setPrompt("");
    setResultData(null);
    setSliderPos(50);
  };

  const handleSliderMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const pos = ((clientX - rect.left) / rect.width) * 100;
      setSliderPos(Math.max(0, Math.min(100, pos)));
    },
    []
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 bg-ink text-white overflow-hidden">
        <div className="absolute top-8 right-8 lg:right-16 opacity-[0.04] select-none pointer-events-none">
          <span className="font-heading text-[10rem] lg:text-[16rem] font-extrabold leading-none">
            AI
          </span>
        </div>
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-3 py-1 mb-6 text-xs font-medium tracking-widest uppercase text-gold border border-gold/30">
              AI Space Redesign
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
              사진 한 장으로
              <br />
              <span className="text-gold">새로운 공간</span>을 만나보세요
            </h1>
            <p className="text-white/50 text-lg max-w-xl leading-relaxed">
              현재 공간 사진을 업로드하고 원하는 변경 사항을 설명하면,
              AI가 전문 디자이너 수준의 리디자인 이미지를 생성합니다.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Steps Indicator */}
      <div className="border-b border-border/50">
        <div className="container py-6">
          <div className="flex items-center justify-center gap-4 lg:gap-8">
            {[
              { num: 1, label: "사진 업로드", step: "upload" },
              { num: 2, label: "변경 사항 설명", step: "describe" },
              { num: 3, label: "AI 결과 확인", step: "result" },
            ].map((s, i) => (
              <div key={s.step} className="flex items-center gap-2 lg:gap-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    step === s.step
                      ? "bg-gold text-ink"
                      : (s.step === "describe" && (step === "describe" || step === "result")) ||
                        (s.step === "upload" && step !== "upload") ||
                        (s.step === "result" && step === "result")
                      ? "bg-gold/20 text-gold"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {(s.step === "upload" && step !== "upload") ||
                  (s.step === "describe" && step === "result") ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    s.num
                  )}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:block ${
                    step === s.step ? "text-ink" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
                {i < 2 && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground/50 hidden sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section className="py-16 lg:py-24">
        <div className="container max-w-4xl">
          <AnimatePresence mode="wait">
            {/* Step 1: Upload */}
            {step === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="text-center mb-12">
                  <h2 className="font-heading text-2xl lg:text-3xl font-bold text-ink mb-3">
                    변경하고 싶은 공간 사진을 올려주세요
                  </h2>
                  <p className="text-muted-foreground">
                    사무실, 회의실, 라운지 등 리디자인하고 싶은 공간의 사진을 업로드하세요.
                  </p>
                </div>

                <div
                  className="border-2 border-dashed border-border hover:border-gold/50 transition-colors rounded-lg p-12 lg:p-20 text-center cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                      <Upload className="w-7 h-7 text-gold" />
                    </div>
                    <div>
                      <p className="font-semibold text-ink mb-1">
                        클릭하거나 파일을 드래그하세요
                      </p>
                      <p className="text-sm text-muted-foreground">
                        JPG, PNG, WEBP · 최대 10MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mobile Camera */}
                <div className="mt-4 text-center lg:hidden">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.capture = "environment";
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleFileSelect(file);
                      };
                      input.click();
                    }}
                  >
                    <Camera className="w-4 h-4" />
                    카메라로 촬영
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Describe */}
            {step === "describe" && (
              <motion.div
                key="describe"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                  {/* Left: Image Preview */}
                  <div>
                    <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="업로드된 공간 사진"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                      )}
                      <button
                        className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                        onClick={handleReset}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      {imageFile?.name}
                    </p>
                  </div>

                  {/* Right: Form */}
                  <div className="flex flex-col gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-ink mb-2">
                        공간 유형
                      </label>
                      <div className="relative">
                        <select
                          value={spaceType}
                          onChange={(e) => setSpaceType(e.target.value)}
                          className="w-full h-10 px-3 pr-8 border border-border rounded-md bg-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                        >
                          {SPACE_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-ink mb-2">
                        어떻게 바꾸고 싶으신가요?
                      </label>
                      <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="예: 따뜻한 우드톤으로 바꾸고, 회의 테이블을 둥근 형태로 변경해 주세요. 조명은 간접 조명으로..."
                        className="min-h-[140px] resize-none"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        구체적으로 설명할수록 더 정확한 결과를 얻을 수 있습니다.
                      </p>
                    </div>

                    {/* Prompt Suggestions */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        추천 스타일
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {PROMPT_SUGGESTIONS.map((suggestion) => (
                          <button
                            key={suggestion}
                            className="px-3 py-1.5 text-xs border border-border hover:border-gold/50 hover:bg-gold/5 rounded-full transition-colors text-muted-foreground hover:text-ink"
                            onClick={() => setPrompt(suggestion)}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      className="w-full h-12 bg-gold hover:bg-gold/90 text-ink font-semibold gap-2"
                      onClick={handleSubmit}
                      disabled={!prompt.trim() || redesignMutation.isPending}
                    >
                      {redesignMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          AI가 공간을 리디자인하고 있습니다...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          AI 리디자인 시작
                        </>
                      )}
                    </Button>

                    {redesignMutation.isPending && (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          약 15~30초 정도 소요됩니다. 잠시만 기다려 주세요.
                        </p>
                        <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gold rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: "90%" }}
                            transition={{ duration: 25, ease: "linear" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Result */}
            {step === "result" && resultData && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="text-center mb-8">
                  <h2 className="font-heading text-2xl lg:text-3xl font-bold text-ink mb-3">
                    AI 리디자인 결과
                  </h2>
                  <p className="text-muted-foreground">
                    원본과 AI가 리디자인한 결과를 비교해 보세요.
                  </p>
                </div>

                {/* Compare Mode Toggle */}
                <div className="flex justify-center gap-2 mb-6">
                  <Button
                    variant={compareMode === "side" ? "default" : "outline"}
                    size="sm"
                    className={compareMode === "side" ? "bg-gold text-ink hover:bg-gold/90" : ""}
                    onClick={() => setCompareMode("side")}
                  >
                    좌우 비교
                  </Button>
                  <Button
                    variant={compareMode === "slider" ? "default" : "outline"}
                    size="sm"
                    className={compareMode === "slider" ? "bg-gold text-ink hover:bg-gold/90" : ""}
                    onClick={() => setCompareMode("slider")}
                  >
                    <ArrowLeftRight className="w-4 h-4 mr-1" />
                    슬라이더 비교
                  </Button>
                </div>

                {/* Side by Side */}
                {compareMode === "side" && (
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">
                        Before — 원본
                      </p>
                      <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                        <img
                          src={resultData.originalImageUrl}
                          alt="원본 공간"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium tracking-widest uppercase text-gold mb-3">
                        After — AI 리디자인
                      </p>
                      <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                        {resultData.resultImageUrl ? (
                          <img
                            src={resultData.resultImageUrl}
                            alt="AI 리디자인 결과"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            이미지를 생성할 수 없었습니다
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Slider Compare */}
                {compareMode === "slider" && (
                  <div
                    ref={sliderRef}
                    className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden cursor-col-resize select-none"
                    onMouseMove={(e) => {
                      if (e.buttons === 1) handleSliderMove(e);
                    }}
                    onTouchMove={handleSliderMove}
                  >
                    {/* Result (full) */}
                    {resultData.resultImageUrl && (
                      <img
                        src={resultData.resultImageUrl}
                        alt="AI 리디자인 결과"
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    )}
                    {/* Original (clipped) */}
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ width: `${sliderPos}%` }}
                    >
                      <img
                        src={resultData.originalImageUrl}
                        alt="원본 공간"
                        className="w-full h-full object-contain"
                        style={{
                          width: sliderRef.current
                            ? `${sliderRef.current.offsetWidth}px`
                            : "100%",
                        }}
                      />
                    </div>
                    {/* Slider Line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                      style={{ left: `${sliderPos}%` }}
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                        <ArrowLeftRight className="w-5 h-5 text-ink" />
                      </div>
                    </div>
                    {/* Labels */}
                    <div className="absolute top-4 left-4 px-2 py-1 bg-black/60 text-white text-xs font-medium rounded">
                      Before
                    </div>
                    <div className="absolute top-4 right-4 px-2 py-1 bg-gold/90 text-ink text-xs font-medium rounded">
                      After
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
                  {resultData.resultImageUrl && (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        if (resultData.resultImageUrl) {
                          window.open(resultData.resultImageUrl, "_blank");
                        }
                      }}
                    >
                      <Download className="w-4 h-4" />
                      결과 이미지 다운로드
                    </Button>
                  )}
                  <Button
                    className="gap-2 bg-gold hover:bg-gold/90 text-ink"
                    onClick={handleReset}
                  >
                    <RotateCcw className="w-4 h-4" />
                    다른 공간 리디자인하기
                  </Button>
                </div>

                {/* CTA */}
                <div className="mt-16 p-8 lg:p-12 bg-ink text-white text-center rounded-lg">
                  <h3 className="font-heading text-xl lg:text-2xl font-bold mb-3">
                    마음에 드시나요?
                  </h3>
                  <p className="text-white/50 mb-6 max-w-md mx-auto">
                    AI 결과를 바탕으로 전문 디자이너가 실제 설계를 진행해 드립니다.
                    무료 상담을 신청하세요.
                  </p>
                  <Button
                    className="bg-gold hover:bg-gold/90 text-ink font-semibold gap-2"
                    onClick={() => (window.location.href = "/contact")}
                  >
                    무료 상담 신청
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
