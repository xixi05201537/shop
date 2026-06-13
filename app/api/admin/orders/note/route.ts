import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { appUrl, safeReturnTo } from "@/lib/redirect";

const MAX_NOTE_LENGTH = 4000;

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const id = String(formData.get("id") || "");
  const internalNote = String(formData.get("internalNote") || "").trim().slice(0, MAX_NOTE_LENGTH);
  if (!id) return NextResponse.redirect(appUrl("/admin/orders", request), { status: 303 });

  const order = await prisma.order.update({
    where: { id },
    data: { internalNote: internalNote || null },
  });
  await writeAuditLog({
    action: "save_note",
    targetType: "order",
    targetId: id,
    summary: `保存订单备注：${order.orderNumber}`,
  });

  const returnTo = String(formData.get("returnTo") || `/admin/orders/${id}`);
  const safe = safeReturnTo(returnTo, `/admin/orders/${id}`);
  return NextResponse.redirect(appUrl(`${safe}${safe.includes("?") ? "&" : "?"}note=1`, request), { status: 303 });
}
