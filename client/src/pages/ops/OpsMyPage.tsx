/**
 * 직원 마이페이지 (E-13) — /ops/my
 * 공용 MyPageView + 직원 전용 읽기필드(소속팀·직책)·알림 항목.
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import MyPageView, { type NotifItem, type ReadonlyRow } from "@/components/profile/MyPageView";

const TEAM_LABEL: Record<string, string> = { executive: "대표자", management: "경영지원", construction: "공사팀", design: "설계팀" };
const DEPT_LABEL: Record<string, string> = { design: "설계팀", construction: "공사팀", accounting: "회계팀", management: "경영지원", sales: "영업팀", none: "미배정" };
const OPSROLE_LABEL: Record<string, string> = { pm: "프로젝트 매니저", designer: "설계 담당", site_manager: "현장 소장", accountant: "경리 담당", director: "이사/임원", staff: "일반 직원" };

const NOTIF_ITEMS: NotifItem[] = [
  { key: "approval", label: "결재 요청·승인", desc: "내 결재라인에 문서가 올라오면 알림" },
  { key: "project", label: "담당 프로젝트 업데이트", desc: "내 현장의 공정·정산 변경 알림" },
  { key: "inquiry", label: "신규 문의 배정", desc: "나에게 배정된 신규 문의 알림" },
  { key: "email", label: "이메일 알림 병행", desc: "앱 알림과 함께 이메일로도 수신" },
];

export default function OpsMyPage() {
  const { user, refresh } = useAuth();
  const utils = trpc.useUtils();

  const updateProfile = trpc.auth.updateMyProfile.useMutation({
    onSuccess: () => { utils.auth.me.invalidate(); refresh(); toast.success("저장되었습니다."); },
    onError: (e) => toast.error(e.message),
  });
  const changePassword = trpc.auth.changeMyPassword.useMutation({
    onSuccess: () => toast.success("비밀번호가 변경되었습니다."),
    onError: (e) => toast.error(e.message),
  });
  const updateNotif = trpc.auth.updateMyNotifPrefs.useMutation({
    onSuccess: () => { utils.auth.me.invalidate(); refresh(); },
    onError: (e) => toast.error(e.message),
  });

  if (!user) {
    return <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>;
  }

  const u = user as any;
  const teamLabel = u.team ? TEAM_LABEL[u.team] : (u.department ? DEPT_LABEL[u.department] : "미배정");
  const roleChips = [teamLabel, OPSROLE_LABEL[u.opsRole] ?? "일반 직원"].filter(Boolean);
  const readonlyRows: ReadonlyRow[] = [
    { k: "소속팀", v: teamLabel, locked: true },
    { k: "직책", v: OPSROLE_LABEL[u.opsRole] ?? "일반 직원", locked: true },
  ];
  const notifValues: Record<string, boolean> = (u.notifPrefs as Record<string, boolean>) ?? { approval: true, project: true, inquiry: false, email: false };

  return (
    <MyPageView
      name={u.name ?? ""}
      email={u.email ?? ""}
      phone={u.phone ?? ""}
      landline={u.landline ?? ""}
      avatarUrl={u.avatarUrl ?? ""}
      roleChips={roleChips}
      readonlyRows={readonlyRows}
      readonlyCaption="소속팀·직책은 관리자가 관리하는 항목이라 본인이 수정할 수 없습니다."
      notifItems={NOTIF_ITEMS}
      notifValues={notifValues}
      hasPassword={u.hasPassword ?? (u.loginMethod === "email" || !u.loginMethod)}
      avatarPrefix="avatar"
      savingProfile={updateProfile.isPending}
      savingPassword={changePassword.isPending}
      onSaveProfile={(v) => updateProfile.mutate(v)}
      onChangePassword={(v) => changePassword.mutate(v)}
      onToggleNotif={(key, value) => {
        const next = { ...notifValues, [key]: value };
        updateNotif.mutate({ prefs: next });
      }}
    />
  );
}
