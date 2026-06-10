import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/redirect";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const payerId = String(formData.get("payerId") || "").trim();
  const note = String(formData.get("note") || "").trim();
  const returnTo = String(formData.get("returnTo") || "/admin/orders");

  if (!payerId) return NextResponse.redirect(appUrl(`${returnTo}${returnTo.includes("?") ? "&" : "?"}note=1`, request), { status: 303 });

  if (note) {
    await prisma.payerNote.upsert({
      where: { payerId },
      update: { note },
      create: { payerId, note },
    });
  } else {
    await prisma.payerNote.deleteMany({ where: { payerId } });
  }

  await writeAuditLog({
    action: "save_payer_note",
    targetType: "payer",
    targetId: payerId,
    summary: `保存付款人备注：${payerId}`,
  });

  return NextResponse.redirect(appUrl(`${returnTo}${returnTo.includes("?") ? "&" : "?"}note=1`, request), { status: 303 });
}
