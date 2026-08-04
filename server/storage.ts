// 스토리지 헬퍼
// 저장소는 애플리케이션 authorization을 우회하지 않는 local persistent Volume만 사용한다.
// BUILT_IN_FORGE_API_*는 이미지 생성 API 전용이며 storage backend 설정이 아니다.
//
// storagePut/storageGet 시그니처는 그대로 유지 → 모든 호출부 무수정.

import fs from 'fs';
import path from 'path';

// ===== 로컬 디스크 설정 =====
// Railway에서는 볼륨을 /data 등에 마운트하고 STORAGE_DIR=/data/uploads 로 지정.
// 미지정 시 프로세스 작업경로의 uploads 폴더(개발용, 재배포 시 휘발될 수 있음).
export const STORAGE_DIR = process.env.STORAGE_DIR || path.resolve(process.cwd(), 'uploads');
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || 'https://kokamdo.co.kr').replace(/\/+$/, '');

export function validateStorageRuntimeConfiguration(
  env: Record<string, string | undefined> = process.env,
): void {
  if (env.NODE_ENV !== "production") return;
  if (!env.STORAGE_DIR || !path.isAbsolute(env.STORAGE_DIR)) {
    throw new Error("Production STORAGE_DIR must be an explicit absolute persistent-volume path");
  }
}

export function normalizeStorageKey(relKey: string): string {
  const normalized = relKey.replace(/\\/g, "/");
  const segments = normalized.split("/");

  if (
    !normalized ||
    normalized.startsWith("/") ||
    normalized.includes("\0") ||
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new Error("Invalid storage key");
  }

  return segments.join("/");
}

export function resolveLocalStoragePath(storageRoot: string, relKey: string): string {
  const root = path.resolve(storageRoot);
  const key = normalizeStorageKey(relKey);
  const resolved = path.resolve(root, key);

  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error("Invalid storage key");
  }

  return resolved;
}

// ===== 로컬 디스크 구현 =====
function localUrlFor(key: string): string {
  return `${PUBLIC_BASE_URL}/uploads/${key}`;
}

async function localPut(
  relKey: string,
  data: Buffer | Uint8Array | string,
): Promise<{ key: string; url: string }> {
  const key = normalizeStorageKey(relKey);
  const filePath = resolveLocalStoragePath(STORAGE_DIR, key);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  const buf =
    typeof data === "string"
      ? Buffer.from(data)
      : Buffer.isBuffer(data)
      ? data
      : Buffer.from(data as Uint8Array);
  await fs.promises.writeFile(filePath, buf);
  return { key, url: localUrlFor(key) };
}

// ===== 공개 API (시그니처 불변) =====
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  return localPut(relKey, data);
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeStorageKey(relKey);
  return { key, url: localUrlFor(key) };
}
