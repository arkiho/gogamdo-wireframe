import { and, eq, inArray, or } from "drizzle-orm";
import { draftImages, insightArticles, portfolioDrafts, styleRecommendations } from "../../drizzle/schema";
import { getClientById, getDb } from "../db";
import { storageKeyFromUrl, type StorageAuthorizationDependencies } from "./storageAuthorization";

export function persistedStorageReferences(key: string): string[] {
  const relative = `/uploads/${key}`;
  return [
    key,
    relative,
    `https://kokamdo.co.kr${relative}`,
    `https://www.kokamdo.co.kr${relative}`,
  ];
}

export async function isPublishedStorageReference(key: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const references = persistedStorageReferences(key);

  const portfolioMatch = await db
    .select({ id: draftImages.id })
    .from(draftImages)
    .innerJoin(portfolioDrafts, eq(draftImages.draftId, portfolioDrafts.id))
    .where(and(
      eq(portfolioDrafts.status, "published"),
      or(
        inArray(draftImages.originalUrl, references),
        inArray(draftImages.beforeUrl, references),
        inArray(draftImages.processedUrl, references),
        inArray(draftImages.watermarkedUrl, references),
        inArray(draftImages.thumbnailUrl, references),
      ),
    ))
    .limit(1);
  if (portfolioMatch.length > 0) return true;

  const insightMatch = await db
    .select({ id: insightArticles.id })
    .from(insightArticles)
    .where(and(
      eq(insightArticles.status, "published"),
      inArray(insightArticles.coverImageUrl, references),
    ))
    .limit(1);
  if (insightMatch.length > 0) return true;

  const publicStyleResult = await db
    .select({ id: styleRecommendations.id })
    .from(styleRecommendations)
    .where(inArray(styleRecommendations.imageUrl, references))
    .limit(1);
  return publicStyleResult.length > 0;
}


export async function isClientAvatar(key: string, clientId: number): Promise<boolean> {
  const client = await getClientById(clientId);
  return Boolean(client && storageKeyFromUrl(client.avatarUrl) === key);
}

export const databaseStorageAuthorization: StorageAuthorizationDependencies = {
  isPublishedReference: isPublishedStorageReference,
  // client_projects.userId belongs to the staff/users identity table. There is
  // no explicit clients_auth ownership relation, so client reads fail closed.
  isClientProjectOwner: async () => false,
  isClientAvatar,
};
