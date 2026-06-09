import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { saveSettingsForm } from "@/lib/admin-save";
import { appUrl } from "@/lib/redirect";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  await saveSettingsForm(await request.formData());
  await writeAuditLog({ action: "save", targetType: "settings", summary: "保存 PayPal 和结账设置" });
  return NextResponse.redirect(appUrl("/admin/settings?saved=1", request), { status: 303 });
}
