import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { appUrl } from "@/lib/redirect";
import { saveSelectionPageForm } from "@/lib/selection";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const isCreate = !formData.get("id");
  const page = await saveSelectionPageForm(formData);
  await writeAuditLog({
    action: formData.get("id") ? "save" : "create",
    targetType: "selection-page",
    targetId: page.id,
    summary: `保存选品单：${page.title}`,
  });

  const nextPath = isCreate
    ? `/admin/selection-pages/${page.id}/items?created=1`
    : `/admin/selection-pages/${page.id}?saved=1`;
  return NextResponse.redirect(appUrl(nextPath, request), { status: 303 });
}
