import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

const allowed = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("image");
  if (!(file instanceof File)) return NextResponse.json({ error: "Image is required." }, { status: 400 });
  if (!allowed.has(file.type)) return NextResponse.json({ error: "Unsupported image type." }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Image must be under 5MB." }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() || "png";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const uploadDir = process.env.UPLOAD_DIR || "./public/uploads";
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), bytes);

  const publicPath = `/uploads/${filename}`;
  return new NextResponse(
    `<html><body style="font-family:sans-serif;padding:30px"><h1>Uploaded</h1><p>Path: <code>${publicPath}</code></p><p><a href="/admin/product">Back to product</a></p></body></html>`,
    { headers: { "Content-Type": "text/html" } },
  );
}
