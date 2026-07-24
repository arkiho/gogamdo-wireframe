/**
 * 마이페이지 공용 뷰 (E-13) — 직원·클라이언트·협력사 3종이 공유하는 프레젠테이션 컴포넌트.
 * 편집 공통(사진·이름·연락처·비밀번호), 역할별 읽기전용 필드·알림 항목만 props로 주입.
 * 목업: _mockups/gogamdo-internal-shell-mypage.html (2 · 마이페이지)
 */
import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { uploadFile } from "@/lib/uploadFile";
import { toast } from "sonner";
import { User as UserIcon, KeyRound, Bell, Camera, Lock } from "lucide-react";

export type NotifItem = { key: string; label: string; desc: string };
export type ReadonlyRow = { k: string; v: string; locked?: boolean };

export default function MyPageView({
  name, email, phone = "", landline = "", avatarUrl = "",
  roleChips, readonlyRows, readonlyCaption, notifItems, notifValues,
  savingProfile, savingPassword, onSaveProfile, onChangePassword, onToggleNotif,
  hasPassword = true, avatarPrefix = "avatar",
}: {
  name: string; email: string; phone?: string; landline?: string; avatarUrl?: string;
  roleChips: string[];
  readonlyRows: ReadonlyRow[];
  readonlyCaption?: string;
  notifItems: NotifItem[];
  notifValues: Record<string, boolean>;
  savingProfile?: boolean;
  savingPassword?: boolean;
  onSaveProfile: (v: { name: string; phone: string; landline: string; avatarUrl: string }) => void;
  onChangePassword: (v: { currentPassword: string; newPassword: string }) => void;
  onToggleNotif: (key: string, value: boolean) => void;
  hasPassword?: boolean;
  avatarPrefix?: string;
}) {
  const [form, setForm] = useState({ name, phone, landline, avatarUrl });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const initial = (form.name || name || "?").slice(0, 1);

  const handleAvatar = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadFile(file, avatarPrefix);
      setForm(f => ({ ...f, avatarUrl: url }));
      onSaveProfile({ name: form.name, phone: form.phone, landline: form.landline, avatarUrl: url });
    } catch (e: any) { toast.error(e?.message ?? "업로드 실패"); }
    finally { setUploading(false); }
  };

  const submitPassword = () => {
    if (pw.newPassword.length < 8) { toast.error("새 비밀번호는 8자 이상이어야 합니다."); return; }
    if (pw.newPassword !== pw.confirm) { toast.error("새 비밀번호가 일치하지 않습니다."); return; }
    onChangePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
    setPw({ currentPassword: "", newPassword: "", confirm: "" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">마이페이지</h1>
        <p className="text-muted-foreground text-sm mt-1">내 정보와 알림 설정을 관리하세요.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr] gap-4 lg:gap-5">
        {/* 프로필 카드 */}
        <Card className="h-fit">
          <CardContent className="pt-6 text-center">
            <div className="relative w-24 h-24 mx-auto mb-3">
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="프로필" className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2a271d] to-[#4a4433] text-gold-light flex items-center justify-center text-4xl font-extrabold">{initial}</div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                aria-label="사진 변경"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gold text-[#1a1710] flex items-center justify-center border-[3px] border-card hover:brightness-105"
              ><Camera className="w-4 h-4" /></button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { handleAvatar(e.target.files?.[0]); e.target.value = ""; }} />
            </div>
            <div className="font-extrabold text-lg text-ink">{name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{email}</div>
            <div className="flex gap-1.5 justify-center mt-3 flex-wrap">
              {roleChips.map(c => <span key={c} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#f3ede1] text-gold">{c}</span>)}
            </div>
            {readonlyRows.length > 0 && (
              <div className="mt-3.5 border-t border-border pt-3 text-left space-y-1.5">
                {readonlyRows.map(r => (
                  <div key={r.k} className="flex justify-between items-center text-[12px]">
                    <span className="text-muted-foreground">{r.k}</span>
                    <span className="text-ink flex items-center gap-1.5">
                      {r.v}
                      {r.locked && <span className="text-[10px] text-muted-foreground bg-[#f5f2ea] px-1.5 py-0.5 rounded flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" />관리자</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {readonlyCaption && <p className="text-[11px] text-muted-foreground mt-2 text-left">{readonlyCaption}</p>}
          </CardContent>
        </Card>

        {/* 편집 영역 */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2"><UserIcon className="w-4 h-4" />기본 정보</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>이름</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><Label>휴대폰</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="010-0000-0000" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>유선 연락처</Label><Input value={form.landline} onChange={e => setForm(f => ({ ...f, landline: e.target.value }))} placeholder="선택" /></div>
                <div><Label>이메일 (로그인 ID · 변경불가)</Label><Input value={email} disabled className="bg-[#f5f2ea] text-muted-foreground" /></div>
              </div>
              <Button onClick={() => onSaveProfile({ name: form.name, phone: form.phone, landline: form.landline, avatarUrl: form.avatarUrl })} disabled={savingProfile}>
                {savingProfile ? "저장 중..." : "기본 정보 저장"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2"><KeyRound className="w-4 h-4" />비밀번호 {hasPassword ? "변경" : "설정"}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {hasPassword && (
                <div><Label>현재 비밀번호</Label><Input type="password" value={pw.currentPassword} onChange={e => setPw(p => ({ ...p, currentPassword: e.target.value }))} /></div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>새 비밀번호</Label><Input type="password" value={pw.newPassword} onChange={e => setPw(p => ({ ...p, newPassword: e.target.value }))} placeholder="8자 이상" /></div>
                <div><Label>새 비밀번호 확인</Label><Input type="password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} /></div>
              </div>
              <Button onClick={submitPassword} disabled={savingPassword}>{savingPassword ? "변경 중..." : hasPassword ? "비밀번호 변경" : "비밀번호 설정"}</Button>
            </CardContent>
          </Card>

          {notifItems.length > 0 && (
            <Card>
              <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2"><Bell className="w-4 h-4" />알림 설정</CardTitle></CardHeader>
              <CardContent className="divide-y">
                {notifItems.map(it => (
                  <div key={it.key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <div className="text-[13px] font-medium">{it.label}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{it.desc}</div>
                    </div>
                    <Switch checked={!!notifValues[it.key]} onCheckedChange={(v) => onToggleNotif(it.key, v)} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
