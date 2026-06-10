import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { appUrl } from "@/lib/redirect";
import { saveSelectionItemForm } from "@/lib/selection";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const item = await saveSelectionItemForm(formData);
  await writeAuditLog({
    action: formData.get("id") ? "save" : "create",
    targetType: "selection-item",
    targetId: item.id,
    summary: `保存选品项：${item.title}`,
  });

  return NextResponse.redirect(appUrl(`/admin/selection-pages/${item.pageId}/items?saved=1`, request), { status: 303 });
}
