import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { NextResponse } from "next/server";
import { getUploadDir } from "@/lib/uploads";

const contentTypes: Record<string, string> = {
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  webp: "image/webp",
};

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  const safeName = basename(filename);
  const ext = safeName.split(".").pop()?.toLowerCase() || "";

  if (safeName !== filename || !contentTypes[ext]) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const file = await readFile(join(getUploadDir(), safeName));
    return new NextResponse(file, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentTypes[ext],
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
