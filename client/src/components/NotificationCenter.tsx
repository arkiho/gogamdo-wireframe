/*
 * Notification Center Component
 * 관리자 헤더에 벨 아이콘으로 표시되며, 클릭 시 알림 목록을 드롭다운으로 보여줍니다.
 * 읽지 않은 알림 수를 배지로 표시합니다.
 */

import { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCheck, Trash2, MessageSquare, Calculator, Users, Settings, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  inquiry: <MessageSquare className="w-4 h-4 text-blue-500" />,
  estimate: <Calculator className="w-4 h-4 text-green-500" />,
  crm_deal: <Users className="w-4 h-4 text-purple-500" />,
  crm_stage_change: <Settings className="w-4 h-4 text-orange-500" />,
  newsletter: <Users className="w-4 h-4 text-teal-500" />,
  chat: <MessageSquare className="w-4 h-4 text-indigo-500" />,
  system: <Bell className="w-4 h-4 text-gray-500" />,
};

const TYPE_LABELS: Record<string, string> = {
  inquiry: "문의",
  estimate: "견적",
  crm_deal: "CRM 딜",
  crm_stage_change: "CRM 단계변경",
  newsletter: "뉴스레터",
  chat: "채팅",
  system: "시스템",
};

function timeAgo(date: Date | string) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = trpc.notification.unreadCount.useQuery(undefined, {
    refetchInterval: 30_000, // 30초마다 폴링
  });

  const notificationList = trpc.notification.list.useQuery(
    { limit: 20 },
    { enabled: isOpen }
  );

  const markRead = trpc.notification.markRead.useMutation({
    onSuccess: () => {
      unreadCount.refetch();
      notificationList.refetch();
    },
  });

  const markAllRead = trpc.notification.markAllRead.useMutation({
    onSuccess: () => {
      unreadCount.refetch();
      notificationList.refetch();
    },
  });

  const deleteNotification = trpc.notification.delete.useMutation({
    onSuccess: () => {
      unreadCount.refetch();
      notificationList.refetch();
    },
  });

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const count = unreadCount.data ?? 0;
  const notifications = notificationList.data ?? [];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md hover:bg-paper-warm transition-colors"
        aria-label="알림"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[480px] bg-white rounded-xl shadow-2xl border border-border/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
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
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-paper-warm transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">알림이 없습니다</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-border/30 hover:bg-paper-warm/50 transition-colors cursor-pointer group ${
                    n.isRead === "no" ? "bg-blue-50/50" : ""
                  }`}
                  onClick={() => {
                    if (n.isRead === "no") {
                      markRead.mutate({ id: n.id });
                    }
                    if (n.linkUrl) {
                      window.location.href = n.linkUrl;
                      setIsOpen(false);
                    }
                  }}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {TYPE_ICONS[n.type] || <Bell className="w-4 h-4 text-gray-400" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                        {TYPE_LABELS[n.type] || n.type}
                      </Badge>
                      {n.isRead === "no" && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm font-medium text-ink truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification.mutate({ id: n.id });
                      }}
                      className="p-1 rounded hover:bg-red-50 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
