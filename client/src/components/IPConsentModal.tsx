/**
 * 지적재산권 보호 - 법적 고지 동의 모달
 * 파일 다운로드 전 사용자에게 법적 고지를 표시하고 동의를 받는 모달
 */
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, AlertTriangle, FileWarning, Download } from "lucide-react";

interface IPConsentModalProps {
  open: boolean;
  onClose: () => void;
  onConsent: () => void;
  fileName?: string;
  isLoading?: boolean;
}

export function IPConsentModal({
  open,
  onClose,
  onConsent,
  fileName,
  isLoading = false,
}: IPConsentModalProps) {
  const [agreed, setAgreed] = useState(false);

  const handleConsent = () => {
    if (agreed) {
      onConsent();
      setAgreed(false);
    }
  };

  const handleClose = () => {
    setAgreed(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-amber-500" />
            <DialogTitle className="text-lg">지적재산권 보호 안내</DialogTitle>
          </div>
          <DialogDescription>
            파일 다운로드 전 아래 내용을 확인해 주세요.
          </DialogDescription>
        </DialogHeader>

        {/* 파일 정보 */}
        {fileName && (
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-sm">
            <FileWarning className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{fileName}</span>
          </div>
        )}

        {/* 법적 고지 내용 */}
        <div className="space-y-3 text-sm leading-relaxed">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-400 mb-1">
                  본 자료는 (주)고감도의 지적재산입니다
                </p>
                <p className="text-amber-700 dark:text-amber-500 text-xs">
                  저작권법 및 관련 법률에 의해 보호됩니다.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-muted-foreground">
            <p>
              <strong className="text-foreground">1. 사용 제한:</strong> 본 자료는 귀하와 (주)고감도 간의 프로젝트 검토 목적으로만 제공됩니다.
            </p>
            <p>
              <strong className="text-foreground">2. 금지 행위:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>제3자에게 자료의 전부 또는 일부를 공유, 배포, 전달하는 행위</li>
              <li>다른 인테리어 업체에 비교 견적 또는 시공 의뢰 목적으로 자료를 제공하는 행위</li>
              <li>자료를 복제, 수정, 변형하여 사용하는 행위</li>
              <li>자료를 온라인 또는 오프라인에 게시하는 행위</li>
            </ul>
            <p>
              <strong className="text-foreground">3. 추적:</strong> 본 자료에는 고유 식별 코드(트래킹 워터마크)가 삽입되어 있으며, 무단 유출 시 유출 경로를 추적할 수 있습니다.
            </p>
            <p>
              <strong className="text-foreground">4. 법적 책임:</strong> 위반 시 저작권법 제136조에 따라 <span className="text-red-600 dark:text-red-400 font-medium">5년 이하의 징역 또는 5천만원 이하의 벌금</span>에 처해질 수 있으며, 민사상 손해배상 청구의 대상이 됩니다.
            </p>
          </div>
        </div>

        {/* 동의 체크박스 */}
        <div className="flex items-start gap-3 p-3 bg-muted rounded-md">
          <Checkbox
            id="ip-consent"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked === true)}
            className="mt-0.5"
          />
          <label
            htmlFor="ip-consent"
            className="text-sm leading-relaxed cursor-pointer select-none"
          >
            위 지적재산권 보호 안내를 확인하였으며, 본 자료를 프로젝트 검토 목적으로만 사용하고 제3자에게 공유하지 않을 것에 동의합니다.
          </label>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            취소
          </Button>
          <Button
            onClick={handleConsent}
            disabled={!agreed || isLoading}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isLoading ? (
              "처리 중..."
            ) : (
              <>
                <Download className="w-4 h-4 mr-1" />
                동의 후 다운로드
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
