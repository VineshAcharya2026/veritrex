/**
 * Compress / resize an image in the browser so large phone photos upload reliably.
 * GIFs are left untouched (animation). Returns the original file if compression fails
 * or does not shrink the payload.
 */
export async function compressImageForUpload(
  file: File,
  options?: { maxWidth?: number; maxBytes?: number; quality?: number }
): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  const maxWidth = options?.maxWidth ?? 1920;
  const maxBytes = options?.maxBytes ?? 1.5 * 1024 * 1024;
  const quality = options?.quality ?? 0.82;

  if (file.size <= maxBytes) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    let q = quality;
    let blob: Blob | null = null;
    for (let i = 0; i < 6; i++) {
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", q)
      );
      if (!blob) break;
      if (blob.size <= maxBytes || q <= 0.45) break;
      q -= 0.1;
    }

    if (!blob || blob.size >= file.size) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
