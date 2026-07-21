/**
 * 파일 업로드 헬퍼 — /api/upload (Railway 볼륨 스토리지) base64 JSON 방식.
 * 이미지·PDF·엑셀 등 임의 파일을 올리고 { url } 을 돌려준다.
 */
export async function uploadFile(file: File, prefix = "receipt"): Promise<{ url: string; key?: string }> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("파일 읽기 실패"));
    reader.readAsDataURL(file);
  });

  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: base64,
      filename: `${prefix}-${file.name}`,
      mimeType: file.type || "application/octet-stream",
    }),
  });
  if (!res.ok) throw new Error("업로드 실패");
  return res.json();
}
