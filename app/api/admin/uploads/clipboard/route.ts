import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { generateUploadFilename, validateImageFile } from "@/lib/upload-security";
import { getUploadDir } from "@/lib/uploads";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const file = formData.get("image");
  if (!(file instanceof File)) return NextResponse.json({ error: "请先选择图片。" }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const validation = validateImageFile(file, bytes);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  const filename = generateUploadFilename(file, validation.mimeType);
  const uploadDir = getUploadDir();
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), bytes);

  const publicPath = `/uploads/${filename}`;
  await writeAuditLog({
    action: "upload",
    targetType: "upload",
    targetId: publicPath,
    summary: `剪贴板上传图片：${file.name || filename}`,
    metadata: { publicPath, size: file.size, type: validation.mimeType },
  });

  return NextResponse.json({ path: publicPath });
}
