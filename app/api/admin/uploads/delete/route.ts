import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { appUrl } from "@/lib/redirect";
import { deleteUploadedImage } from "@/lib/uploads";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const path = String(formData.get("path") || "");

  try {
    await deleteUploadedImage(path);
    await writeAuditLog({
      action: "delete",
      targetType: "upload",
      targetId: path,
      summary: `删除上传图片：${path}`,
    });
    return NextResponse.redirect(appUrl("/admin/upload?deleted=1", request), { status: 303 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除失败";
    return NextResponse.redirect(appUrl(`/admin/upload?error=${encodeURIComponent(message)}`, request), { status: 303 });
  }
}
