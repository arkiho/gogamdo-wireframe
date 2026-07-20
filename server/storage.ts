// 스토리지 헬퍼
// 1순위: Manus Forge 스토리지 프록시 (BUILT_IN_FORGE_API_URL/KEY 설정 시)
// 폴백: 로컬 디스크 (Railway 볼륨). 마누스 이전 후 기본 경로.
//
// storagePut/storageGet 시그니처는 그대로 유지 → 모든 호출부 무수정.

import { ENV } from './_core/env';
import fs from 'fs';
import path from 'path';

type StorageConfig = { baseUrl: string; apiKey: string };

// ===== 로컬 디스크 설정 =====
// Railway에서는 볼륨을 /data 등에 마운트하고 STORAGE_DIR=/data/uploads 로 지정.
// 미지정 시 프로세스 작업경로의 uploads 폴더(개발용, 재배포 시 휘발될 수 있음).
export const STORAGE_DIR = process.env.STORAGE_DIR || path.resolve(process.cwd(), 'uploads');
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || 'https://kokamdo.co.kr').replace(/\/+$/, '');

/** Forge 프록시 자격증명이 설정되어 있으면 반환, 없으면 null. */
function getForgeConfig(): StorageConfig | null {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) return null;
  return { baseUrl: baseUrl.replace(/\/+$/, ''), apiKey };
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(baseUrl: string, relKey: string, apiKey: string): Promise<string> {
  const downloadApiUrl = new URL("v1/storage/downloadUrl", ensureTrailingSlash(baseUrl));
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, { method: "GET", headers: buildAuthHeaders(apiKey) });
  return (await response.json()).url;
}

function toFormData(data: Buffer | Uint8Array | string, contentType: string, fileName: string): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

// ===== 로컬 디스크 구현 =====
function localUrlFor(key: string): string {
  return `${PUBLIC_BASE_URL}/uploads/${key}`;
}

async function localPut(
  relKey: string,
  data: Buffer | Uint8Array | string,
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const filePath = path.join(STORAGE_DIR, key);
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
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const forge = getForgeConfig();
  if (!forge) {
    // 로컬 디스크 폴백 (Railway 볼륨)
    return localPut(relKey, data);
  }

  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(forge.baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(forge.apiKey),
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const forge = getForgeConfig();
  const key = normalizeKey(relKey);
  if (!forge) {
    return { key, url: localUrlFor(key) };
  }
  return { key, url: await buildDownloadUrl(forge.baseUrl, key, forge.apiKey) };
}
