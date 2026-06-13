import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { saveFloatingWidgetsForm } from "@/lib/floating-widgets";
import { appUrl } from "@/lib/redirect";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  await saveFloatingWidgetsForm(await request.formData());
  await writeAuditLog({ action: "save", targetType: "floating-widget", summary: "保存浮窗配置" });
  return NextResponse.redirect(appUrl("/admin/floating-widget?saved=1", request), { status: 303 });
}
