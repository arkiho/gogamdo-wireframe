import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Bell, Check, CheckCheck, Clock, FileText, AlertTriangle, Users, Calendar, MessageSquare, Info, Settings, Volume2, VolumeX, BellRing, BellOff } from "lucide-react";
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

// 알림 설정 로컬 스토리지 관리
function getNotifSettings() {
  try {
    const stored = localStorage.getItem("ops_notif_settings");
    if (stored) return JSON.parse(stored);
  } catch {}
  return { browserNotif: true, sound: true };
}

function setNotifSettings(settings: { browserNotif: boolean; sound: boolean }) {
  localStorage.setItem("ops_notif_settings", JSON.stringify(settings));
}

// 알림 사운드 재생 (Web Audio API)
function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    oscillator.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.3);
  } catch {}
}

// 브라우저 Notification API 권한 요청
async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

// 브라우저 알림 표시 (PWA 환경에서는 ServiceWorkerRegistration.showNotification 사용)
async function showBrowserNotification(title: string, body: string, link?: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  // PWA(서비스 워커 활성화) 환경에서는 new Notification()이 금지됨
  // ServiceWorkerRegistration.showNotification()을 사용해야 함
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "ops-notification",
        data: { url: link || "/ops" },
      });
      return;
    } catch {
      // 서비스 워커 알림 실패 시 아래 fallback으로
    }
  }

  // Fallback: 서비스 워커가 없는 일반 브라우저 환경
  try {
    const notification = new Notification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "ops-notification",
      renotify: true,
    } as NotificationOptions);
    if (link) {
      notification.onclick = () => {
        window.focus();
        window.location.hash = link;
        notification.close();
      };
    }
    setTimeout(() => notification.close(), 8000);
  } catch {
    // 알림 생성 실패 시 무시 (일부 브라우저에서 new Notification 금지)
  }
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(getNotifSettings);
  const ref = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef<number>(0);
  const [, navigate] = useLocation();

  const unreadCount = trpc.ops.notification.unreadCount.useQuery(undefined, {
    refetchInterval: 15000, // 15초마다 갱신 (30초에서 단축)
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

  // 새 알림 감지 시 브라우저 알림 + 사운드
  useEffect(() => {
    const currentCount = unreadCount.data ?? 0;
    if (currentCount > prevCountRef.current && prevCountRef.current >= 0) {
      // 새 알림이 도착한 경우
      if (settings.sound) {
        playNotificationSound();
      }
      if (settings.browserNotif) {
        showBrowserNotification(
          "고감도",
          `새로운 알림이 ${currentCount - prevCountRef.current}건 도착했습니다.`
        );
      }
    }
    prevCountRef.current = currentCount;
  }, [unreadCount.data, settings.sound, settings.browserNotif]);

  // 브라우저 알림 권한 요청 (설정 ON 시)
  useEffect(() => {
    if (settings.browserNotif) {
      requestNotificationPermission();
    }
  }, [settings.browserNotif]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggleSetting = useCallback((key: "browserNotif" | "sound") => {
    setSettings((prev: { browserNotif: boolean; sound: boolean }) => {
      const next = { ...prev, [key]: !prev[key] };
      setNotifSettings(next);
      return next;
    });
  }, []);

  const count = unreadCount.data ?? 0;

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => { setOpen(!open); setShowSettings(false); }}
      >
        <Bell className={`h-5 w-5 ${count > 0 ? "animate-[ring_0.5s_ease-in-out]" : ""}`} />
        {count > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-[10px] bg-red-500 text-white border-0"
          >
            {count > 99 ? "99+" : count}
          </Badge>
        )}
      </Button>

      {open && (
        <div className="fixed left-1/2 -translate-x-1/2 top-14 sm:absolute sm:left-auto sm:translate-x-0 sm:right-0 sm:top-full sm:mt-2 w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] sm:max-h-[480px] bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
            <h3 className="font-semibold text-sm">알림</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 w-7 p-0"
                onClick={() => setShowSettings(!showSettings)}
                title="알림 설정"
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
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
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="px-4 py-3 border-b border-border bg-muted/30 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground mb-2">알림 설정</p>
              <button
                className="flex items-center justify-between w-full text-sm py-1.5"
                onClick={() => toggleSetting("browserNotif")}
              >
                <span className="flex items-center gap-2">
                  {settings.browserNotif ? <BellRing className="w-4 h-4 text-blue-500" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
                  브라우저 알림
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${settings.browserNotif ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                  {settings.browserNotif ? "ON" : "OFF"}
                </span>
              </button>
              <button
                className="flex items-center justify-between w-full text-sm py-1.5"
                onClick={() => toggleSetting("sound")}
              >
                <span className="flex items-center gap-2">
                  {settings.sound ? <Volume2 className="w-4 h-4 text-green-500" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
                  알림 사운드
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${settings.sound ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {settings.sound ? "ON" : "OFF"}
                </span>
              </button>
              {("Notification" in window) && Notification.permission === "denied" && settings.browserNotif && (
                <p className="text-[10px] text-red-500 mt-1">
                  브라우저 알림이 차단되어 있습니다. 브라우저 설정에서 알림을 허용해주세요.
                </p>
              )}
            </div>
          )}

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
