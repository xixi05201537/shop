"use client";

const supportedImageTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;

const extensionByMimeType: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function readClipboardImageFile() {
  if (!navigator.clipboard?.read) {
    throw new Error("This browser cannot read images from the clipboard.");
  }

  const items = await navigator.clipboard.read();
  let convertibleBlob: Blob | null = null;

  for (const clipboardItem of items) {
    const supportedType = clipboardItem.types.find((type) => supportedImageTypes.includes(type.toLowerCase() as (typeof supportedImageTypes)[number]));
    if (supportedType) {
      const mimeType = supportedType.toLowerCase();
      const blob = await clipboardItem.getType(supportedType);
      return new File([blob], `clipboard.${extensionByMimeType[mimeType]}`, { type: mimeType });
    }

    const imageType = clipboardItem.types.find((type) => type.toLowerCase().startsWith("image/"));
    if (imageType && !convertibleBlob) {
      convertibleBlob = await clipboardItem.getType(imageType);
    }
  }

  if (!convertibleBlob) {
    throw new Error("No image was found in the clipboard.");
  }

  return convertImageBlobToPngFile(convertibleBlob);
}

async function convertImageBlobToPngFile(blob: Blob) {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    throw new Error("Clipboard image format is not supported. Please copy a PNG, JPEG, WebP, or GIF image.");
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser cannot process the clipboard image.");
    context.drawImage(bitmap, 0, 0);
    const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!pngBlob) throw new Error("Clipboard image conversion failed.");
    return new File([pngBlob], "clipboard.png", { type: "image/png" });
  } finally {
    bitmap.close();
  }
}
