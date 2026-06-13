import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { saveEmailForm } from "@/lib/admin-save";
import { appUrl } from "@/lib/redirect";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const formData = await request.formData();
  await saveEmailForm(formData);
  const tab = String(formData.get("tab") || "");
  await writeAuditLog({ action: "save", targetType: "email", targetId: tab || null, summary: `保存邮件配置${tab ? `：${tab}` : ""}` });
  const params = new URLSearchParams({ saved: "1" });
  if (["buyer", "seller", "shipment", "selection", "selection-checkout", "payment-request", "payment-request-paid"].includes(tab)) params.set("tab", tab);
  return NextResponse.redirect(appUrl(`/admin/email?${params.toString()}`, request), { status: 303 });
}
