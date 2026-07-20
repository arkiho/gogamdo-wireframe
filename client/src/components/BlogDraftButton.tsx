/*
 * 네이버 블로그용 초안 버튼 + 다이얼로그
 * 클릭하면 붙여넣기 좋은 블로그 초안을 보여주고 "복사하기"를 제공합니다.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileText, Copy, Check } from "lucide-react";

interface BlogDraftButtonProps {
  /** 초안 텍스트를 생성하는 함수 (다이얼로그 열 때 계산) */
  getDraft: () => string;
  label?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost" | "secondary";
  className?: string;
}

export default function BlogDraftButton({
  getDraft,
  label = "블로그 초안",
  size = "sm",
  variant = "ghost",
  className = "",
}: BlogDraftButtonProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const handleOpen = () => {
    try {
      setText(getDraft());
    } catch {
      setText("");
    }
    setCopied(false);
    setOpen(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("초안이 복사되었습니다. 네이버 블로그에 붙여넣으세요.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("복사에 실패했습니다. 텍스트를 직접 선택해 복사해주세요.");
    }
  };

  return (
    <>
      <Button size={size} variant={variant} className={className} onClick={handleOpen} title="네이버 블로그용 초안 생성">
        <FileText className="w-4 h-4" />
        {size !== "icon" && label && <span className="ml-1">{label}</span>}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded bg-[#03C75A] text-white text-[11px] font-extrabold">N</span>
              네이버 블로그용 초안
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-1">
            아래 내용을 복사해 네이버 블로그에 붙여넣고, 사진 몇 장만 추가하면 됩니다.
            (원문 링크가 포함되어 홈페이지로 유입됩니다.)
          </p>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[340px] text-sm font-mono leading-relaxed"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>닫기</Button>
            <Button size="sm" className="bg-[#03C75A] text-white hover:bg-[#02b350]" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              {copied ? "복사됨" : "복사하기"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
