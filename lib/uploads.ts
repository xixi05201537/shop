import { readdir, stat, unlink } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);

function normalizedUploadDir() {
  return resolve(process.cwd(), "public", "uploads");
}

export function getUploadDir() {
  return normalizedUploadDir();
}

export type UploadedImage = {
  name: string;
  path: string;
  size: number;
  updatedAt: Date;
};

export async function listUploadedImages(limit?: number): Promise<UploadedImage[]> {
  const dir = normalizedUploadDir();

  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const images = await Promise.all(
      entries
        .filter((entry) => entry.isFile())
        .filter((entry) => imageExtensions.has(entry.name.slice(entry.name.lastIndexOf(".")).toLowerCase()))
        .map(async (entry) => {
          const filePath = join(dir, entry.name);
          const fileStat = await stat(filePath);
          return {
            name: entry.name,
            path: `/uploads/${basename(entry.name)}`,
            size: fileStat.size,
            updatedAt: fileStat.mtime,
          };
        }),
    );

    const sorted = images.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
  } catch {
    return [];
  }
}

export async function deleteUploadedImage(publicPath: string) {
  const filename = basename(publicPath || "");
  if (!filename || filename !== publicPath.replace(/^\/?uploads\//, "")) {
    throw new Error("Invalid upload path.");
  }
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  if (!imageExtensions.has(ext)) {
    throw new Error("Unsupported image type.");
  }

  await unlink(join(normalizedUploadDir(), filename));
}
