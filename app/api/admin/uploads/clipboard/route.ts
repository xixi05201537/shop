import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { getUploadDir } from "@/lib/uploads";

const allowed = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]);

function extensionFor(file: File) {
  const byName = file.name.split(".").pop()?.toLowerCase();
  if (byName && byName.length <= 5) return byName;
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  if (file.type === "image/svg+xml") return "svg";
  return "png";
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const file = formData.get("image");
  if (!(file instanceof File)) return NextResponse.json({ error: "请先选择图片。" }, { status: 400 });
  if (!allowed.has(file.type)) return NextResponse.json({ error: "不支持这种图片格式。" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "图片大小不能超过 5MB。" }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extensionFor(file)}`;
  const uploadDir = getUploadDir();
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), bytes);

  const publicPath = `/uploads/${filename}`;
  await writeAuditLog({
    action: "upload",
    targetType: "upload",
    targetId: publicPath,
    summary: `剪贴板上传图片：${file.name || filename}`,
    metadata: { publicPath, size: file.size, type: file.type },
  });

  return NextResponse.json({ path: publicPath });
}
