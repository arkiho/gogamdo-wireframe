/**
 * Drive Sync Pipeline
 * Google Drive에서 준공사진을 가져와 S3에 업로드하고 포트폴리오 초안을 자동 생성
 */

import { listImageFiles, downloadFile, findCompletionPhotoFolders } from "./googleDrive";
import { storagePut } from "./storage";
import {
  createPortfolioDraft,
  addDraftImage,
  createSyncLog,
  getSyncLogByFolderId,
  updateSyncLog,
} from "./db";

function randomSuffix() {
  return Math.random().toString(36).substring(2, 10);
}

export async function syncFolder(opts: {
  folderId: string;
  projectName: string;
  folderPath: string;
  category?: string;
}): Promise<{
  success: boolean;
  draftId?: number;
  imageCount: number;
  error?: string;
}> {
  const { folderId, projectName, folderPath, category } = opts;

  try {
    const existingLog = await getSyncLogByFolderId(folderId);
    if (existingLog && existingLog.syncStatus === "done") {
      return {
        success: true,
        draftId: existingLog.draftId ?? undefined,
        imageCount: existingLog.fileCount ?? 0,
        error: "이미 동기화된 폴더입니다.",
      };
    }

    const syncLog = await createSyncLog({
      folderId,
      folderPath,
      syncStatus: "syncing",
    });

    const imageFiles = await listImageFiles(folderId);
    if (imageFiles.length === 0) {
      await updateSyncLog(syncLog.id, { syncStatus: "done", fileCount: 0 });
      return { success: true, imageCount: 0, error: "이미지 파일이 없습니다." };
    }

    const draft = await createPortfolioDraft({
      title: projectName,
      projectName,
      category: category || "사무실 인테리어",
      driveFolder: folderPath,
      driveFolderId: folderId,
      status: "draft",
      tags: ["자동동기화", "준공사진"],
    });

    const draftId = draft.id;

    let uploadedCount = 0;
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      try {
        const { buffer, mimeType } = await downloadFile(file.id);
        const ext = mimeType.split("/")[1] || "jpg";
        const s3Key = `portfolio/${draftId}/${file.name}-${randomSuffix()}.${ext}`;
        const { url } = await storagePut(s3Key, buffer, mimeType);

        await addDraftImage({
          draftId,
          originalUrl: url,
          filename: file.name,
          driveFileId: file.id,
          sortOrder: i,
          isCover: i === 0 ? "yes" : "no",
        });

        uploadedCount++;
      } catch (err) {
        console.error(`[DriveSyncPipeline] 이미지 업로드 실패: ${file.name}`, err);
        continue;
      }
    }

    await updateSyncLog(syncLog.id, {
      syncStatus: "done",
      fileCount: uploadedCount,
      draftId,
    });

    return { success: true, draftId, imageCount: uploadedCount };
  } catch (err: any) {
    console.error(`[DriveSyncPipeline] 폴더 동기화 실패:`, err);
    return { success: false, imageCount: 0, error: err.message };
  }
}

export async function syncAllProjects(rootFolderId: string) {
  const folders = await findCompletionPhotoFolders(rootFolderId);
  const details: Array<{
    projectName: string;
    status: string;
    draftId?: number;
    imageCount: number;
    error?: string;
  }> = [];

  let synced = 0;
  let skipped = 0;
  let errors = 0;

  for (const folder of folders) {
    const result = await syncFolder({
      folderId: folder.folderId,
      projectName: folder.projectName,
      folderPath: folder.folderPath,
    });

    if (result.success && result.error?.includes("이미 동기화")) {
      skipped++;
      details.push({ projectName: folder.projectName, status: "skipped", draftId: result.draftId, imageCount: result.imageCount, error: result.error });
    } else if (result.success) {
      synced++;
      details.push({ projectName: folder.projectName, status: "synced", draftId: result.draftId, imageCount: result.imageCount });
    } else {
      errors++;
      details.push({ projectName: folder.projectName, status: "error", imageCount: 0, error: result.error });
    }
  }

  return { total: folders.length, synced, skipped, errors, details };
}
