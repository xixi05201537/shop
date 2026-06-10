import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { appUrl } from "@/lib/redirect";
import { deleteSelectionItem } from "@/lib/selection";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const id = String(formData.get("id") || "");
  const item = await deleteSelectionItem(id);
  if (item) {
    await writeAuditLog({
      action: "delete",
      targetType: "selection-item",
      targetId: id,
      summary: "删除选品项",
    });
    return NextResponse.redirect(appUrl(`/admin/selection-pages/${item.pageId}/items?deleted=1`, request), { status: 303 });
  }

  return NextResponse.redirect(appUrl("/admin/selection-pages?deleted=1", request), { status: 303 });
}
