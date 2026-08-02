export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB
export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export type ImageReadResult = { dataUrl: string; width: number; height: number };

/** Human-readable size for upload feedback. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateImage(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Please upload a PNG, JPG or WEBP image.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `That file is ${formatBytes(file.size)}. Please keep it under ${formatBytes(
      MAX_UPLOAD_BYTES
    )}.`;
  }
  return null;
}

/**
 * Reads an image file and downscales it to a data URL.
 *
 * Screenshots off a modern phone are several megabytes; localStorage caps out around 5 MB,
 * so everything is re-encoded to a bounded JPEG before being persisted.
 */
export function readImageDownscaled(file: File, maxEdge = 1400): Promise<ImageReadResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("That file isn't a readable image."));
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Could not process that image."));

        // White matte so transparent PNGs don't turn black once flattened to JPEG.
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        resolve({ dataUrl: canvas.toDataURL("image/jpeg", 0.82), width, height });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
