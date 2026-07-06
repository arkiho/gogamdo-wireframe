/**
 * 이미지 파일을 지정된 최대 크기 이하로 압축합니다.
 * Canvas API를 사용하여 해상도와 품질을 단계적으로 줄입니다.
 * 
 * @param file - 원본 이미지 파일
 * @param maxSizeBytes - 최대 허용 크기 (기본값: 10MB)
 * @returns 압축된 File 객체 (이미 maxSizeBytes 이하면 원본 반환)
 */
export async function compressImage(
  file: File,
  maxSizeBytes: number = 10 * 1024 * 1024
): Promise<File> {
  // 이미 크기 제한 이하면 원본 반환
  if (file.size <= maxSizeBytes) {
    return file;
  }

  // 이미지가 아닌 파일은 압축 불가
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 압축할 수 있습니다.");
  }

  const img = await loadImage(file);
  
  // 단계적으로 품질과 해상도를 줄여가며 압축
  let quality = 0.85;
  let scale = 1.0;
  const minQuality = 0.3;
  const minScale = 0.3;

  while (quality >= minQuality || scale >= minScale) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context를 생성할 수 없습니다.");

    const targetWidth = Math.round(img.naturalWidth * scale);
    const targetHeight = Math.round(img.naturalHeight * scale);
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // WebP로 변환 시도 (더 효율적), 실패 시 JPEG
    const outputType = "image/jpeg";
    const blob = await canvasToBlob(canvas, outputType, quality);

    if (blob.size <= maxSizeBytes) {
      // 압축 성공 - 파일명에서 확장자를 변경
      const newName = file.name.replace(/\.[^.]+$/, ".jpg");
      return new File([blob], newName, { type: outputType });
    }

    // 품질을 먼저 줄이고, 품질이 최소치에 도달하면 해상도를 줄임
    if (quality > minQuality) {
      quality -= 0.1;
    } else if (scale > minScale) {
      scale -= 0.1;
      quality = 0.7; // 해상도를 줄일 때 품질을 다시 올림
    } else {
      break;
    }
  }

  // 최종 시도 - 최소 품질 + 최소 해상도
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context를 생성할 수 없습니다.");

  const targetWidth = Math.round(img.naturalWidth * minScale);
  const targetHeight = Math.round(img.naturalHeight * minScale);
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const blob = await canvasToBlob(canvas, "image/jpeg", minQuality);
  const newName = file.name.replace(/\.[^.]+$/, ".jpg");
  return new File([blob], newName, { type: "image/jpeg" });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas를 Blob으로 변환할 수 없습니다."));
      },
      type,
      quality
    );
  });
}
