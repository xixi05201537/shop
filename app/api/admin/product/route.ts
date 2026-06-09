import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { saveProductForm } from "@/lib/admin-save";
import { appUrl } from "@/lib/redirect";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  await saveProductForm(await request.formData());
  await writeAuditLog({ action: "save", targetType: "product", targetId: "single-product", summary: "保存商品配置" });
  return NextResponse.redirect(appUrl("/admin/product?saved=1", request), { status: 303 });
}
