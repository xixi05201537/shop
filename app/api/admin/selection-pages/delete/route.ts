import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { appUrl } from "@/lib/redirect";
import { deleteSelectionPage } from "@/lib/selection";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const id = String(formData.get("id") || "");
  const page = await deleteSelectionPage(id);
  if (page) {
    await writeAuditLog({
      action: "delete",
      targetType: "selection-page",
      targetId: id,
      summary: `删除选品单：${page.slug}`,
    });
  }

  return NextResponse.redirect(appUrl("/admin/selection-pages?deleted=1", request), { status: 303 });
}
