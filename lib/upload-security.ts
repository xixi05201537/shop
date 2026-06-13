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

export function validateImageFile(file: File) {
  if (!allowedMimeTypes.has(file.type)) {
    return { error: "Unsupported image format. Only PNG, JPEG, WebP, GIF are allowed." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "Image size cannot exceed 5MB." };
  }
  return null;
}

export function generateUploadFilename(file: File) {
  const extension = extensionByMime[file.type] || "png";
  const random = randomBytes(8).toString("hex");
  return `${Date.now()}-${random}.${extension}`;
}
