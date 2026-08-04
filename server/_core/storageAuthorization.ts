import { normalizeStorageKey } from "../storage";

export type StorageSubject = { kind: "staff" | "client"; id: number };
export type StorageAuthorization = "public" | "private" | null;

export type StorageAuthorizationDependencies = {
  isPublishedReference: (key: string) => Promise<boolean>;
  isClientProjectOwner: (projectId: number, clientId: number) => Promise<boolean>;
  isClientAvatar: (key: string, clientId: number) => Promise<boolean>;
};

const ALLOWED_STORAGE_ORIGINS = new Set([
  "https://kokamdo.co.kr",
  "https://www.kokamdo.co.kr",
]);

export function storageKeyFromUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    let rawPath = value;
    if (/^https?:\/\//i.test(value)) {
      const url = new URL(value);
      if (!ALLOWED_STORAGE_ORIGINS.has(url.origin)) return null;
      rawPath = url.pathname;
    }

    const candidate = rawPath.startsWith("/uploads/")
      ? rawPath.slice("/uploads/".length)
      : rawPath.startsWith("/") ? null : rawPath;
    return candidate ? normalizeStorageKey(decodeURIComponent(candidate)) : null;
  } catch {
    return null;
  }
}

export function isClientAvatarUrlOwnedByClient(value: string, clientId: number): boolean {
  const key = storageKeyFromUrl(value);
  if (!key) return false;
  const match = /^avatar\/client-(\d+)\//.exec(key);
  return Boolean(match && Number(match[1]) === clientId);
}

export function isStaffAvatarUrlOwnedByStaff(value: string, staffId: number): boolean {
  const key = storageKeyFromUrl(value);
  if (!key) return false;
  const match = /^avatar\/staff-(\d+)\//.exec(key);
  return Boolean(match && Number(match[1]) === staffId);
}

export function recordReferencesStorageKey(
  key: string,
  values: Array<string | null | undefined>,
): boolean {
  return values.some(value => storageKeyFromUrl(value) === key);
}

export async function authorizeStorageRead(
  key: string,
  subject: StorageSubject | null,
  dependencies: StorageAuthorizationDependencies,
): Promise<StorageAuthorization> {
  if (await dependencies.isPublishedReference(key)) return "public";
  if (!subject) return null;
  if (subject.kind === "staff") return "private";

  const planMatch = /^client-plans\/(\d+)\//.exec(key);
  if (planMatch) {
    const projectId = Number(planMatch[1]);
    return await dependencies.isClientProjectOwner(projectId, subject.id) ? "private" : null;
  }

  if (
    isClientAvatarUrlOwnedByClient(key, subject.id) &&
    await dependencies.isClientAvatar(key, subject.id)
  ) {
    return "private";
  }

  return null;
}
