/**
 * 고객 포털 전용 알림 벨 컴포넌트
 * clientNotification tRPC 라우터를 사용하여 고객 알림을 표시
 */
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Bell, Check, CheckCheck, Trash2, X,
  FileText, Calendar, BarChart3, ClipboardList, Info, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TYPE_CONFIG: Record<string, { icon: typeof Bell; label: string; color: string }> = {
  status_change: { icon: Info, label: "상태 변경", color: "text-blue-500" },
  meeting_confirmed: { icon: Calendar, label: "미팅 확정", color: "text-green-500" },
  meeting_cancelled: { icon: Calendar, label: "미팅 취소", color: "text-red-500" },
  report_ready: { icon: BarChart3, label: "보고서", color: "text-purple-500" },
  survey_complete: { icon: ClipboardList, label: "서베이", color: "text-amber-500" },
  system: { icon: MessageSquare, label: "시스템", color: "text-gray-500" },
};

function timeAgo(dateStr: string | Date) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
  return date.toLocaleDateString("ko-KR");
}

export default function ClientNotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = trpc.clientNotification.unreadCount.useQuery(undefined, {
    refetchInterval: 20000,
  });
  const notifications = trpc.clientNotification.list.useQuery(undefined, {
    enabled: open,
  });
  const markRead = trpc.clientNotification.markRead.useMutation({
    onSuccess: () => {
      unreadCount.refetch();
      notifications.refetch();
    },
  });
  const markAllRead = trpc.clientNotification.markAllRead.useMutation({
    onSuccess: () => {
      unreadCount.refetch();
      notifications.refetch();
    },
  });
  const deleteNotif = trpc.clientNotification.delete.useMutation({
    onSuccess: () => {
      unreadCount.refetch();
      notifications.refetch();
    },
  });

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const count = unreadCount.data ?? 0;
  const items = notifications.data ?? [];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gold/10 transition-colors"
        aria-label="알림"
      >
        <Bell className={`w-5 h-5 ${count > 0 ? "text-gold" : "text-muted-foreground"}`} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-1/2 -translate-x-1/2 top-14 sm:absolute sm:left-auto sm:translate-x-0 sm:right-0 sm:top-full sm:mt-2 w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] sm:max-h-[480px] bg-white border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <h3 className="font-heading text-sm font-bold text-ink">알림</h3>
            <div className="flex items-center gap-1">
              {count > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => markAllRead.mutate()}
                >
                  <CheckCheck className="w-3.5 h-3.5 mr-1" />
                  모두 읽음
                </Button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[400px]">
            {notifications.isLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                로딩 중...
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">알림이 없습니다</p>
              </div>
            ) : (
              items.map((n) => {
                const config = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.system;
                const Icon = config.icon;
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-border/30 hover:bg-gray-50 transition-colors cursor-pointer group ${
                      n.isRead === "no" ? "bg-gold/5" : ""
                    }`}
                    onClick={() => {
                      if (n.isRead === "no") markRead.mutate({ id: n.id });
                      if (n.linkUrl) {
                        window.location.href = n.linkUrl;
                        setOpen(false);
                      }
                    }}
                  >
                    <div className={`flex-shrink-0 mt-0.5 ${config.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-gold/30 text-gold-dark">
                          {config.label}
                        </Badge>
                        {n.isRead === "no" && (
                          <span className="w-2 h-2 rounded-full bg-gold flex-shrink-0" />
                        )}
                      </div>
                      <p className={`text-sm text-ink truncate ${n.isRead === "no" ? "font-semibold" : ""}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotif.mutate({ id: n.id });
                        }}
                        className="p-1 rounded hover:bg-red-50 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
