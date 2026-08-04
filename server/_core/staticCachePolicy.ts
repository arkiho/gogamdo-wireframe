const ONE_YEAR_SECONDS = 31_536_000;
const ONE_DAY_SECONDS = 86_400;
const ONE_WEEK_SECONDS = 604_800;

export function getStaticAssetCacheControl(filePath: string): string {
  const normalized = filePath.replaceAll("\\", "/");

  if (normalized.includes("/assets/")) {
    return `public, max-age=${ONE_YEAR_SECONDS}, immutable`;
  }

  if (normalized.includes("/images/")) {
    return `public, max-age=${ONE_DAY_SECONDS}, stale-while-revalidate=${ONE_WEEK_SECONDS}`;
  }

  return "public, max-age=0, must-revalidate";
}