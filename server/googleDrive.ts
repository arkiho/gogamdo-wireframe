/**
 * Google Drive API 연동 모듈
 * 서비스 계정을 사용하여 구글 드라이브 폴더를 탐색하고 파일을 다운로드
 * 
 * 폴더 구조: 완료 프로젝트/[프로젝트명]/06. IMAGE (현장사진)/준공사진/4. 준공사진
 */

import { google, type drive_v3 } from "googleapis";

function getAuth() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON 환경변수가 설정되지 않았습니다.");
  }

  let credentials: Record<string, string>;
  try {
    credentials = JSON.parse(serviceAccountJson);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON이 올바른 JSON 형식이 아닙니다.");
  }

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  return auth;
}

function getDrive(): drive_v3.Drive {
  const auth = getAuth();
  return google.drive({ version: "v3", auth });
}

export async function listFolders(parentFolderId: string) {
  const drive = getDrive();
  const res = await drive.files.list({
    q: `'${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name, modifiedTime)",
    orderBy: "name",
    pageSize: 100,
  });

  return (res.data.files || []).map(f => ({
    id: f.id || "",
    name: f.name || "",
    modifiedTime: f.modifiedTime || "",
  }));
}

export async function listImageFiles(folderId: string) {
  const drive = getDrive();
  const res = await drive.files.list({
    q: `'${folderId}' in parents and (mimeType contains 'image/') and trashed=false`,
    fields: "files(id, name, mimeType, size, modifiedTime, thumbnailLink)",
    orderBy: "name",
    pageSize: 200,
  });

  return (res.data.files || []).map(f => ({
    id: f.id || "",
    name: f.name || "",
    mimeType: f.mimeType || "",
    size: f.size || "0",
    modifiedTime: f.modifiedTime || "",
    thumbnailLink: f.thumbnailLink || "",
  }));
}

export async function downloadFile(fileId: string) {
  const drive = getDrive();
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  );

  const meta = await drive.files.get({ fileId, fields: "mimeType" });
  const mimeType = meta.data.mimeType || "image/jpeg";

  return {
    buffer: Buffer.from(res.data as ArrayBuffer),
    mimeType,
  };
}

export async function findCompletionPhotoFolders(rootFolderId: string) {
  const results: Array<{
    projectName: string;
    folderId: string;
    folderPath: string;
  }> = [];

  const projectFolders = await listFolders(rootFolderId);

  for (const project of projectFolders) {
    try {
      const imageFolders = await listFolders(project.id);
      const imageFolder = imageFolders.find(f =>
        f.name.includes("06") && f.name.toLowerCase().includes("image")
      );
      if (!imageFolder) continue;

      const subFolders = await listFolders(imageFolder.id);
      const completionFolder = subFolders.find(f => f.name.includes("준공사진"));
      if (!completionFolder) continue;

      const finalFolders = await listFolders(completionFolder.id);
      const targetFolder = finalFolders.find(f =>
        f.name.includes("4") && f.name.includes("준공사진")
      );

      if (targetFolder) {
        results.push({
          projectName: project.name,
          folderId: targetFolder.id,
          folderPath: `${project.name}/06. IMAGE/준공사진/4. 준공사진`,
        });
      } else {
        results.push({
          projectName: project.name,
          folderId: completionFolder.id,
          folderPath: `${project.name}/06. IMAGE/준공사진`,
        });
      }
    } catch (err) {
      console.error(`[Drive] 프로젝트 "${project.name}" 탐색 실패:`, err);
      continue;
    }
  }

  return results;
}

export async function checkDriveConnection() {
  try {
    const auth = getAuth();
    await auth.authorize();
    return {
      connected: true,
      email: (auth as any).email || "서비스 계정 연결됨",
    };
  } catch (err: any) {
    return {
      connected: false,
      error: err.message || "연결 실패",
    };
  }
}
