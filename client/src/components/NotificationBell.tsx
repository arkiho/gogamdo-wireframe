import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Bell, Check, CheckCheck, Clock, FileText, AlertTriangle, Users, Calendar, MessageSquare, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

const TYPE_CONFIG: Record<string, { icon: typeof Bell; label: string; color: string }> = {
  schedule_delay: { icon: AlertTriangle, label: "공정 지연", color: "text-red-500" },
  expense_submitted: { icon: FileText, label: "결의서 상신", color: "text-blue-500" },
  expense_approved: { icon: Check, label: "결의서 승인", color: "text-green-500" },
  expense_rejected: { icon: AlertTriangle, label: "결의서 반려", color: "text-red-500" },
  sub_quote_submitted: { icon: FileText, label: "견적 제출", color: "text-amber-500" },
  sub_report_submitted: { icon: FileText, label: "작업보고", color: "text-amber-500" },
  meeting_scheduled: { icon: Calendar, label: "미팅 예약", color: "text-purple-500" },
  meeting_reminder: { icon: Clock, label: "미팅 리마인더", color: "text-purple-500" },
  project_status: { icon: Info, label: "프로젝트", color: "text-blue-500" },
  client_inquiry: { icon: Users, label: "고객 문의", color: "text-teal-500" },
  approval_pending: { icon: Clock, label: "결재 대기", color: "text-orange-500" },
  general: { icon: MessageSquare, label: "일반", color: "text-gray-500" },
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

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  const unreadCount = trpc.ops.notification.unreadCount.useQuery(undefined, {
    refetchInterval: 30000, // 30초마다 갱신
  });
  const notifications = trpc.ops.notification.list.useQuery(
    { limit: 20 },
    { enabled: open }
  );
  const markRead = trpc.ops.notification.markRead.useMutation({
    onSuccess: () => {
      unreadCount.refetch();
      notifications.refetch();
    },
  });
  const markAllRead = trpc.ops.notification.markAllRead.useMutation({
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

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-[10px] bg-red-500 text-white border-0"
          >
            {count > 99 ? "99+" : count}
          </Badge>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[480px] bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
            <h3 className="font-semibold text-sm">알림</h3>
            {count > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => markAllRead.mutate()}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                모두 읽음
              </Button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[400px]">
            {notifications.isLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                로딩 중...
              </div>
            ) : !notifications.data?.length ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                알림이 없습니다
              </div>
            ) : (
              notifications.data.map((n) => {
                const config = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.general;
                const Icon = config.icon;
                return (
                  <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 border-b border-border/50 cursor-pointer hover:bg-muted/50 transition-colors ${
                      !n.isRead ? "bg-primary/5" : ""
                    }`}
                    onClick={() => {
                      if (!n.isRead) markRead.mutate({ id: n.id });
                      if (n.link) {
                        navigate(n.link);
                        setOpen(false);
                      }
                    }}
                  >
                    <div className={`mt-0.5 flex-shrink-0 ${config.color}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug ${!n.isRead ? "font-semibold" : ""}`}>
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary mt-1.5" />
                        )}
                      </div>
                      {n.message && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground/60 mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
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
