/**
 * 현장(프로젝트) 편집 권한 판정 — 클라이언트 UI 게이팅용 (STAFF_UI 확정 규칙).
 * 서버 assertCanEditProject와 동일한 규칙을 미러링한다(서버가 최종 강제, 여기선 버튼 숨김용).
 * - 전 직원: 열람 가능
 * - 편집: 담당자(managerId===본인) 또는 팀원(teamMembers 포함)만
 * - admin/master: 전체 편집
 */
export interface OpsPermUser {
  id: number;
  role?: string | null;
}

export interface OpsPermProject {
  managerId?: number | null;
  teamMembers?: unknown;
}

export function canEditProject(
  user: OpsPermUser | null | undefined,
  project: OpsPermProject | null | undefined,
): boolean {
  if (!user || !project) return false;
  if (user.role === "admin" || user.role === "master") return true;
  if (project.managerId != null && project.managerId === user.id) return true;
  if (Array.isArray(project.teamMembers) && (project.teamMembers as number[]).includes(user.id)) return true;
  return false;
}

/** 로그인 사용자가 담당(관리자 or 담당자/팀원)인 현장인지 — 목록 정렬/구분용 */
export function isMyProject(
  user: OpsPermUser | null | undefined,
  project: OpsPermProject | null | undefined,
): boolean {
  if (!user || !project) return false;
  if (project.managerId != null && project.managerId === user.id) return true;
  if (Array.isArray(project.teamMembers) && (project.teamMembers as number[]).includes(user.id)) return true;
  return false;
}
