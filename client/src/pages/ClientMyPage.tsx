/**
 * 클라이언트 마이페이지 (E-13) — /my/profile
 * 공용 MyPageView + 고객 전용 읽기필드(회사명·담당 프로젝트)·알림 항목.
 */
import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import MyPageView, { type NotifItem, type ReadonlyRow } from "@/components/profile/MyPageView";

const NOTIF_ITEMS: NotifItem[] = [
  { key: "estimate", label: "견적 안내", desc: "견적서 발송·수정 시 알림" },
  { key: "progress", label: "시공 진행 알림", desc: "공정 단계 변경·주요 업데이트 알림" },
  { key: "aftercare", label: "사후관리 안내", desc: "정기점검·하자보수 관련 알림" },
  { key: "email", label: "이메일 알림 병행", desc: "앱 알림과 함께 이메일로도 수신" },
];

export default function ClientMyPage() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const meQ = trpc.clientAuth.me.useQuery();

  useEffect(() => {
    if (!meQ.isLoading && !meQ.data) navigate("/client/login");
  }, [meQ.isLoading, meQ.data, navigate]);

  const updateProfile = trpc.clientAuth.updateProfile.useMutation({
    onSuccess: () => { utils.clientAuth.me.invalidate(); toast.success("저장되었습니다."); },
    onError: (e) => toast.error(e.message),
  });
  const changePassword = trpc.clientAuth.changePassword.useMutation({
    onSuccess: () => toast.success("비밀번호가 변경되었습니다."),
    onError: (e) => toast.error(e.message),
  });
  const updateNotif = trpc.clientAuth.updateNotifPrefs.useMutation({
    onSuccess: () => utils.clientAuth.me.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  if (meQ.isLoading || !meQ.data) {
    return <div className="py-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>;
  }

  const c = meQ.data as any;
  const projectCount = (c.assignedProjectIds ?? []).length;
  const readonlyRows: ReadonlyRow[] = [
    { k: "회사명", v: c.company || "-", locked: true },
    { k: "담당 프로젝트", v: `${projectCount}건`, locked: true },
  ];
  const notifValues: Record<string, boolean> = c.notifPrefs ?? { estimate: true, progress: true, aftercare: true, email: false };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <MyPageView
        name={c.name ?? ""}
        email={c.email ?? ""}
        phone={c.phone ?? ""}
        landline={c.landline ?? ""}
        avatarUrl={c.avatarUrl ?? ""}
        roleChips={[c.company || "고객사"]}
        readonlyRows={readonlyRows}
        readonlyCaption="회사명·담당 프로젝트는 담당자가 관리하는 항목입니다."
        notifItems={NOTIF_ITEMS}
        notifValues={notifValues}
        hasPassword={c.hasPassword ?? true}
        avatarPrefix="avatar"
        savingProfile={updateProfile.isPending}
        savingPassword={changePassword.isPending}
        onSaveProfile={(v) => updateProfile.mutate({ name: v.name, phone: v.phone, landline: v.landline, avatarUrl: v.avatarUrl })}
        onChangePassword={(v) => changePassword.mutate({ currentPassword: v.currentPassword, newPassword: v.newPassword })}
        onToggleNotif={(key, value) => updateNotif.mutate({ prefs: { ...notifValues, [key]: value } })}
      />
    </div>
  );
}
