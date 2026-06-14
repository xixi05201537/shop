import { randomBytes } from "node:crypto";

const allowedMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

const extensionByMime: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function detectImageMimeType(bytes: Uint8Array) {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  const header = String.fromCharCode(...bytes.slice(0, 12));
  if (header.startsWith("GIF87a") || header.startsWith("GIF89a")) {
    return "image/gif";
  }
  if (header.startsWith("RIFF") && header.slice(8, 12) === "WEBP") {
    return "image/webp";
  }

  return null;
}

type ImageValidationResult =
  | { ok: true; mimeType: string }
  | { ok: false; error: string };

export function validateImageFile(file: File, bytes?: Uint8Array): ImageValidationResult {
  const detectedMimeType = bytes ? detectImageMimeType(bytes) : null;
  const mimeType = detectedMimeType || file.type;

  if (!allowedMimeTypes.has(mimeType)) {
    return { ok: false, error: "Unsupported image format. Only PNG, JPEG, WebP, GIF are allowed." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "Image size cannot exceed 5MB." };
  }
  return { ok: true, mimeType };
}

export function generateUploadFilename(file: File, mimeType = file.type) {
  const extension = extensionByMime[mimeType] || "png";
  const random = randomBytes(8).toString("hex");
  return `${Date.now()}-${random}.${extension}`;
}
