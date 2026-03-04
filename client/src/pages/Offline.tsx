import { WifiOff, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Offline() {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        {/* 아이콘 */}
        <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold/10">
          <WifiOff className="w-10 h-10 text-gold" />
        </div>

        {/* 제목 */}
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-3">
          인터넷 연결이 끊겼습니다
        </h1>

        {/* 설명 */}
        <p className="text-white/50 text-sm sm:text-base leading-relaxed mb-8">
          현재 네트워크에 연결되어 있지 않습니다.
          <br />
          Wi-Fi 또는 모바일 데이터 연결을 확인한 후 다시 시도해 주세요.
        </p>

        {/* 버튼 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => window.location.reload()}
            className="bg-gold text-ink hover:bg-gold/90 font-semibold gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            다시 시도
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="border-white/20 text-white hover:bg-white/10 gap-2"
          >
            <Home className="w-4 h-4" />
            홈으로 이동
          </Button>
        </div>

        {/* 하단 안내 */}
        <p className="mt-12 text-white/25 text-xs">
          캐시된 페이지는 오프라인에서도 이용 가능합니다
        </p>
      </div>
    </div>
  );
}
