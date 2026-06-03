import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { getConfigMap } from "@/lib/config";
import { appUrl } from "@/lib/redirect";

const allowed = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const formData = await request.formData();
  const file = formData.get("image");
  if (!(file instanceof File)) return NextResponse.json({ error: "请先选择图片。" }, { status: 400 });
  if (!allowed.has(file.type)) return NextResponse.json({ error: "不支持这种图片格式。" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "图片大小不能超过 5MB。" }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() || "png";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const config = await getConfigMap();
  const configuredDir = config.uploadDir || "./public/uploads";
  if (!["./public/uploads", "public/uploads"].includes(configuredDir)) {
    return NextResponse.redirect(appUrl(`/admin/upload?error=${encodeURIComponent("上传目录必须是 public/uploads。")}`, request), {
      status: 303,
    });
  }
  const uploadDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), bytes);

  const publicPath = `/uploads/${filename}`;
  return NextResponse.redirect(appUrl(`/admin/upload?path=${encodeURIComponent(publicPath)}`, request), { status: 303 });
}
